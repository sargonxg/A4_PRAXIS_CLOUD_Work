import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from '@/app/onboarding/page';
import { loadAnalystProfile, initAnalystProfileIfMissing } from '@/lib/firebase/analyst-profile-service';
import { DEFAULT_ANALYST_PROFILE, type AnalystProfile } from '@/types/analyst-profile';

const runtime = vi.hoisted(() => ({ cursor: 0, hooks: new Map<number, unknown>(), pending: [] as Array<() => void>, query: '', owner: 'owner-a' as string | null, authLoading: false, push: vi.fn(), assign: vi.fn() }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => {
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial);
      return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (previous: unknown) => unknown)(runtime.hooks.get(key)) : update)];
    },
    useRef: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial }); return runtime.hooks.get(key); },
    useEffect: (effect: () => void | (() => void), deps: unknown[]) => {
      const key = runtime.cursor++; const previous = runtime.hooks.get(key) as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (!previous || deps.some((dep, index) => !Object.is(dep, previous.deps[index]))) {
        previous?.cleanup?.(); const next = { deps, cleanup: undefined as (() => void) | undefined };
        runtime.hooks.set(key, next); runtime.pending.push(() => { next.cleanup = effect() || undefined; });
      }
    },
    useCallback: (callback: unknown) => callback,
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: runtime.push }), useSearchParams: () => new URLSearchParams(runtime.query) }));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: runtime.owner ? { id: runtime.owner } : null, loading: runtime.authLoading }) }));
vi.mock('@/lib/firebase/analyst-profile-service', () => ({ loadAnalystProfile: vi.fn(), initAnalystProfileIfMissing: vi.fn() }));
vi.mock('@/app/onboarding/step-identity', () => ({ StepIdentity: () => null }));
vi.mock('@/app/onboarding/step-perspective', () => ({ StepPerspective: () => null }));
vi.mock('@/app/onboarding/step-working-style', () => ({ StepWorkingStyle: () => null }));
vi.mock('@/app/onboarding/completion-success', () => ({ CompletionSuccess: () => null }));
vi.mock('@/app/onboarding/live-preview', () => ({ LivePreview: () => null }));

