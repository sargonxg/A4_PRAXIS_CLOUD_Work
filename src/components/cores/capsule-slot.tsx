'use client';

import { type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
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
}

export interface CapsuleSlotProps {
  slot: CapsuleSlotData;
  onSwap?: (slotId: string) => void;
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
  memory: 'Wire memory',
};

export function CapsuleSlot({ slot, onSwap, trailing, className }: CapsuleSlotProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.slotId,
  });

  const filled = Boolean(slot.coreId);
  const displayTitle = filled && slot.title ? slot.title : EMPTY_TITLE[slot.kind];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative',
        isDragging && 'opacity-60 z-10',
        className,
      )}
    >
      <SpecimenCard
        kind={slot.kind}
        title={displayTitle}
        essence={filled ? slot.essence : 'Empty slot — click to attach a core.'}
        trailing={
          <div className="flex items-center gap-1">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-grab active:cursor-grabbing"
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
          className="absolute inset-0 z-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diplomatic-blue"
          aria-label={`Swap ${slot.kind} core`}
          tabIndex={-1}
        />
      ) : null}
    </div>
  );
}
