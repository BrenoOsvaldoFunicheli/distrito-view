"""farol groups

Revision ID: c2b3d4e5f6a7
Revises: b1a2c3d4e5f6
Create Date: 2026-05-07 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2b3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "b1a2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "farol_groups",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    with op.batch_alter_table("farol_criteria", schema=None) as batch_op:
        batch_op.add_column(sa.Column("group_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_farol_criteria_group_id",
            "farol_groups",
            ["group_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index(
            "ix_farol_criteria_group_id", ["group_id"], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table("farol_criteria", schema=None) as batch_op:
        batch_op.drop_index("ix_farol_criteria_group_id")
        batch_op.drop_constraint("fk_farol_criteria_group_id", type_="foreignkey")
        batch_op.drop_column("group_id")

    op.drop_table("farol_groups")
