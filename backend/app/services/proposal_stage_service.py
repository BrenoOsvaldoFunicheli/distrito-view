import re
import unicodedata

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.proposal import Proposal
from app.models.proposal_stage import ProposalStage
from app.schemas.proposal_stage import (
    ProposalStageCreate,
    ProposalStageReorderRequest,
    ProposalStageUpdate,
)


def _slugify(label: str) -> str:
    normalized = unicodedata.normalize("NFKD", label).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", normalized).strip("_").lower()
    return slug or "stage"


def list_stages(db: Session) -> list[ProposalStage]:
    return db.query(ProposalStage).order_by(ProposalStage.position, ProposalStage.id).all()


def get_stage(db: Session, stage_id: int) -> ProposalStage:
    stage = db.query(ProposalStage).filter(ProposalStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    return stage


def get_stage_by_key(db: Session, key: str) -> ProposalStage | None:
    return db.query(ProposalStage).filter(ProposalStage.key == key).first()


def _next_position_before_terminals(db: Session) -> int:
    """Return position right before the first terminal stage."""
    first_terminal = (
        db.query(ProposalStage)
        .filter(ProposalStage.is_terminal.is_(True))
        .order_by(ProposalStage.position)
        .first()
    )
    if first_terminal is None:
        max_pos = db.query(func.max(ProposalStage.position)).scalar() or 0
        return max_pos + 1
    return first_terminal.position


def create_stage(db: Session, data: ProposalStageCreate) -> ProposalStage:
    label = data.label.strip()
    if not label:
        raise HTTPException(status_code=400, detail="Label is required")

    base_key = data.key or _slugify(label)
    key = base_key
    suffix = 2
    while db.query(ProposalStage).filter(ProposalStage.key == key).first():
        key = f"{base_key}_{suffix}"
        suffix += 1

    insert_at = _next_position_before_terminals(db)
    db.query(ProposalStage).filter(ProposalStage.position >= insert_at).update(
        {ProposalStage.position: ProposalStage.position + 1}
    )

    stage = ProposalStage(
        key=key,
        label=label,
        position=insert_at,
        is_terminal=False,
        is_protected=False,
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage


def update_stage(db: Session, stage_id: int, data: ProposalStageUpdate) -> ProposalStage:
    stage = get_stage(db, stage_id)
    if data.label is not None:
        label = data.label.strip()
        if not label:
            raise HTTPException(status_code=400, detail="Label cannot be empty")
        stage.label = label
    db.commit()
    db.refresh(stage)
    return stage


def delete_stage(db: Session, stage_id: int) -> None:
    """Delete a non-protected stage. Move proposals to the previous (non-terminal) stage."""
    stage = get_stage(db, stage_id)
    if stage.is_protected:
        raise HTTPException(status_code=400, detail="Cannot delete a protected stage")

    fallback = (
        db.query(ProposalStage)
        .filter(
            ProposalStage.position < stage.position,
            ProposalStage.is_terminal.is_(False),
        )
        .order_by(ProposalStage.position.desc())
        .first()
    )
    if fallback is None:
        fallback = (
            db.query(ProposalStage)
            .filter(
                ProposalStage.id != stage.id,
                ProposalStage.is_terminal.is_(False),
            )
            .order_by(ProposalStage.position)
            .first()
        )
    if fallback is None:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the last non-terminal stage",
        )

    db.query(Proposal).filter(Proposal.stage == stage.key).update(
        {Proposal.stage: fallback.key}
    )
    db.delete(stage)
    db.query(ProposalStage).filter(ProposalStage.position > stage.position).update(
        {ProposalStage.position: ProposalStage.position - 1}
    )
    db.commit()


def reorder_stages(db: Session, payload: ProposalStageReorderRequest) -> list[ProposalStage]:
    """Reorder non-protected stages. Protected (terminal) stages stay anchored at the end."""
    stages = list_stages(db)
    by_id = {s.id: s for s in stages}

    for item in payload.items:
        if item.id not in by_id:
            raise HTTPException(status_code=404, detail=f"Stage {item.id} not found")
        if by_id[item.id].is_protected:
            raise HTTPException(
                status_code=400,
                detail="Cannot reorder protected stages",
            )
        by_id[item.id].position = item.position

    db.commit()
    return list_stages(db)
