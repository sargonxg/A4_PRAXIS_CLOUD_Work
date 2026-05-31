'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
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
import {
  CONTEXT_CAPSULE_TEMPLATES,
  CAPSULE_ATTACHMENT_ROLES,
  CAPSULE_SLOT_DEFINITIONS,
  capsuleAttachmentCounts,
  PENDING_CONTEXT_CAPSULE_OUTPUT_KEY,
  PENDING_CONTEXT_CAPSULE_PATH_KEY,
  PENDING_CONTEXT_CAPSULE_PROMPT_KEY,
  PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY,
  POLICY_PATH_PROFILES,
} from '@/lib/product/context-capsules-client';
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

  const [privateModels] = useState<UserModelRecord[]>(() => (
    typeof window !== 'undefined' ? listPrivateUserModels(window.localStorage) : []
  ));
  const [activeUserModelId, setActiveUserModelId] = useState(() => (
    typeof window !== 'undefined' ? getActiveUserModelId(window.localStorage) : 'foreign-policy-analyst'
  ));
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(true);
  const [pendingCapsulePrompt, setPendingCapsulePrompt] = useState(() => (
    typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_PROMPT_KEY) ?? '' : ''
  ));
  const [pendingCapsuleTemplateId, setPendingCapsuleTemplateId] = useState(() => (
    typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY) ?? '' : ''
  ));
  const [pendingCapsulePathId, setPendingCapsulePathId] = useState(() => (
    typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_PATH_KEY) ?? '' : ''
  ));
  const [pendingCapsuleOutput, setPendingCapsuleOutput] = useState(() => (
    typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_OUTPUT_KEY) ?? '' : ''
  ));
  const { stack, hydrated: stackHydrated, saveStack } = useActiveContextStack();

  const pendingCapsuleTemplateLabel = useMemo(
    () => CONTEXT_CAPSULE_TEMPLATES.find((t) => t.id === pendingCapsuleTemplateId)?.label ?? '',
    [pendingCapsuleTemplateId],
  );
  const pendingCapsulePathLabel = useMemo(
    () => POLICY_PATH_PROFILES.find((path) => path.id === pendingCapsulePathId)?.label ?? '',
    [pendingCapsulePathId],
  );

  const availableModels = useMemo(() => [...privateModels, ...PUBLIC_USER_MODELS], [privateModels]);
  const workspaceCases = useMemo(() => buildWorkspaceCases(situations, exampleCases), [exampleCases, situations]);
  const stackUserModelId = stackHydrated && stack.userModelId && availableModels.some((model) => model.modelId === stack.userModelId)
    ? stack.userModelId
    : null;
  const effectiveActiveUserModelId = stackUserModelId ?? activeUserModelId;
  const activeUserModel = availableModels.find((model) => model.modelId === effectiveActiveUserModelId) ?? PUBLIC_USER_MODELS[0];
  const effectiveSelectedCaseId = selectedCaseId
    ?? (stackHydrated && stack.situationId ? stack.situationId : null)
    ?? activeSituation?.id
    ?? workspaceCases[0]?.id
    ?? null;

  useEffect(() => {
    if (!stackHydrated) return;
    if (stack.userModelId && availableModels.some((model) => model.modelId === stack.userModelId)) {
      setActiveUserModel(window.localStorage, stack.userModelId);
    }
    if (stack.situationId && workspaceCases.some((item) => item.id === stack.situationId)) {
      const found = workspaceCases.find((item) => item.id === stack.situationId);
      if (found?.kind === 'user') setActiveSituation(stack.situationId);
    }
  }, [availableModels, setActiveSituation, stack.situationId, stack.userModelId, stackHydrated, workspaceCases]);

  const selectedCase = useMemo(() => {
    if (effectiveSelectedCaseId) return workspaceCases.find((item) => item.id === effectiveSelectedCaseId) ?? null;
    return activeSituation ? workspaceCases.find((item) => item.id === activeSituation.id) ?? null : workspaceCases[0] ?? null;
  }, [activeSituation, effectiveSelectedCaseId, workspaceCases]);

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
    situationHref: selectedCase ? `/app/contexts?situationId=${selectedCase.id}` : '/app/contexts',
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
  const canonicalCoreRefs = {
    userCoreId: activeUserModel.modelId,
    situationCoreId: selectedCase?.id ?? null,
    sourceCoreIds: selectedCase?.sourceCount ? [`${selectedCase.sourceCount} source receipts`] : [],
    documentCoreIds: selectedCase?.documentCount ? [`${selectedCase.documentCount} document receipts`] : [],
    graphCoreId: selectedCase?.actorCount ? `${selectedCase.actorCount} actor graph` : null,
    timeCoreId: capsuleTimeHorizon !== 'Set horizon' ? capsuleTimeHorizon : null,
    outputCoreIds: stack.outputGoal ? [stack.outputGoal] : [],
    toolCoreIds: marketplaceToolCount > 0 ? ['capsule-aware-tool-registry'] : [],
    objectiveCoreIds: pendingCapsulePrompt ? ['landing-scaffold-objective'] : [],
    productCoreIds: pendingCapsuleOutput ? [pendingCapsuleOutput] : [],
    memoryCoreId: stack.capsuleId ?? null,
  };
  const capsuleCounts = capsuleAttachmentCounts(canonicalCoreRefs);
  const nextMoves = getNextMoves({
    situation: selectedCase?.kind === 'user' ? selectedCase.situation : null,
    situationStage: selectedCase?.tags.join(' ') ?? 'intake',
  }).slice(0, 3);
  const headerLine = `${activeUserModel.identity} / ${activeContextName} / ${evidenceCount} sources and documents / ${stack.outputGoal ?? 'Memo goal'} / ${contextHealth.score}/100 health`;
  const outputGoal = stack.outputGoal ?? pendingCapsuleOutput ?? 'Memo goal';

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

  function openPendingCapsulePrompt() {
    if (!pendingCapsulePrompt.trim()) return;
    window.dispatchEvent(new CustomEvent('open-praxis-chat', { detail: { prompt: pendingCapsulePrompt } }));
    window.localStorage.removeItem(PENDING_CONTEXT_CAPSULE_PROMPT_KEY);
    window.localStorage.removeItem(PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY);
    window.localStorage.removeItem(PENDING_CONTEXT_CAPSULE_PATH_KEY);
    window.localStorage.removeItem(PENDING_CONTEXT_CAPSULE_OUTPUT_KEY);
    setPendingCapsulePrompt('');
    setPendingCapsuleTemplateId('');
    setPendingCapsulePathId('');
    setPendingCapsuleOutput('');
  }

  return (
    <main className="flex min-h-[calc(100vh-9rem)] flex-col gap-4" data-testid="ask-workspace-page">
      <AppPageHeader
        eyebrow="Ask PRAXIS"
        title="Ask the active ContextCapsule"
        subtitle={headerLine}
        primaryAction={{ label: 'Manage context', href: '/app/contexts', icon: FolderKanban }}
      />

      {pendingCapsulePrompt ? (
        <section className="rounded-lg border border-gold-200 bg-gold-50 p-4 shadow-sm shadow-navy-950/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-800">
                ContextCapsule scaffold from landing{pendingCapsuleTemplateLabel ? ` · ${pendingCapsuleTemplateLabel}` : ''}
              </p>
              <p className="mt-2 text-sm leading-6 text-navy-900">{pendingCapsulePrompt}</p>
              {pendingCapsulePathLabel || pendingCapsuleOutput ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingCapsulePathLabel ? (
                    <span className="rounded-full border border-gold-200 bg-white px-2 py-1 text-[11px] font-semibold text-gold-800">
                      Path: {pendingCapsulePathLabel}
                    </span>
                  ) : null}
                  {pendingCapsuleOutput ? (
                    <span className="rounded-full border border-gold-200 bg-white px-2 py-1 text-[11px] font-semibold text-gold-800">
                      Output: {pendingCapsuleOutput}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-1 text-xs leading-5 text-navy-600">
                Start thin, then add sources, episodes, power dynamics, rules, tools, and an output target in the sidebar.
              </p>
            </div>
            <button
              type="button"
              onClick={openPendingCapsulePrompt}
              className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-900"
            >
              Continue in Ask
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}

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
            capsuleId={stack.capsuleId ?? stack.stackId}
            contextPackageId={stack.contextPackageId}
            activeContextStack={stack}
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
            activeUserModelId={effectiveActiveUserModelId}
            activeContextName={activeContextName}
            availableModels={availableModels}
            bricks={bricks}
            contextHealthScore={contextHealth.score}
            evidenceCount={evidenceCount}
            missingBricks={missingBricks}
            marketplaceToolCount={marketplaceToolCount}
            nextMoves={nextMoves}
            outputGoal={outputGoal}
            capsuleCounts={capsuleCounts}
            canonicalCoreRefs={canonicalCoreRefs}
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
  evidenceCount,
  marketplaceToolCount,
  missingBricks,
  nextMoves,
  outputGoal,
  capsuleCounts,
  canonicalCoreRefs,
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
  evidenceCount: number;
  marketplaceToolCount: number;
  missingBricks: CoreBrick[];
  nextMoves: Array<{ id: string; label: string; detail: string; href: string }>;
  outputGoal: string;
  capsuleCounts: ReturnType<typeof capsuleAttachmentCounts>;
  canonicalCoreRefs: Parameters<typeof capsuleAttachmentCounts>[0];
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

      <AskRunReadinessPanel
        activeContextName={activeContextName}
        contextHealthScore={contextHealthScore}
        evidenceCount={evidenceCount}
        marketplaceToolCount={marketplaceToolCount}
        missingBricks={missingBricks}
        outputGoal={outputGoal}
        selectedCase={selectedCase}
        userCoreLabel={availableModels.find((model) => model.modelId === activeUserModelId)?.identity ?? 'User Core'}
      />

      <UsedContextReceipt
        activeContextName={activeContextName}
        capsuleCounts={capsuleCounts}
        canonicalCoreRefs={canonicalCoreRefs}
        outputGoal={outputGoal}
      />

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
        <ComposerAction href={selectedCase ? `/app/contexts?situationId=${selectedCase.id}` : '/app/contexts'} icon={Plus} label="Attach sources or documents" wide />
        <ComposerAction href="/app/write" icon={BookOpenText} label="Save answer as Work" wide />
        <ComposerAction href="/app/tools" icon={ShieldCheck} label={`${marketplaceToolCount} tools available with Proof`} wide muted />
      </div>
    </aside>
  );
}

function AskRunReadinessPanel({
  activeContextName,
  contextHealthScore,
  evidenceCount,
  marketplaceToolCount,
  missingBricks,
  outputGoal,
  selectedCase,
  userCoreLabel,
}: {
  activeContextName: string;
  contextHealthScore: number;
  evidenceCount: number;
  marketplaceToolCount: number;
  missingBricks: CoreBrick[];
  outputGoal: string;
  selectedCase: WorkspaceCase | null;
  userCoreLabel: string;
}) {
  const capsuleState = selectedCase?.kind === 'user'
    ? 'User-owned active capsule'
    : selectedCase
      ? 'Example capsule attached'
      : 'No active capsule';
  const situationLabel = selectedCase?.name ?? 'Attach a Situation Core';
  const sourceStatus = evidenceCount > 0
    ? `${evidenceCount} source/document receipt${evidenceCount === 1 ? '' : 's'}`
    : 'Sources and documents pending';
  const adkStatus = selectedCase
    ? 'Planned through queued run ledger'
    : 'Planned after capsule selection';

  return (
    <section className="mt-5 rounded-lg border border-navy-200 bg-navy-950 p-3 text-white shadow-sm shadow-navy-950/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-200">Ask run readiness</p>
          <h3 className="mt-1 truncate text-sm font-semibold">{activeContextName}</h3>
          <p className="mt-1 text-[11px] leading-4 text-navy-200">
            {capsuleState} / {contextHealthScore}/100 context health
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-100">
          No live agent run
        </span>
      </div>

      <ProposedCapsuleDiffPanel missingBricks={missingBricks} selectedCase={selectedCase} />

      <div className="mt-3 grid gap-2 text-xs">
        <ReadinessRow label="User Core" value={userCoreLabel} state="ready" />
        <ReadinessRow label="Situation Core" value={situationLabel} state={selectedCase ? 'ready' : 'gap'} />
        <ReadinessRow label="Sources/Documents" value={sourceStatus} state={evidenceCount > 0 ? 'ready' : 'gap'} />
        <ReadinessRow label="Output goal" value={outputGoal} state={outputGoal === 'Memo goal' ? 'gap' : 'ready'} />
      </div>

      <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 text-xs">
        <ReadinessRow label="Genkit checks" value="Path classifier + Sourceability available" state="available" />
        <ReadinessRow
          label="Capsule tools"
          value={marketplaceToolCount > 0 ? `${marketplaceToolCount} tools available with Proof` : 'Tool registry unavailable'}
          state={marketplaceToolCount > 0 ? 'available' : 'gap'}
        />
        <ReadinessRow label="ADK agents" value={adkStatus} state="planned" />
      </div>
      <p className="mt-3 text-[11px] leading-4 text-navy-200">
        Ask PRAXIS can answer from this capsule now. Durable ADK Research Memo runs remain planned until worker execution is wired.
      </p>
    </section>
  );
}

function UsedContextReceipt({
  activeContextName,
  capsuleCounts,
  canonicalCoreRefs,
  outputGoal,
}: {
  activeContextName: string;
  capsuleCounts: ReturnType<typeof capsuleAttachmentCounts>;
  canonicalCoreRefs: Parameters<typeof capsuleAttachmentCounts>[0];
  outputGoal: string;
}) {
  const readySlots = CAPSULE_SLOT_DEFINITIONS.filter((slot) => {
    switch (slot.id) {
      case 'user':
        return Boolean(canonicalCoreRefs?.userCoreId);
      case 'situation':
        return Boolean(canonicalCoreRefs?.situationCoreId);
      case 'source':
        return Boolean(canonicalCoreRefs?.sourceCoreIds?.length);
      case 'document':
        return Boolean(canonicalCoreRefs?.documentCoreIds?.length);
      case 'connector':
        return Boolean(canonicalCoreRefs?.sourceCoreIds?.length || canonicalCoreRefs?.toolCoreIds?.length);
      case 'time':
        return Boolean(canonicalCoreRefs?.timeCoreId);
      case 'graph':
        return Boolean(canonicalCoreRefs?.graphCoreId);
      case 'rules':
        return Boolean(canonicalCoreRefs?.productCoreIds?.length);
      case 'tool':
        return Boolean(canonicalCoreRefs?.toolCoreIds?.length);
      case 'objective':
        return Boolean(canonicalCoreRefs?.objectiveCoreIds?.length);
      case 'output':
        return Boolean(canonicalCoreRefs?.outputCoreIds?.length || outputGoal !== 'Memo goal');
      case 'memory':
        return Boolean(canonicalCoreRefs?.memoryCoreId);
    }
  });

  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Used context receipt</p>
          <p className="mt-1 truncate text-sm font-semibold text-navy-950">Primary: {activeContextName}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Reference: none attached / Comparison: none attached / Output: {outputGoal}
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-700">
          {readySlots.length}/{CAPSULE_SLOT_DEFINITIONS.length}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">{capsuleCounts.attachments} files/sources</span>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">{capsuleCounts.connectors} connectors/tools</span>
        {CAPSULE_ATTACHMENT_ROLES.slice(0, 3).map((role) => (
          <span key={role.role} className="rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700">
            {role.label}{role.role === 'primary' ? ': active' : ': 0'}
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CAPSULE_SLOT_DEFINITIONS.map((slot) => {
          const ready = readySlots.some((readySlot) => readySlot.id === slot.id);
          return (
            <span
              key={slot.id}
              className={cn(
                'rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
                ready
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-500',
              )}
              title={slot.description}
            >
              {slot.shortLabel}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function ProposedCapsuleDiffPanel({
  missingBricks,
  selectedCase,
}: {
  missingBricks: CoreBrick[];
  selectedCase: WorkspaceCase | null;
}) {
  const [state, setState] = useState<'open' | 'accepted' | 'rejected'>('open');
  const topMissing = missingBricks.slice(0, 3);
  if (topMissing.length === 0) return null;

  return (
    <section className="mt-5 rounded-md border border-diplomatic-blue/20 bg-blue-50/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-diplomatic-blue">Proposed capsule diff</p>
      <p className="mt-1 text-sm leading-5 text-navy-900">
        {selectedCase ? 'PRAXIS can repair this capsule before answering.' : 'Attach a Situation Core before PRAXIS runs a grounded answer.'}
      </p>
      <div className="mt-2 space-y-1 text-sm text-navy-800">
        {topMissing.map((brick) => (
          <p key={brick.id}>+ {brick.label}: {brick.detail}</p>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setState('accepted')}
          className="rounded-md bg-diplomatic-blue px-2.5 py-1.5 text-xs font-semibold text-white"
        >
          Accept diff
        </button>
        <Link
          href="/app/contexts"
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900 hover:bg-slate-50"
        >
          Edit in workshop
        </Link>
        <button
          type="button"
          onClick={() => setState('rejected')}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900 hover:bg-slate-50"
        >
          Reject
        </button>
      </div>
      {state !== 'open' ? (
        <p className="mt-2 text-xs font-semibold text-slate-600">
          Diff {state}. This local cockpit state will be replaced by persisted capsule diffs when the backend mutation endpoint owns this flow.
        </p>
      ) : null}
    </section>
  );
}

function ReadinessRow({
  label,
  value,
  state,
}: {
  label: string;
  value: string;
  state: 'ready' | 'available' | 'planned' | 'gap';
}) {
  const tone = {
    ready: 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/20',
    available: 'bg-sky-400/15 text-sky-100 ring-sky-300/20',
    planned: 'bg-gold-300/15 text-gold-100 ring-gold-200/20',
    gap: 'bg-white/10 text-navy-100 ring-white/10',
  }[state];

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-2.5 py-2 ring-1 ring-white/10">
      <span className="shrink-0 font-semibold text-navy-200">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-white">{value}</span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ring-1 ${tone}`}>
        {state}
      </span>
    </div>
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
      href: selectedCase ? `/app/contexts?situationId=${selectedCase.id}` : '/app/contexts',
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
      id: 'rules',
      label: 'Rules Core',
      value: selectedCase ? 'Policy constraints' : 'Rules pending',
      detail: 'Legal, institutional, classification, compliance, writing, and review constraints',
      href: '/app/contexts',
      version: 'v1',
      ready: Boolean(selectedCase),
      locked: false,
      optional: true,
      icon: ShieldCheck,
    },
    {
      id: 'time',
      label: 'Time Core',
      value: capsuleTimeHorizon,
      detail: 'Current period, history window, forecast horizon',
      href: selectedCase ? `/app/contexts?situationId=${selectedCase.id}` : '/app/contexts',
      version: 'v1',
      ready: capsuleTimeHorizon !== 'Set horizon',
      locked: false,
      optional: true,
      icon: Clock,
    },
    {
      id: 'connector',
      label: 'Connector Core',
      value: evidenceCount > 0 ? 'Read-only feeds available' : 'Add source feed',
      detail: 'grounded search, source-linked event reporting, humanitarian web reporting, humanitarian data, official multilateral news, economic institution, grounded Search, and private library sources',
      href: '/app/contexts',
      version: 'v1',
      ready: evidenceCount > 0,
      locked: false,
      optional: true,
      icon: LibraryBig,
    },
    {
      id: 'tool',
      label: 'Tool Core',
      value: 'Proof registry',
      detail: 'Selected PRAXIS tools, allowed actions, approvals, readiness, and receipts',
      href: '/app/tools',
      version: 'v1',
      ready: true,
      locked: false,
      optional: true,
      icon: ShieldCheck,
    },
    {
      id: 'objective',
      label: 'Objective Core',
      value: stack.outputGoal ? 'Output-bound task' : 'Ask-first task',
      detail: 'Current task, decision question, success criteria, and workflow stage',
      href: '/app/contexts',
      version: 'v1',
      ready: Boolean(selectedCase || stack.outputGoal),
      locked: false,
      optional: true,
      icon: Target,
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
    {
      id: 'memory',
      label: 'Memory/Handover Core',
      value: stack.capsuleId ?? 'Default capsule',
      detail: 'Prior runs, accepted conclusions, red-team findings, approvals, and agent instructions',
      href: '/app/contexts',
      version: 'v1',
      ready: Boolean(stack.capsuleId || selectedCase),
      locked: false,
      optional: true,
      icon: History,
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
