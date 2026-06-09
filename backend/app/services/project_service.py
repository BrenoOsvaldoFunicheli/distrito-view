from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.contract import Contract
from app.models.project import PROJECT_STATUSES, Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def _validate_status(status: str) -> None:
    if status not in PROJECT_STATUSES:
        raise HTTPException(
            status_code=400, detail=f"Invalid status: {status}"
        )


def _validate_dates(start, end) -> None:
    if start and end and end < start:
        raise HTTPException(
            status_code=400,
            detail="end_date cannot be before start_date",
        )


def _get_contract(db: Session, contract_id: int) -> Contract:
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


def get_project(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def list_projects_for_contract(
    db: Session, contract_id: int
) -> list[Project]:
    _get_contract(db, contract_id)
    return (
        db.query(Project)
        .filter(Project.contract_id == contract_id)
        .order_by(Project.name)
        .all()
    )


def list_all_projects(db: Session) -> list[dict]:
    """Todos os projetos com nome do contrato e cliente."""
    rows = (
        db.query(Project)
        .options(joinedload(Project.contract).joinedload(Contract.client))
        .order_by(Project.name)
        .all()
    )
    result: list[dict] = []
    for p in rows:
        result.append(
            {
                "id": p.id,
                "contract_id": p.contract_id,
                "name": p.name,
                "description": p.description,
                "start_date": p.start_date,
                "end_date": p.end_date,
                "status": p.status,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
                "contract_name": p.contract.name,
                "client_id": p.contract.client_id,
                "client_name": p.contract.client.name,
            }
        )
    return result


def create_project(
    db: Session, contract_id: int, data: ProjectCreate
) -> Project:
    _get_contract(db, contract_id)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    _validate_status(data.status)
    _validate_dates(data.start_date, data.end_date)
    project = Project(
        contract_id=contract_id,
        name=name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        status=data.status,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(
    db: Session, project_id: int, data: ProjectUpdate
) -> Project:
    project = get_project(db, project_id)
    payload = data.model_dump(exclude_unset=True)
    if "name" in payload:
        name = (payload["name"] or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        payload["name"] = name
    if "status" in payload:
        _validate_status(payload["status"])
    new_start = payload.get("start_date", project.start_date)
    new_end = payload.get("end_date", project.end_date)
    _validate_dates(new_start, new_end)
    for key, value in payload.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> None:
    project = get_project(db, project_id)
    db.delete(project)
    db.commit()
