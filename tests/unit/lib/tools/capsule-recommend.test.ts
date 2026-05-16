import { describe, expect, it } from 'vitest';

import { attachedCoresFromCapsule, recommendCapsuleTools } from '@/lib/tools/recommend';

describe('capsule tool recommendations', () => {
  it('scores policy-team tools from capsule tags and existing refs', () => {
    const recommendations = recommendCapsuleTools({
      capsule: {
        scope: 'situation',
        coreRefs: {
          sourceCoreIds: ['src-1'],
          documentCoreIds: ['doc-1'],
          toolCoreIds: ['sourceability'],
          productCoreIds: ['compliance-note'],
        },
        community: { tags: ['economic-sanctions', 'ofac'] },
      },
      limit: 4,
    });

    expect(recommendations.map((item) => item.tool.id)).toContain('grounded-research');
    expect(recommendations[0]?.category?.id).toBe('economic-sanctions');
    expect(recommendations.some((item) => item.tool.id === 'sourceability')).toBe(false);
  });

  it('derives attached core readiness from capsule refs', () => {
    const attached = attachedCoresFromCapsule({
      scope: 'user',
      coreRefs: {
        situationCoreId: 'sit-1',
        graphCoreId: 'graph-1',
        outputCoreIds: ['memo'],
      },
    });

    expect(attached.user).toBe(true);
    expect(attached.situation).toBe(true);
    expect(attached.graph).toBe(true);
    expect(attached.output).toBe(true);
    expect(attached.source).toBe(false);
  });
});
