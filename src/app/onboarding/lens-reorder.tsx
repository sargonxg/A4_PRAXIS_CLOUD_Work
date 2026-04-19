'use client';

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { LENS_CATALOG } from '@/lib/constants/lens-catalog';
import { LENSES, type Lens } from '@/types/analyst-profile';
import { cn } from '@/lib/utils/cn';

export function LensReorder({
  value, onChange, max = 5,
}: { value: Lens[]; onChange: (next: Lens[]) => void; max?: number }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const available = LENSES.filter(l => !value.includes(l));

  const toggleAdd = (lens: Lens) => {
    if (value.length >= max) return;
    onChange([...value, lens]);
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = value.indexOf(e.active.id as Lens);
    const newIdx = value.indexOf(e.over.id as Lens);
    onChange(arrayMove(value, oldIdx, newIdx));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-navy-700">Analytical lens</label>
        <span className="text-[10px] text-navy-400">{value.length}/{max}</span>
      </div>
      <p className="text-[11px] text-navy-500">Drag to reorder. The first lens biases retrieval most.</p>

      {/* Selected, ordered */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/5 p-2 min-h-[44px]">
            {value.length === 0 && <span className="text-[11px] text-navy-400 px-2 py-1">Add lenses below…</span>}
            {value.map((l, i) => (
              <SortableLens
                key={l}
                lens={l}
                primary={i === 0}
                onRemove={() => onChange(value.filter(x => x !== l))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Available */}
      <div className="flex flex-wrap gap-1.5">
        {available.map(l => {
          const def = LENS_CATALOG[l];
          return (
            <button
              key={l}
              onClick={() => toggleAdd(l)}
              disabled={value.length >= max}
              className={cn(
                'rounded-full border border-navy-200 bg-white px-2.5 py-1 text-[11px] text-navy-600 hover:border-navy-300',
                'focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:outline-none',
                value.length >= max && 'opacity-50 cursor-not-allowed',
              )}
            >
              + {def.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SortableLens({ lens, primary, onRemove }: { lens: Lens; primary: boolean; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lens });
  const def = LENS_CATALOG[lens];
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] shadow-sm select-none',
        primary ? 'border-gold-500/50 bg-gold-500/10 font-semibold text-gold-800' : 'border-navy-200 bg-white text-navy-800',
        isDragging && 'opacity-50',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder lens ${def.label}`}
        className="cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40"
      >
        <GripVertical className="h-3 w-3 text-navy-400" />
      </button>
      <span>{def.label}</span>
      {primary && <span className="rounded-full bg-gold-500 text-white text-[8px] px-1 py-0.5">PRIMARY</span>}
      <button
        onClick={onRemove}
        aria-label={`Remove lens ${def.label}`}
        className="text-navy-400 hover:text-red-500"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
