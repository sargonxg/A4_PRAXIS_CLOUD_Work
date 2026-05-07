"""Reject unsafe Cognee-derived canonical graph writes."""
from __future__ import annotations

from alembic import op

revision = "0014_cognee_provenance_firewall"
down_revision = "0013_cognee_bridge"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION reject_unsafe_cognee_graph_node()
        RETURNS trigger AS $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(NEW.provenance, '[]'::jsonb)) AS prov
            WHERE prov->>'kind' = 'cognee'
          ) THEN
            IF NEW.layer = 'Verdict' THEN
              RAISE EXCEPTION 'Cognee-derived graph_nodes cannot use Verdict layer';
            END IF;
            IF NEW.layer NOT IN ('Claim', 'Source') THEN
              RAISE EXCEPTION 'Cognee-derived graph_nodes must use Claim or Source layer';
            END IF;
            IF NEW.confidence > 0.600 THEN
              RAISE EXCEPTION 'Cognee-derived graph_nodes cannot exceed confidence 0.600';
            END IF;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        DROP TRIGGER IF EXISTS trg_reject_unsafe_cognee_graph_node ON graph_nodes;
        CREATE TRIGGER trg_reject_unsafe_cognee_graph_node
        BEFORE INSERT OR UPDATE ON graph_nodes
        FOR EACH ROW EXECUTE FUNCTION reject_unsafe_cognee_graph_node();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_reject_unsafe_cognee_graph_node ON graph_nodes")
    op.execute("DROP FUNCTION IF EXISTS reject_unsafe_cognee_graph_node()")
