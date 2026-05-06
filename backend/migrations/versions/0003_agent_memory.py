"""Agent memory table."""
from __future__ import annotations

from alembic import op

revision = "0003_agent_memory"
down_revision = "0002_embeddings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS agent_memory (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id text NOT NULL,
          agent_kind text NOT NULL,
          scope text NOT NULL,
          scope_id text NOT NULL,
          summary text NOT NULL,
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          embedding vector(768) NOT NULL,
          importance int NOT NULL DEFAULT 1,
          use_count int NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now(),
          last_used_at timestamptz
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS agent_memory_lookup_idx ON agent_memory (tenant_id, agent_kind, scope, scope_id, importance DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS agent_memory_hnsw_idx ON agent_memory USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)")
    op.execute("ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS agent_memory_tenant_isolation ON agent_memory")
    op.execute("CREATE POLICY agent_memory_tenant_isolation ON agent_memory USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS agent_memory")
