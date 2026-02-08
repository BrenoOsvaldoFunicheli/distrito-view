from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.allocation import Allocation
from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.models.person import Person
from app.models.person_role import PersonRole
from app.models.role import Role


def get_unallocated_soon(db: Session, days_ahead: int = 30) -> list[dict]:
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)

    people = (
        db.query(Person)
        .options(
            joinedload(Person.person_roles).joinedload(PersonRole.role),
            joinedload(Person.allocations),
        )
        .filter(Person.is_active == True)  # noqa: E712
        .all()
    )

    results = []
    for person in people:
        active_allocs = [
            a for a in person.allocations if a.start_date <= today and a.end_date > today
        ]
        current_pct = sum(a.allocation_percentage for a in active_allocs)

        latest_end = max((a.end_date for a in active_allocs), default=None)

        if latest_end is None:
            results.append({
                "person_id": person.id,
                "person_name": person.name,
                "person_email": person.email,
                "roles": [pr.role.name for pr in person.person_roles],
                "current_allocation_ends": None,
                "current_percentage": 0,
                "days_until_unallocated": None,
            })
            continue

        if latest_end > cutoff:
            continue

        future_allocs = [a for a in person.allocations if a.start_date > latest_end]
        if future_allocs:
            continue

        days_until = (latest_end - today).days
        results.append({
            "person_id": person.id,
            "person_name": person.name,
            "person_email": person.email,
            "roles": [pr.role.name for pr in person.person_roles],
            "current_allocation_ends": latest_end,
            "current_percentage": current_pct,
            "days_until_unallocated": days_until,
        })

    results.sort(key=lambda x: x["days_until_unallocated"] if x["days_until_unallocated"] is not None else -1)
    return results


def get_upcoming_needs(db: Session, days_ahead: int = 60) -> list[dict]:
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)

    contract_roles = (
        db.query(ContractRole)
        .options(
            joinedload(ContractRole.contract).joinedload(Contract.client),
            joinedload(ContractRole.role),
            joinedload(ContractRole.allocations),
        )
        .join(ContractRole.contract)
        .filter(
            Contract.status.in_(["active", "draft"]),
            Contract.end_date > today,
        )
        .all()
    )

    results = []
    for cr in contract_roles:
        active_allocs = [
            a for a in cr.allocations
            if a.start_date < cr.contract.end_date and a.end_date > today
        ]
        filled = len(active_allocs)
        if filled >= cr.quantity:
            continue

        days_until = max(0, (cr.contract.start_date - today).days)
        results.append({
            "contract_id": cr.contract.id,
            "contract_name": cr.contract.name,
            "client_name": cr.contract.client.name,
            "start_date": cr.contract.start_date,
            "end_date": cr.contract.end_date,
            "role_name": cr.role.name,
            "contract_role_id": cr.id,
            "needed_quantity": cr.quantity,
            "filled_quantity": filled,
            "allocation_percentage": cr.allocation_percentage,
            "days_until_start": days_until,
        })

    results.sort(key=lambda x: x["days_until_start"])
    return results


def get_allocation_summary(db: Session, from_date: date, to_date: date) -> list[dict]:
    today = date.today()
    people = (
        db.query(Person)
        .options(
            joinedload(Person.person_roles).joinedload(PersonRole.role),
            joinedload(Person.allocations)
            .joinedload(Allocation.contract_role)
            .joinedload(ContractRole.contract)
            .joinedload(Contract.client),
            joinedload(Person.allocations)
            .joinedload(Allocation.contract_role)
            .joinedload(ContractRole.role),
        )
        .filter(Person.is_active == True)  # noqa: E712
        .order_by(Person.name)
        .all()
    )

    results = []
    for person in people:
        active_allocs = [
            a for a in person.allocations
            if a.start_date <= today and a.end_date > today
        ]
        current_pct = sum(a.allocation_percentage for a in active_allocs)

        alloc_list = []
        for a in person.allocations:
            if a.start_date < to_date and a.end_date > from_date:
                alloc_list.append({
                    "allocation_id": a.id,
                    "contract_name": a.contract_role.contract.name,
                    "client_name": a.contract_role.contract.client.name,
                    "role_name": a.contract_role.role.name,
                    "percentage": a.allocation_percentage,
                    "start_date": a.start_date.isoformat(),
                    "end_date": a.end_date.isoformat(),
                })

        results.append({
            "person_id": person.id,
            "person_name": person.name,
            "person_email": person.email,
            "person_company": person.company,
            "roles": [pr.role.name for pr in person.person_roles],
            "current_allocation_percentage": current_pct,
            "allocations": alloc_list,
        })

    return results


def get_timeline_data(db: Session, from_date: date, to_date: date) -> list[dict]:
    people = (
        db.query(Person)
        .options(
            joinedload(Person.allocations)
            .joinedload(Allocation.contract_role)
            .joinedload(ContractRole.contract)
            .joinedload(Contract.client),
            joinedload(Person.allocations)
            .joinedload(Allocation.contract_role)
            .joinedload(ContractRole.role),
        )
        .filter(Person.is_active == True)  # noqa: E712
        .order_by(Person.name)
        .all()
    )

    results = []
    for person in people:
        allocs = []
        for a in person.allocations:
            if a.start_date < to_date and a.end_date > from_date:
                allocs.append({
                    "allocation_id": a.id,
                    "contract_name": a.contract_role.contract.name,
                    "client_name": a.contract_role.contract.client.name,
                    "role_name": a.contract_role.role.name,
                    "percentage": a.allocation_percentage,
                    "start_date": a.start_date.isoformat(),
                    "end_date": a.end_date.isoformat(),
                })
        results.append({
            "person_id": person.id,
            "person_name": person.name,
            "person_company": person.company,
            "allocations": allocs,
        })

    return results


def get_utilization_stats(db: Session, from_date: date, to_date: date) -> dict:
    today = date.today()
    people = (
        db.query(Person)
        .options(joinedload(Person.allocations))
        .filter(Person.is_active == True)  # noqa: E712
        .all()
    )

    total = len(people)
    fully = 0
    partial = 0
    bench = 0
    total_pct = 0

    for person in people:
        active_allocs = [
            a for a in person.allocations
            if a.start_date <= today and a.end_date > today
        ]
        pct = sum(a.allocation_percentage for a in active_allocs)
        total_pct += pct

        if pct >= 100:
            fully += 1
        elif pct > 0:
            partial += 1
        else:
            bench += 1

    return {
        "total_people": total,
        "fully_allocated": fully,
        "partially_allocated": partial,
        "on_bench": bench,
        "average_utilization": round(total_pct / total, 1) if total > 0 else 0,
    }
