from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.person import Person
from app.models.person_role import PersonRole
from app.schemas.person import PersonCreate, PersonUpdate


def list_people(
    db: Session, is_active: bool | None = None, role_id: int | None = None
) -> list[Person]:
    query = db.query(Person).options(joinedload(Person.person_roles).joinedload(PersonRole.role))
    if is_active is not None:
        query = query.filter(Person.is_active == is_active)
    if role_id is not None:
        query = query.join(Person.person_roles).filter(PersonRole.role_id == role_id)
    return query.order_by(Person.name).all()


def get_person(db: Session, person_id: int) -> Person:
    person = (
        db.query(Person)
        .options(joinedload(Person.person_roles).joinedload(PersonRole.role))
        .filter(Person.id == person_id)
        .first()
    )
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


def create_person(db: Session, data: PersonCreate) -> Person:
    person = Person(name=data.name, email=data.email, notes=data.notes)
    db.add(person)
    db.flush()
    for rid in data.role_ids:
        pr = PersonRole(
            person_id=person.id,
            role_id=rid,
            is_primary=(rid == data.primary_role_id),
        )
        db.add(pr)
    db.commit()
    return get_person(db, person.id)


def update_person(db: Session, person_id: int, data: PersonUpdate) -> Person:
    person = get_person(db, person_id)
    update_data = data.model_dump(exclude_unset=True)
    role_ids = update_data.pop("role_ids", None)
    primary_role_id = update_data.pop("primary_role_id", None)

    for key, value in update_data.items():
        setattr(person, key, value)

    if role_ids is not None:
        db.query(PersonRole).filter(PersonRole.person_id == person_id).delete()
        for rid in role_ids:
            pr = PersonRole(
                person_id=person_id,
                role_id=rid,
                is_primary=(rid == primary_role_id),
            )
            db.add(pr)

    db.commit()
    return get_person(db, person_id)


def delete_person(db: Session, person_id: int) -> None:
    person = get_person(db, person_id)
    person.is_active = False
    db.commit()
