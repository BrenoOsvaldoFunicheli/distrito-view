from datetime import datetime

from sqlalchemy import (
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
            "criterion_id", "client_id", name="uq_farol_values_criterion_client"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    criterion_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("farol_criteria.id", ondelete="CASCADE"),
        nullable=False,
    )
    client_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )
    color: Mapped[str] = mapped_column(String, default="none", nullable=False)
    text_value: Mapped[str | None] = mapped_column(String)
    notes: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
