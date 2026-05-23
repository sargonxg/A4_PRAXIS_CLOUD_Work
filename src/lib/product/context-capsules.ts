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

export interface CapsuleStarterRichProfile {
  purpose: string;
  userJob: string;
  whenToUse: string[];
  whenNotToUse: string[];
  improves: string[];
  sourceIndications: string[];
  evidenceRequirements: string[];
  riskCaveats: string[];
  decisionPrompts: string[];
  nextIdeas: string[];
  qualityRubric: string[];
  agentInstructions: string;
}

export interface CapsuleStarterDeviceProfile {
  deviceKind: string;
  reasoningOperation: string;
  activationCriteria: string[];
  inputContract: string[];
  outputGrammar: string[];
  methodSteps: string[];
  bestInputs: string[];
  expectedOutputs: string[];
  disconfirmingChecks: string[];
  failureModes: string[];
  humanReviewGate: string;
  confidencePolicy: string;
  forgettingPolicy: string;
  crossCapsulePairings: string[];
  misuseWarnings: string[];
  reviewGateType: string;
  agentInstructions: string;
  sourceabilityRequirements: string[];
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
  richProfile: CapsuleStarterRichProfile;
  deviceProfile?: CapsuleStarterDeviceProfile;
  humanReview?: CapsuleStarterHumanReview;
  inspectionSections: CapsuleStarterInspectionSection[];
  combinesWellWith: string[];
}

export interface CapsuleStarterHumanReview {
  status: 'human-reviewed' | 'research-reviewed' | 'draft';
  label: string;
  tooltip: string;
  reviewedBy: string;
  reviewedAt: string;
  notes: string;
  scope: string;
  authorOrPublisher: string;
  jurisdiction: string;
  assumptions: string[];
  limitations: string[];
  sourcePackSummary: string;
  humanReviewGate: string;
}

export interface CapsuleQualityAuditScores {
  taxonomy: number;
  sourceability: number;
  expertMethod: number;
  agentUsability: number;
  reviewGate: number;
  contentDepth: number;
}

export interface CapsuleQualityAuditResult {
  starterId: string;
  label: string;
  category: CapsuleStarterCategory;
  scores: CapsuleQualityAuditScores;
  findings: string[];
  sourceGaps: string[];
  agentInstructionGaps: string[];
  deviceProfileGaps: string[];
  signals: Array<'rating_separate_from_quality' | 'review_gated_improvements_only' | 'firestore_canonical'>;
}

export type CapsuleImprovementProposalTarget =
  | 'tags'
  | 'sourcePack'
  | 'richProfile.agentInstructions'
  | 'deviceProfile.failureModes'
  | 'deviceProfile.sourceabilityRequirements'
  | 'agentWorkflow.approvalNotes'
  | 'suggestedNextActions';

export interface CapsuleImprovementProposal {
  proposalId: string;
  starterId: string;
  target: CapsuleImprovementProposalTarget;
  rationale: string;
  evidenceSourceIds: string[];
  riskLevel: 'low' | 'medium' | 'high';
  reviewStatus: 'proposed' | 'accepted' | 'rejected';
  generatedBy: 'quality-audit' | 'cognee' | 'agent' | string;
}

export const CAPSULE_STARTER_CATALOG_VERSION = '2026-05-22-real-work-capsules-v9';
const CAPSULE_NO_AFFILIATION_LIMITATION = 'PRAXIS is not affiliated with, endorsed by, or speaking for any organization named in this capsule, its sources, or its examples.';

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
  | 'richProfile'
  | 'deviceProfile'
  | 'humanReview'
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
  | 'richProfile'
  | 'deviceProfile'
  | 'humanReview'
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
  const richProfile = overrides?.richProfile ?? buildStarterRichProfile({
    starterId,
    category,
    domain,
    label,
    summary,
    detail,
    sourcePack,
    recommendedToolIds,
    outputProductIds,
  });
  const deviceProfile = overrides?.deviceProfile ?? (
    category === 'tool' && tags.includes('thinking-device')
      ? buildStarterDeviceProfile(label)
      : undefined
  );
  const humanReview = overrides?.humanReview ?? humanReviewed(
    `Human gate applied to ${label}: source posture, AI guardrails, domain limits, and approval triggers must stay visible before external use.`,
    'PRAXIS expert capsule governance',
    {
      scope: `Reusable ${category} capsule for ${domain.replace(/-/g, ' ')} work.`,
      sourcePackSummary: sourcePack.map((source) => source.label).slice(0, 3).join('; '),
      humanReviewGate: 'Human review required before external publication, legal or financial reliance, canonical graph promotion, or high-stakes operational use.',
    },
  );
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
      `Route ${label} through ${recommendedToolIds[0] ?? 'Ask PRAXIS'} and record the review result.`,
    ],
    agentWorkflow: overrides?.agentWorkflow ?? {
      preferredAgentId: category === 'output' ? 'output-formatter' : 'research-memo',
      routeHint: category === 'tool' ? 'tool-router' : 'capsule-supervisor',
      outputGoal: outputProductIds[0] ?? 'options-memo',
      approvalNotes: 'Require approval before external export, graph mutation, or connector writes.',
    },
    aiUseGuidance,
    richProfile,
    ...(deviceProfile ? { deviceProfile } : {}),
    ...(humanReview ? { humanReview } : {}),
    inspectionSections: [
      { label: 'Purpose', detail: richProfile.purpose },
      { label: 'Sources', detail: richProfile.sourceIndications.slice(0, 3).join(' ') },
      ...(humanReview ? [
        { label: 'Human review', detail: `${humanReview.notes} ${humanReview.tooltip}` },
      ] : []),
      ...(deviceProfile ? [
        { label: 'Tools/Thinking Devices', detail: `${deviceProfile.deviceKind}: ${deviceProfile.methodSteps.slice(0, 4).join(' ')}` },
        { label: 'Device Policy', detail: `${deviceProfile.reasoningOperation}: ${deviceProfile.activationCriteria.slice(0, 2).join(' ')}` },
        { label: 'Review Gates', detail: deviceProfile.humanReviewGate },
      ] : []),
      { label: 'Decision Use', detail: richProfile.decisionPrompts.slice(0, 2).join(' ') },
      { label: 'Improvement Ideas', detail: richProfile.nextIdeas.slice(0, 2).join(' ') },
      { label: 'Gaps/Risks', detail: richProfile.riskCaveats.slice(0, 2).join(' ') },
      { label: 'Run Recipe', detail: richProfile.agentInstructions },
      { label: 'Compatible Capsules', detail: combinesWellWith.length ? combinesWellWith.join(', ') : 'Attach a user capsule, a tool capsule, and an output capsule before external handoff.' },
    ],
  };
}

function humanReviewed(
  notes: string,
  reviewedBy = 'PRAXIS policy capsule review',
  metadata: Partial<Pick<CapsuleStarterHumanReview,
    'scope'
    | 'authorOrPublisher'
    | 'jurisdiction'
    | 'assumptions'
    | 'limitations'
    | 'sourcePackSummary'
    | 'humanReviewGate'
  >> = {},
): CapsuleStarterHumanReview {
  const baseLimitations = metadata.limitations ?? [
    'Does not provide legal, financial, medical, or operational advice.',
    'Requires source refresh before external publication or high-stakes use.',
  ];
  return {
    status: 'human-reviewed',
    label: 'Human reviewed',
    tooltip: 'Human reviewed: PRAXIS policy reviewers checked the capsule purpose, source posture, AI guardrails, and review limits. Refresh sources before external use.',
    reviewedBy,
    reviewedAt: CAPSULE_STARTER_CATALOG_VERSION,
    notes,
    scope: metadata.scope ?? 'Reusable starter capsule operating context.',
    authorOrPublisher: metadata.authorOrPublisher ?? reviewedBy,
    jurisdiction: metadata.jurisdiction ?? 'Cross-jurisdictional / review before local use',
    assumptions: metadata.assumptions ?? [
      'Starter sources are a baseline, not a complete or current record.',
      'User-provided sources and local facts can override starter defaults after review.',
    ],
    limitations: uniqueStrings([...baseLimitations, CAPSULE_NO_AFFILIATION_LIMITATION]),
    sourcePackSummary: metadata.sourcePackSummary ?? 'Starter source pack provides initial source lanes and must be refreshed before external use.',
    humanReviewGate: metadata.humanReviewGate ?? 'Human review required before external export, canonical promotion, or high-stakes reliance.',
  };
}

function buildStarterRichProfile(input: {
  starterId: string;
  category: CapsuleStarterCategory;
  domain: CapsuleStarterDomain;
  label: string;
  summary: string;
  detail: string;
  sourcePack: CapsuleStarterSource[];
  recommendedToolIds: string[];
  outputProductIds: string[];
}): CapsuleStarterRichProfile {
  const {
    category,
    domain,
    label,
    summary,
    detail,
    sourcePack,
    recommendedToolIds,
    outputProductIds,
  } = input;
  const domainLabel = domain.replace(/-/g, ' ');
  const primaryTool = recommendedToolIds[0] ?? 'ask-praxis';
  const secondaryTool = recommendedToolIds[1] ?? primaryTool;
  const primaryOutput = outputProductIds[0] ?? 'options-memo';
  const firstSource = sourcePack[0]?.label ?? `${label} source pack`;
  const secondSource = sourcePack[1]?.label ?? `${label} corroborating source`;
  const categoryPurpose: Record<CapsuleStarterCategory, string> = {
    situation: `Use ${label} to frame the policy situation, actors, operating constraints, uncertainty, and decision horizon for ${domainLabel} work.`,
    tool: `Use ${label} as a repeatable analytical check that converts capsule inputs into reviewable findings before PRAXIS drafts ${primaryOutput}.`,
    output: `Use ${label} to shape the audience, sections, citation posture, approval gate, and handoff quality for ${primaryOutput}.`,
    user: `Use ${label} to encode the user's mandate, tone, red lines, evidentiary threshold, and preferred PRAXIS outputs.`,
  };
  const categoryJob: Record<CapsuleStarterCategory, string> = {
    situation: `Help a human expert doing real work understand what is happening in ${domainLabel}, what changed, who can act, and which decision should be made next.`,
    tool: `Help a human expert doing real work run ${primaryTool} or ${secondaryTool} against a known capsule instead of relying on unstructured reasoning.`,
    output: `Help a human expert doing real work turn grounded context into a finished ${primaryOutput} with enough structure for review and reuse.`,
    user: `Help PRAXIS adapt answers to a human expert's role-specific operating style while keeping evidence standards and boundaries explicit.`,
  };
  const categoryUse: Record<CapsuleStarterCategory, string[]> = {
    situation: [
      `Use when a human expert's real work needs reusable context, approved claims, disputed claims, stale assumptions, advisory memory, and forbidden-use boundaries.`,
      `Use when a ${domainLabel} question needs actor mapping, facts, dates, and source limits before advice.`,
      `Use when the user needs PRAXIS to compare plausible options or escalation paths for ${label}.`,
      `Use when a brief, dashboard, or memo should inherit this situation context across turns.`,
    ],
    tool: [
      `Use when a human expert's workday needs a named reasoning device with review-card outputs before a final answer.`,
      `Use when ${label} should perform a defined check before drafting or recommendation.`,
      `Use when inputs are available but claims, assumptions, chronology, or sourceability need review.`,
      `Use when PRAXIS should produce an auditable intermediate finding with ${primaryTool}.`,
    ],
    output: [
      `Use when a human expert needs an artifact style that preserves real work caveats, approvals, and handover instructions.`,
      `Use when the target artifact is ${primaryOutput} and the audience needs a clean decision product.`,
      `Use when sections, citations, assumptions, and approval notes should be stable across drafts.`,
      `Use when handoff quality matters more than open-ended exploration.`,
    ],
    user: [
      `Use when the capsule should represent a real human expert's mandate, tolerance for uncertainty, and review style.`,
      `Use when PRAXIS should answer as ${label} rather than as a generic assistant.`,
      `Use when tone, mandate, red lines, or evidentiary thresholds should persist across work.`,
      `Use when routing decisions should reflect the user's preferred outputs and review style.`,
    ],
  };
  const categoryAvoid: Record<CapsuleStarterCategory, string[]> = {
    situation: [
      `Do not use ${label} as a final authority when recent events or jurisdiction-specific rules are missing.`,
      `Do not use it alone for external publication without source refresh and human approval.`,
    ],
    tool: [
      `Do not run ${label} when the needed inputs are absent or the user is asking for a finished output directly.`,
      `Do not treat the check as dispositive without review of weak evidence and counterexamples.`,
    ],
    output: [
      `Do not use ${label} when the user still needs discovery, intake, or source collection first.`,
      `Do not export the artifact until citations, caveats, and approval notes have been checked.`,
    ],
    user: [
      `Do not let ${label} override explicit user instructions in the current turn.`,
      `Do not use role style to soften legal, safety, or evidentiary caveats.`,
    ],
  };
  return {
    purpose: `${categoryPurpose[category]} ${summary}`,
    userJob: categoryJob[category],
    whenToUse: categoryUse[category],
    whenNotToUse: categoryAvoid[category],
    improves: [
      `${label} improves real work handover by telling agents what a human expert has approved, disputed, marked stale, kept advisory, or forbidden.`,
      `${label} improves retrieval by anchoring ${domainLabel} work to named sources, tools, and outputs instead of generic chat context.`,
      `${label} improves reviewability by carrying explicit evidence needs, caveats, and approval posture into Ask PRAXIS.`,
      `${label} improves reuse by making ${primaryOutput} and ${primaryTool} routing available to future turns and combined capsules.`,
    ],
    sourceIndications: [
      `${firstSource} is the first baseline to refresh for ${label}.`,
      `${secondSource} should be used to corroborate or challenge the first baseline.`,
      `Treat the source pack as indications for ${domainLabel}, not as a complete bibliography.`,
    ],
    evidenceRequirements: [
      `Separate approved, disputed, stale, advisory, and forbidden claims in ${label} before generating or reusing an answer.`,
      `Attach at least one current source that directly supports the main claim or recommendation in ${label}.`,
      `Record dates, jurisdiction, actor names, and confidence limits before using ${label} for ${primaryOutput}.`,
      `Flag unsupported claims and route them through ${primaryTool} or sourceability review before handoff.`,
      `Treat Cognee recall, graph proposal rows, model mappings, and SQL projections as advisory until a review-card apply step is complete.`,
    ],
    riskCaveats: [
      CAPSULE_NO_AFFILIATION_LIMITATION,
      `${label} can become stale if the source pack is not refreshed before time-sensitive decisions.`,
      `${label} may hide contested assumptions unless PRAXIS asks for counterevidence and dissenting actor incentives.`,
      `${label} should not let Cognee memory, graph proposals, or SQL projections mutate canonical state without human review.`,
    ],
    decisionPrompts: [
      `What decision does ${label} support, and what would change that decision?`,
      `Which actors, constraints, or mandates matter most for ${label} right now?`,
      `Which claim in ${label} is weakest, newest, or most dependent on a single source?`,
    ],
    nextIdeas: [
      `Create review cards for Cognee recall hits, graph proposals, SQL projection candidates, stale evidence, and disputed claims in ${label}.`,
      `Run ${primaryTool} on ${label} and save the finding as a capsule note.`,
      `Attach a fresh source or document that tests the strongest assumption in ${label}.`,
      `Pair ${label} with ${primaryOutput} so the next PRAXIS response has a concrete handoff target.`,
    ],
    qualityRubric: [
      `Specificity: names the relevant ${domainLabel} actors, claims, and decision horizon.`,
      `Sourceability: every material claim can be traced to a source, document, or explicit uncertainty note.`,
      `Actionability: the next PRAXIS step, tool route, and output target are clear.`,
      `Review posture: risks, caveats, and approval gates are visible before export.`,
    ],
    agentInstructions: `When ${label} is active, treat it as real work context created for a human expert. Start by restating its purpose in one line, separate approved, disputed, stale, advisory, and forbidden claims, inspect ${firstSource} and ${secondSource}, run ${primaryTool}${secondaryTool !== primaryTool ? ` or ${secondaryTool}` : ''} for gaps, keep Cognee recall, graph rows, and SQL projections advisory until review-card apply metadata exists, produce ${primaryOutput}, and stop for approval before external export or connector writes. Context detail: ${detail}`,
  };
}

