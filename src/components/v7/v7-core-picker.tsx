'use client';

import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { Boxes, FileText, GitBranch, GripVertical, Library, Network, Search, ShieldCheck, UserRound, X } from 'lucide-react';

import type { V7CoreDrawerKind } from '@/components/v7/v7-core-drawer';

export type V7PickableCore = {
  id: string;
  kind: string;
  name: string;
  description?: string | null;
  tags?: string[];
  status?: string;
};

type AttachedCore = V7PickableCore & {
  implicit?: boolean;
};

const kindOrder = ['situation', 'team', 'praxis', 'source', 'document', 'graph', 'output', 'user'];

const kindLabels: Record<string, string> = {
  praxis: 'Methodology',
  user: 'User',
  team: 'Team and rubric',
  situation: 'Situations',
  source: 'Sources',
  document: 'Documents',
  graph: 'Graphs',
  output: 'Outputs',
};

const kindIcons: Record<string, ComponentType<{ className?: string }>> = {
  praxis: ShieldCheck,
  user: UserRound,
  team: ShieldCheck,
  situation: Boxes,
  source: Library,
  document: FileText,
  graph: Network,
  output: GitBranch,
};

export function V7CorePickerStrip({
  availableCores,
  attachedCoreIds,
  onAttachedCoreIdsChange,
  activeSituation,
  onOpenCore,
  onCreateSituation,
  examplesHref = '/app/cores?examples=1',
}: {
  availableCores: V7PickableCore[];
  attachedCoreIds: string[];
  onAttachedCoreIdsChange: (ids: string[]) => void;
  activeSituation?: V7PickableCore | null;
  onOpenCore?: (kind: V7CoreDrawerKind) => void;
  onCreateSituation?: () => void;
  examplesHref?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const allCores = useMemo(() => {
    const byId = new Map<string, V7PickableCore>();
    for (const core of availableCores) byId.set(core.id, core);
    if (activeSituation) byId.set(activeSituation.id, activeSituation);
    return [...byId.values()];
  }, [activeSituation, availableCores]);
  const attached = useMemo<AttachedCore[]>(() => {
    const byId = new Map(allCores.map((core) => [core.id, core]));
    return [
      { id: 'user-core', kind: 'user', name: 'My Core', description: 'Always attached', implicit: true },
      ...attachedCoreIds.map((id) => byId.get(id)).filter(Boolean) as V7PickableCore[],
    ];
  }, [allCores, attachedCoreIds]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return allCores.filter((core) => {
      if (attachedCoreIds.includes(core.id)) return false;
      if (!term) return true;
      return [core.name, core.kind, core.description, ...(core.tags ?? [])].filter(Boolean).join(' ').toLowerCase().includes(term);
    });
  }, [allCores, attachedCoreIds, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, V7PickableCore[]>();
    for (const core of filtered) {
      const key = core.kind || 'other';
      groups.set(key, [...(groups.get(key) ?? []), core]);
    }
    return [...groups.entries()].sort(([a], [b]) => (kindOrder.indexOf(a) === -1 ? 99 : kindOrder.indexOf(a)) - (kindOrder.indexOf(b) === -1 ? 99 : kindOrder.indexOf(b)));
  }, [filtered]);

  function attach(core: V7PickableCore) {
    onAttachedCoreIdsChange([...attachedCoreIds.filter((id) => id !== core.id), core.id]);
  }

  function detach(id: string) {
    onAttachedCoreIdsChange(attachedCoreIds.filter((item) => item !== id));
  }

  function move(id: string, delta: number) {
    const index = attachedCoreIds.indexOf(id);
    const nextIndex = index + delta;
    if (index < 0 || nextIndex < 0 || nextIndex >= attachedCoreIds.length) return;
    const next = [...attachedCoreIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onAttachedCoreIdsChange(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;
    const from = attachedCoreIds.indexOf(activeId);
    const to = attachedCoreIds.indexOf(overId);
    if (from < 0 || to < 0) return;
    const next = [...attachedCoreIds];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onAttachedCoreIdsChange(next);
  }

  return (
    <div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex flex-wrap gap-2 pb-3" aria-label="Attached cores">
          {attached.map((core) => (
            <AttachedChip
              key={core.id}
              core={core}
              onDetach={core.implicit ? undefined : () => detach(core.id)}
              onMoveLeft={() => move(core.id, -1)}
              onMoveRight={() => move(core.id, 1)}
              onOpen={() => onOpenCore?.(core.kind === 'user' ? 'user' : 'situation')}
            />
          ))}
          <button
            type="button"
            data-testid="v7-attach-core-link"
            onClick={() => setPickerOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:border-navy-400 hover:bg-slate-50"
          >
            + attach core
          </button>
        </div>
      </DndContext>

      {pickerOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-navy-950/20 sm:static sm:mt-2 sm:max-h-none sm:rounded-lg sm:bg-slate-50 sm:shadow-sm" data-testid="v7-attach-core-picker">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold-700">Attach Context Cores</p>
              <p className="mt-1 text-xs leading-5 text-slate-700">Attach situations, methodology, team rubrics, sources, graph, or output cores to this Ask thread.</p>
            </div>
            <button type="button" onClick={() => setPickerOpen(false)} className="rounded-md border border-slate-200 bg-white p-2 text-slate-700" aria-label="Close core picker">
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="mt-3 flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cores"
              className="w-full bg-transparent text-sm text-navy-950 outline-none placeholder:text-slate-500"
            />
          </label>
          <div className="mt-3 rounded-md border border-slate-200 bg-white p-3" data-testid="v7-build-core-menu">
            <p className="text-xs font-semibold uppercase text-slate-700">Build a core</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <button type="button" onClick={() => { setPickerOpen(false); onCreateSituation?.(); }} className="rounded-md border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-navy-900 hover:border-navy-300">
                Situation
              </button>
              <Link href="/app/cores?panel=methodology" className="rounded-md border border-slate-200 px-2 py-2 text-xs font-semibold text-navy-900 hover:border-navy-300">
                Methodology
              </Link>
              <Link href="/app/cores?panel=team" className="rounded-md border border-slate-200 px-2 py-2 text-xs font-semibold text-navy-900 hover:border-navy-300">
                Team rubric
              </Link>
              <Link href="/app/cores?panel=sources" className="rounded-md border border-slate-200 px-2 py-2 text-xs font-semibold text-navy-900 hover:border-navy-300">
                Source
              </Link>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {grouped.length ? grouped.map(([kind, cores]) => {
              const Icon = kindIcons[kind] ?? Boxes;
              return (
                <section key={kind}>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-700">
                    <Icon className="h-3.5 w-3.5" />
                    {kindLabels[kind] ?? kind}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {cores.map((core) => (
                      <button
                        key={core.id}
                        type="button"
                        onClick={() => attach(core)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-navy-950 hover:border-navy-300"
                      >
                        {core.name}
                        <span className="block text-[10px] uppercase text-slate-600">{core.kind}{core.tags?.includes('example') ? ' · example' : ''}</span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            }) : (
              <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700">No matching cores. Create a new Situation or clear the search.</p>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              data-testid="v7-create-situation-core"
              onClick={() => {
                setPickerOpen(false);
                onCreateSituation?.();
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800"
            >
              Create Situation Core
            </button>
            <Link href={examplesHref} className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-900 hover:border-navy-300">
              Browse seeded examples
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachedChip({
  core,
  onDetach,
  onMoveLeft,
  onMoveRight,
  onOpen,
}: {
  core: AttachedCore;
  onDetach?: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onOpen: () => void;
}) {
  const Icon = kindIcons[core.kind] ?? Boxes;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: core.id, disabled: core.implicit });
  const { setNodeRef: setDropRef } = useDroppable({ id: core.id, disabled: core.implicit });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <span ref={setDropRef} className="inline-flex max-w-full items-center">
      <button
        ref={setNodeRef}
        type="button"
        data-testid={`v7-core-chip-${core.kind}`}
        onClick={onOpen}
        style={style}
        className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-l-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm"
      >
        <span {...listeners} {...attributes} className="cursor-grab text-slate-500" aria-label="Drag to reorder core">
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <Icon className="h-4 w-4 shrink-0 text-gold-700" />
        <span className="truncate">{core.name}</span>
        <span className="hidden text-[10px] uppercase text-slate-600 sm:inline">{core.implicit ? 'Always attached' : core.kind}</span>
      </button>
      {!core.implicit && (
        <span className="inline-flex min-h-10 overflow-hidden rounded-r-full border-y border-r border-slate-200 bg-slate-50">
          <button type="button" onClick={onMoveLeft} className="px-2 text-[10px] font-semibold text-slate-700 hover:bg-white" aria-label={`Move ${core.name} left`}>Left</button>
          <button type="button" onClick={onMoveRight} className="px-2 text-[10px] font-semibold text-slate-700 hover:bg-white" aria-label={`Move ${core.name} right`}>Right</button>
          <button type="button" onClick={onDetach} className="px-2 text-[10px] font-semibold text-red-700 hover:bg-white" aria-label={`Detach ${core.name}`}>Detach</button>
        </span>
      )}
    </span>
  );
}
