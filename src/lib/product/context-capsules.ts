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
    description: 'Read-only feeds and integrations such as GDELT, UCDP, ReliefWeb, HDX, UN News, World Bank, grounded Google Search, and private library sources.',
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

export type PolicyPathId =
  | 'generic-policy'
  | 'foreign-policy'
  | 'conflict-resolution'
  | 'mediator-peace-process'
  | 'humanitarian-analysis'
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
  },
  {
    id: 'foreign-policy',
    label: 'Foreign policy analyst',
    userFrame: 'Diplomacy, conflict, sanctions, multilateral institutions, and briefing language.',
    defaultTemplates: ['conflict-analysis', 'regulatory-watch', 'public-sector-memo'],
    suggestedTools: ['Source Scout', 'Timeline Events', 'Power Map', 'Policy Memo'],
    suggestedOutputs: ['Diplomatic brief', 'Sourceable options memo', 'Talking points'],
  },
  {
    id: 'conflict-resolution',
    label: 'Conflict resolution practitioner',
    userFrame: 'Actors, interests, commitments, mediation timing, ripeness, and spoilers.',
    defaultTemplates: ['conflict-analysis', 'temporal-causal-map', 'human-friction-map'],
    suggestedTools: ['Stakeholder Map', 'Mediation Design', 'Scenario Review', 'Red-team review'],
    suggestedOutputs: ['Mediation brief', 'Actor-interest map', 'Process design note'],
  },
  {
    id: 'mediator-peace-process',
    label: 'Mediator / peace process practitioner',
    userFrame: 'Parties, interests, red lines, confidence-building measures, commitments, and process sequencing.',
    defaultTemplates: ['conflict-analysis', 'human-friction-map', 'decision-clock'],
    suggestedTools: ['Mediation Design', 'Stakeholder Map', 'Commitment Scan', 'Scenario Review'],
    suggestedOutputs: ['Process design note', 'Party-position brief', 'Confidence-building memo'],
  },
  {
    id: 'humanitarian-analysis',
    label: 'Humanitarian analyst',
    userFrame: 'Access constraints, needs, protection risks, affected populations, operational partners, and source freshness.',
    defaultTemplates: ['crisis-brief', 'decision-clock', 'temporal-causal-map'],
    suggestedTools: ['Humanitarian Snapshot', 'ReliefWeb Search', 'Risk Indicators', 'Daily Brief'],
    suggestedOutputs: ['Humanitarian situation brief', 'Access risk note', 'Operational handover'],
  },
  {
    id: 'defence-capture',
    label: 'Defence capture lead',
    userFrame: 'Requirements, procurement timeline, approval path, competitors, and blockers.',
    defaultTemplates: ['defence-opportunity', 'board-brief', 'agent-handover'],
    suggestedTools: ['Requirements map', 'Power Map', 'Timeline Events', 'Board Brief'],
    suggestedOutputs: ['Capture brief', 'Opportunity map', 'Executive decision note'],
  },
  {
    id: 'public-affairs',
    label: 'Public affairs lead',
    userFrame: 'Regulatory movement, stakeholder posture, narrative risk, and public messaging.',
    defaultTemplates: ['regulatory-watch', 'public-sector-memo', 'board-brief'],
    suggestedTools: ['Regulatory Watch', 'Media Compass', 'Stakeholder Map', 'Talking Points'],
    suggestedOutputs: ['Regulatory memo', 'Stakeholder brief', 'Narrative posture note'],
  },
  {
    id: 'public-sector-policy',
    label: 'Public-sector policy officer',
    userFrame: 'Decision memos, implementation constraints, statutory duties, stakeholder effects, and ministerial language.',
    defaultTemplates: ['public-sector-memo', 'regulatory-watch', 'director-handover'],
    suggestedTools: ['Policy Memo', 'Stakeholder Map', 'Citation Repair', 'Red-team review'],
    suggestedOutputs: ['Options memo', 'Ministerial submission', 'Implementation note'],
  },
  {
    id: 'regulatory-public-affairs',
    label: 'Regulatory / public affairs analyst',
    userFrame: 'Rule movement, affected entities, consultation windows, enforcement posture, and communications risk.',
    defaultTemplates: ['regulatory-watch', 'board-brief', 'public-sector-memo'],
    suggestedTools: ['Regulatory Watch', 'Media Compass', 'Timeline Events', 'Talking Points'],
    suggestedOutputs: ['Regulatory update', 'Stakeholder map', 'Public affairs brief'],
  },
  {
    id: 'hr-policy',
    label: 'HR policy owner',
    userFrame: 'Internal rules, affected groups, approvals, comms, legal review, and rollout.',
    defaultTemplates: ['hr-policy-review', 'director-handover', 'agent-handover'],
    suggestedTools: ['Spec Check', 'Impact Review', 'Approval Path', 'Memo Drafter'],
    suggestedOutputs: ['Policy rollout note', 'Employee impact brief', 'Review packet'],
  },
  {
    id: 'legal-compliance',
    label: 'Legal and compliance analyst',
    userFrame: 'Rules, entity exposure, source receipts, contradictions, and sign-off posture.',
    defaultTemplates: ['sanctions-compliance', 'regulatory-watch', 'public-sector-memo'],
    suggestedTools: ['Sanctions Check', 'Treaty Analyze', 'Citation Repair', 'Red-team review'],
    suggestedOutputs: ['Compliance note', 'Exposure memo', 'Review receipt'],
  },
  {
    id: 'crisis-management',
    label: 'Crisis manager',
    userFrame: 'Episodes, deadlines, changing actors, escalation, decisions, and executive updates.',
    defaultTemplates: ['crisis-brief', 'decision-clock', 'director-handover'],
    suggestedTools: ['Timeline Events', 'Risk Indicators', 'Daily Brief', 'Executive Intelligence'],
    suggestedOutputs: ['Situation brief', 'Decision log', 'Morning update'],
  },
  {
    id: 'strategy-operations',
    label: 'Strategy operator',
    userFrame: 'Board context, market/regulatory shifts, institutional constraints, and decisions.',
    defaultTemplates: ['board-brief', 'regulatory-watch', 'defence-opportunity'],
    suggestedTools: ['Scenario Review', 'Power Map', 'Board Brief', 'Red-team review'],
    suggestedOutputs: ['Board memo', 'Strategy brief', 'Decision options note'],
  },
  {
    id: 'program-delivery',
    label: 'Program officer',
    userFrame: 'Implementation context, local actors, source gaps, delivery risks, and handover.',
    defaultTemplates: ['public-sector-memo', 'crisis-brief', 'director-handover'],
    suggestedTools: ['Sourceability check', 'Risk Indicators', 'Timeline Events', 'Handover Pack'],
    suggestedOutputs: ['Implementation brief', 'Risk note', 'Program handover'],
  },
  {
    id: 'research-direction',
    label: 'Research director',
    userFrame: 'Team memory, review quality, reusable capsule library, and inheritable standards.',
    defaultTemplates: ['director-handover', 'board-brief', 'agent-handover'],
    suggestedTools: ['Red-team review', 'Sourceability check', 'Memo Studio', 'Agent Handover'],
    suggestedOutputs: ['Research handover', 'Quality review', 'Reusable capsule template'],
  },
  {
    id: 'human-rights-accountability',
    label: 'Human rights / accountability analyst',
    userFrame: 'Allegations, actors, legal thresholds, source reliability, chain of custody, and review gaps.',
    defaultTemplates: ['sanctions-compliance', 'conflict-analysis', 'public-sector-memo'],
    suggestedTools: ['Human Rights Review', 'Treaty Analyze', 'Sourceability check', 'Red-team review'],
    suggestedOutputs: ['Accountability brief', 'Allegation matrix', 'Legal risk note'],
  },
];

