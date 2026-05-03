export type RecipeId =
  | 'leverage-trace'
  | 'commitment-check'
  | 'interest-vs-position'
  | 'counter-narrative'
  | 'path-search';

export type RecipeParams<R extends RecipeId = RecipeId> =
  R extends 'leverage-trace'
    ? { actor_a_id: string; actor_b_id: string; domain?: string }
    : R extends 'commitment-check'
      ? { situation_id?: string; time_window?: string }
      : R extends 'interest-vs-position'
        ? { actor_ids: string[] }
        : R extends 'counter-narrative'
          ? { event_id?: string; claim_id?: string; node_id?: string }
          : { situation_id?: string; goal_state: string };

export interface RecipeProvenance {
  ruleId: string;
  inputNodeIds: string[];
  modelVersion: string;
  confidence: number;
  sourceSpans?: Array<Record<string, unknown>>;
}

export interface TypedRecipeNode {
  node_id: string;
  type: string;
  label: string;
}

export type RecipeResult<R extends RecipeId = RecipeId> = {
  recipe: string;
  provenance: RecipeProvenance;
} & Record<string, unknown> & { __recipe?: R };

export interface ReasonRequest<R extends RecipeId = RecipeId> {
  situationId?: string;
  graph?: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
  params: RecipeParams<R>;
}

export async function runDialecticaRecipe<R extends RecipeId>(
  recipe: R,
  request: ReasonRequest<R>,
): Promise<RecipeResult<R>> {
  const response = await fetch(`/api/dialectica/reason/${recipe}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `DIALECTICA recipe failed: ${response.status}`);
  }
  return response.json() as Promise<RecipeResult<R>>;
}
