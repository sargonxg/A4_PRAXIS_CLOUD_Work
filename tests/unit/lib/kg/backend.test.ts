import { describe, expect, it } from 'vitest';
import { DEFAULT_KG_BACKEND, resolveKgBackendContract } from '@/lib/kg/backend';

describe('KG backend contract', () => {
  it('defaults to postgres as the v1 graph store', () => {
    expect(DEFAULT_KG_BACKEND).toBe('postgres');
    expect(resolveKgBackendContract(undefined)).toMatchObject({
      mode: 'postgres',
      primaryStore: 'postgres',
      firestoreRole: 'owner-scoped-canonical-metadata',
    });
  });

  it('keeps Neo4j available as legacy or reflective secondary mode', () => {
    expect(resolveKgBackendContract('neo4j').primaryStore).toBe('neo4j');
    expect(resolveKgBackendContract('both')).toMatchObject({
      primaryStore: 'postgres',
      secondaryStore: 'neo4j',
    });
  });
});
