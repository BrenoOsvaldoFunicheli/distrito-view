from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.schemas.contract import ContractCreate, ContractRoleCreate, ContractRoleUpdate, ContractUpdate


def _validate_role_window(
    contract: Contract, start: date | None, end: date | None
) -> None:
    """Both nulls = vaga vale pelo contrato inteiro. Caso contrário exige ambos
    e a janela deve estar dentro do período do contrato."""
    if start is None and end is None:
        return
    if start is None or end is None:
        raise HTTPException(
            status_code=400,
            detail="Informe ambas as datas da vaga ou nenhuma.",
        )
    if end <= start:
        raise HTTPException(
            status_code=400,
            detail="Data final da vaga deve ser posterior à inicial.",
        )
    if start < contract.start_date or end > contract.end_date:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Janela da vaga ({start} a {end}) deve estar dentro do contrato "
                f"({contract.start_date} a {contract.end_date})."
            ),
        )


def list_contracts(
    db: Session,
    status: str | None = None,
    client_id: int | None = None,
) -> list[Contract]:
    query = db.query(Contract).options(
        joinedload(Contract.client),
        joinedload(Contract.contract_roles).joinedload(ContractRole.role),
        joinedload(Contract.contract_roles).joinedload(ContractRole.allocations),
    )
    if status:
        query = query.filter(Contract.status == status)
    if client_id:
        query = query.filter(Contract.client_id == client_id)
    return query.order_by(Contract.start_date.desc()).all()


def get_contract(db: Session, contract_id: int) -> Contract:
    contract = (
        db.query(Contract)
        .options(
            joinedload(Contract.client),
            joinedload(Contract.contract_roles).joinedload(ContractRole.role),
            joinedload(Contract.contract_roles).joinedload(ContractRole.allocations),
        )
        .filter(Contract.id == contract_id)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


def create_contract(db: Session, data: ContractCreate) -> Contract:
    roles_data = data.roles
    contract = Contract(**data.model_dump(exclude={"roles"}))
    db.add(contract)
    db.flush()
    for role_data in roles_data:
        _validate_role_window(contract, role_data.start_date, role_data.end_date)
        cr = ContractRole(contract_id=contract.id, **role_data.model_dump())
        db.add(cr)
    db.commit()
    return get_contract(db, contract.id)


def update_contract(db: Session, contract_id: int, data: ContractUpdate) -> Contract:
    contract = get_contract(db, contract_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(contract, key, value)
    db.commit()
    return get_contract(db, contract_id)


def delete_contract(db: Session, contract_id: int) -> None:
    contract = get_contract(db, contract_id)
    contract.status = "cancelled"
    db.commit()


def add_contract_role(
    db: Session, contract_id: int, data: ContractRoleCreate
) -> ContractRole:
    contract = get_contract(db, contract_id)
    _validate_role_window(contract, data.start_date, data.end_date)
    cr = ContractRole(contract_id=contract_id, **data.model_dump())
    db.add(cr)
    db.commit()
    db.refresh(cr)
    return cr


def update_contract_role(
    db: Session, contract_id: int, role_id: int, data: ContractRoleUpdate
) -> ContractRole:
    cr = (
        db.query(ContractRole)
        .filter(ContractRole.id == role_id, ContractRole.contract_id == contract_id)
        .first()
    )
    if not cr:
        raise HTTPException(status_code=404, detail="Contract role not found")
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(cr, key, value)
    if "start_date" in payload or "end_date" in payload:
        contract = get_contract(db, contract_id)
        _validate_role_window(contract, cr.start_date, cr.end_date)
    db.commit()
    db.refresh(cr)
    return cr


def delete_contract_role(db: Session, contract_id: int, role_id: int) -> None:
    cr = (
        db.query(ContractRole)
        .filter(ContractRole.id == role_id, ContractRole.contract_id == contract_id)
        .first()
    )
    if not cr:
        raise HTTPException(status_code=404, detail="Contract role not found")
    db.delete(cr)
    db.commit()
