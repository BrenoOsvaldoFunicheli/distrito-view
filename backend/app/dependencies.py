from collections.abc import Generator

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.services import auth_service


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request, db: Session = Depends(get_db)
) -> User:
    token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if not token:
        # Aceita também header Authorization: Bearer ... como fallback
        auth = request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return auth_service.get_user_from_token(db, token)


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return user


def require_area(area: str):
    """Factory de dependency que valida acesso a uma área."""

    def dep(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if user.is_admin:
            return user
        from app.services import user_group_service

        if area not in user_group_service.get_user_areas(db, user):
            raise HTTPException(
                status_code=403,
                detail=f"Sem acesso à área '{area}'",
            )
        return user

    return dep
