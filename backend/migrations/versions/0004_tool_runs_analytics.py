"""Tool runs analytics mirror."""
from __future__ import annotations

from alembic import op

revision = "0004_tool_runs_analytics"
down_revision = "0003_agent_memory"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS tool_runs_analytics (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id text NOT NULL,
          uid text NOT NULL,
          situation_id text,
          tool_id text NOT NULL,
          route text,
          lens text,
          status text NOT NULL,
          started_at timestamptz NOT NULL DEFAULT now(),
          completed_at timestamptz,
          latency_ms int,
          cost_usd numeric(12,6),
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS tool_runs_uid_started_idx ON tool_runs_analytics (uid, started_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS tool_runs_situation_started_idx ON tool_runs_analytics (situation_id, started_at DESC)")
    op.execute("ALTER TABLE tool_runs_analytics ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS tool_runs_analytics_tenant_isolation ON tool_runs_analytics")
    op.execute("CREATE POLICY tool_runs_analytics_tenant_isolation ON tool_runs_analytics USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS tool_runs_analytics")
