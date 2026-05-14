'use client';

import { type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
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
  // Accept drops from CoreLibraryRail (draggables with id "library:<coreId>").
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `slot:${slot.slotId}`,
    data: { kind: slot.kind, slotId: slot.slotId },
  });

  const filled = Boolean(slot.coreId);
  const locked = Boolean(slot.locked);
  const displayTitle = filled && slot.title ? slot.title : EMPTY_TITLE[slot.kind];

  const composedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  return (
    <div
      ref={composedRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative',
        isDragging && 'opacity-60 z-10',
        isOver && 'ring-2 ring-diplomatic-blue ring-offset-2 rounded-sm',
        locked && 'rounded-sm ring-2 ring-[#8A5A00]/40 ring-offset-2',
        className,
      )}
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
    </div>
  );
}
