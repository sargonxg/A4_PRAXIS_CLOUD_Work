import { describe, expect, it } from 'vitest';

import {
  MOBILE_PRIMARY_EXPERIENCE,
  PRODUCT_EXPERIENCE_AREAS,
  mapRouteToExperienceArea,
} from '@/lib/product/experience-map';

describe('v7 product experience map', () => {
  it('keeps the four-surface v7 IA stable', () => {
    expect(PRODUCT_EXPERIENCE_AREAS.map((area) => area.id)).toEqual([
      'home',
      'ask',
      'cores',
      'outputs',
    ]);
  });

  it('routes existing workbench power surfaces under the four simple v7 areas', () => {
    expect(mapRouteToExperienceArea('/app/dashboard')).toBe('home');
    expect(mapRouteToExperienceArea('/app/home')).toBe('home');
    expect(mapRouteToExperienceArea('/app/ask')).toBe('ask');
    expect(mapRouteToExperienceArea('/app/cores')).toBe('cores');
    expect(mapRouteToExperienceArea('/app/situation')).toBe('cores');
    expect(mapRouteToExperienceArea('/app/sources')).toBe('cores');
    expect(mapRouteToExperienceArea('/app/outputs')).toBe('outputs');
    expect(mapRouteToExperienceArea('/app/advanced')).toBe('cores');
    expect(mapRouteToExperienceArea('/app/workbench/syria-2026')).toBe('cores');
    expect(mapRouteToExperienceArea('/app/workbench/syria-2026/boardroom')).toBe('cores');
    expect(mapRouteToExperienceArea('/app/workbench/syria-2026/boardroom/demo/synthesis')).toBe('outputs');
  });

  it('keeps mobile primary navigation focused on user-value destinations', () => {
    expect(MOBILE_PRIMARY_EXPERIENCE.map((area) => area.id)).toEqual(['home', 'ask', 'cores', 'outputs']);
  });
});
