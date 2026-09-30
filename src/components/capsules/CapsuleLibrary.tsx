'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, Copy, Eye, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { useAuth } from '@/lib/auth/auth-context';
import { CapsuleLibraryCard } from '@/components/capsules/CapsuleLibraryCard';
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
import { type CapsuleDockSlotKind } from '@/lib/context/active-context-stack';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { cn } from '@/lib/utils/cn';

interface CapsuleLibraryProps {
  standalone?: boolean;
  entries?: CapsuleLibraryEntry[];
  initialCategory?: CapsuleLibraryCategory | 'all';
  busyCapsuleId?: string | null;
  status?: string | null;
  initialTypeFacet?: string | null;
  initialDomainFacet?: string | null;
  initialTeamFacet?: string | null;
  onTryCapsule?: (entry: CapsuleLibraryEntry, slotKind: CapsuleDockSlotKind) => void;
  onManageCapsule?: (entry: CapsuleLibraryEntry, action: 'fork' | 'archive') => void;
  attachedCapsuleIds?: string[];
  onPreviewCapsule?: (entry: CapsuleLibraryEntry) => void;
}

export function CapsuleLibraryWithTry(props: Omit<CapsuleLibraryProps, 'onTryCapsule' | 'busyCapsuleId' | 'status'>) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { saveStack, stack, hydrated } = useActiveContextStack();
  const ownerId = user?.id ?? null;
  const currentOwner = useRef(ownerId);
  currentOwner.current = ownerId;
  const attachmentReady = !authLoading && (!user || hydrated);
  const [inventory, setInventory] = useState<{
    ownerId: string | null;
    capsules: PraxisCapsule[];
    loading: boolean;
    error: boolean;
    nextCursor: string | null;
  }>({ ownerId: null, capsules: [], loading: false, error: false, nextCursor: null });
  const [busyCapsuleId, setBusyCapsuleId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [pageRequest, setPageRequest] = useState<{ ownerId: string | null; cursor: string | null }>({ ownerId: null, cursor: null });
  const requestedCursor = pageRequest.ownerId === ownerId ? pageRequest.cursor : null;
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
    setBusyCapsuleId(null);
    setStatus(null);
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const query = new URLSearchParams({ limit: '50', includeArchived: 'true' });
    if (requestedCursor) query.set('cursor', requestedCursor);
    fetch(`/api/context/capsules?${query}`, { credentials: 'include', signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Load failed'); return response.json(); })
      .then((body: { capsules?: PraxisCapsule[]; nextCursor?: string | null } | null) => {
        if (!Array.isArray(body?.capsules)) throw new Error('Load failed');
        if (!cancelled) setInventory((current) => ({ ownerId, capsules: [...new Map([...(requestedCursor && current.ownerId === ownerId ? current.capsules : []), ...body.capsules!].map((capsule) => [capsule.capsuleId, capsule])).values()], loading: false, error: false, nextCursor: body.nextCursor ?? null }));
      })
      .catch(() => { if (!cancelled) setInventory((current) => ({ ownerId, capsules: requestedCursor && current.ownerId === ownerId ? current.capsules : [], loading: false, error: true, nextCursor: requestedCursor && current.ownerId === ownerId ? current.nextCursor : null })); })
      .finally(() => { clearTimeout(timeout); });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [authLoading, ownerId, reload, requestedCursor]);

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
    if (currentOwner.current !== ownerId) return;
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

  async function handleManageCapsule(entry: CapsuleLibraryEntry, action: 'fork' | 'archive') {
    if (!user || busyCapsuleId || entry.origin !== 'user') return;
    if (action === 'archive' && (stack.capsuleId === entry.id || stack.capsuleRefs.some((ref) => ref.capsuleId === entry.id))) { setStatus('Detach this capsule in Home before archiving.'); return; }
    setBusyCapsuleId(entry.id);
    setStatus(null);
    try {
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(entry.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...(action === 'fork' ? { label: `${entry.title} — private copy`.slice(0, 160) } : {}) }) });
      const body = await response.json();
      if (!response.ok || !body.capsule?.capsuleId) throw new Error(body.error || 'The capsule action could not be confirmed.');
      if (currentOwner.current !== ownerId) return;
      setInventory((current) => ({ ...current, capsules: action === 'archive' ? current.capsules.map((capsule) => capsule.capsuleId === entry.id ? body.capsule : capsule) : [body.capsule, ...current.capsules] }));
      setStatus(action === 'archive' ? `${entry.title} archived. Its sources are retained.` : 'Private copy created. Inspect it before attaching.');
    } catch (error) {
      if (currentOwner.current === ownerId) setStatus(error instanceof Error ? error.message : 'Capsule action failed. Your work is unchanged.');
    } finally { if (currentOwner.current === ownerId) setBusyCapsuleId(null); }
  }

  return (
    <>
    {loading ? <p role="status" className="mb-2 text-sm text-slate-600">Loading your saved capsules…</p> : null}
    {user && !hydrated ? <p role="status" className="mb-2 text-sm text-slate-600">Loading your saved context before attaching capsules…</p> : null}
    {loadError ? <p role="alert" className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">{requestedCursor ? 'More saved capsules could not be loaded. Previously loaded work is still available.' : 'Your saved capsules could not be loaded. Starters are still shown below.'} <button type="button" disabled={loading} className="inline-flex min-h-11 items-center px-3 font-semibold underline" onClick={() => { setInventory((current) => ({ ...current, ownerId, loading: true, error: false })); setReload((value) => value + 1); }}>Retry</button></p> : null}
    <CapsuleLibrary
      {...props}
      entries={entries}
      busyCapsuleId={busyCapsuleId}
      status={inventoryCurrent ? status : null}
      onTryCapsule={attachmentReady ? (entry, slotKind) => void handleTryCapsule(entry, slotKind) : undefined}
      onManageCapsule={user && hydrated ? (entry, action) => void handleManageCapsule(entry, action) : undefined}
      attachedCapsuleIds={[...(stack.capsuleId ? [stack.capsuleId] : []), ...stack.capsuleRefs.map((ref) => ref.capsuleId)]}
      onPreviewCapsule={(entry) => router.push(`/app/capsules?starter=${encodeURIComponent(entry.id)}&lane=inspect`)}
    />
    {inventoryCurrent && inventory.nextCursor ? <button type="button" data-testid="load-more-saved-capsules" disabled={loading} className="mt-4 min-h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50" onClick={() => { setInventory((current) => ({ ...current, loading: true, error: false })); if (requestedCursor === inventory.nextCursor) setReload((value) => value + 1); else setPageRequest({ ownerId, cursor: inventory.nextCursor }); }}>{loading ? 'Loading more…' : 'Load more saved capsules'}</button> : null}
    {inventoryCurrent ? <p className="mt-2 text-xs text-slate-500">{inventory.capsules.length} saved capsule{inventory.capsules.length === 1 ? '' : 's'} loaded{inventory.nextCursor ? '. Load more to include older work in search and filters.' : '.'}</p> : null}
    </>
  );
}

