import { describe, it, expect } from 'vitest';
import { LENS_CATALOG } from '@/lib/constants/lens-catalog';
import { LENSES } from '@/types/analyst-profile';

describe('lens-catalog', () => {
  it('has an entry for every LENS enum value', () => {
    for (const l of LENSES) expect(LENS_CATALOG[l]).toBeTruthy();
  });
  it('each entry has label, description, color, icon', () => {
    for (const [, def] of Object.entries(LENS_CATALOG)) {
      expect(def.label).toBeTruthy();
      expect(def.description.length).toBeGreaterThan(20);
      expect(def.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
