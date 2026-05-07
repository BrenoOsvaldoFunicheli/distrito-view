"""Seed new contracts into existing database."""

from datetime import date

from app.database import SessionLocal
from app.models.client import Client
from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.models.role import Role


NEW_CONTRACTS = [
    {
        "client": "ICL",
        "sector": None,
        "name": "ICL - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 4,
        "start_date": date(2026, 3, 1),
        "end_date": date(2026, 6, 30),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro Dados": 1},
    },
    {
        "client": "COMPASS GAS E ENERGIA S.A",
        "sector": "Industria",
        "name": "COMPASS - AI Factory (Mar)",
        "plan_type": "AI Factory",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 3,
        "start_date": date(2026, 3, 1),
        "end_date": date(2026, 5, 31),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro Dados": 1, "PM/PO": 1},
    },
    {
        "client": "LAUREATE",
        "sector": None,
        "name": "LAUREATE - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 6,
        "start_date": date(2026, 3, 1),
        "end_date": date(2026, 8, 31),
        "payment_method": "Mensal",
        "notes": "Duração a confirmar",
        "roles": {"Engenheiro IA": 1, "PM/PO": 1, "Engenheiro Dados": 1},
    },
    {
        "client": "CASAS BAHIA",
        "sector": "Comercio e Varejo",
        "name": "CASAS BAHIA - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 8,
        "start_date": date(2026, 4, 1),
        "end_date": date(2026, 11, 30),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro Dados": 1, "Engenheiro IA": 1},
    },
    {
        "client": "IGUATEMI",
        "sector": "Comercio e Varejo",
        "name": "IGUATEMI - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 8,
        "start_date": date(2026, 4, 1),
        "end_date": date(2026, 11, 30),
        "payment_method": "Mensal",
        "notes": "Duração a confirmar",
        "roles": {"Engenheiro Dados": 1, "Engenheiro IA": 1},
    },
    # === PIPELINE ===
    {
        "client": "BENEFICIENCIA PORTUGUESA",
        "sector": "Saude",
        "name": "BP - AI Factory (Pipeline)",
        "plan_type": "AI Factory",
        "status": "pipeline",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 3,
        "start_date": date(2026, 4, 1),
        "end_date": date(2026, 6, 30),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "PM/PO": 0.5},
    },
    {
        "client": "AUTOMOB",
        "sector": None,
        "name": "AUTOMOB - AI Factory (Pipeline)",
        "plan_type": "AI Factory",
        "status": "pipeline",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 3,
        "start_date": date(2026, 4, 1),
        "end_date": date(2026, 6, 30),
        "payment_method": "Mensal",
        "notes": "Duração a confirmar",
        "roles": {"Engenheiro IA": 1},
    },
]


def seed_new_contracts():
    db = SessionLocal()

    try:
        # Build role map
        roles = db.query(Role).all()
        role_map = {r.name: r.id for r in roles}

        # Build client map
        clients = db.query(Client).all()
        client_map = {c.name: c.id for c in clients}

        contract_count = 0
        role_count = 0

        for c in NEW_CONTRACTS:
            # Check if contract already exists
            existing = db.query(Contract).filter(Contract.name == c["name"]).first()
            if existing:
                print(f"  Skipping '{c['name']}' - already exists")
                continue

            # Create client if needed
            client_name = c["client"]
            if client_name not in client_map:
                client = Client(name=client_name, sector=c["sector"])
                db.add(client)
                db.flush()
                client_map[client_name] = client.id
                print(f"  Created client: {client_name}")

            # Create contract
            contract = Contract(
                client_id=client_map[client_name],
                name=c["name"],
                start_date=c["start_date"],
                end_date=c["end_date"],
                status=c.get("status", "active"),
                plan_type=c["plan_type"],
                mrr=c["mrr"],
                total_value=c["total_value"],
                duration_months=c["duration_months"],
                payment_method=c["payment_method"],
                notes=c["notes"],
            )
            db.add(contract)
            db.flush()
            contract_count += 1

            # Create ContractRoles
            for role_name, value in c.get("roles", {}).items():
                if not value or value <= 0:
                    continue
                if value == 0.5:
                    quantity, alloc_pct = 1, 50
                elif value == int(value):
                    quantity, alloc_pct = int(value), 100
                else:
                    quantity, alloc_pct = int(value) + 1, 100
                cr = ContractRole(
                    contract_id=contract.id,
                    role_id=role_map[role_name],
                    allocation_percentage=alloc_pct,
                    quantity=quantity,
                )
                db.add(cr)
                role_count += 1

            print(f"  Created contract: {c['name']}")

        db.commit()
        print(f"\nDone! Created {contract_count} contracts, {role_count} contract roles")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_new_contracts()
