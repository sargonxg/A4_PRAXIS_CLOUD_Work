'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenText,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  GitBranch,
  History,
  Layers3,
  LibraryBig,
  Network,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { AskStreamPanel } from '@/components/ask/AskStreamPanel';
import { AppPageHeader } from '@/components/app/app-page-header';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { getNextMoves } from '@/lib/assistant/next-moves';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import type { UserModelRecord } from '@/lib/user-models/types';
import { getActiveUserModelId, listPrivateUserModels, setActiveUserModel } from '@/lib/users/api';
import { cn } from '@/lib/utils/cn';
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

interface AskWorkspacePageProps {
  exampleCases: ExampleCase[];
  marketplaceToolCount: number;
}

type WorkspaceCase =
  | {
      kind: 'user';
      id: string;
      name: string;
      region: string;
      summary: string;
      risk: number;
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
      actorCount: number;
      sourceCount: number;
      documentCount: number;
      tags: string[];
      situation: ExampleCase;
    };

type CoreBrick = {
  id: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  version: string;
  ready: boolean;
  locked: boolean;
  optional?: boolean;
  icon: typeof Users;
};

export function AskWorkspacePage({ exampleCases, marketplaceToolCount }: AskWorkspacePageProps) {
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);

  const [privateModels, setPrivateModels] = useState<UserModelRecord[]>([]);
  const [activeUserModelId, setActiveUserModelId] = useState('foreign-policy-analyst');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(true);
  const { stack, hydrated: stackHydrated, saveStack } = useActiveContextStack();

  useEffect(() => {
    setPrivateModels(listPrivateUserModels(window.localStorage));
    setActiveUserModelId(getActiveUserModelId(window.localStorage));
  }, []);

  const availableModels = useMemo(() => [...privateModels, ...PUBLIC_USER_MODELS], [privateModels]);
  const activeUserModel = availableModels.find((model) => model.modelId === activeUserModelId) ?? PUBLIC_USER_MODELS[0];
  const workspaceCases = useMemo(() => buildWorkspaceCases(situations, exampleCases), [exampleCases, situations]);

  useEffect(() => {
    if (selectedCaseId) return;
    if (stackHydrated && stack.situationId) {
      setSelectedCaseId(stack.situationId);
      return;
    }
    if (activeSituation?.id) {
      setSelectedCaseId(activeSituation.id);
      return;
    }
    if (workspaceCases[0]) setSelectedCaseId(workspaceCases[0].id);
  }, [activeSituation?.id, selectedCaseId, stack.situationId, stackHydrated, workspaceCases]);

  useEffect(() => {
    if (!stackHydrated) return;
    if (stack.userModelId && availableModels.some((model) => model.modelId === stack.userModelId)) {
      setActiveUserModel(window.localStorage, stack.userModelId);
      setActiveUserModelId(stack.userModelId);
    }
    if (stack.situationId && workspaceCases.some((item) => item.id === stack.situationId)) {
      const found = workspaceCases.find((item) => item.id === stack.situationId);
      setSelectedCaseId(stack.situationId);
      if (found?.kind === 'user') setActiveSituation(stack.situationId);
    }
  }, [availableModels, setActiveSituation, stack.situationId, stack.userModelId, stackHydrated, workspaceCases]);

  const selectedCase = useMemo(() => {
    if (selectedCaseId) return workspaceCases.find((item) => item.id === selectedCaseId) ?? null;
    return activeSituation ? workspaceCases.find((item) => item.id === activeSituation.id) ?? null : workspaceCases[0] ?? null;
  }, [activeSituation, selectedCaseId, workspaceCases]);

  const evidenceCount = (selectedCase?.sourceCount ?? 0) + (selectedCase?.documentCount ?? 0);
  const capsuleTimeHorizon = selectedCase?.kind === 'user'
    ? selectedCase.situation.latestEventDate ?? selectedCase.situation.conflictOnsetDate ?? 'Set horizon'
    : 'Set horizon';
  const contextHealth = buildContextHealthReport({
    hasUserCore: Boolean(activeUserModel),
    hasSituationCore: Boolean(selectedCase),
    sourceCount: selectedCase?.sourceCount ?? 0,
    documentCount: selectedCase?.documentCount ?? 0,
    actorCount: selectedCase?.actorCount ?? 0,
    hasTimeline: selectedCase?.kind === 'user'
      ? Boolean(selectedCase.situation.keyDates?.length || selectedCase.situation.latestEventDate || selectedCase.situation.conflictOnsetDate)
      : Boolean(selectedCase),
    evidenceGapCount: selectedCase ? Math.max(0, 3 - evidenceCount) : 4,
    hasDraft: Boolean(stack.outputGoal),
    situationHref: selectedCase ? `/app/workbench/${selectedCase.id}` : '/app/contexts',
  });
  const activeContextName = selectedCase?.name ?? 'No Situation Core';
  const bricks = buildCoreBricks({
    activeUserModel,
    selectedCase,
    evidenceCount,
    stack,
    capsuleTimeHorizon,
    healthScore: contextHealth.score,
  });
  const missingBricks = bricks.filter((brick) => !brick.ready);
  const nextMoves = getNextMoves({
    situation: selectedCase?.kind === 'user' ? selectedCase.situation : null,
    situationStage: selectedCase?.tags.join(' ') ?? 'intake',
  }).slice(0, 3);
  const headerLine = `${activeUserModel.identity} / ${activeContextName} / ${evidenceCount} sources and documents / ${stack.outputGoal ?? 'Memo goal'} / ${contextHealth.score}/100 health`;

  function handleUserModelChange(modelId: string) {
    setActiveUserModel(window.localStorage, modelId);
    setActiveUserModelId(modelId);
    void saveStack({ userModelId: modelId });
  }

  function handleCaseChange(caseId: string) {
    setSelectedCaseId(caseId);
    const found = workspaceCases.find((item) => item.id === caseId);
    if (found?.kind === 'user') {
      setActiveSituation(caseId);
    } else {
      setActiveSituation(null);
    }
    void saveStack({
      situationId: caseId,
      sourceIds: found?.kind === 'user' ? found.situation.sourceUrls ?? [] : [],
      documentIds: found?.kind === 'user' ? found.situation.initialDocumentIds ?? [] : [],
    });
  }

  return (
    <main className="flex min-h-[calc(100vh-9rem)] flex-col gap-4" data-testid="ask-workspace-page">
      <AppPageHeader
        eyebrow="Ask PRAXIS"
        title="Ask PRAXIS"
        subtitle={headerLine}
        primaryAction={{ label: 'Manage context', href: '/app/contexts', icon: FolderKanban }}
      />

      <section className={cn('grid min-h-[42rem] gap-4', composerOpen ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : 'xl:grid-cols-1')}>
        <div className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm shadow-navy-950/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-950">Question + active capsule + selected tools + output goal</p>
              <p className="mt-1 truncate text-xs text-slate-600">{activeContextName}</p>
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50"
            >
              <Layers3 className="h-4 w-4" />
              {composerOpen ? 'Hide composer' : 'Context composer'}
            </button>
          </div>
          <AskStreamPanel
            capsuleId={stack.stackId}
            userLabel={activeUserModel.identity}
            outputGoal={stack.outputGoal ?? 'Memo goal'}
            healthScore={contextHealth.score}
            coreBricks={bricks}
            onOpenComposer={() => setComposerOpen(true)}
            className="min-h-0 flex-1 p-4"
          />
        </div>

        {composerOpen ? (
          <ContextComposer
            activeUserModelId={activeUserModelId}
            activeContextName={activeContextName}
            availableModels={availableModels}
            bricks={bricks}
            contextHealthScore={contextHealth.score}
            missingBricks={missingBricks}
            marketplaceToolCount={marketplaceToolCount}
            nextMoves={nextMoves}
            selectedCase={selectedCase}
            selectedCaseId={selectedCase?.id ?? ''}
            workspaceCases={workspaceCases}
            onCaseChange={handleCaseChange}
            onUserModelChange={handleUserModelChange}
          />
        ) : null}
      </section>
    </main>
  );
}

