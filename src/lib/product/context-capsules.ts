import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import type { DomainId } from '@/types/domain';

export const PENDING_CONTEXT_CAPSULE_PROMPT_KEY = 'praxis.pendingContextCapsulePrompt';
export const PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY = 'praxis.pendingContextCapsuleTemplate';
export const PENDING_CONTEXT_CAPSULE_PATH_KEY = 'praxis.pendingContextCapsulePath';
export const PENDING_CONTEXT_CAPSULE_OUTPUT_KEY = 'praxis.pendingContextCapsuleOutput';

export type CapsuleAttachmentRole = 'primary' | 'reference' | 'comparison' | 'archived';

export type CapsuleSlotId =
  | 'user'
  | 'situation'
  | 'source'
  | 'document'
  | 'connector'
  | 'time'
  | 'graph'
  | 'rules'
  | 'tool'
  | 'objective'
  | 'output'
  | 'memory';

export interface CapsuleSlotDefinition {
  id: CapsuleSlotId;
  label: string;
  shortLabel: string;
  description: string;
  policyQuestions: string[];
  mappedCoreKinds: CoreSpecimenKind[];
}

export interface CapsuleRoleDefinition {
  role: CapsuleAttachmentRole;
  label: string;
  description: string;
}

export interface CapsuleCoreRefsLike {
  userCoreId?: string | null;
  situationCoreId?: string | null;
  pathCoreId?: string | null;
  sourceCoreIds?: string[];
  documentCoreIds?: string[];
  graphCoreId?: string | null;
  timeCoreId?: string | null;
  outputCoreIds?: string[];
  toolCoreIds?: string[];
  objectiveCoreIds?: string[];
  productCoreIds?: string[];
  memoryCoreId?: string | null;
}

export const CAPSULE_ATTACHMENT_ROLES: CapsuleRoleDefinition[] = [
  {
    role: 'primary',
    label: 'Primary',
    description: 'The capsule that controls the answer, tool routing, and output target.',
  },
  {
    role: 'reference',
    label: 'Reference',
    description: 'Read-only background context that can be cited but should not override the primary capsule.',
  },
  {
    role: 'comparison',
    label: 'Comparison',
    description: 'A second capsule used to compare claims, timeframes, sources, or recommendations.',
  },
  {
    role: 'archived',
    label: 'Archived',
    description: 'Retained for lineage and handover receipts, but excluded from model-ready context by default.',
  },
];

export const CAPSULE_SLOT_DEFINITIONS: CapsuleSlotDefinition[] = [
  {
    id: 'user',
    label: 'User Core',
    shortLabel: 'User',
    description: 'Role, institution, lens, tone, language, source preferences, and red lines.',
    policyQuestions: ['Who is asking?', 'What mandate and voice should PRAXIS inherit?'],
    mappedCoreKinds: ['user'],
  },
  {
    id: 'situation',
    label: 'Situation Core',
    shortLabel: 'Situation',
    description: 'Case, region, timeframe, actors, stakes, hypotheses, open questions, and contested claims.',
    policyQuestions: ['What is the policy situation?', 'Which claims and actors are in scope?'],
    mappedCoreKinds: ['situation', 'path'],
  },
  {
    id: 'source',
    label: 'Source Core',
    shortLabel: 'Sources',
    description: 'Trusted source receipts, source tiers, whitelist or blacklist posture, recency, and reliability policy.',
    policyQuestions: ['Which receipts can ground claims?', 'Which source tiers are acceptable?'],
    mappedCoreKinds: ['source'],
  },
  {
    id: 'document',
    label: 'Document Core',
    shortLabel: 'Docs',
    description: 'Uploaded files, extraction status, chunks, paragraph IDs, page offsets, and citation metadata.',
    policyQuestions: ['Which documents travel with the answer?', 'Are paragraph or page references usable?'],
    mappedCoreKinds: ['document'],
  },
  {
    id: 'connector',
    label: 'Connector Core',
    shortLabel: 'Connectors',
    description: 'Read-only feeds and integrations such as grounded search, source-linked event reporting, humanitarian web reporting, humanitarian data, official multilateral news, economic institution, grounded Google Search, and private library sources.',
    policyQuestions: ['Which feeds are allowed?', 'Should connector results be saved, referenced, or promoted?'],
    mappedCoreKinds: ['source', 'tool'],
  },
  {
    id: 'time',
    label: 'Time Core',
    shortLabel: 'Time',
    description: 'As-of date, horizon, event pace, stale-claim policy, and update cadence.',
    policyQuestions: ['What date is the answer current as of?', 'Which claims may be stale?'],
    mappedCoreKinds: ['time'],
  },
  {
    id: 'graph',
    label: 'Graph/Power Core',
    shortLabel: 'Power',
    description: 'Actors, factions, commitments, relationships, influence, blockers, claims, and evidence edges.',
    policyQuestions: ['Who decides or blocks?', 'Which relationships and evidence edges matter?'],
    mappedCoreKinds: ['graph'],
  },
  {
    id: 'rules',
    label: 'Rules Core',
    shortLabel: 'Rules',
    description: 'Legal, institutional, classification, compliance, writing, and review constraints.',
    policyQuestions: ['Which legal or institutional limits bind the work?', 'What must be reviewed before export?'],
    mappedCoreKinds: ['path', 'product'],
  },
  {
    id: 'tool',
    label: 'Tool Core',
    shortLabel: 'Tools',
    description: 'Selected PRAXIS tools, allowed actions, approval requirements, tool readiness, and receipts.',
    policyQuestions: ['Which tools may run?', 'Which actions require approval?'],
    mappedCoreKinds: ['tool'],
  },
  {
    id: 'objective',
    label: 'Objective Core',
    shortLabel: 'Objective',
    description: 'Current task, decision question, success criteria, and workflow stage.',
    policyQuestions: ['What decision is this work serving?', 'What counts as done?'],
    mappedCoreKinds: ['objective'],
  },
  {
    id: 'output',
    label: 'Output Core',
    shortLabel: 'Output',
    description: 'Memo, brief, talking points, template, audience, length, citation style, must-include, and must-avoid rules.',
    policyQuestions: ['What output is PRAXIS producing?', 'Who will read it?'],
    mappedCoreKinds: ['output', 'product'],
  },
  {
    id: 'memory',
    label: 'Memory/Handover Core',
    shortLabel: 'Memory',
    description: 'Prior runs, accepted conclusions, unresolved red-team findings, approvals, and agent instructions.',
    policyQuestions: ['What conclusions are inherited?', 'Which caveats or approvals must survive handover?'],
    mappedCoreKinds: ['memory'],
  },
];

export function capsuleSlotReadiness(refs: CapsuleCoreRefsLike | null | undefined): Record<CapsuleSlotId, boolean> {
  const coreRefs = refs ?? {};
  return {
    user: Boolean(coreRefs.userCoreId),
    situation: Boolean(coreRefs.situationCoreId || coreRefs.pathCoreId),
    source: Boolean(coreRefs.sourceCoreIds?.length),
    document: Boolean(coreRefs.documentCoreIds?.length),
    connector: Boolean(coreRefs.sourceCoreIds?.length || coreRefs.toolCoreIds?.length),
    time: Boolean(coreRefs.timeCoreId),
    graph: Boolean(coreRefs.graphCoreId),
    rules: Boolean(coreRefs.pathCoreId || coreRefs.productCoreIds?.length),
    tool: Boolean(coreRefs.toolCoreIds?.length),
    objective: Boolean(coreRefs.objectiveCoreIds?.length),
    output: Boolean(coreRefs.outputCoreIds?.length || coreRefs.productCoreIds?.length),
    memory: Boolean(coreRefs.memoryCoreId),
  };
}

export function capsuleAttachmentCounts(refs: CapsuleCoreRefsLike | null | undefined) {
  const sourceCount = refs?.sourceCoreIds?.length ?? 0;
  const documentCount = refs?.documentCoreIds?.length ?? 0;
  const toolCount = refs?.toolCoreIds?.length ?? 0;

  return {
    attachments: sourceCount + documentCount,
    connectors: toolCount,
    sources: sourceCount,
    documents: documentCount,
    tools: toolCount,
  };
}

export type ContextCapsuleTemplateId =
  | 'conflict-analysis'
  | 'director-handover'
  | 'defence-opportunity'
  | 'hr-policy-review'
  | 'regulatory-watch'
  | 'crisis-brief'
  | 'public-sector-memo'
  | 'agent-handover'
  | 'sanctions-compliance'
  | 'economic-exposure'
  | 'human-rights-allegation-matrix'
  | 'humanitarian-access'
  | 'information-environment'
  | 'climate-development-risk'
  | 'legal-compliance-review'
  | 'program-delivery'
  | 'board-brief'
  | 'temporal-causal-map'
  | 'human-friction-map'
  | 'decision-clock';

export interface ContextCapsuleTemplate {
  id: ContextCapsuleTemplateId;
  label: string;
  prompt: string;
  audience: string;
  output: string;
  contextCores: CoreSpecimenKind[];
}

export type CapsuleStarterCategory = 'situation' | 'tool' | 'output' | 'user';
export type CapsuleTaxonomyAxisId = 'types' | 'domains' | 'policy-teams';
export type CapsuleTypeFacetId = CapsuleStarterCategory | 'custom' | 'unknown';
export type CapsuleTaxonomyFacetSource =
  | 'starter'
  | 'starter-snapshot'
  | 'prefixed-tag'
  | 'legacy-tag'
  | 'core-ref'
  | 'policy-team'
  | 'scope'
  | 'repair';

export interface CapsuleTaxonomyAxis {
  id: CapsuleTaxonomyAxisId;
  label: string;
  description: string;
}

export interface CapsuleTaxonomyFacet {
  id: string;
  label: string;
  tag: string;
  source: CapsuleTaxonomyFacetSource;
  value?: string;
  repairState?: 'custom' | 'unknown';
}

export interface CapsuleTaxonomyInput {
  capsuleId?: string | null;
  starterId?: string | null;
  category?: CapsuleStarterCategory | null;
  domain?: string | null;
  scope?: 'user' | 'situation' | 'team' | string | null;
  tags?: string[] | null;
  community?: { tags?: string[] | null } | null;
  starterSnapshot?: Partial<CapsuleStarterDefinition> | CapsuleStarterSnapshot | null;
  coreRefs?: CapsuleCoreRefsLike | null;
  recommendedToolIds?: string[] | null;
  outputProductIds?: string[] | null;
}

export interface CapsuleResolvedTaxonomy {
  types: CapsuleTaxonomyFacet[];
  domains: CapsuleTaxonomyFacet[];
  policyTeams: CapsuleTaxonomyFacet[];
  tools: string[];
  outputs: string[];
}

export interface CapsuleTaxonomyStatItem {
  id: string;
  label: string;
  tag?: string;
  count: number;
  repairState?: 'custom' | 'unknown';
  value?: string;
}

export interface CapsuleTaxonomyRepairStat extends CapsuleTaxonomyStatItem {
  axis: CapsuleTaxonomyAxisId;
  repairState: 'custom' | 'unknown';
}

export interface CapsuleTaxonomyStatsInput extends CapsuleTaxonomyInput {
  archivedAt?: string | null;
  health?: { warnings?: string[] | null; blockers?: string[] | null } | null;
}

export interface CapsuleTaxonomyStats {
  totalCapsules: number;
  visibleCapsules: number;
  archivedCapsules: number;
  sourceReferences: number;
  documentReferences: number;
  types: CapsuleTaxonomyStatItem[];
  domains: CapsuleTaxonomyStatItem[];
  policyTeams: CapsuleTaxonomyStatItem[];
  thinkingDevices: CapsuleTaxonomyStatItem[];
  artifacts: CapsuleTaxonomyStatItem[];
  repairStates: CapsuleTaxonomyRepairStat[];
}

export const CAPSULE_TAXONOMY_AXES: CapsuleTaxonomyAxis[] = [
  {
    id: 'types',
    label: 'Types',
    description: 'What kind of context the capsule contributes: user, situation, thinking device, or output artifact.',
  },
  {
    id: 'domains',
    label: 'Domains',
    description: 'The substantive policy domain or operating context the capsule is about.',
  },
  {
    id: 'policy-teams',
    label: 'Policy Teams',
    description: 'The team lanes that can inherit, own, or reuse the capsule.',
  },
];

export interface CapsuleStarterInspectionSection {
  label: string;
  detail: string;
}

export interface CapsuleStarterSource {
  id: string;
  label: string;
  url: string;
  sourceType: 'official' | 'multilateral' | 'regulator' | 'standard-setter' | 'public-library';
  relevance: string;
  publisher?: string;
  date?: string;
  reliabilityTier?: 1 | 2 | 3;
}

export interface CapsuleStarterExcerpt {
  sourceId: string;
  text: string;
}

export interface CapsuleStarterAgentWorkflow {
  preferredAgentId: string;
  routeHint: string;
  outputGoal: string;
  approvalNotes: string;
}

export type CapsuleStarterDomain =
  | 'sustainability'
  | 'finance'
  | 'hr'
  | 'diplomacy'
  | 'humanitarian-rights'
  | 'ai-governance'
  | 'public-health'
  | 'critical-minerals'
  | 'cyber-resilience'
  | 'migration-displacement'
  | 'election-integrity'
  | 'source-intake'
  | 'exposure-mapping'
  | 'policy-review'
  | 'options-mapping'
  | 'audit-review'
  | 'analyst-role'
  | 'output-brief';

export interface CapsuleStarterDefinition {
  starterId: string;
  category: CapsuleStarterCategory;
  domain: CapsuleStarterDomain;
  label: string;
  summary: string;
  detail: string;
  tags: string[];
  colorToken: string;
  coreRefs: CapsuleCoreRefsLike;
  recommendedToolIds: string[];
  outputProductIds: string[];
  sourcePack: CapsuleStarterSource[];
  excerpts: CapsuleStarterExcerpt[];
  readinessStars: 1 | 2 | 3 | 4 | 5;
  suggestedQuestions: string[];
  suggestedNextActions: string[];
  agentWorkflow: CapsuleStarterAgentWorkflow;
  aiUseGuidance: string;
  inspectionSections: CapsuleStarterInspectionSection[];
  combinesWellWith: string[];
}

export const CAPSULE_STARTER_CATALOG_VERSION = '2026-05-18-capsule-inspection-v3';

export type CapsuleStarterSnapshot = Pick<
  CapsuleStarterDefinition,
  | 'starterId'
  | 'category'
  | 'domain'
  | 'label'
  | 'summary'
  | 'detail'
  | 'tags'
  | 'recommendedToolIds'
  | 'outputProductIds'
  | 'sourcePack'
  | 'excerpts'
  | 'readinessStars'
  | 'suggestedQuestions'
  | 'suggestedNextActions'
  | 'agentWorkflow'
  | 'aiUseGuidance'
  | 'combinesWellWith'
> & {
  catalogVersion: string;
};

export type PolicyPathId =
  | 'generic-policy'
  | 'foreign-policy'
  | 'conflict-resolution'
  | 'mediator-peace-process'
  | 'economic-sanctions'
  | 'humanitarian-analysis'
  | 'security-defence'
  | 'climate-development'
  | 'information-cyber'
  | 'defence-capture'
  | 'public-affairs'
  | 'public-sector-policy'
  | 'regulatory-public-affairs'
  | 'hr-policy'
  | 'legal-compliance'
  | 'crisis-management'
  | 'strategy-operations'
  | 'program-delivery'
  | 'research-direction'
  | 'human-rights-accountability';

export interface PolicyPathProfile {
  id: PolicyPathId;
  label: string;
  userFrame: string;
  defaultTemplates: ContextCapsuleTemplateId[];
  suggestedTools: string[];
  suggestedOutputs: string[];
  sourceTags: string[];
  missingInfoPrompts: string[];
}

export type PolicyTeamCategoryId =
  | 'economic-sanctions'
  | 'diplomatic'
  | 'security-defence'
  | 'humanitarian'
  | 'human-rights-legal'
  | 'governance-public-sector'
  | 'climate-development'
  | 'information-cyber'
  | 'crisis-ops'
  | 'research-strategy';

export interface PolicyTeamCategory {
  id: PolicyTeamCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  domainId: DomainId;
  policyPathIds: PolicyPathId[];
  templateIds: ContextCapsuleTemplateId[];
  toolIds: string[];
  outputProductIds: string[];
  sourceTags: string[];
  missingInfoPrompts: string[];
}

export interface CapsuleOutputProduct {
  id: string;
  label: string;
  description: string;
  bestFor: PolicyPathId[];
}

export interface CapsuleConnectorIdea {
  id: string;
  label: string;
  kind: 'source' | 'document' | 'communication' | 'calendar' | 'data' | 'mcp';
  posture: 'live-now' | 'candidate' | 'deferred';
  description: string;
}

export type CapsuleConnectorId =
  | 'upload'
  | 'grounded-search'
  | 'google-drive'
  | 'gmail'
  | 'cloud-storage'
  | 'vertex-gemini-rag';

export type CapsuleConnectorStatus = 'live' | 'planned-readonly' | 'advanced-configured' | 'advanced-planned';
export type CapsuleConnectorRiskLevel = 'low' | 'medium' | 'high';
export type CapsuleConnectorAction =
  | 'upload-original'
  | 'import-selected'
  | 'search-grounded'
  | 'read-thread'
  | 'store-original'
  | 'store-export'
  | 'retrieve'
  | 'mirror-to-rag';

export interface CapsuleConnectorDefinition {
  id: CapsuleConnectorId;
  label: string;
  icon: 'upload' | 'search' | 'drive' | 'mail' | 'bucket' | 'spark';
  status: CapsuleConnectorStatus;
  description: string;
  requiredScopes: string[];
  allowedActions: CapsuleConnectorAction[];
  fillsSlots: CapsuleSlotId[];
  riskLevel: CapsuleConnectorRiskLevel;
  advancedOnly?: boolean;
}

export type CapsuleRetrievalBackend = 'local-hybrid' | 'vertex-rag-engine' | 'vertex-vector-search';
export type CapsuleEmbeddingStatus = 'not-started' | 'queued' | 'embedded' | 'failed' | 'unavailable';

export interface CapsuleRepositoryMetadata {
  capsuleId: string;
  ownerId: string;
  storageBucket: string | null;
  storageObjectRefs: string[];
  documentIds: string[];
  sourceReceiptIds: string[];
  chunkCount: number;
  embeddingStatus: CapsuleEmbeddingStatus;
  retrievalBackend: CapsuleRetrievalBackend;
  freshness: 'empty' | 'fresh' | 'stale' | 'needs-documents' | 'needs-sources';
  lastIngestionRunId: string | null;
  updatedAt: string;
}

export interface CapsuleRepositoryDocumentRef {
  documentId: string;
  title: string;
  storageObjectRef: string | null;
  sourceReceiptIds: string[];
  chunkCount: number;
  pageRefs: string[];
  paragraphRefs: string[];
  embeddingStatus: CapsuleEmbeddingStatus;
  retrievalBackend: CapsuleRetrievalBackend;
  freshness: CapsuleRepositoryMetadata['freshness'];
}

export interface CapsuleRepositorySourceRef {
  sourceReceiptId: string;
  label: string;
  uri: string | null;
  tags: string[];
  reliabilityNote: string | null;
  citationGaps: string[];
  attachedDocumentIds: string[];
}

export interface CapsuleRepositorySpanRef {
  spanId: string;
  documentId: string;
  chunkId: string | null;
  pageRef: string | null;
  paragraphRef: string | null;
  sourceReceiptId: string | null;
}

export interface CapsuleRepositoryContract {
  metadata: CapsuleRepositoryMetadata;
  documentRefs: CapsuleRepositoryDocumentRef[];
  sourceRefs: CapsuleRepositorySourceRef[];
  spanRefs: CapsuleRepositorySpanRef[];
  outputHistoryIds: string[];
  evaluationIds: string[];
  memoryIds: string[];
}

export interface CapsuleIngestionReceipt {
  receiptId: string;
  capsuleId: string;
  ownerId: string;
  sourceConnectorId: CapsuleConnectorId;
  originalUri: string;
  storedObjectPath: string | null;
  parserStatus: 'queued' | 'parsed' | 'failed' | 'not-applicable';
  documentId: string | null;
  sourceReceiptId: string | null;
  chunkCount: number;
  embeddingStatus: CapsuleEmbeddingStatus;
  attachedAt: string;
  retrievalBackend: CapsuleRetrievalBackend;
}

export interface CapsuleCombinationRecipe {
  id: string;
  label: string;
  inputs: ContextCapsuleTemplateId[];
  output: string;
  mergeRules: string[];
}

export const CONTEXT_CAPSULE_TEMPLATES: ContextCapsuleTemplate[] = [
  {
    id: 'conflict-analysis',
    label: 'Conflict analysis',
    prompt: 'Build a conflict ContextCapsule with sources, episodes, actors, claims, and power dynamics.',
    audience: 'Policy analyst',
    output: 'Conflict brief',
    contextCores: ['situation', 'source', 'time', 'graph', 'tool', 'output'],
  },
  {
    id: 'director-handover',
    label: 'Director handover',
    prompt: 'Create a director handover capsule with current decisions, sources, open questions, and next actions.',
    audience: 'Incoming director',
    output: 'Handover pack',
    contextCores: ['user', 'situation', 'source', 'time', 'graph', 'memory', 'output'],
  },
  {
    id: 'defence-opportunity',
    label: 'Defence opportunity',
    prompt: 'Track a defence procurement opportunity and map requirements, stakeholders, approval paths, and blockers.',
    audience: 'Capture team',
    output: 'Capture brief',
    contextCores: ['situation', 'source', 'graph', 'time', 'objective', 'product'],
  },
  {
    id: 'hr-policy-review',
    label: 'HR policy review',
    prompt: 'Review an HR policy change against internal rules, affected groups, approval path, and communications risk.',
    audience: 'HR policy lead',
    output: 'Policy rollout note',
    contextCores: ['user', 'situation', 'source', 'graph', 'objective', 'output'],
  },
  {
    id: 'regulatory-watch',
    label: 'Regulatory watch',
    prompt: 'Monitor a regulatory change and prepare a sourced briefing on what changed, who is affected, and what to do next.',
    audience: 'Public affairs team',
    output: 'Regulatory memo',
    contextCores: ['situation', 'source', 'time', 'graph', 'tool', 'output'],
  },
  {
    id: 'crisis-brief',
    label: 'Crisis brief',
    prompt: 'Build a crisis capsule with the latest episodes, impacted actors, decision timeline, source gaps, and briefing output.',
    audience: 'Crisis team',
    output: 'Situation brief',
    contextCores: ['situation', 'source', 'time', 'graph', 'tool', 'output'],
  },
  {
    id: 'public-sector-memo',
    label: 'Public sector memo',
    prompt: 'Turn this public-sector issue into a sourced memo with rules, stakeholders, options, and review gaps visible.',
    audience: 'Government or public-sector team',
    output: 'Options memo',
    contextCores: ['user', 'situation', 'source', 'graph', 'objective', 'output'],
  },
  {
    id: 'agent-handover',
    label: 'Agent handover',
    prompt: 'Prepare an agent handover capsule with allowed actions, source scope, escalation rules, and review gates.',
    audience: 'AI agent and human reviewer',
    output: 'Agent handover',
    contextCores: ['user', 'situation', 'source', 'time', 'tool', 'memory', 'output'],
  },
  {
    id: 'sanctions-compliance',
    label: 'Sanctions review',
    prompt: 'Build a sanctions review capsule with entities, source receipts, rule checks, exposure notes, and review gaps.',
    audience: 'Legal and compliance team',
    output: 'Compliance note',
    contextCores: ['situation', 'source', 'document', 'graph', 'objective', 'output'],
  },
  {
    id: 'economic-exposure',
    label: 'Economic exposure',
    prompt: 'Build an economic and sanctions capsule with entities, sectors, trade flows, exposure notes, source receipts, and review gaps.',
    audience: 'Economic or sanctions analyst',
    output: 'Economic exposure note',
    contextCores: ['situation', 'source', 'document', 'graph', 'time', 'objective', 'output'],
  },
  {
    id: 'human-rights-allegation-matrix',
    label: 'Human rights allegation matrix',
    prompt: 'Structure allegations, legal thresholds, chain-of-custody notes, source reliability, contested claims, and evidence gaps.',
    audience: 'Human rights or accountability analyst',
    output: 'Allegation matrix',
    contextCores: ['situation', 'source', 'document', 'graph', 'path', 'output'],
  },
  {
    id: 'humanitarian-access',
    label: 'Humanitarian access',
    prompt: 'Map access constraints, affected populations, needs, protection concerns, operational actors, freshness windows, and source gaps.',
    audience: 'Humanitarian analyst',
    output: 'Humanitarian access brief',
    contextCores: ['situation', 'source', 'document', 'time', 'graph', 'output'],
  },
  {
    id: 'information-environment',
    label: 'Information environment',
    prompt: 'Assess narratives, media sources, platform scope, disinformation risk, cyber posture, response options, and source caveats.',
    audience: 'Information or cyber analyst',
    output: 'Information environment brief',
    contextCores: ['situation', 'source', 'time', 'graph', 'objective', 'output'],
  },
  {
    id: 'climate-development-risk',
    label: 'Climate and development risk',
    prompt: 'Build a climate and development capsule with geography, indicators, program risks, finance context, climate-security links, and monitoring needs.',
    audience: 'Climate or development analyst',
    output: 'Climate-development options brief',
    contextCores: ['situation', 'source', 'document', 'time', 'graph', 'objective', 'output'],
  },
  {
    id: 'legal-compliance-review',
    label: 'Legal compliance review',
    prompt: 'Review rules, contradictions, source receipts, treaty or regulatory posture, sign-off gates, and export limits.',
    audience: 'Legal and compliance analyst',
    output: 'Legal compliance review',
    contextCores: ['user', 'situation', 'source', 'document', 'path', 'objective', 'output'],
  },
  {
    id: 'program-delivery',
    label: 'Program delivery',
    prompt: 'Build a delivery capsule with implementation context, partners, milestones, risks, source gaps, handover notes, and monitoring cadence.',
    audience: 'Program delivery officer',
    output: 'Program delivery handover',
    contextCores: ['situation', 'source', 'document', 'time', 'graph', 'memory', 'output'],
  },
  {
    id: 'board-brief',
    label: 'Board brief',
    prompt: 'Create a board briefing capsule that combines market, regulatory, risk, stakeholder, and decision context.',
    audience: 'Executive or board audience',
    output: 'Board brief',
    contextCores: ['user', 'situation', 'source', 'time', 'graph', 'product', 'output'],
  },
  {
    id: 'temporal-causal-map',
    label: 'Temporal and causal map',
    prompt: 'Build a capsule that separates timeline facts, causal claims, trigger events, lag effects, and indicators that would change the assessment.',
    audience: 'Policy analysis team',
    output: 'Temporal-causal assessment',
    contextCores: ['situation', 'source', 'time', 'graph', 'objective', 'output'],
  },
  {
    id: 'human-friction-map',
    label: 'Human friction map',
    prompt: 'Map incentives, fears, blockers, informal authority, office friction, stakeholder fatigue, and implementation resistance inside the policy situation.',
    audience: 'Policy lead or mediation team',
    output: 'Friction and blocker map',
    contextCores: ['user', 'situation', 'source', 'graph', 'memory', 'output'],
  },
  {
    id: 'decision-clock',
    label: 'Decision clock',
    prompt: 'Create a decision-clock capsule with deadlines, review gates, stale assumptions, external milestones, trigger points, and monitoring cadence.',
    audience: 'Crisis or executive team',
    output: 'Decision-window brief',
    contextCores: ['situation', 'source', 'time', 'tool', 'objective', 'output'],
  },
];

