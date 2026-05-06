"""Trust scores."""
from __future__ import annotations

from alembic import op

revision = "0006_trust_scores"
down_revision = "0005_cost_ledger"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS trust_scores (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id text NOT NULL,
          uid text NOT NULL,
          situation_id text NOT NULL,
          export_id text,
          work_product_id text,
          paragraph_id text,
          claim_id text,
          score int NOT NULL CHECK (score >= 0 AND score <= 100),
          status text NOT NULL,
          evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS trust_scores_export_paragraph_idx ON trust_scores (tenant_id, export_id, paragraph_id, created_at DESC)")
    op.execute("ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS trust_scores_tenant_isolation ON trust_scores")
    op.execute("CREATE POLICY trust_scores_tenant_isolation ON trust_scores USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS trust_scores")
