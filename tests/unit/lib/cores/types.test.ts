import { describe, expect, it } from 'vitest';

import {
  CORE_KINDS,
  graphCoreMetadataSchema,
  situationCoreMetadataSchema,
  userCoreMetadataSchema,
} from '@/lib/cores/types';

describe('v7 core metadata schemas', () => {
  it('covers the eight v7 core kinds', () => {
    expect(CORE_KINDS).toEqual([
      'praxis',
      'user',
      'team',
      'situation',
      'source',
      'document',
      'graph',
      'output',
    ]);
  });

  it('validates user core preferences', () => {
    const parsed = userCoreMetadataSchema.parse({
      name: 'Giulio',
      role: 'policy analyst',
      language: 'en-US',
      style: {
        formality: 'formal',
        citation_density: 'high',
        structure_preference: 'bulleted',
      },
    });

    expect(parsed.default_attached_cores).toEqual([]);
    expect(parsed.tags).toEqual([]);
  });

  it('validates situation ontology extensions without adding primitives', () => {
    const parsed = situationCoreMetadataSchema.parse({
      name: 'Syria 2026',
      frame: {
        what_is_happening: 'Transition negotiations are contested.',
        why_does_it_matter: 'Desk handover depends on stable context.',
        what_would_change_assessment: 'A new verified commitment.',
        policy_question: 'What should the mediator test next?',
      },
      case_type: 'conflict',
      ontology_id: 'conflict',
      ontology_version: '1.0.0',
      local_ontology_extensions: {
        primitive_subtypes: { Actor: ['AccessOfficer'] },
        relations: [{ name: 'reports_to_cluster', source: 'Actor', target: 'Actor' }],
      },
    });

    expect(parsed.local_ontology_extensions.relations[0]?.source).toBe('Actor');
  });

  it('keeps graph core promotion manual by default', () => {
    const parsed = graphCoreMetadataSchema.parse({
      name: 'Graph',
      ontology_id: 'conflict',
      ontology_version: '1.0.0',
      embedding_model: 'text-embedding-005',
    });

    expect(parsed.promotion_policy).toBe('never-auto');
    expect(parsed.confidence_floor).toBe(0.45);
  });
});
