"""unify pm and po into pm/po role

Revision ID: 4144f953bed5
Revises: a8a40d0906a5
Create Date: 2026-05-06 17:51:50.797817

"""
from typing import Sequence, Union

from alembic import op


revision: str = '4144f953bed5'
down_revision: Union[str, Sequence[str], None] = 'a8a40d0906a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge PM and PO roles into a single PM/PO role.

    Strategy:
    1. Ensure PM/PO row exists (rename PO if present, otherwise insert).
    2. In person_roles, drop PM rows for people who already have PO (avoids
       UNIQUE(person_id, role_id) violation), then repoint remaining PM rows.
    3. In contract_roles, just repoint PM rows (no unique constraint on
       (contract_id, role_id), so duplicates are tolerated).
    4. Delete the orphaned PM role row.
    """
    op.execute(
        """
        UPDATE roles
           SET name = 'PM/PO',
               description = 'Product Manager / Product Owner'
         WHERE name = 'PO'
        """
    )
    op.execute(
        """
        INSERT INTO roles (name, description, created_at)
        SELECT 'PM/PO', 'Product Manager / Product Owner', CURRENT_TIMESTAMP
         WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'PM/PO')
        """
    )

    op.execute(
        """
        DELETE FROM person_roles
         WHERE role_id = (SELECT id FROM roles WHERE name = 'PM')
           AND person_id IN (
               SELECT person_id FROM person_roles
                WHERE role_id = (SELECT id FROM roles WHERE name = 'PM/PO')
           )
        """
    )
    op.execute(
        """
        UPDATE person_roles
           SET role_id = (SELECT id FROM roles WHERE name = 'PM/PO')
         WHERE role_id = (SELECT id FROM roles WHERE name = 'PM')
        """
    )

    op.execute(
        """
        UPDATE contract_roles
           SET role_id = (SELECT id FROM roles WHERE name = 'PM/PO')
         WHERE role_id = (SELECT id FROM roles WHERE name = 'PM')
        """
    )

    op.execute("DELETE FROM roles WHERE name = 'PM'")


def downgrade() -> None:
    """Best-effort split: rename PM/PO back to PO and recreate an empty PM row.

    Note: this cannot recover which person_roles / contract_roles were
    originally PM vs PO — all unified rows stay associated with PO.
    """
    op.execute(
        """
        UPDATE roles
           SET name = 'PO',
               description = 'Product Owner'
         WHERE name = 'PM/PO'
        """
    )
    op.execute(
        """
        INSERT INTO roles (name, description, created_at)
        SELECT 'PM', 'Project Manager', CURRENT_TIMESTAMP
         WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'PM')
        """
    )
