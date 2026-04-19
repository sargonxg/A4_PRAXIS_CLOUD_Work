/**
 * PRAXIS Situation Knowledge Core — Type Definitions
 */

export interface SKCContext {
  situation: {
    id: string;
    name: string;
    type: string;
    region: string;
    country: string;
    actors: string[];
    status: string;
    riskScore: number;
    glaslStage: number | null;
    escalationTrend: string;
    description: string;
  };
  graph: {
    nodes: ACONode[];
    edges: ACOEdge[];
    metrics: GraphMetrics;
  };
  vectorResults: VectorResult[];
  feedData: Record<string, FeedCacheEntry>;
  relatedToolData: Record<string, RelatedToolData>;
  user: SKCUserProfile;
  timestamp: string;
  contextTokenEstimate: number;
}

export interface ACONode {
  id: string;
  name: string;
  type: 'actor' | 'claim' | 'interest' | 'constraint' | 'leverage' |
        'commitment' | 'event' | 'narrative' | 'institution' | 'norm' |
        'resource' | 'risk' | 'policy' | 'grievance';
  subtypes: string[];
  description?: string;
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
  sourceDocIds: string[];
  aliases: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface ACOEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  category: 'causal' | 'structural' | 'antagonistic' | 'cooperative' | 'foundational';
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
  weight: number;
  since?: string;
  until?: string;
  sourceDocIds: string[];
  metadata: Record<string, unknown>;
}

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  density: number;
  communities: number;
  mostCentralNode: string;
  lastComputed: string;
}

export interface VectorResult {
  chunkId: string;
  text: string;
  score: number;
  sourceDocId?: string;
  sourceToolId?: string;
  sourceFeed?: string;
  pageNumber?: number;
  entityReferences: string[];
  timestamp: string;
  /**
   * Raw embedding for this chunk (768-dim). Populated when available so downstream
   * consumers (e.g. profile-weighted rerank) can score chunks against a profile
   * embedding without a second Firestore round-trip.
   */
  vector?: number[];
}

export interface FeedCacheEntry {
  feedName: string;
  data: unknown;
  fetchedAt: string;
  ttlExpires: string;
  isStale: boolean;
  country: string;
}

export interface RelatedToolData {
  data: unknown;
  generatedAt: string;
  version: number;
}

export interface SKCUserProfile {
  uid: string;
  role: string;
  expertise: string[];
  preferredFrameworks: string[];
  outputPreferences: {
    brevity: 'concise' | 'standard' | 'detailed';
    citationStyle: 'inline' | 'footnote' | 'appendix';
    diplomaticLanguage: boolean;
  };
}

export interface GraphLayer {
  getNodes(uid: string, situationId: string): Promise<ACONode[]>;
  getEdges(uid: string, situationId: string): Promise<ACOEdge[]>;
  getMetrics(uid: string, situationId: string): Promise<GraphMetrics>;
  upsertNode(uid: string, situationId: string, node: Partial<ACONode> & { id: string }): Promise<void>;
  upsertEdge(uid: string, situationId: string, edge: Partial<ACOEdge> & { id: string; source: string; target: string }): Promise<void>;
  isHealthy(): Promise<boolean>;
  getType(): 'neo4j' | 'firestore';
}

export interface CompletenessReport {
  overall: number;
  fields: Record<string, { score: number; weight: number; suggestion: string }>;
  toolReadiness: Record<string, 'ready' | 'partial' | 'insufficient'>;
  nextAction: string;
}
