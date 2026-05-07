from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.person import PersonCreate, PersonResponse, PersonUpdate
from app.services import allocation_service, person_service


class TerminatePersonRequest(BaseModel):
    terminated_at: date

router = APIRouter(prefix="/people", tags=["people"])


@router.get("", response_model=list[PersonResponse])
def list_people(
    is_active: bool | None = None,
    role_id: int | None = None,
    db: Session = Depends(get_db),
):
    people = person_service.list_people(db, is_active=is_active, role_id=role_id)
    return [_to_response(p) for p in people]


@router.post("", response_model=PersonResponse, status_code=201)
def create_person(data: PersonCreate, db: Session = Depends(get_db)):
    person = person_service.create_person(db, data)
    return _to_response(person)


@router.get("/{person_id}", response_model=PersonResponse)
def get_person(person_id: int, db: Session = Depends(get_db)):
    person = person_service.get_person(db, person_id)
    return _to_response(person)


@router.put("/{person_id}", response_model=PersonResponse)
def update_person(person_id: int, data: PersonUpdate, db: Session = Depends(get_db)):
    person = person_service.update_person(db, person_id, data)
    return _to_response(person)


@router.delete("/{person_id}", status_code=204)
def delete_person(person_id: int, db: Session = Depends(get_db)):
    person_service.delete_person(db, person_id)


@router.get("/{person_id}/allocations")
def get_person_allocations(person_id: int, db: Session = Depends(get_db)):
    allocs = allocation_service.list_allocations(db, person_id=person_id)
    return [allocation_service._build_response_dict(a) for a in allocs]


@router.post("/{person_id}/terminate", response_model=PersonResponse)
def terminate_person(
    person_id: int, data: TerminatePersonRequest, db: Session = Depends(get_db)
):
    person = person_service.terminate_person(db, person_id, data.terminated_at)
    return _to_response(person)


@router.post("/{person_id}/reactivate", response_model=PersonResponse)
def reactivate_person(person_id: int, db: Session = Depends(get_db)):
    person = person_service.reactivate_person(db, person_id)
    return _to_response(person)


def _to_response(person) -> dict:
    return {
        "id": person.id,
        "name": person.name,
        "email": person.email,
        "company": person.company,
        "is_active": person.is_active,
        "terminated_at": person.terminated_at,
        "notes": person.notes,
        "roles": [
            {"role": pr.role, "is_primary": pr.is_primary}
            for pr in person.person_roles
        ],
        "created_at": person.created_at,
        "updated_at": person.updated_at,
    }
