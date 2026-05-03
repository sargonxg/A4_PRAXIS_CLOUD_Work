import { DIALECTICA_RECIPES, type AdapterCapabilities, type DialecticaAdapter } from './adapter';
import type {
  ApprovalSet,
  ContextPackQuery,
  DialecticaContextPack,
  ExtractInput,
  GraphHealthReport,
  GraphProposal,
  MutationApplyResult,
  MutationProposalResult,
  OntologyVersion,
  SituationFrame,
} from './adapter';
import type { RecipeId, RecipeParams, RecipeResult } from '@/lib/dialectica/client';

const DEFAULT_DIALECTICA_URL = 'https://dialectica.tacitus.me';

export class HttpDialecticaAdapter implements DialecticaAdapter {
  constructor(private baseUrl = process.env.DIALECTICA_HTTP_URL || DEFAULT_DIALECTICA_URL) {}

  async resolveOntology(situation: SituationFrame): Promise<OntologyVersion> {
    return this.post('/ontology/resolve', { situation });
  }

  async extract(input: ExtractInput): Promise<GraphProposal> {
    return this.post('/extract', input);
  }

  async proposeMutations(proposals: GraphProposal): Promise<MutationProposalResult> {
    return this.post('/mutations/propose', proposals);
  }

  async approveMutations(approvalSet: ApprovalSet): Promise<MutationApplyResult> {
    return this.post('/mutations/approve', approvalSet);
  }

  async contextPack(query: ContextPackQuery): Promise<DialecticaContextPack> {
    return this.post('/context-pack', query);
  }

  async reason<R extends RecipeId>(recipe: R, params: RecipeParams<R>): Promise<RecipeResult<R>> {
    return this.post(`/reason/${recipe}`, { params });
  }

  async graphHealth(situationId: string, uid?: string): Promise<GraphHealthReport> {
    return this.post('/graph/health', { situationId, uid });
  }

  capabilities(): AdapterCapabilities {
    return {
      mode: 'http',
      typedGrammar: true,
      provenance: true,
      hypotheses: true,
      scenarioForks: true,
      recipes: DIALECTICA_RECIPES,
      premium: true,
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    if (process.env.DIALECTICA_ENABLED !== 'true') {
      throw new Error('HTTP DIALECTICA adapter is not enabled');
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`DIALECTICA HTTP request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }
}
