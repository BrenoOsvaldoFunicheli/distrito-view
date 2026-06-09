from datetime import date, datetime

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str = "active"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


class ProjectResponse(BaseModel):
    id: int
    contract_id: int
    name: str
    description: str | None
    start_date: date | None
    end_date: date | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectWithContext(ProjectResponse):
    """Project com nome do contrato e cliente, para listagens globais."""

    contract_name: str
    client_id: int
    client_name: str
