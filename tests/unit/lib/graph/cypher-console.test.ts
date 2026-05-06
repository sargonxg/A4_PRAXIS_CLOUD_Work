import { describe, expect, it } from 'vitest';
import { tenantScopeCypher, validateReadOnlyCypher } from '@/lib/graph/cypher';

describe('read-only Cypher validation', () => {
  it('accepts read-only match queries', () => {
    expect(validateReadOnlyCypher('MATCH (a:Actor) RETURN a LIMIT 10').ok).toBe(true);
  });

  it('rejects destructive cypher before execution', () => {
    const result = validateReadOnlyCypher('MATCH (a) DELETE a');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('read-only');
  });

  it('marks server-side tenant binding', () => {
    expect(tenantScopeCypher('MATCH (n) RETURN n')).toContain('$tenantId');
  });
});