export const POLICY_TEAM_CATEGORIES: PolicyTeamCategory[] = [
  {
    id: 'economic-sanctions',
    label: 'Economic & sanctions',
    shortLabel: 'Economic',
    description: 'Sanctions, trade controls, financial exposure, markets, development finance, and economic statecraft.',
    domainId: 'economic-sanctions',
    policyPathIds: ['legal-compliance', 'strategy-operations', 'public-affairs'],
    templateIds: ['sanctions-compliance', 'regulatory-watch', 'board-brief'],
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
    sourceTags: ['un-news', 'crisis-group', 'diplomacy', 'mediation', 'negotiation'],
    missingInfoPrompts: ['Who is the audience for the brief?', 'Which parties or institutions must be represented?', 'What red lines or mandate limits matter?'],
  },
  {
    id: 'security-defence',
    label: 'Security & defence',
    shortLabel: 'Security',
    description: 'Armed conflict, defence capture, escalation, force posture, procurement, and security risk.',
    domainId: 'armed-conflict-security',
    policyPathIds: ['defence-capture', 'conflict-resolution', 'crisis-management'],
    templateIds: ['defence-opportunity', 'temporal-causal-map', 'human-friction-map'],
    toolIds: ['stakeholder-map', 'scenario-projector', 'coalition-detector', 'ach'],
    outputProductIds: ['actor-power-map', 'situation-brief', 'board-brief'],
    sourceTags: ['ucdp', 'gdelt', 'sipri', 'defence', 'security'],
    missingInfoPrompts: ['Which actors and capabilities are in scope?', 'What decision window or procurement gate matters?', 'Which sources are trusted for security claims?'],
  },
  {
    id: 'humanitarian',
    label: 'Humanitarian',
    shortLabel: 'Humanitarian',
    description: 'Needs, access, displacement, protection, operations, and humanitarian coordination.',
    domainId: 'humanitarian',
    policyPathIds: ['humanitarian-analysis', 'program-delivery', 'crisis-management'],
    templateIds: ['crisis-brief', 'decision-clock', 'temporal-causal-map'],
    toolIds: ['grounded-research', 'sourceability', 'scenario-projector', 'memo-drafter'],
    outputProductIds: ['situation-brief', 'agent-handover', 'options-memo'],
    sourceTags: ['reliefweb', 'hdx', 'ocha', 'unhcr', 'protection'],
    missingInfoPrompts: ['Which affected populations are in scope?', 'What access or protection constraint is decision-relevant?', 'How current must the operational picture be?'],
  },
  {
    id: 'human-rights-legal',
    label: 'Human rights & legal',
    shortLabel: 'Rights/legal',
    description: 'Rights allegations, accountability, legal thresholds, compliance, and review receipts.',
    domainId: 'human-rights',
    policyPathIds: ['human-rights-accountability', 'legal-compliance', 'public-sector-policy'],
    templateIds: ['sanctions-compliance', 'conflict-analysis', 'public-sector-memo'],
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
    policyPathIds: ['program-delivery', 'humanitarian-analysis', 'strategy-operations'],
    templateIds: ['public-sector-memo', 'crisis-brief', 'board-brief'],
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
    policyPathIds: ['public-affairs', 'foreign-policy', 'strategy-operations'],
    templateIds: ['regulatory-watch', 'crisis-brief', 'board-brief'],
    toolIds: ['grounded-research', 'frame-narrative', 'contradiction-finder', 'memo-drafter'],
    outputProductIds: ['situation-brief', 'options-memo', 'board-brief'],
    sourceTags: ['gdelt', 'media', 'narrative', 'disinformation', 'cyber'],
    missingInfoPrompts: ['Which narrative or platform is in scope?', 'What language or geography should be watched?', 'What response or memo is needed?'],
  },
  {
    id: 'crisis-ops',
    label: 'Crisis & operations',
    shortLabel: 'Crisis/ops',
    description: 'Fast-moving incidents, decisions, handovers, daily briefs, and operational next actions.',
    domainId: 'armed-conflict-security',
    policyPathIds: ['crisis-management', 'program-delivery', 'research-direction'],
    templateIds: ['crisis-brief', 'decision-clock', 'human-friction-map'],
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

export const CAPSULE_OUTPUT_PRODUCTS: CapsuleOutputProduct[] = [
  {
    id: 'options-memo',
    label: 'Options memo',
    description: 'A sourced decision memo with choices, tradeoffs, risks, and recommendation posture.',
    bestFor: ['generic-policy', 'foreign-policy', 'public-affairs', 'strategy-operations'],
  },
  {
    id: 'situation-brief',
    label: 'Situation brief',
    description: 'A compact update on what changed, why it matters, and what decisions are now live.',
    bestFor: ['foreign-policy', 'crisis-management', 'program-delivery'],
  },
  {
    id: 'actor-power-map',
    label: 'Actor and power map',
    description: 'A structured map of actors, approvers, blockers, incentives, claims, and influence.',
    bestFor: ['conflict-resolution', 'defence-capture', 'public-affairs'],
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
    bestFor: ['legal-compliance', 'hr-policy', 'public-affairs'],
  },
  {
    id: 'agent-handover',
    label: 'Agent handover',
    description: 'Allowed actions, prohibited actions, escalation rules, source scope, and output goals.',
    bestFor: ['generic-policy', 'research-direction', 'crisis-management', 'program-delivery'],
  },
];

export function getPolicyTeamCategory(id: string | null | undefined): PolicyTeamCategory | null {
  if (!id) return null;
  return POLICY_TEAM_CATEGORIES.find((category) => category.id === id) ?? null;
}

export function categoryTagsForPolicyTeam(category: PolicyTeamCategory): string[] {
  return [category.id, ...category.policyPathIds, ...category.sourceTags];
}

export function policyTeamCategoryForTags(tags: string[] | null | undefined): PolicyTeamCategory | null {
  const normalized = new Set((tags ?? []).map((tag) => tag.toLowerCase()));
  return POLICY_TEAM_CATEGORIES.find((category) => normalized.has(category.id)) ??
    POLICY_TEAM_CATEGORIES.find((category) => category.sourceTags.some((tag) => normalized.has(tag))) ??
    POLICY_TEAM_CATEGORIES.find((category) => category.policyPathIds.some((pathId) => normalized.has(pathId))) ??
    null;
}

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

function stableReceiptPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'source';
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
    redirect: '/app/assistant',
  });
  if (prompt.trim()) params.set('capsulePrompt', prompt.trim());
  if (templateId) params.set('capsuleTemplate', templateId);
  if (pathId) params.set('capsulePath', pathId);
  if (outputGoal?.trim()) params.set('capsuleOutput', outputGoal.trim());
  return `/login?${params.toString()}`;
}
