import type { TaskKind } from '@/lib/ai/model-matrix';

export type PolicyAgentCategory = 'analysis' | 'monitoring' | 'review' | 'handover';

export type PolicyAgentReadiness = 'live' | 'queued' | 'planned' | 'gated';

export type PolicyAgentApprovalLevel = 'none' | 'confirm' | 'approval_required' | 'sandbox_required';

export type PolicyAgentOutputDestination = 'memo_studio' | 'canvas' | 'library' | 'handover';

export type PolicyAgentRiskLevel = 'low' | 'medium' | 'high';

export type PolicyAgentCapsuleSlot =
  | 'user'
  | 'situation'
  | 'sources'
  | 'documents'
  | 'tools'
  | 'outputs'
  | 'memory'
  | 'handover';

export type HomeSurfaceMode = 'public' | 'authenticated';

export type PolicyAgentRunIntent =
  | 'normal_answer'
  | 'capsule_factory'
  | 'research_memo'
  | 'source_gap_scout'
  | 'capsule_quality_review'
  | 'daily_brief'
  | 'boardroom_discussion'
  | 'sourceability_review'
  | 'difference_check'
  | 'media_summary'
  | 'human_friction_analysis'
  | 'format_output'
  | 'red_team_review'
  | 'handover';

export type PolicyAgentCapability =
  | 'capsule_builder'
  | 'writer_drafter'
  | 'source_gap_scout'
  | 'capsule_quality_review'
  | 'boardroom_deliberation'
  | 'output_formatter'
  | 'daily_briefing'
  | 'conflict_monitoring'
  | 'source_checker'
  | 'red_team_review'
  | 'difference_checker'
  | 'media_summarizer'
  | 'human_friction_analyst'
  | 'handover_builder';

export type ApprovalGateActionType =
  | 'external_send'
  | 'graph_mutation'
  | 'unsupported_claim_acceptance'
  | 'browser_action'
  | 'mcp_write'
  | 'memo_export';

export type ApprovalGateRiskLevel = 'low' | 'medium' | 'high';

export type ApprovalGateStatus = 'not_required' | 'required' | 'pending' | 'approved' | 'rejected';

export interface ApprovalGate {
  actionType: ApprovalGateActionType;
  riskLevel: ApprovalGateRiskLevel;
  status: ApprovalGateStatus;
  destination: PolicyAgentOutputDestination | 'external' | 'graph' | 'browser' | 'mcp';
  receiptId: string | null;
}

export interface ContextCapsuleLauncherState {
  prompt: string;
  selectedCapsuleId: string;
  selectedPolicyAgentId: string;
  outputDestination: PolicyAgentOutputDestination;
}

export const PENDING_TASKLET_PROMPT_KEY = 'praxis.pending.taskletPrompt';
export const PENDING_POLICY_AGENT_ID_KEY = 'praxis.pending.policyAgentId';

export interface PolicyAgentDefinition {
  id: string;
  label: string;
  category: PolicyAgentCategory;
  capability: PolicyAgentCapability;
  description: string;
  inputContract: string;
  outputContract: string;
  modelTaskKind: TaskKind;
  requiredCores: string[];
  inputTypes: string[];
  outputDestination: PolicyAgentOutputDestination;
  approvalLevel: PolicyAgentApprovalLevel;
  readiness: PolicyAgentReadiness;
  riskLevel: PolicyAgentRiskLevel;
  allowedTools: string[];
  recommendedToolIds: string[];
  capsuleSlots: PolicyAgentCapsuleSlot[];
  actionLabel: string;
  deferredCapabilities?: string[];
}

