"""v7 cores linkage columns

Revision ID: 0020_cores_linkage
Revises: 0019_cores_baseline
Create Date: 2026-05-08
"""
from __future__ import annotations

from alembic import op

revision = "0020_cores_linkage"
down_revision = "0019_cores_baseline"
branch_labels = None
depends_on = None

LINKED_TABLES = (
    "cases",
    "situation_frames",
    "source_receipts",
    "documents",
    "graph_nodes",
    "graph_edges",
    "graph_embeddings",
    "memos",
    "memo_versions",
    "drafts",
    "briefings",
    "boardroom_briefings",
    "recipe_runs",
    "dialectica_runs",
    "research_threads",
    "ach_hypotheses",
    "workspace_suggestions",
    "workspace_orchestrator_log",
)


def upgrade() -> None:
    for table in LINKED_TABLES:
        op.execute(
            f"""
            DO $$
            BEGIN
              IF to_regclass('{table}') IS NOT NULL THEN
                EXECUTE 'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS core_id uuid REFERENCES cores(id) ON DELETE SET NULL';
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_{table}_core_id ON {table}(core_id) WHERE core_id IS NOT NULL';
              END IF;
            END $$;
            """
        )


def downgrade() -> None:
    for table in reversed(LINKED_TABLES):
        op.execute(
            f"""
            DO $$
            BEGIN
              IF to_regclass('{table}') IS NOT NULL THEN
                EXECUTE 'DROP INDEX IF EXISTS idx_{table}_core_id';
                EXECUTE 'ALTER TABLE {table} DROP COLUMN IF EXISTS core_id';
              END IF;
            END $$;
            """
        )
