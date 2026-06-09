from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserGroupArea(Base):
    __tablename__ = "user_group_areas"
    __table_args__ = (
        UniqueConstraint("group_id", "area", name="uq_user_group_areas_group_area"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("user_groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    area: Mapped[str] = mapped_column(String, nullable=False)

    group: Mapped["UserGroup"] = relationship(back_populates="areas")  # noqa: F821
