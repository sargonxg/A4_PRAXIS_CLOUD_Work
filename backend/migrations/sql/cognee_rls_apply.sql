-- Idempotent RLS wrapper for Cognee-managed tables.
-- Run after Cognee has created its tables in praxis_cognee.

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND (
        tablename LIKE 'cognee_%'
        OR tablename LIKE 'data_point_%'
        OR tablename = 'graph_nodes_cognee'
      )
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id text', tbl);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET DEFAULT current_tenant()', tbl);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO praxis_cognee_app', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_tenant_isolation ON %I USING (tenant_id = current_tenant() OR tenant_id IS NULL) WITH CHECK (tenant_id = current_tenant())',
      tbl,
      tbl
    );
  END LOOP;
END $$;
