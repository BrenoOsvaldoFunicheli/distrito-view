"""farol values can target client or project

Revision ID: e4d5f6a7b8c9
Revises: d3c4e5f6a7b8
Create Date: 2026-05-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4d5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "d3c4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("farol_values", schema=None) as batch_op:
        batch_op.add_column(sa.Column("project_id", sa.Integer(), nullable=True))
        batch_op.alter_column("client_id", existing_type=sa.Integer(), nullable=True)
        batch_op.create_foreign_key(
            "fk_farol_values_project_id",
            "projects",
            ["project_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch_op.create_index(
            "ix_farol_values_project_id", ["project_id"], unique=False
        )
        batch_op.create_unique_constraint(
            "uq_farol_values_criterion_project_week",
            ["criterion_id", "project_id", "week_start"],
        )
        batch_op.create_check_constraint(
            "ck_farol_values_client_or_project",
            "(client_id IS NOT NULL AND project_id IS NULL) OR "
            "(client_id IS NULL AND project_id IS NOT NULL)",
        )


def downgrade() -> None:
    with op.batch_alter_table("farol_values", schema=None) as batch_op:
        batch_op.drop_constraint(
            "ck_farol_values_client_or_project", type_="check"
        )
        batch_op.drop_constraint(
            "uq_farol_values_criterion_project_week", type_="unique"
        )
        batch_op.drop_index("ix_farol_values_project_id")
        batch_op.drop_constraint(
            "fk_farol_values_project_id", type_="foreignkey"
        )
        batch_op.alter_column(
            "client_id", existing_type=sa.Integer(), nullable=False
        )
        batch_op.drop_column("project_id")
