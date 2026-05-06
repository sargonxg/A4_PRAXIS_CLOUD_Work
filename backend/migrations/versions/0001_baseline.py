"""Phase 1 baseline extensions and tenant helper."""
from __future__ import annotations

from alembic import op

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'praxis_app') THEN
            CREATE ROLE praxis_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT LOGIN;
          END IF;
        END $$;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION current_tenant()
        RETURNS text
        LANGUAGE sql
        STABLE
        AS $$
          SELECT current_setting('app.tenant_id', true)
        $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS current_tenant()")
