import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(join(process.cwd(), 'src/app/api/ai/chat/route.ts'), 'utf8');

function extractBlock(start: string, end: string): string {
  const startIndex = routeSource.indexOf(start);
  const endIndex = routeSource.indexOf(end, Math.max(startIndex, 0));
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return routeSource.slice(startIndex, endIndex);
}

describe('Ask chat AgentRun thread return contract', () => {
  it('carries the originating Ask thread ref into AgentRun metadata and dispatch', () => {
    const block = extractBlock('async function maybeQueueAskAgentRun', 'function buildAskRouteDecisionReceipt');

    expect(block).toContain('const askThreadRef');
    expect(block).toContain('threadId: input.threadId');
    expect(block).toContain('capsuleId: input.capsule.capsuleId');
    expect(block).toContain('askThreadRef,');
    expect(block).toContain('metadata: {');
    expect(block).toContain('await enqueueAgentRunDispatch({ ownerUid: input.uid, runId: run.id, askThreadRef })');
  });
});
