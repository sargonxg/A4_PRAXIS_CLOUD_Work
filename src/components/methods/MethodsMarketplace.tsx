'use client';

import { useMemo, useState } from 'react';
import { Archive, Search } from 'lucide-react';
import { CATEGORY_LABELS, getDeferredMarketplaceTools, MVP_METHODS, type MethodCategory } from '@/lib/methods/catalog';
import { cn } from '@/lib/utils/cn';
import { MethodCard } from '@/components/methods/MethodCard';
import { SuggestionStrip } from '@/components/methods/SuggestionStrip';

const CATEGORY_FILTERS: Array<MethodCategory | 'all'> = ['all', 'ai', 'research', 'deterministic'];

export function MethodsMarketplace() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MethodCategory | 'all'>('all');
  const [hasContext, setHasContext] = useState(false);
  const deferredCount = getDeferredMarketplaceTools().length;

  const visibleMethods = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return MVP_METHODS
      .filter((method) => category === 'all' || method.category === category)
      .filter((method) => {
        if (!needle) return true;
        const haystack = [
          method.name,
          method.summary,
          method.category,
          method.bestFor.join(' '),
          method.inputs.join(' '),
          method.outputs.join(' '),
        ].join(' ').toLowerCase();
        return haystack.includes(needle);
      });
  }, [category, query]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-navy-500">PRAXIS workbench</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy-900">Methods</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy-600">
              Ten focused methods for research, analysis, and drafting support. The wider tool catalog remains available behind the app, but
              this is the MVP surface operators should use first.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <Metric label="MVP" value="10" />
            <Metric label="Suggested" value="3" />
            <Metric label="Catalog" value={`${deferredCount} deferred`} />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
            <Search className="h-4 w-4 text-navy-500" />
            <span className="sr-only">Search methods</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search methods, outputs, or use cases"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy-700">
            <span>Active context</span>
            <input
              type="checkbox"
              checked={hasContext}
              onChange={(event) => setHasContext(event.target.checked)}
              className="h-4 w-4 accent-navy-900"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setCategory(filter)}
              className={cn(
                'rounded-md border px-3 py-2 text-xs font-semibold',
                category === filter ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-white text-navy-700 hover:bg-slate-50',
              )}
            >
              {filter === 'all' ? 'All' : CATEGORY_LABELS[filter]}
            </button>
          ))}
        </div>
      </header>

      <SuggestionStrip query={query} hasContext={hasContext} />

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {visibleMethods.map((method) => (
          <MethodCard key={method.id} method={method} />
        ))}
      </section>

      {visibleMethods.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-navy-900">No methods match this filter.</p>
          <p className="mt-1 text-sm text-navy-600">Clear search or switch category to see the MVP set.</p>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-navy-600" />
          <h2 className="text-sm font-semibold text-navy-900">Deferred catalog</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          {deferredCount} existing specialist tools remain preserved for later catalog work. They are not exposed as the primary MVP method
          set and are not used for suggestions here.
        </p>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-navy-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-navy-900">{value}</p>
    </div>
  );
}
