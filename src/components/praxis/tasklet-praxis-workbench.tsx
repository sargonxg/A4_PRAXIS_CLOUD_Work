'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowUp,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  Clipboard,
  Copy,
  Database,
  Download,
  FileText,
  GitBranch,
  GripVertical,
  HardDrive,
  Library,
  Loader2,
  LockKeyhole,
  Mail,
  Map as MapIcon,
  Mic,
  Monitor,
  Paperclip,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AccountProfileButton } from '@/components/app/account-profile-button';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { RuntimeHealthSemaphore } from '@/components/praxis/runtime-health-semaphore';
import { SourcePostureChip, WorkActionMenu } from '@/components/ui/instrument';
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
} from '@/lib/product/cockpit-composition';
import {
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_CONNECTOR_REGISTRY,
  POLICY_TEAM_CATEGORIES,
  buildCapsuleTaxonomyStats,
  categoryTagsForPolicyTeam,
  getPolicyTeamCategory,
  normalizeCapsuleTaxonomyTags,
  policyTeamCategoryForTags,
  resolveCapsuleTaxonomy,
  type CapsuleStarterCategory,
  type CapsuleStarterDefinition,
  type CapsuleConnectorDefinition,
  type CapsuleTaxonomyStats,
  type PolicyTeamCategory,
} from '@/lib/product/context-capsules';
import { recommendCapsuleTools, type CapsuleToolRecommendation } from '@/lib/tools/recommend';
import { DEFAULT_CONTEXT_STACK_ID } from '@/lib/context/active-context-stack';
import { useAuth } from '@/lib/auth/auth-context';
import { useOrchestratorEvents, type OrchestratorEvent, type OrchestratorEventState } from '@/hooks/useOrchestratorEvents';
import { describeAskFailure, parseDataStreamError } from '@/lib/ai/tasklet-stream';
import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';
import {
  answerEnvelopeFromDataStreamLine,
  buildConversationPath,
  buildConversationUrl,
  createConversationThreadId,
  ensureConversationRecord,
  loadLegacyAskThreadHistory,
  pushConversationUrl,
  safeMarkdownHref,
  sanitizeConversationThreadId,
  savedConversationHref,
  savedConversationTurnsToMessages,
  type ChatMessage,
  type SavedConversationSummary,
  type SavedConversationTurn,
} from './tasklet-workbench-conversation';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';

type CapsuleFactoryLaneId = 'catalog' | 'repository' | 'sources' | 'graph' | 'agents';

type TaskletPraxisWorkbenchProps = {
  mode: HomeSurfaceMode | 'app';
  activeCapsuleName?: string;
  capsuleId?: string;
  initialConversationId?: string;
  initialPanel?: 'ask' | 'capsules' | 'repository';
  initialFactoryLane?: CapsuleFactoryLaneId;
  focusedRunId?: string;
  recentRuns?: Array<{ label: string; detail: string; status: string }>;
  className?: string;
};

type PolicyNeedTabId = (typeof POLICY_NEED_TABS)[number]['id'];
type CapsuleRole = 'user' | 'situation' | 'tool' | 'output' | 'reference';
type CapsuleDetailTab = 'overview' | 'sources' | 'ai' | 'settings';
type CapsuleFactoryReviewState = 'draft' | 'reviewed' | 'applied' | 'rejected';
type CapsuleFactoryReviewDiff = {
  diffId: string;
  capsuleId: string;
  laneId: 'improve' | 'sources' | 'output' | 'dialectica' | 'kairos' | 'agon';
  laneTitle: string;
  reviewState: CapsuleFactoryReviewState;
  proposedCapsule: { label: string; summary: string; coreIds: string[]; provenance: { sourceIds: string[]; documentIds: string[] }; assumptions: string[]; status: 'draft' };
  proposedCores: Array<{ kind: 'user' | 'situation' | 'source' | 'document' | 'graph' | 'time' | 'tool' | 'objective' | 'product' | 'output' | 'memory' | 'handover'; label: string; summary: string; provenanceIds: string[]; confidence: 'low' | 'medium' | 'high' }>;
  sourceGaps: string[];
  openQuestions: string[];
  laneImprovements: Array<{ laneId: 'improve' | 'sources' | 'output' | 'dialectica' | 'kairos' | 'agon'; title: string; summary: string; proposedTags: string[]; evidenceIds: string[]; requiresConfirmation: true }>;
  applyActions: Array<{ label: string; target: 'user_core' | 'situation_core' | 'source_core' | 'tool_core' | 'output_core' | 'context_capsule'; requiresConfirmation: true }>;
  provenanceIds: string[];
  confirmation: { required: true; confirmedAt: string | null; confirmedBy: string | null };
};
type RuntimeProof = {
  activeCapsule: string;
  sourceCount: number;
  graphMode: string;
  cogneeMode: string;
  lastAskReceipt: string;
  queuedRunId: string | null;
  workerStatus: string;
  latestMirroredEvent: string;
  memoOutputHref: string | null;
};
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
  contextReceipt?: {
    activeCapsuleOrChain: string | null;
    selectedTools: string[];
    outputDestination: string | null;
    sourcePosture: string | null;
  };
  factoryMetadata?: {
    factoryLane: string | null;
    ontologyStack: string[];
    graphMode: string | null;
    cogneeMode: string | null;
    sourceReceiptIds: string[];
    embeddedGraphArtifactId: string | null;
    ecosystemContributors: string[];
  };
};
type AgentRunEventSummary = {
  id: string;
  eventType: string;
  message?: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
};
type AgentApprovalSummary = {
  id: string;
  toolName: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reason?: string | null;
  requestedAt: string;
  decidedAt?: string | null;
};
type AgentRunDetail = {
  run: AgentRunSummary;
  toolCalls?: unknown[];
  approvals?: AgentApprovalSummary[];
};
type SpanTargetCore = 'sourceability' | 'temporality' | 'causality' | 'human-friction' | 'rules' | 'open-question';
type SpanAttachStatus = 'idle' | 'pending' | 'success' | 'error';
type SpanTargetDefinition = {
  id: SpanTargetCore;
  label: string;
  note: string;
  helper: string;
  askPrompt: string;
  sourceCheckPrompt?: string;
  memoNote: string;
};
type AttachedSpanState = {
  target: SpanTargetDefinition;
  text: string;
};
type CapsuleCoreRefs = {
  userCoreId?: string | null;
  situationCoreId?: string | null;
  pathCoreId?: string | null;
  sourceCoreIds?: string[];
  documentCoreIds?: string[];
  graphCoreId?: string | null;
  timeCoreId?: string | null;
  toolCoreIds?: string[];
  objectiveCoreIds?: string[];
  outputCoreIds?: string[];
  productCoreIds?: string[];
  memoryCoreId?: string | null;
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
  health?: { score?: number; warnings?: string[]; blockers?: string[] };
  community?: { tags?: string[]; favorite?: boolean };
  trust?: { level?: string; score?: number; label?: string };
  access?: { visibility?: 'private' | 'team' | 'public'; allowDownload?: boolean; allowClone?: boolean; allowCommunityRating?: boolean };
};
type ActiveCapsuleChip = {
  id: string;
  label: string;
  code: string;
  role: CapsuleRole;
  toolId?: string;
  templateId?: string;
};
type ActiveContextStackPayload = {
  stackId: 'default';
  capsuleId: string;
  userModelId: string | null;
  situationId: string | null;
  sourceIds: string[];
  documentIds: string[];
  outputGoal: string | null;
  evidenceGaps: [];
  canvasLayout: Record<string, never>;
  schemaVersion: 1;
  updatedAt: string;
};
type SelectedContextCoreIds = {
  userCoreId: string | null;
  situationCoreId: string | null;
  sourceCoreIds: string[];
  documentCoreIds: string[];
  toolCoreIds: string[];
  outputCoreIds: string[];
};
type ContextHealth = {
  label: 'Baseline' | 'Ready' | 'Grounded' | 'Operational';
  detail: string;
  tone: string;
};

const defaultRecentRuns = [
  { label: 'Open policy analysis', detail: 'Capsule discussion', status: 'active' },
  { label: 'Source check', detail: 'Evidence gaps', status: 'review' },
  { label: 'Options memo', detail: 'Drafting context', status: 'draft' },
];

const actionIcons = [
  { label: 'Attach document', icon: Paperclip, kind: 'upload' },
  { label: 'Upload sources', icon: Upload, kind: 'upload' },
  { label: 'Connectors', icon: Monitor, kind: 'connectors' },
  { label: 'Improve prompt', icon: WandSparkles, kind: 'improve' },
] as const;

const capsuleActionPrompts = [
  { label: 'Build capsule', prompt: 'Build a draft ContextCapsule from this prompt. Propose User, Situation, Source, Tool, and Output cores, source gaps, suggested tools, and apply/fork gates.' },
  { label: 'Find missing sources', prompt: 'Find missing sources for the active capsule. Return a source gap list, search plan, and priority sources to add.' },
  { label: 'Check stale claims', prompt: 'Check the active capsule for stale claims, outdated dates, old assumptions, and decision deadlines.' },
  { label: 'Map causality', prompt: 'Map the causal claims in this capsule. Separate timeline facts, triggers, lag effects, alternatives, and indicators.' },
  { label: 'Map human friction', prompt: 'Map the human friction in this capsule: incentives, fears, blockers, informal authority, approvals, and fatigue.' },
  { label: 'Red-team review', prompt: 'Red-team the active capsule and draft. Identify unsupported claims, missing actors, weak assumptions, and decision risks.' },
] as const;

const spanTargets: SpanTargetDefinition[] = [
  {
    id: 'sourceability',
    label: 'Sourceability',
    note: 'Mark claim/evidence needing support check.',
    helper: 'Use for claims, quotes, or evidence that need source verification.',
    askPrompt: 'Explain the source posture of this selected span. Separate supported claims, unsupported claims, and the next sources to add.',
    sourceCheckPrompt: 'Source-check this span against the active capsule. Identify missing citations, weak evidence, and the exact support needed.',
    memoNote: 'Sourceability note: claim/evidence needing support check.',
  },
  {
    id: 'temporality',
    label: 'Freshness',
    note: 'Extract date, sequence, stale assumption, or decision horizon.',
    helper: 'Use for dates, timelines, stale assumptions, deadlines, and decision horizons.',
    askPrompt: 'Analyze the temporality of this selected span. Extract dates, sequence, stale assumptions, and decision horizons.',
    memoNote: 'Freshness note: date, sequence, stale assumption, or decision horizon.',
  },
  {
    id: 'causality',
    label: 'Causality',
    note: 'Mark cause/effect, trigger, indicator, or alternative explanation.',
    helper: 'Use for causal claims, triggers, indicators, effects, and alternative explanations.',
    askPrompt: 'Map the causal logic in this selected span. Separate triggers, effects, indicators, lags, and alternative explanations.',
    memoNote: 'Causality note: cause/effect, trigger, indicator, or alternative explanation.',
  },
  {
    id: 'human-friction',
    label: 'Human friction',
    note: 'Mark incentives, resistance, approvals, fatigue, or informal power.',
    helper: 'Use for incentives, resistance, approvals, fatigue, informal power, and implementation blockers.',
    askPrompt: 'Analyze the human friction in this selected span. Identify incentives, resistance, approvals, fatigue, informal power, and likely blockers.',
    memoNote: 'Human friction note: incentives, resistance, approvals, fatigue, or informal power.',
  },
  {
    id: 'rules',
    label: 'Rules',
    note: 'Mark legal, policy, mandate, standard, or constraint text.',
    helper: 'Use for legal text, policy rules, mandates, standards, constraints, and compliance boundaries.',
    askPrompt: 'Interpret the rule posture of this selected span. Name legal, policy, mandate, standard, and constraint implications.',
    memoNote: 'Rules note: legal, policy, mandate, standard, or constraint text.',
  },
  {
    id: 'open-question',
    label: 'Open question',
    note: 'Mark unresolved issue, missing source, or decision question.',
    helper: 'Use for unresolved issues, missing sources, decision questions, and follow-up research needs.',
    askPrompt: 'Turn this selected span into an answerable policy research question. State what is unresolved, what evidence is missing, and how to decide.',
    memoNote: 'Open question note: unresolved issue, missing source, or decision question.',
  },
] satisfies SpanTargetDefinition[];

const capsuleRoles: Array<{ id: CapsuleRole; label: string }> = [
  { id: 'user', label: 'User' },
  { id: 'situation', label: 'Situation' },
  { id: 'output', label: 'Output' },
  { id: 'reference', label: 'Reference' },
  { id: 'tool', label: 'Tool' },
];

