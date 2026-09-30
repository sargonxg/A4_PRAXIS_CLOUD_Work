import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { defaultActiveContextStack, sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

// Execute the real hook's state/effect lifecycle without a DOM dependency.
const runtime = vi.hoisted(() => {
  let cursor = 0;
  const states: unknown[] = [];
  const effects = new Map<number, { deps: readonly unknown[]; cleanup?: () => void }>();
  const pending: Array<() => void> = [];
  return {
    user: { id: 'analyst-a' } as { id: string } | null,
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [states[index] as T, (update: T | ((previous: T) => T)) => {
        states[index] = typeof update === 'function' ? (update as (previous: T) => T)(states[index] as T) : update;
      }] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      if (!(index in states)) states[index] = { current: initial };
      return states[index] as { current: T };
    },
    useEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      const previous = effects.get(index);
      if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      pending.push(() => {
        effects.get(index)?.cleanup?.();
        const cleanup = effect();
        effects.set(index, { deps, cleanup: cleanup || undefined });
      });
    },
    useCallback<T>(callback: T) { return callback; },
    render<T>(callback: () => T) { cursor = 0; return callback(); },
    flushEffects() { for (const effect of pending.splice(0)) effect(); },
    reset() {
      for (const effect of effects.values()) effect.cleanup?.();
      states.length = 0;
      effects.clear();
      pending.length = 0;
      cursor = 0;
      this.user = { id: 'analyst-a' };
    },
  };
});

vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: runtime.useState,
  useEffect: runtime.useEffect,
  useRef: runtime.useRef,
  useCallback: runtime.useCallback,
}));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: runtime.user }) }));

function cacheKey(owner: string) { return `praxis-active-context-stack:v2:${JSON.stringify(['owner', owner])}`; }
const guestKey = 'praxis-active-context-stack:v2:guest';

function setup(fetcher = vi.fn().mockResolvedValue(Response.json({ stack: defaultActiveContextStack(), persisted: false }))) {
  const values = new Map<string, string>();
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
  };
  vi.stubGlobal('window', { localStorage: storage });
  vi.stubGlobal('fetch', fetcher);
  return { fetcher, storage, values };
}

