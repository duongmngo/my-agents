"""replace_embedding_columns_with_json_in_notes

Revision ID: a87e5993cbc0
Revises: 9bc45534a853
Create Date: 2025-09-21 16:24:28.573054

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a87e5993cbc0'
down_revision = '9bc45534a853'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # First, add the new JSON column
    op.add_column('notes', sa.Column('embedding_stats', sa.JSON(), nullable=True))
    
    # Migrate existing data from individual columns to JSON
    op.execute("""
        UPDATE notes 
        SET embedding_stats = jsonb_build_object(
            'generated', embedding_generated,
            'dimension', embedding_dimension,
            'model', embedding_model,
            'provider', embedding_provider,
            'latency_ms', embedding_latency_ms,
            'tokens_processed', embedding_tokens_processed,
            'generated_at', embedding_generated_at::text,
            'cost_estimate', embedding_cost_estimate
        )
        WHERE embedding_generated = true;
    """)
    
    # Set embedding_stats to null for notes without embeddings
    op.execute("""
        UPDATE notes 
        SET embedding_stats = NULL
        WHERE embedding_generated = false OR embedding_generated IS NULL;
    """)
    
    # Drop the individual columns
    op.drop_index('ix_notes_embedding_generated', table_name='notes')
    op.drop_column('notes', 'embedding_cost_estimate')
    op.drop_column('notes', 'embedding_generated_at')
    op.drop_column('notes', 'embedding_tokens_processed')
    op.drop_column('notes', 'embedding_latency_ms')
    op.drop_column('notes', 'embedding_provider')
    op.drop_column('notes', 'embedding_model')
    op.drop_column('notes', 'embedding_dimension')
    op.drop_column('notes', 'embedding_generated')


def downgrade() -> None:
    # Add back the individual columns
    op.add_column('notes', sa.Column('embedding_generated', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('notes', sa.Column('embedding_dimension', sa.Integer(), nullable=True))
    op.add_column('notes', sa.Column('embedding_model', sa.String(255), nullable=True))
    op.add_column('notes', sa.Column('embedding_provider', sa.String(100), nullable=True))
    op.add_column('notes', sa.Column('embedding_latency_ms', sa.Integer(), nullable=True))
    op.add_column('notes', sa.Column('embedding_tokens_processed', sa.Integer(), nullable=True))
    op.add_column('notes', sa.Column('embedding_generated_at', sa.DateTime(), nullable=True))
    op.add_column('notes', sa.Column('embedding_cost_estimate', sa.Float(), nullable=True))
    
    # Migrate data back from JSON to individual columns
    op.execute("""
        UPDATE notes 
        SET 
            embedding_generated = COALESCE((embedding_stats->>'generated')::boolean, false),
            embedding_dimension = (embedding_stats->>'dimension')::integer,
            embedding_model = embedding_stats->>'model',
            embedding_provider = embedding_stats->>'provider',
            embedding_latency_ms = (embedding_stats->>'latency_ms')::integer,
            embedding_tokens_processed = (embedding_stats->>'tokens_processed')::integer,
            embedding_generated_at = (embedding_stats->>'generated_at')::timestamp,
            embedding_cost_estimate = (embedding_stats->>'cost_estimate')::float
        WHERE embedding_stats IS NOT NULL;
    """)
    
    # Create index
    op.create_index('ix_notes_embedding_generated', 'notes', ['embedding_generated'])
