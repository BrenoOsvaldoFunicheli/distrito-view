from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserCreateRequest,
    UserResponse,
    UserUpdateRequest,
)
from app.services import auth_service, user_service


router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=settings.JWT_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


@router.post("/login", response_model=UserResponse)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, data.email, data.password)
    token = auth_service.create_access_token(user)
    _set_auth_cookie(response, token)
    return user


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        samesite="lax",
        secure=settings.AUTH_COOKIE_SECURE,
    )


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserResponse)
def update_me(
    data: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_own_profile(db, user, data)


@router.post("/me/change-password", response_model=UserResponse)
def change_my_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.change_own_password(db, user, data)


# --- Admin: gerenciar usuários ---


@router.get("/users", response_model=list[UserResponse])
def list_users(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return user_service.list_users(db)


@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(
    data: UserCreateRequest,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return user_service.create_user(db, data)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdateRequest,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return user_service.update_user(db, user_id, data)


@router.post("/users/{user_id}/reset-password", response_model=UserResponse)
def reset_user_password(
    user_id: int,
    data: ResetPasswordRequest,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return user_service.reset_password(db, user_id, data)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user_service.delete_user(db, user_id, admin.id)
