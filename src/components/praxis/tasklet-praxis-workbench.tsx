'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  ChevronsRight,
  Clipboard,
  Combine,
  Cpu,
  FileText,
  FileSearch,
  FolderKanban,
  GripVertical,
  Layers3,
  Maximize2,
  Mic,
  Paperclip,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  destinationHref,
  PENDING_POLICY_AGENT_ID_KEY,
  PENDING_TASKLET_PROMPT_KEY,
  policyAgentRunIntent,
  policyAgentLoginHref,
  PRAXIS_POLICY_AGENTS,
  type ContextCapsuleLauncherState,
  type HomeSurfaceMode,
  type PolicyAgentDefinition,
} from '@/lib/product/policy-agents';
import { ASK_ORCHESTRATION_OPTIONS, ASK_RUNTIME_OPTIONS, getAskRuntimeOption } from '@/lib/ai/ask-runtime-catalog';
import type { ModelPreferenceValue } from '@/lib/ai/model-preferences';
import { PRAXIS_USAGE_COPY } from '@/lib/billing/usage-policy';
import {
  COCKPIT_CAPSULE_LIBRARY,
  COCKPIT_COMBINATION_RECIPES,
  COCKPIT_TOOL_SUGGESTIONS,
  COCKPIT_USER_ARCHETYPES,
  POLICY_NEED_TABS,
  findCapsuleTemplate,
} from '@/lib/product/cockpit-composition';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';

type TaskletPraxisWorkbenchProps = {
  mode: HomeSurfaceMode | 'app';
  activeCapsuleName?: string;
  capsuleId?: string;
  recentRuns?: Array<{ label: string; detail: string; status: string }>;
  className?: string;
};

type PolicyNeedTabId = (typeof POLICY_NEED_TABS)[number]['id'];

interface ActiveCapsuleChip {
  id: string;
  label: string;
  code: string;
}

const defaultRecentRuns = [
  { label: 'Middle East policy memo', detail: 'Research Memo Agent -> Memo Studio', status: 'draft' },
  { label: 'Red Sea source check', detail: 'Sourceability Reviewer -> source receipt', status: 'review' },
  { label: 'Sanctions handover', detail: 'Handover Builder -> capsule package', status: 'queued' },
];

