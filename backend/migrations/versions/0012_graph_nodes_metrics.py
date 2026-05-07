"""Add graph_nodes metrics JSONB for additive analytics results."""
from __future__ import annotations

from alembic import op

revision = "0012_graph_nodes_metrics"
down_revision = "0011_postgres_kg_contract"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE graph_nodes ADD COLUMN IF NOT EXISTS metrics jsonb NOT NULL DEFAULT '{}'::jsonb")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_nodes_metrics_gin ON graph_nodes USING gin (metrics)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_graph_nodes_metrics_gin")
    op.execute("ALTER TABLE graph_nodes DROP COLUMN IF EXISTS metrics")
