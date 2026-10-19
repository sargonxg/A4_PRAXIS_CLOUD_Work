import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkbenchContextInitialization, workbenchSendReady } from '@/components/praxis/use-workbench-context-initialization';

const runtime = vi.hoisted(() => {
  let cursor = 0; const states: unknown[] = [];
  const effects = new Map<number, { deps: readonly unknown[]; cleanup?: () => void }>();
  const pending: Array<() => void> = [];
  return {
    useState<T>(initial: T | (() => T)) {
      const index = cursor++; if (!(index in states)) states[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [states[index] as T, (update: T | ((previous: T) => T)) => {
        states[index] = typeof update === 'function' ? (update as (previous: T) => T)(states[index] as T) : update;
      }] as const;
    },
    useEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++, previous = effects.get(index);
      if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      pending.push(() => { effects.get(index)?.cleanup?.(); const cleanup = effect(); effects.set(index, { deps, cleanup: cleanup || undefined }); });
    },
    useCallback<T>(callback: T) { return callback; },
    render<T>(callback: () => T) { cursor = 0; return callback(); },
    flush() { for (const effect of pending.splice(0)) effect(); },
    reset() { for (const effect of effects.values()) effect.cleanup?.(); states.length = 0; effects.clear(); pending.length = 0; cursor = 0; },
  };
});
vi.mock('react', () => ({ useState: runtime.useState, useEffect: runtime.useEffect, useCallback: runtime.useCallback }));
const base = { ownerId: 'owner-a' as string | null, hydrated: false, requestedCapsuleId: 'requested-capsule' as string | null, routeKey: 'conversation-a',
  attachedCapsuleIds: ['previous-default'], selectCapsule: vi.fn(), initializeCapsule: vi.fn(), setStatus: vi.fn() };
function render(props = base) {
  const result = runtime.render(() => useWorkbenchContextInitialization(props)); runtime.flush(); return result;
}
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
beforeEach(() => { runtime.reset(); vi.resetAllMocks(); }); afterEach(() => runtime.reset());

