import {
  claimAgentRunExecution, ownsAgentRunExecution, releaseAgentRunExecution, renewAgentRunExecution,
  type AgentRunExecutionClaim,
} from '@/lib/agent-runtime/postgres';

export class AgentExecutionLeaseError extends Error {
  readonly status = 503;
}

type LeaseDeps = {
  claim?: typeof claimAgentRunExecution;
  renew?: typeof renewAgentRunExecution;
  owns?: typeof ownsAgentRunExecution;
  release?: typeof releaseAgentRunExecution;
};

/** The ledger owns execution; a delivery name alone cannot exclude duplicates. */
export async function withAgentRunExecutionLease<T>(
  input: { ownerUid: string; runId: string },
  work: (assertOwned: () => Promise<void>, token: string) => Promise<T>,
  deps: LeaseDeps = {},
): Promise<T> {
  const claim: AgentRunExecutionClaim = { ...input, token: crypto.randomUUID(), leaseSeconds: 120 };
  const release = deps.release ?? releaseAgentRunExecution;
  const owns = deps.owns ?? ownsAgentRunExecution;
  if (!await (deps.claim ?? claimAgentRunExecution)(claim)) {
    throw new AgentExecutionLeaseError('This run is already executing or is no longer eligible. Retry will recover its saved state.');
  }
  let lost = false;
  let renewing: Promise<void> | null = null;
  const assertOwned = async () => {
    if (lost || !await owns(claim)) {
      throw new AgentExecutionLeaseError('Agent execution ownership expired or the run was cancelled; no further product writes are allowed.');
    }
  };
  const heartbeat = setInterval(() => {
    if (renewing || lost) return;
    renewing = (deps.renew ?? renewAgentRunExecution)(claim)
      .then((renewed) => { if (!renewed) lost = true; })
      .catch(() => { lost = true; })
      .finally(() => { renewing = null; });
  }, 30_000);
  heartbeat.unref?.();
  try {
    return await work(assertOwned, claim.token);
  } finally {
    clearInterval(heartbeat);
    await renewing;
    // Release is token-conditional: a stale delivery cannot unlock its successor.
    // A release outage leaves the bounded lease to expire, not the work to repeat immediately.
    await release(claim).catch(() => undefined);
  }
}