type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); return isValidElement<Record<string, unknown>>(node) ? [node, ...elements(node.props.children as ReactNode)] : []; }
function text(node: ReactNode): string { if (typeof node === 'string' || typeof node === 'number') return String(node); if (Array.isArray(node)) return node.map(text).join(' '); return isValidElement<Record<string, unknown>>(node) ? text(node.props.children as ReactNode) : ''; }
function render() { runtime.cursor = 0; const child = OnboardingPage().props.children as ReactElement; return (child.type as () => ReactNode)(); }
function action(tree: ReactNode, name: string) { const node = elements(tree).find((element) => typeof element.props[name] === 'function'); expect(node).toBeDefined(); return node!.props[name] as (...args: unknown[]) => Promise<void>; }
function editor(tree: ReactNode) { return elements(tree).find((element) => typeof element.props.onChange === 'function'); }
async function settle() { for (let i = 0; i < 16; i++) await Promise.resolve(); }
async function flush() { for (const effect of runtime.pending.splice(0)) effect(); await settle(); }
async function ready() { render(); await flush(); return render(); }
const profile = (): AnalystProfile => structuredClone(DEFAULT_ANALYST_PROFILE);
const json = (body: unknown, status = 200) => Response.json(body, { status });
beforeEach(() => {
  runtime.hooks.clear(); runtime.pending = []; runtime.cursor = 0; runtime.owner = 'owner-a'; runtime.authLoading = false;
  runtime.query = 'redirect=%2Fapp%3Fhandoff%3Da7fc6ad8-73f0-4b83-a55d-7602777e02c4';
  runtime.push.mockReset(); runtime.assign.mockReset(); vi.mocked(loadAnalystProfile).mockReset().mockResolvedValue(profile()); vi.mocked(initAnalystProfileIfMissing).mockReset().mockResolvedValue(profile());
  vi.stubGlobal('window', { location: { assign: runtime.assign } });
  vi.stubGlobal('fetch', vi.fn(async (url) => json(url === '/api/onboarding/draft' ? {} : { redirectTo: '/app?handoff=a7fc6ad8-73f0-4b83-a55d-7602777e02c4' })));
});
afterEach(() => { for (const value of runtime.hooks.values()) if (value && typeof value === 'object' && 'cleanup' in value) (value as { cleanup?: () => void }).cleanup?.(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('onboarding return actions', () => {
  it('Finish later keeps the user destination and drafted question', async () => {
    await action(await ready(), 'onSkip')();
    expect(vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/onboarding/skip')).toEqual([['/api/onboarding/skip', expect.objectContaining({ method: 'POST' })]]);
    expect(runtime.assign).toHaveBeenCalledWith('/app?handoff=a7fc6ad8-73f0-4b83-a55d-7602777e02c4');
  });
  it('Complete sends the safe destination and uses full navigation across the changed cookie boundary', async () => {
    await ready(); for (let step = 1; step < 4; step++) await action(render(), 'onNext')();
    await action(render(), 'onComplete')(true);
    const completeCall = vi.mocked(fetch).mock.calls.find(([url]) => url === '/api/onboarding/complete');
    expect(JSON.parse(completeCall?.[1]?.body as string)).toEqual({ createFirstSituation: true, redirect: '/app?handoff=a7fc6ad8-73f0-4b83-a55d-7602777e02c4' });
    expect(runtime.assign).toHaveBeenCalledWith('/app?handoff=a7fc6ad8-73f0-4b83-a55d-7602777e02c4'); expect(runtime.push).not.toHaveBeenCalled();
  });
  it('rejects external destinations on Finish later and a malformed completion response', async () => {
    runtime.query = 'redirect=https%3A%2F%2Fevil.test'; await action(await ready(), 'onSkip')(); expect(runtime.assign).toHaveBeenCalledWith('/app');
    for (let step = 1; step < 4; step++) await action(render(), 'onNext')();
    vi.mocked(fetch).mockImplementation(async () => json({ redirectTo: '//evil.test' })); await action(render(), 'onComplete')(false); expect(runtime.assign).toHaveBeenLastCalledWith('/app');
  });
  it('keeps completion failures retryable and blocks duplicate completion', async () => {
    await ready(); for (let step = 1; step < 4; step++) await action(render(), 'onNext')();
    let resolve!: (value: Response) => void; vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));
    const complete = action(render(), 'onComplete'); const pending = complete(false); await complete(false);
    expect(vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/onboarding/complete')).toHaveLength(1);
    expect(elements(render()).find((element) => element.type === 'fieldset')?.props.disabled).toBe(true);
    resolve(json({ error: 'Temporary failure' }, 503)); await pending;
    expect(text(render())).toContain('Could not finish onboarding'); expect(runtime.assign).not.toHaveBeenCalled();
    vi.mocked(fetch).mockImplementation(async () => json({ redirectTo: '/app' })); await action(render(), 'onComplete')(false); expect(runtime.assign).toHaveBeenCalledWith('/app');
  });
  it('keeps Finish later retryable after a failed reminder save', async () => {
    await ready(); vi.mocked(fetch).mockResolvedValueOnce(json({ error: 'Temporary failure' }, 503));
    await action(render(), 'onSkip')(); expect(runtime.assign).not.toHaveBeenCalled();
    await action(render(), 'onSkip')(); expect(runtime.assign).toHaveBeenCalledWith('/app?handoff=a7fc6ad8-73f0-4b83-a55d-7602777e02c4');
  });
});

describe('onboarding profile initialization and editing', () => {
  it('hides editing while authentication and the initial profile/draft are loading', async () => {
    runtime.owner = null; runtime.authLoading = true;
    let tree = render(); await flush(); expect(editor(tree)).toBeUndefined(); expect(loadAnalystProfile).not.toHaveBeenCalled();
    await action(tree, 'onSkip')(); expect(fetch).not.toHaveBeenCalled();
    let resolve!: (value: AnalystProfile) => void; vi.mocked(loadAnalystProfile).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    runtime.owner = 'owner-a'; runtime.authLoading = false; render(); await flush(); expect(editor(render())).toBeUndefined();
    resolve(profile()); await settle(); tree = render(); expect(editor(tree)).toBeDefined();
    await action(tree, 'onChange')({ identity: { ...profile().identity, role: 'researcher' } });
    expect(vi.mocked(fetch).mock.calls.find(([url]) => url === '/api/onboarding/profile')?.[1]?.method).toBe('PATCH');
  });
  it('keeps multi-keystroke editing responsive, serializes latest values and blocks Continue while saving', async () => {
    let tree: ReactNode = await ready(); let resolveFirst!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((done) => { resolveFirst = done; }));
    const pending = ['A', 'AB', 'ABC'].map((org) => action(render(), 'onChange')({ identity: { ...profile().identity, org } }));
    tree = render(); expect((editor(tree)!.props.profile as AnalystProfile).identity.org).toBe('ABC');
    expect(elements(tree).find((element) => element.type === 'fieldset')?.props.disabled).not.toBe(true);
    await action(tree, 'onNext')(); expect(editor(render())!.type).toBe(editor(tree)!.type);
    await settle(); expect(vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/onboarding/profile')).toHaveLength(1);
    resolveFirst(json({})); await Promise.all(pending);
    const saves = vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/onboarding/profile');
    expect(saves.map(([, request]) => JSON.parse(request!.body as string).identity.org)).toEqual(['A', 'AB', 'ABC']);
    expect((editor(render())!.props.profile as AnalystProfile).identity.org).toBe('ABC');
    runtime.authLoading = true; render(); await flush(); runtime.authLoading = false; render(); await flush();
    expect((editor(render())!.props.profile as AnalystProfile).identity.org).toBe('ABC'); expect(loadAnalystProfile).toHaveBeenCalledTimes(1);
  });
  it('shows initialization failure and Retry, then initializes a missing profile', async () => {
    vi.mocked(loadAnalystProfile).mockRejectedValueOnce(new Error('Firestore unavailable'));
    let tree: ReactNode = await ready(); expect(editor(tree)).toBeUndefined(); expect(text(tree)).toContain('Could not load your analyst profile');
    vi.mocked(loadAnalystProfile).mockResolvedValueOnce(null);
    const retry = elements(tree).find((element) => element.type === 'button' && text(element).includes('Retry loading profile'))!;
    (retry.props.onClick as () => void)(); render(); await flush(); tree = render();
    expect(initAnalystProfileIfMissing).toHaveBeenCalledWith('owner-a'); expect(editor(tree)).toBeDefined();
  });
  it('ignores delayed profile and save responses from a previous owner', async () => {
    let resolveOld!: (value: AnalystProfile) => void;
    vi.mocked(loadAnalystProfile).mockImplementationOnce(() => new Promise((done) => { resolveOld = done; }));
    render(); await flush(); runtime.owner = 'owner-b'; render(); await flush();
    resolveOld({ ...profile(), identity: { ...profile().identity, org: 'Owner A confidential' } }); await settle();
    expect((editor(render())!.props.profile as AnalystProfile).identity.org).not.toBe('Owner A confidential');
    let resolveSave!: (value: Response) => void; vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((done) => { resolveSave = done; }));
    const pending = action(render(), 'onChange')({ identity: { ...profile().identity, org: 'Owner B delayed' } }); await settle();
    runtime.owner = 'owner-c'; expect(editor(render())).toBeUndefined(); await flush(); resolveSave(json({})); await pending;
    expect((editor(render())!.props.profile as AnalystProfile).identity.org).not.toBe('Owner B delayed');
  });
  it('keeps a failed section on its step until a full section retry persists the latest edits', async () => {
    await ready(); await action(render(), 'onNext')(); const perspectiveType = editor(render())!.type;
    vi.mocked(fetch).mockResolvedValueOnce(json({ error: 'Temporary failure' }, 503));
    const perspective = { ...profile().perspective, regions: ['Eastern Europe'] };
    await action(render(), 'onChange')({ perspective });
    await action(render(), 'onBack')(); expect(editor(render())!.type).toBe(perspectiveType);
    await action(render(), 'onNext')(); expect(editor(render())!.type).toBe(perspectiveType);
    expect(text(render())).toContain('retry this edit');
    const retry = elements(render()).find((element) => element.type === 'button' && text(element).includes('Retry saving changes'))!;
    (retry.props.onClick as () => void)(); await settle(); await action(render(), 'onBack')();
    expect(editor(render())!.type).not.toBe(perspectiveType);
    const saves = vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/onboarding/profile');
    expect(JSON.parse(saves.at(-1)![1]!.body as string)).toEqual({ perspective });
  });
  it('does not navigate when completion arrives after an owner change', async () => {
    await ready(); for (let step = 1; step < 4; step++) await action(render(), 'onNext')();
    let resolve!: (value: Response) => void; vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));
    const pending = action(render(), 'onComplete')(false); runtime.owner = 'owner-b';
    expect(elements(render()).some((element) => typeof element.props.onComplete === 'function')).toBe(false);
    await flush(); resolve(json({ redirectTo: '/app' })); await pending;
    expect(runtime.assign).not.toHaveBeenCalled();
  });
  it('bounds a stalled profile load and leaves visible Retry', async () => {
    vi.useFakeTimers(); vi.mocked(loadAnalystProfile).mockImplementationOnce(() => new Promise(() => {}));
    render(); await flush(); await vi.advanceTimersByTimeAsync(30001);
    expect(text(render())).toContain('Could not load your analyst profile'); expect(text(render())).toContain('Retry loading profile'); expect(editor(render())).toBeUndefined();
  });
});
