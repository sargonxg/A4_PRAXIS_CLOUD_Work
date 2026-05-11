import { describe, expect, it } from 'vitest';
import { buildSemanticaSituationGraph } from '@/lib/semantica/context-core-adapter';

describe('Semantica context core adapter', () => {
  it('creates a Semantica-compatible graph seed for situation context creation', () => {
    const graph = buildSemanticaSituationGraph({
      name: 'Maritime ceasefire monitoring',
      frame: 'What is happening? Talks are fragile.\nWhat decision does this support? Monitoring posture.',
      domainId: 'diplomacy-negotiation',
      domainLabel: 'Mediation',
      ontologyIds: ['mediation', 'conflict', 'governance'],
      primaryOntologyId: 'mediation',
      caseType: 'negotiation-mediation',
      regionFallback: 'Negotiation track',
      userRole: 'advisor',
      workflowPath: 'foreign-policy-research',
      workflowPathLabel: 'Foreign Policy Research',
    });

    expect(graph.schemaVersion).toBe('praxis-semantica-context-core.v1');
    expect(graph.targetSemanticaVersion).toBe('0.5.x');
    expect(graph.intendedSemanticaCapabilities).toEqual(expect.arrayContaining([
      'context_graph',
      'provenance',
      'entity_resolution',
      'conflict_detection',
      'multi_hop_retrieval',
      'policy_trace',
    ]));
    expect(graph.entities.map((entity) => entity.type)).toEqual(expect.arrayContaining([
      'context_core',
      'user_core',
      'domain_ontology',
      'work_ontology',
      'case_type',
      'frame_statement',
    ]));
    expect(graph.relationships.map((relationship) => relationship.type)).toEqual(expect.arrayContaining([
      'has_domain_ontology',
      'has_work_ontology',
      'has_case_type',
      'scoped_by_user_core',
      'contains_frame_statement',
    ]));
    expect(graph.quality).toMatchObject({
      hasContextRoot: true,
      hasDomainOntology: true,
      hasWorkOntology: true,
      hasFrame: true,
      semanticaReady: true,
    });
  });

  it('supports the real authenticated situation creation flow', () => {
    const graph = buildSemanticaSituationGraph({
      name: 'Indo-Pacific maritime coercion',
      frame: 'A partner government needs a sourced diplomatic options memo.',
      domainId: 'armed-conflict-security',
      domainLabel: 'Armed Conflict and Security',
      ontologyIds: ['conflict', 'security', 'governance'],
      primaryOntologyId: 'conflict',
      caseType: 'strategic-competition',
      regionFallback: 'Indo-Pacific',
      userRole: 'advisor',
      workflowPath: 'political-officer',
      workflowPathLabel: 'UN / OSCE Political Officer',
    });

    expect(graph.contextCoreId).toBe('context-core:indo-pacific-maritime-coercion');
    expect(graph.entities.some((entity) => entity.type === 'context_core')).toBe(true);
    expect(graph.entities.some((entity) => entity.type === 'work_ontology')).toBe(true);
    expect(graph.quality.semanticaReady).toBe(true);
  });
});
