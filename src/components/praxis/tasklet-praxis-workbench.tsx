'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowUp,
  ChevronDown,
  Circle,
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
  WandSparkles,
  X,
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
  POLICY_TEAM_CATEGORIES,
  categoryTagsForPolicyTeam,
  getPolicyTeamCategory,
  policyTeamCategoryForTags,
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
  recentRuns?: Array<{ label: string; detail: string; status: string }>;
  className?: string;
};

type PolicyNeedTabId = (typeof POLICY_NEED_TABS)[number]['id'];
type ChatMessage = { role: 'user' | 'assistant'; text: string };
type CapsuleRole = 'user' | 'situation' | 'tool' | 'output';
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

const capsuleLibraryFilters = [
  { id: 'all', label: 'All' },
  { id: 'context', label: 'Context' },
  { id: 'tool-capsules', label: 'Tools' },
  { id: 'source-docs', label: 'Docs' },
  { id: 'outputs', label: 'Outputs' },
  { id: 'archived', label: 'Archived' },
] as const;

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
  const filteredUserCapsules = filterUserCapsules(userCapsules, capsuleSearch, capsuleCategory);
  const filteredCapsules = COCKPIT_CAPSULE_LIBRARY.filter((capsule) => {
    const query = capsulePickerQuery.trim().toLowerCase();
    return !query || capsule.label.toLowerCase().includes(query) || capsule.prompt.toLowerCase().includes(query) || capsule.code.toLowerCase().includes(query);
  }).slice(0, 8);
  const conversationThreadId = `tasklet-${currentCapsuleId}`;

  useEffect(() => {
    setActiveCapsules((current) => {
      const first = current[0];
      if (first?.id === capsuleId && first.label === activeCapsuleName) return current;
      setCurrentCapsuleId(capsuleId);
      return [{ id: capsuleId, label: activeCapsuleName, code: 'SITUATION', role: 'situation' }, ...current.slice(1)];
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
      else setStatus('Connectors are managed from this PRAXIS page. Add source access through the capsule bar.');
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
              <Link href={isAuthenticated ? '/pricing' : '/login?mode=signup'} className="text-sage">Upgrade</Link>
            </div>

            <div className="mt-5 flex w-full max-w-5xl flex-wrap items-center justify-center gap-2" data-testid="policy-team-next-actions">
              {policyNextActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setPrompt(action.prompt);
                    if (action.label !== 'Ask') void sendToPraxis(selectedAgent, action.prompt);
                  }}
                  className="rounded-md border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-black/5 transition hover:border-[#ff714d]/40 hover:bg-[#fff7f3]"
                >
                  {action.label}
                </button>
              ))}
            </div>

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
                    className={cn(
                      'rounded-lg px-4 py-3 text-sm leading-6 shadow-sm',
                      message.role === 'user' ? 'ml-auto max-w-[82%] bg-slate-950 text-white shadow-black/10' : 'mr-auto max-w-[92%] border border-slate-200 bg-white text-slate-900 shadow-black/5',
                    )}
                  >
                    <div className={cn('mb-2 text-[11px] font-semibold uppercase tracking-wide', message.role === 'user' ? 'text-white/60' : 'text-slate-400')}>
                      {message.role === 'user' ? 'You' : 'PRAXIS'}
                    </div>
                    {message.role === 'assistant' ? (
                      <AssistantMarkdown text={message.text || 'Reading context...'} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    )}
                  </article>
                ))}
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
                    New
                  </button>
                </div>
              </div>

              <nav className="mt-4 flex flex-wrap gap-2" aria-label="Capsule categories">
                {capsuleCategories.map((category) => (
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
                    onUpload={() => fileInputRef.current?.click()}
                    onImprove={() => improveCapsule()}
                    onRefresh={() => void refreshCapsules(currentCapsuleId)}
                    onAssignPolicyTeam={(category) => {
                      if (selectedCapsule) void assignPolicyTeam(selectedCapsule, category);
                    }}
                    onAttachTool={(recommendation) => {
                      if (selectedCapsule) void attachRecommendedTool(selectedCapsule, recommendation);
                    }}
                  />
                </div>
              ) : (
                <div className="mt-10 grid gap-x-12 gap-y-14 md:grid-cols-3" data-testid="tasklet-capsule-cards">
                  {capsules.map((capsule) => (
                    <article key={capsule.id} className="min-h-40">
                      <FolderKanban className="mb-4 h-5 w-5 text-slate-400" />
                      <h3 className="text-lg font-semibold text-slate-800">{capsule.label}</h3>
                      <p className="mt-4 text-sm leading-6 text-slate-500">{capsule.prompt}</p>
                      <button type="button" onClick={() => addCapsule(capsule.id)} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#ff714d]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Build capsule
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
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
  const [tagDraft, setTagDraft] = useState('');
  return (
    <article className={cn('rounded-lg border bg-white p-4 shadow-sm shadow-black/5', active ? 'border-[#ff714d]' : 'border-black/10')}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-base font-semibold text-slate-900">{capsule.label}</span>
          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">v{capsule.version}</span>
        </span>
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
  onUpload,
  onImprove,
  onRefresh,
  onAssignPolicyTeam,
  onAttachTool,
}: {
  capsule: PraxisCapsuleSummary | null;
  policyTeam: PolicyTeamCategory | null;
  recommendations: CapsuleToolRecommendation[];
  onUpload: () => void;
  onImprove: () => void;
  onRefresh: () => void;
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
  return (
    <aside className="rounded-lg border border-black/10 bg-white p-4 shadow-sm shadow-black/5" data-testid="capsule-detail-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{capsule.label}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{capsule.capsuleId}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">{capsule.trust?.label ?? capsule.scope}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric label="Docs" value={counts.documents} />
        <Metric label="Sources" value={counts.sources} />
        <Metric label="Tools" value={counts.tools} />
        <Metric label="Outputs" value={counts.outputs} />
      </div>
      <div className="mt-4">
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
      </div>
      <div className="mt-4">
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
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={onUpload} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Upload className="h-4 w-4" />
          Upload
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md border border-slate-200 p-2">
      <span className="block text-lg font-semibold text-slate-900">{value}</span>
      <span className="block text-[11px] font-semibold text-slate-400">{label}</span>
    </span>
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
