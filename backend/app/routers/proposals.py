from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.contract import ContractResponse
from app.schemas.proposal import (
    ProposalConvertRequest,
    ProposalCreate,
    ProposalResponse,
    ProposalStageUpdate,
    ProposalUpdate,
)
from app.services import proposal_service

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.get("", response_model=list[ProposalResponse])
def list_proposals(stage: str | None = None, db: Session = Depends(get_db)):
    return proposal_service.list_proposals(db, stage=stage)


@router.post("", response_model=ProposalResponse, status_code=201)
def create_proposal(data: ProposalCreate, db: Session = Depends(get_db)):
    return proposal_service.create_proposal(db, data)


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    return proposal_service.get_proposal(db, proposal_id)


@router.put("/{proposal_id}", response_model=ProposalResponse)
def update_proposal(
    proposal_id: int, data: ProposalUpdate, db: Session = Depends(get_db)
):
    return proposal_service.update_proposal(db, proposal_id, data)


@router.delete("/{proposal_id}", status_code=204)
def delete_proposal(proposal_id: int, db: Session = Depends(get_db)):
    proposal_service.delete_proposal(db, proposal_id)


@router.patch("/{proposal_id}/stage", response_model=ProposalResponse)
def update_stage(
    proposal_id: int, data: ProposalStageUpdate, db: Session = Depends(get_db)
):
    return proposal_service.update_stage(db, proposal_id, data)


@router.post("/{proposal_id}/convert", response_model=ContractResponse, status_code=201)
def convert_proposal(
    proposal_id: int, data: ProposalConvertRequest, db: Session = Depends(get_db)
):
    return proposal_service.convert_to_contract(db, proposal_id, data)
