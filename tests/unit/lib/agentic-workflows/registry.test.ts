import { describe, expect, it } from 'vitest';

import { AGENTIC_WORKFLOWS, PRIMARY_MOBILE_WORKFLOWS, getAgenticWorkflow } from '@/lib/agentic-workflows/registry';

describe('v7 agentic workflow registry', () => {
  it('keeps the founder-priority workflows available on mobile', () => {
    expect(PRIMARY_MOBILE_WORKFLOWS.map((workflow) => workflow.id)).toEqual([
      'understand-situation',
      'improve-context',
      'generate-handover',
    ]);
  });

  it('declares routing and persistence contracts for every workflow', () => {
    for (const workflow of AGENTIC_WORKFLOWS) {
      expect(workflow.requiredContext.length, workflow.id).toBeGreaterThan(0);
      expect(workflow.routes.length, workflow.id).toBeGreaterThan(0);
      expect(workflow.existingComponents.length, workflow.id).toBeGreaterThan(0);
      expect(workflow.saveLocation.trim(), workflow.id).not.toBe('');
      expect(['calibrated-ai', 'structural', 'hybrid']).toContain(workflow.tier);
    }
  });

  it('resolves a workflow by id', () => {
    expect(getAgenticWorkflow('generate-handover').outputKind).toBe('handover');
  });
});
