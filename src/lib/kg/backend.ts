export type KgBackendMode = 'postgres' | 'neo4j' | 'both';

export const KG_BACKEND_MODES: KgBackendMode[] = ['postgres', 'neo4j', 'both'];
export const DEFAULT_KG_BACKEND: KgBackendMode = 'postgres';

export interface KgBackendContract {
  mode: KgBackendMode;
  primaryStore: 'postgres' | 'neo4j';
  secondaryStore: 'neo4j' | null;
  firestoreRole: 'owner-scoped-canonical-metadata';
  supportsRollback: boolean;
}

export function resolveKgBackendContract(mode: string | null | undefined): KgBackendContract {
  const normalized = KG_BACKEND_MODES.includes(mode as KgBackendMode) ? (mode as KgBackendMode) : DEFAULT_KG_BACKEND;
  return {
    mode: normalized,
    primaryStore: normalized === 'neo4j' ? 'neo4j' : 'postgres',
    secondaryStore: normalized === 'both' ? 'neo4j' : null,
    firestoreRole: 'owner-scoped-canonical-metadata',
    supportsRollback: true,
  };
}
