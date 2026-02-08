from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Allocation(Base):
    __tablename__ = "allocations"
    __table_args__ = (
        CheckConstraint("allocation_percentage >= 1 AND allocation_percentage <= 100"),
        CheckConstraint("end_date > start_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(Integer, ForeignKey("people.id"), nullable=False)
    contract_role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contract_roles.id"), nullable=False
    )
    allocation_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    person: Mapped["Person"] = relationship(back_populates="allocations")  # noqa: F821
    contract_role: Mapped["ContractRole"] = relationship(back_populates="allocations")  # noqa: F821
