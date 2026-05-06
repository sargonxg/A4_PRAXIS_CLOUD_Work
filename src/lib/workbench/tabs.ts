import type { WorkbenchTabDescriptor, WorkbenchTabId } from '@/types/workbench';

export const WORKBENCH_TABS: WorkbenchTabDescriptor[] = [
  { id: 'chapters', label: 'Chapters', summary: 'Frame, receipts, graph, reasoning, and decision product.', group: 'context' },
  { id: 'desk', label: 'Desk', summary: 'Case status, what changed, activity, and next actions.', group: 'overview' },
  { id: 'context', label: 'Context', summary: 'Build the case frame, actors, sources, documents, and graph proposals.', group: 'context' },
  { id: 'library', label: 'Library', summary: 'Sources, documents, saved claims, and work products.', group: 'context' },
  { id: 'research', label: 'Research', summary: 'Source Scout, deep research, and staged collection plans.', group: 'context' },
  { id: 'ontology', label: 'Ontology', summary: 'Case ontology, primitives, validators, and recommended tool mappings.', group: 'context' },
  { id: 'graph', label: 'Graph', summary: 'GraphOps, conflict graph, paths, and projection checks.', group: 'context' },
  { id: 'tools', label: 'Tools', summary: 'Curated marketplace for ontology-aware analysis tools.', group: 'tools' },
  { id: 'boardroom', label: 'Boardroom', summary: 'Advisor deliberation and option synthesis.', group: 'tools' },
  { id: 'draft', label: 'Draft', summary: 'Briefing, memo, talking points, and export workspace.', group: 'tools' },
];

export const WORKBENCH_TAB_IDS = WORKBENCH_TABS.map((tab) => tab.id);

export function isWorkbenchTabId(value: string | null | undefined): value is WorkbenchTabId {
  return WORKBENCH_TAB_IDS.includes(value as WorkbenchTabId);
}

export function normalizeWorkbenchTab(value: string | null | undefined): WorkbenchTabId {
  return isWorkbenchTabId(value) ? value : 'chapters';
}
