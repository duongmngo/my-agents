-- Initialize database for my-agents application
-- This script runs when PostgreSQL container starts for the first time

-- Create main database if it doesn't exist
-- (PostgreSQL container will create it based on POSTGRES_DB env var)

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created by Alembic migrations, but we can prepare some basic ones

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE my_agents_db TO postgres;

-- You can add initial data here if needed
-- For example, create a default super admin tenant

-- INSERT INTO tenants (id, name, subdomain, contact_email, is_active, created_at)
-- VALUES (
--     uuid_generate_v4(),
--     'Default Tenant',
--     'default',
--     'admin@example.com',
--     true,
--     NOW()
-- );

-- Create a simple health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy';
END;
$$ LANGUAGE plpgsql;
