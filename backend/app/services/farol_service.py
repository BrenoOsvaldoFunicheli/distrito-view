from collections import defaultdict
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client
from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.models.farol_criterion import FAROL_KINDS, FarolCriterion
from app.models.farol_group import FarolGroup
from app.models.farol_value import FAROL_COLORS, FarolValue
from app.schemas.farol import (
    FarolCellUpdate,
    FarolCriterionCreate,
    FarolCriterionReorderRequest,
    FarolCriterionUpdate,
    FarolGroupCreate,
    FarolGroupReorderRequest,
    FarolGroupUpdate,
)


def iso_week_start(d: date) -> date:
    """Monday of the ISO week containing d."""
    return d - timedelta(days=d.weekday())


def _validate_kind(kind: str) -> None:
    if kind not in FAROL_KINDS:
        raise HTTPException(status_code=400, detail=f"Invalid kind: {kind}")


def _validate_color(color: str) -> None:
    if color not in FAROL_COLORS:
        raise HTTPException(status_code=400, detail=f"Invalid color: {color}")


def _normalize_week(week: date | None) -> date:
    return iso_week_start(week or date.today())


# ---------------- Groups ----------------


def list_groups(db: Session) -> list[FarolGroup]:
    return (
        db.query(FarolGroup)
        .order_by(FarolGroup.position, FarolGroup.id)
        .all()
    )


