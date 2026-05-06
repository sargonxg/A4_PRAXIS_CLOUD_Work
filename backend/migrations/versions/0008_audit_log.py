"""Partitioned insert-only audit log."""
from __future__ import annotations

from alembic import op

revision = "0008_audit_log"
down_revision = "0007_saved_queries"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS audit_log (
          id uuid DEFAULT gen_random_uuid(),
          tenant_id text NOT NULL,
          actor_uid text NOT NULL,
          actor_kind text NOT NULL,
          action text NOT NULL,
          target_type text,
          target_id text,
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          prev_hash bytea,
          this_hash bytea NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at)
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION audit_log_insert_only()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RAISE EXCEPTION 'audit_log is insert-only';
        END $$;
        """
    )
    op.execute("DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log")
    op.execute("CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION audit_log_insert_only()")
    op.execute("ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS audit_log_tenant_isolation ON audit_log")
    op.execute("CREATE POLICY audit_log_tenant_isolation ON audit_log USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS audit_log CASCADE")
    op.execute("DROP FUNCTION IF EXISTS audit_log_insert_only()")
