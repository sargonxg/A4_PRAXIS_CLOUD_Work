import { afterEach, describe, expect, it, vi } from 'vitest';
import { withAgentRunExecutionLease } from '@/lib/agent-runtime/execution-lease';

const input = { ownerUid: 'owner-1', runId: 'run-1' };

describe('exclusive agent execution', () => {
  afterEach(() => vi.useRealTimers());
  it('allows one simultaneous delivery and rejects the other before provider work', async () => {
    let token: string | null = null;
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const deps = {
      claim: vi.fn(async (claim: { token: string }) => {
        if (token) return false;
        token = claim.token;
        return true;
      }),
      renew: vi.fn(async () => true),
      owns: vi.fn(async (claim: { token: string }) => claim.token === token),
      release: vi.fn(async () => { token = null; }),
    };
    const provider = vi.fn(async (assertOwned: () => Promise<void>) => {
      await pending;
      await assertOwned();
      return 'saved';
    });
    const first = withAgentRunExecutionLease(input, provider, deps);
    await vi.waitFor(() => expect(provider).toHaveBeenCalledOnce());
    await expect(withAgentRunExecutionLease(input, provider, deps)).rejects.toThrow(/already executing/i);
    finish();
    await expect(first).resolves.toBe('saved');
    expect(provider).toHaveBeenCalledOnce();
    expect(deps.release).toHaveBeenCalledOnce();
  });

  it('prevents durable effects after cancellation or lost execution ownership', async () => {
    const write = vi.fn();
    const deps = {
      claim: vi.fn(async () => true), renew: vi.fn(async () => true),
      owns: vi.fn(async () => false), release: vi.fn(async () => undefined),
    };
    await expect(withAgentRunExecutionLease(input, async (assertOwned) => {
      await assertOwned();
      write();
    }, deps)).rejects.toThrow(/ownership|cancelled/i);
    expect(write).not.toHaveBeenCalled();
    expect(deps.release).toHaveBeenCalledOnce();
  });

  it('releases ownership when work fails so a subsequent delivery can recover', async () => {
    const deps = {
      claim: vi.fn(async () => true), renew: vi.fn(async () => true),
      owns: vi.fn(async () => true), release: vi.fn(async () => undefined),
    };
    await expect(withAgentRunExecutionLease(input, async () => { throw new Error('provider timeout'); }, deps))
      .rejects.toThrow('provider timeout');
    expect(deps.release).toHaveBeenCalledOnce();
    await expect(withAgentRunExecutionLease(input, async () => 'recovered', deps)).resolves.toBe('recovered');
  });

  it('renews a long-running execution and stops effects after a failed heartbeat', async () => {
    vi.useFakeTimers();
    let continueWork!: () => void;
    const pending = new Promise<void>((resolve) => { continueWork = resolve; });
    const write = vi.fn();
    const deps = { claim: vi.fn(async () => true), owns: vi.fn(async () => true),
      renew: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false), release: vi.fn(async () => undefined) };
    const running = withAgentRunExecutionLease(input, async (assertOwned) => {
      await pending;
      await assertOwned();
      write();
    }, deps);
    const rejected = expect(running).rejects.toThrow(/ownership|expired/i);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(deps.renew).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(deps.renew).toHaveBeenCalledTimes(2);
    continueWork();
    await rejected;
    expect(write).not.toHaveBeenCalled();
    expect(deps.release).toHaveBeenCalledOnce();
  });

  it('waits for an in-flight renewal before token-conditional release', async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    let renew!: (owned: boolean) => void;
    const work = new Promise<void>((resolve) => { finish = resolve; });
    const heartbeat = new Promise<boolean>((resolve) => { renew = resolve; });
    const deps = { claim: vi.fn(async () => true), owns: vi.fn(async () => true),
      renew: vi.fn(() => heartbeat), release: vi.fn(async () => undefined) };
    const running = withAgentRunExecutionLease(input, async () => { await work; return 'saved'; }, deps);
    await vi.advanceTimersByTimeAsync(30_000);
    finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(deps.release).not.toHaveBeenCalled();
    renew(true);
    await expect(running).resolves.toBe('saved');
    expect(deps.release).toHaveBeenCalledOnce();
  });
});
