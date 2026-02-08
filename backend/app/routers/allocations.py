from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.allocation import AllocationCreate, AllocationResponse, AllocationUpdate
from app.services import allocation_service

router = APIRouter(prefix="/allocations", tags=["allocations"])


@router.get("", response_model=list[AllocationResponse])
def list_allocations(
    person_id: int | None = None,
    contract_id: int | None = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
):
    allocs = allocation_service.list_allocations(
        db, person_id=person_id, contract_id=contract_id, active_only=active_only
    )
    return [allocation_service._build_response_dict(a) for a in allocs]


@router.post("", response_model=AllocationResponse, status_code=201)
def create_allocation(data: AllocationCreate, db: Session = Depends(get_db)):
    return allocation_service.create_allocation(db, data)


@router.get("/{allocation_id}", response_model=AllocationResponse)
def get_allocation(allocation_id: int, db: Session = Depends(get_db)):
    alloc = allocation_service.get_allocation(db, allocation_id)
    return allocation_service._build_response_dict(alloc)


@router.put("/{allocation_id}", response_model=AllocationResponse)
def update_allocation(
    allocation_id: int, data: AllocationUpdate, db: Session = Depends(get_db)
):
    return allocation_service.update_allocation(db, allocation_id, data)


@router.delete("/{allocation_id}", status_code=204)
def delete_allocation(allocation_id: int, db: Session = Depends(get_db)):
    allocation_service.delete_allocation(db, allocation_id)
