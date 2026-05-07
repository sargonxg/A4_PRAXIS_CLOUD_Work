"""Add Cognee-to-ACO bridge table."""
from __future__ import annotations

from alembic import op

revision = "0013_cognee_bridge"
down_revision = "0012_graph_nodes_metrics"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS aco_cognee_link (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          case_id text NOT NULL,
          owner_uid text NOT NULL,
          aco_node_id uuid REFERENCES graph_nodes(id) ON DELETE CASCADE,
          cognee_node_id text NOT NULL,
          cognee_dataset text NOT NULL,
          link_kind text NOT NULL CHECK (link_kind IN ('candidate','promoted','rejected','superseded')),
          confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 0.600),
          internal_score numeric(6,5) NOT NULL CHECK (internal_score >= 0 AND internal_score <= 1),
          source_chunk_id text,
          label text,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          model text,
          run_id text,
          created_at timestamptz NOT NULL DEFAULT now(),
          reviewed_at timestamptz,
          reviewed_by text,
          notes text,
          UNIQUE (cognee_dataset, cognee_node_id)
        )
        """
    )
    op.execute("ALTER TABLE aco_cognee_link ENABLE ROW LEVEL SECURITY")
    op.execute(
        """
        CREATE POLICY aco_cognee_link_tenant ON aco_cognee_link
          USING (owner_uid = current_tenant())
          WITH CHECK (owner_uid = current_tenant())
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_aco_cognee_link_owner_case ON aco_cognee_link (owner_uid, case_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_aco_cognee_link_kind ON aco_cognee_link (case_id, link_kind) WHERE link_kind = 'candidate'")
    op.execute("CREATE INDEX IF NOT EXISTS idx_aco_cognee_link_aco_node ON aco_cognee_link (aco_node_id) WHERE aco_node_id IS NOT NULL")
    op.execute("CREATE INDEX IF NOT EXISTS idx_aco_cognee_link_dataset ON aco_cognee_link (cognee_dataset)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS aco_cognee_link")
