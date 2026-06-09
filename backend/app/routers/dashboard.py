from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/unallocated")
def get_unallocated(
    days_ahead: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    return {"data": dashboard_service.get_unallocated_soon(db, days_ahead)}


@router.get("/upcoming-needs")
def get_upcoming_needs(
    days_ahead: int = Query(default=60, ge=1, le=365),
    db: Session = Depends(get_db),
):
    return {"data": dashboard_service.get_upcoming_needs(db, days_ahead)}


@router.get("/open-slots")
def get_open_slots(
    days_ahead: int = Query(default=60, ge=1, le=365),
    db: Session = Depends(get_db),
):
    return {"data": dashboard_service.get_open_slots(db, days_ahead)}


@router.get("/allocation-summary")
def get_allocation_summary(
    from_date: date = Query(default=None),
    to_date: date = Query(default=None),
    db: Session = Depends(get_db),
):
    today = date.today()
    if not from_date:
        from_date = today - timedelta(days=30)
    if not to_date:
        to_date = today + timedelta(days=90)
    return {"data": dashboard_service.get_allocation_summary(db, from_date, to_date)}


@router.get("/timeline")
def get_timeline(
    from_date: date = Query(default=None),
    to_date: date = Query(default=None),
    db: Session = Depends(get_db),
):
    today = date.today()
    if not from_date:
        from_date = today - timedelta(days=30)
    if not to_date:
        to_date = today + timedelta(days=180)
    data = dashboard_service.get_timeline_data(db, from_date, to_date)
    return {
        "data": {
            "people": data,
            "range": {"from": from_date.isoformat(), "to": to_date.isoformat()},
        }
    }


@router.get("/capacity-planning")
def get_capacity_planning(
    year: int = Query(..., ge=2024, le=2030),
    month: int = Query(..., ge=1, le=12),
    company: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return {"data": dashboard_service.get_capacity_planning(db, year, month, company)}


@router.get("/utilization")
def get_utilization(
    from_date: date = Query(default=None),
    to_date: date = Query(default=None),
    db: Session = Depends(get_db),
):
    today = date.today()
    if not from_date:
        from_date = today - timedelta(days=30)
    if not to_date:
        to_date = today + timedelta(days=90)
    return {"data": dashboard_service.get_utilization_stats(db, from_date, to_date)}
