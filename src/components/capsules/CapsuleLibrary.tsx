'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { useAuth } from '@/lib/auth/auth-context';
import { CapsuleLibraryCard } from '@/components/capsules/CapsuleLibraryCard';
import { CapsuleSpotlights } from '@/components/capsules/CapsuleSpotlights';
import {
  CAPSULE_LIBRARY_CATEGORIES,
  CAPSULE_LIBRARY_ENTRIES,
  buildCapsuleRepositoryEntries,
  buildCapsuleLibraryFacetOptions,
  filterCapsuleLibraryEntries,
  filterCapsuleRepositoryEntries,
  proposeDockSlotForCapsule,
  type CapsuleLibraryCategory,
  type CapsuleLibraryEntry,
} from '@/lib/capsules/library';
import { activeContextPatchForLibraryEntry, tryLibraryCapsule } from '@/lib/capsules/library-try';
import { CAPSULE_DOCK_SLOT_LABELS, type CapsuleDockSlotKind } from '@/lib/context/active-context-stack';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { cn } from '@/lib/utils/cn';

interface CapsuleLibraryProps {
  entries?: CapsuleLibraryEntry[];
  initialCategory?: CapsuleLibraryCategory | 'all';
  busyCapsuleId?: string | null;
  status?: string | null;
  initialTypeFacet?: string | null;
  initialDomainFacet?: string | null;
  initialTeamFacet?: string | null;
  onTryCapsule?: (entry: CapsuleLibraryEntry, slotKind: CapsuleDockSlotKind) => void;
}

