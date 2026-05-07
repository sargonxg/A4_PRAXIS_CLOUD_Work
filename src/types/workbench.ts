export type WorkspaceTabId =
  | 'context'
  | 'library'
  | 'ontology'
  | 'graph';

export type WorkbenchLegacySurfaceId =
  | 'chapters'
  | 'desk'
  | 'research'
  | 'memory'
  | 'ach'
  | 'tools'
  | 'memos'
  | 'boardroom'
  | 'draft';

export type WorkbenchTabId = WorkspaceTabId | WorkbenchLegacySurfaceId;

export interface WorkbenchTabDescriptor {
  id: WorkspaceTabId;
  label: string;
  shortTitle: string;
  summary: string;
  icon: 'book-open' | 'library' | 'boxes' | 'git-branch';
  position: 1 | 2 | 3 | 4;
  requiredForHealth: boolean;
  featureFlag: string;
  group: 'substrate';
}
