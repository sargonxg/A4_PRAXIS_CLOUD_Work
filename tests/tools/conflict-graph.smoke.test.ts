import { describe, it, expect } from 'vitest';
import { ENTITY_COLORS } from '@/lib/constants/entity-colors';

describe('conflict-graph smoke', () => {
  it('ENTITY_COLORS covers all 14 ACO v2 entity types', () => {
    const expected = [
      'Actor', 'Claim', 'Interest', 'Constraint', 'Leverage',
      'Commitment', 'Event', 'Narrative', 'Institution', 'Norm',
      'Resource', 'Risk', 'Policy', 'Grievance',
    ];
    for (const type of expected) {
      expect(ENTITY_COLORS[type as keyof typeof ENTITY_COLORS]).toBeDefined();
    }
  });
});
