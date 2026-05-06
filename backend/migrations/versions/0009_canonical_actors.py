"""Canonical actors with trigram search."""
from __future__ import annotations

from alembic import op

revision = "0009_canonical_actors"
down_revision = "0008_audit_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS canonical_actors (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id text NOT NULL,
          canonical_name text NOT NULL,
          aliases text[] NOT NULL DEFAULT ARRAY[]::text[],
          aco_type text NOT NULL DEFAULT 'actor',
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS canonical_actors_name_trgm_idx ON canonical_actors USING gin (canonical_name gin_trgm_ops)")
    op.execute("CREATE INDEX IF NOT EXISTS canonical_actors_aliases_trgm_idx ON canonical_actors USING gin (array_to_string(aliases, ' ') gin_trgm_ops)")
    op.execute("ALTER TABLE canonical_actors ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS canonical_actors_tenant_isolation ON canonical_actors")
    op.execute("CREATE POLICY canonical_actors_tenant_isolation ON canonical_actors USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS canonical_actors")
