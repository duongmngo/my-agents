"""remove_tenant_table_and_tenant_id_columns

Revision ID: 964a6dfa3ddd
Revises: 9f4628f1ad12
Create Date: 2025-08-27 23:33:39.335940

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '964a6dfa3ddd'
down_revision = '9f4628f1ad12'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove tenant_id columns from all tables
    op.drop_column('workspaces', 'tenant_id')
    op.drop_column('folders', 'tenant_id')
    op.drop_column('files', 'tenant_id')
    op.drop_column('notes', 'tenant_id')
    op.drop_column('conversations', 'tenant_id')
    op.drop_column('messages', 'tenant_id')
    
    # Drop the tenants table
    op.drop_table('tenants')


def downgrade() -> None:
    # Recreate the tenants table
    op.create_table('tenants',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('subdomain', sa.String(length=100), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('settings', sa.Text(), nullable=True),
        sa.Column('max_users', sa.Integer(), nullable=False),
        sa.Column('max_workspaces', sa.Integer(), nullable=False),
        sa.Column('max_storage_gb', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_trial', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add tenant_id columns back to all tables
    op.add_column('workspaces', sa.Column('tenant_id', sa.String(), nullable=True))
    op.add_column('folders', sa.Column('tenant_id', sa.String(), nullable=True))
    op.add_column('files', sa.Column('tenant_id', sa.String(), nullable=True))
    op.add_column('notes', sa.Column('tenant_id', sa.String(), nullable=True))
    op.add_column('conversations', sa.Column('tenant_id', sa.String(), nullable=True))
    op.add_column('messages', sa.Column('tenant_id', sa.String(), nullable=True))
