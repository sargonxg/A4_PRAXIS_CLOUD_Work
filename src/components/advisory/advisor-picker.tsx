'use client';

import { useEffect, useState } from 'react';
import { Database, Network, Wrench } from 'lucide-react';
import { advisorCapabilityById } from '@/lib/constants/advisors';
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
        const capability = advisorCapabilityById[a.id];
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
            {capability && (
              <div className="mt-3 space-y-2">
                <p className="rounded-lg border border-navy-200/70 bg-navy-50 px-3 py-2 text-xs leading-relaxed text-navy-700">
                  {capability.boardroomRole}
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <AdvisorCapability icon={Wrench} label="Tools" value={capability.toolAccess.join(', ')} />
                  <AdvisorCapability icon={Database} label="Data" value={a.sourceCategories.slice(0, 3).join(', ')} />
                  <AdvisorCapability icon={Network} label="Graph" value={capability.dialecticaLayer} />
                </div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.allowedTools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-diplomatic-blue/15 bg-diplomatic-blue/5 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue"
                >
                  {tool}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-mono text-navy-400">model: {a.modelTier}</p>
          </button>
        );
      })}
    </div>
  );
}

function AdvisorCapability({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wrench;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-navy-200/70 bg-white px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="line-clamp-3 text-[11px] leading-snug text-navy-600">{value}</p>
    </div>
  );
}
