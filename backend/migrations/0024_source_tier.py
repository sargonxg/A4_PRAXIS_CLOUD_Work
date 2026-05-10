"""Add conservative source tier fields to extraction chunk tables."""

from __future__ import annotations

from alembic import op

TIER_CHECK = "tier IN ('T0','T1','T2','T3','T4','T5','T6','T7')"


def upgrade() -> None:
    for table in ("workspace_chunks", "document_chunks"):
        op.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'T7'")
        op.execute(f"ALTER TABLE {table} ADD CONSTRAINT {table}_tier_check CHECK ({TIER_CHECK})")
        op.execute(f"CREATE INDEX IF NOT EXISTS {table}_case_tier_idx ON {table} (case_id, tier)")


def downgrade() -> None:
    for table in ("workspace_chunks", "document_chunks"):
        op.execute(f"DROP INDEX IF EXISTS {table}_case_tier_idx")
        op.execute(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {table}_tier_check")
        op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS tier")
