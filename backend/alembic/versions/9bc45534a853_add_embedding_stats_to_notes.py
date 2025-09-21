"""add_embedding_stats_to_notes

Revision ID: 9bc45534a853
Revises: beee4edfcba6
Create Date: 2025-09-21 16:21:30.843412

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9bc45534a853'
down_revision = 'beee4edfcba6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add embedding statistics columns to notes table
    op.add_column('notes', sa.Column('embedding_generated', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('notes', sa.Column('embedding_dimension', sa.Integer(), nullable=True))
    op.add_column('notes', sa.Column('embedding_model', sa.String(255), nullable=True))
    op.add_column('notes', sa.Column('embedding_provider', sa.String(100), nullable=True))
    op.add_column('notes', sa.Column('embedding_latency_ms', sa.Integer(), nullable=True))
    op.add_column('notes', sa.Column('embedding_tokens_processed', sa.Integer(), nullable=True))
    op.add_column('notes', sa.Column('embedding_generated_at', sa.DateTime(), nullable=True))
    op.add_column('notes', sa.Column('embedding_cost_estimate', sa.Float(), nullable=True))
    
    # Create index on embedding_generated for faster queries
    op.create_index('ix_notes_embedding_generated', 'notes', ['embedding_generated'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_notes_embedding_generated', table_name='notes')
    
    # Drop columns
    op.drop_column('notes', 'embedding_cost_estimate')
    op.drop_column('notes', 'embedding_generated_at')
    op.drop_column('notes', 'embedding_tokens_processed')
    op.drop_column('notes', 'embedding_latency_ms')
    op.drop_column('notes', 'embedding_provider')
    op.drop_column('notes', 'embedding_model')
    op.drop_column('notes', 'embedding_dimension')
    op.drop_column('notes', 'embedding_generated')
