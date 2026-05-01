import { describe, expect, it } from 'vitest';
import { buildContextBuilderPlan } from '@/lib/context/context-builder-plan';
import type { Situation } from '@/types/situation';

const baseSituation: Situation = {
  id: 'sit-1',
  name: 'Border De-escalation Track',
  type: 'international',
  description: 'A border crisis with armed incidents, diplomatic messaging, and mediation pressure.',
  region: 'Eastern Mediterranean',
  actors: ['State A', 'State B', 'Regional mediator'],
  userRole: 'mediator',
  status: 'active',
  riskScore: 68,
  glaslStage: 4,
  escalationTrend: 'volatile',
  actorCount: 3,
  graphEntities: 18,
  documentCount: 2,
  sourceUrls: ['https://example.org/official-statement'],
  contextNotes: 'Prioritize de-escalatory language, keep legal claims separate from mediation options, and flag weak evidence.',
  createdAt: '2026-04-20T00:00:00.000Z',
  updatedAt: '2026-04-30T00:00:00.000Z',
  workflowPath: 'mediator-envoy',
  workflowPathLabel: 'Mediator / Envoy Support',
};

describe('context builder plan', () => {
  it('creates a mission-specific plan from a workflow situation', () => {
    const plan = buildContextBuilderPlan(baseSituation, new Date('2026-05-01T00:00:00.000Z'));

    expect(plan.workflowLabel).toBe('Mediator / Envoy Support');
    expect(plan.firstQuestion).toContain('negotiation space');
    expect(plan.completionScore).toBeGreaterThanOrEqual(90);
    expect(plan.missingInputs).toContain('Parties');
    expect(plan.deepResearchPrompt).toContain('Graph-ready primitives');
    expect(plan.deepResearchPrompt).toContain('Do not invent sources');
  });

  it('surfaces missing context and directs the user to the highest-impact next action', () => {
    const plan = buildContextBuilderPlan(
      {
        ...baseSituation,
        description: 'Thin case.',
        actors: ['State A'],
        actorCount: 1,
        graphEntities: 0,
        documentCount: 0,
        sourceUrls: [],
        customSources: [],
        contextNotes: '',
        workflowPath: undefined,
        workflowPathLabel: undefined,
        domain: 'generic',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      new Date('2026-05-01T00:00:00.000Z'),
    );

    expect(plan.completionScore).toBeLessThan(70);
    expect(plan.contextHealth.state).toBe('red');
    expect(plan.checklist.find((item) => item.id === 'evidence')?.status).toBe('missing');
    expect(plan.nextActions[0]).toMatchObject({ priority: 'critical' });
    expect(plan.deepResearchPrompt).toContain('Known missing or weak context');
  });
});