export function CapsuleLibraryWithTry(props: Omit<CapsuleLibraryProps, 'onTryCapsule' | 'busyCapsuleId' | 'status'>) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { saveStack, stack, hydrated } = useActiveContextStack();
  const ownerId = user?.id ?? null;
  const attachmentReady = !authLoading && (!user || hydrated);
  const [inventory, setInventory] = useState<{
    ownerId: string | null;
    capsules: PraxisCapsule[];
    loading: boolean;
    error: boolean;
  }>({ ownerId: null, capsules: [], loading: false, error: false });
  const [busyCapsuleId, setBusyCapsuleId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const inventoryCurrent = !authLoading && ownerId !== null && inventory.ownerId === ownerId;
  const loading = !authLoading && ownerId !== null && (!inventoryCurrent || inventory.loading);
  const loadError = inventoryCurrent && inventory.error;
  const entries = useMemo(
    () => buildCapsuleRepositoryEntries({
      userCapsules: inventoryCurrent ? inventory.capsules : [],
      starterEntries: props.entries ?? CAPSULE_LIBRARY_ENTRIES,
    }),
    [props.entries, inventory, inventoryCurrent],
  );

  useEffect(() => {
    if (authLoading || !ownerId) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    fetch('/api/context/capsules', { credentials: 'include', signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Load failed'); return response.json(); })
      .then((body: { capsules?: PraxisCapsule[] } | null) => {
        if (!Array.isArray(body?.capsules)) throw new Error('Load failed');
        if (!cancelled) setInventory({ ownerId, capsules: body.capsules, loading: false, error: false });
      })
      .catch(() => { if (!cancelled) setInventory({ ownerId, capsules: [], loading: false, error: true }); })
      .finally(() => { clearTimeout(timeout); });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [authLoading, ownerId, reload]);

  async function handleTryCapsule(entry: CapsuleLibraryEntry, slotKind: CapsuleDockSlotKind) {
    if (busyCapsuleId || !attachmentReady) return;
    if (!user) {
      router.push(`/login?mode=signup&redirect=${encodeURIComponent('/app/capsules')}`);
      return;
    }
    setBusyCapsuleId(entry.id);
    setStatus(null);
    const result = entry.origin === 'starter'
      ? await tryLibraryCapsule(entry, { saveStack, stack, slotKind })
      : await saveStack(activeContextPatchForLibraryEntry(entry, {
        stack,
        slotKind,
      }))
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
    <>
    {loading ? <p role="status" className="mb-2 text-sm text-slate-600">Loading your saved capsules…</p> : null}
    {user && !hydrated ? <p role="status" className="mb-2 text-sm text-slate-600">Loading your saved context before attaching capsules…</p> : null}
    {loadError ? <p role="alert" className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">Your saved capsules could not be loaded. Starters are still shown below. <button type="button" disabled={loading} className="font-semibold underline" onClick={() => { setInventory({ ownerId, capsules: [], loading: true, error: false }); setReload((value) => value + 1); }}>Retry</button></p> : null}
    <CapsuleLibrary
      {...props}
      entries={entries}
      busyCapsuleId={busyCapsuleId}
      status={status}
      onTryCapsule={attachmentReady ? (entry, slotKind) => void handleTryCapsule(entry, slotKind) : undefined}
    />
    </>
  );
}

export function CapsuleLibrary({
  entries = CAPSULE_LIBRARY_ENTRIES,
  initialCategory = 'all',
  busyCapsuleId = null,
  status = null,
  initialTypeFacet = null,
  initialDomainFacet = null,
  initialTeamFacet = null,
  onTryCapsule,
}: CapsuleLibraryProps) {
  const [category, setCategory] = useState<CapsuleLibraryCategory | 'all'>(initialCategory);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFacet, setTypeFacet] = useState(initialTypeFacet ?? 'all');
  const [domainFacet, setDomainFacet] = useState(initialDomainFacet ?? 'all');
  const [teamFacet, setTeamFacet] = useState(initialTeamFacet ?? 'all');
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput), 180);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const facets = useMemo(() => buildCapsuleLibraryFacetOptions(entries), [entries]);
  const filtered = useMemo(
    () => filterCapsuleRepositoryEntries(entries, category, searchQuery, {
      type: typeFacet,
      domain: domainFacet,
      team: teamFacet,
    }),
    [category, domainFacet, entries, searchQuery, teamFacet, typeFacet],
  );
  const categoryGroups = useMemo(
    () => CAPSULE_LIBRARY_CATEGORIES
      .map((item) => ({
        ...item,
        entries: filterCapsuleLibraryEntries(filtered, item.id),
      }))
      .filter((item) => item.entries.length > 0),
    [filtered],
  );
  const hasActiveFilters = category !== 'all' || searchInput || searchQuery || typeFacet !== 'all' || domainFacet !== 'all' || teamFacet !== 'all';

  function resetFilters() {
    setCategory('all');
    setSearchInput('');
    setSearchQuery('');
    setTypeFacet('all');
    setDomainFacet('all');
    setTeamFacet('all');
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]" data-testid="capsule-library">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Capsule Repository</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Pick the context for this chat.</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Find saved context and starter frameworks. Inspect sources, claims and review gaps, then attach a capsule to your analysis.
          </p>
        </div>
        {status ? (
          <p className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/app/capsules/builder" className="inline-flex min-h-10 items-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white">Build from your material</Link>
        <Link href="/app" className="inline-flex min-h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700">Ask PRAXIS</Link>
      </div>
      {!hasActiveFilters ? <CapsuleSpotlights entries={entries} busyCapsuleId={busyCapsuleId} onAttach={onTryCapsule} /> : null}
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

      <div className="mt-3 grid gap-2 md:grid-cols-3" aria-label="Capsule taxonomy filters">
        <FacetSelect
          label="Filter by capsule type"
          value={typeFacet}
          allLabel="All types"
          options={facets.types}
          onChange={setTypeFacet}
        />
        <FacetSelect
          label="Filter by capsule domain"
          value={domainFacet}
          allLabel="All domains"
          options={facets.domains}
          onChange={setDomainFacet}
        />
        <FacetSelect
          label="Filter by policy team"
          value={teamFacet}
          allLabel="All teams"
          options={facets.teams}
          onChange={setTeamFacet}
        />
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
                {group.entries.map((entry) => {
                  const proposedSlot = proposeDockSlotForCapsule(entry);
                  const slotLabel = proposedSlot === 'tool' ? 'Tool' : CAPSULE_DOCK_SLOT_LABELS[proposedSlot];
                  return (
                    <CapsuleLibraryCard
                      key={entry.id}
                      variant="full"
                      capsuleId={entry.id}
                      title={entry.title}
                      summary={entry.valueProp}
                      subtitle={`${entry.origin === 'user' ? 'Your capsule' : 'Starter library'} / ${entry.category.replace('-', ' ')}`}
                      categoryLabel={entry.taxonomy.types[0]?.label ?? entry.capsuleType}
                      domainLabel={entry.taxonomy.domains[0]?.label ?? entry.starterDomain}
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
                      researchSignals={{
                        sourceSpineCount: entry.researchSignals.sourceSpineCount,
                        evidenceGapCount: entry.researchSignals.evidenceGapCount,
                        refreshStatus: entry.researchSignals.refreshStatus,
                        graphNodeCount: entry.researchSignals.graphNodeCount,
                        graphEdgeCount: entry.researchSignals.graphEdgeCount,
                        unsupportedClaimCount: entry.researchSignals.unsupportedClaimCount,
                        inspectHref: `/app/capsules?starter=${encodeURIComponent(entry.id)}&lane=inspect`,
                      }}
                      tags={entry.ontologyStack.slice(0, 4).map((item) => ({
                        label: item,
                        className: 'rounded-[var(--radius-full)]',
                      }))}
                      busy={busyCapsuleId === entry.id}
                      addAction={{
                        label: busyCapsuleId === entry.id ? `Adding to ${slotLabel} slot` : `Add to ${slotLabel} slot`,
                        onAdd: () => onTryCapsule?.(entry, proposedSlot),
                        disabled: !onTryCapsule || Boolean(busyCapsuleId),
                      }}
                      footerActions={(
                        <Link
                          href={`/app/capsules?starter=${encodeURIComponent(entry.id)}&lane=inspect`}
                          className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Inspect
                        </Link>
                      )}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-800">{entries.length ? 'No capsules match these filters.' : 'No capsules yet.'}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {entries.length ? 'Try another facet, category, or search title, ontology, source, claim, or output term.' : 'Starter capsules will still appear here when the library loads.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function FacetSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: Array<{ tag: string; label: string; count: number }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500"
      >
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option.tag} value={option.tag}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </label>
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
