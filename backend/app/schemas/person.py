from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.role import RoleResponse


class PersonRoleInfo(BaseModel):
    role: RoleResponse
    is_primary: bool

    model_config = {"from_attributes": True}


class PersonCreate(BaseModel):
    name: str
    email: str
    company: str = "Distrito"
    role_ids: list[int] = []
    primary_role_id: int | None = None
    notes: str | None = None


class PersonUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    company: str | None = None
    role_ids: list[int] | None = None
    primary_role_id: int | None = None
    notes: str | None = None
    is_active: bool | None = None


class PersonResponse(BaseModel):
    id: int
    name: str
    email: str
    company: str
    is_active: bool
    terminated_at: date | None = None
    notes: str | None
    roles: list[PersonRoleInfo]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
