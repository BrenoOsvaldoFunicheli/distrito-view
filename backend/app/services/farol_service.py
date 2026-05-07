from datetime import date

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client
from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.models.farol_criterion import FAROL_KINDS, FarolCriterion
from app.models.farol_value import FAROL_COLORS, FarolValue
from app.schemas.farol import (
    FarolCellUpdate,
    FarolCriterionCreate,
    FarolCriterionReorderRequest,
    FarolCriterionUpdate,
)


def _validate_kind(kind: str) -> None:
    if kind not in FAROL_KINDS:
        raise HTTPException(status_code=400, detail=f"Invalid kind: {kind}")


def _validate_color(color: str) -> None:
    if color not in FAROL_COLORS:
        raise HTTPException(status_code=400, detail=f"Invalid color: {color}")


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
    max_pos = db.query(func.max(FarolCriterion.position)).scalar() or 0
    c = FarolCriterion(
        label=label,
        kind=data.kind,
        show_color=data.show_color,
        show_text=data.show_text,
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
    db: Session, criterion_id: int, client_id: int, payload: FarolCellUpdate
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

    value = (
        db.query(FarolValue)
        .filter(
            FarolValue.criterion_id == criterion_id,
            FarolValue.client_id == client_id,
        )
        .first()
    )
    if value is None:
        value = FarolValue(
            criterion_id=criterion_id,
            client_id=client_id,
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


def get_board(db: Session) -> dict:
    today = date.today()

    # Clientes ativos = têm pelo menos 1 contrato active
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
    values = db.query(FarolValue).all()
    values_map = {(v.criterion_id, v.client_id): v for v in values}

    cells: list[dict] = []
    for criterion in criteria:
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
            else:
                value = values_map.get((criterion.id, client.id))
                cells.append(
                    {
                        "criterion_id": criterion.id,
                        "client_id": client.id,
                        "color": value.color if value else "none",
                        "text_value": value.text_value if value else None,
                        "notes": value.notes if value else None,
                        "computed": False,
                    }
                )

    return {
        "criteria": criteria,
        "clients": [{"id": c.id, "name": c.name} for c in clients],
        "cells": cells,
    }
