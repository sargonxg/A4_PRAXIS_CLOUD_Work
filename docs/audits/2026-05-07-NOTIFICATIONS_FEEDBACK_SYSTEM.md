# NOTIFICATIONS_FEEDBACK_SYSTEM Audit — 2026-05-07

Source prompt: `C:\Users\giuli\Downloads\NOTIFICATIONS_FEEDBACK_SYSTEM.md`

## Status

Implemented the in-app notification and feedback foundation:

- Taxonomy registry with all 16 canonical notification types.
- Postgres lifecycle migration for notification recipient, category, urgency, channels, state, deduplication, action URL, delivery/acted/dismissed timestamps, and `notification_signals`.
- Backend notification service with typed payload validation, quiet-hours handling, per-type mute/digest preferences, five-minute bundling, `workspace_orchestrator_log` audit entries, and acted/dismissed Cognee feedback calls with `save_interaction=True`.
- External-channel dispatch contract that keeps email digest, immediate email, browser push, and webhook receipts queued until a provider is configured, records `provider_unconfigured` instead of fake delivery, caps delivery attempts at three, and signs webhook payloads with HMAC-SHA256.
- Backend router at `/v1/notifications` and `/api/v1/notifications` for list, SSE snapshot stream, signal capture, registry metadata, preferences, test notifications, and user-scoped delivery dispatch.
- Next.js proxy allowlist/fallbacks for notification routes.
- Notification center UI with unread count, category styling, action buttons, dismiss/read/acted signals, and a link to settings.
- `/app/settings/notifications` page for channels, quiet hours, per-type modes, save, and test notification.
- Regression coverage through `audit:notifications-feedback` and `backend/tests/test_notifications_feedback_system.py`.

## Verification

- `npm run audit:notifications-feedback` — PASS.
- `npm run typecheck` — PASS.
- `npm run build` — PASS.
- `.\\backend\\.venv\\Scripts\\python.exe -m py_compile backend\\routers\\notifications.py backend\\services\\notifications\\__init__.py backend\\services\\notifications\\registry.py backend\\services\\notifications\\delivery.py backend\\migrations\\versions\\0018_notifications_feedback_system.py backend\\main.py` — PASS.
- `.\\backend\\.venv\\Scripts\\python.exe -m pytest backend\\tests\\test_notifications_feedback_system.py backend\\tests\\test_notifications_delivery.py -q` — PASS, 7 tests.

## Remaining Live Gates

- Email digest, immediate email, browser push, and webhook provider sends are not enabled in this pass; the dispatcher now preserves queued/provider-unconfigured receipts and audit logs, but provider credentials, Cloud Scheduler jobs, push subscriptions, and webhook workspace configuration remain live operations slices.
- The SSE endpoint currently emits a snapshot plus heartbeat; durable push/NOTIFY fanout can be added once the live notification worker is deployed.
- Production timing, real-user preferences persistence, and Cognee feedback cost/latency need staging/prod verification after migration `0018_notifications_feedback_system` is applied.
