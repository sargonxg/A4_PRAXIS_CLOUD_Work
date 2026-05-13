export type CoreKind = 'user' | 'situation' | 'source' | 'document' | 'graph' | 'output';
export type CoreStatus = 'demo' | 'active' | 'draft' | 'archived';

export interface CoreProvenance {
  source: 'public-demo' | 'user-created' | 'system-derived' | 'imported';
  createdBy: string;
  receipts: string[];
  notes?: string;
}

export interface BaseCore {
  id: string;
  ownerUid: string;
  teamId?: string | null;
  kind: CoreKind;
  title: string;
  summary: string;
  status: CoreStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  provenance: CoreProvenance;
  schemaVersion: 1;
  isDemo: boolean;
  sourceDemoId?: string | null;
}

export interface UserCore extends BaseCore {
  kind: 'user';
  role: string;
  audience: string[];
  writingStyle: string;
  analyticPreferences: string[];
  evidenceStandards: string[];
  domains: string[];
  recurringConstraints: string[];
  decisionPosture: string;
  savedMethods: string[];
}

export interface SourceCore extends BaseCore {
  kind: 'source';
  sourceType: string;
  url?: string;
  publisher?: string;
  publishedDate?: string;
  tier?: string;
  keyClaims: string[];
  actors: string[];
  timelineEvents: string[];
}

export interface DocumentCore extends BaseCore {
  kind: 'document';
  sourceCoreIds: string[];
  filename?: string;
  mimeType?: string;
  extractedClaims: string[];
  extractedActors: string[];
  extractedTimelineEvents: string[];
}

export interface GraphCore extends BaseCore {
  kind: 'graph';
  nodeCount: number;
  edgeCount: number;
  actors: string[];
  claims: string[];
  timelineEvents: string[];
  layout: Record<string, { x: number; y: number }>;
}

export interface OutputCore extends BaseCore {
  kind: 'output';
  outputType: 'memo' | 'brief' | 'handover' | 'answer' | 'export';
  situationCoreId?: string;
  userCoreId?: string;
  sourceCoreIds: string[];
  draftSections: string[];
}

export interface SituationCore extends BaseCore {
  kind: 'situation';
  caseFrame: string;
  geography: string;
  timeline: Array<{ id: string; title: string; date: string; type: string }>;
  actors: string[];
  claims: string[];
  risks: string[];
  openQuestions: string[];
  sources: string[];
  graphSummary: {
    actors: number;
    claims: number;
    commitments: number;
    events: number;
  };
  goals: string[];
  currentPhase: string;
  nextMoves: string[];
  draftOutputLinks: string[];
}

export type PraxisCoreObject =
  | UserCore
  | SituationCore
  | SourceCore
  | DocumentCore
  | GraphCore
  | OutputCore;

export interface ContextStack {
  id: string;
  ownerUid: string;
  title: string;
  userCoreId: string | null;
  situationCoreId: string | null;
  sourceCoreIds: string[];
  documentCoreIds: string[];
  graphCoreId: string | null;
  outputCoreId: string | null;
  healthScore: number;
  updatedAt: string;
  schemaVersion: 1;
}
