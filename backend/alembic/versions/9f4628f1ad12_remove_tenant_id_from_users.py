"""remove_tenant_id_from_users

Revision ID: 9f4628f1ad12
Revises: 21ae660a5040
Create Date: 2025-08-27 22:42:16.011033

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9f4628f1ad12'
down_revision = '356ed2cb3332'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove tenant_id column from users table
    op.drop_column('users', 'tenant_id')


def downgrade() -> None:
    # Add tenant_id column back to users table
    op.add_column('users', sa.Column('tenant_id', sa.String(), nullable=True))
