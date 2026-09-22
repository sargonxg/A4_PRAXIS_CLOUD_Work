import { describe, expect, it } from 'vitest';
import { CAPSULE_LIBRARY_ENTRIES, proposeDockSlotForCapsule } from '@/lib/capsules/library';
import { POLICY_CAPSULE_SPOTLIGHTS } from '@/lib/capsules/spotlights';
import { CAPSULE_STARTER_DEFINITIONS } from '@/lib/product/context-capsules';

describe('policy capsule spotlights', () => {
  it('makes ten distinct evidence-bearing methods and situations attachable from the library', () => {
    expect(POLICY_CAPSULE_SPOTLIGHTS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(POLICY_CAPSULE_SPOTLIGHTS.map((item) => item.id)).size).toBe(POLICY_CAPSULE_SPOTLIGHTS.length);
    for (const spotlight of POLICY_CAPSULE_SPOTLIGHTS) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === spotlight.id);
      const entry = CAPSULE_LIBRARY_ENTRIES.find((item) => item.id === spotlight.id);
      expect(starter, spotlight.id).toBeDefined();
      expect(starter!.sourcePack.length).toBeGreaterThan(0);
      expect(entry, spotlight.id).toBeDefined();
      expect(['situation', 'tool', 'output']).toContain(proposeDockSlotForCapsule(entry!));
      expect(spotlight.question.length).toBeGreaterThan(35);
      expect(spotlight.inspect.length).toBeGreaterThan(25);
      expect(spotlight.caveat.length).toBeGreaterThan(25);
    }
  });

  it('packages explicit analytical procedures and data contracts without certifying findings', () => {
    for (const id of ['starter-tool-institutional-logic-lens', 'starter-tool-fiscal-distributional-impact-screen', 'starter-tool-temporal-causal-map']) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === id)!;
      expect(starter.deviceProfile?.inputContract.join(' ')).toContain('source_id');
      expect(starter.deviceProfile?.methodSteps.length).toBeGreaterThanOrEqual(4);
      expect(starter.inspectionSections.some((section) => section.label === 'Method graph and ontology')).toBe(true);
      expect(starter.humanReview?.status).toBe('draft');
    }
  });
});
