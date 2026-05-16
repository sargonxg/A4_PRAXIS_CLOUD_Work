export type RecipeId = 'leverage-trace' | 'commitment-check' | 'interest-vs-position' | 'counter-narrative' | 'path-search' | string;

export async function runDialecticaRecipe(recipe: RecipeId, payload: unknown): Promise<any> {
  const response = await fetch(`/api/dialectica/reason/${recipe}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Dialectica recipe failed: ${response.status}`);
  return response.json();
}
