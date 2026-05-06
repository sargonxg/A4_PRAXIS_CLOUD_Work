"""Initial audit log partitions."""
from __future__ import annotations

from alembic import op

revision = "0010_partitions_setup"
down_revision = "0009_canonical_actors"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        DECLARE
          start_month date := date_trunc('month', now())::date;
          partition_start date;
          partition_end date;
          partition_name text;
        BEGIN
          FOR i IN 0..6 LOOP
            partition_start := (start_month + (i || ' months')::interval)::date;
            partition_end := (start_month + ((i + 1) || ' months')::interval)::date;
            partition_name := 'audit_log_' || to_char(partition_start, 'YYYY_MM');
            EXECUTE format(
              'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
              partition_name,
              partition_start,
              partition_end
            );
          END LOOP;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        DECLARE
          r record;
        BEGIN
          FOR r IN
            SELECT inhrelid::regclass::text AS child
            FROM pg_inherits
            WHERE inhparent = 'audit_log'::regclass
          LOOP
            EXECUTE format('DROP TABLE IF EXISTS %s', r.child);
          END LOOP;
        END $$;
        """
    )
