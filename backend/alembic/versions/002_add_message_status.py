"""add_message_status_column

Revision ID: 002
Revises: 001
Create Date: 2025-12-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create MessageStatus enum type
    op.execute("CREATE TYPE messagestatus AS ENUM ('PENDING', 'STREAMING', 'COMPLETE', 'ERROR')")
    
    # Add status column to messages table
    op.add_column('messages', 
        sa.Column('status', sa.Enum('PENDING', 'STREAMING', 'COMPLETE', 'ERROR', 
                                     name='messagestatus', create_type=False), 
                  nullable=True)
    )
    
    # Set default status for existing AI response messages to COMPLETE
    op.execute("""
        UPDATE messages 
        SET status = 'COMPLETE' 
        WHERE type = 'AI_RESPONSE' AND status IS NULL
    """)


def downgrade() -> None:
    # Remove status column from messages table
    op.drop_column('messages', 'status')
    
    # Drop MessageStatus enum type
    op.execute("DROP TYPE messagestatus")
