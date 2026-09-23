"""seed_default_accounts

Seeds the demo accounts shown on the login page, each with a default
workspace (mirrors what AuthService.register_user creates).

Revision ID: 007
Revises: 006
Create Date: 2026-09-23 00:00:00.000000

"""
import uuid

from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SEED_ACCOUNTS = [
    {
        "email": "admin@demo.com",
        "username": "demo_admin",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "Demo",
        "role": "admin",
    },
    {
        "email": "user@demo.com",
        "username": "demo_user",
        "password": "user123",
        "first_name": "User",
        "last_name": "Demo",
        "role": "user",
    },
]


def upgrade() -> None:
    conn = op.get_bind()

    for account in SEED_ACCOUNTS:
        exists = conn.execute(
            sa.text("SELECT 1 FROM users WHERE email = :email"),
            {"email": account["email"]},
        ).first()
        if exists:
            continue

        user_id = str(uuid.uuid4())
        workspace_id = str(uuid.uuid4())

        conn.execute(
            sa.text("""
                INSERT INTO users (
                    id, created_at, updated_at, is_deleted,
                    email, username, hashed_password, first_name, last_name,
                    is_active, is_verified, role, timezone, language
                ) VALUES (
                    :id, now(), now(), false,
                    :email, :username, :hashed_password, :first_name, :last_name,
                    true, true, :role, 'UTC', 'en'
                )
            """),
            {
                "id": user_id,
                "email": account["email"],
                "username": account["username"],
                "hashed_password": pwd_context.hash(account["password"]),
                "first_name": account["first_name"],
                "last_name": account["last_name"],
                "role": account["role"],
            },
        )

        conn.execute(
            sa.text("""
                INSERT INTO workspaces (
                    id, created_at, updated_at, is_deleted, created_by,
                    name, description, slug, color, icon,
                    is_private, is_active, is_archived
                ) VALUES (
                    :id, now(), now(), false, :created_by,
                    'My Workspace', 'Default workspace for getting started', :slug, '#3B82F6', 'briefcase',
                    false, true, false
                )
            """),
            {
                "id": workspace_id,
                "created_by": user_id,
                "slug": f"{account['username']}-workspace",
            },
        )

        conn.execute(
            sa.text("""
                INSERT INTO workspace_members (
                    id, created_at, updated_at, is_deleted,
                    workspace_id, user_id, role, joined_at, is_active
                ) VALUES (
                    :id, now(), now(), false,
                    :workspace_id, :user_id, 'owner', now(), true
                )
            """),
            {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "user_id": user_id},
        )


def downgrade() -> None:
    conn = op.get_bind()
    emails = [account["email"] for account in SEED_ACCOUNTS]

    user_ids = [
        row[0]
        for row in conn.execute(
            sa.text("SELECT id FROM users WHERE email = ANY(:emails)"), {"emails": emails}
        )
    ]
    if not user_ids:
        return

    params = {"user_ids": user_ids}
    conn.execute(
        sa.text("""
            DELETE FROM workspace_members
            WHERE workspace_id IN (SELECT id FROM workspaces WHERE created_by = ANY(:user_ids))
               OR user_id = ANY(:user_ids)
        """),
        params,
    )
    conn.execute(sa.text("DELETE FROM workspaces WHERE created_by = ANY(:user_ids)"), params)
    conn.execute(sa.text("DELETE FROM users WHERE id = ANY(:user_ids)"), params)
