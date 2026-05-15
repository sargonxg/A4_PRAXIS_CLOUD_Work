'use client';

import { type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock, Unlock } from 'lucide-react';
import { SpecimenCard, type CoreSpecimenKind } from '@/components/cores/specimen-card';
import { cn } from '@/lib/utils/cn';

export interface CapsuleSlotData {
  /** Stable id for dnd-kit. Either `${kind}` for empty slots or `${kind}:${coreId}`. */
  slotId: string;
  kind: CoreSpecimenKind;
  /** Title shown inside the specimen frame. Empty string when unfilled. */
  title: string;
  essence?: string;
  /** Underlying core id this slot points at, if any. */
  coreId?: string | null;
  locked?: boolean;
  /** ISO timestamp of when the underlying core was last refreshed. */
  staleAt?: string | null;
}

export interface CapsuleSlotProps {
  slot: CapsuleSlotData;
  onSwap?: (slotId: string) => void;
  onToggleLock?: (slotId: string) => void;
  trailing?: ReactNode;
  className?: string;
}

const EMPTY_TITLE: Record<CoreSpecimenKind, string> = {
  user: 'Set posture',
  situation: 'Attach situation',
  path: '+ Pick path',
  source: 'Add receipts',
  graph: 'Open graph',
  time: 'Set horizon',
  output: 'Open memo',
  tool: 'Attach tool',
  objective: 'Set objective',
  product: 'Pick product',
  memory: 'Wire memory',
};

export function CapsuleSlot({ slot, onSwap, onToggleLock, trailing, className }: CapsuleSlotProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.slotId,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `slot:${slot.slotId}`,
    data: { kind: slot.kind, slotId: slot.slotId },
  });
  const { active } = useDndContext();

  const filled = Boolean(slot.coreId);
  const locked = Boolean(slot.locked);
  const displayTitle = filled && slot.title ? slot.title : EMPTY_TITLE[slot.kind];

  const draggedKind = active?.data?.current?.kind as CoreSpecimenKind | undefined;
  const isLibraryDrag = typeof active?.id === 'string' && active.id.startsWith('library:');
  const compatible = !draggedKind || draggedKind === slot.kind;
  const stale = !locked && filled && Boolean(slot.staleAt) && isStale(slot.staleAt);

  let dropState: 'idle' | 'compatible' | 'incompatible' | 'locked' = 'idle';
  if (isOver && isLibraryDrag) {
    if (locked) dropState = 'locked';
    else if (!compatible) dropState = 'incompatible';
    else dropState = 'compatible';
  }

  const composedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  return (
    <div
      ref={composedRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative rounded-sm transition-all',
        isDragging && 'opacity-60 z-10',
        dropState === 'compatible' && 'ring-2 ring-emerald-500 ring-offset-2 scale-[1.01]',
        dropState === 'incompatible' && 'ring-2 ring-rose-500 ring-offset-2 opacity-70',
        dropState === 'locked' && 'ring-2 ring-rose-500 ring-offset-2 animate-pulse',
        dropState === 'idle' && isOver && 'ring-2 ring-diplomatic-blue ring-offset-2',
        locked && dropState === 'idle' && 'ring-2 ring-[#8A5A00]/40 ring-offset-2',
        stale && dropState === 'idle' && 'ring-2 ring-amber-400/60 ring-offset-2',
        className,
      )}
      data-drop-state={dropState}
      data-stale={stale ? 'true' : undefined}
    >
      <SpecimenCard
        kind={slot.kind}
        title={displayTitle}
        essence={filled ? slot.essence : 'Empty slot — click to attach a core.'}
        trailing={
          <div className="flex items-center gap-1">
            {onToggleLock ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleLock(slot.slotId);
                }}
                className="relative z-20 rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                aria-label={`${locked ? 'Unlock' : 'Lock'} ${slot.kind} core`}
                title={`${locked ? 'Unlock' : 'Lock'} ${slot.kind} core`}
              >
                {locked ? <Lock className="h-3 w-3 text-[#8A5A00]" /> : <Unlock className="h-3 w-3" />}
              </button>
            ) : null}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="relative z-20 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-grab active:cursor-grabbing"
              aria-label="Reorder slot"
            >
              <GripVertical className="h-3 w-3" />
            </button>
            {trailing}
          </div>
        }
      />
      {onSwap ? (
        <button
          type="button"
          onClick={() => onSwap(slot.slotId)}
          disabled={locked}
          className="absolute inset-0 z-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diplomatic-blue disabled:cursor-not-allowed"
          aria-label={locked ? `${slot.kind} core is locked` : `Swap ${slot.kind} core`}
          tabIndex={-1}
        />
      ) : null}
      {dropState === 'locked' ? (
        <span className="pointer-events-none absolute -top-2 left-2 z-30 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          locked
        </span>
      ) : null}
      {dropState === 'incompatible' ? (
        <span className="pointer-events-none absolute -top-2 left-2 z-30 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          wrong kind
        </span>
      ) : null}
      {stale && dropState === 'idle' ? (
        <span className="pointer-events-none absolute -top-2 left-2 z-30 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          stale
        </span>
      ) : null}
    </div>
  );
}

function isStale(timestamp: string | null | undefined): boolean {
  if (!timestamp) return false;
  const t = Date.parse(timestamp);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t > 14 * 24 * 60 * 60 * 1000;
}
