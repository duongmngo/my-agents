"""add_embedding_usage_tracking_table

Revision ID: 2c6d63a4144c
Revises: e29254eb27cc
Create Date: 2025-09-21 15:27:35.300620

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2c6d63a4144c'
down_revision = 'e29254eb27cc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create embedding_usage table
    op.create_table('embedding_usage',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('workspace_id', sa.String(), nullable=False),
        sa.Column('provider_id', sa.String(), nullable=False),
        sa.Column('model_used', sa.String(length=255), nullable=False),
        sa.Column('tokens_processed', sa.Integer(), nullable=False),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('request_type', sa.String(length=100), nullable=True),
        sa.Column('source_type', sa.String(length=100), nullable=True),
        sa.Column('source_id', sa.String(), nullable=True),
        sa.Column('embedding_dimension', sa.Integer(), nullable=True),
        sa.Column('cost_estimate', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('request_metadata', sa.JSON(), nullable=True),
        sa.Column('used_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['embedding_provider_configs.id'], ),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_embedding_usage_provider_id', 'embedding_usage', ['provider_id'])
    op.create_index('idx_embedding_usage_workspace_id', 'embedding_usage', ['workspace_id'])
    op.create_index('idx_embedding_usage_used_at', 'embedding_usage', ['used_at'])
    op.create_index('idx_embedding_usage_success', 'embedding_usage', ['success'])
    op.create_index('idx_embedding_usage_model_used', 'embedding_usage', ['model_used'])
    op.create_index('idx_embedding_usage_source_type', 'embedding_usage', ['source_type'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_embedding_usage_source_type', table_name='embedding_usage')
    op.drop_index('idx_embedding_usage_model_used', table_name='embedding_usage')
    op.drop_index('idx_embedding_usage_success', table_name='embedding_usage')
    op.drop_index('idx_embedding_usage_used_at', table_name='embedding_usage')
    op.drop_index('idx_embedding_usage_workspace_id', table_name='embedding_usage')
    op.drop_index('idx_embedding_usage_provider_id', table_name='embedding_usage')
    
    # Drop table
    op.drop_table('embedding_usage')
