from calendar import monthrange
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.allocation import Allocation
from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.models.person import Person
from app.models.person_role import PersonRole
from app.models.role import Role


def _role_window(cr: ContractRole) -> tuple[date, date]:
    """Janela efetiva da vaga: usa as datas próprias se houver, senão as do contrato."""
    start = cr.start_date or cr.contract.start_date
    end = cr.end_date or cr.contract.end_date
    return start, end


def get_unallocated_soon(db: Session, days_ahead: int = 30) -> list[dict]:
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)

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
        .all()
    )

    def _next_alloc_fields(person: Person) -> dict:
        future = [a for a in person.allocations if a.start_date > today]
        if not future:
            return {
                "next_allocation_start": None,
                "next_allocation_contract_name": None,
                "next_allocation_client_name": None,
                "next_allocation_role_name": None,
            }
        next_a = min(future, key=lambda a: a.start_date)
        return {
            "next_allocation_start": next_a.start_date,
            "next_allocation_contract_name": next_a.contract_role.contract.name,
            "next_allocation_client_name": next_a.contract_role.contract.client.name,
            "next_allocation_role_name": next_a.contract_role.role.name,
        }

    results = []
    for person in people:
        active_allocs = [
            a for a in person.allocations if a.start_date <= today and a.end_date > today
        ]
        current_pct = sum(a.allocation_percentage for a in active_allocs)

        latest_end = max((a.end_date for a in active_allocs), default=None)
        next_fields = _next_alloc_fields(person)

        if latest_end is None:
            results.append({
                "person_id": person.id,
                "person_name": person.name,
                "person_email": person.email,
                "roles": [pr.role.name for pr in person.person_roles],
                "current_allocation_ends": None,
                "current_percentage": 0,
                "days_until_unallocated": None,
                **next_fields,
            })
            continue

        if latest_end > cutoff:
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
            **next_fields,
        })

    def _sort_key(p: dict) -> tuple[int, int]:
        # 0 = bench sem perspectiva (vai pro topo); 1 = com próxima alocação; 2 = ainda alocado
        if p["days_until_unallocated"] is None:
            group = 0 if not p.get("next_allocation_start") else 1
            return (group, 0)
        return (2, p["days_until_unallocated"])

    results.sort(key=_sort_key)
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
            Contract.status.in_(["active", "draft", "pipeline"]),
            Contract.end_date > today,
        )
        .all()
    )

    results = []
    for cr in contract_roles:
        role_start, role_end = _role_window(cr)
        if role_end <= today:
            continue
        active_allocs = [
            a for a in cr.allocations
            if a.start_date < role_end and a.end_date > today
        ]
        filled = len(active_allocs)
        is_future_contract = cr.contract.start_date > today
        # Vagas totalmente preenchidas só aparecem se o contrato for futuro
        if filled >= cr.quantity and not is_future_contract:
            continue

        days_until = (role_start - today).days
        results.append({
            "contract_id": cr.contract.id,
            "contract_name": cr.contract.name,
            "client_name": cr.contract.client.name,
            "start_date": role_start,
            "end_date": role_end,
            "role_name": cr.role.name,
            "contract_role_id": cr.id,
            "needed_quantity": cr.quantity,
            "filled_quantity": filled,
            "allocation_percentage": cr.allocation_percentage,
            "days_until_start": days_until,
            "is_future_contract": is_future_contract,
        })

    def _need_sort_key(n: dict) -> tuple[int, int, int]:
        # Bucket: 0 = contratos já em curso (atrasados/hoje/abertos); 1 = contratos futuros
        bucket = 1 if n["is_future_contract"] else 0
        d = n["days_until_start"]
        if d < 0:
            return (bucket, 0, d)
        if d == 0:
            return (bucket, 1, 0)
        return (bucket, 2, d)

    results.sort(key=_need_sort_key)
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
    provisioned = 0
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
            has_future = any(a.start_date > today for a in person.allocations)
            if has_future:
                provisioned += 1
            else:
                bench += 1

    return {
        "total_people": total,
        "fully_allocated": fully,
        "partially_allocated": partial,
        "on_bench": bench,
        "provisioned": provisioned,
        "average_utilization": round(total_pct / total, 1) if total > 0 else 0,
    }


ROLE_ORDER = [
    "Engenheiro IA", "Engenheiro Dados", "Desenvolvedor",
    "Engenheiro de ML", "PM/PO",
]


