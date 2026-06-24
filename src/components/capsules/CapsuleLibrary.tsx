'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, Eye, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import {
  CAPSULE_LIBRARY_CATEGORIES,
  CAPSULE_LIBRARY_ENTRIES,
  filterCapsuleLibraryEntries,
  type CapsuleLibraryCategory,
  type CapsuleLibraryEntry,
} from '@/lib/capsules/library';
import { tryLibraryCapsule } from '@/lib/capsules/library-try';
import { cn } from '@/lib/utils/cn';

interface CapsuleLibraryProps {
  entries?: CapsuleLibraryEntry[];
  initialCategory?: CapsuleLibraryCategory | 'all';
  busyCapsuleId?: string | null;
  status?: string | null;
  onTryCapsule?: (entry: CapsuleLibraryEntry) => void;
}

export function CapsuleLibraryWithTry(props: Omit<CapsuleLibraryProps, 'onTryCapsule' | 'busyCapsuleId' | 'status'>) {
  const router = useRouter();
  const { saveStack } = useActiveContextStack();
  const [busyCapsuleId, setBusyCapsuleId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleTryCapsule(entry: CapsuleLibraryEntry) {
    setBusyCapsuleId(entry.id);
    setStatus(null);
    const result = await tryLibraryCapsule(entry, { saveStack });
    setBusyCapsuleId(null);
    if (result.status === 'attached') {
      setStatus(`${entry.title} attached.`);
      router.push('/app');
      return;
    }
    if (result.status === 'needs-auth') {
      router.push(`/login?mode=signup&redirect=${encodeURIComponent('/app/capsules')}`);
      return;
    }
    setStatus(result.reason);
  }

  return (
    <CapsuleLibrary
      {...props}
      busyCapsuleId={busyCapsuleId}
      status={status}
      onTryCapsule={(entry) => void handleTryCapsule(entry)}
    />
  );
}

export function CapsuleLibrary({
  entries = CAPSULE_LIBRARY_ENTRIES,
  initialCategory = 'all',
  busyCapsuleId = null,
  status = null,
  onTryCapsule,
}: CapsuleLibraryProps) {
  const [category, setCategory] = useState<CapsuleLibraryCategory | 'all'>(initialCategory);
  const filtered = useMemo(() => filterCapsuleLibraryEntries(entries, category), [category, entries]);

  return (
    <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]" data-testid="capsule-library">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Capsule Library</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Start with context.</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Pick a reviewed starter capsule. PRAXIS docks its sources, claims, ontology, and output rules before chat.
          </p>
        </div>
        {status ? (
          <p className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Capsule categories">
        <CategoryChip active={category === 'all'} label="All" onClick={() => setCategory('all')} />
        {CAPSULE_LIBRARY_CATEGORIES.map((item) => (
          <CategoryChip
            key={item.id}
            active={category === item.id}
            label={item.label}
            onClick={() => setCategory(item.id)}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((entry) => (
          <article
            key={entry.id}
            className="flex min-h-[18rem] flex-col rounded-[var(--radius-md)] border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{entry.category.replace('-', ' ')}</p>
                <h3 className="mt-1 text-base font-semibold leading-6 text-slate-950">{entry.title}</h3>
              </div>
              <span className={cn(
                'shrink-0 rounded-[var(--radius-full)] border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
                entry.readinessTier === 'verified' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                entry.readinessTier === 'ready' && 'border-blue-200 bg-blue-50 text-blue-700',
                entry.readinessTier === 'review' && 'border-amber-200 bg-amber-50 text-amber-700',
              )}>
                {entry.readinessTier}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-650">{entry.valueProp}</p>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <InsideStat label="Sources" value={entry.inside.sources} />
              <InsideStat label="Claims" value={entry.inside.claims} />
              <InsideStat label="Graph" value={`${entry.inside.graphNodes}/${entry.inside.graphEdges}`} />
              <InsideStat label="Quality" value={Math.round(entry.ranking.score)} />
            </dl>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {entry.ontologyStack.slice(0, 4).map((item) => (
                <span key={item} className="rounded-[var(--radius-full)] border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
              <button
                type="button"
                onClick={() => onTryCapsule?.(entry)}
                disabled={!onTryCapsule || busyCapsuleId === entry.id}
                className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyCapsuleId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Boxes className="h-4 w-4" />}
                Try this capsule
              </button>
              <Link
                href={`/app/capsules?starter=${encodeURIComponent(entry.id)}&lane=inspect`}
                className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                Inspect
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CategoryChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-[var(--radius-full)] border px-3 py-1.5 text-xs font-semibold transition',
        active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  );
}

function InsideStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
