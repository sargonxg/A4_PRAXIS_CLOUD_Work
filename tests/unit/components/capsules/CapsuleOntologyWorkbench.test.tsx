import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  CapsuleOntologyWorkbench,
  deriveAcoPrimitiveCoverage,
} from '@/components/capsules/CapsuleOntologyWorkbench';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';

const ontology: CapsuleWorkbenchViewModel['ontology'] = {
  active: [{
    id: 'domestic-policy-analysis',
    label: 'Domestic Policy Analysis',
    role: 'active',
    primitiveCoverage: ['Actor', 'Claim'],
    missingPrimitives: ['Interest', 'Constraint', 'Leverage', 'Commitment', 'Event', 'Narrative'],
    coverageRatio: 0.25,
    requiredRelations: ['Policy claims must identify the principal or audience.'],
    reviewState: 'canonical',
    validatorSummary: {
      passed: 1,
      warnings: 1,
      total: 2,
      passRate: 0.5,
      labels: ['Partial primitive coverage'],
    },
  }],
  proposed: [{
    id: 'policy-work-ontology',
    label: 'Policy Work Ontology',
    role: 'proposed',
    primitiveCoverage: ['Interest', 'Constraint'],
    missingPrimitives: ['Leverage', 'Commitment', 'Event', 'Narrative'],
    coverageRatio: 0.5,
    requiredRelations: ['Claims should link to supporting sources.'],
    reviewState: 'proposed',
    validatorSummary: {
      passed: 1,
      warnings: 1,
      total: 2,
      passRate: 0.5,
      labels: ['Needs approval'],
    },
  }],
  missing: [],
};

describe('CapsuleOntologyWorkbench', () => {
  it('classifies ACO primitive coverage as covered, proposed, or missing', () => {
    expect(deriveAcoPrimitiveCoverage(ontology)).toEqual([
      { primitive: 'Actor', state: 'covered' },
      { primitive: 'Claim', state: 'covered' },
      { primitive: 'Interest', state: 'proposed' },
      { primitive: 'Constraint', state: 'proposed' },
      { primitive: 'Leverage', state: 'missing' },
      { primitive: 'Commitment', state: 'missing' },
      { primitive: 'Event', state: 'missing' },
      { primitive: 'Narrative', state: 'missing' },
    ]);
  });

  it('renders the ontology hero with stack, primitive map, validator summary, actions, and review state', () => {
    const html = renderToStaticMarkup(
      <CapsuleOntologyWorkbench
        capsuleId="cap-1"
        capsuleVersion={3}
        ontology={ontology}
        graph={{
          nodes: [{
            id: 'capsule:cap-1',
            label: 'Capsule',
            type: 'capsule',
            reviewState: 'canonical',
          }],
          edges: [],
          canonicalNodeCount: 1,
          proposedNodeCount: 0,
          stats: {
            totalNodes: 1,
            totalEdges: 0,
            sourceBackedClaims: 0,
            unsupportedClaims: 0,
            boundaryNodes: 0,
            reviewGatedNodes: 0,
            temporalNodes: 0,
            provenanceCoveragePct: 0,
            densityLabel: 'sparse',
          },
        }}
        reviewQueue={[{
          id: 'review-1',
          title: 'Candidate ontology extension: Budget Leverage',
          target: 'ontologyStack',
          state: 'proposed',
          sourceType: 'ontology',
          reviewState: 'proposed',
          why: 'Graph and ontology changes stay advisory until reviewed.',
          evidenceLabels: ['Budget Leverage'],
          impact: 'May add or reject advisory graph nodes, edges, or ontology bindings.',
          allowedActions: ['approve', 'reject'],
        }]}
      />,
    );

    expect(html).toContain('Ontology workbench');
    expect(html).toContain('Domestic Policy Analysis');
    expect(html).toContain('2/4 validators');
    expect(html).toContain('Leverage');
    expect(html).toContain('missing');
    expect(html).toContain('Accept proposed binding');
    expect(html).toContain('Candidate ontology extension: Budget Leverage');
  });
});
