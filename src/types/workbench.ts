export type WorkbenchTabId =
  | 'chapters'
  | 'desk'
  | 'context'
  | 'library'
  | 'research'
  | 'ontology'
  | 'graph'
  | 'ach'
  | 'tools'
  | 'memos'
  | 'boardroom'
  | 'draft';

export interface WorkbenchTabDescriptor {
  id: WorkbenchTabId;
  label: string;
  summary: string;
  group: 'overview' | 'context' | 'tools';
}
