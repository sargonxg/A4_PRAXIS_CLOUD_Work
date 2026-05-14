'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  BookOpenText,
  Bot,
  CheckCircle2,
  FileText,
  FolderKanban,
  GitBranch,
  LibraryBig,
  MessageSquareText,
  Network,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
} from 'lucide-react';
import { AskBar } from '@/components/ask/AskBar';
import { AskStreamPanel } from '@/components/ask/AskStreamPanel';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { getNextMoves } from '@/lib/assistant/next-moves';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import type { UserModelRecord } from '@/lib/user-models/types';
import { getActiveUserModelId, listPrivateUserModels, setActiveUserModel } from '@/lib/users/api';
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

export function AskWorkspacePage({ exampleCases, marketplaceToolCount }: AskWorkspacePageProps) {
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);

  const [privateModels, setPrivateModels] = useState<UserModelRecord[]>([]);
  const [activeUserModelId, setActiveUserModelId] = useState('foreign-policy-analyst');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
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
    if (workspaceCases[0]) {
      setSelectedCaseId(workspaceCases[0].id);
    }
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

  const policyPosture = buildPolicyPosture(selectedCase, marketplaceToolCount, activeUserModel);
  const activeContextName = selectedCase?.name ?? 'No situation selected';
  const contextHealth = buildContextHealthReport({
    hasUserCore: Boolean(activeUserModel),
    hasSituationCore: Boolean(selectedCase),
    sourceCount: selectedCase?.sourceCount ?? 0,
    documentCount: selectedCase?.documentCount ?? 0,
    actorCount: selectedCase?.actorCount ?? 0,
    hasTimeline: selectedCase?.kind === 'user'
      ? Boolean(selectedCase.situation.keyDates?.length || selectedCase.situation.latestEventDate || selectedCase.situation.conflictOnsetDate)
      : Boolean(selectedCase),
    evidenceGapCount: selectedCase ? Math.max(0, 3 - ((selectedCase.sourceCount ?? 0) + (selectedCase.documentCount ?? 0))) : 4,
    hasDraft: false,
    situationHref: selectedCase ? `/app/workbench/${selectedCase.id}` : '/app/contexts',
  });
  const nextMoves = getNextMoves({
    situation: selectedCase?.kind === 'user' ? selectedCase.situation : null,
    situationStage: selectedCase?.tags.join(' ') ?? 'intake',
  });
  const knowledgeNodes = buildKnowledgeNodes(selectedCase, activeUserModel, stack);
  const capabilityRunway = buildCapabilityRunway(selectedCase, contextHealth.score, marketplaceToolCount);

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
    const foundCase = workspaceCases.find((item) => item.id === caseId);
    void saveStack({
      situationId: caseId,
      sourceIds: foundCase?.kind === 'user' ? foundCase.situation.sourceUrls ?? [] : [],
      documentIds: foundCase?.kind === 'user' ? foundCase.situation.initialDocumentIds ?? [] : [],
    });
  }

  return (
    <main className="flex flex-col gap-6" data-testid="ask-workspace-page">
      <header className="grid gap-4 border-b border-slate-200 pb-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">Ask PRAXIS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">
            Build the context, ask the question, move the work.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Ask PRAXIS is the policy workbench: user details, situation facts, source receipts, library documents, graph structure, and memo goals are assembled into a portable context stack before the assistant answers.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <SmallStat label="Model runtime" value="Gemini now, provider picker later" icon={Bot} />
          <SmallStat label="Visible tools" value={`${marketplaceToolCount} mapped tools`} icon={Wrench} />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Attached context</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AttachChip href="/app/cores/user" label="User Core" detail={activeUserModel.identity} icon={Users} />
                  <AttachChip href="/app/cores/context" label="Situation Core" detail={activeContextName} icon={Target} />
                  <AttachChip href="/app/dashboard" label="Health" detail={`${contextHealth.score}/100 - ${contextHealth.label}`} icon={Sparkles} />
                  <AttachChip href="/app/write" label="Write path" detail={stack.outputGoal ?? 'Continue in Memo Studio'} icon={BookOpenText} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/app/dashboard" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50">
                  Dashboard
                </Link>
                <Link href="/app/tools" className="inline-flex items-center gap-2 rounded-md border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-2 text-sm font-semibold text-diplomatic-blue hover:bg-diplomatic-blue/10">
                  Advanced
                </Link>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-navy-200 bg-white p-3 shadow-sm">
              <AskBar activeContextName={activeContextName} hasContext={Boolean(selectedCase)} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-diplomatic-blue" />
                  <h2 className="text-base font-semibold text-navy-950">Context knowledge stack</h2>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                  Every answer should know who is asking, what situation is live, what evidence is attached, where the gaps are, and which output is being built.
                </p>
              </div>
              <Link href="/app/contexts" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50">
                Open Library
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <KnowledgeStackMap nodes={knowledgeNodes} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-diplomatic-blue/20 bg-white p-5 shadow-sm shadow-navy-950/5">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-diplomatic-blue" />
                <h2 className="text-base font-semibold text-navy-950">What Ask can do with this context</h2>
              </div>
              <CapabilityRunway items={capabilityRunway} />
            </div>
            <AskStreamPanel capsuleId={stack.stackId} className="min-h-[26rem]" />
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-700" />
                <h2 className="text-base font-semibold text-navy-950">Policy posture</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{policyPosture.summary}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {policyPosture.items.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-navy-950">{item.value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-diplomatic-blue" />
                <h2 className="text-base font-semibold text-navy-950">Core selection</h2>
              </div>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">User Core</span>
                  <select
                    value={activeUserModelId}
                    onChange={(event) => handleUserModelChange(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-navy-800 outline-none focus:border-diplomatic-blue"
                  >
                    {availableModels.map((model) => (
                      <option key={model.modelId} value={model.modelId}>
                        {model.identity}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Situation Core</span>
                  <select
                    value={selectedCase?.id ?? ''}
                    onChange={(event) => handleCaseChange(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-navy-800 outline-none focus:border-diplomatic-blue"
                  >
                    {workspaceCases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                Keep the context small. If a section is not useful, hide it or collapse it rather than spreading the workflow across multiple pages.
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-diplomatic-blue" />
              <h2 className="text-base font-semibold text-navy-950">Next best actions</h2>
            </div>
            <div className="mt-4 space-y-2">
              {nextMoves.map((move) => (
                <Link
                  key={move.id}
                  href={move.href}
                  className="block rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-diplomatic-blue/30 hover:bg-white"
                >
                  <p className="text-sm font-semibold text-navy-950">{move.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{move.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gold-200 bg-gold-50 p-5 shadow-sm shadow-navy-950/5">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-gold-800" />
              <h2 className="text-base font-semibold text-navy-950">Shareable capsule</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-800">
              <DocRow label="Executive summary" value={selectedCase ? `1 case, ${selectedCase.actorCount} actors` : 'Attach a Situation Core'} />
              <DocRow label="Source posture" value={`${selectedCase?.sourceCount ?? 0} receipts`} />
              <DocRow label="Document posture" value={`${selectedCase?.documentCount ?? 0} docs`} />
              <DocRow label="Writing mode" value="Policy memo / talking points / brief" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/app/write" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
                Open Memo Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/app/canvas" className="inline-flex items-center gap-2 rounded-md border border-gold-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-gold-100">
                Canvas
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-diplomatic-blue" />
              <h2 className="text-base font-semibold text-navy-950">Context inheritance</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              The stack can travel into Library, Canvas, Memo Studio, and handoff flows. That lets teams reuse the same policy context instead of rebuilding assumptions for every answer.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

function buildKnowledgeNodes(selectedCase: WorkspaceCase | null, userModel: UserModelRecord, stack: ReturnType<typeof useActiveContextStack>['stack']) {
  return [
    {
      id: 'user',
      label: 'User Core',
      value: userModel.identity,
      detail: userModel.workOntologyId ? 'Role, tone, mandate, methods' : 'Select or create a working profile',
      href: '/app/cores/user',
      icon: Users,
      ready: Boolean(userModel),
    },
    {
      id: 'situation',
      label: 'Situation Core',
      value: selectedCase?.name ?? 'No situation attached',
      detail: selectedCase ? `${selectedCase.actorCount} actors, ${selectedCase.region}` : 'Attach a policy or conflict case',
      href: '/app/cores/context',
      icon: Target,
      ready: Boolean(selectedCase),
    },
    {
      id: 'sources',
      label: 'Source Receipts',
      value: `${selectedCase?.sourceCount ?? 0} linked`,
      detail: stack.sourceIds.length ? `${stack.sourceIds.length} active stack sources` : 'Add grounded evidence from Library',
      href: '/app/contexts',
      icon: LibraryBig,
      ready: Boolean((selectedCase?.sourceCount ?? 0) + stack.sourceIds.length),
    },
    {
      id: 'graph',
      label: 'Graph Context',
      value: `${selectedCase?.actorCount ?? 0} actor nodes`,
      detail: 'Claims, actors, dates, edges, and gaps become inspectable',
      href: selectedCase ? `/app/workbench/${selectedCase.id}` : '/app/canvas',
      icon: Network,
      ready: Boolean(selectedCase?.actorCount),
    },
    {
      id: 'output',
      label: 'Output Goal',
      value: stack.outputGoal ?? 'Memo ready',
      detail: stack.documentIds.length ? `${stack.documentIds.length} library documents attached` : 'Draft, brief, talking points, or handoff',
      href: '/app/write',
      icon: FileText,
      ready: Boolean(stack.outputGoal || selectedCase),
    },
  ];
}

function buildCapabilityRunway(selectedCase: WorkspaceCase | null, healthScore: number, marketplaceToolCount: number) {
  return [
    {
      label: 'Ask',
      detail: selectedCase ? `Question is scoped to ${selectedCase.name}.` : 'Attach a situation before asking.',
      icon: Bot,
      tone: 'blue',
    },
    {
      label: 'Ground',
      detail: healthScore >= 65 ? 'Context health is strong enough for source-aware answers.' : 'Needs more sources or documents before high-stakes use.',
      icon: ShieldCheck,
      tone: healthScore >= 65 ? 'green' : 'gold',
    },
    {
      label: 'Visualize',
      detail: 'Use Canvas and graph views to inspect actors, claims, timelines, and gaps.',
      icon: GitBranch,
      tone: 'blue',
    },
    {
      label: 'Route',
      detail: `${marketplaceToolCount} mapped tools can extend the answer when the problem needs specialist logic.`,
      icon: Wrench,
      tone: 'slate',
    },
    {
      label: 'Write',
      detail: 'Move the same context into Memo Studio for a cited policy product.',
      icon: BookOpenText,
      tone: 'blue',
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

function buildPolicyPosture(selectedCase: WorkspaceCase | null, marketplaceToolCount: number, userModel: UserModelRecord) {
  const actorCount = selectedCase?.actorCount ?? 0;
  const sourceCount = selectedCase?.sourceCount ?? 0;
  const documentCount = selectedCase?.documentCount ?? 0;
  const risk = selectedCase?.risk ?? 0;
  const summary = selectedCase
    ? `This workspace is tuned for ${selectedCase.name}. Keep the answer anchored in the user core, the situation core, and the smallest tool chain that can strengthen the memo.`
    : 'Pick a Situation Core and keep the workflow centered on evidence, structure, and writing.';

  return {
    summary,
    items: [
      {
        label: 'Actors',
        value: String(actorCount),
        detail: actorCount > 4 ? 'Enough structure for stakeholder mapping' : 'Needs a tighter actor set',
      },
      {
        label: 'Evidence',
        value: String(sourceCount + documentCount),
        detail: sourceCount + documentCount > 5 ? 'Strong enough for a memo pass' : 'Needs more source intake',
      },
      {
        label: 'Tools',
        value: `${marketplaceToolCount}`,
        detail: userModel.workOntologyId ? 'Attach the next tool to the policy task' : 'Select a user model first',
      },
      {
        label: 'Risk',
        value: risk > 0 ? String(risk) : 'Open',
        detail: risk >= 7 ? 'Use scenario and red team early' : 'Keep the path compact',
      },
    ],
  };
}

function normalizeRisk(riskScore: number): number {
  if (!Number.isFinite(riskScore)) return 0;
  return riskScore <= 1 ? Math.round(riskScore * 10) : Math.round(riskScore);
}

function SmallStat({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-diplomatic-blue" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-navy-950">{value}</p>
    </div>
  );
}

function KnowledgeStackMap({
  nodes,
}: {
  nodes: Array<{
    id: string;
    label: string;
    value: string;
    detail: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    ready: boolean;
  }>;
}) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-5">
      {nodes.map((node, index) => (
        <Link
          key={node.id}
          href={node.href}
          className="group relative min-h-[10rem] rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-diplomatic-blue/40 hover:bg-white"
        >
          {index < nodes.length - 1 ? (
            <span className="pointer-events-none absolute right-[-1.1rem] top-1/2 z-10 hidden h-px w-5 bg-slate-300 md:block" />
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-diplomatic-blue shadow-sm ring-1 ring-slate-200">
              <node.icon className="h-4 w-4" />
            </div>
            {node.ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Search className="h-4 w-4 text-gold-700" />}
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{node.label}</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-navy-950">{node.value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{node.detail}</p>
        </Link>
      ))}
    </div>
  );
}

function CapabilityRunway({
  items,
}: {
  items: Array<{
    label: string;
    detail: string;
    icon: ComponentType<{ className?: string }>;
    tone: string;
  }>;
}) {
  return (
    <div className="mt-4 space-y-3">
      {items.map((item, index) => (
        <div key={item.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={[
                'flex h-9 w-9 items-center justify-center rounded-full border',
                item.tone === 'green'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : item.tone === 'gold'
                    ? 'border-gold-200 bg-gold-50 text-gold-800'
                    : 'border-diplomatic-blue/20 bg-diplomatic-blue/5 text-diplomatic-blue',
              ].join(' ')}
            >
              <item.icon className="h-4 w-4" />
            </div>
            {index < items.length - 1 ? <span className="h-8 w-px bg-slate-200" /> : null}
          </div>
          <div className="min-w-0 pb-2">
            <p className="text-sm font-semibold text-navy-950">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttachChip({
  href,
  label,
  detail,
  icon: Icon,
}: {
  href: string;
  label: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href} className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-navy-800 hover:border-diplomatic-blue/30 hover:bg-white">
      <Icon className="h-3.5 w-3.5 shrink-0 text-diplomatic-blue" />
      <span className="uppercase tracking-[0.16em]">{label}</span>
      <span className="max-w-[18rem] truncate font-normal normal-case tracking-normal text-slate-600">{detail}</span>
    </Link>
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
