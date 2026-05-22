'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  GripVertical,
  HardDrive,
  Library,
  Loader2,
  LockKeyhole,
  Mail,
  Map as MapIcon,
  MessageCircle,
  Mic,
  Monitor,
  Paperclip,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
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
  buildCapsuleSearchItem,
  capsuleSearchMatchReason,
  rankAppSearchItems,
  type AppSearchItemInput,
} from '@/lib/app-search/shared-contracts';
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
  proposeCapsuleImprovementsFromQualityAudit,
  policyTeamCategoryForTags,
  resolveCapsuleTaxonomy,
  runCapsuleStarterQualityAudit,
  type CapsuleImprovementProposal,
  type CapsuleQualityAuditResult,
  type CapsuleStarterCategory,
  type CapsuleStarterDefinition,
  type CapsuleConnectorDefinition,
  type CapsuleTaxonomyStats,
  type PolicyTeamCategory,
} from '@/lib/product/context-capsules';
import { recommendCapsuleTools, type CapsuleToolRecommendation } from '@/lib/tools/recommend';
import { DEFAULT_CONTEXT_STACK_ID } from '@/lib/context/active-context-stack';
import { rankAskCapsuleSuggestions, type AskCapsuleSuggestion } from '@/lib/context/capsule-suggestions';
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

