import { describe, expect, it } from 'vitest';

import {
  OUTPUT_CAPSULE_TEMPLATES,
  composeOutputCapsules,
  createOutputCapsuleRecord,
  canTransitionOutputCapsule,
  evaluateOutputCapsuleQuality,
  getOutputTemplatesForTool,
  planOutputCapsuleRun,
  validateOutputCapsulePayload,
} from '@/lib/output-capsules';
import { CAPSULE_STARTER_DEFINITIONS } from '@/lib/product/context-capsules';

const basePayload = {
  title: 'Sudan country one-pager',
  summary: 'A compact country readout.',
  country: 'Sudan',
  sections: [{ heading: 'BLUF', body: 'Decision context.', citationIds: ['c1'] }],
};

const citation = { id: 'c1', title: 'Source receipt', uri: 'https://example.test/source' };

function record(id: string, templateId: string) {
  return createOutputCapsuleRecord({
    id,
    ownerUid: 'u1',
    situationId: 's1',
    contextCapsuleId: 'cap1',
    templateId,
    payload: templateId === 'country-risk-card'
      ? { title: 'Risk', summary: 'Risk summary', score: 72, indicators: ['escalation'], sections: [{ heading: 'Risk', body: 'Risk body', citationIds: ['c1'] }] }
      : basePayload,
    citations: [citation],
    provenance: { createdBy: 'test', toolIds: [], agentIds: [] },
  });
}

describe('OutputCapsules', () => {
  it('registers the first real policy output catalog', () => {
    const ids = new Set(OUTPUT_CAPSULE_TEMPLATES.map((template) => template.id));

    for (const id of [
      'daily-read',
      'morning-brief',
      'country-one-pager',
      'country-risk-card',
      'actor-dossier',
      'media-roundup',
      'narrative-monitor',
      'humanitarian-one-pager',
      'risk-monitor-card',
      'electoral-risk-card',
      'governance-index',
      'options-memo',
      'diplomatic-cable',
      'talking-points',
      'country-pack',
    ]) {
      expect(ids.has(id), `${id} missing from OutputCapsule catalog`).toBe(true);
    }
  });

  it('keeps statistics starter artifacts resolved to output templates only', () => {
    const outputIds = new Set(OUTPUT_CAPSULE_TEMPLATES.map((template) => template.id));
    const statisticsOutputs = CAPSULE_STARTER_DEFINITIONS.filter((starter) =>
      starter.starterId === 'starter-output-statistical-annex' ||
      starter.starterId === 'starter-output-evidence-dashboard-brief'
    );

    expect(statisticsOutputs).toHaveLength(2);
    expect(statisticsOutputs.every((starter) => starter.category === 'output')).toBe(true);
    for (const starter of statisticsOutputs) {
      expect(starter.tags).toContain('type:output');
      expect(starter.tags).not.toContain('type:tool');
      for (const outputId of starter.outputProductIds) {
        expect(outputIds.has(outputId), `${starter.starterId} output ${outputId}`).toBe(true);
      }
    }
  });

  it('binds hidden tools to durable output templates', () => {
    expect(getOutputTemplatesForTool('media-roundup').map((template) => template.id)).toContain('media-roundup');
    expect(getOutputTemplatesForTool('info-environment').map((template) => template.id)).toContain('narrative-monitor');
    expect(getOutputTemplatesForTool('electoral-risk').map((template) => template.id)).toContain('electoral-risk-card');
    expect(getOutputTemplatesForTool('peacebuilding-index').map((template) => template.id)).toContain('governance-index');
    expect(getOutputTemplatesForTool('scenarios').map((template) => template.id)).toContain('risk-monitor-card');
    expect(getOutputTemplatesForTool('humanitarian').map((template) => template.id)).toContain('humanitarian-one-pager');
    expect(getOutputTemplatesForTool('policy-memo').map((template) => template.id)).toContain('options-memo');
    expect(getOutputTemplatesForTool('talking-points').map((template) => template.id)).toContain('talking-points');
  });

  it('plans missing cores and available tool steps deterministically', () => {
    const plan = planOutputCapsuleRun({
      targetTemplateId: 'country-one-pager',
      availableCores: ['user', 'situation'],
      availableToolIds: ['grounded-research'],
    });

    expect(plan.canRun).toBe(false);
    expect(plan.missingRequiredCores).toEqual(['source']);
    expect(plan.suggestedSteps.map((step) => step.toolId)).toContain('grounded-research');
  });

  it('blocks approval when unsupported claims remain', () => {
    const template = OUTPUT_CAPSULE_TEMPLATES.find((item) => item.id === 'options-memo')!;
    const quality = evaluateOutputCapsuleQuality({
      template,
      citationCoverage: 0.9,
      unsupportedClaimCount: 1,
      sourceabilityStatus: 'clean',
      humanApproved: true,
    });

    expect(quality.blockers).toContain('unsupported-claims-unresolved');
  });

  it('keeps draft/review possible but blocks approval and shipping when quality is not clean', () => {
    const blocked = createOutputCapsuleRecord({
      id: 'blocked',
      ownerUid: 'u1',
      templateId: 'options-memo',
      payload: {
        title: 'Options',
        summary: 'Options summary',
        sections: [{ heading: 'Recommendation', body: 'Unsupported recommendation.', citationIds: [] }],
      },
      gaps: [{ id: 'gap-1', claim: 'Unsupported recommendation', reason: 'No source span', severity: 'high' }],
      provenance: { createdBy: 'test', toolIds: ['policy-memo'], agentIds: [] },
    });

    expect(canTransitionOutputCapsule(blocked, 'draft')).toBe(true);
    expect(canTransitionOutputCapsule(blocked, 'review')).toBe(true);
    expect(canTransitionOutputCapsule(blocked, 'approved')).toBe(false);
    expect(canTransitionOutputCapsule(blocked, 'shipped')).toBe(false);
  });

  it('composes country-pack from input output capsules while preserving provenance', () => {
    const composed = composeOutputCapsules('country-pack', [
      record('o1', 'country-one-pager'),
      record('o2', 'media-roundup'),
      record('o3', 'country-risk-card'),
      record('o4', 'humanitarian-one-pager'),
    ], {
      id: 'pack1',
      ownerUid: 'u1',
      situationId: 's1',
      contextCapsuleId: 'cap1',
      provenance: { createdBy: 'test', toolIds: [], agentIds: [] },
    });

    expect(composed.templateId).toBe('country-pack');
    expect(composed.status).toBe('draft');
    expect(composed.inputCapsules).toHaveLength(4);
    expect(composed.citations).toHaveLength(1);
  });

  it('rejects invalid payloads by schema id', () => {
    expect(() => validateOutputCapsulePayload('country-one-pager-v1', { title: '' })).toThrow();
  });
});
