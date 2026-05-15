'use client';

/**
 * CoreLibraryRail — fixed left rail listing draggable cores from the
 * library. Drop targets are CapsuleSlots inside CapsuleBoard.
 *
 * Brief: Claude Code CC-1.
 *
 * Uses dnd-kit external draggables: each item exposes itself via
 * useDraggable. CapsuleSlot listens via useDroppable for items whose
 * id starts with "library:". Drop fires the same swap path the
 * CoreSwapDrawer uses.
 *
 * Reduced-motion respected — drop snaps instantly.
 */

import { useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, LibraryBig } from 'lucide-react';
import { fetchCoresLibrary, type LibraryCore } from '@/lib/mocks/cores-library';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { cn } from '@/lib/utils/cn';

const RAIL_KINDS: CoreSpecimenKind[] = [
  'user',
  'situation',
  'path',
  'source',
  'document',
  'graph',
  'time',
  'tool',
  'objective',
  'product',
  'output',
  'memory',
];

export function CoreLibraryRail() {
  const [openKinds, setOpenKinds] = useState<Set<CoreSpecimenKind>>(new Set(['situation', 'path', 'tool', 'objective', 'product']));
  const [byKind, setByKind] = useState<Partial<Record<CoreSpecimenKind, LibraryCore[]>>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      RAIL_KINDS.map((k) => fetchCoresLibrary(k).then((cores) => [k, cores] as const)),
    ).then((entries) => {
      if (cancelled) return;
      const next: Partial<Record<CoreSpecimenKind, LibraryCore[]>> = {};
      for (const [k, cores] of entries) next[k] = cores.slice(0, 4);
      setByKind(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(kind: CoreSpecimenKind) {
    setOpenKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  return (
    <aside
      aria-label="Core library rail"
      className="hidden w-64 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white px-2 py-3 lg:flex"
    >
      <div className="mb-2 flex items-center gap-2 px-2">
        <LibraryBig className="h-4 w-4 text-diplomatic-blue" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
          Core library
        </span>
      </div>
      {RAIL_KINDS.map((kind) => {
        const cores = byKind[kind] ?? [];
        const open = openKinds.has(kind);
        return (
          <div key={kind} className="rounded-md">
            <button
              type="button"
              onClick={() => toggle(kind)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              aria-expanded={open}
            >
              <span>{kind}</span>
              <span className="font-mono text-[10px] text-slate-400">{cores.length}</span>
            </button>
            {open ? (
              <div className="mt-1 space-y-1 px-1 pb-1">
                {cores.map((core) => (
                  <RailItem key={core.id} core={core} />
                ))}
                {cores.length === 0 ? (
                  <p className="px-1 text-[10px] text-slate-500">no cores</p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}

function RailItem({ core }: { core: LibraryCore }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library:${core.id}`,
    data: { kind: core.kind, coreId: core.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex cursor-grab items-start gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left transition active:cursor-grabbing',
        isDragging ? 'opacity-50' : 'hover:border-slate-300 hover:bg-slate-50',
      )}
      role="button"
      aria-label={`Drag ${core.name} into a capsule slot`}
    >
      <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-slate-400 group-hover:text-slate-600" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-semibold text-navy-950">{core.name}</span>
        <span className="mt-0.5 block text-[10px] text-slate-500">
          {core.lineage} · {core.completeness}%
        </span>
      </span>
    </div>
  );
}
