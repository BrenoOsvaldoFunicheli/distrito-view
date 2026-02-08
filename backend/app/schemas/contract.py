from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.client import ClientResponse
from app.schemas.role import RoleResponse


class ContractRoleCreate(BaseModel):
    role_id: int
    allocation_percentage: int
    quantity: int = 1
    notes: str | None = None


class ContractRoleUpdate(BaseModel):
    role_id: int | None = None
    allocation_percentage: int | None = None
    quantity: int | None = None
    notes: str | None = None


class ContractRoleResponse(BaseModel):
    id: int
    role: RoleResponse
    allocation_percentage: int
    quantity: int
    notes: str | None

    model_config = {"from_attributes": True}


class ContractCreate(BaseModel):
    client_id: int
    name: str
    start_date: date
    end_date: date
    status: str = "active"
    plan_type: str | None = None
    mrr: float | None = None
    total_value: float | None = None
    duration_months: int | None = None
    payment_method: str | None = None
    notes: str | None = None
    roles: list[ContractRoleCreate] = []


class ContractUpdate(BaseModel):
    client_id: int | None = None
    name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None
    plan_type: str | None = None
    mrr: float | None = None
    total_value: float | None = None
    duration_months: int | None = None
    payment_method: str | None = None
    notes: str | None = None


class ContractResponse(BaseModel):
    id: int
    client: ClientResponse
    name: str
    start_date: date
    end_date: date
    status: str
    plan_type: str | None
    mrr: float | None
    total_value: float | None
    duration_months: int | None
    payment_method: str | None
    notes: str | None
    contract_roles: list[ContractRoleResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContractListResponse(BaseModel):
    id: int
    client_name: str
    name: str
    start_date: date
    end_date: date
    status: str
    plan_type: str | None
    mrr: float | None
    total_value: float | None
    roles_count: int
    filled_count: int

    model_config = {"from_attributes": True}
