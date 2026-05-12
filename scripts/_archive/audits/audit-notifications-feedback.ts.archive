import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = path.join(root, rel);
  if (!existsSync(full)) {
    failures.push(`${rel} missing`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

const migration = read('backend/migrations/versions/0018_notifications_feedback_system.py');
for (const marker of [
  'recipient_uid text',
  'type text',
  'category text',
  'urgency text',
  'channels jsonb',
  'state text',
  'dedup_key text',
  'action_url text',
  'notification_signals',
  'notification_signals_tenant_isolation',
]) {
  if (!migration.includes(marker)) failures.push(`0018 migration missing ${marker}`);
}

const registry = read('backend/services/notifications/registry.py');
for (const type of [
  'source_ingest_complete',
  'source_ingest_failed',
  'candidates_ready_batch',
  'dedup_suggestion_ready',
  'thread_idle_nudge',
  'thread_closed_memified',
  'recipe_complete',
  'briefing_exported',
  'budget_warning',
  'budget_paused',
  'cognee_degraded',
  'ontology_update_available',
  'ontology_gap_proposed',
  'workspace_shared',
  'memo_comment',
  'case_milestone',
]) {
  if (!registry.includes(`"${type}"`)) failures.push(`registry missing ${type}`);
}
for (const marker of ['NotificationCategory', 'NotificationUrgency', 'payload_model', 'action_verb', 'action_template']) {
  if (!registry.includes(marker)) failures.push(`registry missing ${marker}`);
}

const service = read('backend/services/notifications/__init__.py');
for (const marker of ['async def notify', 'DEBOUNCE_WINDOW', 'dedup_key', 'quiet_hours', 'workspace_orchestrator_log', 'async def record_signal', 'save_interaction=True', 'positive=signal == "acted"']) {
  if (!service.includes(marker)) failures.push(`notification service missing ${marker}`);
}

const delivery = read('backend/services/notifications/delivery.py');
for (const marker of [
  'dispatch_pending_deliveries',
  'MAX_DELIVERY_ATTEMPTS',
  'sign_webhook_payload',
  'HMAC_SHA256',
  'provider_unconfigured',
  'email-digest',
  'email-immediate',
  'browser-push',
  'webhook',
]) {
  if (!delivery.includes(marker)) failures.push(`notification delivery missing ${marker}`);
}

const router = read('backend/routers/notifications.py');
for (const marker of ['@router.get("/stream")', '@router.post("/{notification_id}/signal")', '@router.get("/preferences")', '@router.put("/preferences")', '@router.post("/test")', '@router.post("/dispatch")', '@router.get("/registry")']) {
  if (!router.includes(marker)) failures.push(`notifications router missing ${marker}`);
}

const main = read('backend/main.py');
if (!main.includes('notifications.router') || !main.includes('/v1/notifications')) {
  failures.push('backend/main.py does not mount notifications router');
}

const proxy = read('src/app/api/backend/[...path]/route.ts');
for (const marker of ['notifications/stream', 'notifications/registry', 'notifications/preferences', 'notifications/test', 'notifications/dispatch', 'notifications\\/[^/]+\\/signal']) {
  if (!proxy.includes(marker)) failures.push(`backend proxy missing ${marker}`);
}

const hook = read('src/hooks/use-live-notifications.ts');
for (const marker of ['EventSource', '/api/backend/notifications/stream', 'postSignal', "signal: 'read' | 'acted' | 'dismissed'", 'fromBackend']) {
  if (!hook.includes(marker)) failures.push(`use-live-notifications missing ${marker}`);
}

const bell = read('src/components/shared/notifications.tsx');
for (const marker of ['categoryConfig', 'actionVerb', '/app/settings/notifications', 'You&apos;re caught up.', 'Notification settings']) {
  if (!bell.includes(marker)) failures.push(`NotificationBell missing ${marker}`);
}

const settings = read('src/app/app/settings/notifications/page.tsx');
for (const marker of ['NotificationSettingsPage', '/api/backend/notifications/preferences', '/api/backend/notifications/test', 'quiet_hours', 'per_type']) {
  if (!settings.includes(marker)) failures.push(`settings notifications page missing ${marker}`);
}

if (failures.length) {
  console.error('[audit:notifications-feedback] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:notifications-feedback] ok (static-marker)');
