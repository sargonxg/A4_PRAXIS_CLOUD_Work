import { describe, expect, it } from 'vitest';
import {
  DIALECTICA_CAPABILITIES,
  DIALECTICA_NAMED_GRAPHS,
  DIALECTICA_PRIMITIVES,
  dialecticaCoveragePercent,
} from '@/lib/constants/dialectica-backbone';

describe('dialectica backbone constants', () => {
  it('keeps the conflict grammar demo complete', () => {
    expect(DIALECTICA_PRIMITIVES.map((primitive) => primitive.id)).toEqual([
      'actor',
      'claim',
      'interest',
      'constraint',
      'leverage',
      'commitment',
      'event',
      'narrative',
    ]);
    expect(dialecticaCoveragePercent()).toBe(100);
  });

  it('keeps future claims separate from standard Firestore behavior', () => {
    expect(DIALECTICA_CAPABILITIES.some((capability) => capability.readiness === 'available' || capability.readiness === 'standard')).toBe(true);
    expect(DIALECTICA_CAPABILITIES.some((capability) => capability.readiness === 'planned')).toBe(true);
  });

  it('documents the named graph layers needed for provenance and reasoning', () => {
    expect(DIALECTICA_NAMED_GRAPHS.map((graph) => graph.id)).toContain('provenance');
    expect(DIALECTICA_NAMED_GRAPHS.map((graph) => graph.id)).toContain('contradictions');
    expect(DIALECTICA_NAMED_GRAPHS.map((graph) => graph.id)).toContain('advisor_reasoning');
  });
});
