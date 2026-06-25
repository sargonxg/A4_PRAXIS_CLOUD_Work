'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, Eye, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { CapsuleLibraryCard } from '@/components/capsules/CapsuleLibraryCard';
import {
  CAPSULE_LIBRARY_CATEGORIES,
  CAPSULE_LIBRARY_ENTRIES,
  buildCapsuleRepositoryEntries,
  filterCapsuleLibraryEntries,
  filterCapsuleRepositoryEntries,
  type CapsuleLibraryCategory,
  type CapsuleLibraryEntry,
} from '@/lib/capsules/library';
import { activeContextPatchForLibraryEntry, tryLibraryCapsule } from '@/lib/capsules/library-try';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
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
  const [userCapsules, setUserCapsules] = useState<PraxisCapsule[]>([]);
  const [busyCapsuleId, setBusyCapsuleId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const entries = useMemo(
    () => buildCapsuleRepositoryEntries({
      userCapsules,
      starterEntries: props.entries ?? CAPSULE_LIBRARY_ENTRIES,
    }),
    [props.entries, userCapsules],
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/context/capsules', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { capsules?: PraxisCapsule[] } | null) => {
        if (!cancelled && Array.isArray(body?.capsules)) setUserCapsules(body.capsules);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleTryCapsule(entry: CapsuleLibraryEntry) {
    setBusyCapsuleId(entry.id);
    setStatus(null);
    const result = entry.origin === 'starter'
      ? await tryLibraryCapsule(entry, { saveStack })
      : await saveStack(activeContextPatchForLibraryEntry(entry))
        .then(() => ({ status: 'attached' as const, capsuleId: entry.id, seeded: false }))
        .catch((error: unknown) => ({ status: 'failed' as const, capsuleId: entry.id, reason: error instanceof Error ? error.message : 'Attach failed' }));
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
      entries={entries}
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
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput), 180);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const filtered = useMemo(() => filterCapsuleRepositoryEntries(entries, category, searchQuery), [category, entries, searchQuery]);
  const categoryGroups = useMemo(
    () => CAPSULE_LIBRARY_CATEGORIES
      .map((item) => ({
        ...item,
        entries: filterCapsuleLibraryEntries(filtered, item.id),
      }))
      .filter((item) => item.entries.length > 0),
    [filtered],
  );

  return (
    <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]" data-testid="capsule-library">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Capsule Repository</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Pick the context for this chat.</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Search your saved capsules and reviewed starters. PRAXIS docks sources, claims, ontology, and output rules before chat.
          </p>
        </div>
        {status ? (
          <p className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Capsule categories">
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
        <label className="relative block">
          <span className="sr-only">Search capsules</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search capsules"
            className="min-h-10 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500"
          />
        </label>
      </div>

      {categoryGroups.length ? (
        <div className="mt-4 grid gap-5">
          {categoryGroups.map((group) => (
            <section key={group.id} aria-label={`${group.label} capsules`}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">{group.label}</h3>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.entries.length} shown</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.entries.map((entry) => (
                  <CapsuleLibraryCard
                    key={entry.id}
                    variant="full"
                    capsuleId={entry.id}
                    title={entry.title}
                    summary={entry.valueProp}
                    subtitle={`${entry.origin === 'user' ? 'Your capsule' : 'Starter library'} / ${entry.category.replace('-', ' ')}`}
                    categoryLabel={entry.capsuleType}
                    domainLabel={entry.starterDomain}
                    roleLabel={entry.origin === 'user' ? 'Workspace capsule' : 'Starter capsule'}
                    readiness={{
                      tier: entry.readinessTier === 'review' ? 'near' : 'ready',
                      score: Math.round(entry.ranking.score),
                    }}
                    qualityScore={entry.ranking.score}
                    counts={{
                      sources: entry.inside.sources,
                      claims: entry.inside.claims,
                      graphNodes: entry.inside.graphNodes,
                      graphEdges: entry.inside.graphEdges,
                    }}
                    graph={{
                      nodeCount: entry.inside.graphNodes,
                      edgeCount: entry.inside.graphEdges,
                    }}
                    tags={entry.ontologyStack.slice(0, 4).map((item) => ({
                      label: item,
                      className: 'rounded-[var(--radius-full)]',
                    }))}
                    busy={busyCapsuleId === entry.id}
                    footerActions={(
                      <>
                        <button
                          type="button"
                          onClick={() => onTryCapsule?.(entry)}
                          disabled={!onTryCapsule || busyCapsuleId === entry.id}
                          className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyCapsuleId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Boxes className="h-4 w-4" />}
                          Attach
                        </button>
                        <Link
                          href={`/app/capsules?starter=${encodeURIComponent(entry.id)}&lane=inspect`}
                          className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Inspect
                        </Link>
                      </>
                    )}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-800">{entries.length ? 'No capsules match this search.' : 'No capsules yet.'}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {entries.length ? 'Try another category or search title, ontology, source, claim, or output terms.' : 'Starter capsules will still appear here when the library loads.'}
          </p>
        </div>
      )}
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
