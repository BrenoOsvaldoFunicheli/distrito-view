from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.farol import (
    FarolBoardResponse,
    FarolCellUpdate,
    FarolCriterionCreate,
    FarolCriterionReorderRequest,
    FarolCriterionResponse,
    FarolCriterionUpdate,
)
from app.services import farol_service

router = APIRouter(prefix="/farol", tags=["farol"])


@router.get("/board", response_model=FarolBoardResponse)
def get_board(db: Session = Depends(get_db)):
    return farol_service.get_board(db)


@router.get("/criteria", response_model=list[FarolCriterionResponse])
def list_criteria(db: Session = Depends(get_db)):
    return farol_service.list_criteria(db)


@router.post("/criteria", response_model=FarolCriterionResponse, status_code=201)
def create_criterion(data: FarolCriterionCreate, db: Session = Depends(get_db)):
    return farol_service.create_criterion(db, data)


@router.put("/criteria/{criterion_id}", response_model=FarolCriterionResponse)
def update_criterion(
    criterion_id: int, data: FarolCriterionUpdate, db: Session = Depends(get_db)
):
    return farol_service.update_criterion(db, criterion_id, data)


@router.delete("/criteria/{criterion_id}", status_code=204)
def delete_criterion(criterion_id: int, db: Session = Depends(get_db)):
    farol_service.delete_criterion(db, criterion_id)


@router.post(
    "/criteria/reorder", response_model=list[FarolCriterionResponse]
)
def reorder_criteria(
    payload: FarolCriterionReorderRequest, db: Session = Depends(get_db)
):
    return farol_service.reorder_criteria(db, payload)


@router.put("/criteria/{criterion_id}/values/{client_id}")
def set_cell(
    criterion_id: int,
    client_id: int,
    data: FarolCellUpdate,
    db: Session = Depends(get_db),
):
    value = farol_service.set_cell(db, criterion_id, client_id, data)
    return {
        "id": value.id,
        "criterion_id": value.criterion_id,
        "client_id": value.client_id,
        "color": value.color,
        "text_value": value.text_value,
        "notes": value.notes,
    }
