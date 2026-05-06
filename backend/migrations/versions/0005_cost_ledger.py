"""Cost ledger."""
from __future__ import annotations

from alembic import op

revision = "0005_cost_ledger"
down_revision = "0004_tool_runs_analytics"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS cost_ledger (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id text NOT NULL,
          uid text NOT NULL,
          situation_id text NOT NULL,
          day date NOT NULL,
          source text NOT NULL,
          source_id text NOT NULL,
          units numeric(18,6) NOT NULL DEFAULT 0,
          cost_usd numeric(12,6) NOT NULL DEFAULT 0,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (tenant_id, uid, situation_id, day, source, source_id)
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS cost_ledger_situation_day_idx ON cost_ledger (tenant_id, situation_id, day)")
    op.execute("ALTER TABLE cost_ledger ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS cost_ledger_tenant_isolation ON cost_ledger")
    op.execute("CREATE POLICY cost_ledger_tenant_isolation ON cost_ledger USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS cost_ledger")