function ContextComposer({
  activeUserModelId,
  activeContextName,
  availableModels,
  bricks,
  contextHealthScore,
  marketplaceToolCount,
  missingBricks,
  nextMoves,
  selectedCase,
  selectedCaseId,
  workspaceCases,
  onCaseChange,
  onUserModelChange,
}: {
  activeUserModelId: string;
  activeContextName: string;
  availableModels: UserModelRecord[];
  bricks: CoreBrick[];
  contextHealthScore: number;
  marketplaceToolCount: number;
  missingBricks: CoreBrick[];
  nextMoves: Array<{ id: string; label: string; detail: string; href: string }>;
  selectedCase: WorkspaceCase | null;
  selectedCaseId: string;
  workspaceCases: WorkspaceCase[];
  onCaseChange: (caseId: string) => void;
  onUserModelChange: (modelId: string) => void;
}) {
  return (
    <aside className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Context Composer</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-navy-950">Active capsule</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">{activeContextName}</p>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700">
          {contextHealthScore}/100
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ComposerAction href="/app/contexts" icon={Save} label="Save as capsule" />
        <ComposerAction href="/app/contexts" icon={GitBranch} label="Fork capsule" />
        <ComposerAction href="/app/canvas" icon={Network} label="Compare" />
        <ComposerAction href="/app/contexts" icon={History} label="History" />
      </div>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">User Core</span>
          <select
            value={activeUserModelId}
            onChange={(event) => onUserModelChange(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-navy-900 outline-none focus:border-diplomatic-blue"
          >
            {availableModels.map((model) => (
              <option key={model.modelId} value={model.modelId}>
                {model.identity}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Situation Core</span>
          <select
            value={selectedCaseId}
            onChange={(event) => onCaseChange(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-navy-900 outline-none focus:border-diplomatic-blue"
          >
            {workspaceCases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Attached cores</p>
          <Link href="/app/contexts" className="text-xs font-semibold text-diplomatic-blue hover:underline">
            Workshop
          </Link>
        </div>
        {bricks.map((brick) => (
          <Link
            key={brick.id}
            href={brick.href}
            className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-diplomatic-blue/30 hover:bg-white"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-diplomatic-blue ring-1 ring-slate-200">
              <brick.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-navy-950">
                {brick.label}
                <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{brick.version}</span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-600">{brick.value}</span>
            </span>
            {brick.ready ? <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-600" /> : <Search className="mt-1 h-4 w-4 text-gold-700" />}
          </Link>
        ))}
      </div>

      <div className="mt-5 rounded-md border border-gold-200 bg-gold-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-900">Missing context</p>
        <div className="mt-2 space-y-1 text-sm text-gold-950">
          {missingBricks.length > 0 ? (
            missingBricks.map((brick) => <p key={brick.id}>{brick.label}: {brick.detail}</p>)
          ) : (
            <p>Core stack is ready for a grounded answer.</p>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Suggested actions</p>
        {nextMoves.map((move) => (
          <Link
            key={move.id}
            href={move.href}
            className="block rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-diplomatic-blue/30 hover:bg-white"
          >
            <span className="block text-sm font-semibold text-navy-950">{move.label}</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-600">{move.detail}</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        <ComposerAction href={selectedCase ? `/app/workbench/${selectedCase.id}?tab=library` : '/app/contexts'} icon={Plus} label="Attach sources or documents" wide />
        <ComposerAction href="/app/write" icon={BookOpenText} label="Send answer to Memo Studio" wide />
        <ComposerAction href="/app/tools" icon={ShieldCheck} label={`${marketplaceToolCount} tools contained in Advanced`} wide muted />
      </div>
    </aside>
  );
}

function ComposerAction({
  href,
  icon: Icon,
  label,
  muted = false,
  wide = false,
}: {
  href: string;
  icon: typeof Save;
  label: string;
  muted?: boolean;
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition',
        wide ? 'w-full' : '',
        muted
          ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
          : 'border-slate-300 bg-white text-navy-900 hover:border-diplomatic-blue/30 hover:bg-slate-50',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function buildCoreBricks({
  activeUserModel,
  selectedCase,
  evidenceCount,
  stack,
  capsuleTimeHorizon,
  healthScore,
}: {
  activeUserModel: UserModelRecord;
  selectedCase: WorkspaceCase | null;
  evidenceCount: number;
  stack: ReturnType<typeof useActiveContextStack>['stack'];
  capsuleTimeHorizon: string;
  healthScore: number;
}): CoreBrick[] {
  return [
    {
      id: 'user',
      label: 'User Core',
      value: activeUserModel.identity,
      detail: 'Role, tone, mandate, preferences',
      href: '/app/cores/user',
      version: 'v1',
      ready: Boolean(activeUserModel),
      locked: true,
      icon: Users,
    },
    {
      id: 'situation',
      label: 'Situation Core',
      value: selectedCase?.name ?? 'No situation attached',
      detail: selectedCase ? `${selectedCase.actorCount} actors / ${selectedCase.region}` : 'Attach a policy, conflict, or regulatory situation',
      href: '/app/cores/context',
      version: 'v1',
      ready: Boolean(selectedCase),
      locked: true,
      icon: Target,
    },
    {
      id: 'source-document',
      label: 'Source/Document Core',
      value: `${evidenceCount} attached`,
      detail: evidenceCount > 0 ? 'Receipts and uploaded documents are available' : 'Attach sources before high-confidence answers',
      href: selectedCase ? `/app/workbench/${selectedCase.id}?tab=library` : '/app/contexts',
      version: 'v1',
      ready: evidenceCount > 0,
      locked: false,
      optional: true,
      icon: LibraryBig,
    },
    {
      id: 'graph',
      label: 'Graph Core',
      value: `${selectedCase?.actorCount ?? 0} actors`,
      detail: 'Actors, claims, events, relationships',
      href: '/app/canvas',
      version: 'v1',
      ready: Boolean(selectedCase?.actorCount),
      locked: false,
      optional: true,
      icon: Network,
    },
    {
      id: 'time',
      label: 'Time Core',
      value: capsuleTimeHorizon,
      detail: 'Current period, history window, forecast horizon',
      href: selectedCase ? `/app/workbench/${selectedCase.id}` : '/app/contexts',
      version: 'v1',
      ready: capsuleTimeHorizon !== 'Set horizon',
      locked: false,
      optional: true,
      icon: Clock,
    },
    {
      id: 'output',
      label: 'Output Core',
      value: stack.outputGoal ?? 'Memo goal',
      detail: 'Audience, format, citation rules',
      href: '/app/write',
      version: healthScore >= 70 ? 'v2' : 'v1',
      ready: Boolean(stack.outputGoal || selectedCase),
      locked: false,
      optional: true,
      icon: FileText,
    },
  ];
}

function buildWorkspaceCases(situations: Situation[], exampleCases: ExampleCase[]): WorkspaceCase[] {
  return [
    ...situations.map((situation) => ({
      kind: 'user' as const,
      id: situation.id,
      name: situation.name,
      region: situation.region,
      summary: situation.description,
      risk: normalizeRisk(situation.riskScore),
      actorCount: situation.actors?.length ?? situation.actorCount ?? 0,
      sourceCount: situation.sourceUrls?.length ?? 0,
      documentCount: situation.documentCount ?? 0,
      tags: situation.tags ?? [],
      situation,
    })),
    ...exampleCases.map((example) => ({
      kind: 'example' as const,
      id: example.id,
      name: example.name,
      region: example.region,
      summary: example.summary,
      risk: example.risk,
      actorCount: example.tags.length + 1,
      sourceCount: example.tags.length,
      documentCount: 0,
      tags: example.tags,
      situation: example,
    })),
  ];
}

function normalizeRisk(riskScore: number): number {
  if (!Number.isFinite(riskScore)) return 0;
  return riskScore <= 1 ? Math.round(riskScore * 10) : Math.round(riskScore);
}
