export type WorkbenchTabId =
  | 'chapters'
  | 'desk'
  | 'context'
  | 'library'
  | 'research'
  | 'ontology'
  | 'graph'
  | 'tools'
  | 'boardroom'
  | 'draft';

export interface WorkbenchTabDescriptor {
  id: WorkbenchTabId;
  label: string;
  summary: string;
  group: 'overview' | 'context' | 'tools';
}
