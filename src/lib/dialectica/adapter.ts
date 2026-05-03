import type { RecipeId, RecipeParams, RecipeResult } from '@/lib/dialectica/client';
import type { SourceSpan } from '@/lib/ai/schemas/conflict-grammar';
import type { Situation } from '@/types/situation';

export type SituationFrame = Pick<Situation, 'id' | 'name' | 'type' | 'region' | 'description'>;

export interface OntologyVersion {
  id: 'conflict-grammar-v1';
  version: '1.0.0';
  primitiveCount: 8;
  relationshipCount: 42;
}

export interface ExtractInput {
  uid: string;
  situationId: string;
  text: string;
  sourceSpan?: SourceSpan;
}

export interface GraphProposal {
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
}

export interface ApprovalSet {
  uid: string;
  situationId: string;
  proposalIds: string[];
}

export interface MutationProposalResult {
  proposalIds: string[];
  status: 'staged';
}

export interface MutationApplyResult {
  applied: number;
  status: 'approved' | 'partial';
}

export interface ContextPackQuery {
  uid: string;
  situationId: string;
  toolId: string;
  loadAll?: boolean;
}

export interface DialecticaContextPack {
  prompt: string;
  graphSummary?: Record<string, unknown>;
  sourceSpans?: SourceSpan[];
  mode: 'firestore' | 'http';
}

export interface GraphHealthReport {
  healthy: boolean;
  nodeCount: number;
  edgeCount: number;
  provenanceReady: boolean;
  hypothesesReady: boolean;
  scenarioForksReady: boolean;
}

export interface AdapterCapabilities {
  mode: 'firestore' | 'http';
  typedGrammar: boolean;
  provenance: boolean;
  hypotheses: boolean;
  scenarioForks: boolean;
  recipes: RecipeId[];
  premium: boolean;
}

export interface DialecticaAdapter {
  resolveOntology(situation: SituationFrame): Promise<OntologyVersion>;
  extract(input: ExtractInput): Promise<GraphProposal>;
  proposeMutations(proposals: GraphProposal): Promise<MutationProposalResult>;
  approveMutations(approvalSet: ApprovalSet): Promise<MutationApplyResult>;
  contextPack(query: ContextPackQuery): Promise<DialecticaContextPack>;
  reason<R extends RecipeId>(recipe: R, params: RecipeParams<R>): Promise<RecipeResult<R>>;
  graphHealth(situationId: string, uid?: string): Promise<GraphHealthReport>;
  capabilities(): AdapterCapabilities;
}

export const DIALECTICA_RECIPES: RecipeId[] = [
  'leverage-trace',
  'commitment-check',
  'interest-vs-position',
  'counter-narrative',
  'path-search',
];
