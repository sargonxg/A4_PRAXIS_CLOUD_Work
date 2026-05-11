import { describe, expect, it } from 'vitest';
import {
  buildContextCreatePayload,
  suggestContextDomainId,
} from '@/lib/contexts/context-create-payload';

describe('context create payload', () => {
  it('suggests humanitarian and mediation lenses from user language', () => {
    expect(suggestContextDomainId('Humanitarian access corridor and OCHA protection constraints')).toBe('humanitarian');
    expect(suggestContextDomainId('Ceasefire mediation talks and settlement options')).toBe('mediation');
    expect(suggestContextDomainId('Strategic competition and escalation risk')).toBe('conflict');
  });

  it('builds an owner-scoped situation payload from the context wizard draft', () => {
    const payload = buildContextCreatePayload({
      name: 'Port Orion humanitarian access negotiation',
      frame: 'What is happening? Aid corridors are contested.\nWhy it matters? Civilian access is blocked.',
      domain: 'humanitarian',
      work: 'foreign-policy',
    });

    expect(payload).toMatchObject({
      name: 'Port Orion humanitarian access negotiation',
      type: 'custom',
      status: 'active',
      domain: 'humanitarian',
      domainOverriddenByUser: true,
      primaryOntologyId: 'humanitarian',
      ontologyIds: ['humanitarian', 'conflict', 'human-rights'],
      caseType: 'humanitarian-crisis',
      caseTypeLocked: true,
      userRole: 'advisor',
      workflowPath: 'foreign-policy-research',
    });
    expect(payload.contextNotes).toContain('Domain ontology: Humanitarian');
    expect(payload.contextNotes).toContain('Work ontology: Foreign Policy Research');
    expect(payload.description).toContain('Aid corridors are contested');
    expect(payload.semanticaLayer).toMatchObject({
      enabled: true,
      serviceBoundary: 'future-python-or-rest-worker',
    });
    expect(payload.semanticaContextGraph).toMatchObject({
      schemaVersion: 'praxis-semantica-context-core.v1',
      generatedBy: 'praxis-context-create',
      quality: {
        hasContextRoot: true,
        hasDomainOntology: true,
        hasWorkOntology: true,
        hasFrame: true,
        semanticaReady: true,
      },
    });
    expect(payload.semanticaContextGraph.entities.some((node) => node.type === 'frame_statement')).toBe(true);
    expect(payload.semanticaContextGraph.relationships.some((edge) => edge.type === 'scoped_by_user_core')).toBe(true);
  });
});