const STARTER_COLORS: Record<CapsuleStarterCategory, string> = {
  situation: '#0f766e',
  tool: '#b45309',
  output: '#6d28d9',
  user: '#2563eb',
};

type CapsuleStarterOverrides = Partial<Pick<
  CapsuleStarterDefinition,
  | 'sourcePack'
  | 'excerpts'
  | 'readinessStars'
  | 'suggestedQuestions'
  | 'suggestedNextActions'
  | 'agentWorkflow'
  | 'aiUseGuidance'
>>;

function normalizeStarterTags(
  category: CapsuleStarterCategory,
  domain: CapsuleStarterDomain,
  tags: string[],
): string[] {
  return uniqueStrings(['starter', category, `type:${category}`, domain, `domain:${domain}`, ...tags]);
}

function starter(
  starterId: string,
  category: CapsuleStarterCategory,
  domain: CapsuleStarterDomain,
  label: string,
  summary: string,
  detail: string,
  tags: string[],
  coreRefs: CapsuleCoreRefsLike,
  recommendedToolIds: string[],
  outputProductIds: string[],
  combinesWellWith: string[],
  overrides?: CapsuleStarterOverrides,
): CapsuleStarterDefinition {
  const sourcePack = normalizeStarterSourcePack(overrides?.sourcePack ?? sourcePackForStarter(starterId, category, label, domain));
  const aiUseGuidance = overrides?.aiUseGuidance
    ?? `Use ${label} as reusable capsule context. Ask for missing inputs, keep source limits visible, and route work through the recommended tools before drafting outputs.`;
  return {
    starterId,
    category,
    domain,
    label,
    summary,
    detail,
    tags: normalizeStarterTags(category, domain, tags),
    colorToken: STARTER_COLORS[category],
    coreRefs,
    recommendedToolIds,
    outputProductIds,
    combinesWellWith,
    sourcePack,
    excerpts: overrides?.excerpts ?? sourcePack.map((source) => ({
      sourceId: source.id,
      text: `${source.label} should be treated as starter context for ${label}; verify freshness, jurisdiction, and evidentiary limits before relying on it.`,
    })),
    readinessStars: overrides?.readinessStars ?? (category === 'situation' ? 4 : 3),
    suggestedQuestions: overrides?.suggestedQuestions ?? [
      `What is missing before ${label} can support a decision?`,
      `Which sources, tools, or outputs should PRAXIS attach to ${label}?`,
    ],
    suggestedNextActions: overrides?.suggestedNextActions ?? [
      `Inspect ${label} for source gaps.`,
      `Improve ${label} before drafting an output.`,
    ],
    agentWorkflow: overrides?.agentWorkflow ?? {
      preferredAgentId: category === 'output' ? 'output-formatter' : 'research-memo',
      routeHint: category === 'tool' ? 'tool-router' : 'capsule-supervisor',
      outputGoal: outputProductIds[0] ?? 'options-memo',
      approvalNotes: 'Require approval before external export, graph mutation, or connector writes.',
    },
    aiUseGuidance,
    inspectionSections: [
      { label: 'Best use', detail: summary },
      { label: 'How PRAXIS should use it', detail },
      { label: 'AI use guidance', detail: aiUseGuidance },
      { label: 'Interchange rule', detail: 'This capsule is safe to fork, combine, tag, and improve without changing the starter definition.' },
    ],
  };
}

function sourcePackForStarter(
  starterId: string,
  category: CapsuleStarterCategory,
  label: string,
  domain: CapsuleStarterDomain,
): CapsuleStarterSource[] {
  const domainSources = sourcePackForDomain(domain);
  if (domainSources.length) return domainSources;
  return normalizeStarterSourcePack([
    {
      id: `${starterId}-source-1`,
      label: `${label} official source baseline`,
      url: `https://praxis.tacitus.me/learn#${encodeURIComponent(starterId)}`,
      sourceType: 'official',
      relevance: `Official or primary-source baseline for ${domain} work.`,
      publisher: 'PRAXIS starter catalog',
      date: CAPSULE_STARTER_CATALOG_VERSION,
      reliabilityTier: category === 'situation' ? 2 : 3,
    },
    {
      id: `${starterId}-source-2`,
      label: `${label} multilateral reference`,
      url: `https://praxis.tacitus.me/release-notes#${encodeURIComponent(starterId)}`,
      sourceType: 'multilateral',
      relevance: `Secondary reference posture for ${label}.`,
      publisher: 'PRAXIS starter catalog',
      date: CAPSULE_STARTER_CATALOG_VERSION,
      reliabilityTier: category === 'situation' ? 2 : 3,
    },
  ]);
}

function normalizeStarterSourcePack(sources: CapsuleStarterSource[]): CapsuleStarterSource[] {
  return sources.map((source) => ({
    ...source,
    publisher: source.publisher ?? publisherFromSource(source),
    date: source.date ?? CAPSULE_STARTER_CATALOG_VERSION,
    reliabilityTier: source.reliabilityTier ?? reliabilityTierFromSource(source.sourceType),
  }));
}

function publisherFromSource(source: CapsuleStarterSource): string {
  if (source.publisher) return source.publisher;
  if (source.url.includes('ifrs.org')) return 'IFRS Foundation';
  if (source.url.includes('europa.eu')) return 'European Union';
  if (source.url.includes('imf.org')) return 'International Monetary Fund';
  if (source.url.includes('worldbank.org')) return 'World Bank';
  if (source.url.includes('ilo.org')) return 'International Labour Organization';
  if (source.url.includes('un.org')) return 'United Nations';
  if (source.url.includes('unocha.org')) return 'UN OCHA';
  if (source.url.includes('ohchr.org')) return 'OHCHR';
  if (source.url.includes('nist.gov')) return 'NIST';
  if (source.url.includes('oecd.ai') || source.url.includes('oecd.org')) return 'OECD';
  if (source.url.includes('who.int')) return 'World Health Organization';
  if (source.url.includes('iea.org')) return 'International Energy Agency';
  if (source.url.includes('cisa.gov')) return 'CISA';
  if (source.url.includes('unhcr.org')) return 'UNHCR';
  if (source.url.includes('osce.org')) return 'OSCE';
  if (source.url.includes('idea.int')) return 'International IDEA';
  return 'Public source';
}

function reliabilityTierFromSource(sourceType: CapsuleStarterSource['sourceType']): 1 | 2 | 3 {
  if (sourceType === 'official' || sourceType === 'regulator' || sourceType === 'standard-setter') return 1;
  if (sourceType === 'multilateral') return 1;
  return 2;
}

