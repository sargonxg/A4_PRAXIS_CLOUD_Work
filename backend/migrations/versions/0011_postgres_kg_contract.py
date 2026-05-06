"""Postgres knowledge graph contract tables."""
from __future__ import annotations

from alembic import op

revision = "0011_postgres_kg_contract"
down_revision = "0010_partitions_setup"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gin")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS graph_nodes (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          case_id text NOT NULL,
          owner_uid text NOT NULL,
          ontology_id text NOT NULL,
          ontology_version text NOT NULL DEFAULT '1.0.0',
          primitive text NOT NULL CHECK (primitive IN ('Actor','Claim','Interest','Constraint','Leverage','Commitment','Event','Narrative')),
          subtype text NOT NULL,
          label text NOT NULL,
          description text,
          layer text NOT NULL CHECK (layer IN ('Source','Claim','Evidence','Verdict')),
          confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
          provenance jsonb NOT NULL DEFAULT '[]'::jsonb,
          valid_from timestamptz,
          valid_to timestamptz,
          asserted_from timestamptz NOT NULL DEFAULT now(),
          asserted_to timestamptz,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          status text NOT NULL DEFAULT 'committed' CHECK (status IN ('pending','committed','merged','superseded','deleted','locked','disputed')),
          created_at timestamptz NOT NULL DEFAULT now(),
          created_by text NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS graph_edges (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          case_id text NOT NULL,
          owner_uid text NOT NULL,
          ontology_id text NOT NULL,
          relation_type text NOT NULL,
          source_id uuid NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
          target_id uuid NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
          confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
          provenance jsonb NOT NULL DEFAULT '[]'::jsonb,
          valid_from timestamptz,
          valid_to timestamptz,
          asserted_from timestamptz NOT NULL DEFAULT now(),
          asserted_to timestamptz,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          status text NOT NULL DEFAULT 'committed',
          created_at timestamptz NOT NULL DEFAULT now(),
          created_by text NOT NULL,
          CHECK (source_id <> target_id)
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS graph_embeddings (
          node_id uuid PRIMARY KEY REFERENCES graph_nodes(id) ON DELETE CASCADE,
          embedding vector(1536) NOT NULL,
          model text NOT NULL,
          text_hash text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS graph_audit (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          case_id text NOT NULL,
          owner_uid text NOT NULL,
          operation text NOT NULL,
          target_kind text NOT NULL CHECK (target_kind IN ('node','edge')),
          target_id uuid NOT NULL,
          payload jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          created_by text NOT NULL,
          reversible_until timestamptz NOT NULL DEFAULT now() + interval '24 hours'
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_nodes_owner_case ON graph_nodes (owner_uid, case_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_nodes_case_primitive ON graph_nodes (case_id, primitive, subtype) WHERE status = 'committed'")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_nodes_case_layer ON graph_nodes (case_id, layer) WHERE status = 'committed'")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_nodes_temporal ON graph_nodes (case_id, valid_from, valid_to)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_nodes_label_trgm ON graph_nodes USING gin (label gin_trgm_ops)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_edges_owner_case ON graph_edges (owner_uid, case_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges (source_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges (target_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_edges_relation ON graph_edges (case_id, relation_type) WHERE status = 'committed'")
    op.execute("CREATE INDEX IF NOT EXISTS idx_graph_audit_case_created ON graph_audit (case_id, created_at DESC)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS graph_audit")
    op.execute("DROP TABLE IF EXISTS graph_embeddings")
    op.execute("DROP TABLE IF EXISTS graph_edges")
    op.execute("DROP TABLE IF EXISTS graph_nodes")
