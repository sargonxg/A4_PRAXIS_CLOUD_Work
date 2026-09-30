'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { CapsuleReadinessBadge } from '@/components/capsules/CapsuleReadinessBadge';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { deriveCapsuleReadinessSummary } from '@/lib/context/capsule-quality';
import type { CapsuleDockSlotKind } from '@/lib/context/active-context-stack';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';

interface CapsuleListPickerProps {
  activeCapsuleId: string | null;
  onSelect: (capsuleId: string, selectedCapsule?: PraxisCapsule) => void;
  triggerLabel?: string;
  /** Explicitly opt into creating an empty saved capsule rather than using the guided builder. */
  allowQuickCreate?: boolean;
  onCreate?: () => void;
  refreshKey?: number;
  /** When set, capsules matching this dock slot type are listed first. */
  slotKind?: CapsuleDockSlotKind;
}

export function CapsuleListPicker({ activeCapsuleId, onSelect, onCreate, refreshKey, slotKind, triggerLabel, allowQuickCreate = false }: CapsuleListPickerProps) {
  const { user, loading: authLoading } = useAuth();
  const ownerId = user?.id ?? null;
  const [inventory, setInventory] = useState<{ ownerId: string | null; capsules: PraxisCapsule[]; status: 'loading' | 'ready' | 'error'; nextCursor?: string | null }>({ ownerId, capsules: [], status: 'loading' });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [createError, setCreateError] = useState<{ ownerId: string | null; message: string } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [focusMode, setFocusMode] = useState<'search' | 'options'>('options');
  const [pageRequest, setPageRequest] = useState<{ ownerId: string | null; cursor: string | null }>({ ownerId: null, cursor: null });
  const cursor = pageRequest.ownerId === ownerId ? pageRequest.cursor : null;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const createController = useRef<AbortController | null>(null);
  const listId = useId();
  const capsules = useMemo(() => inventory.ownerId === ownerId && !authLoading ? inventory.capsules : [], [inventory, ownerId, authLoading]);
  const loadStatus = authLoading || inventory.ownerId !== ownerId ? 'loading' : inventory.status;

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) setInventory((previous) => ({ ownerId, capsules: previous.ownerId === ownerId ? previous.capsules : [], status: ownerId ? 'loading' : 'ready' }));
    });
    if (ownerId) {
      void (async () => {
        try {
          const query = new URLSearchParams({ limit: '50' });
          if (cursor) query.set('cursor', cursor);
          const res = await fetch(`/api/context/capsules?${query}`, { credentials: 'include', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]) });
          if (!res.ok) throw new Error(String(res.status));
          const body = await res.json() as { capsules?: PraxisCapsule[]; nextCursor?: string | null };
          if (!Array.isArray(body.capsules)) throw new Error('Invalid capsule inventory');
          if (!controller.signal.aborted) setInventory((previous) => ({ ownerId, capsules: [...new Map([...(cursor && previous.ownerId === ownerId ? previous.capsules : []), ...body.capsules!].map((capsule) => [capsule.capsuleId, capsule])).values()], status: 'ready', nextCursor: body.nextCursor ?? null }));
        } catch {
          if (!controller.signal.aborted) setInventory((previous) => ({ ownerId, capsules: previous.ownerId === ownerId ? previous.capsules : [], status: 'error', nextCursor: previous.ownerId === ownerId ? previous.nextCursor : null }));
        }
      })();
    }
    return () => controller.abort();
  }, [ownerId, authLoading, refreshKey, retry, cursor]);

  useEffect(() => () => createController.current?.abort(), [ownerId]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const ordered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const available = capsules.filter((capsule) => !capsule.archivedAt && (!query || `${capsule.label} ${capsule.capsuleId} ${capsule.scope}`.toLocaleLowerCase().includes(query)));
    if (!slotKind) return available;
    const matching = available.filter((capsule) => capsuleMatchesSlotKind(capsule, slotKind));
    const rest = available.filter((capsule) => !capsuleMatchesSlotKind(capsule, slotKind));
    return [...matching, ...rest];
  }, [capsules, slotKind, search]);
  const matchingCount = useMemo(
    () => (slotKind ? ordered.filter((capsule) => capsuleMatchesSlotKind(capsule, slotKind)).length : ordered.length),
    [ordered, slotKind],
  );

  const active = capsules.find((c) => c.capsuleId === activeCapsuleId) ?? null;

  useEffect(() => {
    if (!open) return;
    if (focusMode === 'search') searchRef.current?.focus();
    else optionRefs.current[Math.min(focusedIndex, Math.max(0, ordered.length - 1))]?.focus();
  }, [open, focusedIndex, ordered.length, focusMode]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function openList(fromEnd = false, mode: 'search' | 'options' = 'options') {
    const index = ordered.findIndex((capsule) => capsule.capsuleId === activeCapsuleId);
    setFocusedIndex(fromEnd ? Math.max(0, ordered.length - 1) : Math.max(0, index));
    setFocusMode(mode);
    setOpen(true);
  }

  function selectCapsule(capsule: PraxisCapsule) {
    onSelect(capsule.capsuleId, capsule);
    close();
  }

  function handleOptionKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCapsule(ordered[index]); }
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setFocusedIndex(event.key === 'Home' ? 0 : event.key === 'End' ? ordered.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + ordered.length) % ordered.length);
    }
  }

  async function handleCreate() {
    if (!ownerId || authLoading || busy) return;
    const controller = new AbortController();
    createController.current = controller;
    setBusy(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/context/capsules', {
        method: 'POST',
        credentials: 'include',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]),
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'create', label: `Capsule ${new Date().toISOString().slice(0, 10)}` }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { capsule: PraxisCapsule };
      if (!body.capsule?.capsuleId) throw new Error('Invalid created capsule');
      if (controller.signal.aborted) return;
      setInventory((previous) => ({ ownerId, capsules: [body.capsule, ...(previous.ownerId === ownerId ? previous.capsules : []).filter((capsule) => capsule.capsuleId !== body.capsule.capsuleId)], status: 'ready' }));
      onSelect(body.capsule.capsuleId, body.capsule);
      onCreate?.();
      close();
      window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId: body.capsule.capsuleId } }));
    } catch {
      if (!controller.signal.aborted) setCreateError({ ownerId, message: 'Your capsule could not be created. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? close() : openList(false, 'search')}
        onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); openList(event.key === 'ArrowUp'); } }}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-mineral)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-deep-ink)] hover:bg-[var(--color-archive-paper)]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={active ? `Choose capsule. Active: ${active.label}` : 'Choose capsule'}
      >
        <span className="max-w-[22ch] truncate">{triggerLabel ?? active?.label ?? 'Attach a capsule'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open ? (
        <div className="absolute left-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-[var(--color-mineral)] bg-white shadow-lg">
          <label className="relative m-2 block"><span className="sr-only">Search saved capsules</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" aria-hidden="true" /><input ref={searchRef} type="search" value={search} onChange={(event) => { setSearch(event.target.value); setFocusedIndex(0); setFocusMode('search'); }} onKeyDown={(event) => { if (event.key === 'ArrowDown' && ordered.length) { event.preventDefault(); setFocusedIndex(0); setFocusMode('options'); } }} placeholder="Find saved context" className="min-h-11 w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-base focus-visible:outline-2 focus-visible:outline-[var(--color-praxis-emerald-600)]" /></label>
          {loadStatus === 'loading' ? <p role="status" className="px-3 py-2 text-xs text-slate-600">Loading capsules…</p> : null}
          {loadStatus === 'error' ? <div role="alert" className="px-3 py-2 text-xs text-amber-900">Your capsules could not be loaded. <button type="button" className="font-semibold underline" onClick={() => setRetry((value) => value + 1)}>Retry</button></div> : null}
          {loadStatus === 'ready' && !capsules.length ? <p className="px-3 py-2 text-xs text-slate-600">{ownerId ? 'No saved capsules yet. Create one to add reusable context.' : 'Sign in to choose your saved capsules.'}</p> : null}
          {loadStatus === 'ready' && capsules.length > 0 && !ordered.length ? <p role="status" className="px-3 py-3 text-sm text-slate-600">No available capsules match. Try another name or load older context below.</p> : null}
          {createError?.ownerId === ownerId ? <p role="alert" className="px-3 py-2 text-xs text-amber-900">{createError.message}</p> : null}
          <ul id={listId} role="listbox" aria-label="Saved context capsules" aria-busy={loadStatus === 'loading'} className="max-h-64 overflow-y-auto">
            {ordered.map((c, index) => {
              const readiness = deriveCapsuleReadinessSummary(c);
              return (
                <li key={c.capsuleId} role="presentation">
                  {slotKind && matchingCount > 0 && matchingCount < ordered.length && index === matchingCount ? (
                    <p className="border-t border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Other capsules
                    </p>
                  ) : null}
                  <button
                    ref={(element) => { optionRefs.current[index] = element; }}
                    type="button"
                    role="option"
                    aria-selected={c.capsuleId === activeCapsuleId}
                    tabIndex={index === focusedIndex ? 0 : -1}
                    onKeyDown={(event) => handleOptionKey(event, index)}
                    onFocus={() => { setFocusedIndex(index); setFocusMode('options'); }}
                    onClick={() => selectCapsule(c)}
                    className={cn(
                      'flex min-h-14 w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-praxis-emerald-600)]',
                      c.capsuleId === activeCapsuleId && 'bg-emerald-50/60',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-navy-950">{c.label}</span>
                      <span className="mt-1 block truncate text-xs text-slate-600">
                        v{c.version} · {c.scope}
                        {c.archivedAt ? ' · archived' : ''}
                      </span>
                    </span>
                    <CapsuleReadinessBadge size="sm" {...readiness} />
                    {c.capsuleId === activeCapsuleId ? <Check className="h-3 w-3 text-emerald-600" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {inventory.ownerId === ownerId && inventory.nextCursor ? <button type="button" disabled={loadStatus === 'loading'} onClick={() => { setInventory((previous) => ({ ...previous, status: 'loading' })); setPageRequest({ ownerId, cursor: inventory.nextCursor ?? null }); }} className="min-h-11 w-full border-t border-slate-200 px-3 py-2 text-left text-sm font-medium underline">Load older capsules</button> : null}
          <Link href="/app/capsules/builder" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 border-t border-slate-200 bg-[var(--color-praxis-emerald-50)] px-3 py-3 text-sm font-semibold text-[var(--color-praxis-emerald-700)]"><Plus className="h-4 w-4" aria-hidden="true" />Create a capsule</Link>
          {allowQuickCreate ? <button
            type="button"
            onClick={handleCreate}
            disabled={busy || !ownerId || authLoading}
            className="flex min-h-11 w-full items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-[var(--color-praxis-emerald-700)] hover:bg-slate-100 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            {busy ? 'Creating capsule…' : 'New capsule'}
          </button> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Lightweight client-side heuristic mirroring resolveCapsuleTaxonomy's type facets,
 * kept local so the picker does not pull the full product-catalog module into the bundle.
 */
function capsuleMatchesSlotKind(capsule: PraxisCapsule, kind: CapsuleDockSlotKind): boolean {
  const tags = (capsule.community?.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.includes(`type:${kind}`) || tags.includes(kind)) return true;
  const refs = capsule.coreRefs;
  if (kind === 'user') return Boolean(refs?.userCoreId) || capsule.scope === 'user';
  if (kind === 'situation') return Boolean(refs?.situationCoreId || refs?.pathCoreId) || capsule.scope === 'situation' || capsule.scope === 'team';
  if (kind === 'tool') return (refs?.toolCoreIds?.length ?? 0) > 0;
  return ((refs?.outputCoreIds?.length ?? 0) + (refs?.productCoreIds?.length ?? 0)) > 0;
}
