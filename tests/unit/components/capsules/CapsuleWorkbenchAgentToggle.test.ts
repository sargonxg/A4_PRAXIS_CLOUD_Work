import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CapsuleWorkbenchPanel agent context toggle', () => {
  it('keeps the agent packet surface split behind next/dynamic', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/capsules/CapsuleWorkbenchPanel.tsx'), 'utf8');

    expect(source).toContain("import dynamic from 'next/dynamic'");
    expect(source).toContain("import('@/components/capsules/CapsuleAgentView')");
    expect(source).toContain('Graph (human)');
    expect(source).toContain('Agent context');
    expect(source).toContain('data-testid="capsule-workbench-agent-toggle"');
    expect(source).toContain('data-testid="capsule-workbench-agent-context"');
  });
});
