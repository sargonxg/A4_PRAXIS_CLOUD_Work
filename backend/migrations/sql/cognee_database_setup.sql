-- Cognee isolated database setup.
-- Run as the Cloud SQL administrative user, not through Alembic.
-- Alembic owns the canonical praxis database only.

CREATE DATABASE praxis_cognee
  WITH OWNER = postgres
       ENCODING = 'UTF8'
       TEMPLATE = template0;

\c praxis_cognee

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'praxis_cognee_app') THEN
    CREATE ROLE praxis_cognee_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT LOGIN
      PASSWORD :'cognee_app_password';
  END IF;
END $$;

GRANT CONNECT ON DATABASE praxis_cognee TO praxis_cognee_app;
GRANT USAGE, CREATE ON SCHEMA public TO praxis_cognee_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO praxis_cognee_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO praxis_cognee_app;

CREATE OR REPLACE FUNCTION current_tenant()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.tenant_id', true)
$$;

REVOKE ALL ON DATABASE praxis_cognee FROM praxis_app;
REVOKE ALL ON SCHEMA public FROM praxis_app;
