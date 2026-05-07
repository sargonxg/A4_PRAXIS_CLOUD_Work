"""workspace chapter product tables and source receipt enrichments

Revision ID: 0016_workspace_chapter_products
Revises: 0015_workspace_tabs_chapters
Create Date: 2026-05-07
"""
from __future__ import annotations

from alembic import op

revision = "0016_workspace_chapter_products"
down_revision = "0015_workspace_tabs_chapters"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE source_receipts
          ADD COLUMN IF NOT EXISTS cognee_document_id text,
          ADD COLUMN IF NOT EXISTS embeddings_count integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS nodes_extracted integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS ontology_valid_pct numeric(4,3);

        CREATE TABLE IF NOT EXISTS research_threads (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          question text NOT NULL,
          status text NOT NULL DEFAULT 'open',
          cognee_session_id text NOT NULL,
          recall_history jsonb NOT NULL DEFAULT '[]'::jsonb,
          resolution text,
          confidence numeric(4,3),
          memory_coverage numeric(4,3) NOT NULL DEFAULT 0,
          graph_node_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS memos (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          title text NOT NULL,
          body text NOT NULL DEFAULT '',
          source_kind text NOT NULL DEFAULT 'freeform',
          source_dialectica_run_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
          pinned boolean NOT NULL DEFAULT false,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS memo_versions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          memo_id uuid NOT NULL REFERENCES memos(id),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          body text NOT NULL,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS drafts (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          title text NOT NULL,
          body text NOT NULL DEFAULT '',
          citations jsonb NOT NULL DEFAULT '[]'::jsonb,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS dialectica_runs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          recipe_id text NOT NULL,
          input jsonb NOT NULL DEFAULT '{}'::jsonb,
          output jsonb NOT NULL DEFAULT '{}'::jsonb,
          status text NOT NULL DEFAULT 'queued',
          token_budget integer NOT NULL DEFAULT 8000,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS briefings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          title text NOT NULL,
          audience text NOT NULL DEFAULT 'principal',
          sections jsonb NOT NULL DEFAULT '[]'::jsonb,
          export_status text NOT NULL DEFAULT 'draft',
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_research_threads_owner_case
          ON research_threads(owner_uid, case_id, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_memos_owner_case
          ON memos(owner_uid, case_id, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_memo_versions_memo
          ON memo_versions(memo_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_drafts_owner_case
          ON drafts(owner_uid, case_id, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_dialectica_runs_owner_case
          ON dialectica_runs(owner_uid, case_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_briefings_owner_case
          ON briefings(owner_uid, case_id, updated_at DESC);
        """
    )


def downgrade() -> None:
    # Destructive table drops require explicit operator sign-off in PRAXIS.
    pass
