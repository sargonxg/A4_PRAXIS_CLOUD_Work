'use client';

/**
 * WorkingMemoryPane — collapsible right-side pane in Ask PRAXIS that
 * surfaces persistent facts from the Vertex Memory Bank.
 *
 * Brief: Claude Code CC-9.
 *
 * Reads /api/memory/working?capsuleId= (Codex CX-5). Each fact:
 *   - kind: preference | fact | directive
 *   - editable inline (Enter to save)
 *   - pin toggle (pinned = always injected into the system prompt)
 *   - forget button (X)
 *
 * New facts surfaced by the Ask flow appear as ghost cards with
 * Adopt / Dismiss CTAs. Search/filter input at top. Last-used badge
 * per fact when the metadata exists.
 *
 * Falls back to a small in-memory mock so the pane is testable
 * before the backend lands.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Brain,
  Loader2,
  Pin,
  PinOff,
  Search,
  X,
  Check,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type FactKind = 'preference' | 'fact' | 'directive';

interface MemoryFact {
  id: string;
  text: string;
  kind: FactKind;
  pinned: boolean;
  lastUsedAt?: string;
}

interface SuggestedFact {
  id: string;
  text: string;
  kind: FactKind;
  source?: string;
}

interface MemoryResponse {
  facts: MemoryFact[];
  suggestions?: SuggestedFact[];
}

const FALLBACK: MemoryResponse = {
  facts: [
    { id: 'f1', text: 'Audience: senior principals; BLUF first; under 200 words.', kind: 'preference', pinned: true },
    { id: 'f2', text: 'Red line: do not fabricate dates without a citation.', kind: 'directive', pinned: true },
    { id: 'f3', text: 'Operator path defaults to Diplomacy & Negotiation.', kind: 'fact', pinned: false, lastUsedAt: new Date().toISOString() },
  ],
  suggestions: [
    { id: 's1', text: 'You consistently prefer treaty-aware citation style.', kind: 'preference', source: 'inferred from last 8 memos' },
  ],
};

const KIND_LABEL: Record<FactKind, string> = {
  preference: 'Preference',
  fact: 'Fact',
  directive: 'Directive',
};

const KIND_TINT: Record<FactKind, string> = {
  preference: 'border-l-[#3A5A7A]',
  fact: 'border-l-[#3F7A66]',
  directive: 'border-l-[#8A5A00]',
};

export interface WorkingMemoryPaneProps {
  capsuleId?: string | null;
  className?: string;
  defaultOpen?: boolean;
}

export function WorkingMemoryPane({ capsuleId, className, defaultOpen = true }: WorkingMemoryPaneProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  const [data, setData] = useState<MemoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = capsuleId
      ? `/api/memory/working?capsuleId=${encodeURIComponent(capsuleId)}`
      : '/api/memory/working';
    fetch(url, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return (await r.json()) as MemoryResponse;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch(() => {
        if (!cancelled) setData(FALLBACK);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [capsuleId, tick]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data.facts;
    return data.facts.filter((f) => f.text.toLowerCase().includes(q) || f.kind.includes(q));
  }, [data, filter]);

  async function mutate(method: 'POST' | 'PATCH' | 'DELETE', factId: string | null, body: unknown) {
    const url = factId
      ? `/api/memory/working/${encodeURIComponent(factId)}`
      : `/api/memory/working`;
    try {
      await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      /* fallback path: optimistic only */
    }
    setTick((t) => t + 1);
  }

  function togglePin(fact: MemoryFact) {
    setData((prev) =>
      prev
        ? { ...prev, facts: prev.facts.map((f) => (f.id === fact.id ? { ...f, pinned: !f.pinned } : f)) }
        : prev,
    );
    void mutate('PATCH', fact.id, { pinned: !fact.pinned });
  }

  function forget(fact: MemoryFact) {
    setData((prev) => (prev ? { ...prev, facts: prev.facts.filter((f) => f.id !== fact.id) } : prev));
    void mutate('DELETE', fact.id, null);
  }

  function startEdit(fact: MemoryFact) {
    setEditingId(fact.id);
    setEditText(fact.text);
  }

  function saveEdit(fact: MemoryFact) {
    setData((prev) =>
      prev
        ? { ...prev, facts: prev.facts.map((f) => (f.id === fact.id ? { ...f, text: editText } : f)) }
        : prev,
    );
    setEditingId(null);
    void mutate('PATCH', fact.id, { text: editText });
  }

  function adopt(s: SuggestedFact) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            facts: [...prev.facts, { id: s.id, text: s.text, kind: s.kind, pinned: false }],
            suggestions: prev.suggestions?.filter((x) => x.id !== s.id),
          }
        : prev,
    );
    void mutate('POST', null, { text: s.text, kind: s.kind, fromSuggestionId: s.id });
  }

  function dismiss(s: SuggestedFact) {
    setData((prev) =>
      prev ? { ...prev, suggestions: prev.suggestions?.filter((x) => x.id !== s.id) } : prev,
    );
    void mutate('POST', null, { dismissSuggestionId: s.id });
  }

  return (
    <aside
      aria-label="Working memory"
      className={cn(
        'flex shrink-0 flex-col border-l border-slate-200 bg-white transition-[width]',
        open ? 'w-80' : 'w-10',
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-slate-200 px-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-100"
          aria-label={open ? 'Collapse working memory' : 'Expand working memory'}
        >
          {open ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          {open ? 'memory' : ''}
        </button>
        {open ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
            <Brain className="h-3 w-3" />
            {data?.facts.length ?? 0}
          </span>
        ) : null}
      </header>

      {open ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-slate-200 p-2">
            <label className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              <Search className="h-3 w-3 text-slate-500" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search facts…"
                className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading memory…
              </div>
            ) : filtered.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600">
                No facts match. Adopt a suggestion below or add one with Ask PRAXIS.
              </p>
            ) : (
              <ul className="space-y-1.5">
                <AnimatePresence>
                  {filtered.map((fact) => (
                    <motion.li
                      key={fact.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6 }}
                      className={cn(
                        'rounded-md border-l-2 border bg-white p-2',
                        KIND_TINT[fact.kind],
                        'border-y-slate-200 border-r-slate-200',
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          {KIND_LABEL[fact.kind]}
                          {fact.lastUsedAt ? (
                            <span className="ml-1 font-mono normal-case text-slate-400">
                              · used {relativeTime(fact.lastUsedAt)}
                            </span>
                          ) : null}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => togglePin(fact)}
                            className={cn(
                              'rounded p-0.5 transition',
                              fact.pinned ? 'text-[#8A5A00]' : 'text-slate-400 hover:text-slate-700',
                            )}
                            aria-label={fact.pinned ? 'Unpin fact' : 'Pin fact'}
                            title={fact.pinned ? 'Pinned — always injected' : 'Pin to always inject'}
                          >
                            {fact.pinned ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => forget(fact)}
                            className="rounded p-0.5 text-slate-400 transition hover:text-red-700"
                            aria-label="Forget fact"
                            title="Forget"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {editingId === fact.id ? (
                        <input
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(fact);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => saveEdit(fact)}
                          className="block w-full rounded border border-slate-300 bg-slate-50 px-1.5 py-1 text-[11px] text-slate-900 focus:border-diplomatic-blue focus:outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(fact)}
                          className="block w-full text-left text-[11px] leading-snug text-slate-800 hover:text-slate-950"
                        >
                          {fact.text}
                        </button>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {data?.suggestions && data.suggestions.length > 0 ? (
              <section className="mt-3 border-t border-dashed border-slate-200 pt-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Suggested by Ask
                </p>
                <ul className="mt-1 space-y-1">
                  {data.suggestions.map((s) => (
                    <li key={s.id} className="rounded-md border border-dashed border-slate-300 bg-[#FAF8F2] p-2">
                      <p className="text-[11px] leading-snug text-slate-800">{s.text}</p>
                      {s.source ? (
                        <p className="mt-1 font-mono text-[9px] text-slate-500">{s.source}</p>
                      ) : null}
                      <div className="mt-1.5 flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => dismiss(s)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <X className="h-2.5 w-2.5" />
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => adopt(s)}
                          className="inline-flex items-center gap-1 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-800"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          Adopt
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 px-2 py-1.5 text-center text-[9px] uppercase tracking-[0.14em] text-slate-500">
            <Check className="mr-1 inline h-2.5 w-2.5 text-emerald-600" />
            backed by Vertex Memory Bank
          </footer>
        </div>
      ) : null}
    </aside>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
