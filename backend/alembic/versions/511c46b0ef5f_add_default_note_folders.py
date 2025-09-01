"""add_default_note_folders

Revision ID: 511c46b0ef5f
Revises: 872a740bc11d
Create Date: 2025-08-31 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '511c46b0ef5f'
down_revision = '872a740bc11d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get database connection
    connection = op.get_bind()
    
    # Get all workspaces
    workspaces = connection.execute(
        sa.text("SELECT id, created_by FROM workspaces WHERE is_deleted = false")
    ).fetchall()
    
    for workspace in workspaces:
        workspace_id = workspace[0]
        created_by = workspace[1]
        
        # Check if workspace already has the new note folders
        existing_folders = connection.execute(
            sa.text("""
                SELECT name FROM folders 
                WHERE workspace_id = :workspace_id 
                AND category = 'NOTES' 
                AND is_deleted = false
            """),
            {"workspace_id": workspace_id}
        ).fetchall()
        
        existing_folder_names = [folder[0] for folder in existing_folders]
        
        # Add Meeting Notes if it doesn't exist
        if "Meeting Notes" not in existing_folder_names:
            meeting_notes_id = str(uuid.uuid4())
            connection.execute(
                sa.text("""
                    INSERT INTO folders (
                        id, name, description, category, workspace_id, created_by,
                        path, level, color, icon, is_private, is_pinned, is_archived,
                        created_at, updated_at, is_deleted
                    ) VALUES (
                        :id, :name, :description, :category, :workspace_id, :created_by,
                        :path, :level, :color, :icon, :is_private, :is_pinned, :is_archived,
                        :created_at, :updated_at, :is_deleted
                    )
                """),
                {
                    "id": meeting_notes_id,
                    "name": "Meeting Notes",
                    "description": "Store meeting notes and discussions",
                    "category": "NOTES",
                    "workspace_id": workspace_id,
                    "created_by": created_by,
                    "path": "/Meeting Notes",
                    "level": 0,
                    "color": "#10B981",
                    "icon": "sticky-note",
                    "is_private": False,
                    "is_pinned": False,
                    "is_archived": False,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "is_deleted": False
                }
            )
        
        # Add Technical Notes if it doesn't exist
        if "Technical Notes" not in existing_folder_names:
            technical_notes_id = str(uuid.uuid4())
            connection.execute(
                sa.text("""
                    INSERT INTO folders (
                        id, name, description, category, workspace_id, created_by,
                        path, level, color, icon, is_private, is_pinned, is_archived,
                        created_at, updated_at, is_deleted
                    ) VALUES (
                        :id, :name, :description, :category, :workspace_id, :created_by,
                        :path, :level, :color, :icon, :is_private, :is_pinned, :is_archived,
                        :created_at, :updated_at, :is_deleted
                    )
                """),
                {
                    "id": technical_notes_id,
                    "name": "Technical Notes",
                    "description": "Store technical documentation and notes",
                    "category": "NOTES",
                    "workspace_id": workspace_id,
                    "created_by": created_by,
                    "path": "/Technical Notes",
                    "level": 0,
                    "color": "#F59E0B",
                    "icon": "code",
                    "is_private": False,
                    "is_pinned": False,
                    "is_archived": False,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "is_deleted": False
                }
            )
        
        # Update old "Notes" folder to "General Notes" if it exists
        old_notes_folder = connection.execute(
            sa.text("""
                SELECT id FROM folders 
                WHERE workspace_id = :workspace_id 
                AND name = 'Notes' 
                AND category = 'NOTES' 
                AND is_deleted = false
            """),
            {"workspace_id": workspace_id}
        ).fetchone()
        
        if old_notes_folder:
            connection.execute(
                sa.text("""
                    UPDATE folders 
                    SET name = 'General Notes', 
                        description = 'Store general notes and documentation',
                        updated_at = :updated_at
                    WHERE id = :folder_id
                """),
                {
                    "folder_id": old_notes_folder[0],
                    "updated_at": datetime.utcnow()
                }
            )


def downgrade() -> None:
    # Get database connection
    connection = op.get_bind()
    
    # Remove the new note folders
    connection.execute(
        sa.text("""
            UPDATE folders 
            SET is_deleted = true, updated_at = :updated_at
            WHERE name IN ('Meeting Notes', 'Technical Notes') 
            AND category = 'NOTES'
        """),
        {"updated_at": datetime.utcnow()}
    )
    
    # Revert "General Notes" back to "Notes" if it exists
    connection.execute(
        sa.text("""
            UPDATE folders 
            SET name = 'Notes', 
                description = 'Create and manage your notes',
                updated_at = :updated_at
            WHERE name = 'General Notes' 
            AND category = 'NOTES'
        """),
        {"updated_at": datetime.utcnow()}
    )