function render(remote = true) { return runtime.render(() => useActiveContextStack({ remote })); }
async function hydrate() {
  runtime.flushEffects();
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('context attachment owner-scoped persistence', () => {
  beforeEach(() => runtime.reset());
  afterEach(() => { runtime.reset(); vi.unstubAllGlobals(); });

  it('ignores legacy unowned local context for an authenticated analyst', async () => {
    const { values } = setup();
    values.set('praxis-active-context-stack', JSON.stringify(sanitizeActiveContextStack({ capsuleId: 'another-owner-private' })));
    expect(render().stack.capsuleId).toBeNull();
    await hydrate();
    expect(render().stack.capsuleId).toBeNull();
  });

  it('masks the previous owner synchronously and blocks writes until the new owner is hydrated', async () => {
    const aStack = sanitizeActiveContextStack({ capsuleId: 'a-private', contextBlocks: { situation: [{ id: 'a-note', label: 'Private ministry notes' }] } });
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ stack: aStack, persisted: true }))
      .mockResolvedValueOnce(Response.json({ stack: defaultActiveContextStack(), persisted: false }));
    const { storage } = setup(fetcher);
    render();
    await hydrate();
    expect(render().stack.capsuleId).toBe('a-private');
    runtime.user = { id: 'analyst-b' };
    const b = render();
    expect(b.stack.capsuleId).toBeNull();
    expect(b.stack.contextBlocks.situation).toEqual([]);
    expect(b.hydrated).toBe(false);
    await expect(b.saveStack({ capsuleId: 'new' })).rejects.toThrow(/load|loading/i);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(storage.setItem).not.toHaveBeenCalled();
    await hydrate();
    expect(render().stack.capsuleId).toBeNull();
    expect(render().hydrated).toBe(true);
  });

  it.each(['network', 'server'])('preserves the prior attachment and reports a %s save failure', async (failure) => {
    const prior = sanitizeActiveContextStack({ capsuleId: 'previous', stackId: 'previous' });
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ stack: prior, persisted: true }));
    if (failure === 'network') fetcher.mockRejectedValueOnce(new Error('offline'));
    else fetcher.mockResolvedValueOnce(Response.json({ error: 'unavailable' }, { status: 503 }));
    const { storage } = setup(fetcher);
    render();
    await hydrate();
    await expect(render().saveStack({ capsuleId: 'new', stackId: 'new' })).rejects.toThrow(/previous capsule is still attached/i);
    expect(render().stack.capsuleId).toBe('previous');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('stores only the owner-scoped server-confirmed attachment and its existing document references', async () => {
    const saved = sanitizeActiveContextStack({ capsuleId: 'new', stackId: 'new', documentIds: ['document-1'] });
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ stack: defaultActiveContextStack(), persisted: false }))
      .mockResolvedValueOnce(Response.json({ stack: saved, persisted: true }));
    const { storage } = setup(fetcher);
    render();
    await hydrate();
    expect(await render().saveStack({ capsuleId: 'new', stackId: 'new' })).toMatchObject({ documentIds: ['document-1'] });
    expect(storage.setItem).toHaveBeenCalledWith(cacheKey('analyst-a'), expect.stringContaining('document-1'));
  });

  it('rejects an old save response after an A to B to A round trip', async () => {
    const late = deferredResponse();
    const aStack = sanitizeActiveContextStack({ capsuleId: 'a-current' });
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ stack: aStack, persisted: true }))
      .mockReturnValueOnce(late.promise)
      .mockResolvedValueOnce(Response.json({ stack: defaultActiveContextStack(), persisted: false }))
      .mockResolvedValueOnce(Response.json({ stack: aStack, persisted: true }));
    const { storage } = setup(fetcher);
    render();
    await hydrate();
    const saving = render().saveStack({ capsuleId: 'a-stale' });
    runtime.user = { id: 'analyst-b' };
    render();
    await hydrate();
    runtime.user = { id: 'analyst-a' };
    render();
    await hydrate();
    late.resolve(Response.json({ stack: sanitizeActiveContextStack({ capsuleId: 'a-stale' }), persisted: true }));
    await expect(saving).rejects.toThrow(/changed|cancel|reload/i);
    expect(render().stack.capsuleId).toBe('a-current');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('cancels a superseded capsule query save without applying its late response', async () => {
    const late = deferredResponse();
    const prior = sanitizeActiveContextStack({ capsuleId: 'previous' });
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ stack: prior, persisted: true }))
      .mockReturnValueOnce(late.promise);
    const { storage } = setup(fetcher);
    render();
    await hydrate();
    const controller = new AbortController();
    const saving = render().saveStack({ capsuleId: 'superseded-query' }, { signal: controller.signal });
    controller.abort();
    expect(fetcher.mock.calls[1][1].signal.aborted).toBe(true);
    late.resolve(Response.json({ stack: sanitizeActiveContextStack({ capsuleId: 'superseded-query' }), persisted: true }));
    await expect(saving).rejects.toThrow(/changed|retry/i);
    expect(render().stack.capsuleId).toBe('previous');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('ignores an old load response after an A to B to A round trip', async () => {
    const late = deferredResponse();
    setup(vi.fn()
      .mockReturnValueOnce(late.promise)
      .mockResolvedValueOnce(Response.json({ stack: defaultActiveContextStack(), persisted: false }))
      .mockResolvedValueOnce(Response.json({ stack: sanitizeActiveContextStack({ capsuleId: 'a-current' }), persisted: true })));
    render();
    await hydrate();
    runtime.user = { id: 'analyst-b' };
    render();
    await hydrate();
    runtime.user = { id: 'analyst-a' };
    render();
    await hydrate();
    late.resolve(Response.json({ stack: sanitizeActiveContextStack({ capsuleId: 'a-stale' }), persisted: true }));
    await hydrate();
    expect(render().stack.capsuleId).toBe('a-current');
  });

  it('keeps explicit guest context separate from signed-in owners and never sends guest saves remotely', async () => {
    const { fetcher, values, storage } = setup();
    values.set(guestKey, JSON.stringify(sanitizeActiveContextStack({ capsuleId: 'guest-only' })));
    expect(render(false).stack.capsuleId).toBe('guest-only');
    await hydrate();
    await render(false).saveStack({ capsuleId: 'guest-new' });
    expect(storage.setItem).toHaveBeenCalledWith(guestKey, expect.stringContaining('guest-new'));
    expect(fetcher).not.toHaveBeenCalled();
    expect(render(true).stack.capsuleId).toBeNull();
    await hydrate();
    expect(render(true).stack.capsuleId).toBeNull();
  });
});
