"""v7 cores baseline

Revision ID: 0019_cores_baseline
Revises: 0018_notifications_feedback_system
Create Date: 2026-05-08
"""
from __future__ import annotations

from alembic import op

revision = "0019_cores_baseline"
down_revision = "0018_notifications_feedback_system"
branch_labels = None
depends_on = None

CORE_TABLES = ("core_audit", "core_grants", "cores")


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS cores (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          kind text NOT NULL CHECK (kind IN ('praxis','user','team','situation','source','document','graph','output')),
          name text NOT NULL,
          description text,
          owner_uid text NOT NULL,
          team_id text,
          parent_core_id uuid REFERENCES cores(id) ON DELETE SET NULL,
          version integer NOT NULL DEFAULT 1 CHECK (version > 0),
          status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','locked')),
          tags text[] NOT NULL DEFAULT '{}'::text[],
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          ontology_id text,
          ontology_version text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          created_by text NOT NULL,
          CONSTRAINT cores_platform_owner CHECK (kind <> 'praxis' OR owner_uid = 'platform')
        );

        CREATE INDEX IF NOT EXISTS idx_cores_owner_kind_status
          ON cores(owner_uid, kind, status);
        CREATE INDEX IF NOT EXISTS idx_cores_team_kind_status
          ON cores(team_id, kind, status)
          WHERE team_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_cores_parent
          ON cores(parent_core_id);
        CREATE INDEX IF NOT EXISTS idx_cores_tags
          ON cores USING gin(tags);
        CREATE INDEX IF NOT EXISTS idx_cores_metadata
          ON cores USING gin(metadata jsonb_path_ops);

        CREATE TABLE IF NOT EXISTS core_grants (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          core_id uuid NOT NULL REFERENCES cores(id) ON DELETE CASCADE,
          principal_kind text NOT NULL CHECK (principal_kind IN ('user','team','link','public')),
          principal_id text NOT NULL,
          role text NOT NULL CHECK (role IN ('owner','editor','commenter','viewer')),
          granted_by text NOT NULL,
          granted_at timestamptz NOT NULL DEFAULT now(),
          expires_at timestamptz,
          revoked_at timestamptz,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        );

        CREATE INDEX IF NOT EXISTS idx_core_grants_core_principal_active
          ON core_grants(core_id, principal_kind, principal_id)
          WHERE revoked_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_core_grants_principal_active
          ON core_grants(principal_kind, principal_id)
          WHERE revoked_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_core_grants_owner
          ON core_grants(owner_uid, core_id);

        CREATE TABLE IF NOT EXISTS core_audit (
          id bigserial PRIMARY KEY,
          owner_uid text NOT NULL,
          core_id uuid NOT NULL REFERENCES cores(id) ON DELETE CASCADE,
          actor_uid text NOT NULL,
          action text NOT NULL CHECK (action IN ('create','read','update','rename','re-parent','fork','share','unshare','archive','restore','delete','attach')),
          before jsonb,
          after jsonb,
          at timestamptz NOT NULL DEFAULT now(),
          request_id text,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        );

        CREATE INDEX IF NOT EXISTS idx_core_audit_owner_core
          ON core_audit(owner_uid, core_id, at DESC);
        CREATE INDEX IF NOT EXISTS idx_core_audit_actor
          ON core_audit(actor_uid, at DESC);
        """
    )

    for table in CORE_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
        op.execute(
            f"""
            CREATE POLICY {table}_tenant_isolation ON {table}
              USING (owner_uid = current_tenant() OR owner_uid = 'platform')
              WITH CHECK (owner_uid = current_tenant() OR owner_uid = 'platform')
            """
        )


def downgrade() -> None:
    for table in CORE_TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
    op.execute("DROP INDEX IF EXISTS idx_core_audit_actor")
    op.execute("DROP INDEX IF EXISTS idx_core_audit_owner_core")
    op.execute("DROP INDEX IF EXISTS idx_core_grants_owner")
    op.execute("DROP INDEX IF EXISTS idx_core_grants_principal_active")
    op.execute("DROP INDEX IF EXISTS idx_core_grants_core_principal_active")
    op.execute("DROP INDEX IF EXISTS idx_cores_metadata")
    op.execute("DROP INDEX IF EXISTS idx_cores_tags")
    op.execute("DROP INDEX IF EXISTS idx_cores_parent")
    op.execute("DROP INDEX IF EXISTS idx_cores_team_kind_status")
    op.execute("DROP INDEX IF EXISTS idx_cores_owner_kind_status")
    op.execute("DROP TABLE IF EXISTS core_audit")
    op.execute("DROP TABLE IF EXISTS core_grants")
    op.execute("DROP TABLE IF EXISTS cores")
