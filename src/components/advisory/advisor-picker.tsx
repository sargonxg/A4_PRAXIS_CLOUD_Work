'use client';

import { useEffect, useState } from 'react';
import type { AdvisorConfig } from '@/types/advisor';

export function AdvisorPicker({ onPick, selectedId }: { onPick: (a: AdvisorConfig) => void; selectedId?: string }) {
  const [advisors, setAdvisors] = useState<AdvisorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/advisors');
        if (!r.ok) throw new Error('list failed');
        const list = (await r.json()) as AdvisorConfig[];
        if (!cancelled) setAdvisors(list);
      } catch {
        if (!cancelled) setError('Could not load advisors. Seed them with `npm run seed:advisors`.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p className="text-sm text-navy-500">Loading advisors…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }
  if (advisors.length === 0) {
    return (
      <p className="text-sm text-navy-500">
        No advisors configured yet. An admin can seed the four flagships with{' '}
        <code>npm run seed:advisors</code>.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {advisors.map((a) => {
        const active = a.id === selectedId;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a)}
            aria-pressed={active}
            className={`text-left rounded-xl border p-4 transition ${
              active
                ? 'border-diplomatic-blue bg-diplomatic-blue/5 ring-2 ring-diplomatic-blue/20'
                : 'border-navy-200 bg-white hover:border-navy-300 hover:bg-navy-50'
            }`}
          >
            <p className="text-sm font-semibold text-navy-900">{a.name}</p>
            <p className="text-[11px] uppercase tracking-wider text-navy-500">{a.title}</p>
            <p className="mt-2 text-xs leading-relaxed text-navy-600">{a.bio}</p>
            <p className="mt-3 text-[10px] font-mono text-navy-400">model: {a.modelTier}</p>
          </button>
        );
      })}
    </div>
  );
}
