"""create_default_admin_account

Revision ID: 356ed2cb3332
Revises: 
Create Date: 2025-08-27 00:19:56.040279

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import uuid
from datetime import datetime
from app.core.security import get_password_hash


# revision identifiers, used by Alembic.
revision = '356ed2cb3332'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if default tenant already exists
    connection = op.get_bind()
    result = connection.execute(text("SELECT id FROM tenants WHERE subdomain = 'demo'"))
    existing_tenant = result.fetchone()
    
    if existing_tenant:
        default_tenant_id = existing_tenant[0]
        print(f"Default tenant 'demo' already exists with ID: {default_tenant_id}")
    else:
        # Create default tenant
        default_tenant_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        op.execute(f"""
            INSERT INTO tenants (id, name, subdomain, domain, contact_email, contact_phone, 
                               settings, max_users, max_workspaces, max_storage_gb, 
                               is_active, is_trial, is_deleted, created_at, updated_at)
            VALUES (
                '{default_tenant_id}',
                'Demo Tenant',
                'demo',
                'demo.myagents.local',
                'admin@demo.com',
                '+1234567890',
                '{{"theme": "light", "language": "en"}}',
                100,
                20,
                50,
                true,
                false,
                false,
                '{now}',
                '{now}'
            )
        """)
        print(f"Created default tenant with ID: {default_tenant_id}")
    
    # Check if default admin user already exists
    result = connection.execute(text("SELECT id FROM users WHERE email = 'admin@demo.com'"))
    existing_user = result.fetchone()
    
    if existing_user:
        print(f"Default admin user 'admin@demo.com' already exists with ID: {existing_user[0]}")
    else:
        # Create default admin user
        default_user_id = str(uuid.uuid4())
        hashed_password = get_password_hash("admin123")
        now = datetime.utcnow().isoformat()
        
        op.execute(f"""
            INSERT INTO users (id, email, username, hashed_password, first_name, last_name,
                              avatar_url, bio, is_active, is_verified, role, last_login,
                              password_changed_at, preferences, timezone, language, tenant_id,
                              is_deleted, created_at, updated_at)
            VALUES (
                '{default_user_id}',
                'admin@demo.com',
                'admin',
                '{hashed_password}',
                'Demo',
                'Administrator',
                NULL,
                'Default system administrator account',
                true,
                true,
                'super_admin',
                '{now}',
                '{now}',
                '{{"theme": "light", "language": "en", "notifications": true}}',
                'UTC',
                'en',
                '{default_tenant_id}',
                false,
                '{now}',
                '{now}'
            )
        """)
        print(f"Created default admin user with ID: {default_user_id}")


def downgrade() -> None:
    # Remove default admin user
    op.execute("DELETE FROM users WHERE email = 'admin@demo.com'")
    
    # Remove default tenant
    op.execute("DELETE FROM tenants WHERE subdomain = 'demo'")
