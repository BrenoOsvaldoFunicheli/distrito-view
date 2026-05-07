"""add proposal_stages and drop fixed stage check

Revision ID: 48e0e947d460
Revises: 68540500c02b
Create Date: 2026-05-06 13:49:21.981109

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '48e0e947d460'
down_revision: Union[str, Sequence[str], None] = '68540500c02b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DEFAULT_STAGES = [
    ("lead", "Lead", 1, False, False),
    ("qualification", "Qualificação", 2, False, False),
    ("proposal_sent", "Proposta Enviada", 3, False, False),
    ("negotiation", "Negociação", 4, False, False),
    ("won", "Ganho", 5, True, True),
    ("lost", "Perdido", 6, True, True),
]


def upgrade() -> None:
    op.create_table(
        'proposal_stages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('is_terminal', sa.Boolean(), nullable=False),
        sa.Column('is_protected', sa.Boolean(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key', name='uq_proposal_stages_key'),
    )

    stages_table = sa.table(
        'proposal_stages',
        sa.column('key', sa.String),
        sa.column('label', sa.String),
        sa.column('position', sa.Integer),
        sa.column('is_terminal', sa.Boolean),
        sa.column('is_protected', sa.Boolean),
    )
    op.bulk_insert(
        stages_table,
        [
            {
                'key': key,
                'label': label,
                'position': position,
                'is_terminal': is_terminal,
                'is_protected': is_protected,
            }
            for (key, label, position, is_terminal, is_protected) in DEFAULT_STAGES
        ],
    )

    with op.batch_alter_table('proposals') as batch:
        batch.drop_constraint('ck_proposals_stage', type_='check')


def downgrade() -> None:
    with op.batch_alter_table('proposals') as batch:
        batch.create_check_constraint(
            'ck_proposals_stage',
            "stage IN ('lead','qualification','proposal_sent','negotiation','won','lost')",
        )
    op.drop_table('proposal_stages')
