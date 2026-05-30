import { describe, expect, it } from 'vitest';

import {
  buildSeedOperations,
} from '../../../scripts/seed-capsules';
import { buildLaunchCapsules } from '@/lib/capsules/launch-capsules';

describe('seed-capsules script', () => {
  it('builds idempotent root and immutable version writes', () => {
    const operations = buildSeedOperations(buildLaunchCapsules());

    expect(operations).toHaveLength(20);
    expect(operations.filter((operation) => operation.kind === 'root')).toHaveLength(10);
    expect(operations.filter((operation) => operation.kind === 'version')).toHaveLength(10);
    expect(new Set(operations.map((operation) => operation.path)).size).toBe(20);
    expect(operations[0].path).toBe('capsules/conflict-analysis-brief');
  });
});
