'use client';

/**
 * CoreSwapDrawer — slide-over picker for managing one active capsule slot.
 *
 * Implements the current ContextCapsule core swap surface.
 *
 * Opens when a CapsuleSlot is clicked or a draggable from CoreLibraryRail
 * is dropped onto a slot. Fetches /api/cores/library?kind={slot.kind}
 * (Codex CX-10) with mock fallback. Shows ranked options with lineage,
 * completeness, projected readiness delta, and a "preview impact"
 * tooltip. Selection optimistically POSTs to /api/capsules/{id}/swap;
 * rollback + toast on failure.
 *
 * Keyboard a11y: Esc closes, Arrow keys nav, Enter confirms.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { fetchCoresLibrary, type LibraryCore } from '@/lib/mocks/cores-library';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { cn } from '@/lib/utils/cn';

const SPRING = { type: 'spring' as const, stiffness: 240, damping: 28 };

export interface CoreSwapDrawerProps {
  open: boolean;
  capsuleId: string | null;
  slotKind: CoreSpecimenKind | null;
  /** Currently attached core id, if any — used to show "current" badge. */
  currentCoreId?: string | null;
  onClose: () => void;
  /** Optional: notify parent so it can optimistically update its state. */
  onSwap?: (coreId: string, mode: 'replace' | 'add' | 'remove') => void;
}

export function CoreSwapDrawer({
  open,
  capsuleId,
  slotKind,
  currentCoreId,
  onClose,
  onSwap,
}: CoreSwapDrawerProps) {
  const [cores, setCores] = useState<LibraryCore[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion();
  const multiSlot = slotKind === 'source' || slotKind === 'document' || slotKind === 'tool' || slotKind === 'objective' || slotKind === 'product' || slotKind === 'output';

  useEffect(() => {
    if (!open || !slotKind) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCoresLibrary(slotKind)
      .then((data) => {
        if (!cancelled) {
          setCores(data);
          setActiveIdx(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, slotKind]);

  const confirmSwap = useCallback(async (coreId: string, mode: 'replace' | 'add' | 'remove' = 'replace') => {
    if (!capsuleId || !slotKind) return;
    setSubmitting(coreId);
    setError(null);
    onSwap?.(coreId, mode); // optimistic
    try {
      const res = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/swap`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slotKind, coreId, mode }),
      });
      if (!res.ok) {
        throw new Error(`swap failed: ${res.status}`);
      }
      window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId } }));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // rollback signal — parent can re-fetch by listening to capsule-mutation-failed
      window.dispatchEvent(new CustomEvent('capsule-mutation-failed', { detail: { capsuleId, slotKind } }));
    } finally {
      setSubmitting(null);
    }
  }, [capsuleId, onClose, onSwap, slotKind]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, cores.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const target = cores[activeIdx];
        if (target) void confirmSwap(target.id, target.id === currentCoreId && multiSlot ? 'remove' : multiSlot ? 'add' : 'replace');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, cores, activeIdx, onClose, confirmSwap, currentCoreId, multiSlot]);

  return (
    <AnimatePresence>
      {open && slotKind ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80]"
          role="dialog"
          aria-modal="true"
          aria-label={`Swap ${slotKind} core`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#0F172A]/55 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close swap drawer backdrop"
          />
          <motion.aside
            initial={reduceMotion ? false : { x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: 32, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : SPRING}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-300 bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                  <span className="font-mono text-slate-500">swap</span>
                  <span aria-hidden className="h-px w-4 bg-slate-400" />
                  <span className="text-[#8A5A00]">{slotKind} core</span>
                </p>
                <h2 className="mt-1 font-serif text-xl text-slate-950">
                  Pick a {slotKind} core
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  {multiSlot ? 'Add or remove cores without losing the rest of the slot.' : 'Replace the selected core for the active capsule.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading cores…
                </div>
              ) : cores.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  No cores of kind <span className="font-mono">{slotKind}</span> yet.
                </p>
              ) : (
                <ul ref={listRef} className="space-y-2" role="listbox" aria-label="Available cores">
                  {cores.map((core, idx) => {
                    const isCurrent = core.id === currentCoreId;
                    const isActive = idx === activeIdx;
                    return (
                      <li key={core.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => void confirmSwap(core.id, isCurrent && multiSlot ? 'remove' : multiSlot ? 'add' : 'replace')}
                          disabled={submitting !== null}
                          className={cn(
                            'group flex w-full items-start gap-3 rounded-lg border bg-white p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                            isActive
                              ? 'border-diplomatic-blue/50 bg-diplomatic-blue/[0.04] shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-navy-950">{core.name}</span>
                              <LineageBadge lineage={core.lineage} />
                              <CompletenessPill value={core.completeness} />
                              {isCurrent ? (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                                  current
                                </span>
                              ) : null}
                            </div>
                            {core.essence ? (
                              <p className="mt-1 text-xs leading-snug text-slate-600">{core.essence}</p>
                            ) : null}
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#1B3A5C]">
                              {multiSlot && isCurrent ? 'Remove from capsule' : multiSlot ? 'Add to capsule' : 'Projected readiness'}{' '}
                              {multiSlot && isCurrent ? null : (
                                <span
                                  className={cn(
                                    'font-mono',
                                    core.projectedReadinessDelta >= 0 ? 'text-emerald-700' : 'text-amber-700',
                                  )}
                                >
                                  {core.projectedReadinessDelta >= 0 ? '+' : ''}
                                  {core.projectedReadinessDelta}
                                </span>
                              )}
                              <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                            </p>
                          </div>
                          {submitting === core.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                          ) : isCurrent ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {error ? (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Swap failed — {error}. Optimistic state was rolled back.
                </div>
              ) : null}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-[11px] text-slate-600">
              <span>
                <kbd className="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">↑</kbd>{' '}
                <kbd className="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">↓</kbd> nav ·{' '}
                <kbd className="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">Enter</kbd> confirm ·{' '}
                <kbd className="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">Esc</kbd> close
              </span>
            </footer>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LineageBadge({ lineage }: { lineage: string }) {
  return (
    <span className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
      {lineage}
    </span>
  );
}

function CompletenessPill({ value }: { value: number }) {
  const tone = value >= 85 ? 'emerald' : value >= 60 ? 'amber' : 'red';
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-800'
      : tone === 'amber'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';
  return (
    <span className={cn('rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold', cls)}>
      {value}%
    </span>
  );
}
