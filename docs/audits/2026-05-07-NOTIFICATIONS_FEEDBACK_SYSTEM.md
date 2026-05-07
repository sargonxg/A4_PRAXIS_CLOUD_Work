# NOTIFICATIONS_FEEDBACK_SYSTEM Audit — 2026-05-07

Source prompt: `C:\Users\giuli\Downloads\NOTIFICATIONS_FEEDBACK_SYSTEM.md`

## Status

Implemented the in-app notification and feedback foundation:

- Taxonomy registry with all 16 canonical notification types.
- Postgres lifecycle migration for notification recipient, category, urgency, channels, state, deduplication, action URL, delivery/acted/dismissed timestamps, and `notification_signals`.
- Backend notification service with typed payload validation, quiet-hours handling, per-type mute/digest preferences, five-minute bundling, `workspace_orchestrator_log` audit entries, and acted/dismissed Cognee feedback calls with `save_interaction=True`.
- Backend router at `/v1/notifications` and `/api/v1/notifications` for list, SSE snapshot stream, signal capture, registry metadata, preferences, and test notifications.
- Next.js proxy allowlist/fallbacks for notification routes.
- Notification center UI with unread count, category styling, action buttons, dismiss/read/acted signals, and a link to settings.
- `/app/settings/notifications` page for channels, quiet hours, per-type modes, save, and test notification.
- Regression coverage through `audit:notifications-feedback` and `backend/tests/test_notifications_feedback_system.py`.

## Verification

- `npm run audit:notifications-feedback` — PASS.
- `npm run typecheck` — PASS.
- `.\\backend\\.venv\\Scripts\\python.exe -m py_compile backend\\routers\\notifications.py backend\\services\\notifications\\__init__.py backend\\services\\notifications\\registry.py backend\\migrations\\versions\\0018_notifications_feedback_system.py backend\\main.py` — PASS.
- `.\\backend\\.venv\\Scripts\\python.exe -m pytest backend\\tests\\test_notifications_feedback_system.py -q` — PASS.

## Remaining Live Gates

- Email digest, immediate email, browser push, and webhook delivery workers are not enabled in this pass; the channel contract is stored in preferences and notification rows, but live external delivery remains a later operations slice.
- The SSE endpoint currently emits a snapshot plus heartbeat; durable push/NOTIFY fanout can be added once the live notification worker is deployed.
- Production timing, real-user preferences persistence, and Cognee feedback cost/latency need staging/prod verification after migration `0018_notifications_feedback_system` is applied.