def get_capacity_planning(db: Session, year: int, month: int, company: str | None = None) -> dict:
    month_start = date(year, month, 1)
    _, last_day = monthrange(year, month)
    month_end = date(year, month, last_day)

    # --- DEMAND: contract_roles from contracts overlapping this month ---
    contract_roles = (
        db.query(ContractRole)
        .options(
            joinedload(ContractRole.contract).joinedload(Contract.client),
            joinedload(ContractRole.role),
            joinedload(ContractRole.allocations),
        )
        .join(ContractRole.contract)
        .filter(
            Contract.status == "active",
            Contract.start_date <= month_end,
            Contract.end_date >= month_start,
        )
        .all()
    )

    demand_by_role: dict[int, dict] = {}
    for cr in contract_roles:
        role_start, role_end = _role_window(cr)
        if role_start > month_end or role_end < month_start:
            continue
        rid = cr.role_id
        filled = sum(
            1 for a in cr.allocations
            if a.start_date <= month_end and a.end_date >= month_start
        )
        unfilled = max(0, cr.quantity - filled)
        fte = cr.quantity * cr.allocation_percentage / 100
        unfilled_fte = unfilled * cr.allocation_percentage / 100

        if rid not in demand_by_role:
            demand_by_role[rid] = {
                "role_id": rid,
                "role_name": cr.role.name,
                "demand_slots": 0,
                "unfilled_slots": 0,
                "demand_details": [],
            }
        demand_by_role[rid]["demand_slots"] += fte
        demand_by_role[rid]["unfilled_slots"] += unfilled_fte
        demand_by_role[rid]["demand_details"].append({
            "contract_id": cr.contract.id,
            "contract_name": cr.contract.name,
            "client_name": cr.contract.client.name,
            "quantity": cr.quantity,
            "fte": fte,
            "allocation_percentage": cr.allocation_percentage,
            "filled": filled,
            "unfilled": unfilled,
            "contract_start": role_start.isoformat(),
            "contract_end": role_end.isoformat(),
            "contract_status": cr.contract.status,
        })

    # --- SUPPLY: people grouped by primary role ---
    people_query = (
        db.query(Person)
        .options(
            joinedload(Person.person_roles).joinedload(PersonRole.role),
            joinedload(Person.allocations)
            .joinedload(Allocation.contract_role)
            .joinedload(ContractRole.contract)
            .joinedload(Contract.client),
        )
        .filter(Person.is_active == True)  # noqa: E712
    )
    if company:
        people_query = people_query.filter(Person.company == company)
    people = people_query.all()

    supply_by_role: dict[int, list[dict]] = {}
    for person in people:
        if not person.person_roles:
            continue
        primary_pr = next(
            (pr for pr in person.person_roles if pr.is_primary),
            person.person_roles[0],
        )
        rid = primary_pr.role_id
        role_name = primary_pr.role.name

        month_allocs = [
            a for a in person.allocations
            if a.start_date <= month_end and a.end_date >= month_start
        ]
        alloc_pct = sum(a.allocation_percentage for a in month_allocs)

        if alloc_pct >= 100:
            status = "allocated"
        elif alloc_pct > 0:
            status = "partial"
        else:
            status = "bench"

        becoming_free = False
        allocation_ends = None
        for a in month_allocs:
            if month_start <= a.end_date <= month_end:
                future = [
                    fa for fa in person.allocations
                    if fa.start_date > a.end_date
                ]
                if not future:
                    becoming_free = True
                    if allocation_ends is None or a.end_date > allocation_ends:
                        allocation_ends = a.end_date

        contracts_in_month = []
        for a in month_allocs:
            contracts_in_month.append({
                "contract_name": a.contract_role.contract.name,
                "client_name": a.contract_role.contract.client.name,
                "percentage": a.allocation_percentage,
                "end_date": a.end_date.isoformat(),
            })

        if rid not in supply_by_role:
            supply_by_role[rid] = []
        supply_by_role[rid].append({
            "person_id": person.id,
            "person_name": person.name,
            "person_company": person.company,
            "allocation_in_month": alloc_pct,
            "current_contracts": contracts_in_month,
            "status": status,
            "becoming_free": becoming_free,
            "allocation_ends": allocation_ends.isoformat() if allocation_ends else None,
        })

    # --- MERGE by role ---
    all_role_ids = set(demand_by_role.keys()) | set(supply_by_role.keys())
    all_roles = db.query(Role).all()
    role_name_map = {r.id: r.name for r in all_roles}

    roles_result = []
    total_demand = 0
    total_allocated = 0
    total_available = 0
    total_bench = 0

    for rid in all_role_ids:
        demand = demand_by_role.get(rid, {"demand_slots": 0, "demand_details": []})
        supply = supply_by_role.get(rid, [])

        s_allocated = sum(1 for p in supply if p["status"] == "allocated")
        s_partial = sum(1 for p in supply if p["status"] == "partial")
        s_bench = sum(1 for p in supply if p["status"] == "bench")
        s_available = s_partial + s_bench
        d_slots = demand["demand_slots"]
        unfilled = demand.get("unfilled_slots", 0)
        gap = d_slots - s_allocated

        total_demand += d_slots
        total_allocated += s_allocated
        total_available += s_available
        total_bench += s_bench

        roles_result.append({
            "role_id": rid,
            "role_name": role_name_map.get(rid, "Unknown"),
            "demand_slots": d_slots,
            "unfilled_slots": unfilled,
            "demand_details": demand["demand_details"],
            "supply_allocated": s_allocated,
            "supply_available": s_available,
            "supply_bench": s_bench,
            "supply_details": sorted(supply, key=lambda x: -x["allocation_in_month"]),
            "gap": gap,
        })

    def role_sort_key(r):
        name = r["role_name"]
        try:
            return ROLE_ORDER.index(name)
        except ValueError:
            return len(ROLE_ORDER)

    roles_result.sort(key=role_sort_key)

    return {
        "month": f"{year:04d}-{month:02d}",
        "roles": roles_result,
        "totals": {
            "total_demand": total_demand,
            "total_allocated": total_allocated,
            "total_available": total_available,
            "total_gap": total_demand - total_allocated,
            "total_people": len(people),
            "total_bench": total_bench,
        },
    }
