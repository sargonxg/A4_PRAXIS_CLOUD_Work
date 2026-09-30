'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { CapsuleReadinessBadge } from '@/components/capsules/CapsuleReadinessBadge';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { deriveCapsuleReadinessSummary } from '@/lib/context/capsule-quality';
import type { CapsuleDockSlotKind } from '@/lib/context/active-context-stack';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';

interface CapsuleListPickerProps {
  activeCapsuleId: string | null;
  onSelect: (capsuleId: string) => void;
  onCreate?: () => void;
  refreshKey?: number;
  /** When set, capsules matching this dock slot type are listed first. */
  slotKind?: CapsuleDockSlotKind;
}

export function CapsuleListPicker({ activeCapsuleId, onSelect, onCreate, refreshKey, slotKind }: CapsuleListPickerProps) {
  const { user, loading: authLoading } = useAuth();
  const ownerId = user?.id ?? null;
  const [inventory, setInventory] = useState<{ ownerId: string | null; capsules: PraxisCapsule[]; status: 'loading' | 'ready' | 'error' }>({ ownerId, capsules: [], status: 'loading' });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [createError, setCreateError] = useState<{ ownerId: string | null; message: string } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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
          const res = await fetch('/api/context/capsules', { credentials: 'include', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]) });
          if (!res.ok) throw new Error(String(res.status));
          const body = await res.json() as { capsules?: PraxisCapsule[] };
          if (!Array.isArray(body.capsules)) throw new Error('Invalid capsule inventory');
          if (!controller.signal.aborted) setInventory({ ownerId, capsules: body.capsules, status: 'ready' });
        } catch {
          if (!controller.signal.aborted) setInventory((previous) => ({ ownerId, capsules: previous.ownerId === ownerId ? previous.capsules : [], status: 'error' }));
        }
      })();
    }
    return () => controller.abort();
  }, [ownerId, authLoading, refreshKey, retry]);

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
    if (!slotKind) return capsules;
    const matching = capsules.filter((capsule) => capsuleMatchesSlotKind(capsule, slotKind));
    const rest = capsules.filter((capsule) => !capsuleMatchesSlotKind(capsule, slotKind));
    return [...matching, ...rest];
  }, [capsules, slotKind]);
  const matchingCount = useMemo(
    () => (slotKind ? capsules.filter((capsule) => capsuleMatchesSlotKind(capsule, slotKind)).length : capsules.length),
    [capsules, slotKind],
  );

  const active = capsules.find((c) => c.capsuleId === activeCapsuleId) ?? null;

  useEffect(() => {
    if (open) optionRefs.current[Math.min(focusedIndex, Math.max(0, ordered.length - 1))]?.focus();
  }, [open, focusedIndex, ordered.length]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function openList(fromEnd = false) {
    const index = ordered.findIndex((capsule) => capsule.capsuleId === activeCapsuleId);
    setFocusedIndex(fromEnd ? Math.max(0, ordered.length - 1) : Math.max(0, index));
    setOpen(true);
  }

  function handleOptionKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(ordered[index].capsuleId); close(); }
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
      onSelect(body.capsule.capsuleId);
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
        onClick={() => open ? close() : openList()}
        onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); openList(event.key === 'ArrowUp'); } }}
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={active ? `Choose capsule. Active: ${active.label}` : 'Choose capsule'}
      >
        <span className="max-w-[16ch] truncate">{active?.label ?? 'Pick capsule'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open ? (
        <div className="absolute left-0 z-40 mt-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          {loadStatus === 'loading' ? <p role="status" className="px-3 py-2 text-xs text-slate-600">Loading capsules…</p> : null}
          {loadStatus === 'error' ? <div role="alert" className="px-3 py-2 text-xs text-amber-900">Your capsules could not be loaded. <button type="button" className="font-semibold underline" onClick={() => setRetry((value) => value + 1)}>Retry</button></div> : null}
          {loadStatus === 'ready' && !capsules.length ? <p className="px-3 py-2 text-xs text-slate-600">{ownerId ? 'No saved capsules yet. Create one to add reusable context.' : 'Sign in to choose your saved capsules.'}</p> : null}
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
                    onFocus={() => setFocusedIndex(index)}
                    onClick={() => {
                      onSelect(c.capsuleId);
                      close();
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600',
                      c.capsuleId === activeCapsuleId && 'bg-emerald-50/60',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-navy-950">{c.label}</span>
                      <span className="block truncate text-[10px] text-slate-500">
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
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy || !ownerId || authLoading}
            className="flex w-full items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-diplomatic-blue hover:bg-slate-100 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            {busy ? 'Creating capsule…' : 'New capsule'}
          </button>
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
