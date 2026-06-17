from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.farol import (
    FarolBoardResponse,
    FarolCellUpdate,
    FarolClientSummaryResponse,
    FarolCriterionCreate,
    FarolCriterionReorderRequest,
    FarolCriterionResponse,
    FarolCriterionUpdate,
    FarolGroupCreate,
    FarolGroupReorderRequest,
    FarolGroupResponse,
    FarolGroupUpdate,
    FarolHistoryEntry,
    FarolTrendResponse,
)
from app.services import farol_service

router = APIRouter(prefix="/farol", tags=["farol"])


@router.get("/board", response_model=FarolBoardResponse)
def get_board(
    week: date | None = Query(default=None),
    scope: str = Query(
        default="client", pattern="^(client|project|hierarchical)$"
    ),
    db: Session = Depends(get_db),
):
    return farol_service.get_board(db, week, scope)


@router.get(
    "/client-summary/{client_id}",
    response_model=FarolClientSummaryResponse,
)
def get_client_summary(
    client_id: int,
    week: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return farol_service.get_client_summary(db, client_id, week)


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


@router.put("/criteria/{criterion_id}/values/client/{client_id}")
def set_cell_client(
    criterion_id: int,
    client_id: int,
    data: FarolCellUpdate,
    week: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    value = farol_service.set_cell(
        db, criterion_id, data, client_id=client_id, week=week
    )
    return _serialize_value(value)


@router.put("/criteria/{criterion_id}/values/project/{project_id}")
def set_cell_project(
    criterion_id: int,
    project_id: int,
    data: FarolCellUpdate,
    week: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    value = farol_service.set_cell(
        db, criterion_id, data, project_id=project_id, week=week
    )
    return _serialize_value(value)


# Backwards-compat: rota antiga aponta para client.
@router.put("/criteria/{criterion_id}/values/{client_id}")
def set_cell_legacy(
    criterion_id: int,
    client_id: int,
    data: FarolCellUpdate,
    week: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    value = farol_service.set_cell(
        db, criterion_id, data, client_id=client_id, week=week
    )
    return _serialize_value(value)


def _serialize_value(value):
    return {
        "id": value.id,
        "criterion_id": value.criterion_id,
        "client_id": value.client_id,
        "project_id": value.project_id,
        "week_start": value.week_start,
        "color": value.color,
        "text_value": value.text_value,
        "notes": value.notes,
    }


@router.get(
    "/criteria/{criterion_id}/history",
    response_model=list[FarolHistoryEntry],
)
def get_cell_history(
    criterion_id: int,
    scope: str = Query(default="client", pattern="^(client|project)$"),
    column_id: int = Query(..., alias="column_id"),
    weeks: int = Query(default=12, ge=1, le=104),
    db: Session = Depends(get_db),
):
    return farol_service.get_cell_history(
        db, criterion_id, scope, column_id, weeks
    )


@router.get("/trend", response_model=FarolTrendResponse)
def get_trend(
    weeks: int = Query(default=12, ge=1, le=104),
    scope: str = Query(default="client", pattern="^(client|project)$"),
    db: Session = Depends(get_db),
):
    return farol_service.get_trend(db, weeks, scope)


# ---------------- Groups ----------------


@router.get("/groups", response_model=list[FarolGroupResponse])
def list_groups(db: Session = Depends(get_db)):
    return farol_service.list_groups(db)


@router.post("/groups", response_model=FarolGroupResponse, status_code=201)
def create_group(data: FarolGroupCreate, db: Session = Depends(get_db)):
    return farol_service.create_group(db, data)


@router.put("/groups/{group_id}", response_model=FarolGroupResponse)
def update_group(
    group_id: int, data: FarolGroupUpdate, db: Session = Depends(get_db)
):
    return farol_service.update_group(db, group_id, data)


@router.delete("/groups/{group_id}", status_code=204)
def delete_group(group_id: int, db: Session = Depends(get_db)):
    farol_service.delete_group(db, group_id)


@router.post("/groups/reorder", response_model=list[FarolGroupResponse])
def reorder_groups(
    payload: FarolGroupReorderRequest, db: Session = Depends(get_db)
):
    return farol_service.reorder_groups(db, payload)
