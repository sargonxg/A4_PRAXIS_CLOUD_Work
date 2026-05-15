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
import { CoreSwapDrawer } from '@/components/cores/CoreSwapDrawer';
import { CoreLibraryRail } from '@/components/cores/CoreLibraryRail';
import { CapsuleRadar } from '@/components/cores/CapsuleRadar';
import { cn } from '@/lib/utils/cn';

interface CapsuleBoardProps {
  situationId?: string;
  hideLibraryRail?: boolean;
  hideHeader?: boolean;
  capsuleIdOverride?: string | null;
  onActiveCapsuleChange?: (capsule: PraxisCapsule | null) => void;
}

const SLOT_ORDER: CoreSpecimenKind[] = ['user', 'situation', 'path', 'source', 'document', 'graph', 'time', 'tool', 'objective', 'product', 'output', 'memory'];

function emptyBoard(): CapsuleSlotData[] {
  return SLOT_ORDER.map((kind) => ({ slotId: kind, kind, title: '', coreId: null }));
}

function capsuleToSlots(capsule: PraxisCapsule | null): CapsuleSlotData[] {
  if (!capsule) return emptyBoard();
  const refs = capsule.coreRefs;
  const isLocked = (kind: CoreSpecimenKind) => capsule.lockedCoreKinds.includes(kind);
  return [
    {
      slotId: refs.userCoreId ? `user:${refs.userCoreId}` : 'user',
      kind: 'user',
      title: refs.userCoreId ?? '',
      coreId: refs.userCoreId,
      locked: isLocked('user'),
    },
    {
      slotId: refs.situationCoreId ? `situation:${refs.situationCoreId}` : 'situation',
      kind: 'situation',
      title: refs.situationCoreId ?? '',
      coreId: refs.situationCoreId,
      locked: isLocked('situation'),
    },
    {
      slotId: refs.pathCoreId ? `path:${refs.pathCoreId}` : 'path',
      kind: 'path',
      title: refs.pathCoreId ?? '',
      essence: refs.pathCoreId ? undefined : '+ pick path — operator profile sets tools, frameworks, voice.',
      coreId: refs.pathCoreId,
      locked: isLocked('path'),
    },
    {
      slotId: refs.sourceCoreIds[0] ? `source:${refs.sourceCoreIds[0]}` : 'source',
      kind: 'source',
      title: refs.sourceCoreIds[0] ?? '',
      essence: refs.sourceCoreIds.length > 1 ? `+${refs.sourceCoreIds.length - 1} more` : undefined,
      coreId: refs.sourceCoreIds[0] ?? null,
      locked: isLocked('source'),
    },
    {
      slotId: refs.documentCoreIds[0] ? `document:${refs.documentCoreIds[0]}` : 'document',
      kind: 'document',
      title: refs.documentCoreIds[0] ?? '',
      essence: refs.documentCoreIds.length > 1 ? `+${refs.documentCoreIds.length - 1} more` : undefined,
      coreId: refs.documentCoreIds[0] ?? null,
      locked: isLocked('document'),
    },
    {
      slotId: refs.graphCoreId ? `graph:${refs.graphCoreId}` : 'graph',
      kind: 'graph',
      title: refs.graphCoreId ?? '',
      coreId: refs.graphCoreId,
      locked: isLocked('graph'),
    },
    {
      slotId: refs.timeCoreId ? `time:${refs.timeCoreId}` : 'time',
      kind: 'time',
      title: refs.timeCoreId ?? '',
      essence: refs.timeCoreId ? undefined : 'Set the validity and freshness horizon.',
      coreId: refs.timeCoreId ?? null,
      locked: isLocked('time'),
    },
    {
      slotId: refs.toolCoreIds?.[0] ? `tool:${refs.toolCoreIds[0]}` : 'tool',
      kind: 'tool',
      title: refs.toolCoreIds?.[0] ?? '',
      essence: refs.toolCoreIds && refs.toolCoreIds.length > 1 ? `+${refs.toolCoreIds.length - 1} more` : 'Attach specialist tool routing.',
      coreId: refs.toolCoreIds?.[0] ?? null,
      locked: isLocked('tool'),
    },
    {
      slotId: refs.objectiveCoreIds?.[0] ? `objective:${refs.objectiveCoreIds[0]}` : 'objective',
      kind: 'objective',
      title: refs.objectiveCoreIds?.[0] ?? '',
      essence: refs.objectiveCoreIds && refs.objectiveCoreIds.length > 1 ? `+${refs.objectiveCoreIds.length - 1} more` : 'Set the task Ask PRAXIS should optimize for.',
      coreId: refs.objectiveCoreIds?.[0] ?? null,
      locked: isLocked('objective'),
    },
    {
      slotId: refs.productCoreIds?.[0] ? `product:${refs.productCoreIds[0]}` : 'product',
      kind: 'product',
      title: refs.productCoreIds?.[0] ?? '',
      essence: refs.productCoreIds && refs.productCoreIds.length > 1 ? `+${refs.productCoreIds.length - 1} more` : 'Pick the final work product shape.',
      coreId: refs.productCoreIds?.[0] ?? null,
      locked: isLocked('product'),
    },
    {
      slotId: refs.outputCoreIds[0] ? `output:${refs.outputCoreIds[0]}` : 'output',
      kind: 'output',
      title: refs.outputCoreIds[0] ?? '',
      essence: refs.outputCoreIds.length > 1 ? `+${refs.outputCoreIds.length - 1} more` : undefined,
      coreId: refs.outputCoreIds[0] ?? null,
      locked: isLocked('output'),
    },
    {
      slotId: refs.memoryCoreId ? `memory:${refs.memoryCoreId}` : 'memory',
      kind: 'memory',
      title: refs.memoryCoreId ?? '',
      essence: refs.memoryCoreId ? undefined : 'Attach pinned working memory.',
      coreId: refs.memoryCoreId ?? null,
      locked: isLocked('memory'),
    },
  ];
}

