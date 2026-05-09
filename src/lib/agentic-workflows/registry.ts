export type AgenticWorkflowArea =
  | 'home'
  | 'ask'
  | 'cores'
  | 'outputs';

export type AgenticWorkflowContext =
  | 'workspace'
  | 'situation'
  | 'sources'
  | 'chapters'
  | 'episodes'
  | 'claims';

export type AgenticWorkflowOutputKind =
  | 'answer'
  | 'context_update'
  | 'memo'
  | 'draft'
  | 'handover'
  | 'briefing'
  | 'review_queue';

export type AgenticWorkflowTier = 'calibrated-ai' | 'structural' | 'hybrid';

export interface AgenticWorkflow {
  id: string;
  label: string;
  shortLabel: string;
  intent: string;
  prompt: string;
  primaryArea: AgenticWorkflowArea;
  mobilePriority: 'primary' | 'secondary' | 'advanced';
  requiredContext: AgenticWorkflowContext[];
  outputKind: AgenticWorkflowOutputKind;
  tier: AgenticWorkflowTier;
  routes: string[];
  existingComponents: string[];
  confirmationRequired: boolean;
  saveLocation: string;
}

export const AGENTIC_WORKFLOWS: AgenticWorkflow[] = [
  {
    id: 'understand-situation',
    label: 'Understand this Situation',
    shortLabel: 'Understand',
    intent: 'Build a first-read brief from the active situation, visible context, claims, and open questions.',
    prompt: 'What should I know first about this Situation? Include sources, confidence, and open questions.',
    primaryArea: 'ask',
    mobilePriority: 'primary',
    requiredContext: ['workspace', 'situation', 'chapters', 'episodes', 'claims'],
    outputKind: 'briefing',
    tier: 'hybrid',
    routes: ['/app/dashboard', '/app/workbench/[caseId]', '/api/ai/chat'],
    existingComponents: ['FloatingPraxis', 'DeskTab', 'ContextTab', 'GraphIntelligencePanels'],
    confirmationRequired: false,
    saveLocation: 'Briefing response and Memo Studio candidate',
  },
  {
    id: 'improve-context',
    label: 'Improve context',
    shortLabel: 'Improve',
    intent: 'Find thin chapters, missing sources, stale claims, and repair actions before expensive analysis.',
    prompt: 'Diagnose the weakest context in this Situation and give me a repair plan.',
    primaryArea: 'cores',
    mobilePriority: 'primary',
    requiredContext: ['workspace', 'situation', 'sources', 'chapters', 'claims'],
    outputKind: 'context_update',
    tier: 'hybrid',
    routes: ['/app/workbench/[caseId]?tab=context', '/app/workbench/[caseId]?tab=library', '/api/situations/[id]/context-health'],
    existingComponents: ['ContextTab', 'LibraryTab', 'DocumentUploadInline', 'ScopeAdvisory'],
    confirmationRequired: true,
    saveLocation: 'Context candidates and source review queue',
  },
  {
    id: 'generate-handover',
    label: 'Generate handover',
    shortLabel: 'Handover',
    intent: 'Produce an episode-aware successor handover with trust posture, citations, and remaining gaps.',
    prompt: 'Generate a handover for the next analyst. Use the seven Situation chapters, episodes, sources, and open threads.',
    primaryArea: 'outputs',
    mobilePriority: 'primary',
    requiredContext: ['workspace', 'situation', 'sources', 'chapters', 'episodes', 'claims'],
    outputKind: 'handover',
    tier: 'calibrated-ai',
    routes: ['/app/workbench/[caseId]?openChapter=memos', '/app/workbench/[caseId]?openChapter=draft', '/api/ai/policy-memo'],
    existingComponents: ['MemoStudio', 'DraftTab', 'MemosChapter'],
    confirmationRequired: true,
    saveLocation: 'Outputs, Memo Studio, and Draft',
  },
  {
    id: 'update-brief',
    label: 'Update brief',
    shortLabel: 'Brief',
    intent: 'Turn a new source or event into a briefing delta with changed claims and confidence.',
    prompt: 'Update the current brief from the newest source or event. Separate what changed from what is still uncertain.',
    primaryArea: 'outputs',
    mobilePriority: 'secondary',
    requiredContext: ['workspace', 'situation', 'sources', 'claims'],
    outputKind: 'briefing',
    tier: 'calibrated-ai',
    routes: ['/app/workbench/[caseId]?openChapter=research', '/app/workbench/[caseId]?openChapter=memos', '/api/ai/policy-memo'],
    existingComponents: ['ResearchTab', 'MemoStudio', 'WhatChangedPanel'],
    confirmationRequired: true,
    saveLocation: 'Memo Studio briefing delta',
  },
  {
    id: 'red-team-assessment',
    label: 'Red-team assessment',
    shortLabel: 'Red-team',
    intent: 'Challenge the dominant assessment and surface assumptions, dissent, and evidence gaps.',
    prompt: 'Red-team the current assessment. Show assumptions, dissent, weak evidence, and alternative explanations.',
    primaryArea: 'cores',
    mobilePriority: 'secondary',
    requiredContext: ['workspace', 'situation', 'chapters', 'claims', 'sources'],
    outputKind: 'review_queue',
    tier: 'hybrid',
    routes: ['/app/workbench/[caseId]?tab=graph', '/app/workbench/[caseId]/ach', '/api/ai/chat'],
    existingComponents: ['GraphIntelligencePanels', 'ACH', 'OpenQuestionsPanel'],
    confirmationRequired: false,
    saveLocation: 'Review queue and ACH notes',
  },
  {
    id: 'prepare-meeting',
    label: 'Prepare me for a meeting',
    shortLabel: 'Meeting',
    intent: 'Create talking points, likely questions, source caveats, and decision asks for a live briefing.',
    prompt: 'Prepare me for a meeting on this Situation. Include talking points, likely questions, caveats, and decision asks.',
    primaryArea: 'outputs',
    mobilePriority: 'secondary',
    requiredContext: ['workspace', 'situation', 'chapters', 'episodes', 'claims'],
    outputKind: 'draft',
    tier: 'calibrated-ai',
    routes: ['/app/workbench/[caseId]?openChapter=draft', '/api/ai/policy-memo'],
    existingComponents: ['DraftTab', 'MemoStudio'],
    confirmationRequired: true,
    saveLocation: 'Draft and export package',
  },
  {
    id: 'review-sources-claims',
    label: 'Review sources and claims',
    shortLabel: 'Review',
    intent: 'Audit source basis, stale claims, missing citations, and candidate promotion posture.',
    prompt: 'Review sources and claims for this Situation. Flag stale, thin, disputed, and well-supported items.',
    primaryArea: 'cores',
    mobilePriority: 'secondary',
    requiredContext: ['workspace', 'situation', 'sources', 'claims'],
    outputKind: 'review_queue',
    tier: 'structural',
    routes: ['/app/workbench/[caseId]?tab=library', '/app/workbench/[caseId]?tab=graph'],
    existingComponents: ['LibraryTab', 'ContextTab', 'GraphIntelligencePanels'],
    confirmationRequired: false,
    saveLocation: 'Source and claim review queue',
  },
  {
    id: 'create-work-product',
    label: 'Create work product',
    shortLabel: 'Create',
    intent: 'Turn the current Situation Model into a memo, draft, or export-ready package.',
    prompt: 'Create a work product from this Situation. Recommend the right memo, draft, or export format before writing.',
    primaryArea: 'outputs',
    mobilePriority: 'advanced',
    requiredContext: ['workspace', 'situation', 'sources', 'chapters', 'claims'],
    outputKind: 'memo',
    tier: 'calibrated-ai',
    routes: ['/app/workbench/[caseId]?openChapter=memos', '/app/workbench/[caseId]?openChapter=draft', '/api/memos'],
    existingComponents: ['MemoStudio', 'DraftTab', 'ExportControls'],
    confirmationRequired: true,
    saveLocation: 'Memo Studio, Draft, and exports',
  },
];

export const PRIMARY_MOBILE_WORKFLOWS = AGENTIC_WORKFLOWS.filter(
  (workflow) => workflow.mobilePriority === 'primary',
);

export function getAgenticWorkflow(id: string): AgenticWorkflow {
  const workflow = AGENTIC_WORKFLOWS.find((item) => item.id === id);
  if (!workflow) throw new Error(`Unknown PRAXIS workflow: ${id}`);
  return workflow;
}
