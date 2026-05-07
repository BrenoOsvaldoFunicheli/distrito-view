from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ContractRole(Base):
    __tablename__ = "contract_roles"
    __table_args__ = (
        CheckConstraint("allocation_percentage >= 1 AND allocation_percentage <= 100"),
        CheckConstraint("quantity >= 1"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contracts.id"), nullable=False
    )
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    allocation_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(String)

    contract: Mapped["Contract"] = relationship(back_populates="contract_roles")  # noqa: F821
    role: Mapped["Role"] = relationship()  # noqa: F821
    allocations: Mapped[list["Allocation"]] = relationship(back_populates="contract_role")  # noqa: F821