export function TaskletPraxisWorkbench({
  mode,
  activeCapsuleName = 'Weekly Middle East Analysis',
  capsuleId = 'default',
  recentRuns = defaultRecentRuns,
  className,
}: TaskletPraxisWorkbenchProps) {
  const { user, credits } = useAuth();
  const surfaceMode: HomeSurfaceMode = mode === 'app' ? 'authenticated' : mode;
  const [prompt, setPrompt] = useState('Draft a sourced options memo from the active capsule.');
  const [activeTab, setActiveTab] = useState<PolicyNeedTabId>('analysis');
  const [selectedAgentId, setSelectedAgentId] = useState('research-memo');
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelPreferenceValue>(ASK_RUNTIME_OPTIONS[0].id);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [capsuleSearchOpen, setCapsuleSearchOpen] = useState(false);
  const [capsuleQuery, setCapsuleQuery] = useState('');
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(['ask-praxis', 'sourceability', 'memo-drafter']);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState(COCKPIT_USER_ARCHETYPES[0]?.id ?? 'user-1');
  const [activeCapsules, setActiveCapsules] = useState<ActiveCapsuleChip[]>([
    { id: capsuleId, label: activeCapsuleName, code: 'ACTIVE' },
    { id: 'conflict-analysis', label: 'Conflict analysis', code: 'CAP-001' },
  ]);
  const [textMenu, setTextMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const [runState, setRunState] = useState<{ status: 'idle' | 'running' | 'ready' | 'error'; message: string; href?: string }>({
    status: 'idle',
    message: 'Ready to create a capsule run.',
  });

  const visibleAgents = useMemo(() => {
    const category = activeTab;
    if (activeTab === 'capsules') return PRAXIS_POLICY_AGENTS;
    return PRAXIS_POLICY_AGENTS.filter((agent) => agent.category === category);
  }, [activeTab]);
  const activePolicyNeed = POLICY_NEED_TABS.find((tab) => tab.id === activeTab) ?? POLICY_NEED_TABS[0]!;
  const selectedAgent = PRAXIS_POLICY_AGENTS.find((agent) => agent.id === selectedAgentId) ?? PRAXIS_POLICY_AGENTS[0]!;
  const selectedRuntime = getAskRuntimeOption(selectedModel);
  const selectedArchetype = COCKPIT_USER_ARCHETYPES.find((item) => item.id === selectedArchetypeId) ?? COCKPIT_USER_ARCHETYPES[0]!;
  const conversationThreadId = `tasklet-${capsuleId}`;
  const suggestedTools = COCKPIT_TOOL_SUGGESTIONS.filter((tool) => (
    activePolicyNeed.toolIds.includes(tool.id) || selectedArchetype.suggestedToolIds.includes(tool.id) || selectedToolIds.includes(tool.id)
  )).slice(0, 9);
  const filteredCapsules = COCKPIT_CAPSULE_LIBRARY.filter((capsule) => {
    const query = capsuleQuery.trim().toLowerCase();
    return !query || capsule.label.toLowerCase().includes(query) || capsule.code.toLowerCase().includes(query);
  }).slice(0, 6);
  const launcherState: ContextCapsuleLauncherState = {
    prompt,
    selectedCapsuleId: capsuleId,
    selectedPolicyAgentId: selectedAgent.id,
    outputDestination: selectedAgent.outputDestination,
  };

  useEffect(() => {
    if (surfaceMode !== 'authenticated') return;
    try {
      const pendingPrompt = window.localStorage.getItem(PENDING_TASKLET_PROMPT_KEY);
      const pendingAgentId = window.localStorage.getItem(PENDING_POLICY_AGENT_ID_KEY);
      if (pendingPrompt?.trim()) {
        setPrompt(pendingPrompt.trim());
        setRunState({ status: 'idle', message: 'Your saved public prompt is ready in the PRAXIS workspace.' });
      }
      if (pendingAgentId && PRAXIS_POLICY_AGENTS.some((agent) => agent.id === pendingAgentId)) {
        setSelectedAgentId(pendingAgentId);
      }
    } catch {
      // localStorage is a convenience handoff, not required for the app.
    }
  }, [surfaceMode]);

  useEffect(() => {
    setActiveCapsules((current) => {
      const [first, ...rest] = current;
      if (first?.id === capsuleId && first.label === activeCapsuleName) return current;
      return [{ id: capsuleId, label: activeCapsuleName, code: 'ACTIVE' }, ...rest];
    });
  }, [activeCapsuleName, capsuleId]);

  function addCapsule(id: string) {
    const capsule = findCapsuleTemplate(id);
    if (!capsule) return;
    setActiveCapsules((current) => current.some((item) => item.id === capsule.id)
      ? current
      : [...current, { id: capsule.id, label: capsule.label, code: capsule.code }]);
  }

  function removeCapsule(id: string) {
    setActiveCapsules((current) => current.length <= 1 ? current : current.filter((item) => item.id !== id));
  }

  function toggleTool(id: string) {
    setSelectedToolIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  function addTool(id: string) {
    setSelectedToolIds((current) => current.includes(id) ? current : [...current, id]);
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    const capsuleIdFromDrop = event.dataTransfer.getData('application/x-praxis-capsule');
    const toolIdFromDrop = event.dataTransfer.getData('application/x-praxis-tool');
    const userIdFromDrop = event.dataTransfer.getData('application/x-praxis-user');
    if (capsuleIdFromDrop) addCapsule(capsuleIdFromDrop);
    if (toolIdFromDrop) addTool(toolIdFromDrop);
    if (userIdFromDrop) setSelectedArchetypeId(userIdFromDrop);
  }

  function handlePromptContextMenu(event: React.MouseEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
    const selection = target.value.slice(target.selectionStart, target.selectionEnd).trim();
    if (!selection) return;
    event.preventDefault();
    setTextMenu({ x: event.clientX, y: event.clientY, text: selection.slice(0, 500) });
  }

  function applyTextAction(action: 'source' | 'check' | 'memo' | 'copy') {
    if (!textMenu) return;
    if (action === 'copy') {
      void navigator.clipboard?.writeText(textMenu.text).catch(() => undefined);
    } else if (action === 'source') {
      setPrompt((current) => `${current.trim()}\n\nUse this selected text as sourced input:\n"${textMenu.text}"`);
    } else if (action === 'check') {
      setPrompt((current) => `${current.trim()}\n\nCheck this paragraph against attached documents, repositories, and active capsules:\n"${textMenu.text}"`);
      if (!selectedToolIds.includes('sourceability')) setSelectedToolIds((current) => [...current, 'sourceability']);
    } else {
      setPrompt((current) => `${current.trim()}\n\nSend this passage to Memo Studio with provenance:\n"${textMenu.text}"`);
      if (!selectedToolIds.includes('memo-drafter')) setSelectedToolIds((current) => [...current, 'memo-drafter']);
    }
    setTextMenu(null);
  }

  async function launchRun(agent: PolicyAgentDefinition = selectedAgent) {
    const cleanPrompt = prompt.trim() || `Run ${agent.label} from ${activeCapsuleName}.`;
    if (surfaceMode === 'public') {
      window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, cleanPrompt);
      window.localStorage.setItem(PENDING_POLICY_AGENT_ID_KEY, agent.id);
      window.location.href = policyAgentLoginHref(agent.id, cleanPrompt);
      return;
    }

    setRunState({ status: 'running', message: `Creating ${agent.label} from ${activeCapsuleName}...` });
    const response = await fetch('/api/agents/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsuleId,
        agentSpecId: `policy-agent:${agent.id}`,
        objective: cleanPrompt,
        selectedCoreIds: {
          toolCoreIds: [agent.id],
          outputCoreIds: [agent.outputDestination],
        },
        metadata: {
          policyAgentId: agent.id,
          policyAgentLabel: agent.label,
          runIntent: policyAgentRunIntent(agent.id),
          outputDestination: agent.outputDestination,
          model: selectedRuntime.id,
          provider: selectedRuntime.provider,
          activeCapsules,
          selectedToolIds,
          selectedUserArchetype: selectedArchetype?.label ?? null,
          sourceActionModel: 'selected_text_context_menu',
          approvalLevel: agent.approvalLevel,
          taskletSurface: true,
          conversationThreadId,
          conversationPersistence: 'users/{uid}/capsules/{capsuleId}/askThreads/{threadId}',
          artifactPersistence: 'users/{uid}/situations/{situationId}/artifacts + users/{uid}/memos',
          capsuleManagementMode: 'text_documents_repository_tool_instructions',
          capsuleInstructionMode: selectedArchetype?.detail ?? 'policy capsule context',
          policySolutionMode: 'capsule_bound_policy_and_conflict_analysis',
        },
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setRunState({
        status: 'error',
        message: body?.error === 'Agent run ledger is not configured'
          ? 'Run ledger is not configured in this environment.'
          : body?.error === 'Demo mode cannot create private agent runs'
            ? 'Sign in to create private capsule runs.'
          : `Could not create ${agent.label}.`,
      });
      return;
    }
    const body = await response.json() as { runId?: string; status?: string; outputDestination?: string; outputHref?: string };
    setRunState({
      status: 'ready',
      message: `${agent.label} ${body.status ?? 'queued'} as ${body.runId ?? 'new run'}.`,
      href: body.outputHref ?? destinationHref(agent.outputDestination),
    });
    try {
      window.localStorage.removeItem(PENDING_TASKLET_PROMPT_KEY);
      window.localStorage.removeItem(PENDING_POLICY_AGENT_ID_KEY);
    } catch {
      // ignore handoff cleanup failures
    }
  }

  return (
    <section className={cn('min-h-[calc(100vh-5rem)] bg-[#f6f6f4] text-[#1d1d1f]', className)} data-testid="tasklet-praxis-workbench">
      <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-black/10 bg-[#ececeb] px-4 py-5 lg:flex lg:flex-col">
          <Link href={surfaceMode === 'public' ? '/' : '/app/dashboard'} className="mb-6 flex items-center gap-2 text-lg font-semibold text-navy-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sage text-white">P</span>
            PRAXIS
          </Link>
          <SidebarButton href={surfaceMode === 'public' ? '/login?mode=signup' : '/app/contexts'} icon={FolderKanban} label="New capsule" active />
          <SidebarButton href={surfaceMode === 'public' ? '/learn' : '/app/contexts'} icon={Search} label="Search capsules" />
          <div className="mt-7">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">
              My ContextCapsules <ChevronDown className="h-3 w-3" />
            </p>
            <div className="mt-3 space-y-2">
              {['Middle East policy analysis', 'Sourceable board memo', 'Handover package'].map((capsule) => (
                <button
                  key={capsule}
                  type="button"
                  className={cn(
                    'block w-full truncate rounded-md px-1 py-1.5 text-left text-sm font-medium',
                    capsule === activeCapsuleName ? 'bg-black/5 text-slate-950' : 'text-slate-600 hover:bg-black/5',
                  )}
                >
                  {capsule}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-7">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">Recent runs <ChevronDown className="h-3 w-3" /></p>
            <div className="mt-3 space-y-2">
              {recentRuns.map((run) => (
                <div key={run.label} className="rounded-md px-1 py-1.5">
                  <p className="truncate text-sm font-medium text-slate-900">{run.label}</p>
                  <p className="truncate text-xs text-slate-500">{run.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-7">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">Memory & outputs <ChevronDown className="h-3 w-3" /></p>
            <div className="mt-3 space-y-1">
              <SidebarButton href={workspaceHref(surfaceMode, '/app/assistant')} icon={BookOpenText} label="Past conversations" />
              <SidebarButton href={workspaceHref(surfaceMode, '/app/workbench')} icon={FileText} label="Past artifacts" />
              <SidebarButton href={workspaceHref(surfaceMode, '/app/workbench')} icon={Upload} label="Documents" />
            </div>
          </div>
          <div className="mt-auto flex items-center gap-3 border-t border-black/10 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-xs font-semibold text-slate-700">GC</div>
            <div>
              <p className="text-sm font-medium text-slate-900">Giulio Catanzariti</p>
              <p className="text-xs text-slate-500">Capsule workspace</p>
            </div>
          </div>
        </aside>

        <div className="px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center">
            <p className="mt-8 flex items-center gap-2 text-sm font-medium text-slate-600">
              <Sparkles className="h-4 w-4 text-[#ff714d]" />
              PRAXIS runs policy agents from ContextCapsules
            </p>
            <h1 className="mt-8 text-center font-serif text-5xl font-semibold tracking-tight text-[#151515] sm:text-6xl">
              What policy work should PRAXIS run?
            </h1>

            <div
              className="mt-10 w-full max-w-5xl rounded-lg border border-black/10 bg-white/85 p-4 shadow-sm shadow-black/5 transition hover:-translate-y-0.5"
              data-testid="capsule-composition-rail"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                    <Layers3 className="h-4 w-4 text-sage" />
                    Active capsule composition
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {activeCapsules.map((capsule) => (
                      <span
                        key={capsule.id}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-slate-800"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{capsule.code}</span>
                        {capsule.label}
                        <button
                          type="button"
                          aria-label={`Remove ${capsule.label}`}
                          onClick={() => removeCapsule(capsule.id)}
                          className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-slate-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCapsuleSearchOpen((open) => !open)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <Search className="h-4 w-4" />
                    Search by name/code
                  </button>
                  <button
                    type="button"
                    onClick={() => COCKPIT_COMBINATION_RECIPES[0]?.inputs.forEach(addCapsule)}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-sm"
                  >
                    <Combine className="h-4 w-4" />
                    Combine
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedToolIds.map((toolId) => {
                  const tool = COCKPIT_TOOL_SUGGESTIONS.find((item) => item.id === toolId);
                  if (!tool) return null;
                  return (
                    <span key={tool.id} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {tool.label}
                    </span>
                  );
                })}
                <span className="rounded-md border border-sage/25 bg-sage/10 px-2 py-1 text-[11px] font-semibold text-sage">
                  {selectedArchetype.label}
                </span>
              </div>
              {capsuleSearchOpen ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3" data-testid="capsule-search-popup">
                  <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={capsuleQuery}
                      onChange={(event) => setCapsuleQuery(event.target.value)}
                      placeholder="Search capsules by name or code"
                      className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCapsules.map((capsule) => (
                      <button
                        key={capsule.id}
                        type="button"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('application/x-praxis-capsule', capsule.id)}
                        onClick={() => addCapsule(capsule.id)}
                        className="rounded-md border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-sm"
                      >
                        <span className="font-mono text-[10px] font-semibold text-slate-400">{capsule.code}</span>
                        <span className="mt-1 block text-sm font-semibold text-slate-900">{capsule.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{capsule.output}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 w-full max-w-4xl rounded-lg border border-black/10 bg-white shadow-lg shadow-black/5">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onContextMenu={handlePromptContextMenu}
                rows={composerExpanded ? 7 : 3}
                className={cn(
                  'w-full resize-none rounded-t-lg px-5 py-5 text-lg text-slate-900 outline-none placeholder:text-slate-400',
                  composerExpanded ? 'min-h-64' : 'min-h-28',
                )}
                placeholder="Describe the policy task, source question, memo, or responsibility"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <IconButton label="Attach document" icon={Paperclip} />
                  <IconButton label="Upload sources" icon={Upload} />
                  <IconButton label="Search policy sources" icon={Search} />
                  <IconButton label="Memo output" icon={FileText} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm font-semibold text-slate-700 sm:inline">Advanced</span>
                  <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 sm:inline">
                    approval-gated
                  </span>
                  <button
                    type="button"
                    onClick={() => setComposerExpanded((expanded) => !expanded)}
                    aria-label={composerExpanded ? 'Compact composer' : 'Expand composer'}
                    className="rounded-md p-2 text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-100"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Voice input" className="rounded-md p-2 text-slate-600 hover:bg-slate-100">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void launchRun()}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {selectedAgent.actionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-black/10 bg-white px-5 py-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Policy sources, documents, grounded search, and selected passages can be copied, checked, or sent to Memo Studio
                </span>
                {runState.href ? (
                  <Link href={runState.href} className="font-semibold text-diplomatic-blue">
                    Open output
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-black/10 bg-slate-50/70 px-5 py-2 text-[11px] text-slate-600">
                <label className="inline-flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
                  <Cpu className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-bold uppercase tracking-[0.12em] text-slate-500">Model</span>
                  <select
                    value={selectedModel}
                    onChange={(event) => setSelectedModel(event.target.value as ModelPreferenceValue)}
                    className="max-w-[13rem] bg-transparent font-mono text-[11px] font-semibold text-slate-900 focus:outline-none"
                    aria-label="PRAXIS cockpit model"
                  >
                    {ASK_RUNTIME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
                {surfaceMode === 'authenticated' ? (
                  <>
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">
                      {user?.isDemo ? 'demo account' : `${credits.toLocaleString()} tokens`}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">
                      {PRAXIS_USAGE_COPY.askCost}
                    </span>
                  </>
                ) : null}
                {ASK_ORCHESTRATION_OPTIONS.map((option) => (
                  <span
                    key={option.id}
                    className={cn(
                      'rounded-md border px-2 py-1 font-semibold',
                      option.status === 'live' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-500',
                    )}
                    title={option.summary}
                  >
                    {option.label}
                  </span>
                ))}
              </div>
              {textMenu ? (
                <div
                  className="fixed z-50 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-black/15"
                  style={{ left: textMenu.x, top: textMenu.y }}
                  data-testid="selected-text-actions"
                >
                  <p className="truncate px-2 py-1 text-xs font-semibold text-slate-500">{textMenu.text}</p>
                  {[
                    { action: 'copy' as const, Icon: Clipboard, label: 'Copy' },
                    { action: 'source' as const, Icon: Quote, label: 'Use as sourced text' },
                    { action: 'check' as const, Icon: FileSearch, label: 'Check against context' },
                    { action: 'memo' as const, Icon: FileText, label: 'Send to Memo Studio' },
                  ].map(({ action, Icon, label }) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => applyTextAction(action)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <p className={cn('mt-3 text-sm', runState.status === 'error' ? 'text-red-700' : 'text-slate-500')}>
              {runState.message}
            </p>

            <div className="mt-8 w-full max-w-4xl rounded-lg border border-black/10 bg-white/70 p-4" data-testid="recommended-agent-panel">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Recommended agent</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{selectedAgent.label}</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{selectedAgent.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAgentDrawerOpen((open) => !open)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                  >
                    Agents
                    <ChevronsRight className={cn('h-4 w-4 transition', agentDrawerOpen ? 'rotate-90' : '')} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void launchRun(selectedAgent)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#ff714d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#ec5f3d]"
                  >
                    {selectedAgent.actionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span>Intent: {policyAgentRunIntent(launcherState.selectedPolicyAgentId).replaceAll('_', ' ')}</span>
                <span>Output: {launcherState.outputDestination.replace('_', ' ')}</span>
                <span>Capsule: {launcherState.selectedCapsuleId}</span>
              </div>
            </div>

            {agentDrawerOpen ? (
              <div className="mt-6 w-full max-w-6xl rounded-lg border border-black/10 bg-white/75 p-4" data-testid="policy-agent-drawer">
                <nav className="flex flex-wrap items-center border-b border-black/10" aria-label="Policy agent categories">
                  {POLICY_NEED_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'px-4 py-3 text-left text-sm font-semibold transition hover:-translate-y-0.5',
                        activeTab === tab.id ? 'border-b-2 border-[#ff714d] text-[#ff714d]' : 'text-slate-500 hover:text-slate-900',
                      )}
                    >
                      <span className="block">{tab.label}</span>
                      <span className="block max-w-40 truncate text-[11px] font-medium text-slate-400">{tab.policyNeed}</span>
                    </button>
                  ))}
                </nav>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">Policy need</p>
                        <h3 className="mt-1 text-xl font-semibold text-slate-950">{activePolicyNeed.policyNeed}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{activePolicyNeed.intent}</p>
                      </div>
                      <span className="rounded-md border border-sage/20 bg-sage/10 px-2 py-1 text-xs font-semibold text-sage">
                        {activeCapsules.length} capsules
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {visibleAgents.map((agent) => (
                        <PolicyAgentCard
                          key={agent.id}
                          agent={agent}
                          selected={selectedAgentId === agent.id}
                          onSelect={() => setSelectedAgentId(agent.id)}
                          onRun={() => void launchRun(agent)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <section className="rounded-lg border border-slate-200 bg-white p-4" data-testid="canonical-user-types">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-500">Canonical user types</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{selectedArchetype.label}</p>
                        </div>
                        <span className="rounded-md border border-slate-200 px-2 py-1 font-mono text-[10px] text-slate-500">10</span>
                      </div>
                      <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1">
                        {COCKPIT_USER_ARCHETYPES.slice(0, 10).map((archetype) => (
                          <button
                            key={archetype.id}
                            type="button"
                            draggable
                            onDragStart={(event) => event.dataTransfer.setData('application/x-praxis-user', archetype.id)}
                            onClick={() => setSelectedArchetypeId(archetype.id)}
                            className={cn(
                              'rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm',
                              selectedArchetypeId === archetype.id ? 'border-[#ff714d]/50 bg-[#fff3ef]' : 'border-slate-200 bg-slate-50 hover:bg-white',
                            )}
                          >
                            <span className="block text-sm font-semibold text-slate-900">{archetype.label}</span>
                            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{archetype.detail}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4" data-testid="suggested-capsule-tools">
                      <p className="text-xs font-semibold uppercase text-slate-500">Suggested tools</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {suggestedTools.map((tool) => (
                          <button
                            key={tool.id}
                            type="button"
                            draggable
                            onDragStart={(event) => event.dataTransfer.setData('application/x-praxis-tool', tool.id)}
                            onClick={() => toggleTool(tool.id)}
                            className={cn(
                              'rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm',
                              selectedToolIds.includes(tool.id) ? 'border-sage/40 bg-sage/10' : 'border-slate-200 bg-slate-50 hover:bg-white',
                            )}
                          >
                            <span className="block text-sm font-semibold text-slate-900">{tool.label}</span>
                            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{tool.produces}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4" data-testid="capsule-combination-recipes">
                      <p className="text-xs font-semibold uppercase text-slate-500">Capsule recipes</p>
                      <div className="mt-3 space-y-2">
                        {COCKPIT_COMBINATION_RECIPES.slice(0, 4).map((recipe) => (
                          <button
                            key={recipe.label}
                            type="button"
                            onClick={() => recipe.inputs.forEach(addCapsule)}
                            className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                          >
                            <span className="block text-sm font-semibold text-slate-900">{recipe.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">{recipe.output}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </section>
  );
}

function workspaceHref(surfaceMode: HomeSurfaceMode, href: string): string {
  if (surfaceMode === 'authenticated') return href;
  return `/login?mode=signup&redirect=${encodeURIComponent(href)}`;
}

function SidebarButton({ href, icon: Icon, label, active = false }: { href: string; icon: typeof Search; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'mb-1 flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium',
        active ? 'bg-black/5 text-slate-950' : 'text-slate-700 hover:bg-black/5',
      )}
    >
      <Icon className="h-5 w-5 text-slate-500" />
      {label}
    </Link>
  );
}

function IconButton({ label, icon: Icon }: { label: string; icon: typeof Search }) {
  return (
    <button type="button" title={label} aria-label={label} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50">
      <Icon className="h-4 w-4" />
    </button>
  );
}

function PolicyAgentCard({
  agent,
  selected,
  onSelect,
  onRun,
}: {
  agent: PolicyAgentDefinition;
  selected: boolean;
  onSelect: () => void;
  onRun: () => void;
}) {
  return (
    <article
      className={cn(
        'flex min-h-[230px] flex-col justify-between rounded-lg border bg-transparent p-4 transition',
        selected ? 'border-[#ff714d]/60 bg-white/75 shadow-sm shadow-black/5' : 'border-transparent hover:border-black/10 hover:bg-white/60',
      )}
    >
      <button type="button" onClick={onSelect} className="text-left">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{agent.label}</h3>
          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">{agent.readiness}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{agent.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {agent.requiredCores.slice(0, 4).map((core) => (
            <span key={core} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-600">
              <CheckCircle2 className="h-3 w-3 text-sage" />
              {core}
            </span>
          ))}
        </div>
      </button>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
          <BookOpenText className="h-3.5 w-3.5" />
          {agent.outputDestination.replace('_', ' ')}
        </span>
        <button type="button" onClick={onRun} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-[#ff714d]">
          {agent.actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
