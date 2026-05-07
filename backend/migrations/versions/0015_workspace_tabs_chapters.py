"""workspace tabs and chapters substrate tables

Revision ID: 0015_workspace_tabs_chapters
Revises: 0014_cognee_provenance_firewall
Create Date: 2026-05-07
"""
from __future__ import annotations

from alembic import op

revision = "0015_workspace_tabs_chapters"
down_revision = "0014_cognee_provenance_firewall"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS situation_frames (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          what_happening text NOT NULL DEFAULT '',
          why_matters text NOT NULL DEFAULT '',
          what_would_change text NOT NULL DEFAULT '',
          policy_question text NOT NULL DEFAULT '',
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (owner_uid, case_id)
        );

        CREATE TABLE IF NOT EXISTS source_receipts (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          title text NOT NULL,
          source_uri text,
          source_type text NOT NULL DEFAULT 'document',
          receipt_status text NOT NULL DEFAULT 'staged',
          cognee_document_id text,
          embeddings_count integer NOT NULL DEFAULT 0,
          nodes_extracted integer NOT NULL DEFAULT 0,
          ontology_valid_pct numeric(4,3),
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

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

        CREATE TABLE IF NOT EXISTS workspace_suggestions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          target_chapter text NOT NULL,
          surface_key text NOT NULL,
          kind text NOT NULL,
          title text NOT NULL,
          body text NOT NULL DEFAULT '',
          confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 0.600),
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          dismissed_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS workspace_orchestrator_log (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          surface_key text NOT NULL,
          event_type text NOT NULL,
          status text NOT NULL DEFAULT 'idle',
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS cognee_pending_writes (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          source_id text NOT NULL,
          operation text NOT NULL,
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          attempts integer NOT NULL DEFAULT 0,
          last_error text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_situation_frames_owner_case
          ON situation_frames(owner_uid, case_id);
        CREATE INDEX IF NOT EXISTS idx_source_receipts_owner_case
          ON source_receipts(owner_uid, case_id, created_at DESC);
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
        CREATE INDEX IF NOT EXISTS idx_workspace_suggestions_owner_case
          ON workspace_suggestions(owner_uid, case_id, dismissed_at, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_workspace_orchestrator_log_owner_case
          ON workspace_orchestrator_log(owner_uid, case_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_cognee_pending_writes_owner_case
          ON cognee_pending_writes(owner_uid, case_id, created_at DESC);
        """
    )


def downgrade() -> None:
    # Destructive table drops require explicit operator sign-off in PRAXIS.
    pass