type CapsuleFactoryLaneId = 'library' | 'create' | 'inspect' | 'improve' | 'sources';

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
  laneId: 'create' | 'inspect' | 'improve' | 'sources';
  laneTitle: string;
  reviewState: CapsuleFactoryReviewState;
  proposedCapsule: { label: string; summary: string; coreIds: string[]; provenance: { sourceIds: string[]; documentIds: string[] }; assumptions: string[]; status: 'draft' };
  proposedCores: Array<{ kind: 'user' | 'situation' | 'source' | 'document' | 'graph' | 'time' | 'tool' | 'objective' | 'product' | 'output' | 'memory' | 'handover'; label: string; summary: string; provenanceIds: string[]; confidence: 'low' | 'medium' | 'high' }>;
  sourceGaps: string[];
  openQuestions: string[];
  laneImprovements: Array<{ laneId: 'create' | 'inspect' | 'improve' | 'sources'; title: string; summary: string; proposedTags: string[]; evidenceIds: string[]; requiresConfirmation: true }>;
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
type WorkbenchDiagnosticFlag = {
  label: string;
  status: string;
  detail: string;
  tone: 'ok' | 'watch' | 'warn';
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
    sourceCount?: number;
    groundingPosture?: string | null;
    degradedReason?: string | null;
  };
  sourceReceiptIds?: string[];
  sourceCount?: number;
  groundingPosture?: string | null;
  degradedReason?: string | null;
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
type SpanTargetCore = 'sourceability' | 'causality' | 'rules' | 'temporality';
type SpanAttachStatus = 'idle' | 'pending' | 'success' | 'error';
type SelectionZone = 'assistant-answer' | 'source-preview' | 'repository-text' | 'source-pack' | 'memo-text';
type SelectionRect = { top: number; left: number; width: number; height: number };
type SpanTargetDefinition = {
  id: SpanTargetCore;
  label: string;
  note: string;
  sourceCheckPrompt?: string;
  memoNote: string;
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
  summary?: string | null;
  updatedAt: string;
  archivedAt?: string | null;
  activeForSituationIds?: string[];
  coreRefs: CapsuleCoreRefs;
  health?: { score?: number; warnings?: string[]; blockers?: string[] };
  community?: { tags?: string[]; favorite?: boolean; userRating?: number | null; averageRating?: number | null; ratingCount?: number };
  trust?: { level?: string; score?: number; label?: string };
  access?: { visibility?: 'private' | 'team' | 'organization' | 'shared' | 'public' | 'unlisted'; allowDownload?: boolean; allowClone?: boolean; allowCommunityRating?: boolean };
  activeOntologyStackId?: string | null;
  activeReadContractId?: string | null;
  latestGateState?: string | null;
  readinessSummary?: {
    sourceBacked?: boolean;
    graphLinked?: boolean;
    advisoryMemoryHitCount?: number;
    graphProposalCount?: number;
    reviewCardCount?: number;
    reviewRequired?: boolean;
  } | null;
  searchMatchReason?: string | null;
};
type CapsuleUsefulnessRating = {
  userRating: number | null;
  averageRating: number | null;
  ratingCount: number;
  enabled: boolean;
  disabledReason: string | null;
};
type CapsuleEnrichmentReceipt = {
  canonicalStatus: 'firestore-canonical';
  firestore: 'ready';
  cognee: 'enabled' | 'disabled' | 'degraded';
  graphiti: 'deferred';
  memoryHitCount: number;
  memoryItemIds: string[];
  warnings: string[];
  writebackProposalIds: string[];
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

const askComposerPlaceholderPrompts = [
  'Draft a cited options memo from the active ContextCapsule.',
  'Run a source-gap check before drafting the recommendation.',
  'Prepare a handover with sources, open questions, and next actions.',
  'Compare the strongest options and name the evidence behind each one.',
  'Run a red-team review for unsupported claims and weak assumptions.',
  'Turn this context into a briefing with receipts and follow-up tasks.',
] as const;

const capsuleActionPrompts = [
  { label: 'Build capsule', prompt: 'Build a draft ContextCapsule from this prompt. Propose User, Situation, Source, Tool, and Output cores, source gaps, suggested tools, and apply/fork gates.' },
  { label: 'Find missing sources', prompt: 'Find missing sources for the active capsule. Return a source gap list, search plan, and priority sources to add.' },
  { label: 'Check stale claims', prompt: 'Check the active capsule for stale claims, outdated dates, old assumptions, and decision deadlines.' },
  { label: 'Map causality', prompt: 'Map the causal claims in this capsule. Separate timeline facts, triggers, lag effects, alternatives, and indicators.' },
  { label: 'Map human friction', prompt: 'Map the human friction in this capsule: incentives, fears, blockers, informal authority, approvals, and fatigue.' },
  { label: 'Red-team review', prompt: 'Red-team the active capsule and draft. Identify unsupported claims, missing actors, weak assumptions, and decision risks.' },
] as const;

const defaultAdvancedLabel = 'sourceability' satisfies SpanTargetCore;

const spanTargets: SpanTargetDefinition[] = [
  {
    id: 'sourceability',
    label: 'Sourceability',
    note: 'Mark claim/evidence needing support check.',
    sourceCheckPrompt: 'Source-check this span against the active capsule. Identify missing citations, weak evidence, and the exact support needed.',
    memoNote: 'Sourceability note: claim/evidence needing support check.',
  },
  {
    id: 'causality',
    label: 'Causality',
    note: 'Mark causal claim, driver, mechanism, or alternative explanation.',
    memoNote: 'Causality note: causal claim, driver, mechanism, or alternative explanation.',
  },
  {
    id: 'rules',
    label: 'Rules',
    note: 'Mark rule, constraint, mandate, exception, or compliance issue.',
    memoNote: 'Rules note: rule, constraint, mandate, exception, or compliance issue.',
  },
  {
    id: 'temporality',
    label: 'Temporality',
    note: 'Mark date, sequence, deadline, freshness concern, or decision window.',
    memoNote: 'Temporality note: date, sequence, deadline, freshness concern, or decision window.',
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

const capsuleStudioReviewLanes: Array<{ id: 'improve' | 'sources' | 'output'; label: string; helper: string }> = [
  { id: 'improve', label: 'Improve', helper: 'Review proposed capsule changes before applying.' },
  { id: 'sources', label: 'Sources', helper: 'Close source gaps and unsupported claims.' },
  { id: 'output', label: 'Output', helper: 'Check whether the capsule is ready to produce a memo, brief, or handover.' },
];

const capsuleBuilderStarts = [
  { id: 'describe', label: 'Describe the work', detail: 'Name, job-to-be-done, audience/team, and output goal.' },
  { id: 'sources', label: 'Add sources', detail: 'Paste notes, links, and repository material.' },
  { id: 'starter', label: 'Start from a capsule', detail: 'Fork a starter, expert pick, or saved capsule.' },
  { id: 'combine', label: 'Combine capsules', detail: 'Merge situation, tool, source, and output capsules.' },
] as const;

const factoryBuilderLanes = [
  {
    id: 'inspect',
    title: 'Inspect anatomy',
    subtitle: 'Read what is inside before using the capsule.',
    body: 'Review the source pack, core refs, thinking devices, outputs, review gates, AI use guidance, starter excerpts, and trust/readiness.',
    prompt: 'Inspect the active ContextCapsule. Explain what is inside: source pack, core refs, thinking devices, outputs, review gates, AI use guidance, starter excerpts, and trust/readiness. Do not silently mutate the capsule.',
  },
  {
    id: 'improve',
    title: 'Improve safely',
    subtitle: 'Find gaps, weak assumptions, and missing structure.',
    body: 'Prepare reviewable capsule improvements without changing canonical capsule state.',
    prompt: 'Improve the active ContextCapsule. Propose reviewable updates only: clearer purpose, missing evidence, useful tools, source gaps, and apply gates. Do not silently mutate the capsule.',
  },
  {
    id: 'sources',
    title: 'Source-to-claim inspection',
    subtitle: 'Strengthen receipts, documents, and citation coverage.',
    body: 'Prepare source additions and unsupported-claim checks for human approval.',
    prompt: 'Improve the active ContextCapsule by checking source coverage. Propose reviewable source receipts, document needs, unsupported claims, and evidence gaps. Do not silently mutate the capsule.',
  },
  {
    id: 'create',
    title: 'Build your own capsule',
    subtitle: 'Start private, then decide whether to share.',
    body: 'Collect name, need, notes, links, policy team, and visibility before creating durable capsule state.',
    prompt: 'Help me design a new private ContextCapsule. Ask for name, need/purpose, notes/links, policy team, source gaps, and review gates before creating anything. Do not silently mutate the capsule.',
  },
] as const;

const STARTER_CAPSULE_UPDATED_AT = '2026-05-18T00:00:00.000Z';
const starterCapsuleSummaries = CAPSULE_STARTER_DEFINITIONS.map(starterDefinitionToCapsuleSummary);
const FEATURED_EXPERT_PICK_CAPSULE_IDS = [
  'starter-situation-haiti-gang-mss-access-watch',
  'starter-situation-moldova-energy-hybrid-resilience',
  'starter-situation-baltic-undersea-infrastructure-resilience',
  'starter-situation-ai-governance-procurement',
  'starter-situation-humanitarian-rights-access',
  'starter-situation-mediation-track',
  'starter-tool-mediator-batna-zopa-ripeness-map',
  'starter-tool-ceasefire-monitoring-verification-matrix',
  'starter-tool-estimative-confidence-calibration-table',
  'starter-tool-sourceability-matrix',
  'starter-tool-actor-leverage-veto-map',
  'starter-output-principals-decision-memo',
] as const;
const FEATURED_INTELLECTUAL_DEVICE_CAPSULE_IDS = [
  'starter-tool-mediator-batna-zopa-ripeness-map',
  'starter-tool-ceasefire-monitoring-verification-matrix',
  'starter-tool-joint-fact-finding-source-protocol',
  'starter-tool-principal-ask-payrise-negotiation-prep',
  'starter-tool-estimative-confidence-calibration-table',
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
  const laneTag = lane.id === 'sources' ? 'source-coverage' : lane.id === 'inspect' ? 'capsule-anatomy' : lane.id === 'create' ? 'capsule-builder' : 'capsule-improvement';
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
        kind: lane.id === 'sources' ? 'source' : lane.id === 'inspect' ? 'document' : 'tool',
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
  const isCapsuleStudioMode = isCapsuleRepositoryPage;
  const showHomepageFactoryCta = !initialPanel && mode === 'app';
  const resolvedInitialFactoryLane: CapsuleFactoryLaneId = initialFactoryLane ?? 'library';
  const [prompt, setPrompt] = useState('');
  const [askPlaceholderIndex, setAskPlaceholderIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<PolicyNeedTabId>('analysis');
  const [selectedAgentId, setSelectedAgentId] = useState(PRAXIS_POLICY_AGENTS[0]?.id ?? 'research-memo');
  const [currentCapsuleId, setCurrentCapsuleId] = useState(capsuleId);
  const [activeCapsules, setActiveCapsules] = useState<ActiveCapsuleChip[]>([STARTER_USER_CAPSULE_CHIP]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [guideMessages, setGuideMessages] = useState<ChatMessage[]>([]);
  const [guidePrompt, setGuidePrompt] = useState('What is PRAXIS building around this capsule?');
  const [guideThreadId, setGuideThreadId] = useState<string | null>(null);
  const [guideChatOpen, setGuideChatOpen] = useState(false);
  const [guideCapsuleId, setGuideCapsuleId] = useState<string | null>(null);
  const [guideStreaming, setGuideStreaming] = useState(false);
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
  const isRepositoryLane = false;
  const [factoryReviewDiffs, setFactoryReviewDiffs] = useState<CapsuleFactoryReviewDiff[]>([]);
  const [userCapsules, setUserCapsules] = useState<PraxisCapsuleSummary[]>([]);
  const [capsulesLoading, setCapsulesLoading] = useState(false);
  const [capsuleBrowserOpen, setCapsuleBrowserOpen] = useState(false);
  const [mobileContextSheetOpen, setMobileContextSheetOpen] = useState(false);
  const [contextComposerCollapsed, setContextComposerCollapsed] = useState(false);
  const [repositoryOpen, setRepositoryOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
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
  const [dismissedCapsuleSuggestionIds, setDismissedCapsuleSuggestionIds] = useState<string[]>([]);
  const [recentlyAppliedCapsuleId, setRecentlyAppliedCapsuleId] = useState<string | null>(null);
  const [builderLabel, setBuilderLabel] = useState('');
  const [builderNotes, setBuilderNotes] = useState('');
  const [builderLinks, setBuilderLinks] = useState('');
  const [builderCategoryId, setBuilderCategoryId] = useState<string>(POLICY_TEAM_CATEGORIES[0]?.id ?? 'research-strategy');
  const [selectedText, setSelectedText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [selectionZone, setSelectionZone] = useState<SelectionZone | null>(null);
  const [selectedSpanMenuOpen, setSelectedSpanMenuOpen] = useState(false);
  const [advancedLabel, setAdvancedLabel] = useState<SpanTargetCore>(defaultAdvancedLabel);
  const [selectedSpanStatus, setSelectedSpanStatus] = useState<SpanAttachStatus>('idle');
  const [selectedSpanMessage, setSelectedSpanMessage] = useState('');
  const [agenticSearchPremiumEnabled, setAgenticSearchPremiumEnabled] = useState(false);
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
  const askComposerPlaceholder = askComposerPlaceholderPrompts[askPlaceholderIndex % askComposerPlaceholderPrompts.length];
  const guideCapsule = guideCapsuleId
    ? userCapsules.find((capsule) => capsule.capsuleId === guideCapsuleId)
      ?? starterCapsuleSummaries.find((capsule) => capsule.capsuleId === guideCapsuleId)
      ?? selectedCapsule
    : selectedCapsule;
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
  const activeCapsuleIds = activeCapsuleStack.map((capsule) => capsule.id);
  const askCapsuleSuggestions = useMemo(
    () => rankAskCapsuleSuggestions({
      prompt,
      selectedAgentId: selectedAgent.id,
      activeCapsuleIds: [...activeCapsuleIds, ...dismissedCapsuleSuggestionIds],
      capsules: [...userCapsules, ...starterCapsuleSummaries].map(capsuleSuggestionInput),
      limit: 2,
    }),
    [activeCapsuleIds, dismissedCapsuleSuggestionIds, prompt, selectedAgent.id, userCapsules],
  );
  const primaryCapsules = activeCapsuleStack.filter((capsule) => capsule.role === 'user' || capsule.role === 'situation' || capsule.role === 'output');
  const referenceCapsules = activeCapsuleStack.filter((capsule) => capsule.role === 'reference' || capsule.role === 'tool');
  const archivedCapsules = userCapsules.filter((capsule) => capsule.archivedAt).slice(0, 4);
  const filledChainRoles = new Set(activeCapsuleStack.map((capsule) => capsule.role));
  const openChainSlots = capsuleChainSlots.filter((slot) => !filledChainRoles.has(slot.role));
  const activeCapsuleForStrip = selectedCapsule ?? activeCapsuleStack[0] ?? null;
  const canUseAgenticSearchPremium = isPaidSubscription(user?.subscription);
  const composerReadTargets = [
    activeCapsuleForStrip?.label ?? 'Generic analyst',
    repositoryDocuments.length ? `${repositoryDocuments.length} attached source document${repositoryDocuments.length === 1 ? '' : 's'}` : 'no attached source documents',
    selectedToolIds.length ? `${selectedToolIds.length} capsule tool${selectedToolIds.length === 1 ? '' : 's'}` : 'capsule evidence pack',
  ];
  const composerUseTargets = [
    'ContextCapsule evidence first',
    agenticSearchPremiumEnabled && canUseAgenticSearchPremium ? 'Google/Exa current-source lane when needed' : 'grounding only when configured',
    selectedAgent.label,
    'sourceability reviewer before memo/PDF output',
  ];
  const activeCapsuleSummaryForStrip = selectedCapsule ?? capsuleSummaryForChip(activeCapsuleStack[0], userCapsules);
  const activeStarterForStrip = starterDefinitionForCapsule(activeCapsuleSummaryForStrip);
  const activeCapsuleSourceCount = activeStarterForStrip?.sourcePack.length
    ?? ((activeCapsuleSummaryForStrip?.coreRefs.sourceCoreIds?.length ?? 0) + (activeCapsuleSummaryForStrip?.coreRefs.documentCoreIds?.length ?? 0));
  const activeCapsuleReadiness = activeStarterForStrip
    ? `${activeStarterForStrip.readinessStars}/5`
    : activeCapsuleSummaryForStrip?.health?.score
      ? `${activeCapsuleSummaryForStrip.health.score}/100`
      : activeCapsuleSummaryForStrip?.trust?.label ?? contextHealth.label;
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
  const workbenchRedFlags = [
    {
      label: 'Context chain',
      status: contextHealth.label,
      detail: contextHealth.detail,
      tone: contextHealth.label === 'Operational' || contextHealth.label === 'Grounded'
        ? 'ok'
        : contextHealth.label === 'Ready'
          ? 'watch'
          : 'warn',
    },
    {
      label: 'Sources',
      status: activeCapsuleSourceCount > 0 ? `${activeCapsuleSourceCount} receipts` : 'missing receipts',
      detail: activeCapsuleSourceCount > 0
        ? 'The active capsule has source or document receipts available.'
        : 'Attach sources or open the Repository lane before relying on grounded claims.',
      tone: activeCapsuleSourceCount > 0 ? 'ok' : 'warn',
    },
    {
      label: 'Repository',
      status: repositoryLoading ? 'loading' : `${repositoryDocuments.length} documents`,
      detail: repositoryLoading
        ? 'Repository document posture is still loading.'
        : repositoryDocuments.length
          ? 'Repository documents are visible for inspection and attachment.'
          : 'No uploaded repository documents are visible for the active workspace.',
      tone: repositoryLoading ? 'watch' : repositoryDocuments.length ? 'ok' : 'watch',
    },
    {
      label: 'Agent run',
      status: runtimeProof.workerStatus.replaceAll('_', ' '),
      detail: runtimeProof.queuedRunId
        ? `Latest queued run ${runtimeProof.queuedRunId.slice(0, 12)} with mirrored event: ${runtimeProof.latestMirroredEvent}.`
        : 'No queued agent run is attached to this workbench view yet.',
      tone: runtimeProof.queuedRunId ? 'ok' : 'watch',
    },
  ] satisfies WorkbenchDiagnosticFlag[];

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

  useEffect(() => {
    if (prompt.trim()) return undefined;
    const timer = window.setInterval(() => {
      setAskPlaceholderIndex((index) => (index + 1) % askComposerPlaceholderPrompts.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [prompt]);

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
      agenticSearchPremiumEnabled && canUseAgenticSearchPremium
        ? 'Paid extra enabled: Exa agentic search may be used for current web evidence when materially useful. Keep source URLs visible and do not expose provider cost.'
        : 'Paid extra disabled: do not use Exa agentic search for this turn.',
      '',
      'Behave like a normal chat assistant first. Answer directly when enough context exists. If a tool, upload, connector, source check, memo, or capsule update would help, decide that yourself and explain the next step plainly.',
      'Format the answer for a policy team: start with a short answer, then use concise headings for Findings, Source posture, Gaps, and Next actions when relevant. Do not fabricate citations; name source gaps plainly.',
    ].join('\n');
  }

  function ensureGuideThread(): string {
    if (guideThreadId) return guideThreadId;
    const nextThreadId = createConversationThreadId();
    setGuideThreadId(nextThreadId);
    void ensureConversationRecord(nextThreadId, currentCapsuleId, activeCapsuleStack);
    return nextThreadId;
  }

  function buildGuideChatPrompt(cleanPrompt: string, guideCapsuleForPrompt: PraxisCapsuleSummary | null, threadId: string): string {
    const capsuleMeta = guideCapsuleForPrompt ? capsuleCategoryMeta(guideCapsuleForPrompt) : null;
    const sourceCount = guideCapsuleForPrompt
      ? capsuleCounts(guideCapsuleForPrompt).sources + capsuleCounts(guideCapsuleForPrompt).documents
      : activeCapsuleSourceCount;
    const capsuleStack = activeCapsuleStack
      .map((capsule) => `${capsule.role.toUpperCase()}: ${capsule.label}`)
      .join('\n');
    return [
      cleanPrompt,
      '',
      'PRAXIS guide chat: answer as a lightweight product and capsule guide, not as the main agentic Ask PRAXIS thread.',
      'Frame what PRAXIS is building, how ContextCapsules work, what source gaps exist, and how the selected capsule should be used.',
      'Do not mutate capsules, create agent runs, or claim that repository state changed. If real AI execution or saved work is needed, direct the user to the main Ask composer.',
      `Guide thread: ${threadId}`,
      `Scoped capsule: ${guideCapsuleForPrompt?.label ?? 'No capsule selected'}`,
      `Capsule purpose: ${capsuleMeta?.starterDefinition?.richProfile?.purpose ?? capsuleMeta?.summary ?? 'Explain PRAXIS and capsule use from the visible context.'}`,
      `Visible source count: ${sourceCount}`,
      `Active ContextChain:\n${capsuleStack}`,
    ].join('\n');
  }

  function openGuideChatForCapsule(capsule?: PraxisCapsuleSummary | null) {
    if (capsule) {
      selectCapsuleCard(capsule);
      setGuideCapsuleId(capsule.capsuleId);
      setGuidePrompt(`How should I use "${capsule.label}" in PRAXIS?`);
      setStatus(`${capsule.label} is scoped in the PRAXIS guide chat.`);
    } else {
      setGuideCapsuleId(selectedCapsule?.capsuleId ?? null);
    }
    setGuideChatOpen(true);
  }

  async function sendGuideChat(overridePrompt?: string, scopedCapsule: PraxisCapsuleSummary | null = guideCapsule) {
    const cleanPrompt = (overridePrompt ?? guidePrompt).trim();
    if (!cleanPrompt || guideStreaming) return;
    const targetCapsule = scopedCapsule ?? guideCapsule;
    if (targetCapsule) setGuideCapsuleId(targetCapsule.capsuleId);
    setGuideChatOpen(true);

    if (!isAuthenticated) {
      setGuidePrompt(cleanPrompt);
      sendPublicToLogin(`PRAXIS guide question${targetCapsule ? ` about "${targetCapsule.label}"` : ''}:\n\n${cleanPrompt}`);
      return;
    }

    setGuideStreaming(true);
    const nextThreadId = ensureGuideThread();
    await ensureConversationRecord(nextThreadId, currentCapsuleId, activeCapsuleStack);
    const userMessage: ChatMessage = { role: 'user', text: cleanPrompt };
    const enrichedPrompt = buildGuideChatPrompt(cleanPrompt, targetCapsule, nextThreadId);
    setGuideMessages((current) => [...current, userMessage, { role: 'assistant', text: '' }]);
    setGuidePrompt('');

    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(nextThreadId)}/turns`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [...guideMessages, { ...userMessage, text: enrichedPrompt }].map((message) => ({
            role: message.role,
            content: message.text,
          })),
          capsuleId: currentCapsuleId,
          contextPackageId: targetCapsule?.capsuleId ? `capsule:${targetCapsule.capsuleId}:v${targetCapsule.version}` : undefined,
          appliedCapsules: activeCapsuleStack.map((capsule) => ({
            id: capsule.id,
            label: capsule.label,
            role: capsule.role,
          })),
          currentToolId: 'praxis-guide-chat',
          currentPath: buildConversationPath(currentCapsuleId, nextThreadId),
          activeContextStack,
          aiSettings: {
            provider: 'vertex',
            analysisDepth: 'standard',
            agenticSearchPremium: false,
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
          const streamError = parseDataStreamError(line);
          if (streamError) throw new Error(streamError);
          const parsed = parseDataStreamChunk(line);
          if (!parsed) continue;
          answer += parsed;
          setGuideMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: answer };
            return next;
          });
        }
      }
      if (!answer.trim()) throw new Error('PRAXIS guide returned no answer text.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      setGuidePrompt(cleanPrompt);
      setGuideMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: describeAskFailure(message) };
        return next;
      });
    } finally {
      setGuideStreaming(false);
    }
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
          suggestedCapsules: askCapsuleSuggestions.map((suggestion) => ({
            id: suggestion.capsuleId,
            label: suggestion.label,
            category: suggestion.category,
            reason: suggestion.reason,
            sourceReadinessSignal: suggestion.sourceReadinessSignal,
            score: suggestion.score,
            autoApplied: false,
          })),
          currentToolId: 'ask-praxis',
          currentPath: currentConversationPath,
          activeContextStack,
          aiSettings: {
            provider: 'vertex',
            analysisDepth: selectedAgent.id === 'research-memo' || selectedAgent.id === 'capsule-factory' ? 'deep' : 'standard',
            agenticSearchPremium: agenticSearchPremiumEnabled && canUseAgenticSearchPremium,
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

  const clearSelectedSpan = useCallback(() => {
    setSelectedText('');
    setSelectedMessageId(null);
    setSelectionRect(null);
    setSelectionZone(null);
    setSelectedSpanMenuOpen(false);
    setSelectedSpanStatus('idle');
    setSelectedSpanMessage('');
  }, []);

  const handleDocumentSelection = useCallback((event?: Event) => {
    const target = event?.target;
    if (target instanceof Element && target.closest('[data-selection-popover], [data-selection-trigger]')) return;
    const selection = window.getSelection();
    const cleanText = selection?.toString().trim() ?? '';
    if (!selection || selection.rangeCount === 0 || cleanText.length < 3) {
      if (target instanceof Element && !target.closest('[data-selection-zone]')) clearSelectedSpan();
      return;
    }

    const anchorZone = getSelectionZoneElement(selection.anchorNode);
    const focusZone = getSelectionZoneElement(selection.focusNode);
    const range = selection.getRangeAt(0);
    const commonZone = getSelectionZoneElement(range.commonAncestorContainer);
    const zoneElement = commonZone ?? anchorZone;
    const zone = selectionZoneFromElement(zoneElement);
    if (!zone || !anchorZone || !focusZone || anchorZone !== focusZone) {
      clearSelectedSpan();
      return;
    }

    const rect = range.getBoundingClientRect();
    const firstRect = range.getClientRects()[0];
    const nextRect = (rect.width || rect.height) ? rect : firstRect;
    if (!nextRect) {
      clearSelectedSpan();
      return;
    }

    setSelectedText(cleanText.slice(0, 2000));
    setSelectedMessageId(zoneElement?.dataset.selectionMessageId ?? null);
    setSelectionZone(zone);
    setSelectionRect({
      top: nextRect.top,
      left: nextRect.left,
      width: nextRect.width,
      height: nextRect.height,
    });
    setSelectedSpanMenuOpen(false);
    setAdvancedLabel(defaultAdvancedLabel);
    setSelectedSpanStatus('idle');
    setSelectedSpanMessage('');
  }, [clearSelectedSpan]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') clearSelectedSpan();
    }

    function handlePointerDown(event: PointerEvent) {
      if (!selectedText) return;
      const target = event.target;
      if (target instanceof Element && target.closest('[data-selection-popover], [data-selection-trigger], [data-selection-zone]')) return;
      clearSelectedSpan();
    }

    document.addEventListener('mouseup', handleDocumentSelection);
    document.addEventListener('keyup', handleDocumentSelection);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('mouseup', handleDocumentSelection);
      document.removeEventListener('keyup', handleDocumentSelection);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [clearSelectedSpan, handleDocumentSelection, selectedText]);

  async function bindSelectedSpan(targetCore: SpanTargetCore = advancedLabel) {
    if (!selectedText.trim()) return;
    if (requireAuthForAction(`Attach this selected text to ${targetCore}: ${selectedText}`)) return;
    const target = spanTargets.find((item) => item.id === targetCore);
    if (!target || selectedSpanStatus === 'pending') return;
    const cleanText = selectedText.trim();
    const note = buildSelectedSpanNote(target, cleanText);
    setSelectedSpanStatus('pending');
    setSelectedSpanMessage(`Attaching selected text to ${target.label}...`);
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(currentCapsuleId)}/spans`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        targetCore,
        sourceType: sourceTypeForSelectionZone(selectionZone),
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
    setSelectedSpanStatus('success');
    setSelectedSpanMessage('Saved as evidence span');
    setStatus('Saved as evidence span');
    await refreshCapsules(currentCapsuleId);
  }

  function prefillComposerFromSelection(mode: 'ask' | 'source-check') {
    if (!selectedText.trim()) return;
    const promptText = mode === 'source-check'
      ? [
          'Source-check this selected passage in the active capsule context. Identify unsupported claims, missing citations, weak evidence, and exact sources needed:',
          '',
          quoteSelectedText(selectedText.trim()),
        ].join('\n')
      : [
          'Analyze this selected passage in the active capsule context:',
          '',
          quoteSelectedText(selectedText.trim()),
        ].join('\n');
    setPrompt(promptText);
    setStatus(mode === 'source-check' ? 'Source-check prompt loaded into the composer.' : 'Selected passage loaded into the composer.');
    setSelectedSpanMenuOpen(false);
  }

  async function turnAttachedSpanIntoMemoNote() {
    if (!selectedText.trim()) return;
    const target = spanTargets.find((item) => item.id === advancedLabel) ?? spanTargets[0]!;
    const cleanText = selectedText.trim();
    if (requireAuthForAction(`Turn this selected span into a memo note:\n\n${cleanText}`)) return;
    setSelectedSpanStatus('pending');
    setSelectedSpanMessage('Writing a memo note into the active capsule...');
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(currentCapsuleId)}/notes`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: target.id === 'sourceability' ? 'source_note' : 'analyst_note',
        title: `${target.label} selected passage`,
        body: `${target.memoNote}\n\n${cleanText}`,
        tags: ['selected-span', target.id],
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
    setSelectedSpanMessage('Added to memo');
    setStatus('Added to memo');
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

  function viewCapsuleCard(capsule: PraxisCapsuleSummary) {
    openCapsuleInspector(capsule);
  }

  function openCapsuleInspector(capsule: PraxisCapsuleSummary) {
    selectCapsuleCard(capsule);
    setGuideCapsuleId(capsule.capsuleId);
    setGuidePrompt(`Inspect "${capsule.label}" for source gaps, use cases, risks, and next actions.`);
    setInspectorOpen(true);
    setStatus(`${capsule.label} opened in the capsule inspector.`);
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

  async function rateCapsuleUsefulness(capsule: PraxisCapsuleSummary, rating: number) {
    if (!isAuthenticated) {
      sendPublicToLogin(`Rate "${capsule.label}" usefulness.`);
      return;
    }
    const persisted = userCapsules.find((item) => item.capsuleId === capsule.capsuleId);
    if (!persisted) {
      setStatus('Save or fork this starter before rating usefulness.');
      return;
    }
    if (persisted.access?.allowCommunityRating === false) {
      setStatus('Community usefulness rating is disabled for this capsule.');
      return;
    }
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(persisted.capsuleId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'rate', rating }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error ? `Rating failed: ${payload.error}` : 'Rating failed.');
      return;
    }
    setStatus(`Rated ${persisted.label} ${rating}/5 for usefulness.`);
    await refreshCapsules(persisted.capsuleId);
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
    const nextPrompt = `Submit "${target}" for improvement. Check sources, missing context, useful tools, output readiness, open gaps, and approval gates. Return review-gated diff proposals only; do not silently mutate the capsule.`;
    setPrompt(nextPrompt);
    if (isAuthenticated) void sendToPraxis(capsuleFactoryAgent, nextPrompt);
    else sendPublicToLogin(nextPrompt, capsuleFactoryAgent);
  }

  function openSelectedCapsuleInAsk(capsule?: PraxisCapsuleSummary | null) {
    const target = capsule ?? selectedCapsule ?? userCapsules[0] ?? starterCapsuleSummaries[0];
    if (!target) return;
    selectCapsuleCard(target);
    const askPath = `/app?capsuleId=${encodeURIComponent(target.capsuleId)}`;
    router.push(isAuthenticated ? askPath : `/login?mode=signup&redirect=${encodeURIComponent(askPath)}`);
  }

  function openWorkbenchSearch(query?: string) {
    window.dispatchEvent(new CustomEvent('open-praxis-search', { detail: { query } }));
  }

  const selectionViewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const selectionAnchorLeft = selectionRect
    ? Math.max(12, Math.min(selectionRect.left + (selectionRect.width / 2), selectionViewportWidth - 168))
    : 12;
  const selectionTriggerStyle = selectionRect
    ? { left: selectionAnchorLeft, top: Math.max(12, selectionRect.top - 46) }
    : undefined;
  const selectionMenuStyle = selectionRect
    ? { left: Math.max(12, Math.min(selectionAnchorLeft - 160, selectionViewportWidth - 344)), top: Math.max(12, selectionRect.top + selectionRect.height + 10) }
    : undefined;

  return (
    <section className={cn('civic-atelier-shell cartographic-grid praxis-checker-constellation od-praxis-surface min-h-screen text-[color:var(--color-deep-ink)]', className)} data-testid="tasklet-praxis-workbench">
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
            {isCapsuleStudioMode ? (
              <nav className="ml-auto hidden items-center gap-5 text-sm font-semibold text-slate-500 md:flex" aria-label="Capsule Studio navigation">
                <Link href={isAuthenticated ? '/app' : '/'} className="hover:text-slate-900">Home</Link>
                <Link href={isAuthenticated ? '/app/capsules' : '/login?mode=signup&redirect=%2Fapp%2Fcapsules'} className="text-slate-950">Capsules</Link>
              </nav>
            ) : (
              <nav className="ml-auto hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
                <Link href={isAuthenticated ? '/app' : '/'} className="hover:text-slate-900">Home</Link>
                <Link href={isAuthenticated ? '/app/capsules' : '/login?mode=signup&redirect=%2Fapp%2Fcapsules'} className="hover:text-slate-900">Capsules</Link>
                <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
                <Link href="/learn" className="hover:text-slate-900">Learn</Link>
                <Link href="/release-notes" className="hover:text-slate-900">Release notes</Link>
              </nav>
            )}
            <div className="flex items-center gap-2">
              {isAuthenticated ? <AccountProfileButton compact /> : <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-white">Sign in</Link>}
            </div>
          </header> : null}

          <div className={cn('mx-auto flex max-w-6xl flex-col items-center', isCapsuleStudioMode ? 'mt-6 sm:mt-8' : showWorkbenchNavigation ? 'mt-14 sm:mt-18' : 'mt-8 sm:mt-12')}>
            {isCapsuleStudioMode ? (
              <section className="w-full" data-testid="capsule-studio-header">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-oxide)]">Capsule Studio</p>
                    <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[color:var(--color-deep-ink)] sm:text-5xl">
                      Build and use trusted capsules.
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                      One library, one selected capsule, one guided build flow, and one review queue.
                    </p>
                  </div>
                  <div className="grid min-w-[min(100%,22rem)] gap-2 sm:grid-cols-2">
                    <Metric label="Selected" value={selectedCapsule?.label ?? 'None'} />
                    <Metric label="Visibility" value={selectedCapsule?.access?.visibility ?? 'private'} />
                    <Metric label="Sources" value={activeCapsuleSourceCount} />
                    <Metric label="Review queue" value={factoryReviewDiffs.filter((diff) => diff.reviewState === 'reviewed').length} />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2" data-testid="capsule-studio-primary-actions">
                  <button
                    type="button"
                    onClick={() => {
                      if (requireAuthForAction('Build a new PRAXIS ContextCapsule.')) return;
                      setBuilderOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Build capsule
                  </button>
                  <button
                    type="button"
                    onClick={() => openSelectedCapsuleInAsk(selectedCapsule)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowUp className="h-4 w-4" />
                    Use in Ask
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const lane = factoryBuilderLanes.find((item) => item.id === 'improve') ?? factoryBuilderLanes[0];
                      reviewFactoryLane(lane);
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-clay)]/30 bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-oxide)] hover:bg-[color:var(--color-mineral-soft)]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Review improvements
                  </button>
                </div>
              </section>
            ) : null}
            {!isCapsuleStudioMode ? (
            <>
            <p className="receipt-slip flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs font-semibold">
              <Sparkles className="h-4 w-4 text-[color:var(--color-oxide)]" />
              Compose your reasoning and policy products from expert ContextCapsules.
            </p>
            <div className="mt-3" data-testid="runtime-health-semaphore">
              <RuntimeHealthSemaphore isAuthenticated={isAuthenticated} />
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                data-testid="workbench-search-trigger"
                onClick={() => openWorkbenchSearch(capsuleSearch)}
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-mineral)]/25 bg-white px-3 py-2 text-xs font-semibold text-[color:var(--color-deep-ink)] shadow-sm hover:border-[color:var(--color-clay)]/40 hover:bg-[color:var(--color-archive-paper-strong)]"
              >
                <Search className="h-4 w-4" />
                Search app
              </button>
              <WorkbenchDiagnosticsStrip flags={workbenchRedFlags} onOpen={() => setDiagnosticsOpen(true)} />
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

            <div className="praxis-composer-focus-shell od-praxis-panel mt-6 w-full max-w-5xl rounded-xl" data-testid="praxis-main-composer">
              <div className="border-b border-black/10 px-5 py-4" data-testid="capsule-context-bar">
                <button
                  type="button"
                  data-testid="mobile-context-chain-bar"
                  onClick={() => setMobileContextSheetOpen(true)}
                  className="capsule-chain-node capsule-state-active mb-4 flex min-h-14 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left md:hidden"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[10px] font-semibold uppercase text-slate-300">Active ContextChain</span>
                    <span className="mt-0.5 block truncate text-sm font-semibold text-white">{activeCapsuleForStrip?.label ?? 'No capsule opened'}</span>
                  </span>
                  <span className="shrink-0 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-semibold text-[color:var(--color-lab-cyan)]">
                    {activeCapsuleReadiness}
                  </span>
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3" data-testid="capsule-context-composer">
                  <div className="min-w-0 flex-1" data-testid="active-capsule-strip">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                      <span className="rounded-md bg-slate-950 px-2 py-1 text-white">Context Chain</span>
                      <span className="max-w-full truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-900">
                        {activeCapsuleForStrip?.label ?? 'No capsule opened'}
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
                              className="praxis-workbench-panel relative min-w-0 flex-1 basis-40 rounded-lg border-dashed p-3 text-left text-xs text-slate-500 transition hover:border-[color:var(--color-oxide)] hover:bg-white"
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
                    className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-[color:var(--color-archive-paper-strong)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Browse capsules
                  </button>
                </div>
                <div className="mt-3 grid gap-2 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600" data-testid="ask-capsule-workflow-preview">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.14em] text-slate-400">PRAXIS will read</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {composerReadTargets.map((target) => (
                        <span key={target} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">{target}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-[0.14em] text-slate-400">PRAXIS may use</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {composerUseTargets.map((target) => (
                        <span key={target} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">{target}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {mobileContextSheetOpen ? (
                <div className="fixed inset-0 z-50 flex items-end bg-black/35 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile ContextChain selector">
                  <section className="capsule-mobile-sheet max-h-[86vh] w-full overflow-y-auto rounded-t-xl p-4" data-testid="mobile-context-chain-sheet">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-lab-line)]">ContextChain</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-950">Capsule selector</h2>
                      </div>
                      <button type="button" aria-label="Close ContextChain selector" onClick={() => setMobileContextSheetOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4">
                      <MobileCapsuleLane title="Primary" capsules={primaryCapsules} onOpen={(capsule) => {
                        setCurrentCapsuleId(capsule.id);
                        setMobileContextSheetOpen(false);
                      }} />
                      <MobileCapsuleLane title="References" capsules={referenceCapsules} onOpen={(capsule) => {
                        setCurrentCapsuleId(capsule.id);
                        setMobileContextSheetOpen(false);
                      }} />
                      <div data-testid="selected-reference-capsules-preview" className="rounded-md border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase text-slate-400">Selected references</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {referenceCapsules.length ? referenceCapsules.map((capsule) => capsule.label).join(', ') : 'No reference capsules selected'}
                        </p>
                      </div>
                      <div className="rounded-md border border-dashed border-slate-300 bg-white p-3">
                        <p className="text-xs font-semibold uppercase text-slate-400">Archive lane</p>
                        <div className="mt-2 grid gap-2">
                          {archivedCapsules.length ? archivedCapsules.map((capsule) => (
                            <button key={capsule.capsuleId} type="button" onClick={() => selectUserCapsule(capsule)} className="rounded-md border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">
                              {capsule.label}
                            </button>
                          )) : <span className="text-xs text-slate-500">No archived capsules loaded.</span>}
                        </div>
                      </div>
                      {openChainSlots.length ? (
                        <div className="capsule-state-missing rounded-md border bg-white p-3">
                          <p className="text-xs font-semibold uppercase text-slate-500">Thin context warning</p>
                          <p className="mt-1 text-sm text-slate-700">Missing: {openChainSlots.map((slot) => slot.label).join(', ')}.</p>
                        </div>
                      ) : null}
                      <button type="button" onClick={() => {
                        setMobileContextSheetOpen(false);
                        setCapsuleBrowserOpen(true);
                      }} className="min-h-11 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
                        Browse capsule library
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}
              <div className="praxis-composer-input-well mx-4 my-4 sm:mx-5">
                <label className="block px-4 pt-3 font-mono text-[11px] font-semibold uppercase text-[color:var(--color-oxide)]" htmlFor="praxis-main-prompt">
                  Write your prompt here
                </label>
                <textarea
                  id="praxis-main-prompt"
                  aria-label="Describe a task or responsibility"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={4}
                  placeholder={askComposerPlaceholder}
                  className="min-h-36 w-full resize-none bg-transparent px-4 pb-4 pt-2 text-base leading-7 text-slate-900 outline-none placeholder:text-slate-500 sm:text-xl sm:leading-8"
                />
              </div>
              <CapsuleSuggestionWidget
                suggestions={askCapsuleSuggestions}
                onAdd={(suggestion) => applyCapsuleCard(suggestion.capsule)}
                onDismiss={(suggestion) => setDismissedCapsuleSuggestionIds((current) => [...current, suggestion.capsuleId])}
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
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        sendPublicToLogin(prompt.trim() || 'Use Premium web search in PRAXIS.');
                        return;
                      }
                      if (!canUseAgenticSearchPremium) {
                        window.location.href = '/login?mode=signup&plan=analyst';
                        return;
                      }
                      setAgenticSearchPremiumEnabled((enabled) => !enabled);
                      setStatus(agenticSearchPremiumEnabled
                        ? 'Exa agentic search disabled for the next turn.'
                        : 'Exa agentic search enabled for the next turn. PRAXIS will use it only when current web evidence is needed.');
                    }}
                    aria-pressed={agenticSearchPremiumEnabled && canUseAgenticSearchPremium}
                    title={canUseAgenticSearchPremium ? 'Toggle Exa agentic search for this conversation turn' : 'Premium web requires a paid PRAXIS subscription'}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-md border px-3 text-xs font-semibold shadow-sm transition',
                      agenticSearchPremiumEnabled && canUseAgenticSearchPremium
                        ? 'border-amber-300 bg-amber-50 text-amber-900 shadow-amber-900/5'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {canUseAgenticSearchPremium ? <Search className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                    <span className="hidden sm:inline">Premium web</span>
                    <span className="rounded-sm bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Exa</span>
                  </button>
                  <span className="hidden rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 sm:inline-flex">
                    TACITUS routes model, worker, and tools
                  </span>
                  <WorkActionMenu label="Work on this">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void sendToPraxis()}
                      disabled={!prompt.trim() || isStreaming}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Send to PRAXIS
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void createAgentRun()}
                      disabled={!prompt.trim() || agentRunCreating}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Queue agent run
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setCapsuleBrowserOpen(true)}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Add capsule context
                    </button>
                  </WorkActionMenu>
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
              <div className="praxis-workbench-panel flex flex-wrap items-center justify-between gap-3 rounded-none border-x-0 border-b-0 border-t border-black/10 px-5 py-2 text-sm text-slate-500">
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
              <>
              <section className="praxis-workbench-panel mt-5 w-full max-w-5xl space-y-3 p-4" data-testid="praxis-chat-thread">
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
                        <AssistantMarkdown text={message.text || 'Reading context...'} messageId={`assistant-${index}`} />
                        <ConversationReceiptSummary envelope={message.answerEnvelope} />
                        <ConversationAgentActivityRail
                          envelope={message.answerEnvelope}
                          onAction={(actionPrompt) => {
                            setPrompt(actionPrompt);
                            setStatus('Continuation action loaded into the composer.');
                          }}
                        />
                        <ConversationSourcePreviewPanel
                          envelope={message.answerEnvelope}
                          messageId={`assistant-${index}`}
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
              </section>
              {selectedText && selectionRect && !selectedSpanMenuOpen ? (
                <button
                  type="button"
                  title="Use selected text in PRAXIS"
                  aria-label="Use selected text in PRAXIS"
                  data-selection-trigger
                  data-testid="text-span-trigger"
                  style={selectionTriggerStyle}
                  onClick={() => setSelectedSpanMenuOpen(true)}
                  className="fixed z-[80] inline-flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1.5 rounded-md border border-[color:var(--color-clay)]/35 bg-white px-2.5 py-1.5 text-xs font-semibold text-[color:var(--color-oxide)] shadow-lg shadow-slate-950/15 hover:bg-[color:var(--color-archive-paper-strong)]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Use in PRAXIS</span>
                </button>
              ) : null}
              {selectedText && selectionRect && selectedSpanMenuOpen ? (
                <div
                  className="fixed z-[80] w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-[color:var(--color-clay)]/35 bg-[color:var(--color-archive-paper-strong)] p-3 shadow-2xl shadow-slate-950/20 ring-1 ring-white/70"
                  role="menu"
                  aria-label="Selected text actions"
                  data-selection-popover
                  data-testid="text-span-action-menu"
                  style={selectionMenuStyle}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-oxide)]">Use selected text</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{selectedText}</p>
                    </div>
                    <button type="button" aria-label="Clear selected text" onClick={clearSelectedSpan} className="rounded p-1 text-slate-500 hover:bg-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" role="menuitem" onClick={() => prefillComposerFromSelection('ask')} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                      Ask PRAXIS
                    </button>
                    <button type="button" role="menuitem" disabled={selectedSpanStatus === 'pending'} onClick={() => void bindSelectedSpan(advancedLabel)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70">
                      Save to capsule
                    </button>
                    <button type="button" role="menuitem" onClick={() => prefillComposerFromSelection('source-check')} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      Source-check
                    </button>
                    <button type="button" role="menuitem" disabled={selectedSpanStatus === 'pending'} onClick={() => void turnAttachedSpanIntoMemoNote()} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70">
                      Add to memo
                    </button>
                  </div>
                  <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Advanced label
                    <select
                      value={advancedLabel}
                      onChange={(event) => setAdvancedLabel(event.target.value as SpanTargetCore)}
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-[color:var(--color-clay)]"
                    >
                      {spanTargets.map((target) => (
                        <option key={target.id} value={target.id}>{target.label}</option>
                      ))}
                    </select>
                  </label>
                  {selectedSpanMessage ? (
                    <p
                      className={cn(
                        'mt-3 rounded-md px-3 py-2 text-xs font-medium',
                        selectedSpanStatus === 'error' ? 'bg-rose-50 text-rose-700' : selectedSpanStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600',
                      )}
                    >
                      {selectedSpanMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
              </>
            ) : null}
            </>
            ) : null}

            <section
              id="capsule-repository-section"
              className={cn('w-full max-w-5xl', isCapsuleStudioMode ? 'mt-6' : 'mt-12')}
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
                <CapsuleStudioCommandBand
                  capsule={selectedCapsule}
                  visibleCount={visibleCapsuleCards.length}
                  userCapsuleCount={userCapsuleTaxonomyStats.visibleCapsules}
                  archivedCount={userCapsuleTaxonomyStats.archivedCapsules}
                  reviewDiffCount={factoryReviewDiffs.filter((diff) => diff.reviewState === 'reviewed').length}
                  onCreate={() => {
                    if (requireAuthForAction('Build a new PRAXIS ContextCapsule.')) return;
                    setBuilderOpen(true);
                  }}
                  onUseInAsk={() => openSelectedCapsuleInAsk(selectedCapsule)}
                  onReview={() => {
                    const lane = factoryBuilderLanes.find((item) => item.id === 'improve') ?? factoryBuilderLanes[0];
                    reviewFactoryLane(lane);
                  }}
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

              {isAuthenticated ? (
                <div className={cn('mt-6 grid gap-4', !isRepositoryPage && !isCapsuleRepositoryPage && 'lg:grid-cols-[minmax(0,1fr)_320px]', isRepositoryPage && 'lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]', isCapsuleRepositoryPage && 'lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)_minmax(260px,320px)]')}>
                  <div className="min-w-0" data-testid="capsule-studio-library">
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
                        onView={viewCapsuleCard}
                        onInspect={openCapsuleInspector}
                        onImprove={improveCapsuleCard}
                        onRateUsefulness={rateCapsuleUsefulness}
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
                        onView={viewCapsuleCard}
                        onInspect={openCapsuleInspector}
                        onImprove={improveCapsuleCard}
                        onRateUsefulness={rateCapsuleUsefulness}
                        onDownload={(capsule) => void downloadCapsulePackage(capsule)}
                        onArchive={(capsule) => void archiveCapsuleCard(capsule)}
                      />
                    </>
                  ) : null}
                  {!isRepositoryLane ? <div className={cn('mt-4 grid w-full min-w-0 gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))]', isCapsuleRepositoryPage && 'lg:grid-cols-[repeat(3,minmax(0,1fr))]', isRepositoryPage && 'md:grid-cols-1')} data-testid="tasklet-capsule-cards">
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
                        onView={() => viewCapsuleCard(capsule)}
                        onInspect={() => openCapsuleInspector(capsule)}
                        onImprove={() => improveCapsuleCard(capsule)}
                        onRateUsefulness={(rating) => void rateCapsuleUsefulness(capsule, rating)}
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
                  {isCapsuleRepositoryPage ? (
                    <>
                      <CapsuleStudioWorkspace
                        capsule={selectedCapsule}
                        policyTeam={selectedPolicyTeam}
                        recommendations={capsuleRecommendations}
                        repositoryDocuments={visibleRepositoryDocuments}
                        repositoryLoading={repositoryLoading}
                        agentRunCount={agentRuns.length}
                        runtimeProof={runtimeProof}
                        chatMessages={guideMessages}
                        guidePrompt={guidePrompt}
                        isAuthenticated={isAuthenticated}
                        isStreaming={guideStreaming}
                        onDetails={() => setInspectorOpen(true)}
                        onSources={() => { setRepositoryOpen(true); void refreshRepository(); }}
                        onImprove={() => {
                          const lane = factoryBuilderLanes.find((item) => item.id === 'improve') ?? factoryBuilderLanes[0];
                          reviewFactoryLane(lane);
                        }}
                        onUseInAsk={() => openSelectedCapsuleInAsk(selectedCapsule)}
                        onPrompt={setGuidePrompt}
                        onAskCapsule={(question) => {
                          if (selectedCapsule) void sendGuideChat(question, selectedCapsule);
                        }}
                      />
                      <CapsuleStudioReviewQueue
                        capsule={selectedCapsule}
                        reviewDiffs={factoryReviewDiffs}
                        agentRuns={agentRuns}
                        runtimeProof={runtimeProof}
                        repositoryDocuments={visibleRepositoryDocuments}
                        onReview={() => {
                          const lane = factoryBuilderLanes.find((item) => item.id === 'improve') ?? factoryBuilderLanes[0];
                          reviewFactoryLane(lane);
                        }}
                        onSources={() => { setRepositoryOpen(true); void refreshRepository(); }}
                        onDownload={() => selectedCapsule ? void downloadCapsulePackage(selectedCapsule) : undefined}
                        onMakePrivate={() => selectedCapsule ? void setCapsuleVisibility(selectedCapsule, 'private') : undefined}
                        onMakePublic={() => selectedCapsule ? void setCapsuleVisibility(selectedCapsule, 'public') : undefined}
                        onApply={applyFactoryReviewDiff}
                        onReject={rejectFactoryReviewDiff}
                      />
                    </>
                  ) : isRepositoryPage ? (
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
                  ) : (
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
                      onRateUsefulness={(rating) => selectedCapsule ? void rateCapsuleUsefulness(selectedCapsule, rating) : undefined}
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
                  onView={viewCapsuleCard}
                  onInspect={openCapsuleInspector}
                  onImprove={improveCapsuleCard}
                  onDownload={(capsule) => void downloadCapsulePackage(capsule)}
                  onArchive={(capsule) => void archiveCapsuleCard(capsule)}
                />
                <div className="mt-4 grid w-full min-w-0 gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]" data-testid="tasklet-capsule-cards">
                  {visibleCapsuleCards.map((capsule) => (
                    <CapsuleCard
                      key={capsule.capsuleId}
                      capsule={capsule}
                      active={capsule.capsuleId === currentCapsuleId}
                      mutable={false}
                      compact={isCapsuleRepositoryPage || !isRepositoryPage}
                      onSelect={() => selectCapsuleCard(capsule)}
                      onAdd={() => applyCapsuleCard(capsule)}
                      onView={() => viewCapsuleCard(capsule)}
                      onInspect={() => openCapsuleInspector(capsule)}
                      onImprove={() => improveCapsuleCard(capsule)}
                      onRateUsefulness={(rating) => void rateCapsuleUsefulness(capsule, rating)}
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
      {inspectorOpen && selectedCapsule ? (
        <CapsuleInspectorSheet
          capsule={selectedCapsule}
          policyTeam={selectedPolicyTeam}
          chatMessages={guideMessages}
          isAuthenticated={isAuthenticated}
          isStreaming={guideStreaming}
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
          onAskCapsule={(question) => {
            if (selectedCapsule) void sendGuideChat(question, selectedCapsule);
          }}
          onRateUsefulness={(rating) => selectedCapsule ? void rateCapsuleUsefulness(selectedCapsule, rating) : undefined}
        />
      ) : null}
      {!isCapsuleStudioMode ? <PraxisGuideChat
        open={guideChatOpen}
        capsule={guideCapsule}
        messages={guideMessages}
        prompt={guidePrompt}
        isAuthenticated={isAuthenticated}
        isStreaming={guideStreaming}
        onOpen={() => openGuideChatForCapsule(guideCapsule)}
        onClose={() => setGuideChatOpen(false)}
        onPrompt={setGuidePrompt}
        onSubmit={() => void sendGuideChat()}
      /> : null}
      {diagnosticsOpen ? (
        <WorkbenchDiagnosticsDrawer
          flags={workbenchRedFlags}
          runtimeProof={runtimeProof}
          onClose={() => setDiagnosticsOpen(false)}
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
  const generationReceipt = envelope?.generationReceipt;
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
        {generationReceipt ? (
          <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
            Generation: {generationReceipt.budgetMode} / {generationReceipt.maxOutputTokens}
          </span>
        ) : null}
      </div>
    </section>
  );
}

const continuationActionLabels = ['Continue as memo', 'Expand evidence annex', 'Create output capsule'] as const;

function ConversationAgentActivityRail({ envelope, onAction }: { envelope?: AskAnswerEnvelope; onAction: (prompt: string) => void }) {
  const receipt = envelope?.orchestrationReceipt;
  const sourceAudit = envelope?.sourceAudit;
  const claimLedger = envelope?.claimLedgerSummary;
  const generationReceipt = envelope?.generationReceipt;
  if (!receipt && !sourceAudit && !claimLedger && !generationReceipt) return null;
  const languagePolicyReview = receipt?.languagePolicyReview;
  const stages = receipt ? [
    { label: 'Capsule read', detail: `${receipt.capsule.contextHealth} context, ${receipt.capsule.evidenceCount} evidence paragraphs.` },
    { label: 'Workflow plan', detail: receipt.workflowPlan.workflowKind.replace(/_/g, ' ') },
    { label: 'Source discovery', detail: `${receipt.capsule.sourcePreviewCount} source previews, ${receipt.capsule.activeGapCount} gaps.` },
    { label: 'Document retrieval', detail: `${receipt.capsuleReadReceipt.documentCount} documents, ${receipt.capsuleReadReceipt.sourceCount} source receipts.` },
    { label: 'Claim review', detail: `${claimLedger?.supportedClaims ?? 0} supported, ${claimLedger?.unsupportedClaims ?? 0} unsupported.` },
    { label: 'Language and policy review', detail: languagePolicyReview?.required ? 'Terminology, sourceability, and gap language checked.' : 'Standard terminology check.' },
    { label: 'Output save', detail: generationReceipt?.finishReason ? `Finished: ${generationReceipt.finishReason}` : 'Receipts saved with the answer.' },
    { label: 'Approval gates', detail: `${receipt.toolRouting.approvalRequiredToolIds.length} approval gates.` },
    { label: 'Durable AgentRun', detail: receipt.supervisor.queuedRun?.runId ?? 'No durable run needed.' },
  ] : [];
  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2" data-testid="praxis-answer-agent-activity">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Agent Activity</p>
        {generationReceipt ? (
          <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
            {generationReceipt.selectedModel} / {generationReceipt.budgetMode}
          </span>
        ) : null}
      </div>
      {stages.length ? (
        <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {stages.map((stage) => (
            <li key={stage.label} className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
              <p className="text-xs font-semibold text-slate-900">{stage.label}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-600">{stage.detail}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {sourceAudit || claimLedger ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {sourceAudit ? (
            <section className="rounded-md border border-slate-200 bg-white p-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Source audit</p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-600">
                <span>{sourceAudit.sourceCount} sources</span>
                <span>{sourceAudit.sourceReceiptCount} receipts</span>
                <span>{sourceAudit.gapCount} gaps</span>
                <span>{sourceAudit.sourcePosture.replace(/_/g, ' ')}</span>
              </div>
            </section>
          ) : null}
          {claimLedger ? (
            <section className="rounded-md border border-slate-200 bg-white p-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Claim ledger</p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-600">
                <span>Supported {claimLedger.supportedClaims}</span>
                <span>Weak {claimLedger.weakClaims}</span>
                <span>Unsupported {claimLedger.unsupportedClaims}</span>
                <span>Model-prior {claimLedger.modelPriorClaims}</span>
                <span>Assumptions {claimLedger.assumptionClaims}</span>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
      {envelope?.continuationActions?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label={continuationActionLabels.join(', ')}>
          {envelope.continuationActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action.prompt)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
function ConversationSourcePreviewPanel({ envelope, messageId, onFollowUp }: { envelope?: AskAnswerEnvelope; messageId?: string; onFollowUp: (followUp: string) => void }) {
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
                <blockquote className="mt-2 border-l-2 border-diplomatic-blue/40 pl-2 text-xs leading-5 text-slate-700" data-selection-zone="source-preview" data-selection-message-id={messageId}>
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

function CapsuleSuggestionWidget({
  suggestions,
  onAdd,
  onDismiss,
}: {
  suggestions: Array<AskCapsuleSuggestion<PraxisCapsuleSummary>>;
  onAdd: (suggestion: AskCapsuleSuggestion<PraxisCapsuleSummary>) => void;
  onDismiss: (suggestion: AskCapsuleSuggestion<PraxisCapsuleSummary>) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <section className="mx-4 mb-4 grid gap-2 rounded-lg border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper-strong)] px-4 py-3 sm:mx-5" data-testid="ask-capsule-suggestion-widget">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-[color:var(--color-oxide)]" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-oxide)]">Suggested capsules</p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">human-gated context</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {suggestions.map((suggestion) => (
          <article key={suggestion.capsuleId} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{suggestion.label}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold text-slate-500">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">{suggestion.category}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">{suggestion.sourceReadinessSignal}</span>
                </div>
              </div>
              <button type="button" aria-label={`Dismiss ${suggestion.label}`} onClick={() => onDismiss(suggestion)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">{suggestion.reason}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">why this capsule</summary>
              <p className="mt-1 text-xs leading-5 text-slate-600">{suggestion.whyThisCapsule}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{suggestion.whatItChangesForAgent}</p>
            </details>
            <button type="button" onClick={() => onAdd(suggestion)} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AssistantMarkdown({ text, messageId }: { text: string; messageId?: string }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-slate-800" data-testid="praxis-answer-markdown" data-selection-zone="assistant-answer" data-selection-message-id={messageId}>
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
        'praxis-card-panel relative min-w-0 flex-1 basis-48 rounded-lg border p-3 shadow-sm transition',
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
        <span className="rounded bg-white px-1.5 py-0.5">{capsule.code}</span>
        {reviewCategory ? <span className="rounded bg-white px-1.5 py-0.5">review category</span> : null}
      </div>
    </article>
  );
}

function MobileCapsuleLane({
  title,
  capsules,
  onOpen,
}: {
  title: string;
  capsules: ActiveCapsuleChip[];
  onOpen: (capsule: ActiveCapsuleChip) => void;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{title}</p>
      <div className="mt-2 grid gap-2">
        {capsules.length ? capsules.map((capsule) => (
          <button
            key={capsule.id}
            type="button"
            onClick={() => onOpen(capsule)}
            className="capsule-chain-node flex min-h-12 items-center justify-between gap-3 rounded-md px-3 py-2 text-left"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{capsule.label}</span>
              <span className="block font-mono text-[10px] font-semibold uppercase text-slate-400">{capsuleRoleLabel(capsule.role)}</span>
            </span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--color-lab-cyan)]">{capsule.code}</span>
          </button>
        )) : (
          <span className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">No capsules in this lane.</span>
        )}
      </div>
    </section>
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
            <p className="mt-1 text-xs text-slate-500">Choose a capsule to add it by its saved category.</p>
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
    `Excerpt: ${text.slice(0, 520)}`,
  ].join('\n');
}

function quoteSelectedText(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n');
}

function getSelectionZoneElement(node: Node | null): HTMLElement | null {
  const element = node instanceof Element ? node : node?.parentElement;
  return element?.closest('[data-selection-zone]') ?? null;
}

function selectionZoneFromElement(element: HTMLElement | null): SelectionZone | null {
  const zone = element?.dataset.selectionZone;
  if (
    zone === 'assistant-answer'
    || zone === 'source-preview'
    || zone === 'repository-text'
    || zone === 'source-pack'
    || zone === 'memo-text'
  ) {
    return zone;
  }
  return null;
}

function sourceTypeForSelectionZone(zone: SelectionZone | null): 'assistant-message' | 'document-selection' | 'manual-note' {
  if (zone === 'assistant-answer' || zone === 'source-preview') return 'assistant-message';
  if (zone === 'memo-text') return 'manual-note';
  return 'document-selection';
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
      userRating: null,
      averageRating: null,
      ratingCount: 0,
    },
    access: {
      visibility: 'public',
      allowDownload: false,
      allowClone: true,
      allowCommunityRating: false,
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

function buildCapsuleUsefulnessRating(capsule: PraxisCapsuleSummary, mutable: boolean): CapsuleUsefulnessRating {
  const isStarter = Boolean(starterDefinitionForCapsule(capsule));
  const enabled = mutable && capsule.access?.allowCommunityRating !== false;
  return {
    userRating: typeof capsule.community?.userRating === 'number' ? capsule.community.userRating : null,
    averageRating: typeof capsule.community?.averageRating === 'number' ? capsule.community.averageRating : null,
    ratingCount: Math.max(0, capsule.community?.ratingCount ?? 0),
    enabled,
    disabledReason: enabled ? null : isStarter && !mutable
      ? 'Save or fork this starter before rating usefulness.'
      : 'Community usefulness rating is disabled for this capsule.',
  };
}

function buildCapsuleEnrichmentReceipt(capsule: PraxisCapsuleSummary | null): CapsuleEnrichmentReceipt {
  const memoryIds = capsule?.coreRefs.memoryCoreId ? [capsule.coreRefs.memoryCoreId] : [];
  return {
    canonicalStatus: 'firestore-canonical',
    firestore: 'ready',
    cognee: 'disabled',
    graphiti: 'deferred',
    memoryHitCount: memoryIds.length,
    memoryItemIds: memoryIds,
    warnings: [],
    writebackProposalIds: [],
  };
}

function capsuleQualityAuditForSummary(capsule: PraxisCapsuleSummary | null): CapsuleQualityAuditResult | null {
  const starterDefinition = starterDefinitionForCapsule(capsule);
  return starterDefinition ? runCapsuleStarterQualityAudit(starterDefinition) : null;
}

function capsuleImprovementProposalsForSummary(capsule: PraxisCapsuleSummary | null): CapsuleImprovementProposal[] {
  const audit = capsuleQualityAuditForSummary(capsule);
  return audit ? proposeCapsuleImprovementsFromQualityAudit(audit, { evidenceSourceIds: [`audit:${audit.starterId}`], generatedBy: 'quality-audit' }).slice(0, 4) : [];
}

function isPaidSubscription(tier: string | null | undefined): boolean {
  return tier === 'analyst' || tier === 'team' || tier === 'enterprise';
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

function capsuleSuggestionInput(capsule: PraxisCapsuleSummary) {
  const starterDefinition = starterDefinitionForCapsule(capsule);
  return {
    capsuleId: capsule.capsuleId,
    label: capsule.label,
    summary: starterDefinition?.summary ?? capsule.searchMatchReason ?? capsuleCategoryMeta(capsule).summary,
    tags: capsule.community?.tags ?? starterDefinition?.tags ?? [],
    category: capsuleCategory(capsule),
    sourcePosture: capsuleSourcePosture(capsule),
    readiness: starterDefinition ? `${starterDefinition.readinessStars}/5` : capsule.health?.score ? `${capsule.health.score}/100` : capsule.trust?.label ?? 'review before use',
    recommendedToolIds: starterDefinition?.recommendedToolIds ?? capsule.coreRefs.toolCoreIds ?? [],
    capsule,
  };
}

function capsuleGovernanceBadges(capsule: PraxisCapsuleSummary): Array<{ label: string; value: string; tone: string }> {
  const meta = capsuleCategoryMeta(capsule);
  const starter = meta.starterDefinition;
  const audit = capsuleQualityAuditForSummary(capsule);
  const ontology = [
    meta.taxonomy.types[0]?.label,
    meta.taxonomy.domains[0]?.label,
    meta.taxonomy.policyTeams[0]?.label,
  ].filter(Boolean).join(' / ') || 'Ontology pending';
  const reviewGate = starter?.deviceProfile?.humanReviewGate
    ?? starter?.agentWorkflow.approvalNotes
    ?? capsule.health?.warnings?.[0]
    ?? 'Review card clear';
  const graphStatus = capsule.coreRefs.graphCoreId ? `Approved graph ${capsule.coreRefs.graphCoreId}` : 'Graph proposal pending';
  const sourceability = audit ? `${Math.round(audit.scores.sourceability * 100)} sourceability` : 'Review card pending';
  return [
    { label: 'Gate', value: reviewGate, tone: 'border-teal-200 bg-teal-50 text-teal-800' },
    { label: 'Ontology', value: ontology, tone: 'border-sky-200 bg-sky-50 text-sky-800' },
    { label: 'Advisory', value: 'Firestore canonical; graph and memory enrichment advisory', tone: 'border-slate-200 bg-slate-50 text-slate-700' },
    { label: 'Graph proposal', value: graphStatus, tone: 'border-violet-200 bg-violet-50 text-violet-800' },
    { label: 'Review card', value: sourceability, tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  ];
}

function CapsuleGovernanceBadgeRail({ capsule, compact = false }: { capsule: PraxisCapsuleSummary; compact?: boolean }) {
  const badges = capsuleGovernanceBadges(capsule);
  return (
    <div
      className={cn('flex flex-wrap gap-1.5', compact ? 'mt-2' : 'mt-4')}
      data-testid="capsule-governance-badges"
      aria-label={`${capsule.label} governance badges`}
    >
      {badges.slice(0, compact ? 3 : badges.length).map((badge) => (
        <span
          key={badge.label}
          title={badge.value}
          className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', badge.tone)}
        >
          {badge.label}
          <span className="sr-only">: {badge.value}</span>
        </span>
      ))}
    </div>
  );
}

function renderCapsuleCategoryIcon(category: CapsuleStarterCategory | 'custom', className: string) {
  if (category === 'situation') return <MapIcon className={className} />;
  if (category === 'tool') return <BrainCircuit className={className} />;
  if (category === 'output') return <Clipboard className={className} />;
  if (category === 'user') return <ShieldCheck className={className} />;
  return <FileText className={className} />;
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
    .slice(0, 12);
  return items.length ? items : capsuleDomainFilters
    .filter((item) => item.id !== 'all')
    .slice(0, 10)
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
    return stats.domains
      .filter((item) => item.repairState)
      .reduce((sum, item) => sum + item.count, 0);
  }
  const domainCount = stats.domains.find((item) => item.id === domainFilter)?.count ?? 0;
  const teamCount = stats.policyTeams.find((item) => item.id === domainFilter)?.count ?? 0;
  return Math.max(domainCount, teamCount);
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
  const filtered = capsules
    .filter((capsule) => {
      const isArchived = Boolean(capsule.archivedAt);
      if (typeFilter === 'archived') {
        if (!isArchived) return false;
      } else if (isArchived || !strictCapsuleTypeFilter(capsule, typeFilter)) {
        return false;
      }
      if (!capsuleMatchesDomain(capsule, domainFilter)) return false;
      if (!capsuleMatchesPolicyTeam(capsule, policyTeamFilter)) return false;
      if (!clean) return true;
      return true;
    })
    .map((capsule) => ({ ...capsule, searchMatchReason: null }));
  if (!clean) return filtered.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const capsuleBySearchId = new Map(filtered.map((capsule) => [`capsule:${capsule.capsuleId}`, capsule]));
  const rankedCapsules: PraxisCapsuleSummary[] = [];
  for (const result of rankAppSearchItems(query, filtered.map(capsuleSummarySearchItem))) {
    const capsule = capsuleBySearchId.get(result.id);
    if (capsule) rankedCapsules.push({ ...capsule, searchMatchReason: capsuleSearchMatchReason(result) });
  }
  return rankedCapsules;
}

function filterStarterCapsules(query: string, typeFilter: string, domainFilter: string, policyTeamFilter: string): PraxisCapsuleSummary[] {
  return filterUserCapsules(starterCapsuleSummaries, query, typeFilter, domainFilter, policyTeamFilter);
}

function capsuleSummarySearchItem(capsule: PraxisCapsuleSummary): AppSearchItemInput {
  const starter = starterDefinitionForCapsule(capsule);
  if (starter) return buildCapsuleSearchItem(starter);
  const taxonomy = resolveCapsuleTaxonomy(capsule);
  const meta = capsuleCategoryMeta(capsule);
  return {
    id: `capsule:${capsule.capsuleId}`,
    label: capsule.label,
    description: capsule.scope || meta.summary,
    kind: capsuleCategory(capsule) === 'output' ? 'Output' : 'Capsule',
    href: '/app/capsules',
    keywords: [
      capsule.capsuleId,
      capsule.label,
      capsule.scope,
      ...(capsule.community?.tags ?? []),
      ...(capsule.coreRefs.sourceCoreIds ?? []),
      ...(capsule.coreRefs.documentCoreIds ?? []),
      ...(capsule.coreRefs.toolCoreIds ?? []),
      ...(capsule.coreRefs.outputCoreIds ?? []),
      ...(capsule.coreRefs.productCoreIds ?? []),
    ].filter(Boolean),
    fields: [
      { name: 'title', text: `${capsule.label} ${capsule.capsuleId}`, weight: 1_000 },
      { name: 'type', text: taxonomy.types.map((item) => `${item.id} ${item.label}`).join(' '), weight: 760 },
      { name: 'domain', text: taxonomy.domains.map((item) => `${item.id} ${item.label}`).join(' '), weight: 720 },
      { name: 'team', text: taxonomy.policyTeams.map((item) => `${item.id} ${item.label}`).join(' '), weight: 700 },
      { name: 'source pack', text: (capsule.coreRefs.sourceCoreIds ?? []).join(' '), weight: 620 },
      { name: 'output target', text: [...(capsule.coreRefs.outputCoreIds ?? []), ...(capsule.coreRefs.productCoreIds ?? [])].join(' '), weight: 610 },
      { name: 'description', text: [capsule.scope, meta.summary, meta.detail, ...(capsule.community?.tags ?? [])].join(' '), weight: 420 },
    ],
  };
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
    return taxonomy.domains.some((domain) => domain.repairState);
  }
  return domainOrPolicyTeamMatchesCapsule(capsule, domainFilter);
}

function domainOrPolicyTeamMatchesCapsule(capsule: PraxisCapsuleSummary, domainFilter: string): boolean {
  const taxonomy = resolveCapsuleTaxonomy(capsule);
  return taxonomy.domains.some((domain) => domain.id === domainFilter) ||
    taxonomy.policyTeams.some((team) => team.id === domainFilter);
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
    { id: 'agent-runs', label: 'Agents', value: agentRunCount || PRAXIS_POLICY_AGENTS.filter((agent) => agent.readiness === 'live').length, filter: 'agents', icon: Sparkles },
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
    <div className="praxis-workbench-panel rounded-lg border-dashed p-6 text-sm font-semibold text-slate-500">
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
  const activeFilterLabels = [
    query?.trim() ? `query:${query.trim()}` : null,
    typeId !== 'all' ? `type:${typeId}` : null,
    domainId !== 'all' ? `domain:${domainId}` : null,
    policyTeamId !== 'all' ? `team:${policyTeamId}` : null,
  ].filter((label): label is string => Boolean(label));

  return (
    <div className="mt-4 grid gap-3" data-testid="capsule-taxonomy-filter-bar">
      {onQuery ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query ?? ''}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search capsules by title, role, domain, source posture"
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
      <div
        className="receipt-slip flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 font-mono text-[11px]"
        data-testid="capsule-filter-receipt"
      >
        <span className="font-semibold uppercase tracking-[0.14em] text-slate-400">Filter receipt</span>
        <span className="font-semibold text-slate-700">
          {activeFilterLabels.length ? activeFilterLabels.join(' / ') : 'all capsules'} / {stats.visibleCapsules} catalogued
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-3" data-testid="capsule-taxonomy-surface">
        <CategoryAxisPanel
          label="Types"
          items={taxonomyTypeItems(stats)}
          selectedId={typeId}
          onSelect={onType}
          showRepairStates={showRepairStates}
          visibleTotalCount={stats.visibleCapsules}
        />
        <CategoryAxisPanel
          label="Domains"
          items={taxonomyDomainItems(stats, showRepairStates)}
          selectedId={domainId}
          onSelect={onDomain}
          showRepairStates={showRepairStates}
          visibleTotalCount={stats.visibleCapsules}
        />
        <CategoryAxisPanel
          label="Policy Teams"
          items={taxonomyPolicyTeamItems(stats, showRepairStates)}
          selectedId={policyTeamId}
          onSelect={onPolicyTeam}
          showRepairStates={showRepairStates}
          visibleTotalCount={stats.visibleCapsules}
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
  visibleTotalCount,
}: {
  label: string;
  items: Array<{ id: string; label: string; count: number; repairState?: 'custom' | 'unknown' }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  showRepairStates: boolean;
  visibleTotalCount?: number;
}) {
  const visibleItems = showRepairStates ? items : items.filter((item) => !item.repairState);
  const filterCountTotal = visibleTotalCount ?? visibleItems.length;
  return (
    <section className="capsule-taxonomy-panel-solid praxis-workbench-panel p-3" aria-label={`${label} category map`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-900">{label}</p>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{filterCountTotal}</span>
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

function CapsuleStudioCommandBand({
  capsule,
  visibleCount,
  userCapsuleCount,
  archivedCount,
  reviewDiffCount,
  onCreate,
  onUseInAsk,
  onReview,
}: {
  capsule: PraxisCapsuleSummary | null;
  visibleCount: number;
  userCapsuleCount: number;
  archivedCount: number;
  reviewDiffCount: number;
  onCreate: () => void;
  onUseInAsk: () => void;
  onReview: () => void;
}) {
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  return (
    <section
      className="mt-4 overflow-hidden rounded-xl border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper)] shadow-sm shadow-[rgba(164,73,46,0.10)]"
      data-testid="capsule-studio-command-band"
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Capsule Studio</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            {capsule ? `Using ${capsule.label}` : 'Choose a capsule to use.'}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Search the library, build a better private capsule, use it in Ask, and review proposed improvements before anything becomes canonical. New capsules start private.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" />
              Build capsule
            </button>
            <button type="button" onClick={onUseInAsk} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ArrowUp className="h-4 w-4" />
              Use in Ask
            </button>
            <button type="button" onClick={onReview} className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-clay)]/30 bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-oxide)] hover:bg-[color:var(--color-mineral-soft)]">
              <Sparkles className="h-4 w-4" />
              Review improvements
            </button>
          </div>
        </div>
        <div className="grid min-w-[260px] grid-cols-2 gap-2 text-center">
          <Metric label="Available" value={visibleCount} />
          <Metric label="Workspace" value={userCapsuleCount} />
          <Metric label="Review queue" value={reviewDiffCount} />
          <Metric label="Archived" value={archivedCount} />
        </div>
      </div>
      <div className="grid border-t border-[color:var(--color-clay)]/15 bg-white text-[11px] font-semibold text-slate-600 sm:grid-cols-4">
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

function CapsuleStudioWorkspace({
  capsule,
  policyTeam,
  recommendations,
  repositoryDocuments,
  repositoryLoading,
  agentRunCount,
  runtimeProof,
  chatMessages,
  guidePrompt,
  isAuthenticated,
  isStreaming,
  onDetails,
  onSources,
  onImprove,
  onUseInAsk,
  onPrompt,
  onAskCapsule,
}: {
  capsule: PraxisCapsuleSummary | null;
  policyTeam: PolicyTeamCategory | null;
  recommendations: CapsuleToolRecommendation[];
  repositoryDocuments: RepositoryDocument[];
  repositoryLoading: boolean;
  agentRunCount: number;
  runtimeProof: RuntimeProof;
  chatMessages: ChatMessage[];
  guidePrompt: string;
  isAuthenticated: boolean;
  isStreaming: boolean;
  onDetails: () => void;
  onSources: () => void;
  onImprove: () => void;
  onUseInAsk: () => void;
  onPrompt: (value: string) => void;
  onAskCapsule: (question: string) => void;
}) {
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  const state = capsule ? capsuleState(capsule as PraxisCapsuleSummary) : 'empty';
  const meta = capsule ? capsuleCategoryMeta(capsule) : null;
  const sourcePosture = capsule ? capsuleSourcePosture(capsule) : 'Choose a capsule to inspect source coverage.';
  const reasoningStyle = capsule ? capsuleReasoningStyle(capsule) : 'No reasoning device selected.';
  const warnings = capsule?.health?.warnings ?? [];
  const richProfile = meta?.starterDefinition?.richProfile ?? null;
  const outputTargets = meta?.starterDefinition?.outputProductIds ?? capsule?.coreRefs.outputCoreIds ?? [];
  const recentChatMessages = chatMessages.slice(-3).filter((message) => message.text.trim());

  return (
    <section className="specimen-card min-w-0 rounded-lg p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="capsule-studio-workspace">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Selected capsule</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{capsule?.label ?? 'Choose a capsule'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {richProfile?.purpose ?? meta?.detail ?? 'Choose a capsule from the library, then build sources, tools, and outputs around it.'}
          </p>
        </div>
        <CapsuleStateBadge state={state} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <Metric label="Sources" value={counts.sources + counts.documents} />
        <Metric label="Tools" value={counts.tools} />
        <Metric label="Outputs" value={counts.outputs} />
        <Metric label="Runs" value={agentRunCount} />
      </div>

      <div className="mt-4 grid gap-3" data-testid="capsule-studio-source-section">
        <section className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase text-slate-400">Source coverage</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{sourcePosture}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onSources} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Sources</button>
            <button type="button" onClick={onImprove} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Improve safely</button>
          </div>
          <div className="mt-3 grid gap-2">
            {repositoryLoading ? <CapsuleEmptyState label="Loading sources..." /> : null}
            {!repositoryLoading && !repositoryDocuments.length ? <p className="text-xs text-slate-500">No capsule documents loaded yet.</p> : null}
            {repositoryDocuments.slice(0, 3).map((document) => (
              <div key={document.id} className="rounded-md border border-slate-200 px-3 py-2" data-selection-zone="repository-text">
                <p className="truncate text-xs font-semibold text-slate-800">{document.title}</p>
                <p className="mt-1 text-[11px] text-slate-400">{document.status} / {document.chunkCount ?? 0} chunks / {document.fileType}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Tools and thinking devices</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{reasoningStyle}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(recommendations.length ? recommendations.map((item) => item.tool.shortLabel) : ['Sourceability', 'Freshness', 'Causality']).slice(0, 5).map((item) => (
                <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{item}</span>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Output targets</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{outputTargets.length ? outputTargets.join(', ') : policyTeam?.outputProductIds.slice(0, 2).join(', ') || 'Memo, brief, handover, or export.'}</p>
          </section>
        </div>

        {warnings.length ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase text-amber-800">Gaps to review</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-900">
              {warnings.slice(0, 4).map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </section>
        ) : null}

        <RuntimeProofStrip proof={runtimeProof} />
      </div>

      <section className="mt-4 rounded-lg border border-slate-200 p-3" data-testid="capsule-studio-chat-panel">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Capsule chat</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Ask about this capsule without opening the global Ask composer.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onDetails} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Details</button>
            <button type="button" onClick={onUseInAsk} className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">Use in Ask</button>
          </div>
        </div>
        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
          {recentChatMessages.length ? recentChatMessages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={cn('rounded-md px-3 py-2 text-xs leading-5', message.role === 'user' ? 'ml-6 bg-slate-950 text-white' : 'mr-6 border border-slate-200 bg-slate-50 text-slate-700')}>
              {message.role === 'assistant' ? <AssistantMarkdown text={message.text || (isStreaming ? 'Reading the capsule...' : '')} /> : message.text}
            </article>
          )) : (
            <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
              Ask about source gaps, use cases, risks, or the next review action. {isAuthenticated ? 'This stays in the capsule inspector thread.' : 'Submitting signs you in before an AI response runs.'}
            </p>
          )}
        </div>
        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            onAskCapsule(guidePrompt);
          }}
        >
          <textarea
            value={guidePrompt}
            onChange={(event) => onPrompt(event.target.value)}
            rows={3}
            placeholder="Ask how to use this capsule, what sources are missing, or what to review next"
            className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm leading-5 text-slate-800 outline-none focus:border-[color:var(--color-clay)]"
          />
          <div className="mt-2 flex justify-end">
            <button type="submit" disabled={isStreaming || !guidePrompt.trim()} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
              Send
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}

function CapsuleStudioReviewQueue({
  capsule,
  reviewDiffs,
  agentRuns,
  runtimeProof,
  repositoryDocuments,
  onReview,
  onSources,
  onDownload,
  onMakePrivate,
  onMakePublic,
  onApply,
  onReject,
}: {
  capsule: PraxisCapsuleSummary | null;
  reviewDiffs: CapsuleFactoryReviewDiff[];
  agentRuns: AgentRunSummary[];
  runtimeProof: RuntimeProof;
  repositoryDocuments: RepositoryDocument[];
  onReview: () => void;
  onSources: () => void;
  onDownload: () => void;
  onMakePrivate: () => void;
  onMakePublic: () => void;
  onApply: (diff: CapsuleFactoryReviewDiff) => void;
  onReject: (diff: CapsuleFactoryReviewDiff) => void;
}) {
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  const openDiffs = reviewDiffs.filter((diff) => diff.reviewState !== 'rejected').slice(0, 3);
  const fallbackGaps = [
    counts.sources + counts.documents ? null : 'Add sources before relying on this capsule.',
    counts.tools ? null : 'Attach thinking devices for repeatable work.',
    counts.outputs ? null : 'Choose the output target this capsule should produce.',
  ].filter(Boolean) as string[];

  return (
    <aside className="specimen-card min-w-0 rounded-lg p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="capsule-studio-review-queue">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Review queue</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">Trust before use</h3>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{openDiffs.length} open</span>
      </div>

      <div className="mt-4 grid gap-2">
        <button type="button" onClick={onReview} className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Review improvements</button>
        <button type="button" onClick={onSources} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sources</button>
      </div>

      <div className="mt-4 grid gap-2">
        {openDiffs.length ? openDiffs.map((diff) => (
          <article key={diff.diffId} className="rounded-lg border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">{diff.laneTitle}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500" data-selection-zone="memo-text">{diff.proposedCapsule.summary}</p>
              </div>
              <span className={cn('rounded-md px-2 py-1 text-[11px] font-semibold', factoryReviewStateClass(diff.reviewState))}>{diff.reviewState}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={diff.reviewState === 'applied'} onClick={() => onApply(diff)} className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-default disabled:bg-slate-300">Apply reviewed diff</button>
              <button type="button" disabled={diff.reviewState === 'applied'} onClick={() => onReject(diff)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-default disabled:text-slate-300">Reject</button>
            </div>
          </article>
        )) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs leading-5 text-slate-500">
            {(fallbackGaps.length ? fallbackGaps : ['No pending improvements. Run review before publishing or handing this capsule to agents.']).map((gap) => (
              <p key={gap}>{gap}</p>
            ))}
          </div>
        )}
      </div>

      <section className="mt-4 rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-semibold uppercase text-slate-400">Recent factory runs</p>
        <div className="mt-2 grid gap-2">
          {agentRuns.slice(0, 3).map((run) => (
            <p key={run.runId} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600">
              <span className="font-semibold text-slate-800">{run.policyAgentLabel ?? run.policyAgentId ?? 'Capsule agent'}</span> / {run.status}
            </p>
          ))}
          {!agentRuns.length ? <p className="text-xs text-slate-500">No recent capsule-factory runs.</p> : null}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-semibold uppercase text-slate-400">Privacy and export</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {capsule?.access?.visibility ?? 'private'} / {repositoryDocuments.length || runtimeProof.sourceCount} attached source records / .praxis export available after review.
        </p>
        <div className="mt-3 grid gap-2">
          <button type="button" onClick={onDownload} disabled={!capsule} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">Download .praxis</button>
          {capsule?.access?.visibility === 'public' ? (
            <button type="button" onClick={onMakePrivate} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Make private</button>
          ) : (
            <button type="button" onClick={onMakePublic} disabled={!capsule} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">Make public</button>
          )}
        </div>
      </section>

      <div className="mt-4 grid gap-2">
        {capsuleStudioReviewLanes.map((lane) => (
          <p key={lane.id} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600">
            <span className="font-semibold text-slate-800">{lane.label}</span>: {lane.helper}
          </p>
        ))}
      </div>
    </aside>
  );
}

function CapsuleFactorySidebar({
  activeLane,
  onSelect,
}: {
  activeLane: CapsuleFactoryLaneId;
  onSelect: (item: (typeof factoryBuilderLanes)[number]) => void;
}) {
  return (
    <aside className="dossier-spine rounded-lg border p-2 shadow-sm shadow-slate-950/[0.03]" data-testid="capsule-studio-secondary-rail">
      <p className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Capsules</p>
      <nav aria-label="Capsule management views" className="space-y-1">
        {factoryBuilderLanes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold',
              activeLane === item.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
            )}
          >
            <span className={cn('h-2 w-2 shrink-0 rounded-full', activeLane === item.id ? 'bg-white/80' : 'bg-slate-300')} />
            <span className="min-w-0 truncate">{item.title}</span>
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
  onCreate,
  onInspect,
  onReview,
  onSubmitImprovement,
  onAskCapsule,
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
  onCreate: () => void;
  onInspect: () => void;
  onReview: (lane: (typeof factoryBuilderLanes)[number]) => void;
  onSubmitImprovement: () => void;
  onAskCapsule: (question: string) => void;
  onApply: (diff: CapsuleFactoryReviewDiff) => void;
  onReject: (diff: CapsuleFactoryReviewDiff) => void;
}) {
  const laneLabel = factoryBuilderLanes.find((item) => item.id === activeLane)?.title ?? 'Capsule review';
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  const openDiffs = reviewDiffs.filter((diff) => diff.reviewState !== 'rejected').slice(0, 3);
  return (
    <section className="specimen-card rounded-lg p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="capsule-studio-workspace">
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
      {activeLane === 'sources' ? (
        <CapsuleFactoryRepositoryLane
          capsule={capsule}
          documents={repositoryDocuments}
          loading={repositoryLoading}
          proof={runtimeProof}
        />
      ) : activeLane === 'create' ? (
        <div className="mt-4 grid gap-3" data-testid="capsule-factory-create-lane">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Build your own capsule</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Start from a name, need/purpose, notes or links, policy team, and private visibility. Public sharing remains a later explicit visibility action.
            </p>
            <button type="button" onClick={onCreate} className="mt-3 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
              Build your own capsule
            </button>
          </div>
        </div>
      ) : activeLane === 'inspect' ? (
        <CapsuleFactoryInspectLane
          capsule={capsule}
          counts={counts}
          onInspect={onInspect}
          onAskCapsule={onAskCapsule}
        />
      ) : activeLane === 'improve' ? (
        <div className="mt-4 grid gap-3" data-testid="capsule-factory-improve-lane">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-900">Review-gated improvement</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Improve safely by creating a diff proposal first. Submit for improvement can queue the capsule-factory agent, but every mutation still waits for review and apply.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onReview(factoryBuilderLanes.find((lane) => lane.id === 'improve') ?? factoryBuilderLanes[0])} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                Improve safely
              </button>
              <button type="button" onClick={onSubmitImprovement} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Submit for improvement
              </button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {factoryBuilderLanes.filter((lane) => lane.id !== 'create').map((lane) => (
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
        </div>
      ) : (
      <div className="mt-4 grid gap-2 md:grid-cols-3" data-testid="capsule-studio-library">
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
        <div className="mt-4 grid gap-2" data-testid="capsule-studio-review-queue">
          {openDiffs.map((diff) => (
            <article key={diff.diffId} className="rounded-lg border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900">{diff.laneTitle}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500" data-selection-zone="memo-text">{diff.proposedCapsule.summary}</p>
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

function CapsuleFactoryInspectLane({
  capsule,
  counts,
  onInspect,
  onAskCapsule,
}: {
  capsule: PraxisCapsuleSummary | null;
  counts: { sources: number; documents: number; tools: number; outputs: number };
  onInspect: () => void;
  onAskCapsule: (question: string) => void;
}) {
  const meta = capsule ? capsuleCategoryMeta(capsule) : null;
  const starter = meta?.starterDefinition;
  const readinessLabel = capsule?.trust?.label ?? (capsule?.health?.score ? `${capsule.health.score}/100` : 'starter readiness');
  return (
    <div className="mt-4 grid gap-3" data-testid="capsule-factory-inspect-lane">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">Details</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              See how the capsule is made: source pack, core refs, thinking devices, outputs, review gates, AI use guidance, starter excerpts, and trust/readiness.
            </p>
          </div>
          <button type="button" onClick={onInspect} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
            Details
          </button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <Metric label="Source pack" value={counts.sources + counts.documents} />
          <Metric label="Core refs" value={(capsule?.coreRefs.toolCoreIds?.length ?? 0) + (capsule?.coreRefs.outputCoreIds?.length ?? 0)} />
          <Metric label="Thinking devices" value={counts.tools} />
          <Metric label="Outputs" value={counts.outputs} />
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <FactoryCommandCell label="Review gates" value={starter?.humanReview?.label ?? 'human approval required'} />
        <FactoryCommandCell label="Trust/readiness" value={readinessLabel} />
        <FactoryCommandCell label="Starter excerpts" value={starter?.sourcePack[0]?.label ?? meta?.summary ?? 'select a capsule'} />
      </div>
      <div className="rounded-lg border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper)] p-3" data-testid="capsule-studio-chat-panel">
        <p className="text-xs font-semibold text-slate-900">Chat with this capsule</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-600">
          Capsule chat is scoped to the selected capsule. It can explain use, gaps, and anatomy; any mutation stays review-gated.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['What is inside?', 'Find source gaps', 'How should I use this?', 'Improve safely'].map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onAskCapsule(question)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {question}
            </button>
          ))}
        </div>
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

function WorkbenchDiagnosticsStrip({
  flags,
  onOpen,
}: {
  flags: WorkbenchDiagnosticFlag[];
  onOpen: () => void;
}) {
  const warnCount = flags.filter((flag) => flag.tone === 'warn').length;
  const watchCount = flags.filter((flag) => flag.tone === 'watch').length;
  const label = warnCount ? `${warnCount} red flag${warnCount === 1 ? '' : 's'}` : watchCount ? `${watchCount} watch item${watchCount === 1 ? '' : 's'}` : 'No red flags';
  return (
    <button
      type="button"
      data-testid="workbench-red-flags"
      onClick={onOpen}
      className="receipt-slip inline-flex items-center gap-2 rounded-md px-3 py-2 font-mono text-[11px] font-semibold hover:border-[color:var(--color-clay)]/40"
    >
      <Monitor className="h-4 w-4 text-[color:var(--color-oxide)]" />
      Diagnostics: {label}
    </button>
  );
}

function WorkbenchDiagnosticsDrawer({
  flags,
  runtimeProof,
  onClose,
}: {
  flags: WorkbenchDiagnosticFlag[];
  runtimeProof: RuntimeProof;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/25" data-testid="workbench-diagnostics-drawer">
      <aside className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-oxide)]">Read-only diagnostics</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Workbench red flags</h2>
            </div>
            <button type="button" aria-label="Close workbench diagnostics" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid gap-3 overflow-y-auto p-5">
          {flags.map((flag) => (
            <section key={flag.label} className={cn(
              'rounded-lg border p-3',
              flag.tone === 'ok' && 'border-emerald-200 bg-emerald-50/60',
              flag.tone === 'watch' && 'border-amber-200 bg-amber-50/60',
              flag.tone === 'warn' && 'border-red-200 bg-red-50/60',
            )}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">{flag.label}</p>
                <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-semibold text-slate-600">{flag.status}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{flag.detail}</p>
            </section>
          ))}
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Runtime receipt</p>
            <div className="mt-2 grid gap-2">
              <ProofCell label="active capsule" value={runtimeProof.activeCapsule} />
              <ProofCell label="graph mode" value={runtimeProof.graphMode} />
              <ProofCell label="memory posture" value={runtimeProof.cogneeMode} />
              <ProofCell label="last Ask receipt" value={runtimeProof.lastAskReceipt} />
            </div>
          </section>
        </div>
      </aside>
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
  onView,
  onInspect,
  onImprove,
  onRateUsefulness,
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
  onView: (capsule: PraxisCapsuleSummary) => void;
  onInspect: (capsule: PraxisCapsuleSummary) => void;
  onImprove: (capsule: PraxisCapsuleSummary) => void;
  onRateUsefulness?: (capsule: PraxisCapsuleSummary, rating: number) => void;
  onDownload: (capsule: PraxisCapsuleSummary) => void;
  onMakePrivate?: (capsule: PraxisCapsuleSummary) => void;
  onMakePublic?: (capsule: PraxisCapsuleSummary) => void;
  onDelete?: (capsule: PraxisCapsuleSummary) => void;
  onArchive: (capsule: PraxisCapsuleSummary) => void;
}) {
  return (
    <section className="praxis-shelf-panel cartographic-grid mt-6 p-3" data-testid={title === 'Intellectual Devices' ? 'intellectual-devices-shelf' : 'featured-expert-picks-shelf'}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">{title}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{subtitle}</h3>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
          {capsules.length} visible under current filter
        </span>
      </div>
      <div className="mt-3 grid w-full min-w-0 gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(3,minmax(0,1fr))]">
        {capsules.map((capsule) => (
          <div key={capsule.capsuleId} className="min-w-0" data-testid={`featured-expert-pick-${capsule.capsuleId}`}>
            <CapsuleCard
              capsule={capsule}
              active={false}
              mutable={false}
              compact
              expertPick
              onSelect={() => onSelect(capsule)}
              onAdd={() => onAdd(capsule)}
              onView={() => onView(capsule)}
              onInspect={() => onInspect(capsule)}
              onImprove={() => onImprove(capsule)}
              onRateUsefulness={(rating) => onRateUsefulness?.(capsule, rating)}
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

function CapsuleUsefulnessRatingControl({
  rating,
  compact = false,
  testId,
  onRate,
}: {
  rating: CapsuleUsefulnessRating;
  compact?: boolean;
  testId: string;
  onRate: (rating: number) => void;
}) {
  const visibleValue = rating.userRating ?? rating.averageRating ?? 0;
  return (
    <span className={cn('mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600', !compact && 'rounded-lg border border-slate-200 bg-white p-3')} data-testid={testId}>
      <span className="font-semibold text-slate-700">Helped me/agent do useful work</span>
      <span className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={!rating.enabled}
            title={rating.enabled ? `Rate usefulness ${value}/5` : rating.disabledReason ?? 'Rating disabled'}
            aria-label={rating.enabled ? `Rate usefulness ${value}/5` : rating.disabledReason ?? 'Rating disabled'}
            onClick={(event) => {
              event.stopPropagation();
              if (rating.enabled) onRate(value);
            }}
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-sm text-slate-300 hover:bg-slate-50',
              rating.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
            )}
          >
            <Star className={cn('h-3.5 w-3.5', value <= visibleValue && 'fill-amber-400 text-amber-500')} />
          </button>
        ))}
      </span>
      <span className="font-mono text-[10px] text-slate-500">
        {rating.averageRating ? `${rating.averageRating.toFixed(1)} avg` : 'no avg'} · {rating.ratingCount} ratings
      </span>
      {!rating.enabled && rating.disabledReason ? <span className="text-[10px] font-semibold text-slate-400">{rating.disabledReason}</span> : null}
    </span>
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
  onView,
  onInspect,
  onImprove,
  onRateUsefulness,
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
  onView: () => void;
  onInspect: () => void;
  onImprove: () => void;
  onRateUsefulness?: (rating: number) => void;
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
  const humanReview = meta.starterDefinition?.humanReview;
  const purposeLine = richProfile?.purpose ?? meta.summary;
  const bestNextAction = richProfile?.nextIdeas[0] ?? capsule.health?.warnings?.[0] ?? 'Inspect source gaps before relying on this capsule.';
  const usefulness = buildCapsuleUsefulnessRating(capsule, mutable);
  return (
    <article
      ref={setNodeRef}
      data-testid={`capsule-card-${capsule.capsuleId}`}
      data-capsule-type={meta.category}
      className={cn(
        'praxis-card-panel specimen-card od-praxis-card w-full overflow-hidden rounded-lg p-0 transition hover:-translate-y-0.5',
        compact ? 'min-h-[12rem]' : 'min-h-[13rem]',
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
              {renderCapsuleCategoryIcon(meta.category, 'h-4 w-4')}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">{capsule.label}</span>
              <span className="mt-1 block truncate text-[11px] font-semibold text-slate-500">{typeChip}</span>
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {expertPick ? <span className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white">Expert pick</span> : null}
            {humanReview ? (
              <span
                data-testid="capsule-human-reviewed-badge"
                title={humanReview.tooltip}
                className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-800"
              >
                {humanReview.label}
              </span>
            ) : null}
            <span className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', meta.soft)}>{capsuleRoleLabel(defaultRole)}</span>
          </span>
        </span>
        <span className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', meta.soft)}>{domainChip}</span>
          <span className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', domainAccent.soft)}>{domainAccent.label}</span>
          {deviceProfile ? <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">Thinking device</span> : null}
          <CapsuleStateBadge state={state} />
        </span>
        <CapsuleGovernanceBadgeRail capsule={capsule} compact />
        <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span>{policyTeamChip}</span>
          <span>quality {score}/100</span>
          <span>{counts.documents + counts.sources} source ref{counts.documents + counts.sources === 1 ? '' : 's'}</span>
          {counts.outputs ? <span>{counts.outputs} output{counts.outputs === 1 ? '' : 's'}</span> : null}
        </span>
        <span className="mt-3 block line-clamp-2 text-xs leading-5 text-slate-600">{purposeLine}</span>
        <span className="mt-2 block line-clamp-2 rounded-md bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700">
          Best next action: {bestNextAction}
          <span className="sr-only">Next: {bestNextAction}</span>
        </span>
        {capsule.searchMatchReason ? (
          <span className="mt-2 block rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
            {capsule.searchMatchReason}
          </span>
        ) : null}
      </button>
      <div className="px-3 pb-3">
      <CapsuleUsefulnessRatingControl
        rating={usefulness}
        compact
        testId="capsule-usefulness-rating"
        onRate={(rating) => onRateUsefulness?.(rating)}
      />
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
        <button type="button" onClick={onView} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Details</button>
        <button type="button" onClick={onInspect} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Inspect</button>
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
  onRateUsefulness,
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
  onRateUsefulness: (rating: number) => void;
  onRetryFocusedRun: () => void;
  onCancelFocusedRun: () => void;
  onDecideApproval: (approvalId: string, decision: 'approved' | 'rejected') => void;
  onAssignPolicyTeam: (category: PolicyTeamCategory) => void;
  onAttachTool: (recommendation: CapsuleToolRecommendation) => void;
}) {
  if (!capsule) return null;
  const counts = capsuleCounts(capsule);
  const state = capsuleState(capsule);
  const usefulness = buildCapsuleUsefulnessRating(capsule, true);
  const audit = capsuleQualityAuditForSummary(capsule);
  const enrichmentReceipt = buildCapsuleEnrichmentReceipt(capsule);
  const proposals = capsuleImprovementProposalsForSummary(capsule);
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
      <CapsuleUsefulnessRatingControl
        rating={usefulness}
        testId="capsule-inspector-usefulness-rating"
        onRate={onRateUsefulness}
      />
      <div className="mt-4 rounded-lg border border-slate-200 p-3">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Quality audit</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
          <span>Taxonomy {audit ? Math.round(audit.scores.taxonomy * 100) : 'n/a'}</span>
          <span>Sources {audit ? Math.round(audit.scores.sourceability * 100) : 'n/a'}</span>
          <span>Agent usability {audit ? Math.round(audit.scores.agentUsability * 100) : 'n/a'}</span>
          <span>Review gate {audit ? Math.round(audit.scores.reviewGate * 100) : 'n/a'}</span>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-slate-200 p-3">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Enrichment status</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Firestore canonical. Cognee advisory: {enrichmentReceipt.cognee}. Memory hits: {enrichmentReceipt.memoryHitCount}. Graphiti: {enrichmentReceipt.graphiti}.
        </p>
      </div>
      <div className="mt-3 rounded-lg border border-slate-200 p-3">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Proposed next improvements</p>
        <div className="mt-2 space-y-1.5">
          {(proposals.length ? proposals : [{ proposalId: 'no-proposals', target: 'suggestedNextActions', rationale: 'No review-gated proposal is needed from the current quality audit.', reviewStatus: 'proposed' }]).slice(0, 3).map((proposal) => (
            <p key={proposal.proposalId} className="rounded-md bg-slate-50 px-2 py-1.5 text-[11px] leading-5 text-slate-600">
              <span className="font-semibold text-slate-800">{proposal.target}</span>: {proposal.rationale}
            </p>
          ))}
        </div>
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
            <div key={document.id} className="rounded-md border border-slate-200 px-3 py-2" data-selection-zone="repository-text">
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
        <div className="grid gap-2 border-t border-[color:var(--color-clay)]/15 bg-white p-3 text-[11px]" data-testid="agent-context-receipt">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold uppercase tracking-[0.16em] text-slate-400">Context read by agent</p>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">{run.contextReceipt.sourcePosture ?? 'Baseline'}</span>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <ProofCell label="active capsule/chain" value={run.contextReceipt.activeCapsuleOrChain ?? run.capsuleId} />
            <ProofCell label="selected tools" value={run.contextReceipt.selectedTools.length ? run.contextReceipt.selectedTools.join(', ') : 'ask-praxis'} />
            <ProofCell label="output destination" value={run.contextReceipt.outputDestination?.replaceAll('_', ' ') ?? 'not selected'} />
            <ProofCell label="source receipts" value={String(run.contextReceipt.sourceCount ?? run.sourceCount ?? run.sourceReceiptIds?.length ?? 0)} />
            <ProofCell label="grounding posture" value={run.contextReceipt.groundingPosture ?? run.groundingPosture ?? 'No grounding metadata'} />
            <ProofCell label="degraded reason" value={run.contextReceipt.degradedReason ?? run.degradedReason ?? 'none'} />
          </div>
        </div>
      ) : null}
      <div className="border-t border-[color:var(--color-clay)]/15 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500" data-testid="agent-run-stream-state">
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
        <div className="grid gap-2 border-t border-[color:var(--color-clay)]/15 bg-white p-3">
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
    <div className="border-t border-[color:var(--color-clay)]/15 bg-white p-3">
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
      <section className="praxis-workbench-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-oxide)]">Build Capsule</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Build a capsule around the work.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">New capsules start private.</p>
          </div>
          <button type="button" aria-label="Close capsule builder" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {capsuleBuilderStarts.map((start) => (
            <button
              key={start.id}
              type="button"
              onClick={() => {
                if (start.id === 'sources') {
                  document.getElementById('capsule-builder-sources')?.focus();
                } else if (start.id === 'starter') {
                  onNotes(notes || 'Start from a starter, expert pick, or saved capsule: ');
                } else if (start.id === 'combine') {
                  onNotes(notes || 'Combine capsules: situation + source + tool + output. ');
                } else {
                  document.getElementById('capsule-builder-label')?.focus();
                }
              }}
              className="rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-[color:var(--color-clay)]/45 hover:bg-[color:var(--color-archive-paper-strong)]"
            >
              <span className="block text-sm font-semibold text-slate-950">{start.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{start.detail}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Capsule name</span>
            <input id="capsule-builder-label" value={label} onChange={(event) => onLabel(event.target.value)} placeholder="Director handover, Syria access brief, HR policy review..." className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-clay)]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Policy team preset</span>
            <select value={categoryId} onChange={(event) => onCategory(event.target.value)} className="praxis-select-control rounded-md px-3 py-2 text-sm outline-none">
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
            <textarea id="capsule-builder-sources" value={links} onChange={(event) => onLinks(event.target.value)} rows={3} placeholder="Paste URLs, Drive folders, source lists, or internal repository notes." className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-clay)]" />
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
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{capsule?.label ?? 'Choose a capsule'}</h3>
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
                <div className="min-w-0" data-selection-zone="repository-text">
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
          <article key={documentId} className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500" data-selection-zone="repository-text">
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
                  <div className="min-w-0" data-selection-zone="repository-text">
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
              <article key={documentId} className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500" data-selection-zone="repository-text">
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
  chatMessages,
  isAuthenticated,
  isStreaming,
  onClose,
  onImprove,
  onRepository,
  onAskCapsule,
  onRateUsefulness,
}: {
  capsule: PraxisCapsuleSummary | null;
  policyTeam: PolicyTeamCategory | null;
  chatMessages: ChatMessage[];
  isAuthenticated: boolean;
  isStreaming: boolean;
  onClose: () => void;
  onImprove: () => void;
  onRepository: () => void;
  onAskCapsule: (question: string) => void;
  onRateUsefulness: (rating: number) => void;
}) {
  const [inspectorPrompt, setInspectorPrompt] = useState('');
  const counts = capsule ? capsuleCounts(capsule) : { sources: 0, documents: 0, tools: 0, outputs: 0 };
  const state = capsule ? capsuleState(capsule) : 'empty';
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
  const humanReview = meta?.starterDefinition?.humanReview ?? null;
  const compatible = meta?.starterDefinition?.combinesWellWith
    .map((id) => CAPSULE_STARTER_DEFINITIONS.find((starter) => starter.starterId === id)?.label ?? id)
    .slice(0, 4) ?? [];
  const warnings = capsule?.health?.warnings ?? [];
  const usefulness = capsule ? buildCapsuleUsefulnessRating(capsule, true) : null;
  const audit = capsuleQualityAuditForSummary(capsule);
  const enrichmentReceipt = buildCapsuleEnrichmentReceipt(capsule);
  const proposals = capsuleImprovementProposalsForSummary(capsule);
  const sourcePosture = capsule ? capsuleSourcePosture(capsule) : 'No capsule selected';
  const reasoningStyle = capsule ? capsuleReasoningStyle(capsule) : 'No capsule selected';
  const bestNextAction = richProfile?.nextIdeas[0]
    ?? capsule?.health?.warnings?.[0]
    ?? starterActions[0]
    ?? 'Inspect source gaps before relying on this capsule.';
  const readinessLabel = capsule ? `${capsule.trust?.label ?? 'Trust pending'} / ${state}` : 'No capsule selected';
  const reviewGate = deviceProfile?.humanReviewGate
    ?? meta?.starterDefinition?.agentWorkflow.approvalNotes
    ?? (warnings.length ? 'Human review recommended before output use.' : 'Review gate clear for normal use.');
  const governanceBadges = capsule ? capsuleGovernanceBadges(capsule) : [];
  const recentChatMessages = chatMessages.slice(-4).filter((message) => message.text.trim());
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  function askFromInspector(question?: string) {
    const clean = (question ?? inspectorPrompt).trim();
    if (!clean || !capsule) return;
    onAskCapsule(clean);
    setInspectorPrompt('');
  }
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-40 bg-black/25"
      data-testid="capsule-inspector-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capsule-inspector-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="dossier-spine ml-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-oxide)]">Capsule inspector</p>
            <h2 id="capsule-inspector-title" className="mt-1 text-xl font-semibold leading-7 text-slate-950">{capsule?.label ?? 'No capsule selected'}</h2>
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
            {humanReview ? (
              <span
                data-testid="capsule-inspector-human-reviewed-badge"
                title={humanReview.tooltip}
                className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800"
              >
                {humanReview.label}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Metric label="Documents" value={counts.documents} />
          <Metric label="Sources" value={counts.sources} />
          <Metric label="Tools" value={counts.tools} />
          <Metric label="Outputs" value={counts.outputs} />
        </div>
        {capsule ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2" data-testid="capsule-anatomy-summary">
            <InspectorRef label="Readiness" value={readinessLabel} />
            <InspectorRef label="Source posture" value={`${sourcePosture} (${counts.sources + counts.documents} refs)`} />
            <InspectorRef label="Quality audit" value={audit
              ? `taxonomy ${Math.round(audit.scores.taxonomy * 100)} / sourceability ${Math.round(audit.scores.sourceability * 100)} / agent ${Math.round(audit.scores.agentUsability * 100)}`
              : 'custom capsule audit pending'} />
            <InspectorRef label="Review gate" value={reviewGate} />
            <InspectorRef label="Core refs" value={[
              refs?.userCoreId,
              refs?.situationCoreId,
              ...(refs?.sourceCoreIds ?? []),
              ...(refs?.documentCoreIds ?? []),
              ...(refs?.toolCoreIds ?? []),
              ...(refs?.outputCoreIds ?? []),
            ].filter(Boolean).slice(0, 6).join(', ') || 'core refs pending'} />
            <InspectorRef label="Next action" value={bestNextAction} />
          </div>
        ) : null}
        {capsule ? (
          <div className="mt-5 rounded-lg border border-slate-200 p-3" data-testid="capsule-v2-inspector-tabs">
            <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 text-[11px] font-semibold text-slate-600 sm:grid-cols-6">
              {['Anatomy', 'Sources', 'Ontology Stack', 'Graph', 'Review', 'Agent Read'].map((label) => (
                <span key={label} className="rounded bg-white px-2 py-1.5 text-center shadow-sm">{label}</span>
              ))}
            </div>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-600">
              <InspectorRef label="Ontology Stack" value={meta?.taxonomy.policyTeams.map((facet) => facet.id).join(', ') || 'ontology-stack-default'} />
              <InspectorRef label="Agent Read" value={`${meta?.starterDefinition?.agentWorkflow.preferredAgentId ?? 'default-agent'} read contract`} />
              <InspectorRef label="Advisory memory" value={`${enrichmentReceipt.memoryHitCount} advisory memory hit(s)`} />
              <InspectorRef label="Graph proposal" value={capsule.coreRefs.graphCoreId ? `approved graph ${capsule.coreRefs.graphCoreId}` : '1 review-gated graph proposal'} />
              <InspectorRef label="Review card" value={audit ? '1 sourceability review card' : 'review card pending'} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" data-testid="capsule-governance-badges">
              {governanceBadges.map((badge) => (
                <span key={badge.label} className={cn('rounded-md border px-2 py-1 text-[10px] font-semibold', badge.tone)}>
                  {badge.label}: {badge.value}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {isAuthenticated && usefulness ? (
          <CapsuleUsefulnessRatingControl
            rating={usefulness}
            testId="capsule-inspector-usefulness-rating"
            onRate={onRateUsefulness}
          />
        ) : null}
        {!isAuthenticated ? (
          <p className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
            Public capsule inspection is read-only. Sign in to rate, fork, improve, or attach repository sources.
          </p>
        ) : null}
        {capsule ? (
          <form
            className="praxis-workbench-panel mt-5 p-4"
            data-testid="capsule-inspector-chat-panel"
            onSubmit={(event) => {
              event.preventDefault();
              askFromInspector();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Chat with this capsule</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Ask PRAXIS from the inspected capsule context without leaving the card.</p>
              </div>
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
            </div>
            {recentChatMessages.length ? (
              <div className="mt-3 max-h-36 space-y-2 overflow-y-auto rounded-md bg-slate-50 p-2">
                {recentChatMessages.map((message, index) => (
                  <p key={`${message.role}-${index}`} className="text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-slate-800">{message.role === 'assistant' ? 'PRAXIS' : 'You'}:</span> {message.text.slice(0, 360)}
                  </p>
                ))}
              </div>
            ) : null}
            <textarea
              value={inspectorPrompt}
              onChange={(event) => setInspectorPrompt(event.target.value)}
              rows={3}
              placeholder={`Ask about ${capsule.label}: source gaps, use cases, risks, or next action`}
              className="mt-3 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-5 text-slate-800 outline-none focus:border-[color:var(--color-clay)]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                data-testid="capsule-inspector-chat-button"
                disabled={isStreaming || !inspectorPrompt.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Ask PRAXIS
              </button>
              <button type="button" onClick={() => askFromInspector(`Find the source gaps and weak assumptions inside "${capsule.label}".`)} className="rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Source gaps
              </button>
              <button type="button" onClick={() => askFromInspector(`Explain how to use "${capsule.label}" in a policy workflow and what output it is ready to produce.`)} className="rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                How to use
              </button>
              <button type="button" onClick={() => askFromInspector(`Propose review-gated improvements for "${capsule.label}" without mutating the canonical capsule.`)} className="rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Improve safely
              </button>
            </div>
          </form>
        ) : null}
        {richProfile ? (
          <div className="mt-5 space-y-2" data-testid="capsule-rich-profile">
            <InspectorTextSection label="Purpose" detail={`${richProfile.purpose} ${richProfile.userJob}`} />
            <InspectorTextSection label="Best next action" detail={bestNextAction} />
            <InspectorTextSection label="Source posture" detail={sourcePosture} />
            <InspectorTextSection label="Reasoning style" detail={reasoningStyle} />
            <InspectorTextSection label="Sources" detail={richProfile.sourceIndications.join(' ')} />
            <InspectorTextSection label="Decision Use" detail={[...richProfile.whenToUse, ...richProfile.decisionPrompts].slice(0, 5).join(' ')} />
            <InspectorTextSection label="Improvement Ideas" detail={[...richProfile.improves, ...richProfile.nextIdeas].slice(0, 6).join(' ')} />
            <InspectorTextSection label="Gaps/Risks" detail={[...richProfile.whenNotToUse, ...richProfile.riskCaveats, ...richProfile.evidenceRequirements].slice(0, 6).join(' ')} />
            {humanReview ? <InspectorTextSection label="Human review" detail={`${humanReview.notes} ${humanReview.tooltip} Reviewed by ${humanReview.reviewedBy} on ${humanReview.reviewedAt}.`} /> : null}
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
        {capsule ? (
          <div className="mt-5 grid gap-3">
            <section className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Quality audit</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {audit
                  ? `Taxonomy ${Math.round(audit.scores.taxonomy * 100)}, sourceability ${Math.round(audit.scores.sourceability * 100)}, agent usability ${Math.round(audit.scores.agentUsability * 100)}, review gate ${Math.round(audit.scores.reviewGate * 100)}.`
                  : 'Custom capsule quality is evaluated through saved evaluations and source coverage.'}
              </p>
            </section>
            <section className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Enrichment status</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Firestore canonical. Cognee advisory: {enrichmentReceipt.cognee}. Memory hits: {enrichmentReceipt.memoryHitCount}. Proposed writebacks: {enrichmentReceipt.writebackProposalIds.length}.
              </p>
            </section>
            <section className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Proposed next improvements</p>
              <div className="mt-2 grid gap-1.5">
                {(proposals.length ? proposals : [{ proposalId: 'no-proposals', target: 'suggestedNextActions', rationale: 'No review-gated proposal is needed from the current quality audit.' }]).slice(0, 3).map((proposal) => (
                  <p key={proposal.proposalId} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-slate-800">{proposal.target}</span>: {proposal.rationale}
                  </p>
                ))}
              </div>
            </section>
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
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="rounded-md border border-slate-200 p-2 text-xs hover:bg-slate-50" data-selection-zone="source-pack">
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
                <p key={`${excerpt.sourceId}-${index}`} className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600" data-selection-zone="source-pack">
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
              {starterGuidance ? <p className="mt-1 text-xs leading-5 text-slate-500" data-selection-zone="source-pack">{starterGuidance}</p> : null}
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
        {isAuthenticated ? (
          <div className="mt-5 space-y-2">
            <button type="button" onClick={onRepository} className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Open repository</button>
            <button type="button" onClick={onImprove} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Improve capsule</button>
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}

function PraxisGuideChat({
  open,
  capsule,
  messages,
  prompt,
  isAuthenticated,
  isStreaming,
  onOpen,
  onClose,
  onPrompt,
  onSubmit,
}: {
  open: boolean;
  capsule: PraxisCapsuleSummary | null;
  messages: ChatMessage[];
  prompt: string;
  isAuthenticated: boolean;
  isStreaming: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPrompt: (value: string) => void;
  onSubmit: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2" data-testid="praxis-guide-chat">
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-label="PRAXIS guide chat"
          className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Guide chat</p>
              <h2 className="mt-1 text-sm font-semibold text-slate-950">PRAXIS guide</h2>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                {capsule ? capsule.label : 'Ask what PRAXIS is building, how capsules work, or what source gaps to close.'}
              </p>
            </div>
            <button type="button" aria-label="Close PRAXIS guide chat" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length ? messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm leading-6',
                  message.role === 'user' ? 'ml-8 bg-slate-950 text-white' : 'mr-8 border border-slate-200 bg-slate-50 text-slate-800',
                )}
              >
                {message.role === 'assistant' ? <AssistantMarkdown text={message.text || (isStreaming ? 'Reading the capsule...' : '')} /> : message.text}
              </article>
            )) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                Ask about PRAXIS, the selected capsule, source gaps, or how to use ContextCapsules. {isAuthenticated ? 'This guide uses a separate local thread.' : 'Submitting signs you in before the AI response runs.'}
              </div>
            )}
          </div>
          <form
            className="border-t border-slate-200 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <textarea
              value={prompt}
              onChange={(event) => onPrompt(event.target.value)}
              rows={3}
              placeholder="Ask how to use this capsule, what PRAXIS is building, or what sources are missing"
              className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm leading-5 text-slate-800 outline-none focus:border-[color:var(--color-clay)]"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400">{isAuthenticated ? 'Separate from Ask PRAXIS' : 'Login required for response'}</span>
              <button
                type="submit"
                data-testid="praxis-guide-chat-submit"
                disabled={isStreaming || !prompt.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                Send
              </button>
            </div>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800"
      >
        <MessageCircle className="h-4 w-4" />
        Guide
      </button>
    </div>,
    document.body,
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
              className="praxis-select-control mt-2 w-full rounded-md px-3 py-2 text-sm font-semibold outline-none"
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