def get_group(db: Session, group_id: int) -> FarolGroup:
    g = db.query(FarolGroup).filter(FarolGroup.id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    return g


def create_group(db: Session, data: FarolGroupCreate) -> FarolGroup:
    label = data.label.strip()
    if not label:
        raise HTTPException(status_code=400, detail="Label is required")
    max_pos = db.query(func.max(FarolGroup.position)).scalar() or 0
    g = FarolGroup(label=label, position=max_pos + 1)
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


def update_group(
    db: Session, group_id: int, data: FarolGroupUpdate
) -> FarolGroup:
    g = get_group(db, group_id)
    payload = data.model_dump(exclude_unset=True)
    if "label" in payload:
        label = (payload["label"] or "").strip()
        if not label:
            raise HTTPException(status_code=400, detail="Label cannot be empty")
        g.label = label
    db.commit()
    db.refresh(g)
    return g


def delete_group(db: Session, group_id: int) -> None:
    g = get_group(db, group_id)
    # FK ON DELETE SET NULL solta os critérios deste grupo automaticamente.
    db.delete(g)
    db.commit()


def reorder_groups(
    db: Session, payload: FarolGroupReorderRequest
) -> list[FarolGroup]:
    by_id = {g.id: g for g in list_groups(db)}
    for item in payload.items:
        if item.id not in by_id:
            raise HTTPException(
                status_code=404, detail=f"Group {item.id} not found"
            )
        by_id[item.id].position = item.position
    db.commit()
    return list_groups(db)


def _validate_group_id(db: Session, group_id: int | None) -> None:
    if group_id is None:
        return
    if not db.query(FarolGroup).filter(FarolGroup.id == group_id).first():
        raise HTTPException(
            status_code=404, detail=f"Group {group_id} not found"
        )


# ---------------- Criteria ----------------


def list_criteria(db: Session) -> list[FarolCriterion]:
    return (
        db.query(FarolCriterion)
        .order_by(FarolCriterion.position, FarolCriterion.id)
        .all()
    )


def get_criterion(db: Session, criterion_id: int) -> FarolCriterion:
    c = (
        db.query(FarolCriterion)
        .filter(FarolCriterion.id == criterion_id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return c


def create_criterion(db: Session, data: FarolCriterionCreate) -> FarolCriterion:
    label = data.label.strip()
    if not label:
        raise HTTPException(status_code=400, detail="Label is required")
    _validate_kind(data.kind)
    _validate_group_id(db, data.group_id)
    max_pos = db.query(func.max(FarolCriterion.position)).scalar() or 0
    c = FarolCriterion(
        label=label,
        kind=data.kind,
        show_color=data.show_color,
        show_text=data.show_text,
        group_id=data.group_id,
        weights=data.weights,
        position=max_pos + 1,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def update_criterion(
    db: Session, criterion_id: int, data: FarolCriterionUpdate
) -> FarolCriterion:
    c = get_criterion(db, criterion_id)
    payload = data.model_dump(exclude_unset=True)
    if "kind" in payload:
        _validate_kind(payload["kind"])
    if "label" in payload:
        label = (payload["label"] or "").strip()
        if not label:
            raise HTTPException(status_code=400, detail="Label cannot be empty")
        payload["label"] = label
    if "group_id" in payload:
        _validate_group_id(db, payload["group_id"])
    for key, value in payload.items():
        setattr(c, key, value)
    db.commit()
    db.refresh(c)
    return c


def delete_criterion(db: Session, criterion_id: int) -> None:
    c = get_criterion(db, criterion_id)
    db.delete(c)
    db.commit()


def reorder_criteria(
    db: Session, payload: FarolCriterionReorderRequest
) -> list[FarolCriterion]:
    by_id = {c.id: c for c in list_criteria(db)}
    for item in payload.items:
        if item.id not in by_id:
            raise HTTPException(
                status_code=404, detail=f"Criterion {item.id} not found"
            )
        by_id[item.id].position = item.position
    db.commit()
    return list_criteria(db)


def set_cell(
    db: Session,
    criterion_id: int,
    client_id: int,
    payload: FarolCellUpdate,
    week: date | None = None,
) -> FarolValue:
    criterion = get_criterion(db, criterion_id)
    if criterion.kind != "manual":
        raise HTTPException(
            status_code=400,
            detail="Cells of calculated criteria cannot be set manually.",
        )
    if not db.query(Client).filter(Client.id == client_id).first():
        raise HTTPException(status_code=404, detail="Client not found")
    if payload.color is not None:
        _validate_color(payload.color)

    week_start = _normalize_week(week)

    value = (
        db.query(FarolValue)
        .filter(
            FarolValue.criterion_id == criterion_id,
            FarolValue.client_id == client_id,
            FarolValue.week_start == week_start,
        )
        .first()
    )
    if value is None:
        value = FarolValue(
            criterion_id=criterion_id,
            client_id=client_id,
            week_start=week_start,
            color=payload.color or "none",
            text_value=payload.text_value,
            notes=payload.notes,
        )
        db.add(value)
    else:
        if payload.color is not None:
            value.color = payload.color
        if payload.text_value is not None:
            value.text_value = payload.text_value or None
        if payload.notes is not None:
            value.notes = payload.notes or None
    db.commit()
    db.refresh(value)
    return value


def _compute_allocation_color(client: Client, today: date) -> str:
    """Verde: todas as vagas dos contratos ativos do cliente preenchidas.
    Vermelho: alguma vaga atrasada (start_date<=today e filled<quantity).
    Amarelo: parcial. Cinza: sem contratos ativos.
    """
    active_contracts = [c for c in client.contracts if c.status == "active"]
    if not active_contracts:
        return "none"
    has_late = False
    has_unfilled = False
    has_filled = False
    for contract in active_contracts:
        for cr in contract.contract_roles:
            role_start = cr.start_date or contract.start_date
            role_end = cr.end_date or contract.end_date
            if role_end <= today:
                continue
            filled = sum(
                1
                for a in cr.allocations
                if a.start_date < role_end and a.end_date > today
            )
            if filled >= cr.quantity:
                has_filled = True
            else:
                if role_start <= today:
                    has_late = True
                else:
                    has_unfilled = True
    if has_late:
        return "red"
    if not has_filled and not has_unfilled:
        return "none"
    if has_unfilled:
        return "yellow"
    return "green"


def get_board(db: Session, week: date | None = None) -> dict:
    week_start = _normalize_week(week)
    today = date.today()

    clients = (
        db.query(Client)
        .options(
            joinedload(Client.contracts)
            .joinedload(Contract.contract_roles)
            .joinedload(ContractRole.allocations),
        )
        .join(Contract, Contract.client_id == Client.id)
        .filter(Contract.status == "active")
        .order_by(Client.name)
        .distinct()
        .all()
    )
    criteria = list_criteria(db)
    values = (
        db.query(FarolValue)
        .filter(FarolValue.week_start == week_start)
        .all()
    )
    values_map = {(v.criterion_id, v.client_id): v for v in values}

    cells: list[dict] = []
    # Indexa células não-macro por (criterion_id, client_id) para o cálculo do macro.
    non_macro_cells: dict[tuple[int, int], str] = {}
    macro_criteria: list[FarolCriterion] = []

    for criterion in criteria:
        if criterion.kind == "macro":
            macro_criteria.append(criterion)
            continue
        for client in clients:
            if criterion.kind == "calculated_allocation":
                color = _compute_allocation_color(client, today)
                cells.append(
                    {
                        "criterion_id": criterion.id,
                        "client_id": client.id,
                        "color": color,
                        "text_value": None,
                        "notes": None,
                        "computed": True,
                    }
                )
                non_macro_cells[(criterion.id, client.id)] = color
            else:
                value = values_map.get((criterion.id, client.id))
                color = value.color if value else "none"
                cells.append(
                    {
                        "criterion_id": criterion.id,
                        "client_id": client.id,
                        "color": color,
                        "text_value": value.text_value if value else None,
                        "notes": value.notes if value else None,
                        "computed": False,
                    }
                )
                non_macro_cells[(criterion.id, client.id)] = color

    for criterion in macro_criteria:
        for client in clients:
            color = _compute_macro_color(criterion, client.id, non_macro_cells)
            cells.append(
                {
                    "criterion_id": criterion.id,
                    "client_id": client.id,
                    "color": color,
                    "text_value": None,
                    "notes": None,
                    "computed": True,
                }
            )

    return {
        "week_start": week_start,
        "groups": list_groups(db),
        "criteria": criteria,
        "clients": [{"id": c.id, "name": c.name} for c in clients],
        "cells": cells,
    }


_COLOR_SCORE = {"red": 3, "yellow": 2, "green": 1}


def _compute_macro_color(
    criterion: FarolCriterion,
    client_id: int,
    non_macro_cells: dict[tuple[int, int], str],
) -> str:
    """Média ponderada das cores dos critérios não-macro para o cliente.

    red=3, yellow=2, green=1, none é ignorado (não distorce o resultado).
    Pesos vêm de criterion.weights = {criterion_id_str: peso_relativo}.
    Mapeamento: ≥2.34 → red, 1.67–2.33 → yellow, ≤1.66 → green, sem dados → none.
    """
    weights = criterion.weights or {}
    weighted_sum = 0.0
    weight_total = 0.0
    for crit_id_str, weight in weights.items():
        try:
            crit_id = int(crit_id_str)
        except (TypeError, ValueError):
            continue
        if not weight or weight <= 0:
            continue
        color = non_macro_cells.get((crit_id, client_id))
        score = _COLOR_SCORE.get(color or "")
        if score is None:
            continue
        weighted_sum += score * weight
        weight_total += weight
    if weight_total == 0:
        return "none"
    avg = weighted_sum / weight_total
    if avg >= 2.34:
        return "red"
    if avg >= 1.67:
        return "yellow"
    return "green"


def get_cell_history(
    db: Session, criterion_id: int, client_id: int, weeks: int
) -> list[dict]:
    """Últimas N semanas (incluindo a atual) para a célula."""
    criterion = get_criterion(db, criterion_id)
    if not db.query(Client).filter(Client.id == client_id).first():
        raise HTTPException(status_code=404, detail="Client not found")

    current = iso_week_start(date.today())
    week_list = [current - timedelta(weeks=i) for i in range(weeks)]
    week_list.reverse()  # mais antiga primeiro

    if criterion.kind == "calculated_allocation":
        # Não temos snapshot — devolve o estado atual em todas as semanas.
        client = (
            db.query(Client)
            .options(
                joinedload(Client.contracts)
                .joinedload(Contract.contract_roles)
                .joinedload(ContractRole.allocations),
            )
            .filter(Client.id == client_id)
            .first()
        )
        color = _compute_allocation_color(client, date.today())
        return [
            {
                "week_start": w,
                "color": color,
                "text_value": None,
                "notes": None,
                "computed": True,
            }
            for w in week_list
        ]

    rows = (
        db.query(FarolValue)
        .filter(
            FarolValue.criterion_id == criterion_id,
            FarolValue.client_id == client_id,
            FarolValue.week_start.in_(week_list),
        )
        .all()
    )
    by_week = {r.week_start: r for r in rows}
    return [
        {
            "week_start": w,
            "color": by_week[w].color if w in by_week else "none",
            "text_value": by_week[w].text_value if w in by_week else None,
            "notes": by_week[w].notes if w in by_week else None,
            "computed": False,
        }
        for w in week_list
    ]


def get_trend(db: Session, weeks: int) -> dict:
    """Série temporal: por semana, contagem de cada cor (todos os critérios e
    clientes ativos somados). Critérios calculados ficam de fora (não temos
    snapshot)."""
    current = iso_week_start(date.today())
    week_list = [current - timedelta(weeks=i) for i in range(weeks)]
    week_list.reverse()

    rows = (
        db.query(
            FarolValue.week_start,
            FarolValue.color,
            func.count(FarolValue.id),
        )
        .filter(FarolValue.week_start.in_(week_list))
        .group_by(FarolValue.week_start, FarolValue.color)
        .all()
    )

    counts: dict[date, dict[str, int]] = defaultdict(
        lambda: {c: 0 for c in FAROL_COLORS}
    )
    for week_start, color, count in rows:
        counts[week_start][color] = count

    series = [
        {
            "week_start": w,
            "green": counts[w]["green"],
            "yellow": counts[w]["yellow"],
            "red": counts[w]["red"],
            "none": counts[w]["none"],
        }
        for w in week_list
    ]
    return {"weeks": series}
