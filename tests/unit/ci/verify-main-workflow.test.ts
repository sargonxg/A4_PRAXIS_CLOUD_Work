import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('verify-main GitHub workflow', () => {
  it('gates main with the launch-critical Ask, agent, and capsule contracts', () => {
    const workflowPath = join(process.cwd(), '.github/workflows/verify-main.yml');
    expect(existsSync(workflowPath)).toBe(true);
    const source = readFileSync(workflowPath, 'utf8');

    for (const expected of [
      'npm run typecheck',
      'npx vitest run tests/unit/lib/ai/ask-answer-envelope.test.ts tests/unit/lib/ai/ask-orchestrator.test.ts tests/unit/components/tasklet-workbench-contract.test.ts tests/unit/components/ask-source-preview-contract.test.ts tests/unit/app/api/conversations-turns-contract.test.ts',
      'npm run lint',
      'npm run audit:ask-same-window-contract',
      'npm run audit:agent-process-contract',
      'npm run audit:capsule-memory-contract',
    ]) {
      expect(source).toContain(expected);
    }
  });
});
