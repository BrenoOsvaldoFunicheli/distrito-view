from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PersonRole(Base):
    __tablename__ = "person_roles"
    __table_args__ = (UniqueConstraint("person_id", "role_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(Integer, ForeignKey("people.id"), nullable=False)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    person: Mapped["Person"] = relationship(back_populates="person_roles")  # noqa: F821
    role: Mapped["Role"] = relationship()  # noqa: F821
