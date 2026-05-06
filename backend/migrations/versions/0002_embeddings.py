"""Embeddings table with pgvector and RLS."""
from __future__ import annotations

from alembic import op

revision = "0002_embeddings"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS embeddings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id text NOT NULL,
          uid text,
          situation_id text,
          subject_type text NOT NULL,
          subject_id text NOT NULL,
          content text NOT NULL,
          embedding vector(768) NOT NULL,
          model text NOT NULL,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS embeddings_tenant_subject_idx ON embeddings (tenant_id, situation_id, subject_type, subject_id)")
    op.execute("CREATE INDEX IF NOT EXISTS embeddings_hnsw_idx ON embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)")
    op.execute("ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS embeddings_tenant_isolation ON embeddings")
    op.execute("CREATE POLICY embeddings_tenant_isolation ON embeddings USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS embeddings")
