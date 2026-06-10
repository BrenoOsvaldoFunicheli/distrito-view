"""Testes da regra: não-admin só concede áreas que possui.

Usa SQLite em memória, sem depender do banco de dev.
"""

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (registra todas as tabelas em Base.metadata)
from app.database import Base
from app.models.user import User
from app.models.user_group import UserGroup
from app.models.user_group_area import UserGroupArea
from app.models.user_group_member import UserGroupMember
from app.schemas.user_group import UserGroupCreate, UserGroupUpdate
from app.services import user_group_service


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def _make_user(db, email, *, is_admin=False, areas=()):
    user = User(email=email, password_hash="x", is_admin=is_admin)
    db.add(user)
    db.flush()
    if areas:
        # Concede áreas via um grupo do qual o usuário é membro.
        g = UserGroup(name=f"grp-{email}")
        db.add(g)
        db.flush()
        for a in areas:
            db.add(UserGroupArea(group_id=g.id, area=a))
        db.add(UserGroupMember(group_id=g.id, user_id=user.id))
    db.commit()
    return user


def test_nonadmin_can_create_group_with_own_areas(db):
    actor = _make_user(db, "mgr@x.com", areas=["clientes", "farol"])
    data = UserGroupCreate(name="Time A", areas=["clientes"], member_ids=[])
    result = user_group_service.create_group(db, data, actor)
    assert set(result["areas"]) == {"clientes"}


def test_nonadmin_cannot_grant_area_they_lack(db):
    actor = _make_user(db, "mgr@x.com", areas=["clientes"])
    data = UserGroupCreate(name="Hack", areas=["pessoas"], member_ids=[])
    with pytest.raises(HTTPException) as exc:
        user_group_service.create_group(db, data, actor)
    assert exc.value.status_code == 403


def test_admin_can_grant_any_area(db):
    admin = _make_user(db, "admin@x.com", is_admin=True)
    data = UserGroupCreate(
        name="Tudo", areas=["pessoas", "contratos"], member_ids=[]
    )
    result = user_group_service.create_group(db, data, admin)
    assert set(result["areas"]) == {"pessoas", "contratos"}


def test_nonadmin_can_add_any_user_as_member(db):
    actor = _make_user(db, "mgr@x.com", areas=["clientes"])
    other = _make_user(db, "other@x.com")
    data = UserGroupCreate(
        name="Time", areas=["clientes"], member_ids=[other.id]
    )
    result = user_group_service.create_group(db, data, actor)
    assert other.id in result["member_ids"]


def test_update_preserves_preexisting_area_out_of_reach(db):
    # Grupo criado por admin com área 'pessoas'.
    admin = _make_user(db, "admin@x.com", is_admin=True)
    created = user_group_service.create_group(
        db,
        UserGroupCreate(name="G", areas=["pessoas", "clientes"], member_ids=[]),
        admin,
    )
    actor = _make_user(db, "mgr@x.com", areas=["clientes"])
    # Manda o conjunto completo (inclui 'pessoas' que ele não possui) — deve passar.
    user_group_service.update_group(
        db,
        created["id"],
        UserGroupUpdate(areas=["pessoas", "clientes"]),
        actor,
    )
    updated = user_group_service.get_group_dict(db, created["id"])
    assert set(updated["areas"]) == {"pessoas", "clientes"}


def test_update_blocks_adding_new_area_out_of_reach(db):
    admin = _make_user(db, "admin@x.com", is_admin=True)
    created = user_group_service.create_group(
        db,
        UserGroupCreate(name="G", areas=["clientes"], member_ids=[]),
        admin,
    )
    actor = _make_user(db, "mgr@x.com", areas=["clientes"])
    # Tenta ADICIONAR 'pessoas', que ele não possui — deve falhar.
    with pytest.raises(HTTPException) as exc:
        user_group_service.update_group(
            db,
            created["id"],
            UserGroupUpdate(areas=["clientes", "pessoas"]),
            actor,
        )
    assert exc.value.status_code == 403
