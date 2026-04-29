import { describe, expect, it } from 'vitest';
import { recommendToolsForRole } from '@/lib/dashboard/role-recommendations';
import { getToolById } from '@/lib/constants/tool-registry';

describe('role-aware dashboard recommendations', () => {
  it('registers Executive Intelligence as a first-class dashboard tool', () => {
    const tool = getToolById('situation-intelligence');

    expect(tool?.aiRoute).toBe('/api/ai/situation-intelligence');
    expect(tool?.dataSchema).toBe('SituationIntelligenceSchema');
    expect(tool?.staleAfterHours).toBe(24);
  });

  it('surfaces Executive Intelligence as the default cross-role first action', () => {
    const recommendations = recommendToolsForRole('researcher', undefined, 3);

    expect(recommendations[0]).toEqual(expect.objectContaining({
      toolId: 'situation-intelligence',
      href: '/dashboard#executive-intelligence',
    }));
  });

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
      'situation-intelligence',
    ]);
  });
});
