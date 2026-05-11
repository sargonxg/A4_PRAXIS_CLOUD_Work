import { describe, expect, it } from 'vitest';
import { buildSemanticaContextGraph } from '@/lib/semantica/context-core-adapter';
import {
  findContextDomainOption,
  findContextWorkOption,
} from '@/lib/contexts/context-create-payload';

describe('Semantica context core adapter', () => {
  it('creates a Semantica-compatible graph seed for situation context creation', () => {
    const graph = buildSemanticaContextGraph({
      draft: {
        name: 'Maritime ceasefire monitoring',
        frame: 'What is happening? Talks are fragile.\nWhat decision does this support? Monitoring posture.',
        domain: 'mediation',
        work: 'foreign-policy',
      },
      domain: findContextDomainOption('mediation'),
      work: findContextWorkOption('foreign-policy'),
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
});
