"""Align graph_embeddings.embedding to vector(768) for PRAXIS embedding canon.

Revision ID: 0012_embedding_dim_alignment
Revises: 0011_postgres_kg_contract
Create Date: 2026-05-08
"""
from __future__ import annotations

from alembic import op

revision = "0012_embedding_dim_alignment"
down_revision = "0011_postgres_kg_contract"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Pre-flight before applying outside empty local/dev DBs:
    #   SELECT count(*) FROM graph_embeddings;
    # If non-zero, back up and re-embed or truncate only with explicit approval.
    op.execute(
        """
        DO $$
        DECLARE r RECORD;
        BEGIN
            FOR r IN SELECT indexname
                     FROM pg_indexes
                     WHERE tablename = 'graph_embeddings'
                       AND indexdef ILIKE '%embedding%'
            LOOP
                EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
            END LOOP;
        END $$;
        """
    )
    op.execute("ALTER TABLE graph_embeddings ALTER COLUMN embedding TYPE vector(768)")
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS graph_embeddings_embedding_ivfflat_idx
        ON graph_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS graph_embeddings_embedding_ivfflat_idx")
    op.execute("ALTER TABLE graph_embeddings ALTER COLUMN embedding TYPE vector(1536)")
