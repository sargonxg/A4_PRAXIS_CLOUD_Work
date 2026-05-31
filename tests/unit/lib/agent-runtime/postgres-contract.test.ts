import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/lib/agent-runtime/postgres.ts', 'utf8');

describe('agent runtime Postgres contract', () => {
  it('keeps createAgentRun side effects idempotent on owner/idempotency conflicts', () => {
    expect(source).toContain('WITH inserted AS');
    expect(source).toContain('ON CONFLICT (owner_uid, idempotency_key) DO NOTHING');
    expect(source).toContain('true AS inserted');
    expect(source).toContain('false AS inserted');
    expect(source).toContain('if (inserted)');
    expect(source).toContain("publishAgentRunEvent('agent_run.created'");
  });

  it('claims dispatch atomically before Cloud Tasks enqueue', () => {
    expect(source).toContain('export async function claimAgentRunDispatch');
    expect(source).toContain("dispatchEnqueueStatus: 'dispatch_claimed'");
    expect(source).toContain("COALESCE(metadata->>'dispatchEnqueueStatus', '') NOT IN ('dispatch_claimed', 'dispatch_enqueued')");
    expect(source).toContain('export async function markAgentRunDispatchEnqueued');
    expect(source).toContain("dispatchEnqueueStatus: 'dispatch_failed'");
  });
});
