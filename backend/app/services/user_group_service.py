from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.user import User
from app.models.user_group import UserGroup
from app.models.user_group_area import UserGroupArea
from app.models.user_group_member import UserGroupMember
from app.permissions import AREAS, AREA_LABELS, DEFAULT_GROUP_NAME
from app.schemas.user_group import UserGroupCreate, UserGroupUpdate


def _validate_areas(areas: list[str]) -> list[str]:
    cleaned: list[str] = []
    for area in areas:
        if area not in AREAS:
            raise HTTPException(status_code=400, detail=f"Área desconhecida: {area}")
        if area not in cleaned:
            cleaned.append(area)
    return cleaned


def _validate_users(db: Session, user_ids: list[int]) -> list[int]:
    if not user_ids:
        return []
    existing = {
        u.id
        for u in db.query(User).filter(User.id.in_(user_ids)).all()
    }
    missing = [uid for uid in user_ids if uid not in existing]
    if missing:
        raise HTTPException(
            status_code=404, detail=f"Usuários não encontrados: {missing}"
        )
    return list(dict.fromkeys(user_ids))  # dedupe preservando ordem


def _to_dict(group: UserGroup) -> dict:
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "areas": sorted({a.area for a in group.areas}),
        "member_ids": sorted({m.user_id for m in group.members}),
        "member_count": len(group.members),
        "created_at": group.created_at,
        "updated_at": group.updated_at,
    }


def list_groups(db: Session) -> list[dict]:
    groups = (
        db.query(UserGroup)
        .options(joinedload(UserGroup.areas), joinedload(UserGroup.members))
        .order_by(UserGroup.name)
        .all()
    )
    return [_to_dict(g) for g in groups]


def get_group(db: Session, group_id: int) -> UserGroup:
    g = (
        db.query(UserGroup)
        .options(joinedload(UserGroup.areas), joinedload(UserGroup.members))
        .filter(UserGroup.id == group_id)
        .first()
    )
    if not g:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return g


def get_group_dict(db: Session, group_id: int) -> dict:
    return _to_dict(get_group(db, group_id))


def create_group(db: Session, data: UserGroupCreate) -> dict:
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome é obrigatório")
    if db.query(UserGroup).filter(UserGroup.name == name).first():
        raise HTTPException(status_code=409, detail="Já existe um grupo com esse nome")
    areas = _validate_areas(data.areas)
    member_ids = _validate_users(db, data.member_ids)
    group = UserGroup(name=name, description=data.description)
    db.add(group)
    db.flush()
    for area in areas:
        db.add(UserGroupArea(group_id=group.id, area=area))
    for uid in member_ids:
        db.add(UserGroupMember(group_id=group.id, user_id=uid))
    db.commit()
    return get_group_dict(db, group.id)


def update_group(db: Session, group_id: int, data: UserGroupUpdate) -> dict:
    group = get_group(db, group_id)
    payload = data.model_dump(exclude_unset=True)

    if "name" in payload:
        name = (payload["name"] or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Nome não pode ser vazio")
        if (
            db.query(UserGroup)
            .filter(UserGroup.name == name, UserGroup.id != group_id)
            .first()
        ):
            raise HTTPException(
                status_code=409, detail="Já existe um grupo com esse nome"
            )
        group.name = name

    if "description" in payload:
        group.description = payload["description"]

    if "areas" in payload and payload["areas"] is not None:
        areas = _validate_areas(payload["areas"])
        db.query(UserGroupArea).filter(UserGroupArea.group_id == group_id).delete()
        for area in areas:
            db.add(UserGroupArea(group_id=group_id, area=area))

    if "member_ids" in payload and payload["member_ids"] is not None:
        member_ids = _validate_users(db, payload["member_ids"])
        db.query(UserGroupMember).filter(
            UserGroupMember.group_id == group_id
        ).delete()
        for uid in member_ids:
            db.add(UserGroupMember(group_id=group_id, user_id=uid))

    db.commit()
    return get_group_dict(db, group_id)


def delete_group(db: Session, group_id: int) -> None:
    group = get_group(db, group_id)
    if group.name == DEFAULT_GROUP_NAME:
        raise HTTPException(
            status_code=400,
            detail=f"O grupo '{DEFAULT_GROUP_NAME}' não pode ser excluído",
        )
    db.delete(group)
    db.commit()


def list_areas() -> list[dict]:
    return [{"key": area, "label": AREA_LABELS.get(area, area)} for area in AREAS]


def get_user_areas(db: Session, user: User) -> set[str]:
    """Retorna a união de áreas dos grupos do usuário. Admin = todas as áreas."""
    if user.is_admin:
        return set(AREAS)
    rows = (
        db.query(UserGroupArea.area)
        .join(UserGroupMember, UserGroupMember.group_id == UserGroupArea.group_id)
        .filter(UserGroupMember.user_id == user.id)
        .distinct()
        .all()
    )
    return {row[0] for row in rows}


def get_user_groups(db: Session, user: User) -> list[str]:
    rows = (
        db.query(UserGroup.name)
        .join(UserGroupMember, UserGroupMember.group_id == UserGroup.id)
        .filter(UserGroupMember.user_id == user.id)
        .order_by(UserGroup.name)
        .all()
    )
    return [row[0] for row in rows]


def replace_user_groups(db: Session, user_id: int, group_ids: list[int]) -> None:
    """Substitui completamente os grupos de um usuário."""
    valid_ids = {
        g.id for g in db.query(UserGroup).filter(UserGroup.id.in_(group_ids)).all()
    }
    missing = [gid for gid in group_ids if gid not in valid_ids]
    if missing:
        raise HTTPException(
            status_code=404, detail=f"Grupos não encontrados: {missing}"
        )
    db.query(UserGroupMember).filter(UserGroupMember.user_id == user_id).delete()
    for gid in dict.fromkeys(group_ids):
        db.add(UserGroupMember(group_id=gid, user_id=user_id))


# Pequeno helper para evitar import cycle nos lugares que precisam só do select
__all__ = (
    "list_groups",
    "get_group",
    "get_group_dict",
    "create_group",
    "update_group",
    "delete_group",
    "list_areas",
    "get_user_areas",
    "get_user_groups",
    "replace_user_groups",
)


# Convenience export to avoid unused warning
_ = select
_ = func
