import { describe, expect, it } from 'vitest';
import { PRODUCT_SURFACES, PRODUCT_SURFACE_IDS } from '@/lib/navigation/product-surfaces';

describe('Tasklet-era product surfaces', () => {
  it('defines the compact default app surfaces in order', () => {
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
  });

  it('keeps every surface routable under /app', () => {
    for (const surface of PRODUCT_SURFACES) {
      expect(surface.href).toMatch(/^\/[a-z-]+$/);
      expect(surface.toolId.length).toBeGreaterThan(1);
    }
  });
});
