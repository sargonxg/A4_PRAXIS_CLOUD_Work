"""deep preship foundation tables and workspace event notify

Revision ID: 0017_deep_preship_foundation
Revises: 0016_workspace_chapter_products
Create Date: 2026-05-07
"""
from __future__ import annotations

from alembic import op

revision = "0017_deep_preship_foundation"
down_revision = "0016_workspace_chapter_products"
branch_labels = None
depends_on = None

TENANT_TABLES = (
    "cases",
    "workspaces",
    "situation_frames",
    "source_receipts",
    "research_threads",
    "memos",
    "memo_versions",
    "drafts",
    "dialectica_runs",
    "briefings",
    "workspace_suggestions",
    "workspace_events_log",
    "workspace_orchestrator_log",
    "cognee_pending_writes",
    "ach_hypotheses",
    "ach_cells",
    "notifications",
    "notification_preferences",
)


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS workspaces (
          id text PRIMARY KEY,
          owner_uid text NOT NULL,
          name text NOT NULL DEFAULT 'Workspace',
          guidelines jsonb NOT NULL DEFAULT '{}'::jsonb,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS cases (
          id text PRIMARY KEY,
          owner_uid text NOT NULL,
          workspace_id text,
          title text NOT NULL DEFAULT 'Untitled case',
          case_type text,
          case_type_secondary text,
          case_type_confidence numeric(4,3) NOT NULL DEFAULT 0,
          case_type_locked boolean NOT NULL DEFAULT false,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ach_hypotheses (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          question text NOT NULL,
          hypothesis text NOT NULL,
          status text NOT NULL DEFAULT 'active',
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ach_cells (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          hypothesis_id uuid REFERENCES ach_hypotheses(id) ON DELETE CASCADE,
          evidence_node_id uuid,
          score integer NOT NULL DEFAULT 0 CHECK (score >= -2 AND score <= 2),
          note text NOT NULL DEFAULT '',
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS workspace_events_log (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          case_id text NOT NULL,
          surface_key text NOT NULL DEFAULT 'workspace',
          event_type text NOT NULL,
          status text NOT NULL DEFAULT 'start',
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          workspace_id text,
          case_id text,
          event_type text NOT NULL,
          channel text NOT NULL DEFAULT 'in_app',
          title text NOT NULL,
          body text NOT NULL DEFAULT '',
          status text NOT NULL DEFAULT 'unread',
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          read_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS notification_preferences (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          workspace_id text,
          channels jsonb NOT NULL DEFAULT '{"in_app": true, "email": false}'::jsonb,
          event_types jsonb NOT NULL DEFAULT '{}'::jsonb,
          quiet_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
          do_not_disturb boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (owner_uid, workspace_id)
        );

        CREATE INDEX IF NOT EXISTS idx_workspaces_owner_case
          ON workspaces(owner_uid, id);
        CREATE INDEX IF NOT EXISTS idx_cases_owner_case
          ON cases(owner_uid, id);
        CREATE INDEX IF NOT EXISTS idx_cases_type
          ON cases(owner_uid, case_type, case_type_secondary);
        CREATE INDEX IF NOT EXISTS idx_ach_hypotheses_owner_case
          ON ach_hypotheses(owner_uid, case_id, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_ach_cells_owner_case
          ON ach_cells(owner_uid, case_id, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_workspace_events_log_owner_case
          ON workspace_events_log(owner_uid, case_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_owner_case
          ON notifications(owner_uid, case_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notification_preferences_owner
          ON notification_preferences(owner_uid, workspace_id);
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION notify_workspace_event()
        RETURNS trigger AS $$
        DECLARE
          payload json;
        BEGIN
          payload := json_build_object(
            'id', NEW.id,
            'owner_uid', NEW.owner_uid,
            'case_id', NEW.case_id,
            'surface_key', NEW.surface_key,
            'event_type', NEW.event_type,
            'status', NEW.status,
            'created_at', NEW.created_at
          );
          PERFORM pg_notify('workspace_events', payload::text);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    for table in TENANT_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
        op.execute(
            f"""
            CREATE POLICY {table}_tenant_isolation ON {table}
              USING (owner_uid = current_tenant())
              WITH CHECK (owner_uid = current_tenant())
            """
        )
    for table in ("workspace_events_log", "workspace_orchestrator_log"):
        op.execute(f"DROP TRIGGER IF EXISTS trg_notify_{table} ON {table}")
        op.execute(
            f"""
            CREATE TRIGGER trg_notify_{table}
            AFTER INSERT ON {table}
            FOR EACH ROW EXECUTE FUNCTION notify_workspace_event()
            """
        )


def downgrade() -> None:
    for table in ("workspace_events_log", "workspace_orchestrator_log"):
        op.execute(f"DROP TRIGGER IF EXISTS trg_notify_{table} ON {table}")
    for table in TENANT_TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
    op.execute("DROP FUNCTION IF EXISTS notify_workspace_event()")
    op.execute("DROP TABLE IF EXISTS notification_preferences")
    op.execute("DROP TABLE IF EXISTS notifications")
    op.execute("DROP TABLE IF EXISTS workspace_events_log")
    op.execute("DROP TABLE IF EXISTS ach_cells")
    op.execute("DROP TABLE IF EXISTS ach_hypotheses")
    op.execute("DROP TABLE IF EXISTS cases")
    op.execute("DROP TABLE IF EXISTS workspaces")
