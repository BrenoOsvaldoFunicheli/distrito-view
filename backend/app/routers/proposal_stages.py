from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.proposal_stage import (
    ProposalStageCreate,
    ProposalStageReorderRequest,
    ProposalStageResponse,
    ProposalStageUpdate,
)
from app.services import proposal_stage_service

router = APIRouter(prefix="/proposal-stages", tags=["proposal-stages"])


@router.get("", response_model=list[ProposalStageResponse])
def list_stages(db: Session = Depends(get_db)):
    return proposal_stage_service.list_stages(db)


@router.post("", response_model=ProposalStageResponse, status_code=201)
def create_stage(data: ProposalStageCreate, db: Session = Depends(get_db)):
    return proposal_stage_service.create_stage(db, data)


@router.put("/{stage_id}", response_model=ProposalStageResponse)
def update_stage(stage_id: int, data: ProposalStageUpdate, db: Session = Depends(get_db)):
    return proposal_stage_service.update_stage(db, stage_id, data)


@router.delete("/{stage_id}", status_code=204)
def delete_stage(stage_id: int, db: Session = Depends(get_db)):
    proposal_stage_service.delete_stage(db, stage_id)


@router.post("/reorder", response_model=list[ProposalStageResponse])
def reorder_stages(payload: ProposalStageReorderRequest, db: Session = Depends(get_db)):
    return proposal_stage_service.reorder_stages(db, payload)
