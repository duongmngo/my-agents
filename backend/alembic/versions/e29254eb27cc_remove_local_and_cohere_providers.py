"""remove_local_and_cohere_providers

Revision ID: e29254eb27cc
Revises: 454138944efc
Create Date: 2025-09-21 11:29:07.452517

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e29254eb27cc'
down_revision = '454138944efc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove 'LOCAL' and 'COHERE' from the EmbeddingProviderType enum
    # First, update any existing records that use these values
    op.execute("""
        UPDATE embedding_provider_configs 
        SET provider_type = 'OPENAI' 
        WHERE provider_type IN ('LOCAL', 'COHERE')
    """)
    
    # Create a new enum type without LOCAL and COHERE
    op.execute("CREATE TYPE embeddingprovidertype_new AS ENUM ('OPENAI', 'AZURE', 'HUGGINGFACE')")
    
    # Update the column to use the new enum type
    op.execute("""
        ALTER TABLE embedding_provider_configs 
        ALTER COLUMN provider_type TYPE embeddingprovidertype_new 
        USING provider_type::text::embeddingprovidertype_new
    """)
    
    # Drop the old enum type and rename the new one
    op.execute("DROP TYPE embeddingprovidertype")
    op.execute("ALTER TYPE embeddingprovidertype_new RENAME TO embeddingprovidertype")


def downgrade() -> None:
    # Add back 'LOCAL' and 'COHERE' to the enum
    op.execute("CREATE TYPE embeddingprovidertype_new AS ENUM ('OPENAI', 'AZURE', 'HUGGINGFACE', 'LOCAL', 'COHERE')")
    
    # Update the column to use the new enum type
    op.execute("""
        ALTER TABLE embedding_provider_configs 
        ALTER COLUMN provider_type TYPE embeddingprovidertype_new 
        USING provider_type::text::embeddingprovidertype_new
    """)
    
    # Drop the old enum type and rename the new one
    op.execute("DROP TYPE embeddingprovidertype")
    op.execute("ALTER TYPE embeddingprovidertype_new RENAME TO embeddingprovidertype")
