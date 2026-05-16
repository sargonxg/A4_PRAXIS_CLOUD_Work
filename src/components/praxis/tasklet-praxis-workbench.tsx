'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  CalendarClock,
  ChevronDown,
  FileCheck2,
  FileText,
  FolderKanban,
  Loader2,
  Mic,
  Monitor,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UsersRound,
  WandSparkles,
} from 'lucide-react';
import { AccountProfileButton } from '@/components/app/account-profile-button';
import { ASK_RUNTIME_OPTIONS, getAskRuntimeOption } from '@/lib/ai/ask-runtime-catalog';
import type { ModelPreferenceValue } from '@/lib/ai/model-preferences';
import {
  PENDING_POLICY_AGENT_ID_KEY,
  PENDING_TASKLET_PROMPT_KEY,
  policyAgentLoginHref,
  policyAgentRunIntent,
  PRAXIS_POLICY_AGENTS,
  type HomeSurfaceMode,
  type PolicyAgentDefinition,
} from '@/lib/product/policy-agents';
import {
  COCKPIT_CAPSULE_LIBRARY,
  COCKPIT_TOOL_SUGGESTIONS,
  COCKPIT_USER_ARCHETYPES,
  POLICY_NEED_TABS,
  findCapsuleTemplate,
} from '@/lib/product/cockpit-composition';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';

type TaskletPraxisWorkbenchProps = {
  mode: HomeSurfaceMode | 'app';
  activeCapsuleName?: string;
  capsuleId?: string;
  recentRuns?: Array<{ label: string; detail: string; status: string }>;
  className?: string;
};

type PolicyNeedTabId = (typeof POLICY_NEED_TABS)[number]['id'];
type ChatMessage = { role: 'user' | 'assistant'; text: string };
type ActiveCapsuleChip = { id: string; label: string; code: string };

const defaultRecentRuns = [
  { label: 'Weekly Middle East Analysis', detail: 'Capsule discussion', status: 'active' },
  { label: 'Source check', detail: 'Evidence gaps', status: 'review' },
  { label: 'Options memo', detail: 'Drafting context', status: 'draft' },
];

const actionIcons = [
  { label: 'Attach document', icon: Paperclip, kind: 'upload' },
  { label: 'Upload sources', icon: Upload, kind: 'upload' },
  { label: 'Connectors', icon: Monitor, kind: 'connectors' },
  { label: 'Improve prompt', icon: WandSparkles, kind: 'improve' },
] as const;

const categoryIcon: Record<PolicyNeedTabId, typeof Bot> = {
  analysis: Bot,
  monitoring: CalendarClock,
  review: FileCheck2,
  handover: FileText,
  capsules: FolderKanban,
};

