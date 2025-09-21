"""add_missing_columns_to_embedding_usage

Revision ID: 3379f77e82ac
Revises: 2c6d63a4144c
Create Date: 2025-09-21 16:13:14.404801

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3379f77e82ac'
down_revision = '2c6d63a4144c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to embedding_usage table
    op.add_column('embedding_usage', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('embedding_usage', sa.Column('updated_by', sa.String(), nullable=True))
    
    # Create index on is_deleted column
    op.create_index('ix_embedding_usage_is_deleted', 'embedding_usage', ['is_deleted'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_embedding_usage_is_deleted', table_name='embedding_usage')
    
    # Drop columns
    op.drop_column('embedding_usage', 'updated_by')
    op.drop_column('embedding_usage', 'is_deleted')
