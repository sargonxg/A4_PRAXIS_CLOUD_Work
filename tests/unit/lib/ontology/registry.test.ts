import { describe, expect, it } from 'vitest';
import { ACO_PRIMITIVES, TACITUS_CORE_PRIMITIVES } from '@/lib/graph/core-primitives';
import { CASE_ONTOLOGIES, getOntologyForDomain, summarizeOntologyMapping } from '@/lib/ontology/registry';

describe('ontology registry', () => {
  it('exports the ACO primitives as the shared substrate', () => {
    expect(ACO_PRIMITIVES).toEqual(TACITUS_CORE_PRIMITIVES);
  });

  it('maps case domains to ontology definitions', () => {
    expect(getOntologyForDomain('conflict-prevention').id).toBe('conflict');
    expect(getOntologyForDomain('legal').id).toBe('legal');
    expect(getOntologyForDomain('governance').id).toBe('governance');
    expect(getOntologyForDomain('media').id).toBe('narrative');
    expect(getOntologyForDomain('human-rights').id).toBe('human-rights');
    expect(getOntologyForDomain('sanctions').id).toBe('economic');
    expect(getOntologyForDomain('humanitarian').id).toBe('humanitarian');
    expect(getOntologyForDomain('defense').id).toBe('security');
    expect(getOntologyForDomain('unknown-domain').id).toBe('conflict');
  });

  it('keeps every ontology mapped across all core primitives', () => {
    expect(CASE_ONTOLOGIES).toHaveLength(9);
    for (const ontology of CASE_ONTOLOGIES) {
      const summary = summarizeOntologyMapping(ontology);
      expect(summary.primitiveCoverage).toBe(1);
      expect(summary.missingPrimitives).toEqual([]);
      expect(summary.issues).toEqual([]);
    }
  });
});
