import { describe, expect, it } from 'vitest';

import {
  OUTPUT_CAPSULE_TEMPLATES,
  composeOutputCapsules,
  createOutputCapsuleRecord,
  evaluateOutputCapsuleQuality,
  getOutputTemplatesForTool,
  planOutputCapsuleRun,
  validateOutputCapsulePayload,
} from '@/lib/output-capsules';

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
      'country-one-pager',
      'media-roundup',
      'humanitarian-one-pager',
      'electoral-risk-card',
      'governance-index',
      'options-memo',
      'country-pack',
    ]) {
      expect(ids.has(id), `${id} missing from OutputCapsule catalog`).toBe(true);
    }
  });

  it('binds hidden tools to durable output templates', () => {
    expect(getOutputTemplatesForTool('media-roundup').map((template) => template.id)).toContain('media-roundup');
    expect(getOutputTemplatesForTool('info-environment').map((template) => template.id)).toContain('narrative-monitor');
    expect(getOutputTemplatesForTool('electoral-risk').map((template) => template.id)).toContain('electoral-risk-card');
    expect(getOutputTemplatesForTool('peacebuilding-index').map((template) => template.id)).toContain('governance-index');
    expect(getOutputTemplatesForTool('humanitarian').map((template) => template.id)).toContain('humanitarian-one-pager');
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
