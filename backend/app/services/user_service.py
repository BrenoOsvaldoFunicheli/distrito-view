from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserCreateRequest,
    UserUpdateRequest,
)
from app.services.auth_service import hash_password, verify_password


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.email).all()


def get_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def create_user(db: Session, data: UserCreateRequest) -> User:
    from app.services import user_group_service

    email = data.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email é obrigatório")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email já cadastrado")
    user = User(
        email=email,
        name=data.name,
        password_hash=hash_password(data.password),
        is_admin=data.is_admin,
        is_active=True,
    )
    db.add(user)
    db.flush()
    if data.group_ids:
        user_group_service.replace_user_groups(db, user.id, data.group_ids)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data: UserUpdateRequest) -> User:
    from app.services import user_group_service

    user = get_user(db, user_id)
    payload = data.model_dump(exclude_unset=True)
    group_ids = payload.pop("group_ids", None)
    for key, value in payload.items():
        setattr(user, key, value)
    if group_ids is not None:
        user_group_service.replace_user_groups(db, user_id, group_ids)
    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, user_id: int, data: ResetPasswordRequest) -> User:
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")
    user = get_user(db, user_id)
    user.password_hash = hash_password(data.password)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int, current_user_id: int) -> None:
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Você não pode excluir a si mesmo")
    user = get_user(db, user_id)
    db.delete(user)
    db.commit()


def change_own_password(db: Session, user: User, data: ChangePasswordRequest) -> User:
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 6 caracteres")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    db.refresh(user)
    return user


def update_own_profile(db: Session, user: User, data: UpdateProfileRequest) -> User:
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
