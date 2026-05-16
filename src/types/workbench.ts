export type WorkspaceTabId =
  | 'context'
  | 'library'
  | 'tools'
  | 'write'
  | 'canvas'
  | 'assistant';

export type WorkbenchTabId = WorkspaceTabId;

export interface WorkbenchTabDescriptor {
  id: WorkspaceTabId;
  label: string;
  shortTitle: string;
  summary: string;
  icon: 'book-open' | 'library' | 'boxes' | 'git-branch';
  position: 1 | 2 | 3 | 4 | 5 | 6;
  requiredForHealth: boolean;
  featureFlag: string;
  group: 'substrate';
}
