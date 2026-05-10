"""User model version history migration scaffold."""

SQL = """
CREATE TABLE IF NOT EXISTS user_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid TEXT NOT NULL,
  parent_model_id UUID NULL,
  model_id TEXT NOT NULL,
  version INT NOT NULL,
  fields_json JSONB NOT NULL,
  published_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (deprecated_at IS NULL OR published_at IS NULL OR deprecated_at >= published_at),
  UNIQUE (user_uid, model_id, version)
);
CREATE INDEX IF NOT EXISTS idx_user_model_versions_latest
  ON user_model_versions (user_uid, model_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_user_model_versions_parent
  ON user_model_versions (parent_model_id);
"""

ROLLBACK_SQL = "DROP TABLE IF EXISTS user_model_versions;"


def upgrade(conn) -> None:
    conn.execute(SQL)


def downgrade(conn) -> None:
    conn.execute(ROLLBACK_SQL)
