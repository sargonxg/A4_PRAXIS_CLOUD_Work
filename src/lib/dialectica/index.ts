/**
 * Dialectica adapter — stubbed during MVP cleanup. Returns no-op pack so
 * callers fall through to live, capsule-driven context paths.
 */
export interface DialecticaPack {
  prompt: string;
  recipeId?: string;
  notes?: string;
}

export interface ContextPackArgs {
  uid: string;
  situationId: string;
  toolId: string;
  loadAll?: boolean;
}

export interface DialecticaAdapter {
  contextPack(args: ContextPackArgs): Promise<DialecticaPack>;
  listPacks(): Promise<DialecticaPack[]>;
}

export function getAdapter(): DialecticaAdapter {
  return {
    async contextPack(_args: ContextPackArgs) {
      return { prompt: '' };
    },
    async listPacks() {
      return [];
    },
  };
}
