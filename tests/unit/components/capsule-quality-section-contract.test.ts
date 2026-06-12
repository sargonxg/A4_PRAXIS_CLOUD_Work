import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const qualitySectionSource = readFileSync(
  join(process.cwd(), 'src/components/capsules/workbench/CapsuleQualitySection.tsx'),
  'utf8',
);
const workbenchPanelSource = readFileSync(
  join(process.cwd(), 'src/components/capsules/CapsuleWorkbenchPanel.tsx'),
  'utf8',
);

describe('CapsuleQualitySection AI review trigger contract', () => {
  it('renders an AI quality review button wired to the existing agent-run endpoint', () => {
    expect(qualitySectionSource).toContain('AI quality review');
    expect(qualitySectionSource).toContain("policyAgentId: 'capsule-quality-review'");
    expect(qualitySectionSource).toContain("fetch('/api/agents/runs'");
    expect(qualitySectionSource).toContain('/dispatch');
    expect(qualitySectionSource).toContain('AskQueuedAgentRunPanel');
  });

  it('disables while a capsule-quality-review run is active for the capsule', () => {
    expect(qualitySectionSource).toContain('activeQualityReviewRun');
    expect(qualitySectionSource).toContain("run.policyAgentId === 'capsule-quality-review'");
    expect(qualitySectionSource).toContain("['queued', 'running', 'waiting_approval']");
    expect(qualitySectionSource).toContain('disabled={reviewButtonDisabled}');
    expect(workbenchPanelSource).toContain('agentRuns={agentRuns}');
  });
});
