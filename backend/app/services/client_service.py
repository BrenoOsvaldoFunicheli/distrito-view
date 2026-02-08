from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate


def list_clients(db: Session, is_active: bool | None = None) -> list[Client]:
    query = db.query(Client)
    if is_active is not None:
        query = query.filter(Client.is_active == is_active)
    return query.order_by(Client.name).all()


def get_client(db: Session, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


def create_client(db: Session, data: ClientCreate) -> Client:
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def update_client(db: Session, client_id: int, data: ClientUpdate) -> Client:
    client = get_client(db, client_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(client, key, value)
    db.commit()
    db.refresh(client)
    return client


def delete_client(db: Session, client_id: int) -> None:
    client = get_client(db, client_id)
    client.is_active = False
    db.commit()
