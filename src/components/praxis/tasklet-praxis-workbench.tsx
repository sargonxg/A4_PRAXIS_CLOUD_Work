'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowUp,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  Clipboard,
  Circle,
  Copy,
  Database,
  FileText,
  FolderKanban,
  HardDrive,
  Library,
  Loader2,
  Mail,
  Mic,
  Monitor,
  Paperclip,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
  X,
  type LucideIcon,
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
  POLICY_NEED_TABS,
  findCapsuleTemplate,
} from '@/lib/product/cockpit-composition';
import {
  CAPSULE_CONNECTOR_REGISTRY,
  POLICY_TEAM_CATEGORIES,
  categoryTagsForPolicyTeam,
  getPolicyTeamCategory,
  policyTeamCategoryForTags,
  type CapsuleConnectorDefinition,
  type PolicyTeamCategory,
} from '@/lib/product/context-capsules';
import { recommendCapsuleTools, type CapsuleToolRecommendation } from '@/lib/tools/recommend';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';

type TaskletPraxisWorkbenchProps = {
  mode: HomeSurfaceMode | 'app';
  activeCapsuleName?: string;
  capsuleId?: string;
  focusedRunId?: string;
  recentRuns?: Array<{ label: string; detail: string; status: string }>;
  className?: string;
};

type PolicyNeedTabId = (typeof POLICY_NEED_TABS)[number]['id'];
type ChatMessage = { role: 'user' | 'assistant'; text: string };
type CapsuleRole = 'user' | 'situation' | 'tool' | 'output';
type CapsuleDetailTab = 'build' | 'connect' | 'retrieve' | 'agents';
type RepositoryDocument = {
  id: string;
  title: string;
  fileType: string;
  size: number;
  status: string;
  uploadedAt: string;
  entityCount?: number;
  chunkCount?: number;
};
type AgentRunSummary = {
  runId: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
  capsuleId: string;
  createdAt: string;
  updatedAt: string;
  objective: string;
  policyAgentId?: string | null;
  policyAgentLabel?: string | null;
  outputDestination?: 'memo_studio' | 'canvas' | 'library' | 'handover' | null;
  outputHref?: string | null;
  readiness?: PolicyAgentDefinition['readiness'] | null;
  riskLevel?: PolicyAgentDefinition['riskLevel'] | null;
};
type AgentRunEventSummary = {
  id: string;
  eventType: string;
  message?: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
};
type AgentRunDetail = {
  run: AgentRunSummary;
  toolCalls?: unknown[];
  approvals?: unknown[];
};
type SpanTargetCore = 'sourceability' | 'temporality' | 'causality' | 'human-friction' | 'rules' | 'open-question';
type CapsuleCoreRefs = {
  sourceCoreIds?: string[];
  documentCoreIds?: string[];
  toolCoreIds?: string[];
  objectiveCoreIds?: string[];
  outputCoreIds?: string[];
  productCoreIds?: string[];
};
type PraxisCapsuleSummary = {
  capsuleId: string;
  label: string;
  scope: 'user' | 'situation' | 'team';
  version: number;
  updatedAt: string;
  archivedAt?: string | null;
  activeForSituationIds?: string[];
  coreRefs: CapsuleCoreRefs;
  community?: { tags?: string[]; favorite?: boolean };
  trust?: { level?: string; score?: number; label?: string };
};
type ActiveCapsuleChip = {
  id: string;
  label: string;
  code: string;
  role: CapsuleRole;
  toolId?: string;
  templateId?: string;
};

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

const policyNextActions = [
  { label: 'Ask', prompt: 'Ask the active capsule for a concise situation read.' },
  { label: 'Source-check', prompt: 'Review the active capsule for weak claims, missing citations, and stale assumptions.' },
  { label: 'Draft memo', prompt: 'Draft a short options memo from the active capsule with findings, caveats, and next actions.' },
  { label: 'Handover', prompt: 'Prepare a handover note from this capsule for another policy team member.' },
] as const;

const capsuleActionPrompts = [
  { label: 'Find missing sources', prompt: 'Find missing sources for the active capsule. Return a source gap list, search plan, and priority sources to add.' },
  { label: 'Check stale claims', prompt: 'Check the active capsule for stale claims, outdated dates, old assumptions, and decision deadlines.' },
  { label: 'Map causality', prompt: 'Map the causal claims in this capsule. Separate timeline facts, triggers, lag effects, alternatives, and indicators.' },
  { label: 'Map human friction', prompt: 'Map the human friction in this capsule: incentives, fears, blockers, informal authority, approvals, and fatigue.' },
  { label: 'Red-team review', prompt: 'Red-team the active capsule and draft. Identify unsupported claims, missing actors, weak assumptions, and decision risks.' },
] as const;

const spanTargets: Array<{ id: SpanTargetCore; label: string; note: string }> = [
  { id: 'sourceability', label: 'Sourceability', note: 'Treat this selected text as a source/evidence item.' },
  { id: 'temporality', label: 'Temporality', note: 'Attach this selected text to the timeline or stale-assumption layer.' },
  { id: 'causality', label: 'Causality', note: 'Attach this selected text as a causal claim, trigger, or indicator.' },
  { id: 'human-friction', label: 'Human friction', note: 'Attach this selected text to incentives, blockers, approvals, or resistance.' },
  { id: 'rules', label: 'Rules', note: 'Attach this selected text to rules, specs, standards, or constraints.' },
  { id: 'open-question', label: 'Open question', note: 'Track this selected text as an unresolved issue.' },
] as const;

const capsuleRoles: Array<{ id: CapsuleRole; label: string }> = [
  { id: 'situation', label: 'Situation' },
  { id: 'user', label: 'User' },
  { id: 'tool', label: 'Tool' },
  { id: 'output', label: 'Output' },
];

const capsuleRoleStyles: Record<CapsuleRole, string> = {
  user: 'border-sky-200 bg-sky-50 text-sky-900',
  situation: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  tool: 'border-amber-200 bg-amber-50 text-amber-900',
  output: 'border-violet-200 bg-violet-50 text-violet-900',
};

const capsuleStateStyles = {
  empty: 'border-slate-200 bg-slate-50 text-slate-600',
  building: 'border-amber-200 bg-amber-50 text-amber-800',
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  stale: 'border-orange-200 bg-orange-50 text-orange-800',
  'needs-sources': 'border-rose-200 bg-rose-50 text-rose-800',
  'needs-documents': 'border-sky-200 bg-sky-50 text-sky-800',
  archived: 'border-slate-200 bg-slate-100 text-slate-500',
} as const;

const connectorIconMap = {
  upload: Upload,
  search: Search,
  drive: HardDrive,
  mail: Mail,
  bucket: Database,
  spark: BrainCircuit,
} satisfies Record<CapsuleConnectorDefinition['icon'], LucideIcon>;

const capsuleLibraryFilters = [
  { id: 'all', label: 'All' },
  { id: 'context', label: 'Context' },
  { id: 'tool-capsules', label: 'Tools' },
  { id: 'agents', label: 'Agents' },
  { id: 'source-docs', label: 'Docs' },
  { id: 'outputs', label: 'Outputs' },
  { id: 'archived', label: 'Archived' },
] as const;