export function CapsuleLibrary({
  standalone = false,
  entries = CAPSULE_LIBRARY_ENTRIES,
  initialCategory = 'all',
  busyCapsuleId = null,
  status = null,
  initialTypeFacet = null,
  initialDomainFacet = null,
  initialTeamFacet = null,
  onTryCapsule,
  onManageCapsule,
  attachedCapsuleIds = [],
  onPreviewCapsule,
}: CapsuleLibraryProps) {
  const [category, setCategory] = useState<CapsuleLibraryCategory | 'all'>(initialCategory);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFacet, setTypeFacet] = useState(initialTypeFacet ?? 'all');
  const [domainFacet, setDomainFacet] = useState(initialDomainFacet ?? 'all');
  const [teamFacet, setTeamFacet] = useState(initialTeamFacet ?? 'all');
  const [originFacet, setOriginFacet] = useState<'all' | 'user' | 'starter' | 'archived'>(standalone ? 'user' : 'all');
  const [reviewFacet, setReviewFacet] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [visibleWindow, setVisibleWindow] = useState({ filterKey: '', count: 24 });
  const [archiveCandidate, setArchiveCandidate] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput), 180);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const facets = useMemo(() => buildCapsuleLibraryFacetOptions(entries), [entries]);
  const scopedEntries = useMemo(() => entries.filter((entry) => originFacet === 'archived' ? entry.reviewState === 'archived' : entry.reviewState !== 'archived' && (originFacet === 'all' || entry.origin === originFacet)), [entries, originFacet]);
  const filtered = useMemo(
    () => filterCapsuleRepositoryEntries(scopedEntries, category, searchQuery, {
      type: typeFacet,
      domain: domainFacet,
      team: teamFacet,
    }).filter((entry) => reviewFacet === 'all' || entry.reviewState === reviewFacet)
      .sort((a, b) => sortOrder === 'title' ? a.title.localeCompare(b.title) : sortOrder === 'structure' ? (b.structuralScore ?? -1) - (a.structuralScore ?? -1) : (a.origin === b.origin ? (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') : a.origin === 'user' ? -1 : 1)),
    [category, domainFacet, scopedEntries, searchQuery, teamFacet, typeFacet, reviewFacet, sortOrder],
  );
  const filterKey = JSON.stringify([category, domainFacet, originFacet, searchQuery, teamFacet, typeFacet, reviewFacet, sortOrder]);
  const visibleCount = visibleWindow.filterKey === filterKey ? visibleWindow.count : 24;
  const categoryGroups = useMemo(
    () => CAPSULE_LIBRARY_CATEGORIES
      .map((item) => ({
        ...item,
        entries: filterCapsuleLibraryEntries(filtered.slice(0, visibleCount), item.id),
      }))
      .filter((item) => item.entries.length > 0),
    [filtered, visibleCount],
  );
  const Heading = standalone ? 'h1' : 'h2';
  const GroupHeading = standalone ? 'h2' : 'h3';
  const hasActiveFilters = category !== 'all' || searchInput || searchQuery || typeFacet !== 'all' || domainFacet !== 'all' || teamFacet !== 'all' || originFacet !== 'all' || reviewFacet !== 'all';

  function resetFilters() {
    setCategory('all');
    setSearchInput('');
    setSearchQuery('');
    setTypeFacet('all');
    setDomainFacet('all');
    setTeamFacet('all');
    setOriginFacet('all');
    setReviewFacet('all');
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]" data-testid="capsule-library">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading className={cn('font-serif font-semibold text-[var(--color-deep-ink)]', standalone ? 'praxis-page-heading text-3xl' : 'text-2xl')}>Your context library</Heading>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Reuse your sources, assumptions and analytical approach. Preview saved context or adapt a starter, then attach it to your question.
          </p>
        </div>
        {status ? (
          <p className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/app/capsules/builder" className="inline-flex min-h-11 items-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white">Create capsule</Link>
        <Link href="/app" className="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700">Ask PRAXIS</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Capsule ownership">
        <CategoryChip active={originFacet === 'all'} label="All available" onClick={() => setOriginFacet('all')} />
        <CategoryChip active={originFacet === 'user'} label={`Your saved capsules (${entries.filter((entry) => entry.origin === 'user' && entry.reviewState !== 'archived').length} loaded)`} onClick={() => setOriginFacet('user')} />
        <CategoryChip active={originFacet === 'starter'} label="Starter templates" onClick={() => setOriginFacet('starter')} />
        <CategoryChip active={originFacet === 'archived'} label="Archived" onClick={() => setOriginFacet('archived')} />
      </div>
      <div className="mt-4">
        <label className="relative block max-w-2xl">
          <span className="sr-only">Search capsules</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search your context" className="min-h-11 w-full rounded-lg border border-[var(--color-mineral)] bg-white pl-9 pr-3 text-base text-[var(--color-deep-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-praxis-emerald-600)]" />
        </label>
      </div>
      <details className="mt-3">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[var(--color-graphite)] underline underline-offset-4">Filters and sorting{hasActiveFilters ? ' · filters active' : ''}</summary>
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Capsule categories">
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
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Review state<select aria-label="Filter by review state" value={reviewFacet} onChange={(event) => setReviewFacet(event.target.value)} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="all">All review states</option><option value="draft">Draft</option><option value="needs-review">Needs review</option><option value="decisions-saved">Review decisions saved</option><option value="starter">Starter template</option></select></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Sort<select aria-label="Sort capsules" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="recent">Your recent work first</option><option value="title">Title</option><option value="structure">Structural completeness</option></select></label>
        <p role="status" className="pb-2 text-xs text-slate-500">{filtered.length} match{filtered.length === 1 ? '' : 'es'} in loaded capsules</p>
      </div>
      </details>
      <p className="mt-3 text-xs leading-5 text-[var(--color-graphite)]">Saved context still needs review. Starter templates need your sources; structure scores do not measure factual accuracy.</p>

      {categoryGroups.length ? (
        <div className="mt-4 grid gap-5">
          {categoryGroups.map((group) => (
            <section key={group.id} aria-label={`${group.label} capsules`}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <GroupHeading className="text-sm font-semibold text-slate-900">{group.label}</GroupHeading>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.entries.length} shown</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.entries.map((entry) => {
                  const proposedSlot = proposeDockSlotForCapsule(entry);
                  return (
                    <CapsuleLibraryCard
                      key={entry.id}
                      variant="full"
                      simplified
                      capsuleId={entry.id}
                      title={entry.title}
                      openLabel="Inspect capsule"
                      onSelect={onPreviewCapsule ? () => onPreviewCapsule(entry) : undefined}
                      summary={entry.valueProp}
                      subtitle={`${entry.origin === 'user' ? 'Your capsule' : 'Starter library'} / ${entry.category.replace('-', ' ')}`}
                      categoryLabel={entry.taxonomy.types[0]?.label ?? entry.capsuleType}
                      domainLabel={entry.taxonomy.domains[0]?.label ?? entry.starterDomain}
                      roleLabel={entry.origin === 'user' ? 'Workspace capsule' : 'Starter capsule'}
                      badges={[{ label: reviewStateLabel(entry) }]}
                      qualityScore={entry.structuralScore ?? null}
                      metadata={[entry.version !== null ? `Version ${entry.version}` : null, entry.updatedAt ? `Updated ${readableDate(entry.updatedAt)}` : null]}
                      counts={{
                        sources: entry.inside.sources,
                        claims: entry.inside.claims,
                        graphNodes: entry.inside.graphNodes,
                        graphEdges: entry.inside.graphEdges,
                        unsupportedClaims: entry.unsupportedAssessed ? entry.researchSignals.unsupportedClaimCount : null,
                      }}
                      graph={{
                        nodeCount: entry.inside.graphNodes,
                        edgeCount: entry.inside.graphEdges,
                      }}
                      tags={entry.ontologyStack.slice(0, 2).map((item) => ({
                        label: item,
                        className: 'rounded-[var(--radius-full)]',
                      }))}
                      busy={busyCapsuleId === entry.id}
                      addAction={{
                        label: busyCapsuleId === entry.id ? 'Attaching…' : attachedCapsuleIds.includes(entry.id) ? 'Open in chat' : 'Use in chat',
                        onAdd: () => onTryCapsule?.(entry, proposedSlot),
                        disabled: entry.reviewState === 'archived' || !onTryCapsule || Boolean(busyCapsuleId),
                      }}
                      footerActions={<>
                        <Link
                          href={`/app/capsules?starter=${encodeURIComponent(entry.id)}&lane=inspect`}
                          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Inspect
                        </Link>
                        {entry.origin === 'user' && onManageCapsule ? <details className="relative"><summary className="inline-flex min-h-11 cursor-pointer items-center px-2 text-sm font-medium underline">More</summary><div className="flex flex-wrap gap-2 pb-2">
                          <button type="button" disabled={Boolean(busyCapsuleId)} onClick={() => onManageCapsule(entry, 'fork')} className="inline-flex min-h-11 items-center gap-1 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"><Copy className="h-3.5 w-3.5" />Private copy</button>
                          {entry.reviewState !== 'archived' ? <button type="button" disabled={Boolean(busyCapsuleId) || attachedCapsuleIds.includes(entry.id)} title={attachedCapsuleIds.includes(entry.id) ? 'Detach this capsule in Home before archiving.' : 'Archive; sources and review history are retained.'} onClick={() => setArchiveCandidate(entry.id)} className="inline-flex min-h-11 items-center gap-1 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"><Archive className="h-3.5 w-3.5" />Archive</button> : null}
                          {archiveCandidate === entry.id ? <span className="w-full rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">Archive this capsule? Its sources and review history remain available.<span className="mt-2 flex gap-3"><button type="button" onClick={() => { onManageCapsule(entry, 'archive'); setArchiveCandidate(null); }} className="min-h-9 font-semibold underline">Confirm archive</button><button type="button" onClick={() => setArchiveCandidate(null)} className="min-h-9 underline">Keep capsule</button></span></span> : null}
                        </div></details> : null}
                      </>}
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
            {originFacet === 'user' && !scopedEntries.length ? 'Build a private capsule from your documents or notes, or adapt a starter template.' : entries.length ? 'Try another facet, category, or search title, ontology, source, claim, or output term.' : 'Starter capsules will still appear here when the library loads.'}
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
      {filtered.length > visibleCount ? <button type="button" onClick={() => setVisibleWindow({ filterKey, count: visibleCount + 24 })} className="mt-4 min-h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700">Show more results ({filtered.length - visibleCount} remaining)</button> : null}
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
        className="min-h-11 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500"
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
      aria-pressed={active}
      className={cn(
        'min-h-11 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition',
        active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  );
}

function reviewStateLabel(entry: CapsuleLibraryEntry): string {
  if (entry.origin === 'starter') return 'Starter template';
  if (entry.reviewState === 'archived') return 'Archived';
  if (entry.reviewState === 'decisions-saved') return 'Review decisions saved';
  if (entry.reviewState === 'draft') return 'Draft';
  return 'Needs review';
}

function readableDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'date unavailable' : date.toISOString().slice(0, 10);
}
