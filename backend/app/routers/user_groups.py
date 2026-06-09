from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.schemas.user_group import (
    AreasListResponse,
    UserGroupCreate,
    UserGroupResponse,
    UserGroupUpdate,
)
from app.services import user_group_service


router = APIRouter(prefix="/admin/groups", tags=["user-groups"])


@router.get("/areas", response_model=AreasListResponse)
def list_areas(_admin: User = Depends(require_admin)):
    return {"areas": user_group_service.list_areas()}


@router.get("", response_model=list[UserGroupResponse])
def list_groups(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return user_group_service.list_groups(db)


@router.post("", response_model=UserGroupResponse, status_code=201)
def create_group(
    data: UserGroupCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return user_group_service.create_group(db, data)


@router.get("/{group_id}", response_model=UserGroupResponse)
def get_group(
    group_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return user_group_service.get_group_dict(db, group_id)


@router.put("/{group_id}", response_model=UserGroupResponse)
def update_group(
    group_id: int,
    data: UserGroupUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return user_group_service.update_group(db, group_id, data)


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user_group_service.delete_group(db, group_id)