describe('conversation deep-link context initialization', () => {
  it('does not save or choose a default before owner context hydrates, then awaits real route attachment', async () => {
    const save = deferred<unknown>(); base.initializeCapsule.mockReturnValue(save.promise);
    expect(render().pending).toBe(true); expect(base.initializeCapsule).not.toHaveBeenCalled(); expect(base.selectCapsule).not.toHaveBeenCalled();
    const hydrated = { ...base, hydrated: true };
    expect(render(hydrated).pending).toBe(true);
    expect(base.initializeCapsule).toHaveBeenCalledTimes(1);
    expect(base.initializeCapsule.mock.calls[0][0]).toBe('requested-capsule');
    save.resolve({}); await Promise.resolve();
    expect(render(hydrated).pending).toBe(false);
    expect(base.selectCapsule).toHaveBeenCalledWith('requested-capsule');
    render({ ...hydrated, attachedCapsuleIds: [] });
    expect(base.initializeCapsule).toHaveBeenCalledTimes(1); // Later intentional detachment is allowed.
  });
  it('accepts already-attached requested context without an unnecessary write', async () => {
    const props = { ...base, hydrated: true, attachedCapsuleIds: ['requested-capsule'] };
    render(props); await Promise.resolve(); expect(render(props).pending).toBe(false);
    expect(base.initializeCapsule).not.toHaveBeenCalled(); expect(base.selectCapsule).toHaveBeenCalledWith('requested-capsule');
  });
  it('shows a fixed recoverable failure and retries without exposing private errors', async () => {
    base.initializeCapsule.mockRejectedValueOnce(new Error('synthetic-private-error')).mockResolvedValueOnce({});
    const props = { ...base, hydrated: true };
    render(props); await vi.waitFor(() => expect(render(props).failed).toBe(true));
    const failed = render(props); expect(failed.failed).toBe(true); expect(failed.pending).toBe(true);
    expect(JSON.stringify(base.setStatus.mock.calls)).not.toContain('synthetic-private-error');
    for (let i = 0; i < 5; i++) render({ ...props, attachedCapsuleIds: ['previous-default'] });
    expect(base.initializeCapsule).toHaveBeenCalledTimes(1);
    failed.retry(); render(props); await Promise.resolve();
    expect(render(props).pending).toBe(false); expect(base.initializeCapsule).toHaveBeenCalledTimes(2);
  });
  it('accepts a published attachment while its prior save completion is delayed and ignores that abandoned result', async () => {
    const delayed = deferred<unknown>(); base.initializeCapsule.mockReturnValue(delayed.promise);
    const props = { ...base, hydrated: true }; render(props);
    const signal = base.initializeCapsule.mock.calls[0][1] as AbortSignal;
    const attached = { ...props, attachedCapsuleIds: ['requested-capsule'] };
    render(attached); expect(signal.aborted).toBe(true); await Promise.resolve();
    expect(render(attached).pending).toBe(false);
    expect(base.selectCapsule).toHaveBeenCalledTimes(1);
    delayed.resolve({}); await Promise.resolve();
    expect(render(attached).pending).toBe(false); expect(base.selectCapsule).toHaveBeenCalledTimes(1);
  });
  it('revalidates a return to a previously resolved route after an intervening unresolved route', async () => {
    const pendingB = deferred<unknown>(), pendingA = deferred<unknown>();
    const routeA = { ...base, hydrated: true, attachedCapsuleIds: ['requested-capsule'] };
    render(routeA); await Promise.resolve(); expect(render(routeA).pending).toBe(false);
    base.initializeCapsule.mockReturnValueOnce(pendingB.promise).mockReturnValueOnce(pendingA.promise);
    const routeB = { ...base, hydrated: true, routeKey: 'conversation-b', attachedCapsuleIds: [] };
    expect(render(routeB).pending).toBe(true);
    const returningA = { ...routeA, attachedCapsuleIds: [] };
    expect(render(returningA).pending).toBe(true);
    expect(base.initializeCapsule).toHaveBeenCalledTimes(2);
    pendingB.resolve({}); await Promise.resolve(); expect(render(returningA).pending).toBe(true);
    pendingA.resolve({}); await Promise.resolve(); expect(render(returningA).pending).toBe(false);
  });
  it('revalidates route A after an intervening failed route B without retry loops', async () => {
    const routeA = { ...base, hydrated: true, attachedCapsuleIds: ['requested-capsule'] };
    render(routeA); await Promise.resolve(); expect(render(routeA).pending).toBe(false);
    base.initializeCapsule.mockRejectedValueOnce(new Error('synthetic route B failure')).mockResolvedValueOnce({});
    const routeB = { ...base, hydrated: true, routeKey: 'conversation-b', attachedCapsuleIds: [] };
    render(routeB); await vi.waitFor(() => expect(render(routeB).failed).toBe(true));
    expect(base.initializeCapsule).toHaveBeenCalledTimes(1);
    const returningA = { ...routeA, attachedCapsuleIds: [] };
    expect(render(returningA).pending).toBe(true);
    await Promise.resolve(); expect(render(returningA).pending).toBe(false);
    expect(base.initializeCapsule).toHaveBeenCalledTimes(2);
  });
  it('aborts old-owner attachment and ignores a delayed result after owner or route changes', async () => {
    const old = deferred<unknown>(), fresh = deferred<unknown>();
    base.initializeCapsule.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
    render({ ...base, hydrated: true });
    const oldSignal = base.initializeCapsule.mock.calls[0][1] as AbortSignal;
    const next = { ...base, ownerId: 'owner-b', routeKey: 'conversation-b', hydrated: true };
    render(next); expect(oldSignal.aborted).toBe(true);
    old.resolve({}); await Promise.resolve(); expect(render(next).pending).toBe(true);
    expect(base.selectCapsule).not.toHaveBeenCalled();
    fresh.resolve({}); await Promise.resolve(); expect(render(next).pending).toBe(false);
  });
  it('does not require a capsule for a valid hydrated no-capsule Ask', () => {
    expect(render({ ...base, hydrated: true, requestedCapsuleId: null }).pending).toBe(false);
    expect(base.initializeCapsule).not.toHaveBeenCalled();
    expect(workbenchSendReady({ authenticated: true, ownerId: 'owner', hydrated: true, contextPending: false,
      requestScope: 'same', expectedScope: 'same' })).toBe(true);
  });
});

describe('shared send readiness', () => {
  const ready = { authenticated: true, ownerId: 'owner', hydrated: true, contextPending: false, requestScope: 'same', expectedScope: 'same' };
  for (const change of [{ ownerId: null }, { hydrated: false }, { contextPending: true }, { requestScope: null }, { requestScope: 'previous' }]) {
    it(`refuses sends before the matching current scope is ready: ${JSON.stringify(change)}`, () => {
      expect(workbenchSendReady({ ...ready, ...change })).toBe(false);
    });
  }
  it('retains the public sign-in handoff path', () => {
    expect(workbenchSendReady({ ...ready, authenticated: false, ownerId: null, hydrated: false })).toBe(true);
  });
});
