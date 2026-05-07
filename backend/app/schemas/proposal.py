from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.client import ClientCreate, ClientResponse
from app.schemas.contract import ContractRoleCreate


class ProposalCreate(BaseModel):
    title: str
    contact_name: str | None = None
    contact_email: str | None = None
    estimated_value: float | None = None
    expected_close_date: date | None = None
    expected_start_date: date | None = None
    source: str | None = None
    notes: str | None = None
    stage: str = "lead"
    client_id: int | None = None


class ProposalUpdate(BaseModel):
    title: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    estimated_value: float | None = None
    expected_close_date: date | None = None
    expected_start_date: date | None = None
    source: str | None = None
    notes: str | None = None
    client_id: int | None = None
    lost_reason: str | None = None


class ProposalStageUpdate(BaseModel):
    stage: str
    lost_reason: str | None = None
    position: int | None = None


class ContractCreateForConvert(BaseModel):
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


class ProposalConvertRequest(BaseModel):
    new_client: ClientCreate | None = None
    contract: ContractCreateForConvert


class ProposalResponse(BaseModel):
    id: int
    title: str
    contact_name: str | None
    contact_email: str | None
    estimated_value: float | None
    expected_close_date: date | None
    expected_start_date: date | None
    source: str | None
    notes: str | None
    stage: str
    lost_reason: str | None
    position: int
    client: ClientResponse | None
    client_id: int | None
    contract_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