export function TaskletPraxisWorkbench({
  mode,
  activeCapsuleName = 'Weekly Middle East Analysis',
  capsuleId = 'default',
  focusedRunId,
  recentRuns = defaultRecentRuns,
  className,
}: TaskletPraxisWorkbenchProps) {
  const router = useRouter();
  const { user } = useAuth();
  const surfaceMode: HomeSurfaceMode = mode === 'app' ? 'authenticated' : mode;
  const isAuthenticated = surfaceMode === 'authenticated';
  const [prompt, setPrompt] = useState('Draft a sourced options memo from the active capsule.');
  const [activeTab, setActiveTab] = useState<PolicyNeedTabId>('analysis');
  const [selectedAgentId, setSelectedAgentId] = useState(PRAXIS_POLICY_AGENTS[0]?.id ?? 'research-memo');
  const [selectedModel, setSelectedModel] = useState<ModelPreferenceValue>(ASK_RUNTIME_OPTIONS[0].id);
  const [currentCapsuleId, setCurrentCapsuleId] = useState(capsuleId);
  const [activeCapsules, setActiveCapsules] = useState<ActiveCapsuleChip[]>([
    { id: capsuleId, label: activeCapsuleName, code: 'SITUATION', role: 'situation' },
  ]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('Ask PRAXIS can answer directly or choose the right tool from your capsule.');
  const [capsulePickerOpen, setCapsulePickerOpen] = useState(false);
  const [capsulePickerRole, setCapsulePickerRole] = useState<CapsuleRole>('situation');
  const [capsulePickerQuery, setCapsulePickerQuery] = useState('');
  const [capsuleSearch, setCapsuleSearch] = useState('');
  const [capsuleCategory, setCapsuleCategory] = useState('all');
  const [userCapsules, setUserCapsules] = useState<PraxisCapsuleSummary[]>([]);
  const [capsulesLoading, setCapsulesLoading] = useState(false);
  const [draggingCapsuleId, setDraggingCapsuleId] = useState<string | null>(null);
  const [repositoryOpen, setRepositoryOpen] = useState(false);
  const [capsuleDetailTab, setCapsuleDetailTab] = useState<CapsuleDetailTab>('build');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [repositoryDocuments, setRepositoryDocuments] = useState<RepositoryDocument[]>([]);
  const [repositoryLoading, setRepositoryLoading] = useState(false);
  const [agentRuns, setAgentRuns] = useState<AgentRunSummary[]>([]);
  const [agentRunsLoading, setAgentRunsLoading] = useState(false);
  const [agentRunCreating, setAgentRunCreating] = useState(false);
  const [focusedRun, setFocusedRun] = useState<AgentRunDetail | null>(null);
  const [focusedRunEvents, setFocusedRunEvents] = useState<AgentRunEventSummary[]>([]);
  const [focusedRunLoading, setFocusedRunLoading] = useState(false);
  const [builderLabel, setBuilderLabel] = useState('');
  const [builderNotes, setBuilderNotes] = useState('');
  const [builderLinks, setBuilderLinks] = useState('');
  const [builderCategoryId, setBuilderCategoryId] = useState<string>(POLICY_TEAM_CATEGORIES[0]?.id ?? 'research-strategy');
  const [selectedText, setSelectedText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedAgent = PRAXIS_POLICY_AGENTS.find((agent) => agent.id === selectedAgentId) ?? PRAXIS_POLICY_AGENTS[0]!;
  const selectedRuntime = getAskRuntimeOption(selectedModel);
  const selectedToolIds = activeCapsules
    .filter((capsule) => capsule.role === 'tool')
    .map((capsule) => capsule.toolId ?? capsule.templateId ?? capsule.id);
  const availableToolIds = selectedToolIds.length ? selectedToolIds : ['ask-praxis'];
  const capsules = COCKPIT_CAPSULE_LIBRARY.slice(0, 6);
  const selectedCapsule = userCapsules.find((capsule) => capsule.capsuleId === currentCapsuleId) ?? null;
  const selectedPolicyTeam = selectedCapsule ? policyTeamCategoryForTags(selectedCapsule.community?.tags) : getPolicyTeamCategory(capsuleCategory);
  const capsuleRecommendations = selectedCapsule
    ? recommendCapsuleTools({
        capsule: selectedCapsule,
        policyTeamId: selectedPolicyTeam?.id ?? capsuleCategory,
        recentToolIds: selectedToolIds,
      })
    : [];
  const capsuleCategories = buildCapsuleCategories(userCapsules);
  const publicCapsuleCategories = buildPublicCapsuleCategories();
  const filteredUserCapsules = filterUserCapsules(userCapsules, capsuleSearch, capsuleCategory);
  const publicCapsules = filterPublicCapsules(capsuleSearch, capsuleCategory);
  const filteredCapsules = COCKPIT_CAPSULE_LIBRARY.filter((capsule) => {
    const query = capsulePickerQuery.trim().toLowerCase();
    return !query || capsule.label.toLowerCase().includes(query) || capsule.prompt.toLowerCase().includes(query) || capsule.code.toLowerCase().includes(query);
  }).slice(0, 8);
  const conversationThreadId = `tasklet-${currentCapsuleId}`;
  const repositoryDocIds = new Set(selectedCapsule?.coreRefs.documentCoreIds ?? []);
  const visibleRepositoryDocuments = repositoryDocuments.filter((document) =>
    repositoryDocIds.size === 0 || repositoryDocIds.has(document.id),
  );

  useEffect(() => {
    if (focusedRunId) return;
    setActiveCapsules((current) => {
      const first = current[0];
      if (first?.id === capsuleId && first.label === activeCapsuleName) return current;
      setCurrentCapsuleId(capsuleId);
      return [{ id: capsuleId, label: activeCapsuleName, code: 'SITUATION', role: 'situation' }, ...current.slice(1)];
    });
  }, [activeCapsuleName, capsuleId, focusedRunId]);

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

  function requireAuthForAction(nextPrompt: string, agent: PolicyAgentDefinition = selectedAgent) {
    if (!isAuthenticated) {
      sendPublicToLogin(nextPrompt, agent);
      return true;
    }
    return false;
  }

  function buildChatPrompt(agent: PolicyAgentDefinition, cleanPrompt: string): string {
    const capsuleStack = activeCapsules
      .map((capsule) => `${capsule.role.toUpperCase()}: ${capsule.label} (${capsule.id})`)
      .join('\n');
    return [
      cleanPrompt,
      '',
      `Selected policy tool: ${agent.label}`,
      `Tool intent: ${policyAgentRunIntent(agent.id).replaceAll('_', ' ')}`,
      `Tool capsules: ${availableToolIds.join(', ')}`,
      `Active ContextCapsule stack:\n${capsuleStack}`,
      `Conversation thread: ${conversationThreadId}`,
      '',
      'Behave like a normal chat assistant first. Answer directly when enough context exists. If a tool, upload, connector, source check, memo, or capsule update would help, decide that yourself and explain the next step plainly.',
      'Format the answer for a policy team: start with a short answer, then use concise headings for Findings, Source posture, Gaps, and Next actions when relevant. Do not fabricate citations; name source gaps plainly.',
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
      const outputCapsule = activeCapsules.find((capsule) => capsule.role === 'output');
      const situationCapsule = activeCapsules.find((capsule) => capsule.role === 'situation') ?? activeCapsules[0];
      const response = await fetch('/api/ai/ask-praxis', {
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
          currentPath: '/app',
          forceRun: true,
          activeContextStack: {
            stackId: 'default',
            capsuleId: currentCapsuleId,
            situationId: situationCapsule?.id ?? currentCapsuleId,
            sourceIds: [],
            documentIds: [],
            outputGoal: outputCapsule?.label ?? agent.label,
            evidenceGaps: [],
            canvasLayout: {},
            schemaVersion: 1,
            updatedAt: new Date().toISOString(),
          },
          aiSettings: {
            provider: 'vertex',
            model: selectedRuntime.id,
            analysisDepth: selectedRuntime.mode === 'research_memo' ? 'deep' : 'standard',
          },
        }),
      });
      if (!response.ok || !response.body) {
        let detail = `${response.status} ${response.statusText}`;
        try {
          const payload = await response.clone().json() as { message?: string; error?: string };
          detail = payload.message ?? payload.error ?? detail;
        } catch {
          // Keep the HTTP status fallback.
        }
        throw new Error(detail);
      }

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
      void refreshCapsules();
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

  async function saveAssistantMessage(message: ChatMessage, index: number, mode: 'source-note' | 'memo-draft' = 'source-note') {
    if (!message.text.trim()) return;
    if (requireAuthForAction(`Save this PRAXIS response to a capsule:\n\n${message.text.slice(0, 1200)}`)) return;
    const title = mode === 'memo-draft' ? `PRAXIS memo draft ${index + 1}` : `PRAXIS saved response ${index + 1}`;
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title,
        html: `<article><h1>${escapeHtml(title)}</h1><pre>${escapeHtml(message.text)}</pre></article>`,
        situationId: currentCapsuleId,
        toolId: mode === 'memo-draft' ? 'memo-studio' : 'ask-praxis',
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Save failed: ${payload.error}` : 'Save failed.');
      return;
    }
    const documentId = payload?.documentId as string | undefined;
    if (documentId) {
      await fetch(`/api/context/capsules/${encodeURIComponent(currentCapsuleId)}/attach`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentIds: [documentId] }),
      }).catch(() => null);
    }
    setStatus(`${title} saved to the active capsule repository.`);
    await refreshCapsules(currentCapsuleId);
    await refreshRepository();
  }

  function retryFromMessage(index: number) {
    const previous = [...chatMessages].slice(0, index).reverse().find((message) => message.role === 'user');
    if (!previous) return;
    setPrompt(previous.text);
    void sendToPraxis(selectedAgent, previous.text);
  }

  function handleMessageSelection(messageId: string) {
    const selection = window.getSelection()?.toString().trim() ?? '';
    if (selection.length < 3) return;
    setSelectedText(selection.slice(0, 2000));
    setSelectedMessageId(messageId);
  }

  async function bindSelectedSpan(targetCore: SpanTargetCore) {
    if (!selectedText.trim()) return;
    if (requireAuthForAction(`Attach this selected text to ${targetCore}: ${selectedText}`)) return;
    const target = spanTargets.find((item) => item.id === targetCore);
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(currentCapsuleId)}/spans`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: selectedText,
        targetCore,
        sourceType: selectedMessageId?.startsWith('assistant') ? 'assistant-message' : 'document-selection',
        messageId: selectedMessageId,
        note: target?.note,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Span attach failed: ${payload.error}` : 'Span attach failed.');
      return;
    }
    setSelectedText('');
    setSelectedMessageId(null);
    setStatus(`Selected text attached to ${target?.label ?? targetCore}.`);
    await refreshCapsules(currentCapsuleId);
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
      form.append('capsuleId', currentCapsuleId);
      const response = await fetch('/api/documents/upload', { method: 'POST', body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'upload failed');
      if (payload?.coreRefs?.capsuleId) void refreshCapsules(payload.coreRefs.capsuleId as string);
      void refreshRepository();
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
      if (!isAuthenticated) {
        sendPublicToLogin(prompt.trim() || 'Upload sources into a PRAXIS capsule.');
        return;
      }
      fileInputRef.current?.click();
      return;
    }
    if (kind === 'connectors') {
      if (!isAuthenticated) sendPublicToLogin(prompt.trim() || 'Connect sources to PRAXIS.');
      else {
        setCapsuleDetailTab('connect');
        setCapsuleCategory('source-docs');
        setStatus('Connector lane opened for the active capsule.');
      }
      return;
    }
    setPrompt((current) => `Improve this PRAXIS request and ask any missing context question: ${current.trim()}`);
  }

  const refreshCapsules = useCallback(async (selectCapsuleId?: string) => {
    if (!isAuthenticated) return;
    setCapsulesLoading(true);
    try {
      const response = await fetch('/api/context/capsules?includeArchived=true', { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'capsule list failed');
      const next = Array.isArray(payload?.capsules) ? payload.capsules as PraxisCapsuleSummary[] : [];
      setUserCapsules(next);
      const selected = selectCapsuleId
        ? next.find((capsule) => capsule.capsuleId === selectCapsuleId)
        : next.find((capsule) => capsule.capsuleId === currentCapsuleId && !capsule.archivedAt) ?? next.find((capsule) => !capsule.archivedAt);
      if (selected) {
        const chip = capsuleToChip(selected);
        setCurrentCapsuleId(chip.id);
        setActiveCapsules((current) => [chip, ...current.filter((item) => item.id !== chip.id)].slice(0, 6));
      }
    } catch (err) {
      setStatus(err instanceof Error ? `Capsule library failed: ${err.message}` : 'Capsule library failed.');
    } finally {
      setCapsulesLoading(false);
    }
  }, [currentCapsuleId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshCapsules();
  }, [isAuthenticated, refreshCapsules]);

  const refreshRepository = useCallback(async () => {
    if (!isAuthenticated || !currentCapsuleId) return;
    setRepositoryLoading(true);
    try {
      const response = await fetch(`/api/documents?situationId=${encodeURIComponent(currentCapsuleId)}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'document list failed');
      setRepositoryDocuments(Array.isArray(payload?.documents) ? payload.documents as RepositoryDocument[] : []);
    } catch (err) {
      setStatus(err instanceof Error ? `Repository failed: ${err.message}` : 'Repository failed.');
    } finally {
      setRepositoryLoading(false);
    }
  }, [currentCapsuleId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshRepository();
  }, [isAuthenticated, refreshRepository]);

  const refreshAgentRuns = useCallback(async () => {
    if (!isAuthenticated || !currentCapsuleId) return;
    setAgentRunsLoading(true);
    try {
      const response = await fetch(`/api/agents/runs?capsuleId=${encodeURIComponent(currentCapsuleId)}&limit=8`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'agent run list failed');
      setAgentRuns(Array.isArray(payload?.runs) ? payload.runs as AgentRunSummary[] : []);
    } catch (err) {
      setStatus(err instanceof Error ? `Agent runs unavailable: ${err.message}` : 'Agent runs unavailable.');
      setAgentRuns([]);
    } finally {
      setAgentRunsLoading(false);
    }
  }, [currentCapsuleId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshAgentRuns();
  }, [isAuthenticated, refreshAgentRuns]);

  useEffect(() => {
    if (!isAuthenticated || !focusedRunId) return;
    let cancelled = false;
    const runId = focusedRunId;

    async function loadFocusedRun() {
      setFocusedRunLoading(true);
      setCapsuleDetailTab('agents');
      setActiveTab('capsules');
      setStatus(`Opening agent run ${runId.slice(0, 12)}...`);
      try {
        const response = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}`, { credentials: 'include' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.run?.runId) throw new Error(payload?.error ?? 'agent run not found');
        if (cancelled) return;

        const detail = payload as AgentRunDetail;
        setFocusedRun(detail);
        setCurrentCapsuleId(detail.run.capsuleId);
        if (detail.run.policyAgentId) setSelectedAgentId(detail.run.policyAgentId);
        setPrompt(detail.run.objective);
        setActiveCapsules((current) => {
          const chip: ActiveCapsuleChip = {
            id: detail.run.capsuleId,
            label: detail.run.capsuleId,
            code: 'SITUATION',
            role: 'situation',
          };
          return [chip, ...current.filter((item) => item.id !== chip.id)].slice(0, 6);
        });
        setAgentRuns((current) => [detail.run, ...current.filter((item) => item.runId !== detail.run.runId)].slice(0, 8));
        setStatus(`${detail.run.policyAgentLabel ?? 'Capsule agent'} opened as run ${detail.run.runId.slice(0, 12)}.`);
        void refreshCapsules(detail.run.capsuleId);

        const eventsResponse = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}/stream?limit=30`, { credentials: 'include' });
        const eventsText = await eventsResponse.text().catch(() => '');
        if (!cancelled && eventsResponse.ok) setFocusedRunEvents(parseAgentRunSse(eventsText));
      } catch (err) {
        if (!cancelled) {
          setFocusedRun(null);
          setFocusedRunEvents([]);
          setStatus(err instanceof Error ? `Agent workspace unavailable: ${err.message}` : 'Agent workspace unavailable.');
        }
      } finally {
        if (!cancelled) setFocusedRunLoading(false);
      }
    }

    void loadFocusedRun();
    return () => {
      cancelled = true;
    };
  }, [focusedRunId, isAuthenticated, refreshCapsules]);

  async function createAgentRun(agent: PolicyAgentDefinition = selectedAgent, overridePrompt?: string) {
    const cleanPrompt = (overridePrompt ?? prompt).trim();
    if (!cleanPrompt || agentRunCreating) return;
    if (!isAuthenticated) {
      sendPublicToLogin(cleanPrompt, agent);
      return;
    }

    setAgentRunCreating(true);
    setStatus(`${agent.label} is being queued inside this capsule...`);
    try {
      const response = await fetch('/api/agents/runs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capsuleId: currentCapsuleId,
          contextStackId: 'default',
          policyAgentId: agent.id,
          outputDestination: agent.outputDestination,
          objective: cleanPrompt,
          triggerType: 'manual',
          idempotencyKey: `ui:${currentCapsuleId}:${agent.id}:${Date.now()}`,
          maxStep: agent.id === 'research-memo' ? 12 : 8,
          maxSessionMinutes: 30,
          metadata: {
            policyAgentId: agent.id,
            policyAgentLabel: agent.label,
            outputDestination: agent.outputDestination,
            capsuleSlots: agent.capsuleSlots,
            allowedTools: agent.allowedTools,
            riskLevel: agent.riskLevel,
            source: 'tasklet-cockpit',
          },
        }),
      });
      const run = await response.json().catch(() => ({})) as AgentRunSummary & { error?: string; detail?: string };
      if (!response.ok || !run?.runId) throw new Error(run?.error ?? run?.detail ?? 'agent run creation failed');
      setAgentRuns((current) => [run, ...current.filter((item) => item.runId !== run.runId)].slice(0, 8));
      setCapsuleDetailTab('agents');
      setStatus(`${agent.label} queued as run ${run.runId.slice(0, 8)}. Dispatching worker...`);

      const dispatchResponse = await fetch(`/api/agents/runs/${encodeURIComponent(run.runId)}/dispatch`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attempt: 1 }),
      });
      if (!dispatchResponse.ok) {
        const payload = await dispatchResponse.json().catch(() => ({}));
        setStatus(`${agent.label} is queued. Worker dispatch is not active here: ${payload?.error ?? dispatchResponse.statusText}`);
      } else {
        setStatus(`${agent.label} dispatched. Open Agents for run status and receipts.`);
      }
      router.push(`/agents/${encodeURIComponent(run.runId)}`);
      void refreshAgentRuns();
    } catch (err) {
      setStatus(err instanceof Error ? `Agent run failed: ${err.message}` : 'Agent run failed.');
    } finally {
      setAgentRunCreating(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    const searchParams = new URLSearchParams(window.location.search);
    const panel = searchParams.get('panel');
    const capsuleParam = searchParams.get('capsuleId') ?? searchParams.get('situationId');
    const importToken = searchParams.get('importToken');
    if (capsuleParam) {
      setCurrentCapsuleId(capsuleParam);
      setActiveCapsules((current) => {
        if (current.some((capsule) => capsule.id === capsuleParam)) return current;
        const chip: ActiveCapsuleChip = { id: capsuleParam, label: capsuleParam, code: 'SITUATION', role: 'situation' };
        return [chip, ...current].slice(0, 6);
      });
    }
    if (importToken) {
      setRepositoryOpen(true);
      setStatus(`Shared capsule import ${importToken} opened in the cockpit.`);
      void refreshRepository();
      return;
    }
    if (panel === 'builder') setBuilderOpen(true);
    if (panel === 'library') {
      setActiveTab('capsules');
      setRepositoryOpen(true);
      void refreshRepository();
    }
    if (panel === 'memo') setPrompt('Draft a memo from the active capsule.');
    if (panel === 'canvas') setInspectorOpen(true);
    if (panel === 'advanced' || panel === 'ask') setAgentDrawerOpen(true);
    if (panel === 'account') setStatus('Account and runtime settings now live inside the PRAXIS cockpit.');
  }, [isAuthenticated, refreshRepository]);

  function selectUserCapsule(capsule: PraxisCapsuleSummary) {
    const chip = capsuleToChip(capsule);
    setCurrentCapsuleId(chip.id);
    setActiveCapsules((current) => [chip, ...current.filter((item) => item.id !== chip.id)].slice(0, 6));
  }

  async function archiveUserCapsule(capsule: PraxisCapsuleSummary) {
    if (!isAuthenticated) return;
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'archive' }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Archive failed: ${payload.error}` : 'Archive failed.');
      return;
    }
    setStatus(`${capsule.label} archived.`);
    await refreshCapsules();
  }

  async function tagUserCapsule(capsule: PraxisCapsuleSummary, tag: string) {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    if (!clean) return;
    const tags = uniqueIds([...(capsule.community?.tags ?? []), clean]).slice(0, 20);
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ community: { tags } }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Category failed: ${payload.error}` : 'Category failed.');
      return;
    }
    setStatus(`${capsule.label} category saved.`);
    await refreshCapsules(capsule.capsuleId);
  }

  async function assignPolicyTeam(capsule: PraxisCapsuleSummary, category: PolicyTeamCategory) {
    const currentTags = capsule.community?.tags ?? [];
    const tags = uniqueIds([
      ...currentTags.filter((tag) => !POLICY_TEAM_CATEGORIES.some((item) => item.id === tag)),
      ...categoryTagsForPolicyTeam(category),
    ]).slice(0, 20);
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ community: { tags } }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Policy team failed: ${payload.error}` : 'Policy team failed.');
      return;
    }
    setCapsuleCategory(category.id);
    setStatus(`${capsule.label} is now categorized for ${category.label}.`);
    await refreshCapsules(capsule.capsuleId);
  }

  async function attachRecommendedTool(capsule: PraxisCapsuleSummary, recommendation: CapsuleToolRecommendation) {
    const nextTools = uniqueIds([...(capsule.coreRefs.toolCoreIds ?? []), recommendation.tool.id]).slice(0, 20);
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ coreRefs: { toolCoreIds: nextTools } }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Tool attach failed: ${payload.error}` : 'Tool attach failed.');
      return;
    }
    setStatus(`${recommendation.tool.shortLabel} attached to ${capsule.label}.`);
    await refreshCapsules(capsule.capsuleId);
  }

  function improveCapsule(capsule?: PraxisCapsuleSummary) {
    if (!isAuthenticated) {
      sendPublicToLogin(prompt.trim() || 'Improve this ContextCapsule.');
      return;
    }
    const target = capsule ?? selectedCapsule ?? userCapsules[0];
    if (!target) return;
    selectUserCapsule(target);
    const refs = target.coreRefs ?? {};
    const team = policyTeamCategoryForTags(target.community?.tags);
    const nextPrompt = [
      `Improve the ContextCapsule "${target.label}".`,
      `Capsule id: ${target.capsuleId}.`,
      team ? `Policy team category: ${team.label}.` : 'Policy team category: not assigned.',
      `Sources: ${refs.sourceCoreIds?.length ?? 0}. Documents: ${refs.documentCoreIds?.length ?? 0}. Tools: ${refs.toolCoreIds?.length ?? 0}.`,
      'Ask only for missing information, suggest useful documents, recommend the best PRAXIS tools, and update the capsule plan before drafting anything.',
    ].join('\n');
    setPrompt(nextPrompt);
    void sendToPraxis(selectedAgent, nextPrompt);
  }

  async function createCapsuleLite(label?: string, seed?: Partial<ActiveCapsuleChip>, policyTeam?: PolicyTeamCategory | null) {
    if (!isAuthenticated) {
      sendPublicToLogin(prompt.trim() || 'Build a ContextCapsule Lite.');
      return null;
    }
    const team = policyTeam ?? getPolicyTeamCategory(capsuleCategory);
    const templateId = seed?.templateId ?? team?.templateIds[0];
    const response = await fetch('/api/context/capsules', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        label: label ?? (team ? `${team.shortLabel} ContextCapsule` : 'ContextCapsule Lite'),
        scope: 'user',
        coreRefs: {
          toolCoreIds: uniqueIds([
            ...(team?.toolIds.slice(0, 3) ?? []),
            ...(seed?.role === 'tool' && seed.toolId ? [...selectedToolIds, seed.toolId] : selectedToolIds),
          ]),
          objectiveCoreIds: [selectedAgent.id],
          productCoreIds: uniqueIds([activeTab, ...(team?.outputProductIds.slice(0, 2) ?? [])]),
        },
        community: team ? { tags: categoryTagsForPolicyTeam(team).slice(0, 12) } : undefined,
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
      role: seed?.role ?? 'situation',
      toolId: seed?.toolId,
      templateId,
    };
    setCurrentCapsuleId(created.id);
    setActiveCapsules((current) => [created, ...current.filter((item) => item.id !== created.id).slice(0, 4)]);
    void refreshCapsules(created.id);
    setStatus(`${created.label} created and selected.`);
    return created;
  }

  async function createCapsuleFromBuilder() {
    const team = getPolicyTeamCategory(builderCategoryId) ?? POLICY_TEAM_CATEGORIES[0] ?? null;
    const label = builderLabel.trim() || (team ? `${team.shortLabel} ContextCapsule` : 'ContextCapsule Lite');
    try {
      const created = await createCapsuleLite(label, undefined, team);
      if (!created) return;
      const notes = [builderNotes.trim(), builderLinks.trim() ? `Links:\n${builderLinks.trim()}` : ''].filter(Boolean).join('\n\n');
      if (notes) {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: `${label} starter notes`,
            html: `<article><h1>${escapeHtml(label)} starter notes</h1><pre>${escapeHtml(notes)}</pre></article>`,
            situationId: created.id,
            toolId: 'capsule-builder',
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload?.documentId) {
          await fetch(`/api/context/capsules/${encodeURIComponent(created.id)}/attach`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ documentIds: [payload.documentId] }),
          }).catch(() => null);
        }
      }
      setBuilderLabel('');
      setBuilderNotes('');
      setBuilderLinks('');
      setBuilderOpen(false);
      setRepositoryOpen(true);
      await refreshCapsules(created.id);
      await refreshRepository();
    } catch (err) {
      setStatus(err instanceof Error ? `Capsule builder failed: ${err.message}` : 'Capsule builder failed.');
    }
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
      role: 'situation' as const,
    };
    setCurrentCapsuleId(combined.id);
    setActiveCapsules([combined, ...capsulesToCombine.slice(0, 4)]);
    void refreshCapsules(combined.id);
    setStatus(`${combined.label} is now the active ContextCapsule Lite.`);
  }

  async function addCapsule(id: string, role: CapsuleRole = capsulePickerRole) {
    const capsule = findCapsuleTemplate(id);
    if (!capsule) return;
    if (!isAuthenticated) {
      sendPublicToLogin(capsule.prompt || 'Build this ContextCapsule Lite.');
      return;
    }
    try {
      const created = await createCapsuleLite(`ContextCapsule Lite: ${capsule.label}`, {
        code: capsule.code,
        role,
        templateId: capsule.id,
      });
      if (!created) return;
      const next = [...activeCapsules, created].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 5);
      setActiveCapsules(next);
      if (next.length >= 2) await combineCapsuleLiteStack(next);
      setCapsulePickerOpen(false);
    } catch (err) {
      setStatus(err instanceof Error ? `Capsule failed: ${err.message}` : 'Capsule failed.');
    }
  }

  function removeCapsule(id: string) {
    setActiveCapsules((current) => current.length <= 1 ? current : current.filter((capsule) => capsule.id !== id));
    if (currentCapsuleId === id) {
      const next = activeCapsules.find((capsule) => capsule.id !== id);
      if (next) setCurrentCapsuleId(next.id);
    }
  }

  function reorderCapsules(targetId: string) {
    if (!draggingCapsuleId || draggingCapsuleId === targetId) return;
    setActiveCapsules((current) => {
      const from = current.findIndex((capsule) => capsule.id === draggingCapsuleId);
      const to = current.findIndex((capsule) => capsule.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggingCapsuleId(null);
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
          <Link href={isAuthenticated ? '/app' : '/'} className="mb-6 flex items-center gap-3 text-lg font-bold">
            <span className="praxis-thinking-glyph flex h-8 w-8 items-center justify-center rounded-md bg-sage text-white">◳</span>
            PRAXIS
          </Link>
          <SidebarButton icon={Plus} label="New capsule" onClick={() => {
            if (requireAuthForAction('Build a new PRAXIS ContextCapsule.')) return;
            setBuilderOpen(true);
          }} active />
          <SidebarButton icon={Search} label="Search capsules" onClick={() => setActiveTab('capsules')} />
          <SidebarButton icon={Library} label="Repository" onClick={() => {
            if (requireAuthForAction('Open the capsule repository and attach sources.')) return;
            setRepositoryOpen(true);
            void refreshRepository();
          }} />
          <SidebarButton icon={Clipboard} label="Agent actions" onClick={() => {
            if (requireAuthForAction('Run capsule-aware PRAXIS policy actions.')) return;
            setAgentDrawerOpen(true);
          }} />
          <div className="mt-8">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">{recentLabel} <ChevronDown className="h-3 w-3" /></p>
            <div className="mt-3 space-y-2">
              {isAuthenticated && agentRuns.length ? agentRuns.slice(0, 5).map((run) => (
                <button
                  key={run.runId}
                  type="button"
                  onClick={() => router.push(`/agents/${encodeURIComponent(run.runId)}`)}
                  className={cn(
                    'block w-full truncate rounded-md px-1 py-1.5 text-left text-sm font-medium hover:bg-black/5',
                    focusedRunId === run.runId ? 'bg-black/5 text-slate-950' : 'text-slate-800',
                  )}
                >
                  {run.policyAgentLabel ?? run.policyAgentId ?? run.objective}
                </button>
              )) : recentRuns.slice(0, 5).map((run) => (
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
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-xs font-semibold text-slate-700">◳</span>
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
            <Link href={isAuthenticated ? '/app' : '/'} className="flex items-center gap-2 text-lg font-semibold lg:hidden">
              <span className="praxis-thinking-glyph flex h-8 w-8 items-center justify-center rounded-md bg-sage text-white">◳</span>
              PRAXIS
            </Link>
            <nav className="ml-auto hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
              <Link href={isAuthenticated ? '/app' : '/'} className="hover:text-slate-900">Home</Link>
              <button type="button" onClick={() => setActiveTab('capsules')} className="hover:text-slate-900">Capsules</button>
              <button type="button" onClick={() => {
                if (requireAuthForAction('Open the capsule repository and attach sources.')) return;
                setRepositoryOpen(true);
                void refreshRepository();
              }} className="hover:text-slate-900">Repository</button>
              <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
              <Link href="/learn" className="hover:text-slate-900">Learn</Link>
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
              <Link href={isAuthenticated ? '/pricing' : '/login?mode=signup'} className="text-sage">Upgrade</Link>
            </div>

            <div className="mt-5 flex w-full max-w-5xl flex-wrap items-center justify-center gap-2" data-testid="policy-team-next-actions">
              {policyNextActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setPrompt(action.prompt);
                    if (!isAuthenticated) {
                      sendPublicToLogin(action.prompt);
                      return;
                    }
                    if (action.label !== 'Ask') void sendToPraxis(selectedAgent, action.prompt);
                  }}
                  className="rounded-md border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-black/5 transition hover:border-[#ff714d]/40 hover:bg-[#fff7f3]"
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex w-full max-w-5xl flex-wrap items-center justify-center gap-2" data-testid="capsule-workspace-actions">
              <button type="button" onClick={() => {
                if (requireAuthForAction('Build a new PRAXIS ContextCapsule.')) return;
                setBuilderOpen(true);
              }} className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-black/5 hover:bg-white">
                <Plus className="h-4 w-4" />
                Build capsule
              </button>
              <button type="button" onClick={() => {
                if (requireAuthForAction('Open the capsule repository and attach sources.')) return;
                setRepositoryOpen(true);
                void refreshRepository();
              }} className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-black/5 hover:bg-white">
                <Library className="h-4 w-4" />
                Repository
              </button>
              <button type="button" onClick={() => {
                if (requireAuthForAction('Inspect and improve the active PRAXIS capsule.')) return;
                setInspectorOpen(true);
              }} className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-black/5 hover:bg-white">
                <BookOpen className="h-4 w-4" />
                Inspect capsule
              </button>
              <button type="button" onClick={() => {
                if (requireAuthForAction('Run capsule-aware PRAXIS policy actions.')) return;
                setAgentDrawerOpen(true);
              }} className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-black/5 hover:bg-white">
                <Sparkles className="h-4 w-4" />
                Research actions
              </button>
            </div>

            <CapsuleMap
              capsule={selectedCapsule}
              fallbackLabel={activeCapsules[0]?.label ?? activeCapsuleName}
              agentRunCount={agentRuns.length}
              onFilter={(filter) => {
                setCapsuleCategory(filter);
                setCapsuleDetailTab(filter === 'source-docs' ? 'retrieve' : filter === 'tool-capsules' ? 'build' : filter === 'agents' ? 'agents' : 'connect');
              }}
            />

            <div className="mt-6 w-full max-w-5xl rounded-lg border border-black/10 bg-white shadow-sm shadow-black/5" data-testid="praxis-main-composer">
              <div className="border-b border-black/10 px-5 py-3" data-testid="capsule-context-bar">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Capsule context</span>
                  {activeCapsules.map((capsule, index) => (
                    <span
                      key={capsule.id}
                      draggable
                      onDragStart={() => setDraggingCapsuleId(capsule.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => reorderCapsules(capsule.id)}
                      className={cn(
                        'inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold',
                        capsuleRoleStyles[capsule.role],
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentCapsuleId(capsule.id);
                          setCapsulePickerOpen(true);
                          setCapsulePickerRole(capsule.role);
                        }}
                        className="inline-flex min-w-0 items-center gap-2"
                      >
                        <span>{index === 0 ? 'Active' : capsuleRoles.find((role) => role.id === capsule.role)?.label}</span>
                        <span className="max-w-44 truncate text-slate-800">{capsule.label}</span>
                      </button>
                      {activeCapsules.length > 1 ? (
                        <button
                          type="button"
                          aria-label={`Remove ${capsule.label}`}
                          onClick={() => removeCapsule(capsule.id)}
                          className="rounded p-0.5 text-slate-500 hover:bg-black/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCapsulePickerOpen(true);
                      setCapsulePickerRole('situation');
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Capsule
                  </button>
                </div>
              </div>
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
                    value={selectedAgentId}
                    onChange={(event) => setSelectedAgentId(event.target.value)}
                    aria-label="Policy agent"
                    className="hidden max-w-48 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700 outline-none sm:block"
                  >
                    {PRAXIS_POLICY_AGENTS.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.label}</option>
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
                    disabled={!prompt.trim() || agentRunCreating}
                    onClick={() => void createAgentRun()}
                    className="hidden rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 sm:inline-flex"
                  >
                    {agentRunCreating ? 'Queuing...' : 'Run agent'}
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

            {capsulePickerOpen ? (
              <section className="mt-3 w-full max-w-5xl rounded-lg border border-black/10 bg-white p-4 shadow-lg shadow-black/10" data-testid="capsule-context-picker">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {capsuleRoles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setCapsulePickerRole(role.id)}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-semibold',
                          capsulePickerRole === role.id ? capsuleRoleStyles[role.id] : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" aria-label="Close capsule picker" onClick={() => setCapsulePickerOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <label className="mt-4 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={capsulePickerQuery}
                    onChange={(event) => setCapsulePickerQuery(event.target.value)}
                    placeholder="Search capsules"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </label>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {filteredCapsules.map((capsule) => (
                    <button
                      key={capsule.id}
                      type="button"
                      onClick={() => addCapsule(capsule.id, capsulePickerRole)}
                      className="rounded-md border border-slate-200 p-3 text-left hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="text-xs font-semibold text-slate-400">{capsule.code}</span>
                      <span className="mt-1 block text-sm font-semibold text-slate-800">{capsule.label}</span>
                      <span className="mt-2 line-clamp-2 block text-xs leading-5 text-slate-500">{capsule.prompt}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {chatMessages.length ? (
              <section className="mt-5 w-full max-w-5xl space-y-3 rounded-lg border border-black/10 bg-white/85 p-4 shadow-sm shadow-black/5" data-testid="praxis-chat-thread">
                {chatMessages.map((message, index) => (
                  <article
                    key={`${message.role}-${index}`}
                    onMouseUp={() => handleMessageSelection(`${message.role}-${index}`)}
                    className={cn(
                      'rounded-lg px-4 py-3 text-sm leading-6 shadow-sm',
                      message.role === 'user' ? 'ml-auto max-w-[82%] bg-slate-950 text-white shadow-black/10' : 'mr-auto max-w-[92%] border border-slate-200 bg-white text-slate-900 shadow-black/5',
                    )}
                  >
                    <div className={cn('mb-2 text-[11px] font-semibold uppercase tracking-wide', message.role === 'user' ? 'text-white/60' : 'text-slate-400')}>
                      {message.role === 'user' ? 'You' : 'PRAXIS'}
                    </div>
                    {message.role === 'assistant' ? (
                      <>
                        <AssistantMarkdown text={message.text || 'Reading context...'} />
                        <MessageActionRow
                          onCopy={() => void navigator.clipboard?.writeText(message.text)}
                          onRetry={() => retryFromMessage(index)}
                          onSave={() => void saveAssistantMessage(message, index)}
                          onMemo={() => void saveAssistantMessage(message, index, 'memo-draft')}
                          onSourceCheck={() => void sendToPraxis(selectedAgent, `Source-check this PRAXIS answer against the active capsule. Identify weak claims, missing citations, and stale assumptions.\n\n${message.text}`)}
                        />
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    )}
                  </article>
                ))}
                {selectedText ? (
                  <div className="rounded-lg border border-[#ff714d]/30 bg-[#fff7f3] p-3 shadow-sm" data-testid="text-span-core-popover">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#ca4a25]">Attach selected text</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">{selectedText}</p>
                      </div>
                      <button type="button" aria-label="Clear selected text" onClick={() => setSelectedText('')} className="rounded p-1 text-slate-500 hover:bg-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {spanTargets.map((target) => (
                        <button key={target.id} type="button" onClick={() => void bindSelectedSpan(target.id)} className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:text-[#ca4a25]">
                          {target.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="mt-12 w-full max-w-5xl" data-testid="capsule-manager">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Capsules</h2>
                  <p className="mt-1 text-sm text-slate-500">Stored context, documents, and AI work.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex min-w-64 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={capsuleSearch}
                      onChange={(event) => setCapsuleSearch(event.target.value)}
                      placeholder="Search capsules"
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void createCapsuleLite(undefined, undefined, getPolicyTeamCategory(capsuleCategory))}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    {isAuthenticated ? 'New' : 'Sign in to build'}
                  </button>
                </div>
              </div>

              <nav className="mt-4 flex flex-wrap gap-2" aria-label="Capsule categories">
                {(isAuthenticated ? capsuleCategories : publicCapsuleCategories).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCapsuleCategory(category)}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-xs font-semibold',
                      capsuleCategory === category ? 'border-[#ff714d] bg-[#fff2ed] text-[#ca4a25]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {capsuleCategoryLabel(category)}
                  </button>
                ))}
              </nav>

              <div className="mt-4 grid gap-2 md:grid-cols-5" aria-label="New context capsule presets">
                {POLICY_TEAM_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => void createCapsuleLite(`${category.shortLabel} ContextCapsule`, undefined, category)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:border-[#ff714d] hover:text-slate-950"
                  >
                    <span className="block truncate">{category.shortLabel}</span>
                    <span className="mt-1 block truncate font-normal text-slate-400">{category.templateIds[0]}</span>
                  </button>
                ))}
              </div>

              {isAuthenticated ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="grid gap-3 md:grid-cols-2" data-testid="tasklet-capsule-cards">
                    {capsulesLoading && !filteredUserCapsules.length ? (
                      <CapsuleEmptyState label="Loading capsules..." />
                    ) : null}
                    {!capsulesLoading && !filteredUserCapsules.length ? (
                      <CapsuleEmptyState label="No capsules found." />
                    ) : null}
                    {filteredUserCapsules.map((capsule) => (
                      <CapsuleCard
                        key={capsule.capsuleId}
                        capsule={capsule}
                        active={capsule.capsuleId === currentCapsuleId}
                        onSelect={() => selectUserCapsule(capsule)}
                        onAsk={() => {
                          selectUserCapsule(capsule);
                          setPrompt(`Ask this capsule: ${capsule.label}`);
                        }}
                        onImprove={() => improveCapsule(capsule)}
                        onArchive={() => void archiveUserCapsule(capsule)}
                        onTag={(tag) => void tagUserCapsule(capsule, tag)}
                      />
                    ))}
                  </div>
                  <CapsuleDetailPanel
                    capsule={selectedCapsule}
                    policyTeam={selectedPolicyTeam}
                    recommendations={capsuleRecommendations}
                    detailTab={capsuleDetailTab}
                    repositoryDocuments={visibleRepositoryDocuments}
                    repositoryLoading={repositoryLoading}
                    agentRuns={agentRuns}
                    agentRunsLoading={agentRunsLoading}
                    focusedRun={focusedRun}
                    focusedRunEvents={focusedRunEvents}
                    focusedRunLoading={focusedRunLoading}
                    selectedAgentId={selectedAgentId}
                    onUpload={() => fileInputRef.current?.click()}
                    onDetailTab={setCapsuleDetailTab}
                    onOpenRepository={() => { setRepositoryOpen(true); void refreshRepository(); }}
                    onImprove={() => improveCapsule()}
                    onRefresh={() => void refreshCapsules(currentCapsuleId)}
                    onSelectAgent={setSelectedAgentId}
                    onRunAgent={(agent) => void createAgentRun(agent)}
                    onAssignPolicyTeam={(category) => {
                      if (selectedCapsule) void assignPolicyTeam(selectedCapsule, category);
                    }}
                    onAttachTool={(recommendation) => {
                      if (selectedCapsule) void attachRecommendedTool(selectedCapsule, recommendation);
                    }}
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="tasklet-capsule-cards">
                  {publicCapsules.map((capsule, index) => {
                    const category = publicCategoryForTemplate(capsule.id);
                    return (
                      <article key={capsule.id} className="group min-h-52 rounded-xl border border-black/10 bg-white/75 p-4 shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:border-[#ff714d]/40 hover:bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
                            {category?.shortLabel ?? 'Capsule'}
                          </span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">{capsule.label}</h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{capsule.prompt}</p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {capsule.contextCores.slice(0, 3).map((core) => (
                            <span key={core} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">{core}</span>
                          ))}
                        </div>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPrompt(capsule.prompt);
                              setCapsulePickerQuery(capsule.label);
                              setCapsulePickerOpen(true);
                            }}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#ca4a25]"
                          >
                            <FolderKanban className="h-3.5 w-3.5" />
                            Explore
                          </button>
                          <button type="button" onClick={() => addCapsule(capsule.id)} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                            <Sparkles className="h-3.5 w-3.5" />
                            Use after sign in
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {!publicCapsules.length ? <CapsuleEmptyState label="No public capsule examples match that search." /> : null}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      {builderOpen ? (
        <CapsuleBuilderDialog
          label={builderLabel}
          notes={builderNotes}
          links={builderLinks}
          categoryId={builderCategoryId}
          onLabel={setBuilderLabel}
          onNotes={setBuilderNotes}
          onLinks={setBuilderLinks}
          onCategory={setBuilderCategoryId}
          onClose={() => setBuilderOpen(false)}
          onCreate={() => void createCapsuleFromBuilder()}
        />
      ) : null}
      {repositoryOpen ? (
        <RepositorySheet
          capsule={selectedCapsule}
          documents={visibleRepositoryDocuments}
          documentRefs={Array.from(repositoryDocIds)}
          loading={repositoryLoading}
          onClose={() => setRepositoryOpen(false)}
          onRefresh={() => void refreshRepository()}
          onUpload={() => fileInputRef.current?.click()}
          onRun={(promptText) => {
            setRepositoryOpen(false);
            setPrompt(promptText);
            void sendToPraxis(selectedAgent, promptText);
          }}
        />
      ) : null}
      {inspectorOpen ? (
        <CapsuleInspectorSheet
          capsule={selectedCapsule}
          policyTeam={selectedPolicyTeam}
          onClose={() => setInspectorOpen(false)}
          onImprove={() => {
            setInspectorOpen(false);
            improveCapsule();
          }}
          onRepository={() => {
            setInspectorOpen(false);
            setRepositoryOpen(true);
            void refreshRepository();
          }}
        />
      ) : null}
      {agentDrawerOpen ? (
        <AgentActionDrawer
          selectedAgentId={selectedAgentId}
          onClose={() => setAgentDrawerOpen(false)}
          onSelectAgent={setSelectedAgentId}
          onRunAgent={(agent) => {
            setAgentDrawerOpen(false);
            void createAgentRun(agent);
          }}
          onRun={(promptText) => {
            setAgentDrawerOpen(false);
            setPrompt(promptText);
            void sendToPraxis(selectedAgent, promptText);
          }}
        />
      ) : null}
    </section>
  );
}

function AssistantMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-slate-800" data-testid="praxis-answer-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h3 className="text-base font-semibold text-slate-950">{children}</h3>,
          h2: ({ children }) => <h3 className="text-base font-semibold text-slate-950">{children}</h3>,
          h3: ({ children }) => <h4 className="text-sm font-semibold text-slate-950">{children}</h4>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
          table: ({ children }) => <div className="overflow-x-auto rounded-md border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-left text-xs">{children}</table></div>,
          th: ({ children }) => <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-700">{children}</th>,
          td: ({ children }) => <td className="border-t border-slate-100 px-3 py-2 align-top">{children}</td>,
          code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-slate-800">{children}</code>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function uniqueIds(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function capsuleToChip(capsule: PraxisCapsuleSummary): ActiveCapsuleChip {
  return {
    id: capsule.capsuleId,
    label: capsule.label,
    code: capsule.scope.toUpperCase(),
    role: capsule.scope === 'user' ? 'user' : 'situation',
  };
}

function buildCapsuleCategories(capsules: PraxisCapsuleSummary[]): string[] {
  const generatedTags = Array.from(new Set(capsules.flatMap((capsule) => capsule.community?.tags ?? [])))
    .filter((tag) => !POLICY_TEAM_CATEGORIES.some((category) => category.id === tag))
    .slice(0, 8);
  return [
    ...capsuleLibraryFilters.map((filter) => filter.id),
    ...POLICY_TEAM_CATEGORIES.map((category) => category.id),
    ...generatedTags,
  ];
}

function buildPublicCapsuleCategories(): string[] {
  return [
    'all',
    ...POLICY_TEAM_CATEGORIES
      .filter((category) => category.templateIds.some((templateId) => COCKPIT_CAPSULE_LIBRARY.some((capsule) => capsule.id === templateId)))
      .map((category) => category.id),
    'source-docs',
    'agents',
    'outputs',
  ];
}

function publicCategoryForTemplate(templateId: string): PolicyTeamCategory | null {
  return POLICY_TEAM_CATEGORIES.find((category) => category.templateIds.some((id) => id === templateId)) ?? null;
}

function filterPublicCapsules(query: string, category: string) {
  const clean = query.trim().toLowerCase();
  return COCKPIT_CAPSULE_LIBRARY.filter((capsule) => {
    const team = getPolicyTeamCategory(category);
      const matchesCategory =
        category === 'all' ? true :
        category === 'source-docs' ? capsule.contextCores.some((core) => core === 'source' || core === 'document') :
        category === 'agents' ? true :
        category === 'outputs' ? capsule.contextCores.some((core) => core === 'output' || core === 'product') :
      team ? team.templateIds.some((id) => id === capsule.id) :
      true;
    if (!matchesCategory) return false;
    if (!clean) return true;
    return [
      capsule.label,
      capsule.prompt,
      capsule.audience,
      capsule.output,
      capsule.code,
      ...capsule.contextCores,
      publicCategoryForTemplate(capsule.id)?.label ?? '',
    ].join(' ').toLowerCase().includes(clean);
  });
}

function filterUserCapsules(capsules: PraxisCapsuleSummary[], query: string, category: string): PraxisCapsuleSummary[] {
  const clean = query.trim().toLowerCase();
  return capsules
    .filter((capsule) => {
      const tags = capsule.community?.tags ?? [];
      const counts = capsuleCounts(capsule);
      const isArchived = Boolean(capsule.archivedAt);
      const policyTeam = getPolicyTeamCategory(category);
      const matchesCategory =
        category === 'all' ? !isArchived :
        category === 'archived' ? isArchived :
        category === 'context' ? !isArchived && (capsule.scope === 'user' || capsule.scope === 'situation' || capsule.scope === 'team') :
        category === 'tool-capsules' ? !isArchived && counts.tools > 0 :
        category === 'agents' ? !isArchived && ((capsule.coreRefs.objectiveCoreIds?.length ?? 0) > 0 || (capsule.coreRefs.toolCoreIds?.length ?? 0) > 0) :
        category === 'source-docs' ? !isArchived && (counts.sources + counts.documents > 0) :
        category === 'outputs' ? !isArchived && counts.outputs > 0 :
        policyTeam ? !isArchived && categoryMatchesPolicyTeam(tags, policyTeam) :
        !isArchived && (capsule.scope === category || tags.includes(category));
      if (!matchesCategory) return false;
      if (!clean) return true;
      return [
        capsule.capsuleId,
        capsule.label,
        capsule.scope,
        ...tags,
        ...(capsule.coreRefs.sourceCoreIds ?? []),
        ...(capsule.coreRefs.documentCoreIds ?? []),
      ].join(' ').toLowerCase().includes(clean);
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function capsuleCategoryLabel(category: string): string {
  return capsuleLibraryFilters.find((filter) => filter.id === category)?.label ??
    getPolicyTeamCategory(category)?.shortLabel ??
    category.replaceAll('-', ' ');
}

function categoryMatchesPolicyTeam(tags: string[], category: PolicyTeamCategory): boolean {
  const normalized = new Set(tags);
  return normalized.has(category.id) ||
    category.policyPathIds.some((pathId) => normalized.has(pathId)) ||
    category.sourceTags.some((tag) => normalized.has(tag));
}

function capsuleCounts(capsule: PraxisCapsuleSummary) {
  return {
    sources: capsule.coreRefs.sourceCoreIds?.length ?? 0,
    documents: capsule.coreRefs.documentCoreIds?.length ?? 0,
    tools: capsule.coreRefs.toolCoreIds?.length ?? 0,
    outputs: (capsule.coreRefs.outputCoreIds?.length ?? 0) + (capsule.coreRefs.productCoreIds?.length ?? 0),
  };
}

function CapsuleMap({
  capsule,
  fallbackLabel,
  agentRunCount,
  onFilter,
}: {
  capsule: PraxisCapsuleSummary | null;
  fallbackLabel: string;
  agentRunCount: number;
  onFilter: (filter: string) => void;
}) {
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  const state = capsule ? capsuleState(capsule) : 'building';
  const segments = [
    { id: 'documents', label: 'Documents', value: counts.documents, filter: 'source-docs', icon: FileText },
    { id: 'sources', label: 'Sources', value: counts.sources, filter: 'source-docs', icon: Search },
    { id: 'tools', label: 'Tools', value: counts.tools, filter: 'tool-capsules', icon: WandSparkles },
    { id: 'outputs', label: 'Outputs', value: counts.outputs, filter: 'outputs', icon: Clipboard },
    { id: 'agents', label: 'Agents', value: agentRunCount || PRAXIS_POLICY_AGENTS.filter((agent) => agent.readiness === 'live').length, filter: 'agents', icon: Sparkles },
    { id: 'team', label: 'Policy team', value: capsule?.community?.tags?.length ?? 0, filter: 'all', icon: ShieldCheck },
  ];

  return (
    <section className="mt-6 w-full max-w-5xl rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm shadow-black/5" data-testid="capsule-map">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#f8f8f6]">
            <div className="absolute inset-2 rounded-full border border-[#ff714d]/25" />
            <div className="absolute inset-5 rounded-full border border-sage/30" />
            <span className="praxis-thinking-glyph flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">◳</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Active capsule</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{capsule?.label ?? fallbackLabel}</p>
            <CapsuleStateBadge state={state} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {segments.map((segment) => (
            <button
              key={segment.id}
              type="button"
              onClick={() => onFilter(segment.filter)}
              className="group rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#ff714d]/40 hover:shadow-sm"
              data-testid={`capsule-map-${segment.id}`}
            >
              <span className="flex items-center justify-between gap-2">
                <segment.icon className="h-4 w-4 text-slate-400 group-hover:text-[#ca4a25]" />
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">{segment.value}</span>
              </span>
              <span className="mt-4 block text-xs font-semibold text-slate-800">{segment.label}</span>
              <span className="mt-1 block h-1 rounded-full bg-slate-100">
                <span className="block h-1 rounded-full bg-[#ff714d]" style={{ width: `${Math.min(100, Math.max(12, segment.value * 24))}%` }} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function capsuleState(capsule: PraxisCapsuleSummary): keyof typeof capsuleStateStyles {
  if (capsule.archivedAt) return 'archived';
  const counts = capsuleCounts(capsule);
  const updatedAt = Date.parse(capsule.updatedAt);
  if (counts.documents + counts.sources + counts.tools + counts.outputs === 0) return 'empty';
  if (counts.documents === 0) return 'needs-documents';
  if (counts.sources === 0) return 'needs-sources';
  if (Number.isFinite(updatedAt) && Date.now() - updatedAt > 1000 * 60 * 60 * 24 * 14) return 'stale';
  if (counts.tools === 0 || counts.outputs === 0) return 'building';
  return 'ready';
}

function CapsuleStateBadge({ state }: { state: keyof typeof capsuleStateStyles }) {
  return (
    <span className={cn('mt-2 inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold', capsuleStateStyles[state])}>
      {state.replaceAll('-', ' ')}
    </span>
  );
}

function ConnectorCard({ connector, onUpload }: { connector: CapsuleConnectorDefinition; onUpload?: () => void }) {
  const Icon = connectorIconMap[connector.icon];
  const live = connector.status === 'live';
  return (
    <article className="rounded-md border border-slate-200 p-3" data-testid={`connector-card-${connector.id}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold text-slate-900">{connector.label}</p>
            <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
              {connector.status.replaceAll('-', ' ')}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{connector.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {connector.fillsSlots.slice(0, 3).map((slot) => (
              <span key={slot} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{slot}</span>
            ))}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">risk {connector.riskLevel}</span>
          </div>
        </div>
      </div>
      {onUpload ? (
        <button type="button" onClick={onUpload} className="mt-3 w-full rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
          Upload file
        </button>
      ) : null}
    </article>
  );
}

function CapsuleEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-sm font-semibold text-slate-500">
      {label}
    </div>
  );
}

function CapsuleCard({
  capsule,
  active,
  onSelect,
  onAsk,
  onImprove,
  onArchive,
  onTag,
}: {
  capsule: PraxisCapsuleSummary;
  active: boolean;
  onSelect: () => void;
  onAsk: () => void;
  onImprove: () => void;
  onArchive: () => void;
  onTag: (tag: string) => void;
}) {
  const counts = capsuleCounts(capsule);
  const state = capsuleState(capsule);
  const [tagDraft, setTagDraft] = useState('');
  return (
    <article className={cn('rounded-lg border bg-white p-4 shadow-sm shadow-black/5', active ? 'border-[#ff714d]' : 'border-black/10')}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-base font-semibold text-slate-900">{capsule.label}</span>
          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">v{capsule.version}</span>
        </span>
        <CapsuleStateBadge state={state} />
        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1"><Circle className="h-2 w-2 fill-current" /> {capsule.scope}</span>
          <span>{counts.documents} docs</span>
          <span>{counts.sources} sources</span>
          <span>{counts.tools} tools</span>
        </span>
      </button>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(capsule.community?.tags ?? []).slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">{tag}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAsk} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ask</button>
        <button type="button" onClick={onImprove} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Improve</button>
        <button type="button" onClick={onArchive} className="ml-auto rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700">Archive</button>
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onTag(tagDraft);
          setTagDraft('');
        }}
      >
        <input
          value={tagDraft}
          onChange={(event) => setTagDraft(event.target.value)}
          placeholder="Add category"
          className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none placeholder:text-slate-400 focus:border-[#ff714d]"
        />
        <button type="submit" disabled={!tagDraft.trim()} className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white disabled:bg-slate-300">Save</button>
      </form>
    </article>
  );
}

function CapsuleDetailPanel({
  capsule,
  policyTeam,
  recommendations,
  detailTab,
  repositoryDocuments,
  repositoryLoading,
  agentRuns,
  agentRunsLoading,
  focusedRun,
  focusedRunEvents,
  focusedRunLoading,
  selectedAgentId,
  onUpload,
  onDetailTab,
  onOpenRepository,
  onImprove,
  onRefresh,
  onSelectAgent,
  onRunAgent,
  onAssignPolicyTeam,
  onAttachTool,
}: {
  capsule: PraxisCapsuleSummary | null;
  policyTeam: PolicyTeamCategory | null;
  recommendations: CapsuleToolRecommendation[];
  detailTab: CapsuleDetailTab;
  repositoryDocuments: RepositoryDocument[];
  repositoryLoading: boolean;
  agentRuns: AgentRunSummary[];
  agentRunsLoading: boolean;
  focusedRun: AgentRunDetail | null;
  focusedRunEvents: AgentRunEventSummary[];
  focusedRunLoading: boolean;
  selectedAgentId: string;
  onUpload: () => void;
  onDetailTab: (tab: CapsuleDetailTab) => void;
  onOpenRepository: () => void;
  onImprove: () => void;
  onRefresh: () => void;
  onSelectAgent: (agentId: string) => void;
  onRunAgent: (agent: PolicyAgentDefinition) => void;
  onAssignPolicyTeam: (category: PolicyTeamCategory) => void;
  onAttachTool: (recommendation: CapsuleToolRecommendation) => void;
}) {
  if (!capsule) {
    return (
      <aside className="rounded-lg border border-black/10 bg-white p-4 text-sm text-slate-500">
        Select a capsule.
      </aside>
    );
  }
  const counts = capsuleCounts(capsule);
  const state = capsuleState(capsule);
  return (
    <aside className="rounded-lg border border-black/10 bg-white p-4 shadow-sm shadow-black/5" data-testid="capsule-detail-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{capsule.label}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{capsule.capsuleId}</p>
        </div>
        <CapsuleStateBadge state={state} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric label="Docs" value={counts.documents} />
        <Metric label="Sources" value={counts.sources} />
        <Metric label="Tools" value={counts.tools} />
        <Metric label="Outputs" value={counts.outputs} />
      </div>
      <CapsuleHealthMeter counts={counts} state={state} agentRunCount={agentRuns.length} />
      <div className="mt-4 grid grid-cols-4 gap-1 rounded-md bg-slate-100 p-1" data-testid="capsule-detail-tabs">
        {(['build', 'connect', 'retrieve', 'agents'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onDetailTab(tab)}
            className={cn(
              'rounded px-2 py-1.5 text-xs font-semibold capitalize',
              detailTab === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {detailTab === 'build' ? <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Policy team</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {POLICY_TEAM_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onAssignPolicyTeam(category)}
              className={cn(
                'rounded-md border px-2 py-1.5 text-left text-[11px] font-semibold',
                policyTeam?.id === category.id ? 'border-[#ff714d] bg-[#fff2ed] text-[#ca4a25]' : 'border-slate-200 text-slate-500 hover:bg-slate-50',
              )}
            >
              {category.shortLabel}
            </button>
          ))}
        </div>
      </div> : null}
      {detailTab === 'build' ? <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Missing questions</p>
        <div className="mt-2 space-y-1.5">
          {(policyTeam?.missingInfoPrompts ?? ['What decision is this serving?', 'Which sources should travel with the answer?', 'What output should PRAXIS prepare?']).slice(0, 3).map((question) => (
            <p key={question} className="rounded-md border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-600">{question}</p>
          ))}
        </div>
      </div> : null}
      {detailTab === 'build' ? <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Tool suggestions</p>
        <div className="mt-2 space-y-2">
          {recommendations.map((recommendation) => {
            const attached = capsule.coreRefs.toolCoreIds?.includes(recommendation.tool.id) ?? false;
            return (
              <button
                key={recommendation.tool.id}
                type="button"
                disabled={attached}
                onClick={() => onAttachTool(recommendation)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50 disabled:cursor-default disabled:bg-slate-50"
              >
                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-800">
                  <span className="truncate">{recommendation.tool.shortLabel}</span>
                  <span className="shrink-0 text-[11px] text-slate-400">{attached ? 'attached' : 'add'}</span>
                </span>
                <span className="mt-1 block truncate text-[11px] text-slate-400">{recommendation.reason}</span>
              </button>
            );
          })}
        </div>
      </div> : null}
      {detailTab === 'connect' ? (
        <div className="mt-4 space-y-2" data-testid="capsule-connector-cards">
          {CAPSULE_CONNECTOR_REGISTRY.map((connector) => (
            <ConnectorCard key={connector.id} connector={connector} onUpload={connector.id === 'upload' ? onUpload : undefined} />
          ))}
        </div>
      ) : null}
      {detailTab === 'retrieve' ? (
        <div className="mt-4 space-y-3" data-testid="capsule-retrieve-status">
          <div className="rounded-md border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-800">Local hybrid retrieval</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              {counts.documents > 0 ? `${counts.documents} document ref(s), ${counts.sources} source ref(s), using the current chunk and embedding path.` : 'Upload or import documents before retrieval can ground answers.'}
            </p>
          </div>
          <div className="rounded-md border border-dashed border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-800">Vertex/Gemini RAG</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">Advanced optional mirror. The default retrieval path still works without Vertex configuration.</p>
          </div>
          {repositoryLoading ? <p className="text-xs text-slate-500">Loading repository...</p> : null}
          {repositoryDocuments.slice(0, 4).map((document) => (
            <div key={document.id} className="rounded-md border border-slate-200 px-3 py-2">
              <p className="truncate text-xs font-semibold text-slate-800">{document.title}</p>
              <p className="mt-1 text-[11px] text-slate-400">{document.status} · {document.chunkCount ?? 0} chunks · {document.fileType}</p>
            </div>
          ))}
          {!repositoryLoading && repositoryDocuments.length === 0 ? <p className="text-xs text-slate-500">No repository documents loaded for this capsule.</p> : null}
        </div>
      ) : null}
      {detailTab === 'agents' ? (
        <div className="mt-4 space-y-3" data-testid="capsule-agent-lane">
          {focusedRunLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-500">
              Opening selected agent run...
            </div>
          ) : null}
          {focusedRun ? <FocusedAgentRunPanel detail={focusedRun} events={focusedRunEvents} /> : null}
          <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm shadow-slate-950/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">Capsule agents</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Agents inherit this capsule, selected cores, repository sources, approval posture, and output target.</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {PRAXIS_POLICY_AGENTS.map((agent) => (
              <AgentRegistryCard
                key={agent.id}
                agent={agent}
                selected={selectedAgentId === agent.id}
                onSelect={() => onSelectAgent(agent.id)}
                onRun={() => onRunAgent(agent)}
              />
            ))}
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-800">Recent runs</p>
              <span className="text-[11px] font-semibold text-slate-400">{agentRunsLoading ? 'loading' : `${agentRuns.length} shown`}</span>
            </div>
            <div className="mt-2 space-y-2">
              {agentRuns.map((run) => (
                <article key={run.runId} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 shadow-sm shadow-slate-950/[0.02]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-800">{run.policyAgentLabel ?? run.policyAgentId ?? 'Capsule agent'}</p>
                    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', agentRunStatusClass(run.status))}>{run.status.replaceAll('_', ' ')}</span>
                  </div>
                  <AgentStatusRail status={run.status} compact />
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{run.objective}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-mono text-[10px] text-slate-400">{run.runId.slice(0, 12)} · {new Date(run.createdAt).toLocaleDateString()}</p>
                    <Link href={`/agents/${encodeURIComponent(run.runId)}`} className="text-[11px] font-semibold text-[#ca4a25] hover:underline">Open</Link>
                  </div>
                </article>
              ))}
              {!agentRunsLoading && agentRuns.length === 0 ? <p className="text-xs text-slate-500">No durable agent runs yet. Run Research Memo or Output Formatter to create one.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={onUpload} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Upload className="h-4 w-4" />
          Upload
        </button>
        <button type="button" onClick={onOpenRepository} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Library className="h-4 w-4" />
          Repository
        </button>
        <button type="button" onClick={onImprove} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <WandSparkles className="h-4 w-4" />
          Improve
        </button>
        <button type="button" onClick={onRefresh} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">Refresh</button>
      </div>
      <p className="mt-4 text-xs text-slate-400">Updated {new Date(capsule.updatedAt).toLocaleDateString()}</p>
    </aside>
  );
}

function FocusedAgentRunPanel({ detail, events }: { detail: AgentRunDetail; events: AgentRunEventSummary[] }) {
  const { run, toolCalls = [], approvals = [] } = detail;
  const latestEvents = (events.length ? events : [{ id: 'empty', eventType: 'run.loaded', message: 'Run loaded. Waiting for worker receipts.', createdAt: run.updatedAt }]).slice(-5);
  return (
    <article className="overflow-hidden rounded-xl border border-[#ff714d]/25 bg-[#fff8f5] shadow-sm shadow-[#ff714d]/10" data-testid="focused-agent-run">
      <div className="relative border-b border-[#ff714d]/15 bg-gradient-to-br from-[#fff7f3] via-white to-[#f8fafc] p-4">
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full border border-[#ff714d]/20" aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ca4a25]">Agent workspace</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-950">{run.policyAgentLabel ?? run.policyAgentId ?? 'Capsule agent workspace'}</p>
            <p className="mt-1 break-all font-mono text-[10px] leading-4 text-slate-500">{run.runId}</p>
          </div>
          <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', agentRunStatusClass(run.status))}>
            {run.status.replaceAll('_', ' ')}
          </span>
        </div>
        <AgentStatusRail status={run.status} />
        <p className="relative mt-3 text-xs leading-5 text-slate-700">{run.objective}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        <ReceiptTile label="Events" value={events.length} icon={Clipboard} tone="slate" />
        <ReceiptTile label="Tools" value={toolCalls.length} icon={WandSparkles} tone="amber" />
        <ReceiptTile label="Approvals" value={approvals.length} icon={ShieldCheck} tone="emerald" />
      </div>
      {run.outputHref ? (
        <div className="px-3 pb-3">
          <Link href={run.outputHref} className="inline-flex rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
            Open output
          </Link>
        </div>
      ) : null}
      <RunEventTimeline events={latestEvents} />
    </article>
  );
}

function CapsuleHealthMeter({
  counts,
  state,
  agentRunCount,
}: {
  counts: ReturnType<typeof capsuleCounts>;
  state: keyof typeof capsuleStateStyles;
  agentRunCount: number;
}) {
  const total = counts.documents + counts.sources + counts.tools + counts.outputs + agentRunCount;
  const slots = [
    { label: 'Docs', active: counts.documents > 0, tone: 'bg-sky-500' },
    { label: 'Sources', active: counts.sources > 0, tone: 'bg-emerald-500' },
    { label: 'Tools', active: counts.tools > 0, tone: 'bg-amber-500' },
    { label: 'Outputs', active: counts.outputs > 0, tone: 'bg-violet-500' },
    { label: 'Runs', active: agentRunCount > 0, tone: 'bg-[#ff714d]' },
  ];
  const active = slots.filter((slot) => slot.active).length;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Capsule health</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">{active}/5 layers active · {state.replaceAll('-', ' ')}</p>
        </div>
        <span className="rounded-md bg-white px-2 py-1 font-mono text-[11px] font-semibold text-slate-500">{total} refs</span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {slots.map((slot) => (
          <span key={slot.label} className="h-1.5 rounded-full bg-white" title={slot.label}>
            <span className={cn('block h-1.5 rounded-full transition', slot.active ? slot.tone : 'bg-slate-200')} />
          </span>
        ))}
      </div>
    </div>
  );
}

function AgentStatusRail({ status, compact = false }: { status: AgentRunSummary['status']; compact?: boolean }) {
  const steps: Array<{ id: AgentRunSummary['status'] | 'created'; label: string }> = [
    { id: 'queued', label: 'Queued' },
    { id: 'running', label: 'Running' },
    { id: 'waiting_approval', label: 'Approval' },
    { id: 'succeeded', label: 'Output' },
  ];
  const terminalFailed = status === 'failed' || status === 'cancelled' || status === 'expired';
  const activeIndex = terminalFailed ? 1 : Math.max(0, steps.findIndex((step) => step.id === status));

  return (
    <div className={cn('grid grid-cols-4 gap-1', compact ? 'mt-2' : 'mt-4')}>
      {steps.map((step, index) => {
        const active = index <= activeIndex && !terminalFailed;
        const current = step.id === status;
        return (
          <span key={step.id} className="min-w-0">
            <span className={cn('block h-1 rounded-full', active ? 'bg-[#ff714d]' : terminalFailed && index === activeIndex ? 'bg-rose-400' : 'bg-slate-200')} />
            {!compact ? (
              <span className={cn('mt-1 block truncate text-[10px] font-semibold', current ? 'text-slate-800' : 'text-slate-400')}>{step.label}</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function ReceiptTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: 'slate' | 'amber' | 'emerald';
}) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }[tone];

  return (
    <span className="rounded-lg border border-slate-200 bg-white p-2">
      <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-md', toneClass)}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="mt-2 block text-lg font-semibold leading-none text-slate-900">{value}</span>
      <span className="mt-1 block text-[11px] font-semibold text-slate-400">{label}</span>
    </span>
  );
}

function RunEventTimeline({ events }: { events: AgentRunEventSummary[] }) {
  return (
    <div className="border-t border-[#ff714d]/15 bg-white/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Run receipts</p>
      <div className="mt-3 space-y-0">
        {events.map((event, index) => (
          <div key={event.id} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2">
            <span className="flex flex-col items-center">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#ff714d]" />
              {index < events.length - 1 ? <span className="mt-1 h-full min-h-8 w-px bg-slate-200" /> : null}
            </span>
            <span className="pb-3">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-semibold text-slate-800">{event.eventType.replaceAll('_', ' ')}</span>
                <span className="shrink-0 text-[10px] font-semibold text-slate-400">{formatEventTime(event.createdAt)}</span>
              </span>
              {event.message ? <span className="mt-1 block text-[11px] leading-5 text-slate-500">{event.message}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentRegistryCard({
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
  const runnable = agent.readiness === 'live' || agent.readiness === 'queued';
  return (
    <article className={cn('rounded-md border p-3', selected ? 'border-[#ff714d] bg-[#fff7f3]' : 'border-slate-200')}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">{agent.label}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{agent.description}</p>
          </div>
          <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', agentReadinessClass(agent.readiness))}>
            {agent.readiness}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', agentRiskClass(agent.riskLevel))}>risk {agent.riskLevel}</span>
          {agent.capsuleSlots.slice(0, 3).map((slot) => (
            <span key={slot} className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{slot}</span>
          ))}
        </div>
      </button>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={onSelect} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          Select
        </button>
        <button
          type="button"
          disabled={!runnable}
          onClick={onRun}
          className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {runnable ? agent.actionLabel : 'Planned'}
        </button>
      </div>
    </article>
  );
}

function agentReadinessClass(readiness: PolicyAgentDefinition['readiness']): string {
  switch (readiness) {
    case 'live':
      return 'bg-emerald-50 text-emerald-700';
    case 'queued':
      return 'bg-sky-50 text-sky-700';
    case 'gated':
      return 'bg-amber-50 text-amber-700';
    case 'planned':
      return 'bg-slate-100 text-slate-500';
  }
}

function agentRiskClass(risk: PolicyAgentDefinition['riskLevel']): string {
  switch (risk) {
    case 'low':
      return 'bg-emerald-50 text-emerald-700';
    case 'medium':
      return 'bg-amber-50 text-amber-700';
    case 'high':
      return 'bg-rose-50 text-rose-700';
  }
}

function agentRunStatusClass(status: AgentRunSummary['status']): string {
  switch (status) {
    case 'succeeded':
      return 'bg-emerald-100 text-emerald-700';
    case 'running':
    case 'queued':
      return 'bg-sky-100 text-sky-700';
    case 'waiting_approval':
      return 'bg-amber-100 text-amber-700';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'bg-rose-100 text-rose-700';
  }
}

function parseAgentRunSse(text: string): AgentRunEventSummary[] {
  return text
    .split('\n\n')
    .map((chunk) => {
      const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '));
      if (!dataLine) return null;
      try {
        const parsed = JSON.parse(dataLine.slice(6)) as AgentRunEventSummary;
        if (!parsed.id || !parsed.eventType || !parsed.createdAt) return null;
        return parsed;
      } catch {
        return null;
      }
    })
    .filter((event): event is AgentRunEventSummary => Boolean(event));
}

function formatEventTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'now';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageActionRow({
  onCopy,
  onRetry,
  onSave,
  onMemo,
  onSourceCheck,
}: {
  onCopy: () => void;
  onRetry: () => void;
  onSave: () => void;
  onMemo: () => void;
  onSourceCheck: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3" data-testid="message-action-row">
      <IconTextButton icon={Copy} label="Copy" onClick={onCopy} />
      <IconTextButton icon={RefreshCcw} label="Retry" onClick={onRetry} />
      <IconTextButton icon={Save} label="Save to capsule" onClick={onSave} />
      <IconTextButton icon={FileText} label="Create memo" onClick={onMemo} />
      <IconTextButton icon={ShieldCheck} label="Source-check" onClick={onSourceCheck} />
    </div>
  );
}

function CapsuleBuilderDialog({
  label,
  notes,
  links,
  categoryId,
  onLabel,
  onNotes,
  onLinks,
  onCategory,
  onClose,
  onCreate,
}: {
  label: string;
  notes: string;
  links: string;
  categoryId: string;
  onLabel: (value: string) => void;
  onNotes: (value: string) => void;
  onLinks: (value: string) => void;
  onCategory: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center" data-testid="capsule-builder-dialog">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ca4a25]">New ContextCapsule</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Build a capsule around the work.</h2>
          </div>
          <button type="button" aria-label="Close capsule builder" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Capsule name</span>
            <input value={label} onChange={(event) => onLabel(event.target.value)} placeholder="Director handover, Syria access brief, HR policy review..." className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ff714d]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Policy team preset</span>
            <select value={categoryId} onChange={(event) => onCategory(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff714d]">
              {POLICY_TEAM_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">What should PRAXIS remember?</span>
            <textarea value={notes} onChange={(event) => onNotes(event.target.value)} rows={5} placeholder="Paste brief context, assumptions, stakeholders, deadlines, rules, and open questions." className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ff714d]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Source links or repositories</span>
            <textarea value={links} onChange={(event) => onLinks(event.target.value)} rows={3} placeholder="Paste URLs, Drive folders, source lists, or internal repository notes." className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ff714d]" />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={onCreate} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Create capsule</button>
        </div>
      </section>
    </div>
  );
}

function RepositorySheet({
  capsule,
  documents,
  documentRefs,
  loading,
  onClose,
  onRefresh,
  onUpload,
  onRun,
}: {
  capsule: PraxisCapsuleSummary | null;
  documents: RepositoryDocument[];
  documentRefs: string[];
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onUpload: () => void;
  onRun: (prompt: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/25" data-testid="capsule-repository-sheet">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ca4a25]">Capsule repository</p>
              <h2 className="mt-1 truncate text-xl font-semibold text-slate-950">{capsule?.label ?? 'No capsule selected'}</h2>
              <p className="mt-1 text-sm text-slate-500">Documents, generated outputs, source receipts, and reusable context attached to this capsule.</p>
            </div>
            <button type="button" aria-label="Close repository" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <IconTextButton icon={Upload} label="Upload" onClick={onUpload} />
            <IconTextButton icon={RefreshCcw} label="Refresh" onClick={onRefresh} />
            <IconTextButton icon={Search} label="Find missing sources" onClick={() => onRun('Find missing sources for the active capsule repository. Return the missing source list and search plan.')} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Documents" value={documents.length || documentRefs.length} />
            <Metric label="Source refs" value={capsule?.coreRefs.sourceCoreIds?.length ?? 0} />
            <Metric label="Outputs" value={(capsule?.coreRefs.outputCoreIds?.length ?? 0) + (capsule?.coreRefs.productCoreIds?.length ?? 0)} />
          </div>
          <div className="mt-5 space-y-2">
            {loading ? <CapsuleEmptyState label="Loading repository..." /> : null}
            {!loading && documents.length === 0 && documentRefs.length === 0 ? <CapsuleEmptyState label="No documents are attached yet." /> : null}
            {documents.map((document) => (
              <article key={document.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{document.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{document.fileType} · {document.status} · {document.chunkCount ?? 0} chunks</p>
                  </div>
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onRun(`Summarize the document "${document.title}" for the active capsule. Include source posture, key claims, dates, actors, and gaps.`)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Summarize</button>
                  <button type="button" onClick={() => onRun(`Extract temporal, causal, and human-friction signals from "${document.title}" for the active capsule.`)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Extract signals</button>
                </div>
              </article>
            ))}
            {!loading && documents.length === 0 ? documentRefs.map((documentId) => (
              <article key={documentId} className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                Attached document ref: <span className="font-mono text-xs">{documentId}</span>
              </article>
            )) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

function CapsuleInspectorSheet({
  capsule,
  policyTeam,
  onClose,
  onImprove,
  onRepository,
}: {
  capsule: PraxisCapsuleSummary | null;
  policyTeam: PolicyTeamCategory | null;
  onClose: () => void;
  onImprove: () => void;
  onRepository: () => void;
}) {
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  return (
    <div className="fixed inset-0 z-40 bg-black/25" data-testid="capsule-inspector-sheet">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ca4a25]">Capsule inspector</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-slate-950">{capsule?.label ?? 'No capsule selected'}</h2>
          </div>
          <button type="button" aria-label="Close inspector" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Metric label="Documents" value={counts.documents} />
          <Metric label="Sources" value={counts.sources} />
          <Metric label="Tools" value={counts.tools} />
          <Metric label="Outputs" value={counts.outputs} />
        </div>
        <div className="mt-5 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Reasoning posture</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            {['Sourceability', 'Temporality', 'Causality', 'Human friction', 'Rules', 'Handover'].map((item) => (
              <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{item}</span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {policyTeam ? `${policyTeam.label} preset active.` : 'Assign a policy-team preset to improve tool recommendations and output defaults.'}
          </p>
        </div>
        <div className="mt-5 space-y-2">
          <button type="button" onClick={onRepository} className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Open repository</button>
          <button type="button" onClick={onImprove} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Improve capsule</button>
        </div>
      </aside>
    </div>
  );
}

function AgentActionDrawer({
  selectedAgentId,
  onClose,
  onSelectAgent,
  onRunAgent,
  onRun,
}: {
  selectedAgentId: string;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
  onRunAgent: (agent: PolicyAgentDefinition) => void;
  onRun: (prompt: string) => void;
}) {
  const selectedAgent = PRAXIS_POLICY_AGENTS.find((agent) => agent.id === selectedAgentId) ?? PRAXIS_POLICY_AGENTS[0]!;
  return (
    <div className="fixed inset-0 z-40 bg-black/25" data-testid="agent-action-drawer">
      <aside className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ca4a25]">Policy actions</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Run capsule-aware research.</h2>
            </div>
            <button type="button" aria-label="Close agent actions" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid gap-3 overflow-y-auto p-5">
          <section className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Capsule agent</p>
            <select
              value={selectedAgentId}
              onChange={(event) => onSelectAgent(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#ff714d]"
            >
              {PRAXIS_POLICY_AGENTS.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.label}</option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">{selectedAgent.description}</p>
            <button type="button" onClick={() => onRunAgent(selectedAgent)} className="mt-3 w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              {selectedAgent.actionLabel}
            </button>
          </section>
          {capsuleActionPrompts.map((action) => (
            <button key={action.label} type="button" onClick={() => onRun(action.prompt)} className="rounded-lg border border-slate-200 p-4 text-left hover:border-[#ff714d]/50 hover:bg-[#fff7f3]">
              <span className="block text-sm font-semibold text-slate-950">{action.label}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">{action.prompt}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function IconTextButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md border border-slate-200 p-2">
      <span className="block text-lg font-semibold text-slate-900">{value}</span>
      <span className="block text-[11px] font-semibold text-slate-400">{label}</span>
    </span>
  );
}

function SidebarButton({ icon: Icon, label, onClick, active = false }: { icon: LucideIcon; label: string; onClick: () => void; active?: boolean }) {
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
