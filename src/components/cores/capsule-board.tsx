'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Loader2, Save } from 'lucide-react';
import { CapsuleSlot, type CapsuleSlotData } from './capsule-slot';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';

interface CapsuleBoardProps {
  situationId?: string;
}

const SLOT_ORDER: CoreSpecimenKind[] = ['user', 'situation', 'source', 'graph', 'time', 'output'];

function emptyBoard(): CapsuleSlotData[] {
  return SLOT_ORDER.map((kind) => ({ slotId: kind, kind, title: '', coreId: null }));
}

function capsuleToSlots(capsule: PraxisCapsule | null): CapsuleSlotData[] {
  if (!capsule) return emptyBoard();
  const refs = capsule.coreRefs;
  return [
    {
      slotId: refs.userCoreId ? `user:${refs.userCoreId}` : 'user',
      kind: 'user',
      title: refs.userCoreId ?? '',
      coreId: refs.userCoreId,
    },
    {
      slotId: refs.situationCoreId ? `situation:${refs.situationCoreId}` : 'situation',
      kind: 'situation',
      title: refs.situationCoreId ?? '',
      coreId: refs.situationCoreId,
    },
    {
      slotId: refs.sourceCoreIds[0] ? `source:${refs.sourceCoreIds[0]}` : 'source',
      kind: 'source',
      title: refs.sourceCoreIds[0] ?? '',
      essence: refs.sourceCoreIds.length > 1 ? `+${refs.sourceCoreIds.length - 1} more` : undefined,
      coreId: refs.sourceCoreIds[0] ?? null,
    },
    {
      slotId: refs.graphCoreId ? `graph:${refs.graphCoreId}` : 'graph',
      kind: 'graph',
      title: refs.graphCoreId ?? '',
      coreId: refs.graphCoreId,
    },
    {
      slotId: 'time',
      kind: 'time',
      title: '',
      essence: 'Time Core slot — not yet persisted on capsule.',
      coreId: null,
    },
    {
      slotId: refs.outputCoreIds[0] ? `output:${refs.outputCoreIds[0]}` : 'output',
      kind: 'output',
      title: refs.outputCoreIds[0] ?? '',
      essence: refs.outputCoreIds.length > 1 ? `+${refs.outputCoreIds.length - 1} more` : undefined,
      coreId: refs.outputCoreIds[0] ?? null,
    },
  ];
}

export function CapsuleBoard({ situationId }: CapsuleBoardProps) {
  const [capsule, setCapsule] = useState<PraxisCapsule | null>(null);
  const [slots, setSlots] = useState<CapsuleSlotData[]>(emptyBoard);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  useEffect(() => {
    let cancelled = false;
    const url = situationId ? `/api/context/capsules?situationId=${encodeURIComponent(situationId)}` : '/api/context/capsules';
    fetch(url, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Capsule list failed: ${res.status}`);
        return (await res.json()) as { capsules: PraxisCapsule[]; persisted: boolean };
      })
      .then((body) => {
        if (cancelled) return;
        const activeForSituation = situationId
          ? body.capsules.find((c) => c.activeForSituationIds.includes(situationId))
          : undefined;
        const active: PraxisCapsule | null = activeForSituation ?? body.capsules[0] ?? null;
        setCapsule(active);
        setSlots(capsuleToSlots(active));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [situationId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSlots((prev) => {
      const oldIndex = prev.findIndex((s) => s.slotId === active.id);
      const newIndex = prev.findIndex((s) => s.slotId === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSwap = (slotId: string) => {
    // TODO: open core picker popover. For now log so the action is observable
    // until the popover lister lands.
    console.info('[CapsuleBoard] swap requested for slot', slotId);
  };

  const handleSave = async () => {
    if (!capsule) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/context/capsules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          label: `${capsule.label} (saved ${new Date().toISOString().slice(0, 10)})`,
          scope: capsule.scope,
          coreRefs: capsule.coreRefs,
          activeForSituationIds: capsule.activeForSituationIds,
        }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const slotIds = useMemo(() => slots.map((s) => s.slotId), [slots]);

  return (
    <section className="rounded-2xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-navy-950/5 backdrop-blur">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Active capsule</p>
          <h2 className="mt-1 text-xl font-semibold text-navy-950">
            {capsule?.label ?? (loading ? 'Loading…' : 'No capsule yet')}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!capsule || saving}
          className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save as new
        </button>
      </header>

      {error ? (
        <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">{error}</p>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slotIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => (
              <CapsuleSlot key={slot.slotId} slot={slot} onSwap={handleSwap} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
