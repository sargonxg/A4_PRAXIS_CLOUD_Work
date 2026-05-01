import { describe, expect, it } from 'vitest';
import { POLICY_WORKFLOW_PATHS, getPolicyWorkflowPath } from '@/lib/constants/policy-workflow-paths';

describe('policy workflow paths', () => {
  it('defines mission playbook metadata for every workflow', () => {
    for (const path of POLICY_WORKFLOW_PATHS) {
      expect(path.actualWorkflow.length).toBeGreaterThan(60);
      expect(path.valuableUi.length).toBeGreaterThan(60);
      expect(path.paidOutput.length).toBeGreaterThan(50);
      expect(path.firstRunQuestion.endsWith('?')).toBe(true);
      expect(path.requiredInputs.length).toBeGreaterThanOrEqual(5);
      expect(path.firstToolIds.length).toBeGreaterThanOrEqual(5);
      expect(path.deliverables.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('resolves workflow paths by id', () => {
    expect(getPolicyWorkflowPath('mediator-envoy')?.paidOutput).toContain('mediation');
    expect(getPolicyWorkflowPath('not-a-path')).toBeNull();
  });
});
