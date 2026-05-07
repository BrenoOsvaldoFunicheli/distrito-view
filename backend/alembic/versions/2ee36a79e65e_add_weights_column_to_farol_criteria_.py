"""add weights column to farol_criteria for macro

Revision ID: 2ee36a79e65e
Revises: c2b3d4e5f6a7
Create Date: 2026-05-07 08:52:11.243623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2ee36a79e65e'
down_revision: Union[str, Sequence[str], None] = 'c2b3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "farol_criteria",
        sa.Column("weights", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("farol_criteria", "weights")
