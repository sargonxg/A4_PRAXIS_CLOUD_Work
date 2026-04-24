'use client';

import { useEffect, useState } from 'react';
import type { AdvisorConfig } from '@/types/advisor';

export default function AdminAdvisorsPage() {
  const [allowed, setAllowed] = useState<null | boolean>(null);
  const [advisors, setAdvisors] = useState<AdvisorConfig[]>([]);
  const [selected, setSelected] = useState<AdvisorConfig | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch('/api/admin/me');
        const j = await me.json();
        setAllowed(Boolean(j?.admin));
      } catch {
        setAllowed(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (allowed !== true) return;
    (async () => {
      const r = await fetch('/api/advisors');
      if (r.ok) setAdvisors(await r.json());
    })();
  }, [allowed]);

  function select(a: AdvisorConfig) {
    setSelected(a);
    setDraft(JSON.stringify(a, null, 2));
    setFlash(null);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setFlash(null);
    try {
      const parsed = JSON.parse(draft);
      const r = await fetch(`/api/advisors/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setFlash(err.error ?? 'Save failed');
      } else {
        const saved = (await r.json()) as AdvisorConfig;
        setAdvisors((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
        setSelected(saved);
        setDraft(JSON.stringify(saved, null, 2));
        setFlash(`Saved v${saved.version}`);
      }
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Invalid JSON');
    } finally {
      setSaving(false);
    }
  }

  if (allowed === null) return <div className="p-6 text-sm text-navy-500">Checking access…</div>;
  if (!allowed) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-navy-900">Admin · Advisors</h1>
        <p className="mt-2 text-sm text-red-700">
          403 — your uid is not on <code>ADMIN_ALLOWLIST</code>. Ask an operator to add you.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-navy-900">Admin · Advisors</h1>
        <p className="text-xs text-navy-500">
          Live edit of <code>config/advisors/{'{id}'}</code>. Each save bumps the version and writes a snapshot
          to <code>config/advisors_history</code>. The 5-minute resolver cache is busted automatically.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          {advisors.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => select(a)}
              aria-pressed={selected?.id === a.id}
              className={`w-full text-left rounded-md border px-3 py-2 text-xs ${
                selected?.id === a.id ? 'border-diplomatic-blue bg-diplomatic-blue/5' : 'border-navy-200 hover:bg-navy-50'
              }`}
            >
              <p className="font-semibold text-navy-900">{a.name}</p>
              <p className="text-navy-500">{a.id} · v{a.version}</p>
            </button>
          ))}
        </aside>
        <main>
          {selected ? (
            <div className="space-y-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[420px] w-full rounded-md border border-navy-200 bg-navy-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-200"
                spellCheck={false}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded bg-diplomatic-blue px-4 py-1.5 text-xs text-white disabled:bg-navy-300"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                {flash && <span className="text-xs text-navy-700">{flash}</span>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-navy-500">Select an advisor to edit.</p>
          )}
        </main>
      </div>
    </div>
  );
}
