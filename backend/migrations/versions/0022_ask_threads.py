"""v7 ask threads

Revision ID: 0022_ask_threads
Revises: 0020_cores_linkage
Create Date: 2026-05-08
"""
from __future__ import annotations

from alembic import op

revision = "0022_ask_threads"
down_revision = "0020_cores_linkage"
branch_labels = None
depends_on = None

ASK_TABLES = ("ask_message_citations", "ask_messages", "ask_threads")


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ask_threads (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          situation_id text,
          situation_core_id uuid REFERENCES cores(id) ON DELETE SET NULL,
          title text NOT NULL DEFAULT 'Ask PRAXIS thread',
          mode text NOT NULL DEFAULT 'quick' CHECK (mode IN ('quick','deep','plan','memo','brief','talking_points')),
          status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
          attached_core_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          archived_at timestamptz,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        );

        CREATE INDEX IF NOT EXISTS idx_ask_threads_owner_updated
          ON ask_threads(owner_uid, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_ask_threads_owner_situation
          ON ask_threads(owner_uid, situation_id, updated_at DESC)
          WHERE situation_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_ask_threads_situation_core
          ON ask_threads(situation_core_id)
          WHERE situation_core_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_ask_threads_attached_cores
          ON ask_threads USING gin(attached_core_ids);

        CREATE TABLE IF NOT EXISTS ask_messages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          thread_id uuid NOT NULL REFERENCES ask_threads(id) ON DELETE CASCADE,
          role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
          content text NOT NULL,
          sequence integer NOT NULL CHECK (sequence >= 0),
          route_action text CHECK (route_action IN ('direct_answer','run_skill','run_subagent_plan','clarify')),
          skill_id text,
          subagent_id text,
          token_count integer NOT NULL DEFAULT 0 CHECK (token_count >= 0),
          cost_usd numeric(12, 6) NOT NULL DEFAULT 0 CHECK (cost_usd >= 0),
          created_at timestamptz NOT NULL DEFAULT now(),
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          UNIQUE (thread_id, sequence)
        );

        CREATE INDEX IF NOT EXISTS idx_ask_messages_owner_thread_sequence
          ON ask_messages(owner_uid, thread_id, sequence);

        CREATE TABLE IF NOT EXISTS ask_message_citations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          message_id uuid NOT NULL REFERENCES ask_messages(id) ON DELETE CASCADE,
          citation_index integer NOT NULL CHECK (citation_index > 0),
          source_kind text NOT NULL CHECK (source_kind IN ('source_receipt','document','graph_node','graph_edge','core','web','other')),
          source_id text NOT NULL,
          title text NOT NULL,
          excerpt text,
          confidence numeric(4, 3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_ask_citations_owner_message
          ON ask_message_citations(owner_uid, message_id, citation_index);
        """
    )

    for table in ASK_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
        op.execute(
            f"""
            CREATE POLICY {table}_tenant_isolation ON {table}
              USING (owner_uid = current_tenant())
              WITH CHECK (owner_uid = current_tenant())
            """
        )


def downgrade() -> None:
    for table in ASK_TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
    op.execute("DROP INDEX IF EXISTS idx_ask_citations_owner_message")
    op.execute("DROP TABLE IF EXISTS ask_message_citations")
    op.execute("DROP INDEX IF EXISTS idx_ask_messages_owner_thread_sequence")
    op.execute("DROP TABLE IF EXISTS ask_messages")
    op.execute("DROP INDEX IF EXISTS idx_ask_threads_attached_cores")
    op.execute("DROP INDEX IF EXISTS idx_ask_threads_situation_core")
    op.execute("DROP INDEX IF EXISTS idx_ask_threads_owner_situation")
    op.execute("DROP INDEX IF EXISTS idx_ask_threads_owner_updated")
    op.execute("DROP TABLE IF EXISTS ask_threads")
