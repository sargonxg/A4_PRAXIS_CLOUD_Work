import { describe, expect, it } from 'vitest';
import {
  ACO_ENTITY_TYPES,
  CONFIDENCE_LEVELS,
  ConflictEntitySchema,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_VOCABULARY,
} from '@/lib/ai/schemas/conflict-grammar';

describe('conflict-grammar-v1', () => {
  it('locks the public primitive set to the DIALECTICA v1 eight', () => {
    expect(ACO_ENTITY_TYPES).toEqual([
      'Actor',
      'Claim',
      'Interest',
      'Constraint',
      'Leverage',
      'Commitment',
      'Event',
      'Narrative',
    ]);
  });

  it('locks the relationship vocabulary to 42 typed edges', () => {
    expect(RELATIONSHIP_TYPES).toHaveLength(42);
    expect(Object.keys(RELATIONSHIP_VOCABULARY)).toHaveLength(42);
    expect(RELATIONSHIP_VOCABULARY.MADE_COMMITMENT.sourceTypes).toContain('Actor');
    expect(RELATIONSHIP_VOCABULARY.VIOLATED_BY_EVENT.targetTypes).toContain('Event');
  });

  it('exposes the four confidence levels', () => {
    expect(CONFIDENCE_LEVELS).toEqual(['EXTRACTED', 'INFERRED', 'AMBIGUOUS', 'ASSESSED']);
  });

  it('rejects former extended primitives as canonical entity types', () => {
    expect(
      ConflictEntitySchema.safeParse({
        type: 'risk',
        id: 'risk-fragile-agreement',
        label: 'Fragile agreement',
      }).success,
    ).toBe(false);
  });
});
