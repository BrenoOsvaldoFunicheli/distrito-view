from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.allocation import Allocation
from app.models.contract_role import ContractRole
from app.schemas.allocation import AllocationCreate, AllocationUpdate


def validate_person_capacity(
    db: Session,
    person_id: int,
    proposed_start: date,
    proposed_end: date,
    proposed_percentage: int,
    exclude_allocation_id: int | None = None,
) -> list[str]:
    query = db.query(Allocation).filter(
        Allocation.person_id == person_id,
        Allocation.start_date < proposed_end,
        Allocation.end_date > proposed_start,
    )
    if exclude_allocation_id:
        query = query.filter(Allocation.id != exclude_allocation_id)
    existing = query.all()

    if not existing:
        if proposed_percentage > 100:
            return [f"Allocation percentage {proposed_percentage}% exceeds 100%"]
        return []

    critical_dates = {proposed_start, proposed_end}
    for alloc in existing:
        if alloc.start_date >= proposed_start:
            critical_dates.add(alloc.start_date)
        if alloc.end_date <= proposed_end:
            critical_dates.add(alloc.end_date)

    errors = []
    for check_date in sorted(critical_dates):
        if check_date < proposed_start or check_date >= proposed_end:
            continue
        total = proposed_percentage
        for alloc in existing:
            if alloc.start_date <= check_date < alloc.end_date:
                total += alloc.allocation_percentage
        if total > 100:
            errors.append(
                f"Over-allocated on {check_date}: {total}% (max 100%)"
            )

    return errors


def list_allocations(
    db: Session,
    person_id: int | None = None,
    contract_id: int | None = None,
    active_only: bool = False,
) -> list[Allocation]:
    query = db.query(Allocation).options(
        joinedload(Allocation.person),
        joinedload(Allocation.contract_role).joinedload(ContractRole.contract),
        joinedload(Allocation.contract_role).joinedload(ContractRole.role),
    )
    if person_id:
        query = query.filter(Allocation.person_id == person_id)
    if contract_id:
        query = query.join(Allocation.contract_role).filter(
            ContractRole.contract_id == contract_id
        )
    if active_only:
        today = date.today()
        query = query.filter(
            Allocation.start_date <= today, Allocation.end_date > today
        )
    return query.order_by(Allocation.start_date).all()


def get_allocation(db: Session, allocation_id: int) -> Allocation:
    alloc = (
        db.query(Allocation)
        .options(
            joinedload(Allocation.person),
            joinedload(Allocation.contract_role).joinedload(ContractRole.contract),
            joinedload(Allocation.contract_role).joinedload(ContractRole.role),
        )
        .filter(Allocation.id == allocation_id)
        .first()
    )
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return alloc


def _build_response_dict(alloc: Allocation) -> dict:
    return {
        "id": alloc.id,
        "person_id": alloc.person_id,
        "person_name": alloc.person.name,
        "contract_role_id": alloc.contract_role_id,
        "contract_name": alloc.contract_role.contract.name,
        "client_name": alloc.contract_role.contract.client.name,
        "role_name": alloc.contract_role.role.name,
        "allocation_percentage": alloc.allocation_percentage,
        "start_date": alloc.start_date,
        "end_date": alloc.end_date,
        "notes": alloc.notes,
        "created_at": alloc.created_at,
        "updated_at": alloc.updated_at,
    }


def create_allocation(db: Session, data: AllocationCreate) -> dict:
    errors = validate_person_capacity(
        db, data.person_id, data.start_date, data.end_date, data.allocation_percentage
    )
    if errors:
        raise HTTPException(status_code=422, detail={"errors": errors})

    alloc = Allocation(**data.model_dump())
    db.add(alloc)
    db.commit()
    alloc = get_allocation(db, alloc.id)
    return _build_response_dict(alloc)


def update_allocation(db: Session, allocation_id: int, data: AllocationUpdate) -> dict:
    alloc = get_allocation(db, allocation_id)
    update_data = data.model_dump(exclude_unset=True)

    new_start = update_data.get("start_date", alloc.start_date)
    new_end = update_data.get("end_date", alloc.end_date)
    new_pct = update_data.get("allocation_percentage", alloc.allocation_percentage)

    errors = validate_person_capacity(
        db, alloc.person_id, new_start, new_end, new_pct, exclude_allocation_id=allocation_id
    )
    if errors:
        raise HTTPException(status_code=422, detail={"errors": errors})

    for key, value in update_data.items():
        setattr(alloc, key, value)
    db.commit()
    alloc = get_allocation(db, allocation_id)
    return _build_response_dict(alloc)


def delete_allocation(db: Session, allocation_id: int) -> None:
    alloc = get_allocation(db, allocation_id)
    db.delete(alloc)
    db.commit()
