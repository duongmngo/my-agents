"""fix_updated_at_nullable_in_embedding_usage

Revision ID: beee4edfcba6
Revises: ce9cff1d7552
Create Date: 2025-09-21 16:14:50.164999

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'beee4edfcba6'
down_revision = 'ce9cff1d7552'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Fix updated_at column to be nullable
    op.alter_column('embedding_usage', 'updated_at',
                   nullable=True,
                   existing_type=sa.DateTime(timezone=True),
                   existing_server_default=None)


def downgrade() -> None:
    # Make updated_at column not nullable again
    op.alter_column('embedding_usage', 'updated_at',
                   nullable=False,
                   existing_type=sa.DateTime(timezone=True),
                   existing_server_default=None)
