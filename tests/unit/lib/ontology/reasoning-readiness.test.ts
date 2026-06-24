import { describe, expect, it } from 'vitest';
import { CASE_TYPE_DEFINITIONS } from '@/lib/ontology/case-types';
import {
  BACKEND_CASE_SPECIALIZATION_TO_FRONTEND_ONTOLOGIES,
  BACKEND_CASE_SPECIALIZATION_IDS,
} from '@/lib/ontology/backend-frontend-map';
import {
  getPathTemplatesForOntology,
  ONTOLOGY_PATH_TEMPLATES,
} from '@/lib/ontology/path-templates';
import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import {
  UNIVERSAL_CAUSAL_EDGE_TYPES,
  UNIVERSAL_CONTESTATION_NODE_TYPES,
  UNIVERSAL_EVIDENCE_EDGE_TYPES,
  UNIVERSAL_TEMPORAL_EDGE_TYPES,
} from '@/lib/ontology/universal';
import { validateOntologyReadiness } from '@/lib/ontology/validator-pass-rate';

describe('reasoning-ready ontology enrichment', () => {
  it('adds universal evidence, temporal, causal, and contestation vocabulary to every ontology', () => {
    const universalEdgeIds = [
      ...UNIVERSAL_EVIDENCE_EDGE_TYPES,
      ...UNIVERSAL_TEMPORAL_EDGE_TYPES,
      ...UNIVERSAL_CAUSAL_EDGE_TYPES,
    ].map((edge) => edge.id);
    const contestationNodeIds = UNIVERSAL_CONTESTATION_NODE_TYPES.map((node) => node.id);

    for (const ontology of CASE_ONTOLOGIES) {
      expect(ontology.edgeTypes.map((edge) => edge.id)).toEqual(expect.arrayContaining(universalEdgeIds));
      expect(ontology.nodeTypes.map((node) => node.id)).toEqual(expect.arrayContaining(contestationNodeIds));
    }

    expect(UNIVERSAL_CAUSAL_EDGE_TYPES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'de_escalates',
          capsuleCausalRelation: 'de-escalates',
          requiresEvidenceRefs: true,
          confidenceCap: 0.75,
          directSourceStatementMayExceedCap: true,
        }),
      ]),
    );
  });

  it('maps the backend ten case specializations to frontend ontology ids', () => {
    expect(BACKEND_CASE_SPECIALIZATION_IDS).toEqual(CASE_TYPE_DEFINITIONS.map((definition) => definition.id));
    expect(Object.keys(BACKEND_CASE_SPECIALIZATION_TO_FRONTEND_ONTOLOGIES)).toHaveLength(10);
    expect(BACKEND_CASE_SPECIALIZATION_TO_FRONTEND_ONTOLOGIES['active-conflict']).toEqual({
      primaryOntologyId: 'conflict',
      compatibleOntologyIds: ['conflict', 'humanitarian', 'security'],
    });
    expect(BACKEND_CASE_SPECIALIZATION_TO_FRONTEND_ONTOLOGIES['cyber-hybrid']).toEqual({
      primaryOntologyId: 'narrative',
      compatibleOntologyIds: ['narrative', 'security', 'conflict'],
    });
  });

  it('exposes the research path templates as typed reusable paths', () => {
    expect(ONTOLOGY_PATH_TEMPLATES.map((template) => template.id)).toEqual(
      expect.arrayContaining([
        'conflict.actor-leverage-actor',
        'conflict.event-violates-commitment',
        'conflict.claim-or-event-escalates-event',
        'mediation.position-interest-package',
        'economic.ownership-instrument-compliance',
        'narrative.amplification-contestation-audience',
      ]),
    );
    expect(getPathTemplatesForOntology('mediation')[0].steps.map((step) => step.edgeTypeId)).toEqual([
      'holds_position',
      'reveals_interest',
      'enables_package',
    ]);
    expect(getPathTemplatesForOntology('narrative').some((template) => template.label.includes('contests'))).toBe(true);
  });

  it('flags causal evidence, temporal time, unsupported answer claims, and off-schema facts', () => {
    const result = validateOntologyReadiness({
      ontologyIds: ['conflict'],
      nodes: [
        { id: 'event-undated', primitive: 'Event', label: 'Undated event' },
        { id: 'event-dated', primitive: 'Event', label: 'Dated event', validAt: '2026-06-24T00:00:00.000Z' },
        { id: 'claim-answer', primitive: 'Claim', label: 'Answer claim', usedInAnswer: true },
      ],
      edges: [
        { id: 'causal-missing-evidence', source: 'event-undated', target: 'claim-answer', relationshipType: 'causes', confidence: 0.91 },
        { id: 'temporal-missing-time', source: 'event-undated', target: 'event-dated', relationshipType: 'precedes', sourceReceiptIds: ['receipt-1'] },
        { id: 'off-schema-fact', source: 'claim-answer', target: 'event-dated', relationshipType: 'invented_relation', reviewState: 'canonical' },
        { id: 'off-schema-proposal', source: 'claim-answer', target: 'event-dated', relationshipType: 'draft_relation', reviewState: 'proposed' },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.issues.map((issue) => issue.validatorId)).toEqual(
      expect.arrayContaining([
        'readiness.causal-edge-evidence',
        'readiness.causal-confidence-cap',
        'readiness.temporal-event-time',
        'readiness.answer-claim-receipt',
        'readiness.off-schema-edge-proposal',
      ]),
    );
    expect(result.issues.find((issue) => issue.edgeId === 'off-schema-proposal')).toBeUndefined();
  });
});
