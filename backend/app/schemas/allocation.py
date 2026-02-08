from datetime import date, datetime

from pydantic import BaseModel


class AllocationCreate(BaseModel):
    person_id: int
    contract_role_id: int
    allocation_percentage: int
    start_date: date
    end_date: date
    notes: str | None = None


class AllocationUpdate(BaseModel):
    allocation_percentage: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None


class AllocationResponse(BaseModel):
    id: int
    person_id: int
    person_name: str
    contract_role_id: int
    contract_name: str
    client_name: str
    role_name: str
    allocation_percentage: int
    start_date: date
    end_date: date
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
