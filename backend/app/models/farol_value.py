from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


FAROL_COLORS = ("none", "green", "yellow", "red")


class FarolValue(Base):
    __tablename__ = "farol_values"
    __table_args__ = (
        UniqueConstraint(
            "criterion_id",
            "client_id",
            "week_start",
            name="uq_farol_values_criterion_client_week",
        ),
        UniqueConstraint(
            "criterion_id",
            "project_id",
            "week_start",
            name="uq_farol_values_criterion_project_week",
        ),
        CheckConstraint(
            "(client_id IS NOT NULL AND project_id IS NULL) OR "
            "(client_id IS NULL AND project_id IS NOT NULL)",
            name="ck_farol_values_client_or_project",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    criterion_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("farol_criteria.id", ondelete="CASCADE"),
        nullable=False,
    )
    client_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=True,
    )
    project_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    color: Mapped[str] = mapped_column(String, default="none", nullable=False)
    text_value: Mapped[str | None] = mapped_column(String)
    notes: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
