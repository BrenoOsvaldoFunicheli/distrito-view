"""farol values per week

Revision ID: b1a2c3d4e5f6
Revises: 59f5979303c9
Create Date: 2026-05-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1a2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "59f5979303c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CURRENT_WEEK_START = "2026-05-04"


def upgrade() -> None:
    with op.batch_alter_table("farol_values", schema=None) as batch_op:
        batch_op.drop_constraint(
            "uq_farol_values_criterion_client", type_="unique"
        )
        batch_op.add_column(sa.Column("week_start", sa.Date(), nullable=True))

    op.execute(
        f"UPDATE farol_values SET week_start = '{CURRENT_WEEK_START}' "
        "WHERE week_start IS NULL"
    )

    with op.batch_alter_table("farol_values", schema=None) as batch_op:
        batch_op.alter_column("week_start", nullable=False)
        batch_op.create_index(
            "ix_farol_values_week_start", ["week_start"], unique=False
        )
        batch_op.create_unique_constraint(
            "uq_farol_values_criterion_client_week",
            ["criterion_id", "client_id", "week_start"],
        )


def downgrade() -> None:
    with op.batch_alter_table("farol_values", schema=None) as batch_op:
        batch_op.drop_constraint(
            "uq_farol_values_criterion_client_week", type_="unique"
        )
        batch_op.drop_index("ix_farol_values_week_start")
        batch_op.drop_column("week_start")
        batch_op.create_unique_constraint(
            "uq_farol_values_criterion_client",
            ["criterion_id", "client_id"],
        )