function sourcePackForDomain(domain: CapsuleStarterDomain): CapsuleStarterSource[] {
  const byDomain: Partial<Record<CapsuleStarterDomain, CapsuleStarterSource[]>> = {
    sustainability: [
      { id: 'ifrs-s1-s2', label: 'IFRS ISSB sustainability and climate disclosure standards', url: 'https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/', sourceType: 'standard-setter', relevance: 'Global sustainability and climate disclosure baseline.', publisher: 'IFRS Foundation', date: '2026', reliabilityTier: 1 },
      { id: 'eu-esrs', label: 'European Commission CSRD and ESRS reporting rules', url: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en', sourceType: 'regulator', relevance: 'EU sustainability reporting and assurance obligations.', publisher: 'European Commission', date: '2026', reliabilityTier: 1 },
    ],
    finance: [
      { id: 'imf-dsa', label: 'IMF debt sustainability analysis resources', url: 'https://www.imf.org/en/Publications/DSA', sourceType: 'multilateral', relevance: 'Sovereign debt and macro-financial risk baseline.', publisher: 'International Monetary Fund', date: '2026', reliabilityTier: 1 },
      { id: 'world-bank-debt', label: 'World Bank international debt statistics', url: 'https://www.worldbank.org/en/programs/debt-statistics', sourceType: 'multilateral', relevance: 'Public debt and country-exposure data lane.', publisher: 'World Bank', date: '2026', reliabilityTier: 1 },
    ],
    hr: [
      { id: 'ilo-harassment-guide', label: 'ILO violence and harassment at work employer guide', url: 'https://www.ilo.org/publications/violence-and-harassment-work-practical-guide-employers', sourceType: 'multilateral', relevance: 'Employer-facing guidance for workplace violence and harassment policy.', publisher: 'International Labour Organization', date: '2022', reliabilityTier: 1 },
      { id: 'eeoc-harassment-guidance', label: 'EEOC harassment guidance and resources', url: 'https://www.eeoc.gov/harassment', sourceType: 'regulator', relevance: 'US public employer guidance lane for harassment policy and training posture.', publisher: 'U.S. Equal Employment Opportunity Commission', date: '2026', reliabilityTier: 1 },
    ],
    diplomacy: [
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation resources', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'UN mediation and diplomatic option design resources.', publisher: 'United Nations', date: '2026', reliabilityTier: 1 },
      { id: 'eeas-human-rights-sanctions', label: 'EEAS human-rights sanctions explainer', url: 'https://www.eeas.europa.eu/eeas/sanctions-defend-human-rights_en', sourceType: 'official', relevance: 'EU official posture for human-rights sanctions and diplomatic pressure tools.', publisher: 'European External Action Service', date: '2026', reliabilityTier: 1 },
    ],
    'humanitarian-rights': [
      { id: 'ocha-access', label: 'OCHA humanitarian access guidance', url: 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', sourceType: 'multilateral', relevance: 'Humanitarian access concepts and operational constraint analysis.', publisher: 'UN OCHA', date: '2026', reliabilityTier: 1 },
      { id: 'ohchr-library', label: 'OHCHR search library', url: 'https://searchlibrary.ohchr.org/', sourceType: 'public-library', relevance: 'Public OHCHR reporting and rights/accountability records search lane.', publisher: 'OHCHR', date: '2026', reliabilityTier: 2 },
    ],
    'ai-governance': [
      { id: 'nist-ai-rmf', label: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', sourceType: 'official', relevance: 'Primary US framework for AI risk governance and controls.', publisher: 'NIST', date: '2023', reliabilityTier: 1 },
      { id: 'eu-ai-act', label: 'European Commission AI Act overview', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', sourceType: 'regulator', relevance: 'Official EU risk-based AI regulation posture.', publisher: 'European Commission', date: '2026', reliabilityTier: 1 },
    ],
    'public-health': [
      { id: 'who-ercc', label: 'WHO emergency risk communication guidance', url: 'https://www.who.int/emergencies/risk-communications', sourceType: 'multilateral', relevance: 'Emergency communication, uncertainty, and public trust guidance.', publisher: 'World Health Organization', date: '2026', reliabilityTier: 1 },
      { id: 'who-rcce', label: 'WHO risk communication and community engagement resources', url: 'https://www.who.int/teams/risk-communication', sourceType: 'multilateral', relevance: 'Community engagement and feedback loop guidance.', publisher: 'World Health Organization', date: '2026', reliabilityTier: 1 },
    ],
    'critical-minerals': [
      { id: 'iea-critical-minerals', label: 'IEA critical minerals analysis', url: 'https://www.iea.org/topics/critical-minerals', sourceType: 'multilateral', relevance: 'Energy-transition mineral demand and supply concentration baseline.', publisher: 'International Energy Agency', date: '2026', reliabilityTier: 1 },
      { id: 'usgs-mineral-commodities', label: 'USGS mineral commodity summaries', url: 'https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries', sourceType: 'official', relevance: 'Production, reserve, and import reliance data lane.', publisher: 'U.S. Geological Survey', date: '2026', reliabilityTier: 1 },
    ],
    'cyber-resilience': [
      { id: 'cisa-cpg', label: 'CISA Cross-Sector Cybersecurity Performance Goals', url: 'https://www.cisa.gov/cross-sector-cybersecurity-performance-goals', sourceType: 'official', relevance: 'Critical infrastructure cyber resilience and hygiene baseline.', publisher: 'CISA', date: '2026', reliabilityTier: 1 },
      { id: 'nist-csf', label: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework', sourceType: 'official', relevance: 'Cyber risk, response, recovery, and governance vocabulary.', publisher: 'NIST', date: '2026', reliabilityTier: 1 },
    ],
    'migration-displacement': [
      { id: 'unhcr-global-trends', label: 'UNHCR Global Trends forced displacement', url: 'https://www.unhcr.org/global-trends', sourceType: 'multilateral', relevance: 'Forced displacement trends, categories, and definitions.', publisher: 'UNHCR', date: '2026', reliabilityTier: 1 },
      { id: 'iom-displacement', label: 'IOM Displacement Tracking Matrix', url: 'https://dtm.iom.int/', sourceType: 'multilateral', relevance: 'Operational displacement and mobility data source.', publisher: 'International Organization for Migration', date: '2026', reliabilityTier: 1 },
    ],
    'election-integrity': [
      { id: 'osce-odihr-handbook', label: 'OSCE/ODIHR election observation handbook', url: 'https://www.osce.org/odihr/elections/68439', sourceType: 'multilateral', relevance: 'Election observation method and assessment baseline.', publisher: 'OSCE/ODIHR', date: '2010', reliabilityTier: 1 },
      { id: 'idea-electoral-integrity', label: 'International IDEA electoral processes resources', url: 'https://www.idea.int/theme/electoral-processes', sourceType: 'multilateral', relevance: 'Comparative election process and democratic resilience context.', publisher: 'International IDEA', date: '2026', reliabilityTier: 2 },
    ],
    'source-intake': [
      { id: 'google-grounded-search-docs', label: 'Google Search grounding overview', url: 'https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview', sourceType: 'official', relevance: 'Grounding lane for source discovery and citation-backed answers.', publisher: 'Google Cloud', date: '2026', reliabilityTier: 1 },
      { id: 'praxis-sourceability-method', label: 'PRAXIS sourceability method', url: 'https://praxis.tacitus.me/learn#sourceability', sourceType: 'public-library', relevance: 'Starter method for turning source packs into reviewable capsule receipts.', publisher: 'PRAXIS starter catalog', date: CAPSULE_STARTER_CATALOG_VERSION, reliabilityTier: 3 },
    ],
    'exposure-mapping': [
      { id: 'imf-dsa', label: 'IMF debt sustainability analysis resources', url: 'https://www.imf.org/en/Publications/DSA', sourceType: 'multilateral', relevance: 'Primary IMF lane for sovereign debt and macro-financial exposure posture.', publisher: 'International Monetary Fund', date: '2026', reliabilityTier: 1 },
      { id: 'fatf-risk-based-approach', label: 'FATF risk-based approach guidance', url: 'https://www.fatf-gafi.org/en/topics/risk-based-approach.html', sourceType: 'standard-setter', relevance: 'Financial crime and sanctions-exposure review context.', publisher: 'FATF', date: '2026', reliabilityTier: 1 },
    ],
    'policy-review': [
      { id: 'ilo-harassment-guide', label: 'ILO violence and harassment at work employer guide', url: 'https://www.ilo.org/publications/violence-and-harassment-work-practical-guide-employers', sourceType: 'multilateral', relevance: 'Employer-facing public guidance for prevention, policy, reporting, and rollout review.', publisher: 'International Labour Organization', date: '2022', reliabilityTier: 1 },
      { id: 'eeoc-harassment-guidance', label: 'EEOC harassment guidance and resources', url: 'https://www.eeoc.gov/harassment', sourceType: 'regulator', relevance: 'US public employer guidance lane for harassment policy and training posture.', publisher: 'U.S. Equal Employment Opportunity Commission', date: '2026', reliabilityTier: 1 },
    ],
    'options-mapping': [
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation resources', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'Official UN lane for mediation concepts, agreements, and diplomatic option design.', publisher: 'United Nations', date: '2026', reliabilityTier: 1 },
      { id: 'eeas-human-rights-sanctions', label: 'EEAS human-rights sanctions explainer', url: 'https://www.eeas.europa.eu/eeas/sanctions-defend-human-rights_en', sourceType: 'official', relevance: 'EU official posture for human-rights sanctions and diplomatic pressure tools.', publisher: 'European External Action Service', date: '2026', reliabilityTier: 1 },
    ],
    'audit-review': [
      { id: 'ohchr-library-search', label: 'OHCHR public reporting library', url: 'https://searchlibrary.ohchr.org/', sourceType: 'public-library', relevance: 'Public human-rights source search lane for claim support and citation repair.', publisher: 'OHCHR', date: '2026', reliabilityTier: 2 },
      { id: 'praxis-claim-source-alignment', label: 'PRAXIS claim-source alignment method', url: 'https://praxis.tacitus.me/learn#claim-source-alignment', sourceType: 'public-library', relevance: 'Review pattern for supported, weak, unsupported, and stale claims.', publisher: 'PRAXIS starter catalog', date: CAPSULE_STARTER_CATALOG_VERSION, reliabilityTier: 3 },
    ],
    'analyst-role': [
      { id: 'oecd-policy-toolkit', label: 'OECD policy analysis and governance resources', url: 'https://www.oecd.org/governance/', sourceType: 'multilateral', relevance: 'General public-policy analysis context for analyst role capsules.', publisher: 'OECD', date: '2026', reliabilityTier: 1 },
      { id: 'praxis-role-operating-context', label: 'PRAXIS role operating context', url: 'https://praxis.tacitus.me/learn#role-capsules', sourceType: 'public-library', relevance: 'Starter guidance for role lenses, review gates, and output tone.', publisher: 'PRAXIS starter catalog', date: CAPSULE_STARTER_CATALOG_VERSION, reliabilityTier: 3 },
    ],
    'output-brief': [
      { id: 'praxis-output-quality-policy', label: 'PRAXIS output quality policy', url: 'https://praxis.tacitus.me/learn#output-quality', sourceType: 'public-library', relevance: 'Review lane for citation coverage, sourceability, and human approval before export.', publisher: 'PRAXIS starter catalog', date: CAPSULE_STARTER_CATALOG_VERSION, reliabilityTier: 3 },
      { id: 'plain-language-gov', label: 'Plain language government guidance', url: 'https://www.plainlanguage.gov/guidelines/', sourceType: 'official', relevance: 'Public guidance for concise, usable government-facing writing.', publisher: 'U.S. Plain Language Action and Information Network', date: '2026', reliabilityTier: 1 },
    ],
  };
  return normalizeStarterSourcePack(byDomain[domain] ?? []);
}

export const CAPSULE_STARTER_DEFINITIONS: CapsuleStarterDefinition[] = [
  starter('starter-situation-sustainability-transition', 'situation', 'sustainability', 'Sustainability transition capsule', 'A source-backed sustainability situation capsule for CSRD/ESRS-style reporting, transition risk, supply-chain exposure, and assurance gaps.', 'Use this when the work concerns climate-transition planning, sustainability reporting, supplier risk, or board-ready ESG posture. PRAXIS should separate regulatory requirements, company claims, value-chain evidence, and confidence gaps before drafting.', ['sustainability', 'csrd', 'esrs', 'issb', 'supply-chain'], { situationCoreId: 'starter-situation-sustainability-transition', pathCoreId: 'climate-development', sourceCoreIds: ['ifrs-s1-s2', 'eu-esrs'], toolCoreIds: ['grounded-research', 'sourceability'], outputCoreIds: ['country-risk-card'] }, ['grounded-research', 'sourceability', 'memo-drafter'], ['country-risk-card', 'options-memo'], ['starter-user-esg-sustainability-lead', 'starter-tool-source-pack-builder', 'starter-output-sustainability-risk-brief'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'ifrs-s1-s2', label: 'IFRS ISSB sustainability and climate disclosure standards', url: 'https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/', sourceType: 'standard-setter', relevance: 'Primary global baseline for sustainability and climate-related financial disclosure.' },
      { id: 'eu-esrs', label: 'European Commission ESRS and CSRD reporting rules', url: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en', sourceType: 'regulator', relevance: 'Official EU source for CSRD/ESRS sustainability reporting obligations.' },
    ],
    excerpts: [
      { sourceId: 'ifrs-s1-s2', text: 'ISSB standards are treated as baseline disclosure guidance for sustainability-related and climate-related financial risks and opportunities.' },
      { sourceId: 'eu-esrs', text: 'CSRD/ESRS analysis should keep value-chain reporting, material impacts, risks, opportunities, and assurance posture visible.' },
    ],
    suggestedQuestions: ['Which reporting obligation or assurance question is live?', 'Which suppliers, geographies, and transition risks are in scope?', 'Which claims need source receipts before drafting?'],
    suggestedNextActions: ['Attach company, supplier, and regulator sources to the capsule.', 'Run sourceability on any sustainability claim before export.', 'Draft a risk brief with evidence gaps and next data requests.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'sustainability-source-pack-to-risk-brief', outputGoal: 'Sustainability risk brief with source receipts and value-chain gaps.', approvalNotes: 'Human approval required before treating corporate claims as verified.' },
    aiUseGuidance: 'Treat this as a reporting and transition-risk workbench. Do not infer compliance; map obligations, claims, source receipts, value-chain gaps, and recommended next checks.',
  }),
  starter('starter-situation-finance-country-risk', 'situation', 'finance', 'Finance and country risk capsule', 'A finance situation capsule for sovereign/country risk, debt sustainability, sanctions exposure, market-stability signals, and source confidence.', 'Use this when the analysis depends on macro-financial indicators, country exposure, public debt posture, sanctions spillovers, or regulator/IFI evidence. Keep numbers, dates, jurisdictions, and confidence separate.', ['finance', 'sovereign-risk', 'country-risk', 'sanctions', 'market-stability'], { situationCoreId: 'starter-situation-finance-country-risk', pathCoreId: 'economic-sanctions', sourceCoreIds: ['imf-dsa', 'world-bank-debt'], toolCoreIds: ['grounded-research', 'sourceability', 'ach'], outputCoreIds: ['country-risk-card'] }, ['grounded-research', 'sourceability', 'ach'], ['country-risk-card', 'options-memo'], ['starter-user-finance-risk-analyst', 'starter-tool-financial-exposure-mapper', 'starter-output-finance-exposure-note'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'imf-dsa', label: 'IMF debt sustainability analysis', url: 'https://www.imf.org/en/About/Factsheets/Sheets/2023/Debt-Sustainability-Framework-for-Low-Income-Countries', sourceType: 'multilateral', relevance: 'Primary IFI frame for debt sustainability and country risk posture.' },
      { id: 'world-bank-debt', label: 'World Bank International Debt Statistics', url: 'https://www.worldbank.org/en/programs/debt-statistics/ids', sourceType: 'multilateral', relevance: 'Official source for public external debt and creditor exposure indicators.' },
    ],
    excerpts: [
      { sourceId: 'imf-dsa', text: 'Debt-sustainability work should distinguish baseline assumptions, stress scenarios, thresholds, and the date of the assessment.' },
      { sourceId: 'world-bank-debt', text: 'Country exposure notes should tie claims to dated debt, creditor, sector, and balance-of-payments evidence instead of generic market language.' },
    ],
    suggestedQuestions: ['What country, sector, or counterparty exposure is being assessed?', 'Which indicators are current as of the analysis date?', 'Which sanctions or market-stability assumptions need review?'],
    suggestedNextActions: ['Build a source pack from IMF, World Bank, regulator, and sanctions sources.', 'Map exposure by jurisdiction, sector, and date.', 'Use ACH for alternative explanations behind financial stress signals.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'country-risk-source-pack-to-exposure-note', outputGoal: 'Finance exposure note with indicators, confidence, and unresolved data gaps.', approvalNotes: 'Do not present financial, legal, or sanctions conclusions as advice; keep review gates visible.' },
    aiUseGuidance: 'Treat numbers as dated evidence. Ask for missing time series, regulator sources, and sanctions lists before making exposure judgments.',
  }),
  starter('starter-situation-hr-harassment-policy', 'situation', 'hr', 'HR harassment policy capsule', 'An HR situation capsule for workplace violence and harassment, policy response, employer duties, rollout risk, and affected-group communication.', 'Use this for public employer-guidance-grounded HR policy work. PRAXIS should distinguish prevention duties, reporting channels, investigation posture, training needs, retaliation risk, and communications sequencing.', ['hr', 'workplace-harassment', 'policy-response', 'employer-guidance'], { situationCoreId: 'starter-situation-hr-harassment-policy', pathCoreId: 'hr-policy', sourceCoreIds: ['ilo-harassment-guide'], toolCoreIds: ['sourceability', 'contradiction-finder'], outputCoreIds: ['options-memo'] }, ['sourceability', 'contradiction-finder', 'memo-drafter'], ['options-memo', 'talking-points'], ['starter-user-hr-policy-owner', 'starter-tool-hr-policy-impact-reviewer', 'starter-output-hr-rollout-recommendation'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'ilo-harassment-guide', label: 'ILO violence and harassment at work employer guide', url: 'https://www.ilo.org/publications/violence-and-harassment-work-practical-guide-employers', sourceType: 'multilateral', relevance: 'Public employer guidance for prevention, policy response, and workplace processes.' },
      { id: 'eeoc-harassment', label: 'US EEOC harassment guidance', url: 'https://www.eeoc.gov/harassment', sourceType: 'regulator', relevance: 'US public guidance for workplace harassment definitions and employer responsibilities.' },
    ],
    excerpts: [
      { sourceId: 'ilo-harassment-guide', text: 'Policy review should cover prevention, reporting, investigation, support, training, and employer accountability as separate workstreams.' },
      { sourceId: 'eeoc-harassment', text: 'Harassment analysis should avoid naming private individuals and should frame facts, process, and remedies in a rights-preserving way.' },
    ],
    suggestedQuestions: ['Which policy, location, worker group, or incident pattern is in scope?', 'What reporting and anti-retaliation channels already exist?', 'Which legal review or employee-relations approval is required?'],
    suggestedNextActions: ['Attach policy text and public employer guidance.', 'Review rollout risks and affected-group communication needs.', 'Draft a recommendation with legal-review and HR-approval gates.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'hr-policy-review-to-rollout-note', outputGoal: 'HR rollout recommendation with public-guidance support and review gates.', approvalNotes: 'Do not process private allegations or personal data in starter content.' },
    aiUseGuidance: 'Treat this as public policy guidance, not private HR case handling. Keep named people, protected data, and legal conclusions out of the starter answer.',
  }),
  starter('starter-situation-diplomatic-options', 'situation', 'diplomacy', 'Diplomatic options capsule', 'A diplomacy situation capsule for mediation posture, diplomatic options, human-rights sanctions context, stakeholder incentives, and official-source caveats.', 'Use this when the user needs diplomatic pathways, mediation options, sanctions posture, or negotiation sequencing. PRAXIS should map actors, mandates, leverage, official positions, and risks without over-claiming private intent.', ['diplomacy', 'mediation', 'sanctions', 'human-rights', 'official-sources'], { situationCoreId: 'starter-situation-diplomatic-options', pathCoreId: 'foreign-policy', sourceCoreIds: ['eeas-human-rights-sanctions', 'un-peacemaker'], toolCoreIds: ['stakeholder-map', 'position-vs-interest', 'sourceability'], outputCoreIds: ['diplomatic-cable'] }, ['stakeholder-map', 'position-vs-interest', 'sourceability'], ['diplomatic-cable', 'talking-points'], ['starter-user-diplomatic-desk-officer', 'starter-tool-diplomacy-options-mapper', 'starter-output-diplomatic-options-memo'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'eeas-human-rights-sanctions', label: 'EEAS human-rights sanctions explainer', url: 'https://www.eeas.europa.eu/eeas/sanctions-defend-human-rights_en', sourceType: 'official', relevance: 'Official EU posture on sanctions used to defend human rights.' },
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation support', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'Official UN mediation and peace process reference lane.' },
    ],
    excerpts: [
      { sourceId: 'eeas-human-rights-sanctions', text: 'Sanctions posture should be separated from diplomatic options, legal basis, targets, intended pressure, and likely political effects.' },
      { sourceId: 'un-peacemaker', text: 'Mediation analysis should distinguish parties, mandates, interests, sequencing, confidence-building measures, and implementation constraints.' },
    ],
    suggestedQuestions: ['Which actors, mandates, and official positions are in scope?', 'Is the user asking for sanctions posture, mediation sequencing, or talking points?', 'What would change the recommended diplomatic option?'],
    suggestedNextActions: ['Map stakeholders and interests before drafting options.', 'Attach official statements and sanctions/legal sources.', 'Draft options with risks, sequencing, and source caveats.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'diplomatic-options-map-to-cable', outputGoal: 'Diplomatic options memo or cable with official-source caveats.', approvalNotes: 'Keep sanctions/legal judgments and private diplomatic intent review-gated.' },
    aiUseGuidance: 'Use official-source posture first. Separate facts, positions, inferred incentives, options, and risks so the memo remains usable by a desk officer.',
  }),
  starter('starter-situation-humanitarian-rights-access', 'situation', 'humanitarian-rights', 'Humanitarian access and rights capsule', 'A humanitarian-rights situation capsule for access constraints, affected populations, accountability questions, OHCHR/OCHA source lanes, and evidence gaps.', 'Use this when the work concerns humanitarian access, protection, rights allegations, or crisis monitoring. PRAXIS should separate operational access reporting from rights/accountability claims and keep sourceability explicit.', ['humanitarian', 'rights', 'ocha', 'ohchr', 'access', 'accountability'], { situationCoreId: 'starter-situation-humanitarian-rights-access', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['ocha-access', 'ohchr-library'], toolCoreIds: ['grounded-research', 'sourceability'], outputCoreIds: ['humanitarian-one-pager'] }, ['grounded-research', 'sourceability', 'memo-drafter'], ['humanitarian-one-pager', 'options-memo'], ['starter-user-humanitarian-legal-investigator', 'starter-tool-sourceability-audit-reviewer', 'starter-output-humanitarian-access-brief'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'ocha-access', label: 'OCHA humanitarian access guidance', url: 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', sourceType: 'multilateral', relevance: 'Official humanitarian access concepts and operational constraints.' },
      { id: 'ohchr-library', label: 'OHCHR search library', url: 'https://searchlibrary.ohchr.org/', sourceType: 'public-library', relevance: 'Public OHCHR reporting and records search lane for rights/accountability work.' },
    ],
    excerpts: [
      { sourceId: 'ocha-access', text: 'Access analysis should capture constraints, affected populations, routes, controlling actors, negotiation needs, and operational risks.' },
      { sourceId: 'ohchr-library', text: 'Rights and accountability claims should identify report type, issuing body, date, alleged conduct, evidence quality, and corroboration gaps.' },
    ],
    suggestedQuestions: ['Which affected population, location, and access constraint is in scope?', 'Is the output operational, advocacy, legal, or accountability-oriented?', 'Which claims require corroboration or sourceability review?'],
    suggestedNextActions: ['Attach OCHA/OHCHR and operational source receipts.', 'Map access constraints separately from rights allegations.', 'Draft an access or accountability brief with confidence levels.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'humanitarian-access-to-accountability-brief', outputGoal: 'Humanitarian access or accountability brief with source confidence and gaps.', approvalNotes: 'Keep allegations, legal thresholds, and personal data under human review.' },
    aiUseGuidance: 'Do not merge operational reporting with legal conclusions. Make confidence, source type, affected population, and access constraint visible before recommending action.',
  }),
  starter('starter-situation-ai-governance-procurement', 'situation', 'ai-governance', 'AI governance procurement capsule', 'A public-sector AI governance capsule for model-risk posture, procurement controls, impact assessment, vendor claims, and oversight gaps.', 'Use this when a team is buying, deploying, or reviewing AI systems. PRAXIS should separate law, risk framework, procurement evidence, model claims, human oversight, and monitoring obligations before drafting advice.', ['ai-governance', 'procurement', 'model-risk', 'public-sector', 'oversight'], { situationCoreId: 'starter-situation-ai-governance-procurement', pathCoreId: 'governance-public-sector', sourceCoreIds: ['nist-ai-rmf', 'eu-ai-act', 'oecd-ai-principles'], toolCoreIds: ['grounded-research', 'sourceability', 'contradiction-finder'], outputCoreIds: ['options-memo'] }, ['grounded-research', 'sourceability', 'contradiction-finder'], ['options-memo', 'country-risk-card'], ['starter-tool-source-pack-builder', 'starter-output-ai-governance-risk-brief', 'starter-user-finance-risk-analyst'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'nist-ai-rmf', label: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', sourceType: 'official', relevance: 'Primary US framework for mapping, measuring, managing, and governing AI risks.', publisher: 'NIST', date: '2023', reliabilityTier: 1 },
      { id: 'eu-ai-act', label: 'European Commission AI Act overview', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', sourceType: 'regulator', relevance: 'Official EU posture for risk-based AI regulation and obligations.', publisher: 'European Commission', date: '2026', reliabilityTier: 1 },
      { id: 'oecd-ai-principles', label: 'OECD AI Principles', url: 'https://oecd.ai/en/ai-principles', sourceType: 'multilateral', relevance: 'International principles for trustworthy AI and governance posture.', publisher: 'OECD.AI', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'nist-ai-rmf', text: 'Use the NIST AI RMF as the control vocabulary for govern, map, measure, and manage questions.' },
      { sourceId: 'eu-ai-act', text: 'AI Act analysis should mark whether obligations are legal requirements, implementation guidance, or unresolved jurisdiction questions.' },
      { sourceId: 'oecd-ai-principles', text: 'OECD principles provide a cross-border lens for trustworthy AI, accountability, transparency, and human-centered deployment.' },
    ],
    suggestedQuestions: ['What AI system, procurement stage, and deployment context are in scope?', 'Which obligations are legal, policy, contractual, or risk-framework controls?', 'What evidence supports vendor claims about safety, data, accuracy, and human oversight?'],
    suggestedNextActions: ['Build an AI source pack with law, framework, procurement, and vendor-evidence lanes.', 'Map each risk to an owner, control, source, and unresolved decision.', 'Draft an AI governance risk brief with non-compliance claims review-gated.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'ai-governance-procurement', outputGoal: 'AI governance risk brief with obligations, controls, evidence gaps, and review gates.', approvalNotes: 'Do not certify compliance or model safety; keep legal and technical assurance review-gated.' },
    aiUseGuidance: 'Be strict about claim type. Separate official obligations, best-practice frameworks, vendor assertions, local policy choices, and evidence gaps.',
  }),
  starter('starter-situation-public-health-risk-communication', 'situation', 'public-health', 'Public health risk communication capsule', 'A crisis communication capsule for public health emergencies, misinformation pressure, community engagement, and operational message discipline.', 'Use this when leaders need a source-backed public health communication plan. PRAXIS should separate what is known, what is uncertain, who is affected, trusted channels, message risks, and monitoring feedback loops.', ['public-health', 'risk-communication', 'emergency', 'misinformation', 'community-engagement'], { situationCoreId: 'starter-situation-public-health-risk-communication', pathCoreId: 'crisis-management', sourceCoreIds: ['who-ercc', 'who-rcce'], toolCoreIds: ['grounded-research', 'sourceability', 'memo-drafter'], outputCoreIds: ['options-memo'] }, ['grounded-research', 'sourceability', 'memo-drafter'], ['options-memo', 'talking-points'], ['starter-tool-source-pack-builder', 'starter-output-health-risk-communications-plan', 'starter-output-diplomatic-options-memo'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'who-ercc', label: 'WHO emergency risk communication guidance', url: 'https://www.who.int/emergencies/risk-communications', sourceType: 'multilateral', relevance: 'WHO lane for emergency communication principles, uncertainty, and public trust.', publisher: 'World Health Organization', date: '2026', reliabilityTier: 1 },
      { id: 'who-rcce', label: 'WHO risk communication and community engagement resources', url: 'https://www.who.int/teams/risk-communication', sourceType: 'multilateral', relevance: 'Community engagement and feedback loop guidance for emergency response.', publisher: 'World Health Organization', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'who-ercc', text: 'Emergency communication should state what is known, what is unknown, what is being done, and what people should do next.' },
      { sourceId: 'who-rcce', text: 'Community engagement is treated as an operating channel, not only a broadcast or press function.' },
    ],
    suggestedQuestions: ['Who needs to act after reading the message?', 'Which uncertainty must be stated plainly rather than hidden?', 'What rumor, channel, or trust gap could derail the response?'],
    suggestedNextActions: ['Build a message map with known, unknown, action, and source fields.', 'Draft talking points and community feedback checks.', 'Run sourceability on claims before public release.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'health-risk-communication', outputGoal: 'Risk communication plan with audience, message, uncertainty, channels, monitoring, and approval gates.', approvalNotes: 'Public health advice and emergency instructions require authorized human review.' },
    aiUseGuidance: 'Use plain language, visible uncertainty, and action-oriented phrasing. Do not invent medical guidance or operational instructions.',
  }),
  starter('starter-situation-critical-minerals-supply-chain', 'situation', 'critical-minerals', 'Critical minerals supply-chain capsule', 'A strategic supply-chain capsule for critical minerals, industrial policy, energy-transition exposure, supplier concentration, and resilience options.', 'Use this when the analysis concerns mineral dependency, battery or clean-tech supply chains, geopolitical exposure, or resilience planning. PRAXIS should map material, jurisdiction, supplier, policy lever, and evidence confidence.', ['critical-minerals', 'supply-chain', 'industrial-policy', 'energy-transition', 'resilience'], { situationCoreId: 'starter-situation-critical-minerals-supply-chain', pathCoreId: 'strategy-operations', sourceCoreIds: ['iea-critical-minerals', 'usgs-mineral-commodities'], toolCoreIds: ['grounded-research', 'sourceability', 'ach'], outputCoreIds: ['country-risk-card'] }, ['grounded-research', 'sourceability', 'ach'], ['country-risk-card', 'options-memo'], ['starter-tool-financial-exposure-mapper', 'starter-output-critical-minerals-exposure-map', 'starter-output-sustainability-risk-brief'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'iea-critical-minerals', label: 'IEA critical minerals analysis', url: 'https://www.iea.org/topics/critical-minerals', sourceType: 'multilateral', relevance: 'Energy-transition mineral demand, supply concentration, and market-risk baseline.', publisher: 'International Energy Agency', date: '2026', reliabilityTier: 1 },
      { id: 'usgs-mineral-commodities', label: 'USGS mineral commodity summaries', url: 'https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries', sourceType: 'official', relevance: 'Primary data lane for mineral production, reserves, and import reliance.', publisher: 'U.S. Geological Survey', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'iea-critical-minerals', text: 'IEA material should anchor demand, concentration, refining, and transition-risk assumptions.' },
      { sourceId: 'usgs-mineral-commodities', text: 'USGS summaries should anchor material-specific production, reserves, and import reliance claims.' },
    ],
    suggestedQuestions: ['Which mineral, technology, geography, and decision window are in scope?', 'Where are extraction, processing, refining, logistics, and substitution risks concentrated?', 'Which resilience options are policy, procurement, stockpile, recycling, or substitution choices?'],
    suggestedNextActions: ['Create an exposure map by mineral, jurisdiction, supplier, and chokepoint.', 'Separate data-backed exposure from strategic judgment.', 'Draft resilience options with evidence confidence and tradeoffs.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'critical-minerals-exposure', outputGoal: 'Exposure map and options memo for supply-chain resilience.', approvalNotes: 'Market forecasts and procurement decisions require dated sources and human review.' },
    aiUseGuidance: 'Keep quantities, jurisdictions, chokepoints, and policy levers explicit. Treat market forecasts as dated assumptions.',
  }),
  starter('starter-situation-cyber-infrastructure-resilience', 'situation', 'cyber-resilience', 'Cyber infrastructure resilience capsule', 'A cyber-public-risk capsule for critical infrastructure incidents, service continuity, vulnerability posture, public communication, and recovery priorities.', 'Use this when cyber or digital infrastructure risk intersects with public operations, utilities, government services, or crisis response. PRAXIS should separate incident facts, indicators, mitigations, public risk, and communication boundaries.', ['cyber', 'critical-infrastructure', 'resilience', 'public-risk', 'incident-response'], { situationCoreId: 'starter-situation-cyber-infrastructure-resilience', pathCoreId: 'information-cyber', sourceCoreIds: ['cisa-cpg', 'nist-csf'], toolCoreIds: ['grounded-research', 'sourceability', 'contradiction-finder'], outputCoreIds: ['risk-monitor-card'] }, ['grounded-research', 'sourceability', 'contradiction-finder'], ['risk-monitor-card', 'options-memo'], ['starter-tool-sourceability-audit-reviewer', 'starter-output-cyber-resilience-action-memo', 'starter-output-health-risk-communications-plan'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'cisa-cpg', label: 'CISA Cross-Sector Cybersecurity Performance Goals', url: 'https://www.cisa.gov/cross-sector-cybersecurity-performance-goals', sourceType: 'official', relevance: 'US critical infrastructure baseline for cyber performance goals and operational resilience.', publisher: 'CISA', date: '2026', reliabilityTier: 1 },
      { id: 'nist-csf', label: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework', sourceType: 'official', relevance: 'Control vocabulary for identify, protect, detect, respond, recover, and govern posture.', publisher: 'NIST', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'cisa-cpg', text: 'CISA goals should anchor practical cyber hygiene, resilience, and cross-sector critical infrastructure checks.' },
      { sourceId: 'nist-csf', text: 'NIST CSF functions provide the organizing language for cyber risk, response, and recovery posture.' },
    ],
    suggestedQuestions: ['Which service, asset class, or incident phase is in scope?', 'What is known, suspected, unresolved, and sensitive?', 'Which mitigation, communication, or recovery decision must be made next?'],
    suggestedNextActions: ['Map incident facts against identify/protect/detect/respond/recover controls.', 'Draft a resilience action memo with public communication caveats.', 'Escalate sensitive indicators, attribution, and operational security claims.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'cyber-infrastructure-resilience', outputGoal: 'Cyber resilience action memo with controls, gaps, communications, and recovery priorities.', approvalNotes: 'Do not disclose sensitive indicators, vulnerabilities, credentials, or attribution claims without authorized review.' },
    aiUseGuidance: 'Use public-risk and resilience language. Avoid operational exploit details, unsupported attribution, or instructions that could enable abuse.',
  }),
  starter('starter-situation-displacement-border-protection', 'situation', 'migration-displacement', 'Displacement and protection capsule', 'A migration and protection capsule for forced displacement, border pressure, humanitarian needs, host-community strain, and rights safeguards.', 'Use this when the situation involves refugees, internally displaced people, border operations, or protection risks. PRAXIS should separate displacement data, legal status, humanitarian needs, access, host-community impacts, and contested narratives.', ['migration', 'displacement', 'protection', 'border-policy', 'unhcr'], { situationCoreId: 'starter-situation-displacement-border-protection', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['unhcr-global-trends', 'iom-displacement'], toolCoreIds: ['grounded-research', 'sourceability', 'stakeholder-map'], outputCoreIds: ['humanitarian-one-pager'] }, ['grounded-research', 'sourceability', 'stakeholder-map'], ['humanitarian-one-pager', 'options-memo'], ['starter-user-humanitarian-legal-investigator', 'starter-output-humanitarian-access-brief', 'starter-tool-sourceability-audit-reviewer'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'unhcr-global-trends', label: 'UNHCR Global Trends forced displacement', url: 'https://www.unhcr.org/global-trends', sourceType: 'multilateral', relevance: 'Primary global lane for forced displacement trends and definitions.', publisher: 'UNHCR', date: '2026', reliabilityTier: 1 },
      { id: 'iom-displacement', label: 'IOM Displacement Tracking Matrix', url: 'https://dtm.iom.int/', sourceType: 'multilateral', relevance: 'Operational displacement and mobility data source for affected populations and movements.', publisher: 'International Organization for Migration', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'unhcr-global-trends', text: 'UNHCR trend data should anchor global displacement categories, definitions, and scale claims.' },
      { sourceId: 'iom-displacement', text: 'IOM DTM should anchor mobility, site, route, and affected-population claims where available.' },
    ],
    suggestedQuestions: ['Which affected groups, geography, route, and time window are in scope?', 'What legal or protection categories are known versus inferred?', 'Which needs, access constraints, or host-community pressures are evidenced?'],
    suggestedNextActions: ['Build a population, route, need, and protection matrix.', 'Separate operational facts from rights or legal claims.', 'Draft options with source confidence and safeguards.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'displacement-protection', outputGoal: 'Protection or humanitarian brief with population data, constraints, safeguards, and evidence gaps.', approvalNotes: 'Personal data, legal status, and protection-risk claims require careful handling and human review.' },
    aiUseGuidance: 'Use protective, evidence-bound language. Do not reduce people to flows; preserve uncertainty, categories, and safeguards.',
  }),
  starter('starter-situation-election-integrity-information', 'situation', 'election-integrity', 'Election integrity information capsule', 'An election-integrity capsule for observation posture, information risks, institutional trust, violence risk, and democratic-resilience options.', 'Use this when the work concerns an election, referendum, democratic process, or information environment around public trust. PRAXIS should separate official rules, observer findings, misinformation claims, security incidents, and confidence judgments.', ['election-integrity', 'democracy', 'information-risk', 'observation', 'public-trust'], { situationCoreId: 'starter-situation-election-integrity-information', pathCoreId: 'public-sector-policy', sourceCoreIds: ['osce-odihr-handbook', 'idea-electoral-integrity'], toolCoreIds: ['grounded-research', 'sourceability', 'stakeholder-map'], outputCoreIds: ['electoral-risk-card'] }, ['grounded-research', 'sourceability', 'stakeholder-map'], ['electoral-risk-card', 'options-memo'], ['starter-tool-diplomacy-options-mapper', 'starter-output-diplomatic-options-memo', 'starter-tool-sourceability-audit-reviewer'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'osce-odihr-handbook', label: 'OSCE/ODIHR election observation handbook', url: 'https://www.osce.org/odihr/elections/68439', sourceType: 'multilateral', relevance: 'Official election observation method and integrity assessment baseline.', publisher: 'OSCE/ODIHR', date: '2010', reliabilityTier: 1 },
      { id: 'idea-electoral-integrity', label: 'International IDEA electoral processes resources', url: 'https://www.idea.int/theme/electoral-processes', sourceType: 'multilateral', relevance: 'Comparative electoral process and democratic-resilience reference lane.', publisher: 'International IDEA', date: '2026', reliabilityTier: 2 },
    ],
    excerpts: [
      { sourceId: 'osce-odihr-handbook', text: 'Observation-method sources should anchor what can be assessed, observed, inferred, or left unverified.' },
      { sourceId: 'idea-electoral-integrity', text: 'IDEA resources provide comparative context for electoral processes, institutions, and democratic resilience.' },
    ],
    suggestedQuestions: ['Which phase of the electoral cycle is in scope?', 'Which claims are official results, observer findings, media reports, or unverified allegations?', 'What information, violence, institutional, or legal risk should be monitored next?'],
    suggestedNextActions: ['Build a phase-based risk card with sources and confidence.', 'Separate observer evidence from narrative claims.', 'Draft options that avoid unsupported legitimacy judgments.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'election-integrity-information', outputGoal: 'Electoral risk card or options memo with source confidence and observation limits.', approvalNotes: 'Legitimacy, fraud, violence, and attribution claims require strong sourcing and human review.' },
    aiUseGuidance: 'Keep election language precise. Distinguish official results, observer findings, allegations, narratives, and analytic judgment.',
  }),
  starter('starter-tool-source-pack-builder', 'tool', 'source-intake', 'Source pack builder tool capsule', 'A tool capsule that turns a weak capsule into a sourced public-domain source pack with receipts, excerpts, gaps, and promotion rules.', 'Use this whenever a situation lacks enough official or primary-source coverage. It routes PRAXIS toward grounded research, sourceability, and explicit source promotion decisions.', ['source-pack', 'grounded-search', 'sourceability', 'research'], { toolCoreIds: ['grounded-research', 'sourceability', 'ask-praxis'], objectiveCoreIds: ['build-source-pack'], sourceCoreIds: ['grounded_search'] }, ['grounded-research', 'sourceability', 'ask-praxis'], ['country-one-pager', 'options-memo'], ['starter-situation-sustainability-transition', 'starter-situation-finance-country-risk', 'starter-output-sustainability-risk-brief'], {
    suggestedQuestions: ['Which claims need official or primary sources?', 'Which sources should be attached versus left as search results?', 'What is the minimum source mix before drafting?'],
    suggestedNextActions: ['Run grounded research against official sources first.', 'Promote only sources with usable citation metadata.', 'Send weak claims to sourceability review.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'source-pack-first', outputGoal: 'Reusable source pack with excerpts, reliability notes, and remaining gaps.', approvalNotes: 'Search results are not canonical until attached to the capsule.' },
    aiUseGuidance: 'Prioritize official, regulator, multilateral, and primary sources. Return source IDs, excerpts, reliability notes, and explicit gaps instead of a narrative-only answer.',
  }),
  starter('starter-tool-financial-exposure-mapper', 'tool', 'exposure-mapping', 'Financial exposure mapper tool capsule', 'A tool capsule for country, sector, entity, sanctions, and market-stability exposure mapping from dated public sources.', 'Use this to structure financial risk without pretending to provide investment or legal advice. It keeps jurisdictions, indicators, counterparties, and sanctions assumptions visible.', ['finance', 'exposure', 'sanctions', 'risk'], { toolCoreIds: ['grounded-research', 'ach', 'sourceability'], objectiveCoreIds: ['map-financial-exposure'], outputCoreIds: ['country-risk-card'] }, ['grounded-research', 'ach', 'sourceability'], ['country-risk-card', 'options-memo'], ['starter-situation-finance-country-risk', 'starter-user-finance-risk-analyst', 'starter-output-finance-exposure-note'], {
    suggestedQuestions: ['Which exposure unit is being mapped?', 'What date and source governs each indicator?', 'Which alternative explanations could explain the risk signal?'],
    suggestedNextActions: ['Build an exposure table by jurisdiction, sector, entity, and date.', 'Use ACH for competing risk explanations.', 'Draft a non-advice exposure note with review gates.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'financial-exposure-map', outputGoal: 'Exposure map and finance note with dated indicators and caveats.', approvalNotes: 'Financial and sanctions conclusions require expert review.' },
    aiUseGuidance: 'Map exposure and confidence; do not recommend trades or legal actions. Every material number needs a source, date, and caveat.',
  }),
  starter('starter-tool-hr-policy-impact-reviewer', 'tool', 'policy-review', 'HR policy impact reviewer tool capsule', 'A tool capsule for HR policy impact, affected-group analysis, rollout sequencing, sourceability, and review gates.', 'Use this when an HR change needs practical review before announcement. It separates policy text, public guidance, affected groups, risk controls, and communications needs.', ['hr', 'policy-impact', 'rollout', 'review'], { toolCoreIds: ['sourceability', 'contradiction-finder', 'memo-drafter'], objectiveCoreIds: ['review-hr-policy-impact'], outputCoreIds: ['options-memo'] }, ['sourceability', 'contradiction-finder', 'memo-drafter'], ['options-memo', 'talking-points'], ['starter-situation-hr-harassment-policy', 'starter-user-hr-policy-owner', 'starter-output-hr-rollout-recommendation'], {
    suggestedQuestions: ['Which policy text or rollout decision is being reviewed?', 'Which employee groups, managers, and channels are affected?', 'Which legal or HR approvals are required?'],
    suggestedNextActions: ['Attach policy text and public guidance.', 'Review contradictions, affected groups, and rollout risks.', 'Draft recommendation and talking points with approval gates.'],
    agentWorkflow: { preferredAgentId: 'red-team-analyst', routeHint: 'hr-policy-impact-review', outputGoal: 'HR rollout recommendation with risks, mitigations, and review gates.', approvalNotes: 'Private personnel facts and protected data should remain outside this starter.' },
    aiUseGuidance: 'Frame HR policy operationally and cautiously. Keep private allegations out, and mark legal review requirements before drafting rollout language.',
  }),
  starter('starter-tool-diplomacy-options-mapper', 'tool', 'options-mapping', 'Diplomacy options mapper tool capsule', 'A tool capsule for mapping parties, interests, leverage, official positions, options, risks, and diplomatic sequencing.', 'Use this when the user needs options rather than a generic geopolitical summary. It should route through stakeholder mapping, position-versus-interest analysis, and sourceability.', ['diplomacy', 'options', 'stakeholders', 'mediation'], { toolCoreIds: ['stakeholder-map', 'position-vs-interest', 'sourceability'], graphCoreId: 'starter-graph-diplomacy-options', objectiveCoreIds: ['map-diplomatic-options'], outputCoreIds: ['diplomatic-cable'] }, ['stakeholder-map', 'position-vs-interest', 'sourceability'], ['diplomatic-cable', 'talking-points'], ['starter-situation-diplomatic-options', 'starter-user-diplomatic-desk-officer', 'starter-output-diplomatic-options-memo'], {
    suggestedQuestions: ['What decision window and audience is the options memo serving?', 'Which actors have mandate, leverage, or veto power?', 'Which official-source caveats should limit the analysis?'],
    suggestedNextActions: ['Map actors and interests first.', 'Separate official positions from inferred incentives.', 'Draft options with sequencing and risk controls.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'diplomatic-options-mapping', outputGoal: 'Diplomatic options memo with options, leverage, source caveats, and next moves.', approvalNotes: 'Treat inferred intent and sanctions/legal posture as review-gated.' },
    aiUseGuidance: 'Produce a disciplined options map: actor, interest, leverage, option, risk, source support, and watch item. Avoid polished certainty.',
  }),
  starter('starter-tool-sourceability-audit-reviewer', 'tool', 'audit-review', 'Sourceability and audit reviewer tool capsule', 'A tool capsule for claim support, source quality, citation gaps, output approval posture, and audit-ready receipts.', 'Use this before hardening any output capsule. It marks unsupported claims, weak citations, stale evidence, missing source IDs, and human-review requirements.', ['sourceability', 'audit', 'citations', 'review'], { toolCoreIds: ['sourceability', 'contradiction-finder', 'ach'], objectiveCoreIds: ['audit-output-sourceability'], outputCoreIds: ['options-memo'] }, ['sourceability', 'contradiction-finder', 'ach'], ['options-memo', 'humanitarian-one-pager'], ['starter-situation-humanitarian-rights-access', 'starter-output-humanitarian-access-brief', 'starter-user-humanitarian-legal-investigator'], {
    suggestedQuestions: ['Which claims are unsupported, stale, or over-confident?', 'Which source IDs and excerpts back each material statement?', 'What must remain blocked until human review?'],
    suggestedNextActions: ['Run sourceability on material claims.', 'Mark stale or missing evidence explicitly.', 'Prepare an audit receipt before output export.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'sourceability-audit-before-export', outputGoal: 'Audit review with unsupported claims, source gaps, and approval status.', approvalNotes: 'Block approval on unsupported claims or missing source bindings.' },
    aiUseGuidance: 'Review evidence rather than rewriting around gaps. Preserve uncertainty, mark unsupported claims, and keep approval blockers explicit.',
  }),
  starter('starter-output-sustainability-risk-brief', 'output', 'output-brief', 'Sustainability risk brief output capsule', 'An output capsule for sustainability transition, CSRD/ESRS/ISSB posture, supply-chain risk, and evidence gaps.', 'Use this when the final artifact should brief risks, reporting obligations, affected operations, source confidence, and next data requests.', ['sustainability', 'risk-brief', 'csrd', 'issb'], { outputCoreIds: ['country-risk-card'], productCoreIds: ['country-risk-card'], objectiveCoreIds: ['draft-sustainability-risk-brief'] }, ['memo-drafter', 'sourceability', 'grounded-research'], ['country-risk-card', 'options-memo'], ['starter-situation-sustainability-transition', 'starter-tool-source-pack-builder', 'starter-user-esg-sustainability-lead'], {
    suggestedQuestions: ['Who is the audience for the sustainability risk brief?', 'Which reporting, operational, or supplier risks must be separated?', 'Which sources are acceptable for each claim?'],
    suggestedNextActions: ['Draft risk sections with source IDs.', 'List evidence gaps and data-owner asks.', 'Run sourceability before export.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'sustainability-risk-brief-output', outputGoal: 'Brief with risk, obligation, source support, and next data request sections.', approvalNotes: 'Do not imply assurance or compliance certification.' },
    aiUseGuidance: 'Keep this output structured for review: finding, source support, implication, confidence, gap, and next action.',
  }),
  starter('starter-output-finance-exposure-note', 'output', 'output-brief', 'Finance exposure note output capsule', 'An output capsule for country or sovereign exposure, sanctions touchpoints, market-stability indicators, and caveated risk posture.', 'Use this when the end product is a concise, non-advice finance exposure note grounded in dated public sources.', ['finance', 'exposure-note', 'country-risk', 'sanctions'], { outputCoreIds: ['country-risk-card'], productCoreIds: ['country-risk-card'], objectiveCoreIds: ['draft-finance-exposure-note'] }, ['memo-drafter', 'sourceability', 'ach'], ['country-risk-card', 'options-memo'], ['starter-situation-finance-country-risk', 'starter-tool-financial-exposure-mapper', 'starter-user-finance-risk-analyst'], {
    suggestedQuestions: ['Which exposure dimensions and jurisdictions should the note cover?', 'Which indicators are current and source-backed?', 'What confidence or review caveats are mandatory?'],
    suggestedNextActions: ['Build the exposure table first.', 'Separate facts, judgments, and review gates.', 'Draft a short note with dated indicators.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'finance-exposure-note-output', outputGoal: 'Exposure note with dated indicators, risk drivers, caveats, and next checks.', approvalNotes: 'Must not read as investment, sanctions, or legal advice.' },
    aiUseGuidance: 'Use cautious language and dated indicators. Keep legal/sanctions conclusions and market recommendations out of scope.',
  }),
  starter('starter-output-hr-rollout-recommendation', 'output', 'output-brief', 'HR rollout recommendation output capsule', 'An output capsule for HR policy rollout decisions, affected-group communication, risk mitigations, and review gates.', 'Use this when the artifact should help an HR owner decide what to announce, pause, revise, or escalate.', ['hr', 'rollout', 'recommendation', 'communications'], { outputCoreIds: ['options-memo'], productCoreIds: ['options-memo'], objectiveCoreIds: ['draft-hr-rollout-recommendation'] }, ['memo-drafter', 'sourceability', 'contradiction-finder'], ['options-memo', 'talking-points'], ['starter-situation-hr-harassment-policy', 'starter-tool-hr-policy-impact-reviewer', 'starter-user-hr-policy-owner'], {
    suggestedQuestions: ['What decision should HR take after reading this?', 'Which worker groups and manager actions are affected?', 'Which approval, legal, or communications gates remain open?'],
    suggestedNextActions: ['Draft recommendation, risks, mitigations, and rollout sequence.', 'Prepare manager talking points separately.', 'Keep legal review and data constraints visible.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'hr-rollout-recommendation-output', outputGoal: 'Recommendation note with decision, impacts, mitigations, communications, and approvals.', approvalNotes: 'Private HR facts and protected data require separate handling.' },
    aiUseGuidance: 'Write for HR decision utility. Separate recommendation, rationale, affected groups, communications, risks, and approvals.',
  }),
  starter('starter-output-diplomatic-options-memo', 'output', 'output-brief', 'Diplomatic options memo output capsule', 'An output capsule for diplomatic options, interests, leverage, sequencing, talking points, and official-source caveats.', 'Use this when the final artifact should give a desk officer options with tradeoffs and source discipline.', ['diplomacy', 'options-memo', 'talking-points'], { outputCoreIds: ['diplomatic-cable'], productCoreIds: ['diplomatic-cable'], objectiveCoreIds: ['draft-diplomatic-options-memo'] }, ['memo-drafter', 'stakeholder-map', 'sourceability'], ['diplomatic-cable', 'talking-points'], ['starter-situation-diplomatic-options', 'starter-tool-diplomacy-options-mapper', 'starter-user-diplomatic-desk-officer'], {
    suggestedQuestions: ['What is the diplomatic decision or meeting this memo serves?', 'Which options are feasible within mandate and timing?', 'Which claims rely on official sources versus inference?'],
    suggestedNextActions: ['Draft option cards with risks and source caveats.', 'Add talking points only after options are stable.', 'Review inferred intent and legal posture.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'diplomatic-options-output', outputGoal: 'Options memo or cable with source caveats, sequencing, and talking points.', approvalNotes: 'Sensitive diplomatic judgments should stay caveated.' },
    aiUseGuidance: 'Use a desk-ready structure: context, options, leverage, risks, source confidence, recommended next move, and talking points.',
  }),
  starter('starter-output-humanitarian-access-brief', 'output', 'output-brief', 'Humanitarian access brief output capsule', 'An output capsule for humanitarian access, accountability posture, affected populations, constraints, and source confidence.', 'Use this when the output should brief access constraints or accountability issues without collapsing operational reporting into legal conclusions.', ['humanitarian', 'rights', 'access-brief', 'accountability'], { outputCoreIds: ['humanitarian-one-pager'], productCoreIds: ['humanitarian-one-pager'], objectiveCoreIds: ['draft-humanitarian-access-brief'] }, ['memo-drafter', 'sourceability', 'grounded-research'], ['humanitarian-one-pager', 'options-memo'], ['starter-situation-humanitarian-rights-access', 'starter-tool-sourceability-audit-reviewer', 'starter-user-humanitarian-legal-investigator'], {
    suggestedQuestions: ['Is the brief operational, protection-focused, or accountability-focused?', 'Which affected populations and access constraints are evidenced?', 'Which allegations require corroboration?'],
    suggestedNextActions: ['Draft access constraints separately from rights allegations.', 'Mark source confidence and evidence gaps.', 'Prepare next collection or advocacy questions.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'humanitarian-access-output', outputGoal: 'Access or accountability brief with constraints, affected populations, confidence, and gaps.', approvalNotes: 'Legal thresholds and identifiable allegations require human review.' },
    aiUseGuidance: 'Keep source type, confidence, and claim category visible. Do not turn operational access facts into legal findings without review.',
  }),
  starter('starter-output-ai-governance-risk-brief', 'output', 'ai-governance', 'AI governance risk brief output capsule', 'An output capsule for AI procurement risk, model controls, oversight questions, vendor evidence, and review gates.', 'Use this when the final artifact should turn AI governance sources into a decision-ready risk brief without pretending to certify legal compliance or technical safety.', ['ai-governance', 'risk-brief', 'procurement', 'model-risk'], { outputCoreIds: ['options-memo'], productCoreIds: ['options-memo'], objectiveCoreIds: ['draft-ai-governance-risk-brief'] }, ['memo-drafter', 'sourceability', 'contradiction-finder'], ['options-memo', 'country-risk-card'], ['starter-situation-ai-governance-procurement', 'starter-tool-source-pack-builder', 'starter-tool-sourceability-audit-reviewer'], {
    suggestedQuestions: ['Which AI decision does the brief support?', 'Which controls, vendor claims, and human oversight questions are unresolved?', 'Which legal or technical claims need review before circulation?'],
    suggestedNextActions: ['Draft obligations, risks, controls, evidence gaps, and owner asks.', 'Run sourceability on compliance and safety claims.', 'Prepare review gates for legal, procurement, and technical owners.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'ai-governance-risk-output', outputGoal: 'AI governance risk brief with controls, source support, unresolved questions, and review gates.', approvalNotes: 'Do not certify compliance, fairness, accuracy, or safety.' },
    aiUseGuidance: 'Write as a governance artifact: decision, system, risks, controls, evidence, owner, gap, and review status.',
  }),
  starter('starter-output-health-risk-communications-plan', 'output', 'public-health', 'Health risk communications plan output capsule', 'An output capsule for public health messages, audience segmentation, uncertainty language, rumor risk, channels, and approval gates.', 'Use this when the work product should become a practical risk-communication plan or talking-points pack grounded in public health emergency guidance.', ['public-health', 'communications-plan', 'risk-communication', 'talking-points'], { outputCoreIds: ['talking-points'], productCoreIds: ['talking-points'], objectiveCoreIds: ['draft-health-risk-communications-plan'] }, ['memo-drafter', 'sourceability', 'grounded-research'], ['talking-points', 'options-memo'], ['starter-situation-public-health-risk-communication', 'starter-tool-source-pack-builder', 'starter-output-cyber-resilience-action-memo'], {
    suggestedQuestions: ['Who is the audience and what action should they take?', 'What uncertainty must be named clearly?', 'Which claims require source or public health authority review?'],
    suggestedNextActions: ['Draft message map, channel plan, approval gates, and monitoring checks.', 'Separate public message from internal operational assumptions.', 'Run sourceability before public release.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'health-risk-communications-output', outputGoal: 'Communications plan with audience, message, uncertainty, channels, monitoring, and approvals.', approvalNotes: 'Public health instructions require authorized review before release.' },
    aiUseGuidance: 'Use plain, action-oriented language and preserve uncertainty. Do not invent medical advice, case data, or emergency instructions.',
  }),
  starter('starter-output-critical-minerals-exposure-map', 'output', 'critical-minerals', 'Critical minerals exposure map output capsule', 'An output capsule for material dependency, supplier concentration, jurisdiction risk, chokepoints, substitutes, and resilience options.', 'Use this when the product should let a team compare critical mineral exposure across materials, geographies, suppliers, and policy levers.', ['critical-minerals', 'exposure-map', 'supply-chain', 'resilience'], { outputCoreIds: ['country-risk-card'], productCoreIds: ['country-risk-card'], objectiveCoreIds: ['draft-critical-minerals-exposure-map'] }, ['memo-drafter', 'sourceability', 'ach'], ['country-risk-card', 'options-memo'], ['starter-situation-critical-minerals-supply-chain', 'starter-tool-financial-exposure-mapper', 'starter-output-sustainability-risk-brief'], {
    suggestedQuestions: ['Which mineral and technology chain is being mapped?', 'Which chokepoints and supplier dependencies are source-backed?', 'Which resilience options are feasible in the decision window?'],
    suggestedNextActions: ['Build a table by material, geography, supplier, chokepoint, confidence, and option.', 'Separate measured exposure from inferred strategic risk.', 'Draft recommendations as options, not forecasts.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'critical-minerals-exposure-output', outputGoal: 'Exposure map with source-backed chokepoints, confidence, options, and next data asks.', approvalNotes: 'Procurement, forecast, and market claims require dated source review.' },
    aiUseGuidance: 'Keep the artifact comparative and evidence-bound. Show material, geography, source, confidence, risk driver, and option.',
  }),
  starter('starter-output-cyber-resilience-action-memo', 'output', 'cyber-resilience', 'Cyber resilience action memo output capsule', 'An output capsule for cyber resilience priorities, critical service continuity, control gaps, communication caveats, and recovery sequencing.', 'Use this when the final artifact should guide non-sensitive cyber resilience decisions without exposing exploit details, credentials, or unsupported attribution.', ['cyber', 'resilience', 'critical-infrastructure', 'action-memo'], { outputCoreIds: ['risk-monitor-card'], productCoreIds: ['risk-monitor-card'], objectiveCoreIds: ['draft-cyber-resilience-action-memo'] }, ['memo-drafter', 'sourceability', 'contradiction-finder'], ['risk-monitor-card', 'options-memo'], ['starter-situation-cyber-infrastructure-resilience', 'starter-tool-sourceability-audit-reviewer', 'starter-output-health-risk-communications-plan'], {
    suggestedQuestions: ['Which service or asset is the memo protecting?', 'Which controls are verified, missing, or unknown?', 'Which facts are too sensitive for the memo?'],
    suggestedNextActions: ['Draft actions by control area, owner, urgency, and evidence.', 'Remove sensitive indicators and unsupported attribution.', 'Prepare executive and technical review gates.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'cyber-resilience-output', outputGoal: 'Action memo with resilience priorities, control gaps, communications posture, and recovery sequencing.', approvalNotes: 'Sensitive indicators, vulnerabilities, credentials, and attribution stay out of generated public-facing text.' },
    aiUseGuidance: 'Write defensively and cautiously. Prioritize continuity, control gaps, ownership, communications boundaries, and review status.',
  }),
  starter('starter-user-esg-sustainability-lead', 'user', 'analyst-role', 'ESG and sustainability lead user capsule', 'A user capsule for sustainability owners who need reporting posture, supplier context, board-ready risk language, and evidence discipline.', 'Use this to make PRAXIS answer like a sustainability lead preparing reviewable work for executives, assurance, legal, or operations stakeholders.', ['sustainability', 'esg-lead', 'reporting-owner'], { userCoreId: 'starter-user-esg-sustainability-lead', toolCoreIds: ['grounded-research', 'sourceability'], outputCoreIds: ['country-risk-card'] }, ['grounded-research', 'sourceability', 'memo-drafter'], ['country-risk-card', 'options-memo'], ['starter-situation-sustainability-transition', 'starter-output-sustainability-risk-brief', 'starter-tool-source-pack-builder'], {
    suggestedQuestions: ['Which reporting, board, or operational decision does the user own?', 'What source standard should govern claims?', 'Which teams must supply missing data?'],
    suggestedNextActions: ['Ask for reporting scope and audience.', 'Prioritize official standards and company evidence.', 'Draft concise risk language with gaps.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'esg-lead-lens', outputGoal: 'Sustainability brief with executive-ready caveats and data asks.', approvalNotes: 'Assurance and compliance conclusions remain review-gated.' },
    aiUseGuidance: 'Adopt a sustainability-lead lens: practical, evidence-bound, risk-aware, and clear about what data must be collected next.',
  }),
  starter('starter-user-finance-risk-analyst', 'user', 'analyst-role', 'Finance risk analyst user capsule', 'A user capsule for analysts reviewing country, sovereign, sanctions, and financial exposure with dated indicators and confidence caveats.', 'Use this to make PRAXIS favor tables, indicator dates, alternative explanations, and non-advice risk language.', ['finance', 'risk-analyst', 'country-risk'], { userCoreId: 'starter-user-finance-risk-analyst', toolCoreIds: ['grounded-research', 'ach', 'sourceability'], outputCoreIds: ['country-risk-card'] }, ['grounded-research', 'ach', 'sourceability'], ['country-risk-card', 'options-memo'], ['starter-situation-finance-country-risk', 'starter-output-finance-exposure-note', 'starter-tool-financial-exposure-mapper'], {
    suggestedQuestions: ['What exposure, country, or sector is the analyst accountable for?', 'Which indicator date is authoritative?', 'What alternative explanation should be tested?'],
    suggestedNextActions: ['Request dated indicators and source priorities.', 'Map assumptions before drafting.', 'Keep recommendations non-advisory.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'finance-risk-analyst-lens', outputGoal: 'Exposure note with indicator table, caveats, and review needs.', approvalNotes: 'No investment, legal, or sanctions advice.' },
    aiUseGuidance: 'Answer as a cautious risk analyst. Prefer structured evidence, indicator dates, confidence levels, and review gates.',
  }),
  starter('starter-user-hr-policy-owner', 'user', 'analyst-role', 'HR policy owner user capsule', 'A user capsule for HR policy owners managing guidance, rollout, affected groups, manager communication, and review gates.', 'Use this to make PRAXIS practical, careful with private facts, and focused on policy, process, communications, and approval sequencing.', ['hr', 'policy-owner', 'rollout'], { userCoreId: 'starter-user-hr-policy-owner', pathCoreId: 'hr-policy', toolCoreIds: ['sourceability', 'contradiction-finder'], outputCoreIds: ['options-memo'] }, ['sourceability', 'contradiction-finder', 'memo-drafter'], ['options-memo', 'talking-points'], ['starter-situation-hr-harassment-policy', 'starter-tool-hr-policy-impact-reviewer', 'starter-output-hr-rollout-recommendation'], {
    suggestedQuestions: ['What policy decision is the HR owner trying to make?', 'Which groups and managers need guidance?', 'Which facts should remain out of the model context?'],
    suggestedNextActions: ['Ask for policy text, public guidance, and rollout objective.', 'Separate recommendation from legal review.', 'Draft manager communication only after review gates.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'hr-policy-owner-lens', outputGoal: 'Policy recommendation with rollout risks and approval gates.', approvalNotes: 'Protect private personnel data and legal review boundaries.' },
    aiUseGuidance: 'Use a careful HR policy-owner voice. Keep people, facts, policy text, public guidance, and approvals distinct.',
  }),
  starter('starter-user-diplomatic-desk-officer', 'user', 'analyst-role', 'Diplomatic desk officer user capsule', 'A user capsule for desk officers who need official-source posture, concise options, caveats, and meeting-ready next steps.', 'Use this to make PRAXIS concise, source-disciplined, and useful for diplomatic decision support rather than broad geopolitical essay writing.', ['diplomacy', 'desk-officer', 'options'], { userCoreId: 'starter-user-diplomatic-desk-officer', pathCoreId: 'foreign-policy', toolCoreIds: ['stakeholder-map', 'position-vs-interest', 'sourceability'], outputCoreIds: ['diplomatic-cable'] }, ['stakeholder-map', 'position-vs-interest', 'memo-drafter'], ['diplomatic-cable', 'talking-points'], ['starter-situation-diplomatic-options', 'starter-tool-diplomacy-options-mapper', 'starter-output-diplomatic-options-memo'], {
    suggestedQuestions: ['What decision, meeting, or cable does the desk officer need?', 'Which official-source posture governs the answer?', 'Which claims should remain caveated?'],
    suggestedNextActions: ['Build actor/options map before drafting.', 'Turn options into concise memo sections.', 'Prepare talking points with source caveats.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'diplomatic-desk-lens', outputGoal: 'Desk-ready options memo or cable with caveats and next actions.', approvalNotes: 'Keep inferred intent and sensitive posture explicitly caveated.' },
    aiUseGuidance: 'Answer for a time-constrained desk officer. Start with decision utility, source caveats, and concrete next steps.',
  }),
  starter('starter-user-humanitarian-legal-investigator', 'user', 'analyst-role', 'Humanitarian and legal investigator user capsule', 'A user capsule for investigators reviewing access, rights, accountability, source reliability, and legal-review boundaries.', 'Use this to make PRAXIS careful about allegations, corroboration, chain-of-custody posture, and the separation between operational facts and legal judgments.', ['humanitarian', 'rights', 'legal-investigator', 'accountability'], { userCoreId: 'starter-user-humanitarian-legal-investigator', pathCoreId: 'human-rights-accountability', toolCoreIds: ['sourceability', 'grounded-research'], outputCoreIds: ['humanitarian-one-pager'] }, ['sourceability', 'grounded-research', 'memo-drafter'], ['humanitarian-one-pager', 'options-memo'], ['starter-situation-humanitarian-rights-access', 'starter-tool-sourceability-audit-reviewer', 'starter-output-humanitarian-access-brief'], {
    suggestedQuestions: ['Is the user investigating access constraints, rights allegations, or both?', 'What source and corroboration threshold applies?', 'What must remain caveated until human review?'],
    suggestedNextActions: ['Attach source receipts before synthesis.', 'Separate operational facts from accountability claims.', 'Draft with confidence levels and review blockers.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'humanitarian-investigator-lens', outputGoal: 'Access or accountability brief with source confidence and legal-review caveats.', approvalNotes: 'Allegations, legal thresholds, and personal data stay review-gated.' },
    aiUseGuidance: 'Use an investigator lens: careful claim typing, corroboration status, source reliability, and explicit review requirements.',
  }),
  starter('starter-tool-assumption-audit', 'tool', 'audit-review', 'Assumption audit thinking device', 'A thinking-device capsule for surfacing weak assumptions, missing alternatives, confidence language, and red-team review needs before drafting.', 'Use this when a situation or output feels too confident. PRAXIS should separate assumptions, evidence, alternatives, implications, and review gates before recommending action.', ['assumption-audit', 'red-team', 'confidence', 'thinking-device'], { toolCoreIds: ['ach', 'contradiction-finder', 'sourceability'], objectiveCoreIds: ['audit-assumptions'], outputCoreIds: ['options-memo'] }, ['ach', 'contradiction-finder', 'sourceability'], ['options-memo', 'risk-monitor-card'], ['starter-tool-sourceability-audit-reviewer', 'starter-output-two-page-brief', 'starter-situation-sanctions-exposure'], {
    readinessStars: 4,
    suggestedQuestions: ['Which judgment depends on the weakest assumption?', 'What evidence would change the current answer?', 'Which alternative explanation has not been tested?'],
    suggestedNextActions: ['Run ACH on the top judgment.', 'Mark unsupported or stale claims before drafting.', 'Add a review note for assumptions that need human sign-off.'],
  }),
  starter('starter-tool-source-gap-triage', 'tool', 'source-intake', 'Source-gap triage thinking device', 'A thinking-device capsule for ranking missing sources, weak citations, stale evidence, and collection next steps.', 'Use this before asking PRAXIS to draft from thin context. It should produce a practical source gap list and decide which receipts must be attached first.', ['source-gap', 'triage', 'citations', 'thinking-device'], { toolCoreIds: ['grounded-research', 'sourceability', 'ask-praxis'], objectiveCoreIds: ['triage-source-gaps'], sourceCoreIds: ['grounded_search'] }, ['grounded-research', 'sourceability', 'ask-praxis'], ['country-one-pager', 'options-memo'], ['starter-tool-source-pack-builder', 'starter-output-two-page-brief', 'starter-situation-humanitarian-access-update'], {
    readinessStars: 4,
    suggestedQuestions: ['Which claims have no receipts?', 'Which source gaps block the next output?', 'Which sources are nice-to-have rather than required?'],
    suggestedNextActions: ['Rank source gaps by decision impact.', 'Search for official or primary receipts first.', 'Attach usable documents before drafting.'],
  }),
  starter('starter-tool-decision-clock-monitor', 'tool', 'options-mapping', 'Decision-clock monitor thinking device', 'A thinking-device capsule for deadlines, review gates, stale assumptions, trigger events, and monitoring cadence.', 'Use this when the answer depends on timing. PRAXIS should make the decision window explicit and show what must be refreshed before reuse.', ['decision-clock', 'deadline', 'stale-claims', 'thinking-device'], { toolCoreIds: ['scenario-projector', 'commitment-tracker', 'sourceability'], timeCoreId: 'starter-time-decision-clock', objectiveCoreIds: ['monitor-decision-clock'], outputCoreIds: ['risk-monitor-card'] }, ['scenario-projector', 'commitment-tracker', 'sourceability'], ['risk-monitor-card', 'talking-points'], ['starter-situation-mediation-track', 'starter-situation-humanitarian-access-update', 'starter-output-meeting-talking-points'], {
    readinessStars: 4,
    suggestedQuestions: ['What deadline or trigger changes the recommendation?', 'Which facts expire soon?', 'Who needs the next update?'],
    suggestedNextActions: ['Add the current as-of date.', 'List trigger indicators and review gates.', 'Prepare a short update cadence for the team.'],
  }),
  starter('starter-tool-statistical-baseline-builder', 'tool', 'exposure-mapping', 'Statistical baseline builder thinking device', 'A thinking-device capsule for baselines, denominators, time series starts, and trend sanity checks before a policy claim becomes a finding.', 'Use this when figures need a defensible baseline. PRAXIS should separate numerator, denominator, source date, comparison period, uncertainty, and the claim that the statistic can actually support.', ['statistics', 'baseline', 'denominator', 'trend-check', 'thinking-device', 'team:research-strategy'], { toolCoreIds: ['grounded-research', 'sourceability', 'ach'], sourceCoreIds: ['world-bank-data', 'imf-data'], objectiveCoreIds: ['build-statistical-baseline'], outputCoreIds: ['governance-index'] }, ['grounded-research', 'sourceability', 'ach'], ['governance-index', 'country-risk-card'], ['starter-output-statistical-annex', 'starter-situation-data-quality-statistics', 'starter-user-finance-risk-analyst'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'world-bank-data', label: 'World Bank DataBank', url: 'https://databank.worldbank.org/', sourceType: 'multilateral', relevance: 'Country indicator, denominator, and historical series baseline for public-policy statistics.', publisher: 'World Bank', date: '2026', reliabilityTier: 1 },
      { id: 'imf-data', label: 'IMF Data portal', url: 'https://www.imf.org/en/Data', sourceType: 'multilateral', relevance: 'Macro-financial series and metadata for baseline and comparability checks.', publisher: 'International Monetary Fund', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['What is the correct denominator for this statistic?', 'Which base year or comparison period is defensible?', 'Does the source metadata permit the trend claim?'],
    suggestedNextActions: ['Attach the indicator source and metadata.', 'State numerator, denominator, date, and base period.', 'Run sourceability before turning a number into a recommendation.'],
    aiUseGuidance: 'Use this as a statistical sanity-check device. Do not let PRAXIS infer trends without denominators, dates, and comparable source series.',
  }),
  starter('starter-tool-indicator-shift-detector', 'tool', 'audit-review', 'Indicator shift detector thinking device', 'A thinking-device capsule for spotting movement in indicators, source series, thresholds, and warning signs without overstating statistical significance.', 'Use this when an analyst asks what changed. PRAXIS should compare as-of dates, threshold crossings, source definitions, and plausible noise before calling movement meaningful.', ['statistics', 'indicator-shift', 'thresholds', 'warning-signs', 'thinking-device', 'team:research-strategy'], { toolCoreIds: ['scenario-projector', 'sourceability', 'contradiction-finder'], timeCoreId: 'starter-time-indicator-shift', sourceCoreIds: ['world-bank-data', 'humanitarian-data-exchange'], objectiveCoreIds: ['detect-indicator-shifts'], outputCoreIds: ['risk-monitor-card'] }, ['scenario-projector', 'sourceability', 'contradiction-finder'], ['risk-monitor-card', 'governance-index'], ['starter-tool-statistical-baseline-builder', 'starter-output-evidence-dashboard-brief', 'starter-situation-data-quality-statistics'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'humanitarian-data-exchange', label: 'Humanitarian Data Exchange', url: 'https://data.humdata.org/', sourceType: 'multilateral', relevance: 'Operational humanitarian datasets where source series and update cadence affect indicator interpretation.', publisher: 'OCHA Centre for Humanitarian Data', date: '2026', reliabilityTier: 1 },
      { id: 'world-bank-data', label: 'World Bank DataBank', url: 'https://databank.worldbank.org/', sourceType: 'multilateral', relevance: 'Comparable public indicator series with metadata and country coverage.', publisher: 'World Bank', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Which indicator moved, by how much, and since when?', 'Did the source definition or reporting cadence change?', 'What threshold would make this movement decision-relevant?'],
    suggestedNextActions: ['Compare current value against the baseline period.', 'Check source metadata before naming a trend.', 'Attach the shift to a risk card or dashboard brief.'],
    aiUseGuidance: 'Use this for cautious movement detection. Treat changed indicators as prompts for verification, not as automatic evidence of causation.',
  }),
  starter('starter-output-statistical-annex', 'output', 'output-brief', 'Statistical annex artifact capsule', 'An artifact capsule for tables, methods notes, indicator appendices, metadata caveats, and count-backed evidence annexes.', 'Use this when the main memo needs a compact annex that keeps numbers reviewable. PRAXIS should preserve source, date, denominator, method note, caveat, and citation for each figure.', ['statistics', 'annex', 'tables', 'methods-note', 'artifact', 'team:research-strategy'], { outputCoreIds: ['governance-index'], productCoreIds: ['governance-index'], objectiveCoreIds: ['draft-statistical-annex'] }, ['memo-drafter', 'sourceability', 'grounded-research'], ['governance-index', 'options-memo'], ['starter-tool-statistical-baseline-builder', 'starter-tool-indicator-shift-detector', 'starter-output-evidence-dashboard-brief'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'world-bank-data', label: 'World Bank DataBank', url: 'https://databank.worldbank.org/', sourceType: 'multilateral', relevance: 'Indicator tables, country series, and metadata for statistical annexes.', publisher: 'World Bank', date: '2026', reliabilityTier: 1 },
      { id: 'oecd-data', label: 'OECD Data Explorer', url: 'https://data-explorer.oecd.org/', sourceType: 'multilateral', relevance: 'Comparable country indicators and metadata for policy annexes.', publisher: 'OECD', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Which figures belong in the annex rather than the main memo?', 'What method note and caveat should travel with each figure?', 'Which table needs sourceability review before export?'],
    suggestedNextActions: ['Create a table with source, date, denominator, and caveat columns.', 'Run sourceability on each headline statistic.', 'Link annex figures back to memo claims.'],
    aiUseGuidance: 'Use this as an artifact contract for statistical appendices. Keep figures structured and cited; do not bury caveats in prose.',
  }),
  starter('starter-output-evidence-dashboard-brief', 'output', 'output-brief', 'Evidence dashboard brief artifact capsule', 'An artifact capsule for count-backed dashboard summaries, indicator cards, source coverage notes, and executive evidence snapshots.', 'Use this when a user needs a dashboard-style brief rather than a long memo. PRAXIS should show counts, coverage, latest movement, missing denominators, and source gaps separately.', ['statistics', 'dashboard', 'evidence-coverage', 'indicator-brief', 'artifact', 'team:research-strategy'], { outputCoreIds: ['risk-monitor-card'], productCoreIds: ['risk-monitor-card'], objectiveCoreIds: ['draft-evidence-dashboard-brief'] }, ['memo-drafter', 'scenario-projector', 'sourceability'], ['risk-monitor-card', 'country-risk-card'], ['starter-tool-indicator-shift-detector', 'starter-tool-statistical-baseline-builder', 'starter-situation-data-quality-statistics'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'humanitarian-data-exchange', label: 'Humanitarian Data Exchange', url: 'https://data.humdata.org/', sourceType: 'multilateral', relevance: 'Operational datasets and update cadence for dashboard evidence coverage.', publisher: 'OCHA Centre for Humanitarian Data', date: '2026', reliabilityTier: 1 },
      { id: 'world-bank-data', label: 'World Bank DataBank', url: 'https://databank.worldbank.org/', sourceType: 'multilateral', relevance: 'Country indicator series and metadata for count-backed dashboard summaries.', publisher: 'World Bank', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Which dashboard counts are decision-relevant?', 'Which indicators changed since the last snapshot?', 'Which source or denominator gap should be shown as a warning?'],
    suggestedNextActions: ['Draft metric cards with source and as-of date.', 'Separate coverage count from substantive trend.', 'Add missing-source warnings before export.'],
    aiUseGuidance: 'Use this as a concise artifact contract for evidence dashboards. Counts should support scanning and review, not replace sourced analysis.',
  }),
  starter('starter-situation-data-quality-statistics', 'situation', 'exposure-mapping', 'Data quality and statistics situation capsule', 'A situation capsule for missing denominators, stale figures, incomparable source series, and data quality risks in policy analysis.', 'Use this when the core issue is whether numbers can be trusted. PRAXIS should identify stale figures, missing denominators, changed definitions, source coverage gaps, and comparability risks before drafting.', ['statistics', 'data-quality', 'missing-denominators', 'comparability', 'stale-figures', 'team:research-strategy'], { situationCoreId: 'starter-situation-data-quality-statistics', pathCoreId: 'research-direction', sourceCoreIds: ['world-bank-data', 'imf-data', 'humanitarian-data-exchange'], toolCoreIds: ['grounded-research', 'sourceability', 'ach'], outputCoreIds: ['governance-index'] }, ['grounded-research', 'sourceability', 'ach'], ['governance-index', 'risk-monitor-card'], ['starter-tool-statistical-baseline-builder', 'starter-tool-indicator-shift-detector', 'starter-output-statistical-annex'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'world-bank-data', label: 'World Bank DataBank', url: 'https://databank.worldbank.org/', sourceType: 'multilateral', relevance: 'Comparable indicator series and metadata for denominator and freshness checks.', publisher: 'World Bank', date: '2026', reliabilityTier: 1 },
      { id: 'imf-data', label: 'IMF Data portal', url: 'https://www.imf.org/en/Data', sourceType: 'multilateral', relevance: 'Macro-financial series, release dates, and metadata for comparability checks.', publisher: 'International Monetary Fund', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Which figure is stale, missing a denominator, or not comparable?', 'What source definition controls the statistic?', 'What decision would change if the data quality warning is material?'],
    suggestedNextActions: ['List data quality risks before drafting.', 'Attach metadata and source release dates.', 'Use a statistical annex or dashboard brief for the output.'],
    aiUseGuidance: 'Use this situation capsule when data quality is the case. PRAXIS should downgrade confidence until denominators, freshness, and comparability are explicit.',
  }),
  starter('starter-output-two-page-brief', 'output', 'output-brief', 'Two-page brief artifact capsule', 'An artifact capsule for a concise two-page policy brief with BLUF, context, options, risks, and source gaps.', 'Use this when the practical output should be short, sourced, and decision-ready. PRAXIS should keep evidence gaps and approval posture visible.', ['two-page-brief', 'brief', 'artifact', 'decision'], { outputCoreIds: ['options-memo'], productCoreIds: ['options-memo'], objectiveCoreIds: ['draft-two-page-brief'] }, ['memo-drafter', 'sourceability', 'contradiction-finder'], ['options-memo', 'country-one-pager'], ['starter-tool-assumption-audit', 'starter-tool-source-gap-triage', 'starter-situation-mediation-track'], {
    readinessStars: 4,
    suggestedQuestions: ['Who is the audience for the two-page brief?', 'What decision should the brief support?', 'Which source gaps must be visible?'],
    suggestedNextActions: ['Draft BLUF and decision question first.', 'Run sourceability on key claims.', 'Keep annex-level detail out of the brief.'],
  }),
  starter('starter-output-diplomatic-note', 'output', 'output-brief', 'Diplomatic note artifact capsule', 'An artifact capsule for diplomatic notes with official-source posture, asks, caveats, and concise meeting language.', 'Use this when the output is a practical diplomatic note rather than a broad options memo. PRAXIS should keep tone, mandate, and source caveats tight.', ['diplomatic-note', 'artifact', 'diplomacy', 'official-sources'], { outputCoreIds: ['diplomatic-cable'], productCoreIds: ['diplomatic-cable'], objectiveCoreIds: ['draft-diplomatic-note'] }, ['memo-drafter', 'stakeholder-map', 'sourceability'], ['diplomatic-cable', 'talking-points'], ['starter-situation-mediation-track', 'starter-tool-diplomacy-options-mapper', 'starter-user-diplomatic-desk-officer'], {
    readinessStars: 4,
    suggestedQuestions: ['What is the diplomatic ask?', 'Which official positions must be reflected?', 'What language should be avoided?'],
    suggestedNextActions: ['Attach official statements before drafting.', 'Separate ask, rationale, and caveats.', 'Convert into talking points if a meeting is imminent.'],
  }),
  starter('starter-output-meeting-talking-points', 'output', 'output-brief', 'Meeting talking points artifact capsule', 'An artifact capsule for concise meeting talking points, anticipated objections, source caveats, and next asks.', 'Use this when the end product is spoken or meeting-facing. PRAXIS should produce crisp points, not long memo prose.', ['talking-points', 'artifact', 'meeting', 'briefing'], { outputCoreIds: ['talking-points'], productCoreIds: ['talking-points'], objectiveCoreIds: ['draft-meeting-talking-points'] }, ['memo-drafter', 'sourceability', 'stakeholder-map'], ['talking-points', 'diplomatic-cable'], ['starter-output-diplomatic-note', 'starter-situation-mediation-track', 'starter-tool-decision-clock-monitor'], {
    readinessStars: 4,
    suggestedQuestions: ['Who is in the meeting?', 'What must the speaker ask for?', 'Which objections need prepared answers?'],
    suggestedNextActions: ['Draft five points and three likely objections.', 'Check sourceable claims.', 'Add follow-up actions for after the meeting.'],
  }),
  starter('starter-situation-mediation-track', 'situation', 'diplomacy', 'Mediation track situation capsule', 'A situation capsule for mediation tracks, parties, mandates, spoilers, confidence-building measures, and process sequencing.', 'Use this when the core situation is a negotiation or peace-process track. PRAXIS should distinguish stated positions, interests, leverage, blockers, and decision windows.', ['mediation', 'peace-process', 'diplomacy', 'negotiation', 'team:diplomatic'], { situationCoreId: 'starter-situation-mediation-track', pathCoreId: 'mediator-peace-process', sourceCoreIds: ['un-peacemaker', 'crisisgroup'], toolCoreIds: ['stakeholder-map', 'position-vs-interest', 'scenario-projector'], outputCoreIds: ['diplomatic-cable'] }, ['stakeholder-map', 'position-vs-interest', 'scenario-projector'], ['diplomatic-cable', 'talking-points'], ['starter-tool-diplomacy-options-mapper', 'starter-output-diplomatic-note', 'starter-tool-decision-clock-monitor'], {
    readinessStars: 4,
    suggestedQuestions: ['Which parties and mediators are in scope?', 'What mandates or red lines bind the process?', 'What confidence-building measure is realistic next?'],
    suggestedNextActions: ['Map parties, interests, leverage, and blockers.', 'Attach official process documents and statements.', 'Prepare a diplomatic note or talking points.'],
  }),
  starter('starter-situation-sanctions-exposure', 'situation', 'finance', 'Sanctions exposure situation capsule', 'A situation capsule for entities, sectors, jurisdictions, sanctions exposure, compliance posture, and review boundaries.', 'Use this when the question involves sanctions exposure or economic statecraft. PRAXIS should keep jurisdiction, list source, date, exposure type, and legal-review caveats separate.', ['sanctions', 'exposure', 'finance', 'compliance', 'team:economic-sanctions'], { situationCoreId: 'starter-situation-sanctions-exposure', pathCoreId: 'economic-sanctions', sourceCoreIds: ['fatf-risk-based-approach', 'eeas-human-rights-sanctions'], toolCoreIds: ['grounded-research', 'sourceability', 'ach'], outputCoreIds: ['options-memo'] }, ['grounded-research', 'sourceability', 'ach'], ['options-memo', 'country-risk-card'], ['starter-tool-financial-exposure-mapper', 'starter-output-finance-exposure-note', 'starter-tool-assumption-audit'], {
    readinessStars: 4,
    suggestedQuestions: ['Which entity, sector, or jurisdiction is in scope?', 'Which sanctions source controls the review?', 'What exposure claim needs a receipt?'],
    suggestedNextActions: ['Attach official list or regulator sources.', 'Map exposure by entity, sector, and date.', 'Draft a compliance note with review gates.'],
  }),
  starter('starter-situation-humanitarian-access-update', 'situation', 'humanitarian-rights', 'Humanitarian access update situation capsule', 'A situation capsule for fast humanitarian access updates, affected populations, constraints, operational risks, and source freshness.', 'Use this when the user needs a current humanitarian access update. PRAXIS should separate operational facts, protection concerns, source freshness, and unresolved gaps.', ['humanitarian', 'access-update', 'ocha', 'protection', 'team:humanitarian'], { situationCoreId: 'starter-situation-humanitarian-access-update', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['ocha-access', 'reliefweb'], toolCoreIds: ['grounded-research', 'sourceability', 'scenario-projector'], outputCoreIds: ['humanitarian-one-pager'] }, ['grounded-research', 'sourceability', 'scenario-projector'], ['humanitarian-one-pager', 'risk-monitor-card'], ['starter-situation-humanitarian-rights-access', 'starter-output-humanitarian-access-brief', 'starter-tool-source-gap-triage'], {
    readinessStars: 4,
    suggestedQuestions: ['Which location and affected population are in scope?', 'What changed since the last access update?', 'Which claims are operational versus legal?'],
    suggestedNextActions: ['Attach current OCHA/ReliefWeb-style sources.', 'Mark stale access claims.', 'Draft a short access update with source gaps.'],
  }),
  starter('starter-situation-sudan-darfur-atrocity-access', 'situation', 'humanitarian-rights', 'Sudan and Darfur atrocity-risk access watch', 'A situation capsule for Sudan war monitoring with Darfur atrocity-risk, famine, protection, displacement, and humanitarian-access tracks.', 'Use this when PRAXIS needs to brief Sudan without collapsing humanitarian access, atrocity-risk, famine, and diplomatic pressure into one unsupported narrative. Keep locality, date, source tier, and confidence explicit.', ['sudan', 'darfur', 'atrocity-risk', 'famine', 'humanitarian-access', 'protection', 'team:humanitarian', 'team:atrocity-prevention'], { situationCoreId: 'starter-situation-sudan-darfur-atrocity-access', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['un-sudan-atrocity-famine-risk', 'ocha-access'], toolCoreIds: ['grounded-research', 'sourceability', 'scenario-projector'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['grounded-research', 'sourceability', 'scenario-projector'], ['scenario-risk-dashboard-card', 'humanitarian-one-pager', 'principals-decision-memo'], ['starter-tool-sourceability-matrix', 'starter-tool-temporal-causal-map', 'starter-output-scenario-risk-dashboard-card'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'un-sudan-atrocity-famine-risk', label: 'UN Geneva reporting on Sudan war, famine, and atrocity-risk warnings', url: 'https://www.ungeneva.org/en/news-media/news/2026/02/116058/no-corner-sudan-safe-un-officials-warn-famine-and-atrocities-war', sourceType: 'multilateral', relevance: 'Reference anchor for intensifying Sudan conflict, famine risk, and atrocity-risk framing that should be verified against current UN updates.', publisher: 'United Nations Office at Geneva', date: '2026-02-19', reliabilityTier: 1 },
      { id: 'ocha-access', label: 'OCHA humanitarian access guidance', url: 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', sourceType: 'multilateral', relevance: 'Conceptual lane for distinguishing access constraints, affected populations, and operational posture from legal conclusions.', publisher: 'UN OCHA', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'un-sudan-atrocity-famine-risk', text: 'UN reporting should be used as a dated public anchor for conflict intensity, famine-risk, protection, and atrocity-risk claims, with freshness checked before each answer.' },
      { sourceId: 'ocha-access', text: 'Humanitarian access analysis should separate denial, insecurity, administrative impediments, logistics, affected-population scope, and the evidence available for each access claim.' },
    ],
    suggestedQuestions: ['Which Sudan location, actor, and time window controls the assessment?', 'Which access, famine, or atrocity-risk claim needs a fresh UN or humanitarian receipt?', 'What indicator would change the dashboard risk rating this week?'],
    suggestedNextActions: ['Refresh UN and humanitarian source receipts before drafting.', 'Build a risk dashboard separating protection, access, famine, and diplomatic tracks.', 'Run sourceability on any atrocity-risk or famine statement before export.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'humanitarian-risk-watch', outputGoal: 'scenario-risk-dashboard-card', approvalNotes: 'Require human review before publishing atrocity-risk, famine, or operational access judgments.' },
    aiUseGuidance: 'Use this as a sourced public-risk watch. Verify dates and source tier, avoid operationally sensitive details, and keep atrocity-risk language tied to cited public reporting and human approval.',
  }),
  starter('starter-situation-eastern-drc-m23-mandate-watch', 'situation', 'humanitarian-rights', 'Eastern DRC/M23 mandate watch', 'A situation capsule for eastern DRC, M23, MONUSCO mandate posture, Great Lakes stabilization, ceasefire monitoring, and civilian-protection risk.', 'Use this when PRAXIS needs to distinguish mandate tasks, armed-group posture, regional diplomacy, civilian protection, and humanitarian risk in eastern DRC.', ['drc', 'm23', 'monusco', 'great-lakes', 'mandate', 'civilian-protection', 'team:humanitarian', 'team:diplomatic'], { situationCoreId: 'starter-situation-eastern-drc-m23-mandate-watch', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['un-monusco-m23-mandate', 'un-peacemaker'], toolCoreIds: ['stakeholder-map', 'sourceability', 'scenario-projector'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['stakeholder-map', 'sourceability', 'scenario-projector'], ['scenario-risk-dashboard-card', 'principals-decision-memo', 'legal-mandate-compliance-note'], ['starter-tool-actor-leverage-veto-map', 'starter-tool-legal-mandate-compliance-lens', 'starter-output-legal-mandate-compliance-note'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'un-monusco-m23-mandate', label: 'UN Geneva report on MONUSCO mandate renewal and M23 offensives', url: 'https://www.ungeneva.org/en/news-media/news/2025/12/114214/security-council-renews-dr-congo-peacekeeping-mission-amid-renewed', sourceType: 'multilateral', relevance: 'Public UN anchor for MONUSCO mandate, M23 context, eastern DRC geography, and Council posture.', publisher: 'United Nations Office at Geneva', date: '2025-12-19', reliabilityTier: 1 },
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation resources', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'Mediation and ceasefire-process reference lane for regional stabilization and verification mechanisms.', publisher: 'United Nations', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'un-monusco-m23-mandate', text: 'The UN mandate source should ground claims about MONUSCO tasks, civilian protection, ceasefire support, and the regional stabilization posture.' },
      { sourceId: 'un-peacemaker', text: 'Process claims should identify the relevant negotiation, ceasefire, monitoring, or verification mechanism rather than presenting generic peace-process language.' },
    ],
    suggestedQuestions: ['Which mandate task or geographic area is in scope?', 'Which actor has leverage or veto power over de-escalation?', 'What evidence separates military posture from humanitarian consequence?'],
    suggestedNextActions: ['Map actors, mandates, and blockers before options drafting.', 'Attach the current UN mandate and any ceasefire-monitoring source.', 'Prepare a compliance note if mandate language controls the answer.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'mandate-and-stabilization-watch', outputGoal: 'legal-mandate-compliance-note', approvalNotes: 'Require review before stating mandate implications, attribution, or compliance findings.' },
    aiUseGuidance: 'Use this for source-linked mandate and stabilization analysis. Verify current mandate text, keep attribution cautious, and separate public UN reporting from analytic inference.',
  }),
  starter('starter-situation-gaza-ceasefire-aid-reconstruction', 'situation', 'diplomacy', 'Gaza ceasefire, aid, and reconstruction track', 'A situation capsule for Gaza ceasefire terms, hostage-release posture, humanitarian aid access, reconstruction governance, and implementation monitoring.', 'Use this when PRAXIS needs to track ceasefire and reconstruction governance questions from public diplomatic and UN sources without treating proposals as implemented facts.', ['gaza', 'ceasefire', 'hostages', 'humanitarian-aid', 'reconstruction', 'governance', 'team:diplomatic', 'team:humanitarian'], { situationCoreId: 'starter-situation-gaza-ceasefire-aid-reconstruction', pathCoreId: 'foreign-policy', sourceCoreIds: ['unsc-resolution-2735-gaza', 'ocha-access'], toolCoreIds: ['commitment-tracker', 'sourceability', 'stakeholder-map'], outputCoreIds: ['principals-decision-memo'] }, ['commitment-tracker', 'sourceability', 'stakeholder-map'], ['principals-decision-memo', 'negotiation-prep-book', 'legal-mandate-compliance-note'], ['starter-tool-negotiation-ripeness-decision-clock', 'starter-tool-legal-mandate-compliance-lens', 'starter-output-negotiation-prep-book'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'unsc-resolution-2735-gaza', label: 'UN Security Council Resolution 2735 press release on Gaza ceasefire proposal', url: 'https://press.un.org/en/2024/sc15723.doc.htm', sourceType: 'multilateral', relevance: 'Council reference anchor for ceasefire, hostage, aid, and reconstruction-governance track language.', publisher: 'United Nations Security Council', date: '2024-06-10', reliabilityTier: 1 },
      { id: 'ocha-access', label: 'OCHA humanitarian access guidance', url: 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', sourceType: 'multilateral', relevance: 'Operational access vocabulary for separating aid access constraints from diplomatic commitments.', publisher: 'UN OCHA', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'unsc-resolution-2735-gaza', text: 'Ceasefire, hostage, aid, and reconstruction claims should be tied to specific public proposal or resolution language and marked if implementation status is uncertain.' },
      { sourceId: 'ocha-access', text: 'Aid-access statements should distinguish access constraints, distribution capacity, security posture, affected populations, and the dated source behind each claim.' },
    ],
    suggestedQuestions: ['Which phase, commitment, or implementation question is being assessed?', 'Which public source confirms the current status of aid, hostages, or reconstruction governance?', 'What decision memo output should separate from negotiation-prep material?'],
    suggestedNextActions: ['Track commitments and implementation status by date.', 'Run sourceability before describing ceasefire compliance.', 'Draft a principals memo with unresolved governance and aid-access gaps explicit.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'ceasefire-implementation-track', outputGoal: 'principals-decision-memo', approvalNotes: 'Require review before presenting implementation status, legal conclusions, or sensitive hostage-related claims.' },
    aiUseGuidance: 'Use this as a public diplomatic tracking capsule. Verify current status, distinguish proposal text from implementation, and keep humanitarian and reconstruction claims source-linked.',
  }),
  starter('starter-situation-red-sea-houthi-shipping-risk', 'situation', 'diplomacy', 'Red Sea/Houthi maritime risk watch', 'A situation capsule for Red Sea and Bab el-Mandeb maritime-security risk, Houthi attacks, commercial shipping exposure, advisories, and policy response options.', 'Use this when PRAXIS needs to brief maritime risk from public advisories and diplomatic sources while keeping ship-specific operational details out of the output.', ['red-sea', 'houthi', 'maritime-security', 'shipping-risk', 'bab-el-mandeb', 'team:diplomatic', 'team:security'], { situationCoreId: 'starter-situation-red-sea-houthi-shipping-risk', pathCoreId: 'security-defence', sourceCoreIds: ['marad-red-sea-houthi-advisory', 'un-peacemaker'], toolCoreIds: ['scenario-projector', 'sourceability', 'stakeholder-map'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['scenario-projector', 'sourceability', 'stakeholder-map'], ['scenario-risk-dashboard-card', 'principals-decision-memo', 'country-risk-card'], ['starter-tool-temporal-causal-map', 'starter-tool-actor-leverage-veto-map', 'starter-output-scenario-risk-dashboard-card'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'marad-red-sea-houthi-advisory', label: 'MARAD Red Sea, Bab el-Mandeb, Gulf of Aden, Arabian Sea, and Somali Basin advisory', url: 'https://www.maritime.dot.gov/msci/2026-006-red-sea-bab-el-mandeb-strait-gulf-aden-arabian-sea-and-somali-basin-houthi-attacks', sourceType: 'official', relevance: 'Official maritime advisory anchor for commercial-vessel threat posture and risk-area framing.', publisher: 'U.S. Maritime Administration', date: '2026', reliabilityTier: 1 },
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation resources', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'Diplomatic and de-escalation process reference lane for maritime-security options.', publisher: 'United Nations', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'marad-red-sea-houthi-advisory', text: 'Maritime-risk statements should cite the advisory date, risk area, affected vessel category, and whether the claim is warning, incident reporting, or analytic inference.' },
      { sourceId: 'un-peacemaker', text: 'Diplomatic options should be framed as public de-escalation and process choices, not operational navigation guidance or sensitive security advice.' },
    ],
    suggestedQuestions: ['Which shipping lane, vessel category, or policy response is in scope?', 'What changed since the latest advisory or public incident report?', 'Which risk indicator would trigger a different route or insurance posture?'],
    suggestedNextActions: ['Refresh the advisory and public incident receipts.', 'Build a scenario risk card with indicators and caveats.', 'Avoid operational vessel-routing instructions in public outputs.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'maritime-risk-watch', outputGoal: 'scenario-risk-dashboard-card', approvalNotes: 'Require review before exporting security-sensitive maritime-risk guidance.' },
    aiUseGuidance: 'Use this for public maritime-risk analysis only. Verify advisory dates, avoid ship-specific operational recommendations, and keep policy options distinct from navigation guidance.',
  }),
  starter('starter-situation-essequibo-legal-diplomatic-dispute', 'situation', 'diplomacy', 'Guyana-Venezuela Essequibo dispute tracker', 'A situation capsule for the Guyana-Venezuela Essequibo territorial dispute, ICJ provisional measures, diplomatic posture, legal constraints, and escalation risk.', 'Use this when PRAXIS needs to track legal and diplomatic developments in the Essequibo dispute while distinguishing ICJ orders, state positions, and analytic risk judgments.', ['guyana', 'venezuela', 'essequibo', 'icj', 'territorial-dispute', 'legal-diplomatic', 'team:diplomatic', 'team:legal'], { situationCoreId: 'starter-situation-essequibo-legal-diplomatic-dispute', pathCoreId: 'legal-compliance', sourceCoreIds: ['icj-essequibo-provisional-measures', 'un-peacemaker'], toolCoreIds: ['sourceability', 'commitment-tracker', 'stakeholder-map'], outputCoreIds: ['legal-mandate-compliance-note'] }, ['sourceability', 'commitment-tracker', 'stakeholder-map'], ['legal-mandate-compliance-note', 'principals-decision-memo', 'negotiation-prep-book'], ['starter-tool-legal-mandate-compliance-lens', 'starter-tool-negotiation-ripeness-decision-clock', 'starter-output-legal-mandate-compliance-note'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'icj-essequibo-provisional-measures', label: 'ICJ provisional-measures order in Guyana v. Venezuela', url: 'https://www.icj-cij.org/index.php/node/205421', sourceType: 'official', relevance: 'Primary legal anchor for provisional measures and the court posture in the Essequibo dispute.', publisher: 'International Court of Justice', date: '2023-12-01', reliabilityTier: 1 },
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation resources', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'Public diplomatic-process reference lane for de-escalation and negotiation posture.', publisher: 'United Nations', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'icj-essequibo-provisional-measures', text: 'Legal posture should cite the ICJ source directly and separate ordered measures, party claims, jurisdictional posture, and analyst inference.' },
      { sourceId: 'un-peacemaker', text: 'Diplomatic de-escalation analysis should distinguish legal process, bilateral communication, regional diplomacy, and confidence-building options.' },
    ],
    suggestedQuestions: ['Which ICJ order, state position, or diplomatic event controls the current question?', 'What claim is legal text versus policy inference?', 'What action would reduce escalation risk without prejudging the merits?'],
    suggestedNextActions: ['Attach the relevant ICJ order and public diplomatic statements.', 'Draft a compliance note before a broad options memo.', 'Run sourceability on legal and territorial claims before export.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'legal-diplomatic-dispute-track', outputGoal: 'legal-mandate-compliance-note', approvalNotes: 'Require legal review before stating compliance findings or territorial-law conclusions.' },
    aiUseGuidance: 'Use this as a legal-diplomatic tracker. Verify primary legal documents, mark legal uncertainty, and do not convert analytic risk judgments into legal conclusions.',
  }),
  starter('starter-tool-sourceability-matrix', 'tool', 'audit-review', 'Sourceability Matrix thinking device', 'A thinking-device capsule for mapping each claim to source receipt, source tier, freshness, confidence, caveat, and approval status.', 'Use this before any serious output hardens. PRAXIS should turn unsupported prose into a reviewable claim-source matrix and route gaps to research or rewrite.', ['sourceability', 'evidence-matrix', 'citations', 'claims', 'thinking-device', 'team:research-strategy'], { toolCoreIds: ['sourceability', 'grounded-research', 'contradiction-finder'], sourceCoreIds: ['praxis-claim-source-alignment'], objectiveCoreIds: ['build-sourceability-matrix'], outputCoreIds: ['evidence-sourceability-annex'] }, ['sourceability', 'grounded-research', 'contradiction-finder'], ['evidence-sourceability-annex', 'principals-decision-memo'], ['starter-output-evidence-sourceability-annex', 'starter-tool-legal-mandate-compliance-lens', 'starter-tool-temporal-causal-map'], {
    readinessStars: 5,
    suggestedQuestions: ['Which claims are decision-critical?', 'Which claims are unsupported, weak, stale, or strong?', 'Which source receipt should be promoted or replaced?'],
    suggestedNextActions: ['Create a claim-source matrix.', 'Run sourceability on weak claims.', 'Attach the annex to the final memo before approval.'],
    aiUseGuidance: 'Use this as a sourceability control. Verify every decision-critical claim, preserve citation IDs, and block approval when unsupported claims remain.',
  }),
  starter('starter-tool-temporal-causal-map', 'tool', 'audit-review', 'Temporal-Causal Map thinking device', 'A thinking-device capsule for separating timeline facts, causal claims, triggers, lag effects, indicators, and alternative explanations.', 'Use this when the user asks what changed, why it changed, or what could happen next. PRAXIS should prevent chronology from being mistaken for causation.', ['temporality', 'causality', 'indicators', 'timeline', 'thinking-device', 'team:research-strategy'], { toolCoreIds: ['scenario-projector', 'ach', 'sourceability'], timeCoreId: 'starter-time-temporal-causal-map', objectiveCoreIds: ['build-temporal-causal-map'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['scenario-projector', 'ach', 'sourceability'], ['scenario-risk-dashboard-card', 'principals-decision-memo'], ['starter-tool-sourceability-matrix', 'starter-tool-negotiation-ripeness-decision-clock', 'starter-output-scenario-risk-dashboard-card'], {
    readinessStars: 5,
    suggestedQuestions: ['Which event sequence is factual and dated?', 'Which causal claim needs alternative explanations?', 'Which indicator would disconfirm the current assessment?'],
    suggestedNextActions: ['Build timeline and causal-claim rows separately.', 'Run ACH on competing explanations.', 'Attach indicators to a risk dashboard card.'],
    aiUseGuidance: 'Use this to verify temporal and causal claims. Keep dates, triggers, effects, and uncertainty separate, and cite sources before naming causation.',
  }),
  starter('starter-tool-actor-leverage-veto-map', 'tool', 'options-mapping', 'Actor leverage and veto player map', 'A thinking-device capsule for identifying actors, leverage, veto power, red lines, incentives, informal authority, and coalition constraints.', 'Use this before negotiation, sanctions, mandate, or escalation options are drafted. PRAXIS should identify who can block, enable, spoil, or implement the proposed course.', ['actors', 'leverage', 'veto-players', 'coalitions', 'power-map', 'thinking-device', 'team:diplomatic'], { toolCoreIds: ['stakeholder-map', 'coalition-detector', 'position-vs-interest'], graphCoreId: 'starter-graph-actor-leverage-veto', objectiveCoreIds: ['map-leverage-veto-players'], outputCoreIds: ['negotiation-prep-book'] }, ['stakeholder-map', 'coalition-detector', 'position-vs-interest'], ['negotiation-prep-book', 'principals-decision-memo', 'actor-dossier'], ['starter-output-negotiation-prep-book', 'starter-tool-negotiation-ripeness-decision-clock', 'starter-situation-eastern-drc-m23-mandate-watch'], {
    readinessStars: 5,
    suggestedQuestions: ['Who can block or enable the decision?', 'What leverage is evidenced versus inferred?', 'Which veto player changes the negotiation or implementation path?'],
    suggestedNextActions: ['Map actors and veto points before drafting options.', 'Attach source receipts for leverage claims.', 'Convert the map into a negotiation prep book if talks are live.'],
    aiUseGuidance: 'Use this for actor-power analysis. Verify leverage claims, label inferred influence, and avoid unsupported attribution or private-intelligence framing.',
  }),
  starter('starter-tool-legal-mandate-compliance-lens', 'tool', 'policy-review', 'Legal mandate and compliance lens', 'A thinking-device capsule for checking mandate text, legal authority, obligations, constraints, exceptions, review gates, and compliance caveats.', 'Use this when an answer touches mandates, Security Council language, court orders, sanctions, humanitarian law, procurement rules, or institutional authority.', ['legal', 'mandate', 'compliance', 'obligations', 'review-gate', 'thinking-device', 'team:legal'], { toolCoreIds: ['sourceability', 'commitment-tracker', 'contradiction-finder'], pathCoreId: 'legal-compliance', objectiveCoreIds: ['check-legal-mandate-compliance'], outputCoreIds: ['legal-mandate-compliance-note'] }, ['sourceability', 'commitment-tracker', 'contradiction-finder'], ['legal-mandate-compliance-note', 'principals-decision-memo'], ['starter-output-legal-mandate-compliance-note', 'starter-situation-essequibo-legal-diplomatic-dispute', 'starter-situation-eastern-drc-m23-mandate-watch'], {
    readinessStars: 5,
    suggestedQuestions: ['What exact mandate or legal text governs the claim?', 'What obligation, prohibition, exception, or review gate applies?', 'Which conclusion must remain a caveat pending expert review?'],
    suggestedNextActions: ['Quote or cite the controlling public text.', 'Separate legal posture from policy recommendation.', 'Create a compliance note before export.'],
    aiUseGuidance: 'Use this as a legal and mandate review lens, not legal advice. Verify primary texts, preserve caveats, and require human approval before compliance conclusions ship.',
  }),
  starter('starter-tool-negotiation-ripeness-decision-clock', 'tool', 'options-mapping', 'Negotiation ripeness and decision clock', 'A thinking-device capsule for negotiation ripeness, hurting stalemate signals, mandates, spoilers, deadline pressure, and decision windows.', 'Use this when the question is whether, when, and how to move a diplomatic or mediation track. PRAXIS should separate ripe conditions, false urgency, and blockers.', ['negotiation', 'ripeness', 'decision-clock', 'deadlines', 'spoilers', 'thinking-device', 'team:diplomatic'], { toolCoreIds: ['position-vs-interest', 'scenario-projector', 'commitment-tracker'], timeCoreId: 'starter-time-negotiation-decision-clock', objectiveCoreIds: ['assess-negotiation-ripeness'], outputCoreIds: ['negotiation-prep-book'] }, ['position-vs-interest', 'scenario-projector', 'commitment-tracker'], ['negotiation-prep-book', 'talking-points', 'principals-decision-memo'], ['starter-output-negotiation-prep-book', 'starter-tool-actor-leverage-veto-map', 'starter-situation-gaza-ceasefire-aid-reconstruction'], {
    readinessStars: 5,
    suggestedQuestions: ['What deadline or inflection point creates the decision window?', 'Which actors have mandates, red lines, or spoilers?', 'What evidence suggests ripeness rather than wishful timing?'],
    suggestedNextActions: ['Build a decision clock with dates and triggers.', 'Map positions versus interests for each party.', 'Draft negotiation prep materials with caveats and fallback questions.'],
    aiUseGuidance: 'Use this for negotiation timing analysis. Verify dates and mandates, label uncertainty, and do not assert ripeness without source-backed indicators.',
  }),
  starter('starter-output-principals-decision-memo', 'output', 'output-brief', 'Principals decision memo artifact capsule', 'An artifact capsule for a principals-ready decision memo with BLUF, decision question, options, risks, recommendation, sourceability, and approval posture.', 'Use this when the final product must support a senior decision. PRAXIS should keep source gaps and tradeoffs visible rather than over-polishing uncertainty away.', ['decision-memo', 'principals', 'options', 'recommendation', 'artifact', 'team:research-strategy'], { outputCoreIds: ['principals-decision-memo'], productCoreIds: ['principals-decision-memo'], objectiveCoreIds: ['draft-principals-decision-memo'] }, ['memo-drafter', 'sourceability', 'ach'], ['principals-decision-memo', 'evidence-sourceability-annex'], ['starter-tool-sourceability-matrix', 'starter-tool-temporal-causal-map', 'starter-output-evidence-sourceability-annex'], {
    readinessStars: 4,
    suggestedQuestions: ['What decision must principals make?', 'Which options and risks are truly decision-relevant?', 'Which claims need an annex before approval?'],
    suggestedNextActions: ['Draft BLUF, decision question, options, and recommendation.', 'Attach an evidence annex for critical claims.', 'Run red-team and sourceability before shipping.'],
    aiUseGuidance: 'Use this as an approval-gated memo artifact. Verify citations, preserve uncertainty, and require human approval before external use.',
  }),
  starter('starter-output-negotiation-prep-book', 'output', 'output-brief', 'Negotiation prep book artifact capsule', 'An artifact capsule for negotiation preparation: parties, interests, red lines, leverage, BATNAs, sequencing, asks, and fallback questions.', 'Use this when the output is for a negotiation, mediation, or diplomatic engagement rather than a general analysis memo.', ['negotiation', 'prep-book', 'mediation', 'talking-points', 'artifact', 'team:diplomatic'], { outputCoreIds: ['negotiation-prep-book'], productCoreIds: ['negotiation-prep-book'], objectiveCoreIds: ['draft-negotiation-prep-book'] }, ['memo-drafter', 'stakeholder-map', 'position-vs-interest'], ['negotiation-prep-book', 'talking-points'], ['starter-tool-actor-leverage-veto-map', 'starter-tool-negotiation-ripeness-decision-clock', 'starter-situation-gaza-ceasefire-aid-reconstruction'], {
    readinessStars: 4,
    suggestedQuestions: ['Who will use the prep book and in what meeting?', 'Which party interests and red lines are sourced?', 'What are the fallback questions if the preferred ask fails?'],
    suggestedNextActions: ['Map parties, leverage, and red lines.', 'Draft asks and anticipated objections.', 'Attach sourceability notes to sensitive actor claims.'],
    aiUseGuidance: 'Use this as negotiation preparation, not a substitute for diplomatic judgment. Verify actor claims, keep caveats visible, and protect sensitive material.',
  }),
  starter('starter-output-legal-mandate-compliance-note', 'output', 'output-brief', 'Legal/mandate compliance note artifact capsule', 'An artifact capsule for mandate, legal, compliance, and authority review notes with cited controlling text and explicit caveats.', 'Use this when the final product must show what public legal or mandate source supports the recommendation and where expert review is still required.', ['legal', 'mandate', 'compliance-note', 'authority', 'artifact', 'team:legal'], { outputCoreIds: ['legal-mandate-compliance-note'], productCoreIds: ['legal-mandate-compliance-note'], objectiveCoreIds: ['draft-legal-mandate-compliance-note'] }, ['memo-drafter', 'sourceability', 'commitment-tracker'], ['legal-mandate-compliance-note', 'principals-decision-memo'], ['starter-tool-legal-mandate-compliance-lens', 'starter-situation-essequibo-legal-diplomatic-dispute', 'starter-situation-eastern-drc-m23-mandate-watch'], {
    readinessStars: 4,
    suggestedQuestions: ['What controlling public text must be cited?', 'Which conclusion is legal posture versus policy judgment?', 'What expert review gate remains before export?'],
    suggestedNextActions: ['Cite primary legal or mandate sources.', 'Separate obligations, constraints, and caveats.', 'Block approval until unsupported legal claims are resolved.'],
    aiUseGuidance: 'Use this as a compliance-note artifact, not legal advice. Verify primary sources and require human approval before compliance findings ship.',
  }),
  starter('starter-output-evidence-sourceability-annex', 'output', 'output-brief', 'Evidence and sourceability annex artifact capsule', 'An artifact capsule for claim-source matrices, source tiers, freshness checks, unsupported-claim flags, and citation repair notes.', 'Use this when a memo, dashboard, or talking-points pack needs a reviewable evidence annex before approval.', ['evidence-annex', 'sourceability', 'citations', 'claim-matrix', 'artifact', 'team:research-strategy'], { outputCoreIds: ['evidence-sourceability-annex'], productCoreIds: ['evidence-sourceability-annex'], objectiveCoreIds: ['draft-evidence-sourceability-annex'] }, ['sourceability', 'grounded-research', 'memo-drafter'], ['evidence-sourceability-annex', 'principals-decision-memo'], ['starter-tool-sourceability-matrix', 'starter-output-principals-decision-memo', 'starter-tool-legal-mandate-compliance-lens'], {
    readinessStars: 4,
    suggestedQuestions: ['Which claims belong in the annex?', 'Which source is primary, secondary, stale, or missing?', 'Which unsupported claims block approval?'],
    suggestedNextActions: ['Create the claim-source matrix.', 'Flag stale and unsupported claims.', 'Link annex rows back to memo paragraphs.'],
    aiUseGuidance: 'Use this as the sourceability artifact. Verify every citation, preserve source IDs, and block approval where support is weak or missing.',
  }),
  starter('starter-output-scenario-risk-dashboard-card', 'output', 'output-brief', 'Scenario and risk dashboard card artifact capsule', 'An artifact capsule for compact scenario, risk, indicator, confidence, source coverage, and next-action dashboard cards.', 'Use this when the user needs a small monitoring product rather than a long memo. PRAXIS should make risk drivers, indicators, and source gaps scannable.', ['scenario', 'risk-dashboard', 'indicators', 'monitoring', 'artifact', 'team:research-strategy'], { outputCoreIds: ['scenario-risk-dashboard-card'], productCoreIds: ['scenario-risk-dashboard-card'], objectiveCoreIds: ['draft-scenario-risk-dashboard-card'] }, ['scenario-projector', 'sourceability', 'ach'], ['scenario-risk-dashboard-card', 'principals-decision-memo'], ['starter-tool-temporal-causal-map', 'starter-situation-sudan-darfur-atrocity-access', 'starter-situation-red-sea-houthi-shipping-risk'], {
    readinessStars: 4,
    suggestedQuestions: ['What horizon and indicator set controls the card?', 'Which risk driver is source-backed versus inferred?', 'What next action follows if an indicator changes?'],
    suggestedNextActions: ['Draft risk cards with source and as-of date.', 'Separate indicator movement from causal judgment.', 'Attach source gaps before presenting the dashboard.'],
    aiUseGuidance: 'Use this as a monitoring artifact. Verify indicators and dates, show confidence and gaps, and avoid overstating forecasts.',
  }),
];

export function getCapsuleStarterDefinition(capsuleId: string | null | undefined): CapsuleStarterDefinition | null {
  if (!capsuleId) return null;
  return CAPSULE_STARTER_DEFINITIONS.find((starterDefinition) => starterDefinition.starterId === capsuleId) ?? null;
}

export function buildCapsuleStarterPromptBlock(
  capsuleId: string | null | undefined,
  starterSnapshot?: CapsuleStarterSnapshot | null,
): string | null {
  const starterDefinition = starterSnapshot?.starterId === capsuleId
    ? starterSnapshot
    : getCapsuleStarterDefinition(capsuleId);
  if (!starterDefinition) return null;
  return [
    '[starter_capsule_definition]',
    `starter_id: ${starterDefinition.starterId}`,
    `starter_category: ${starterDefinition.category}`,
    `domain: ${starterDefinition.domain}`,
    `starter_label: ${starterDefinition.label}`,
    `starter_summary: ${starterDefinition.summary}`,
    `starter_detail: ${starterDefinition.detail}`,
    `starter_tags: ${starterDefinition.tags.join(', ')}`,
    `readiness_stars: ${starterDefinition.readinessStars}/5 source-readiness confidence`,
    `source_pack: ${starterDefinition.sourcePack.length ? starterDefinition.sourcePack.map((source) => `${source.id}|${source.label}|${source.publisher ?? 'unknown publisher'}|${source.date ?? 'unknown date'}|tier${source.reliabilityTier ?? 'unknown'}|${source.url}|${source.relevance}`).join(' ; ') : 'none'}`,
    `source_excerpts: ${starterDefinition.excerpts.length ? starterDefinition.excerpts.map((excerpt) => `${excerpt.sourceId}: ${excerpt.text}`).join(' ; ') : 'none'}`,
    `recommended_tools: ${starterDefinition.recommendedToolIds.length ? starterDefinition.recommendedToolIds.join(', ') : 'none'}`,
    `output_targets: ${starterDefinition.outputProductIds.length ? starterDefinition.outputProductIds.join(', ') : 'none'}`,
    `suggested_questions: ${starterDefinition.suggestedQuestions.join(' | ')}`,
    `suggested_next_actions: ${starterDefinition.suggestedNextActions.join(' | ')}`,
    `agent_workflow: preferred_agent=${starterDefinition.agentWorkflow.preferredAgentId}; route_hint=${starterDefinition.agentWorkflow.routeHint}; output_goal=${starterDefinition.agentWorkflow.outputGoal}; approval_notes=${starterDefinition.agentWorkflow.approvalNotes}`,
    `ai_use_guidance: ${starterDefinition.aiUseGuidance}`,
    `combines_well_with: ${starterDefinition.combinesWellWith.length ? starterDefinition.combinesWellWith.join(', ') : 'none'}`,
    ...('inspectionSections' in starterDefinition ? starterDefinition.inspectionSections.map((section) => `starter_section_${stableReceiptPart(section.label)}: ${section.detail}`) : []),
    'runtime_rule: Treat this starter definition as reusable operating context for Ask PRAXIS, tool routing, agent runs, and output drafting.',
    'runtime_rule: Preserve user edits on the persisted capsule, but use this starter definition to explain what the capsule is for and how to improve it.',
    '',
  ].join('\n');
}

export const POLICY_USER_ARCHETYPES = [
  {
    label: 'Foreign policy analyst',
    detail: 'Conflict, statecraft, source posture, diplomatic language, memo drafting.',
    defaultTemplates: ['conflict-analysis', 'director-handover', 'public-sector-memo'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'Conflict resolution practitioner',
    detail: 'Actors, incentives, commitments, mediation timing, red-team review.',
    defaultTemplates: ['conflict-analysis', 'crisis-brief', 'agent-handover'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'Defence capture lead',
    detail: 'Requirements, procurement timeline, influence map, approval path, competitor read.',
    defaultTemplates: ['defence-opportunity', 'board-brief', 'agent-handover'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'Public affairs lead',
    detail: 'Regulatory change, stakeholders, narrative posture, briefing output.',
    defaultTemplates: ['regulatory-watch', 'public-sector-memo', 'board-brief'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'HR policy owner',
    detail: 'Rules, affected groups, legal review, approval path, rollout notes.',
    defaultTemplates: ['hr-policy-review', 'director-handover', 'agent-handover'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'Legal and compliance analyst',
    detail: 'Rules, source receipts, entity exposure, contradiction checks, review gates.',
    defaultTemplates: ['sanctions-compliance', 'regulatory-watch', 'public-sector-memo'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'Crisis manager',
    detail: 'Episodes, deadlines, source updates, power shifts, executive briefs.',
    defaultTemplates: ['crisis-brief', 'director-handover', 'agent-handover'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'Strategy operator',
    detail: 'Market and institutional context, board language, decision path, risks.',
    defaultTemplates: ['board-brief', 'regulatory-watch', 'defence-opportunity'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'Program officer',
    detail: 'Grant context, local actors, source gaps, implementation risk, handover.',
    defaultTemplates: ['public-sector-memo', 'crisis-brief', 'director-handover'] as ContextCapsuleTemplateId[],
  },
  {
    label: 'Research director',
    detail: 'Team handover, quality checks, evidence discipline, reusable capsule library.',
    defaultTemplates: ['director-handover', 'board-brief', 'agent-handover'] as ContextCapsuleTemplateId[],
  },
];

export const POLICY_PATH_PROFILES: PolicyPathProfile[] = [
  {
    id: 'generic-policy',
    label: 'Generic policy worker',
    userFrame: 'A user with a policy problem, source material, and a decision or memo to produce.',
    defaultTemplates: ['public-sector-memo', 'director-handover', 'agent-handover'],
    suggestedTools: ['Ask PRAXIS', 'Sourceability check', 'Memo drafter', 'Red-team review'],
    suggestedOutputs: ['Options memo', 'Briefing note', 'Handover packet'],
    sourceTags: ['policy', 'sources', 'memo', 'handover'],
    missingInfoPrompts: ['What decision or output is needed?', 'Which documents or source links should ground it?', 'Who is the audience?'],
  },
  {
    id: 'foreign-policy',
    label: 'Foreign policy analyst',
    userFrame: 'Diplomacy, conflict, sanctions, multilateral institutions, and briefing language.',
    defaultTemplates: ['conflict-analysis', 'regulatory-watch', 'public-sector-memo'],
    suggestedTools: ['Source Scout', 'Timeline Events', 'Power Map', 'Policy Memo'],
    suggestedOutputs: ['Diplomatic brief', 'Sourceable options memo', 'Talking points'],
    sourceTags: ['official-news', 'grounded_search', 'world-bank', 'diplomacy', 'sanctions'],
    missingInfoPrompts: ['Which country, institution, or negotiation track is in scope?', 'What multilateral context matters?', 'What source caveat should be explicit?'],
  },
  {
    id: 'conflict-resolution',
    label: 'Conflict resolution practitioner',
    userFrame: 'Actors, interests, commitments, mediation timing, ripeness, and spoilers.',
    defaultTemplates: ['conflict-analysis', 'temporal-causal-map', 'human-friction-map'],
    suggestedTools: ['Stakeholder Map', 'Mediation Design', 'Scenario Review', 'Red-team review'],
    suggestedOutputs: ['Mediation brief', 'Actor-interest map', 'Process design note'],
    sourceTags: ['source_linked_events', 'grounded_search', 'crisis-group', 'mediation', 'commitments'],
    missingInfoPrompts: ['Which parties and spoilers are in scope?', 'What commitments or red lines are known?', 'What source gaps could distort the process read?'],
  },
  {
    id: 'mediator-peace-process',
    label: 'Mediator / peace process practitioner',
    userFrame: 'Parties, interests, red lines, confidence-building measures, commitments, and process sequencing.',
    defaultTemplates: ['conflict-analysis', 'human-friction-map', 'decision-clock'],
    suggestedTools: ['Mediation Design', 'Stakeholder Map', 'Commitment Scan', 'Scenario Review'],
    suggestedOutputs: ['Process design note', 'Party-position brief', 'Confidence-building memo'],
    sourceTags: ['mediation', 'negotiation', 'commitments', 'confidence-building', 'spoilers'],
    missingInfoPrompts: ['Which parties, red lines, and mandates bind the process?', 'What confidence-building options are politically feasible?', 'What deadline or sequencing constraint matters?'],
  },
  {
    id: 'economic-sanctions',
    label: 'Economic / sanctions analyst',
    userFrame: 'Entities, sectors, exposure, trade flows, financial pressure, rule coverage, and compliance posture.',
    defaultTemplates: ['economic-exposure', 'sanctions-compliance', 'legal-compliance-review'],
    suggestedTools: ['Sanctions Check', 'Economic Impact', 'Sourceability check', 'Treaty Analyze'],
    suggestedOutputs: ['Economic exposure note', 'Compliance note', 'Options memo'],
    sourceTags: ['ofac', 'world-bank', 'trade', 'finance', 'sanctions'],
    missingInfoPrompts: ['Which entities, sectors, and jurisdictions are in scope?', 'What transaction, exposure, or decision is being reviewed?', 'Which sanctions or trade-control sources must be treated as authoritative?'],
  },
  {
    id: 'humanitarian-analysis',
    label: 'Humanitarian analyst',
    userFrame: 'Access constraints, needs, protection risks, affected populations, operational partners, and source freshness.',
    defaultTemplates: ['humanitarian-access', 'crisis-brief', 'decision-clock'],
    suggestedTools: ['Humanitarian Snapshot', 'Humanitarian Web Search', 'Risk Indicators', 'Daily Brief'],
    suggestedOutputs: ['Humanitarian situation brief', 'Access risk note', 'Operational handover'],
    sourceTags: ['humanitarian_web', 'humanitarian_data', 'ocha', 'displacement_reporting', 'protection'],
    missingInfoPrompts: ['Which affected population and geography are in scope?', 'What access, needs, or protection constraint matters most?', 'How fresh must the operational picture be?'],
  },
  {
    id: 'security-defence',
    label: 'Security / defence analyst',
    userFrame: 'Capabilities, force posture, procurement, stakeholders, blockers, risks, and opportunity capture.',
    defaultTemplates: ['defence-opportunity', 'conflict-analysis', 'temporal-causal-map'],
    suggestedTools: ['Power Map', 'Risk Indicators', 'Scenario Review', 'Board Brief'],
    suggestedOutputs: ['Security assessment', 'Capture brief', 'Opportunity brief'],
    sourceTags: ['source_linked_events', 'security_research', 'defence', 'security', 'procurement'],
    missingInfoPrompts: ['Which capability, procurement, or force-posture question is live?', 'Which stakeholders and blockers matter?', 'What source classes are acceptable for sensitive claims?'],
  },
  {
    id: 'climate-development',
    label: 'Climate / development analyst',
    userFrame: 'Geography, indicators, program risks, development finance, climate-security links, and long-horizon monitoring.',
    defaultTemplates: ['climate-development-risk', 'program-delivery', 'public-sector-memo'],
    suggestedTools: ['Grounded research', 'Scenario Review', 'Risk Indicators', 'Memo Drafter'],
    suggestedOutputs: ['Climate-development brief', 'Program risk note', 'Finance options memo'],
    sourceTags: ['world-bank', 'undp', 'climate', 'development', 'stabilization'],
    missingInfoPrompts: ['What geography, program, and horizon are in scope?', 'Which indicators should be watched?', 'What finance or delivery decision is being served?'],
  },
  {
    id: 'information-cyber',
    label: 'Information / cyber analyst',
    userFrame: 'Narratives, media sources, disinformation risk, cyber posture, response options, and caveated evidence.',
    defaultTemplates: ['information-environment', 'regulatory-watch', 'crisis-brief'],
    suggestedTools: ['Media Compass', 'Grounded research', 'Contradiction finder', 'Talking Points'],
    suggestedOutputs: ['Information environment brief', 'Narrative risk note', 'Response options memo'],
    sourceTags: ['grounded_search', 'media', 'narrative', 'disinformation', 'cyber'],
    missingInfoPrompts: ['Which narrative, platform, language, or geography is in scope?', 'What cyber or information posture must be assessed?', 'What response audience needs the output?'],
  },
  {
    id: 'defence-capture',
    label: 'Defence capture lead',
    userFrame: 'Requirements, procurement timeline, approval path, competitors, and blockers.',
    defaultTemplates: ['defence-opportunity', 'board-brief', 'agent-handover'],
    suggestedTools: ['Requirements map', 'Power Map', 'Timeline Events', 'Board Brief'],
    suggestedOutputs: ['Capture brief', 'Opportunity map', 'Executive decision note'],
    sourceTags: ['defence', 'procurement', 'requirements', 'stakeholders', 'approval'],
    missingInfoPrompts: ['Which opportunity or requirement is being pursued?', 'What approval gate or deadline matters?', 'Which competitors or blockers should be mapped?'],
  },
  {
    id: 'public-affairs',
    label: 'Public affairs lead',
    userFrame: 'Regulatory movement, stakeholder posture, narrative risk, and public messaging.',
    defaultTemplates: ['regulatory-watch', 'public-sector-memo', 'board-brief'],
    suggestedTools: ['Regulatory Watch', 'Media Compass', 'Stakeholder Map', 'Talking Points'],
    suggestedOutputs: ['Regulatory memo', 'Stakeholder brief', 'Narrative posture note'],
    sourceTags: ['regulatory', 'consultation', 'media', 'stakeholders', 'public-affairs'],
    missingInfoPrompts: ['What rule change or consultation window matters?', 'Which stakeholders or audiences are sensitive?', 'What narrative risk needs talking points?'],
  },
  {
    id: 'public-sector-policy',
    label: 'Public-sector policy officer',
    userFrame: 'Decision memos, implementation constraints, statutory duties, stakeholder effects, and ministerial language.',
    defaultTemplates: ['public-sector-memo', 'regulatory-watch', 'director-handover'],
    suggestedTools: ['Policy Memo', 'Stakeholder Map', 'Citation Repair', 'Red-team review'],
    suggestedOutputs: ['Options memo', 'Ministerial submission', 'Implementation note'],
    sourceTags: ['public-sector', 'governance', 'implementation', 'rule-of-law', 'memo'],
    missingInfoPrompts: ['What decision or submission is this serving?', 'Which statutory or institutional duties bind it?', 'Who is affected by the change?'],
  },
  {
    id: 'regulatory-public-affairs',
    label: 'Regulatory / public affairs analyst',
    userFrame: 'Rule movement, affected entities, consultation windows, enforcement posture, and communications risk.',
    defaultTemplates: ['regulatory-watch', 'board-brief', 'public-sector-memo'],
    suggestedTools: ['Regulatory Watch', 'Media Compass', 'Timeline Events', 'Talking Points'],
    suggestedOutputs: ['Regulatory update', 'Stakeholder map', 'Public affairs brief'],
    sourceTags: ['regulatory', 'enforcement', 'consultation', 'affected-entities', 'communications'],
    missingInfoPrompts: ['Which regulator, rule, or enforcement posture is in scope?', 'What effective date or consultation deadline matters?', 'Which entities are exposed?'],
  },
  {
    id: 'hr-policy',
    label: 'HR policy owner',
    userFrame: 'Internal rules, affected groups, approvals, comms, legal review, and rollout.',
    defaultTemplates: ['hr-policy-review', 'director-handover', 'agent-handover'],
    suggestedTools: ['Spec Check', 'Impact Review', 'Approval Path', 'Memo Drafter'],
    suggestedOutputs: ['Policy rollout note', 'Employee impact brief', 'Review packet'],
    sourceTags: ['hr', 'internal-policy', 'employee-impact', 'approvals', 'legal-review'],
    missingInfoPrompts: ['Which employee groups are affected?', 'What internal rules or approvals govern the change?', 'What rollout note or review packet is needed?'],
  },
  {
    id: 'legal-compliance',
    label: 'Legal and compliance analyst',
    userFrame: 'Rules, entity exposure, source receipts, contradictions, and sign-off posture.',
    defaultTemplates: ['legal-compliance-review', 'sanctions-compliance', 'regulatory-watch'],
    suggestedTools: ['Sanctions Check', 'Treaty Analyze', 'Citation Repair', 'Red-team review'],
    suggestedOutputs: ['Compliance note', 'Exposure memo', 'Review receipt'],
    sourceTags: ['legal', 'compliance', 'treaty', 'regulatory', 'sign-off'],
    missingInfoPrompts: ['Which rule, treaty, regulation, or policy controls the answer?', 'What contradictions or source receipts need review?', 'Who must sign off before export?'],
  },
  {
    id: 'crisis-management',
    label: 'Crisis manager',
    userFrame: 'Episodes, deadlines, changing actors, escalation, decisions, and executive updates.',
    defaultTemplates: ['crisis-brief', 'decision-clock', 'director-handover'],
    suggestedTools: ['Timeline Events', 'Risk Indicators', 'Daily Brief', 'Executive Intelligence'],
    suggestedOutputs: ['Situation brief', 'Decision log', 'Morning update'],
    sourceTags: ['crisis', 'timeline', 'incident', 'decision-clock', 'handover'],
    missingInfoPrompts: ['What changed since the last update?', 'What deadline or decision clock is live?', 'Who needs the next brief or handover?'],
  },
  {
    id: 'strategy-operations',
    label: 'Strategy operator',
    userFrame: 'Board context, market/regulatory shifts, institutional constraints, and decisions.',
    defaultTemplates: ['board-brief', 'regulatory-watch', 'defence-opportunity'],
    suggestedTools: ['Scenario Review', 'Power Map', 'Board Brief', 'Red-team review'],
    suggestedOutputs: ['Board memo', 'Strategy brief', 'Decision options note'],
    sourceTags: ['strategy', 'board', 'market', 'risk', 'decision'],
    missingInfoPrompts: ['What strategic decision or board question is live?', 'Which risks and stakeholders matter most?', 'What output language should be board-ready?'],
  },
  {
    id: 'program-delivery',
    label: 'Program officer',
    userFrame: 'Implementation context, local actors, source gaps, delivery risks, and handover.',
    defaultTemplates: ['program-delivery', 'public-sector-memo', 'director-handover'],
    suggestedTools: ['Sourceability check', 'Risk Indicators', 'Timeline Events', 'Handover Pack'],
    suggestedOutputs: ['Implementation brief', 'Risk note', 'Program handover'],
    sourceTags: ['program-delivery', 'implementation', 'partners', 'milestones', 'risk'],
    missingInfoPrompts: ['Which program, partners, and geography are in scope?', 'What milestones or delivery risks are live?', 'What should be handed over to the team?'],
  },
  {
    id: 'research-direction',
    label: 'Research director',
    userFrame: 'Team memory, review quality, reusable capsule library, and inheritable standards.',
    defaultTemplates: ['director-handover', 'board-brief', 'agent-handover'],
    suggestedTools: ['Red-team review', 'Sourceability check', 'Memo Studio', 'Agent Handover'],
    suggestedOutputs: ['Research handover', 'Quality review', 'Reusable capsule template'],
    sourceTags: ['research', 'strategy', 'quality', 'review-standards', 'team-memory'],
    missingInfoPrompts: ['What should become reusable team memory?', 'Which quality standard or review queue applies?', 'What board or leadership language is needed?'],
  },
  {
    id: 'human-rights-accountability',
    label: 'Human rights / accountability analyst',
    userFrame: 'Allegations, actors, legal thresholds, source reliability, chain of custody, and review gaps.',
    defaultTemplates: ['human-rights-allegation-matrix', 'legal-compliance-review', 'conflict-analysis'],
    suggestedTools: ['Human Rights Review', 'Treaty Analyze', 'Sourceability check', 'Red-team review'],
    suggestedOutputs: ['Accountability brief', 'Allegation matrix', 'Legal risk note'],
    sourceTags: ['ohchr', 'ihl', 'accountability', 'chain-of-custody', 'human-rights'],
    missingInfoPrompts: ['Which allegations and legal thresholds are in scope?', 'What source reliability or chain-of-custody gaps exist?', 'Which claims require corroboration before export?'],
  },
];

export const POLICY_TEAM_CATEGORIES: PolicyTeamCategory[] = [
  {
    id: 'economic-sanctions',
    label: 'Economic & sanctions',
    shortLabel: 'Economic',
    description: 'Sanctions, trade controls, financial exposure, markets, development finance, and economic statecraft.',
    domainId: 'economic-sanctions',
    policyPathIds: ['economic-sanctions', 'legal-compliance', 'strategy-operations'],
    templateIds: ['economic-exposure', 'sanctions-compliance', 'legal-compliance-review'],
    toolIds: ['grounded-research', 'sourceability', 'memo-drafter', 'ach'],
    outputProductIds: ['compliance-note', 'options-memo', 'board-brief'],
    sourceTags: ['world-bank', 'ofac', 'sanctions', 'trade', 'finance'],
    missingInfoPrompts: ['Which entities or sectors are in scope?', 'What jurisdiction or regime controls the decision?', 'What exposure or decision must be reviewed?'],
  },
  {
    id: 'diplomatic',
    label: 'Diplomatic',
    shortLabel: 'Diplomacy',
    description: 'Foreign policy, multilateral posture, negotiation, mediation, and official briefing work.',
    domainId: 'diplomacy-negotiation',
    policyPathIds: ['foreign-policy', 'conflict-resolution', 'mediator-peace-process'],
    templateIds: ['conflict-analysis', 'human-friction-map', 'decision-clock'],
    toolIds: ['stakeholder-map', 'position-vs-interest', 'scenario-projector', 'memo-drafter'],
    outputProductIds: ['options-memo', 'actor-power-map', 'agent-handover'],
    sourceTags: ['official-news', 'crisis-group', 'diplomacy', 'mediation', 'negotiation'],
    missingInfoPrompts: ['Who is the audience for the brief?', 'Which parties or institutions must be represented?', 'What red lines or mandate limits matter?'],
  },
  {
    id: 'security-defence',
    label: 'Security & defence',
    shortLabel: 'Security',
    description: 'Armed conflict, defence capture, escalation, force posture, procurement, and security risk.',
    domainId: 'armed-conflict-security',
    policyPathIds: ['security-defence', 'defence-capture', 'conflict-resolution'],
    templateIds: ['defence-opportunity', 'temporal-causal-map', 'human-friction-map'],
    toolIds: ['stakeholder-map', 'scenario-projector', 'coalition-detector', 'ach'],
    outputProductIds: ['actor-power-map', 'situation-brief', 'board-brief'],
    sourceTags: ['source_linked_events', 'grounded_search', 'security_research', 'defence', 'security'],
    missingInfoPrompts: ['Which actors and capabilities are in scope?', 'What decision window or procurement gate matters?', 'Which sources are trusted for security claims?'],
  },
  {
    id: 'humanitarian',
    label: 'Humanitarian',
    shortLabel: 'Humanitarian',
    description: 'Needs, access, displacement, protection, operations, and humanitarian coordination.',
    domainId: 'humanitarian',
    policyPathIds: ['humanitarian-analysis', 'program-delivery', 'crisis-management'],
    templateIds: ['humanitarian-access', 'crisis-brief', 'decision-clock'],
    toolIds: ['grounded-research', 'sourceability', 'scenario-projector', 'memo-drafter'],
    outputProductIds: ['situation-brief', 'agent-handover', 'options-memo'],
    sourceTags: ['humanitarian_web', 'humanitarian_data', 'ocha', 'displacement_reporting', 'protection'],
    missingInfoPrompts: ['Which affected populations are in scope?', 'What access or protection constraint is decision-relevant?', 'How current must the operational picture be?'],
  },
  {
    id: 'human-rights-legal',
    label: 'Human rights & legal',
    shortLabel: 'Rights/legal',
    description: 'Rights allegations, accountability, legal thresholds, compliance, and review receipts.',
    domainId: 'human-rights',
    policyPathIds: ['human-rights-accountability', 'legal-compliance', 'public-sector-policy'],
    templateIds: ['human-rights-allegation-matrix', 'legal-compliance-review', 'sanctions-compliance'],
    toolIds: ['sourceability', 'contradiction-finder', 'ach', 'memo-drafter'],
    outputProductIds: ['compliance-note', 'actor-power-map', 'options-memo'],
    sourceTags: ['ohchr', 'amnesty', 'hrw', 'ihl', 'accountability'],
    missingInfoPrompts: ['What legal or institutional threshold is being tested?', 'Which claims require source receipts?', 'Who signs off before export?'],
  },
  {
    id: 'governance-public-sector',
    label: 'Governance & public sector',
    shortLabel: 'Governance',
    description: 'Government decisions, implementation constraints, regulation, public administration, and stakeholder effects.',
    domainId: 'governance-rule-of-law',
    policyPathIds: ['public-sector-policy', 'regulatory-public-affairs', 'public-affairs'],
    templateIds: ['public-sector-memo', 'regulatory-watch', 'director-handover'],
    toolIds: ['context-builder', 'stakeholder-map', 'sourceability', 'memo-drafter'],
    outputProductIds: ['options-memo', 'compliance-note', 'agent-handover'],
    sourceTags: ['governance', 'regulatory', 'public-sector', 'rule-of-law', 'implementation'],
    missingInfoPrompts: ['What decision or submission is this serving?', 'Which statutory or institutional rules bind the work?', 'Who is affected by the policy change?'],
  },
  {
    id: 'climate-development',
    label: 'Climate & development',
    shortLabel: 'Climate/dev',
    description: 'Development, stabilization, climate security, resource risk, and long-horizon program choices.',
    domainId: 'development-stabilization',
    policyPathIds: ['climate-development', 'program-delivery', 'humanitarian-analysis'],
    templateIds: ['climate-development-risk', 'program-delivery', 'public-sector-memo'],
    toolIds: ['grounded-research', 'scenario-projector', 'stakeholder-map', 'memo-drafter'],
    outputProductIds: ['options-memo', 'situation-brief', 'agent-handover'],
    sourceTags: ['world-bank', 'undp', 'climate', 'development', 'stabilization'],
    missingInfoPrompts: ['What geography and horizon matter?', 'Which program or policy lever can change?', 'What indicators should be monitored?'],
  },
  {
    id: 'information-cyber',
    label: 'Information & cyber',
    shortLabel: 'Info/cyber',
    description: 'Narratives, disinformation, media integrity, cyber posture, and information environment analysis.',
    domainId: 'information-cyber',
    policyPathIds: ['information-cyber', 'public-affairs', 'foreign-policy'],
    templateIds: ['information-environment', 'regulatory-watch', 'crisis-brief'],
    toolIds: ['grounded-research', 'frame-narrative', 'contradiction-finder', 'memo-drafter'],
    outputProductIds: ['situation-brief', 'options-memo', 'board-brief'],
    sourceTags: ['grounded_search', 'media', 'narrative', 'disinformation', 'cyber'],
    missingInfoPrompts: ['Which narrative or platform is in scope?', 'What language or geography should be watched?', 'What response or memo is needed?'],
  },
  {
    id: 'crisis-ops',
    label: 'Crisis & operations',
    shortLabel: 'Crisis/ops',
    description: 'Fast-moving incidents, decisions, handovers, daily briefs, and operational next actions.',
    domainId: 'armed-conflict-security',
    policyPathIds: ['crisis-management', 'program-delivery', 'research-direction'],
    templateIds: ['crisis-brief', 'decision-clock', 'program-delivery'],
    toolIds: ['ask-praxis', 'grounded-research', 'scenario-projector', 'commitment-tracker'],
    outputProductIds: ['situation-brief', 'agent-handover', 'options-memo'],
    sourceTags: ['crisis', 'ops', 'timeline', 'handover', 'brief'],
    missingInfoPrompts: ['What changed since the last update?', 'What deadline or decision window is live?', 'Who needs the handover?'],
  },
  {
    id: 'research-strategy',
    label: 'Research & strategy',
    shortLabel: 'Research',
    description: 'Reusable team knowledge, evidence quality, strategic options, board language, and agent handover.',
    domainId: 'generic',
    policyPathIds: ['research-direction', 'strategy-operations', 'generic-policy'],
    templateIds: ['director-handover', 'board-brief', 'agent-handover'],
    toolIds: ['ask-praxis', 'sourceability', 'contradiction-finder', 'memo-drafter'],
    outputProductIds: ['board-brief', 'agent-handover', 'options-memo'],
    sourceTags: ['research', 'strategy', 'quality', 'handover', 'memo'],
    missingInfoPrompts: ['What should be reusable by the team?', 'Which assumptions need red-team review?', 'What output should this capsule produce first?'],
  },
];

export function normalizeCapsuleTaxonomyTags(
  tags: string[] | null | undefined,
  context: {
    type?: CapsuleStarterCategory | CapsuleTypeFacetId | string | null;
    domain?: string | null;
    policyTeamIds?: string[] | null;
  } = {},
): string[] {
  const cleanTags = uniqueStrings(tags);
  const normalized = [...cleanTags];
  const type = context.type?.trim();
  const domain = context.domain?.trim();
  const teamIds = context.policyTeamIds ?? [];
  if (type) normalized.push(`type:${type}`);
  if (domain) normalized.push(`domain:${domain}`);
  for (const teamId of teamIds) {
    if (teamId.trim()) normalized.push(`team:${teamId.trim()}`);
  }
  return uniqueStrings(normalized);
}

export function resolveCapsuleTaxonomy(input: CapsuleTaxonomyInput): CapsuleResolvedTaxonomy {
  const starter = resolveStarterForTaxonomy(input);
  const tags = uniqueStrings([
    ...(input.tags ?? []),
    ...(input.community?.tags ?? []),
    ...(input.starterSnapshot?.tags ?? []),
    ...(starter?.tags ?? []),
  ]);
  const rawStarterSnapshot: unknown = input.starterSnapshot;
  const snapshotRecord = isPlainObject(rawStarterSnapshot) ? rawStarterSnapshot : null;
  const snapshotCoreRefs = isPlainObject(snapshotRecord?.coreRefs)
    ? snapshotRecord.coreRefs as CapsuleCoreRefsLike
    : null;
  const coreRefs = input.coreRefs ?? starter?.coreRefs ?? snapshotCoreRefs ?? {};
  const typeFacets = new Map<string, CapsuleTaxonomyFacet>();
  const domainFacets = new Map<string, CapsuleTaxonomyFacet>();
  const teamFacets = new Map<string, CapsuleTaxonomyFacet>();

  const addType = (value: string | null | undefined, source: CapsuleTaxonomyFacetSource) => {
    if (!value) return;
    const clean = value.trim().toLowerCase();
    if (!clean) return;
    if (isCapsuleStarterCategory(clean)) {
      typeFacets.set(clean, {
        id: clean,
        label: capsuleTypeLabel(clean),
        tag: `type:${clean}`,
        source,
      });
      return;
    }
    const repairState = clean === 'custom' ? 'custom' : 'unknown';
    typeFacets.set(`${repairState}:${clean}`, {
      id: repairState,
      value: clean,
      label: repairState === 'custom' ? 'Custom' : `Unknown type: ${clean}`,
      tag: `type:${clean}`,
      source: 'repair',
      repairState,
    });
  };
  const addDomain = (value: string | null | undefined, source: CapsuleTaxonomyFacetSource) => {
    if (!value) return;
    const clean = value.trim().toLowerCase();
    if (!clean) return;
    domainFacets.set(clean, {
      id: clean,
      label: capsuleDomainFacetLabel(clean),
      tag: `domain:${clean}`,
      source,
    });
  };
  const addTeam = (value: string | null | undefined, source: CapsuleTaxonomyFacetSource) => {
    if (!value) return;
    const clean = value.trim().toLowerCase();
    if (!clean) return;
    const team = getPolicyTeamCategory(clean);
    teamFacets.set(clean, {
      id: clean,
      label: team?.shortLabel ?? clean.replaceAll('-', ' '),
      tag: `team:${clean}`,
      source: team ? source : 'repair',
      repairState: team ? undefined : 'unknown',
    });
    if (team) addDomain(team.domainId, 'policy-team');
  };

  addType(input.category ?? starter?.category ?? input.starterSnapshot?.category, starter ? 'starter' : 'starter-snapshot');
  addDomain(input.domain ?? starter?.domain ?? input.starterSnapshot?.domain, starter ? 'starter' : 'starter-snapshot');
  if (!typeFacets.size) {
    if (input.scope === 'user') addType('user', 'scope');
    if (input.scope === 'situation' || input.scope === 'team') addType('situation', 'scope');
  }
  if ((coreRefs.toolCoreIds?.length ?? 0) > 0) addType('tool', 'core-ref');
  if (((coreRefs.outputCoreIds?.length ?? 0) + (coreRefs.productCoreIds?.length ?? 0)) > 0) addType('output', 'core-ref');
  if ((coreRefs.situationCoreId || coreRefs.pathCoreId) && !typeFacets.has('situation')) addType('situation', 'core-ref');
  if (coreRefs.userCoreId && !typeFacets.has('user')) addType('user', 'core-ref');

  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('type:')) addType(lower.slice(5), 'prefixed-tag');
    else if (lower.startsWith('domain:')) addDomain(lower.slice(7), 'prefixed-tag');
    else if (lower.startsWith('team:')) addTeam(lower.slice(5), 'prefixed-tag');
    else {
      if (isCapsuleStarterCategory(lower)) addType(lower, 'legacy-tag');
      if (starterDomainValues.has(lower)) addDomain(lower, 'legacy-tag');
    }
  }

  for (const team of policyTeamCategoriesForTags(tags)) {
    addTeam(team.id, 'legacy-tag');
  }
  if (starter) {
    for (const team of policyTeamCategoriesForStarter(starter)) addTeam(team.id, 'starter');
  }

  if (!typeFacets.size) addType('custom', 'repair');
  if (!domainFacets.size) addDomain('custom', 'repair');

  const tools = uniqueStrings([
    ...(coreRefs.toolCoreIds ?? []),
    ...(input.recommendedToolIds ?? []),
    ...(starter?.recommendedToolIds ?? []),
    ...(input.starterSnapshot?.recommendedToolIds ?? []),
  ]);
  const outputs = uniqueStrings([
    ...(coreRefs.outputCoreIds ?? []),
    ...(coreRefs.productCoreIds ?? []),
    ...(input.outputProductIds ?? []),
    ...(starter?.outputProductIds ?? []),
    ...(input.starterSnapshot?.outputProductIds ?? []),
  ]);

  return {
    types: Array.from(typeFacets.values()),
    domains: Array.from(domainFacets.values()),
    policyTeams: Array.from(teamFacets.values()),
    tools,
    outputs,
  };
}

export function buildCapsuleTaxonomyStats(capsules: CapsuleTaxonomyStatsInput[]): CapsuleTaxonomyStats {
  const typeCounts = new Map<string, CapsuleTaxonomyStatItem>();
  const domainCounts = new Map<string, CapsuleTaxonomyStatItem>();
  const teamCounts = new Map<string, CapsuleTaxonomyStatItem>();
  const toolCounts = new Map<string, CapsuleTaxonomyStatItem>();
  const outputCounts = new Map<string, CapsuleTaxonomyStatItem>();
  const repairCounts = new Map<string, CapsuleTaxonomyRepairStat>();
  let archivedCapsules = 0;
  let sourceReferences = 0;
  let documentReferences = 0;

  const addFacet = (
    map: Map<string, CapsuleTaxonomyStatItem>,
    facet: CapsuleTaxonomyFacet,
  ) => {
    const key = facet.repairState ? `${facet.repairState}:${facet.value ?? facet.id}` : facet.id;
    const current = map.get(key);
    map.set(key, {
      id: facet.id,
      label: facet.label,
      tag: facet.tag,
      repairState: facet.repairState,
      value: facet.value,
      count: (current?.count ?? 0) + 1,
    });
  };
  const addId = (map: Map<string, CapsuleTaxonomyStatItem>, id: string, label = id.replaceAll('-', ' ')) => {
    const clean = id.trim();
    if (!clean) return;
    const current = map.get(clean);
    map.set(clean, {
      id: clean,
      label,
      count: (current?.count ?? 0) + 1,
    });
  };
  const addRepair = (axis: CapsuleTaxonomyAxisId, facet: CapsuleTaxonomyFacet) => {
    if (!facet.repairState) return;
    const key = `${axis}:${facet.repairState}:${facet.value ?? facet.id}`;
    const current = repairCounts.get(key);
    repairCounts.set(key, {
      axis,
      id: facet.value ?? facet.id,
      label: facet.label,
      tag: facet.tag,
      repairState: facet.repairState,
      value: facet.value,
      count: (current?.count ?? 0) + 1,
    });
  };

  for (const capsule of capsules) {
    const taxonomy = resolveCapsuleTaxonomy(capsule);
    const isArchived = Boolean(capsule.archivedAt);
    if (isArchived) archivedCapsules += 1;
    sourceReferences += capsule.coreRefs?.sourceCoreIds?.length ?? 0;
    documentReferences += capsule.coreRefs?.documentCoreIds?.length ?? 0;

    if (isArchived) continue;

    for (const facet of taxonomy.types) {
      addFacet(typeCounts, facet);
      addRepair('types', facet);
    }
    for (const facet of taxonomy.domains) {
      addFacet(domainCounts, facet);
      addRepair('domains', facet);
    }
    for (const facet of taxonomy.policyTeams) {
      addFacet(teamCounts, facet);
      addRepair('policy-teams', facet);
    }
    for (const toolId of taxonomy.tools) addId(toolCounts, toolId);
    for (const outputId of taxonomy.outputs) addId(outputCounts, outputId);
  }

  return {
    totalCapsules: capsules.length,
    visibleCapsules: capsules.length - archivedCapsules,
    archivedCapsules,
    sourceReferences,
    documentReferences,
    types: sortStatItems(typeCounts),
    domains: sortStatItems(domainCounts),
    policyTeams: sortStatItems(teamCounts),
    thinkingDevices: sortStatItems(toolCounts),
    artifacts: sortStatItems(outputCounts),
    repairStates: sortStatItems(repairCounts) as CapsuleTaxonomyRepairStat[],
  };
}

export const CAPSULE_OUTPUT_PRODUCTS: CapsuleOutputProduct[] = [
  {
    id: 'options-memo',
    label: 'Options memo',
    description: 'A sourced decision memo with choices, tradeoffs, risks, and recommendation posture.',
    bestFor: ['generic-policy', 'foreign-policy', 'public-sector-policy', 'regulatory-public-affairs', 'public-affairs', 'strategy-operations', 'climate-development'],
  },
  {
    id: 'situation-brief',
    label: 'Situation brief',
    description: 'A compact update on what changed, why it matters, and what decisions are now live.',
    bestFor: ['foreign-policy', 'crisis-management', 'program-delivery', 'humanitarian-analysis'],
  },
  {
    id: 'actor-power-map',
    label: 'Actor and power map',
    description: 'A structured map of actors, approvers, blockers, incentives, claims, and influence.',
    bestFor: ['conflict-resolution', 'mediator-peace-process', 'defence-capture', 'security-defence', 'public-affairs'],
  },
  {
    id: 'board-brief',
    label: 'Board brief',
    description: 'Executive-facing synthesis with context, risks, options, and requested decision.',
    bestFor: ['strategy-operations', 'defence-capture', 'research-direction'],
  },
  {
    id: 'compliance-note',
    label: 'Compliance note',
    description: 'Rule/specification check with source receipts, exposure, gaps, and sign-off posture.',
    bestFor: ['legal-compliance', 'economic-sanctions', 'hr-policy', 'regulatory-public-affairs', 'public-affairs'],
  },
  {
    id: 'agent-handover',
    label: 'Agent handover',
    description: 'Allowed actions, prohibited actions, escalation rules, source scope, and output goals.',
    bestFor: ['generic-policy', 'research-direction', 'crisis-management', 'program-delivery'],
  },
  {
    id: 'allegation-matrix',
    label: 'Allegation matrix',
    description: 'Rights allegations with legal thresholds, source reliability, chain-of-custody notes, and evidence gaps.',
    bestFor: ['human-rights-accountability', 'legal-compliance'],
  },
  {
    id: 'information-environment-brief',
    label: 'Information environment brief',
    description: 'Narratives, media/source posture, disinformation risk, cyber posture, and response options.',
    bestFor: ['information-cyber', 'public-affairs', 'foreign-policy'],
  },
];

export function getPolicyTeamCategory(id: string | null | undefined): PolicyTeamCategory | null {
  if (!id) return null;
  return POLICY_TEAM_CATEGORIES.find((category) => category.id === id) ?? null;
}

export function categoryTagsForPolicyTeam(category: PolicyTeamCategory): string[] {
  return normalizeCapsuleTaxonomyTags(
    [category.id, ...category.policyPathIds, ...category.sourceTags],
    { domain: category.domainId, policyTeamIds: [category.id] },
  );
}

export function policyTeamCategoryForTags(tags: string[] | null | undefined): PolicyTeamCategory | null {
  return policyTeamCategoriesForTags(tags)[0] ?? null;
}

function policyTeamCategoriesForTags(tags: string[] | null | undefined): PolicyTeamCategory[] {
  const normalized = new Set((tags ?? []).map((tag) => tag.toLowerCase()));
  return POLICY_TEAM_CATEGORIES.filter((category) =>
    normalized.has(category.id) ||
    normalized.has(`team:${category.id}`) ||
    normalized.has(`domain:${category.domainId}`) ||
    category.sourceTags.some((tag) => normalized.has(tag)) ||
    category.policyPathIds.some((pathId) => normalized.has(pathId)),
  );
}

function policyTeamCategoriesForStarter(starter: CapsuleStarterDefinition): PolicyTeamCategory[] {
  const tags = [
    ...starter.tags,
    starter.domain,
    starter.coreRefs.pathCoreId ?? '',
    ...(starter.coreRefs.sourceCoreIds ?? []),
    ...(starter.recommendedToolIds ?? []),
    ...(starter.outputProductIds ?? []),
  ];
  const tagMatches = policyTeamCategoriesForTags(tags);
  const directMatches = POLICY_TEAM_CATEGORIES.filter((category) =>
    category.policyPathIds.includes(starter.coreRefs.pathCoreId as PolicyPathId) ||
    category.toolIds.some((toolId) => starter.recommendedToolIds.includes(toolId)) ||
    category.outputProductIds.some((outputId) => starter.outputProductIds.includes(outputId)),
  );
  return uniquePolicyTeams([...tagMatches, ...directMatches]);
}

function uniquePolicyTeams(values: PolicyTeamCategory[]): PolicyTeamCategory[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value.id)) return false;
    seen.add(value.id);
    return true;
  });
}

function resolveStarterForTaxonomy(input: CapsuleTaxonomyInput): CapsuleStarterDefinition | null {
  if (isStarterDefinition(input)) return input;
  return getCapsuleStarterDefinition(input.starterId ?? input.capsuleId ?? input.starterSnapshot?.starterId);
}

function isStarterDefinition(value: CapsuleTaxonomyInput): value is CapsuleStarterDefinition {
  return typeof value.starterId === 'string' &&
    typeof value.category === 'string' &&
    typeof value.domain === 'string' &&
    Array.isArray(value.recommendedToolIds) &&
    Array.isArray(value.outputProductIds);
}

function isCapsuleStarterCategory(value: string): value is CapsuleStarterCategory {
  return value === 'user' || value === 'situation' || value === 'tool' || value === 'output';
}

function capsuleTypeLabel(value: CapsuleStarterCategory): string {
  return value === 'tool' ? 'Thinking device' : value === 'output' ? 'Artifact' : `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`;
}

function capsuleDomainFacetLabel(value: string): string {
  return getPolicyTeamCategory(value)?.shortLabel ??
    POLICY_TEAM_CATEGORIES.find((category) => category.domainId === value)?.shortLabel ??
    value.replaceAll('-', ' ');
}

const starterDomainValues = new Set<string>([
  'sustainability',
  'finance',
  'hr',
  'diplomacy',
  'humanitarian-rights',
  'ai-governance',
  'public-health',
  'critical-minerals',
  'cyber-resilience',
  'migration-displacement',
  'election-integrity',
  'source-intake',
  'exposure-mapping',
  'policy-review',
  'options-mapping',
  'audit-review',
  'analyst-role',
  'output-brief',
]);

export const CAPSULE_CONNECTOR_REGISTRY: CapsuleConnectorDefinition[] = [
  {
    id: 'upload',
    label: 'Upload',
    icon: 'upload',
    status: 'live',
    description: 'Attach PDFs, DOCX, text, Markdown, and HTML originals to the active capsule repository.',
    requiredScopes: ['firebase-auth:user'],
    allowedActions: ['upload-original', 'store-original'],
    fillsSlots: ['document', 'source'],
    riskLevel: 'low',
  },
  {
    id: 'grounded-search',
    label: 'Grounded search',
    icon: 'search',
    status: 'live',
    description: 'Collect current source receipts from grounded search without making them canonical until attached.',
    requiredScopes: ['google-search-grounding'],
    allowedActions: ['search-grounded', 'import-selected'],
    fillsSlots: ['source', 'connector'],
    riskLevel: 'medium',
  },
  {
    id: 'google-drive',
    label: 'Google Drive',
    icon: 'drive',
    status: 'planned-readonly',
    description: 'Import selected Docs, PDFs, Slides, and Sheets exports into a capsule repository.',
    requiredScopes: ['https://www.googleapis.com/auth/drive.readonly'],
    allowedActions: ['import-selected', 'store-original'],
    fillsSlots: ['document', 'source', 'connector'],
    riskLevel: 'medium',
  },
  {
    id: 'gmail',
    label: 'Gmail',
    icon: 'mail',
    status: 'planned-readonly',
    description: 'Import selected threads or newsletters as source receipts. Outbound send is out of scope.',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    allowedActions: ['read-thread', 'import-selected'],
    fillsSlots: ['source', 'connector', 'memory'],
    riskLevel: 'high',
  },
  {
    id: 'cloud-storage',
    label: 'Cloud Storage',
    icon: 'bucket',
    status: 'live',
    description: 'Durable home for uploaded originals, generated exports, and ingestion artifacts.',
    requiredScopes: ['firebase-storage:user-owned-objects'],
    allowedActions: ['store-original', 'store-export'],
    fillsSlots: ['document', 'output'],
    riskLevel: 'low',
    advancedOnly: true,
  },
  {
    id: 'vertex-gemini-rag',
    label: 'Vertex/Gemini RAG',
    icon: 'spark',
    status: 'advanced-planned',
    description: 'Optional advanced retrieval mirror for eligible files; local hybrid retrieval remains the default.',
    requiredScopes: ['vertex-ai:rag-corpora', 'vertex-ai:vector-search'],
    allowedActions: ['retrieve', 'mirror-to-rag'],
    fillsSlots: ['document', 'source', 'tool'],
    riskLevel: 'medium',
    advancedOnly: true,
  },
];

export function getCapsuleConnector(id: string | null | undefined): CapsuleConnectorDefinition | null {
  if (!id) return null;
  return CAPSULE_CONNECTOR_REGISTRY.find((connector) => connector.id === id) ?? null;
}

export function resolveCapsuleRetrievalBackend(
  requested: CapsuleRetrievalBackend | null | undefined,
  options: { vertexConfigured?: boolean } = {},
): CapsuleRetrievalBackend {
  if (!requested || requested === 'local-hybrid') return 'local-hybrid';
  return options.vertexConfigured ? requested : 'local-hybrid';
}

export function normalizeCapsuleRepositoryMetadata(input: Partial<CapsuleRepositoryMetadata> & {
  capsuleId: string;
  ownerId: string;
}): CapsuleRepositoryMetadata {
  const documentIds = uniqueStrings(input.documentIds);
  const sourceReceiptIds = uniqueStrings(input.sourceReceiptIds);
  const chunkCount = Math.max(0, Math.floor(input.chunkCount ?? 0));
  const freshness = input.freshness ??
    (documentIds.length === 0 ? 'needs-documents' : sourceReceiptIds.length === 0 ? 'needs-sources' : 'fresh');
  return {
    capsuleId: input.capsuleId,
    ownerId: input.ownerId,
    storageBucket: input.storageBucket ?? null,
    storageObjectRefs: uniqueStrings(input.storageObjectRefs),
    documentIds,
    sourceReceiptIds,
    chunkCount,
    embeddingStatus: input.embeddingStatus ?? (chunkCount > 0 ? 'queued' : 'not-started'),
    retrievalBackend: input.retrievalBackend ?? 'local-hybrid',
    freshness,
    lastIngestionRunId: input.lastIngestionRunId ?? null,
    updatedAt: input.updatedAt ?? new Date(0).toISOString(),
  };
}

export function normalizeCapsuleRepositoryContract(input: {
  metadata: Partial<CapsuleRepositoryMetadata> & { capsuleId: string; ownerId: string };
  documentRefs?: Partial<CapsuleRepositoryDocumentRef>[];
  sourceRefs?: Partial<CapsuleRepositorySourceRef>[];
  spanRefs?: Partial<CapsuleRepositorySpanRef>[];
  outputHistoryIds?: string[];
  evaluationIds?: string[];
  memoryIds?: string[];
}): CapsuleRepositoryContract {
  const metadata = normalizeCapsuleRepositoryMetadata(input.metadata);
  const documentRefs = (input.documentRefs ?? [])
    .filter((document): document is Partial<CapsuleRepositoryDocumentRef> & { documentId: string } => Boolean(document.documentId?.trim()))
    .map((document) => ({
      documentId: document.documentId.trim(),
      title: document.title?.trim() || document.documentId.trim(),
      storageObjectRef: document.storageObjectRef?.trim() || null,
      sourceReceiptIds: uniqueStrings(document.sourceReceiptIds),
      chunkCount: Math.max(0, Math.floor(document.chunkCount ?? 0)),
      pageRefs: uniqueStrings(document.pageRefs),
      paragraphRefs: uniqueStrings(document.paragraphRefs),
      embeddingStatus: document.embeddingStatus ?? metadata.embeddingStatus,
      retrievalBackend: document.retrievalBackend ?? metadata.retrievalBackend,
      freshness: document.freshness ?? metadata.freshness,
    }));
  const sourceRefs = (input.sourceRefs ?? [])
    .filter((source): source is Partial<CapsuleRepositorySourceRef> & { sourceReceiptId: string } => Boolean(source.sourceReceiptId?.trim()))
    .map((source) => ({
      sourceReceiptId: source.sourceReceiptId.trim(),
      label: source.label?.trim() || source.sourceReceiptId.trim(),
      uri: source.uri?.trim() || null,
      tags: uniqueStrings(source.tags),
      reliabilityNote: source.reliabilityNote?.trim() || null,
      citationGaps: uniqueStrings(source.citationGaps),
      attachedDocumentIds: uniqueStrings(source.attachedDocumentIds),
    }));
  const spanRefs = (input.spanRefs ?? [])
    .filter((span): span is Partial<CapsuleRepositorySpanRef> & { spanId: string; documentId: string } => Boolean(span.spanId?.trim() && span.documentId?.trim()))
    .map((span) => ({
      spanId: span.spanId.trim(),
      documentId: span.documentId.trim(),
      chunkId: span.chunkId?.trim() || null,
      pageRef: span.pageRef?.trim() || null,
      paragraphRef: span.paragraphRef?.trim() || null,
      sourceReceiptId: span.sourceReceiptId?.trim() || null,
    }));

  return {
    metadata: {
      ...metadata,
      documentIds: uniqueStrings([...metadata.documentIds, ...documentRefs.map((document) => document.documentId)]),
      sourceReceiptIds: uniqueStrings([...metadata.sourceReceiptIds, ...sourceRefs.map((source) => source.sourceReceiptId)]),
      storageObjectRefs: uniqueStrings([
        ...metadata.storageObjectRefs,
        ...documentRefs.map((document) => document.storageObjectRef ?? ''),
      ]),
      chunkCount: Math.max(metadata.chunkCount, documentRefs.reduce((total, document) => total + document.chunkCount, 0)),
    },
    documentRefs,
    sourceRefs,
    spanRefs,
    outputHistoryIds: uniqueStrings(input.outputHistoryIds),
    evaluationIds: uniqueStrings(input.evaluationIds),
    memoryIds: uniqueStrings(input.memoryIds),
  };
}

export function createCapsuleIngestionReceipt(input: Omit<Partial<CapsuleIngestionReceipt>, 'receiptId' | 'sourceConnectorId'> & {
  capsuleId: string;
  ownerId: string;
  sourceConnectorId: CapsuleConnectorId;
  originalUri: string;
}): CapsuleIngestionReceipt {
  const connector = getCapsuleConnector(input.sourceConnectorId);
  const safeUri = input.originalUri.trim();
  return {
    receiptId: `ingest:${input.capsuleId}:${input.sourceConnectorId}:${stableReceiptPart(safeUri)}`,
    capsuleId: input.capsuleId,
    ownerId: input.ownerId,
    sourceConnectorId: input.sourceConnectorId,
    originalUri: safeUri,
    storedObjectPath: input.storedObjectPath ?? null,
    parserStatus: input.parserStatus ?? (connector?.allowedActions.includes('import-selected') || connector?.fillsSlots.includes('document') ? 'queued' : 'not-applicable'),
    documentId: input.documentId ?? null,
    sourceReceiptId: input.sourceReceiptId ?? null,
    chunkCount: Math.max(0, Math.floor(input.chunkCount ?? 0)),
    embeddingStatus: input.embeddingStatus ?? 'queued',
    attachedAt: input.attachedAt ?? new Date(0).toISOString(),
    retrievalBackend: input.retrievalBackend ?? 'local-hybrid',
  };
}

export const CAPSULE_CONNECTOR_IDEAS: CapsuleConnectorIdea[] = [
  {
    id: 'library-upload',
    label: 'Library uploads',
    kind: 'document',
    posture: 'live-now',
    description: 'PDF, DOCX, TXT, MD, HTML, and source receipts attached to active capsules.',
  },
  {
    id: 'grounded-search',
    label: 'Grounded web search',
    kind: 'source',
    posture: 'live-now',
    description: 'Search-backed source discovery for policy, sourceability, and memo work.',
  },
  {
    id: 'mcp-gateway',
    label: 'Private MCP gateway',
    kind: 'mcp',
    posture: 'candidate',
    description: 'Read-first tool/resource surface for PRAXIS capabilities and external agents.',
  },
  {
    id: 'calendar-monitor',
    label: 'Calendar and deadline monitor',
    kind: 'calendar',
    posture: 'candidate',
    description: 'Decision windows, public calendars, review deadlines, and scheduled brief triggers.',
  },
  {
    id: 'email-digest',
    label: 'Email digest input',
    kind: 'communication',
    posture: 'deferred',
    description: 'Inbound newsletters or stakeholder updates, always approval-gated for outbound sends.',
  },
  {
    id: 'browser-session',
    label: 'Browser session fallback',
    kind: 'source',
    posture: 'deferred',
    description: 'Read-only browser-use plus Steel.dev lane for pages that cannot be reached through APIs.',
  },
];

function uniqueStrings(values: string[] | null | undefined): string[] {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
}

function sortStatItems<T extends CapsuleTaxonomyStatItem>(items: Map<string, T>): T[] {
  return Array.from(items.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function stableReceiptPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'source';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export const CAPSULE_COMBINATION_RECIPES: CapsuleCombinationRecipe[] = [
  {
    id: 'hr-legal-rollout',
    label: 'HR policy + legal review -> rollout recommendation',
    inputs: ['hr-policy-review', 'sanctions-compliance'],
    output: 'Policy rollout note with rule coverage, affected groups, and approval path.',
    mergeRules: ['preserve both rule sets', 'flag contradictions', 'keep source receipts attached'],
  },
  {
    id: 'defence-stakeholder-capture',
    label: 'Defence opportunity + board brief -> capture strategy',
    inputs: ['defence-opportunity', 'board-brief'],
    output: 'Capture brief with requirements, power map, decision window, and executive ask.',
    mergeRules: ['align timelines', 'deduplicate actors', 'retain approval blockers'],
  },
  {
    id: 'conflict-humanitarian-ops',
    label: 'Conflict capsule + crisis brief -> operations brief',
    inputs: ['conflict-analysis', 'crisis-brief'],
    output: 'Operations brief with episodes, access constraints, source gaps, and risk posture.',
    mergeRules: ['keep contested claims visible', 'merge actor aliases', 'do not auto-promote graph facts'],
  },
  {
    id: 'regulatory-market-board',
    label: 'Regulatory watch + board brief -> board memo',
    inputs: ['regulatory-watch', 'board-brief'],
    output: 'Board memo with what changed, affected stakeholders, options, and recommendation.',
    mergeRules: ['separate fact from judgment', 'preserve effective dates', 'surface source freshness'],
  },
  {
    id: 'director-crisis-handover',
    label: 'Director handover + crisis brief -> executive handover',
    inputs: ['director-handover', 'crisis-brief'],
    output: 'Executive handover packet with open questions, allowed actions, and escalation rules.',
    mergeRules: ['keep decisions and open questions separate', 'preserve handover caveats', 'require approval for external actions'],
  },
  {
    id: 'temporal-friction-decision',
    label: 'Temporal map + human friction -> decision clock',
    inputs: ['temporal-causal-map', 'human-friction-map'],
    output: 'Decision-window brief with trigger events, blockers, incentives, stale assumptions, and next review gates.',
    mergeRules: ['separate sequence from causality', 'preserve named blockers and incentives', 'flag assumptions that expire before the next decision'],
  },
];

export const CAPSULE_CAPABILITY_AREAS = [
  {
    label: 'Sourceability',
    detail: 'Claims, receipts, citations, weak evidence, unsupported gaps.',
  },
  {
    label: 'Temporality',
    detail: 'Episodes, what changed, stale assumptions, decision windows.',
  },
  {
    label: 'Causality',
    detail: 'Trigger events, causal claims, lag effects, indicators, and alternative explanations.',
  },
  {
    label: 'Power Dynamics',
    detail: 'Actors, approvers, blockers, incentives, conflict or office friction.',
  },
  {
    label: 'Human Friction',
    detail: 'Informal authority, fear, fatigue, implementation resistance, and office or coalition blockers.',
  },
  {
    label: 'Analysis',
    detail: 'ACH, scenarios, contradiction checks, stakeholder reads.',
  },
  {
    label: 'Writing',
    detail: 'Memos, briefs, talking points, board notes, handover packs.',
  },
  {
    label: 'Governance',
    detail: 'Human gates, review receipts, export posture, agent handover rules.',
  },
];

export function contextCapsuleLoginHref(
  prompt: string,
  templateId?: string,
  pathId?: string,
  outputGoal?: string,
): string {
  const params = new URLSearchParams({
    mode: 'signup',
    redirect: '/app?panel=ask',
  });
  if (prompt.trim()) params.set('capsulePrompt', prompt.trim());
  if (templateId) params.set('capsuleTemplate', templateId);
  if (pathId) params.set('capsulePath', pathId);
  if (outputGoal?.trim()) params.set('capsuleOutput', outputGoal.trim());
  return `/login?${params.toString()}`;
}
