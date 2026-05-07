"""Seed initial commercial proposals into the kanban.

Idempotent: skips if any proposal already exists.
Tries to associate proposals to existing clients via case-insensitive aliases;
creates new clients only when no match is found.

Run with: uv run python -m app.seed_proposals
"""

from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.client import Client
from app.models.contract import Contract
from app.models.proposal import Proposal


# Each entry is (proposal_title, stage, optional_client_alias_or_None)
PIPELINE = [
    # Novos contatos -> lead
    ("RFP Comgás", "lead", "comgas"),
    ("RFP Energisa", "lead", "energisa"),
    ("Senai", "lead", "senai"),
    ("Witney", "lead", "witney"),
    # Elaboração -> qualification
    ("CNP", "qualification", "cnp"),
    ("HC", "qualification", "hc"),
    ("Eleven Labs | BMG", "qualification", "bmg"),
    ("BI | BMG", "qualification", "bmg"),
    ("Comgás", "qualification", "comgas"),
    ("Vivo (gus)", "qualification", "vivo"),
    ("Claro (gus)", "qualification", "claro"),
    # Enviadas / Negociação -> negotiation
    ("Raumak", "negotiation", "raumak"),
    ("Energisa", "negotiation", "energisa"),
    ("Bracell", "negotiation", "bracell"),
    ("BP - Proposta Predição Hospital", "qualification", "bp"),
    ("BP - Proposta de OCR", "qualification", "bp"),
]

# Won proposals: each becomes Client (existing or new) + minimal Contract
WON = [
    {"title": "Pepsico (endless handover)", "alias": "pepsico", "contract_name": "Pepsico - Endless handover"},
    {"title": "BP (Pré-Aprovada)", "alias": "bp", "contract_name": "BP - Pré-Aprovada"},
    {"title": "Compass | Datalake / Migração (Assinado)", "alias": "compass", "contract_name": "Compass - Datalake / Migração"},
    {"title": "Brava (Assinado)", "alias": "brava", "contract_name": "Brava"},
    {"title": "Swift (Assinatura)", "alias": "swift", "contract_name": "Swift"},
]

# Substring tokens (lowercase) to match against existing client.name (case-insensitive).
# When alias matches multiple existing clients, the first by id wins.
ALIASES: dict[str, list[str]] = {
    "pepsico": ["pepsico"],
    "bp": ["bp"],  # likely no match -> creates new
    "compass": ["compass gas", "compass"],  # prefer "COMPASS GAS E ENERGIA S.A" over "COMGAS - COMPASS"
    "brava": ["brava"],
    "swift": ["swift"],
    "bmg": ["bmg"],
    "cnp": ["cnp"],
    "comgas": ["comgas"],
    "energisa": ["energisa"],
    "senai": ["senai"],
    "witney": ["witney"],
    "raumak": ["raumak"],
    "bracell": ["bracell"],
    "hc": ["hc"],  # very short — likely no match -> creates new
    "vivo": ["vivo"],
    "claro": ["claro"],
}

# Display name to use when no existing client matches and we have to create one.
NEW_CLIENT_NAMES: dict[str, str] = {
    "bp": "BP",
    "brava": "Brava",
    "energisa": "Energisa",
    "senai": "Senai",
    "witney": "Witney",
    "raumak": "Raumak",
    "bracell": "Bracell",
    "hc": "HC",
    "vivo": "Vivo",
    "claro": "Claro",
}


def find_client(db: Session, alias: str) -> Client | None:
    if not alias:
        return None
    tokens = ALIASES.get(alias, [alias])
    for token in tokens:
        match = (
            db.query(Client)
            .filter(func.lower(Client.name).like(f"%{token}%"))
            .order_by(Client.id)
            .first()
        )
        if match:
            return match
    return None


def resolve_or_create_client(
    db: Session,
    alias: str | None,
    fallback_name: str,
    created_log: list[str],
) -> Client | None:
    """Return an existing client by alias, otherwise create one. None if alias is None."""
    if alias is None:
        return None
    existing = find_client(db, alias)
    if existing:
        return existing
    new_name = NEW_CLIENT_NAMES.get(alias, fallback_name)
    client = Client(name=new_name)
    db.add(client)
    db.flush()
    created_log.append(new_name)
    return client


def seed_proposals():
    db = SessionLocal()
    try:
        if db.query(Proposal).count() > 0:
            print("Proposals already seeded. Skipping.")
            return

        created_clients: list[str] = []
        linked_pipeline = 0

        # Pipeline proposals
        for i, (title, stage, alias) in enumerate(PIPELINE, start=1):
            client = resolve_or_create_client(db, alias, fallback_name=title, created_log=created_clients)
            proposal = Proposal(
                title=title,
                stage=stage,
                position=i,
                client_id=client.id if client else None,
            )
            db.add(proposal)
            if client:
                linked_pipeline += 1
        print(f"Created {len(PIPELINE)} pipeline proposals ({linked_pipeline} linked to clients)")

        # Won proposals: ensure client + create contract + link proposal
        today = date.today()
        end = date(today.year + 1, today.month, today.day)
        won_count = 0
        for i, w in enumerate(WON, start=1):
            client = resolve_or_create_client(
                db, w["alias"], fallback_name=w["title"], created_log=created_clients
            )
            assert client is not None  # WON entries always have alias
            contract = Contract(
                client_id=client.id,
                name=w["contract_name"],
                start_date=today,
                end_date=end,
                status="active",
            )
            db.add(contract)
            db.flush()

            proposal = Proposal(
                title=w["title"],
                stage="won",
                position=i,
                client_id=client.id,
                contract_id=contract.id,
            )
            db.add(proposal)
            won_count += 1
        print(f"Created {won_count} won proposals (each with a contract)")

        if created_clients:
            print(f"Created {len(created_clients)} new clients: {', '.join(created_clients)}")
        else:
            print("All proposals matched existing clients.")

        db.commit()
        print("Proposals seed completed.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding proposals: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_proposals()
