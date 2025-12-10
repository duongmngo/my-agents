"""initial_schema_with_defaults

Revision ID: 001
Revises: 
Create Date: 2025-12-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid
from datetime import datetime
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE foldercategory AS ENUM ('FILES', 'NOTES')")
    op.execute("CREATE TYPE noteformat AS ENUM ('plain_text', 'markdown', 'html', 'rich_text')")
    op.execute("CREATE TYPE messagetype AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'AI_RESPONSE')")
    op.execute("CREATE TYPE conversationtype AS ENUM ('DIRECT', 'GROUP', 'AI_CHAT')")
    op.execute("CREATE TYPE agentstatus AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED')")
    op.execute("CREATE TYPE embeddingprovidertype AS ENUM ('OPENAI', 'AZURE', 'HUGGINGFACE')")
    
    # ==================== USERS TABLE ====================
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        
        # Authentication fields
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        
        # Profile fields
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        
        # Status fields
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('role', sa.String(50), nullable=False, server_default='user'),
        
        # Timestamps
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('password_changed_at', sa.DateTime(timezone=True), nullable=True),
        
        # Settings
        sa.Column('preferences', sa.Text(), nullable=True),
        sa.Column('timezone', sa.String(50), nullable=False, server_default='UTC'),
        sa.Column('language', sa.String(10), nullable=False, server_default='en'),
        
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users'))
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)
    op.create_index(op.f('ix_users_is_deleted'), 'users', ['is_deleted'], unique=False)
    
    # ==================== WORKSPACES TABLE ====================
    op.create_table('workspaces',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('updated_by', sa.String(), nullable=True),
        
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('slug', sa.String(100), nullable=False),
        
        # Visual settings
        sa.Column('color', sa.String(7), nullable=False, server_default='#3B82F6'),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        
        # Settings
        sa.Column('is_private', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('settings', sa.Text(), nullable=True),
        
        # Status
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_workspaces_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_workspaces'))
    )
    op.create_index(op.f('ix_workspaces_id'), 'workspaces', ['id'], unique=False)
    op.create_index(op.f('ix_workspaces_slug'), 'workspaces', ['slug'], unique=False)
    op.create_index(op.f('ix_workspaces_is_deleted'), 'workspaces', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_workspaces_created_by'), 'workspaces', ['created_by'], unique=False)
    
    # ==================== WORKSPACE_MEMBERS TABLE ====================
    op.create_table('workspace_members',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        
        sa.Column('workspace_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='member'),
        sa.Column('permissions', sa.Text(), nullable=True),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_workspace_members_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_workspace_members_user_id_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_workspace_members'))
    )
    op.create_index(op.f('ix_workspace_members_id'), 'workspace_members', ['id'], unique=False)
    op.create_index(op.f('ix_workspace_members_is_deleted'), 'workspace_members', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_workspace_members_workspace_id'), 'workspace_members', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_workspace_members_user_id'), 'workspace_members', ['user_id'], unique=False)
    
    # ==================== FOLDERS TABLE ====================
    op.create_table('folders',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.Column('workspace_id', sa.String(), nullable=False),
        
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', postgresql.ENUM('FILES', 'NOTES', name='foldercategory', create_type=False), nullable=False, server_default='FILES'),
        
        # Hierarchy
        sa.Column('parent_id', sa.String(), nullable=True),
        sa.Column('path', sa.String(1000), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False, server_default='0'),
        
        # Visual settings
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('icon', sa.String(100), nullable=True),
        
        # Settings
        sa.Column('is_private', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('settings', sa.Text(), nullable=True),
        
        # Status
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        
        sa.ForeignKeyConstraint(['parent_id'], ['folders.id'], name=op.f('fk_folders_parent_id_folders')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_folders_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_folders_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_folders'))
    )
    op.create_index(op.f('ix_folders_id'), 'folders', ['id'], unique=False)
    op.create_index(op.f('ix_folders_is_deleted'), 'folders', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_folders_workspace_id'), 'folders', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_folders_created_by'), 'folders', ['created_by'], unique=False)
    op.create_index(op.f('ix_folders_parent_id'), 'folders', ['parent_id'], unique=False)
    op.create_index(op.f('ix_folders_path'), 'folders', ['path'], unique=False)
    
    # ==================== FILES TABLE ====================
    op.create_table('files',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.Column('workspace_id', sa.String(), nullable=False),
        
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('original_name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        
        # File properties
        sa.Column('file_type', sa.String(100), nullable=False),
        sa.Column('file_extension', sa.String(10), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        
        # Storage information
        sa.Column('storage_path', sa.String(1000), nullable=False),
        sa.Column('storage_bucket', sa.String(100), nullable=False),
        sa.Column('storage_key', sa.String(500), nullable=False),
        
        # Content information
        sa.Column('content_hash', sa.String(64), nullable=True),
        sa.Column('encoding', sa.String(50), nullable=True),
        
        # Processing status
        sa.Column('processing_status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('processing_error', sa.Text(), nullable=True),
        
        # Metadata
        sa.Column('file_metadata', sa.Text(), nullable=True),
        
        # Access control
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('access_permissions', sa.Text(), nullable=True),
        
        # Organization
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        
        # Version control
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('parent_file_id', sa.String(), nullable=True),
        
        sa.Column('folder_id', sa.String(), nullable=True),
        
        sa.ForeignKeyConstraint(['parent_file_id'], ['files.id'], name=op.f('fk_files_parent_file_id_files')),
        sa.ForeignKeyConstraint(['folder_id'], ['folders.id'], name=op.f('fk_files_folder_id_folders')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_files_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_files_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_files'))
    )
    op.create_index(op.f('ix_files_id'), 'files', ['id'], unique=False)
    op.create_index(op.f('ix_files_is_deleted'), 'files', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_files_workspace_id'), 'files', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_files_created_by'), 'files', ['created_by'], unique=False)
    op.create_index(op.f('ix_files_content_hash'), 'files', ['content_hash'], unique=False)
    
    # ==================== NOTES TABLE ====================
    op.create_table('notes',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.Column('workspace_id', sa.String(), nullable=False),
        
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('excerpt', sa.String(500), nullable=True),
        
        # Content format and properties
        sa.Column('format', postgresql.ENUM('plain_text', 'markdown', 'html', 'rich_text', name='noteformat', create_type=False), nullable=False, server_default='markdown'),
        sa.Column('word_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('character_count', sa.Integer(), nullable=False, server_default='0'),
        
        # Organization
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        
        # Status and visibility
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_template', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        
        # Access control
        sa.Column('access_permissions', sa.Text(), nullable=True),
        
        # Settings and metadata
        sa.Column('settings', sa.Text(), nullable=True),
        sa.Column('note_metadata', sa.Text(), nullable=True),
        
        # Embedding statistics
        sa.Column('embedding_stats', sa.JSON(), nullable=True),
        
        sa.Column('folder_id', sa.String(), nullable=True),
        
        sa.ForeignKeyConstraint(['folder_id'], ['folders.id'], name=op.f('fk_notes_folder_id_folders')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_notes_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_notes_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_notes'))
    )
    op.create_index(op.f('ix_notes_id'), 'notes', ['id'], unique=False)
    op.create_index(op.f('ix_notes_is_deleted'), 'notes', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_notes_workspace_id'), 'notes', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_notes_created_by'), 'notes', ['created_by'], unique=False)
    
    # ==================== AGENTS TABLE ====================
    op.create_table('agents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('workspace_id', sa.String(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        
        # Basic information
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        
        # Agent properties
        sa.Column('status', postgresql.ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED', name='agentstatus', create_type=False), nullable=False, server_default='ACTIVE'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        
        # AI Configuration
        sa.Column('ai_model', sa.String(100), nullable=False, server_default='gpt-4'),
        sa.Column('temperature', sa.String(10), nullable=False, server_default='0.7'),
        sa.Column('max_tokens', sa.Integer(), nullable=True),
        
        # Agent capabilities and tools
        sa.Column('capabilities', sa.JSON(), nullable=True),
        sa.Column('tools', sa.JSON(), nullable=True),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        
        # Visual representation
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        
        # Usage statistics
        sa.Column('conversation_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('message_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_tokens_used', sa.Integer(), nullable=False, server_default='0'),
        
        # Version control
        sa.Column('version', sa.String(20), nullable=False, server_default='1.0.0'),
        sa.Column('parent_agent_id', sa.String(), nullable=True),
        
        sa.ForeignKeyConstraint(['parent_agent_id'], ['agents.id'], name=op.f('fk_agents_parent_agent_id_agents')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_agents_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_agents_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_agents'))
    )
    op.create_index(op.f('ix_agents_id'), 'agents', ['id'], unique=False)
    op.create_index(op.f('ix_agents_is_deleted'), 'agents', ['is_deleted'], unique=False)
    
    # ==================== AGENT_TEMPLATES TABLE ====================
    op.create_table('agent_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('workspace_id', sa.String(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('template_config', sa.JSON(), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_agent_templates_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_agent_templates_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_agent_templates'))
    )
    op.create_index(op.f('ix_agent_templates_id'), 'agent_templates', ['id'], unique=False)
    op.create_index(op.f('ix_agent_templates_is_deleted'), 'agent_templates', ['is_deleted'], unique=False)
    
    # ==================== CONVERSATIONS TABLE ====================
    op.create_table('conversations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('workspace_id', sa.String(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        
        sa.Column('title', sa.String(500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        
        # Conversation properties
        sa.Column('type', postgresql.ENUM('DIRECT', 'GROUP', 'AI_CHAT', name='conversationtype', create_type=False), nullable=False, server_default='DIRECT'),
        sa.Column('is_private', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        
        # Settings
        sa.Column('settings', sa.Text(), nullable=True),
        
        # AI-specific settings
        sa.Column('ai_model', sa.String(100), nullable=True),
        sa.Column('ai_system_prompt', sa.Text(), nullable=True),
        sa.Column('ai_temperature', sa.String(), nullable=True),
        
        # Agent integration
        sa.Column('agent_id', sa.String(), nullable=True),
        
        # Statistics
        sa.Column('message_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('participant_count', sa.Integer(), nullable=False, server_default='0'),
        
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], name=op.f('fk_conversations_agent_id_agents')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_conversations_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_conversations_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_conversations'))
    )
    op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)
    op.create_index(op.f('ix_conversations_is_deleted'), 'conversations', ['is_deleted'], unique=False)
    
    # ==================== CONVERSATION_PARTICIPANTS TABLE ====================
    op.create_table('conversation_participants',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        
        sa.Column('conversation_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='participant'),
        sa.Column('permissions', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_muted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_read_message_id', sa.String(), nullable=True),
        sa.Column('unread_count', sa.Integer(), nullable=False, server_default='0'),
        
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], name=op.f('fk_conversation_participants_conversation_id_conversations')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_conversation_participants_user_id_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_conversation_participants'))
    )
    op.create_index(op.f('ix_conversation_participants_id'), 'conversation_participants', ['id'], unique=False)
    op.create_index(op.f('ix_conversation_participants_is_deleted'), 'conversation_participants', ['is_deleted'], unique=False)
    
    # ==================== MESSAGES TABLE ====================
    op.create_table('messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('workspace_id', sa.String(), nullable=False),
        
        sa.Column('content', sa.Text(), nullable=True),
        
        # Message properties
        sa.Column('type', postgresql.ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'AI_RESPONSE', name='messagetype', create_type=False), nullable=False, server_default='TEXT'),
        sa.Column('is_edited', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        
        # Reply and threading
        sa.Column('reply_to_message_id', sa.String(), nullable=True),
        sa.Column('thread_id', sa.String(), nullable=True),
        
        # Attachments and metadata
        sa.Column('attachments', sa.Text(), nullable=True),
        sa.Column('message_metadata', sa.Text(), nullable=True),
        
        # AI-specific fields
        sa.Column('ai_model', sa.String(100), nullable=True),
        sa.Column('ai_prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('ai_completion_tokens', sa.Integer(), nullable=True),
        
        sa.Column('conversation_id', sa.String(), nullable=False),
        sa.Column('sender_id', sa.String(), nullable=True),
        
        sa.ForeignKeyConstraint(['reply_to_message_id'], ['messages.id'], name=op.f('fk_messages_reply_to_message_id_messages')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_messages_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], name=op.f('fk_messages_conversation_id_conversations')),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], name=op.f('fk_messages_sender_id_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_messages'))
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)
    op.create_index(op.f('ix_messages_is_deleted'), 'messages', ['is_deleted'], unique=False)
    
    # ==================== EMBEDDING_PROVIDER_CONFIGS TABLE ====================
    op.create_table('embedding_provider_configs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.Column('workspace_id', sa.String(), nullable=False),
        
        # Provider identification
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('provider_type', postgresql.ENUM('OPENAI', 'AZURE', 'HUGGINGFACE', name='embeddingprovidertype', create_type=False), nullable=False),
        
        # Provider status
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        
        # Provider configuration
        sa.Column('config', sa.JSON(), nullable=False),
        
        # Metadata
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('version', sa.String(50), nullable=True),
        sa.Column('last_used', sa.String(), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        
        # Performance metrics
        sa.Column('average_latency', sa.Integer(), nullable=True),
        sa.Column('error_rate', sa.Integer(), nullable=True),
        sa.Column('total_tokens_processed', sa.Integer(), nullable=False, server_default='0'),
        
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_embedding_provider_configs_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_embedding_provider_configs_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_embedding_provider_configs'))
    )
    op.create_index('idx_embedding_provider_configs_workspace_id', 'embedding_provider_configs', ['workspace_id'])
    op.create_index('idx_embedding_provider_configs_provider_type', 'embedding_provider_configs', ['provider_type'])
    op.create_index('idx_embedding_provider_configs_is_active', 'embedding_provider_configs', ['is_active'])
    op.create_index('idx_embedding_provider_configs_created_at', 'embedding_provider_configs', ['created_at'])
    op.create_index(op.f('ix_embedding_provider_configs_id'), 'embedding_provider_configs', ['id'], unique=False)
    op.create_index(op.f('ix_embedding_provider_configs_is_deleted'), 'embedding_provider_configs', ['is_deleted'], unique=False)
    
    # ==================== WORKSPACE_EMBEDDING_SETTINGS TABLE ====================
    op.create_table('workspace_embedding_settings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('workspace_id', sa.String(), nullable=False),
        
        # General settings
        sa.Column('auto_rotate', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('fallback_provider_id', sa.String(), nullable=True),
        
        # Performance settings
        sa.Column('batch_size', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('retry_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('timeout', sa.Integer(), nullable=False, server_default='30000'),
        
        # Advanced settings
        sa.Column('enable_caching', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('cache_ttl', sa.Integer(), nullable=False, server_default='3600'),
        sa.Column('enable_monitoring', sa.Boolean(), nullable=False, server_default='true'),
        
        sa.ForeignKeyConstraint(['fallback_provider_id'], ['embedding_provider_configs.id'], name=op.f('fk_workspace_embedding_settings_fallback_provider_id_embedding_provider_configs')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_workspace_embedding_settings_workspace_id_workspaces')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_workspace_embedding_settings')),
        sa.UniqueConstraint('workspace_id', name=op.f('uq_workspace_embedding_settings_workspace_id'))
    )
    op.create_index('idx_workspace_embedding_settings_workspace_id', 'workspace_embedding_settings', ['workspace_id'])
    op.create_index(op.f('ix_workspace_embedding_settings_id'), 'workspace_embedding_settings', ['id'], unique=False)
    op.create_index(op.f('ix_workspace_embedding_settings_is_deleted'), 'workspace_embedding_settings', ['is_deleted'], unique=False)
    
    # ==================== EMBEDDING_USAGE TABLE ====================
    op.create_table('embedding_usage',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('workspace_id', sa.String(), nullable=False),
        
        # Provider reference
        sa.Column('provider_id', sa.String(), nullable=False),
        
        # Usage details
        sa.Column('model_used', sa.String(255), nullable=False),
        sa.Column('tokens_processed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False, server_default='true'),
        
        # Request context
        sa.Column('request_type', sa.String(100), nullable=True),
        sa.Column('source_type', sa.String(100), nullable=True),
        sa.Column('source_id', sa.String(), nullable=True),
        
        # Performance metrics
        sa.Column('embedding_dimension', sa.Integer(), nullable=True),
        sa.Column('cost_estimate', sa.Float(), nullable=True),
        
        # Metadata
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('request_metadata', sa.JSON(), nullable=True),
        
        # Timestamps
        sa.Column('used_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        sa.ForeignKeyConstraint(['provider_id'], ['embedding_provider_configs.id'], name=op.f('fk_embedding_usage_provider_id_embedding_provider_configs')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name=op.f('fk_embedding_usage_workspace_id_workspaces')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_embedding_usage_created_by_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_embedding_usage'))
    )
    op.create_index('idx_embedding_usage_provider_id', 'embedding_usage', ['provider_id'])
    op.create_index('idx_embedding_usage_workspace_id', 'embedding_usage', ['workspace_id'])
    op.create_index('idx_embedding_usage_used_at', 'embedding_usage', ['used_at'])
    op.create_index('idx_embedding_usage_success', 'embedding_usage', ['success'])
    op.create_index('idx_embedding_usage_model_used', 'embedding_usage', ['model_used'])
    op.create_index('idx_embedding_usage_source_type', 'embedding_usage', ['source_type'])
    op.create_index(op.f('ix_embedding_usage_id'), 'embedding_usage', ['id'], unique=False)
    op.create_index(op.f('ix_embedding_usage_is_deleted'), 'embedding_usage', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_embedding_usage_created_by'), 'embedding_usage', ['created_by'], unique=False)
    
    # ==================== INSERT DEFAULT DATA ====================
    
    # Generate IDs
    admin_id = str(uuid.uuid4())
    workspace_id = str(uuid.uuid4())
    notes_folder_id = str(uuid.uuid4())
    files_folder_id = str(uuid.uuid4())
    workspace_member_id = str(uuid.uuid4())
    
    # Hash the default password
    hashed_password = pwd_context.hash("admin123")
    
    # Insert default admin user
    op.execute(f"""
        INSERT INTO users (
            id, email, username, hashed_password, first_name, last_name,
            is_active, is_verified, role, timezone, language,
            created_at, updated_at, is_deleted
        ) VALUES (
            '{admin_id}',
            'admin@example.com',
            'admin',
            '{hashed_password}',
            'Admin',
            'User',
            true,
            true,
            'admin',
            'UTC',
            'en',
            now(),
            now(),
            false
        )
    """)
    
    # Insert default workspace
    op.execute(f"""
        INSERT INTO workspaces (
            id, name, description, slug, color, is_private, is_active, is_archived,
            created_by, created_at, updated_at, is_deleted
        ) VALUES (
            '{workspace_id}',
            'Default Workspace',
            'Default workspace for admin user',
            'default-workspace',
            '#3B82F6',
            false,
            true,
            false,
            '{admin_id}',
            now(),
            now(),
            false
        )
    """)
    
    # Insert workspace membership for admin
    op.execute(f"""
        INSERT INTO workspace_members (
            id, workspace_id, user_id, role, is_active, joined_at,
            created_at, updated_at, is_deleted
        ) VALUES (
            '{workspace_member_id}',
            '{workspace_id}',
            '{admin_id}',
            'owner',
            true,
            now(),
            now(),
            now(),
            false
        )
    """)
    
    # Insert default Notes folder
    op.execute(f"""
        INSERT INTO folders (
            id, name, description, category, parent_id, path, level,
            is_private, is_pinned, is_archived,
            workspace_id, created_by, created_at, updated_at, is_deleted
        ) VALUES (
            '{notes_folder_id}',
            'Notes',
            'Default folder for notes',
            'NOTES',
            NULL,
            '/Notes',
            0,
            false,
            true,
            false,
            '{workspace_id}',
            '{admin_id}',
            now(),
            now(),
            false
        )
    """)
    
    # Insert default Files folder
    op.execute(f"""
        INSERT INTO folders (
            id, name, description, category, parent_id, path, level,
            is_private, is_pinned, is_archived,
            workspace_id, created_by, created_at, updated_at, is_deleted
        ) VALUES (
            '{files_folder_id}',
            'Files',
            'Default folder for files',
            'FILES',
            NULL,
            '/Files',
            0,
            false,
            true,
            false,
            '{workspace_id}',
            '{admin_id}',
            now(),
            now(),
            false
        )
    """)


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_table('embedding_usage')
    op.drop_table('workspace_embedding_settings')
    op.drop_table('embedding_provider_configs')
    op.drop_table('messages')
    op.drop_table('conversation_participants')
    op.drop_table('conversations')
    op.drop_table('agent_templates')
    op.drop_table('agents')
    op.drop_table('notes')
    op.drop_table('files')
    op.drop_table('folders')
    op.drop_table('workspace_members')
    op.drop_table('workspaces')
    op.drop_table('users')
    
    # Drop enum types
    op.execute("DROP TYPE IF EXISTS embeddingprovidertype")
    op.execute("DROP TYPE IF EXISTS agentstatus")
    op.execute("DROP TYPE IF EXISTS conversationtype")
    op.execute("DROP TYPE IF EXISTS messagetype")
    op.execute("DROP TYPE IF EXISTS noteformat")
    op.execute("DROP TYPE IF EXISTS foldercategory")
