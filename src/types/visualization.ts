export type GraphLayoutMode = 'oval' | 'force' | 'timeline' | 'map';

export interface GraphLayoutOption {
  id: GraphLayoutMode;
  label: string;
  description: string;
  available: boolean;
  unavailableReason?: string;
}
