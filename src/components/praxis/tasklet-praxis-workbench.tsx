'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  ChevronsRight,
  FileText,
  FolderKanban,
  Mic,
  Paperclip,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
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
import { cn } from '@/lib/utils/cn';

type TaskletPraxisWorkbenchProps = {
  mode: HomeSurfaceMode | 'app';
  activeCapsuleName?: string;
  capsuleId?: string;
  recentRuns?: Array<{ label: string; detail: string; status: string }>;
  className?: string;
};

const tabs = ['Analysis', 'Monitoring', 'Review', 'Handover', 'Capsules'] as const;

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
  const surfaceMode: HomeSurfaceMode = mode === 'app' ? 'authenticated' : mode;
  const [prompt, setPrompt] = useState('Draft a sourced options memo from the active capsule.');
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Analysis');
  const [selectedAgentId, setSelectedAgentId] = useState('research-memo');
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [runState, setRunState] = useState<{ status: 'idle' | 'running' | 'ready' | 'error'; message: string; href?: string }>({
    status: 'idle',
    message: surfaceMode === 'public' ? 'Sign in to run this capsule.' : 'Ready to create a capsule run.',
  });

  const visibleAgents = useMemo(() => {
    const category = activeTab.toLowerCase();
    if (activeTab === 'Capsules') return PRAXIS_POLICY_AGENTS;
    return PRAXIS_POLICY_AGENTS.filter((agent) => agent.category === category);
  }, [activeTab]);
  const selectedAgent = PRAXIS_POLICY_AGENTS.find((agent) => agent.id === selectedAgentId) ?? PRAXIS_POLICY_AGENTS[0]!;
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
          approvalLevel: agent.approvalLevel,
          taskletSurface: true,
        },
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setRunState({
        status: 'error',
        message: body?.error === 'Agent run ledger is not configured'
          ? 'Run ledger is not configured in this environment.'
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
              {surfaceMode === 'public' ? 'Example capsules' : 'My ContextCapsules'} <ChevronDown className="h-3 w-3" />
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
          {surfaceMode === 'authenticated' ? (
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
          ) : (
            <div className="mt-7 rounded-lg border border-black/10 bg-white/60 p-3">
              <p className="text-sm font-semibold text-slate-950">Use your own sources</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Create a private capsule, attach documents, and keep outputs in the workspace.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/login" className="rounded-md border border-slate-300 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                  Sign in
                </Link>
                <Link href="/login?mode=signup" className="rounded-md bg-slate-950 px-2 py-2 text-center text-xs font-semibold text-white">
                  Sign up
                </Link>
              </div>
            </div>
          )}
          <div className="mt-auto flex items-center gap-3 border-t border-black/10 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-xs font-semibold text-slate-700">GC</div>
            <div>
              <p className="text-sm font-medium text-slate-900">{surfaceMode === 'public' ? 'Public preview' : 'Giulio Catanzariti'}</p>
              <p className="text-xs text-slate-500">{surfaceMode === 'public' ? 'Sign in to save' : 'Capsule workspace'}</p>
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
            <div className="mt-6 rounded-md bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600">
              Active capsule <span className="px-2 text-slate-300">•</span><span className="text-sage">{activeCapsuleName}</span>
            </div>

            <div className="mt-6 w-full max-w-4xl rounded-lg border border-black/10 bg-white shadow-lg shadow-black/5">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={3}
                className="min-h-28 w-full resize-none rounded-t-lg px-5 py-5 text-lg text-slate-900 outline-none placeholder:text-slate-400"
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
                  Policy sources, documents, grounded search, and internal capsule tools
                </span>
                {runState.href ? (
                  <Link href={runState.href} className="font-semibold text-diplomatic-blue">
                    Open output
                  </Link>
                ) : null}
              </div>
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
                  {surfaceMode === 'authenticated' ? (
                    <button
                      type="button"
                      onClick={() => setAgentDrawerOpen((open) => !open)}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                    >
                      Agents
                      <ChevronsRight className={cn('h-4 w-4 transition', agentDrawerOpen ? 'rotate-90' : '')} />
                    </button>
                  ) : null}
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

            {surfaceMode === 'authenticated' && agentDrawerOpen ? (
              <div className="mt-6 w-full max-w-6xl rounded-lg border border-black/10 bg-white/75 p-4" data-testid="policy-agent-drawer">
                <nav className="flex flex-wrap items-center border-b border-black/10" aria-label="Policy agent categories">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-4 py-3 text-sm font-semibold',
                        activeTab === tab ? 'border-b-2 border-[#ff714d] text-[#ff714d]' : 'text-slate-500 hover:text-slate-900',
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            ) : null}

            {surfaceMode === 'public' ? (
              <div className="mt-16 w-full max-w-5xl border-t border-black/10 pt-8" data-testid="public-contextcapsule-explainer">
                <div className="grid gap-5 md:grid-cols-3">
                  {[
                    ['ContextCapsules', 'Reusable policy context with user, situation, source, time, output, and handover cores.'],
                    ['Source receipts', 'Attached documents and searches stay visible beside the draft instead of disappearing into chat.'],
                    ['Outputs', 'Memo Studio, Canvas, Library, and Handover receive the work from the active capsule.'],
                  ].map(([title, detail]) => (
                    <article key={title} className="rounded-lg border border-black/10 bg-white/60 p-4">
                      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
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
