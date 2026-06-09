from datetime import datetime

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None
    is_active: bool
    is_admin: bool
    groups: list[str] = []
    areas: list[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    email: str
    password: str
    name: str | None = None
    is_admin: bool = False
    group_ids: list[int] = []


class UserUpdateRequest(BaseModel):
    name: str | None = None
    is_admin: bool | None = None
    is_active: bool | None = None
    group_ids: list[int] | None = None


class ResetPasswordRequest(BaseModel):
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    name: str | None = None