export function TaskletPraxisWorkbench({
  mode,
  activeCapsuleName = 'Weekly Middle East Analysis',
  capsuleId = 'default',
  recentRuns = defaultRecentRuns,
  className,
}: TaskletPraxisWorkbenchProps) {
  const { user } = useAuth();
  const surfaceMode: HomeSurfaceMode = mode === 'app' ? 'authenticated' : mode;
  const isAuthenticated = surfaceMode === 'authenticated';
  const [prompt, setPrompt] = useState('Draft a sourced options memo from the active capsule.');
  const [activeTab, setActiveTab] = useState<PolicyNeedTabId>('analysis');
  const [selectedAgentId, setSelectedAgentId] = useState(PRAXIS_POLICY_AGENTS[0]?.id ?? 'research-memo');
  const [selectedUserTypeId, setSelectedUserTypeId] = useState(COCKPIT_USER_ARCHETYPES[0]?.id ?? 'user-1');
  const [selectedModel, setSelectedModel] = useState<ModelPreferenceValue>(ASK_RUNTIME_OPTIONS[0].id);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(['ask-praxis', 'sourceability', 'memo-drafter']);
  const [currentCapsuleId, setCurrentCapsuleId] = useState(capsuleId);
  const [activeCapsules, setActiveCapsules] = useState<ActiveCapsuleChip[]>([{ id: capsuleId, label: activeCapsuleName, code: 'LITE' }]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('Ask PRAXIS can answer directly or choose the right tool from your capsule.');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedAgent = PRAXIS_POLICY_AGENTS.find((agent) => agent.id === selectedAgentId) ?? PRAXIS_POLICY_AGENTS[0]!;
  const selectedRuntime = getAskRuntimeOption(selectedModel);
  const selectedUserType = COCKPIT_USER_ARCHETYPES.find((item) => item.id === selectedUserTypeId) ?? COCKPIT_USER_ARCHETYPES[0]!;
  const activePolicyNeed = POLICY_NEED_TABS.find((tab) => tab.id === activeTab) ?? POLICY_NEED_TABS[0]!;
  const visibleAgents = PRAXIS_POLICY_AGENTS.filter((agent) => agent.category === activeTab || activeTab === 'capsules');
  const toolCards = COCKPIT_TOOL_SUGGESTIONS.filter((tool) => (
    activePolicyNeed.toolIds.includes(tool.id) || selectedToolIds.includes(tool.id) || selectedUserType.suggestedToolIds.includes(tool.id)
  )).slice(0, 6);
  const capsules = COCKPIT_CAPSULE_LIBRARY.slice(0, 6);
  const conversationThreadId = `tasklet-${currentCapsuleId}`;

  useEffect(() => {
    setActiveCapsules((current) => {
      const first = current[0];
      if (first?.id === capsuleId && first.label === activeCapsuleName) return current;
      setCurrentCapsuleId(capsuleId);
      return [{ id: capsuleId, label: activeCapsuleName, code: 'LITE' }, ...current.slice(1)];
    });
  }, [activeCapsuleName, capsuleId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const pendingPrompt = window.localStorage.getItem(PENDING_TASKLET_PROMPT_KEY);
      const pendingAgentId = window.localStorage.getItem(PENDING_POLICY_AGENT_ID_KEY);
      if (pendingPrompt?.trim()) setPrompt(pendingPrompt.trim());
      if (pendingAgentId && PRAXIS_POLICY_AGENTS.some((agent) => agent.id === pendingAgentId)) {
        setSelectedAgentId(pendingAgentId);
      }
    } catch {
      // The public-to-auth handoff is a convenience only.
    }
  }, [isAuthenticated]);

  const recentLabel = isAuthenticated ? 'Recent' : 'Examples';
  function sendPublicToLogin(nextPrompt: string, agent: PolicyAgentDefinition = selectedAgent) {
    window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, nextPrompt);
    window.localStorage.setItem(PENDING_POLICY_AGENT_ID_KEY, agent.id);
    window.location.href = policyAgentLoginHref(agent.id, nextPrompt);
  }

  function buildChatPrompt(agent: PolicyAgentDefinition, cleanPrompt: string): string {
    const capsuleStack = activeCapsules.map((capsule) => `${capsule.label} (${capsule.id})`).join(', ');
    return [
      cleanPrompt,
      '',
      `Selected policy tool: ${agent.label}`,
      `Tool intent: ${policyAgentRunIntent(agent.id).replaceAll('_', ' ')}`,
      `Selected user type: ${selectedUserType.label}`,
      `Selected tools: ${selectedToolIds.join(', ') || 'none'}`,
      `Active ContextCapsule Lite stack: ${capsuleStack}`,
      `Conversation thread: ${conversationThreadId}`,
      '',
      'Behave like a normal chat assistant first. Answer directly when enough context exists. If a tool, upload, connector, source check, memo, or capsule update would help, decide that yourself and explain the next step plainly.',
    ].join('\n');
  }

  async function sendToPraxis(agent: PolicyAgentDefinition = selectedAgent, overridePrompt?: string) {
    const cleanPrompt = (overridePrompt ?? prompt).trim();
    if (!cleanPrompt || isStreaming) return;
    if (!isAuthenticated) {
      sendPublicToLogin(cleanPrompt, agent);
      return;
    }

    setIsStreaming(true);
    setStatus('PRAXIS is reading the active capsule and conversation memory...');
    const userMessage: ChatMessage = { role: 'user', text: cleanPrompt };
    const enrichedPrompt = buildChatPrompt(agent, cleanPrompt);
    setChatMessages((current) => [...current, userMessage, { role: 'assistant', text: '' }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { ...userMessage, text: enrichedPrompt }].map((message) => ({
            role: message.role,
            content: message.text,
          })),
          capsuleId: currentCapsuleId,
          threadId: conversationThreadId,
          currentToolId: agent.id,
          currentPath: '/app/dashboard',
          activeContextStack: {
            capsuleId: currentCapsuleId,
            capsuleIds: activeCapsules.map((capsule) => capsule.id),
            selectedToolIds,
            selectedUserTypeId,
            selectedPolicyAgentId: agent.id,
          },
          aiSettings: {
            provider: 'vertex',
            model: selectedRuntime.id,
            analysisDepth: selectedRuntime.mode === 'research_memo' ? 'deep' : 'standard',
          },
        }),
      });
      if (!response.ok || !response.body) throw new Error(`${response.status} ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (!parsed) continue;
          answer += parsed;
          setChatMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: answer };
            return next;
          });
        }
      }
      setStatus('Conversation saved to this user and capsule thread.');
      try {
        window.localStorage.removeItem(PENDING_TASKLET_PROMPT_KEY);
        window.localStorage.removeItem(PENDING_POLICY_AGENT_ID_KEY);
      } catch {
        // Non-critical cleanup.
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      setStatus(`Ask PRAXIS failed: ${message}`);
      setChatMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: 'I could not complete that request. Check authentication and model access, then try again.' };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  async function uploadDocument(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!isAuthenticated) {
      sendPublicToLogin(prompt.trim() || `Use ${file.name} as context.`);
      return;
    }
    setStatus(`Uploading ${file.name}...`);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('situationId', currentCapsuleId);
      const response = await fetch('/api/documents/upload', { method: 'POST', body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'upload failed');
      setPrompt((current) => `${current.trim()}\n\nUse uploaded document "${file.name}" as context.`.trim());
      setStatus(`${file.name} attached to the active capsule.`);
    } catch (err) {
      setStatus(err instanceof Error ? `Upload failed: ${err.message}` : 'Upload failed.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleAction(kind: (typeof actionIcons)[number]['kind']) {
    if (kind === 'upload') {
      fileInputRef.current?.click();
      return;
    }
    if (kind === 'connectors') {
      if (!isAuthenticated) sendPublicToLogin(prompt.trim() || 'Connect sources to PRAXIS.');
      else window.location.href = '/app/settings/api-keys';
      return;
    }
    setPrompt((current) => `Improve this PRAXIS request and ask any missing context question: ${current.trim()}`);
  }

  function tryTool(agent: PolicyAgentDefinition) {
    setSelectedAgentId(agent.id);
    const nextPrompt = `${prompt.trim() || 'Help me with this policy question.'}\n\nUse ${agent.label} if it helps.`;
    void sendToPraxis(agent, nextPrompt);
  }

  async function createCapsuleLite(label?: string, seed?: Partial<ActiveCapsuleChip>) {
    if (!isAuthenticated) {
      sendPublicToLogin(prompt.trim() || 'Build a ContextCapsule Lite.');
      return null;
    }
    const response = await fetch('/api/context/capsules', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        label: label ?? `ContextCapsule Lite: ${selectedUserType.label}`,
        scope: 'user',
        coreRefs: {
          toolCoreIds: selectedToolIds,
          objectiveCoreIds: [selectedAgent.id],
          productCoreIds: [activeTab],
        },
        activeForSituationIds: [currentCapsuleId],
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.capsule?.capsuleId) {
      throw new Error(payload?.error ?? 'capsule creation failed');
    }
    const created = {
      id: payload.capsule.capsuleId as string,
      label: payload.capsule.label as string,
      code: seed?.code ?? 'LITE',
    };
    setCurrentCapsuleId(created.id);
    setActiveCapsules((current) => [created, ...current.filter((item) => item.id !== created.id).slice(0, 4)]);
    setStatus(`${created.label} created and selected.`);
    return created;
  }

  async function combineCapsuleLiteStack(capsulesToCombine: ActiveCapsuleChip[]) {
    if (!isAuthenticated || capsulesToCombine.length < 2) return;
    const response = await fetch('/api/context/capsules', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'combine',
        capsuleIds: capsulesToCombine.map((item) => item.id),
        label: `Combined ContextCapsule Lite: ${capsulesToCombine.slice(0, 2).map((item) => item.label).join(' + ')}`,
        scope: 'user',
        activateForSituationIds: [currentCapsuleId],
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.capsule?.capsuleId) return;
    const combined = {
      id: payload.capsule.capsuleId as string,
      label: payload.capsule.label as string,
      code: 'COMBINED',
    };
    setCurrentCapsuleId(combined.id);
    setActiveCapsules([combined, ...capsulesToCombine.slice(0, 4)]);
    setStatus(`${combined.label} is now the active ContextCapsule Lite.`);
  }

  async function addCapsule(id: string) {
    const capsule = findCapsuleTemplate(id);
    if (!capsule) return;
    if (!isAuthenticated) {
      sendPublicToLogin(capsule.prompt || 'Build this ContextCapsule Lite.');
      return;
    }
    try {
      const created = await createCapsuleLite(`ContextCapsule Lite: ${capsule.label}`, { code: capsule.code });
      if (!created) return;
      const next = [...activeCapsules, created].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 5);
      setActiveCapsules(next);
      if (next.length >= 2) await combineCapsuleLiteStack(next);
    } catch (err) {
      setStatus(err instanceof Error ? `Capsule failed: ${err.message}` : 'Capsule failed.');
    }
  }

  function startVoiceInput() {
    type SpeechRecognitionConstructor = new () => {
      lang: string;
      interimResults: boolean;
      onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
      onerror: (() => void) | null;
      start: () => void;
    };
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setStatus('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript;
      if (text) setPrompt((current) => `${current.trim()} ${text}`.trim());
    };
    recognition.onerror = () => setStatus('Voice input could not start. Check microphone permissions.');
    recognition.start();
    setStatus('Listening...');
  }

  return (
    <section className={cn('min-h-screen bg-[#f3f3f2] text-[#1f1f1f]', className)} data-testid="tasklet-praxis-workbench">
      <div className="grid min-h-screen lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r border-black/10 bg-[#e7e7e6] px-4 py-6 lg:flex lg:flex-col">
          <Link href={isAuthenticated ? '/app/dashboard' : '/'} className="mb-6 flex items-center gap-3 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sage text-white">P</span>
            PRAXIS
          </Link>
          <SidebarButton icon={Plus} label="New capsule" onClick={() => addCapsule(capsules[0]?.id ?? capsuleId)} active />
          <SidebarButton icon={Search} label="Search capsules" onClick={() => setActiveTab('capsules')} />
          <div className="mt-8">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">{recentLabel} <ChevronDown className="h-3 w-3" /></p>
            <div className="mt-3 space-y-2">
              {recentRuns.slice(0, 5).map((run) => (
                <button key={run.label} type="button" className="block w-full truncate rounded-md px-1 py-1.5 text-left text-sm font-medium text-slate-800 hover:bg-black/5">
                  {run.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">Capsules <ChevronDown className="h-3 w-3" /></p>
            <div className="mt-3 space-y-2">
              {activeCapsules.map((capsule) => (
                <button key={capsule.id} type="button" className="block w-full truncate rounded-md px-1 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-black/5">
                  {capsule.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-auto border-t border-black/10 pt-4">
            {isAuthenticated ? (
              <AccountProfileButton />
            ) : (
              <Link href="/login?mode=signup" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-black/5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-xs font-semibold text-slate-700">P</span>
                <span>
                  <span className="block text-sm font-semibold">Sign in</span>
                  <span className="block text-xs text-slate-500">Save private context</span>
                </span>
              </Link>
            )}
          </div>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10">
          <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link href={isAuthenticated ? '/app/dashboard' : '/'} className="flex items-center gap-2 text-lg font-semibold lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sage text-white">P</span>
              PRAXIS
            </Link>
            <nav className="ml-auto hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
              <Link href="/learn" className="hover:text-slate-900">Learn</Link>
              <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
              <Link href="/release-notes" className="hover:text-slate-900">Release notes</Link>
            </nav>
            <div className="flex items-center gap-2">
              {isAuthenticated ? <AccountProfileButton compact /> : <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-white">Sign in</Link>}
            </div>
          </header>

          <div className="mx-auto mt-20 flex max-w-6xl flex-col items-center">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Sparkles className="h-4 w-4 text-[#ff714d]" />
              PRAXIS uses your ContextCapsule Lite, documents, and policy tools
            </p>
            <h1 className="mt-8 text-center font-serif text-5xl font-semibold tracking-tight text-[#151515] sm:text-6xl">
              What can PRAXIS do for you?
            </h1>

            <div className="mt-8 inline-flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 text-sm font-semibold text-slate-500">
              {isAuthenticated ? (user?.subscription || 'Free plan') : 'Free plan'}
              <span className="text-slate-300">·</span>
              <Link href={isAuthenticated ? '/app/billing/upgrade' : '/pricing'} className="text-sage">Upgrade</Link>
            </div>

            <div className="mt-6 w-full max-w-5xl rounded-lg border border-black/10 bg-white shadow-sm shadow-black/5" data-testid="praxis-main-composer">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                placeholder="Describe a task or responsibility"
                className="min-h-36 w-full resize-none rounded-t-lg px-6 py-6 text-xl text-slate-900 outline-none placeholder:text-slate-400"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  {actionIcons.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      title={action.label}
                      aria-label={action.label}
                      onClick={() => handleAction(action.kind)}
                      className="rounded-md border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-50"
                    >
                      <action.icon className="h-4 w-4" />
                    </button>
                  ))}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.html"
                    className="hidden"
                    onChange={(event) => void uploadDocument(event.target.files)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedUserTypeId}
                    onChange={(event) => setSelectedUserTypeId(event.target.value)}
                    aria-label="User type"
                    className="hidden max-w-48 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700 outline-none md:block"
                  >
                    {COCKPIT_USER_ARCHETYPES.slice(0, 8).map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedModel}
                    onChange={(event) => setSelectedModel(event.target.value as ModelPreferenceValue)}
                    aria-label="Model"
                    className="hidden max-w-44 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700 outline-none sm:block"
                  >
                    {ASK_RUNTIME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <button type="button" aria-label="Voice input" onClick={startVoiceInput} className="rounded-md p-2.5 text-slate-600 hover:bg-slate-100">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!prompt.trim() || isStreaming}
                    onClick={() => void sendToPraxis()}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    aria-label="Send to PRAXIS"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-black/10 bg-white px-5 py-2 text-sm text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                <span>{status}</span>
              </div>
            </div>

            {chatMessages.length ? (
              <section className="mt-5 w-full max-w-5xl space-y-3 rounded-lg border border-black/10 bg-white/80 p-4" data-testid="praxis-chat-thread">
                {chatMessages.map((message, index) => (
                  <article
                    key={`${message.role}-${index}`}
                    className={cn(
                      'rounded-lg px-4 py-3 text-sm leading-6',
                      message.role === 'user' ? 'ml-auto max-w-[82%] bg-slate-950 text-white' : 'mr-auto max-w-[88%] bg-slate-100 text-slate-900',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.text || 'Reading context...'}</p>
                  </article>
                ))}
              </section>
            ) : null}

            <section className="mt-12 w-full max-w-5xl" data-testid="tasklet-tool-cards">
              <nav className="flex flex-wrap justify-center gap-8 border-b border-black/10 text-lg font-semibold text-slate-400" aria-label="Tool categories">
                {POLICY_NEED_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'border-b-2 px-1 pb-4 transition',
                      activeTab === tab.id ? 'border-[#ff714d] text-[#ff714d]' : 'border-transparent hover:text-slate-700',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {activeTab === 'capsules' ? (
                <div className="mt-10 grid gap-x-12 gap-y-14 md:grid-cols-3" data-testid="tasklet-capsule-cards">
                  {capsules.map((capsule) => (
                    <article key={capsule.id} className="min-h-40">
                      <FolderKanban className="mb-4 h-5 w-5 text-slate-400" />
                      <h3 className="text-lg font-semibold text-slate-800">{capsule.label}</h3>
                      <p className="mt-4 text-sm leading-6 text-slate-500">{capsule.prompt}</p>
                      <button type="button" onClick={() => addCapsule(capsule.id)} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#ff714d]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Add context
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-10 grid gap-x-12 gap-y-14 md:grid-cols-3">
                  {visibleAgents.slice(0, 3).map((agent) => (
                    <ToolCard key={agent.id} agent={agent} active={selectedAgentId === agent.id} onTry={() => tryTool(agent)} />
                  ))}
                  {toolCards.slice(0, 3).map((tool) => {
                    const Icon = categoryIcon[activeTab] ?? Bot;
                    return (
                      <article key={tool.id} className="min-h-40">
                        <Icon className="mb-4 h-5 w-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-800">{tool.label}</h3>
                        <p className="mt-4 text-sm leading-6 text-slate-500">{tool.detail}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedToolIds((current) => current.includes(tool.id) ? current : [...current, tool.id]);
                            const nextPrompt = `${prompt.trim() || 'Help me with this policy question.'}\n\nUse ${tool.label} if it helps.`;
                            void sendToPraxis(selectedAgent, nextPrompt);
                          }}
                          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#ff714d]"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Try it
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </section>
  );
}

function SidebarButton({ icon: Icon, label, onClick, active = false }: { icon: typeof Search; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium',
        active ? 'bg-black/5 text-slate-950' : 'text-slate-700 hover:bg-black/5',
      )}
    >
      <Icon className="h-5 w-5 text-slate-500" />
      {label}
    </button>
  );
}

function ToolCard({ agent, active, onTry }: { agent: PolicyAgentDefinition; active: boolean; onTry: () => void }) {
  return (
    <article className={cn('min-h-40', active ? 'text-slate-950' : '')}>
      <UsersRound className="mb-4 h-5 w-5 text-slate-400" />
      <h3 className="text-lg font-semibold text-slate-800">{agent.label}</h3>
      <p className="mt-4 text-sm leading-6 text-slate-500">{agent.description}</p>
      <button type="button" onClick={onTry} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#ff714d]">
        <Sparkles className="h-3.5 w-3.5" />
        Try it
      </button>
    </article>
  );
}
