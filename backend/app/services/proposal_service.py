from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client
from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.models.proposal import Proposal
from app.models.proposal_stage import ProposalStage
from app.schemas.proposal import (
    ProposalConvertRequest,
    ProposalCreate,
    ProposalStageUpdate,
    ProposalUpdate,
)


def _validate_stage(db: Session, stage: str) -> None:
    exists = db.query(ProposalStage.id).filter(ProposalStage.key == stage).first()
    if not exists:
        raise HTTPException(status_code=400, detail=f"Invalid stage: {stage}")


def list_proposals(db: Session, stage: str | None = None) -> list[Proposal]:
    query = db.query(Proposal).options(joinedload(Proposal.client))
    if stage:
        _validate_stage(db, stage)
        query = query.filter(Proposal.stage == stage)
    return query.order_by(Proposal.stage, Proposal.position, Proposal.id).all()


def get_proposal(db: Session, proposal_id: int) -> Proposal:
    proposal = (
        db.query(Proposal)
        .options(joinedload(Proposal.client))
        .filter(Proposal.id == proposal_id)
        .first()
    )
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal


def _next_position(db: Session, stage: str) -> int:
    current = db.query(func.max(Proposal.position)).filter(Proposal.stage == stage).scalar()
    return (current or 0) + 1


def create_proposal(db: Session, data: ProposalCreate) -> Proposal:
    _validate_stage(db, data.stage)
    if data.client_id is not None:
        if not db.query(Client).filter(Client.id == data.client_id).first():
            raise HTTPException(status_code=404, detail="Client not found")
    proposal = Proposal(
        **data.model_dump(),
        position=_next_position(db, data.stage),
    )
    db.add(proposal)
    db.commit()
    return get_proposal(db, proposal.id)


def update_proposal(db: Session, proposal_id: int, data: ProposalUpdate) -> Proposal:
    proposal = get_proposal(db, proposal_id)
    payload = data.model_dump(exclude_unset=True)
    if "client_id" in payload and payload["client_id"] is not None:
        if not db.query(Client).filter(Client.id == payload["client_id"]).first():
            raise HTTPException(status_code=404, detail="Client not found")
    for key, value in payload.items():
        setattr(proposal, key, value)
    db.commit()
    return get_proposal(db, proposal_id)


def update_stage(
    db: Session, proposal_id: int, data: ProposalStageUpdate
) -> Proposal:
    _validate_stage(db, data.stage)
    if data.stage == "won":
        raise HTTPException(
            status_code=409,
            detail="Use POST /proposals/{id}/convert to move a proposal to 'won'.",
        )
    proposal = get_proposal(db, proposal_id)
    proposal.stage = data.stage
    if data.position is not None:
        proposal.position = data.position
    else:
        proposal.position = _next_position(db, data.stage)
    if data.stage == "lost":
        proposal.lost_reason = data.lost_reason
    db.commit()
    return get_proposal(db, proposal_id)


def delete_proposal(db: Session, proposal_id: int) -> None:
    proposal = get_proposal(db, proposal_id)
    db.delete(proposal)
    db.commit()


def convert_to_contract(
    db: Session, proposal_id: int, payload: ProposalConvertRequest
) -> Contract:
    """Atomically resolves/creates Client, creates Contract + ContractRoles, marks proposal as won.

    Note: moving a card OUT of "won" later is allowed via update_stage but does NOT
    delete the linked contract. The contract_id stays for audit trail.
    """
    proposal = get_proposal(db, proposal_id)
    if proposal.contract_id is not None:
        raise HTTPException(status_code=409, detail="Proposal already converted")
    if proposal.expected_start_date is None:
        raise HTTPException(
            status_code=400,
            detail="Preencha a previsão de início da proposta antes de converter.",
        )

    try:
        if proposal.client_id is None:
            if payload.new_client is None:
                raise HTTPException(
                    status_code=400,
                    detail="new_client is required when proposal has no client_id",
                )
            existing = (
                db.query(Client).filter(Client.name == payload.new_client.name).first()
            )
            if existing:
                raise HTTPException(
                    status_code=409,
                    detail=f"Client with name '{payload.new_client.name}' already exists",
                )
            client = Client(**payload.new_client.model_dump())
            db.add(client)
            db.flush()
            client_id = client.id
            proposal.client_id = client_id
        else:
            client_id = proposal.client_id

        contract_data = payload.contract.model_dump(exclude={"roles"})
        contract = Contract(client_id=client_id, **contract_data)
        db.add(contract)
        db.flush()
        for role_data in payload.contract.roles:
            cr = ContractRole(contract_id=contract.id, **role_data.model_dump())
            db.add(cr)

        proposal.stage = "won"
        proposal.contract_id = contract.id
        proposal.position = _next_position(db, "won")

        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    from app.services.contract_service import get_contract

    return get_contract(db, contract.id)