const capsuleRoleStyles: Record<CapsuleRole, string> = {
  user: 'border-sky-200 bg-sky-50 text-sky-900',
  situation: 'border-teal-200 bg-teal-50 text-teal-900',
  tool: 'border-amber-200 bg-amber-50 text-amber-900',
  output: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  reference: 'border-slate-200 bg-slate-50 text-slate-700',
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

const capsuleTypeFilters = [
  { id: 'all', label: 'All types' },
  { id: 'user', label: 'User' },
  { id: 'situation', label: 'Situation' },
  { id: 'tool', label: 'Tool' },
  { id: 'output', label: 'Output' },
  { id: 'archived', label: 'Archived' },
] as const;

const capsuleDomainFilters = [
  { id: 'all', label: 'All domains' },
  { id: 'governance', label: 'Governance' },
  { id: 'climate', label: 'Climate' },
  { id: 'conflict', label: 'Conflict' },
  { id: 'humanitarian', label: 'Humanitarian' },
  { id: 'sanctions', label: 'Sanctions' },
  { id: 'diplomacy', label: 'Diplomacy' },
  { id: 'other', label: 'Other' },
] as const;

const factorySidebarItems: Array<{ id: CapsuleFactoryLaneId; label: string; icon: LucideIcon; filter?: string }> = [
  { id: 'catalog', label: 'Capsules', icon: Library, filter: 'all' },
  { id: 'repository', label: 'My workspace', icon: Database },
  { id: 'sources', label: 'Sources', icon: Search, filter: 'all' },
  { id: 'graph', label: 'Capsule graph', icon: GitBranch },
  { id: 'agents', label: 'AI work', icon: Sparkles },
];

const factoryBuilderLanes = [
  {
    id: 'improve',
    title: 'Improve capsule',
    subtitle: 'Find gaps, weak assumptions, and missing structure.',
    body: 'Prepare reviewable capsule improvements without changing canonical capsule state.',
    prompt: 'Improve the active ContextCapsule. Propose reviewable updates only: clearer purpose, missing evidence, useful tools, source gaps, and apply gates. Do not silently mutate the capsule.',
  },
  {
    id: 'sources',
    title: 'Add sources',
    subtitle: 'Strengthen receipts, documents, and citation coverage.',
    body: 'Prepare source additions and unsupported-claim checks for human approval.',
    prompt: 'Improve the active ContextCapsule by checking source coverage. Propose reviewable source receipts, document needs, unsupported claims, and evidence gaps. Do not silently mutate the capsule.',
  },
  {
    id: 'output',
    title: 'Prepare output',
    subtitle: 'Make the capsule useful for a memo, brief, or handover.',
    body: 'Prepare reviewable output and handover readiness improvements.',
    prompt: 'Improve the active ContextCapsule for policy output. Propose reviewable output goals, decision memo structure, handover needs, and confirmation steps. Do not silently mutate the capsule.',
  },
] as const;

const STARTER_CAPSULE_UPDATED_AT = '2026-05-18T00:00:00.000Z';
const starterCapsuleSummaries = CAPSULE_STARTER_DEFINITIONS.map(starterDefinitionToCapsuleSummary);
const FEATURED_EXPERT_PICK_CAPSULE_IDS = [
  'starter-situation-ai-governance-procurement',
  'starter-situation-humanitarian-rights-access',
  'starter-situation-mediation-track',
  'starter-tool-sourceability-matrix',
  'starter-tool-actor-leverage-veto-map',
  'starter-output-principals-decision-memo',
] as const;
const FEATURED_INTELLECTUAL_DEVICE_CAPSULE_IDS = [
  'starter-tool-assumption-stress-test',
  'starter-tool-counterfactual-pivot-check',
  'starter-tool-competing-hypotheses-matrix',
  'starter-tool-stakeholder-incentive-map',
  'starter-tool-spoiler-blocker-scan',
  'starter-tool-policy-tradeoff-ledger',
  'starter-tool-implementation-feasibility-gate',
  'starter-tool-second-order-effects-map',
  'starter-tool-pre-mortem-failure-review',
  'starter-tool-escalation-ladder-deescalation-path',
] as const;
const STARTER_USER_CAPSULE_CHIP: ActiveCapsuleChip = {
  id: 'starter-user-generic-analyst',
  label: 'Generic analyst',
  code: 'USER',
  role: 'user',
};

const capsuleChainSlots: Array<{ role: CapsuleRole; label: string; helper: string; action: string }> = [
  { role: 'situation', label: 'Situation', helper: 'Add the case, issue, or operating context.', action: 'Add context' },
  { role: 'reference', label: 'Sources/References', helper: 'Attach source packs, documents, or related capsules.', action: 'Attach sources' },
  { role: 'tool', label: 'Tools', helper: 'Add reasoning tools and checks.', action: 'Add checks' },
  { role: 'output', label: 'Output', helper: 'Choose the memo, brief, handover, or artifact goal.', action: 'Choose output' },
];

function buildFactoryReviewDiff(
  lane: (typeof factoryBuilderLanes)[number],
  capsule: PraxisCapsuleSummary | null,
): CapsuleFactoryReviewDiff {
  const capsuleId = capsule?.capsuleId ?? 'starter-capsule';
  const refs = capsule?.coreRefs;
  const sourceIds = refs?.sourceCoreIds ?? [];
  const documentIds = refs?.documentCoreIds ?? [];
  const timestamp = new Date().toISOString();
  const laneTag = lane.id === 'sources' ? 'source-coverage' : lane.id === 'output' ? 'output-readiness' : 'capsule-improvement';
  return {
    diffId: `factory-${lane.id}-${capsuleId}-${Date.now()}`,
    capsuleId,
    laneId: lane.id,
    laneTitle: lane.title,
    reviewState: 'reviewed',
    proposedCapsule: {
      label: capsule?.label ?? 'Draft ContextCapsule',
      summary: `${lane.title} proposes confirmation-gated changes before any capsule mutation.`,
      coreIds: [
        refs?.userCoreId,
        refs?.situationCoreId,
        refs?.graphCoreId,
        refs?.timeCoreId,
        ...(refs?.sourceCoreIds ?? []),
        ...(refs?.documentCoreIds ?? []),
        ...(refs?.toolCoreIds ?? []),
        ...(refs?.outputCoreIds ?? []),
      ].filter((id): id is string => Boolean(id)),
      provenance: { sourceIds, documentIds },
      assumptions: ['Human review is required before applying these capsule changes.'],
      status: 'draft',
    },
    proposedCores: [
      {
        kind: 'situation',
        label: `${lane.title} capsule delta`,
        summary: lane.body,
        provenanceIds: [...sourceIds, ...documentIds].slice(0, 8),
        confidence: sourceIds.length || documentIds.length ? 'medium' : 'low',
      },
      {
        kind: lane.id === 'sources' ? 'source' : lane.id === 'output' ? 'output' : 'tool',
        label: lane.subtitle,
        summary: lane.prompt,
        provenanceIds: [...sourceIds, ...documentIds].slice(0, 8),
        confidence: 'medium',
      },
    ],
    sourceGaps: sourceIds.length ? [] : ['No source receipts are attached to this capsule diff yet.'],
    openQuestions: ['Which proposed lane changes should become durable capsule state?'],
    laneImprovements: [{
      laneId: lane.id,
      title: lane.title,
      summary: lane.body,
      proposedTags: [laneTag],
      evidenceIds: [...sourceIds, ...documentIds].slice(0, 8),
      requiresConfirmation: true,
    }],
    applyActions: [{
      label: `Apply reviewed ${lane.title} change`,
      target: 'context_capsule',
      requiresConfirmation: true,
    }],
    provenanceIds: [`ui:${timestamp}`, ...sourceIds, ...documentIds].slice(0, 20),
    confirmation: { required: true, confirmedAt: null, confirmedBy: null },
  };
}

export function TaskletPraxisWorkbench({
  mode,
  capsuleId = 'default',
  initialConversationId,
  initialPanel,
  initialFactoryLane,
  focusedRunId,
  recentRuns = defaultRecentRuns,
  className,
}: TaskletPraxisWorkbenchProps) {
  const router = useRouter();
  const { user } = useAuth();
  const surfaceMode: HomeSurfaceMode = mode === 'app' ? 'authenticated' : mode;
  const isAuthenticated = surfaceMode === 'authenticated';
  const showWorkbenchNavigation = mode === 'app' || isAuthenticated;
  const isRepositoryPage = initialPanel === 'repository' && mode === 'app';
  const isCapsuleRepositoryPage = initialPanel === 'capsules' && mode === 'app';
  const showHomepageFactoryCta = !initialPanel && mode === 'app';
  const resolvedInitialFactoryLane: CapsuleFactoryLaneId = initialFactoryLane ?? 'catalog';
  const [prompt, setPrompt] = useState('Draft a sourced options memo from the active capsule.');
  const [activeTab, setActiveTab] = useState<PolicyNeedTabId>('analysis');
  const [selectedAgentId, setSelectedAgentId] = useState(PRAXIS_POLICY_AGENTS[0]?.id ?? 'research-memo');
  const [currentCapsuleId, setCurrentCapsuleId] = useState(capsuleId);
  const [activeCapsules, setActiveCapsules] = useState<ActiveCapsuleChip[]>([STARTER_USER_CAPSULE_CHIP]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationThreadId, setConversationThreadId] = useState<string | null>(
    sanitizeConversationThreadId(initialConversationId),
  );
  const [conversationLoadedFor, setConversationLoadedFor] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('Ask PRAXIS can answer directly or choose the right tool from your capsule.');
  const [capsuleSearch, setCapsuleSearch] = useState('');
  const [capsuleTypeFilter, setCapsuleTypeFilter] = useState('all');
  const [capsuleDomainFilter, setCapsuleDomainFilter] = useState('all');
  const [capsulePolicyTeamFilter, setCapsulePolicyTeamFilter] = useState('all');
  const [factoryLane, setFactoryLane] = useState<CapsuleFactoryLaneId>(resolvedInitialFactoryLane);
  const isRepositoryLane = isCapsuleRepositoryPage && factoryLane === 'repository';
  const [factoryReviewDiffs, setFactoryReviewDiffs] = useState<CapsuleFactoryReviewDiff[]>([]);
  const [userCapsules, setUserCapsules] = useState<PraxisCapsuleSummary[]>([]);
  const [capsulesLoading, setCapsulesLoading] = useState(false);
  const [capsuleBrowserOpen, setCapsuleBrowserOpen] = useState(false);
  const [contextComposerCollapsed, setContextComposerCollapsed] = useState(false);
  const [repositoryOpen, setRepositoryOpen] = useState(false);
  const [capsuleDetailTab, setCapsuleDetailTab] = useState<CapsuleDetailTab>('overview');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [repositoryDocuments, setRepositoryDocuments] = useState<RepositoryDocument[]>([]);
  const [repositoryLoading, setRepositoryLoading] = useState(false);
  const [savedConversations, setSavedConversations] = useState<SavedConversationSummary[]>([]);
  const [savedConversationsLoading, setSavedConversationsLoading] = useState(false);
  const [agentRuns, setAgentRuns] = useState<AgentRunSummary[]>([]);
  const [agentRunsLoading, setAgentRunsLoading] = useState(false);
  const [agentRunCreating, setAgentRunCreating] = useState(false);
  const [focusedRun, setFocusedRun] = useState<AgentRunDetail | null>(null);
  const [focusedRunEvents, setFocusedRunEvents] = useState<AgentRunEventSummary[]>([]);
  const [focusedRunLoading, setFocusedRunLoading] = useState(false);
  const [focusedRunAction, setFocusedRunAction] = useState<string | null>(null);
  const [recentlyAppliedCapsuleId, setRecentlyAppliedCapsuleId] = useState<string | null>(null);
  const [builderLabel, setBuilderLabel] = useState('');
  const [builderNotes, setBuilderNotes] = useState('');
  const [builderLinks, setBuilderLinks] = useState('');
  const [builderCategoryId, setBuilderCategoryId] = useState<string>(POLICY_TEAM_CATEGORIES[0]?.id ?? 'research-strategy');
  const [selectedText, setSelectedText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedSpanStatus, setSelectedSpanStatus] = useState<SpanAttachStatus>('idle');
  const [selectedSpanMessage, setSelectedSpanMessage] = useState('');
  const [attachedSpan, setAttachedSpan] = useState<AttachedSpanState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const starterSeededRef = useRef(false);
  const selectedAgent = PRAXIS_POLICY_AGENTS.find((agent) => agent.id === selectedAgentId) ?? PRAXIS_POLICY_AGENTS[0]!;
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const selectedCapsule = userCapsules.find((capsule) => capsule.capsuleId === currentCapsuleId)
    ?? starterCapsuleSummaries.find((capsule) => capsule.capsuleId === currentCapsuleId)
    ?? null;
  const activeCapsuleStack = useMemo(
    () => ensureDefaultCapsuleStack(activeCapsules, {
      userCapsules,
      selectedCapsule,
    }),
    [activeCapsules, selectedCapsule, userCapsules],
  );
  const activeContextStack = buildActiveContextStack(currentCapsuleId, activeCapsuleStack);
  const contextHealth = getContextHealth(activeCapsuleStack);
  const selectedToolIds = activeCapsuleStack
    .filter((capsule) => capsule.role === 'tool')
    .map((capsule) => capsule.toolId ?? capsule.templateId ?? capsule.id);
  const availableToolIds = selectedToolIds.length ? selectedToolIds : ['ask-praxis'];
  const selectedPolicyTeam = selectedCapsule ? policyTeamCategoryForTags(selectedCapsule.community?.tags) : getPolicyTeamCategory(capsulePolicyTeamFilter);
  const capsuleRecommendations = selectedCapsule
    ? recommendCapsuleTools({
        capsule: selectedCapsule,
        policyTeamId: selectedPolicyTeam?.id ?? capsulePolicyTeamFilter,
        recentToolIds: selectedToolIds,
      })
    : [];
  const userCapsuleTaxonomyStats = buildCapsuleTaxonomyStats(userCapsules);
  const publicCapsuleTaxonomyStats = buildCapsuleTaxonomyStats(starterCapsuleSummaries);
  const filteredUserCapsules = filterUserCapsules(userCapsules, capsuleSearch, capsuleTypeFilter, capsuleDomainFilter, capsulePolicyTeamFilter);
  const filteredStarterCapsules = filterStarterCapsules(capsuleSearch, capsuleTypeFilter, capsuleDomainFilter, capsulePolicyTeamFilter);
  const filteredFeaturedCapsuleCards = filterStarterCapsules(capsuleSearch, capsuleTypeFilter, capsuleDomainFilter, capsulePolicyTeamFilter)
    .filter((capsule) => FEATURED_EXPERT_PICK_CAPSULE_IDS.some((id) => id === capsule.capsuleId))
    .sort((a, b) => FEATURED_EXPERT_PICK_CAPSULE_IDS.indexOf(a.capsuleId as (typeof FEATURED_EXPERT_PICK_CAPSULE_IDS)[number]) - FEATURED_EXPERT_PICK_CAPSULE_IDS.indexOf(b.capsuleId as (typeof FEATURED_EXPERT_PICK_CAPSULE_IDS)[number]));
  const filteredIntellectualDeviceCards = filterStarterCapsules(capsuleSearch, capsuleTypeFilter, capsuleDomainFilter, capsulePolicyTeamFilter)
    .filter((capsule) => FEATURED_INTELLECTUAL_DEVICE_CAPSULE_IDS.some((id) => id === capsule.capsuleId))
    .sort((a, b) => FEATURED_INTELLECTUAL_DEVICE_CAPSULE_IDS.indexOf(a.capsuleId as (typeof FEATURED_INTELLECTUAL_DEVICE_CAPSULE_IDS)[number]) - FEATURED_INTELLECTUAL_DEVICE_CAPSULE_IDS.indexOf(b.capsuleId as (typeof FEATURED_INTELLECTUAL_DEVICE_CAPSULE_IDS)[number]));
  const { showingStarterFallback, visibleCapsuleCards } = buildVisibleCapsuleCards({
    isAuthenticated,
    filteredUserCapsules,
    filteredStarterCapsules,
    selectedCapsuleTypeFilter: capsuleTypeFilter,
  });
  const activeCapsuleTaxonomyStats = isAuthenticated && !showingStarterFallback
    ? userCapsuleTaxonomyStats
    : publicCapsuleTaxonomyStats;
  const repositoryDocIds = new Set(selectedCapsule?.coreRefs.documentCoreIds ?? []);
  const visibleRepositoryDocuments = repositoryDocuments.filter((document) =>
    repositoryDocIds.size === 0 || repositoryDocIds.has(document.id),
  );
  const userCapsule = activeCapsuleStack.find((capsule) => capsule.role === 'user');
  const situationCapsuleForHeader = activeCapsuleStack.find((capsule) => capsule.role === 'situation');
  const outputCapsuleForHeader = activeCapsuleStack.find((capsule) => capsule.role === 'output');
  const referenceCapsulesForHeader = activeCapsuleStack.filter((capsule) => capsule.role === 'reference' || capsule.role === 'tool');
  const activeCapsuleIds = activeCapsuleStack.map((capsule) => capsule.id);
  const filledChainRoles = new Set(activeCapsuleStack.map((capsule) => capsule.role));
  const openChainSlots = capsuleChainSlots.filter((slot) => !filledChainRoles.has(slot.role));
  const activeCapsuleForStrip = selectedCapsule ?? activeCapsuleStack[0] ?? null;
  const activeCapsuleSummaryForStrip = selectedCapsule ?? capsuleSummaryForChip(activeCapsuleStack[0], userCapsules);
  const activeStarterForStrip = starterDefinitionForCapsule(activeCapsuleSummaryForStrip);
  const activeCapsuleSourceCount = activeStarterForStrip?.sourcePack.length
    ?? ((activeCapsuleSummaryForStrip?.coreRefs.sourceCoreIds?.length ?? 0) + (activeCapsuleSummaryForStrip?.coreRefs.documentCoreIds?.length ?? 0));
  const activeCapsuleReadiness = activeStarterForStrip
    ? `${activeStarterForStrip.readinessStars}/5`
    : activeCapsuleSummaryForStrip?.health?.score
      ? `${activeCapsuleSummaryForStrip.health.score}/100`
      : activeCapsuleSummaryForStrip?.trust?.label ?? contextHealth.label;
  const activeCapsuleOutputGoal = outputCapsuleForHeader?.label
    ?? activeStarterForStrip?.outputProductIds[0]?.replace(/-/g, ' ')
    ?? selectedAgent.outputDestination?.replace(/_/g, ' ')
    ?? 'Memo posture';
  const conversationUrl = conversationThreadId ? buildConversationUrl(currentCapsuleId, conversationThreadId) : null;
  const focusedRunStream = useOrchestratorEvents(
    focusedRunId ? `/api/agents/runs/${encodeURIComponent(focusedRunId)}/stream` : null,
    {
      enabled: isAuthenticated && Boolean(focusedRunId) && !isTerminalAgentRunStatus(focusedRun?.run.status ?? 'queued'),
      limit: 30,
    },
  );
  const latestRun = focusedRun?.run ?? agentRuns[0] ?? null;
  const latestEvent = focusedRunEvents.at(-1);
  const runtimeProof: RuntimeProof = {
    activeCapsule: activeCapsuleForStrip?.label ?? currentCapsuleId,
    sourceCount: activeCapsuleSourceCount,
    graphMode: latestRun?.factoryMetadata?.graphMode ?? (activeCapsuleSummaryForStrip?.coreRefs.graphCoreId ? 'approved graph ref' : 'embedded proposal'),
    cogneeMode: latestRun?.factoryMetadata?.cogneeMode ?? 'Cognee disabled',
    lastAskReceipt: conversationUrl ? `conversation ${conversationThreadId?.slice(0, 12)}` : chatMessages.some((message) => message.role === 'assistant' && message.text.trim()) ? 'local assistant receipt' : 'none yet',
    queuedRunId: latestRun?.runId ?? null,
    workerStatus: latestRun?.status ?? 'not queued',
    latestMirroredEvent: latestEvent?.message ?? latestEvent?.eventType ?? focusedRunStream.lastEventId ?? 'no mirrored event',
    memoOutputHref: latestRun?.outputHref ?? null,
  };

  useEffect(() => {
    if (focusedRunId) return;
    setCurrentCapsuleId(capsuleId);
  }, [capsuleId, focusedRunId]);

  useEffect(() => {
    const clean = sanitizeConversationThreadId(initialConversationId);
    if (!clean) return;
    setConversationThreadId(clean);
    setActiveTab('analysis');
  }, [initialConversationId]);

  useEffect(() => {
    if (initialPanel === 'capsules' || initialPanel === 'repository') setActiveTab('capsules');
    if (initialPanel === 'ask') setActiveTab('analysis');
  }, [initialPanel]);

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

  useEffect(() => {
    if (!isAuthenticated || !conversationThreadId) return;
    void ensureConversationRecord(conversationThreadId, currentCapsuleId, activeCapsuleStack);
  }, [activeCapsuleStack, conversationThreadId, currentCapsuleId, isAuthenticated]);

  useEffect(() => {
    if (!recentlyAppliedCapsuleId) return;
    const timeout = window.setTimeout(() => setRecentlyAppliedCapsuleId(null), 900);
    return () => window.clearTimeout(timeout);
  }, [recentlyAppliedCapsuleId]);

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

  function markContextApplied(capsuleIdToMark: string) {
    setRecentlyAppliedCapsuleId(capsuleIdToMark);
  }

  function ensureConversationThread(): string {
    if (conversationThreadId) return conversationThreadId;
    const nextThreadId = createConversationThreadId();
    setConversationThreadId(nextThreadId);
    setConversationLoadedFor(`${currentCapsuleId}:${nextThreadId}`);
    pushConversationUrl(currentCapsuleId, nextThreadId);
    void ensureConversationRecord(nextThreadId, currentCapsuleId, activeCapsuleStack);
    return nextThreadId;
  }

  function startNewConversation() {
    if (!isAuthenticated) {
      sendPublicToLogin(prompt.trim() || 'Start a PRAXIS conversation.');
      return;
    }
    const nextThreadId = createConversationThreadId();
    setConversationThreadId(nextThreadId);
    setConversationLoadedFor(`${currentCapsuleId}:${nextThreadId}`);
    setChatMessages([]);
    pushConversationUrl(currentCapsuleId, nextThreadId);
    void ensureConversationRecord(nextThreadId, currentCapsuleId, activeCapsuleStack);
    setStatus('New conversation link ready. Start talking and PRAXIS will save the work here.');
  }

  function openSavedConversation(conversation: SavedConversationSummary) {
    const threadId = sanitizeConversationThreadId(conversation.conversationId);
    if (!threadId) return;
    const nextCapsuleId = conversation.capsuleId || currentCapsuleId;
    const href = savedConversationHref(conversation, nextCapsuleId);
    setCurrentCapsuleId(nextCapsuleId);
    setConversationThreadId(threadId);
    setConversationLoadedFor(null);
    setChatMessages([]);
    setStatus('Opening saved conversation...');
    router.push(href);
  }

  async function copyConversationLink() {
    if (!isAuthenticated) {
      sendPublicToLogin(prompt.trim() || 'Start a PRAXIS conversation.');
      return;
    }
    const nextThreadId = conversationThreadId ?? createConversationThreadId();
    if (!conversationThreadId) {
      setConversationThreadId(nextThreadId);
      setConversationLoadedFor(`${currentCapsuleId}:${nextThreadId}`);
      pushConversationUrl(currentCapsuleId, nextThreadId);
      void ensureConversationRecord(nextThreadId, currentCapsuleId, activeCapsuleStack);
    }
    const link = buildConversationUrl(currentCapsuleId, nextThreadId);
    try {
      await navigator.clipboard?.writeText(link);
      setStatus('Conversation link copied.');
    } catch {
      setStatus(link);
    }
  }

  function buildChatPrompt(cleanPrompt: string, threadId: string): string {
    const capsuleStack = activeCapsuleStack
      .map((capsule) => `${capsule.role.toUpperCase()}: ${capsule.label} (${capsule.id})`)
      .join('\n');
    return [
      cleanPrompt,
      '',
      'PRAXIS routing: choose the simplest safe answer path first. If the user needs source checking, memo drafting, handover, red-team review, capsule building, or deeper tools, route internally and record the decision.',
      `Available tool capsules: ${availableToolIds.join(', ')}`,
      `Active ContextCapsule stack:\n${capsuleStack}`,
      `Conversation thread: ${threadId}`,
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
    const nextThreadId = ensureConversationThread();
    await ensureConversationRecord(nextThreadId, currentCapsuleId, activeCapsuleStack);
    const userMessage: ChatMessage = { role: 'user', text: cleanPrompt };
    const enrichedPrompt = buildChatPrompt(cleanPrompt, nextThreadId);
    setChatMessages((current) => [...current, userMessage, { role: 'assistant', text: '' }]);

    try {
      const currentConversationPath = buildConversationPath(currentCapsuleId, nextThreadId);
      const response = await fetch(`/api/conversations/${encodeURIComponent(nextThreadId)}/turns`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { ...userMessage, text: enrichedPrompt }].map((message) => ({
            role: message.role,
            content: message.text,
          })),
          capsuleId: currentCapsuleId,
          contextPackageId: selectedCapsule?.capsuleId ? `capsule:${selectedCapsule.capsuleId}:v${selectedCapsule.version}` : undefined,
          appliedCapsules: activeCapsuleStack.map((capsule) => ({
            id: capsule.id,
            label: capsule.label,
            role: capsule.role,
          })),
          currentToolId: 'ask-praxis',
          currentPath: currentConversationPath,
          activeContextStack,
          aiSettings: {
            provider: 'vertex',
            analysisDepth: selectedAgent.id === 'research-memo' || selectedAgent.id === 'capsule-factory' ? 'deep' : 'standard',
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
      let answerEnvelope: AskAnswerEnvelope | undefined;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const streamError = parseDataStreamError(line);
          if (streamError) throw new Error(streamError);
          const envelope = answerEnvelopeFromDataStreamLine(line);
          if (envelope) {
            answerEnvelope = envelope;
            setChatMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') next[next.length - 1] = { ...last, answerEnvelope };
              return next;
            });
            continue;
          }
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
      if (!answer.trim()) throw new Error('Ask PRAXIS returned no answer text.');
      const contextLabel = answer.toLowerCase().includes('thin capsule fallback')
        ? 'thin capsule fallback'
        : `capsule ${currentCapsuleId}`;
      setStatus(`Conversation saved at this link with ${contextLabel}.`);
      void refreshCapsules();
      void refreshSavedConversations();
      try {
        window.localStorage.removeItem(PENDING_TASKLET_PROMPT_KEY);
        window.localStorage.removeItem(PENDING_POLICY_AGENT_ID_KEY);
      } catch {
        // Non-critical cleanup.
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      const guidance = describeAskFailure(message);
      setPrompt(cleanPrompt);
      setStatus(`Ask PRAXIS failed: ${message}`);
      setChatMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: guidance };
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
    setSelectedSpanStatus('idle');
    setSelectedSpanMessage('');
    setAttachedSpan(null);
  }

  async function bindSelectedSpan(targetCore: SpanTargetCore) {
    if (!selectedText.trim()) return;
    if (requireAuthForAction(`Attach this selected text to ${targetCore}: ${selectedText}`)) return;
    const target = spanTargets.find((item) => item.id === targetCore);
    if (!target || selectedSpanStatus === 'pending') return;
    const cleanText = selectedText.trim();
    const note = buildSelectedSpanNote(target, cleanText);
    setSelectedSpanStatus('pending');
    setSelectedSpanMessage(`Attaching selected text to ${target.label}...`);
    setAttachedSpan(null);
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(currentCapsuleId)}/spans`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        targetCore,
        sourceType: selectedMessageId?.startsWith('assistant') ? 'assistant-message' : 'document-selection',
        messageId: selectedMessageId,
        note,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.error ? String(payload.error) : `${response.status} ${response.statusText}`;
      setSelectedSpanStatus('error');
      setSelectedSpanMessage(`Span attach failed: ${detail}. The selected text is still here so you can retry.`);
      setStatus(`Span attach failed: ${detail}`);
      return;
    }
    setAttachedSpan({ target, text: cleanText });
    setSelectedSpanStatus('success');
    setSelectedSpanMessage(`Attached to ${target.label}. Ask PRAXIS, source-check it, turn it into a memo note, or clear the selection.`);
    setStatus(`Selected text attached to ${target.label}.`);
    await refreshCapsules(currentCapsuleId);
  }

  function clearSelectedSpan() {
    setSelectedText('');
    setSelectedMessageId(null);
    setSelectedSpanStatus('idle');
    setSelectedSpanMessage('');
    setAttachedSpan(null);
  }

  function askAboutAttachedSpan(mode: 'ask' | 'source-check') {
    const span = attachedSpan;
    if (!span) return;
    const promptText = [
      mode === 'source-check' && span.target.sourceCheckPrompt ? span.target.sourceCheckPrompt : span.target.askPrompt,
      '',
      `Selected span (${span.target.label}):`,
      span.text,
    ].join('\n');
    setPrompt(promptText);
    void sendToPraxis(selectedAgent, promptText);
  }

  async function turnAttachedSpanIntoMemoNote() {
    const span = attachedSpan;
    if (!span) return;
    if (requireAuthForAction(`Turn this selected span into a memo note:\n\n${span.text}`)) return;
    setSelectedSpanStatus('pending');
    setSelectedSpanMessage('Writing a memo note into the active capsule...');
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(currentCapsuleId)}/notes`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: span.target.id === 'sourceability' ? 'source_note' : 'analyst_note',
        title: `${span.target.label} span note`,
        body: `${span.target.memoNote}\n\n${span.text}`,
        tags: ['selected-span', span.target.id],
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.error ? String(payload.error) : `${response.status} ${response.statusText}`;
      setSelectedSpanStatus('error');
      setSelectedSpanMessage(`Memo note failed: ${detail}. The selected text is still here so you can retry.`);
      setStatus(`Memo note failed: ${detail}`);
      return;
    }
    setSelectedSpanStatus('success');
    setSelectedSpanMessage(`Memo note saved from the ${span.target.label} span.`);
    setStatus('Memo note saved to the active capsule.');
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
        setCapsuleDetailTab('sources');
        setCapsuleTypeFilter('all');
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
      let next = await fetchCapsuleLibrary();
      const visibleCount = next.filter((capsule) => !capsule.archivedAt).length;
      if (!starterSeededRef.current && visibleCount < CAPSULE_STARTER_DEFINITIONS.length) {
        starterSeededRef.current = true;
        const seedResponse = await fetch('/api/context/capsules', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'seed-starters' }),
        });
        const seedPayload = await seedResponse.json().catch(() => ({}));
        if (!seedResponse.ok) throw new Error(seedPayload?.error ?? 'starter capsule seed failed');
        next = await fetchCapsuleLibrary();
      }
      setUserCapsules(next);
      const selected = selectCapsuleId
        ? next.find((capsule) => capsule.capsuleId === selectCapsuleId)
        : next.find((capsule) => capsule.capsuleId === currentCapsuleId && !capsule.archivedAt) ?? next.find((capsule) => !capsule.archivedAt);
      if (selected && selectCapsuleId) {
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
  }, [currentCapsuleId, isAuthenticated, refreshRepository]);

  const refreshSavedConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setSavedConversationsLoading(true);
    try {
      const response = await fetch('/api/conversations', { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'conversation list failed');
      setSavedConversations(Array.isArray(payload?.conversations) ? payload.conversations as SavedConversationSummary[] : []);
    } catch (err) {
      setStatus(err instanceof Error ? `Saved conversations unavailable: ${err.message}` : 'Saved conversations unavailable.');
      setSavedConversations([]);
    } finally {
      setSavedConversationsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshSavedConversations();
  }, [isAuthenticated, refreshSavedConversations]);

  const loadConversationHistory = useCallback(async (capsuleIdToLoad: string, threadIdToLoad: string) => {
    if (!isAuthenticated || !capsuleIdToLoad || !threadIdToLoad) return;
    const loadKey = `${capsuleIdToLoad}:${threadIdToLoad}`;
    setConversationLoadedFor(loadKey);
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(threadIdToLoad)}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'conversation history failed');
      const turns = Array.isArray(payload?.turns) ? payload.turns as SavedConversationTurn[] : [];
      if (turns.length) {
        const historyMessages = savedConversationTurnsToMessages(turns);
        setChatMessages(historyMessages);
        setStatus(`Conversation link loaded (${turns.length} turns).`);
        return;
      }
      const legacyMessages = await loadLegacyAskThreadHistory(capsuleIdToLoad, threadIdToLoad);
      setChatMessages(legacyMessages);
      setStatus(legacyMessages.length ? `Conversation link loaded (${legacyMessages.length / 2} turns).` : 'New conversation link ready.');
    } catch (err) {
      try {
        const legacyMessages = await loadLegacyAskThreadHistory(capsuleIdToLoad, threadIdToLoad);
        setChatMessages(legacyMessages);
        setStatus(legacyMessages.length ? `Conversation link loaded (${legacyMessages.length / 2} turns).` : 'New conversation link ready.');
      } catch {
        setStatus(err instanceof Error ? `Conversation link could not load: ${err.message}` : 'Conversation link could not load.');
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !conversationThreadId) return;
    const loadKey = `${currentCapsuleId}:${conversationThreadId}`;
    if (conversationLoadedFor === loadKey) return;
    void loadConversationHistory(currentCapsuleId, conversationThreadId);
  }, [conversationLoadedFor, conversationThreadId, currentCapsuleId, isAuthenticated, loadConversationHistory]);

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

  const loadFocusedRunDetails = useCallback(async (runId: string, options?: { showLoading?: boolean; announce?: boolean }) => {
    if (!isAuthenticated) return null;
    const showLoading = options?.showLoading ?? false;
    const announce = options?.announce ?? false;
    if (showLoading) setFocusedRunLoading(true);
    setCapsuleDetailTab('ai');
    setActiveTab('capsules');
    if (announce) setStatus(`Opening agent run ${runId.slice(0, 12)}...`);
    try {
      const response = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.run?.runId) throw new Error(payload?.error ?? 'agent run not found');

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
      if (announce) setStatus(`${detail.run.policyAgentLabel ?? 'Capsule agent'} opened as run ${detail.run.runId.slice(0, 12)}.`);

      const eventsResponse = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}/stream?limit=30`, { credentials: 'include' });
      const eventsText = await eventsResponse.text().catch(() => '');
      if (eventsResponse.ok) setFocusedRunEvents(parseAgentRunSse(eventsText));
      return detail;
    } catch (err) {
      setFocusedRun(null);
      setFocusedRunEvents([]);
      setStatus(err instanceof Error ? `Agent workspace unavailable: ${err.message}` : 'Agent workspace unavailable.');
      return null;
    } finally {
      if (showLoading) setFocusedRunLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !focusedRunId) return;
    let cancelled = false;
    void loadFocusedRunDetails(focusedRunId, { showLoading: true, announce: true }).then((detail) => {
      if (!cancelled && detail) void refreshCapsules(detail.run.capsuleId);
    });
    return () => {
      cancelled = true;
    };
  }, [focusedRunId, isAuthenticated, loadFocusedRunDetails, refreshCapsules]);

  useEffect(() => {
    if (!isAuthenticated || !focusedRunId || !focusedRun || isTerminalAgentRunStatus(focusedRun.run.status)) return;
    const interval = window.setInterval(() => {
      void loadFocusedRunDetails(focusedRunId);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [focusedRun, focusedRunId, isAuthenticated, loadFocusedRunDetails]);

  useEffect(() => {
    if (!focusedRunId || !focusedRunStream.events.length) return;
    setFocusedRunEvents((current) => mergeRunEvents(current, focusedRunStream.events.map(orchestratorEventToSummary)));
    const terminal = focusedRunStream.terminalEvent;
    if (!terminal) return;
    const nextStatus = agentRunStatusFromEvent(terminal.data);
    if (!nextStatus) return;
    setFocusedRun((current) => current
      ? { ...current, run: { ...current.run, status: nextStatus, updatedAt: terminal.createdAt } }
      : current);
    setAgentRuns((current) => current.map((run) => run.runId === focusedRunId ? { ...run, status: nextStatus, updatedAt: terminal.createdAt } : run));
  }, [focusedRunId, focusedRunStream.events, focusedRunStream.terminalEvent]);

  async function postFocusedRunAction(path: string, body?: Record<string, unknown>) {
    if (!focusedRunId || focusedRunAction) return;
    setFocusedRunAction(path);
    try {
      const response = await fetch(`/api/agents/runs/${encodeURIComponent(focusedRunId)}/${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'agent action failed');
      const nextRunId = typeof payload?.run?.runId === 'string' ? payload.run.runId : focusedRunId;
      setStatus(`Agent run ${nextRunId.slice(0, 12)} updated.`);
      if (nextRunId !== focusedRunId) {
        router.push(`/agents/${encodeURIComponent(nextRunId)}`);
        return;
      }
      void loadFocusedRunDetails(focusedRunId, { showLoading: true });
      void refreshAgentRuns();
    } catch (err) {
      setStatus(err instanceof Error ? `Agent action failed: ${err.message}` : 'Agent action failed.');
    } finally {
      setFocusedRunAction(null);
    }
  }

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
          contextPackageId: selectedCapsule?.capsuleId ? `capsule:${selectedCapsule.capsuleId}:v${selectedCapsule.version}` : undefined,
          selectedCoreIds: {
            ...selectedCoreIdsFromContextStack(activeContextStack),
            toolCoreIds: selectedToolIds,
          },
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
            ...(agent.id === 'capsule-factory' ? {
              factoryLane,
              ontologyStack: ['policy-core', 'source-to-claim'],
              graphMode: activeCapsuleSummaryForStrip?.coreRefs.graphCoreId ? 'approved_postgres_kg' : 'embedded_proposal',
              cogneeMode: 'disabled',
              sourceReceiptIds: activeCapsuleSummaryForStrip?.coreRefs.sourceCoreIds ?? [],
              embeddedGraphArtifactId: activeCapsuleSummaryForStrip?.coreRefs.graphCoreId ?? null,
              capsuleWorkflow: ['source review', 'gap repair', 'output readiness'],
            } : {}),
            appliedCapsules: activeCapsuleStack.map((capsule) => ({
              id: capsule.id,
              label: capsule.label,
              role: capsule.role,
            })),
            activeContextStack,
            selectedTools: selectedToolIds,
            sourcePosture: contextHealth.label,
            source: 'tasklet-cockpit',
          },
        }),
      });
      const run = await response.json().catch(() => ({})) as AgentRunSummary & { error?: string; detail?: string };
      if (!response.ok || !run?.runId) throw new Error(run?.error ?? run?.detail ?? 'agent run creation failed');
      setAgentRuns((current) => [run, ...current.filter((item) => item.runId !== run.runId)].slice(0, 8));
      setCapsuleDetailTab('ai');
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
    const threadParam = sanitizeConversationThreadId(searchParams.get('threadId') ?? searchParams.get('conversationId'));
    const importToken = searchParams.get('importToken');
    if (capsuleParam) {
      setCurrentCapsuleId(capsuleParam);
      setActiveCapsules((current) => {
        if (current.some((capsule) => capsule.id === capsuleParam)) return current;
        const chip: ActiveCapsuleChip = { id: capsuleParam, label: capsuleParam, code: 'SITUATION', role: 'situation' };
        return [chip, ...current].slice(0, 6);
      });
    }
    if (threadParam) {
      setConversationThreadId(threadParam);
      setActiveTab('analysis');
      pushConversationUrl(capsuleParam ?? currentCapsuleId, threadParam);
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
    if (panel === 'advanced' || panel === 'ask') setStatus('Advanced routing details appear in saved conversation receipts after a PRAXIS turn runs.');
    if (panel === 'account') setStatus('Account and runtime settings now live inside the PRAXIS cockpit.');
  }, [isAuthenticated, refreshRepository]);

  function selectUserCapsule(capsule: PraxisCapsuleSummary) {
    const chip = capsuleToChip(capsule);
    setCurrentCapsuleId(chip.id);
    setActiveCapsules((current) => [chip, ...current.filter((item) => item.id !== chip.id)].slice(0, 6));
    setConversationThreadId(null);
    setConversationLoadedFor(null);
    setChatMessages([]);
    setStatus(`${chip.label} opened. Start talking to create a shareable conversation link.`);
  }

  function applyUserCapsule(capsule: PraxisCapsuleSummary, role: CapsuleRole = capsuleDefaultRole(capsule)) {
    const chip = { ...capsuleToChip(capsule), role };
    if (role === 'situation') setCurrentCapsuleId(chip.id);
    setActiveCapsules((current) => applyCapsuleToStack(current, chip));
    markContextApplied(chip.id);
    const categoryReview = capsuleCategory(capsule) === 'custom' ? ' Review its category before relying on it.' : '';
    setStatus(`${chip.label} added to the context chain as ${capsuleRoleLabel(role)}.${categoryReview}`);
  }

  function selectCapsuleCard(capsule: PraxisCapsuleSummary) {
    const persisted = userCapsules.find((item) => item.capsuleId === capsule.capsuleId);
    if (persisted) {
      selectUserCapsule(persisted);
      return;
    }
    const chip = capsuleToChip(capsule);
    setCurrentCapsuleId(chip.id);
    setActiveCapsules((current) => [chip, ...current.filter((item) => item.id !== chip.id)].slice(0, 6));
    setConversationThreadId(null);
    setConversationLoadedFor(null);
    setChatMessages([]);
    setPrompt(`Use the starter ContextCapsule "${capsule.label}" as the policy context. ${capsuleCategoryMeta(capsule).summary}`);
    setStatus(`${chip.label} opened as starter context. Sign in to save a private fork.`);
  }

  function applyCapsuleCard(capsule: PraxisCapsuleSummary, role: CapsuleRole = capsuleDefaultRole(capsule)) {
    const persisted = userCapsules.find((item) => item.capsuleId === capsule.capsuleId);
    if (persisted) {
      applyUserCapsule(persisted, role);
      return;
    }
    const chip = { ...capsuleToChip(capsule), role };
    if (role === 'situation') setCurrentCapsuleId(chip.id);
    setActiveCapsules((current) => applyCapsuleToStack(current, chip));
    markContextApplied(chip.id);
    const categoryReview = capsuleCategory(capsule) === 'custom' ? ' Review its category before relying on it.' : '';
    setStatus(`${chip.label} added to the context chain as ${capsuleRoleLabel(role)}.${categoryReview}`);
    if (capsuleBrowserOpen) setCapsuleBrowserOpen(false);
  }

  function improveCapsuleCard(capsule: PraxisCapsuleSummary) {
    const persisted = userCapsules.find((item) => item.capsuleId === capsule.capsuleId);
    if (persisted) {
      improveCapsule(persisted);
      return;
    }
    selectCapsuleCard(capsule);
    const nextPrompt = [
      `Improve the starter ContextCapsule "${capsule.label}".`,
      capsuleCategoryMeta(capsule).detail,
      'Ask what is missing, recommend source receipts, name useful tools, and explain what should be forked before drafting.',
    ].join('\n');
    setPrompt(nextPrompt);
    if (isAuthenticated) void sendToPraxis(selectedAgent, nextPrompt);
  }

  function chatWithCapsule(capsule: PraxisCapsuleSummary) {
    selectCapsuleCard(capsule);
    const nextPrompt = `Use the capsule "${capsule.label}" as context. Help me decide what to improve, what sources to add, and what this capsule is ready to produce.`;
    setPrompt(nextPrompt);
    setActiveTab('analysis');
    setStatus(`${capsule.label} is ready in Ask PRAXIS.`);
  }

  async function archiveCapsuleCard(capsule: PraxisCapsuleSummary) {
    const persisted = userCapsules.find((item) => item.capsuleId === capsule.capsuleId);
    if (persisted) {
      await archiveUserCapsule(persisted);
      return;
    }
    setStatus('Starter capsules are read-only. Sign in to save and archive a private fork.');
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

  async function setCapsuleVisibility(capsule: PraxisCapsuleSummary, visibility: 'private' | 'public') {
    if (!isAuthenticated) {
      sendPublicToLogin(`Make "${capsule.label}" ${visibility}.`);
      return;
    }
    const persisted = userCapsules.find((item) => item.capsuleId === capsule.capsuleId);
    if (!persisted) {
      setStatus('Starter capsules are public templates. Save a private fork before changing privacy.');
      return;
    }
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'set-visibility',
        visibility,
        allowDownload: visibility === 'public' ? true : capsule.access?.allowDownload ?? false,
        allowClone: visibility === 'public' ? true : capsule.access?.allowClone ?? false,
        allowCommunityRating: visibility === 'public' ? capsule.access?.allowCommunityRating ?? false : false,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Privacy update failed: ${payload.error}` : 'Privacy update failed.');
      return;
    }
    setStatus(`${capsule.label} is now ${visibility}.`);
    await refreshCapsules(capsule.capsuleId);
  }

  async function deleteCapsule(capsule: PraxisCapsuleSummary) {
    if (!isAuthenticated) return;
    const persisted = userCapsules.find((item) => item.capsuleId === capsule.capsuleId);
    if (!persisted) {
      setStatus('Starter capsules are read-only. Save a private fork before deleting.');
      return;
    }
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}?mode=delete`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Delete failed: ${payload.error}` : 'Delete failed.');
      return;
    }
    setStatus(`${capsule.label} deleted.`);
    setCurrentCapsuleId(DEFAULT_CONTEXT_STACK_ID);
    await refreshCapsules();
  }

  async function downloadCapsulePackage(capsule: PraxisCapsuleSummary) {
    if (!isAuthenticated) {
      sendPublicToLogin(`Download "${capsule.label}" as a .praxis capsule.`);
      return;
    }
    const persisted = userCapsules.find((item) => item.capsuleId === capsule.capsuleId);
    if (!persisted) {
      setStatus('Starter capsules download after you save or fork them into your workspace.');
      return;
    }
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}?format=praxis`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setStatus(payload?.error ? `Download failed: ${payload.error}` : 'Download failed.');
      return;
    }
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') ?? '';
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `${capsule.capsuleId}.praxis`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`${capsule.label} downloaded as ${filename}.`);
  }

  async function updateCapsuleDocumentRef(capsule: PraxisCapsuleSummary, documentId: string, action: 'attach' | 'detach') {
    if (!isAuthenticated) return;
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}/attach`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, documentIds: [documentId] }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Document ${action} failed: ${payload.error}` : `Document ${action} failed.`);
      return;
    }
    setStatus(`${documentId} ${action === 'attach' ? 'attached to' : 'detached from'} ${capsule.label}.`);
    await refreshCapsules(capsule.capsuleId);
    await refreshRepository();
  }

  async function assignPolicyTeam(capsule: PraxisCapsuleSummary, category: PolicyTeamCategory) {
    const currentTags = capsule.community?.tags ?? [];
    const taxonomy = resolveCapsuleTaxonomy(capsule);
    const tags = uniqueIds([
      ...currentTags.filter((tag) => !POLICY_TEAM_CATEGORIES.some((item) => item.id === tag || tag === `team:${item.id}`)),
      ...normalizeCapsuleTaxonomyTags(categoryTagsForPolicyTeam(category), {
        type: taxonomy.types[0]?.id,
        domain: category.domainId,
        policyTeamIds: [category.id],
      }),
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
    setCapsulePolicyTeamFilter(category.id);
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

  function openBuildYourOwnKnowledge() {
    if (!isAuthenticated) {
      sendPublicToLogin('Build your own inheritable knowledge for your team or agents.');
      return;
    }
    setBuilderOpen(true);
  }

  function reviewFactoryLane(lane: (typeof factoryBuilderLanes)[number]) {
    const capsuleFactoryAgent = PRAXIS_POLICY_AGENTS.find((agent) => agent.id === 'capsule-factory') ?? selectedAgent;
    const target = selectedCapsule ?? userCapsules[0] ?? starterCapsuleSummaries[0];
    if (target) selectCapsuleCard(target);
    setSelectedAgentId(capsuleFactoryAgent.id);
    const nextPrompt = [
      lane.prompt,
      target ? `Active capsule: ${target.label} (${target.capsuleId}).` : 'Active capsule: none selected.',
      'Return reviewable capsule improvements, not direct writes. Include proposed tags, evidence ids, open questions, and confirmation steps.',
    ].join('\n');
    setPrompt(nextPrompt);
    setStatus(`${lane.title} prepared reviewable capsule improvements. Run Ask PRAXIS to inspect before applying anything.`);
    const diff = buildFactoryReviewDiff(lane, target);
    setFactoryReviewDiffs((current) => [diff, ...current.filter((item) => item.diffId !== diff.diffId)].slice(0, 6));
    if (isAuthenticated && target) void persistFactoryReviewDiff(diff, 'create-review-diff');
    if (isAuthenticated) void sendToPraxis(capsuleFactoryAgent, nextPrompt);
  }

  async function persistFactoryReviewDiff(diff: CapsuleFactoryReviewDiff, action: 'create-review-diff' | 'apply' | 'reject') {
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(diff.capsuleId)}/diff`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, diff }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error ?? 'factory diff update failed');
    return payload;
  }

  async function applyFactoryReviewDiff(diff: CapsuleFactoryReviewDiff) {
    const confirmed: CapsuleFactoryReviewDiff = {
      ...diff,
      reviewState: 'applied',
      confirmation: { required: true, confirmedAt: new Date().toISOString(), confirmedBy: 'current-user' },
    };
    setFactoryReviewDiffs((current) => current.map((item) => item.diffId === diff.diffId ? confirmed : item));
    try {
      if (isAuthenticated) await persistFactoryReviewDiff(confirmed, 'apply');
      setStatus(`Applied reviewed capsule change ${diff.diffId.slice(0, 10)}.`);
      void refreshCapsules(currentCapsuleId);
    } catch (err) {
      setFactoryReviewDiffs((current) => current.map((item) => item.diffId === diff.diffId ? diff : item));
      setStatus(err instanceof Error ? `Factory diff apply failed: ${err.message}` : 'Factory diff apply failed.');
    }
  }

  async function rejectFactoryReviewDiff(diff: CapsuleFactoryReviewDiff) {
    const rejected: CapsuleFactoryReviewDiff = { ...diff, reviewState: 'rejected' };
    setFactoryReviewDiffs((current) => current.map((item) => item.diffId === diff.diffId ? rejected : item));
    try {
      if (isAuthenticated) await persistFactoryReviewDiff(rejected, 'reject');
      setStatus(`Rejected capsule change ${diff.diffId.slice(0, 10)}.`);
    } catch (err) {
      setFactoryReviewDiffs((current) => current.map((item) => item.diffId === diff.diffId ? diff : item));
      setStatus(err instanceof Error ? `Factory diff reject failed: ${err.message}` : 'Factory diff reject failed.');
    }
  }

  async function createCapsuleLite(label?: string, seed?: Partial<ActiveCapsuleChip>, policyTeam?: PolicyTeamCategory | null) {
    if (!isAuthenticated) {
      sendPublicToLogin(prompt.trim() || 'Build a ContextCapsule Lite.');
      return null;
    }
    const team = policyTeam ?? getPolicyTeamCategory(capsuleDomainFilter);
    const templateId = seed?.templateId ?? team?.templateIds[0];
    const capsuleType = seed?.role ?? 'situation';
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
        community: {
          tags: normalizeCapsuleTaxonomyTags(
            team ? categoryTagsForPolicyTeam(team) : [],
            { type: capsuleType, domain: team?.domainId ?? null, policyTeamIds: team ? [team.id] : [] },
          ).slice(0, 20),
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

  async function saveCombinedCapsuleStack(capsulesToCombine: ActiveCapsuleChip[]) {
    if (!isAuthenticated) {
      sendPublicToLogin('Save this assembled PRAXIS context capsule.');
      return;
    }
    if (capsulesToCombine.length < 2) {
      setStatus('Add at least two capsules before saving a retrievable context capsule.');
      return;
    }
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
    setStatus(`${combined.label} saved as a retrievable context capsule.`);
  }

  function removeCapsule(id: string) {
    markContextApplied(id);
    setActiveCapsules((current) => {
      const nextStack = current.filter((capsule) => capsule.id !== id);
      if (currentCapsuleId === id) {
        const nextSituation = nextStack.find((capsule) => capsule.role === 'situation') ?? nextStack[0];
        setCurrentCapsuleId(nextSituation?.id ?? 'default');
      }
      return nextStack;
    });
  }

  function handleCapsuleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    if (activeId.startsWith('capsule-card:')) {
      const capsuleIdFromCard = activeId.replace('capsule-card:', '');
      const capsule = visibleCapsuleCards.find((item) => item.capsuleId === capsuleIdFromCard);
      if (capsule && (overId === 'capsule-context-dropzone' || activeCapsuleIds.includes(overId))) {
        applyCapsuleCard(capsule, capsuleDefaultRole(capsule));
      }
      return;
    }

    if (activeId === overId || !activeCapsuleIds.includes(activeId) || !activeCapsuleIds.includes(overId)) return;
    setActiveCapsules((current) => {
      const oldIndex = current.findIndex((capsule) => capsule.id === activeId);
      const newIndex = current.findIndex((capsule) => capsule.id === overId);
      if (oldIndex < 0 || newIndex < 0) return current;
      markContextApplied(activeId);
      return arrayMove(current, oldIndex, newIndex);
    });
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

  function shareActiveContextChain() {
    const labels = activeCapsuleStack.map((capsule) => `${capsuleRoleLabel(capsule.role)}: ${capsule.label}`).join(' / ');
    const shareText = labels || 'Model knowledge baseline';
    const write = navigator.clipboard?.writeText(shareText);
    if (!write) {
      setStatus(shareText);
      return;
    }
    void write.then(
      () => setStatus('Context chain summary copied.'),
      () => setStatus(shareText),
    );
  }

  function downloadActiveContextChain() {
    const body = JSON.stringify({
      activeContextStack,
      appliedCapsules: activeCapsuleStack.map((capsule) => ({
        id: capsule.id,
        label: capsule.label,
        role: capsule.role,
      })),
      contextHealth: contextHealth.label,
    }, null, 2);
    const blob = new Blob([body], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'praxis-context-chain.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Context chain downloaded.');
  }

  function improveActiveContextChain() {
    const missing = openChainSlots.map((slot) => slot.label).join(', ') || 'no required blocks';
    setPrompt(`Improve this PRAXIS context chain. Missing or optional blocks: ${missing}. Recommend the next capsule, source, check, or output refinement.`);
    setStatus('Improve prompt prepared for the active context chain.');
  }

  function runCapsuleFactoryAgent() {
    const capsuleFactoryAgent = PRAXIS_POLICY_AGENTS.find((agent) => agent.id === 'capsule-factory') ?? selectedAgent;
    setSelectedAgentId(capsuleFactoryAgent.id);
    const target = selectedCapsule?.label ?? activeCapsuleStack[0]?.label ?? 'the active ContextCapsule';
    const nextPrompt = `Improve the capsule "${target}". Check sources, missing context, useful tools, output readiness, open gaps, and approval gates. Return reviewable capsule changes only.`;
    setPrompt(nextPrompt);
    if (isAuthenticated) void sendToPraxis(capsuleFactoryAgent, nextPrompt);
    else sendPublicToLogin(nextPrompt, capsuleFactoryAgent);
  }

  return (
    <section className={cn('civic-atelier-shell cartographic-grid od-praxis-surface min-h-screen text-[color:var(--color-deep-ink)]', className)} data-testid="tasklet-praxis-workbench">
      <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleCapsuleDragEnd}>
      <div className={cn('grid min-h-screen', showWorkbenchNavigation && 'lg:grid-cols-[250px_minmax(0,1fr)]')}>
        {showWorkbenchNavigation ? <aside className="dossier-spine od-praxis-sidebar hidden border-r px-4 py-6 lg:flex lg:flex-col">
          <Link href={isAuthenticated ? '/app' : '/'} className="mb-6 flex items-center gap-3 text-lg font-bold">
            <PraxisBrandChip compact />
          </Link>
          <SidebarButton icon={Plus} label="New capsule" onClick={() => {
            if (requireAuthForAction('Build a new PRAXIS ContextCapsule.')) return;
            setBuilderOpen(true);
          }} active />
          <Link href={isAuthenticated ? '/app/capsules' : '/login?mode=signup&redirect=%2Fapp%2Fcapsules'} className="mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-black/5">
            <Search className="h-5 w-5 text-slate-500" />
            Capsules
          </Link>
          <Link href={isAuthenticated ? '/app/capsules?lane=repository' : '/login?mode=signup&redirect=%2Fapp%2Fcapsules%3Flane%3Drepository'} className="mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-black/5">
            <Library className="h-5 w-5 text-slate-500" />
            Capsule workspace
          </Link>
          <div className="mt-8">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">{recentLabel} <ChevronDown className="h-3 w-3" /></p>
            <div className="mt-3 space-y-2">
              {isAuthenticated && savedConversations.length ? savedConversations.slice(0, 6).map((conversation) => (
                <button
                  key={conversation.conversationId}
                  type="button"
                  onClick={() => openSavedConversation(conversation)}
                  className={cn(
                    'block w-full rounded-md px-1 py-1.5 text-left text-sm font-medium hover:bg-black/5',
                    conversationThreadId === conversation.conversationId ? 'bg-black/5 text-slate-950' : 'text-slate-800',
                  )}
                  title={savedConversationHref(conversation, conversation.capsuleId || currentCapsuleId)}
                >
                  <span className="block truncate">{conversation.title || conversation.conversationId}</span>
                  <span className="block truncate text-[11px] font-normal text-slate-500">
                    {conversation.turnCount ?? 0} turn{conversation.turnCount === 1 ? '' : 's'} / {conversation.capsuleId || 'default'}
                  </span>
                </button>
              )) : null}
              {isAuthenticated && savedConversationsLoading ? (
                <span className="block rounded-md border border-dashed border-black/10 px-2 py-2 text-xs font-semibold text-slate-500">
                  Loading conversations...
                </span>
              ) : null}
              {isAuthenticated && !savedConversations.length && !savedConversationsLoading ? (
                <span className="block rounded-md border border-dashed border-black/10 px-2 py-2 text-xs font-semibold text-slate-500">
                  No saved conversations yet
                </span>
              ) : null}
              {!isAuthenticated ? recentRuns.slice(0, 5).map((run) => (
                <button key={run.label} type="button" className="block w-full truncate rounded-md px-1 py-1.5 text-left text-sm font-medium text-slate-800 hover:bg-black/5">
                  {run.label}
                </button>
              )) : null}
            </div>
          </div>
          {isAuthenticated ? (
          <div className="mt-8">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">Agent runs <ChevronDown className="h-3 w-3" /></p>
            <div className="mt-3 space-y-2">
              {agentRuns.length ? agentRuns.slice(0, 5).map((run) => (
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
              )) : (
                <span className="block rounded-md border border-dashed border-black/10 px-2 py-2 text-xs font-semibold text-slate-500">
                  {agentRunsLoading ? 'Loading runs...' : 'No agent runs yet'}
                </span>
              )}
            </div>
          </div>
          ) : null}
          <div className="mt-8">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">Capsules <ChevronDown className="h-3 w-3" /></p>
            <div className="mt-3 space-y-2">
              {activeCapsuleStack.map((capsule) => (
                <button key={capsule.id} type="button" className="block w-full truncate rounded-md px-1 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-black/5">
                  {capsule.label}
                </button>
              ))}
              {!activeCapsuleStack.length ? (
                <span className="block rounded-md border border-dashed border-black/10 px-2 py-2 text-sm font-medium text-slate-500">
                  Add your capsules here
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-auto border-t border-black/10 pt-4">
            {isAuthenticated ? (
              <Link href="/app/settings" className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-black/5">
                Workspace settings
              </Link>
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
        </aside> : null}

        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10">
          {showWorkbenchNavigation ? <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link href={isAuthenticated ? '/app' : '/'} className="flex items-center gap-2 text-lg font-semibold lg:hidden">
              <PraxisBrandChip compact />
            </Link>
            <nav className="ml-auto hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
              <Link href={isAuthenticated ? '/app' : '/'} className="hover:text-slate-900">Home</Link>
              <Link href={isAuthenticated ? '/app/capsules' : '/login?mode=signup&redirect=%2Fapp%2Fcapsules'} className="hover:text-slate-900">Capsules</Link>
              <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
              <Link href="/learn" className="hover:text-slate-900">Learn</Link>
              <Link href="/release-notes" className="hover:text-slate-900">Release notes</Link>
            </nav>
            <div className="flex items-center gap-2">
              {isAuthenticated ? <AccountProfileButton compact /> : <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-white">Sign in</Link>}
            </div>
          </header> : null}

          <div className={cn('mx-auto flex max-w-6xl flex-col items-center', showWorkbenchNavigation ? 'mt-14 sm:mt-18' : 'mt-8 sm:mt-12')}>
            <p className="receipt-slip flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs font-semibold">
              <Sparkles className="h-4 w-4 text-[color:var(--color-oxide)]" />
              Compose your reasoning and policy products from expert ContextCapsules.
            </p>
            <div className="mt-3" data-testid="runtime-health-semaphore">
              <RuntimeHealthSemaphore isAuthenticated={isAuthenticated} />
            </div>
            <h1 className="mt-7 max-w-4xl text-center font-serif text-5xl font-semibold tracking-tight text-[color:var(--color-deep-ink)] sm:text-6xl">
              What can PRAXIS do for you?
            </h1>

            <div className="od-praxis-control mt-7 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-500">
              {isAuthenticated ? (user?.subscription || 'Free plan') : 'Free plan'}
              <span className="text-slate-300">·</span>
              <Link href={isAuthenticated ? '/pricing' : '/login?mode=signup'} className="text-sage">Upgrade</Link>
            </div>

            {showHomepageFactoryCta ? (
              <Link
                href="/app/capsules"
                data-testid="open-capsule-factory-cta"
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--color-oxide)] shadow-sm shadow-[rgba(164,73,46,0.10)] hover:border-[color:var(--color-clay)]/45 hover:bg-[color:var(--color-mineral-soft)]"
              >
                <WandSparkles className="h-4 w-4" />
                Open Capsules
              </Link>
            ) : null}

            <div className="od-praxis-panel mt-6 w-full max-w-5xl rounded-xl" data-testid="praxis-main-composer">
              <div className="border-b border-black/10 px-5 py-4" data-testid="capsule-context-bar">
                <div className="flex flex-wrap items-start justify-between gap-3" data-testid="capsule-context-composer">
                  <div className="min-w-0 flex-1" data-testid="active-capsule-strip">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                      <span className="rounded-md bg-slate-950 px-2 py-1 text-white">Context Chain</span>
                      <span className="max-w-full truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-900">
                        {activeCapsuleForStrip?.label ?? 'No capsule opened'}
                      </span>
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
                        Readiness {activeCapsuleReadiness}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                        {activeCapsuleSourceCount} source{activeCapsuleSourceCount === 1 ? '' : 's'}
                      </span>
                      <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-800">
                        Output {activeCapsuleOutputGoal}
                      </span>
                      <span
                        data-testid="context-health-indicator"
                        className={cn('rounded-md border px-2 py-1', contextHealth.tone)}
                        title={contextHealth.detail}
                      >
                        Context health: {contextHealth.label}
                      </span>
                      <button
                        type="button"
                        data-testid="active-capsule-open-details"
                        onClick={() => setInspectorOpen(true)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Details
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <span>Profile / user: {userCapsule?.label ?? 'Open'}</span>
                      <span className="text-slate-300">/</span>
                      <span>Situation / context: {situationCapsuleForHeader?.label ?? 'Open'}</span>
                      <span className="text-slate-300">/</span>
                      <span>Sources: {repositoryDocuments.length ? `${repositoryDocuments.length} repository` : `${referenceCapsulesForHeader.length} reference`}</span>
                      <span className="text-slate-300">/</span>
                      <span>Output: {outputCapsuleForHeader?.label ?? selectedAgent.label}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Model knowledge is the default baseline. Add capsules, sources, or web search to make PRAXIS more specific, current, and reusable.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setContextComposerCollapsed((current) => !current)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ChevronDown className={cn('h-3.5 w-3.5 transition', contextComposerCollapsed && '-rotate-90')} />
                      {contextComposerCollapsed ? 'Expand' : 'Collapse'}
                    </button>
                    <button
                      type="button"
                      aria-label="Save context capsule"
                      onClick={() => void saveCombinedCapsuleStack(activeCapsuleStack)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save capsule
                    </button>
                    <button
                      type="button"
                      onClick={shareActiveContextChain}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={downloadActiveContextChain}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <HardDrive className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={improveActiveContextChain}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <WandSparkles className="h-3.5 w-3.5" />
                      Improve
                    </button>
                  </div>
                </div>
                {!contextComposerCollapsed ? (
                  <ContextChainDropzone>
                    <div className="context-chain relative mt-4 overflow-x-auto rounded-xl p-3 shadow-sm shadow-black/5">
                      <div className="pointer-events-none absolute left-7 right-7 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[color:var(--color-mineral)]/35 via-[color:var(--color-civic-blue)]/35 to-[color:var(--color-mineral)]/25" aria-hidden />
                      <SortableContext items={activeCapsuleIds} strategy={horizontalListSortingStrategy}>
                        <div className="relative flex min-w-full items-stretch gap-3">
                          {activeCapsuleStack.map((capsule, index) => (
                            <SortableCapsuleBlock
                              key={capsule.id}
                              capsule={capsule}
                              index={index}
                              reviewCategory={capsuleNeedsCategoryReview(capsule, userCapsules)}
                              onOpen={() => {
                                setCurrentCapsuleId(capsule.id);
                                setActiveTab('capsules');
                                setInspectorOpen(true);
                              }}
                              onRemove={() => removeCapsule(capsule.id)}
                              isRecentlyApplied={recentlyAppliedCapsuleId === capsule.id}
                            />
                          ))}
                          {openChainSlots.map((slot) => (
                            <button
                              key={slot.role}
                              type="button"
                              onClick={() => setCapsuleBrowserOpen(true)}
                              className="relative min-w-[168px] flex-1 rounded-lg border border-dashed border-slate-300 bg-white/70 p-3 text-left text-xs text-slate-500 transition hover:border-[color:var(--color-oxide)] hover:bg-white"
                            >
                              <span className="block font-semibold text-slate-700">{slot.label}</span>
                              <span className="mt-1 block leading-5">{slot.helper}</span>
                              <span className="mt-3 inline-flex rounded-md bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white">{slot.action}</span>
                            </button>
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  </ContextChainDropzone>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <SourcePostureChip
                    label={repositoryDocuments.length ? 'Sources ready' : 'Sources needed'}
                    state={repositoryDocuments.length ? 'ready' : 'review'}
                  />
                  <button
                    type="button"
                    onClick={() => setCapsuleBrowserOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Browse capsules
                  </button>
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                placeholder="Describe a task or responsibility"
                className="min-h-36 w-full resize-none bg-transparent px-6 py-6 text-xl text-slate-900 outline-none placeholder:text-slate-400"
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
                      className="od-praxis-control rounded-md p-2.5 text-slate-700 transition"
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
                  <span className="hidden rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 sm:inline-flex">
                    TACITUS routes model, worker, and tools
                  </span>
                  <WorkActionMenu label="Work on this" />
                  <button type="button" aria-label="Voice input" onClick={startVoiceInput} className="rounded-md p-2.5 text-slate-600 hover:bg-slate-100">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!prompt.trim() || isStreaming}
                    onClick={() => void sendToPraxis()}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white shadow-sm shadow-black/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    aria-label="Send to PRAXIS"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 bg-white/70 px-5 py-2 text-sm text-slate-500">
                <div className="flex min-w-0 items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="min-w-0">{status}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {conversationThreadId ? (
                    <span className="max-w-48 truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-500" title={conversationUrl ?? undefined}>
                      {conversationThreadId}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={startNewConversation}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New chat
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyConversationLink()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy link
                  </button>
                </div>
              </div>
            </div>

            {chatMessages.length ? (
              <section className="mt-5 w-full max-w-5xl space-y-3 rounded-lg border border-black/10 bg-white/85 p-4 shadow-sm shadow-black/5" data-testid="praxis-chat-thread">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Conversation workspace</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {conversationUrl ?? 'Start talking to create a shareable PRAXIS link.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyConversationLink()}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy link
                  </button>
                </div>
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
                        <ConversationReceiptSummary envelope={message.answerEnvelope} />
                        <ConversationSourcePreviewPanel
                          envelope={message.answerEnvelope}
                          onFollowUp={(followUp) => {
                            setPrompt(followUp);
                            setStatus('Follow-up loaded into the composer.');
                          }}
                        />
                        <MessageActionRow
                          onCopy={() => void navigator.clipboard?.writeText(message.text)}
                          onRetry={() => retryFromMessage(index)}
                          onSave={() => void saveAssistantMessage(message, index)}
                          onMemo={() => void saveAssistantMessage(message, index, 'memo-draft')}
                          onSourceCheck={() => void sendToPraxis(selectedAgent, `Source-check this answer in the active conversation against the active capsule. Identify weak claims, missing citations, and stale assumptions.\n\n${message.text}`)}
                        />
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    )}
                  </article>
                ))}
                {selectedText ? (
                  <div className="rounded-lg border border-[color:var(--color-clay)]/30 bg-[color:var(--color-archive-paper-strong)] p-3 shadow-sm" data-testid="text-span-core-popover">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-oxide)]">Attach selected text</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Attach to active capsule: {selectedCapsule?.label ?? currentCapsuleId}</p>
                        <blockquote className="mt-2 max-h-24 overflow-y-auto rounded-md border border-[color:var(--color-clay)]/20 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                          {selectedText}
                        </blockquote>
                      </div>
                      <button type="button" aria-label="Clear selected text" onClick={clearSelectedSpan} className="rounded p-1 text-slate-500 hover:bg-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {spanTargets.map((target) => (
                        <button
                          key={target.id}
                          type="button"
                          disabled={selectedSpanStatus === 'pending'}
                          onClick={() => void bindSelectedSpan(target.id)}
                          className={cn(
                            'rounded-md bg-white px-3 py-2 text-left text-xs shadow-sm ring-1 ring-slate-200 hover:ring-[color:var(--color-clay)]',
                            attachedSpan?.target.id === target.id ? 'ring-[color:var(--color-clay)] text-[color:var(--color-oxide)]' : 'text-slate-700',
                            selectedSpanStatus === 'pending' ? 'cursor-wait opacity-70' : '',
                          )}
                        >
                          <span className="block font-semibold">{target.label}</span>
                          <span className="mt-1 block leading-5 text-slate-500">{target.helper}</span>
                        </button>
                      ))}
                    </div>
                    {selectedSpanMessage ? (
                      <p
                        className={cn(
                          'mt-3 rounded-md px-3 py-2 text-xs font-medium',
                          selectedSpanStatus === 'error' ? 'bg-rose-50 text-rose-700' : selectedSpanStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600',
                        )}
                      >
                        {selectedSpanMessage}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Attaching saves this excerpt to the active capsule. It will not run AI until you choose a follow-up.
                      </p>
                    )}
                    {attachedSpan ? (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--color-clay)]/20 pt-3">
                        <button type="button" onClick={() => askAboutAttachedSpan('ask')} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                          Ask PRAXIS about this span
                        </button>
                        {attachedSpan.target.id === 'sourceability' ? (
                          <button type="button" onClick={() => askAboutAttachedSpan('source-check')} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            Source-check this span
                          </button>
                        ) : null}
                        <button type="button" onClick={() => void turnAttachedSpanIntoMemoNote()} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          Turn into memo note
                        </button>
                        <button type="button" onClick={clearSelectedSpan} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                          Clear selection
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section
              id="capsule-repository-section"
              className="mt-12 w-full max-w-5xl"
              data-testid={isRepositoryPage ? 'capsule-repository-page' : 'capsule-manager'}
            >
              <span className="sr-only" data-testid="capsule-manager">Capsule manager</span>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{isCapsuleRepositoryPage ? 'Capsules' : isRepositoryPage ? 'Repository' : 'Capsules'}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {isCapsuleRepositoryPage
                      ? 'Manage reusable ContextCapsules with sources, privacy, .praxis downloads, and review-gated AI improvements.'
                      : isRepositoryPage
                        ? 'Inspect uploaded documents, source attachment state, summaries, refreshes, and missing-source actions for the active capsule.'
                      : 'Stored context, documents, and AI work.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void createCapsuleLite(undefined, undefined, getPolicyTeamCategory(capsulePolicyTeamFilter))}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    {isAuthenticated ? 'New capsule' : 'Sign in to build'}
                  </button>
                  <Link
                    href={isAuthenticated ? '/app/capsules?lane=repository' : '/login?mode=signup&redirect=%2Fapp%2Fcapsules%3Flane%3Drepository'}
                    className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                  >
                    <Library className="h-4 w-4" />
                    Repository lane
                  </Link>
                </div>
              </div>

              {isCapsuleRepositoryPage ? (
                <CapsuleFactoryCommandBand
                  capsule={selectedCapsule}
                  visibleCount={visibleCapsuleCards.length}
                  userCapsuleCount={userCapsuleTaxonomyStats.visibleCapsules}
                  archivedCount={userCapsuleTaxonomyStats.archivedCapsules}
                  reviewDiffCount={factoryReviewDiffs.filter((diff) => diff.reviewState === 'reviewed').length}
                  onCreate={() => {
                    if (requireAuthForAction('Build a new PRAXIS ContextCapsule.')) return;
                    setBuilderOpen(true);
                  }}
                  onInspect={() => {
                    setInspectorOpen(true);
                  }}
                  onRunFactory={runCapsuleFactoryAgent}
                />
              ) : null}

              {!isRepositoryLane ? <CapsuleTaxonomyFilterBar
                stats={activeCapsuleTaxonomyStats}
                query={capsuleSearch}
                onQuery={setCapsuleSearch}
                typeId={capsuleTypeFilter}
                domainId={capsuleDomainFilter}
                policyTeamId={capsulePolicyTeamFilter}
                onType={setCapsuleTypeFilter}
                onDomain={setCapsuleDomainFilter}
                onPolicyTeam={setCapsulePolicyTeamFilter}
                showRepairStates={isRepositoryPage}
                onClear={() => {
                  setCapsuleSearch('');
                  setCapsuleTypeFilter('all');
                  setCapsuleDomainFilter('all');
                  setCapsulePolicyTeamFilter('all');
                }}
              /> : null}
              {isRepositoryLane ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <Metric label="Source refs" value={userCapsuleTaxonomyStats.sourceReferences} />
                  <Metric label="Document refs" value={userCapsuleTaxonomyStats.documentReferences} />
                  <Metric label="Graph mode" value={runtimeProof.graphMode} />
                  <Metric label="Memory" value={runtimeProof.cogneeMode} />
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 md:grid-cols-2" data-testid="capsule-tool-output-lanes">
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-xs font-semibold text-amber-900">Thinking devices</p>
                  <p className="mt-1 text-[11px] leading-5 text-amber-800">Assumption checks, source checks, reasoning tools.</p>
                </div>
                <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
                  <p className="text-xs font-semibold text-violet-900">Artifacts</p>
                  <p className="mt-1 text-[11px] leading-5 text-violet-800">Two-pagers, diplomatic notes, briefs, handovers.</p>
                </div>
              </div>

              {isAuthenticated ? (
                <div className={cn('mt-6 grid gap-4', !isRepositoryPage && !isCapsuleRepositoryPage && 'lg:grid-cols-[minmax(0,1fr)_320px]', isRepositoryPage && 'lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]', isCapsuleRepositoryPage && 'lg:grid-cols-[220px_minmax(0,1fr)]')}>
                  {isCapsuleRepositoryPage ? (
                    <CapsuleFactorySidebar
                      activeLane={factoryLane}
                      onSelect={(item) => {
                        setFactoryLane(item.id);
                        if (item.filter) {
                          if (item.filter === 'output') setCapsuleTypeFilter('output');
                          else setCapsuleDomainFilter(item.filter);
                        }
                        if (item.id === 'sources') {
                          setRepositoryOpen(true);
                          void refreshRepository();
                        }
                        if (item.id === 'agents') setCapsuleDetailTab('ai');
                      }}
                    />
                  ) : null}
                  <div className="min-w-0">
                    {isCapsuleRepositoryPage ? (
                      <CapsuleFactoryLanePanel
                        activeLane={factoryLane}
                        capsule={selectedCapsule}
                        agentRunCount={agentRuns.length}
                        reviewDiffs={factoryReviewDiffs}
                        runtimeProof={runtimeProof}
                        repositoryDocuments={visibleRepositoryDocuments}
                        repositoryLoading={repositoryLoading}
                        onReview={reviewFactoryLane}
                        onApply={applyFactoryReviewDiff}
                        onReject={rejectFactoryReviewDiff}
                      />
                    ) : null}
                  {!isRepositoryLane ? (
                    <>
                      <FeaturedExpertPicksShelf
                        capsules={filteredFeaturedCapsuleCards}
                        title="Featured Expert Picks"
                        subtitle="Handpicked knowledge capsules for serious policy work."
                        isAuthenticated={isAuthenticated}
                        onBuildOwn={openBuildYourOwnKnowledge}
                        onSelect={selectCapsuleCard}
                        onAdd={applyCapsuleCard}
                        onInspect={chatWithCapsule}
                        onImprove={improveCapsuleCard}
                        onDownload={(capsule) => void downloadCapsulePackage(capsule)}
                        onArchive={(capsule) => void archiveCapsuleCard(capsule)}
                      />
                      <FeaturedExpertPicksShelf
                        capsules={filteredIntellectualDeviceCards}
                        title="Intellectual Devices"
                        subtitle="Review-gated methods that make Ask PRAXIS reason from an explicit operating device."
                        isAuthenticated={isAuthenticated}
                        onBuildOwn={openBuildYourOwnKnowledge}
                        onSelect={selectCapsuleCard}
                        onAdd={applyCapsuleCard}
                        onInspect={chatWithCapsule}
                        onImprove={improveCapsuleCard}
                        onDownload={(capsule) => void downloadCapsulePackage(capsule)}
                        onArchive={(capsule) => void archiveCapsuleCard(capsule)}
                      />
                    </>
                  ) : null}
                  {!isRepositoryLane ? <div className={cn('mt-4 grid gap-3 md:grid-cols-2', isCapsuleRepositoryPage && 'lg:grid-cols-3', isRepositoryPage && 'md:grid-cols-1')} data-testid="tasklet-capsule-cards">
                    {capsulesLoading && !filteredUserCapsules.length ? (
                      <CapsuleEmptyState label="Loading capsules..." />
                    ) : null}
                    {visibleCapsuleCards.map((capsule) => (
                      <CapsuleCard
                        key={capsule.capsuleId}
                        capsule={capsule}
                        active={capsule.capsuleId === currentCapsuleId}
                        mutable={!showingStarterFallback}
                        compact={isCapsuleRepositoryPage || !isRepositoryPage}
                        onSelect={() => selectCapsuleCard(capsule)}
                        onAdd={() => applyCapsuleCard(capsule)}
                        onInspect={() => chatWithCapsule(capsule)}
                        onImprove={() => improveCapsuleCard(capsule)}
                        onDownload={() => void downloadCapsulePackage(capsule)}
                        onMakePrivate={() => void setCapsuleVisibility(capsule, 'private')}
                        onMakePublic={() => void setCapsuleVisibility(capsule, 'public')}
                        onDelete={() => void deleteCapsule(capsule)}
                        onArchive={() => void archiveCapsuleCard(capsule)}
                      />
                    ))}
                    {!capsulesLoading && !visibleCapsuleCards.length ? (
                      <CapsuleEmptyState label="No starter capsules match that search." />
                    ) : null}
                  </div> : null}
                  {isRepositoryLane ? (
                    <div className="mt-4">
                      <DocumentRepositorySection
                        capsule={selectedCapsule}
                        documents={repositoryDocuments}
                        documentRefs={Array.from(repositoryDocIds)}
                        loading={repositoryLoading}
                        onUpload={() => fileInputRef.current?.click()}
                        onRefresh={() => void refreshRepository()}
                        onAttach={(documentId) => {
                          if (selectedCapsule) void updateCapsuleDocumentRef(selectedCapsule, documentId, 'attach');
                        }}
                        onDetach={(documentId) => {
                          if (selectedCapsule) void updateCapsuleDocumentRef(selectedCapsule, documentId, 'detach');
                        }}
                        onInspect={(document) => {
                          setPrompt(`Inspect "${document.title}" for the active capsule. Return source posture, chunks, entities, key claims, and gaps.`);
                          void sendToPraxis(selectedAgent, `Inspect "${document.title}" for the active capsule. Return source posture, chunks, entities, key claims, and gaps.`);
                        }}
                      />
                    </div>
                  ) : null}
                  </div>
                  {isRepositoryPage ? (
                    <DocumentRepositorySection
                      capsule={selectedCapsule}
                      documents={repositoryDocuments}
                      documentRefs={Array.from(repositoryDocIds)}
                      loading={repositoryLoading}
                      onUpload={() => fileInputRef.current?.click()}
                      onRefresh={() => void refreshRepository()}
                      onAttach={(documentId) => {
                        if (selectedCapsule) void updateCapsuleDocumentRef(selectedCapsule, documentId, 'attach');
                      }}
                      onDetach={(documentId) => {
                        if (selectedCapsule) void updateCapsuleDocumentRef(selectedCapsule, documentId, 'detach');
                      }}
                      onInspect={(document) => {
                        setPrompt(`Inspect "${document.title}" for the active capsule. Return source posture, chunks, entities, key claims, and gaps.`);
                        void sendToPraxis(selectedAgent, `Inspect "${document.title}" for the active capsule. Return source posture, chunks, entities, key claims, and gaps.`);
                      }}
                    />
                  ) : isCapsuleRepositoryPage ? null : (
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
                      focusedRunStream={focusedRunStream}
                      focusedRunLoading={focusedRunLoading}
                      focusedRunAction={focusedRunAction}
                      runtimeProof={runtimeProof}
                      onUpload={() => fileInputRef.current?.click()}
                      onDetailTab={setCapsuleDetailTab}
                      onOpenRepository={() => { setRepositoryOpen(true); void refreshRepository(); }}
                      onImprove={() => improveCapsule()}
                      onDownload={() => selectedCapsule ? void downloadCapsulePackage(selectedCapsule) : undefined}
                      onMakePrivate={() => selectedCapsule ? void setCapsuleVisibility(selectedCapsule, 'private') : undefined}
                      onMakePublic={() => selectedCapsule ? void setCapsuleVisibility(selectedCapsule, 'public') : undefined}
                      onDelete={() => selectedCapsule ? void deleteCapsule(selectedCapsule) : undefined}
                      onRefresh={() => void refreshCapsules(currentCapsuleId)}
                      onRetryFocusedRun={() => void postFocusedRunAction('retry')}
                      onCancelFocusedRun={() => void postFocusedRunAction('cancel')}
                      onDecideApproval={(approvalId, decision) => void postFocusedRunAction(`approvals/${encodeURIComponent(approvalId)}`, { decision })}
                      onAssignPolicyTeam={(category) => {
                        if (selectedCapsule) void assignPolicyTeam(selectedCapsule, category);
                      }}
                      onAttachTool={(recommendation) => {
                        if (selectedCapsule) void attachRecommendedTool(selectedCapsule, recommendation);
                      }}
                    />
                  )}
                </div>
              ) : (
                <>
                <FeaturedExpertPicksShelf
                  capsules={filteredFeaturedCapsuleCards}
                  isAuthenticated={isAuthenticated}
                  onBuildOwn={openBuildYourOwnKnowledge}
                  onSelect={selectCapsuleCard}
                  onAdd={applyCapsuleCard}
                  onInspect={chatWithCapsule}
                  onImprove={improveCapsuleCard}
                  onDownload={(capsule) => void downloadCapsulePackage(capsule)}
                  onArchive={(capsule) => void archiveCapsuleCard(capsule)}
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="tasklet-capsule-cards">
                  {visibleCapsuleCards.map((capsule) => (
                    <CapsuleCard
                      key={capsule.capsuleId}
                      capsule={capsule}
                      active={capsule.capsuleId === currentCapsuleId}
                      mutable={false}
                      compact={isCapsuleRepositoryPage || !isRepositoryPage}
                      onSelect={() => selectCapsuleCard(capsule)}
                      onAdd={() => applyCapsuleCard(capsule)}
                      onInspect={() => chatWithCapsule(capsule)}
                      onImprove={() => improveCapsuleCard(capsule)}
                      onDownload={() => void downloadCapsulePackage(capsule)}
                      onMakePrivate={() => void setCapsuleVisibility(capsule, 'private')}
                      onMakePublic={() => void setCapsuleVisibility(capsule, 'public')}
                      onDelete={() => void deleteCapsule(capsule)}
                      onArchive={() => void archiveCapsuleCard(capsule)}
                    />
                  ))}
                  {!visibleCapsuleCards.length ? <CapsuleEmptyState label="No starter capsules match that search." /> : null}
                </div>
                </>
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
      {capsuleBrowserOpen ? (
        <CapsuleBrowserDialog
          capsules={visibleCapsuleCards}
          loading={capsulesLoading}
          filterBar={
            <CapsuleTaxonomyFilterBar
              stats={activeCapsuleTaxonomyStats}
              query={capsuleSearch}
              onQuery={setCapsuleSearch}
              typeId={capsuleTypeFilter}
              onType={setCapsuleTypeFilter}
              domainId={capsuleDomainFilter}
              onDomain={setCapsuleDomainFilter}
              policyTeamId={capsulePolicyTeamFilter}
              onPolicyTeam={setCapsulePolicyTeamFilter}
              showRepairStates={isRepositoryPage}
              onClear={() => {
                setCapsuleSearch('');
                setCapsuleTypeFilter('all');
                setCapsuleDomainFilter('all');
                setCapsulePolicyTeamFilter('all');
              }}
            />
          }
          onClose={() => setCapsuleBrowserOpen(false)}
          onSelect={(capsule) => applyCapsuleCard(capsule)}
        />
      ) : null}
      </DndContext>
    </section>
  );
}
function ConversationReceiptSummary({ envelope }: { envelope?: AskAnswerEnvelope }) {
  const receipt = envelope?.orchestrationReceipt;
  if (!receipt) return null;
  const queuedRun = receipt.supervisor.queuedRun;
  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2" data-testid="praxis-answer-receipt">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">TACITUS routing receipt</p>
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
          {receipt.triage.agenticMode.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
          Triage: {receipt.triage.intent.replace(/_/g, ' ')}
        </span>
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
          Capsule: {receipt.capsule.contextHealth}
        </span>
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
          Tool router: {receipt.toolRouting.selectedToolIds.length}
        </span>
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
          {receipt.routingDecision.userSafeLabels.modelTier}
        </span>
        {queuedRun ? (
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-900">
            Agent run: {queuedRun.runId === 'unavailable' ? queuedRun.status.replace(/_/g, ' ') : queuedRun.runId}
          </span>
        ) : null}
      </div>
    </section>
  );
}
function ConversationSourcePreviewPanel({ envelope, onFollowUp }: { envelope?: AskAnswerEnvelope; onFollowUp: (followUp: string) => void }) {
  const sourceCards = envelope?.sourceCards ?? [];
  const followUps = envelope?.followUps ?? [];
  if (sourceCards.length === 0 && followUps.length === 0) return null;
  return (
    <div className="mt-3 space-y-2" data-testid="praxis-answer-source-preview">
      {sourceCards.length > 0 ? (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Sources used</p>
            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              {sourceCards.length} preview{sourceCards.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-2 grid gap-2">
            {sourceCards.map((card) => (
              <article key={card.id} className="rounded-md border border-slate-200 bg-white p-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                    {card.url ? (
                      <a href={card.url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs font-semibold text-diplomatic-blue hover:underline">
                        {card.title}
                      </a>
                    ) : (
                      <p className="mt-0.5 truncate text-xs font-semibold text-navy-950">{card.title}</p>
                    )}
                  </div>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    {Math.round((card.confidence ?? 0) * 100)}%
                  </span>
                </div>
                <blockquote className="mt-2 border-l-2 border-diplomatic-blue/40 pl-2 text-xs leading-5 text-slate-700">
                  {card.quotePreview || 'No quote preview available.'}
                </blockquote>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-500">
                  {card.citationLabel ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono">{card.citationLabel}</span> : null}
                  {card.locatorLabel ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono">{card.locatorLabel}</span> : null}
                  {!card.locatorLabel && card.pageRef ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono">{card.pageRef}</span> : null}
                  {card.sourceReceiptHref && card.sourceReceiptId ? (
                    <a href={card.sourceReceiptHref} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-diplomatic-blue hover:underline">
                      Source receipt
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {followUps.length > 0 ? (
        <section className="rounded-md border border-slate-200 bg-white p-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Follow-ups</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {followUps.map((followUp) => (
              <button
                key={followUp}
                type="button"
                onClick={() => onFollowUp(followUp)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-left text-[11px] font-semibold text-slate-700 hover:border-diplomatic-blue/30 hover:bg-white"
              >
                {followUp}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
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
          a: ({ children, href }) => {
            const safeHref = safeMarkdownHref(href);
            if (!safeHref) return <span>{children}</span>;
            const external = /^https?:\/\//i.test(safeHref);
            return (
              <a href={safeHref} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="font-semibold text-diplomatic-blue underline-offset-2 hover:underline">
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function ContextChainDropzone({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'capsule-context-dropzone' });
  return (
    <div
      ref={setNodeRef}
      data-testid="capsule-context-dropzone"
      className={cn(
        'rounded-xl transition',
        isOver ? 'ring-2 ring-[#c9a961]/50 ring-offset-2 ring-offset-white' : '',
      )}
    >
      {children}
    </div>
  );
}

function SortableCapsuleBlock({
  capsule,
  index,
  reviewCategory,
  isRecentlyApplied,
  onOpen,
  onRemove,
}: {
  capsule: ActiveCapsuleChip;
  index: number;
  reviewCategory: boolean;
  isRecentlyApplied: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: capsule.id });
  const roleLabel = capsuleRoleLabel(capsule.role);
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative min-w-[190px] flex-1 rounded-lg border p-3 shadow-sm transition',
        capsuleRoleStyles[capsule.role],
        isRecentlyApplied && 'context-apply-pulse ring-2 ring-emerald-300 ring-offset-2 ring-offset-white',
        isDragging && 'z-10 opacity-80 shadow-lg',
      )}
      data-context-apply-state={isRecentlyApplied ? 'applied' : 'idle'}
      data-testid={`context-capsule-block-${capsule.role}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="min-w-0 text-left"
          onClick={onOpen}
        >
          <span className="block text-[11px] font-semibold uppercase text-current/70">{index === 0 ? 'Active' : roleLabel}</span>
          <span className="mt-1 block truncate text-sm font-semibold">{capsule.label}</span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Reorder ${capsule.label}`}
            className="rounded p-1 text-current/60 hover:bg-white/50"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Remove ${capsule.label}`}
            onClick={onRemove}
            className="rounded p-1 text-current/60 hover:bg-white/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
        <span className="rounded bg-white/60 px-1.5 py-0.5">{capsule.code}</span>
        {reviewCategory ? <span className="rounded bg-white/60 px-1.5 py-0.5">review category</span> : null}
      </div>
    </article>
  );
}

