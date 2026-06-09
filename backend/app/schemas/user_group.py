from datetime import datetime

from pydantic import BaseModel


class UserGroupCreate(BaseModel):
    name: str
    description: str | None = None
    areas: list[str] = []
    member_ids: list[int] = []


class UserGroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    areas: list[str] | None = None
    member_ids: list[int] | None = None


class UserGroupResponse(BaseModel):
    id: int
    name: str
    description: str | None
    areas: list[str]
    member_ids: list[int]
    member_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AreaInfo(BaseModel):
    key: str
    label: str


class AreasListResponse(BaseModel):
    areas: list[AreaInfo]
