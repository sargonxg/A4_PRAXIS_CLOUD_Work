import { describe, expect, it } from 'vitest';
import { PRODUCT_SURFACES, PRODUCT_SURFACE_IDS } from '@/lib/navigation/product-surfaces';

describe('Tasklet-era product surfaces', () => {
  it('keeps legacy preference ids while naming the current compact app surfaces in order', () => {
    expect(PRODUCT_SURFACE_IDS).toEqual([
      'desk',
      'context',
      'library',
      'research',
      'graph',
      'draft',
      'tools',
    ]);
    expect(PRODUCT_SURFACES).toHaveLength(7);
    expect(PRODUCT_SURFACES.map((surface) => surface.label)).toEqual([
      'Home',
      'Capsules',
      'Sources',
      'Ask PRAXIS',
      'Proof',
      'Memo',
      'Advanced',
    ]);
  });

  it('keeps every surface routable inside the current /app shell', () => {
    for (const surface of PRODUCT_SURFACES) {
      expect(surface.href).toMatch(/^\/app(?:[/?#]|$)/);
      expect(surface.toolId.length).toBeGreaterThan(1);
    }
  });
});
