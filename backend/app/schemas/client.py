from datetime import datetime

from pydantic import BaseModel


class ClientCreate(BaseModel):
    name: str
    contact_name: str | None = None
    contact_email: str | None = None
    sector: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    sector: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class ClientResponse(BaseModel):
    id: int
    name: str
    contact_name: str | None
    contact_email: str | None
    sector: str | None
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
