"""add agent_type field

Revision ID: 003
Revises: 002
Create Date: 2026-01-02 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Create AgentType enum
    op.execute("CREATE TYPE agenttype AS ENUM ('default-agent', 'user-agent')")
    
    # Add agent_type column to agents table
    op.add_column('agents', sa.Column('agent_type', 
        postgresql.ENUM('default-agent', 'user-agent', name='agenttype', create_type=False),
        nullable=False,
        server_default='user-agent'
    ))
    
    # Add index for agent_type for better query performance
    op.create_index(op.f('ix_agents_agent_type'), 'agents', ['agent_type'], unique=False)
    
    # Add is_built_in flag for built-in agents
    op.add_column('agents', sa.Column('is_built_in', sa.Boolean(), nullable=False, server_default='false'))
    op.create_index(op.f('ix_agents_is_built_in'), 'agents', ['is_built_in'], unique=False)


def downgrade():
    # Remove indexes
    op.drop_index(op.f('ix_agents_is_built_in'), table_name='agents')
    op.drop_index(op.f('ix_agents_agent_type'), table_name='agents')
    
    # Remove columns
    op.drop_column('agents', 'is_built_in')
    op.drop_column('agents', 'agent_type')
    
    # Drop enum type
    op.execute('DROP TYPE agenttype')
