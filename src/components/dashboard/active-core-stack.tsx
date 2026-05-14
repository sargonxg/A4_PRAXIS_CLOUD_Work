'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Lock, MousePointer2 } from 'lucide-react';
import { CONTEXT_CORES, type ContextCoreDefinition, type ContextCoreId } from '@/lib/product/context-core-map';
import { cn } from '@/lib/utils/cn';

const DEFAULT_CORE_ORDER: ContextCoreId[] = [
  'user-core',
  'situation-core',
  'path-core',
  'source-core',
  'document-core',
  'graph-core',
  'output-core',
  'praxis-core',
  'team-core',
];

const CORE_ACCENTS: Record<ContextCoreId, string> = {
  'praxis-core': 'border-navy-200 bg-navy-50 text-navy-950',
  'user-core': 'border-diplomatic-blue/30 bg-diplomatic-blue/10 text-navy-950',
  'team-core': 'border-slate-200 bg-slate-50 text-slate-700',
  'situation-core': 'border-gold-200 bg-gold-50 text-navy-950',
  'path-core': 'border-emerald-200 bg-emerald-50 text-navy-950',
  'source-core': 'border-teal/25 bg-teal/10 text-navy-950',
  'document-core': 'border-sage/25 bg-sage/10 text-navy-950',
  'graph-core': 'border-indigo-200 bg-indigo-50 text-navy-950',
  'output-core': 'border-rose-200 bg-rose-50 text-navy-950',
};

export function ActiveCoreStack({ activeCaseName }: { activeCaseName: string }) {
  const [orderedIds, setOrderedIds] = useState<ContextCoreId[]>(DEFAULT_CORE_ORDER);
  const [draggingId, setDraggingId] = useState<ContextCoreId | null>(null);
  const coresById = useMemo(() => new Map(CONTEXT_CORES.map((core) => [core.id, core])), []);
  const orderedCores = orderedIds.map((id) => coresById.get(id)).filter(Boolean) as ContextCoreDefinition[];
  const activeCores = orderedCores.filter((core) => core.currentPosture !== 'staged').slice(0, 6);

  function moveCore(id: ContextCoreId, direction: -1 | 1) {
    setOrderedIds((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function dropOn(targetId: ContextCoreId) {
    if (!draggingId || draggingId === targetId) return;
    setOrderedIds((current) => {
      const withoutDragged = current.filter((id) => id !== draggingId);
      const targetIndex = withoutDragged.indexOf(targetId);
      if (targetIndex < 0) return current;
      const next = [...withoutDragged];
      next.splice(targetIndex, 0, draggingId);
      return next;
    });
    setDraggingId(null);
  }

  return (
    <section className="rounded-lg border border-[var(--color-app-border)] bg-white p-5 shadow-sm shadow-navy-950/5" data-testid="active-core-stack">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-gold-700">Active Core Stack</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-950">Drag the cores into the order this case needs.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {activeCaseName} uses the same PRAXIS engine, but the working stack changes by task. Reorder the visible cores to model whether the next move should privilege the user model, context frame, source corpus, graph, or output package.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
          <span className="inline-flex items-center gap-1 font-semibold text-navy-900">
            <MousePointer2 className="h-3.5 w-3.5" />
            Drag, drop, or use arrows
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {orderedCores.map((core, index) => (
            <article
              key={core.id}
              draggable
              onDragStart={() => setDraggingId(core.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(core.id)}
              onDragEnd={() => setDraggingId(null)}
              className={cn(
                'group min-h-[176px] cursor-grab rounded-lg border p-4 transition active:cursor-grabbing',
                CORE_ACCENTS[core.id],
                draggingId === core.id && 'scale-[0.98] opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Priority {index + 1}</p>
                  <h3 className="mt-1 text-sm font-semibold">{core.label}</h3>
                </div>
                <GripVertical className="h-4 w-4 shrink-0 text-slate-500" />
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-700">{core.summary}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className={cn(
                  'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
                  core.currentPosture === 'live' && 'bg-emerald-100 text-emerald-800',
                  core.currentPosture.includes('optional') && 'bg-sky-100 text-sky-800',
                  core.currentPosture === 'staged' && 'bg-slate-200 text-slate-700',
                )}>
                  {core.currentPosture.includes('optional') ? 'live + optional backend' : core.currentPosture}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveCore(core.id, -1)}
                    disabled={index === 0}
                    className="rounded border border-slate-200 bg-white/70 p-1 text-slate-700 disabled:opacity-35"
                    aria-label={`Move ${core.label} up`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCore(core.id, 1)}
                    disabled={index === orderedCores.length - 1}
                    className="rounded border border-slate-200 bg-white/70 p-1 text-slate-700 disabled:opacity-35"
                    aria-label={`Move ${core.label} down`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-lg border border-navy-200 bg-navy-950 p-4 text-white">
          <p className="text-xs font-semibold uppercase text-gold-300">Current run order</p>
          <ol className="mt-4 space-y-2">
            {activeCores.map((core, index) => (
              <li key={core.id} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/8 px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-300 text-xs font-bold text-navy-950">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{core.label}</span>
                  <span className="block truncate text-xs text-navy-200">{core.memoryLayer}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-md border border-white/10 bg-white/8 p-3 text-xs leading-5 text-navy-100">
            <span className="inline-flex items-center gap-2 font-semibold text-white">
              <Lock className="h-3.5 w-3.5" />
              Guardrail
            </span>
            <p className="mt-2">
              Team Core remains staged until workspace authorization decisions are approved. Reordering changes the visible work plan only; it does not weaken owner scoping.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
