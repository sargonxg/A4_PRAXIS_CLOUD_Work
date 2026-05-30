import { describe, expect, it } from 'vitest';

import {
  DRAFTING_OUTPUT_TARGETS,
  buildDraftingTemplate,
} from '@/components/drafting/templates';

describe('drafting templates', () => {
  it('defines the first-class drafting output targets', () => {
    expect(DRAFTING_OUTPUT_TARGETS.map((target) => target.id)).toEqual([
      'brief',
      'memo',
      'sitrep',
      'talking-points',
      'decision-memo',
    ]);
  });

  it('produces distinct starter headings for each target', () => {
    const headings = DRAFTING_OUTPUT_TARGETS.map((target) => buildDraftingTemplate(target.id).headings.join('|'));

    expect(new Set(headings).size).toBe(DRAFTING_OUTPUT_TARGETS.length);
    expect(buildDraftingTemplate('memo').requiresSourceabilityBeforeExport).toBe(true);
    expect(buildDraftingTemplate('sitrep').headings).toContain('Latest Developments');
  });
});
