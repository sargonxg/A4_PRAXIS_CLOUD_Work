"""notifications taxonomy feedback lifecycle

Revision ID: 0018_notifications_feedback_system
Revises: 0017_deep_preship_foundation
Create Date: 2026-05-07
"""
from __future__ import annotations

from alembic import op

revision = "0018_notifications_feedback_system"
down_revision = "0017_deep_preship_foundation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE notifications
          ADD COLUMN IF NOT EXISTS recipient_uid text,
          ADD COLUMN IF NOT EXISTS type text,
          ADD COLUMN IF NOT EXISTS category text,
          ADD COLUMN IF NOT EXISTS urgency text,
          ADD COLUMN IF NOT EXISTS channels jsonb NOT NULL DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'pending',
          ADD COLUMN IF NOT EXISTS dedup_key text,
          ADD COLUMN IF NOT EXISTS action_url text,
          ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
          ADD COLUMN IF NOT EXISTS acted_at timestamptz,
          ADD COLUMN IF NOT EXISTS dismissed_at timestamptz,
          ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days';

        UPDATE notifications
        SET recipient_uid = COALESCE(recipient_uid, owner_uid),
            type = COALESCE(type, event_type),
            category = COALESCE(category, 'operational'),
            urgency = COALESCE(urgency, 'immediate'),
            state = CASE
              WHEN read_at IS NOT NULL THEN 'read'
              WHEN status = 'unread' THEN 'delivered'
              ELSE COALESCE(state, 'pending')
            END
        WHERE recipient_uid IS NULL OR type IS NULL OR category IS NULL OR urgency IS NULL;

        ALTER TABLE notifications
          ALTER COLUMN recipient_uid SET NOT NULL,
          ALTER COLUMN type SET NOT NULL,
          ALTER COLUMN category SET NOT NULL,
          ALTER COLUMN urgency SET NOT NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup_active
          ON notifications(recipient_uid, type, dedup_key)
          WHERE dedup_key IS NOT NULL AND state NOT IN ('expired');

        CREATE INDEX IF NOT EXISTS idx_notifications_recipient_state
          ON notifications(recipient_uid, state, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_type
          ON notifications(recipient_uid, type, created_at DESC);

        ALTER TABLE notification_preferences
          ADD COLUMN IF NOT EXISTS recipient_uid text,
          ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/New_York',
          ADD COLUMN IF NOT EXISTS per_type jsonb NOT NULL DEFAULT '{}'::jsonb,
          ADD COLUMN IF NOT EXISTS digest_time text NOT NULL DEFAULT '08:00';

        UPDATE notification_preferences
        SET recipient_uid = COALESCE(recipient_uid, owner_uid)
        WHERE recipient_uid IS NULL;

        CREATE TABLE IF NOT EXISTS notification_signals (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_uid text NOT NULL,
          recipient_uid text NOT NULL,
          notification_id uuid,
          type text NOT NULL,
          signal text NOT NULL CHECK (signal IN ('read','acted','dismissed','ignored')),
          dedup_key text,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_notification_signals_recipient_type
          ON notification_signals(recipient_uid, type, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notification_signals_notification
          ON notification_signals(notification_id, created_at DESC);
        """
    )
    op.execute("ALTER TABLE notification_signals ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS notification_signals_tenant_isolation ON notification_signals")
    op.execute(
        """
        CREATE POLICY notification_signals_tenant_isolation ON notification_signals
          USING (owner_uid = current_tenant())
          WITH CHECK (owner_uid = current_tenant())
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS notification_signals_tenant_isolation ON notification_signals")
    op.execute("DROP TABLE IF EXISTS notification_signals")
    op.execute("DROP INDEX IF EXISTS idx_notifications_type")
    op.execute("DROP INDEX IF EXISTS idx_notifications_recipient_state")
    op.execute("DROP INDEX IF EXISTS idx_notifications_dedup_active")
