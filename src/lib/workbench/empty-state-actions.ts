import type { OntologyId } from '@/lib/ontology/types';
import type { UserRole } from '@/types/situation';
import type { WorkbenchTabId } from '@/types/workbench';

export type EmptyStateActionKind = 'open_tab' | 'run_tool' | 'create_memo' | 'convene_boardroom' | 'add_context';

export interface EmptyStateAction {
  kind: EmptyStateActionKind;
  label: string;
  why: string;
  target?: string;
}

const PURPOSE: Partial<Record<WorkbenchTabId, string>> = {
  graph: 'The graph is where PRAXIS turns sources, actors, claims, evidence, and verdicts into an inspectable operating picture.',
  ach: 'ACH helps compare competing hypotheses before the case hardens around the first plausible story.',
  tools: 'Tools are ranked from your role, ontology lenses, and current case material so the first run has enough context.',
  memos: 'Memos turn case graph state into cited work products that can later be assembled in Draft.',
  boardroom: 'Boardroom convenes structured advisors over locked case context when you need a deliberate second read.',
  ontology: 'Ontology shows the active grammar, validator coverage, and which graph primitives are strong or missing.',
};

const TOOL_BY_ONTOLOGY: Partial<Record<OntologyId, string>> = {
  conflict: 'conflict.leverage-trace',
  mediation: 'mediation.zopa-finder',
  governance: 'governance.coalition-map',
  narrative: 'narrative.frame-cascade',
};

const MEMO_BY_ONTOLOGY: Partial<Record<OntologyId, string>> = {
  conflict: 'sit-rep',
  mediation: 'mediation-summary',
  governance: 'mandate-brief',
  narrative: 'frame-analysis',
};

export function getEmptyStatePurpose(tabId: WorkbenchTabId) {
  return PURPOSE[tabId] ?? 'Use this surface after the case has enough context to support a reliable first pass.';
}

export function getEmptyStateActions(input: {
  tabId: WorkbenchTabId;
  role: UserRole;
  ontologyId?: OntologyId;
}): EmptyStateAction[] {
  const roleLabel = input.role.replaceAll('_', ' ');
  const toolId = TOOL_BY_ONTOLOGY[input.ontologyId ?? 'conflict'] ?? 'cross.contradiction-finder';
  const memoId = MEMO_BY_ONTOLOGY[input.ontologyId ?? 'conflict'] ?? 'policy-memo';

  if (input.tabId === 'graph') {
    return [
      { kind: 'add_context', label: 'Add two sources', why: 'Source receipts give the graph evidence anchors.', target: 'context' },
      { kind: 'add_context', label: 'Name the primary actors', why: 'Actors make claims, positions, and interests resolvable.', target: 'context' },
      { kind: 'open_tab', label: 'Review ontology coverage', why: 'Validator hints show which primitives are missing.', target: 'ontology' },
    ];
  }

  if (input.tabId === 'ach') {
    return [
      { kind: 'add_context', label: 'Add competing explanations', why: 'ACH needs at least two hypotheses to compare.', target: 'context' },
      { kind: 'run_tool', label: `Run ${toolId}`, why: 'A first tool run can surface evidence and contradictions for the matrix.', target: toolId },
      { kind: 'open_tab', label: 'Open Graph first', why: 'Graph claims make the evidence rows more concrete.', target: 'graph' },
    ];
  }

  if (input.tabId === 'tools') {
    return [
      { kind: 'run_tool', label: `Start with ${toolId}`, why: `This is a strong first run for a ${roleLabel} using the active ontology.`, target: toolId },
      { kind: 'add_context', label: 'Attach a source set', why: 'Tools produce better output when source coverage is explicit.', target: 'context' },
      { kind: 'create_memo', label: `Prepare a ${memoId} memo after the run`, why: 'Memos preserve the result as a cited decision product.', target: memoId },
    ];
  }

  if (input.tabId === 'memos') {
    return [
      { kind: 'create_memo', label: `Draft ${memoId}`, why: 'This template fits the active ontology and is suitable for a first export.', target: memoId },
      { kind: 'run_tool', label: `Run ${toolId} first`, why: 'A tool output gives the memo stronger structured content.', target: toolId },
      { kind: 'open_tab', label: 'Assemble in Draft', why: 'Draft packages selected memos with appendices and redaction settings.', target: 'draft' },
    ];
  }

  if (input.tabId === 'boardroom') {
    return [
      { kind: 'convene_boardroom', label: 'Convene a three-person review', why: 'Use analyst, legal, and challenge roles to test the early case frame.', target: 'boardroom' },
      { kind: 'add_context', label: 'Lock the decision question', why: 'Boardroom works best when advisors deliberate over a crisp question.', target: 'context' },
      { kind: 'open_tab', label: 'Export synthesis later', why: 'Accepted synthesis can feed Memos and Draft after review.', target: 'memos' },
    ];
  }

  return [
    { kind: 'open_tab', label: 'Check primitive coverage', why: 'Low coverage explains which nodes and relationships to add next.', target: 'ontology' },
    { kind: 'add_context', label: 'Add actors, claims, and sources', why: 'Validators become useful once the case has a small graph seed.', target: 'context' },
    { kind: 'run_tool', label: `Run ${toolId}`, why: 'The recommended tool can create the first structured output for this ontology.', target: toolId },
  ];
}
