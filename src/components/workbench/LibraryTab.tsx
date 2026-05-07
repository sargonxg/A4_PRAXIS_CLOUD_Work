'use client';

import { useMemo, useState } from 'react';
import { Archive, ExternalLink, FileText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildLibraryArtifacts, type LibraryArtifact, type LibraryArtifactType } from '@/lib/workbench/library-state';
import { cn } from '@/lib/utils/cn';

const TYPE_LABELS: Record<LibraryArtifactType, string> = {
  source: 'Sources',
  document: 'Documents',
  claim: 'Saved claims',
  memo: 'Memo versions',
  export: 'Exports',
};

export function LibraryTab() {
  const { caseId, caseModule } = useWorkbenchScope();
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<LibraryArtifactType[]>(['source', 'document', 'claim', 'memo', 'export']);
  const [selected, setSelected] = useState<LibraryArtifact | null>(null);
  const artifacts = useMemo(() => buildLibraryArtifacts(caseModule, caseId), [caseId, caseModule]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return artifacts.filter((artifact) => {
      if (!activeTypes.includes(artifact.type)) return false;
      if (!needle) return true;
      return `${artifact.title} ${artifact.summary} ${artifact.badge} ${Object.values(artifact.meta).join(' ')}`.toLowerCase().includes(needle);
    });
  }, [activeTypes, artifacts, query]);

  function toggleType(type: LibraryArtifactType) {
    setActiveTypes((current) => {
      if (current.includes(type)) {
        const next = current.filter((item) => item !== type);
        return next.length ? next : current;
      }
      return [...current, type];
    });
  }

  return (
    <div className="space-y-6" data-testid="workbench-library-surface">
      <section className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-gold-700" />
              <h2 className="text-lg font-semibold text-navy-950">Library</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Browse the case artifact record: sources, documents, saved claims, memo versions, and exports from one faceted view.
            </p>
          </div>
          <ContextHealthChip />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, receipts, claims, versions, exports"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-navy-950 outline-none placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABELS) as LibraryArtifactType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  'rounded-md border px-3 py-2 text-xs font-semibold',
                  activeTypes.includes(type) ? 'border-navy-700 bg-navy-900 text-white' : 'border-slate-300 bg-white text-slate-800',
                )}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-navy-950">Artifacts</p>
            <p className="text-xs font-semibold text-slate-700">{filtered.length} shown</p>
          </div>
          <div className="divide-y divide-slate-200">
            {filtered.map((artifact) => (
              <button
                key={artifact.id}
                type="button"
                onClick={() => setSelected(artifact)}
                className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[auto_minmax(0,1fr)_auto]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <FileText className="h-4 w-4 text-gold-700" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy-950">{artifact.title}</span>
                    <Badge variant="default" className="bg-gold-100 text-navy-950">{artifact.type}</Badge>
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-slate-700">{artifact.summary}</span>
                </span>
                <span className="text-xs font-semibold text-slate-700">{formatDate(artifact.date)}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          {selected ? (
            <div>
              <Badge variant="default" className="bg-gold-100 text-navy-950">{TYPE_LABELS[selected.type]}</Badge>
              <h3 className="mt-3 text-base font-semibold text-navy-950">{selected.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{selected.summary}</p>
              <dl className="mt-4 space-y-2">
                {Object.entries(selected.meta).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-semibold text-slate-700">{key}</dt>
                    <dd className="text-right text-xs text-navy-900">{value}</dd>
                  </div>
                ))}
              </dl>
              {selected.href ? (
                <a href={selected.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-800">
                  Open source
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-navy-950">Select an artifact</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Details, provenance fields, and source/export actions appear here.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Not dated';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(parsed));
}
