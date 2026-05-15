'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Brain, FileText, LibraryBig, Target, ShieldAlert } from 'lucide-react';
import { AppPageHeader } from '@/components/app/app-page-header';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { WorkOnThisMenu } from '@/components/app/work-on-this-menu';
import { ContextCapsulePreview } from '@/components/context/context-capsule-preview';
import { ContextGraphPreview } from '@/components/graph/ContextGraphPreview';
import { listExampleCases } from '@/lib/cases/registry';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import { getActiveUserModelId, listPrivateUserModels } from '@/lib/users/api';
import { useSituationStore } from '@/stores/situation-store';

export function ContextCanvasPage() {
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);
  const { stack, hydrated: stackHydrated, saveStack } = useActiveContextStack();
  const [layout, setLayout] = useState<Record<string, { x: number; y: number }>>({});
  const exampleCase = useMemo(() => listExampleCases()[0] ?? null, []);

  const activeUserCore = useMemo(() => {
    const privateModels = typeof window === 'undefined' ? [] : listPrivateUserModels(window.localStorage);
    const activeId = stack.userModelId ?? (typeof window === 'undefined' ? null : getActiveUserModelId(window.localStorage));
    return [...privateModels, ...PUBLIC_USER_MODELS].find((model) => model.modelId === activeId) ?? PUBLIC_USER_MODELS[0];
  }, [stack.userModelId]);

  useEffect(() => {
    if (stack.situationId) setActiveSituation(stack.situationId);
  }, [setActiveSituation, stack.situationId]);

  useEffect(() => {
    if (!stackHydrated) return undefined;
    const handle = window.setTimeout(() => setLayout(stack.canvasLayout), 0);
    return () => window.clearTimeout(handle);
  }, [stack.canvasLayout, stackHydrated]);

  const situation = (stack.situationId ? situations.find((item) => item.id === stack.situationId) ?? null : null) ?? activeSituation ?? situations[0] ?? exampleCase?.situation ?? null;
  const sourceTitles = situation?.sourceUrls?.length
    ? situation.sourceUrls
    : exampleCase?.sources.slice(0, 8).map((source) => source.title ?? source.name ?? source.url ?? source.receiptId) ?? [];
  const timelineNodes = situation?.keyDates?.length
    ? situation.keyDates.map((item, index) => ({ id: `timeline:${index}`, title: item.label, detail: item.date }))
    : exampleCase?.episodes?.filter((episode) => episode.strand === 'situation').slice(0, 6).map((episode) => ({
        id: episode.id,
        title: episode.title,
        detail: episode.validFrom.slice(0, 10),
      })) ?? [];
  const claimNodes = exampleCase?.sources.slice(0, 4).map((source) => ({
    id: `claim:${source.receiptId}`,
    title: source.excerpt ?? source.title ?? source.receiptId,
    detail: source.tier ?? 'source',
  })) ?? [];
  const savedGaps = stack.evidenceGaps.filter((gap) => !gap.resolvedAt && (!situation?.id || !gap.situationId || gap.situationId === situation.id));
  const sourceCount = sourceTitles.length + (situation?.documentCount ?? 0);
  const actorCount = situation?.actors?.length ?? situation?.actorCount ?? 0;
  const health = buildContextHealthReport({
    hasUserCore: Boolean(activeUserCore),
    hasSituationCore: Boolean(situation),
    sourceCount: situation?.sourceUrls?.length ?? 0,
    documentCount: situation?.documentCount ?? 0,
    actorCount,
    hasTimeline: Boolean(situation?.keyDates?.length || situation?.latestEventDate || situation?.conflictOnsetDate),
    evidenceGapCount: savedGaps.length || (situation ? Math.max(0, 3 - sourceCount) : 4),
    hasDraft: false,
    situationHref: situation ? `/app/workbench/${situation.id}` : '/app/contexts',
  });
  const canvasNodes = [
    { id: 'user-core', label: 'User Core', title: activeUserCore.identity, x: 24, y: 28, href: '/app/cores/user' },
    { id: 'situation-core', label: 'Situation Core', title: situation?.name ?? 'No situation selected', x: 310, y: 28, href: situation ? `/app/workbench/${situation.id}` : '/app/contexts' },
    { id: 'sources', label: 'Sources', title: `${sourceCount} evidence items`, x: 24, y: 210, href: situation ? `/app/workbench/${situation.id}?tab=library` : '/app/contexts' },
    { id: 'actors', label: 'Actors', title: `${actorCount} actors`, x: 310, y: 210, href: '/app/canvas' },
    { id: 'claims', label: 'Claims', title: `${claimNodes.length} review claims`, x: 596, y: 210, href: '/app/write' },
    { id: 'gaps', label: 'Evidence Gaps', title: `${savedGaps.length} saved gaps`, x: 24, y: 392, href: '/app/write' },
    { id: 'timeline', label: 'Timeline', title: `${timelineNodes.length} events`, x: 596, y: 28, href: '/app/canvas' },
    { id: 'draft', label: 'Draft', title: 'Memo Studio working product', x: 310, y: 392, href: '/app/write' },
  ];

  function saveNodePosition(id: string, position: { x: number; y: number }) {
    const next = { ...layout, [id]: position };
    setLayout(next);
    void saveStack({ canvasLayout: next });
  }

  function markGapResolved(gapId: string) {
    void saveStack({
      evidenceGaps: stack.evidenceGaps.map((gap) => (
        gap.id === gapId ? { ...gap, resolvedAt: new Date().toISOString() } : gap
      )),
    });
  }

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-5 pb-16" data-testid="context-canvas-page">
      <AppPageHeader
        eyebrow="Canvas"
        title="Review the active structure."
        subtitle="Inspect user, situation, sources, actors, claims, timeline, and draft posture before PRAXIS writes."
        primaryAction={{ label: 'Open Memo Studio', href: '/app/write', icon: FileText }}
        secondaryAction={{ label: 'Change context', href: '/app/contexts', icon: Target }}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
        <ContextGraphPreview
          title={situation?.name ?? 'Active context structure'}
          summary={`Working as ${activeUserCore.identity}. ${sourceCount} source/document items, ${actorCount} actors, context health ${health.score}/100.`}
          stats={[
            { label: 'User Core', value: '1' },
            { label: 'Situation Core', value: situation ? '1' : '0' },
            { label: 'Sources', value: String(sourceCount) },
            { label: 'Actors', value: String(actorCount) },
            { label: 'Drafts', value: '1' },
          ]}
        />
        <section className="relative min-h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="context-canvas-layout">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Saved layout</p>
              <h2 className="text-sm font-semibold text-navy-950">Drag nodes into a review shape.</h2>
            </div>
            <p className="text-xs text-slate-600">{stackHydrated && Object.keys(layout).length ? 'Layout saved in active stack' : 'Default layout'}</p>
          </div>
          <div className="relative h-[480px] rounded-md border border-slate-100 bg-slate-50">
            {canvasNodes.map((node) => (
              <DraggableCanvasNode
                key={node.id}
                node={node}
                position={layout[node.id] ?? { x: node.x, y: node.y }}
                onCommit={(position) => saveNodePosition(node.id, position)}
              />
            ))}
          </div>
        </section>
        </div>

        <aside className="space-y-4">
          <ContextCapsulePreview
            userLabel={activeUserCore.identity}
            situationLabel={situation?.name ?? 'No Situation Core'}
            sourceCount={situation?.sourceUrls?.length ?? 0}
            documentCount={situation?.documentCount ?? 0}
            graphState={`${actorCount} actors · ${timelineNodes.length} events`}
            timeHorizon={situation?.latestEventDate ?? situation?.conflictOnsetDate ?? 'Set in Situation Core'}
            outputGoal={stack.outputGoal ?? 'Memo Goal'}
            healthScore={health.score}
            href="/app/contexts"
            compact
          />
          <CanvasNode label="User Core" title={activeUserCore.identity} href="/app/cores/user" icon={Brain} />
          <CanvasNode label="Situation Core" title={situation?.name ?? 'No situation selected'} href={situation ? `/app/workbench/${situation.id}` : '/app/contexts'} icon={Target} />
          <CanvasNode label="Sources" title={`${sourceCount} evidence items`} href={situation ? `/app/workbench/${situation.id}?tab=library` : '/app/contexts'} icon={LibraryBig} />
          <CanvasNode label="Memo" title="Draft from active context" href="/app/write" icon={FileText} />
          <div className="rounded-lg border border-slate-200 bg-white p-4" data-testid="context-canvas-gaps">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Saved evidence gaps</p>
            <div className="mt-3 space-y-2">
              {(savedGaps.length ? savedGaps : [{
                id: 'empty-gap',
                claim: 'No saved gaps yet.',
                status: 'weak' as const,
                sourceHints: ['Save unsupported claims from Memo Studio.'],
              }]).map((gap) => (
                <div key={gap.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-crimson">{gap.status.replaceAll('_', ' ')}</p>
                  <p className="mt-1 line-clamp-3 text-xs font-semibold text-navy-950">{gap.claim}</p>
                  {gap.sourceHints.length ? <p className="mt-1 truncate text-[11px] text-slate-600">Hints: {gap.sourceHints.join(', ')}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href="/app/assistant" className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-navy-700">Ask about this</Link>
                    <Link href="/app/write" className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-navy-700">Add to memo</Link>
                    {gap.id !== 'empty-gap' ? (
                      <button
                        type="button"
                        onClick={() => markGapResolved(gap.id)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-navy-700"
                      >
                        Mark resolved
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4" data-testid="context-canvas-nodes">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Structure nodes</p>
            <div className="mt-3 space-y-3">
              <NodeGroup title="Actors" items={(situation?.actors ?? []).slice(0, 6).map((actor) => ({ id: `actor:${actor}`, title: actor, detail: 'stakeholder' }))} />
              <NodeGroup title="Sources" items={sourceTitles.slice(0, 5).map((title, index) => ({ id: `source:${index}`, title, detail: 'source receipt' }))} />
              <NodeGroup title="Claims" items={claimNodes} />
              <NodeGroup title="Timeline" items={timelineNodes} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Work on this</p>
            <div className="mt-3 grid gap-2">
              {health.nextActions.map((action) => (
                <Link key={action.id} href={action.href} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-white">
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function NodeGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; title: string; detail: string }>;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-navy-900">{title}</p>
      <div className="mt-1 space-y-1">
        {(items.length ? items : [{ id: `${title}:empty`, title: 'No nodes yet', detail: 'Add to active context' }]).map((item) => (
          <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
            <p className="truncate text-xs font-semibold text-navy-950">{item.title}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-[11px] text-slate-600">{item.detail}</p>
              <WorkOnThisMenu itemLabel={item.title} contextHref="/app/dashboard" draftHref="/app/write" sourcesHref="/app/contexts" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DraggableCanvasNode({
  node,
  position,
  onCommit,
}: {
  node: { id: string; label: string; title: string; href: string };
  position: { x: number; y: number };
  onCommit: (position: { x: number; y: number }) => void;
}) {
  const [draft, setDraft] = useState(position);
  const [dragStart, setDragStart] = useState<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDraft(position), 0);
    return () => window.clearTimeout(handle);
  }, [position]);

  return (
    <div
      className="absolute w-[220px] cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
      style={{ transform: `translate(${draft.x}px, ${draft.y}px)` }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragStart({ pointerX: event.clientX, pointerY: event.clientY, x: draft.x, y: draft.y });
      }}
      onPointerMove={(event) => {
        if (!dragStart) return;
        setDraft({
          x: Math.max(0, Math.min(760, dragStart.x + event.clientX - dragStart.pointerX)),
          y: Math.max(0, Math.min(390, dragStart.y + event.clientY - dragStart.pointerY)),
        });
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        setDragStart(null);
        onCommit(draft);
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{node.label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-navy-950">{node.title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Link href="/app/assistant" className="rounded border border-slate-200 px-1.5 py-1 text-[10px] font-semibold text-navy-700">Ask</Link>
        <Link href={node.href} className="rounded border border-slate-200 px-1.5 py-1 text-[10px] font-semibold text-navy-700">Add context</Link>
        <Link href="/app/write" className="rounded border border-slate-200 px-1.5 py-1 text-[10px] font-semibold text-navy-700">Memo</Link>
        <Link href="/app/write" aria-label={`Mark ${node.title} as gap`} className="rounded border border-crimson/20 px-1.5 py-1 text-crimson"><ShieldAlert className="h-3 w-3" /></Link>
      </div>
    </div>
  );
}

function CanvasNode({
  label,
  title,
  href,
  icon: Icon,
}: {
  label: string;
  title: string;
  href: string;
  icon: typeof Brain;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-diplomatic-blue" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      </div>
      <h2 className="mt-2 text-sm font-semibold text-navy-950">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/app/assistant" className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-navy-800 hover:bg-white">
          Ask about this
        </Link>
        <Link href={href} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-navy-800 hover:bg-white">
          Open
        </Link>
        <Link href="/app/write" className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-navy-800 hover:bg-white">
          Add to memo
        </Link>
        <WorkOnThisMenu itemLabel={title} contextHref="/app/dashboard" sourcesHref={href} />
      </div>
    </div>
  );
}