export const PRAXIS_POLICY_AGENTS: PolicyAgentDefinition[] = [
  {
    id: 'capsule-factory',
    label: 'Capsule AI',
    category: 'analysis',
    capability: 'capsule_builder',
    description: 'Builds or improves draft ContextCapsule cores as reusable expert-thinking blocks with provenance, source gaps, suggested tools, and confirmation gates.',
    inputContract: 'Agent Context Packet plus prompt, capsule slots, documents, source receipts, and requested capsule improvements.',
    outputContract: 'Review-gated ContextCapsule improvement draft with provenance, source gaps, suggested tools, and confirmation gates.',
    modelTaskKind: 'complex_reasoning',
    requiredCores: ['User Core', 'Situation Core', 'Source Core', 'Tool Core', 'Output Core'],
    inputTypes: ['prompt', 'capsule', 'documents', 'source receipts'],
    outputDestination: 'library',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'capsule-repository-read', 'grounded-search', 'sourceability-reviewer'],
    recommendedToolIds: ['context-resolve', 'capsule-repository-read', 'grounded-search', 'sourceability-reviewer'],
    capsuleSlots: ['user', 'situation', 'sources', 'documents', 'tools', 'outputs'],
    actionLabel: 'Improve capsule',
  },
  {
    id: 'research-memo',
    label: 'Writer / Drafter',
    category: 'analysis',
    capability: 'writer_drafter',
    description: 'Turns the active ContextCapsule into a reviewable policy memo draft with source and gap receipts.',
    inputContract: 'Agent Context Packet plus prompt, capsule evidence pack, source receipts, output goal, and requested memo or brief format.',
    outputContract: 'Memo, brief, or section draft in the capsule output format with inline receipt references, caveats, gaps, and export blockers.',
    modelTaskKind: 'writing_quality',
    requiredCores: ['User Core', 'Situation Core', 'Source Core', 'Output Core'],
    inputTypes: ['prompt', 'capsule', 'documents', 'policy sources'],
    outputDestination: 'memo_studio',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'document-retrieve', 'grounded-search', 'policy-memo', 'sourceability-reviewer'],
    recommendedToolIds: ['context-resolve', 'document-retrieve', 'grounded-search', 'policy-memo', 'sourceability-reviewer'],
    capsuleSlots: ['user', 'situation', 'sources', 'documents', 'outputs'],
    actionLabel: 'Run memo agent',
  },
  {
    id: 'source-gap-scout',
    label: 'Source-Gap Scout',
    category: 'review',
    capability: 'source_gap_scout',
    description: 'Finds current candidate sources for active capsule evidence gaps and unsupported claims, then stores them as review-gated source-pack cards.',
    inputContract: 'Agent Context Packet plus sourceability ledger, unsupported claims, active source gaps, and freshness requirements.',
    outputContract: 'Candidate source-pack cards with source receipt ids, confidence notes, and review-gated promotion posture.',
    modelTaskKind: 'balanced',
    requiredCores: ['Situation Core', 'Source Core', 'Output Core'],
    inputTypes: ['capsule gaps', 'unsupported claims', 'sourceability ledger'],
    outputDestination: 'library',
    approvalLevel: 'none',
    readiness: 'live',
    riskLevel: 'low',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'grounded-search', 'sourceability-reviewer', 'source-gap-scout'],
    recommendedToolIds: ['context-resolve', 'capsule-evidence-pack', 'grounded-search', 'sourceability-reviewer', 'source-gap-scout'],
    capsuleSlots: ['situation', 'sources', 'documents', 'outputs'],
    actionLabel: 'Find sources',
  },
  {
    id: 'capsule-quality-review',
    label: 'Capsule quality review',
    category: 'review',
    capability: 'capsule_quality_review',
    description: 'Reviews the active capsule and files improvement proposals for your approval.',
    inputContract: 'Agent Context Packet plus active capsule, quality deficits, review queue, and readiness criteria.',
    outputContract: 'Review cards proposing source, claim, graph, instruction, or operability improvements without mutating canonical state.',
    modelTaskKind: 'balanced',
    requiredCores: ['Situation Core', 'Source Core', 'Output Core'],
    inputTypes: ['active capsule', 'quality deficits', 'review queue'],
    outputDestination: 'library',
    approvalLevel: 'none',
    readiness: 'live',
    riskLevel: 'low',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'sourceability-reviewer', 'capsule-quality-review'],
    recommendedToolIds: ['context-resolve', 'capsule-evidence-pack', 'sourceability-reviewer', 'capsule-quality-review'],
    capsuleSlots: ['situation', 'sources', 'documents', 'tools', 'outputs'],
    actionLabel: 'Review quality',
  },
  {
    id: 'boardroom-discussion',
    label: 'Boardroom Discussion',
    category: 'analysis',
    capability: 'boardroom_deliberation',
    description: 'Runs a chair-led, capsule-grounded boardroom deliberation with participant lenses, transcript proof, evidence stats, and a board-executive pack.',
    inputContract: 'Agent Context Packet plus prompt, participant lenses, documents, source receipts, and boardroom output goal.',
    outputContract: 'Boardroom transcript, chair synthesis, evidence stats, risks, open questions, and reviewable executive pack.',
    modelTaskKind: 'complex_reasoning',
    requiredCores: ['User Core', 'Situation Core', 'Source Core', 'Document Core', 'Output Core'],
    inputTypes: ['prompt', 'capsule', 'documents', 'source receipts', 'participant lenses'],
    outputDestination: 'library',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'boardroom-deliberation', 'sourceability-reviewer', 'red-team-review', 'board-executive-pack', 'output-capsule-save'],
    recommendedToolIds: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'boardroom-deliberation', 'sourceability-reviewer', 'red-team-review', 'board-executive-pack', 'output-capsule-save'],
    capsuleSlots: ['user', 'situation', 'sources', 'documents', 'tools', 'outputs', 'memory'],
    actionLabel: 'Open boardroom',
  },
  {
    id: 'output-formatter',
    label: 'Output Formatter',
    category: 'analysis',
    capability: 'output_formatter',
    description: 'Turns a PRAXIS answer, memo draft, or capsule notes into a structured Markdown, DOCX, PDF, or handover-ready work product.',
    inputContract: 'Agent Context Packet plus answer, memo draft, uploaded document, capsule notes, and requested export shape.',
    outputContract: 'Structured Markdown, DOCX/PDF-ready memo, briefing pack, or handover-ready work product with sourceability notes.',
    modelTaskKind: 'writing_quality',
    requiredCores: ['Output Core', 'Document Core', 'Source Core'],
    inputTypes: ['memo draft', 'assistant answer', 'uploaded document', 'capsule'],
    outputDestination: 'memo_studio',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'memo-formatter', 'sourceability-reviewer', 'handover-package'],
    recommendedToolIds: ['context-resolve', 'memo-formatter', 'sourceability-reviewer', 'handover-package'],
    capsuleSlots: ['documents', 'sources', 'outputs', 'handover'],
    actionLabel: 'Run formatter',
  },
  {
    id: 'daily-brief',
    label: 'Daily Brief Agent',
    category: 'monitoring',
    capability: 'daily_briefing',
    description: 'Prepares a recurring review-gated memo draft from fresh grounded search, capsule deltas, and open questions.',
    inputContract: 'Agent Context Packet plus watchlist, capsule deltas, fresh grounded receipts, and open questions.',
    outputContract: 'Dated review-gated brief draft with source receipts, capsule deltas, suggested actions, and unresolved gaps.',
    modelTaskKind: 'writing_quality',
    requiredCores: ['Situation Core', 'Source Core', 'Time Core'],
    inputTypes: ['grounded search', 'watchlist', 'capsule deltas'],
    outputDestination: 'memo_studio',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'grounded-search', 'daily-brief', 'policy-memo', 'output-capsule-save'],
    recommendedToolIds: ['context-resolve', 'capsule-evidence-pack', 'grounded-search', 'daily-brief', 'policy-memo', 'output-capsule-save'],
    capsuleSlots: ['situation', 'sources', 'memory', 'outputs'],
    actionLabel: 'Run daily brief',
  },
  {
    id: 'conflict-monitor',
    label: 'Conflict Monitor',
    category: 'monitoring',
    capability: 'conflict_monitoring',
    description: 'Tracks actor, event, commitment, and source changes for conflict and statecraft cases.',
    inputContract: 'Agent Context Packet plus source watchlist, graph/time cores, actor map, and monitoring criteria.',
    outputContract: 'Change digest and review-gated monitoring notes for actor, event, commitment, source, and graph updates.',
    modelTaskKind: 'balanced',
    requiredCores: ['Situation Core', 'Source Core', 'Graph Core', 'Time Core'],
    inputTypes: ['Google Search grounding', 'web crawler receipts', 'user documents'],
    outputDestination: 'canvas',
    approvalLevel: 'approval_required',
    readiness: 'planned',
    riskLevel: 'high',
    allowedTools: ['context-resolve', 'source-monitor', 'graph-proposal'],
    recommendedToolIds: ['context-resolve', 'grounded-search', 'sourceability-reviewer'],
    capsuleSlots: ['situation', 'sources', 'tools', 'memory'],
    actionLabel: 'Discuss monitor',
  },
  {
    id: 'sourceability-reviewer',
    label: 'Sourceability Reviewer',
    category: 'review',
    capability: 'source_checker',
    description: 'Audits claims, missing sources, contradictions, receipt relevance, freshness, and source credibility before an output hardens.',
    inputContract: 'Agent Context Packet plus memo draft, answer, source set, sourceability ledger, and freshness/credibility requirements.',
    outputContract: 'Sourceability ledger with verified, weak, unsupported, stale, irrelevant, and credibility-risk findings plus required review blockers.',
    modelTaskKind: 'complex_reasoning',
    requiredCores: ['Source Core', 'Document Core', 'Output Core'],
    inputTypes: ['memo draft', 'answer', 'source set'],
    outputDestination: 'memo_studio',
    approvalLevel: 'none',
    readiness: 'queued',
    riskLevel: 'low',
    allowedTools: ['context-resolve', 'document-retrieve', 'sourceability-reviewer'],
    recommendedToolIds: ['context-resolve', 'document-retrieve', 'grounded-search', 'sourceability-reviewer'],
    capsuleSlots: ['sources', 'documents', 'outputs'],
    actionLabel: 'Discuss sources',
  },
  {
    id: 'red-team-analyst',
    label: 'Red-Team Analyst',
    category: 'review',
    capability: 'red_team_review',
    description: 'Challenges assumptions, options, incentives, and evidence quality from the active capsule.',
    inputContract: 'Agent Context Packet plus memo draft, policy option, actor map, assumptions, and evidence ledger.',
    outputContract: 'Adversarial review findings with assumption challenges, incentive risks, evidence caveats, and revision recommendations.',
    modelTaskKind: 'complex_reasoning',
    requiredCores: ['User Core', 'Situation Core', 'Graph Core', 'Output Core'],
    inputTypes: ['memo draft', 'policy option', 'actor map'],
    outputDestination: 'memo_studio',
    approvalLevel: 'confirm',
    readiness: 'queued',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'red-team-review', 'sourceability-reviewer'],
    recommendedToolIds: ['context-resolve', 'red-team-review', 'sourceability-reviewer'],
    capsuleSlots: ['user', 'situation', 'sources', 'outputs'],
    actionLabel: 'Discuss challenge',
  },
  {
    id: 'difference-checker',
    label: 'Difference Checker',
    category: 'review',
    capability: 'difference_checker',
    description: 'Compares two positions, claims, sources, or capsule versions and reports deltas, conflicts, and evidentiary implications.',
    inputContract: 'Agent Context Packet plus two or more claims, sources, positions, memo sections, or capsule versions to compare.',
    outputContract: 'Delta and conflict report with aligned points, contradictions, changed assumptions, source conflicts, and review blockers.',
    modelTaskKind: 'complex_reasoning',
    requiredCores: ['Situation Core', 'Source Core', 'Document Core', 'Output Core'],
    inputTypes: ['claims', 'positions', 'sources', 'capsule versions', 'memo sections'],
    outputDestination: 'memo_studio',
    approvalLevel: 'none',
    readiness: 'queued',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'sourceability-reviewer', 'red-team-review'],
    recommendedToolIds: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'sourceability-reviewer', 'red-team-review'],
    capsuleSlots: ['situation', 'sources', 'documents', 'outputs'],
    actionLabel: 'Compare differences',
  },
  {
    id: 'media-summarizer',
    label: 'Media Summarizer',
    category: 'analysis',
    capability: 'media_summarizer',
    description: 'Summarizes documents, transcripts, and media-derived text into source-cited claims and capsule-ready notes.',
    inputContract: 'Agent Context Packet plus document chunks, transcript text, media-derived text, source receipts, and summary goal.',
    outputContract: 'Source-cited claim summary with extracted claims, speaker/source attributions, uncertainties, and follow-up source gaps.',
    modelTaskKind: 'long_context',
    requiredCores: ['Document Core', 'Source Core', 'Output Core'],
    inputTypes: ['documents', 'transcripts', 'media text', 'source receipts'],
    outputDestination: 'library',
    approvalLevel: 'none',
    readiness: 'queued',
    riskLevel: 'low',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'sourceability-reviewer'],
    recommendedToolIds: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'sourceability-reviewer'],
    capsuleSlots: ['documents', 'sources', 'outputs'],
    actionLabel: 'Summarize media',
  },
  {
    id: 'human-friction-analyst',
    label: 'Human-Friction Analyst',
    category: 'analysis',
    capability: 'human_friction_analyst',
    description: 'Applies the ACO lens to surface conflict dynamics, spoilers, leverage, commitments, narratives, and escalation risk.',
    inputContract: 'Agent Context Packet plus actor map, claims, interests, constraints, leverage, commitments, events, narratives, and policy question.',
    outputContract: 'ACO analysis with actor/claim/interest/constraint/leverage/commitment/event/narrative findings, spoiler risks, escalation signals, and source caveats.',
    modelTaskKind: 'complex_reasoning',
    requiredCores: ['User Core', 'Situation Core', 'Graph Core', 'Source Core', 'Output Core'],
    inputTypes: ['actor map', 'claims', 'graph context', 'policy options', 'source receipts'],
    outputDestination: 'canvas',
    approvalLevel: 'confirm',
    readiness: 'queued',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'sourceability-reviewer', 'red-team-review'],
    recommendedToolIds: ['context-resolve', 'capsule-evidence-pack', 'sourceability-reviewer', 'red-team-review'],
    capsuleSlots: ['user', 'situation', 'sources', 'tools', 'outputs', 'memory'],
    actionLabel: 'Analyze friction',
  },
  {
    id: 'handover-builder',
    label: 'Handover Builder',
    category: 'handover',
    capability: 'handover_builder',
    description: 'Packages the capsule, memo, open gaps, receipts, and next moves for another analyst or agent.',
    inputContract: 'Agent Context Packet plus capsule, memo/output history, run ledger, sourceability ledger, gaps, and next-move requirements.',
    outputContract: 'Handover package with capsule state, output links, open gaps, source receipts, next actions, and successor-agent instructions.',
    modelTaskKind: 'writing_quality',
    requiredCores: ['User Core', 'Situation Core', 'Source Core', 'Output Core', 'Memory Core'],
    inputTypes: ['capsule', 'memo', 'run ledger'],
    outputDestination: 'handover',
    approvalLevel: 'confirm',
    readiness: 'queued',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'memo-formatter', 'handover-package'],
    recommendedToolIds: ['context-resolve', 'memo-formatter', 'handover-package', 'sourceability-reviewer'],
    capsuleSlots: ['user', 'situation', 'sources', 'outputs', 'memory', 'handover'],
    actionLabel: 'Discuss handover',
  },
];

