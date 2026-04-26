import { describe, expect, it } from 'vitest';
import { recommendToolsForRole } from '@/lib/dashboard/role-recommendations';

describe('role-aware dashboard recommendations', () => {
  it('uses the canonical sources-library id for research and journalism users', () => {
    const researcher = recommendToolsForRole('researcher', undefined, 6);
    const journalist = recommendToolsForRole('journalist', undefined, 6);

    expect(researcher.map((rec) => rec.toolId)).toContain('sources-library');
    expect(journalist.map((rec) => rec.toolId)).toContain('sources-library');
    expect(researcher.find((rec) => rec.toolId === 'sources-library')?.href).toBe('/sources');
  });

  it('boosts situation-domain tools above the role baseline', () => {
    const recommendations = recommendToolsForRole('diplomat', 'humanitarian', 3);
    expect(recommendations.map((rec) => rec.toolId)).toEqual([
      'humanitarian',
      'human-rights',
      'negotiation-prep',
    ]);
  });
});
