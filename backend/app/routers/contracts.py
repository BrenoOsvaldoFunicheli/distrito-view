from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.contract import (
    ContractCreate,
    ContractResponse,
    ContractRoleCreate,
    ContractRoleUpdate,
    ContractUpdate,
)
from app.services import contract_service

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.get("", response_model=list[ContractResponse])
def list_contracts(
    status: str | None = None,
    client_id: int | None = None,
    db: Session = Depends(get_db),
):
    return contract_service.list_contracts(db, status=status, client_id=client_id)


@router.post("", response_model=ContractResponse, status_code=201)
def create_contract(data: ContractCreate, db: Session = Depends(get_db)):
    return contract_service.create_contract(db, data)


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    return contract_service.get_contract(db, contract_id)


@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int, data: ContractUpdate, db: Session = Depends(get_db)
):
    return contract_service.update_contract(db, contract_id, data)


@router.delete("/{contract_id}", status_code=204)
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    contract_service.delete_contract(db, contract_id)


@router.post("/{contract_id}/roles", status_code=201)
def add_contract_role(
    contract_id: int, data: ContractRoleCreate, db: Session = Depends(get_db)
):
    return contract_service.add_contract_role(db, contract_id, data)


@router.put("/{contract_id}/roles/{role_id}")
def update_contract_role(
    contract_id: int,
    role_id: int,
    data: ContractRoleUpdate,
    db: Session = Depends(get_db),
):
    return contract_service.update_contract_role(db, contract_id, role_id, data)


@router.delete("/{contract_id}/roles/{role_id}", status_code=204)
def delete_contract_role(
    contract_id: int, role_id: int, db: Session = Depends(get_db)
):
    contract_service.delete_contract_role(db, contract_id, role_id)
