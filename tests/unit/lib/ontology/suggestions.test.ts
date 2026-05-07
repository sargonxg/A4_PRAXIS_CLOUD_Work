import { describe, expect, it } from 'vitest';
import {
  MAX_ACTIVE_ONTOLOGIES,
  normalizeOntologySelection,
  primaryOntologyId,
  suggestOntologiesForRole,
} from '@/lib/ontology/suggestions';

describe('Pack 20 ontology suggestions', () => {
  it('maps new professional roles to the new ontology lenses', () => {
    expect(suggestOntologiesForRole('human_rights_officer')).toEqual(['human-rights', 'legal']);
    expect(suggestOntologiesForRole('sanctions_analyst')).toEqual(['economic', 'governance']);
    expect(suggestOntologiesForRole('humanitarian_coordinator')).toEqual(['humanitarian', 'conflict']);
    expect(suggestOntologiesForRole('treaty_lawyer')).toEqual(['legal', 'governance']);
    expect(suggestOntologiesForRole('defense_analyst')).toEqual(['security', 'conflict']);
  });

  it('keeps multi-ontology selections bounded and primary-first', () => {
    expect(MAX_ACTIVE_ONTOLOGIES).toBe(3);
    expect(normalizeOntologySelection(['humanitarian', 'conflict', 'legal', 'economic'])).toEqual([
      'humanitarian',
      'conflict',
      'legal',
    ]);
    expect(primaryOntologyId(['economic', 'governance'])).toBe('economic');
    expect(primaryOntologyId([])).toBe('conflict');
  });

  it('lets user history influence suggestions without duplicates', () => {
    expect(suggestOntologiesForRole('diplomat', ['humanitarian', 'conflict'])).toEqual([
      'humanitarian',
      'conflict',
      'governance',
    ]);
  });
});
