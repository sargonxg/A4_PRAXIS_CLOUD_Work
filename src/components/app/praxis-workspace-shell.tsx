'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderKanban,
  LibraryBig,
  MessageSquareText,
  Plus,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AskBar } from '@/components/ask/AskBar';
import { WorkOnThisMenu } from '@/components/app/work-on-this-menu';
import { ContextCapsulePreview } from '@/components/context/context-capsule-preview';
import { ContextQualityMeter } from '@/components/context/context-quality-meter';
import { OneClickContextBuilder } from '@/components/context/one-click-context-builder';
import { getNextMoves } from '@/lib/assistant/next-moves';
import type { WorkspaceNextMove, WorkspaceNextMoveStatus } from '@/lib/dashboard/next-moves';
import { buildContextHealthReport, type ContextHealthReport } from '@/lib/context/context-health';
import { cn } from '@/lib/utils/cn';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import type { UserModelRecord } from '@/lib/user-models/types';
import { forkUserModel, getActiveUserModelId, listPrivateUserModels, setActiveUserModel } from '@/lib/users/api';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';

type ExampleCase = {
  id: string;
  name: string;
  region: string;
  summary: string;
  risk: number;
  glaslStage: number;
  tags: string[];
};

type CoreFocus = 'summary' | 'cores' | 'sources' | 'draft';

interface PraxisWorkspaceShellProps {
  exampleCases: ExampleCase[];
  marketplaceToolCount: number;
  caseId?: string;
  focusSection?: CoreFocus | null;
}

type WorkspaceCase =
  | {
      kind: 'user';
      id: string;
      name: string;
      region: string;
      summary: string;
      risk: number;
      glaslStage: number;
      actorCount: number;
      sourceCount: number;
      documentCount: number;
      tags: string[];
      situation: Situation;
    }
  | {
      kind: 'example';
      id: string;
      name: string;
      region: string;
      summary: string;
      risk: number;
      glaslStage: number;
      actorCount: number;
      sourceCount: number;
      documentCount: number;
      tags: string[];
      situation: ExampleCase;
    };

type ToolCard = {
  id: string;
  label: string;
  detail: string;
  href: string;
  emphasis: 'primary' | 'secondary' | 'subtle';
  status?: WorkspaceNextMoveStatus;
};

type ContextAdvantage = {
  label: string;
  value: string;
  detail: string;
  state: 'ready' | 'partial' | 'missing';
};

