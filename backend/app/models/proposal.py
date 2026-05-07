from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

TERMINAL_STAGES = ("won", "lost")


class Proposal(Base):
    __tablename__ = "proposals"
    __table_args__ = (Index("ix_proposals_stage", "stage"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String)
    contact_email: Mapped[str | None] = mapped_column(String)
    estimated_value: Mapped[float | None] = mapped_column(Float)
    expected_close_date: Mapped[date | None] = mapped_column(Date)
    expected_start_date: Mapped[date | None] = mapped_column(Date)
    source: Mapped[str | None] = mapped_column(String)
    notes: Mapped[str | None] = mapped_column(String)
    stage: Mapped[str] = mapped_column(String, default="lead", nullable=False)
    lost_reason: Mapped[str | None] = mapped_column(String)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    client_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    contract_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    client: Mapped["Client | None"] = relationship()  # noqa: F821
    contract: Mapped["Contract | None"] = relationship()  # noqa: F821
