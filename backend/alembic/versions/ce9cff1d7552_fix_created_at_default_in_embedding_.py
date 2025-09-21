"""fix_created_at_default_in_embedding_usage

Revision ID: ce9cff1d7552
Revises: 3379f77e82ac
Create Date: 2025-09-21 16:14:15.036909

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ce9cff1d7552'
down_revision = '3379f77e82ac'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Fix created_at column to have proper default value
    op.alter_column('embedding_usage', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(timezone=True),
                   existing_nullable=False)


def downgrade() -> None:
    # Remove default value from created_at column
    op.alter_column('embedding_usage', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(timezone=True),
                   existing_nullable=False)
