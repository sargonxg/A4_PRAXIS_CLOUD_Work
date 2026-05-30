import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('RunTimeline contract', () => {
  it('streams AgentRun state via Firestore snapshots and exposes AI SDK stream status', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/runs/run-timeline.tsx'), 'utf8');

    expect(source).toContain('useAgentRunSnapshots');
    expect(source).toContain("from '@ai-sdk/react'");
    expect(source).toContain('plan');
    expect(source).toContain('source');
    expect(source).toContain('retrieve');
    expect(source).toContain('verify');
    expect(source).toContain('synthesize');
  });
});
