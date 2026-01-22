"""add_conversation_starters_to_agent

Revision ID: 712d778c66fc
Revises: 003
Create Date: 2026-01-19 23:11:34.173625

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '712d778c66fc'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add conversation_starters column to agents table
    op.add_column('agents', 
        sa.Column('conversation_starters', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )


def downgrade() -> None:
    # Remove conversation_starters column from agents table
    op.drop_column('agents', 'conversation_starters')