function CapsuleBrowserDialog({
  capsules,
  loading,
  filterBar,
  onClose,
  onSelect,
}: {
  capsules: PraxisCapsuleSummary[];
  loading: boolean;
  filterBar: ReactNode;
  onClose: () => void;
  onSelect: (capsule: PraxisCapsuleSummary) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Browse capsules">
      <section className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20" data-testid="capsule-browser-modal">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Browse capsules</p>
            <p className="mt-1 text-xs text-slate-500">Select a capsule to add it by its saved category.</p>
          </div>
          <button type="button" aria-label="Close capsule browser" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3">
          {filterBar}
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-4">
          {loading ? <CapsuleEmptyState label="Loading capsules..." /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {capsules.map((capsule) => {
              const meta = capsuleCategoryMeta(capsule);
              const role = capsuleDefaultRole(capsule);
              return (
                <button
                  key={capsule.capsuleId}
                  type="button"
                  onClick={() => onSelect(capsule)}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-[color:var(--color-oxide)] hover:shadow-md"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">{capsule.label}</span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{meta.summary}</span>
                    </span>
                    <span className={cn('shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold', meta.soft)}>
                      {capsuleRoleLabel(role)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {!loading && !capsules.length ? <CapsuleEmptyState label="No capsules match that search." /> : null}
        </div>
      </section>
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

function buildSelectedSpanNote(target: SpanTargetDefinition, text: string): string {
  return [
    `${target.label}: ${target.note}`,
    target.helper,
    `Follow-up: ${target.askPrompt}`,
    `Excerpt: ${text.slice(0, 520)}`,
  ].join('\n');
}

async function fetchCapsuleLibrary(): Promise<PraxisCapsuleSummary[]> {
  const response = await fetch('/api/context/capsules?includeArchived=true', { credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error ?? 'capsule list failed');
  return Array.isArray(payload?.capsules) ? payload.capsules as PraxisCapsuleSummary[] : [];
}

function ensureDefaultCapsuleStack(
  activeStack: ActiveCapsuleChip[],
  input: { userCapsules: PraxisCapsuleSummary[]; selectedCapsule: PraxisCapsuleSummary | null },
): ActiveCapsuleChip[] {
  void input;
  return uniqueCapsuleStack(activeStack).slice(0, 8);
}

function buildActiveContextStack(currentCapsuleId: string, activeCapsuleStack: ActiveCapsuleChip[]): ActiveContextStackPayload {
  const userCapsule = activeCapsuleStack.find((capsule) => capsule.role === 'user');
  const situationCapsule = activeCapsuleStack.find((capsule) => capsule.role === 'situation');
  const outputCapsule = activeCapsuleStack.find((capsule) => capsule.role === 'output');
  return {
    stackId: 'default',
    capsuleId: currentCapsuleId,
    userModelId: userCapsule?.id ?? null,
    situationId: situationCapsule?.id ?? null,
    sourceIds: activeCapsuleStack.filter((capsule) => capsule.role === 'reference').map((capsule) => capsule.id),
    documentIds: [],
    outputGoal: outputCapsule?.label ?? null,
    evidenceGaps: [],
    canvasLayout: {},
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  };
}

function selectedCoreIdsFromContextStack(activeContextStack: ActiveContextStackPayload): SelectedContextCoreIds {
  return {
    userCoreId: activeContextStack.userModelId,
    situationCoreId: activeContextStack.situationId,
    sourceCoreIds: activeContextStack.sourceIds,
    documentCoreIds: activeContextStack.documentIds,
    toolCoreIds: [],
    outputCoreIds: activeContextStack.outputGoal ? [activeContextStack.outputGoal] : [],
  };
}

function getContextHealth(activeCapsuleStack: ActiveCapsuleChip[]): ContextHealth {
  const roles = new Set(activeCapsuleStack.map((capsule) => capsule.role));
  const hasSituation = roles.has('situation');
  const hasSources = roles.has('reference');
  const hasTools = roles.has('tool');
  const hasOutput = roles.has('output');
  if (hasSituation && hasSources && hasTools && hasOutput) {
    return {
      label: 'Operational',
      detail: 'Situation, references, checks, and output are set for agentic work.',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };
  }
  if (hasSituation && hasSources && hasOutput) {
    return {
      label: 'Grounded',
      detail: 'Situation, references, and output are set for sourced Ask PRAXIS work.',
      tone: 'border-sky-200 bg-sky-50 text-sky-800',
    };
  }
  if (hasSituation && hasOutput) {
    return {
      label: 'Ready',
      detail: 'Situation and output are set. Add sources or checks for more specific work.',
      tone: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  return {
    label: 'Baseline',
    detail: 'Only model knowledge and the user profile are active.',
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
  };
}

function applyCapsuleToStack(current: ActiveCapsuleChip[], chip: ActiveCapsuleChip): ActiveCapsuleChip[] {
  const next = chip.role === 'reference' || chip.role === 'tool'
    ? [...current.filter((item) => item.id !== chip.id), chip]
    : [chip, ...current.filter((item) => item.id !== chip.id && item.role !== chip.role)];
  return uniqueCapsuleStack(next).slice(0, 8);
}

function uniqueCapsuleStack(stack: ActiveCapsuleChip[]): ActiveCapsuleChip[] {
  return stack.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}

function capsuleToChip(capsule: PraxisCapsuleSummary): ActiveCapsuleChip {
  const starterDefinition = starterDefinitionForCapsule(capsule);
  const starterRole = starterDefinition?.category === 'tool' || starterDefinition?.category === 'output' || starterDefinition?.category === 'user'
    ? starterDefinition.category
    : 'situation';
  return {
    id: capsule.capsuleId,
    label: capsule.label,
    code: starterDefinition?.category.toUpperCase() ?? capsule.scope.toUpperCase(),
    role: capsule.scope === 'user' ? 'user' : starterRole,
  };
}

function starterDefinitionToCapsuleSummary(starter: CapsuleStarterDefinition): PraxisCapsuleSummary {
  const sourceCoreIds = uniqueIds([...(starter.coreRefs.sourceCoreIds ?? []), ...starter.sourcePack.map((source) => source.id)]);
  return {
    capsuleId: starter.starterId,
    label: starter.label,
    scope: starter.category === 'user' ? 'user' : starter.category === 'tool' ? 'team' : 'situation',
    version: 1,
    updatedAt: STARTER_CAPSULE_UPDATED_AT,
    archivedAt: null,
    coreRefs: {
      userCoreId: starter.coreRefs.userCoreId ?? null,
      situationCoreId: starter.coreRefs.situationCoreId ?? null,
      pathCoreId: starter.coreRefs.pathCoreId ?? null,
      sourceCoreIds,
      documentCoreIds: starter.coreRefs.documentCoreIds ?? [],
      graphCoreId: starter.coreRefs.graphCoreId ?? null,
      timeCoreId: starter.coreRefs.timeCoreId ?? null,
      toolCoreIds: uniqueIds([...(starter.coreRefs.toolCoreIds ?? []), ...starter.recommendedToolIds]),
      objectiveCoreIds: starter.coreRefs.objectiveCoreIds ?? [],
      outputCoreIds: uniqueIds([...(starter.coreRefs.outputCoreIds ?? []), ...starter.outputProductIds]),
      productCoreIds: starter.coreRefs.productCoreIds ?? [],
      memoryCoreId: starter.coreRefs.memoryCoreId ?? null,
    },
    health: {
      score: starter.readinessStars * 20,
      warnings: starter.suggestedQuestions.slice(0, 3),
      blockers: [],
    },
    community: {
      tags: starter.tags,
      favorite: false,
    },
    trust: {
      level: 'starter',
      score: starter.readinessStars * 20,
      label: 'Starter capsule',
    },
  };
}

function starterDefinitionForCapsule(capsule: PraxisCapsuleSummary | null): CapsuleStarterDefinition | null {
  if (!capsule) return null;
  return CAPSULE_STARTER_DEFINITIONS.find((starter) => starter.starterId === capsule.capsuleId) ?? null;
}

function capsuleSummaryForChip(chip: ActiveCapsuleChip | undefined, userCapsules: PraxisCapsuleSummary[]): PraxisCapsuleSummary | null {
  if (!chip) return null;
  return userCapsules.find((capsule) => capsule.capsuleId === chip.id)
    ?? starterCapsuleSummaries.find((capsule) => capsule.capsuleId === chip.id)
    ?? null;
}

function capsuleCategory(capsule: PraxisCapsuleSummary): CapsuleStarterCategory | 'custom' {
  const starterDefinition = starterDefinitionForCapsule(capsule);
  if (starterDefinition) return starterDefinition.category;
  const taxonomy = resolveCapsuleTaxonomy(capsule);
  const type = taxonomy.types.find((facet) => ['situation', 'tool', 'output', 'user'].includes(facet.id));
  if (type?.id === 'situation' || type?.id === 'tool' || type?.id === 'output' || type?.id === 'user') return type.id;
  return 'custom';
}

function capsuleDefaultRole(capsule: PraxisCapsuleSummary): CapsuleRole {
  const category = capsuleCategory(capsule);
  return category === 'custom' ? 'reference' : category;
}

function capsuleRoleLabel(role: CapsuleRole): string {
  return capsuleRoles.find((item) => item.id === role)?.label ?? role;
}

function capsuleNeedsCategoryReview(chip: ActiveCapsuleChip, userCapsules: PraxisCapsuleSummary[]): boolean {
  const capsule = userCapsules.find((item) => item.capsuleId === chip.id)
    ?? starterCapsuleSummaries.find((item) => item.capsuleId === chip.id);
  return capsule ? capsuleCategory(capsule) === 'custom' : chip.role === 'reference' && !chip.id.startsWith('starter-');
}

function capsuleCategoryMeta(capsule: PraxisCapsuleSummary) {
  const starterDefinition = starterDefinitionForCapsule(capsule);
  const category = capsuleCategory(capsule);
  const meta: Record<CapsuleStarterCategory | 'custom', { label: string; color: string; soft: string }> = {
    situation: { label: 'Situation', color: '#0f766e', soft: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    tool: { label: 'Tool', color: '#b45309', soft: 'bg-amber-50 text-amber-800 border-amber-200' },
    output: { label: 'Output', color: '#6d28d9', soft: 'bg-violet-50 text-violet-800 border-violet-200' },
    user: { label: 'User', color: '#2563eb', soft: 'bg-sky-50 text-sky-800 border-sky-200' },
    custom: { label: 'Custom', color: '#475569', soft: 'bg-slate-50 text-slate-700 border-slate-200' },
  };
  return {
    ...meta[category],
    summary: starterDefinition?.summary ?? 'User-created capsule stored in this workspace.',
    detail: starterDefinition?.detail ?? 'This capsule can be improved, combined, inspected, and used by Ask PRAXIS through the existing context resolver.',
    starterDefinition,
    category,
    taxonomy: resolveCapsuleTaxonomy(capsule),
  };
}

function capsuleCategoryIcon(category: CapsuleStarterCategory | 'custom'): LucideIcon {
  if (category === 'situation') return MapIcon;
  if (category === 'tool') return BrainCircuit;
  if (category === 'output') return Clipboard;
  if (category === 'user') return ShieldCheck;
  return FileText;
}

function capsuleDomainAccent(domain: string): { label: string; soft: string } {
  const accents: Record<string, { label: string; soft: string }> = {
    diplomacy: { label: 'Diplomacy', soft: 'bg-teal-50 text-teal-800 border-teal-200' },
    'humanitarian-rights': { label: 'Humanitarian', soft: 'bg-rose-50 text-rose-800 border-rose-200' },
    finance: { label: 'Finance', soft: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    'cyber-resilience': { label: 'Cyber', soft: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    'public-health': { label: 'Public health', soft: 'bg-red-50 text-red-800 border-red-200' },
    'ai-governance': { label: 'AI governance', soft: 'bg-violet-50 text-violet-800 border-violet-200' },
    'election-integrity': { label: 'Elections', soft: 'bg-blue-50 text-blue-800 border-blue-200' },
    'migration-displacement': { label: 'Migration', soft: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    'critical-minerals': { label: 'Minerals', soft: 'bg-stone-100 text-stone-800 border-stone-300' },
    'policy-review': { label: 'Policy review', soft: 'bg-slate-50 text-slate-700 border-slate-200' },
    'audit-review': { label: 'Audit', soft: 'bg-amber-50 text-amber-800 border-amber-200' },
    'options-mapping': { label: 'Options', soft: 'bg-orange-50 text-orange-800 border-orange-200' },
    'source-intake': { label: 'Sources', soft: 'bg-sky-50 text-sky-800 border-sky-200' },
  };
  return accents[domain] ?? { label: 'General', soft: 'bg-slate-50 text-slate-700 border-slate-200' };
}

function capsuleSourcePosture(capsule: PraxisCapsuleSummary): string {
  const counts = capsuleCounts(capsule);
  if (counts.sources && counts.documents) return `${counts.sources} source refs and ${counts.documents} document refs`;
  if (counts.sources) return `${counts.sources} source refs`;
  if (counts.documents) return `${counts.documents} document refs`;
  return capsule.trust?.label ?? 'starter source posture, review before export';
}

function capsuleReasoningStyle(capsule: PraxisCapsuleSummary): string {
  const category = capsuleCategory(capsule);
  const starter = starterDefinitionForCapsule(capsule);
  if (starter?.recommendedToolIds.length) return starter.recommendedToolIds.slice(0, 3).join(', ');
  if (category === 'situation') return 'context mapping, actor posture, source gaps';
  if (category === 'tool') return 'thinking device, sourceability, review gates';
  if (category === 'output') return 'artifact structure, caveats, handover';
  if (category === 'user') return 'persona, mandate, tone, red lines';
  return 'reference context with category review';
}

function softColor(hex: string, alpha = 0.08): string {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((part) => `${part}${part}`).join('')
    : clean;
  const num = Number.parseInt(value, 16);
  if (Number.isNaN(num)) return `rgba(71, 85, 105, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function taxonomyTypeItems(stats: CapsuleTaxonomyStats) {
  return [
    ...capsuleTypeFilters
      .filter((item) => item.id !== 'all')
      .map((item) => ({
        id: item.id,
        label: item.label === 'Tool' ? 'Thinking devices' : item.label === 'Output' ? 'Artifacts' : item.label,
        count: taxonomyTypeFilterCount(stats, item.id),
      })),
    ...stats.types.filter((item) => item.repairState),
  ];
}

function taxonomyDomainItems(stats: CapsuleTaxonomyStats, includeRepairStates: boolean) {
  const items = stats.domains
    .filter((item) => includeRepairStates || !item.repairState)
    .slice(0, 8);
  return items.length ? items : capsuleDomainFilters
    .filter((item) => item.id !== 'all')
    .slice(0, 6)
    .map((item) => ({ id: item.id, label: item.label, count: taxonomyDomainFilterCount(stats, item.id) }));
}

function taxonomyPolicyTeamItems(stats: CapsuleTaxonomyStats, includeRepairStates: boolean) {
  const items = stats.policyTeams
    .filter((item) => includeRepairStates || !item.repairState)
    .slice(0, 8);
  return items.length ? items : POLICY_TEAM_CATEGORIES.slice(0, 6).map((team) => ({
    id: team.id,
    label: team.shortLabel,
    count: taxonomyDomainFilterCount(stats, team.id),
  }));
}

function taxonomyTypeFilterCount(stats: CapsuleTaxonomyStats, typeFilter: string): number {
  if (typeFilter === 'all') return stats.visibleCapsules;
  if (typeFilter === 'archived') return stats.archivedCapsules;
  return stats.types.find((item) => item.id === typeFilter)?.count ?? 0;
}

function taxonomyDomainFilterCount(stats: CapsuleTaxonomyStats, domainFilter: string): number {
  if (domainFilter === 'all') return stats.visibleCapsules;
  const policyTeam = getPolicyTeamCategory(domainFilter);
  if (policyTeam) return stats.policyTeams.find((item) => item.id === policyTeam.id)?.count ?? 0;
  if (domainFilter === 'other') {
    const knownCount = capsuleDomainFilters
      .filter((filter) => filter.id !== 'all' && filter.id !== 'other')
      .reduce((sum, filter) => sum + taxonomyDomainFilterCount(stats, filter.id), 0);
    return Math.max(0, stats.visibleCapsules - knownCount);
  }
  return (stats.domains.find((item) => item.id === domainFilter)?.count ?? 0) +
    (stats.policyTeams.find((item) => item.id === domainFilter)?.count ?? 0);
}

function publicCategoryForTemplate(templateId: string): PolicyTeamCategory | null {
  return POLICY_TEAM_CATEGORIES.find((category) => category.templateIds.some((id) => id === templateId)) ?? null;
}

function filterPublicCapsules(query: string, typeFilter: string, domainFilter: string, policyTeamFilter: string) {
  const clean = query.trim().toLowerCase();
  return COCKPIT_CAPSULE_LIBRARY.filter((capsule) => {
    if (!publicCapsuleMatchesType(capsule, typeFilter)) return false;
    if (!publicCapsuleMatchesDomain(capsule, domainFilter)) return false;
    if (!publicCapsuleMatchesPolicyTeam(capsule, policyTeamFilter)) return false;
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

function filterUserCapsules(capsules: PraxisCapsuleSummary[], query: string, typeFilter: string, domainFilter: string, policyTeamFilter: string): PraxisCapsuleSummary[] {
  const clean = query.trim().toLowerCase();
  return capsules
    .filter((capsule) => {
      const tags = capsule.community?.tags ?? [];
      const isArchived = Boolean(capsule.archivedAt);
      if (typeFilter === 'archived') {
        if (!isArchived) return false;
      } else if (isArchived || !strictCapsuleTypeFilter(capsule, typeFilter)) {
        return false;
      }
      if (!capsuleMatchesDomain(capsule, domainFilter)) return false;
      if (!capsuleMatchesPolicyTeam(capsule, policyTeamFilter)) return false;
      if (!clean) return true;
      const taxonomy = resolveCapsuleTaxonomy(capsule);
      return [
        capsule.capsuleId,
        capsule.label,
        capsule.scope,
        capsuleCategoryMeta(capsule).summary,
        capsuleCategoryMeta(capsule).detail,
        ...tags,
        ...taxonomy.types.map((facet) => facet.id),
        ...taxonomy.types.map((facet) => facet.label),
        ...taxonomy.domains.map((facet) => facet.id),
        ...taxonomy.domains.map((facet) => facet.label),
        ...taxonomy.policyTeams.map((facet) => facet.id),
        ...taxonomy.policyTeams.map((facet) => facet.label),
        ...(capsule.coreRefs.sourceCoreIds ?? []),
        ...(capsule.coreRefs.documentCoreIds ?? []),
        ...(capsule.coreRefs.toolCoreIds ?? []),
        ...(capsule.coreRefs.outputCoreIds ?? []),
        ...(capsule.coreRefs.productCoreIds ?? []),
      ].join(' ').toLowerCase().includes(clean);
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function filterStarterCapsules(query: string, typeFilter: string, domainFilter: string, policyTeamFilter: string): PraxisCapsuleSummary[] {
  return filterUserCapsules(starterCapsuleSummaries, query, typeFilter, domainFilter, policyTeamFilter);
}

function buildVisibleCapsuleCards({
  isAuthenticated,
  filteredUserCapsules,
  filteredStarterCapsules,
  selectedCapsuleTypeFilter,
}: {
  isAuthenticated: boolean;
  filteredUserCapsules: PraxisCapsuleSummary[];
  filteredStarterCapsules: PraxisCapsuleSummary[];
  selectedCapsuleTypeFilter: string;
}) {
  void selectedCapsuleTypeFilter;
  const showingStarterFallback = isAuthenticated && !filteredUserCapsules.length;
  return {
    showingStarterFallback,
    visibleCapsuleCards: isAuthenticated && !showingStarterFallback ? filteredUserCapsules : filteredStarterCapsules,
  };
}

function capsuleMatchesType(capsule: PraxisCapsuleSummary, typeFilter: string): boolean {
  if (typeFilter === 'all') return true;
  const taxonomy = resolveCapsuleTaxonomy(capsule);
  return taxonomy.types.some((type) => type.id === typeFilter);
}

function strictCapsuleTypeFilter(capsule: PraxisCapsuleSummary, typeFilter: string): boolean {
  if (typeFilter === 'all') return true;
  if (typeFilter === 'archived') return Boolean(capsule.archivedAt);
  if (typeFilter === 'situation') return capsuleCategory(capsule) === 'situation';
  if (typeFilter === 'tool') return capsuleCategory(capsule) === 'tool';
  if (typeFilter === 'output') return capsuleCategory(capsule) === 'output';
  if (typeFilter === 'user') return capsuleCategory(capsule) === 'user';
  return capsuleMatchesType(capsule, typeFilter);
}

function publicCapsuleMatchesType(capsule: (typeof COCKPIT_CAPSULE_LIBRARY)[number], typeFilter: string): boolean {
  if (typeFilter === 'all') return true;
  if (typeFilter === 'archived') return false;
  if (typeFilter === 'tool') return capsule.contextCores.includes('tool');
  if (typeFilter === 'output') return capsule.contextCores.includes('output') || capsule.contextCores.includes('product');
  if (typeFilter === 'user') return capsule.contextCores.includes('user');
  if (typeFilter === 'situation') return capsule.contextCores.includes('situation') || capsule.contextCores.includes('path');
  return true;
}

function capsuleMatchesDomain(capsule: PraxisCapsuleSummary, domainFilter: string): boolean {
  if (domainFilter === 'all') return true;
  const taxonomy = resolveCapsuleTaxonomy(capsule);
  if (domainFilter === 'other') {
    return !capsuleDomainFilters
      .filter((filter) => filter.id !== 'all' && filter.id !== 'other')
      .some((filter) => capsuleMatchesDomain(capsule, filter.id));
  }
  return taxonomy.domains.some((domain) => domain.id === domainFilter);
}

function capsuleMatchesPolicyTeam(capsule: PraxisCapsuleSummary, policyTeamFilter: string): boolean {
  if (policyTeamFilter === 'all') return true;
  const taxonomy = resolveCapsuleTaxonomy(capsule);
  return taxonomy.policyTeams.some((team) => team.id === policyTeamFilter);
}

function publicCapsuleMatchesDomain(capsule: (typeof COCKPIT_CAPSULE_LIBRARY)[number], domainFilter: string): boolean {
  if (domainFilter === 'all') return true;
  const team = getPolicyTeamCategory(domainFilter);
  if (team) return team.templateIds.some((id) => id === capsule.id);
  const haystack = [
    capsule.id,
    capsule.label,
    capsule.prompt,
    capsule.audience,
    capsule.output,
    publicCategoryForTemplate(capsule.id)?.label ?? '',
    publicCategoryForTemplate(capsule.id)?.id ?? '',
  ].join(' ').toLowerCase();
  if (domainFilter === 'other') {
    return !capsuleDomainFilters
      .filter((filter) => filter.id !== 'all' && filter.id !== 'other')
      .some((filter) => publicCapsuleMatchesDomain(capsule, filter.id));
  }
  return haystack.includes(domainFilter);
}

function publicCapsuleMatchesPolicyTeam(capsule: (typeof COCKPIT_CAPSULE_LIBRARY)[number], policyTeamFilter: string): boolean {
  if (policyTeamFilter === 'all') return true;
  const team = getPolicyTeamCategory(policyTeamFilter);
  if (!team) return false;
  return team.templateIds.some((id) => id === capsule.id);
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
    <section className="od-praxis-panel cartographic-grid mt-6 w-full max-w-5xl rounded-2xl p-4" data-testid="capsule-map">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[color:var(--color-archive-paper-strong)]">
            <div className="absolute inset-2 rounded-full border border-[color:var(--color-clay)]/25" />
            <div className="absolute inset-5 rounded-full border border-sage/30" />
            <span className="praxis-thinking-glyph od-praxis-status-dot flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">◳</span>
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
              className="od-praxis-card group rounded-lg p-3 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--color-clay)]/40"
              data-testid={`capsule-map-${segment.id}`}
            >
              <span className="flex items-center justify-between gap-2">
                <segment.icon className="h-4 w-4 text-slate-400 group-hover:text-[color:var(--color-oxide)]" />
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">{segment.value}</span>
              </span>
              <span className="mt-4 block text-xs font-semibold text-slate-800">{segment.label}</span>
              <span className="mt-1 block h-1 rounded-full bg-slate-100">
                <span className="block h-1 rounded-full bg-[color:var(--color-clay)]" style={{ width: `${Math.min(100, Math.max(12, segment.value * 24))}%` }} />
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

function CapsuleTaxonomyFilterBar({
  stats,
  query,
  onQuery,
  typeId,
  domainId,
  policyTeamId,
  onType,
  onDomain,
  onPolicyTeam,
  showRepairStates,
  onClear,
}: {
  stats: CapsuleTaxonomyStats;
  query?: string;
  onQuery?: (query: string) => void;
  typeId: string;
  domainId: string;
  policyTeamId: string;
  onType: (id: string) => void;
  onDomain: (id: string) => void;
  onPolicyTeam: (id: string) => void;
  showRepairStates: boolean;
  onClear?: () => void;
}) {
  return (
    <div className="mt-4 grid gap-3" data-testid="capsule-taxonomy-filter-bar">
      {onQuery ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query ?? ''}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search capsule titles"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
          {onClear ? (
            <button type="button" onClick={onClear} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3" data-testid="capsule-taxonomy-surface">
        <CategoryAxisPanel
          label="Types"
          items={taxonomyTypeItems(stats)}
          selectedId={typeId}
          onSelect={onType}
          showRepairStates={showRepairStates}
        />
        <CategoryAxisPanel
          label="Domains"
          items={taxonomyDomainItems(stats, showRepairStates)}
          selectedId={domainId}
          onSelect={onDomain}
          showRepairStates={showRepairStates}
        />
        <CategoryAxisPanel
          label="Policy Teams"
          items={taxonomyPolicyTeamItems(stats, showRepairStates)}
          selectedId={policyTeamId}
          onSelect={onPolicyTeam}
          showRepairStates={showRepairStates}
        />
      </div>
    </div>
  );
}

function CategoryAxisPanel({
  label,
  items,
  selectedId,
  onSelect,
  showRepairStates,
}: {
  label: string;
  items: Array<{ id: string; label: string; count: number; repairState?: 'custom' | 'unknown' }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  showRepairStates: boolean;
}) {
  const visibleItems = showRepairStates ? items : items.filter((item) => !item.repairState);
  return (
    <section className="rounded-lg border border-slate-200 bg-white/80 p-3" aria-label={`${label} category map`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-900">{label}</p>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{visibleItems.reduce((sum, item) => sum + item.count, 0)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visibleItems.map((item) => (
          <button
            key={`${item.id}:${item.repairState ?? 'ok'}`}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold',
              selectedId === item.id ? 'bg-slate-950 text-white' : item.repairState ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {item.label}
            <span className={cn('font-mono text-[10px]', selectedId === item.id ? 'text-white/70' : 'text-slate-400')}>{item.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CapsuleFactoryCommandBand({
  capsule,
  visibleCount,
  userCapsuleCount,
  archivedCount,
  reviewDiffCount,
  onCreate,
  onInspect,
  onRunFactory,
}: {
  capsule: PraxisCapsuleSummary | null;
  visibleCount: number;
  userCapsuleCount: number;
  archivedCount: number;
  reviewDiffCount: number;
  onCreate: () => void;
  onInspect: () => void;
  onRunFactory: () => void;
}) {
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  return (
    <section
      className="mt-4 overflow-hidden rounded-xl border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper)] shadow-sm shadow-[rgba(164,73,46,0.10)]"
      data-testid="capsule-factory-command-band"
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Capsules</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Manage the capsules your policy work depends on.
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Open a capsule, add sources, improve it with PRAXIS, make it private or public, and download a portable .praxis file when it is ready to reuse.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" />
              Create capsule
            </button>
            <button type="button" onClick={onInspect} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <BookOpen className="h-4 w-4" />
              Inspect capsule
            </button>
            <button type="button" onClick={onRunFactory} className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-clay)]/30 bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-oxide)] hover:bg-[color:var(--color-mineral-soft)]">
              <Sparkles className="h-4 w-4" />
              Improve with PRAXIS
            </button>
          </div>
        </div>
        <div className="grid min-w-[260px] grid-cols-2 gap-2 text-center">
          <Metric label="Available" value={visibleCount} />
          <Metric label="Workspace" value={userCapsuleCount} />
          <Metric label="Review diffs" value={reviewDiffCount} />
          <Metric label="Archived" value={archivedCount} />
        </div>
      </div>
      <div className="grid border-t border-[color:var(--color-clay)]/15 bg-white/65 text-[11px] font-semibold text-slate-600 sm:grid-cols-4">
        <FactoryCommandCell label="Evidence" value={`${counts.sources + counts.documents} source refs`} />
        <FactoryCommandCell label="Graph" value={capsule?.coreRefs.graphCoreId ?? 'proposal gated'} />
        <FactoryCommandCell label="Download" value=".praxis bundle" />
        <FactoryCommandCell label="Privacy" value={capsule?.access?.visibility ?? 'private by default'} />
      </div>
    </section>
  );
}

function FactoryCommandCell({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0 border-t border-[color:var(--color-clay)]/10 px-3 py-2 sm:border-l sm:border-t-0 first:sm:border-l-0">
      <span className="block text-slate-400">{label}</span>
      <span className="mt-1 block truncate text-slate-700">{value}</span>
    </p>
  );
}

function CapsuleFactorySidebar({
  activeLane,
  onSelect,
}: {
  activeLane: CapsuleFactoryLaneId;
  onSelect: (item: (typeof factorySidebarItems)[number]) => void;
}) {
  return (
    <aside className="dossier-spine rounded-lg border p-2 shadow-sm shadow-slate-950/[0.03]" data-testid="capsule-factory-sidebar">
      <p className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Capsules</p>
      <nav aria-label="Capsule management views" className="space-y-1">
        {factorySidebarItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold',
              activeLane === item.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
            )}
          >
            <item.icon className={cn('h-4 w-4 shrink-0', activeLane === item.id ? 'text-white/80' : 'text-slate-400')} />
            <span className="min-w-0 truncate">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function CapsuleFactoryLanePanel({
  activeLane,
  capsule,
  agentRunCount,
  reviewDiffs,
  runtimeProof,
  repositoryDocuments,
  repositoryLoading,
  onReview,
  onApply,
  onReject,
}: {
  activeLane: CapsuleFactoryLaneId;
  capsule: PraxisCapsuleSummary | null;
  agentRunCount: number;
  reviewDiffs: CapsuleFactoryReviewDiff[];
  runtimeProof: RuntimeProof;
  repositoryDocuments: RepositoryDocument[];
  repositoryLoading: boolean;
  onReview: (lane: (typeof factoryBuilderLanes)[number]) => void;
  onApply: (diff: CapsuleFactoryReviewDiff) => void;
  onReject: (diff: CapsuleFactoryReviewDiff) => void;
}) {
  const laneLabel = factorySidebarItems.find((item) => item.id === activeLane)?.label ?? 'Catalog';
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  const openDiffs = reviewDiffs.filter((diff) => diff.reviewState !== 'rejected').slice(0, 3);
  return (
    <section className="specimen-card rounded-lg p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="capsule-factory-workshop">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">{laneLabel}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{capsule?.label ?? 'Select or create a ContextCapsule'}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            PRAXIS creates reviewable capsule improvements. Inspect each draft change before applying it.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <Metric label="Sources" value={counts.sources} />
          <Metric label="Docs" value={counts.documents} />
          <Metric label="Outputs" value={counts.outputs} />
          <Metric label="Runs" value={agentRunCount} />
        </div>
      </div>
      <RuntimeProofStrip proof={runtimeProof} />
      {activeLane === 'repository' ? (
        <CapsuleFactoryRepositoryLane
          capsule={capsule}
          documents={repositoryDocuments}
          loading={repositoryLoading}
          proof={runtimeProof}
        />
      ) : activeLane === 'graph' ? (
        <CapsulePlusGraphLane
          capsule={capsule}
          counts={counts}
          proof={runtimeProof}
        />
      ) : activeLane === 'agents' ? (
        <div className="mt-4 grid gap-3" data-testid="capsule-agent-management-lane">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-900">AI work on this capsule</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Ask PRAXIS to improve the selected capsule, then review the proposed changes before they become capsule state.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <FactoryCommandCell label="Active runs" value={`${agentRunCount} recent`} />
            <FactoryCommandCell label="Review queue" value={`${openDiffs.length} pending`} />
            <FactoryCommandCell label="Apply posture" value="human approved" />
          </div>
        </div>
      ) : (
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {factoryBuilderLanes.map((lane) => (
          <article key={lane.id} className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-900">{lane.title}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">{lane.subtitle}</p>
            <p className="mt-2 min-h-10 text-[11px] leading-5 text-slate-500">{lane.body}</p>
            <button
              type="button"
              onClick={() => onReview(lane)}
              className="mt-3 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Review draft
            </button>
          </article>
        ))}
      </div>
      )}
      {openDiffs.length ? (
        <div className="mt-4 grid gap-2" data-testid="capsule-factory-review-diffs">
          {openDiffs.map((diff) => (
            <article key={diff.diffId} className="rounded-lg border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900">{diff.laneTitle}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">{diff.proposedCapsule.summary}</p>
                </div>
                <span className={cn('rounded-md px-2 py-1 text-[11px] font-semibold', factoryReviewStateClass(diff.reviewState))}>{diff.reviewState}</span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <FactoryDiffBucket label="Capsule changes" values={diff.proposedCores.filter((core) => core.kind === 'situation' || core.kind === 'tool').map((core) => core.label)} />
                <FactoryDiffBucket label="Sources" values={[...diff.proposedCores.filter((core) => core.kind === 'source').map((core) => core.label), ...diff.sourceGaps]} />
                <FactoryDiffBucket label="Output" values={diff.proposedCores.filter((core) => core.kind === 'output').map((core) => core.label)} />
                <FactoryDiffBucket label="Review gate" values={diff.applyActions.map((action) => action.label)} />
                <FactoryDiffBucket label="Receipts" values={diff.provenanceIds} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={diff.reviewState === 'applied'} onClick={() => onApply(diff)} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-default disabled:bg-slate-300">
                  Apply reviewed diff
                </button>
                <button type="button" disabled={diff.reviewState === 'applied'} onClick={() => onReject(diff)} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-default disabled:text-slate-300">
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CapsulePlusGraphLane({
  capsule,
  counts,
  proof,
}: {
  capsule: PraxisCapsuleSummary | null;
  counts: { sources: number; documents: number; tools: number; outputs: number };
  proof: RuntimeProof;
}) {
  const graphVersion = capsule?.coreRefs.graphCoreId ? capsule.version : 0;
  const nodeCount = capsule?.coreRefs.graphCoreId ? 8 : 0;
  const edgeCount = capsule?.coreRefs.graphCoreId ? 6 : 0;
  return (
    <div className="mt-4 grid gap-3" data-testid="capsule-plus-graph-lane">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">Capsule+ Graph</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Review-gated Postgres embedded graph for actors, claims, events, commitments, rules, sources, and outputs. Proposed graph facts stay visually distinct from approved graph facts.
            </p>
          </div>
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">proposed until approved</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <Metric label="Nodes" value={nodeCount} />
          <Metric label="Edges" value={edgeCount} />
          <Metric label="Sources" value={counts.sources + counts.documents} />
          <Metric label="Graph v" value={graphVersion} />
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <FactoryCommandCell label="Runtime label" value="Postgres embedded graph" />
        <FactoryCommandCell label="Export bundle" value=".praxis" />
        <FactoryCommandCell label="Review state" value={capsule?.coreRefs.graphCoreId ? 'approved graph facts readable' : 'draft graph proposals only'} />
      </div>
      <div className="rounded-lg border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper)] p-3 text-[11px] leading-5 text-slate-600">
        Decision Clock Capsule+ seeds Decision, Deadline, Actor, Claim, Source, Commitment, Risk, and OpenQuestion nodes with PRECEDES, DEPENDS_ON, SUPPORTED_BY, OWNED_BY, CONSTRAINS, and TRIGGERS_REVIEW edges. Ask PRAXIS may read approved graph facts as context; proposed graph facts must remain labeled until review.
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-[11px] text-slate-600">
        <p><span className="font-semibold text-slate-900">Source coverage:</span> {counts.sources + counts.documents} receipt slots available.</p>
        <p><span className="font-semibold text-slate-900">Unsupported claims:</span> review in the capsule change queue before applying.</p>
        <p><span className="font-semibold text-slate-900">Current graph mode:</span> {proof.graphMode}.</p>
      </div>
    </div>
  );
}

function RuntimeProofStrip({ proof }: { proof: RuntimeProof }) {
  return (
    <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px]" data-testid="runtime-proof-strip">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold uppercase tracking-[0.16em] text-slate-400">Runtime proof</p>
        {proof.memoOutputHref ? <Link href={proof.memoOutputHref} className="font-semibold text-[color:var(--color-oxide)] hover:underline">memo/output link</Link> : <span className="font-semibold text-slate-400">memo/output link pending</span>}
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <ProofCell label="active capsule" value={proof.activeCapsule} />
        <ProofCell label="source count" value={String(proof.sourceCount)} />
        <ProofCell label="graph mode" value={proof.graphMode} />
        <ProofCell label="Cognee mode" value={proof.cogneeMode} />
        <ProofCell label="last Ask receipt" value={proof.lastAskReceipt} />
        <ProofCell label="queued agent run id" value={proof.queuedRunId?.slice(0, 12) ?? 'not queued'} />
        <ProofCell label="worker/run status" value={proof.workerStatus.replaceAll('_', ' ')} />
        <ProofCell label="latest mirrored event" value={proof.latestMirroredEvent} />
      </div>
    </div>
  );
}

function CapsuleFactoryRepositoryLane({
  capsule,
  documents,
  loading,
  proof,
}: {
  capsule: PraxisCapsuleSummary | null;
  documents: RepositoryDocument[];
  loading: boolean;
  proof: RuntimeProof;
}) {
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  return (
    <div className="mt-4 grid gap-3" data-testid="capsule-factory-repository-lane">
      <div className="grid gap-2 md:grid-cols-4">
        <Metric label="Attached docs" value={counts.documents} />
        <Metric label="Source receipts" value={counts.sources} />
        <Metric label="Graph candidates" value={capsule?.coreRefs.graphCoreId ? 1 : 0} />
        <Metric label="Memory" value={proof.cogneeMode} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-900">Repository posture</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          Firestore capsule state and the AgentRun ledger are canonical. Graph changes remain embedded proposals until reviewed and applied; {proof.cogneeMode}.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <FactoryCommandCell label="Source-to-claim map" value={`${proof.sourceCount} source or document refs`} />
          <FactoryCommandCell label="Graph/source posture" value={proof.graphMode} />
          <FactoryCommandCell label="Ingestion state" value={loading ? 'loading repository' : `${documents.length} document receipts visible`} />
        </div>
      </div>
    </div>
  );
}

function ProofCell({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0 rounded-md bg-white px-2 py-1.5">
      <span className="block font-semibold text-slate-400">{label}</span>
      <span className="block truncate font-semibold text-slate-700">{value}</span>
    </p>
  );
}

function FactoryDiffBucket({ label, values }: { label: string; values: string[] }) {
  return (
    <p className="min-w-0 rounded-md bg-white px-2 py-1.5 text-[11px]">
      <span className="block font-semibold text-slate-500">{label}</span>
      <span className="mt-1 block truncate text-slate-700">{values.filter(Boolean).slice(0, 3).join(', ') || 'no proposed change'}</span>
    </p>
  );
}

function FeaturedExpertPicksShelf({
  capsules,
  title = 'Featured Expert Picks',
  subtitle = 'Handpicked knowledge capsules for serious policy work.',
  isAuthenticated,
  onBuildOwn,
  onSelect,
  onAdd,
  onInspect,
  onImprove,
  onDownload,
  onMakePrivate,
  onMakePublic,
  onDelete,
  onArchive,
}: {
  capsules: PraxisCapsuleSummary[];
  title?: string;
  subtitle?: string;
  isAuthenticated: boolean;
  onBuildOwn: () => void;
  onSelect: (capsule: PraxisCapsuleSummary) => void;
  onAdd: (capsule: PraxisCapsuleSummary) => void;
  onInspect: (capsule: PraxisCapsuleSummary) => void;
  onImprove: (capsule: PraxisCapsuleSummary) => void;
  onDownload: (capsule: PraxisCapsuleSummary) => void;
  onMakePrivate?: (capsule: PraxisCapsuleSummary) => void;
  onMakePublic?: (capsule: PraxisCapsuleSummary) => void;
  onDelete?: (capsule: PraxisCapsuleSummary) => void;
  onArchive: (capsule: PraxisCapsuleSummary) => void;
}) {
  return (
    <section className="cartographic-grid mt-6 rounded-xl border border-[color:color-mix(in_srgb,var(--color-mineral)_22%,transparent)] bg-[color:var(--color-archive-paper-strong)]/80 p-3 shadow-sm shadow-slate-950/[0.03]" data-testid={title === 'Intellectual Devices' ? 'intellectual-devices-shelf' : 'featured-expert-picks-shelf'}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">{title}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{subtitle}</h3>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
          {capsules.length} visible under current filter
        </span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {capsules.map((capsule) => (
          <div key={capsule.capsuleId} data-testid={`featured-expert-pick-${capsule.capsuleId}`}>
            <CapsuleCard
              capsule={capsule}
              active={false}
              mutable={false}
              compact
              expertPick
              onSelect={() => onSelect(capsule)}
              onAdd={() => onAdd(capsule)}
              onInspect={() => onInspect(capsule)}
              onImprove={() => onImprove(capsule)}
              onDownload={() => onDownload(capsule)}
              onMakePrivate={onMakePrivate ? () => onMakePrivate(capsule) : undefined}
              onMakePublic={onMakePublic ? () => onMakePublic(capsule) : undefined}
              onDelete={onDelete ? () => onDelete(capsule) : undefined}
              onArchive={() => onArchive(capsule)}
            />
          </div>
        ))}
        <BuildYourOwnKnowledgeCta isAuthenticated={isAuthenticated} onBuildOwn={onBuildOwn} />
      </div>
    </section>
  );
}

function BuildYourOwnKnowledgeCta({ isAuthenticated, onBuildOwn }: { isAuthenticated: boolean; onBuildOwn: () => void }) {
  return (
    <article
      className="specimen-card flex min-h-[15rem] flex-col justify-between rounded-lg border-dashed p-4"
      data-testid="build-your-own-knowledge-cta"
    >
      <div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[color:var(--color-oxide)] shadow-sm">
          <Plus className="h-4 w-4" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-950">Build your own inheritable knowledge for your team or agents</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          Start a private ContextCapsule with your source posture, decision frame, reasoning tools, and output expectations. Nothing is created until you submit the builder.
        </p>
      </div>
      <button type="button" onClick={onBuildOwn} className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
        <WandSparkles className="h-3.5 w-3.5" />
        {isAuthenticated ? 'Open Capsule Builder' : 'Sign in to build'}
      </button>
    </article>
  );
}

function CapsuleCard({
  capsule,
  active,
  mutable = true,
  compact = false,
  expertPick = false,
  onSelect,
  onAdd,
  onInspect,
  onImprove,
  onDownload,
  onMakePrivate,
  onMakePublic,
  onDelete,
  onArchive,
}: {
  capsule: PraxisCapsuleSummary;
  active: boolean;
  mutable?: boolean;
  compact?: boolean;
  expertPick?: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onInspect: () => void;
  onImprove: () => void;
  onDownload: () => void;
  onMakePrivate?: () => void;
  onMakePublic?: () => void;
  onDelete?: () => void;
  onArchive: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `capsule-card:${capsule.capsuleId}` });
  const counts = capsuleCounts(capsule);
  const state = capsuleState(capsule);
  const meta = capsuleCategoryMeta(capsule);
  const defaultRole = capsuleDefaultRole(capsule);
  const score = capsule.trust?.score ?? capsule.health?.score ?? 0;
  const typeChip = meta.taxonomy.types[0]?.label ?? capsuleRoleLabel(defaultRole);
  const domainChip = meta.taxonomy.domains[0]?.label ?? capsule.scope;
  const domainAccent = capsuleDomainAccent(meta.starterDefinition?.domain ?? meta.taxonomy.domains[0]?.id ?? 'other');
  const policyTeamChip = meta.taxonomy.policyTeams[0]?.label ?? 'Review team';
  const richProfile = meta.starterDefinition?.richProfile;
  const deviceProfile = meta.starterDefinition?.deviceProfile;
  const purposeLine = richProfile?.purpose ?? meta.summary;
  const bestNextAction = richProfile?.nextIdeas[0] ?? capsule.health?.warnings?.[0] ?? 'Inspect source gaps before relying on this capsule.';
  const CategoryIcon = capsuleCategoryIcon(meta.category);
  const sourcePosture = capsuleSourcePosture(capsule);
  const reasoningStyle = capsuleReasoningStyle(capsule);
  return (
    <article
      ref={setNodeRef}
      data-testid={`capsule-card-${capsule.capsuleId}`}
      data-capsule-type={meta.category}
      className={cn(
        'specimen-card od-praxis-card overflow-hidden rounded-lg p-0 transition hover:-translate-y-0.5',
        compact ? 'min-h-[9.5rem]' : 'min-h-[11rem]',
        active ? 'border-sky-300' : 'border-black/10',
        isDragging && 'opacity-70',
      )}
      style={{
        borderTopColor: meta.color,
        borderTopWidth: 4,
        boxShadow: active ? `0 16px 34px ${softColor(meta.color, 0.22)}` : undefined,
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full p-3 text-left"
        style={{ background: `linear-gradient(180deg, ${softColor(meta.color, 0.12)}, rgba(255,255,255,0) 46%)` }}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-start gap-2">
            <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border', domainAccent.soft)}>
              <CategoryIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">{capsule.label}</span>
              <span className="mt-1 block truncate text-[11px] font-semibold text-slate-500">{typeChip}</span>
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {expertPick ? <span className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white">Expert pick</span> : null}
            <span className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', meta.soft)}>{capsuleRoleLabel(defaultRole)}</span>
          </span>
        </span>
        <span className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', meta.soft)}>{domainChip}</span>
          <span className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', domainAccent.soft)}>{domainAccent.label}</span>
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">{policyTeamChip}</span>
          {deviceProfile ? <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">Thinking device</span> : null}
          <CapsuleStateBadge state={state} />
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span>health {score}/100</span>
          <span>{counts.documents} docs</span>
          <span>{counts.sources} sources</span>
        </span>
        <span className="mt-3 block line-clamp-2 text-xs leading-5 text-slate-600">{purposeLine}</span>
        <span className="mt-3 grid gap-1.5 text-[11px] leading-5 text-slate-600">
          <span className="rounded-md bg-white/80 px-2 py-1"><strong className="text-slate-700">Source posture:</strong> {sourcePosture}</span>
          <span className="rounded-md bg-white/80 px-2 py-1"><strong className="text-slate-700">Reasoning style:</strong> {reasoningStyle}</span>
          {deviceProfile ? <span className="rounded-md bg-white/80 px-2 py-1"><strong className="text-slate-700">Human review gate:</strong> {deviceProfile.humanReviewGate}</span> : null}
        </span>
        <span className="mt-2 block truncate rounded-md bg-white/80 px-2 py-1.5 text-[11px] font-semibold text-slate-700">
          Best next action: {bestNextAction}
          <span className="sr-only">Next: {bestNextAction}</span>
        </span>
      </button>
      <div className="px-3 pb-3">
      <div className="grid grid-cols-4 gap-1.5" aria-label={`${capsule.label} readiness signals`}>
        {[
          { label: 'Docs', active: counts.documents > 0 },
          { label: 'Sources', active: counts.sources > 0 },
          { label: 'Tools', active: counts.tools > 0 },
          { label: 'Outputs', active: counts.outputs > 0 },
        ].map((item) => (
          <span key={item.label} title={item.label} className="h-1.5 rounded-full bg-slate-100">
            <span className="block h-1.5 rounded-full" style={{ backgroundColor: item.active ? meta.color : '#e2e8f0' }} />
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAdd} className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">Add</button>
        <button
          type="button"
          title={`Drag ${capsule.label} into context chain`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
          aria-label={`Drag ${capsule.label} into context chain`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onInspect} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Chat</button>
        <button type="button" onClick={onImprove} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Improve</button>
        <button type="button" onClick={onDownload} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Download className="h-3.5 w-3.5" />
          .praxis
        </button>
        {mutable ? (
          <>
            <button
              type="button"
              onClick={capsule.access?.visibility === 'public' ? onMakePrivate : onMakePublic}
              disabled={capsule.access?.visibility === 'public' ? !onMakePrivate : !onMakePublic}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {capsule.access?.visibility === 'public' ? 'Private' : 'Public'}
            </button>
            <button type="button" onClick={onArchive} className="ml-auto rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700">Archive</button>
            {onDelete ? (
              <button type="button" onClick={onDelete} title={`Delete ${capsule.label}`} aria-label={`Delete ${capsule.label}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      </div>
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
  focusedRunStream,
  focusedRunLoading,
  focusedRunAction,
  runtimeProof,
  onUpload,
  onDetailTab,
  onOpenRepository,
  onImprove,
  onDownload,
  onMakePrivate,
  onMakePublic,
  onDelete,
  onRefresh,
  onRetryFocusedRun,
  onCancelFocusedRun,
  onDecideApproval,
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
  focusedRunStream: OrchestratorEventState;
  focusedRunLoading: boolean;
  focusedRunAction: string | null;
  runtimeProof: RuntimeProof;
  onUpload: () => void;
  onDetailTab: (tab: CapsuleDetailTab) => void;
  onOpenRepository: () => void;
  onImprove: () => void;
  onDownload: () => void;
  onMakePrivate: () => void;
  onMakePublic: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onRetryFocusedRun: () => void;
  onCancelFocusedRun: () => void;
  onDecideApproval: (approvalId: string, decision: 'approved' | 'rejected') => void;
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
    <aside className="specimen-card rounded-lg p-4 shadow-sm shadow-black/5" data-testid="capsule-detail-panel">
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
      <RuntimeProofStrip proof={runtimeProof} />
      <div className="mt-4 grid grid-cols-4 gap-1 rounded-md bg-slate-100 p-1" data-testid="capsule-detail-tabs">
        {(['overview', 'sources', 'ai', 'settings'] as const).map((tab) => (
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
      {detailTab === 'overview' ? <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Policy team</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {POLICY_TEAM_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onAssignPolicyTeam(category)}
              className={cn(
                'rounded-md border px-2 py-1.5 text-left text-[11px] font-semibold',
                policyTeam?.id === category.id ? 'border-[color:var(--color-clay)] bg-[color:var(--color-mineral-soft)] text-[color:var(--color-oxide)]' : 'border-slate-200 text-slate-500 hover:bg-slate-50',
              )}
            >
              {category.shortLabel}
            </button>
          ))}
        </div>
      </div> : null}
      {detailTab === 'overview' ? <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Missing questions</p>
        <div className="mt-2 space-y-1.5">
          {(policyTeam?.missingInfoPrompts ?? ['What decision is this serving?', 'Which sources should travel with the answer?', 'What output should PRAXIS prepare?']).slice(0, 3).map((question) => (
            <p key={question} className="rounded-md border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-600">{question}</p>
          ))}
        </div>
      </div> : null}
      {detailTab === 'overview' ? <div className="mt-4">
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
      {detailTab === 'sources' ? (
        <div className="mt-4 space-y-2" data-testid="capsule-connector-cards">
          {CAPSULE_CONNECTOR_REGISTRY.map((connector) => (
            <ConnectorCard key={connector.id} connector={connector} onUpload={connector.id === 'upload' ? onUpload : undefined} />
          ))}
        </div>
      ) : null}
      {detailTab === 'sources' ? (
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
      {detailTab === 'ai' ? (
        <div className="mt-4 space-y-3" data-testid="capsule-agent-lane">
          {focusedRunLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-500">
              Opening selected agent run...
            </div>
          ) : null}
          {focusedRun ? (
            <FocusedAgentRunPanel
              detail={focusedRun}
              events={focusedRunEvents}
              stream={focusedRunStream}
              action={focusedRunAction}
              onRetry={onRetryFocusedRun}
              onCancel={onCancelFocusedRun}
              onDecideApproval={onDecideApproval}
            />
          ) : null}
          <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm shadow-slate-950/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">Conversation process</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">PRAXIS chooses internal skills from the main bar and saves routing, tool, approval, and output receipts here.</p>
              </div>
            </div>
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
                    <Link href={`/agents/${encodeURIComponent(run.runId)}`} className="text-[11px] font-semibold text-[color:var(--color-oxide)] hover:underline">Open</Link>
                  </div>
                </article>
              ))}
              {!agentRunsLoading && agentRuns.length === 0 ? <p className="text-xs text-slate-500">No process receipts yet. Submit from the main bar to let PRAXIS route the work.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      {detailTab === 'settings' ? (
        <div className="mt-4 grid gap-2" data-testid="capsule-management-actions">
          <button type="button" onClick={onDownload} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Download .praxis
          </button>
          {capsule.access?.visibility === 'public' ? (
            <button type="button" onClick={onMakePrivate} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <LockKeyhole className="h-4 w-4" />
              Make private
            </button>
          ) : (
            <button type="button" onClick={onMakePublic} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ShieldCheck className="h-4 w-4" />
              Make public
            </button>
          )}
          <button type="button" onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={onUpload} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Upload className="h-4 w-4" />
          Add sources
        </button>
        <button type="button" onClick={onOpenRepository} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Library className="h-4 w-4" />
          Sources
        </button>
        <button type="button" onClick={onImprove} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <WandSparkles className="h-4 w-4" />
          Improve with PRAXIS
        </button>
        <button type="button" onClick={onRefresh} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">Refresh</button>
      </div>
      <p className="mt-4 text-xs text-slate-400">Updated {new Date(capsule.updatedAt).toLocaleDateString()}</p>
    </aside>
  );
}

function FocusedAgentRunPanel({
  detail,
  events,
  stream,
  action,
  onRetry,
  onCancel,
  onDecideApproval,
}: {
  detail: AgentRunDetail;
  events: AgentRunEventSummary[];
  stream: OrchestratorEventState;
  action: string | null;
  onRetry: () => void;
  onCancel: () => void;
  onDecideApproval: (approvalId: string, decision: 'approved' | 'rejected') => void;
}) {
  const { run, toolCalls = [], approvals = [] } = detail;
  const latestEvents = (events.length ? events : [{ id: 'empty', eventType: 'run.loaded', message: 'Run loaded. Waiting for worker receipts.', createdAt: run.updatedAt }]).slice(-5);
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending');
  const canRetry = run.status === 'queued' || run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired';
  const canCancel = run.status === 'queued' || run.status === 'running' || run.status === 'waiting_approval';
  const disabled = Boolean(action);
  return (
    <article className="overflow-hidden rounded-xl border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper)] shadow-sm shadow-[rgba(164,73,46,0.10)]" data-testid="focused-agent-run">
      <div className="relative border-b border-[color:var(--color-clay)]/15 bg-gradient-to-br from-[#fff7f3] via-white to-[#f8fafc] p-4">
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full border border-[color:var(--color-clay)]/20" aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-oxide)]">Agent workspace</p>
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
      {run.contextReceipt ? (
        <div className="grid gap-2 border-t border-[color:var(--color-clay)]/15 bg-white/75 p-3 text-[11px]" data-testid="agent-context-receipt">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold uppercase tracking-[0.16em] text-slate-400">Context read by agent</p>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">{run.contextReceipt.sourcePosture ?? 'Baseline'}</span>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <ProofCell label="active capsule/chain" value={run.contextReceipt.activeCapsuleOrChain ?? run.capsuleId} />
            <ProofCell label="selected tools" value={run.contextReceipt.selectedTools.length ? run.contextReceipt.selectedTools.join(', ') : 'ask-praxis'} />
            <ProofCell label="output destination" value={run.contextReceipt.outputDestination?.replaceAll('_', ' ') ?? 'not selected'} />
            <ProofCell label="source posture" value={run.contextReceipt.sourcePosture ?? 'Baseline'} />
          </div>
        </div>
      ) : null}
      <div className="border-t border-[color:var(--color-clay)]/15 bg-white/75 px-3 py-2 text-[11px] font-semibold text-slate-500" data-testid="agent-run-stream-state">
        {stream.isReconnecting ? 'Live receipts reconnecting' : stream.isConnected ? 'Live receipts connected' : 'Live receipts ready'}
        {stream.lastEventAt ? ` · last event ${formatEventTime(stream.lastEventAt)}` : ''}
        {stream.lastEventId ? ` · ${stream.lastEventId.slice(0, 12)}` : ''}
      </div>
      {run.outputHref ? (
        <div className="px-3 pb-3">
          <Link href={run.outputHref} className="inline-flex rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
            Open output
          </Link>
        </div>
      ) : null}
      {(canRetry || canCancel || pendingApprovals.length > 0) ? (
        <div className="grid gap-2 border-t border-[color:var(--color-clay)]/15 bg-white/80 p-3">
          <div className="flex flex-wrap gap-2">
            {canRetry ? (
              <button
                type="button"
                disabled={disabled}
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:text-slate-300"
              >
                {action === 'retry' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                Retry
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                disabled={disabled}
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-wait disabled:text-rose-200"
              >
                {action === 'cancel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Cancel
              </button>
            ) : null}
          </div>
          {pendingApprovals.map((approval) => (
            <div key={approval.id} className="rounded-md border border-amber-200 bg-amber-50/70 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">{approval.toolName}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">{approval.reason ?? `Risk ${approval.riskLevel} approval requested.`}</p>
                </div>
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', agentRiskClass(approval.riskLevel))}>{approval.riskLevel}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onDecideApproval(approval.id, 'approved')}
                  className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onDecideApproval(approval.id, 'rejected')}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:text-slate-300"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
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
    { label: 'Runs', active: agentRunCount > 0, tone: 'bg-[color:var(--color-clay)]' },
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
            <span className={cn('block h-1 rounded-full', active ? 'bg-[color:var(--color-clay)]' : terminalFailed && index === activeIndex ? 'bg-rose-400' : 'bg-slate-200')} />
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
    <div className="border-t border-[color:var(--color-clay)]/15 bg-white/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Run receipts</p>
      <div className="mt-3 space-y-0">
        {events.map((event, index) => (
          <div key={event.id} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2">
            <span className="flex flex-col items-center">
              <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--color-clay)]" />
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
    <article className={cn('rounded-md border p-3', selected ? 'border-[color:var(--color-clay)] bg-[color:var(--color-archive-paper-strong)]' : 'border-slate-200')}>
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

function factoryReviewStateClass(state: CapsuleFactoryReviewState): string {
  switch (state) {
    case 'draft':
      return 'bg-slate-100 text-slate-600';
    case 'reviewed':
      return 'bg-sky-100 text-sky-700';
    case 'applied':
      return 'bg-emerald-100 text-emerald-700';
    case 'rejected':
      return 'bg-rose-100 text-rose-700';
  }
}

function isTerminalAgentRunStatus(status: AgentRunSummary['status']): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'expired';
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

function orchestratorEventToSummary(event: OrchestratorEvent): AgentRunEventSummary {
  return {
    id: event.id,
    eventType: event.rawType,
    message: event.message,
    createdAt: event.createdAt,
    data: event.data,
  };
}

function mergeRunEvents(current: AgentRunEventSummary[], incoming: AgentRunEventSummary[]): AgentRunEventSummary[] {
  const byId = new Map<string, AgentRunEventSummary>();
  for (const event of [...current, ...incoming]) byId.set(event.id, event);
  return Array.from(byId.values())
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(-50);
}

function agentRunStatusFromEvent(data: Record<string, unknown>): AgentRunSummary['status'] | null {
  const status = typeof data.toStatus === 'string' ? data.toStatus : null;
  return status === 'queued' ||
    status === 'running' ||
    status === 'waiting_approval' ||
    status === 'succeeded' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'expired'
    ? status
    : null;
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-oxide)]">New ContextCapsule</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Build a capsule around the work.</h2>
          </div>
          <button type="button" aria-label="Close capsule builder" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Capsule name</span>
            <input value={label} onChange={(event) => onLabel(event.target.value)} placeholder="Director handover, Syria access brief, HR policy review..." className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-clay)]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Policy team preset</span>
            <select value={categoryId} onChange={(event) => onCategory(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-clay)]">
              {POLICY_TEAM_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">What should PRAXIS remember?</span>
            <textarea value={notes} onChange={(event) => onNotes(event.target.value)} rows={5} placeholder="Paste brief context, assumptions, stakeholders, deadlines, rules, and open questions." className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-clay)]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Source links or repositories</span>
            <textarea value={links} onChange={(event) => onLinks(event.target.value)} rows={3} placeholder="Paste URLs, Drive folders, source lists, or internal repository notes." className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-clay)]" />
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

function DocumentRepositorySection({
  capsule,
  documents,
  documentRefs,
  loading,
  onUpload,
  onRefresh,
  onAttach,
  onDetach,
  onInspect,
}: {
  capsule: PraxisCapsuleSummary | null;
  documents: RepositoryDocument[];
  documentRefs: string[];
  loading: boolean;
  onUpload: () => void;
  onRefresh: () => void;
  onAttach: (documentId: string) => void;
  onDetach: (documentId: string) => void;
  onInspect: (document: RepositoryDocument) => void;
}) {
  const attached = new Set(documentRefs);
  return (
    <section className="specimen-card rounded-lg p-4 shadow-sm shadow-black/5" data-testid="document-repository-section">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-oxide)]">Document repository</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{capsule?.label ?? 'Select a capsule'}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Inspect uploaded documents, check chunk/entity status, and attach or detach them from the selected capsule.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <IconTextButton icon={Upload} label="Upload" onClick={onUpload} />
          <IconTextButton icon={RefreshCcw} label="Refresh" onClick={onRefresh} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="Documents" value={documents.length || documentRefs.length} />
        <Metric label="Attached" value={documentRefs.length} />
        <Metric label="Chunks" value={documents.reduce((sum, document) => sum + (document.chunkCount ?? 0), 0)} />
      </div>
      <div className="mt-4 space-y-2">
        {loading ? <CapsuleEmptyState label="Loading documents..." /> : null}
        {!loading && !documents.length && !documentRefs.length ? <CapsuleEmptyState label="No capsule documents yet." /> : null}
        {documents.map((document) => {
          const isAttached = attached.has(document.id);
          return (
            <article key={document.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{document.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {document.fileType} · {document.status} · {document.chunkCount ?? 0} chunks · {document.entityCount ?? 0} entities
                  </p>
                </div>
                <span className={cn('rounded-md px-2 py-1 text-[11px] font-semibold', isAttached ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                  {isAttached ? 'attached' : 'available'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onInspect(document)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Inspect</button>
                <button type="button" disabled={!capsule || isAttached} onClick={() => onAttach(document.id)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">Attach</button>
                <button type="button" disabled={!capsule || !isAttached} onClick={() => onDetach(document.id)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">Detach</button>
              </div>
            </article>
          );
        })}
        {!loading && !documents.length ? documentRefs.map((documentId) => (
          <article key={documentId} className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
            Attached document ref: <span className="font-mono text-xs">{documentId}</span>
          </article>
        )) : null}
      </div>
    </section>
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
      <aside className="dossier-spine ml-auto flex h-full w-full max-w-xl flex-col shadow-2xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-oxide)]">Capsule repository</p>
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
            <Metric label="Document refs" value={capsule?.coreRefs.documentCoreIds?.length ?? 0} />
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
  const meta = capsule ? capsuleCategoryMeta(capsule) : null;
  const refs = capsule?.coreRefs;
  const starterSections = meta?.starterDefinition?.inspectionSections ?? [];
  const starterTools = meta?.starterDefinition?.recommendedToolIds ?? [];
  const starterOutputs = meta?.starterDefinition?.outputProductIds ?? [];
  const starterSourcePack = meta?.starterDefinition?.sourcePack ?? [];
  const starterExcerpts = meta?.starterDefinition?.excerpts ?? [];
  const starterQuestions = meta?.starterDefinition?.suggestedQuestions ?? [];
  const starterActions = meta?.starterDefinition?.suggestedNextActions ?? [];
  const starterGuidance = meta?.starterDefinition?.aiUseGuidance ?? null;
  const starterReadiness = meta?.starterDefinition?.readinessStars ?? null;
  const richProfile = meta?.starterDefinition?.richProfile ?? null;
  const deviceProfile = meta?.starterDefinition?.deviceProfile ?? null;
  const compatible = meta?.starterDefinition?.combinesWellWith
    .map((id) => CAPSULE_STARTER_DEFINITIONS.find((starter) => starter.starterId === id)?.label ?? id)
    .slice(0, 4) ?? [];
  const warnings = capsule?.health?.warnings ?? [];
  return (
    <div className="fixed inset-0 z-40 bg-black/25" data-testid="capsule-inspector-sheet">
      <aside className="dossier-spine ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-oxide)]">Capsule inspector</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-slate-950">{capsule?.label ?? 'No capsule selected'}</h2>
            {meta ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">{meta.detail}</p>
            ) : null}
          </div>
          <button type="button" aria-label="Close inspector" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {meta ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold', meta.soft)}>{meta.label}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-500">v{capsule?.version ?? 0}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500">{capsule?.trust?.label ?? 'Trust pending'}</span>
          </div>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Metric label="Documents" value={counts.documents} />
          <Metric label="Sources" value={counts.sources} />
          <Metric label="Tools" value={counts.tools} />
          <Metric label="Outputs" value={counts.outputs} />
        </div>
        {richProfile ? (
          <div className="mt-5 space-y-2" data-testid="capsule-rich-profile">
            <InspectorTextSection label="Purpose" detail={`${richProfile.purpose} ${richProfile.userJob}`} />
            <InspectorTextSection label="Sources" detail={richProfile.sourceIndications.join(' ')} />
            <InspectorTextSection label="Decision Use" detail={[...richProfile.whenToUse, ...richProfile.decisionPrompts].slice(0, 5).join(' ')} />
            <InspectorTextSection label="Improvement Ideas" detail={[...richProfile.improves, ...richProfile.nextIdeas].slice(0, 6).join(' ')} />
            <InspectorTextSection label="Gaps/Risks" detail={[...richProfile.whenNotToUse, ...richProfile.riskCaveats, ...richProfile.evidenceRequirements].slice(0, 6).join(' ')} />
            <InspectorTextSection label="Run Recipe" detail={richProfile.agentInstructions} />
            <InspectorTextSection label="Compatible Capsules" detail={(compatible.length ? compatible : ['Any user capsule', 'Any tool capsule', 'Any output capsule']).join(', ')} />
          </div>
        ) : null}
        {deviceProfile ? (
          <div className="mt-5 space-y-2" data-testid="capsule-device-profile">
            <InspectorTextSection label="Tools/Thinking Devices" detail={`${deviceProfile.deviceKind}: ${deviceProfile.methodSteps.join(' ')}`} />
            <InspectorTextSection label="Best inputs" detail={deviceProfile.bestInputs.join(' ')} />
            <InspectorTextSection label="Expected outputs" detail={deviceProfile.expectedOutputs.join(' ')} />
            <InspectorTextSection label="Failure modes" detail={deviceProfile.failureModes.join(' ')} />
            <InspectorTextSection label="Human review gate" detail={deviceProfile.humanReviewGate} />
            <InspectorTextSection label="Sourceability requirements" detail={deviceProfile.sourceabilityRequirements.join(' ')} />
          </div>
        ) : null}
        {capsule ? (
          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Capsule anatomy</p>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-600">
              <InspectorRef label="User" value={refs?.userCoreId} />
              <InspectorRef label="Situation" value={refs?.situationCoreId} />
              <InspectorRef label="Sourceability" value={[...(refs?.sourceCoreIds ?? []), ...(refs?.documentCoreIds ?? [])].join(', ')} />
              <InspectorRef label="Temporality" value={refs?.timeCoreId} />
              <InspectorRef label="Power Dynamics" value={refs?.graphCoreId ?? refs?.toolCoreIds?.find((id) => id.includes('stakeholder') || id.includes('coalition'))} />
              <InspectorRef label="Rules/Specs" value={refs?.pathCoreId} />
              <InspectorRef label="Tools/Thinking Devices" value={refs?.toolCoreIds?.join(', ')} />
              <InspectorRef label="Outputs" value={[...(refs?.outputCoreIds ?? []), ...(refs?.productCoreIds ?? [])].join(', ')} />
              <InspectorRef label="Handover" value={meta?.starterDefinition?.agentWorkflow.outputGoal ?? refs?.memoryCoreId} />
              <InspectorRef label="Review Gates" value={deviceProfile?.humanReviewGate ?? meta?.starterDefinition?.agentWorkflow.approvalNotes} />
            </div>
          </div>
        ) : null}
        {capsule ? (
          <div className="mt-5 rounded-lg border border-slate-200 p-4" data-testid="capsule-factory-inspection-map">
            <p className="text-xs font-semibold uppercase text-slate-400">Factory inspection map</p>
            <div className="mt-3 grid gap-2">
              <InspectorRef label="Graph" value={refs?.graphCoreId ?? meta?.taxonomy.domains.map((facet) => facet.id).join(', ')} />
              <InspectorRef label="Source-to-claim map" value={[...(refs?.sourceCoreIds ?? []), ...(refs?.documentCoreIds ?? [])].join(', ')} />
              <InspectorRef label="Sources" value={refs?.sourceCoreIds?.join(', ')} />
              <InspectorRef label="Freshness" value={refs?.timeCoreId ?? 'stale-claim check open'} />
              <InspectorRef label="Policy team" value={meta?.taxonomy.policyTeams.map((facet) => facet.id).join(', ')} />
              <InspectorRef label="Tools" value={refs?.toolCoreIds?.join(', ')} />
              <InspectorRef label="Outputs" value={[...(refs?.outputCoreIds ?? []), ...(refs?.productCoreIds ?? [])].join(', ')} />
              <InspectorRef label="Share/export readiness" value={refs?.outputCoreIds?.length ? 'output refs available' : 'handover/export review open'} />
              <InspectorRef label="Marketplace readiness" value={capsule.trust?.label ?? 'private by default'} />
              <InspectorRef label="Open gaps" value={warnings.join(', ') || starterQuestions.slice(0, 2).join(', ')} />
            </div>
          </div>
        ) : null}
        {starterSections.length ? (
          <div className="mt-5 space-y-2">
            {starterSections.map((section) => (
              <section key={section.label} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-800">{section.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{section.detail}</p>
              </section>
            ))}
          </div>
        ) : null}
        {starterSourcePack.length ? (
          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Source pack</p>
              {starterReadiness ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">Readiness {starterReadiness}/5</span> : null}
            </div>
            <div className="mt-3 grid gap-2">
              {starterSourcePack.slice(0, 5).map((source) => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="rounded-md border border-slate-200 p-2 text-xs hover:bg-slate-50">
                  <span className="block font-semibold text-slate-800">{source.label}</span>
                  <span className="mt-1 block leading-5 text-slate-500">{source.publisher ?? 'Public source'} · tier {source.reliabilityTier ?? 'review'} · {source.relevance}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
        {starterExcerpts.length ? (
          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Starter excerpts</p>
            <div className="mt-3 space-y-2">
              {starterExcerpts.slice(0, 4).map((excerpt, index) => (
                <p key={`${excerpt.sourceId}-${index}`} className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  <span className="font-mono text-[11px] font-semibold text-slate-400">{excerpt.sourceId}</span> {excerpt.text}
                </p>
              ))}
            </div>
          </div>
        ) : null}
        {(starterGuidance || starterQuestions.length || starterActions.length) ? (
          <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 p-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">AI use guidance</p>
              {starterGuidance ? <p className="mt-1 text-xs leading-5 text-slate-500">{starterGuidance}</p> : null}
            </div>
            {starterQuestions.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-800">Suggested questions</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-500">
                  {starterQuestions.slice(0, 4).map((question) => <li key={question}>{question}</li>)}
                </ul>
              </div>
            ) : null}
            {starterActions.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-800">Suggested next actions</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-500">
                  {starterActions.slice(0, 4).map((action) => <li key={action}>{action}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        {(starterTools.length || starterOutputs.length) ? (
          <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 p-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Plug-in defaults</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">These values travel with the capsule into Ask PRAXIS, tool routing, agent runs, and output drafting.</p>
            </div>
            <div className="grid gap-2">
              <InspectorRef label="Recommended tools" value={starterTools.join(', ')} />
              <InspectorRef label="Output targets" value={starterOutputs.join(', ')} />
            </div>
          </div>
        ) : null}
        <div className="mt-5 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Reasoning posture</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            {['Sourceability', 'Freshness', 'Causality', 'Human friction', 'Rules', 'Handover'].map((item) => (
              <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{item}</span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {policyTeam ? `${policyTeam.label} preset active.` : 'Assign a policy-team preset to improve tool recommendations and output defaults.'}
          </p>
        </div>
        <div className="mt-5 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Interchange</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(compatible.length ? compatible : ['Any user capsule', 'Any tool capsule', 'Any output capsule']).map((item) => (
              <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item}</span>
            ))}
          </div>
        </div>
        {warnings.length ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase text-amber-800">Open gaps</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-900">
              {warnings.slice(0, 5).map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        ) : null}
        <div className="mt-5 space-y-2">
          <button type="button" onClick={onRepository} className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Open repository</button>
          <button type="button" onClick={onImprove} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Improve capsule</button>
        </div>
      </aside>
    </div>
  );
}

function InspectorRef({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-2 py-1.5">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right font-mono text-[11px] text-slate-700">{value || 'open'}</span>
    </p>
  );
}

function InspectorTextSection({ label, detail }: { label: string; detail: string }) {
  return (
    <section className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </section>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-oxide)]">Policy actions</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Build or run capsule work.</h2>
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
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[color:var(--color-clay)]"
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
            <button key={action.label} type="button" onClick={() => onRun(action.prompt)} className="rounded-lg border border-slate-200 p-4 text-left hover:border-[color:var(--color-clay)]/50 hover:bg-[color:var(--color-archive-paper-strong)]">
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

function Metric({ label, value }: { label: string; value: number | string }) {
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
