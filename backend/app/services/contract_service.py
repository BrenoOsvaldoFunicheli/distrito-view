from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.schemas.contract import ContractCreate, ContractRoleCreate, ContractRoleUpdate, ContractUpdate


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
    get_contract(db, contract_id)  # ensure exists
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
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(cr, key, value)
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