export function PraxisWorkspaceShell({ exampleCases, marketplaceToolCount, caseId, focusSection }: PraxisWorkspaceShellProps) {
  const [privateModels, setPrivateModels] = useState<UserModelRecord[]>([]);
  const [activeUserModelId, setActiveUserModelId] = useState('foreign-policy-analyst');
  const [draftText, setDraftText] = useState('');
  const [savedNextMoves, setSavedNextMoves] = useState<WorkspaceNextMove[] | null>(null);
  const [nextMovesSavedAt, setNextMovesSavedAt] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(caseId ?? null);
  const [stackHydrated, setStackHydrated] = useState(false);
  const [stackPersistedAt, setStackPersistedAt] = useState<string | null>(null);

  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);

  useEffect(() => {
    setPrivateModels(listPrivateUserModels(window.localStorage));
    setActiveUserModelId(getActiveUserModelId(window.localStorage));
  }, []);

  useEffect(() => {
    if (caseId) {
      setSelectedCaseId(caseId);
    }
  }, [caseId]);

  const allUserModels = useMemo(() => [...privateModels, ...PUBLIC_USER_MODELS], [privateModels]);
  const activeUserModel = allUserModels.find((model) => model.modelId === activeUserModelId) ?? PUBLIC_USER_MODELS[0];
  const workspaceCases = useMemo(() => buildWorkspaceCases(situations, exampleCases), [exampleCases, situations]);
  const selectedCase = useMemo(() => {
    if (selectedCaseId) {
      return workspaceCases.find((item) => item.id === selectedCaseId) ?? null;
    }
    if (activeSituation) {
      return workspaceCases.find((item) => item.id === activeSituation.id) ?? null;
    }
    return workspaceCases[0] ?? null;
  }, [activeSituation, selectedCaseId, workspaceCases]);
  const workspaceLens = useMemo(() => buildWorkspaceLens(activeUserModel, selectedCase, marketplaceToolCount), [activeUserModel, marketplaceToolCount, selectedCase]);
  const toolCards = useMemo(() => buildToolCards(selectedCase), [selectedCase]);
  const contextAdvantage = useMemo(() => buildContextAdvantage(activeUserModel, selectedCase), [activeUserModel, selectedCase]);
  const contextHealth = useMemo(() => buildContextHealthReport({
    hasUserCore: Boolean(activeUserModel),
    hasSituationCore: Boolean(selectedCase),
    sourceCount: selectedCase?.sourceCount ?? 0,
    documentCount: selectedCase?.documentCount ?? 0,
    actorCount: selectedCase?.actorCount ?? 0,
    hasTimeline: selectedCase?.kind === 'user'
      ? Boolean(selectedCase.situation.keyDates?.length || selectedCase.situation.latestEventDate || selectedCase.situation.conflictOnsetDate)
      : Boolean(selectedCase),
    evidenceGapCount: selectedCase ? Math.max(0, 3 - ((selectedCase.sourceCount ?? 0) + (selectedCase.documentCount ?? 0))) : 4,
    hasDraft: draftText.trim().length > 40,
    situationHref: selectedCase ? `/app/contexts?situationId=${selectedCase.id}` : '/app/contexts',
  }), [activeUserModel, draftText, selectedCase]);
  const displayedToolCards = (savedNextMoves?.length
    ? savedNextMoves.map(nextMoveToToolCard)
    : contextHealth.nextActions.map(nextActionToToolCard)).slice(0, 3);
  const capsuleTimeHorizon = selectedCase?.kind === 'user'
    ? selectedCase.situation.latestEventDate ?? selectedCase.situation.conflictOnsetDate ?? 'Set in Situation Core'
    : 'Set in Situation Core';

  useEffect(() => {
    if (caseId || stackHydrated || allUserModels.length === 0 || workspaceCases.length === 0) return;
    let cancelled = false;

    fetch('/api/workspace/context-stack')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.stack) return;
        const stack = payload.stack as { userModelId?: string | null; situationId?: string | null; updatedAt?: string };
        if (stack.userModelId && allUserModels.some((model) => model.modelId === stack.userModelId)) {
          setActiveUserModel(window.localStorage, stack.userModelId);
          setActiveUserModelId(stack.userModelId);
        }
        if (stack.situationId && workspaceCases.some((item) => item.id === stack.situationId)) {
          setSelectedCaseId(stack.situationId);
          const found = workspaceCases.find((item) => item.id === stack.situationId);
          if (found?.kind === 'user') setActiveSituation(stack.situationId);
        }
        setStackPersistedAt(payload.persisted ? stack.updatedAt ?? null : null);
      })
      .finally(() => {
        if (!cancelled) setStackHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [allUserModels, caseId, setActiveSituation, stackHydrated, workspaceCases]);

  useEffect(() => {
    setDraftText(buildDraftSeed(activeUserModel, selectedCase));
  }, [activeUserModel, selectedCase]);

  useEffect(() => {
    if (!selectedCase || selectedCase.kind !== 'user') {
      setSavedNextMoves(null);
      setNextMovesSavedAt(null);
      return;
    }

    const controller = new AbortController();
    const moves = toolCards.map((tool) => ({ ...tool, status: 'open' }));
    fetch('/api/workspace/next-moves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situationId: selectedCase.id,
        userModelId: activeUserModel.modelId,
        moves,
      }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.state?.moves) return;
        setSavedNextMoves(payload.state.moves);
        setNextMovesSavedAt(payload.state.updatedAt ?? null);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setSavedNextMoves(null);
        setNextMovesSavedAt(null);
      });

    return () => controller.abort();
  }, [activeUserModel.modelId, selectedCase, toolCards]);

  useEffect(() => {
    if (!selectedCase || selectedCase.kind !== 'user') return;

    const currentSituationId = selectedCase.id;
    const currentUserModelId = activeUserModel.modelId;

    async function refreshNextMoves() {
      const response = await fetch(`/api/workspace/next-moves?situationId=${encodeURIComponent(currentSituationId)}&userModelId=${encodeURIComponent(currentUserModelId)}`);
      const payload = response.ok ? await response.json().catch(() => null) : null;
      if (!payload?.state?.moves) return;
      setSavedNextMoves(payload.state.moves);
      setNextMovesSavedAt(payload.state.updatedAt ?? null);
    }

    function handleNextMovesUpdated(event: Event) {
      const detail = (event as CustomEvent<{ situationId?: string; userModelId?: string }>).detail;
      if (detail?.situationId !== currentSituationId || detail.userModelId !== currentUserModelId) return;
      void refreshNextMoves();
    }

    window.addEventListener('praxis-next-moves-updated', handleNextMovesUpdated);
    return () => window.removeEventListener('praxis-next-moves-updated', handleNextMovesUpdated);
  }, [activeUserModel.modelId, selectedCase]);

  useEffect(() => {
    if (!selectedCaseId && activeSituation?.id) {
      setSelectedCaseId(activeSituation.id);
    }
  }, [activeSituation?.id, selectedCaseId]);

  useEffect(() => {
    if (!stackHydrated || caseId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch('/api/workspace/context-stack', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stackId: 'default',
          userModelId: activeUserModel.modelId,
          situationId: selectedCase?.id ?? null,
          sourceIds: selectedCase?.kind === 'user' ? selectedCase.situation.sourceUrls ?? [] : [],
          documentIds: selectedCase?.kind === 'user' ? selectedCase.situation.initialDocumentIds ?? [] : [],
          outputGoal: workspaceLens.writingLabel,
        }),
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => {
          if (payload?.persisted && payload?.stack?.updatedAt) setStackPersistedAt(payload.stack.updatedAt);
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        });
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeUserModel.modelId, caseId, selectedCase, stackHydrated, workspaceLens.writingLabel]);

  useEffect(() => {
    const target = focusSection ?? null;
    if (!target) return;
    const node = document.getElementById(target);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusSection, selectedCase?.id]);

  function activateUserModel(modelId: string) {
    setActiveUserModel(window.localStorage, modelId);
    setActiveUserModelId(modelId);
  }

  function forkModel(modelId: string) {
    const forked = forkUserModel(window.localStorage, modelId);
    setPrivateModels(listPrivateUserModels(window.localStorage));
    setActiveUserModelId(forked.modelId);
  }

  function activateSituation(id: string) {
    setSelectedCaseId(id);
    const found = workspaceCases.find((item) => item.id === id);
    if (found?.kind === 'user') {
      setActiveSituation(id);
    } else {
      setActiveSituation(null);
    }
  }

  function updateNextMove(moveId: string, status: WorkspaceNextMoveStatus) {
    if (!selectedCase || selectedCase.kind !== 'user') return;
    setSavedNextMoves((current) => current?.map((move) => (move.id === moveId ? { ...move, status } : move)) ?? current);
    fetch('/api/workspace/next-moves', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situationId: selectedCase.id,
        userModelId: activeUserModel.modelId,
        moveId,
        status,
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.state?.moves) return;
        setSavedNextMoves(payload.state.moves);
        setNextMovesSavedAt(payload.state.updatedAt ?? null);
      })
      .catch(() => {
        setSavedNextMoves(null);
        setNextMovesSavedAt(null);
      });
  }

  function handleContextDrop(event: DragEndEvent) {
    if (!event.over || event.over.id !== 'active-context-stack') return;
    const id = String(event.active.id);
    if (id.startsWith('user:')) activateUserModel(id.replace('user:', ''));
    if (id.startsWith('situation:')) activateSituation(id.replace('situation:', ''));
    if (id === 'source-stack' && selectedCase) window.location.href = `/app/contexts?situationId=${selectedCase.id}`;
    if (id === 'output-stack') window.location.href = '/app/write';
  }

  const userLibrary = [...privateModels, ...PUBLIC_USER_MODELS];

  return (
    <main className="mx-auto flex max-w-[1520px] flex-col gap-6 px-4 pb-16 pt-4 sm:px-6 lg:px-8" data-testid="praxis-workspace-shell">
      <section id="ask-praxis" className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-navy-950/5 backdrop-blur">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Home</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">
                  {workspaceLens.pageTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                  {workspaceLens.pageCopy}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/app/assistant"
                  className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800"
                >
                  <MessageSquareText className="h-4 w-4" />
                  Ask from context
                </Link>
                <Link
                  href="/app/situations/new"
                  className="inline-flex items-center gap-2 rounded-md border border-gold-200 bg-white px-3 py-2 text-sm font-semibold text-gold-800 hover:bg-gold-50"
                >
                  <FolderKanban className="h-4 w-4" />
                  Create context
                </Link>
                <Link
                  href="/app/contexts"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
                >
                  <LibraryBig className="h-4 w-4" />
                  Add sources
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <CoreChip label="User Core" detail={activeUserModel.identity} href="/app/cores/user" tone="blue" />
              <CoreChip
                label="Situation Core"
                detail={selectedCase ? selectedCase.name : 'No situation selected'}
                href={selectedCase ? `/app/contexts?situationId=${selectedCase.id}` : '/app/contexts'}
                tone="gold"
              />
              <CoreChip label="Writing focus" detail={workspaceLens.writingLabel} href="#draft-workbench" tone="slate" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {contextAdvantage.map((item) => (
                <ContextAdvantageCard key={item.label} item={item} />
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <DndContext onDragEnd={handleContextDrop}>
                <ActiveContextStackPanel
                  activeUserModel={activeUserModel}
                  selectedCase={selectedCase}
                  contextHealth={contextHealth}
                  stackPersistedAt={stackPersistedAt}
                />
              </DndContext>

              <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Ask first</p>
                    <h2 className="mt-1 text-base font-semibold text-navy-950">Ask the question; PRAXIS keeps sources, stakes, and inherited judgment visible.</h2>
                  </div>
                  <MessageSquareText className="mt-0.5 h-5 w-5 text-diplomatic-blue" />
                </div>
                <div className="mt-4">
                  <AskBar activeContextName={selectedCase?.name ?? 'No situation selected'} hasContext={Boolean(selectedCase)} />
                </div>
              </div>
              <ContextQualityMeter report={contextHealth} />
              </div>
            </div>
          </div>

          <aside className="border-t border-navy-100 bg-navy-950 p-5 text-white xl:border-l xl:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Active context</p>
            <h2 className="mt-2 text-xl font-semibold">{workspaceLens.sidebarTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-navy-100">{workspaceLens.sidebarCopy}</p>

            <div className="mt-5 space-y-3">
              {workspaceLens.summaryStats.map((item) => (
                <StatusRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-white/8 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
              <p className="text-xs font-semibold uppercase text-navy-200">Advanced handover</p>
                  <h3 className="mt-1 text-base font-semibold text-white">{workspaceLens.inheritanceTitle}</h3>
                </div>
                <BookOpenText className="h-5 w-5 text-gold-300" />
              </div>
              <p className="mt-3 text-xs leading-5 text-navy-100">{workspaceLens.inheritanceCopy}</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="core-library" data-testid="core-library-panel" className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Core library</p>
              <h2 className="mt-1 text-xl font-semibold text-navy-950">ContextCapsule library.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/app/cores/user" className="inline-flex items-center gap-2 rounded-md border border-diplomatic-blue/25 bg-white px-3 py-2 text-sm font-semibold text-diplomatic-blue hover:bg-diplomatic-blue/5">
                <Plus className="h-4 w-4" />
                New user core
              </Link>
              <Link href="/app/situations/new" className="inline-flex items-center gap-2 rounded-md border border-gold-200 bg-white px-3 py-2 text-sm font-semibold text-gold-800 hover:bg-gold-50">
                <Plus className="h-4 w-4" />
                New situation core
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-navy-950">User posture</h3>
                <span className="text-xs text-slate-500">{userLibrary.length} available</span>
              </div>
              <div className="mt-3 space-y-2">
                {userLibrary.map((model) => (
                  <CoreLibraryCard
                    key={model.modelId}
                    title={model.identity}
                    subtitle={model.role}
                    meta={`${model.workOntologyId} · ${model.communicationStyle}`}
                    active={model.modelId === activeUserModelId}
                    onActivate={() => activateUserModel(model.modelId)}
                    onFork={model.visibility === 'public-seed' ? () => forkModel(model.modelId) : undefined}
                    manageHref="/app/cores/user"
                    actionLabel={model.visibility === 'public-seed' ? 'Fork' : 'Use'}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-navy-950">Specific contexts</h3>
                <span className="text-xs text-slate-500">{workspaceCases.length} available</span>
              </div>
              <div className="mt-3 space-y-2">
                {workspaceCases.map((item) => (
                  <SituationLibraryCard
                    key={item.id}
                    title={item.name}
                    subtitle={item.region}
                    meta={`${item.actorCount} actors · ${item.sourceCount + item.documentCount} evidence items`}
                    active={selectedCase?.id === item.id}
                    kind={item.kind}
                    href={`/app/contexts?situationId=${item.id}`}
                    onActivate={() => activateSituation(item.id)}
                    copyHref={item.kind === 'example' ? `/api/situations/copy-from-demo?demoCaseId=${encodeURIComponent(item.id)}` : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Executive summary</p>
              <h2 className="mt-1 text-xl font-semibold text-navy-950">What matters now, in plain policy language.</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Risk" value={selectedCase ? String(selectedCase.risk) : '-'} detail={selectedCase ? selectedCase.region : 'No case'} />
            <MiniStat label="Actors" value={String(selectedCase?.actorCount ?? 0)} detail="Primary and secondary stakeholders" />
            <MiniStat label="Sources" value={String((selectedCase?.sourceCount ?? 0) + (selectedCase?.documentCount ?? 0))} detail="Receipts, documents, and notes" />
          </div>

          <div className="mt-4 grid gap-4">
            <SummaryBlock
              title="Main dynamics"
              body={workspaceLens.mainDynamics}
            />
            <SummaryBlock
              title="Actors and stakeholders"
              body={selectedCase ? buildActorStakeholderSummary(selectedCase, activeUserModel) : 'Select a situation to surface actors, institutions, leverage, and audiences.'}
            />
            <SummaryBlock
              title="Drafting focus"
              body={workspaceLens.draftingFocus}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <OneClickContextBuilder />
        <ContextCapsulePreview
          userLabel={activeUserModel.identity}
          situationLabel={selectedCase?.name ?? 'No Situation Core selected'}
          sourceCount={selectedCase?.sourceCount ?? 0}
          documentCount={selectedCase?.documentCount ?? 0}
          graphState={`${selectedCase?.actorCount ?? 0} actors · ${contextHealth.signals.find((item) => item.id === 'timeline')?.status ?? 'partial'} timeline`}
          timeHorizon={capsuleTimeHorizon}
          outputGoal={workspaceLens.writingLabel}
          healthScore={contextHealth.score}
          href="/app/contexts"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Next best actions</p>
              <h2 className="mt-1 text-xl font-semibold text-navy-950">Three suggestions from the active context, with the tool stack kept behind the workflow.</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {nextMovesSavedAt ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Saved workspace state
                </span>
              ) : null}
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {marketplaceToolCount} tools mapped
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {displayedToolCards.map((tool) => (
              <ToolCardView
                key={tool.id}
                tool={tool}
                onStatusChange={savedNextMoves?.length ? updateNextMove : undefined}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-center gap-3">
            <LibraryBig className="h-5 w-5 text-gold-800" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-800">Docs library</p>
              <h2 className="text-lg font-semibold text-navy-950">The writing surface should stay evidence-first.</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-800">
            <DocRow label="Source posture" value={`${selectedCase?.sourceCount ?? 0} receipts`} />
            <DocRow label="Document posture" value={`${selectedCase?.documentCount ?? 0} docs`} />
            <DocRow label="Open questions" value={workspaceLens.openQuestions} />
            <DocRow label="Memo mode" value={workspaceLens.writingLabel} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="#draft-workbench" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              Open drafting workbench
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/app/tools" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50">
              Manage tools
            </Link>
          </div>
        </div>
      </section>

      <section id="draft-workbench" data-testid="draft-workbench-panel" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Drafting workbench</p>
              <h2 className="mt-1 text-xl font-semibold text-navy-950">Write the brief, memo, or working note here.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={selectedCase ? `/app/write?situationId=${selectedCase.id}` : '/app/write'} className="inline-flex items-center gap-2 rounded-md border border-diplomatic-blue/25 bg-white px-3 py-2 text-sm font-semibold text-diplomatic-blue hover:bg-diplomatic-blue/5">
                Open memo route
              </Link>
              <Link href="/app/tools" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50">
                Open tool library
              </Link>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Draft text</span>
            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={12}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-navy-400"
            />
          </label>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                <FileText className="h-3.5 w-3.5" />
                Keep the memo reviewable
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Ask PRAXIS can revise this draft
              </span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-gold-700 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-600"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('open-praxis-chat', {
                    detail: {
                      prompt: draftText || buildDraftSeed(activeUserModel, selectedCase),
                    },
                  }),
                );
              }}
            >
              Send to Ask PRAXIS
              <MessageSquareText className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Executive write-up</p>
              <h3 className="mt-1 text-lg font-semibold text-navy-950">What to write next</h3>
            </div>
            <Wrench className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-4 space-y-3">
            {workspaceLens.writingChecklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs leading-5 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current memo shape</p>
            <p className="mt-2 text-sm leading-6 text-navy-950">{workspaceLens.memoShape}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ActiveContextStackPanel({
  activeUserModel,
  selectedCase,
  contextHealth,
  stackPersistedAt,
}: {
  activeUserModel: UserModelRecord;
  selectedCase: WorkspaceCase | null;
  contextHealth: ContextHealthReport;
  stackPersistedAt: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: 'active-context-stack' });
  const evidenceCount = (selectedCase?.sourceCount ?? 0) + (selectedCase?.documentCount ?? 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Active Context Stack</p>
          <h2 className="mt-1 text-base font-semibold text-navy-950">Drag cores, sources, and an output goal into the working stack.</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            PRAXIS will ask, search, and draft as this user, on this situation, with this evidence posture.
          </p>
        </div>
        <div className="rounded-md border border-navy-200 bg-white px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Context</p>
          <p className="text-lg font-semibold text-navy-950">{contextHealth.score}/100</p>
          <p className="text-[11px] text-slate-600">{stackPersistedAt ? 'Saved to workspace' : contextHealth.label}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2">
          <DraggableStackItem id={`user:${activeUserModel.modelId}`} label="User Core" title={activeUserModel.identity} />
          {selectedCase ? <DraggableStackItem id={`situation:${selectedCase.id}`} label="Situation Core" title={selectedCase.name} /> : null}
          <DraggableStackItem id="source-stack" label="Sources" title={`${evidenceCount} receipts/docs`} />
          <DraggableStackItem id="output-stack" label="Output Goal" title="Options memo" />
        </div>

        <div
          ref={setNodeRef}
          className={cn(
            'min-h-[210px] rounded-lg border border-dashed p-3 transition',
            isOver ? 'border-gold-500 bg-gold-50' : 'border-slate-300 bg-white',
          )}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <StackSlot label="Working as" value={activeUserModel.identity} detail={activeUserModel.role} />
            <StackSlot label="Working on" value={selectedCase?.name ?? 'No Situation Core selected'} detail={selectedCase?.region ?? 'Select or fork a situation'} muted={!selectedCase} />
            <StackSlot label="Using" value={`${evidenceCount} evidence items`} detail={`${selectedCase?.actorCount ?? 0} actors, ${contextHealth.signals.find((item) => item.id === 'timeline')?.status ?? 'partial'} timeline`} muted={evidenceCount === 0} />
            <StackSlot label="Best next move" value={contextHealth.nextActions[0]?.label ?? 'Ask PRAXIS'} detail={contextHealth.nextActions[0]?.detail ?? 'Reason with the current stack'} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {contextHealth.nextActions.map((action) => (
              <Link key={action.id} href={action.href} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-navy-800 hover:border-diplomatic-blue/40 hover:bg-white">
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableStackItem({ id, label, title }: { id: string; label: string; title: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      className={cn(
        'w-full cursor-grab rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition active:cursor-grabbing',
        isDragging ? 'opacity-70 shadow-lg' : 'hover:border-gold-300',
      )}
      {...listeners}
      {...attributes}
    >
      <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="mt-1 block truncate text-sm font-semibold text-navy-950">{title}</span>
    </button>
  );
}

function StackSlot({ label, value, detail, muted = false }: { label: string; value: string; detail: string; muted?: boolean }) {
  return (
    <div className={cn('rounded-md border p-3', muted ? 'border-slate-200 bg-slate-50' : 'border-navy-100 bg-white')}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={cn('mt-1 truncate text-sm font-semibold', muted ? 'text-slate-600' : 'text-navy-950')}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function nextMoveToToolCard(move: WorkspaceNextMove): ToolCard {
  return {
    id: move.id,
    label: move.label,
    detail: move.detail,
    href: move.href,
    emphasis: move.emphasis,
    status: move.status,
  };
}

function nextActionToToolCard(action: ContextHealthReport['nextActions'][number]): ToolCard {
  return {
    id: action.id,
    label: action.label,
    detail: action.detail,
    href: action.href,
    emphasis: action.priority === 'primary' ? 'primary' : action.priority === 'secondary' ? 'secondary' : 'subtle',
  };
}

function buildWorkspaceCases(situations: Situation[], exampleCases: ExampleCase[]): WorkspaceCase[] {
  const userCases: WorkspaceCase[] = situations.map((situation) => ({
    kind: 'user',
    id: situation.id,
    name: situation.name,
    region: situation.region,
    summary: situation.description,
    risk: normalizeRisk(situation.riskScore),
    glaslStage: situation.glaslStage ?? 0,
    actorCount: situation.actors?.length ?? situation.actorCount ?? 0,
    sourceCount: situation.sourceUrls?.length ?? 0,
    documentCount: situation.documentCount ?? 0,
    tags: situation.tags ?? [],
    situation,
  }));

  const exampleEntries: WorkspaceCase[] = exampleCases.map((example) => ({
    kind: 'example',
    id: example.id,
    name: example.name,
    region: example.region,
    summary: example.summary,
    risk: example.risk,
    glaslStage: example.glaslStage,
    actorCount: example.tags.length + 1,
    sourceCount: example.tags.length,
    documentCount: 0,
    tags: example.tags,
    situation: example,
  }));

  return [...userCases, ...exampleEntries];
}

function buildWorkspaceLens(userModel: UserModelRecord, selectedCase: WorkspaceCase | null, marketplaceToolCount: number) {
  const writingLabel = userModel.workOntologyId === 'corporate-strategic-analysis'
    ? 'Board brief'
    : userModel.workOntologyId === 'domestic-policy-analysis'
      ? 'Policy memo'
      : 'Analysis memo';

  const memoShape = userModel.workOntologyId === 'corporate-strategic-analysis'
    ? 'Lead with risk, stakeholder posture, and decision-ready recommendations. Use short sections and a plain executive voice.'
    : userModel.workOntologyId === 'domestic-policy-analysis'
      ? 'Lead with the question, map the policy tradeoffs, and keep the recommendation tight enough for a staffer or principal.'
      : 'Lead with the situation, actors, sources, and policy options. Keep caveats visible and evidence first.';

  const pageTitle = 'Choose context. Ask PRAXIS.';

  const pageCopy = selectedCase
    ? `Active context: ${selectedCase.name}. PRAXIS will answer as ${userModel.identity} with the attached sources, graph posture, and memo target.`
    : `Create or choose a context, attach sources, then ask from the active core stack.`;

  const sidebarTitle = selectedCase
    ? `${selectedCase.region} · ${selectedCase.risk} risk`
    : 'No case selected';

  const sidebarCopy = selectedCase
    ? `Selected case posture: ${selectedCase.actorCount} actors, ${selectedCase.sourceCount + selectedCase.documentCount} evidence items, and ${selectedCase.glaslStage || 'no'} Glasl stage marker.`
    : 'Choose a Situation Core to populate the executive summary and writing surface.';

  const summaryStats = [
    { label: 'Model', value: userModel.identity, icon: Star },
    { label: 'Tool map', value: String(marketplaceToolCount), icon: Wrench },
    { label: 'Writing mode', value: writingLabel, icon: FileText },
  ] as const;

  const openQuestions = selectedCase
    ? selectedCase.kind === 'user'
      ? `${selectedCase.situation.sourceUrls?.length ? 'Review the current source receipts and ask what still needs corroboration.' : 'Add source receipts and define what evidence would change the memo.'}`
      : 'Use the example as a prompt, then replace it with a managed Situation Core when the work becomes real.'
    : 'Attach a Situation Core to surface the evidence gaps the memo should answer first.';

  const mainDynamics = selectedCase
    ? buildDynamics(selectedCase, userModel)
    : 'The workspace is waiting on a selected situation. Once attached, PRAXIS can summarize the actors, evidence, and policy movement in one view.';

  const draftingFocus = selectedCase
    ? `${writingLabel}: shape the output around ${selectedCase.name}, its actors, the source posture, and the recommendation path.`
    : `${writingLabel}: start from the user core, then attach a situation to draft against a concrete policy question.`;

  const inheritanceTitle = selectedCase
    ? `${selectedCase.name} can be handed over`
    : 'Attach a context to inherit the work';

  const inheritanceCopy = selectedCase
    ? `PRAXIS keeps the role, case frame, source posture, stakeholders, open questions, and draft target together so the next analyst can understand why the memo says what it says.`
    : 'Once a Situation Core is attached, PRAXIS can preserve the reasoning trail, source gaps, and next moves instead of leaving them in a chat transcript.';

  const writingChecklist = selectedCase
    ? [
        'Open with the answer, then list the actors and stakes that drive it.',
        'Name the strongest sources and any evidence gaps that still matter.',
        'Keep the recommendation short enough to brief, but detailed enough to edit.',
        'Use the attached cores to keep the output on one policy question.',
      ]
    : [
        'Select a Situation Core before drafting so the memo has a real case frame.',
        'Keep the summary short and the evidence gaps explicit.',
        'Use PRAXIS to turn source review into a revision pass.',
      ];

  return {
    pageTitle,
    pageCopy,
    sidebarTitle,
    sidebarCopy,
    inheritanceTitle,
    inheritanceCopy,
    writingLabel,
    mainDynamics,
    draftingFocus,
    openQuestions,
    writingChecklist,
    memoShape,
    summaryStats,
  };
}

function buildContextAdvantage(userModel: UserModelRecord, selectedCase: WorkspaceCase | null): ContextAdvantage[] {
  const evidenceCount = (selectedCase?.sourceCount ?? 0) + (selectedCase?.documentCount ?? 0);
  const actorCount = selectedCase?.actorCount ?? 0;
  const hasSituation = Boolean(selectedCase);

  return [
    {
      label: 'Vetted context',
      value: evidenceCount > 0 ? `${evidenceCount} evidence items` : 'Needs receipts',
      detail: evidenceCount > 0 ? 'Sources and documents are visible before PRAXIS drafts.' : 'Add source receipts so answers do not rely on generic memory.',
      state: evidenceCount >= 4 ? 'ready' : evidenceCount > 0 ? 'partial' : 'missing',
    },
    {
      label: 'Stakeholder read',
      value: actorCount > 0 ? `${actorCount} actors` : 'No actors yet',
      detail: actorCount > 0 ? 'Policy judgment stays tied to who can move, block, or absorb the decision.' : 'Name actors before asking for strategy or a memo.',
      state: actorCount >= 3 ? 'ready' : actorCount > 0 ? 'partial' : 'missing',
    },
    {
      label: 'User judgment',
      value: userModel.identity,
      detail: `Answers inherit ${userModel.role}, voice, audience, and tolerance for uncertainty.`,
      state: 'ready',
    },
    {
      label: 'Handover value',
      value: hasSituation ? 'Inheritable' : 'Waiting',
      detail: hasSituation ? 'The next analyst can see context, gaps, next moves, and draft posture.' : 'Attach a Situation Core to turn the work into institutional memory.',
      state: hasSituation ? 'ready' : 'missing',
    },
  ];
}

function buildToolCards(selectedCase: WorkspaceCase | null): ToolCard[] {
  return getNextMoves({
    situation: selectedCase?.kind === 'user' ? selectedCase.situation : null,
    situationStage: selectedCase?.tags.join(' ') ?? 'intake',
  }).map((move, index) => ({
    id: move.id,
    label: move.label,
    detail: move.detail,
    href: move.href,
    emphasis: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'subtle',
  }));
}

function buildActorStakeholderSummary(selectedCase: WorkspaceCase, userModel: UserModelRecord): string {
  const actors = selectedCase.kind === 'user'
    ? selectedCase.situation.actors.slice(0, 5)
    : selectedCase.tags.slice(0, 5);

  const audience = userModel.audienceDefaults.slice(0, 3).join(', ');
  const actorText = actors.length ? actors.join(', ') : 'no named actors yet';

  return `Primary actors: ${actorText}. The likely audience is ${audience || 'a policy reader'}. Frame the stakeholder map around who can move the case, who can block it, and who needs the output to make a decision.`;
}

function buildDraftSeed(userModel: UserModelRecord, selectedCase: WorkspaceCase | null): string {
  const title = selectedCase ? selectedCase.name : 'Selected situation';
  const memoLabel = userModel.workOntologyId === 'corporate-strategic-analysis' ? 'board brief' : userModel.workOntologyId === 'domestic-policy-analysis' ? 'policy memo' : 'analysis memo';

  return [
    `${title} - ${memoLabel}`,
    '',
    'Executive summary:',
    '-',
    '',
    'Actors and stakeholders:',
    '-',
    '',
    'Evidence and source posture:',
    '-',
    '',
    'Recommendation:',
    '-',
    '',
    'Open questions:',
    '-',
  ].join('\n');
}

function buildDynamics(selectedCase: WorkspaceCase, userModel: UserModelRecord): string {
  const riskLine = selectedCase.risk >= 7 ? 'high risk' : selectedCase.risk >= 4 ? 'moderate risk' : 'low risk';
  const actorLine = selectedCase.actorCount >= 5 ? 'many moving stakeholders' : selectedCase.actorCount >= 3 ? 'several stakeholders' : 'a small actor set';
  const sourceLine = selectedCase.sourceCount + selectedCase.documentCount > 4 ? 'enough evidence to draft carefully' : 'not enough evidence to draft decisively';
  const domainLine = userModel.workOntologyId === 'corporate-strategic-analysis'
    ? 'board and regulatory posture'
    : userModel.workOntologyId === 'domestic-policy-analysis'
      ? 'policy and implementation posture'
      : 'foreign-policy and institutional posture';

  return `This is a ${riskLine} case with ${actorLine}. The current file looks like ${sourceLine}, so the memo should stay anchored in ${domainLine} and make the uncertainty visible before recommendations harden.`;
}

function normalizeRisk(riskScore: number): number {
  if (!Number.isFinite(riskScore)) return 0;
  return riskScore <= 1 ? Math.round(riskScore * 10) : Math.round(riskScore);
}

function ContextAdvantageCard({ item }: { item: ContextAdvantage }) {
  const stateClass = item.state === 'ready'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : item.state === 'partial'
      ? 'border-gold-200 bg-gold-50 text-gold-800'
      : 'border-slate-200 bg-slate-50 text-slate-600';
  const dotClass = item.state === 'ready'
    ? 'bg-emerald-500'
    : item.state === 'partial'
      ? 'bg-gold-500'
      : 'bg-slate-400';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-navy-950/5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', stateClass)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
          {item.state === 'ready' ? 'ready' : item.state}
        </span>
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-navy-950">{item.value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
    </div>
  );
}

function CoreChip({ label, detail, href, tone }: { label: string; detail: string; href: string; tone: 'blue' | 'gold' | 'slate' }) {
  const toneClass = tone === 'blue'
    ? 'border-diplomatic-blue/25 bg-diplomatic-blue/5 text-diplomatic-blue'
    : tone === 'gold'
      ? 'border-gold-200 bg-gold-50 text-gold-800'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <Link href={href} className={cn('inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold', toneClass)}>
      <span className="uppercase tracking-[0.16em]">{label}</span>
      <span className="max-w-[18rem] truncate font-normal normal-case tracking-normal">{detail}</span>
    </Link>
  );
}

function CoreLibraryCard({
  title,
  subtitle,
  meta,
  active,
  onActivate,
  onFork,
  manageHref,
  actionLabel,
}: {
  title: string;
  subtitle: string;
  meta: string;
  active: boolean;
  onActivate: () => void;
  onFork?: () => void;
  manageHref: string;
  actionLabel: string;
}) {
  return (
    <div className={cn('rounded-lg border p-3', active ? 'border-navy-200 bg-white' : 'border-slate-200 bg-white')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-700">{subtitle}</p>
        </div>
        {active ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">Active</span> : null}
      </div>
      <p className="mt-2 text-xs text-slate-500">{meta}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onActivate} className="inline-flex items-center gap-1 rounded-md bg-navy-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
          {actionLabel}
        </button>
        {onFork ? (
          <button type="button" onClick={onFork} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
            Fork
          </button>
        ) : null}
        <WorkOnThisMenu itemLabel={title} contextHref="/app/dashboard" draftHref="/app/write" />
        <Link href={manageHref} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
          Manage
        </Link>
      </div>
    </div>
  );
}

function SituationLibraryCard({
  title,
  subtitle,
  meta,
  active,
  kind,
  href,
  onActivate,
  copyHref,
}: {
  title: string;
  subtitle: string;
  meta: string;
  active: boolean;
  kind: 'user' | 'example';
  href: string;
  onActivate: () => void;
  copyHref?: string;
}) {
  return (
    <div className={cn('rounded-lg border p-3', active ? 'border-gold-200 bg-white' : 'border-slate-200 bg-white')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{kind === 'user' ? 'User situation' : 'Example situation'}</p>
          <p className="mt-1 text-sm font-semibold text-navy-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-700">{subtitle}</p>
        </div>
        {active ? <span className="rounded-full bg-gold-50 px-2 py-1 text-[10px] font-semibold text-gold-800">Selected</span> : null}
      </div>
      <p className="mt-2 text-xs text-slate-500">{meta}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onActivate} className="inline-flex items-center gap-1 rounded-md bg-navy-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
          Use
        </button>
        <Link href={href} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
          Open
        </Link>
        {copyHref ? (
          <Link href={copyHref} className="inline-flex items-center gap-1 rounded-md border border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs font-semibold text-gold-900 hover:bg-gold-100">
            Copy to workspace
          </Link>
        ) : null}
        <WorkOnThisMenu itemLabel={title} contextHref="/app/dashboard" sourcesHref={href} draftHref="/app/write" />
      </div>
    </div>
  );
}

function ToolCardView({
  tool,
  onStatusChange,
}: {
  tool: ToolCard;
  onStatusChange?: (moveId: string, status: WorkspaceNextMoveStatus) => void;
}) {
  const emphasisClass = tool.emphasis === 'primary'
    ? 'border-diplomatic-blue/25 bg-diplomatic-blue/5'
    : tool.emphasis === 'secondary'
      ? 'border-slate-200 bg-slate-50'
      : 'border-slate-200 bg-white';
  const isClosed = tool.status === 'done' || tool.status === 'dismissed';

  return (
    <div className={cn('group rounded-xl border p-4 transition hover:-translate-y-0.5 hover:border-navy-300 hover:bg-white', emphasisClass, isClosed && 'opacity-60')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-700 ring-1 ring-slate-200">
          <Wrench className="h-4 w-4" />
        </div>
        <span className={cn(
          'rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
          tool.status === 'done'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : tool.status === 'dismissed'
              ? 'border-slate-200 bg-slate-100 text-slate-500'
              : 'border-slate-200 bg-white text-slate-600',
        )}>
          {tool.status === 'done' ? 'Done' : tool.status === 'dismissed' ? 'Dismissed' : 'Open'}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-navy-950">{tool.label}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-700">{tool.detail}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={tool.href} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
          Open
        </Link>
        <WorkOnThisMenu itemLabel={tool.label} contextHref="/app/dashboard" draftHref="/app/write" sourcesHref={tool.href} risksHref={tool.href} />
        {onStatusChange && tool.status !== 'done' ? (
          <button type="button" onClick={() => onStatusChange(tool.id, 'done')} className="rounded-md bg-navy-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
            Done
          </button>
        ) : null}
        {onStatusChange && tool.status !== 'dismissed' ? (
          <button type="button" onClick={() => onStatusChange(tool.id, 'dismissed')} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SummaryBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{body}</p>
    </div>
  );
}

function MiniStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-navy-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-700">{detail}</p>
    </div>
  );
}

function DocRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gold-200 bg-white px-3 py-2">
      <span className="text-xs font-semibold text-navy-900">{label}</span>
      <span className="text-xs text-slate-700">{value}</span>
    </div>
  );
}

function StatusRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/8 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-gold-300" />
        <span className="truncate text-sm text-navy-100">{label}</span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-white">{value}</span>
    </div>
  );
}
