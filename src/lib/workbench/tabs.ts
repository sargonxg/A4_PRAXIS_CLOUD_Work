import type { WorkbenchTabDescriptor, WorkspaceTabId } from '@/types/workbench';

export const WORKBENCH_TABS: WorkbenchTabDescriptor[] = [
  {
    id: 'context',
    label: 'Context',
    shortTitle: 'Context',
    summary: 'Situation frame, scope, actors, claims, and context advisories.',
    icon: 'book-open',
    position: 1,
    requiredForHealth: true,
    featureFlag: 'workspace.tabs.context',
    group: 'substrate',
  },
  {
    id: 'library',
    label: 'Library',
    shortTitle: 'Library',
    summary: 'Source receipts, documents, saved claims, and exported products.',
    icon: 'library',
    position: 2,
    requiredForHealth: true,
    featureFlag: 'workspace.tabs.library',
    group: 'substrate',
  },
  {
    id: 'ontology',
    label: 'Ontology',
    shortTitle: 'Ontology',
    summary: 'ACO primitives, validators, candidates, and promotion posture.',
    icon: 'boxes',
    position: 3,
    requiredForHealth: true,
    featureFlag: 'workspace.tabs.ontology',
    group: 'substrate',
  },
  {
    id: 'graph',
    label: 'Graph',
    shortTitle: 'Graph',
    summary: 'Canonical graph, candidate overlay, timeline, and provenance.',
    icon: 'git-branch',
    position: 4,
    requiredForHealth: true,
    featureFlag: 'workspace.tabs.graph',
    group: 'substrate',
  },
];

export const WORKBENCH_TAB_IDS = WORKBENCH_TABS.map((tab) => tab.id);

export function isWorkbenchTabId(value: string | null | undefined): value is WorkspaceTabId {
  return WORKBENCH_TAB_IDS.includes(value as WorkspaceTabId);
}

export function normalizeWorkbenchTab(value: string | null | undefined): WorkspaceTabId | null {
  return isWorkbenchTabId(value) ? value : null;
}
