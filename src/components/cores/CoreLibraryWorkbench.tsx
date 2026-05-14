'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { SpecimenCard, type CoreSpecimenKind } from '@/components/cores/specimen-card';
import type { LibraryCore } from '@/lib/cores/core-library';

const FILTERS: Array<{ id: CoreSpecimenKind | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'user', label: 'Users' },
  { id: 'situation', label: 'Situations' },
  { id: 'tool', label: 'Tools' },
  { id: 'objective', label: 'Objectives' },
  { id: 'product', label: 'Products' },
  { id: 'source', label: 'Sources' },
  { id: 'graph', label: 'Graphs' },
  { id: 'time', label: 'Time' },
  { id: 'output', label: 'Outputs' },
  { id: 'memory', label: 'Memory' },
];

export function CoreLibraryWorkbench({ cores }: { cores: LibraryCore[] }) {
  const [kind, setKind] = useState<CoreSpecimenKind | 'all'>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cores
      .filter((core) => kind === 'all' || core.kind === kind)
      .filter((core) => {
        if (!q) return true;
        return [core.name, core.essence, core.kind, core.ownerScope, ...core.tags].join(' ').toLowerCase().includes(q);
      })
      .slice(0, 36);
  }, [cores, kind, query]);

  return (
    <section className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-diplomatic-blue" />
            <h2 className="text-lg font-semibold text-navy-950">Unified core library</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            Drag, swap, and reuse the same library elements across Ask PRAXIS, Memo Studio, Canvas, and handoff. User, situation, tool, objective, and product cores all become capsule context.
          </p>
        </div>
        <label className="relative block w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cores, tools, objectives..."
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-900 outline-none focus:border-diplomatic-blue"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setKind(filter.id)}
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
              kind === filter.id
                ? 'border-diplomatic-blue bg-diplomatic-blue text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-diplomatic-blue/40',
            ].join(' ')}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((core) => (
          <SpecimenCard
            key={`${core.kind}:${core.id}`}
            kind={core.kind}
            title={core.name}
            essence={core.essence}
            trailing={<Completeness value={core.completeness} />}
          />
        ))}
      </div>
    </section>
  );
}

function Completeness({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
      {value}%
    </span>
  );
}
