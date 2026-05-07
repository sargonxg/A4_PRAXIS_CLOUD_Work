import { describe, expect, it } from 'vitest';
import {
  CASE_TYPE_DEFINITIONS,
  classifyCaseTypeSignals,
  getCaseTypeDefinition,
  isCaseTypeId,
  normalizeCaseTypeSelection,
  suggestCaseTypesForRole,
} from '@/lib/ontology/case-types';

describe('ontology case typology', () => {
  it('keeps the build-guide ten case types available to the app', () => {
    expect(CASE_TYPE_DEFINITIONS).toHaveLength(10);
    expect(CASE_TYPE_DEFINITIONS.map((item) => item.id)).toEqual([
      'active-conflict',
      'frozen-conflict',
      'negotiation-mediation',
      'counter-terrorism',
      'humanitarian-crisis',
      'political-transition',
      'sanctions-economic-statecraft',
      'strategic-competition',
      'cyber-hybrid',
      'forced-displacement',
    ]);
    expect(getCaseTypeDefinition('negotiation-mediation').primaryOntologyId).toBe('mediation');
    expect(isCaseTypeId('cyber-hybrid')).toBe(true);
    expect(isCaseTypeId('mediation')).toBe(false);
  });

  it('bounds primary and secondary case-type selection', () => {
    expect(normalizeCaseTypeSelection(['humanitarian-crisis', 'active-conflict', 'cyber-hybrid'])).toEqual([
      'humanitarian-crisis',
      'active-conflict',
    ]);
  });

  it('maps user roles to case-type defaults', () => {
    expect(suggestCaseTypesForRole('mediator')).toEqual(['negotiation-mediation', 'active-conflict']);
    expect(suggestCaseTypesForRole('humanitarian_coordinator')).toEqual(['humanitarian-crisis', 'forced-displacement']);
    expect(suggestCaseTypesForRole('sanctions_analyst')).toEqual(['sanctions-economic-statecraft', 'counter-terrorism']);
  });

  it('classifies concrete situations into PRAXIS specialization case types', () => {
    expect(classifyCaseTypeSignals({
      name: 'Northwind settlement options',
      description: 'Mediator tracks party interests, negotiation positions, BATNA, ZOPA, and settlement terms.',
      role: 'mediator',
    }).caseType).toBe('negotiation-mediation');

    expect(classifyCaseTypeSignals({
      name: 'Cross-border access response',
      description: 'Humanitarian access, needs assessment, protection risks, and IDP response gaps.',
      role: 'humanitarian_coordinator',
    }).caseType).toBe('humanitarian-crisis');
  });
});