function buildStarterDeviceProfile(
  label: string,
  overrides: Partial<CapsuleStarterDeviceProfile> = {},
): CapsuleStarterDeviceProfile {
  const deviceKind = overrides.deviceKind ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  return {
    deviceKind,
    reasoningOperation: overrides.reasoningOperation ?? 'audit and structure a decision-relevant reasoning step',
    activationCriteria: overrides.activationCriteria ?? [
      'Attach when the answer contains a decision, claim, explanation, persuasion task, or review-sensitive recommendation.',
      'Attach when context quality is uneven and the agent needs a named intellectual operation instead of generic analysis.',
    ],
    inputContract: overrides.inputContract ?? [
      'Active situation capsule or user-provided problem statement with scope and dates.',
      'At least one source, document, or explicit note that the claim is unsourced.',
      'Target output or decision owner so the device can produce usable structure.',
    ],
    outputGrammar: overrides.outputGrammar ?? [
      'Start with the reasoning operation and the question being tested.',
      'Use rows or sections for claims, evidence, caveats, disconfirming checks, and next actions.',
      'End with confidence, review gate, and what must be refreshed before reuse.',
    ],
    methodSteps: overrides.methodSteps ?? [
      `Name the decision or claim that ${label} is testing before producing advice.`,
      `Separate facts, assumptions, uncertainties, actors, rules, and output needs into distinct rows.`,
      `Run the device against the active situation capsule, then test it against at least one compatible output capsule.`,
      `Mark unsupported claims, stale evidence, inferred incentives, and points requiring human judgment.`,
    ],
    bestInputs: overrides.bestInputs ?? [
      'A situation capsule with dates, actors, and source receipts.',
      'A user or team capsule that states the decision owner and tolerance for uncertainty.',
      'A target output capsule so the device produces a usable artifact instead of open-ended analysis.',
    ],
    expectedOutputs: overrides.expectedOutputs ?? [
      `${label} table with claims, evidence, caveats, and next actions.`,
      'Review notes that identify which conclusions can be reused and which must stay provisional.',
    ],
    disconfirmingChecks: overrides.disconfirmingChecks ?? [
      'Name the strongest contrary evidence, alternative framing, or missing source that would weaken the output.',
      'Identify which conclusion would change if a load-bearing assumption fails.',
    ],
    failureModes: overrides.failureModes ?? [
      'Treating the device as a conclusion generator rather than a review scaffold.',
      'Collapsing unsupported assumptions, actor incentives, and sourced facts into the same confidence level.',
    ],
    humanReviewGate: overrides.humanReviewGate ?? 'Human review is required before relying on the device for external advice, graph promotion, or final output approval.',
    confidencePolicy: overrides.confidencePolicy ?? 'Use low, moderate, or high confidence only after evidence quality, freshness, alternatives, and disconfirming checks are visible.',
    forgettingPolicy: overrides.forgettingPolicy ?? 'Expire or demote device conclusions when sources become stale, the situation changes, or the output is reused outside the reviewed scope; revalidate before promotion.',
    crossCapsulePairings: overrides.crossCapsulePairings ?? [
      'starter-tool-sourceability-matrix',
      'starter-output-principals-decision-memo',
    ],
    misuseWarnings: overrides.misuseWarnings ?? [
      'Do not use this device to launder speculation into a confident recommendation.',
      'Do not skip the sourceability or human-review gate when the output affects real decisions.',
    ],
    reviewGateType: overrides.reviewGateType ?? 'sourceability-human-judgment',
    agentInstructions: overrides.agentInstructions ?? `Use ${label} as an intellectual device. Apply the method steps explicitly, cite the active sources, show failure modes, and stop at the human review gate before finalizing.`,
    sourceabilityRequirements: overrides.sourceabilityRequirements ?? [
      'Every decision-critical claim must point to a source receipt, attached document, or explicit uncertainty note.',
      'Each inferred incentive, causal link, or implementation risk must be labeled as inference until reviewed.',
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

const REASONING_DEVICE_SOURCE_REFERENCES: Record<string, CapsuleStarterSource> = {
  toulmin: { id: 'purdue-toulmin-argument', label: 'Purdue OWL Toulmin argument method', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/historical_perspectives_on_argumentation/toulmin_argument.html', sourceType: 'public-library', relevance: 'Claim, grounds, warrant, backing, qualifier, and rebuttal structure for inspectable arguments.', publisher: 'Purdue OWL', date: '2026', reliabilityTier: 2 },
  stasis: { id: 'purdue-stasis-theory', label: 'Purdue OWL stasis theory guide', url: 'https://owl.purdue.edu/owl/general_writing/the_writing_process/stasis_theory/index.html', sourceType: 'public-library', relevance: 'Fact, definition, quality, and policy questions for locating disagreement before drafting.', publisher: 'Purdue OWL', date: '2026', reliabilityTier: 2 },
  rhetoric: { id: 'purdue-rhetorical-situation', label: 'Purdue OWL rhetorical situation guide', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/rhetorical_situation/aristotles_rhetorical_situation.html', sourceType: 'public-library', relevance: 'Logos, ethos, pathos, telos, and kairos as audience-sensitive rhetorical structure.', publisher: 'Purdue OWL', date: '2026', reliabilityTier: 2 },
  fallacies: { id: 'purdue-rhetorical-strategies-fallacies', label: 'Purdue OWL rhetorical strategies and fallacies', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/establishing_arguments/rhetorical_strategies.html', sourceType: 'public-library', relevance: 'Reasoning, credibility, audience appeal, and common fallacy checks for persuasive outputs.', publisher: 'Purdue OWL', date: '2026', reliabilityTier: 2 },
  abduction: { id: 'sep-abduction', label: 'Stanford Encyclopedia of Philosophy abduction entry', url: 'https://plato.stanford.edu/archives/spr2024/entries/abduction/', sourceType: 'public-library', relevance: 'Inference-to-best-explanation cautions, candidate explanations, and bad-lot risk.', publisher: 'Stanford Encyclopedia of Philosophy', date: '2024', reliabilityTier: 2 },
  hermeneutics: { id: 'sep-hermeneutics', label: 'Stanford Encyclopedia of Philosophy hermeneutics entry', url: 'https://plato.stanford.edu/entries/hermeneutics/', sourceType: 'public-library', relevance: 'Whole-part interpretation, historical context, and conflicting interpretations as method inputs.', publisher: 'Stanford Encyclopedia of Philosophy', date: '2026', reliabilityTier: 2 },
  equilibrium: { id: 'sep-reflective-equilibrium', label: 'Stanford Encyclopedia of Philosophy reflective equilibrium entry', url: 'https://plato.stanford.edu/archives/spr2014/entries/reflective-equilibrium/', sourceType: 'public-library', relevance: 'Coherence testing among judgments, principles, and background theories.', publisher: 'Stanford Encyclopedia of Philosophy', date: '2014', reliabilityTier: 2 },
  wicked: { id: 'rittel-webber-wicked-problems', label: 'Rittel-Webber wicked problems planning tradition', url: 'https://journals.sagepub.com/doi/10.1177/0095399720934010', sourceType: 'public-library', relevance: 'Policy problem framing where definitions, values, and consequences remain contested.', publisher: 'Administration & Society', date: '2020', reliabilityTier: 2 },
  aiRisk: { id: 'nist-ai-rmf', label: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', sourceType: 'official', relevance: 'Govern, map, measure, and manage pattern for AI risk and review-gated use.', publisher: 'NIST', date: '2023', reliabilityTier: 1 },
  praxis: { id: 'praxis-reasoning-device-method', label: 'PRAXIS reasoning-device method', url: 'https://praxis.tacitus.me/learn#thinking-devices', sourceType: 'public-library', relevance: 'PRAXIS review-gated method for turning abstract reasoning guides into capsule context.', publisher: 'PRAXIS starter catalog', date: CAPSULE_STARTER_CATALOG_VERSION, reliabilityTier: 3 },
};

type ReasoningGuideDeviceSpec = {
  starterId: string;
  label: string;
  domain: CapsuleStarterDomain;
  summary: string;
  detail: string;
  deviceKind: string;
  reasoningOperation: string;
  tags: string[];
  methodSteps: string[];
  outputGrammar: string[];
  disconfirmingChecks: string[];
  expectedOutputs: string[];
  sourceKeys: Array<keyof typeof REASONING_DEVICE_SOURCE_REFERENCES>;
  reviewGateType: string;
};

const REASONING_GUIDE_DEVICE_SPECS: ReasoningGuideDeviceSpec[] = [
  {
    starterId: 'starter-tool-toulmin-argument-scaffold',
    label: 'Toulmin Argument Scaffold',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for turning claims into claim, grounds, warrant, backing, qualifier, and rebuttal structure.',
    detail: 'Use this when PRAXIS must make a recommendation, memo argument, or critique inspectable. It prevents the agent from hiding the warrant that connects evidence to the claim.',
    deviceKind: 'toulmin-argument-scaffold',
    reasoningOperation: 'structure and audit an argument',
    tags: ['toulmin', 'argumentation', 'warrant', 'reasoning-guide'],
    methodSteps: ['Name the claim.', 'List grounds and source status.', 'State the warrant linking grounds to claim.', 'Add backing, qualifier, rebuttal, and review decision.'],
    outputGrammar: ['Claim', 'Grounds', 'Warrant', 'Backing', 'Qualifier', 'Rebuttal', 'Review decision'],
    disconfirmingChecks: ['Could the grounds be true while the claim remains false?', 'Is the warrant accepted by the target audience?'],
    expectedOutputs: ['Toulmin argument table.', 'Rebuttal and qualifier notes for the final memo.'],
    sourceKeys: ['toulmin', 'fallacies'],
    reviewGateType: 'sourceability-human-judgment',
  },
  {
    starterId: 'starter-tool-stasis-question-ladder',
    label: 'Stasis Question Ladder',
    domain: 'options-mapping',
    summary: 'A reasoning-guide capsule for locating whether disagreement is about fact, definition, seriousness, or policy.',
    detail: 'Use this before PRAXIS recommends action in a contested situation. It forces the agent to find where parties have not achieved common ground.',
    deviceKind: 'stasis-question-ladder',
    reasoningOperation: 'locate disagreement before proposing action',
    tags: ['stasis', 'problem-framing', 'debate', 'reasoning-guide'],
    methodSteps: ['Test factual agreement.', 'Test definition and classification.', 'Test seriousness, affected parties, and costs.', 'Only then test policy options.'],
    outputGrammar: ['Fact stasis', 'Definition stasis', 'Quality stasis', 'Policy stasis', 'Unresolved disagreement'],
    disconfirmingChecks: ['Is the proposed solution answering a different problem?', 'Are parties debating policy while fact or definition remains unresolved?'],
    expectedOutputs: ['Stasis ladder with current blockage.', 'Next question needed to move the discussion.'],
    sourceKeys: ['stasis', 'praxis'],
    reviewGateType: 'human-judgment',
  },
  {
    starterId: 'starter-tool-hermeneutic-circle-reader',
    label: 'Hermeneutic Circle Reader',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for interpreting documents, testimony, doctrine, and speeches through whole-part context.',
    detail: 'Use this when a sentence, clause, quote, or concept may be misread without the full text, author context, audience, and competing interpretations.',
    deviceKind: 'hermeneutic-circle-reader',
    reasoningOperation: 'interpret part and whole together',
    tags: ['hermeneutics', 'interpretation', 'documents', 'reasoning-guide'],
    methodSteps: ['Identify the part being interpreted.', 'State the whole text or situation.', 'Compare plausible interpretations.', 'Revise the reading after source and context checks.'],
    outputGrammar: ['Text part', 'Whole context', 'Interpretation A', 'Interpretation B', 'Context evidence', 'Preferred reading with caveat'],
    disconfirmingChecks: ['Does a later or earlier passage change the reading?', 'Would a different audience reasonably read the text differently?'],
    expectedOutputs: ['Interpretation matrix.', 'Caveated reading for memo or source annex.'],
    sourceKeys: ['hermeneutics', 'rhetoric'],
    reviewGateType: 'sourceability-human-judgment',
  },
  {
    starterId: 'starter-tool-reflective-equilibrium-workbench',
    label: 'Reflective Equilibrium Workbench',
    domain: 'policy-review',
    summary: 'A reasoning-guide capsule for testing judgments, principles, and background theories for coherence.',
    detail: 'Use this when PRAXIS faces an ethical, legal, or policy dilemma where a single rule or intuition is not enough.',
    deviceKind: 'reflective-equilibrium-workbench',
    reasoningOperation: 'cohere judgments, principles, and background theories',
    tags: ['reflective-equilibrium', 'ethics', 'coherence', 'reasoning-guide'],
    methodSteps: ['List considered judgments.', 'List governing principles.', 'List relevant background facts or theories.', 'Revise the weakest element until the posture is coherent or blocked.'],
    outputGrammar: ['Judgment', 'Principle', 'Background theory', 'Tension', 'Revision', 'Residual risk'],
    disconfirmingChecks: ['Is coherence being achieved by ignoring an affected group?', 'Does a revised principle create a worse implication elsewhere?'],
    expectedOutputs: ['Equilibrium table.', 'Residual ethical tension note.'],
    sourceKeys: ['equilibrium', 'aiRisk'],
    reviewGateType: 'ethics-human-judgment',
  },
  {
    starterId: 'starter-tool-abductive-explanation-generator',
    label: 'Abductive Explanation Generator',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for generating candidate explanations and selecting a provisional best explanation.',
    detail: 'Use this when the user asks why something happened and PRAXIS must avoid treating the first plausible story as fact.',
    deviceKind: 'abductive-explanation-generator',
    reasoningOperation: 'generate and test candidate explanations',
    tags: ['abduction', 'inference-to-best-explanation', 'hypotheses', 'reasoning-guide'],
    methodSteps: ['State the observation to explain.', 'Generate multiple candidate explanations.', 'Compare fit, simplicity, scope, and source support.', 'Mark the best explanation as provisional with needed tests.'],
    outputGrammar: ['Observation', 'Candidate explanation', 'Evidence fit', 'Competing explanation', 'Test needed', 'Provisional confidence'],
    disconfirmingChecks: ['Is the candidate set too narrow?', 'What observation would favor a rival explanation?'],
    expectedOutputs: ['Candidate explanation table.', 'Collection plan for disconfirmation.'],
    sourceKeys: ['abduction', 'praxis'],
    reviewGateType: 'sourceability-human-judgment',
  },
  {
    starterId: 'starter-tool-argument-scheme-critical-questions',
    label: 'Argument Scheme Critical Questions',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for matching common argument schemes to critical questions before accepting a claim.',
    detail: 'Use this when PRAXIS sees arguments from authority, analogy, consequences, precedent, cause, sign, or expert opinion.',
    deviceKind: 'argument-scheme-critical-questions',
    reasoningOperation: 'classify argument scheme and ask critical questions',
    tags: ['argument-schemes', 'critical-questions', 'fallacies', 'reasoning-guide'],
    methodSteps: ['Classify the argument scheme.', 'Name the scheme-specific critical questions.', 'Answer each question with source status.', 'Block or qualify the claim when a critical answer fails.'],
    outputGrammar: ['Scheme', 'Claim', 'Critical question', 'Answer', 'Source status', 'Accept, qualify, or reject'],
    disconfirmingChecks: ['Is the cited authority expert in this exact domain?', 'Does the analogy preserve the relevant structure?'],
    expectedOutputs: ['Critical-question checklist.', 'Qualified claim language.'],
    sourceKeys: ['fallacies', 'toulmin'],
    reviewGateType: 'sourceability-human-judgment',
  },
  {
    starterId: 'starter-tool-pragma-dialectical-discussion-map',
    label: 'Pragma-Dialectical Discussion Map',
    domain: 'options-mapping',
    summary: 'A reasoning-guide capsule for reconstructing disagreement as confrontation, opening, argumentation, and conclusion stages.',
    detail: 'Use this for debates, stakeholder disputes, and policy conversations where the goal is resolving disagreement rather than winning rhetoric.',
    deviceKind: 'pragma-dialectical-discussion-map',
    reasoningOperation: 'map critical discussion stages',
    tags: ['pragma-dialectics', 'discussion', 'debate-resolution', 'reasoning-guide'],
    methodSteps: ['Name the dispute and standpoints.', 'Identify agreed starting points and rules.', 'Map arguments and criticisms.', 'State whether the dispute is resolved, narrowed, or blocked.'],
    outputGrammar: ['Confrontation', 'Opening commitments', 'Argumentation moves', 'Blocked premises', 'Conclusion status'],
    disconfirmingChecks: ['Are implicit premises being attacked without being stated?', 'Has one party been prevented from raising a relevant challenge?'],
    expectedOutputs: ['Critical discussion map.', 'Remaining disagreement register.'],
    sourceKeys: ['stasis', 'rhetoric'],
    reviewGateType: 'human-judgment',
  },
  {
    starterId: 'starter-tool-audience-adherence-map',
    label: 'Audience Adherence Map',
    domain: 'options-mapping',
    summary: 'A reasoning-guide capsule for mapping audience premises, shared values, objections, and acceptable forms of proof.',
    detail: 'Use this when an output must persuade a real audience without overstating evidence or using manipulative framing.',
    deviceKind: 'audience-adherence-map',
    reasoningOperation: 'adapt argument to audience without weakening truth conditions',
    tags: ['audience', 'new-rhetoric', 'persuasion', 'reasoning-guide'],
    methodSteps: ['Name the audience and decision context.', 'List shared premises and likely objections.', 'Match proof types to audience standards.', 'Draft caveated language that preserves sourceability.'],
    outputGrammar: ['Audience', 'Shared premise', 'Objection', 'Accepted proof', 'Message implication', 'Ethical limit'],
    disconfirmingChecks: ['Is the message optimized for adherence at the expense of truth?', 'Would another legitimate audience reject the premise?'],
    expectedOutputs: ['Audience premise map.', 'Persuasive but caveated message frame.'],
    sourceKeys: ['rhetoric', 'fallacies'],
    reviewGateType: 'ethics-human-judgment',
  },
  {
    starterId: 'starter-tool-ethos-logos-pathos-kairos-lens',
    label: 'Ethos-Logos-Pathos-Kairos Lens',
    domain: 'options-mapping',
    summary: 'A reasoning-guide capsule for balancing credibility, reasoning, audience disposition, purpose, and timing.',
    detail: 'Use this for speeches, public messaging, talking points, advocacy memos, or crisis communication.',
    deviceKind: 'ethos-logos-pathos-kairos-lens',
    reasoningOperation: 'audit rhetorical situation and appeals',
    tags: ['ethos', 'logos', 'pathos', 'kairos', 'reasoning-guide'],
    methodSteps: ['Identify speaker, audience, purpose, and setting.', 'Audit evidence structure.', 'Audit credibility and audience impact.', 'Check timing and emotional appeal for distortion risk.'],
    outputGrammar: ['Speaker credibility', 'Evidence structure', 'Audience disposition', 'Purpose', 'Timing', 'Risk of distortion'],
    disconfirmingChecks: ['Does emotional force distract from the real issue?', 'Does the speaker lack standing for the claim?'],
    expectedOutputs: ['Rhetorical situation table.', 'Revised message with ethical limits.'],
    sourceKeys: ['rhetoric', 'fallacies'],
    reviewGateType: 'ethics-human-judgment',
  },
  {
    starterId: 'starter-tool-wicked-problem-boundary-map',
    label: 'Wicked Problem Boundary Map',
    domain: 'policy-review',
    summary: 'A reasoning-guide capsule for spotting value-laden, unstable, stakeholder-contested policy problems.',
    detail: 'Use this when a question looks like a technical puzzle but actually has contested definitions, values, and consequences.',
    deviceKind: 'wicked-problem-boundary-map',
    reasoningOperation: 'separate tame problem solving from wicked problem coping',
    tags: ['wicked-problems', 'policy', 'stakeholders', 'reasoning-guide'],
    methodSteps: ['Test whether goals and definitions are stable.', 'Map stakeholder value conflicts.', 'Identify irreversible or second-order consequences.', 'Propose adaptive next steps rather than final solution claims.'],
    outputGrammar: ['Problem definition', 'Stakeholder value conflict', 'Uncertainty', 'Consequence risk', 'Adaptive move'],
    disconfirmingChecks: ['Is PRAXIS pretending consensus exists?', 'Would the proposed solution create a new problem definition?'],
    expectedOutputs: ['Wickedness boundary map.', 'Adaptive action and monitoring note.'],
    sourceKeys: ['wicked', 'stasis'],
    reviewGateType: 'human-judgment',
  },
  {
    starterId: 'starter-tool-conceptual-distinction-builder',
    label: 'Conceptual Distinction Builder',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for separating terms that are being blurred in analysis or debate.',
    detail: 'Use this when PRAXIS must distinguish legality from legitimacy, risk from uncertainty, cause from correlation, position from interest, or evidence from interpretation.',
    deviceKind: 'conceptual-distinction-builder',
    reasoningOperation: 'separate conflated concepts',
    tags: ['conceptual-analysis', 'distinctions', 'definition', 'reasoning-guide'],
    methodSteps: ['Name the conflated terms.', 'Define each term with source or working definition.', 'Show what follows under each meaning.', 'Rewrite claims so each term does only its proper work.'],
    outputGrammar: ['Term', 'Definition', 'Not the same as', 'Evidence needed', 'Implication'],
    disconfirmingChecks: ['Would the conclusion survive if the terms were separated?', 'Is a value claim being smuggled in as a definition?'],
    expectedOutputs: ['Distinction table.', 'Cleaned claim language.'],
    sourceKeys: ['stasis', 'hermeneutics'],
    reviewGateType: 'human-judgment',
  },
  {
    starterId: 'starter-tool-category-error-detector',
    label: 'Category Error Detector',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for detecting when the analysis treats one kind of thing as another.',
    detail: 'Use this when PRAXIS may be treating a plan as proof, a forecast as fact, a legal rule as political feasibility, or a moral claim as empirical evidence.',
    deviceKind: 'category-error-detector',
    reasoningOperation: 'detect category mistakes before conclusion',
    tags: ['category-error', 'logic', 'audit', 'reasoning-guide'],
    methodSteps: ['Name the object being reasoned about.', 'Classify its category.', 'Identify the category it is being mistaken for.', 'Rewrite the inference or block the claim.'],
    outputGrammar: ['Object', 'Actual category', 'Mistaken category', 'Invalid inference', 'Repair'],
    disconfirmingChecks: ['Is a statement doing work it cannot do?', 'Is evidence from one category being used to settle another?'],
    expectedOutputs: ['Category-error table.', 'Repaired inference note.'],
    sourceKeys: ['fallacies', 'praxis'],
    reviewGateType: 'human-judgment',
  },
  {
    starterId: 'starter-tool-burden-of-proof-allocator',
    label: 'Burden-of-Proof Allocator',
    domain: 'policy-review',
    summary: 'A reasoning-guide capsule for naming who must prove what, to what standard, and with which evidence.',
    detail: 'Use this for allegations, compliance reviews, debate, risk claims, and policy decisions where unsupported assertions could be unfairly accepted.',
    deviceKind: 'burden-of-proof-allocator',
    reasoningOperation: 'allocate proof burdens and evidence thresholds',
    tags: ['burden-of-proof', 'evidence', 'allegations', 'reasoning-guide'],
    methodSteps: ['List each claim or allegation.', 'Name claimant and affected party.', 'Set evidence threshold and source type.', 'Block claims that do not meet the required standard.'],
    outputGrammar: ['Claim', 'Claimant', 'Affected party', 'Evidence threshold', 'Current evidence', 'Allowed wording'],
    disconfirmingChecks: ['Is the burden shifted to the wrong party?', 'Is absence of evidence being treated as evidence of absence?'],
    expectedOutputs: ['Proof-burden ledger.', 'Permitted claim language.'],
    sourceKeys: ['toulmin', 'aiRisk'],
    reviewGateType: 'legal-sourceability-human',
  },
  {
    starterId: 'starter-tool-steelman-ironman-red-team-triad',
    label: 'Steelman / Ironman / Red-Team Triad',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for strengthening opposing views, improving the preferred argument, and then attacking it.',
    detail: 'Use this before a recommendation hardens. It prevents shallow opposition summaries and weak self-critique.',
    deviceKind: 'steelman-ironman-red-team-triad',
    reasoningOperation: 'strengthen and attack arguments before final judgment',
    tags: ['steelman', 'red-team', 'argument-quality', 'reasoning-guide'],
    methodSteps: ['Steelman the strongest opposing view.', 'Ironman the best version of the preferred view.', 'Red-team both versions.', 'State what survives and what must be qualified.'],
    outputGrammar: ['Opposing view steelman', 'Preferred view ironman', 'Red-team attack', 'Surviving claim', 'Qualification'],
    disconfirmingChecks: ['Was the opposing view caricatured?', 'Did the red team test the strongest version or only the easiest target?'],
    expectedOutputs: ['Triad review table.', 'Revised recommendation caveats.'],
    sourceKeys: ['toulmin', 'fallacies'],
    reviewGateType: 'human-judgment',
  },
  {
    starterId: 'starter-tool-narrative-frame-audit',
    label: 'Narrative Frame Audit',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for exposing protagonist, antagonist, causal arc, implied values, omissions, and emotional load.',
    detail: 'Use this for public narratives, crisis communications, media analysis, and advocacy material where frame choices shape conclusions.',
    deviceKind: 'narrative-frame-audit',
    reasoningOperation: 'audit narrative structure and omitted alternatives',
    tags: ['narrative', 'framing', 'rhetoric', 'reasoning-guide'],
    methodSteps: ['Identify actors assigned narrative roles.', 'Name causal arc and implied values.', 'List omitted actors or facts.', 'Rewrite with caveats or alternate frames.'],
    outputGrammar: ['Protagonist', 'Antagonist', 'Causal arc', 'Implied value', 'Omission', 'Alternate frame'],
    disconfirmingChecks: ['Does the narrative make causality feel stronger than evidence supports?', 'Who disappears from the frame?'],
    expectedOutputs: ['Narrative frame ledger.', 'Balanced framing note.'],
    sourceKeys: ['rhetoric', 'hermeneutics'],
    reviewGateType: 'ethics-human-judgment',
  },
  {
    starterId: 'starter-tool-moral-tradeoff-matrix',
    label: 'Moral Tradeoff Matrix',
    domain: 'policy-review',
    summary: 'A reasoning-guide capsule for separating utility, rights, duties, virtues, care, legitimacy, and reversibility.',
    detail: 'Use this when a policy option has ethical consequences that cannot be reduced to efficiency or operational feasibility.',
    deviceKind: 'moral-tradeoff-matrix',
    reasoningOperation: 'map ethical tradeoffs across moral lenses',
    tags: ['ethics', 'tradeoffs', 'legitimacy', 'reasoning-guide'],
    methodSteps: ['Name affected groups.', 'Assess utility, rights, duties, care, legitimacy, and reversibility.', 'Identify non-negotiable constraints.', 'State residual moral risk.'],
    outputGrammar: ['Affected group', 'Benefit', 'Burden', 'Rights/duties', 'Legitimacy', 'Reversibility', 'Residual risk'],
    disconfirmingChecks: ['Is one affected group invisible?', 'Is a rights constraint being treated as a mere cost?'],
    expectedOutputs: ['Moral tradeoff matrix.', 'Residual moral risk note.'],
    sourceKeys: ['equilibrium', 'aiRisk'],
    reviewGateType: 'ethics-human-judgment',
  },
  {
    starterId: 'starter-tool-institutional-logic-lens',
    label: 'Institutional Logic Lens',
    domain: 'policy-review',
    summary: 'A reasoning-guide capsule for separating legal mandate, bureaucratic incentive, political legitimacy, public trust, and operational capacity.',
    detail: 'Use this when an institution can legally act but may lack legitimacy, capacity, incentives, or trust.',
    deviceKind: 'institutional-logic-lens',
    reasoningOperation: 'separate institutional authority, incentives, and capacity',
    tags: ['institutions', 'mandate', 'legitimacy', 'capacity', 'reasoning-guide'],
    methodSteps: ['Name the institution and mandate.', 'Map incentives and constraints.', 'Assess legitimacy and trust.', 'Test operational capacity and implementation owner.'],
    outputGrammar: ['Mandate', 'Incentive', 'Constraint', 'Legitimacy', 'Capacity', 'Implementation risk'],
    disconfirmingChecks: ['Is legal authority being mistaken for implementation capacity?', 'Does incentive structure point away from the public rationale?'],
    expectedOutputs: ['Institutional logic table.', 'Implementation caution note.'],
    sourceKeys: ['wicked', 'aiRisk'],
    reviewGateType: 'legal-human-judgment',
  },
  {
    starterId: 'starter-tool-epistemic-trust-ledger',
    label: 'Epistemic Trust Ledger',
    domain: 'source-intake',
    summary: 'A reasoning-guide capsule for tracking source reliability, access, incentives, expertise, freshness, independence, and corroboration.',
    detail: 'Use this before PRAXIS relies on sources with different incentives, proximity, or expertise. It upgrades sourceability from citation presence to trust posture.',
    deviceKind: 'epistemic-trust-ledger',
    reasoningOperation: 'evaluate source trust and corroboration',
    tags: ['epistemic-trust', 'sourceability', 'corroboration', 'reasoning-guide'],
    methodSteps: ['List each source and claim supported.', 'Assess expertise, proximity, incentives, independence, and freshness.', 'Check corroboration and contradiction.', 'Set allowed confidence and reuse rules.'],
    outputGrammar: ['Source', 'Claim supported', 'Expertise', 'Incentive', 'Freshness', 'Corroboration', 'Allowed use'],
    disconfirmingChecks: ['Are independent sources actually downstream from one source?', 'Does source incentive weaken claim weight?'],
    expectedOutputs: ['Epistemic trust ledger.', 'Source reuse and refresh note.'],
    sourceKeys: ['aiRisk', 'praxis'],
    reviewGateType: 'sourceability-human-judgment',
  },
  {
    starterId: 'starter-tool-analogy-fitness-test',
    label: 'Analogy Fitness Test',
    domain: 'audit-review',
    summary: 'A reasoning-guide capsule for deciding whether an analogy is structurally useful or rhetorically misleading.',
    detail: 'Use this when historical, legal, geopolitical, or product analogies are shaping an argument or decision.',
    deviceKind: 'analogy-fitness-test',
    reasoningOperation: 'test analogy structure and limits',
    tags: ['analogy', 'comparison', 'history', 'reasoning-guide'],
    methodSteps: ['State source and target case.', 'Map shared structure.', 'Map critical differences.', 'Decide what the analogy can and cannot support.'],
    outputGrammar: ['Source case', 'Target case', 'Shared structure', 'Critical difference', 'Supported inference', 'Blocked inference'],
    disconfirmingChecks: ['Are superficial similarities doing causal work?', 'Does a critical difference invalidate the policy lesson?'],
    expectedOutputs: ['Analogy fitness table.', 'Allowed and blocked analogy language.'],
    sourceKeys: ['fallacies', 'stasis'],
    reviewGateType: 'sourceability-human-judgment',
  },
  {
    starterId: 'starter-tool-decision-rhetoric-converter',
    label: 'Decision Rhetoric Converter',
    domain: 'options-mapping',
    summary: 'A reasoning-guide capsule for converting analysis into persuasive decision language while preserving caveats.',
    detail: 'Use this after analysis is complete but before the final memo or talking points. It prevents polished language from erasing uncertainty.',
    deviceKind: 'decision-rhetoric-converter',
    reasoningOperation: 'translate analysis into decision language with caveats intact',
    tags: ['decision-rhetoric', 'memo-writing', 'persuasion', 'reasoning-guide'],
    methodSteps: ['Name the decision and audience.', 'Extract only decision-relevant claims.', 'Preserve caveats and confidence policy.', 'Convert into BLUF, options, recommendation, and review notes.'],
    outputGrammar: ['BLUF', 'Decision question', 'Options', 'Recommendation', 'Caveat', 'Review gate'],
    disconfirmingChecks: ['Did persuasive compression remove a material caveat?', 'Does the recommendation imply certainty the evidence does not support?'],
    expectedOutputs: ['Decision-ready language draft.', 'Caveat preservation checklist.'],
    sourceKeys: ['rhetoric', 'toulmin'],
    reviewGateType: 'sourceability-human-judgment',
  },
];

function buildReasoningGuideSourcePack(sourceKeys: ReasoningGuideDeviceSpec['sourceKeys']): CapsuleStarterSource[] {
  return normalizeStarterSourcePack(uniqueStrings([...sourceKeys, 'praxis']).map((sourceKey) => REASONING_DEVICE_SOURCE_REFERENCES[sourceKey]));
}

function reasoningGuideStarter(spec: ReasoningGuideDeviceSpec): CapsuleStarterDefinition {
  const sourcePack = buildReasoningGuideSourcePack(spec.sourceKeys);
  return starter(
    spec.starterId,
    'tool',
    spec.domain,
    spec.label,
    spec.summary,
    spec.detail,
    [...spec.tags, 'thinking-device', 'reasoning-guide', 'review-gated', 'team:research-strategy'],
    {
      toolCoreIds: ['sourceability', 'contradiction-finder', 'memo-drafter'],
      objectiveCoreIds: [`apply-${spec.deviceKind}`],
      outputCoreIds: ['principals-decision-memo', 'evidence-sourceability-annex'],
    },
    ['sourceability', 'contradiction-finder', 'memo-drafter'],
    ['principals-decision-memo', 'evidence-sourceability-annex'],
    ['starter-output-principals-decision-memo', 'starter-tool-sourceability-matrix', 'starter-output-evidence-sourceability-annex'],
    {
      readinessStars: 5,
      sourcePack,
      suggestedQuestions: [
        `What claim, decision, interpretation, or message should ${spec.label} structure?`,
        'Which sources, assumptions, or audience premises are doing the most work?',
        'What would disconfirm, weaken, or force qualification of the output?',
      ],
      suggestedNextActions: [
        `Run ${spec.label} before drafting the final answer.`,
        'Attach sourceability and confidence notes to every decision-critical claim.',
        'Send unresolved caveats to human review before external reuse.',
      ],
      agentWorkflow: {
        preferredAgentId: 'research-memo',
        routeHint: spec.deviceKind,
        outputGoal: 'principals-decision-memo',
        approvalNotes: 'Human review required before external use, graph promotion, or confidence escalation from this reasoning device.',
      },
      aiUseGuidance: `Use ${spec.label} as a reasoning guide capsule. Apply the output grammar explicitly, preserve caveats, and keep sourceability visible before drafting persuasive or decision-ready language.`,
      deviceProfile: buildStarterDeviceProfile(spec.label, {
        deviceKind: spec.deviceKind,
        reasoningOperation: spec.reasoningOperation,
        activationCriteria: [
          `Attach when the user needs to ${spec.reasoningOperation}.`,
          'Attach when abstract reasoning, argument quality, persuasion, or philosophical framing affects the answer.',
        ],
        inputContract: [
          'Active situation, question, draft claim, or message to be structured.',
          'Available source receipts, attached documents, or explicit gaps.',
          'Target audience, decision owner, or output capsule for the result.',
        ],
        outputGrammar: spec.outputGrammar,
        methodSteps: spec.methodSteps,
        expectedOutputs: spec.expectedOutputs,
        disconfirmingChecks: spec.disconfirmingChecks,
        confidencePolicy: 'Do not raise confidence because the frame is elegant; confidence follows source quality, alternatives, disconfirming checks, and review status.',
        forgettingPolicy: 'Demote or expire conclusions when the audience, decision, source window, or problem definition changes; revalidate before reuse in another capsule.',
        crossCapsulePairings: ['starter-tool-sourceability-matrix', 'starter-output-principals-decision-memo', 'starter-output-evidence-sourceability-annex'],
        misuseWarnings: [
          'Do not use the framework as decorative terminology without completing its checks.',
          'Do not let persuasive structure hide uncertainty, missing evidence, or value conflict.',
        ],
        reviewGateType: spec.reviewGateType,
        humanReviewGate: 'Human review is required before using this reasoning device for external advice, sensitive claims, final persuasion, or graph promotion.',
        sourceabilityRequirements: [
          'Each material claim must point to a source receipt, document, or explicit uncertainty note.',
          'Each philosophical, rhetorical, or ethical judgment must state whether it is sourced, inferred, or a PRAXIS working frame.',
        ],
      }),
      humanReview: humanReviewed(`Reviewed as a reasoning-guide capsule for ${spec.reasoningOperation}.`),
    },
  );
}

interface RealWorkCapsuleSpec {
  starterId: string;
  category: CapsuleStarterCategory;
  domain: CapsuleStarterDomain;
  label: string;
  summary: string;
  detail: string;
  tags: string[];
  sourcePack: CapsuleStarterSource[];
  recommendedToolIds: string[];
  outputProductIds: string[];
  combinesWellWith: string[];
  userJob: string;
  realWorkUse: string;
  decisionFocus: string;
  draftingStyle: string;
  pathCoreId?: PolicyPathId;
  deviceKind?: string;
  reasoningOperation?: string;
  readinessStars?: CapsuleStarterDefinition['readinessStars'];
}

function realWorkSource(
  id: string,
  label: string,
  url: string,
  sourceType: CapsuleStarterSource['sourceType'],
  publisher: string,
  date: string,
  relevance: string,
  reliabilityTier: CapsuleStarterSource['reliabilityTier'] = 1,
): CapsuleStarterSource {
  return { id, label, url, sourceType, publisher, date, relevance, reliabilityTier };
}

function defaultPathForRealWork(domain: CapsuleStarterDomain): PolicyPathId {
  switch (domain) {
    case 'finance':
    case 'critical-minerals':
    case 'exposure-mapping':
      return 'economic-sanctions';
    case 'humanitarian-rights':
    case 'migration-displacement':
      return 'humanitarian-analysis';
    case 'public-health':
      return 'crisis-management';
    case 'cyber-resilience':
    case 'election-integrity':
      return 'information-cyber';
    case 'sustainability':
      return 'climate-development';
    case 'policy-review':
    case 'options-mapping':
    case 'audit-review':
      return 'public-sector-policy';
    case 'output-brief':
      return 'generic-policy';
    case 'analyst-role':
      return 'research-direction';
    case 'diplomacy':
      return 'foreign-policy';
    case 'hr':
      return 'hr-policy';
    case 'ai-governance':
      return 'legal-compliance';
    case 'source-intake':
    default:
      return 'generic-policy';
  }
}

function objectiveIdForRealWork(starterId: string): string {
  return starterId.replace(/^starter-(situation|tool|output|user)-/, '');
}

function realWorkCoreRefs(spec: RealWorkCapsuleSpec): CapsuleCoreRefsLike {
  const sourceCoreIds = spec.sourcePack.map((source) => source.id);
  const objectiveCoreIds = [objectiveIdForRealWork(spec.starterId)];
  if (spec.category === 'situation') {
    return {
      situationCoreId: spec.starterId,
      pathCoreId: spec.pathCoreId ?? defaultPathForRealWork(spec.domain),
      sourceCoreIds,
      toolCoreIds: spec.recommendedToolIds,
      outputCoreIds: spec.outputProductIds,
      objectiveCoreIds,
    };
  }
  if (spec.category === 'tool') {
    return {
      toolCoreIds: spec.recommendedToolIds,
      sourceCoreIds,
      objectiveCoreIds,
      outputCoreIds: spec.outputProductIds,
    };
  }
  if (spec.category === 'output') {
    return {
      outputCoreIds: spec.outputProductIds,
      productCoreIds: spec.outputProductIds,
      sourceCoreIds,
      toolCoreIds: spec.recommendedToolIds,
      objectiveCoreIds,
    };
  }
  return {
    userCoreId: spec.starterId,
    sourceCoreIds,
    toolCoreIds: spec.recommendedToolIds,
    outputCoreIds: spec.outputProductIds,
    objectiveCoreIds,
  };
}

function realWorkStarter(spec: RealWorkCapsuleSpec): CapsuleStarterDefinition {
  const sourcePack = normalizeStarterSourcePack(spec.sourcePack);
  const baseRichProfile = buildStarterRichProfile({
    starterId: spec.starterId,
    category: spec.category,
    domain: spec.domain,
    label: spec.label,
    summary: spec.summary,
    detail: spec.detail,
    sourcePack,
    recommendedToolIds: spec.recommendedToolIds,
    outputProductIds: spec.outputProductIds,
  });
  const richProfile: CapsuleStarterRichProfile = {
    ...baseRichProfile,
    userJob: `Represent real work for ${spec.userJob}`,
    whenToUse: uniqueStrings([
      spec.realWorkUse,
      `Use when a human expert needs reusable context, source limits, and drafting posture before PRAXIS generates ${spec.outputProductIds[0] ?? 'an output'}.`,
      ...baseRichProfile.whenToUse,
    ]),
    improves: uniqueStrings([
      'Real work handover: preserves expert context, source checks, and decision constraints across agents.',
      `Expert drafting: keeps the answer tied to ${spec.draftingStyle}.`,
      `Decision quality: makes ${spec.decisionFocus} reviewable before output generation.`,
      ...baseRichProfile.improves,
    ]),
    sourceIndications: uniqueStrings([
      ...baseRichProfile.sourceIndications,
      `${sourcePack[0]?.label ?? spec.label} and ${sourcePack[1]?.label ?? 'the corroborating source'} are starter lanes only; refresh before live reliance.`,
    ]),
    evidenceRequirements: uniqueStrings([
      ...baseRichProfile.evidenceRequirements,
      'Separate approved, disputed, stale, advisory, and forbidden claims before using this capsule in an agent run.',
      'Treat Cognee recall, graph proposals, and SQL projection rows as review-card evidence until a human applies them.',
    ]),
    riskCaveats: uniqueStrings([
      CAPSULE_NO_AFFILIATION_LIMITATION,
      `Reality check: ${spec.userJob}`,
      ...baseRichProfile.riskCaveats,
    ]),
    decisionPrompts: uniqueStrings([
      spec.decisionFocus,
      ...baseRichProfile.decisionPrompts,
    ]),
    nextIdeas: uniqueStrings([
      'Create review cards for disputed claims, stale sources, Cognee memory hits, graph proposals, or SQL projection candidates.',
      'Attach the active user, situation, tool, output, and source capsules before drafting.',
      ...baseRichProfile.nextIdeas,
    ]),
    agentInstructions: `${spec.label}: Reality check: ${spec.userJob}. Use this v2 capsule as human-gated context, not as truth. Start with approved versus disputed claims, inspect ${sourcePack[0]?.id ?? 'source-1'} and ${sourcePack[1]?.id ?? 'source-2'}, keep ${spec.decisionFocus.toLowerCase()} visible, use Cognee recall only as advisory evidence, project graph or SQL rows only as proposals, and stop for human review before external export or canonical promotion. Drafting style: ${spec.draftingStyle}`,
  };
  const tags = uniqueStrings([
    ...spec.tags,
    'real-work',
    'v2-context',
    'no-affiliation',
    ...(spec.category === 'tool' ? ['thinking-device', 'review-gated'] : []),
  ]);
  return starter(
    spec.starterId,
    spec.category,
    spec.domain,
    spec.label,
    spec.summary,
    spec.detail,
    tags,
    realWorkCoreRefs({ ...spec, sourcePack }),
    spec.recommendedToolIds,
    spec.outputProductIds,
    spec.combinesWellWith,
    {
      sourcePack,
      readinessStars: spec.readinessStars ?? (spec.category === 'situation' ? 5 : 4),
      excerpts: sourcePack.map((source) => ({
        sourceId: source.id,
        text: `${source.label} supports ${spec.label} as starter context for ${spec.decisionFocus.toLowerCase()}; verify freshness, scope, and source limits before reliance.`,
      })),
      suggestedQuestions: [
        `What real work decision, brief, review, or handover will ${spec.label} support?`,
        `Which claims in ${spec.label} are approved, disputed, stale, advisory, or forbidden?`,
        `Which source, Cognee recall, graph proposal, or SQL projection should become a review card before drafting?`,
      ],
      suggestedNextActions: [
        `Refresh the source pack for ${spec.label} and mark stale or missing evidence.`,
        `Run ${spec.recommendedToolIds[0] ?? 'sourceability'} with the active user, situation, and output capsules attached.`,
        `Draft ${spec.outputProductIds[0] ?? 'options-memo'} in ${spec.draftingStyle} with human review gates and no-affiliation disclaimer visible.`,
      ],
      agentWorkflow: {
        preferredAgentId: spec.category === 'output' ? 'output-formatter' : spec.category === 'tool' ? 'sourceability-reviewer' : spec.category === 'user' ? 'handover-builder' : 'research-memo',
        routeHint: objectiveIdForRealWork(spec.starterId),
        outputGoal: `${spec.outputProductIds[0] ?? 'options-memo'} for ${spec.label}`,
        approvalNotes: `Human review required before external use, canonical graph promotion, Cognee remember(), SQL projection apply, or reliance on ${spec.label}.`,
      },
      aiUseGuidance: `Use ${spec.label} as v2 real-work context. Verify sources, label advisory memory, keep review-card promotion required, and preserve the no-affiliation disclaimer. ${CAPSULE_NO_AFFILIATION_LIMITATION}`,
      richProfile,
      ...(spec.category === 'tool' ? {
        deviceProfile: buildStarterDeviceProfile(spec.label, {
          deviceKind: spec.deviceKind ?? objectiveIdForRealWork(spec.starterId),
          reasoningOperation: spec.reasoningOperation ?? `turn ${spec.decisionFocus.toLowerCase()} into a reviewable reasoning device`,
          methodSteps: [
            `Name the real work question and the decision owner before applying ${spec.label}.`,
            'Separate facts, assumptions, source gaps, inferred judgments, and stop conditions.',
            'Create review-card candidates for Cognee recall hits, graph proposal rows, and SQL mapping rows.',
            'Draft only after confidence, stale-source status, and human review gates are visible.',
          ],
          expectedOutputs: [
            `${spec.label} table with claims, evidence, caveats, owners, and next actions.`,
            'Review queue entries for unsupported claims, stale evidence, and proposed graph or memory promotions.',
          ],
          disconfirmingChecks: [
            'Name the source or actor perspective most likely to overturn the current finding.',
            'Identify the claim that would become forbidden or stale if the operating context changes.',
          ],
          crossCapsulePairings: spec.combinesWellWith.slice(0, 3),
          humanReviewGate: 'Human review or owner approval is required before applying this reasoning device to external advice, final outputs, Cognee remember(), graph promotion, or SQL projection writes.',
          sourceabilityRequirements: [
            'Every decision-critical row must cite a source receipt, document, or explicit uncertainty note.',
            'Memory hits, model mappings, and graph rows remain advisory until a review card is applied.',
          ],
        }),
      } : {}),
      humanReview: humanReviewed(
        `Reviewed as a v2 real-work capsule for ${spec.userJob}.`,
        'PRAXIS real-work capsule review',
        {
          scope: spec.realWorkUse,
          assumptions: [
            'Starter context represents a reusable working frame, not a complete factual record.',
            'Named organizations are source examples or operating contexts, not PRAXIS affiliations, endorsements, or representations.',
            'User-provided documents, jurisdictional facts, and source updates can override starter defaults after review.',
          ],
          limitations: [
            'Does not provide legal, financial, medical, security, humanitarian, operational, or compliance advice.',
            'Requires source refresh, owner review, and review-card apply metadata before external publication, high-stakes use, Cognee remember(), graph promotion, or SQL projection writes.',
            CAPSULE_NO_AFFILIATION_LIMITATION,
          ],
          sourcePackSummary: sourcePack.map((source) => source.label).slice(0, 3).join('; '),
          humanReviewGate: 'Human review required before external publication, high-stakes reliance, canonical state mutation, Cognee remember(), graph promotion, or SQL projection apply.',
        },
      ),
    },
  );
}

const REAL_WORK_SITUATION_CAPSULES: CapsuleStarterDefinition[] = [
  realWorkStarter({
    starterId: 'starter-situation-red-sea-maritime-logistics-risk',
    category: 'situation',
    domain: 'finance',
    label: 'Red Sea maritime logistics risk capsule',
    summary: 'A real-work logistics and trade-risk capsule for Red Sea shipping disruption, insurance cost, rerouting, sanctions exposure, and senior brief needs.',
    detail: 'Use this when a policy, corporate, insurer, or logistics team needs dated, source-backed context on maritime disruption without turning incident reporting into legal, military, or investment advice.',
    tags: ['red-sea', 'maritime', 'logistics', 'trade', 'sanctions', 'team:economic-sanctions'],
    sourcePack: [
      realWorkSource('unctad-trade-development-foresights-2026', 'UNCTAD Trade and Development Foresights 2026', 'https://unctad.org/publication/trade-and-development-foresights-2026-global-economy-faces-geopolitical-challenge', 'multilateral', 'UNCTAD', '2026', 'Trade uncertainty, shipping, and global development risk baseline.'),
      realWorkSource('imo-maritime-security', 'IMO maritime security resources', 'https://www.imo.org/en/OurWork/Security/Pages/MaritimeSecurity.aspx', 'multilateral', 'International Maritime Organization', '2026', 'Maritime security and shipping-risk governance source lane.'),
    ],
    recommendedToolIds: ['scenario-projector', 'sourceability', 'stakeholder-map'],
    outputProductIds: ['risk-monitor-card', 'daily-read'],
    combinesWellWith: ['starter-tool-scenario-indicator-watchlist', 'starter-output-crisis-daily-senior-brief', 'starter-user-corporate-supply-chain-esg-lead'],
    userJob: 'a real work analyst briefing leadership on shipping disruption, rerouting, insurance, counterparty, and source-confidence questions',
    realWorkUse: 'Use when a team needs a briefable operating picture for Red Sea logistics risk, not a generic geopolitical summary.',
    decisionFocus: 'What changed in maritime risk, which exposure is decision-relevant, and what needs review before action?',
    draftingStyle: 'concise crisis-operations brief with dated indicators, source caveats, and escalation triggers',
    pathCoreId: 'economic-sanctions',
  }),
  realWorkStarter({
    starterId: 'starter-situation-sudan-famine-access-civilian-protection',
    category: 'situation',
    domain: 'humanitarian-rights',
    label: 'Sudan famine, access, and civilian protection capsule',
    summary: 'A humanitarian real-work capsule for Sudan food insecurity, access obstruction, civilian protection, displacement, and donor sitrep drafting.',
    detail: 'Use this when humanitarian or policy teams need to separate needs, access, protection, response capacity, and attribution-sensitive claims before drafting.',
    tags: ['sudan', 'famine', 'humanitarian-access', 'protection', 'displacement', 'team:humanitarian'],
    sourcePack: [
      realWorkSource('ocha-sudan', 'OCHA Sudan country operations', 'https://www.unocha.org/sudan', 'multilateral', 'UN OCHA', '2026', 'Humanitarian needs, response, access, and operational source lane for Sudan.'),
      realWorkSource('ipc-sudan', 'IPC Sudan acute food insecurity analysis', 'https://www.ipcinfo.org/ipc-country-analysis/details-map/en/c/1159433/', 'multilateral', 'Integrated Food Security Phase Classification', '2025', 'Food security classification and famine-risk source lane.'),
    ],
    recommendedToolIds: ['grounded-research', 'sourceability', 'contradiction-finder'],
    outputProductIds: ['humanitarian-one-pager', 'evidence-sourceability-annex'],
    combinesWellWith: ['starter-tool-humanitarian-access-negotiation-checklist', 'starter-output-humanitarian-donor-sitrep', 'starter-user-un-humanitarian-access-officer'],
    userJob: 'a real work humanitarian analyst preparing a donor brief, access note, or protection handover under uncertainty',
    realWorkUse: 'Use when needs, access, protection, and response evidence must be separated before a humanitarian output.',
    decisionFocus: 'Which population, access constraint, and protection claim is supported enough for a donor or operations review?',
    draftingStyle: 'humanitarian sitrep style with affected population, access, response, gaps, and do-no-harm caveats',
  }),
  realWorkStarter({
    starterId: 'starter-situation-haiti-security-humanitarian-corridor',
    category: 'situation',
    domain: 'humanitarian-rights',
    label: 'Haiti security and humanitarian corridor capsule',
    summary: 'A Haiti real-work capsule for insecurity, humanitarian access, mission posture, corridor planning, protection risk, and source-confident briefings.',
    detail: 'Use this when a team needs to discuss access corridors, mission context, humanitarian delivery, and civilian impact without over-claiming control or operational feasibility.',
    tags: ['haiti', 'security', 'humanitarian-corridor', 'access', 'protection', 'team:crisis-ops'],
    sourcePack: [
      realWorkSource('ocha-haiti', 'OCHA Haiti country operations', 'https://www.unocha.org/haiti', 'multilateral', 'UN OCHA', '2026', 'Humanitarian needs, access, response, and civilian-impact reporting lane.'),
      realWorkSource('binuh-unmission', 'BINUH United Nations Integrated Office in Haiti', 'https://binuh.unmissions.org/', 'multilateral', 'United Nations', '2026', 'UN mission, political, security, and mandate context for Haiti.'),
    ],
    recommendedToolIds: ['stakeholder-map', 'sourceability', 'scenario-projector'],
    outputProductIds: ['humanitarian-one-pager', 'risk-monitor-card'],
    combinesWellWith: ['starter-tool-humanitarian-access-negotiation-checklist', 'starter-output-humanitarian-donor-sitrep', 'starter-user-field-program-manager'],
    userJob: 'a real work crisis or field program team reviewing access corridors, partner safety, and donor-facing caveats',
    realWorkUse: 'Use when humanitarian access and security context need to travel together into a field or donor brief.',
    decisionFocus: 'Which corridor, actor, risk, and response constraint is actionable enough for a reviewed next step?',
    draftingStyle: 'field-aware access brief with safety, protection, logistics, and source-confidence sections',
  }),
  realWorkStarter({
    starterId: 'starter-situation-eastern-drc-minerals-protection-risk',
    category: 'situation',
    domain: 'critical-minerals',
    label: 'Eastern DRC minerals and protection risk capsule',
    summary: 'A real-work capsule for eastern DRC conflict, mineral supply-chain exposure, civilian protection, mission context, and corporate due-diligence drafting.',
    detail: 'Use this when security, ESG, compliance, or humanitarian teams need to keep mineral exposure, protection risk, and source limitations distinct.',
    tags: ['drc', 'critical-minerals', 'protection', 'supply-chain', 'conflict', 'team:human-rights-legal'],
    sourcePack: [
      realWorkSource('monusco-official', 'MONUSCO official mission source', 'https://monusco.unmissions.org/', 'multilateral', 'United Nations Peacekeeping', '2026', 'Mission mandate, protection, and stabilization reporting source lane.'),
      realWorkSource('ocha-drc', 'OCHA Democratic Republic of the Congo operations', 'https://www.unocha.org/democratic-republic-congo', 'multilateral', 'UN OCHA', '2026', 'Humanitarian needs, access, displacement, and response source lane.'),
    ],
    recommendedToolIds: ['stakeholder-map', 'sourceability', 'ach'],
    outputProductIds: ['country-risk-card', 'humanitarian-one-pager'],
    combinesWellWith: ['starter-tool-corporate-exposure-heatmap', 'starter-tool-source-reliability-triangulation-ladder', 'starter-user-corporate-supply-chain-esg-lead'],
    userJob: 'a real work ESG, security, or protection analyst separating mineral exposure from humanitarian and rights claims',
    realWorkUse: 'Use when conflict, protection, and mineral supply-chain context must inform a reviewed corporate or policy note.',
    decisionFocus: 'Which exposure or protection claim can be supported, and which remains disputed or advisory?',
    draftingStyle: 'due-diligence and protection-risk note with claim-source tables and review gates',
    pathCoreId: 'human-rights-accountability',
  }),
  realWorkStarter({
    starterId: 'starter-situation-sahel-transition-regional-security',
    category: 'situation',
    domain: 'diplomacy',
    label: 'Sahel transition and regional security capsule',
    summary: 'A Sahel real-work capsule for transition politics, regional organizations, security cooperation, sanctions posture, and diplomatic options.',
    detail: 'Use this when a desk, donor, or risk team needs source-backed regional context and cautious language on transition authorities, regional responses, and security tradeoffs.',
    tags: ['sahel', 'transition', 'regional-security', 'ecowas', 'diplomacy', 'team:diplomatic'],
    sourcePack: [
      realWorkSource('ecowas-official', 'ECOWAS official source', 'https://ecowas.int/', 'multilateral', 'ECOWAS', '2026', 'Regional organization source lane for political, sanctions, and mediation posture.'),
      realWorkSource('unowas-official', 'UNOWAS official source', 'https://unowas.unmissions.org/', 'multilateral', 'United Nations Office for West Africa and the Sahel', '2026', 'UN regional political and security context source lane.'),
    ],
    recommendedToolIds: ['stakeholder-map', 'coalition-detector', 'sourceability'],
    outputProductIds: ['diplomatic-cable', 'country-risk-card'],
    combinesWellWith: ['starter-tool-stakeholder-veto-leverage-map', 'starter-output-ministerial-question-period-brief', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work regional desk officer preparing a transition, sanctions, or security cooperation brief',
    realWorkUse: 'Use when regional mandate, transition, and security context need a single reviewable frame.',
    decisionFocus: 'Which actors, vetoes, mandates, and leverage points matter for the next diplomatic or policy option?',
    draftingStyle: 'desk-officer cable with actor map, mandate posture, options, and cautious confidence language',
    pathCoreId: 'foreign-policy',
  }),
  realWorkStarter({
    starterId: 'starter-situation-south-china-sea-maritime-incident-law',
    category: 'situation',
    domain: 'diplomacy',
    label: 'South China Sea maritime incident and law capsule',
    summary: 'A maritime-law real-work capsule for incidents, UNCLOS posture, ASEAN documents, escalation risk, and talking-point discipline.',
    detail: 'Use this when a user needs to brief maritime incidents, diplomatic reactions, or legal posture while separating facts, claims, law, and inferred intent.',
    tags: ['south-china-sea', 'maritime-law', 'unclos', 'asean', 'incident', 'team:diplomatic'],
    sourcePack: [
      realWorkSource('unclos-doalos', 'UN DOALOS UNCLOS overview', 'https://www.un.org/depts/los/convention_agreements/convention_overview_convention.htm', 'multilateral', 'United Nations Division for Ocean Affairs and the Law of the Sea', '2026', 'Law-of-the-sea treaty and legal context source lane.'),
      realWorkSource('asean-doc-south-china-sea', 'ASEAN Declaration on Conduct in the South China Sea', 'https://asean.org/declaration-on-the-conduct-of-parties-in-the-south-china-sea-2/', 'official', 'ASEAN', '2002', 'Regional diplomatic conduct baseline for South China Sea posture.'),
    ],
    recommendedToolIds: ['sourceability', 'commitment-tracker', 'frame-narrative'],
    outputProductIds: ['legal-mandate-compliance-note', 'talking-points'],
    combinesWellWith: ['starter-tool-legal-mandate-redline-check', 'starter-output-ministerial-question-period-brief', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work maritime, diplomatic, or legal-policy analyst briefing an incident without making unreviewed legal findings',
    realWorkUse: 'Use when incident facts, diplomatic posture, and legal language must be separated before drafting.',
    decisionFocus: 'Which incident facts are sourced, which legal terms are safe, and which escalation claims require review?',
    draftingStyle: 'legal-policy briefing style with fact-law separation and careful talking points',
    pathCoreId: 'legal-compliance',
  }),
  realWorkStarter({
    starterId: 'starter-situation-arctic-shipping-minerals-governance',
    category: 'situation',
    domain: 'critical-minerals',
    label: 'Arctic shipping, minerals, and governance capsule',
    summary: 'An Arctic real-work capsule for polar shipping, critical minerals, indigenous and environmental governance, safety rules, and scenario monitoring.',
    detail: 'Use this when policy, corporate, or research teams need Arctic context that does not flatten shipping safety, minerals, environmental, and governance questions.',
    tags: ['arctic', 'shipping', 'critical-minerals', 'governance', 'polar-code', 'team:climate-development'],
    sourcePack: [
      realWorkSource('imo-polar-code', 'IMO Polar Code', 'https://www.imo.org/en/OurWork/Safety/Pages/polar-code.aspx', 'multilateral', 'International Maritime Organization', '2026', 'Safety and environmental requirements for polar waters source lane.'),
      realWorkSource('arctic-council', 'Arctic Council official source', 'https://arctic-council.org/', 'multilateral', 'Arctic Council', '2026', 'Regional cooperation and Arctic governance source lane.'),
    ],
    recommendedToolIds: ['scenario-projector', 'stakeholder-map', 'sourceability'],
    outputProductIds: ['scenario-risk-dashboard-card', 'country-risk-card'],
    combinesWellWith: ['starter-tool-scenario-indicator-watchlist', 'starter-tool-corporate-exposure-heatmap', 'starter-output-board-decision-memo-pack'],
    userJob: 'a real work policy or corporate analyst reviewing Arctic shipping, mineral exposure, and governance constraints',
    realWorkUse: 'Use when Arctic operating context must combine safety rules, governance, environment, and supply-chain exposure.',
    decisionFocus: 'Which Arctic route, project, actor, or environmental constraint changes the decision?',
    draftingStyle: 'scenario dashboard style with rule references, stakeholder lanes, and monitored indicators',
  }),
  realWorkStarter({
    starterId: 'starter-situation-public-sector-ransomware-service-continuity',
    category: 'situation',
    domain: 'cyber-resilience',
    label: 'Public sector ransomware and service continuity capsule',
    summary: 'A cyber-resilience real-work capsule for public service continuity, ransomware impact, recovery priorities, critical infrastructure dependencies, and leadership briefings.',
    detail: 'Use this when a public agency, municipal team, or policy office needs operationally careful context without incident-response or legal advice.',
    tags: ['ransomware', 'public-sector', 'service-continuity', 'critical-infrastructure', 'cyber', 'team:information-cyber'],
    sourcePack: [
      realWorkSource('cisa-cpg', 'CISA Cross-Sector Cybersecurity Performance Goals', 'https://www.cisa.gov/cross-sector-cybersecurity-performance-goals', 'official', 'CISA', '2026', 'Cyber resilience and baseline protective control source lane.'),
      realWorkSource('nist-csf', 'NIST Cybersecurity Framework', 'https://www.nist.gov/cyberframework', 'official', 'NIST', '2026', 'Cyber governance, identify, protect, detect, respond, and recover vocabulary.'),
    ],
    recommendedToolIds: ['scenario-projector', 'sourceability', 'memo-drafter'],
    outputProductIds: ['risk-monitor-card', 'principals-decision-memo'],
    combinesWellWith: ['starter-tool-board-assurance-question-set', 'starter-output-crisis-daily-senior-brief', 'starter-user-field-program-manager'],
    userJob: 'a real work public-sector continuity lead briefing service impacts, dependencies, recovery priorities, and escalation needs',
    realWorkUse: 'Use when ransomware context must support leadership decisions while preserving incident-response and legal boundaries.',
    decisionFocus: 'Which services, dependencies, controls, and communications require immediate review?',
    draftingStyle: 'incident leadership brief with continuity priorities, controls, source gaps, and stop conditions',
    pathCoreId: 'crisis-management',
  }),
  realWorkStarter({
    starterId: 'starter-situation-election-observation-information-integrity',
    category: 'situation',
    domain: 'election-integrity',
    label: 'Election observation and information integrity capsule',
    summary: 'An election real-work capsule for observation method, information integrity, administrative risk, narrative monitoring, and public-confidence language.',
    detail: 'Use this when analysts must distinguish official results, observation findings, social narratives, administrative issues, and unsupported allegations.',
    tags: ['elections', 'observation', 'information-integrity', 'narratives', 'democracy', 'team:information-cyber'],
    sourcePack: [
      realWorkSource('osce-odihr-handbook', 'OSCE/ODIHR election observation handbook', 'https://www.osce.org/odihr/elections/68439', 'multilateral', 'OSCE/ODIHR', '2010', 'Election observation methodology and assessment baseline.'),
      realWorkSource('idea-electoral-integrity', 'International IDEA electoral processes resources', 'https://www.idea.int/theme/electoral-processes', 'multilateral', 'International IDEA', '2026', 'Comparative electoral process and democratic resilience source lane.', 2),
    ],
    recommendedToolIds: ['sourceability', 'frame-narrative', 'contradiction-finder'],
    outputProductIds: ['electoral-risk-card', 'narrative-monitor'],
    combinesWellWith: ['starter-tool-public-narrative-risk-premortem', 'starter-output-crisis-daily-senior-brief', 'starter-user-investigative-research-analyst'],
    userJob: 'a real work election or information-integrity analyst preparing a public-risk brief with allegation discipline',
    realWorkUse: 'Use when election observation and narrative claims must stay sourceable and non-inflammatory.',
    decisionFocus: 'Which observation finding, administrative issue, or narrative risk is supported enough to brief?',
    draftingStyle: 'election-risk note with observation method, allegation thresholds, and public-confidence caveats',
  }),
  realWorkStarter({
    starterId: 'starter-situation-migration-border-reception-capacity',
    category: 'situation',
    domain: 'migration-displacement',
    label: 'Migration border reception capacity capsule',
    summary: 'A migration real-work capsule for border reception capacity, displacement data, protection needs, service pressure, and policy tradeoffs.',
    detail: 'Use this when humanitarian, local-government, or policy teams need to separate flows, capacity, protection obligations, and public service constraints.',
    tags: ['migration', 'border-reception', 'capacity', 'displacement', 'protection', 'team:humanitarian'],
    sourcePack: [
      realWorkSource('unhcr-operational-data', 'UNHCR operational data portal', 'https://data.unhcr.org/', 'multilateral', 'UNHCR', '2026', 'Operational refugee and displacement data source lane.'),
      realWorkSource('iom-displacement', 'IOM Displacement Tracking Matrix', 'https://dtm.iom.int/', 'multilateral', 'International Organization for Migration', '2026', 'Mobility, flow, and displacement tracking source lane.'),
    ],
    recommendedToolIds: ['grounded-research', 'sourceability', 'scenario-projector'],
    outputProductIds: ['humanitarian-one-pager', 'options-memo'],
    combinesWellWith: ['starter-tool-policy-option-triage-matrix', 'starter-output-policy-implementation-roadmap', 'starter-user-field-program-manager'],
    userJob: 'a real work reception, humanitarian, or policy manager comparing capacity, service pressure, and protection duties',
    realWorkUse: 'Use when migration data, reception capacity, and policy choices need a shared source-backed frame.',
    decisionFocus: 'Which capacity bottleneck, population need, or policy option requires the next decision?',
    draftingStyle: 'implementation options memo with capacity, protection, data gaps, and service impacts',
  }),
  realWorkStarter({
    starterId: 'starter-situation-water-stress-transboundary-allocation',
    category: 'situation',
    domain: 'sustainability',
    label: 'Water stress and transboundary allocation capsule',
    summary: 'A water real-work capsule for scarcity, basin allocation, agriculture exposure, climate stress, and diplomatic or development options.',
    detail: 'Use this when water availability, allocation, agriculture, and cross-border governance need a source-backed situation frame.',
    tags: ['water-stress', 'transboundary', 'allocation', 'climate', 'agriculture', 'team:climate-development'],
    sourcePack: [
      realWorkSource('fao-aquastat', 'FAO AQUASTAT', 'https://www.fao.org/aquastat/en/', 'multilateral', 'FAO', '2026', 'Water resources, withdrawals, and agricultural water source lane.'),
      realWorkSource('wmo-water-resources', 'WMO State of Global Water Resources', 'https://wmo.int/publication-series/state-of-global-water-resources', 'multilateral', 'World Meteorological Organization', '2026', 'Hydrological monitoring, water-resource state, and climate signal source lane.'),
    ],
    recommendedToolIds: ['scenario-projector', 'stakeholder-map', 'sourceability'],
    outputProductIds: ['country-risk-card', 'options-memo'],
    combinesWellWith: ['starter-tool-stakeholder-veto-leverage-map', 'starter-output-policy-implementation-roadmap', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work development or diplomacy analyst briefing allocation tradeoffs and water-stress evidence',
    realWorkUse: 'Use when water stress, sector exposure, and cross-border governance must be reviewed before advice.',
    decisionFocus: 'Which basin, allocation dispute, sector exposure, and data gap changes the recommended option?',
    draftingStyle: 'development policy memo with basin facts, stakeholders, options, and uncertainty notes',
    pathCoreId: 'climate-development',
  }),
  realWorkStarter({
    starterId: 'starter-situation-power-grid-flexibility-critical-infrastructure',
    category: 'situation',
    domain: 'cyber-resilience',
    label: 'Power grid flexibility and critical infrastructure capsule',
    summary: 'A grid real-work capsule for electricity reliability, flexibility, transition constraints, critical infrastructure risk, and investment-policy questions.',
    detail: 'Use this when grid reliability, clean-energy integration, security, and public investment choices need one reviewable operating picture.',
    tags: ['power-grid', 'critical-infrastructure', 'energy-security', 'flexibility', 'resilience', 'team:climate-development'],
    sourcePack: [
      realWorkSource('iea-electricity-grids', 'IEA electricity grids and secure energy transitions', 'https://www.iea.org/reports/electricity-grids-and-secure-energy-transitions', 'multilateral', 'International Energy Agency', '2023', 'Grid investment, flexibility, bottlenecks, and transition-security source lane.'),
      realWorkSource('cisa-energy-sector', 'CISA energy sector critical infrastructure', 'https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience/critical-infrastructure-sectors/energy-sector', 'official', 'CISA', '2026', 'Energy-sector critical infrastructure and resilience source lane.'),
    ],
    recommendedToolIds: ['scenario-projector', 'sourceability', 'ach'],
    outputProductIds: ['risk-monitor-card', 'principals-decision-memo'],
    combinesWellWith: ['starter-tool-scenario-indicator-watchlist', 'starter-output-board-decision-memo-pack', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work energy, infrastructure, or policy analyst briefing reliability, investment, and resilience tradeoffs',
    realWorkUse: 'Use when grid constraints and critical infrastructure risk shape a policy or board decision.',
    decisionFocus: 'Which reliability, flexibility, security, or investment constraint needs escalation?',
    draftingStyle: 'infrastructure decision memo with indicators, tradeoffs, controls, and owner actions',
    pathCoreId: 'climate-development',
  }),
  realWorkStarter({
    starterId: 'starter-situation-disaster-recovery-loss-damage-finance',
    category: 'situation',
    domain: 'finance',
    label: 'Disaster recovery and loss-damage finance capsule',
    summary: 'A disaster-finance real-work capsule for recovery needs, risk reduction, loss-and-damage framing, reconstruction finance, and donor decision support.',
    detail: 'Use this when a government, donor, insurer, or NGO needs to separate damage, needs, financing gap, risk reduction, and implementation capacity.',
    tags: ['disaster-recovery', 'loss-and-damage', 'finance', 'resilience', 'reconstruction', 'team:climate-development'],
    sourcePack: [
      realWorkSource('undrr-sendai-framework', 'UNDRR Sendai Framework', 'https://www.undrr.org/publication/sendai-framework-disaster-risk-reduction-2015-2030', 'multilateral', 'UNDRR', '2015', 'Disaster-risk reduction, resilience, and governance baseline.'),
      realWorkSource('world-bank-disaster-risk', 'World Bank disaster risk management', 'https://www.worldbank.org/en/topic/disasterriskmanagement', 'multilateral', 'World Bank', '2026', 'Recovery, resilience finance, and disaster risk management source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'scenario-projector', 'memo-drafter'],
    outputProductIds: ['principals-decision-memo', 'country-risk-card'],
    combinesWellWith: ['starter-tool-policy-option-triage-matrix', 'starter-output-policy-implementation-roadmap', 'starter-user-field-program-manager'],
    userJob: 'a real work donor, recovery, or finance analyst preparing a recovery decision note with implementation caveats',
    realWorkUse: 'Use when recovery finance claims need damage, needs, resilience, and implementation context in one capsule.',
    decisionFocus: 'Which recovery cost, finance instrument, implementation risk, or resilience claim is decision-relevant?',
    draftingStyle: 'donor finance memo with needs, instruments, delivery risk, and source-confidence notes',
    pathCoreId: 'climate-development',
  }),
  realWorkStarter({
    starterId: 'starter-situation-public-health-infodemic-emergency-trust',
    category: 'situation',
    domain: 'public-health',
    label: 'Public health infodemic and emergency trust capsule',
    summary: 'A public-health real-work capsule for emergency communication, misinformation risk, community trust, rumor feedback, and policy messaging.',
    detail: 'Use this when a health or government team needs to draft cautious emergency communications and trust-building messages without medical advice.',
    tags: ['public-health', 'infodemic', 'risk-communication', 'trust', 'emergency', 'team:crisis-ops'],
    sourcePack: [
      realWorkSource('who-ercc', 'WHO emergency risk communication resources', 'https://www.who.int/emergencies/risk-communications', 'multilateral', 'World Health Organization', '2026', 'Emergency risk communication source lane.'),
      realWorkSource('who-rcce', 'WHO risk communication and community engagement resources', 'https://www.who.int/teams/risk-communication', 'multilateral', 'World Health Organization', '2026', 'Community engagement, feedback, and trust source lane.'),
    ],
    recommendedToolIds: ['frame-narrative', 'sourceability', 'contradiction-finder'],
    outputProductIds: ['narrative-monitor', 'talking-points'],
    combinesWellWith: ['starter-tool-public-narrative-risk-premortem', 'starter-output-crisis-daily-senior-brief', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work public-health communicator or policy lead preparing trust-sensitive emergency language',
    realWorkUse: 'Use when health communication must separate facts, uncertainty, public concerns, and unsupported claims.',
    decisionFocus: 'Which message, rumor, audience concern, or trust barrier needs a reviewed response?',
    draftingStyle: 'risk-communication brief with uncertainty language, community feedback, and stop conditions',
    pathCoreId: 'crisis-management',
  }),
  realWorkStarter({
    starterId: 'starter-situation-forced-labor-import-supply-chain-risk',
    category: 'situation',
    domain: 'humanitarian-rights',
    label: 'Forced labor import and supply-chain risk capsule',
    summary: 'A forced-labor real-work capsule for import risk, supply-chain due diligence, rights sources, customs posture, and corporate escalation.',
    detail: 'Use this when compliance, ESG, legal, or sourcing teams need to organize forced-labor risk without making legal determinations.',
    tags: ['forced-labor', 'imports', 'supply-chain', 'due-diligence', 'customs', 'team:human-rights-legal'],
    sourcePack: [
      realWorkSource('ilo-forced-labour', 'ILO forced labour resources', 'https://www.ilo.org/topics/forced-labour-modern-slavery-and-trafficking-persons', 'multilateral', 'International Labour Organization', '2026', 'Forced labour, modern slavery, and trafficking source lane.'),
      realWorkSource('cbp-uflpa', 'CBP Uyghur Forced Labor Prevention Act resources', 'https://www.cbp.gov/trade/forced-labor/UFLPA', 'regulator', 'U.S. Customs and Border Protection', '2026', 'US import enforcement and forced-labor compliance source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'contradiction-finder', 'memo-drafter'],
    outputProductIds: ['legal-mandate-compliance-note', 'evidence-sourceability-annex'],
    combinesWellWith: ['starter-tool-counterparty-ownership-escalation-tree', 'starter-tool-corporate-exposure-heatmap', 'starter-user-sanctions-compliance-counsel'],
    userJob: 'a real work compliance or ESG lead reviewing supplier facts, import exposure, and escalation thresholds',
    realWorkUse: 'Use when forced-labor risk must be represented with evidence, jurisdictional limits, and non-advice caveats.',
    decisionFocus: 'Which supplier, shipment, jurisdiction, source, and escalation path needs human review?',
    draftingStyle: 'compliance-style note with facts, red flags, source limits, and legal-review gates',
    pathCoreId: 'human-rights-accountability',
  }),
  realWorkStarter({
    starterId: 'starter-situation-procurement-integrity-major-projects',
    category: 'situation',
    domain: 'finance',
    label: 'Procurement integrity for major projects capsule',
    summary: 'A public-procurement real-work capsule for integrity controls, competition, delivery risk, conflicts, auditability, and major project governance.',
    detail: 'Use this when public-sector or donor teams need to evaluate procurement integrity and delivery risk without accusing parties or bypassing legal review.',
    tags: ['procurement', 'integrity', 'major-projects', 'anti-corruption', 'delivery-risk', 'team:governance-public-sector'],
    sourcePack: [
      realWorkSource('oecd-public-procurement', 'OECD public procurement resources', 'https://www.oecd.org/gov/public-procurement/', 'multilateral', 'OECD', '2026', 'Public procurement integrity, value-for-money, and governance source lane.'),
      realWorkSource('world-bank-procurement', 'World Bank procurement for projects and programs', 'https://www.worldbank.org/en/projects-operations/products-and-services/procurement-projects-programs', 'multilateral', 'World Bank', '2026', 'Project procurement, safeguards, and implementation source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'ach', 'memo-drafter'],
    outputProductIds: ['principals-decision-memo', 'governance-index'],
    combinesWellWith: ['starter-tool-board-assurance-question-set', 'starter-output-policy-implementation-roadmap', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work procurement, donor, or governance analyst preparing an integrity and delivery-risk review',
    realWorkUse: 'Use when procurement context needs controls, evidence, delivery risk, and review status separated.',
    decisionFocus: 'Which control weakness, conflict risk, source gap, or delivery issue changes the recommendation?',
    draftingStyle: 'governance review memo with controls, evidence, alternatives, and escalation notes',
    pathCoreId: 'public-sector-policy',
  }),
];

const REAL_WORK_TOOL_CAPSULES: CapsuleStarterDefinition[] = [
  realWorkStarter({
    starterId: 'starter-tool-source-reliability-triangulation-ladder',
    category: 'tool',
    domain: 'source-intake',
    label: 'Source reliability triangulation ladder',
    summary: 'A thinking-device capsule for ranking sources, triangulating contested claims, and turning weak evidence into review-card tasks.',
    detail: 'Use this tool when analysts need to move from single-source claims to an inspectable ladder of primary, corroborating, contradictory, stale, and missing evidence.',
    tags: ['sourceability', 'triangulation', 'evidence', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('ifrc-emergency-needs-assessment', 'IFRC guidelines for emergency needs assessment', 'https://www.ifrc.org/document/guidelines-emergency-needs-assessment', 'multilateral', 'IFRC', '2026', 'Assessment and evidence-collection source lane for operational claims.', 2),
      realWorkSource('praxis-sourceability-method', 'PRAXIS sourceability method', 'https://praxis.tacitus.me/learn#sourceability', 'public-library', 'PRAXIS starter catalog', CAPSULE_STARTER_CATALOG_VERSION, 'PRAXIS method for claim-source review, receipts, and promotion gates.', 3),
    ],
    recommendedToolIds: ['sourceability', 'grounded-research', 'contradiction-finder'],
    outputProductIds: ['evidence-sourceability-annex', 'options-memo'],
    combinesWellWith: ['starter-tool-evidence-freshness-staleness-clock', 'starter-output-crisis-daily-senior-brief', 'starter-user-investigative-research-analyst'],
    userJob: 'a real work researcher reviewing whether a claim is strong enough for a brief, decision, or handover',
    realWorkUse: 'Use when evidence quality determines whether PRAXIS may draft confidently or must create review cards.',
    decisionFocus: 'Which source tier supports each claim, and what must be triangulated before promotion?',
    draftingStyle: 'evidence annex style with claim rows, source tiers, contradictions, and action owners',
    deviceKind: 'source-reliability-triangulation-ladder',
    reasoningOperation: 'rank source reliability and triangulate contested claims before drafting',
  }),
  realWorkStarter({
    starterId: 'starter-tool-stakeholder-veto-leverage-map',
    category: 'tool',
    domain: 'options-mapping',
    label: 'Stakeholder veto and leverage map',
    summary: 'A thinking-device capsule for mapping actors, vetoes, leverage, incentives, red lines, and coalition paths in policy work.',
    detail: 'Use this tool when a policy option depends on who can block, fund, authorize, delay, implement, or legitimize a course of action.',
    tags: ['stakeholders', 'leverage', 'vetoes', 'coalitions', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('un-peacemaker', 'UN Peacemaker mediation resources', 'https://peacemaker.un.org/', 'multilateral', 'United Nations', '2026', 'Mediation and stakeholder process design source lane.'),
      realWorkSource('oecd-governance', 'OECD public governance resources', 'https://www.oecd.org/governance/', 'multilateral', 'OECD', '2026', 'Public governance, institutions, and implementation context source lane.'),
    ],
    recommendedToolIds: ['stakeholder-map', 'position-vs-interest', 'coalition-detector'],
    outputProductIds: ['actor-dossier', 'negotiation-prep-book'],
    combinesWellWith: ['starter-situation-sahel-transition-regional-security', 'starter-output-policy-implementation-roadmap', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work advisor preparing an actor map, negotiation note, or implementation strategy for a contested decision',
    realWorkUse: 'Use when stakeholder power and vetoes matter more than generic issue description.',
    decisionFocus: 'Who can block or enable the option, and what leverage or red line changes the path?',
    draftingStyle: 'actor map and negotiation-prep style with positions, interests, leverage, and risks',
    deviceKind: 'stakeholder-veto-leverage-map',
    reasoningOperation: 'turn stakeholder power into a reviewable veto and leverage map',
  }),
  realWorkStarter({
    starterId: 'starter-tool-evidence-freshness-staleness-clock',
    category: 'tool',
    domain: 'source-intake',
    label: 'Evidence freshness and staleness clock',
    summary: 'A thinking-device capsule for marking source dates, stale assumptions, update cadence, and decision deadlines before reuse.',
    detail: 'Use this tool when policy or crisis work changes quickly and old evidence can make an otherwise polished answer unsafe.',
    tags: ['freshness', 'staleness', 'time', 'monitoring', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('google-grounded-search-docs', 'Google Search grounding overview', 'https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview', 'official', 'Google Cloud', '2026', 'Grounding and source-refresh source lane for current information retrieval.'),
      realWorkSource('praxis-sourceability-method', 'PRAXIS sourceability method', 'https://praxis.tacitus.me/learn#sourceability', 'public-library', 'PRAXIS starter catalog', CAPSULE_STARTER_CATALOG_VERSION, 'PRAXIS source freshness and citation posture method.', 3),
    ],
    recommendedToolIds: ['sourceability', 'grounded-research', 'scenario-projector'],
    outputProductIds: ['daily-read', 'risk-monitor-card'],
    combinesWellWith: ['starter-tool-source-reliability-triangulation-ladder', 'starter-output-crisis-daily-senior-brief', 'starter-situation-red-sea-maritime-logistics-risk'],
    userJob: 'a real work analyst deciding whether a capsule can be reused today or must be refreshed before a brief',
    realWorkUse: 'Use when freshness, update cadence, and decision timing determine whether context is safe to reuse.',
    decisionFocus: 'Which facts are current, stale, fast-moving, or blocked pending source refresh?',
    draftingStyle: 'monitoring clock style with as-of dates, expiry rules, triggers, and refresh tasks',
    deviceKind: 'evidence-freshness-staleness-clock',
    reasoningOperation: 'classify evidence by freshness, expiry, and decision timing',
  }),
  realWorkStarter({
    starterId: 'starter-tool-policy-option-triage-matrix',
    category: 'tool',
    domain: 'options-mapping',
    label: 'Policy option triage matrix',
    summary: 'A thinking-device capsule for sorting options by legality, feasibility, cost, speed, stakeholder support, risk, and evidence quality.',
    detail: 'Use this tool when a user needs a decision-ready option set rather than a long issue essay.',
    tags: ['policy-options', 'triage', 'feasibility', 'decision', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('oecd-governance', 'OECD public governance resources', 'https://www.oecd.org/governance/', 'multilateral', 'OECD', '2026', 'Governance and implementation context for policy options.'),
      realWorkSource('plain-language-gov', 'Plain language government guidance', 'https://www.plainlanguage.gov/guidelines/', 'official', 'U.S. Plain Language Action and Information Network', '2026', 'Plain decision-support writing baseline.'),
    ],
    recommendedToolIds: ['ach', 'memo-drafter', 'sourceability'],
    outputProductIds: ['options-memo', 'principals-decision-memo'],
    combinesWellWith: ['starter-output-policy-implementation-roadmap', 'starter-user-cabinet-policy-advisor', 'starter-situation-procurement-integrity-major-projects'],
    userJob: 'a real work policy advisor narrowing a messy issue into viable options for a decision meeting',
    realWorkUse: 'Use when PRAXIS must produce options that a real decision owner can compare and clear.',
    decisionFocus: 'Which options survive legality, feasibility, timing, cost, risk, and sourceability checks?',
    draftingStyle: 'options matrix style with recommendation, tradeoffs, assumptions, and clearance needs',
    deviceKind: 'policy-option-triage-matrix',
    reasoningOperation: 'triage policy options into reviewable decision rows',
  }),
  realWorkStarter({
    starterId: 'starter-tool-data-gap-interrogatory-builder',
    category: 'tool',
    domain: 'source-intake',
    label: 'Data gap interrogatory builder',
    summary: 'A thinking-device capsule for converting missing information into precise questions, source requests, owner tasks, and stop conditions.',
    detail: 'Use this tool when a draft answer hides missing facts that should instead become a structured follow-up plan.',
    tags: ['data-gaps', 'interrogatory', 'questions', 'source-requests', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('ifrc-emergency-needs-assessment', 'IFRC guidelines for emergency needs assessment', 'https://www.ifrc.org/document/guidelines-emergency-needs-assessment', 'multilateral', 'IFRC', '2026', 'Needs assessment and information-gap source lane.', 2),
      realWorkSource('sphere-handbook', 'Sphere Handbook', 'https://spherestandards.org/handbook/', 'standard-setter', 'Sphere Association', '2018', 'Humanitarian standards and minimum information needs source lane.'),
    ],
    recommendedToolIds: ['grounded-research', 'sourceability', 'ask-praxis'],
    outputProductIds: ['evidence-sourceability-annex', 'humanitarian-one-pager'],
    combinesWellWith: ['starter-user-field-program-manager', 'starter-output-humanitarian-donor-sitrep', 'starter-tool-source-reliability-triangulation-ladder'],
    userJob: 'a real work analyst or program manager turning unknowns into questions that another person can answer',
    realWorkUse: 'Use when the most valuable output is a better question set and source request, not a confident answer.',
    decisionFocus: 'Which missing data blocks a decision, who can answer it, and what source would count?',
    draftingStyle: 'interrogatory checklist with missing facts, source owners, deadlines, and stop conditions',
    deviceKind: 'data-gap-interrogatory-builder',
    reasoningOperation: 'convert data gaps into reviewable questions and source requests',
  }),
  realWorkStarter({
    starterId: 'starter-tool-legal-mandate-redline-check',
    category: 'tool',
    domain: 'policy-review',
    label: 'Legal mandate redline check',
    summary: 'A thinking-device capsule for separating mandate text, legal claims, policy judgment, forbidden advice, and escalation thresholds.',
    detail: 'Use this tool when an output touches legal authority, sanctions, mandate compliance, procurement rules, or sensitive regulatory language.',
    tags: ['legal-mandate', 'redlines', 'compliance', 'review', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('un-security-council', 'UN Security Council official site', 'https://main.un.org/securitycouncil/en', 'multilateral', 'United Nations Security Council', '2026', 'Mandate, resolutions, sanctions, and committee source lane.'),
      realWorkSource('unclos-doalos', 'UN DOALOS UNCLOS overview', 'https://www.un.org/depts/los/convention_agreements/convention_overview_convention.htm', 'multilateral', 'United Nations Division for Ocean Affairs and the Law of the Sea', '2026', 'Treaty and law-of-the-sea source lane.'),
    ],
    recommendedToolIds: ['commitment-tracker', 'sourceability', 'contradiction-finder'],
    outputProductIds: ['legal-mandate-compliance-note', 'evidence-sourceability-annex'],
    combinesWellWith: ['starter-situation-south-china-sea-maritime-incident-law', 'starter-output-sanctions-exposure-note', 'starter-user-sanctions-compliance-counsel'],
    userJob: 'a real work legal-policy reviewer identifying what PRAXIS can draft and what must stop for counsel or mandate review',
    realWorkUse: 'Use when legal or mandate language must be bounded before a model drafts confident prose.',
    decisionFocus: 'Which language is safe as source summary, which is legal judgment, and which is forbidden without review?',
    draftingStyle: 'redline note with mandate text, safe language, escalation points, and non-advice caveats',
    deviceKind: 'legal-mandate-redline-check',
    reasoningOperation: 'separate legal text, policy inference, and forbidden advice before drafting',
  }),
  realWorkStarter({
    starterId: 'starter-tool-corporate-exposure-heatmap',
    category: 'tool',
    domain: 'exposure-mapping',
    label: 'Corporate exposure heatmap',
    summary: 'A thinking-device capsule for mapping company exposure by geography, supplier tier, issue, source confidence, control owner, and escalation.',
    detail: 'Use this tool when corporate policy, ESG, sanctions, or supply-chain teams need an evidence-backed heatmap rather than broad risk language.',
    tags: ['corporate-risk', 'exposure', 'supply-chain', 'esg', 'heatmap', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('oecd-corporate-governance', 'OECD corporate governance principles', 'https://www.oecd.org/corporate/principles-corporate-governance/', 'multilateral', 'OECD', '2023', 'Board oversight and corporate governance source lane.'),
      realWorkSource('ohchr-ungp', 'UN Guiding Principles on Business and Human Rights', 'https://www.ohchr.org/sites/default/files/documents/publications/guidingprinciplesbusinesshr_en.pdf', 'multilateral', 'OHCHR', '2011', 'Business and human-rights due diligence source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'stakeholder-map', 'memo-drafter'],
    outputProductIds: ['scenario-risk-dashboard-card', 'principals-decision-memo'],
    combinesWellWith: ['starter-user-corporate-supply-chain-esg-lead', 'starter-output-board-decision-memo-pack', 'starter-situation-forced-labor-import-supply-chain-risk'],
    userJob: 'a real work corporate risk or ESG lead preparing exposure, owner, and escalation rows for management review',
    realWorkUse: 'Use when corporate exposure must be mapped by evidence and owner before board or executive language.',
    decisionFocus: 'Which exposure is material, sourced, controllable, and ready for escalation?',
    draftingStyle: 'board heatmap style with exposure rows, controls, owners, and assurance gaps',
    deviceKind: 'corporate-exposure-heatmap',
    reasoningOperation: 'map corporate exposure into sourced heatmap rows and escalation owners',
  }),
  realWorkStarter({
    starterId: 'starter-tool-humanitarian-access-negotiation-checklist',
    category: 'tool',
    domain: 'humanitarian-rights',
    label: 'Humanitarian access negotiation checklist',
    summary: 'A thinking-device capsule for access constraints, parties, assurances, principles, delivery modalities, protection risks, and negotiation asks.',
    detail: 'Use this tool when humanitarian access language needs operational structure without revealing sensitive tactics or making unsafe recommendations.',
    tags: ['humanitarian-access', 'negotiation', 'protection', 'field', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('ocha-access', 'OCHA humanitarian access guidance', 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', 'multilateral', 'UN OCHA', '2026', 'Humanitarian access concepts, constraints, and operating posture.'),
      realWorkSource('sphere-handbook', 'Sphere Handbook', 'https://spherestandards.org/handbook/', 'standard-setter', 'Sphere Association', '2018', 'Humanitarian principles and standards source lane.'),
    ],
    recommendedToolIds: ['stakeholder-map', 'position-vs-interest', 'sourceability'],
    outputProductIds: ['humanitarian-one-pager', 'negotiation-prep-book'],
    combinesWellWith: ['starter-situation-sudan-famine-access-civilian-protection', 'starter-output-humanitarian-donor-sitrep', 'starter-user-un-humanitarian-access-officer'],
    userJob: 'a real work humanitarian access officer preparing a reviewed negotiation brief, not operational instructions',
    realWorkUse: 'Use when access constraints and humanitarian principles must structure a safe brief or donor update.',
    decisionFocus: 'Which access constraint, party, assurance, and risk must be reviewed before an ask is made?',
    draftingStyle: 'access negotiation checklist with principles, actors, risks, asks, and redacted details',
    deviceKind: 'humanitarian-access-negotiation-checklist',
    reasoningOperation: 'structure humanitarian access constraints into reviewable negotiation questions',
  }),
  realWorkStarter({
    starterId: 'starter-tool-scenario-indicator-watchlist',
    category: 'tool',
    domain: 'options-mapping',
    label: 'Scenario indicator watchlist',
    summary: 'A thinking-device capsule for linking scenarios to observable indicators, thresholds, confidence changes, and decision triggers.',
    detail: 'Use this tool when scenario work needs monitorable signals instead of static speculation.',
    tags: ['scenario', 'indicators', 'watchlist', 'monitoring', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('undrr-sendai-framework', 'UNDRR Sendai Framework', 'https://www.undrr.org/publication/sendai-framework-disaster-risk-reduction-2015-2030', 'multilateral', 'UNDRR', '2015', 'Risk monitoring, preparedness, and resilience baseline.'),
      realWorkSource('iea-electricity-grids', 'IEA electricity grids and secure energy transitions', 'https://www.iea.org/reports/electricity-grids-and-secure-energy-transitions', 'multilateral', 'International Energy Agency', '2023', 'Infrastructure bottlenecks and transition indicators source lane.'),
    ],
    recommendedToolIds: ['scenario-projector', 'ach', 'sourceability'],
    outputProductIds: ['scenario-risk-dashboard-card', 'daily-read'],
    combinesWellWith: ['starter-situation-arctic-shipping-minerals-governance', 'starter-output-crisis-daily-senior-brief', 'starter-tool-evidence-freshness-staleness-clock'],
    userJob: 'a real work analyst building a watchlist that tells a team when assumptions or decisions should change',
    realWorkUse: 'Use when scenarios need indicators, thresholds, and source refresh rules attached.',
    decisionFocus: 'Which indicator would make the team update confidence, escalate, or change course?',
    draftingStyle: 'watchlist table with scenario, indicator, source, threshold, and owner',
    deviceKind: 'scenario-indicator-watchlist',
    reasoningOperation: 'connect scenarios to observable indicators and decision triggers',
  }),
  realWorkStarter({
    starterId: 'starter-tool-public-narrative-risk-premortem',
    category: 'tool',
    domain: 'election-integrity',
    label: 'Public narrative risk premortem',
    summary: 'A thinking-device capsule for testing how public messaging, policy claims, or crisis updates could be misunderstood, weaponized, or overclaimed.',
    detail: 'Use this tool before publishing sensitive language on elections, public health, conflict, corporate risk, or humanitarian crises.',
    tags: ['narrative', 'premortem', 'communications', 'misinformation', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('who-rcce', 'WHO risk communication and community engagement resources', 'https://www.who.int/teams/risk-communication', 'multilateral', 'World Health Organization', '2026', 'Risk communication and community trust source lane.'),
      realWorkSource('govuk-content-design', 'GOV.UK content design writing guidance', 'https://www.gov.uk/guidance/content-design/writing-for-gov-uk', 'official', 'UK Government Digital Service', '2026', 'Public-service writing guidance for clarity and user needs.'),
    ],
    recommendedToolIds: ['frame-narrative', 'contradiction-finder', 'sourceability'],
    outputProductIds: ['narrative-monitor', 'talking-points'],
    combinesWellWith: ['starter-situation-public-health-infodemic-emergency-trust', 'starter-output-ministerial-question-period-brief', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work communications, public affairs, or policy lead reviewing how a message could fail before publication',
    realWorkUse: 'Use when public-facing language must be stress-tested for misunderstanding, harm, or unsupported claims.',
    decisionFocus: 'Which phrase, claim, audience, or missing caveat creates narrative risk?',
    draftingStyle: 'premortem table with audience readings, misuse risk, repair language, and approval owner',
    deviceKind: 'public-narrative-risk-premortem',
    reasoningOperation: 'stress-test public narrative risk before drafting or publication',
  }),
  realWorkStarter({
    starterId: 'starter-tool-board-assurance-question-set',
    category: 'tool',
    domain: 'audit-review',
    label: 'Board assurance question set',
    summary: 'A thinking-device capsule for turning risk claims into board-level assurance questions, control owners, evidence asks, and disclosure caveats.',
    detail: 'Use this tool when leadership needs to know what management can substantiate before a board or risk committee discussion.',
    tags: ['board', 'assurance', 'controls', 'risk-committee', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('oecd-corporate-governance', 'OECD corporate governance principles', 'https://www.oecd.org/corporate/principles-corporate-governance/', 'multilateral', 'OECD', '2023', 'Board oversight and governance source lane.'),
      realWorkSource('ifrs-s1-s2', 'IFRS ISSB sustainability and climate disclosure standards', 'https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/', 'standard-setter', 'IFRS Foundation', '2026', 'Investor-material risk and disclosure source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'memo-drafter', 'ach'],
    outputProductIds: ['principals-decision-memo', 'scenario-risk-dashboard-card'],
    combinesWellWith: ['starter-output-board-decision-memo-pack', 'starter-user-corporate-supply-chain-esg-lead', 'starter-tool-corporate-exposure-heatmap'],
    userJob: 'a real work board, risk, or assurance lead converting a claim into questions management can answer',
    realWorkUse: 'Use when a risk claim must become board-safe questions, evidence asks, and control owner tasks.',
    decisionFocus: 'What can the board reasonably rely on, and what assurance or evidence is missing?',
    draftingStyle: 'board assurance checklist with oversight question, evidence, control owner, and caveat',
    deviceKind: 'board-assurance-question-set',
    reasoningOperation: 'convert claims into board assurance questions and owner tasks',
  }),
  realWorkStarter({
    starterId: 'starter-tool-counterparty-ownership-escalation-tree',
    category: 'tool',
    domain: 'exposure-mapping',
    label: 'Counterparty ownership escalation tree',
    summary: 'A thinking-device capsule for sorting counterparty facts, ownership gaps, sanctions screen results, source confidence, and escalation thresholds.',
    detail: 'Use this tool when sanctions, procurement, supplier, or investment work depends on who controls or benefits from a counterparty.',
    tags: ['counterparty', 'ownership', 'sanctions', 'supplier-risk', 'thinking-device', 'review-gated'],
    sourcePack: [
      realWorkSource('ofac-sanctions-list-service', 'OFAC sanctions list service', 'https://ofac.treasury.gov/sanctions-list-service', 'regulator', 'U.S. Treasury OFAC', '2026', 'US sanctions list lookup and screening source lane.'),
      realWorkSource('fatf-risk-based-approach', 'FATF risk-based approach guidance', 'https://www.fatf-gafi.org/en/topics/risk-based-approach.html', 'standard-setter', 'FATF', '2026', 'Financial crime and risk-based review source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'contradiction-finder', 'ach'],
    outputProductIds: ['legal-mandate-compliance-note', 'evidence-sourceability-annex'],
    combinesWellWith: ['starter-user-sanctions-compliance-counsel', 'starter-output-sanctions-exposure-note', 'starter-situation-forced-labor-import-supply-chain-risk'],
    userJob: 'a real work compliance analyst escalating uncertain counterparty ownership, beneficial control, or sanctions exposure',
    realWorkUse: 'Use when ownership and counterparty facts need review before sanctions, procurement, or supplier decisions.',
    decisionFocus: 'Which ownership fact, list result, or control inference triggers escalation?',
    draftingStyle: 'compliance escalation tree with facts, gaps, sources, reviewers, and stop conditions',
    deviceKind: 'counterparty-ownership-escalation-tree',
    reasoningOperation: 'map counterparty ownership evidence into escalation decisions',
  }),
];

const REAL_WORK_OUTPUT_CAPSULES: CapsuleStarterDefinition[] = [
  realWorkStarter({
    starterId: 'starter-output-crisis-daily-senior-brief',
    category: 'output',
    domain: 'output-brief',
    label: 'Crisis daily senior brief output capsule',
    summary: 'A real-work output capsule for concise daily crisis briefs with changes, implications, decisions, source gaps, and watchlist triggers.',
    detail: 'Use this when senior leaders need a short, repeatable brief that preserves what changed, what matters, what is uncertain, and what needs approval.',
    tags: ['daily-brief', 'crisis', 'senior-leaders', 'watchlist', 'drafting-style'],
    sourcePack: [
      realWorkSource('ocha-access', 'OCHA humanitarian access guidance', 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', 'multilateral', 'UN OCHA', '2026', 'Crisis access and operational constraint source lane.'),
      realWorkSource('plain-language-gov', 'Plain language government guidance', 'https://www.plainlanguage.gov/guidelines/', 'official', 'U.S. Plain Language Action and Information Network', '2026', 'Clear public-sector writing baseline.'),
    ],
    recommendedToolIds: ['memo-drafter', 'sourceability', 'scenario-projector'],
    outputProductIds: ['daily-read', 'morning-brief'],
    combinesWellWith: ['starter-tool-evidence-freshness-staleness-clock', 'starter-tool-scenario-indicator-watchlist', 'starter-situation-red-sea-maritime-logistics-risk'],
    userJob: 'a real work crisis team preparing a daily senior brief under time pressure with review gates',
    realWorkUse: 'Use when an agent must produce a senior brief rather than a broad background memo.',
    decisionFocus: 'What changed, why it matters, what decision is needed, and what remains unresolved?',
    draftingStyle: 'daily senior brief with top changes, decision asks, risks, gaps, and watchlist',
  }),
  realWorkStarter({
    starterId: 'starter-output-sanctions-exposure-note',
    category: 'output',
    domain: 'output-brief',
    label: 'Sanctions exposure note output capsule',
    summary: 'A real-work output capsule for sanctions-sensitive notes with facts, regimes, dates, exposure, non-advice caveats, reviewers, and stop conditions.',
    detail: 'Use this when PRAXIS must organize sanctions exposure context for compliance review without providing legal advice.',
    tags: ['sanctions', 'exposure-note', 'compliance', 'non-advice', 'drafting-style'],
    sourcePack: [
      realWorkSource('ofac-framework-compliance', 'OFAC framework for compliance commitments', 'https://ofac.treasury.gov/media/16331/download?inline', 'regulator', 'U.S. Treasury OFAC', '2019', 'US sanctions compliance program source lane.'),
      realWorkSource('eu-sanctions-map', 'EU Sanctions Map', 'https://www.sanctionsmap.eu/', 'official', 'European Union', '2026', 'EU sanctions regime and legal-act source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'ach', 'memo-drafter'],
    outputProductIds: ['legal-mandate-compliance-note', 'evidence-sourceability-annex'],
    combinesWellWith: ['starter-tool-counterparty-ownership-escalation-tree', 'starter-user-sanctions-compliance-counsel', 'starter-situation-forced-labor-import-supply-chain-risk'],
    userJob: 'a real work sanctions compliance reviewer preparing facts and caveats for counsel or control owner review',
    realWorkUse: 'Use when sanctions exposure context needs careful structure, source dates, and non-advice limits.',
    decisionFocus: 'Which regime, counterparty, transaction, source date, and reviewer determine the next step?',
    draftingStyle: 'sanctions compliance note with regime table, facts, caveats, reviewers, and stop conditions',
  }),
  realWorkStarter({
    starterId: 'starter-output-humanitarian-donor-sitrep',
    category: 'output',
    domain: 'output-brief',
    label: 'Humanitarian donor sitrep output capsule',
    summary: 'A real-work output capsule for donor situation reports with needs, access, response, gaps, risks, protection caveats, and asks.',
    detail: 'Use this when a donor-facing humanitarian update needs operational structure and source discipline.',
    tags: ['humanitarian', 'donor', 'sitrep', 'access', 'drafting-style'],
    sourcePack: [
      realWorkSource('ocha-access', 'OCHA humanitarian access guidance', 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', 'multilateral', 'UN OCHA', '2026', 'Humanitarian access and response source lane.'),
      realWorkSource('sphere-handbook', 'Sphere Handbook', 'https://spherestandards.org/handbook/', 'standard-setter', 'Sphere Association', '2018', 'Humanitarian standards and accountability source lane.'),
    ],
    recommendedToolIds: ['memo-drafter', 'sourceability', 'grounded-research'],
    outputProductIds: ['humanitarian-one-pager', 'country-one-pager'],
    combinesWellWith: ['starter-user-un-humanitarian-access-officer', 'starter-tool-humanitarian-access-negotiation-checklist', 'starter-situation-sudan-famine-access-civilian-protection'],
    userJob: 'a real work humanitarian program or donor officer preparing a field-informed sitrep for review',
    realWorkUse: 'Use when a humanitarian update must be concise, sourceable, and operationally safe.',
    decisionFocus: 'What need, access constraint, response gap, risk, or donor ask is supported enough to include?',
    draftingStyle: 'donor sitrep with needs, access, response, gaps, protection, asks, and caveats',
  }),
  realWorkStarter({
    starterId: 'starter-output-board-decision-memo-pack',
    category: 'output',
    domain: 'output-brief',
    label: 'Board decision memo pack output capsule',
    summary: 'A real-work output capsule for board packs with decision ask, exposure map, controls, scenarios, assurance questions, and management actions.',
    detail: 'Use this when corporate or nonprofit leadership needs a board-ready pack that does not overstate assurance or certification.',
    tags: ['board', 'decision-memo', 'risk', 'assurance', 'drafting-style'],
    sourcePack: [
      realWorkSource('oecd-corporate-governance', 'OECD corporate governance principles', 'https://www.oecd.org/corporate/principles-corporate-governance/', 'multilateral', 'OECD', '2023', 'Board oversight and corporate governance baseline.'),
      realWorkSource('plain-language-gov', 'Plain language government guidance', 'https://www.plainlanguage.gov/guidelines/', 'official', 'U.S. Plain Language Action and Information Network', '2026', 'Clear decision-support writing baseline.'),
    ],
    recommendedToolIds: ['memo-drafter', 'sourceability', 'scenario-projector'],
    outputProductIds: ['principals-decision-memo', 'scenario-risk-dashboard-card'],
    combinesWellWith: ['starter-tool-board-assurance-question-set', 'starter-tool-corporate-exposure-heatmap', 'starter-user-corporate-supply-chain-esg-lead'],
    userJob: 'a real work board or executive team preparing a decision memo pack with evidence and assurance caveats',
    realWorkUse: 'Use when a board pack must convert complex policy risk into clear decisions and owner actions.',
    decisionFocus: 'What decision is requested, what evidence supports it, and what assurance remains missing?',
    draftingStyle: 'board pack style with decision ask, exposure, controls, scenarios, assurance, and actions',
  }),
  realWorkStarter({
    starterId: 'starter-output-ministerial-question-period-brief',
    category: 'output',
    domain: 'output-brief',
    label: 'Ministerial question period brief output capsule',
    summary: 'A real-work output capsule for ministerial QP preparation with lines, facts, anticipated questions, risks, bridging language, and source caveats.',
    detail: 'Use this when a public-sector user needs defensible, concise lines that survive scrutiny without hiding uncertainty.',
    tags: ['ministerial', 'question-period', 'talking-points', 'public-sector', 'drafting-style'],
    sourcePack: [
      realWorkSource('plain-language-gov', 'Plain language government guidance', 'https://www.plainlanguage.gov/guidelines/', 'official', 'U.S. Plain Language Action and Information Network', '2026', 'Clear public-sector writing baseline.'),
      realWorkSource('govuk-content-design', 'GOV.UK content design writing guidance', 'https://www.gov.uk/guidance/content-design/writing-for-gov-uk', 'official', 'UK Government Digital Service', '2026', 'Audience-aware government writing source lane.'),
    ],
    recommendedToolIds: ['memo-drafter', 'frame-narrative', 'sourceability'],
    outputProductIds: ['talking-points', 'principals-decision-memo'],
    combinesWellWith: ['starter-tool-public-narrative-risk-premortem', 'starter-user-cabinet-policy-advisor', 'starter-situation-election-observation-information-integrity'],
    userJob: 'a real work ministerial or senior official support team preparing lines for public scrutiny and review',
    realWorkUse: 'Use when a user needs question-period lines, anticipated challenges, and safe caveats.',
    decisionFocus: 'Which line is defensible, which fact needs source support, and which question needs an approved response?',
    draftingStyle: 'ministerial QP brief with approved lines, anticipated questions, bridges, and caveats',
  }),
  realWorkStarter({
    starterId: 'starter-output-policy-implementation-roadmap',
    category: 'output',
    domain: 'output-brief',
    label: 'Policy implementation roadmap output capsule',
    summary: 'A real-work output capsule for implementation plans with owners, sequencing, dependencies, risks, metrics, consultation, and governance gates.',
    detail: 'Use this when a policy decision needs to become a practical roadmap rather than a high-level recommendation.',
    tags: ['implementation', 'roadmap', 'owners', 'governance', 'drafting-style'],
    sourcePack: [
      realWorkSource('oecd-governance', 'OECD public governance resources', 'https://www.oecd.org/governance/', 'multilateral', 'OECD', '2026', 'Public governance and implementation source lane.'),
      realWorkSource('world-bank-procurement', 'World Bank procurement for projects and programs', 'https://www.worldbank.org/en/projects-operations/products-and-services/procurement-projects-programs', 'multilateral', 'World Bank', '2026', 'Project delivery and procurement implementation source lane.'),
    ],
    recommendedToolIds: ['memo-drafter', 'stakeholder-map', 'sourceability'],
    outputProductIds: ['options-memo', 'principals-decision-memo'],
    combinesWellWith: ['starter-tool-policy-option-triage-matrix', 'starter-situation-procurement-integrity-major-projects', 'starter-user-cabinet-policy-advisor'],
    userJob: 'a real work product, policy, or program lead turning a decision into owner actions and delivery gates',
    realWorkUse: 'Use when implementation details, ownership, dependencies, and metrics matter more than policy rhetoric.',
    decisionFocus: 'Who owns each action, what sequence is realistic, and what risk blocks delivery?',
    draftingStyle: 'implementation roadmap with phases, owners, dependencies, metrics, and review gates',
  }),
];

const REAL_WORK_USER_CAPSULES: CapsuleStarterDefinition[] = [
  realWorkStarter({
    starterId: 'starter-user-un-humanitarian-access-officer',
    category: 'user',
    domain: 'analyst-role',
    label: 'UN humanitarian access officer user capsule',
    summary: 'A user-role capsule for humanitarian access officers who need principled, source-backed, operationally safe drafts and review handovers.',
    detail: 'Use this to make PRAXIS answer like an access officer: careful about principles, parties, operational sensitivity, protection, and donor language.',
    tags: ['user-lens', 'humanitarian-access', 'un', 'field', 'principles', 'team:humanitarian'],
    sourcePack: [
      realWorkSource('ocha-access', 'OCHA humanitarian access guidance', 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', 'multilateral', 'UN OCHA', '2026', 'Humanitarian access concepts and constraints source lane.'),
      realWorkSource('sphere-handbook', 'Sphere Handbook', 'https://spherestandards.org/handbook/', 'standard-setter', 'Sphere Association', '2018', 'Humanitarian standards and accountability source lane.'),
    ],
    recommendedToolIds: ['stakeholder-map', 'sourceability', 'memo-drafter'],
    outputProductIds: ['humanitarian-one-pager', 'negotiation-prep-book'],
    combinesWellWith: ['starter-tool-humanitarian-access-negotiation-checklist', 'starter-output-humanitarian-donor-sitrep', 'starter-situation-sudan-famine-access-civilian-protection'],
    userJob: 'a real work field or access officer needing safe, principled, source-backed context for negotiation, donor, or handover work',
    realWorkUse: 'Use when PRAXIS should inherit a humanitarian access role lens and operational caution.',
    decisionFocus: 'What access constraint, principle, party, and protection risk should shape the answer?',
    draftingStyle: 'field access style with principles, operational caveats, source limits, and clear asks',
  }),
  realWorkStarter({
    starterId: 'starter-user-sanctions-compliance-counsel',
    category: 'user',
    domain: 'analyst-role',
    label: 'Sanctions compliance counsel user capsule',
    summary: 'A user-role capsule for sanctions compliance counsel who need source-dated facts, non-advice caveats, escalation rules, and reviewer discipline.',
    detail: 'Use this to make PRAXIS produce compliance-support material that clearly stops short of legal advice and keeps counsel review central.',
    tags: ['user-lens', 'sanctions', 'compliance', 'counsel', 'non-advice', 'team:economic-sanctions'],
    sourcePack: [
      realWorkSource('ofac-framework-compliance', 'OFAC framework for compliance commitments', 'https://ofac.treasury.gov/media/16331/download?inline', 'regulator', 'U.S. Treasury OFAC', '2019', 'US sanctions compliance program source lane.'),
      realWorkSource('eu-sanctions-map', 'EU Sanctions Map', 'https://www.sanctionsmap.eu/', 'official', 'European Union', '2026', 'EU sanctions regime and legal-act source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'contradiction-finder', 'memo-drafter'],
    outputProductIds: ['legal-mandate-compliance-note', 'evidence-sourceability-annex'],
    combinesWellWith: ['starter-tool-counterparty-ownership-escalation-tree', 'starter-output-sanctions-exposure-note', 'starter-situation-forced-labor-import-supply-chain-risk'],
    userJob: 'a real work sanctions compliance counsel reviewing facts, regimes, source dates, and escalation before reliance',
    realWorkUse: 'Use when PRAXIS should operate in counsel-support mode with non-advice boundaries.',
    decisionFocus: 'Which fact, regime, jurisdiction, or counterparty issue requires counsel review?',
    draftingStyle: 'compliance counsel style with facts, regime table, caveats, reviewer notes, and stop conditions',
  }),
  realWorkStarter({
    starterId: 'starter-user-corporate-supply-chain-esg-lead',
    category: 'user',
    domain: 'analyst-role',
    label: 'Corporate supply-chain ESG lead user capsule',
    summary: 'A user-role capsule for supply-chain and ESG leaders balancing due diligence, supplier evidence, board language, and disclosure risk.',
    detail: 'Use this when PRAXIS should answer for a corporate operator who needs practical evidence rows, escalation triggers, and defensible language.',
    tags: ['user-lens', 'corporate', 'supply-chain', 'esg', 'due-diligence', 'team:research-strategy'],
    sourcePack: [
      realWorkSource('oecd-due-diligence-rbc', 'OECD due diligence for responsible business conduct', 'https://www.oecd-ilibrary.org/en/topics/due-diligence-for-responsible-business-conduct.html', 'multilateral', 'OECD', '2026', 'Responsible business conduct and due-diligence source lane.'),
      realWorkSource('ohchr-ungp', 'UN Guiding Principles on Business and Human Rights', 'https://www.ohchr.org/sites/default/files/documents/publications/guidingprinciplesbusinesshr_en.pdf', 'multilateral', 'OHCHR', '2011', 'Business and human-rights due diligence source lane.'),
    ],
    recommendedToolIds: ['sourceability', 'stakeholder-map', 'memo-drafter'],
    outputProductIds: ['principals-decision-memo', 'scenario-risk-dashboard-card'],
    combinesWellWith: ['starter-tool-corporate-exposure-heatmap', 'starter-output-board-decision-memo-pack', 'starter-situation-eastern-drc-minerals-protection-risk'],
    userJob: 'a real work corporate supply-chain ESG lead preparing supplier, board, and due-diligence context for review',
    realWorkUse: 'Use when PRAXIS should balance evidence, due diligence, board communication, and disclosure caveats.',
    decisionFocus: 'Which supplier, issue, evidence gap, leverage path, or disclosure risk needs escalation?',
    draftingStyle: 'corporate ESG decision style with supplier rows, leverage, evidence, and board caveats',
  }),
  realWorkStarter({
    starterId: 'starter-user-cabinet-policy-advisor',
    category: 'user',
    domain: 'analyst-role',
    label: 'Cabinet policy advisor user capsule',
    summary: 'A user-role capsule for cabinet or senior public-sector advisors who need concise options, stakeholder risk, legal boundaries, and implementation realism.',
    detail: 'Use this when PRAXIS should write for a senior advisor preparing advice that can survive clearance, scrutiny, and implementation.',
    tags: ['user-lens', 'cabinet', 'policy-advisor', 'minister', 'implementation', 'team:governance-public-sector'],
    sourcePack: [
      realWorkSource('oecd-governance', 'OECD public governance resources', 'https://www.oecd.org/governance/', 'multilateral', 'OECD', '2026', 'Public governance and implementation context source lane.'),
      realWorkSource('plain-language-gov', 'Plain language government guidance', 'https://www.plainlanguage.gov/guidelines/', 'official', 'U.S. Plain Language Action and Information Network', '2026', 'Clear decision-support writing baseline.'),
    ],
    recommendedToolIds: ['memo-drafter', 'stakeholder-map', 'sourceability'],
    outputProductIds: ['principals-decision-memo', 'talking-points'],
    combinesWellWith: ['starter-tool-policy-option-triage-matrix', 'starter-output-ministerial-question-period-brief', 'starter-output-policy-implementation-roadmap'],
    userJob: 'a real work cabinet policy advisor preparing ministerial advice, implementation options, and scrutiny-safe language',
    realWorkUse: 'Use when PRAXIS should compress complex analysis into advice for a senior decision owner.',
    decisionFocus: 'What decision is required, what options are viable, and what risk or clearance blocks action?',
    draftingStyle: 'ministerial advice style with decision, options, recommendation, risks, implementation, and caveats',
  }),
  realWorkStarter({
    starterId: 'starter-user-investigative-research-analyst',
    category: 'user',
    domain: 'analyst-role',
    label: 'Investigative research analyst user capsule',
    summary: 'A user-role capsule for investigators who need claim-source discipline, allegation thresholds, contradiction checks, and defensible handovers.',
    detail: 'Use this when PRAXIS should behave like a careful research analyst: separate allegations, evidence, verification status, and inference.',
    tags: ['user-lens', 'investigative-research', 'sourceability', 'allegations', 'handover', 'team:research-strategy'],
    sourcePack: [
      realWorkSource('ohchr-library-search', 'OHCHR public reporting library', 'https://searchlibrary.ohchr.org/', 'public-library', 'OHCHR', '2026', 'Human-rights reporting and public source discovery lane.', 2),
      realWorkSource('praxis-claim-source-alignment', 'PRAXIS claim-source alignment method', 'https://praxis.tacitus.me/learn#claim-source-alignment', 'public-library', 'PRAXIS starter catalog', CAPSULE_STARTER_CATALOG_VERSION, 'Review pattern for supported, weak, unsupported, and stale claims.', 3),
    ],
    recommendedToolIds: ['sourceability', 'contradiction-finder', 'grounded-research'],
    outputProductIds: ['evidence-sourceability-annex', 'actor-dossier'],
    combinesWellWith: ['starter-tool-source-reliability-triangulation-ladder', 'starter-situation-election-observation-information-integrity', 'starter-output-crisis-daily-senior-brief'],
    userJob: 'a real work investigative research analyst building source-backed case files and handovers for review',
    realWorkUse: 'Use when PRAXIS must keep allegations, source confidence, contradictions, and inference separate.',
    decisionFocus: 'Which claim is supported, contradicted, stale, or unresolved enough to become a review card?',
    draftingStyle: 'investigative handover style with claim tables, sources, confidence, contradictions, and next evidence',
  }),
  realWorkStarter({
    starterId: 'starter-user-field-program-manager',
    category: 'user',
    domain: 'analyst-role',
    label: 'Field program manager user capsule',
    summary: 'A user-role capsule for field program managers balancing delivery, partner capacity, access, budget, safety, and donor reporting.',
    detail: 'Use this when PRAXIS should convert analysis into practical field actions, risks, resource needs, and reporting language.',
    tags: ['user-lens', 'field', 'program-management', 'donor', 'delivery', 'team:crisis-ops'],
    sourcePack: [
      realWorkSource('ifrc-emergency-needs-assessment', 'IFRC guidelines for emergency needs assessment', 'https://www.ifrc.org/document/guidelines-emergency-needs-assessment', 'multilateral', 'IFRC', '2026', 'Field assessment and operational planning source lane.', 2),
      realWorkSource('sphere-handbook', 'Sphere Handbook', 'https://spherestandards.org/handbook/', 'standard-setter', 'Sphere Association', '2018', 'Humanitarian standards and accountability source lane.'),
    ],
    recommendedToolIds: ['memo-drafter', 'sourceability', 'scenario-projector'],
    outputProductIds: ['humanitarian-one-pager', 'options-memo'],
    combinesWellWith: ['starter-output-humanitarian-donor-sitrep', 'starter-tool-data-gap-interrogatory-builder', 'starter-situation-haiti-security-humanitarian-corridor'],
    userJob: 'a real work field program manager making delivery, partner, safety, and donor-reporting decisions',
    realWorkUse: 'Use when PRAXIS should translate context into field-ready tasks, risks, and reporting gaps.',
    decisionFocus: 'Which delivery bottleneck, partner risk, data gap, or donor ask needs a next action?',
    draftingStyle: 'field program style with actions, owners, risks, resources, evidence gaps, and donor lines',
  }),
];

const REAL_WORK_CONTEXT_CAPSULE_WAVE: CapsuleStarterDefinition[] = [
  ...REAL_WORK_SITUATION_CAPSULES,
  ...REAL_WORK_TOOL_CAPSULES,
  ...REAL_WORK_OUTPUT_CAPSULES,
  ...REAL_WORK_USER_CAPSULES,
];

const EXPERT_POLICY_CAPSULE_WAVE: CapsuleStarterDefinition[] = [
  starter('starter-situation-ukraine-reconstruction-integrity-finance', 'situation', 'finance', 'Ukraine reconstruction integrity finance capsule', 'A reconstruction finance capsule for Ukraine recovery needs, donor facilities, corruption risk, procurement controls, and implementation confidence.', 'Use this when PRAXIS must brief reconstruction financing, donor conditionality, public procurement, corporate delivery risk, or integrity safeguards without flattening humanitarian, macro, and governance claims.', ['ukraine', 'reconstruction', 'integrity', 'donor-finance', 'procurement', 'corporate-risk', 'team:economic-sanctions', 'team:governance-public-sector'], { situationCoreId: 'starter-situation-ukraine-reconstruction-integrity-finance', pathCoreId: 'public-sector-policy', sourceCoreIds: ['world-bank-ukraine-rdna', 'eu-ukraine-facility'], toolCoreIds: ['grounded-research', 'sourceability', 'ach'], outputCoreIds: ['principals-decision-memo'] }, ['grounded-research', 'sourceability', 'ach'], ['principals-decision-memo', 'country-risk-card'], ['starter-tool-sourceability-matrix', 'starter-tool-policy-tradeoff-ledger', 'starter-output-corporate-board-risk-committee-pack'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'world-bank-ukraine-rdna', label: 'World Bank Ukraine recovery and reconstruction needs assessment', url: 'https://www.worldbank.org/en/country/ukraine/publication/updated-ukraine-recovery-and-reconstruction-needs-assessment-released', sourceType: 'multilateral', relevance: 'Primary multilateral baseline for recovery costs, sector damage, and reconstruction needs.', publisher: 'World Bank', date: '2025', reliabilityTier: 1 },
      { id: 'eu-ukraine-facility', label: 'European Commission Ukraine Facility', url: 'https://neighbourhood-enlargement.ec.europa.eu/european-neighbourhood-policy/countries-region/ukraine/ukraine-facility_en', sourceType: 'official', relevance: 'EU financing, reform, investment, and accountability lane for Ukraine recovery support.', publisher: 'European Commission', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'world-bank-ukraine-rdna', text: 'Reconstruction analysis should separate damage estimates, recovery needs, financing gaps, sector assumptions, and the assessment date.' },
      { sourceId: 'eu-ukraine-facility', text: 'Facility claims should identify reform conditions, investment channels, governance controls, and oversight responsibilities before drafting advice.' },
    ],
    suggestedQuestions: ['Which sector, facility, or procurement decision is in scope?', 'What integrity safeguard or corruption-risk claim needs source support?', 'Which donor, company, or ministry audience will use the output?'],
    suggestedNextActions: ['Build a source matrix across RDNA, EU facility, procurement, and audit sources.', 'Run ACH on delivery bottlenecks versus political-risk explanations.', 'Draft a principals memo with funding, integrity, delivery, and evidence gaps separated.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'ukraine-reconstruction-integrity-finance', outputGoal: 'principals-decision-memo', approvalNotes: 'Human review required before statements about corruption, procurement exposure, sanctions, or donor compliance.' },
    aiUseGuidance: 'Treat reconstruction numbers as dated estimates, not facts outside their source window. Keep donor conditions, corporate exposure, procurement integrity, and implementation feasibility separate.',
  }),
  starter('starter-situation-taiwan-strait-semiconductor-supply-chain-risk', 'situation', 'critical-minerals', 'Taiwan Strait semiconductor supply-chain risk capsule', 'A geoeconomic supply-chain capsule for Taiwan Strait tension, semiconductor dependency, rare-earth inputs, shipping exposure, and corporate contingency posture.', 'Use this when a policy or corporate team needs scenario-aware analysis of semiconductor or electronics supply-chain disruption without overstating military forecasts.', ['taiwan-strait', 'semiconductors', 'supply-chain', 'rare-earths', 'geoeconomics', 'corporate-risk', 'team:economic-sanctions', 'team:security-defence'], { situationCoreId: 'starter-situation-taiwan-strait-semiconductor-supply-chain-risk', pathCoreId: 'strategy-operations', sourceCoreIds: ['wto-global-trade-outlook-2026', 'iea-rare-earth-elements-2026'], toolCoreIds: ['scenario-projector', 'sourceability', 'stakeholder-map'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['scenario-projector', 'sourceability', 'stakeholder-map'], ['scenario-risk-dashboard-card', 'principals-decision-memo'], ['starter-tool-geoeconomic-chokepoint-map', 'starter-output-corporate-board-risk-committee-pack', 'starter-situation-critical-minerals-supply-chain'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'wto-global-trade-outlook-2026', label: 'WTO Global Trade Outlook and Statistics 2026', url: 'https://www.wto.org/english/res_e/publications_e/gtos0326_e.htm', sourceType: 'multilateral', relevance: 'Trade baseline for goods, services, policy uncertainty, and trade-flow sensitivity.', publisher: 'World Trade Organization', date: '2026-03', reliabilityTier: 1 },
      { id: 'iea-rare-earth-elements-2026', label: 'IEA Rare Earth Elements analysis', url: 'https://www.iea.org/reports/rare-earth-elements', sourceType: 'multilateral', relevance: 'Critical input risk, supply concentration, and clean-tech manufacturing dependency baseline.', publisher: 'International Energy Agency', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'wto-global-trade-outlook-2026', text: 'Trade-disruption analysis should separate baseline trade forecasts, tariff policy uncertainty, sector exposure, and scenario assumptions.' },
      { sourceId: 'iea-rare-earth-elements-2026', text: 'Rare-earth and strategic-mineral inputs should be treated as source-backed chokepoints, not generic supply-chain risk language.' },
    ],
    suggestedQuestions: ['Which product, supplier tier, geography, or decision horizon is in scope?', 'What exposure depends on Taiwan, rare-earth processing, shipping lanes, or customer demand?', 'Which scenario would trigger board or procurement action?'],
    suggestedNextActions: ['Map chokepoints by component, jurisdiction, and substitute lead time.', 'Create scenario cards with indicators and confidence notes.', 'Draft a board risk pack with source-backed exposure and mitigation options.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'taiwan-strait-semiconductor-supply-chain', outputGoal: 'scenario-risk-dashboard-card', approvalNotes: 'Human review required before operational, market, security, or investment conclusions.' },
    aiUseGuidance: 'Use scenario language and source dates. Do not predict conflict as fact; map exposure, indicators, corporate options, and confidence boundaries.',
  }),
  starter('starter-situation-lebanon-israel-unifil-ceasefire-monitoring', 'situation', 'diplomacy', 'Lebanon-Israel UNIFIL ceasefire monitoring capsule', 'A diplomacy and mandate capsule for UNIFIL, Security Council Resolution 1701, border incidents, de-escalation signals, and humanitarian spillover.', 'Use this when PRAXIS must track a ceasefire, mandate claim, or diplomatic option along the Blue Line with public sources and caveated escalation language.', ['lebanon', 'israel', 'unifil', 'ceasefire', 'mandate', 'blue-line', 'team:diplomatic', 'team:security-defence'], { situationCoreId: 'starter-situation-lebanon-israel-unifil-ceasefire-monitoring', pathCoreId: 'foreign-policy', sourceCoreIds: ['unifil-official', 'unsc-resolution-1701'], toolCoreIds: ['commitment-tracker', 'sourceability', 'scenario-projector'], outputCoreIds: ['legal-mandate-compliance-note'] }, ['commitment-tracker', 'sourceability', 'scenario-projector'], ['legal-mandate-compliance-note', 'talking-points'], ['starter-tool-ceasefire-monitoring-verification-matrix', 'starter-tool-legal-mandate-compliance-lens', 'starter-output-legal-mandate-compliance-note'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'unifil-official', label: 'UNIFIL official mission source', url: 'https://unifil.unmissions.org/', sourceType: 'multilateral', relevance: 'Mission mandate, public statements, and incident posture for Lebanon-Israel monitoring.', publisher: 'United Nations Peacekeeping', date: '2026', reliabilityTier: 1 },
      { id: 'unsc-resolution-1701', label: 'UN Security Council Resolution 1701', url: 'https://undocs.org/S/RES/1701(2006)', sourceType: 'multilateral', relevance: 'Primary mandate text for ceasefire, Blue Line, and state/non-state obligations.', publisher: 'United Nations Security Council', date: '2006', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'unifil-official', text: 'Incident and de-escalation claims should identify whether the source is UNIFIL reporting, party statement, media account, or PRAXIS inference.' },
      { sourceId: 'unsc-resolution-1701', text: 'Mandate analysis must separate controlling text, implementation practice, alleged violations, and legal or policy conclusions.' },
    ],
    suggestedQuestions: ['Which incident, mandate clause, or diplomatic signal is being assessed?', 'What source confirms timing, location, actor, and casualty or damage claims?', 'Does the answer need legal posture, options, or talking points?'],
    suggestedNextActions: ['Build a commitment and incident table with source receipts.', 'Run mandate compliance lens before drafting conclusions.', 'Draft talking points with de-escalation and uncertainty language.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'unifil-ceasefire-monitoring', outputGoal: 'legal-mandate-compliance-note', approvalNotes: 'Human review required before mandate, violation, or escalation findings.' },
    aiUseGuidance: 'Use mandate language carefully. Do not convert incidents into legal findings without sourceability, controlling text, and review.',
  }),
  starter('starter-situation-myanmar-humanitarian-access-asean', 'situation', 'humanitarian-rights', 'Myanmar humanitarian access and ASEAN track capsule', 'A humanitarian and diplomacy capsule for Myanmar access constraints, displacement, protection risk, ASEAN process limits, and cross-border response questions.', 'Use this when PRAXIS needs to distinguish humanitarian access, political process, protection risk, and diplomatic leverage in Myanmar.', ['myanmar', 'humanitarian-access', 'asean', 'displacement', 'protection', 'team:humanitarian', 'team:diplomatic'], { situationCoreId: 'starter-situation-myanmar-humanitarian-access-asean', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['ocha-myanmar', 'asean-five-point-consensus'], toolCoreIds: ['grounded-research', 'sourceability', 'stakeholder-map'], outputCoreIds: ['humanitarian-one-pager'] }, ['grounded-research', 'sourceability', 'stakeholder-map'], ['humanitarian-one-pager', 'principals-decision-memo'], ['starter-tool-joint-fact-finding-source-protocol', 'starter-tool-actor-leverage-veto-map', 'starter-output-humanitarian-access-brief'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'ocha-myanmar', label: 'OCHA Myanmar country operations', url: 'https://www.unocha.org/myanmar', sourceType: 'multilateral', relevance: 'Humanitarian needs, access constraints, and operational response source lane.', publisher: 'UN OCHA', date: '2026', reliabilityTier: 1 },
      { id: 'asean-five-point-consensus', label: 'ASEAN Five-Point Consensus statement', url: 'https://asean.org/wp-content/uploads/Chairmans-Statement-on-the-ASEAN-Leaders-Meeting-24-April-2021-FINAL-a-1.pdf', sourceType: 'official', relevance: 'Diplomatic process baseline for ASEAN engagement, dialogue, and humanitarian assistance commitments.', publisher: 'ASEAN', date: '2021-04', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'ocha-myanmar', text: 'Access analysis should separate humanitarian needs, displacement, operational constraints, safety risk, and response coverage.' },
      { sourceId: 'asean-five-point-consensus', text: 'Diplomatic-process claims should separate agreed principles, implementation progress, blockers, and external actor leverage.' },
    ],
    suggestedQuestions: ['Is the user asking about access, protection, diplomacy, or operational planning?', 'Which population, state or region, and time window are in scope?', 'What source differentiates need from access and response capacity?'],
    suggestedNextActions: ['Build a source pack with OCHA, ASEAN, UNHCR, and local operational updates.', 'Map actors and leverage without assuming private intent.', 'Draft a humanitarian one-pager with access constraints and review gates.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'myanmar-humanitarian-access-asean', outputGoal: 'humanitarian-one-pager', approvalNotes: 'Human review required before protection, legal, or operational recommendations.' },
    aiUseGuidance: 'Do not collapse political-process language into humanitarian access facts. Keep needs, access, protection, and diplomatic claims separate.',
  }),
  starter('starter-situation-ethiopia-protection-conflict-watch', 'situation', 'humanitarian-rights', 'Ethiopia protection and conflict watch capsule', 'A protection-risk capsule for Ethiopia conflict dynamics, access constraints, displacement, human-rights allegations, and cautious accountability language.', 'Use this when PRAXIS must brief Ethiopia conflict or protection issues with source-backed, non-inflammatory, review-gated language.', ['ethiopia', 'protection', 'conflict-watch', 'displacement', 'human-rights', 'team:humanitarian', 'team:human-rights-legal'], { situationCoreId: 'starter-situation-ethiopia-protection-conflict-watch', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['ocha-ethiopia', 'ohchr-ethiopia'], toolCoreIds: ['sourceability', 'contradiction-finder', 'ach'], outputCoreIds: ['evidence-sourceability-annex'] }, ['sourceability', 'contradiction-finder', 'ach'], ['evidence-sourceability-annex', 'humanitarian-one-pager'], ['starter-tool-sourceability-matrix', 'starter-tool-estimative-confidence-calibration-table', 'starter-output-evidence-sourceability-annex'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'ocha-ethiopia', label: 'OCHA Ethiopia country operations', url: 'https://www.unocha.org/ethiopia', sourceType: 'multilateral', relevance: 'Humanitarian needs, access, response, and displacement context for Ethiopia.', publisher: 'UN OCHA', date: '2026', reliabilityTier: 1 },
      { id: 'ohchr-ethiopia', label: 'OHCHR Ethiopia country page', url: 'https://www.ohchr.org/en/countries/ethiopia', sourceType: 'multilateral', relevance: 'Human-rights reporting and accountability source lane.', publisher: 'OHCHR', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'ocha-ethiopia', text: 'Humanitarian claims require current location, population, need, access, and response-source separation.' },
      { sourceId: 'ohchr-ethiopia', text: 'Rights allegations should keep allegation, source, verification status, threshold, and accountability language separate.' },
    ],
    suggestedQuestions: ['Which region, population, or allegation type is in scope?', 'What source verifies incident, need, or rights claim?', 'Does the output need operational, diplomatic, or accountability posture?'],
    suggestedNextActions: ['Create an evidence annex with allegations, sources, confidence, and gaps.', 'Run contradiction finder across humanitarian and rights sources.', 'Draft cautious language with human review gates.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'ethiopia-protection-conflict-watch', outputGoal: 'evidence-sourceability-annex', approvalNotes: 'Human review required before atrocity, rights, or accountability claims.' },
    aiUseGuidance: 'Use cautious sourceability language. Do not infer perpetrators, legal thresholds, or intent without review and primary evidence.',
  }),
  starter('starter-situation-venezuela-oil-sanctions-election-risk', 'situation', 'finance', 'Venezuela oil sanctions and election risk capsule', 'A sanctions and political-economy capsule for Venezuela oil exposure, OFAC posture, electoral risk, licensing assumptions, and corporate compliance caveats.', 'Use this when sanctions, energy exposure, election context, or corporate risk around Venezuela must be separated into legal, market, and policy layers.', ['venezuela', 'oil', 'sanctions', 'election-risk', 'licensing', 'corporate-compliance', 'team:economic-sanctions', 'team:diplomatic'], { situationCoreId: 'starter-situation-venezuela-oil-sanctions-election-risk', pathCoreId: 'economic-sanctions', sourceCoreIds: ['ofac-venezuela-sanctions', 'oas-venezuela'], toolCoreIds: ['sourceability', 'ach', 'memo-drafter'], outputCoreIds: ['legal-mandate-compliance-note'] }, ['sourceability', 'ach', 'memo-drafter'], ['legal-mandate-compliance-note', 'country-risk-card'], ['starter-tool-sanctions-exposure-triage-matrix', 'starter-output-sanctions-compliance-brief-style', 'starter-user-corporate-public-affairs-risk-lead'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'ofac-venezuela-sanctions', label: 'OFAC Venezuela-related sanctions', url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/venezuela-related-sanctions', sourceType: 'regulator', relevance: 'US sanctions program, licenses, and compliance source lane for Venezuela-related exposure.', publisher: 'U.S. Treasury OFAC', date: '2026', reliabilityTier: 1 },
      { id: 'oas-venezuela', label: 'OAS Venezuela topic page', url: 'https://www.oas.org/en/topics/venezuela.asp', sourceType: 'multilateral', relevance: 'Regional institutional source lane for political and democratic context.', publisher: 'Organization of American States', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'ofac-venezuela-sanctions', text: 'Sanctions analysis must separate program authority, license status, entity exposure, transaction facts, and non-advice compliance caveats.' },
      { sourceId: 'oas-venezuela', text: 'Political context should be presented as institutional posture and public reporting, not as a substitute for sanctions-law analysis.' },
    ],
    suggestedQuestions: ['Which entity, transaction, license, or sector is in scope?', 'What election or political assumption affects the risk analysis?', 'Who needs the output: legal, compliance, board, or public affairs?'],
    suggestedNextActions: ['Build a sanctions exposure matrix with source date and license posture.', 'Separate oil-market assumptions from legal compliance claims.', 'Draft a non-advice compliance brief with approval gates.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'venezuela-oil-sanctions-election-risk', outputGoal: 'legal-mandate-compliance-note', approvalNotes: 'Human sanctions/legal review required before exposure or compliance conclusions.' },
    aiUseGuidance: 'Never give legal advice. Treat sanctions references as source-backed context and force human review before compliance, licensing, or transaction conclusions.',
  }),
  starter('starter-situation-china-overcapacity-tariff-industrial-policy', 'situation', 'finance', 'China overcapacity, tariffs, and industrial policy capsule', 'A trade and industrial-policy capsule for overcapacity claims, tariff exposure, supply-chain effects, subsidy allegations, and corporate response options.', 'Use this when a corporation, ministry, or policy team needs a source-backed brief on trade measures and industrial policy without generic decoupling language.', ['china', 'overcapacity', 'tariffs', 'industrial-policy', 'trade-defense', 'corporate-risk', 'team:economic-sanctions', 'team:governance-public-sector'], { situationCoreId: 'starter-situation-china-overcapacity-tariff-industrial-policy', pathCoreId: 'economic-sanctions', sourceCoreIds: ['wto-global-trade-outlook-2026', 'eu-trade-defence'], toolCoreIds: ['grounded-research', 'sourceability', 'frame-narrative'], outputCoreIds: ['principals-decision-memo'] }, ['grounded-research', 'sourceability', 'frame-narrative'], ['principals-decision-memo', 'talking-points'], ['starter-tool-policy-tradeoff-ledger', 'starter-tool-geoeconomic-chokepoint-map', 'starter-output-ministerial-submission-style'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'wto-global-trade-outlook-2026', label: 'WTO Global Trade Outlook and Statistics 2026', url: 'https://www.wto.org/english/res_e/publications_e/gtos0326_e.htm', sourceType: 'multilateral', relevance: 'Trade forecast and policy uncertainty source lane for tariff and fragmentation analysis.', publisher: 'World Trade Organization', date: '2026-03', reliabilityTier: 1 },
      { id: 'eu-trade-defence', label: 'European Commission trade defence', url: 'https://policy.trade.ec.europa.eu/enforcement-and-protection/trade-defence_en', sourceType: 'regulator', relevance: 'Official EU posture for trade defence instruments and procedural framing.', publisher: 'European Commission', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'wto-global-trade-outlook-2026', text: 'Trade-policy analysis should identify baseline forecasts, tariff measures, uncertainty, and sector exposure separately.' },
      { sourceId: 'eu-trade-defence', text: 'Trade-defence claims need procedural posture, instrument type, source date, and affected product scope before conclusions.' },
    ],
    suggestedQuestions: ['Which sector, product code, geography, or tariff measure is in scope?', 'Is the user asking for policy options, corporate exposure, or messaging?', 'Which claim is evidence-backed versus political narrative?'],
    suggestedNextActions: ['Build a tariff and measure timeline with source receipts.', 'Map corporate exposure and substitute options.', 'Draft a ministerial or board memo with tradeoffs and caveats.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'china-overcapacity-tariff-industrial-policy', outputGoal: 'principals-decision-memo', approvalNotes: 'Human review required before trade-law, market, or corporate strategy conclusions.' },
    aiUseGuidance: 'Separate evidence from narrative. Do not overstate causality or legal posture in subsidy, dumping, tariff, or overcapacity claims.',
  }),
  starter('starter-situation-debt-distress-imf-program-watch', 'situation', 'finance', 'Debt distress and IMF program watch capsule', 'A sovereign-debt capsule for IMF program status, debt sustainability, financing gaps, creditor coordination, and social-risk caveats.', 'Use this when PRAXIS needs to brief debt distress, fiscal space, restructuring posture, or IMF program implications for a country or company.', ['debt-distress', 'imf-program', 'fiscal-space', 'creditors', 'country-risk', 'team:economic-sanctions', 'team:climate-development'], { situationCoreId: 'starter-situation-debt-distress-imf-program-watch', pathCoreId: 'economic-sanctions', sourceCoreIds: ['imf-dsa', 'world-bank-debt'], toolCoreIds: ['ach', 'sourceability', 'scenario-projector'], outputCoreIds: ['country-risk-card'] }, ['ach', 'sourceability', 'scenario-projector'], ['country-risk-card', 'principals-decision-memo'], ['starter-tool-fiscal-space-debt-stress-screen', 'starter-output-corporate-board-risk-committee-pack', 'starter-user-multilateral-desk-officer'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'imf-dsa', label: 'IMF debt sustainability analysis resources', url: 'https://www.imf.org/en/Publications/DSA', sourceType: 'multilateral', relevance: 'Primary IMF lane for debt sustainability analysis and program-related assumptions.', publisher: 'International Monetary Fund', date: '2026', reliabilityTier: 1 },
      { id: 'world-bank-debt', label: 'World Bank international debt statistics', url: 'https://www.worldbank.org/en/programs/debt-statistics', sourceType: 'multilateral', relevance: 'External debt, creditor exposure, and country debt-data source lane.', publisher: 'World Bank', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'imf-dsa', text: 'Debt-program analysis should separate IMF program status, assumptions, risks, and stress tests from PRAXIS judgment.' },
      { sourceId: 'world-bank-debt', text: 'Debt exposure claims should identify indicator date, creditor category, currency, and data-source limitations.' },
    ],
    suggestedQuestions: ['Which country, creditor, program review, or financing gap matters?', 'What date controls the debt and macro indicators?', 'What decision depends on the fiscal-space judgment?'],
    suggestedNextActions: ['Run fiscal-space stress screen with dated indicators.', 'Use ACH for alternative explanations of stress.', 'Draft a country-risk card with social, creditor, and program caveats.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'debt-distress-imf-program-watch', outputGoal: 'country-risk-card', approvalNotes: 'Human financial and policy review required before investment, lending, or restructuring conclusions.' },
    aiUseGuidance: 'Do not provide investment advice. Use dated macro and debt sources, show assumptions, and distinguish official program language from analysis.',
  }),
  starter('starter-situation-corporate-ai-procurement-assurance', 'situation', 'ai-governance', 'Corporate AI procurement assurance capsule', 'A corporate AI procurement capsule for vendor claims, model-risk controls, assurance artifacts, privacy posture, and board-ready decision gates.', 'Use this when a company or public buyer is evaluating AI tools, agents, or model services and needs source-backed governance rather than vendor marketing language.', ['corporate-ai', 'procurement', 'vendor-risk', 'assurance', 'privacy', 'board-risk', 'team:governance-public-sector', 'team:research-strategy'], { situationCoreId: 'starter-situation-corporate-ai-procurement-assurance', pathCoreId: 'governance-public-sector', sourceCoreIds: ['nist-ai-rmf', 'oecd-ai-principles'], toolCoreIds: ['sourceability', 'contradiction-finder', 'memo-drafter'], outputCoreIds: ['principals-decision-memo'] }, ['sourceability', 'contradiction-finder', 'memo-drafter'], ['principals-decision-memo', 'legal-mandate-compliance-note'], ['starter-tool-corporate-value-chain-due-diligence-map', 'starter-output-corporate-board-risk-committee-pack', 'starter-situation-us-federal-ai-governance-baseline'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'nist-ai-rmf', label: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', sourceType: 'official', relevance: 'Trustworthy AI risk framing and controls source lane.', publisher: 'NIST', date: '2023', reliabilityTier: 1 },
      { id: 'oecd-ai-principles', label: 'OECD AI Principles', url: 'https://www.oecd-ilibrary.org/en/topics/ai-principles.html', sourceType: 'multilateral', relevance: 'International principles for trustworthy AI policy and governance.', publisher: 'OECD', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'nist-ai-rmf', text: 'AI procurement should turn vendor claims into map, measure, manage, and govern checks before approval.' },
      { sourceId: 'oecd-ai-principles', text: 'AI governance analysis should keep accountability, transparency, robustness, and human-centered values visible.' },
    ],
    suggestedQuestions: ['What AI use case, vendor, data, and decision rights are in scope?', 'Which vendor claim lacks evidence or assurance artifact?', 'What board, procurement, privacy, or legal gate controls approval?'],
    suggestedNextActions: ['Build a vendor claim-source matrix.', 'Run contradiction finder on marketing, contract, security, and model-card claims.', 'Draft a board decision memo with stop conditions and review gates.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'corporate-ai-procurement-assurance', outputGoal: 'principals-decision-memo', approvalNotes: 'Human governance, privacy, security, and legal review required before procurement recommendation.' },
    aiUseGuidance: 'Treat vendor assertions as untrusted until sourced. Do not certify safety, compliance, accuracy, privacy, or fairness.',
  }),
  starter('starter-situation-food-security-commodity-shock-watch', 'situation', 'humanitarian-rights', 'Food security and commodity shock watch capsule', 'A food-security capsule for commodity prices, humanitarian need, import exposure, livelihoods, and operational response triggers.', 'Use this when PRAXIS must connect macro commodity shocks to food security, humanitarian planning, or public-policy options.', ['food-security', 'commodity-shock', 'prices', 'livelihoods', 'humanitarian', 'team:humanitarian', 'team:economic-sanctions'], { situationCoreId: 'starter-situation-food-security-commodity-shock-watch', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['fao-food-price-index', 'wfp-hunger-map'], toolCoreIds: ['grounded-research', 'scenario-projector', 'sourceability'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['grounded-research', 'scenario-projector', 'sourceability'], ['scenario-risk-dashboard-card', 'humanitarian-one-pager'], ['starter-tool-fiscal-space-debt-stress-screen', 'starter-output-scenario-risk-dashboard-card', 'starter-user-multilateral-desk-officer'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'fao-food-price-index', label: 'FAO Food Price Index', url: 'https://www.fao.org/worldfoodsituation/foodpricesindex/en/', sourceType: 'multilateral', relevance: 'Commodity-price and food-market baseline for shocks and trends.', publisher: 'Food and Agriculture Organization', date: '2026', reliabilityTier: 1 },
      { id: 'wfp-hunger-map', label: 'WFP HungerMapLIVE', url: 'https://hungermap.wfp.org/', sourceType: 'multilateral', relevance: 'Food-security monitoring, hunger indicators, and operational risk context.', publisher: 'World Food Programme', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'fao-food-price-index', text: 'Commodity shock analysis should separate global price movement, local pass-through, import exposure, and source date.' },
      { sourceId: 'wfp-hunger-map', text: 'Humanitarian food-security claims need current needs, geography, population, and response-source context.' },
    ],
    suggestedQuestions: ['Which commodity, country, population, and decision window are in scope?', 'Is the user asking for humanitarian response, fiscal policy, or corporate exposure?', 'Which indicator would trigger escalation or support?'],
    suggestedNextActions: ['Build a dashboard with price, import, and food-security indicators.', 'Map fiscal and operational response options.', 'Draft a humanitarian or policy one-pager with confidence and source gaps.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'food-security-commodity-shock-watch', outputGoal: 'scenario-risk-dashboard-card', approvalNotes: 'Human review required before operational, market, or public-health recommendations.' },
    aiUseGuidance: 'Do not infer hunger outcomes from price data alone. Keep market, import, household, and response indicators separate.',
  }),
  starter('starter-tool-sanctions-exposure-triage-matrix', 'tool', 'exposure-mapping', 'Sanctions exposure triage matrix', 'A review-gated tool capsule for mapping parties, regimes, lists, ownership, transactions, licenses, and red-flag source gaps.', 'Use this before any sanctions-sensitive memo, transaction review, corporate exposure note, or public affairs response.', ['sanctions', 'exposure', 'triage', 'compliance', 'thinking-device', 'review-gated', 'corporate-risk', 'team:economic-sanctions'], { toolCoreIds: ['sourceability', 'ach', 'memo-drafter'], objectiveCoreIds: ['build-sanctions-exposure-triage'], sourceCoreIds: ['ofac-sanctions-list-service', 'eu-sanctions-map'], outputCoreIds: ['legal-mandate-compliance-note'] }, ['sourceability', 'ach', 'memo-drafter'], ['legal-mandate-compliance-note', 'evidence-sourceability-annex'], ['starter-situation-venezuela-oil-sanctions-election-risk', 'starter-output-sanctions-compliance-brief-style', 'starter-tool-legal-mandate-compliance-lens'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'ofac-sanctions-list-service', label: 'OFAC Sanctions List Service', url: 'https://ofac.treasury.gov/sanctions-list-service', sourceType: 'regulator', relevance: 'US sanctions list data and update source for exposure triage.', publisher: 'U.S. Treasury OFAC', date: '2026', reliabilityTier: 1 },
      { id: 'eu-sanctions-map', label: 'EU Sanctions Map', url: 'https://www.sanctionsmap.eu/', sourceType: 'official', relevance: 'EU restrictive-measures source lane by regime, actor, and legal act.', publisher: 'European Union', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'ofac-sanctions-list-service', text: 'Exposure triage must use current list data and preserve list date, party identity, aliases, ownership, and license assumptions.' },
      { sourceId: 'eu-sanctions-map', text: 'EU sanctions posture should cite regime, legal act, affected parties, and measure type before conclusions.' },
    ],
    suggestedQuestions: ['Which entity, beneficial owner, transaction, good, service, or jurisdiction is in scope?', 'Which sanctions regime and list date controls the review?', 'What human legal or compliance gate is required?'],
    suggestedNextActions: ['Create triage rows for party, regime, source, transaction, license, uncertainty, and reviewer.', 'Mark inferred ownership separately from sourced ownership.', 'Draft a non-advice compliance note with unresolved gaps.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'sanctions-exposure-triage-matrix', outputGoal: 'legal-mandate-compliance-note', approvalNotes: 'Human sanctions counsel or compliance reviewer required before reliance.' },
    aiUseGuidance: 'Use only as triage support. Never provide legal advice or final sanctions determinations; route uncertain items to human review.',
    deviceProfile: buildStarterDeviceProfile('Sanctions exposure triage matrix', { deviceKind: 'sanctions-exposure-triage' }),
  }),
  starter('starter-tool-corporate-value-chain-due-diligence-map', 'tool', 'policy-review', 'Corporate value-chain due diligence map', 'A corporate-responsibility tool capsule for mapping value-chain risks, adverse impacts, leverage, remediation, and evidence gaps.', 'Use this when a company, investor, or policy team needs OECD/UNGP-style due diligence before drafting public or board language.', ['corporate', 'value-chain', 'due-diligence', 'human-rights', 'sustainability', 'thinking-device', 'review-gated', 'team:governance-public-sector'], { toolCoreIds: ['sourceability', 'stakeholder-map', 'memo-drafter'], objectiveCoreIds: ['map-corporate-value-chain-due-diligence'], sourceCoreIds: ['oecd-due-diligence-rbc', 'ohchr-ungp'], outputCoreIds: ['principals-decision-memo'] }, ['sourceability', 'stakeholder-map', 'memo-drafter'], ['principals-decision-memo', 'evidence-sourceability-annex'], ['starter-situation-corporate-ai-procurement-assurance', 'starter-output-corporate-board-risk-committee-pack', 'starter-user-corporate-public-affairs-risk-lead'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'oecd-due-diligence-rbc', label: 'OECD Due Diligence Guidance for Responsible Business Conduct', url: 'https://www.oecd-ilibrary.org/en/topics/due-diligence-for-responsible-business-conduct.html', sourceType: 'multilateral', relevance: 'Risk-based due diligence framework for corporate value chains.', publisher: 'OECD', date: '2026', reliabilityTier: 1 },
      { id: 'ohchr-ungp', label: 'OHCHR UN Guiding Principles on Business and Human Rights', url: 'https://www.ohchr.org/sites/default/files/documents/publications/guidingprinciplesbusinesshr_en.pdf', sourceType: 'multilateral', relevance: 'Protect, respect, and remedy baseline for business and human-rights risk.', publisher: 'OHCHR', date: '2011', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'oecd-due-diligence-rbc', text: 'Due-diligence mapping should identify risk, severity, leverage, mitigation, tracking, communication, and remediation posture.' },
      { sourceId: 'ohchr-ungp', text: 'Corporate human-rights analysis should separate responsibility to respect, state duty, remedy channels, and public-claim limits.' },
    ],
    suggestedQuestions: ['Which value-chain tier, supplier, geography, product, or adverse impact is in scope?', 'What leverage or remedy option is available?', 'What can the company safely say before human review?'],
    suggestedNextActions: ['Map actors, impacts, leverage, evidence, and remediation gaps.', 'Separate sourced adverse-impact claims from risk hypotheses.', 'Draft a board-ready due-diligence memo with sourceability annex.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'corporate-value-chain-due-diligence-map', outputGoal: 'principals-decision-memo', approvalNotes: 'Human legal, sustainability, and communications review required before external claims.' },
    aiUseGuidance: 'Do not certify due diligence or compliance. Treat this as a source-backed map for human experts and decision owners.',
    deviceProfile: buildStarterDeviceProfile('Corporate value-chain due diligence map', { deviceKind: 'value-chain-due-diligence-map' }),
  }),
  starter('starter-tool-fiscal-space-debt-stress-screen', 'tool', 'exposure-mapping', 'Fiscal space and debt stress screen', 'A macro-policy tool capsule for testing fiscal space, debt stress, external financing, social tradeoffs, and data freshness.', 'Use this before country-risk cards, IMF program briefs, budget support memos, or corporate sovereign-exposure notes.', ['fiscal-space', 'debt-stress', 'country-risk', 'macro', 'thinking-device', 'review-gated', 'team:economic-sanctions'], { toolCoreIds: ['ach', 'sourceability', 'scenario-projector'], objectiveCoreIds: ['screen-fiscal-space-debt-stress'], sourceCoreIds: ['imf-dsa', 'world-bank-debt'], outputCoreIds: ['country-risk-card'] }, ['ach', 'sourceability', 'scenario-projector'], ['country-risk-card', 'scenario-risk-dashboard-card'], ['starter-situation-debt-distress-imf-program-watch', 'starter-situation-food-security-commodity-shock-watch', 'starter-output-corporate-board-risk-committee-pack'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'imf-dsa', label: 'IMF debt sustainability analysis resources', url: 'https://www.imf.org/en/Publications/DSA', sourceType: 'multilateral', relevance: 'Debt sustainability source lane for fiscal stress assumptions.', publisher: 'International Monetary Fund', date: '2026', reliabilityTier: 1 },
      { id: 'world-bank-debt', label: 'World Bank international debt statistics', url: 'https://www.worldbank.org/en/programs/debt-statistics', sourceType: 'multilateral', relevance: 'Debt stock, flow, creditor, and country exposure data lane.', publisher: 'World Bank', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'imf-dsa', text: 'Fiscal-space screening should separate baseline, stress, uncertainty, policy adjustment, and program assumptions.' },
      { sourceId: 'world-bank-debt', text: 'Debt-stress claims need dated creditor, currency, maturity, and external-financing evidence.' },
    ],
    suggestedQuestions: ['Which country, budget line, creditor, or shock is in scope?', 'What social or political tradeoff affects the fiscal-space judgment?', 'What data is stale or missing?'],
    suggestedNextActions: ['Build a fiscal stress table with indicators, source dates, and assumptions.', 'Run ACH against alternative stress explanations.', 'Attach results to a country-risk card or dashboard.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'fiscal-space-debt-stress-screen', outputGoal: 'country-risk-card', approvalNotes: 'Human macro/finance review required before lending, investment, or fiscal recommendation.' },
    aiUseGuidance: 'Do not infer solvency or investment action. Use dated indicators and show assumptions, uncertainty, and policy tradeoffs.',
    deviceProfile: buildStarterDeviceProfile('Fiscal space and debt stress screen', { deviceKind: 'fiscal-space-debt-stress-screen' }),
  }),
  starter('starter-tool-geoeconomic-chokepoint-map', 'tool', 'options-mapping', 'Geoeconomic chokepoint map', 'A strategy tool capsule for mapping trade, minerals, shipping, technology, sanctions, and supplier chokepoints into decision options.', 'Use this when a policy or corporate team must turn geopolitical exposure into concrete options and indicators.', ['geoeconomics', 'chokepoints', 'trade', 'technology', 'supply-chain', 'thinking-device', 'review-gated', 'team:economic-sanctions'], { toolCoreIds: ['stakeholder-map', 'scenario-projector', 'sourceability'], objectiveCoreIds: ['map-geoeconomic-chokepoints'], sourceCoreIds: ['wto-global-trade-outlook-2026', 'iea-rare-earth-elements-2026'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['stakeholder-map', 'scenario-projector', 'sourceability'], ['scenario-risk-dashboard-card', 'principals-decision-memo'], ['starter-situation-taiwan-strait-semiconductor-supply-chain-risk', 'starter-situation-china-overcapacity-tariff-industrial-policy', 'starter-output-corporate-board-risk-committee-pack'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'wto-global-trade-outlook-2026', label: 'WTO Global Trade Outlook and Statistics 2026', url: 'https://www.wto.org/english/res_e/publications_e/gtos0326_e.htm', sourceType: 'multilateral', relevance: 'Trade and policy uncertainty baseline for geoeconomic exposure.', publisher: 'World Trade Organization', date: '2026-03', reliabilityTier: 1 },
      { id: 'iea-critical-minerals', label: 'IEA critical minerals analysis', url: 'https://www.iea.org/topics/critical-minerals', sourceType: 'multilateral', relevance: 'Strategic mineral demand, concentration, and energy-transition dependency baseline.', publisher: 'International Energy Agency', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'wto-global-trade-outlook-2026', text: 'Chokepoint mapping should separate trade-policy uncertainty, tariff measures, route exposure, and scenario assumptions.' },
      { sourceId: 'iea-critical-minerals', text: 'Critical-mineral chokepoints require material, processing, jurisdiction, demand, and substitute lead-time distinctions.' },
    ],
    suggestedQuestions: ['Which material, technology, shipping route, supplier, or sanctions regime is the chokepoint?', 'What decision changes if the chokepoint closes or tightens?', 'What indicators would warn early enough to act?'],
    suggestedNextActions: ['Map chokepoints by actor, source, substitute, lead time, and decision option.', 'Create scenario indicators with confidence and source dates.', 'Draft board or principals options with mitigations and tradeoffs.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'geoeconomic-chokepoint-map', outputGoal: 'scenario-risk-dashboard-card', approvalNotes: 'Human review required before operational, trade, investment, or sanctions recommendations.' },
    aiUseGuidance: 'Use as exposure mapping, not prediction. Label every causal link and option as sourced, inferred, or uncertain.',
    deviceProfile: buildStarterDeviceProfile('Geoeconomic chokepoint map', { deviceKind: 'geoeconomic-chokepoint-map' }),
  }),
  starter('starter-tool-policy-drafting-style-selector', 'tool', 'output-brief', 'Policy drafting style selector', 'A drafting tool capsule for selecting ministerial, board, diplomatic, legal, humanitarian, public-affairs, or technical memo style with caveats preserved.', 'Use this when the same analysis must be converted into the right artifact language for a specific policy situation or corporate audience.', ['drafting-style', 'memo-writing', 'audience', 'policy-product', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['memo-drafter', 'frame-narrative', 'sourceability'], objectiveCoreIds: ['select-policy-drafting-style'], outputCoreIds: ['principals-decision-memo'] }, ['memo-drafter', 'frame-narrative', 'sourceability'], ['principals-decision-memo', 'talking-points'], ['starter-output-ministerial-submission-style', 'starter-output-corporate-board-risk-committee-pack', 'starter-output-sanctions-compliance-brief-style'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'plain-language-gov', label: 'Plain language government guidance', url: 'https://www.plainlanguage.gov/guidelines/', sourceType: 'official', relevance: 'Clear public-sector writing baseline for concise, usable policy text.', publisher: 'U.S. Plain Language Action and Information Network', date: '2026', reliabilityTier: 1 },
      { id: 'govuk-content-design', label: 'GOV.UK content design writing guidance', url: 'https://www.gov.uk/guidance/content-design/writing-for-gov-uk', sourceType: 'official', relevance: 'Public-service writing guidance for audience, structure, and action-oriented text.', publisher: 'UK Government Digital Service', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'plain-language-gov', text: 'Drafting style should make the decision, audience, action, caveat, and source posture clear.' },
      { sourceId: 'govuk-content-design', text: 'Audience-specific writing should preserve the user need while removing unnecessary complexity and ambiguity.' },
    ],
    suggestedQuestions: ['Who is the decision owner and what format will they accept?', 'Which caveats must survive compression?', 'Is the output ministerial, board, diplomatic, legal, humanitarian, public, or technical?'],
    suggestedNextActions: ['Choose drafting style before generating the final product.', 'Rewrite with required sections, tone, caveats, and source posture.', 'Send sensitive claims to human review before export.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'policy-drafting-style-selector', outputGoal: 'principals-decision-memo', approvalNotes: 'Human review required before public, legal, board, or ministerial use.' },
    aiUseGuidance: 'Use this to adapt style without changing substance. Preserve caveats, source limits, assumptions, and approval gates.',
    deviceProfile: buildStarterDeviceProfile('Policy drafting style selector', { deviceKind: 'policy-drafting-style-selector' }),
  }),
  starter('starter-output-ministerial-submission-style', 'output', 'output-brief', 'Ministerial submission style output capsule', 'An output capsule for ministerial submissions with decision, background, options, recommended line, risks, consultation, and implementation posture.', 'Use this when PRAXIS needs a public-sector decision product that is concise, source-backed, and safe for senior official review.', ['ministerial-submission', 'public-sector', 'decision-brief', 'implementation', 'drafting-style', 'team:governance-public-sector'], { outputCoreIds: ['principals-decision-memo'], productCoreIds: ['principals-decision-memo'], objectiveCoreIds: ['draft-ministerial-submission-style'] }, ['memo-drafter', 'sourceability', 'frame-narrative'], ['principals-decision-memo', 'talking-points'], ['starter-tool-policy-drafting-style-selector', 'starter-situation-china-overcapacity-tariff-industrial-policy', 'starter-user-multilateral-desk-officer'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'plain-language-gov', label: 'Plain language government guidance', url: 'https://www.plainlanguage.gov/guidelines/', sourceType: 'official', relevance: 'Clarity and decision-support writing baseline for public-sector outputs.', publisher: 'U.S. Plain Language Action and Information Network', date: '2026', reliabilityTier: 1 },
      { id: 'oecd-governance', label: 'OECD public governance resources', url: 'https://www.oecd.org/governance/', sourceType: 'multilateral', relevance: 'Public governance context for policy decision products and implementation limits.', publisher: 'OECD', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'plain-language-gov', text: 'Ministerial text should make the decision, rationale, risks, and next action easy to find.' },
      { sourceId: 'oecd-governance', text: 'Public-sector options should identify institutional capacity, affected stakeholders, and implementation constraints.' },
    ],
    suggestedQuestions: ['What decision does the minister or principal need to take?', 'Which options are viable and what is the recommended line?', 'What source gap or consultation risk blocks clearance?'],
    suggestedNextActions: ['Draft decision, background, options, recommendation, risks, and implementation sections.', 'Attach sourceability annex for contested claims.', 'Run human clearance before external or ministerial use.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'ministerial-submission-style', outputGoal: 'principals-decision-memo', approvalNotes: 'Human official, legal, and policy clearance required before use.' },
    aiUseGuidance: 'Use concise public-sector language. Do not hide uncertainty or consultation gaps to make the recommendation sound cleaner.',
  }),
  starter('starter-output-corporate-board-risk-committee-pack', 'output', 'output-brief', 'Corporate board risk committee pack output capsule', 'An output capsule for board risk committees with decision asks, exposure map, controls, scenarios, accountability, and assurance gaps.', 'Use this when a corporate or investor audience needs policy-risk analysis in board-ready language without pretending PRAXIS has certified controls.', ['board-risk', 'corporate', 'risk-committee', 'assurance', 'controls', 'drafting-style', 'team:research-strategy'], { outputCoreIds: ['principals-decision-memo', 'scenario-risk-dashboard-card'], productCoreIds: ['principals-decision-memo'], objectiveCoreIds: ['draft-board-risk-committee-pack'] }, ['memo-drafter', 'sourceability', 'scenario-projector'], ['principals-decision-memo', 'scenario-risk-dashboard-card'], ['starter-tool-policy-drafting-style-selector', 'starter-situation-corporate-ai-procurement-assurance', 'starter-user-corporate-public-affairs-risk-lead'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'oecd-corporate-governance', label: 'OECD corporate governance principles', url: 'https://www.oecd.org/corporate/principles-corporate-governance/', sourceType: 'multilateral', relevance: 'Board oversight and governance baseline for risk-committee style outputs.', publisher: 'OECD', date: '2023', reliabilityTier: 1 },
      { id: 'ifrs-s1-s2', label: 'IFRS ISSB sustainability disclosure standards', url: 'https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/', sourceType: 'standard-setter', relevance: 'Disclosure and investor-material risk baseline for board-facing packs.', publisher: 'IFRS Foundation', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'oecd-corporate-governance', text: 'Board packs should show oversight question, accountability owner, risk exposure, and decision needed.' },
      { sourceId: 'ifrs-s1-s2', text: 'Investor-material risk language should preserve controls, metrics, assumptions, and disclosure boundaries.' },
    ],
    suggestedQuestions: ['What decision, oversight question, or risk appetite issue is before the board?', 'Which exposure, control, scenario, or assurance gap matters most?', 'What can management say without over-claiming?'],
    suggestedNextActions: ['Draft decision ask, risk map, controls, scenarios, gaps, and management actions.', 'Attach source and evidence annex.', 'Route assurance and disclosure claims to human review.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'corporate-board-risk-committee-pack', outputGoal: 'principals-decision-memo', approvalNotes: 'Human legal, disclosure, assurance, and executive review required before board use.' },
    aiUseGuidance: 'Use board-ready language without certification. Keep risk, control, owner, evidence, and action clear.',
  }),
  starter('starter-output-sanctions-compliance-brief-style', 'output', 'output-brief', 'Sanctions compliance brief style output capsule', 'An output capsule for sanctions-sensitive briefs with non-advice caveats, regime table, exposure facts, source dates, reviewer notes, and stop conditions.', 'Use this when a sanctions, export, or counterparty-risk analysis needs a carefully bounded compliance-style output.', ['sanctions', 'compliance-brief', 'non-advice', 'review-gate', 'drafting-style', 'team:economic-sanctions'], { outputCoreIds: ['legal-mandate-compliance-note', 'evidence-sourceability-annex'], productCoreIds: ['legal-mandate-compliance-note'], objectiveCoreIds: ['draft-sanctions-compliance-brief-style'] }, ['memo-drafter', 'sourceability', 'ach'], ['legal-mandate-compliance-note', 'evidence-sourceability-annex'], ['starter-tool-sanctions-exposure-triage-matrix', 'starter-situation-venezuela-oil-sanctions-election-risk', 'starter-tool-legal-mandate-compliance-lens'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'ofac-framework-compliance', label: 'OFAC framework for compliance commitments', url: 'https://ofac.treasury.gov/media/16331/download?inline', sourceType: 'regulator', relevance: 'US sanctions compliance program source lane.', publisher: 'U.S. Treasury OFAC', date: '2019', reliabilityTier: 1 },
      { id: 'eu-sanctions-map', label: 'EU Sanctions Map', url: 'https://www.sanctionsmap.eu/', sourceType: 'official', relevance: 'EU sanctions regime and legal-act source lane.', publisher: 'European Union', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'ofac-framework-compliance', text: 'Compliance-style output should separate facts, source dates, risk indicators, reviewer notes, and non-advice caveats.' },
      { sourceId: 'eu-sanctions-map', text: 'EU sanctions language should cite regime and measure type rather than generalizing across restrictive measures.' },
    ],
    suggestedQuestions: ['Which regime, entity, transaction, and jurisdiction are in scope?', 'What facts are known versus assumed?', 'Who must review before reliance?'],
    suggestedNextActions: ['Draft regime table, exposure facts, sources, gaps, and stop conditions.', 'Add non-advice caveat and reviewer note.', 'Block finalization until human sanctions review.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'sanctions-compliance-brief-style', outputGoal: 'legal-mandate-compliance-note', approvalNotes: 'Human sanctions/legal review required before reliance or distribution.' },
    aiUseGuidance: 'Use compliance style, not legal advice. Every exposure claim needs source, date, uncertainty, and review owner.',
  }),
  starter('starter-user-corporate-public-affairs-risk-lead', 'user', 'analyst-role', 'Corporate public affairs risk lead user capsule', 'A user capsule for corporate public affairs leaders balancing policy risk, regulatory exposure, board language, sustainability claims, and reputation constraints.', 'Use this when PRAXIS should answer for a corporate policy, public affairs, sustainability, or risk leader who needs defensible language and escalation triggers.', ['corporate', 'public-affairs', 'board-risk', 'reputation', 'regulatory', 'user-lens', 'team:research-strategy'], { userCoreId: 'starter-user-corporate-public-affairs-risk-lead', toolCoreIds: ['memo-drafter', 'sourceability', 'frame-narrative'], outputCoreIds: ['principals-decision-memo'] }, ['memo-drafter', 'sourceability', 'frame-narrative'], ['principals-decision-memo', 'talking-points'], ['starter-output-corporate-board-risk-committee-pack', 'starter-tool-corporate-value-chain-due-diligence-map', 'starter-situation-corporate-ai-procurement-assurance'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'oecd-due-diligence-rbc', label: 'OECD Due Diligence Guidance for Responsible Business Conduct', url: 'https://www.oecd-ilibrary.org/en/topics/due-diligence-for-responsible-business-conduct.html', sourceType: 'multilateral', relevance: 'Corporate due-diligence baseline for public-affairs and risk language.', publisher: 'OECD', date: '2026', reliabilityTier: 1 },
      { id: 'eu-csrd-esrs', label: 'European Commission corporate sustainability reporting', url: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en', sourceType: 'regulator', relevance: 'Sustainability reporting and disclosure context for corporate claims.', publisher: 'European Commission', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'oecd-due-diligence-rbc', text: 'Corporate public-affairs language should preserve due-diligence limits, leverage, remediation, and evidence gaps.' },
      { sourceId: 'eu-csrd-esrs', text: 'Sustainability and risk claims should remain consistent with disclosure boundaries and assurance posture.' },
    ],
    suggestedQuestions: ['Is the user asking for board language, public line, regulator posture, or internal escalation?', 'Which claim could create legal, disclosure, or reputation risk?', 'What evidence or approval is missing?'],
    suggestedNextActions: ['Select board, public, or regulator drafting style.', 'Attach sourceability and review notes to risky claims.', 'Escalate legal, disclosure, and sanctions questions to human review.'],
    agentWorkflow: { preferredAgentId: 'handover-builder', routeHint: 'corporate-public-affairs-risk-lead', outputGoal: 'principals-decision-memo', approvalNotes: 'Human legal, disclosure, and communications review required before external language.' },
    aiUseGuidance: 'Favor defensible, source-backed language. Avoid over-promising, greenwashing, legal conclusions, or unreviewed public claims.',
  }),
  starter('starter-user-multilateral-desk-officer', 'user', 'analyst-role', 'Multilateral desk officer user capsule', 'A user capsule for UN, IFI, regional-organization, or diplomatic desk officers who need mandate-aware, source-backed, cautious policy products.', 'Use this when PRAXIS should write for a multilateral desk: mandate language, member-state positions, implementation limits, and careful confidence are more important than persuasion.', ['multilateral', 'desk-officer', 'mandate', 'diplomacy', 'implementation', 'user-lens', 'team:diplomatic'], { userCoreId: 'starter-user-multilateral-desk-officer', toolCoreIds: ['commitment-tracker', 'sourceability', 'memo-drafter'], outputCoreIds: ['principals-decision-memo', 'diplomatic-cable'] }, ['commitment-tracker', 'sourceability', 'memo-drafter'], ['principals-decision-memo', 'diplomatic-cable'], ['starter-output-ministerial-submission-style', 'starter-tool-legal-mandate-compliance-lens', 'starter-situation-lebanon-israel-unifil-ceasefire-monitoring'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation resources', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'Mediation, process design, and diplomatic support source lane.', publisher: 'United Nations', date: '2026', reliabilityTier: 1 },
      { id: 'un-security-council', label: 'UN Security Council official site', url: 'https://main.un.org/securitycouncil/en', sourceType: 'multilateral', relevance: 'Mandate, resolution, sanctions, and committee source lane.', publisher: 'United Nations Security Council', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'un-peacemaker', text: 'Desk-officer outputs should separate public process guidance, party positions, leverage, and confidential or inferred intent.' },
      { sourceId: 'un-security-council', text: 'Mandate references should cite controlling text, date, body, and implementation boundary before policy conclusions.' },
    ],
    suggestedQuestions: ['Which mandate, member-state process, committee, or operational decision is in scope?', 'What public source controls the institutional posture?', 'What language must stay cautious because it is inferred or politically sensitive?'],
    suggestedNextActions: ['Attach mandate and institutional source receipts.', 'Run commitment tracker or mandate lens before drafting.', 'Draft a desk-ready memo or cable with sourceability and caveats.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'multilateral-desk-officer', outputGoal: 'diplomatic-cable', approvalNotes: 'Human desk, legal, and political review required before external circulation.' },
    aiUseGuidance: 'Write like a careful desk officer: mandate-aware, dated, source-backed, and explicit about what is unknown or politically sensitive.',
  }),
];

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
  ...EXPERT_POLICY_CAPSULE_WAVE,
  ...REAL_WORK_CONTEXT_CAPSULE_WAVE,
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
  starter('starter-situation-us-federal-ai-governance-baseline', 'situation', 'ai-governance', 'U.S. federal AI governance baseline', 'A U.S. federal AI governance capsule for OMB guidance, NIST risk framing, agency accountability, procurement posture, and oversight caveats.', 'Use this when the user asks for a U.S. federal AI governance perspective. PRAXIS should separate binding authority, agency policy, risk-framework guidance, procurement controls, and non-certification caveats.', ['us-federal', 'ai-governance', 'omb-ai-guidance', 'nist-ai-rmf', 'human-reviewed', 'team:research-strategy'], { situationCoreId: 'starter-situation-us-federal-ai-governance-baseline', pathCoreId: 'governance-public-sector', sourceCoreIds: ['omb-ai-governance-memo', 'nist-ai-rmf', 'federal-register-ai'], toolCoreIds: ['sourceability', 'grounded-research', 'contradiction-finder'], outputCoreIds: ['options-memo'] }, ['grounded-research', 'sourceability', 'memo-drafter'], ['options-memo', 'principals-decision-memo'], ['starter-tool-sourceability-audit-reviewer', 'starter-output-ai-governance-risk-brief', 'starter-output-congressional-testimony-mode'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'omb-ai-governance-memo', label: 'OMB federal AI governance guidance', url: 'https://www.whitehouse.gov/omb/', sourceType: 'official', relevance: 'Official U.S. federal management and agency AI governance source lane.', publisher: 'Office of Management and Budget', date: '2026', reliabilityTier: 1 },
      { id: 'nist-ai-rmf', label: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', sourceType: 'official', relevance: 'Risk vocabulary for govern, map, measure, and manage AI-system controls.', publisher: 'NIST', date: '2023', reliabilityTier: 1 },
      { id: 'federal-register-ai', label: 'Federal Register AI notices', url: 'https://www.federalregister.gov/', sourceType: 'official', relevance: 'Federal rulemaking and notice source lane for AI governance developments.', publisher: 'Federal Register', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Which U.S. federal agency, system, decision, and authority are in scope?', 'Which claims are legal authority, policy guidance, risk-framework guidance, or PRAXIS inference?', 'What OMB, NIST, Federal Register, or agency source must be attached before export?'],
    suggestedNextActions: ['Attach OMB, NIST, agency, or Federal Register source receipts.', 'Map each AI governance claim to authority, control owner, evidence, and caveat.', 'Run sourceability review before memo, PDF, procurement, or testimony output.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'us-federal-ai-governance-baseline', outputGoal: 'U.S. federal AI governance memo with authority, framework, evidence, gaps, and review gates.', approvalNotes: 'Do not certify compliance, safety, fairness, or procurement readiness without authorized review.' },
    aiUseGuidance: 'Treat U.S. federal AI governance as source-bound policy context. Use official sources first, separate authority from guidance, and keep legal/procurement assurance claims review-gated.',
    humanReview: humanReviewed('Reviewed as a U.S. federal AI governance starter for OMB/NIST source posture, agency caveats, and non-certification language.', 'PRAXIS policy capsule review', {
      scope: 'U.S. federal AI governance, agency policy, NIST risk framing, procurement posture, and oversight caveats.',
      authorOrPublisher: 'OMB, NIST, Federal Register, and agency public-source lanes',
      jurisdiction: 'United States federal',
      assumptions: ['The user will attach current controlling OMB, NIST, agency, or Federal Register source receipts.', 'PRAXIS will not present governance analysis as legal advice, certification, or technical assurance.'],
      limitations: ['Does not replace agency counsel, acquisition officials, privacy, civil-rights, or technical safety review.', 'Federal AI guidance changes frequently and must be refreshed before external use.'],
      sourcePackSummary: 'Federal AI governance starter source pack centered on OMB, NIST, and Federal Register source lanes.',
      humanReviewGate: 'Human AI governance review required before compliance, safety, procurement, testimony, or assurance claims.',
    }),
  }),
  starter('starter-situation-un-sanctions-context', 'situation', 'diplomacy', 'UN sanctions context capsule', 'A UN sanctions context capsule for Security Council mandates, committee materials, listing posture, implementation caveats, and legal-review boundaries.', 'Use this when analysis touches UN sanctions exposure, listings, mandate language, or implementation posture. PRAXIS should separate source text, legal effect, implementation practice, and non-advice caveats.', ['un', 'sanctions', 'security-council', 'legal-policy-context', 'human-reviewed', 'team:legal-humanitarian'], { situationCoreId: 'starter-situation-un-sanctions-context', pathCoreId: 'diplomatic-options', sourceCoreIds: ['un-security-council-sanctions', 'un-sanctions-committees'], toolCoreIds: ['sourceability', 'sanctions-check', 'legal-mandate-compliance-lens'], outputCoreIds: ['options-memo'] }, ['grounded-research', 'sourceability', 'ach'], ['options-memo', 'principals-decision-memo'], ['starter-tool-legal-mandate-compliance-lens', 'starter-output-congressional-testimony-mode', 'starter-tool-sourceability-audit-reviewer'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'un-security-council-sanctions', label: 'UN Security Council sanctions', url: 'https://main.un.org/securitycouncil/en/sanctions/information', sourceType: 'multilateral', relevance: 'Official UN sanctions regime source lane.', publisher: 'United Nations Security Council', date: '2026', reliabilityTier: 1 },
      { id: 'un-sanctions-committees', label: 'UN sanctions committees', url: 'https://main.un.org/securitycouncil/en/sanctions/committees', sourceType: 'multilateral', relevance: 'Committee-specific listing and implementation source lane.', publisher: 'United Nations Security Council', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Which regime, entity, listing, or mandate language is in scope?', 'Which claim is a direct UN source fact versus implementation inference?', 'What legal or compliance review remains required?'],
    suggestedNextActions: ['Attach Security Council and committee source receipts.', 'Map regime, listing basis, implementation caveat, and evidence gaps.', 'Keep sanctions conclusions in non-advice review language.'],
    humanReview: humanReviewed('Reviewed as a sanctions-context starter with legal-effect and implementation caveats.', 'PRAXIS sanctions and mandate review', {
      scope: 'UN sanctions source posture, listing context, mandate language, and implementation caveats.',
      authorOrPublisher: 'United Nations Security Council public source lanes',
      jurisdiction: 'United Nations / multilateral',
      sourcePackSummary: 'UN Security Council and committee source lanes for sanctions context.',
      humanReviewGate: 'Human sanctions and legal review required before exposure, listing, or legal-effect claims.',
    }),
  }),
  starter('starter-situation-humanitarian-access-analysis', 'situation', 'humanitarian-rights', 'Humanitarian access analysis capsule', 'A humanitarian access capsule for OCHA concepts, operational constraints, affected populations, protection risks, and source-confidence boundaries.', 'Use this when the user asks for humanitarian access analysis or protection-sensitive operational context. PRAXIS should separate access constraints, rights/accountability claims, personal data, and operational recommendations.', ['humanitarian-access', 'ocha', 'protection', 'rights', 'human-reviewed', 'team:legal-humanitarian'], { situationCoreId: 'starter-situation-humanitarian-access-analysis', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['ocha-access', 'reliefweb-humanitarian-updates'], toolCoreIds: ['sourceability', 'stakeholder-map', 'grounded-research'], outputCoreIds: ['humanitarian-one-pager'] }, ['grounded-research', 'sourceability', 'stakeholder-map'], ['humanitarian-one-pager', 'options-memo'], ['starter-output-humanitarian-access-brief', 'starter-tool-sourceability-audit-reviewer', 'starter-user-humanitarian-legal-investigator'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'ocha-access', label: 'OCHA humanitarian access guidance', url: 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', sourceType: 'multilateral', relevance: 'Operational access concepts and constraints.', publisher: 'OCHA', date: '2026', reliabilityTier: 1 },
      { id: 'reliefweb-humanitarian-updates', label: 'ReliefWeb humanitarian updates', url: 'https://reliefweb.int/', sourceType: 'public-library', relevance: 'Humanitarian situation reporting source lane for dated operational context.', publisher: 'ReliefWeb', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Which affected population, actor, route, or access constraint is in scope?', 'Which claims are operational facts versus rights or accountability conclusions?', 'What personal-data or protection sensitivities must stay out of public output?'],
    suggestedNextActions: ['Attach OCHA, ReliefWeb, cluster, or operational source receipts.', 'Separate access constraints from rights/accountability claims.', 'Draft the access brief with confidence levels and review gates.'],
    humanReview: humanReviewed('Reviewed as a humanitarian access starter with protection, source-confidence, and legal-threshold caveats.', 'PRAXIS humanitarian review', {
      scope: 'Humanitarian access constraints, affected-population posture, protection risks, and source-confidence boundaries.',
      authorOrPublisher: 'OCHA, ReliefWeb, and humanitarian public-source lanes',
      jurisdiction: 'Humanitarian / multilateral',
      sourcePackSummary: 'OCHA and humanitarian reporting source lanes for operational access analysis.',
      humanReviewGate: 'Human humanitarian and protection review required before operational recommendations or accountability claims.',
    }),
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
  starter('starter-output-congressional-testimony-mode', 'output', 'output-brief', 'Congressional testimony mode output capsule', 'An output capsule for hearing testimony, prepared statements, QFR posture, record evidence, and review-gated policy claims.', 'Use this when the product should support testimony or hearing preparation. PRAXIS should keep official sources, jurisdiction, caveats, and human review gates visible before any external statement.', ['congressional-testimony', 'hearing', 'prepared-statement', 'qfr', 'human-reviewed', 'team:research-strategy'], { outputCoreIds: ['talking-points', 'principals-decision-memo'], productCoreIds: ['talking-points', 'principals-decision-memo'], objectiveCoreIds: ['draft-congressional-testimony-mode'] }, ['memo-drafter', 'sourceability', 'grounded-research'], ['talking-points', 'principals-decision-memo'], ['starter-situation-us-federal-ai-governance-baseline', 'starter-tool-sourceability-audit-reviewer', 'starter-output-principals-decision-memo'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'congress-hearings', label: 'Congress.gov committee and hearing materials', url: 'https://www.congress.gov/', sourceType: 'official', relevance: 'Official congressional record and legislative source lane.', publisher: 'Congress.gov', date: '2026', reliabilityTier: 1 },
      { id: 'govinfo-hearings', label: 'GovInfo congressional hearings', url: 'https://www.govinfo.gov/app/collection/chrg', sourceType: 'official', relevance: 'Official hearing transcript and prepared-statement source lane.', publisher: 'GovInfo', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Who is the witness, committee, topic, and record audience?', 'Which statements need source backing, legal clearance, or agency approval?', 'Which QFR or opposition questions should be prepared separately?'],
    suggestedNextActions: ['Build a statement outline with source IDs for each material claim.', 'Prepare QFR-ready caveats and record citations.', 'Run sourceability and human review before circulation.'],
    humanReview: humanReviewed('Reviewed as a testimony-output starter with public-record, sourceability, and approval-gate emphasis.', 'PRAXIS public testimony review', {
      scope: 'Congressional testimony, prepared statement, QFR, and official-record posture.',
      authorOrPublisher: 'Congress.gov, GovInfo, and user-provided record sources',
      jurisdiction: 'United States federal',
      sourcePackSummary: 'Official congressional source lanes for testimony and hearing preparation.',
      humanReviewGate: 'Human review required before external testimony, public-record claims, or legal/policy commitments.',
    }),
  }),
  starter('starter-output-pdf-policy-memo-style', 'output', 'output-brief', 'PDF policy memo style output capsule', 'An output capsule for export-ready PDF policy memos with executive summary, citations, caveats, source annex, and approval posture.', 'Use this when Ask PRAXIS should turn context into a polished PDF-style memo. PRAXIS should keep citation support, unsupported claims, assumptions, and human review status visible before export.', ['pdf-report', 'policy-memo', 'source-annex', 'export-ready', 'human-reviewed', 'team:program-delivery'], { outputCoreIds: ['options-memo'], productCoreIds: ['options-memo'], objectiveCoreIds: ['draft-pdf-policy-memo-style'] }, ['memo-drafter', 'sourceability', 'grounded-research'], ['options-memo', 'principals-decision-memo'], ['starter-tool-sourceability-audit-reviewer', 'starter-output-evidence-sourceability-annex', 'starter-output-principals-decision-memo'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'praxis-sourceability-standard', label: 'PRAXIS sourceability standard', url: 'https://praxis.tacitus.me/learn', sourceType: 'public-library', relevance: 'Product sourceability and receipt posture for export-ready outputs.', publisher: 'PRAXIS by TACITUS', date: '2026', reliabilityTier: 2 },
      { id: 'plain-language-federal', label: 'PlainLanguage.gov guidance', url: 'https://www.plainlanguage.gov/', sourceType: 'official', relevance: 'U.S. public-writing clarity source lane for policy memo readability.', publisher: 'PlainLanguage.gov', date: '2026', reliabilityTier: 1 },
    ],
    suggestedQuestions: ['Who is the PDF memo audience, decision, and approval owner?', 'Which claims require source IDs, caveats, or annex notes?', 'What must be excluded until human review is complete?'],
    suggestedNextActions: ['Draft the PDF memo outline with source and caveat slots.', 'Run sourceability and claim ledger review before export.', 'Attach a source annex and approval gate summary.'],
    humanReview: humanReviewed('Reviewed as an export-output starter for citation discipline, source annex posture, and human approval gates.', 'PRAXIS output review', {
      scope: 'Export-ready policy memo structure, citation posture, source annex, and review gate.',
      authorOrPublisher: 'PRAXIS sourceability and public-writing source lanes',
      jurisdiction: 'Cross-jurisdictional / audience-specific',
      sourcePackSummary: 'PRAXIS sourceability and plain-language source lanes for PDF memo export.',
      humanReviewGate: 'Human review required before PDF export, external circulation, or final approval.',
    }),
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
  starter('starter-tool-decision-clock-monitor', 'tool', 'options-mapping', 'Decision Clock Capsule+', 'A Capsule+ graph capsule for deadlines, review gates, stale assumptions, trigger events, commitments, risks, and decision windows.', 'Use this when the answer depends on timing. PRAXIS should make the decision window explicit, label proposed graph facts, and show what must be refreshed before reuse.', ['decision-clock', 'deadline', 'stale-claims', 'thinking-device', 'capsule-plus', 'postgres-embedded-graph'], { toolCoreIds: ['scenario-projector', 'commitment-tracker', 'sourceability'], graphCoreId: 'starter-graph-decision-clock-capsule-plus', timeCoreId: 'starter-time-decision-clock', objectiveCoreIds: ['monitor-decision-clock'], outputCoreIds: ['risk-monitor-card'] }, ['scenario-projector', 'commitment-tracker', 'sourceability'], ['risk-monitor-card', 'talking-points'], ['starter-situation-mediation-track', 'starter-situation-humanitarian-access-update', 'starter-output-meeting-talking-points'], {
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
  starter('starter-tool-assumption-stress-test', 'tool', 'audit-review', 'Assumption Stress Test', 'A review-gated thinking-device capsule for pressure-testing the load-bearing assumptions behind an answer, option, or recommendation.', 'Use this when a PRAXIS response may be leaning on hidden assumptions. It forces the model to name each assumption, source status, counterevidence, and review decision before drafting.', ['assumptions', 'stress-test', 'red-team', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['ach', 'contradiction-finder', 'sourceability'], objectiveCoreIds: ['stress-test-assumptions'], outputCoreIds: ['principals-decision-memo'] }, ['ach', 'contradiction-finder', 'sourceability'], ['principals-decision-memo', 'evidence-sourceability-annex'], ['starter-situation-mediation-track', 'starter-output-principals-decision-memo', 'starter-tool-sourceability-matrix'], {
    readinessStars: 5,
    suggestedQuestions: ['Which conclusion depends on the weakest assumption?', 'What would disconfirm the preferred option?', 'Which assumption needs human sign-off before reuse?'],
    suggestedNextActions: ['List load-bearing assumptions with source status.', 'Add counterevidence and missing-source rows.', 'Route unsupported assumptions to human review before drafting.'],
    aiUseGuidance: 'Use this as an assumption stress test. Do not let PRAXIS finalize advice until weak assumptions, source gaps, and review gates are visible.',
    deviceProfile: buildStarterDeviceProfile('Assumption Stress Test', { deviceKind: 'stress-test' }),
  }),
  starter('starter-tool-counterfactual-pivot-check', 'tool', 'options-mapping', 'Counterfactual Pivot Check', 'A review-gated thinking-device capsule for asking what would change if one pivotal actor, event, rule, or indicator moved differently.', 'Use this when strategy depends on a fragile scenario. PRAXIS should state the pivot, compare the baseline and counterfactual, and identify decisions that survive both.', ['counterfactual', 'scenario', 'pivot', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['scenario-projector', 'ach', 'sourceability'], objectiveCoreIds: ['check-counterfactual-pivot'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['scenario-projector', 'ach', 'sourceability'], ['scenario-risk-dashboard-card', 'principals-decision-memo'], ['starter-situation-red-sea-houthi-shipping-risk', 'starter-output-scenario-risk-dashboard-card', 'starter-tool-temporal-causal-map'], {
    readinessStars: 4,
    suggestedQuestions: ['What single pivot would change the recommendation?', 'Which assumptions hold in both baseline and counterfactual?', 'What indicator would reveal the pivot is happening?'],
    suggestedNextActions: ['Define the pivot in one sentence.', 'Compare baseline, counterfactual, and invariant decisions.', 'Attach indicators to the output before approval.'],
    aiUseGuidance: 'Use this for counterfactual discipline. Keep plausible pivots source-linked and do not present speculative branches as forecasts.',
    deviceProfile: buildStarterDeviceProfile('Counterfactual Pivot Check', { deviceKind: 'counterfactual-pivot' }),
  }),
  starter('starter-tool-competing-hypotheses-matrix', 'tool', 'audit-review', 'Competing Hypotheses Matrix', 'A review-gated thinking-device capsule for comparing plausible explanations against evidence, contradictions, and collection gaps.', 'Use this when PRAXIS needs to avoid premature convergence. It should score evidence against alternatives and make missing collection explicit.', ['ach', 'hypotheses', 'evidence', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['ach', 'contradiction-finder', 'grounded-research'], objectiveCoreIds: ['compare-hypotheses'], outputCoreIds: ['evidence-sourceability-annex'] }, ['ach', 'contradiction-finder', 'grounded-research'], ['evidence-sourceability-annex', 'principals-decision-memo'], ['starter-situation-sudan-darfur-atrocity-access', 'starter-output-evidence-sourceability-annex', 'starter-tool-sourceability-matrix'], {
    readinessStars: 5,
    suggestedQuestions: ['What are the plausible explanations?', 'Which evidence supports or contradicts each one?', 'What collection gap blocks confidence?'],
    suggestedNextActions: ['Build hypothesis columns and evidence rows.', 'Mark contradictions and missing receipts.', 'Summarize confidence without collapsing alternatives.'],
    aiUseGuidance: 'Use this as an ACH-style matrix. Keep evidence, contradiction, and confidence separate, and preserve alternatives until reviewed.',
    deviceProfile: buildStarterDeviceProfile('Competing Hypotheses Matrix', { deviceKind: 'hypotheses-matrix' }),
  }),
  starter('starter-tool-stakeholder-incentive-map', 'tool', 'options-mapping', 'Stakeholder Incentive Map', 'A review-gated thinking-device capsule for mapping stakeholder incentives, fears, constraints, leverage, and likely reactions.', 'Use this before recommending a policy option that depends on actor behavior. PRAXIS should separate sourced positions from inferred incentives.', ['stakeholders', 'incentives', 'leverage', 'thinking-device', 'review-gated', 'team:diplomatic'], { toolCoreIds: ['stakeholder-map', 'position-vs-interest', 'coalition-detector'], objectiveCoreIds: ['map-stakeholder-incentives'], outputCoreIds: ['negotiation-prep-book'] }, ['stakeholder-map', 'position-vs-interest', 'coalition-detector'], ['negotiation-prep-book', 'actor-dossier'], ['starter-situation-gaza-ceasefire-aid-reconstruction', 'starter-output-negotiation-prep-book', 'starter-tool-actor-leverage-veto-map'], {
    readinessStars: 5,
    suggestedQuestions: ['Who can enable or block the option?', 'What incentive is sourced versus inferred?', 'Which actor reaction changes implementation feasibility?'],
    suggestedNextActions: ['Map actors, incentives, fears, and leverage.', 'Label inferred incentives clearly.', 'Turn the map into negotiation prep or an actor dossier.'],
    aiUseGuidance: 'Use this for actor incentive mapping. Do not assert motives as fact; label evidence and inference separately.',
    deviceProfile: buildStarterDeviceProfile('Stakeholder Incentive Map', { deviceKind: 'stakeholder-incentive-map' }),
  }),
  starter('starter-tool-spoiler-blocker-scan', 'tool', 'options-mapping', 'Spoiler and Blocker Scan', 'A review-gated thinking-device capsule for identifying actors, process points, resources, rules, and narratives that could block implementation.', 'Use this when an option looks attractive but execution risk is unclear. PRAXIS should name blockers, evidence, mitigation, and escalation triggers.', ['spoilers', 'blockers', 'implementation-risk', 'thinking-device', 'review-gated', 'team:diplomatic'], { toolCoreIds: ['stakeholder-map', 'scenario-projector', 'contradiction-finder'], objectiveCoreIds: ['scan-spoilers-blockers'], outputCoreIds: ['risk-monitor-card'] }, ['stakeholder-map', 'scenario-projector', 'contradiction-finder'], ['risk-monitor-card', 'principals-decision-memo'], ['starter-situation-mediation-track', 'starter-output-scenario-risk-dashboard-card', 'starter-tool-negotiation-ripeness-decision-clock'], {
    readinessStars: 4,
    suggestedQuestions: ['Who or what can block implementation?', 'Which blocker is evidenced versus hypothetical?', 'What mitigation or trigger should be monitored?'],
    suggestedNextActions: ['List blockers by actor, rule, resource, and narrative.', 'Add mitigation and monitor columns.', 'Route high-impact blockers to a risk card.'],
    aiUseGuidance: 'Use this as a spoiler/blocker scan. Keep speculative blockers caveated and require review before naming actors as spoilers.',
    deviceProfile: buildStarterDeviceProfile('Spoiler and Blocker Scan', { deviceKind: 'spoiler-blocker-scan' }),
  }),
  starter('starter-tool-policy-tradeoff-ledger', 'tool', 'policy-review', 'Policy Tradeoff Ledger', 'A review-gated thinking-device capsule for making benefits, costs, distributional effects, legal constraints, and reversibility visible.', 'Use this when PRAXIS compares options. It should produce a ledger that shows who benefits, who bears costs, what is uncertain, and what needs approval.', ['tradeoffs', 'options', 'distributional-effects', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['sourceability', 'ach', 'memo-drafter'], objectiveCoreIds: ['build-policy-tradeoff-ledger'], outputCoreIds: ['principals-decision-memo'] }, ['sourceability', 'ach', 'memo-drafter'], ['principals-decision-memo', 'options-memo'], ['starter-situation-sanctions-exposure', 'starter-output-principals-decision-memo', 'starter-tool-legal-mandate-compliance-lens'], {
    readinessStars: 5,
    suggestedQuestions: ['What benefit, cost, and distributional effect matters most?', 'Which tradeoff is legal, political, financial, or operational?', 'Which option is reversible if assumptions fail?'],
    suggestedNextActions: ['Create option rows with tradeoff columns.', 'Mark evidence and uncertainty for each tradeoff.', 'Attach the ledger to a decision memo before approval.'],
    aiUseGuidance: 'Use this as a policy tradeoff ledger. Do not hide costs, affected groups, legal limits, or reversibility concerns.',
    deviceProfile: buildStarterDeviceProfile('Policy Tradeoff Ledger', { deviceKind: 'tradeoff-ledger' }),
  }),
  starter('starter-tool-implementation-feasibility-gate', 'tool', 'policy-review', 'Implementation Feasibility Gate', 'A review-gated thinking-device capsule for testing whether an option can actually be executed with available authority, capacity, budget, timeline, and partners.', 'Use this before a recommendation becomes a plan. PRAXIS should stop if authority, ownership, resources, or sequencing are missing.', ['implementation', 'feasibility', 'capacity', 'thinking-device', 'review-gated', 'team:program-delivery'], { toolCoreIds: ['commitment-tracker', 'sourceability', 'stakeholder-map'], objectiveCoreIds: ['gate-implementation-feasibility'], outputCoreIds: ['options-memo'] }, ['commitment-tracker', 'sourceability', 'stakeholder-map'], ['options-memo', 'principals-decision-memo'], ['starter-situation-critical-minerals-supply-chain', 'starter-output-principals-decision-memo', 'starter-tool-policy-tradeoff-ledger'], {
    readinessStars: 4,
    suggestedQuestions: ['Who owns implementation?', 'What authority, budget, or capacity is missing?', 'What sequence must happen before launch?'],
    suggestedNextActions: ['Run authority, owner, capacity, budget, and timeline checks.', 'Name blockers before drafting implementation language.', 'Create a readiness checklist for approval.'],
    aiUseGuidance: 'Use this as an implementation feasibility gate. Block confident recommendations when authority, owner, budget, or timeline are absent.',
    deviceProfile: buildStarterDeviceProfile('Implementation Feasibility Gate', { deviceKind: 'feasibility-gate' }),
  }),
  starter('starter-tool-second-order-effects-map', 'tool', 'audit-review', 'Second-Order Effects Map', 'A review-gated thinking-device capsule for tracing indirect consequences, feedback loops, displacement effects, and unintended incentives.', 'Use this when an option may create spillovers. PRAXIS should distinguish immediate effects, second-order effects, confidence, and monitoring indicators.', ['second-order-effects', 'spillovers', 'feedback-loops', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['scenario-projector', 'ach', 'sourceability'], objectiveCoreIds: ['map-second-order-effects'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['scenario-projector', 'ach', 'sourceability'], ['scenario-risk-dashboard-card', 'risk-monitor-card'], ['starter-situation-ai-governance-procurement', 'starter-output-scenario-risk-dashboard-card', 'starter-tool-counterfactual-pivot-check'], {
    readinessStars: 4,
    suggestedQuestions: ['What indirect effect follows the first-order outcome?', 'Who changes behavior because of the policy?', 'Which indicator would reveal an unintended effect?'],
    suggestedNextActions: ['Map first-, second-, and feedback effects separately.', 'Label speculative links and monitoring indicators.', 'Attach high-risk effects to a dashboard card.'],
    aiUseGuidance: 'Use this for second-order analysis. Keep indirect effects caveated and source-linked; do not overstate causal certainty.',
    deviceProfile: buildStarterDeviceProfile('Second-Order Effects Map', { deviceKind: 'second-order-effects-map' }),
  }),
  starter('starter-tool-pre-mortem-failure-review', 'tool', 'audit-review', 'Pre-Mortem Failure Review', 'A review-gated thinking-device capsule for assuming the plan failed and working backward to likely causes, warning signs, and mitigations.', 'Use this before approving a plan, memo, or launch. PRAXIS should identify plausible failure paths and convert them into review gates.', ['pre-mortem', 'failure-review', 'risk', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['contradiction-finder', 'scenario-projector', 'sourceability'], objectiveCoreIds: ['run-pre-mortem-review'], outputCoreIds: ['risk-monitor-card'] }, ['contradiction-finder', 'scenario-projector', 'sourceability'], ['risk-monitor-card', 'options-memo'], ['starter-situation-humanitarian-access-update', 'starter-output-principals-decision-memo', 'starter-tool-spoiler-blocker-scan'], {
    readinessStars: 5,
    suggestedQuestions: ['If the plan failed, what likely caused it?', 'What early warning signal would appear first?', 'Which mitigation must be approved before launch?'],
    suggestedNextActions: ['Write failure headlines and root causes.', 'Map warning signs and mitigations.', 'Add review gates to the output before final approval.'],
    aiUseGuidance: 'Use this as a pre-mortem. Force PRAXIS to name failure paths, warning signs, and mitigations before polishing the answer.',
    deviceProfile: buildStarterDeviceProfile('Pre-Mortem Failure Review', { deviceKind: 'pre-mortem-review' }),
  }),
  starter('starter-tool-escalation-ladder-deescalation-path', 'tool', 'options-mapping', 'Escalation Ladder and De-escalation Path', 'A review-gated thinking-device capsule for mapping escalation rungs, off-ramps, signals, red lines, and proportional response options.', 'Use this in crisis, mediation, sanctions, or security questions where action can escalate conflict. PRAXIS should pair each rung with sources, signals, and de-escalation choices.', ['escalation', 'de-escalation', 'crisis', 'thinking-device', 'review-gated', 'team:diplomatic'], { toolCoreIds: ['scenario-projector', 'position-vs-interest', 'commitment-tracker'], objectiveCoreIds: ['map-escalation-deescalation'], outputCoreIds: ['negotiation-prep-book'] }, ['scenario-projector', 'position-vs-interest', 'commitment-tracker'], ['negotiation-prep-book', 'talking-points', 'principals-decision-memo'], ['starter-situation-gaza-ceasefire-aid-reconstruction', 'starter-output-negotiation-prep-book', 'starter-tool-negotiation-ripeness-decision-clock'], {
    readinessStars: 5,
    suggestedQuestions: ['What is the current escalation rung?', 'Which signal or red line moves the ladder?', 'What de-escalation path is credible and sourced?'],
    suggestedNextActions: ['Map rungs, signals, red lines, and off-ramps.', 'Separate public signals from inferred intent.', 'Draft de-escalation talking points with caveats.'],
    aiUseGuidance: 'Use this for escalation discipline. Avoid operational advice; keep public signals, proportionality, and review gates explicit.',
    deviceProfile: buildStarterDeviceProfile('Escalation Ladder and De-escalation Path', { deviceKind: 'escalation-deescalation-path' }),
  }),
  ...REASONING_GUIDE_DEVICE_SPECS.map(reasoningGuideStarter),
  starter('starter-situation-haiti-gang-mss-access-watch', 'situation', 'humanitarian-rights', 'Haiti gang violence and MSS access watch', 'A desk-officer capsule for Haiti gang violence, transition politics, MSS support posture, humanitarian access, displacement, and rights reporting.', 'Use this when PRAXIS needs to brief Haiti without flattening security operations, political transition, human-rights allegations, and humanitarian access into one story. Keep dates, localities, source tier, and mandate boundaries explicit.', ['haiti', 'gang-violence', 'mss', 'humanitarian-access', 'transition-politics', 'rights-reporting', 'team:humanitarian', 'team:diplomatic'], { situationCoreId: 'starter-situation-haiti-gang-mss-access-watch', pathCoreId: 'humanitarian-analysis', sourceCoreIds: ['binuh-haiti-mandate-news', 'ocha-access'], toolCoreIds: ['grounded-research', 'sourceability', 'scenario-projector'], outputCoreIds: ['scenario-risk-dashboard-card'] }, ['grounded-research', 'sourceability', 'scenario-projector'], ['scenario-risk-dashboard-card', 'humanitarian-one-pager', 'principals-decision-memo'], ['starter-tool-sourceability-matrix', 'starter-tool-spoiler-blocker-scan', 'starter-output-scenario-risk-dashboard-card'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'binuh-haiti-mandate-news', label: 'BINUH Haiti mission updates and mandate resources', url: 'https://binuh.unmissions.org/', sourceType: 'multilateral', relevance: 'UN mission lane for Haiti political transition, security, governance, and human-rights reporting.', publisher: 'United Nations BINUH', date: '2026', reliabilityTier: 1 },
      { id: 'ocha-access', label: 'OCHA humanitarian access guidance', url: 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', sourceType: 'multilateral', relevance: 'Operational vocabulary for access constraints, affected populations, and mitigation actions.', publisher: 'UN OCHA', date: '2024', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'binuh-haiti-mandate-news', text: 'BINUH material should anchor public claims about Haiti mission posture, governance, security, and rights reporting before PRAXIS drafts an assessment.' },
      { sourceId: 'ocha-access', text: 'OCHA access guidance keeps the capsule focused on constraints, impacts, restriction policies, and mitigation actions rather than unsupported operational conclusions.' },
    ],
    suggestedQuestions: ['Which Haitian department, neighborhood, or access route is in scope?', 'Which claims are security facts, political-transition signals, humanitarian access constraints, or rights allegations?', 'What source must be refreshed before a principals update?'],
    suggestedNextActions: ['Refresh BINUH, OCHA, and rights receipts for the exact time window.', 'Build an actor, access, and displacement risk card.', 'Run sourceability before naming perpetrators, access patterns, or mandate performance.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'haiti-security-access-watch', outputGoal: 'scenario-risk-dashboard-card', approvalNotes: 'Human review is required before external use of rights allegations, security-operation claims, or access judgments.' },
    aiUseGuidance: 'Use this as a Haiti watch capsule. Separate public security reporting, humanitarian access constraints, political-transition milestones, and rights allegations with source IDs and human approval gates.',
    humanReview: humanReviewed('Reviewed as a high-value public-source capsule for desk officers tracking Haiti access, security, and political-transition risk.'),
  }),
  starter('starter-situation-sahel-aes-ecowas-transition-watch', 'situation', 'diplomacy', 'Sahel AES-ECOWAS transition watch', 'A diplomatic desk capsule for AES, ECOWAS, UNOWAS, coastal spillover, transition timelines, counter-terrorism cooperation, and humanitarian stress.', 'Use this when PRAXIS must brief regional Sahel dynamics without treating military cooperation, regional diplomacy, humanitarian indicators, and political legitimacy as the same layer.', ['sahel', 'aes', 'ecowas', 'unowas', 'transition', 'coastal-spillover', 'team:diplomatic', 'team:security-defence'], { situationCoreId: 'starter-situation-sahel-aes-ecowas-transition-watch', pathCoreId: 'foreign-policy', sourceCoreIds: ['unowas-sahel-security-council-2025', 'unowas-mission'], toolCoreIds: ['stakeholder-map', 'sourceability', 'scenario-projector'], outputCoreIds: ['principals-decision-memo'] }, ['stakeholder-map', 'sourceability', 'scenario-projector'], ['principals-decision-memo', 'scenario-risk-dashboard-card', 'talking-points'], ['starter-tool-actor-leverage-veto-map', 'starter-tool-negotiation-ripeness-decision-clock', 'starter-output-principals-decision-memo'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'unowas-sahel-security-council-2025', label: 'UNOWAS Security Council briefing on West Africa and the Sahel', url: 'https://unowas.unmissions.org/en/security-council-special-representative-sim%C3%A3o-calls-collective-response-challenges-west', sourceType: 'multilateral', relevance: 'UN lane for regional security, humanitarian pressure, ECOWAS-AES cooperation, and preventive diplomacy.', publisher: 'UNOWAS', date: '2025-08-07', reliabilityTier: 1 },
      { id: 'unowas-mission', label: 'UNOWAS mission and preventive diplomacy mandate', url: 'https://unowas.unmissions.org/', sourceType: 'multilateral', relevance: 'Mission baseline for preventive diplomacy, political dialogue, and regional conflict-prevention work.', publisher: 'UNOWAS', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'unowas-sahel-security-council-2025', text: 'The Security Council briefing lane supports claims about regional fragility, spillover risk, ECOWAS-AES cooperation, and humanitarian indicators.' },
      { sourceId: 'unowas-mission', text: 'UNOWAS mission language anchors the capsule in preventive diplomacy, inclusive political processes, and coordination with regional actors.' },
    ],
    suggestedQuestions: ['Which Sahel state, coastal spillover corridor, or regional mechanism is the decision about?', 'Which claims are official transition timelines, counter-terrorism posture, humanitarian indicators, or inferred incentives?', 'What would change the recommendation in the next 30 days?'],
    suggestedNextActions: ['Map ECOWAS, AES, AU, UNOWAS, and coastal-state interests.', 'Build a decision clock for transition and regional-security milestones.', 'Create a principals memo with explicit source freshness and inference labels.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'sahel-regional-transition-watch', outputGoal: 'principals-decision-memo', approvalNotes: 'Review inferred actor incentives and security-risk claims before sharing beyond the workspace.' },
    aiUseGuidance: 'Use this for regional Sahel statecraft. Keep public mandate facts separate from analytic inference, and attach recent UN or regional receipts before drafting options.',
    humanReview: humanReviewed('Reviewed as a regional statecraft capsule for transition, preventive diplomacy, and cross-border risk analysis.'),
  }),
  starter('starter-situation-kosovo-serbia-normalization-implementation', 'situation', 'diplomacy', 'Kosovo-Serbia normalization implementation watch', 'A diplomacy capsule for the EU-facilitated Belgrade-Pristina Dialogue, implementation sequencing, municipal tensions, recognition language, and escalation risk.', 'Use this when PRAXIS needs implementation analysis rather than a generic Balkan conflict summary. Track public commitments, sequence, blockers, local incidents, and language that should not overstate recognition or compliance.', ['kosovo', 'serbia', 'belgrade-pristina-dialogue', 'normalization', 'implementation', 'eu-facilitated-dialogue', 'team:diplomatic'], { situationCoreId: 'starter-situation-kosovo-serbia-normalization-implementation', pathCoreId: 'foreign-policy', sourceCoreIds: ['eeas-belgrade-pristina-dialogue', 'un-peacemaker'], toolCoreIds: ['commitment-tracker', 'position-vs-interest', 'sourceability'], outputCoreIds: ['negotiation-prep-book'] }, ['commitment-tracker', 'position-vs-interest', 'sourceability'], ['negotiation-prep-book', 'talking-points', 'principals-decision-memo'], ['starter-tool-negotiation-ripeness-decision-clock', 'starter-tool-actor-leverage-veto-map', 'starter-output-negotiation-prep-book'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'eeas-belgrade-pristina-dialogue', label: 'EEAS Belgrade-Pristina Dialogue page', url: 'https://www.eeas.europa.eu/eeas/belgrade-pristina-dialogue_en', sourceType: 'official', relevance: 'Official EU lane for dialogue framework, agreements, and implementation posture.', publisher: 'European External Action Service', date: '2026', reliabilityTier: 1 },
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation resources', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'Mediation and process-design vocabulary for sequencing implementation and managing consent.', publisher: 'United Nations', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'eeas-belgrade-pristina-dialogue', text: 'EEAS dialogue material should control public references to agreements, EU facilitation, implementation steps, and official language.' },
      { sourceId: 'un-peacemaker', text: 'UN mediation resources keep the analysis focused on preparedness, consent, impartiality, inclusivity, and implementable agreement quality.' },
    ],
    suggestedQuestions: ['Which article, municipal issue, license-plate or association question is in scope?', 'What commitment is agreed, disputed, not implemented, or only proposed?', 'Which local incident or external statement changes the decision window?'],
    suggestedNextActions: ['Create an implementation ledger with party, obligation, evidence, blocker, and next forum.', 'Map spoilers and incentives separately from public positions.', 'Draft negotiating points with exact caveats on status and implementation.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'kosovo-serbia-implementation-ledger', outputGoal: 'negotiation-prep-book', approvalNotes: 'Human review required for status-sensitive language and claims about compliance or non-compliance.' },
    aiUseGuidance: 'Use this as an implementation watch capsule. Do not overstate legal status, party intent, or fulfillment without official source receipts.',
    humanReview: humanReviewed('Reviewed for status-sensitive diplomatic language and implementation-ledger usefulness.'),
  }),
  starter('starter-situation-armenia-azerbaijan-peace-connectivity', 'situation', 'diplomacy', 'Armenia-Azerbaijan peace and connectivity watch', 'A South Caucasus capsule for Armenia-Azerbaijan peace-treaty steps, border monitoring, connectivity projects, ratification risk, and confidence-building.', 'Use this for practical implementation and connectivity analysis. PRAXIS should distinguish initialled or finalized texts, signature and ratification steps, border security, demining, transport links, and external support.', ['armenia', 'azerbaijan', 'peace-treaty', 'connectivity', 'border-monitoring', 'south-caucasus', 'team:diplomatic'], { situationCoreId: 'starter-situation-armenia-azerbaijan-peace-connectivity', pathCoreId: 'foreign-policy', sourceCoreIds: ['eeas-armenia-azerbaijan-treaty-initialling', 'eeas-euma-border-monitoring'], toolCoreIds: ['commitment-tracker', 'scenario-projector', 'sourceability'], outputCoreIds: ['principals-decision-memo'] }, ['commitment-tracker', 'scenario-projector', 'sourceability'], ['principals-decision-memo', 'negotiation-prep-book', 'scenario-risk-dashboard-card'], ['starter-tool-negotiation-ripeness-decision-clock', 'starter-tool-implementation-feasibility-gate', 'starter-output-principals-decision-memo'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'eeas-armenia-azerbaijan-treaty-initialling', label: 'EEAS statement on Armenia-Azerbaijan peace treaty initialling', url: 'https://www.eeas.europa.eu/delegations/armenia/armeniaazerbaijan-statement-high-representative-behalf-european-union-initialling-armenia-azerbaijan_en', sourceType: 'official', relevance: 'Official EU posture on peace-treaty steps, normalization, sovereignty, borders, and implementation support.', publisher: 'European External Action Service', date: '2025-08-08', reliabilityTier: 1 },
      { id: 'eeas-euma-border-monitoring', label: 'EU Mission in Armenia border monitoring update', url: 'https://www.eeas.europa.eu/euma/euma-reaffirms-its-continued-presence-and-commitment-along-armenia-azerbaijan-border_en', sourceType: 'official', relevance: 'Border-monitoring and human-security lane for implementation risk and confidence-building.', publisher: 'European External Action Service', date: '2025-04-14', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'eeas-armenia-azerbaijan-treaty-initialling', text: 'The EEAS statement distinguishes treaty initialling, signature, ratification, normalization, sovereignty, territorial integrity, and inviolability of borders.' },
      { sourceId: 'eeas-euma-border-monitoring', text: 'EUMA material supports analysis of border observation, human security, confidence-building, and continuing monitoring needs.' },
    ],
    suggestedQuestions: ['Is the decision about treaty text, ratification, border security, connectivity, demining, or external support?', 'Which step is completed, pending, contested, or vulnerable to spoilers?', 'What confidence-building measure would reduce implementation risk?'],
    suggestedNextActions: ['Build a treaty-step and connectivity implementation ledger.', 'Map border-monitoring and demining assumptions separately.', 'Draft a principals memo with explicit status and implementation caveats.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'south-caucasus-peace-connectivity', outputGoal: 'principals-decision-memo', approvalNotes: 'Review status language and conflict-sensitive assumptions before external circulation.' },
    aiUseGuidance: 'Use this for South Caucasus implementation analysis. Verify current status and avoid converting initialling, statement language, or connectivity ambition into implemented fact.',
    humanReview: humanReviewed('Reviewed for conflict-sensitive implementation language and connectivity-risk analysis.'),
  }),
  starter('starter-situation-yemen-roadmap-ceasefire-economy', 'situation', 'diplomacy', 'Yemen roadmap, ceasefire, and economy watch', 'A Yemen capsule for UN-led political process, ceasefire posture, detainees, economic measures, humanitarian access, and regional de-escalation.', 'Use this when PRAXIS needs to brief Yemen as a negotiation and implementation file. Keep UN-led process language, regional dynamics, economic confidence measures, detainee issues, and humanitarian claims source-separated.', ['yemen', 'ceasefire', 'roadmap', 'un-special-envoy', 'detainees', 'economy', 'team:diplomatic', 'team:humanitarian'], { situationCoreId: 'starter-situation-yemen-roadmap-ceasefire-economy', pathCoreId: 'mediator-peace-process', sourceCoreIds: ['osesgy-yemen-muscat-2025', 'un-peacemaker-ceasefire-guidance'], toolCoreIds: ['commitment-tracker', 'position-vs-interest', 'sourceability'], outputCoreIds: ['negotiation-prep-book'] }, ['commitment-tracker', 'position-vs-interest', 'sourceability'], ['negotiation-prep-book', 'principals-decision-memo', 'humanitarian-one-pager'], ['starter-tool-ceasefire-monitoring-verification-matrix', 'starter-tool-negotiation-ripeness-decision-clock', 'starter-output-negotiation-prep-book'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'osesgy-yemen-muscat-2025', label: 'UN Special Envoy for Yemen Muscat visit update', url: 'https://osesgy.unmissions.org/en/news/un-special-envoy-yemen-concludes-visit-muscat-0', sourceType: 'multilateral', relevance: 'UN-led political process, de-escalation, detainee, and regional-dynamics source lane.', publisher: 'Office of the Special Envoy of the Secretary-General for Yemen', date: '2025-05-28', reliabilityTier: 1 },
      { id: 'un-peacemaker-ceasefire-guidance', label: 'UN Guidance on Mediation of Ceasefires', url: 'https://peacemaker.un.org/en/documents/guidance-mediation-ceasefires', sourceType: 'multilateral', relevance: 'Ceasefire design, monitoring, sequencing, and implementation vocabulary.', publisher: 'United Nations DPPA', date: '2022-09', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'osesgy-yemen-muscat-2025', text: 'OSESGY updates should anchor claims about UN-led process, regional de-escalation, detainee issues, and sustainable political progress.' },
      { sourceId: 'un-peacemaker-ceasefire-guidance', text: 'Ceasefire guidance keeps the capsule focused on design, guarantees, monitoring, parties, and implementation mechanics rather than vague peace-process optimism.' },
    ],
    suggestedQuestions: ['Which track is in scope: military de-escalation, detainees, economy, humanitarian access, or roadmap implementation?', 'Which claim is an official UN process statement versus an inferred party incentive?', 'What monitoring or guarantee element is missing?'],
    suggestedNextActions: ['Create a ceasefire and economic-measure commitment matrix.', 'Map party positions, interests, and detainee/humanitarian blockers.', 'Prepare negotiation prep with verification and review caveats.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'yemen-roadmap-ceasefire-economy', outputGoal: 'negotiation-prep-book', approvalNotes: 'Human review required for ceasefire, detainee, and humanitarian-access judgments.' },
    aiUseGuidance: 'Use this as a Yemen negotiation capsule. Separate official UN process language, public party statements, economic measures, and humanitarian claims with dated receipts.',
    humanReview: humanReviewed('Reviewed for ceasefire-process structure, detainee sensitivity, and economic-confidence-measure analysis.'),
  }),
  starter('starter-situation-libya-ceasefire-elections-institutions', 'situation', 'diplomacy', 'Libya ceasefire, elections, and institutions watch', 'A Libya capsule for ceasefire maintenance, electoral track, unified institutions, armed actor posture, mandate language, and implementation spoilers.', 'Use this when PRAXIS needs to brief Libya across political, security, and institutional tracks. Keep UNSMIL mandate language, electoral claims, ceasefire implementation, and inferred militia incentives separate.', ['libya', 'unsmil', 'ceasefire', 'elections', 'unified-institutions', 'spoilers', 'team:diplomatic'], { situationCoreId: 'starter-situation-libya-ceasefire-elections-institutions', pathCoreId: 'foreign-policy', sourceCoreIds: ['unsmil-home', 'un-peacemaker-ceasefire-guidance'], toolCoreIds: ['stakeholder-map', 'commitment-tracker', 'sourceability'], outputCoreIds: ['principals-decision-memo'] }, ['stakeholder-map', 'commitment-tracker', 'sourceability'], ['principals-decision-memo', 'scenario-risk-dashboard-card', 'talking-points'], ['starter-tool-spoiler-blocker-scan', 'starter-tool-legal-mandate-compliance-lens', 'starter-output-principals-decision-memo'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'unsmil-home', label: 'UNSMIL mission resources and updates', url: 'https://unsmil.unmissions.org/', sourceType: 'multilateral', relevance: 'UN Libya mission lane for political process, mandate, institutional, and ceasefire context.', publisher: 'United Nations Support Mission in Libya', date: '2026', reliabilityTier: 1 },
      { id: 'un-peacemaker-ceasefire-guidance', label: 'UN Guidance on Mediation of Ceasefires', url: 'https://peacemaker.un.org/en/documents/guidance-mediation-ceasefires', sourceType: 'multilateral', relevance: 'Ceasefire monitoring, verification, and implementation design vocabulary.', publisher: 'United Nations DPPA', date: '2022-09', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'unsmil-home', text: 'UNSMIL should anchor claims about Libya mission posture, political process, mandate, elections, and institutional tracks.' },
      { sourceId: 'un-peacemaker-ceasefire-guidance', text: 'Ceasefire guidance supports analysis of monitoring, verification, spoilers, and implementation conditions.' },
    ],
    suggestedQuestions: ['Which Libya track is in scope: elections, institutions, ceasefire, armed groups, or mandate renewal?', 'Which statement is official mission posture versus analytic inference?', 'What spoiler or blocker could derail implementation?'],
    suggestedNextActions: ['Build a track-by-track ledger for political, security, and institutional issues.', 'Run spoiler and mandate checks before recommending options.', 'Draft a principals memo with source gaps and explicit review gates.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'libya-institutions-ceasefire-watch', outputGoal: 'principals-decision-memo', approvalNotes: 'Review claims about armed actors, elections, and mandate authority before external use.' },
    aiUseGuidance: 'Use this for Libya statecraft analysis. Keep public UN mission information separate from inferred actor motives and unverified electoral or armed-group claims.',
    humanReview: humanReviewed('Reviewed for mission-mandate posture, ceasefire implementation logic, and spoiler-risk utility.'),
  }),
  starter('starter-situation-baltic-undersea-infrastructure-resilience', 'situation', 'cyber-resilience', 'Baltic undersea infrastructure resilience watch', 'A hybrid-resilience capsule for Baltic undersea cables, pipelines, maritime surveillance, attribution caution, infrastructure protection, and allied response.', 'Use this when the issue involves undersea or maritime critical infrastructure. PRAXIS should separate incident facts, attribution, resilience measures, alliance posture, private operator data, and escalation implications.', ['baltic-sea', 'undersea-infrastructure', 'critical-infrastructure', 'maritime-security', 'hybrid-threats', 'attribution', 'team:information-cyber', 'team:security-defence'], { situationCoreId: 'starter-situation-baltic-undersea-infrastructure-resilience', pathCoreId: 'information-cyber', sourceCoreIds: ['nato-baltic-sentry-2025', 'nist-csf'], toolCoreIds: ['sourceability', 'scenario-projector', 'contradiction-finder'], outputCoreIds: ['risk-monitor-card'] }, ['sourceability', 'scenario-projector', 'contradiction-finder'], ['risk-monitor-card', 'scenario-risk-dashboard-card', 'principals-decision-memo'], ['starter-tool-estimative-confidence-calibration-table', 'starter-tool-escalation-ladder-deescalation-path', 'starter-output-scenario-risk-dashboard-card'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'nato-baltic-sentry-2025', label: 'NATO Baltic Sentry critical infrastructure security launch', url: 'https://www.nato.int/en/news-and-events/articles/news/2025/01/14/nato-launches-baltic-sentry-to-increase-critical-infrastructure-security', sourceType: 'multilateral', relevance: 'Alliance posture for Baltic Sea surveillance, deterrence, and critical infrastructure security.', publisher: 'NATO', date: '2025-01-14', reliabilityTier: 1 },
      { id: 'nist-csf', label: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework', sourceType: 'official', relevance: 'Resilience, response, recovery, and governance vocabulary for critical infrastructure risk.', publisher: 'NIST', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'nato-baltic-sentry-2025', text: 'NATO Baltic Sentry material should anchor public claims about allied posture, maritime surveillance, and infrastructure-security response.' },
      { sourceId: 'nist-csf', text: 'NIST CSF vocabulary helps separate identify, protect, detect, respond, recover, governance, and communication tasks.' },
    ],
    suggestedQuestions: ['Which asset type, incident, operator, or jurisdiction is in scope?', 'What is confirmed fact, attribution claim, resilience measure, or alliance signal?', 'What communication should avoid over-attribution?'],
    suggestedNextActions: ['Build an incident fact and confidence table.', 'Map resilience controls, operator dependencies, and public messaging constraints.', 'Draft a risk monitor card with attribution caveats.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'baltic-undersea-resilience', outputGoal: 'risk-monitor-card', approvalNotes: 'Attribution and escalation language require human review and strong source receipts.' },
    aiUseGuidance: 'Use this for undersea infrastructure risk. Avoid unsupported attribution, separate operational facts from alliance response, and keep private operator assumptions caveated.',
    humanReview: humanReviewed('Reviewed for hybrid-threat attribution discipline and critical-infrastructure resilience framing.'),
  }),
  starter('starter-situation-south-china-sea-ayungin-resupply', 'situation', 'diplomacy', 'South China Sea Ayungin resupply watch', 'A maritime diplomacy capsule for Ayungin/Second Thomas Shoal resupply missions, UNCLOS posture, crisis-management signals, alliance commitments, and misinformation risk.', 'Use this when PRAXIS needs a precise South China Sea file. Keep resupply facts, legal posture, incident timeline, public messaging, alliance deterrence, and de-escalation channels separate.', ['south-china-sea', 'ayungin-shoal', 'second-thomas-shoal', 'resupply', 'unclos', 'maritime-gray-zone', 'team:diplomatic', 'team:security-defence'], { situationCoreId: 'starter-situation-south-china-sea-ayungin-resupply', pathCoreId: 'foreign-policy', sourceCoreIds: ['pna-ayungin-resupply-2025', 'pna-dfa-ayungin-legal-posture'], toolCoreIds: ['sourceability', 'commitment-tracker', 'scenario-projector'], outputCoreIds: ['talking-points'] }, ['sourceability', 'commitment-tracker', 'scenario-projector'], ['talking-points', 'principals-decision-memo', 'scenario-risk-dashboard-card'], ['starter-tool-escalation-ladder-deescalation-path', 'starter-tool-estimative-confidence-calibration-table', 'starter-output-negotiation-prep-book'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'pna-ayungin-resupply-2025', label: 'Philippine News Agency report on Ayungin resupply mission', url: 'https://www.pna.gov.ph/index.php/articles/1247817', sourceType: 'official', relevance: 'Government news lane for routine resupply mission details, incident status, and public messaging.', publisher: 'Philippine News Agency', date: '2025-04-09', reliabilityTier: 1 },
      { id: 'pna-dfa-ayungin-legal-posture', label: 'DFA statement on Ayungin resupply legal posture', url: 'https://www.pna.gov.ph/articles/1213808', sourceType: 'official', relevance: 'Philippine official legal-position lane for EEZ, UNCLOS, and arbitration-award claims.', publisher: 'Philippine News Agency', date: '2023-11-16', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'pna-ayungin-resupply-2025', text: 'The 2025 resupply report anchors facts about the routine rotation and resupply mission, incident status, and public defense posture.' },
      { sourceId: 'pna-dfa-ayungin-legal-posture', text: 'The DFA legal-position report anchors claims about EEZ, UNCLOS, arbitral award framing, and the legitimacy of resupply activity.' },
    ],
    suggestedQuestions: ['Which mission, date, vessel, or legal claim is in scope?', 'What is a confirmed incident fact, official legal claim, alliance signal, or misinformation risk?', 'What language avoids escalation while preserving legal posture?'],
    suggestedNextActions: ['Create a timeline with mission, source, incident, and confidence columns.', 'Separate legal posture from operational facts and alliance messaging.', 'Draft talking points with de-escalation and sourceability checks.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'south-china-sea-ayungin-watch', outputGoal: 'talking-points', approvalNotes: 'Human review required for legal, alliance, and escalation language.' },
    aiUseGuidance: 'Use this as a maritime gray-zone capsule. Verify dates and official source posture, avoid operational advice, and separate confirmed facts from claims and counterclaims.',
    humanReview: humanReviewed('Reviewed for maritime gray-zone specificity, legal-posture caveats, and de-escalation language.'),
  }),
  starter('starter-situation-moldova-energy-hybrid-resilience', 'situation', 'cyber-resilience', 'Moldova energy and hybrid resilience watch', 'A resilience capsule for Moldova energy security, Transnistria pressure, EU support, hybrid threats, cybersecurity, FIMI, and crisis-management capacity.', 'Use this when PRAXIS needs to connect energy resilience and hybrid-threat analysis without conflating technical energy supply, political pressure, information operations, and EU support instruments.', ['moldova', 'energy-security', 'hybrid-threats', 'transnistria', 'fimi', 'cybersecurity', 'team:information-cyber', 'team:crisis-ops'], { situationCoreId: 'starter-situation-moldova-energy-hybrid-resilience', pathCoreId: 'information-cyber', sourceCoreIds: ['eu-energy-neighbourhood-east-moldova', 'eeas-eupm-moldova-2025'], toolCoreIds: ['scenario-projector', 'sourceability', 'stakeholder-map'], outputCoreIds: ['risk-monitor-card'] }, ['scenario-projector', 'sourceability', 'stakeholder-map'], ['risk-monitor-card', 'principals-decision-memo', 'scenario-risk-dashboard-card'], ['starter-tool-second-order-effects-map', 'starter-tool-implementation-feasibility-gate', 'starter-output-scenario-risk-dashboard-card'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'eu-energy-neighbourhood-east-moldova', label: 'European Commission Neighbourhood-East Moldova energy cooperation', url: 'https://energy.ec.europa.eu/topics/international-cooperation/key-partner-countries-and-regions/neighbourhood-east_en', sourceType: 'official', relevance: 'EU lane for Moldova energy diversification, grid synchronization, gas supply, and energy-resilience support.', publisher: 'European Commission', date: '2026', reliabilityTier: 1 },
      { id: 'eeas-eupm-moldova-2025', label: 'EUPM Moldova resilience and hybrid-threat mandate update', url: 'https://www.eeas.europa.eu/eupm-moldova/eupm-moldova-moving-forward-towards-sustainable-security-resilience-moldova_en?s=410318', sourceType: 'official', relevance: 'EU civilian mission lane for hybrid threats, cybersecurity vulnerabilities, and foreign information manipulation.', publisher: 'European External Action Service', date: '2025-05-22', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'eu-energy-neighbourhood-east-moldova', text: 'Commission energy cooperation material anchors Moldova energy-security claims, including diversification, grid synchronization, Russian gas exposure, and EU support.' },
      { sourceId: 'eeas-eupm-moldova-2025', text: 'EUPM Moldova material anchors hybrid-threat analysis across cybersecurity, FIMI, crisis management, and resilience advisory support.' },
    ],
    suggestedQuestions: ['Is the decision about gas, electricity, Transnistria, hybrid threats, FIMI, or crisis-management capacity?', 'Which pressure is technical, economic, informational, political, or security-related?', 'What support instrument or resilience gap changes the recommendation?'],
    suggestedNextActions: ['Build an energy-hybrid risk matrix with source, actor, channel, impact, and mitigation.', 'Separate EU support commitments from implementation assumptions.', 'Draft a risk monitor card with public communication caveats.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'moldova-energy-hybrid-resilience', outputGoal: 'risk-monitor-card', approvalNotes: 'Review attribution, cyber, and FIMI language before external circulation.' },
    aiUseGuidance: 'Use this as an energy and hybrid resilience capsule. Keep energy supply facts, mission support, cyber/FIMI claims, and political inference in separate sourceable tracks.',
    humanReview: humanReviewed('Reviewed for coupled energy-security and hybrid-resilience analysis with attribution caution.'),
  }),
  starter('starter-situation-gerd-nile-water-diplomacy', 'situation', 'sustainability', 'GERD and Nile water diplomacy capsule', 'A water-diplomacy capsule for the Grand Ethiopian Renaissance Dam, riparian interests, mediation history, water security, trust-building, and agreement design.', 'Use this when PRAXIS must explain GERD as both a technical water issue and a diplomatic identity/security issue. Separate hydrological claims, legal positions, mediator roles, public statements, and possible confidence-building options.', ['gerd', 'nile', 'water-diplomacy', 'ethiopia', 'egypt', 'sudan', 'riparian', 'team:climate-development', 'team:diplomatic'], { situationCoreId: 'starter-situation-gerd-nile-water-diplomacy', pathCoreId: 'climate-development', sourceCoreIds: ['auc-library-gerd-mediation', 'un-peacemaker'], toolCoreIds: ['position-vs-interest', 'stakeholder-map', 'sourceability'], outputCoreIds: ['principals-decision-memo'] }, ['position-vs-interest', 'stakeholder-map', 'sourceability'], ['principals-decision-memo', 'negotiation-prep-book', 'options-memo'], ['starter-tool-mediator-batna-zopa-ripeness-map', 'starter-tool-joint-fact-finding-source-protocol', 'starter-output-negotiation-prep-book'], {
    readinessStars: 4,
    sourcePack: [
      { id: 'auc-library-gerd-mediation', label: 'African Union Library GERD negotiations reference', url: 'https://library.au.int/nile-basin-initiatives-nbi-external-mediator-challenges-ethiopias-renaissance-dam-negotiations', sourceType: 'public-library', relevance: 'AU Library reference on GERD mediation history and riparian-state positions.', publisher: 'African Union Library', date: '2020', reliabilityTier: 2 },
      { id: 'un-peacemaker', label: 'UN Peacemaker mediation resources', url: 'https://peacemaker.un.org/', sourceType: 'multilateral', relevance: 'Mediation fundamentals for process design, consent, inclusivity, and agreement quality.', publisher: 'United Nations', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'auc-library-gerd-mediation', text: 'The AU Library reference frames GERD as a riparian negotiation involving Ethiopia, Egypt, Sudan, mediation history, and unresolved rights and water-security claims.' },
      { sourceId: 'un-peacemaker', text: 'UN mediation resources keep the capsule focused on preparedness, consent, impartiality, inclusivity, and quality agreement design.' },
    ],
    suggestedQuestions: ['Is the decision about filling, drought rules, data sharing, legal position, mediator role, or confidence-building?', 'Which hydrological claim needs a technical source rather than diplomatic inference?', 'What joint fact-finding mechanism would reduce distrust?'],
    suggestedNextActions: ['Map riparian interests, positions, BATNAs, and data gaps.', 'Design a joint fact-finding and data-sharing protocol.', 'Draft options with water-security, legal, and identity caveats separated.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'gerd-nile-water-diplomacy', outputGoal: 'negotiation-prep-book', approvalNotes: 'Human review required before legal, hydrological, or riparian-state position claims are used externally.' },
    aiUseGuidance: 'Use this for water diplomacy. Do not let PRAXIS turn technical hydrology, treaty law, and identity/security assumptions into one confidence level.',
    humanReview: humanReviewed('Reviewed for water-diplomacy utility and joint fact-finding design potential.'),
  }),
  starter('starter-tool-mediator-batna-zopa-ripeness-map', 'tool', 'options-mapping', 'Mediator BATNA-ZOPA ripeness map', 'A mediation tool capsule for mapping each party BATNA, ZOPA, hurting-stalemate signals, consent, mandate, spoilers, and possible process entry points.', 'Use this before advising whether a negotiation should be opened, paused, widened, narrowed, or moved through shuttle diplomacy. PRAXIS should label public positions, inferred interests, and review-sensitive assumptions separately.', ['mediation', 'batna', 'zopa', 'ripeness', 'hurting-stalemate', 'thinking-device', 'review-gated', 'team:diplomatic'], { toolCoreIds: ['position-vs-interest', 'stakeholder-map', 'scenario-projector'], objectiveCoreIds: ['map-mediation-ripeness'], outputCoreIds: ['negotiation-prep-book'] }, ['position-vs-interest', 'stakeholder-map', 'scenario-projector'], ['negotiation-prep-book', 'talking-points', 'principals-decision-memo'], ['starter-situation-yemen-roadmap-ceasefire-economy', 'starter-situation-gerd-nile-water-diplomacy', 'starter-output-negotiation-prep-book'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'un-guidance-effective-mediation', label: 'United Nations Guidance for Effective Mediation', url: 'https://peacemaker.un.org/en/documents/united-nations-guidance-effective-mediation-0', sourceType: 'multilateral', relevance: 'UN fundamentals for mediation preparedness, consent, impartiality, inclusivity, coherence, and agreement quality.', publisher: 'United Nations', date: '2012-07', reliabilityTier: 1 },
      { id: 'harvard-pon-batna', label: 'Harvard Program on Negotiation BATNA resources', url: 'https://www.pon.harvard.edu/tag/batna/', sourceType: 'public-library', relevance: 'Negotiation method lane for best alternative, bargaining range, and negotiation preparation.', publisher: 'Harvard Program on Negotiation', date: '2026', reliabilityTier: 2 },
    ],
    excerpts: [
      { sourceId: 'un-guidance-effective-mediation', text: 'UN mediation guidance grounds the tool in preparedness, consent, impartiality, inclusivity, and quality agreement design.' },
      { sourceId: 'harvard-pon-batna', text: 'BATNA resources anchor the practical negotiation distinction between each party alternative, walk-away threshold, and possible bargaining range.' },
    ],
    suggestedQuestions: ['What is each party public position, inferred interest, BATNA, and possible walk-away point?', 'What evidence shows ripeness rather than mediator wishful thinking?', 'Which spoiler, mandate, or deadline changes the entry point?'],
    suggestedNextActions: ['Build a party-by-party BATNA, ZOPA, leverage, and consent table.', 'Add ripeness and spoiler signals with source IDs.', 'Convert the map into a negotiation prep book or talking points.'],
    agentWorkflow: { preferredAgentId: 'research-memo', routeHint: 'mediator-batna-zopa-ripeness-map', outputGoal: 'negotiation-prep-book', approvalNotes: 'Human review required for inferred interests, BATNAs, and ripeness judgments.' },
    aiUseGuidance: 'Use this as a mediator preparation device. Keep interests and BATNAs caveated unless sourced, and never claim private intent as fact.',
    deviceProfile: buildStarterDeviceProfile('Mediator BATNA-ZOPA ripeness map', { deviceKind: 'mediator-ripeness-map' }),
    humanReview: humanReviewed('Reviewed as a mediator tool capsule connecting UN mediation fundamentals with practical BATNA/ZOPA preparation.'),
  }),
  starter('starter-tool-ceasefire-monitoring-verification-matrix', 'tool', 'policy-review', 'Ceasefire monitoring and verification matrix', 'A ceasefire tool capsule for converting proposed terms into monitorable commitments, verification sources, incidents, dispute mechanisms, and escalation gates.', 'Use this when ceasefire language is vague or politically loaded. PRAXIS should turn clauses into observable behaviors, monitoring owners, evidence receipts, timelines, and unresolved verification gaps.', ['ceasefire', 'monitoring', 'verification', 'commitments', 'incident-log', 'thinking-device', 'review-gated', 'team:diplomatic'], { toolCoreIds: ['commitment-tracker', 'sourceability', 'contradiction-finder'], objectiveCoreIds: ['build-ceasefire-verification-matrix'], outputCoreIds: ['legal-mandate-compliance-note'] }, ['commitment-tracker', 'sourceability', 'contradiction-finder'], ['legal-mandate-compliance-note', 'negotiation-prep-book', 'risk-monitor-card'], ['starter-situation-yemen-roadmap-ceasefire-economy', 'starter-situation-libya-ceasefire-elections-institutions', 'starter-output-legal-mandate-compliance-note'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'un-peacemaker-ceasefire-guidance', label: 'UN Guidance on Mediation of Ceasefires', url: 'https://peacemaker.un.org/en/documents/guidance-mediation-ceasefires', sourceType: 'multilateral', relevance: 'Ceasefire design, monitoring, verification, implementation, and dispute-management vocabulary.', publisher: 'United Nations DPPA', date: '2022-09', reliabilityTier: 1 },
      { id: 'un-guidance-effective-mediation', label: 'United Nations Guidance for Effective Mediation', url: 'https://peacemaker.un.org/en/documents/united-nations-guidance-effective-mediation-0', sourceType: 'multilateral', relevance: 'Mediation fundamentals for coherent process design and quality agreements.', publisher: 'United Nations', date: '2012-07', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'un-peacemaker-ceasefire-guidance', text: 'Ceasefire guidance should drive the matrix fields: commitment, monitor, verification source, incident threshold, dispute channel, and implementation risk.' },
      { sourceId: 'un-guidance-effective-mediation', text: 'Effective mediation guidance reinforces consent, inclusivity, coherence, and quality agreement design before terms are treated as implementable.' },
    ],
    suggestedQuestions: ['Which term must be translated into observable behavior?', 'Who monitors, verifies, reports, and resolves disputes?', 'What incident threshold triggers escalation or review?'],
    suggestedNextActions: ['Create commitment rows with monitor, source, timeline, threshold, and dispute mechanism.', 'Mark unverifiable terms and missing monitors.', 'Attach the matrix to negotiation prep or mandate compliance review.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'ceasefire-monitoring-verification', outputGoal: 'legal-mandate-compliance-note', approvalNotes: 'Human review required before stating compliance, violations, or verification sufficiency.' },
    aiUseGuidance: 'Use this for ceasefire implementation discipline. Do not label behavior as violation or compliance without sourceable terms and evidence.',
    deviceProfile: buildStarterDeviceProfile('Ceasefire monitoring and verification matrix', { deviceKind: 'ceasefire-verification-matrix' }),
    humanReview: humanReviewed('Reviewed as a ceasefire implementation tool with monitorable-commitment and verification gates.'),
  }),
  starter('starter-tool-joint-fact-finding-source-protocol', 'tool', 'source-intake', 'Joint fact-finding source protocol', 'A collaborative evidence tool capsule for turning contested facts into shared questions, agreed source rules, expert inputs, evidence tiers, and review decisions.', 'Use this when parties or teams disagree about the factual baseline. PRAXIS should design a neutral source protocol before drafting conclusions, preserving what is agreed, disputed, unknowable, and review-gated.', ['joint-fact-finding', 'source-protocol', 'contested-facts', 'evidence-tiers', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['grounded-research', 'sourceability', 'contradiction-finder'], objectiveCoreIds: ['build-joint-fact-finding-protocol'], sourceCoreIds: ['grounded_search'], outputCoreIds: ['evidence-sourceability-annex'] }, ['grounded-research', 'sourceability', 'contradiction-finder'], ['evidence-sourceability-annex', 'negotiation-prep-book', 'options-memo'], ['starter-situation-gerd-nile-water-diplomacy', 'starter-tool-sourceability-matrix', 'starter-output-evidence-sourceability-annex'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'un-guidance-effective-mediation', label: 'United Nations Guidance for Effective Mediation', url: 'https://peacemaker.un.org/en/documents/united-nations-guidance-effective-mediation-0', sourceType: 'multilateral', relevance: 'Process-design lane for preparedness, inclusivity, impartiality, and agreement quality in contested settings.', publisher: 'United Nations', date: '2012-07', reliabilityTier: 1 },
      { id: 'ocha-access', label: 'OCHA humanitarian access guidance', url: 'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess', sourceType: 'multilateral', relevance: 'Example of operational data fields and constraint typologies for shared evidence collection.', publisher: 'UN OCHA', date: '2024', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'un-guidance-effective-mediation', text: 'Mediation guidance supports neutral process design, inclusivity, coherence, and transparent agreement quality for contested facts.' },
      { sourceId: 'ocha-access', text: 'OCHA access guidance gives a concrete model for field, constraint, impact, and action categories in shared evidence protocols.' },
    ],
    suggestedQuestions: ['What facts are agreed, disputed, missing, or outside PRAXIS competence?', 'Which source tiers and expert inputs will all parties accept?', 'What claim must stay blocked until joint review?'],
    suggestedNextActions: ['Create agreed/disputed/missing/blocked fact rows.', 'Define acceptable source tiers and freshness windows.', 'Draft an evidence annex before any conclusion memo.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'joint-fact-finding-source-protocol', outputGoal: 'evidence-sourceability-annex', approvalNotes: 'Human review required before promoting disputed facts into shared conclusions.' },
    aiUseGuidance: 'Use this to operationalize joint fact-finding for AI. Make PRAXIS ask for source rules first and block conclusions that lack shared evidence criteria.',
    deviceProfile: buildStarterDeviceProfile('Joint fact-finding source protocol', { deviceKind: 'joint-fact-finding-protocol' }),
    humanReview: humanReviewed('Reviewed as an AI-operationalized joint fact-finding protocol for contested factual baselines.'),
  }),
  starter('starter-tool-principal-ask-payrise-negotiation-prep', 'tool', 'options-mapping', 'Principal ask and pay-rise negotiation prep', 'A negotiation tool capsule for preparing a boss conversation, raise request, scope expansion, BATNA, evidence packet, timing, and graceful fallback.', 'Use this for personal, managerial, or organizational negotiation prep where the user needs a serious ask without sounding entitled or underprepared. PRAXIS should structure evidence, constraints, interests, concessions, and next steps.', ['salary-negotiation', 'payrise', 'boss-conversation', 'principal-ask', 'batna', 'zopa', 'thinking-device', 'review-gated'], { toolCoreIds: ['position-vs-interest', 'sourceability', 'memo-drafter'], objectiveCoreIds: ['prepare-principal-ask'], outputCoreIds: ['talking-points'] }, ['position-vs-interest', 'sourceability', 'memo-drafter'], ['talking-points', 'negotiation-prep-book', 'options-memo'], ['starter-situation-hr-harassment-policy', 'starter-tool-mediator-batna-zopa-ripeness-map', 'starter-output-meeting-talking-points', 'starter-user-hr-policy-owner'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'harvard-pon-batna', label: 'Harvard Program on Negotiation BATNA resources', url: 'https://www.pon.harvard.edu/tag/batna/', sourceType: 'public-library', relevance: 'Negotiation preparation lane for alternatives, bargaining range, and disciplined asks.', publisher: 'Harvard Program on Negotiation', date: '2026', reliabilityTier: 2 },
      { id: 'acas-pay-deductions', label: 'Acas pay and deductions guidance', url: 'https://www.acas.org.uk/pay-and-deductions', sourceType: 'official', relevance: 'Employment-pay context lane for pay discussions, records, deductions, and workplace process caution.', publisher: 'Acas', date: '2026', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'harvard-pon-batna', text: 'BATNA preparation keeps the ask grounded in alternatives, bargaining range, and value evidence rather than a vague demand.' },
      { sourceId: 'acas-pay-deductions', text: 'Acas pay guidance keeps pay discussions tied to workplace process and cautions against legal or HR overclaiming.' },
    ],
    suggestedQuestions: ['What specific raise, title, scope, or benefit is the user asking for?', 'What evidence shows value, market movement, retained risk, or expanded responsibility?', 'What fallback preserves trust if the answer is no or not yet?'],
    suggestedNextActions: ['Build a one-page evidence packet with outcomes, scope, benchmarks, and timing.', 'Write the opening ask, likely objections, concessions, and fallback path.', 'Prepare a follow-up email and review before sending.'],
    agentWorkflow: { preferredAgentId: 'output-formatter', routeHint: 'payrise-principal-ask-prep', outputGoal: 'talking-points', approvalNotes: 'Human review required before sending salary, legal, or HR-sensitive language.' },
    aiUseGuidance: 'Use this for practical negotiation prep. Do not invent compensation benchmarks; ask for user evidence, local context, and constraints before drafting.',
    deviceProfile: buildStarterDeviceProfile('Principal ask and pay-rise negotiation prep', { deviceKind: 'principal-ask-negotiation-prep' }),
    humanReview: humanReviewed('Reviewed as a high-practicality negotiation tool connecting BATNA discipline, evidence prep, and respectful boss-conversation language.'),
  }),
  starter('starter-tool-estimative-confidence-calibration-table', 'tool', 'audit-review', 'Estimative confidence calibration table', 'An analytic tradecraft tool capsule for calibrated confidence, probability words, evidence strength, source freshness, dissent, and decision implications.', 'Use this when an answer has intelligence-style judgments, scenarios, warnings, or policy confidence claims. PRAXIS should force probability, evidence quality, confidence drivers, and dissent to be explicit.', ['confidence', 'estimative-language', 'probability', 'analytic-tradecraft', 'uncertainty', 'thinking-device', 'review-gated', 'team:research-strategy'], { toolCoreIds: ['ach', 'sourceability', 'contradiction-finder'], objectiveCoreIds: ['calibrate-estimative-confidence'], outputCoreIds: ['evidence-sourceability-annex'] }, ['ach', 'sourceability', 'contradiction-finder'], ['evidence-sourceability-annex', 'scenario-risk-dashboard-card', 'principals-decision-memo'], ['starter-situation-baltic-undersea-infrastructure-resilience', 'starter-tool-competing-hypotheses-matrix', 'starter-output-evidence-sourceability-annex'], {
    readinessStars: 5,
    sourcePack: [
      { id: 'dni-analytic-standards', label: 'US Intelligence Community Directive 203 analytic standards', url: 'https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf', sourceType: 'official', relevance: 'Analytic standards lane for sourcing, uncertainty, alternatives, and judgments.', publisher: 'Office of the Director of National Intelligence', date: '2015', reliabilityTier: 1 },
      { id: 'un-guidance-effective-mediation', label: 'United Nations Guidance for Effective Mediation', url: 'https://peacemaker.un.org/en/documents/united-nations-guidance-effective-mediation-0', sourceType: 'multilateral', relevance: 'Decision-process context for uncertainty, mediator error, preparation, and quality agreement design.', publisher: 'United Nations', date: '2012-07', reliabilityTier: 1 },
    ],
    excerpts: [
      { sourceId: 'dni-analytic-standards', text: 'Analytic standards anchor the table in clear sourcing, alternatives, uncertainty, and transparent judgment language.' },
      { sourceId: 'un-guidance-effective-mediation', text: 'Mediation guidance reminds PRAXIS that complexity and political will limit certainty even when preparation improves the odds.' },
    ],
    suggestedQuestions: ['What judgment needs confidence calibration?', 'What evidence quality, freshness, contradiction, or collection gap drives confidence?', 'What decision changes if confidence is low, moderate, or high?'],
    suggestedNextActions: ['Create judgment rows with probability word, confidence, evidence base, dissent, and decision implication.', 'Downgrade confidence where sourceability or freshness is weak.', 'Attach the table to an evidence annex or risk dashboard.'],
    agentWorkflow: { preferredAgentId: 'sourceability-reviewer', routeHint: 'estimative-confidence-calibration', outputGoal: 'evidence-sourceability-annex', approvalNotes: 'Human review required before high-confidence judgments or warning language are used externally.' },
    aiUseGuidance: 'Use this for uncertainty discipline. Do not allow PRAXIS to sound certain when evidence quality, freshness, or alternative hypotheses do not support it.',
    deviceProfile: buildStarterDeviceProfile('Estimative confidence calibration table', { deviceKind: 'estimative-confidence-table' }),
    humanReview: humanReviewed('Reviewed as an analytic tradecraft capsule for confidence language, sourceability, and decision implications.'),
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
    ...(starterDefinition.humanReview ? [
      `human_review: ${starterDefinition.humanReview.label}|${starterDefinition.humanReview.status}|${starterDefinition.humanReview.reviewedBy}|${starterDefinition.humanReview.reviewedAt}|${starterDefinition.humanReview.notes}`,
      `human_review_scope: ${starterDefinition.humanReview.scope}`,
      `human_review_author_or_publisher: ${starterDefinition.humanReview.authorOrPublisher}`,
      `human_review_jurisdiction: ${starterDefinition.humanReview.jurisdiction}`,
      `human_review_assumptions: ${starterDefinition.humanReview.assumptions.join(' | ')}`,
      `human_review_limitations: ${starterDefinition.humanReview.limitations.join(' | ')}`,
      `human_review_source_pack_summary: ${starterDefinition.humanReview.sourcePackSummary}`,
      `human_review_gate: ${starterDefinition.humanReview.humanReviewGate}`,
    ] : []),
    `recommended_tools: ${starterDefinition.recommendedToolIds.length ? starterDefinition.recommendedToolIds.join(', ') : 'none'}`,
    `output_targets: ${starterDefinition.outputProductIds.length ? starterDefinition.outputProductIds.join(', ') : 'none'}`,
    `suggested_questions: ${starterDefinition.suggestedQuestions.join(' | ')}`,
    `suggested_next_actions: ${starterDefinition.suggestedNextActions.join(' | ')}`,
    `agent_workflow: preferred_agent=${starterDefinition.agentWorkflow.preferredAgentId}; route_hint=${starterDefinition.agentWorkflow.routeHint}; output_goal=${starterDefinition.agentWorkflow.outputGoal}; approval_notes=${starterDefinition.agentWorkflow.approvalNotes}`,
    `ai_use_guidance: ${starterDefinition.aiUseGuidance}`,
    `rich_purpose: ${starterDefinition.richProfile.purpose}`,
    `rich_user_job: ${starterDefinition.richProfile.userJob}`,
    `rich_when_to_use: ${starterDefinition.richProfile.whenToUse.join(' | ')}`,
    `rich_when_not_to_use: ${starterDefinition.richProfile.whenNotToUse.join(' | ')}`,
    `rich_improves: ${starterDefinition.richProfile.improves.join(' | ')}`,
    `rich_evidence_requirements: ${starterDefinition.richProfile.evidenceRequirements.join(' | ')}`,
    `rich_risk_caveats: ${starterDefinition.richProfile.riskCaveats.join(' | ')}`,
    `rich_decision_prompts: ${starterDefinition.richProfile.decisionPrompts.join(' | ')}`,
    `rich_next_ideas: ${starterDefinition.richProfile.nextIdeas.join(' | ')}`,
    `rich_quality_rubric: ${starterDefinition.richProfile.qualityRubric.join(' | ')}`,
    `rich_agent_instructions: ${starterDefinition.richProfile.agentInstructions}`,
    ...(starterDefinition.deviceProfile ? [
      `device_kind: ${starterDefinition.deviceProfile.deviceKind}`,
      `device_reasoning_operation: ${starterDefinition.deviceProfile.reasoningOperation}`,
      `device_activation_criteria: ${starterDefinition.deviceProfile.activationCriteria.join(' | ')}`,
      `device_input_contract: ${starterDefinition.deviceProfile.inputContract.join(' | ')}`,
      `device_output_grammar: ${starterDefinition.deviceProfile.outputGrammar.join(' | ')}`,
      `device_method_steps: ${starterDefinition.deviceProfile.methodSteps.join(' | ')}`,
      `device_best_inputs: ${starterDefinition.deviceProfile.bestInputs.join(' | ')}`,
      `device_expected_outputs: ${starterDefinition.deviceProfile.expectedOutputs.join(' | ')}`,
      `device_disconfirming_checks: ${starterDefinition.deviceProfile.disconfirmingChecks.join(' | ')}`,
      `device_failure_modes: ${starterDefinition.deviceProfile.failureModes.join(' | ')}`,
      `device_human_review_gate: ${starterDefinition.deviceProfile.humanReviewGate}`,
      `device_confidence_policy: ${starterDefinition.deviceProfile.confidencePolicy}`,
      `device_forgetting_policy: ${starterDefinition.deviceProfile.forgettingPolicy}`,
      `device_cross_capsule_pairings: ${starterDefinition.deviceProfile.crossCapsulePairings.join(' | ')}`,
      `device_misuse_warnings: ${starterDefinition.deviceProfile.misuseWarnings.join(' | ')}`,
      `device_review_gate_type: ${starterDefinition.deviceProfile.reviewGateType}`,
      `device_agent_instructions: ${starterDefinition.deviceProfile.agentInstructions}`,
      `device_sourceability_requirements: ${starterDefinition.deviceProfile.sourceabilityRequirements.join(' | ')}`,
    ] : []),
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

export function runCapsuleStarterQualityAudit(starter: CapsuleStarterDefinition): CapsuleQualityAuditResult {
  const taxonomy = resolveCapsuleTaxonomy(starter);
  const findings: string[] = [];
  const sourceGaps: string[] = [];
  const agentInstructionGaps: string[] = [];
  const deviceProfileGaps: string[] = [];
  const sourcePackScore = scoreRatio(starter.sourcePack.length, 2);
  const excerptScore = scoreRatio(starter.excerpts.length, 2);
  const sourceMetadataScore = average(starter.sourcePack.map((source) => average([
    source.id ? 1 : 0,
    source.publisher ? 1 : 0,
    source.date ? 1 : 0,
    source.url.startsWith('https://') ? 1 : 0,
    source.relevance.length > 30 ? 1 : 0,
  ])));
  if (starter.sourcePack.length < 2) sourceGaps.push('Add at least two source-pack entries before relying on the capsule.');
  if (starter.excerpts.length < 2) sourceGaps.push('Add source-linked excerpts so claims can be inspected.');

  const agentInstructionScore = average([
    starter.agentWorkflow.preferredAgentId ? 1 : 0,
    starter.agentWorkflow.outputGoal.length > 20 ? 1 : 0,
    starter.agentWorkflow.approvalNotes.length > 20 ? 1 : 0,
    starter.aiUseGuidance.length > 40 ? 1 : 0,
    starter.richProfile.agentInstructions.includes(starter.label) ? 1 : 0,
  ]);
  if (agentInstructionScore < 1) agentInstructionGaps.push('Tighten agent instructions, output goal, or approval notes before promoting.');

  const device = starter.deviceProfile;
  const deviceScore = device
    ? average([
        scoreRatio(device.methodSteps.length, 4),
        scoreRatio(device.bestInputs.length, 3),
        scoreRatio(device.expectedOutputs.length, 2),
        scoreRatio(device.activationCriteria.length, 2),
        scoreRatio(device.inputContract.length, 2),
        scoreRatio(device.outputGrammar.length, 2),
        scoreRatio(device.disconfirmingChecks.length, 2),
        scoreRatio(device.failureModes.length, 2),
        scoreRatio(device.misuseWarnings.length, 2),
        /review|approval|human/i.test(device.humanReviewGate) ? 1 : 0,
        scoreRatio(device.sourceabilityRequirements.length, 2),
      ])
    : starter.category === 'tool'
      ? 0.85
      : 1;
  if (device && device.failureModes.length < 2) deviceProfileGaps.push('Add concrete failure modes for review before agent use.');
  if (device && device.sourceabilityRequirements.length < 2) deviceProfileGaps.push('Add sourceability requirements for review before agent use.');
  if (device && device.activationCriteria.length < 2) deviceProfileGaps.push('Add activation criteria so agents know when to attach the device.');
  if (device && device.inputContract.length < 2) deviceProfileGaps.push('Add an input contract so agents know the minimum context needed.');
  if (device && device.outputGrammar.length < 2) deviceProfileGaps.push('Add output grammar so device runs produce inspectable structure.');
  if (device && device.disconfirmingChecks.length < 2) deviceProfileGaps.push('Add disconfirming checks to prevent one-sided reasoning.');
  if (device && device.misuseWarnings.length < 2) deviceProfileGaps.push('Add misuse warnings before agent use.');

  const scores: CapsuleQualityAuditScores = {
    taxonomy: average([
      taxonomy.types.length ? 1 : 0,
      taxonomy.domains.length ? 1 : 0,
      taxonomy.policyTeams.length ? 1 : 0,
      starter.tags.includes(`type:${starter.category}`) ? 1 : 0,
      starter.tags.includes(`domain:${starter.domain}`) ? 1 : 0,
    ]),
    sourceability: average([sourcePackScore, excerptScore, sourceMetadataScore]),
    expertMethod: average([
      scoreRatio(starter.richProfile.qualityRubric.length, 4),
      scoreRatio(starter.richProfile.whenToUse.length, 3),
      scoreRatio(starter.richProfile.whenNotToUse.length, 2),
      deviceScore,
    ]),
    agentUsability: agentInstructionScore,
    reviewGate: average([
      starter.agentWorkflow.approvalNotes.length > 20 ? 1 : 0,
      device ? (/review|approval|human/i.test(device.humanReviewGate) ? 1 : 0) : 1,
      starter.aiUseGuidance.match(/source|citation|approval|verify/i) ? 1 : 0,
    ]),
    contentDepth: average([
      starter.summary.length > 20 ? 1 : 0,
      starter.detail.length > 40 ? 1 : 0,
      scoreRatio(starter.richProfile.nextIdeas.length, 3),
      scoreRatio(starter.suggestedQuestions.length, 2),
      scoreRatio(starter.suggestedNextActions.length, 3),
    ]),
  };

  for (const [key, value] of Object.entries(scores)) {
    if (value < 0.8) findings.push(`${key} score needs review before relying on this starter.`);
  }

  return {
    starterId: starter.starterId,
    label: starter.label,
    category: starter.category,
    scores,
    findings,
    sourceGaps,
    agentInstructionGaps,
    deviceProfileGaps,
    signals: ['rating_separate_from_quality', 'review_gated_improvements_only', 'firestore_canonical'],
  };
}

export function proposeCapsuleImprovementsFromQualityAudit(
  audit: CapsuleQualityAuditResult,
  input: { evidenceSourceIds?: string[]; generatedBy?: string } = {},
): CapsuleImprovementProposal[] {
  const evidenceSourceIds = uniqueStrings(input.evidenceSourceIds ?? [`audit:${audit.starterId}`]);
  const generatedBy = input.generatedBy ?? 'quality-audit';
  const proposals: CapsuleImprovementProposal[] = [];
  const add = (
    target: CapsuleImprovementProposalTarget,
    rationale: string,
    riskLevel: CapsuleImprovementProposal['riskLevel'],
  ) => {
    proposals.push({
      proposalId: stableReceiptPart(`${audit.starterId}:${target}:${rationale}`),
      starterId: audit.starterId,
      target,
      rationale,
      evidenceSourceIds,
      riskLevel,
      reviewStatus: 'proposed',
      generatedBy,
    });
  };

  if (audit.scores.taxonomy < 0.95) add('tags', 'Taxonomy tags should be reviewed before changing canonical capsule categorization.', 'low');
  if (audit.scores.sourceability < 0.95 || audit.sourceGaps.length) add('sourcePack', 'Source-pack gaps should become reviewable additions before canonical capsule mutation.', 'medium');
  if (audit.scores.agentUsability < 0.95 || audit.agentInstructionGaps.length) add('richProfile.agentInstructions', 'Agent instructions should be reviewed before they affect model-ready context.', 'medium');
  if (audit.deviceProfileGaps.some((gap) => gap.includes('failure modes'))) add('deviceProfile.failureModes', 'Failure-mode refinements should be reviewed before agent use.', 'low');
  if (audit.deviceProfileGaps.some((gap) => gap.includes('sourceability'))) add('deviceProfile.sourceabilityRequirements', 'Sourceability requirements should be reviewed before agent use.', 'low');
  if (audit.scores.reviewGate < 0.95) add('agentWorkflow.approvalNotes', 'Review gates should be explicit before canonical capsule promotion.', 'medium');
  if (audit.scores.contentDepth < 0.95) add('suggestedNextActions', 'Next actions should be reviewed for output usability before canonical updates.', 'low');

  return proposals;
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
    const knownDomain = starterDomainValues.has(clean) ||
      POLICY_TEAM_CATEGORIES.some((category) => category.domainId === clean) ||
      Boolean(getPolicyTeamCategory(clean));
    if (source === 'repair' || clean === 'custom' || !knownDomain) {
      const repairState = clean === 'custom' ? 'custom' : 'unknown';
      domainFacets.set(`${repairState}:${clean}`, {
        id: repairState,
        value: clean,
        label: repairState === 'custom' ? 'Custom domain' : `Unknown domain: ${clean}`,
        tag: `domain:${clean}`,
        source: 'repair',
        repairState,
      });
      return;
    }
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
      if (!facet.repairState) addFacet(typeCounts, facet);
      addRepair('types', facet);
    }
    for (const facet of taxonomy.domains) {
      if (!facet.repairState) addFacet(domainCounts, facet);
      addRepair('domains', facet);
    }
    for (const facet of taxonomy.policyTeams) {
      if (!facet.repairState) addFacet(teamCounts, facet);
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

function scoreRatio(value: number, target: number): number {
  return Math.max(0, Math.min(1, value / target));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
