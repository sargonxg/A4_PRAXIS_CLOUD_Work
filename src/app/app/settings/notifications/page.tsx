'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Clock, Mail, Send, Smartphone, TestTube2, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type NotificationTypeRow = {
  type: string;
  category: string;
  urgency: string;
  channels: string[];
  actionVerb: string;
  description: string;
};

type Preferences = {
  channels: Record<string, boolean>;
  per_type: Record<string, string>;
  quiet_hours: { enabled?: boolean; start?: string; end?: string };
  timezone: string;
  digest_time: string;
  do_not_disturb: boolean;
};

const DEFAULT_PREFS: Preferences = {
  channels: { in_app: true, email_digest: false, email_immediate: false, browser_push: false, webhook: false },
  per_type: {},
  quiet_hours: { enabled: false, start: '22:00', end: '07:00' },
  timezone: 'America/New_York',
  digest_time: '08:00',
  do_not_disturb: false,
};

const CHANNELS = [
  { key: 'in_app', label: 'In-app', icon: Bell, locked: true },
  { key: 'browser_push', label: 'Browser push', icon: Smartphone },
  { key: 'email_digest', label: 'Email digest', icon: Mail },
  { key: 'email_immediate', label: 'Immediate email', icon: Send },
  { key: 'webhook', label: 'Workspace webhook', icon: Webhook },
];

export default function NotificationSettingsPage() {
  const [types, setTypes] = useState<NotificationTypeRow[]>([]);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'testing' | 'error'>('idle');

  useEffect(() => {
    void Promise.all([
      fetch('/api/backend/notifications/registry').then((res) => res.json()).catch(() => ({ types: [] })),
      fetch('/api/backend/notifications/preferences').then((res) => res.json()).catch(() => ({ preferences: DEFAULT_PREFS })),
    ]).then(([registry, pref]) => {
      setTypes(registry.types ?? []);
      setPrefs({ ...DEFAULT_PREFS, ...(pref.preferences ?? {}) });
    });
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, NotificationTypeRow[]>();
    for (const row of types) map.set(row.category, [...(map.get(row.category) ?? []), row]);
    return Array.from(map.entries());
  }, [types]);

  async function save(next: Preferences) {
    setPrefs(next);
    setStatus('saving');
    try {
      const res = await fetch('/api/backend/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  async function sendTest() {
    setStatus('testing');
    try {
      const res = await fetch('/api/backend/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_type: 'source_ingest_complete', case_id: 'test-case' }),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-serif text-navy-900">Notifications</h1>
        <p className="mt-1 text-sm text-navy-600">
          Control which PRAXIS events interrupt you, which ones wait for a digest, and when quiet hours apply.
        </p>
      </header>

      <section className="rounded-lg border border-[var(--color-app-border)] bg-white">
        <div className="border-b border-[var(--color-app-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-navy-900">Channels</h2>
          <p className="mt-1 text-xs text-navy-600">In-app notifications stay on; external channels are opt-in.</p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          {CHANNELS.map(({ key, label, icon: Icon, locked }) => {
            const enabled = prefs.channels?.[key] ?? false;
            return (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={() => save({ ...prefs, channels: { ...prefs.channels, [key]: !enabled } })}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                  enabled ? 'border-diplomatic-blue/30 bg-diplomatic-blue/5 text-navy-900' : 'border-navy-200 bg-white text-navy-600',
                  locked && 'cursor-not-allowed opacity-80'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-app-border)] bg-white">
        <div className="border-b border-[var(--color-app-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-navy-900">Notification types</h2>
          <p className="mt-1 text-xs text-navy-600">Each type can be Off, Digest, Immediate, or Default.</p>
        </div>
        <div className="divide-y divide-[var(--color-app-border)]">
          {grouped.map(([category, rows]) => (
            <div key={category} className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-600">{category}</h3>
              <div className="mt-3 space-y-2">
                {rows.map((row) => (
                  <div key={row.type} className="grid gap-3 rounded-md border border-navy-200 px-3 py-2 sm:grid-cols-[1fr_160px] sm:items-center">
                    <div>
                      <p className="text-sm font-medium text-navy-900">{row.type.replaceAll('_', ' ')}</p>
                      <p className="mt-0.5 text-xs text-navy-600">{row.description}</p>
                    </div>
                    <select
                      value={prefs.per_type?.[row.type] ?? 'default'}
                      onChange={(event) => save({ ...prefs, per_type: { ...prefs.per_type, [row.type]: event.target.value } })}
                      className="rounded-md border border-navy-200 bg-white px-2 py-1.5 text-xs text-navy-800"
                    >
                      <option value="default">Default</option>
                      <option value="off">Off</option>
                      <option value="digest">Digest</option>
                      <option value="immediate">Immediate</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-lg border border-[var(--color-app-border)] bg-white p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-sm font-semibold text-navy-900">Quiet hours</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <label className="flex items-center gap-2 text-sm text-navy-700">
              <input
                type="checkbox"
                checked={prefs.quiet_hours?.enabled === true}
                onChange={(event) => save({ ...prefs, quiet_hours: { ...prefs.quiet_hours, enabled: event.target.checked } })}
              />
              Enabled
            </label>
            <input
              value={prefs.quiet_hours?.start ?? '22:00'}
              onChange={(event) => save({ ...prefs, quiet_hours: { ...prefs.quiet_hours, start: event.target.value } })}
              className="rounded-md border border-navy-200 px-2 py-1.5 text-sm"
            />
            <input
              value={prefs.quiet_hours?.end ?? '07:00'}
              onChange={(event) => save({ ...prefs, quiet_hours: { ...prefs.quiet_hours, end: event.target.value } })}
              className="rounded-md border border-navy-200 px-2 py-1.5 text-sm"
            />
            <input
              value={prefs.digest_time ?? '08:00'}
              onChange={(event) => save({ ...prefs, digest_time: event.target.value })}
              className="rounded-md border border-navy-200 px-2 py-1.5 text-sm"
              aria-label="Digest time"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={sendTest}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-diplomatic-blue/90"
        >
          <TestTube2 className="h-4 w-4" />
          Send test
        </button>
      </section>

      <div className="h-4 text-xs text-navy-600">
        {status === 'saving' && 'Saving...'}
        {status === 'testing' && 'Sending test notification...'}
        {status === 'saved' && <span className="text-emerald-700">Saved.</span>}
        {status === 'error' && <span className="text-red-700">The notification service is unavailable.</span>}
      </div>
    </div>
  );
}
