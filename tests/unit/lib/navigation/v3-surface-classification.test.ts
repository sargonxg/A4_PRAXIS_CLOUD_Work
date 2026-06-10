import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONSOLIDATED_TOOLS } from '@/lib/constants/consolidated-tools';
import { PRIMARY_NAV } from '@/lib/navigation/primary-nav';
import { PRODUCT_SURFACES } from '@/lib/navigation/product-surfaces';
import {
  V3_DEMO_ROUTE_DECISION,
  V3_NAV_MAPPINGS,
  V3_PRIMARY_ROUTE_CLASSIFICATIONS,
  V3_PRODUCT_SURFACE_CLASSIFICATIONS,
  V3_TOOL_CAPSULE_GALLERY_IDS,
  V3_TOOL_CLASSIFICATIONS,
} from '@/lib/navigation/v3-surface-classification';

describe('PRAXIS v3 surface classification', () => {
  it('keeps the planned v3 labels mapped onto existing routes', () => {
    expect(V3_NAV_MAPPINGS.map((item) => item.label)).toEqual([
      'Ask',
      'Library',
      'Studio',
      'Runs',
      'Labs',
    ]);

    expect(V3_NAV_MAPPINGS.map((item) => item.route)).toEqual([
      '/app',
      '/app/capsules',
      '/app/capsules/builder',
      '/agents/[runId]',
      '/app/boardroom',
    ]);
  });

  it('classifies every current primary nav item before visible labels change', () => {
    const classifiedIds = new Set(V3_PRIMARY_ROUTE_CLASSIFICATIONS.map((item) => item.currentNavId));
    expect(classifiedIds).toEqual(new Set(PRIMARY_NAV.map((item) => item.id)));

    expect(V3_PRIMARY_ROUTE_CLASSIFICATIONS.find((item) => item.currentNavId === 'home')?.classification).toBe('LOOP');
    expect(V3_PRIMARY_ROUTE_CLASSIFICATIONS.find((item) => item.currentNavId === 'capsules')?.targetLabel).toBe('Library');
    expect(V3_PRIMARY_ROUTE_CLASSIFICATIONS.find((item) => item.currentNavId === 'boardroom')?.classification).toBe('LABS');
    expect(V3_PRIMARY_ROUTE_CLASSIFICATIONS.find((item) => item.currentNavId === 'recent-work')?.classification).toBe('FOLD_IN');
    expect(V3_PRIMARY_ROUTE_CLASSIFICATIONS.find((item) => item.currentNavId === 'marketplace')?.classification).toBe('TOOL_CAPSULE');
  });

  it('classifies every current product surface and consolidated tool', () => {
    expect(new Set(V3_PRODUCT_SURFACE_CLASSIFICATIONS.map((item) => item.surfaceId))).toEqual(
      new Set(PRODUCT_SURFACES.map((surface) => surface.id)),
    );
    expect(new Set(V3_TOOL_CLASSIFICATIONS.map((item) => item.toolId))).toEqual(
      new Set(CONSOLIDATED_TOOLS.map((tool) => tool.id)),
    );
  });

  it('curates a compact tool capsule gallery without hiding the Ask loop inside it', () => {
    expect(V3_TOOL_CAPSULE_GALLERY_IDS.length).toBeGreaterThanOrEqual(6);
    expect(V3_TOOL_CAPSULE_GALLERY_IDS.length).toBeLessThanOrEqual(8);
    expect(V3_TOOL_CAPSULE_GALLERY_IDS).not.toContain('ask-praxis');

    for (const toolId of V3_TOOL_CAPSULE_GALLERY_IDS) {
      expect(V3_TOOL_CLASSIFICATIONS.find((item) => item.toolId === toolId)?.classification, toolId).toBe('TOOL_CAPSULE');
    }
  });

  it('records that there is no real /demo route tree to delete in this checkout', () => {
    expect(existsSync(join(process.cwd(), 'src', 'app', 'demo'))).toBe(false);
    expect(V3_DEMO_ROUTE_DECISION.existsInRouteTree).toBe(false);
    expect(V3_DEMO_ROUTE_DECISION.classification).toBe('DELETE');
  });
});
