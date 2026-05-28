import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const retryRouteSource = readFileSync(join(process.cwd(), 'src/app/api/agents/runs/[runId]/retry/route.ts'), 'utf8');
const cancelRouteSource = readFileSync(join(process.cwd(), 'src/app/api/agents/runs/[runId]/cancel/route.ts'), 'utf8');

describe('agent run retry/cancel route contract', () => {
  it('uses the shared retry policy and rejects non-retryable source statuses', () => {
    expect(retryRouteSource).toContain("import { canRetryAgentRunStatus, userSafeAgentRunError } from '@/lib/agent-runtime/status'");
    expect(retryRouteSource).toContain("source.metadata.dispatchEnqueueStatus === 'dispatch_failed' ? 'dispatch_failed' : source.status");
    expect(retryRouteSource).toContain('canRetryAgentRunStatus(retryStatus)');
    expect(retryRouteSource).toContain('Agent run cannot be retried from');
    expect(retryRouteSource).toContain("retryStatus === 'dispatch_failed'");
    expect(retryRouteSource).not.toContain("source.status === 'failed' || source.status === 'cancelled' || source.status === 'expired'");
    expect(retryRouteSource).not.toContain(': source;');
  });

  it('uses the shared cancel policy and user-safe ledger errors', () => {
    expect(cancelRouteSource).toContain("import { canCancelAgentRunStatus, userSafeAgentRunError } from '@/lib/agent-runtime/status'");
    expect(cancelRouteSource).toContain('canCancelAgentRunStatus(run.status)');
    expect(cancelRouteSource).toContain('userSafeAgentRunError(message)');
  });
});
