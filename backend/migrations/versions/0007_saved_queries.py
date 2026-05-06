"""Saved Cypher queries."""
from __future__ import annotations

from alembic import op

revision = "0007_saved_queries"
down_revision = "0006_trust_scores"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS saved_queries (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id text NOT NULL,
          uid text NOT NULL,
          situation_id text NOT NULL,
          name text NOT NULL,
          cypher text NOT NULL,
          params jsonb NOT NULL DEFAULT '{}'::jsonb,
          version int NOT NULL DEFAULT 1,
          history jsonb NOT NULL DEFAULT '[]'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS saved_queries_situation_idx ON saved_queries (tenant_id, situation_id, updated_at DESC)")
    op.execute("ALTER TABLE saved_queries ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS saved_queries_tenant_isolation ON saved_queries")
    op.execute("CREATE POLICY saved_queries_tenant_isolation ON saved_queries USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS saved_queries")
