"""create_default_workspace_for_admin

Revision ID: 9e80a0f6aa32
Revises: 964a6dfa3ddd
Create Date: 2025-08-30 15:26:03.310837

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text
import uuid
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '9e80a0f6aa32'
down_revision = '964a6dfa3ddd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get connection
    connection = op.get_bind()
    
    # Find the admin user
    admin_user = connection.execute(
        text("SELECT id FROM users WHERE email = 'admin@demo.com'")
    ).fetchone()
    
    if admin_user:
        admin_id = admin_user[0]
        
        # Create default workspace for admin
        workspace_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Insert default workspace
        connection.execute(
            text("""
                INSERT INTO workspaces (
                    id, name, description, slug, color, icon, 
                    is_private, is_active, is_archived, created_by, 
                    created_at, updated_at, is_deleted
                ) VALUES (
                    :workspace_id, 'My Workspace', 'Default workspace for getting started', 
                    'my-workspace', '#3B82F6', 'briefcase', 
                    false, true, false, :admin_id, 
                    :now, :now, false
                )
            """),
            {
                'workspace_id': workspace_id,
                'admin_id': admin_id,
                'now': now
            }
        )
        
        # Add admin as owner of the workspace
        connection.execute(
            text("""
                INSERT INTO workspace_members (
                    id, workspace_id, user_id, role, permissions, 
                    joined_at, is_active, created_at, updated_at, is_deleted
                ) VALUES (
                    :member_id, :workspace_id, :admin_id, 'owner', 
                    '{"read": true, "write": true, "delete": true, "admin": true}', 
                    :now, true, :now, :now, false
                )
            """),
            {
                'member_id': str(uuid.uuid4()),
                'workspace_id': workspace_id,
                'admin_id': admin_id,
                'now': now
            }
        )


def downgrade() -> None:
    # Get connection
    connection = op.get_bind()
    
    # Find the admin user
    admin_user = connection.execute(
        text("SELECT id FROM users WHERE email = 'admin@demo.com'")
    ).fetchone()
    
    if admin_user:
        admin_id = admin_user[0]
        
        # Delete the default workspace and its members
        connection.execute(
            text("DELETE FROM workspace_members WHERE workspace_id IN (SELECT id FROM workspaces WHERE created_by = :admin_id AND slug = 'my-workspace')"),
            {'admin_id': admin_id}
        )
        
        connection.execute(
            text("DELETE FROM workspaces WHERE created_by = :admin_id AND slug = 'my-workspace'"),
            {'admin_id': admin_id}
        )
