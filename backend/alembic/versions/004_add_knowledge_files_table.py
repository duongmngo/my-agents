"""add_knowledge_files_table

Revision ID: 004
Revises: 94aa112ed09e
Create Date: 2026-03-14 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '94aa112ed09e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create FileStatus enum type using postgresql.ENUM
    filestatus_enum = postgresql.ENUM('pending', 'processing', 'processed', 'failed', 
                                       name='filestatus', create_type=False)
    
    # Check if enum exists and create if not
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'filestatus')"
    ))
    enum_exists = result.scalar()
    
    if not enum_exists:
        filestatus_enum.create(conn)
    
    # Create knowledge_files table
    op.create_table('knowledge_files',
        # Base fields
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        
        # File identification
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        
        # Storage information
        sa.Column('storage_path', sa.String(1000), nullable=False),
        sa.Column('storage_provider', sa.String(50), nullable=False, server_default='minio'),
        sa.Column('content_hash', sa.String(64), nullable=True),
        
        # Processing status
        sa.Column('status', filestatus_enum, nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        
        # Extracted content
        sa.Column('extracted_text', sa.Text(), nullable=True),
        sa.Column('character_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('word_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('page_count', sa.Integer(), nullable=True),
        
        # Embedding statistics
        sa.Column('embedding_stats', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        
        # Organization
        sa.Column('folder_id', sa.String(), nullable=True),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        
        # Ownership (UserOwnedMixin)
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('updated_by', sa.String(), nullable=True),
        
        # Workspace (WorkspaceMixin)
        sa.Column('workspace_id', sa.String(), nullable=False),
        
        # Constraints
        sa.PrimaryKeyConstraint('id', name=op.f('pk_knowledge_files')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_knowledge_files_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['folder_id'], ['folders.id'], name=op.f('fk_knowledge_files_folder_id_folders')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_knowledge_files_created_by_users')),
    )
    
    # Create indexes
    op.create_index(op.f('ix_knowledge_files_id'), 'knowledge_files', ['id'], unique=False)
    op.create_index(op.f('ix_knowledge_files_workspace_id'), 'knowledge_files', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_knowledge_files_folder_id'), 'knowledge_files', ['folder_id'], unique=False)
    op.create_index(op.f('ix_knowledge_files_created_by'), 'knowledge_files', ['created_by'], unique=False)
    op.create_index(op.f('ix_knowledge_files_content_hash'), 'knowledge_files', ['content_hash'], unique=False)
    op.create_index(op.f('ix_knowledge_files_status'), 'knowledge_files', ['status'], unique=False)
    op.create_index(op.f('ix_knowledge_files_is_deleted'), 'knowledge_files', ['is_deleted'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_knowledge_files_is_deleted'), table_name='knowledge_files')
    op.drop_index(op.f('ix_knowledge_files_status'), table_name='knowledge_files')
    op.drop_index(op.f('ix_knowledge_files_content_hash'), table_name='knowledge_files')
    op.drop_index(op.f('ix_knowledge_files_created_by'), table_name='knowledge_files')
    op.drop_index(op.f('ix_knowledge_files_folder_id'), table_name='knowledge_files')
    op.drop_index(op.f('ix_knowledge_files_workspace_id'), table_name='knowledge_files')
    op.drop_index(op.f('ix_knowledge_files_id'), table_name='knowledge_files')
    
    # Drop table
    op.drop_table('knowledge_files')
    
    # Drop FileStatus enum type (if exists and not used elsewhere)
    op.execute("DROP TYPE IF EXISTS filestatus")
