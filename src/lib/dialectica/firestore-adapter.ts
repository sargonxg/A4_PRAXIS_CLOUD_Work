const RECIPES = ['leverage-trace', 'commitment-check', 'interest-vs-position', 'counter-narrative', 'path-search'];

export class FirestoreDialecticaAdapter {
  capabilities() {
    return { mode: 'firestore', recipes: RECIPES, provenance: true };
  }

  async reason(recipe: string, payload: unknown) {
    return { recipe, payload, paths: [], provenance: { ruleId: recipe.toUpperCase(), inputNodeIds: [], modelVersion: 'firestore-adapter', confidence: 0.5 } };
  }
}
