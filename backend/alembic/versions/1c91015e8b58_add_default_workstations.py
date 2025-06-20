"""add_default_workstations

Revision ID: 1c91015e8b58
Revises: 2866c4c1cbf9
Create Date: 2025-06-20 16:46:08.295755

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c91015e8b58'
down_revision = '2866c4c1cbf9'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        INSERT INTO work_stations(id, name, is_active) VALUES
               (1, 'Stanowisko 1', true),
               (2, 'Stanowisko 2', true)
               ON DUPLICATE KEY UPDATE name=VALUES(name), is_active=VALUES(is_active)
    """)


def downgrade() -> None:
    op.execute("DELETE FROM work_stations WHERE id IN (1, 2)")
