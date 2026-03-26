import { describe, it, expect } from 'vitest';
import type { CreateSituationInput, Situation } from '../types/situation';

describe('Situation Creation Flow', () => {
  it('CreateSituationInput includes context fields', () => {
    const input: CreateSituationInput = {
      name: 'Test Situation',
      type: 'international',
      description: 'Test description',
      region: 'Middle East',
      actors: ['Actor A', 'Actor B'],
      userRole: 'analyst',
      sourceUrls: ['https://example.com'],
      contextNotes: 'Some analyst notes',
      initialDocumentIds: ['doc-123'],
    };
    expect(input.sourceUrls).toHaveLength(1);
    expect(input.contextNotes).toBe('Some analyst notes');
    expect(input.initialDocumentIds).toHaveLength(1);
  });

  it('Situation type includes optional context fields', () => {
    const situation: Situation = {
      id: 'test-id',
      name: 'Test',
      type: 'civil',
      description: '',
      region: 'Africa',
      actors: [],
      userRole: 'observer',
      status: 'active',
      riskScore: 5,
      glaslStage: 3,
      escalationTrend: 'stable',
      actorCount: 0,
      graphEntities: 0,
      documentCount: 0,
      sourceUrls: ['https://example.com'],
      contextNotes: 'notes',
      initialDocumentIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(situation.sourceUrls).toBeDefined();
    expect(situation.contextNotes).toBe('notes');
  });
});
