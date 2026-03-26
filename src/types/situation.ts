export type SituationType =
  | 'international'
  | 'civil'
  | 'political'
  | 'trade'
  | 'workplace'
  | 'community'
  | 'legal'
  | 'custom';

export type UserRole =
  | 'observer'
  | 'analyst'
  | 'mediator'
  | 'party'
  | 'advisor'
  | 'researcher';

export type SituationStatus = 'active' | 'archived' | 'resolved';
export type EscalationTrend = 'stable' | 'escalating' | 'de-escalating' | 'volatile';

export interface Situation {
  id: string;
  name: string;
  type: SituationType;
  description: string;
  region: string;
  actors: string[];
  userRole: UserRole;
  status: SituationStatus;
  riskScore: number;
  glaslStage: number | null;
  escalationTrend: EscalationTrend;
  actorCount: number;
  graphEntities: number;
  documentCount: number;
  sourceUrls?: string[];
  contextNotes?: string;
  initialDocumentIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSituationInput {
  name: string;
  type: SituationType;
  description: string;
  region: string;
  actors: string[];
  userRole: UserRole;
  status?: SituationStatus;
  sourceUrls?: string[];
  contextNotes?: string;
  initialDocumentIds?: string[];
}
