export type PolicyAgentCategory = 'analysis' | 'monitoring' | 'review' | 'handover';

export type PolicyAgentReadiness = 'live' | 'queued' | 'planned' | 'gated';

export type PolicyAgentApprovalLevel = 'none' | 'confirm' | 'approval_required' | 'sandbox_required';

export type PolicyAgentOutputDestination = 'memo_studio' | 'canvas' | 'library' | 'handover';

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
  actionLabel: string;
  deferredCapabilities?: string[];
}

export const PRAXIS_POLICY_AGENTS: PolicyAgentDefinition[] = [
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
    actionLabel: 'Run memo',
  },
  {
    id: 'daily-brief',
    label: 'Daily Brief Agent',
    category: 'monitoring',
    description: 'Prepares a recurring brief from approved policy feeds, capsule sources, and open questions.',
    requiredCores: ['Situation Core', 'Source Core', 'Time Core'],
    inputTypes: ['approved feeds', 'watchlist', 'capsule'],
    outputDestination: 'library',
    approvalLevel: 'approval_required',
    readiness: 'planned',
    actionLabel: 'Plan brief',
  },
  {
    id: 'conflict-monitor',
    label: 'Conflict Monitor',
    category: 'monitoring',
    description: 'Tracks actor, event, commitment, and source changes for conflict and statecraft cases.',
    requiredCores: ['Situation Core', 'Source Core', 'Graph Core', 'Time Core'],
    inputTypes: ['GDELT', 'UCDP', 'ReliefWeb', 'HDX', 'UN News', 'World Bank'],
    outputDestination: 'canvas',
    approvalLevel: 'approval_required',
    readiness: 'planned',
    actionLabel: 'Set monitor',
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
    actionLabel: 'Review sources',
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
    actionLabel: 'Red-team',
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
    actionLabel: 'Build handover',
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

export function destinationHref(destination: PolicyAgentOutputDestination): string {
  switch (destination) {
    case 'memo_studio':
      return '/app/write';
    case 'canvas':
      return '/app/canvas';
    case 'library':
      return '/app/workbench?tab=library';
    case 'handover':
      return '/app/contexts';
  }
}