export function CapsuleBoard({
  situationId,
  hideLibraryRail = false,
  hideHeader = false,
  capsuleIdOverride,
  onActiveCapsuleChange,
}: CapsuleBoardProps) {
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
        const explicit = capsuleIdOverride
          ? body.capsules.find((c) => c.capsuleId === capsuleIdOverride)
          : undefined;
        const activeForSituation = situationId
          ? body.capsules.find((c) => c.activeForSituationIds.includes(situationId))
          : undefined;
        const active: PraxisCapsule | null = explicit ?? activeForSituation ?? body.capsules[0] ?? null;
        setCapsule(active);
        setSlots(capsuleToSlots(active));
        onActiveCapsuleChange?.(active);
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
  }, [situationId, capsuleIdOverride, onActiveCapsuleChange]);

  useEffect(() => {
    const handler = () => {
      const url = situationId ? `/api/context/capsules?situationId=${encodeURIComponent(situationId)}` : '/api/context/capsules';
      fetch(url, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((body: { capsules: PraxisCapsule[] }) => {
          const next = capsuleIdOverride
            ? body.capsules.find((c) => c.capsuleId === capsuleIdOverride)
            : body.capsules.find((c) => c.capsuleId === capsule?.capsuleId) ?? body.capsules[0];
          if (!next) return;
          setCapsule(next);
          setSlots(capsuleToSlots(next));
          onActiveCapsuleChange?.(next);
        })
        .catch(() => undefined);
    };
    window.addEventListener('capsule-mutated', handler);
    return () => window.removeEventListener('capsule-mutated', handler);
  }, [situationId, capsuleIdOverride, capsule?.capsuleId, onActiveCapsuleChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('library:') && overId.startsWith('slot:')) {
      const coreId = activeId.slice('library:'.length);
      const slotId = overId.slice('slot:'.length);
      const slot = slots.find((s) => s.slotId === slotId);
      if (!slot) return;
      if (slot.locked) {
        setError(`${slot.kind} core is locked. Unlock it before swapping.`);
        return;
      }
      const draggedKind = active.data?.current?.kind as CoreSpecimenKind | undefined;
      if (draggedKind && draggedKind !== slot.kind) {
        setError(`Cannot drop ${draggedKind} core into ${slot.kind} slot.`);
        return;
      }
      // Optimistic: stamp the new core into the slot. CoreSwapDrawer will
      // also fire when opened directly; this branch handles drag-only.
      setSlots((prev) =>
        prev.map((s) => (s.slotId === slotId ? { ...s, coreId, title: coreId, slotId: `${s.kind}:${coreId}` } : s)),
      );
      // POST swap (best-effort; 404 ignored until Codex CX-7 ships)
      if (capsule) {
        void fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}/swap`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slotKind: slot.kind, coreId, mode: isMultiSlot(slot.kind) ? 'add' : 'replace' }),
        })
          .then(() => window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId: capsule.capsuleId } })))
          .catch(() => undefined);
      }
      return;
    }

    // Sortable reorder within the board
    if (activeId === overId) return;
    setSlots((prev) => {
      const oldIndex = prev.findIndex((s) => s.slotId === activeId);
      const newIndex = prev.findIndex((s) => s.slotId === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const [swapTarget, setSwapTarget] = useState<{ kind: CoreSpecimenKind; slotId: string } | null>(
    null,
  );

  const handleSwap = (slotId: string) => {
    const slot = slots.find((s) => s.slotId === slotId);
    if (!slot) return;
    if (slot.locked) {
      setError(`${slot.kind} core is locked. Unlock it before swapping.`);
      return;
    }
    setSwapTarget({ kind: slot.kind, slotId });
  };

  const handleToggleLock = async (slotId: string) => {
    if (!capsule) return;
    const slot = slots.find((s) => s.slotId === slotId);
    if (!slot) return;
    const nextLocked = !slot.locked;
    setError(null);
    setSlots((prev) => prev.map((s) => (s.kind === slot.kind ? { ...s, locked: nextLocked } : s)));
    try {
      const res = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: nextLocked ? 'lock' : 'unlock', coreKind: slot.kind }),
      });
      if (!res.ok) throw new Error(`Lock update failed: ${res.status}`);
      const body = (await res.json()) as { capsule: PraxisCapsule };
      setCapsule(body.capsule);
      setSlots(capsuleToSlots(body.capsule));
      window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId: body.capsule.capsuleId } }));
    } catch (err) {
      setSlots(capsuleToSlots(capsule));
      setError(err instanceof Error ? err.message : String(err));
    }
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
    <section className={cn('rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-navy-950/5 backdrop-blur', hideHeader ? 'p-4' : 'p-6')}>
      {hideHeader ? null : (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Active capsule</p>
            <h2 className="mt-1 text-xl font-semibold text-navy-950">
              {capsule?.label ?? (loading ? 'Loading…' : 'No capsule yet')}
            </h2>
          </div>
          <div className="flex items-start gap-3">
            <CapsuleRadar
              size="compact"
              capsuleId={capsule?.capsuleId ?? null}
              onAxisActivate={(axis) => {
                const slot = slots.find((s) => s.kind === axis);
                if (slot) handleSwap(slot.slotId);
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!capsule || saving}
              className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save as new
            </button>
          </div>
        </header>
      )}

      {error ? (
        <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">{error}</p>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          {hideLibraryRail ? null : <CoreLibraryRail />}
          <div className="min-w-0 flex-1">
            <SortableContext items={slotIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {slots.map((slot) => (
                  <CapsuleSlot
                    key={slot.slotId}
                    slot={slot}
                    onSwap={handleSwap}
                    onToggleLock={handleToggleLock}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </div>
      </DndContext>

      <CoreSwapDrawer
        open={swapTarget !== null}
        capsuleId={capsule?.capsuleId ?? null}
        slotKind={swapTarget?.kind ?? null}
        currentCoreId={
          swapTarget ? slots.find((s) => s.slotId === swapTarget.slotId)?.coreId ?? null : null
        }
        onClose={() => setSwapTarget(null)}
        onSwap={(coreId, mode) => {
          if (!swapTarget) return;
          setSlots((prev) =>
            prev.map((s) =>
              s.slotId === swapTarget.slotId
                ? mode === 'remove'
                  ? { ...s, coreId: null, title: '', slotId: s.kind }
                  : { ...s, coreId, title: coreId, slotId: `${s.kind}:${coreId}` }
                : s,
            ),
          );
        }}
      />
    </section>
  );
}

function isMultiSlot(kind: CoreSpecimenKind): boolean {
  return kind === 'source' || kind === 'document' || kind === 'tool' || kind === 'objective' || kind === 'product' || kind === 'output';
}
