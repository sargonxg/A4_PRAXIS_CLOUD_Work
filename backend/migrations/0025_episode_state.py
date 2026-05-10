"""Create episode_state for situation and work timeline scoping."""

from __future__ import annotations

from alembic import op


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS episode_state (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          case_id UUID NOT NULL,
          episode_id TEXT NOT NULL,
          owner_uid TEXT NOT NULL,
          strand TEXT NOT NULL CHECK (strand IN ('situation', 'work')),
          episode_type TEXT NOT NULL,
          title TEXT NOT NULL,
          valid_from TIMESTAMPTZ NOT NULL,
          valid_to TIMESTAMPTZ,
          graph_snapshot_id UUID,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS episode_state_case_valid_from_idx ON episode_state (case_id, valid_from)")
    op.execute("CREATE INDEX IF NOT EXISTS episode_state_case_strand_idx ON episode_state (case_id, strand)")
    op.execute("CREATE INDEX IF NOT EXISTS episode_state_owner_case_idx ON episode_state (owner_uid, case_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS episode_state")
