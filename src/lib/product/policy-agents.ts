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
  | 'daily_brief'
  | 'boardroom_discussion'
  | 'sourceability_review'
  | 'format_output'
  | 'red_team_review'
  | 'handover';

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
  description: string;
  requiredCores: string[];
  inputTypes: string[];
  outputDestination: PolicyAgentOutputDestination;
  approvalLevel: PolicyAgentApprovalLevel;
  readiness: PolicyAgentReadiness;
  riskLevel: PolicyAgentRiskLevel;
  allowedTools: string[];
  capsuleSlots: PolicyAgentCapsuleSlot[];
  actionLabel: string;
  deferredCapabilities?: string[];
}

export const PRAXIS_POLICY_AGENTS: PolicyAgentDefinition[] = [
  {
    id: 'capsule-factory',
    label: 'Capsule AI',
    category: 'analysis',
    description: 'Builds or improves draft ContextCapsule cores as reusable expert-thinking blocks with provenance, source gaps, suggested tools, and confirmation gates.',
    requiredCores: ['User Core', 'Situation Core', 'Source Core', 'Tool Core', 'Output Core'],
    inputTypes: ['prompt', 'capsule', 'documents', 'source receipts'],
    outputDestination: 'library',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'capsule-repository-read', 'grounded-search', 'sourceability-reviewer'],
    capsuleSlots: ['user', 'situation', 'sources', 'documents', 'tools', 'outputs'],
    actionLabel: 'Improve capsule',
  },
  {
    id: 'research-memo',
    label: 'Research Memo Agent',
    category: 'analysis',
    description: 'Turns the active ContextCapsule into a reviewable policy memo draft with source and gap receipts.',
    requiredCores: ['User Core', 'Situation Core', 'Source Core', 'Output Core'],
    inputTypes: ['prompt', 'capsule', 'documents', 'policy sources'],
    outputDestination: 'memo_studio',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'document-retrieve', 'grounded-search', 'policy-memo', 'sourceability-reviewer'],
    capsuleSlots: ['user', 'situation', 'sources', 'documents', 'outputs'],
    actionLabel: 'Run memo agent',
  },
  {
    id: 'source-gap-scout',
    label: 'Source-Gap Scout',
    category: 'review',
    description: 'Finds current candidate sources for active capsule evidence gaps and unsupported claims, then stores them as review-gated source-pack cards.',
    requiredCores: ['Situation Core', 'Source Core', 'Output Core'],
    inputTypes: ['capsule gaps', 'unsupported claims', 'sourceability ledger'],
    outputDestination: 'library',
    approvalLevel: 'none',
    readiness: 'live',
    riskLevel: 'low',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'grounded-search', 'sourceability-reviewer', 'source-gap-scout'],
    capsuleSlots: ['situation', 'sources', 'documents', 'outputs'],
    actionLabel: 'Find sources',
  },
  {
    id: 'boardroom-discussion',
    label: 'Boardroom Discussion',
    category: 'analysis',
    description: 'Runs a chair-led, capsule-grounded boardroom deliberation with participant lenses, transcript proof, evidence stats, and a board-executive pack.',
    requiredCores: ['User Core', 'Situation Core', 'Source Core', 'Document Core', 'Output Core'],
    inputTypes: ['prompt', 'capsule', 'documents', 'source receipts', 'participant lenses'],
    outputDestination: 'library',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'boardroom-deliberation', 'sourceability-reviewer', 'red-team-review', 'board-executive-pack', 'output-capsule-save'],
    capsuleSlots: ['user', 'situation', 'sources', 'documents', 'tools', 'outputs', 'memory'],
    actionLabel: 'Open boardroom',
  },
  {
    id: 'output-formatter',
    label: 'Output Formatter',
    category: 'analysis',
    description: 'Turns a PRAXIS answer, memo draft, or capsule notes into a structured Markdown, DOCX, PDF, or handover-ready work product.',
    requiredCores: ['Output Core', 'Document Core', 'Source Core'],
    inputTypes: ['memo draft', 'assistant answer', 'uploaded document', 'capsule'],
    outputDestination: 'memo_studio',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'memo-formatter', 'sourceability-reviewer', 'handover-package'],
    capsuleSlots: ['documents', 'sources', 'outputs', 'handover'],
    actionLabel: 'Run formatter',
  },
  {
    id: 'daily-brief',
    label: 'Daily Brief Agent',
    category: 'monitoring',
    description: 'Prepares a recurring review-gated memo draft from fresh grounded search, capsule deltas, and open questions.',
    requiredCores: ['Situation Core', 'Source Core', 'Time Core'],
    inputTypes: ['grounded search', 'watchlist', 'capsule deltas'],
    outputDestination: 'memo_studio',
    approvalLevel: 'confirm',
    readiness: 'live',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'capsule-evidence-pack', 'grounded-search', 'daily-brief', 'policy-memo', 'output-capsule-save'],
    capsuleSlots: ['situation', 'sources', 'memory', 'outputs'],
    actionLabel: 'Run daily brief',
  },
  {
    id: 'conflict-monitor',
    label: 'Conflict Monitor',
    category: 'monitoring',
    description: 'Tracks actor, event, commitment, and source changes for conflict and statecraft cases.',
    requiredCores: ['Situation Core', 'Source Core', 'Graph Core', 'Time Core'],
    inputTypes: ['Google Search grounding', 'web crawler receipts', 'user documents'],
    outputDestination: 'canvas',
    approvalLevel: 'approval_required',
    readiness: 'planned',
    riskLevel: 'high',
    allowedTools: ['context-resolve', 'source-monitor', 'graph-proposal'],
    capsuleSlots: ['situation', 'sources', 'tools', 'memory'],
    actionLabel: 'Discuss monitor',
  },
  {
    id: 'sourceability-reviewer',
    label: 'Sourceability Reviewer',
    category: 'review',
    description: 'Audits claims, missing sources, contradictions, and receipts before an output hardens.',
    requiredCores: ['Source Core', 'Document Core', 'Output Core'],
    inputTypes: ['memo draft', 'answer', 'source set'],
    outputDestination: 'memo_studio',
    approvalLevel: 'none',
    readiness: 'queued',
    riskLevel: 'low',
    allowedTools: ['context-resolve', 'document-retrieve', 'sourceability-reviewer'],
    capsuleSlots: ['sources', 'documents', 'outputs'],
    actionLabel: 'Discuss sources',
  },
  {
    id: 'red-team-analyst',
    label: 'Red-Team Analyst',
    category: 'review',
    description: 'Challenges assumptions, options, incentives, and evidence quality from the active capsule.',
    requiredCores: ['User Core', 'Situation Core', 'Graph Core', 'Output Core'],
    inputTypes: ['memo draft', 'policy option', 'actor map'],
    outputDestination: 'memo_studio',
    approvalLevel: 'confirm',
    readiness: 'queued',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'red-team-review', 'sourceability-reviewer'],
    capsuleSlots: ['user', 'situation', 'sources', 'outputs'],
    actionLabel: 'Discuss challenge',
  },
  {
    id: 'handover-builder',
    label: 'Handover Builder',
    category: 'handover',
    description: 'Packages the capsule, memo, open gaps, receipts, and next moves for another analyst or agent.',
    requiredCores: ['User Core', 'Situation Core', 'Source Core', 'Output Core', 'Memory Core'],
    inputTypes: ['capsule', 'memo', 'run ledger'],
    outputDestination: 'handover',
    approvalLevel: 'confirm',
    readiness: 'queued',
    riskLevel: 'medium',
    allowedTools: ['context-resolve', 'memo-formatter', 'handover-package'],
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
    case 'handover-builder':
      return 'handover';
    default:
      return 'normal_answer';
  }
}

export function policyAgentLoginHref(agentId: string, prompt: string): string {
  const params = new URLSearchParams({
    mode: 'signup',
    redirect: '/app',
    policyAgentId: agentId,
  });
  if (prompt.trim()) params.set('capsulePrompt', prompt.trim());
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