export const FORBIDDEN_MVP_INTEGRATION_CLAIMS = [
  'filesystem',
  'shell',
  'browser',
  'gmail',
  'slack',
  'google drive',
] as const;

export function getPolicyAgent(id: string | null | undefined): PolicyAgentDefinition | null {
  return PRAXIS_POLICY_AGENTS.find((agent) => agent.id === id) ?? null;
}

export function policyAgentRunIntent(agentId: string | null | undefined): PolicyAgentRunIntent {
  switch (agentId) {
    case 'capsule-factory':
      return 'capsule_factory';
    case 'research-memo':
      return 'research_memo';
    case 'source-gap-scout':
      return 'source_gap_scout';
    case 'capsule-quality-review':
      return 'capsule_quality_review';
    case 'daily-brief':
      return 'daily_brief';
    case 'boardroom-discussion':
      return 'boardroom_discussion';
    case 'sourceability-reviewer':
      return 'sourceability_review';
    case 'output-formatter':
      return 'format_output';
    case 'red-team-analyst':
      return 'red_team_review';
    case 'difference-checker':
      return 'difference_check';
    case 'media-summarizer':
      return 'media_summary';
    case 'human-friction-analyst':
      return 'human_friction_analysis';
    case 'handover-builder':
      return 'handover';
    default:
      return 'normal_answer';
  }
}

export function policyAgentLoginHref(agentId: string, _prompt: string): string {
  const params = new URLSearchParams({
    mode: 'signup',
    redirect: `/app?${new URLSearchParams({ policyAgentId: agentId })}`,
  });
  return `/login?${params.toString()}`;
}

export function destinationHref(destination: PolicyAgentOutputDestination): string {
  switch (destination) {
    case 'memo_studio':
      return '/app';
    case 'canvas':
      return '/app';
    case 'library':
      return '/app';
    case 'handover':
      return '/app';
  }
}
