import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from '@/app/onboarding/page';

const runtime = vi.hoisted(() => ({ cursor: 0, hooks: new Map<number, unknown>(), query: 'redirect=%2Fapp%2Fcapsules%2Fbuilder%3FcapsulePrompt%3DCompare%2520positions', push: vi.fn(), assign: vi.fn() }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => {
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial);
      return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (previous: unknown) => unknown)(runtime.hooks.get(key)) : update)];
    }, useEffect: vi.fn(), useCallback: (callback: unknown) => callback,
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: runtime.push }), useSearchParams: () => new URLSearchParams(runtime.query) }));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: { id: 'owner-a' } }) }));
vi.mock('@/lib/firebase/analyst-profile-service', () => ({ loadAnalystProfile: vi.fn(), initAnalystProfileIfMissing: vi.fn() }));
vi.mock('@/app/onboarding/step-identity', () => ({ StepIdentity: () => null }));
vi.mock('@/app/onboarding/step-perspective', () => ({ StepPerspective: () => null }));
vi.mock('@/app/onboarding/step-working-style', () => ({ StepWorkingStyle: () => null }));
vi.mock('@/app/onboarding/completion-success', () => ({ CompletionSuccess: () => null }));
vi.mock('@/app/onboarding/live-preview', () => ({ LivePreview: () => null }));

type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}
function render() {
  runtime.cursor = 0;
  const child = OnboardingPage().props.children as ReactElement;
  return (child.type as () => ReactNode)();
}
function action(tree: ReactNode, name: string) {
  const node = elements(tree).find((element) => typeof element.props[name] === 'function');
  expect(node).toBeDefined();
  return node!.props[name] as (...args: unknown[]) => Promise<void>;
}
beforeEach(() => {
  runtime.hooks.clear(); runtime.cursor = 0;
  runtime.query = 'redirect=%2Fapp%2Fcapsules%2Fbuilder%3FcapsulePrompt%3DCompare%2520positions';
  runtime.push.mockReset(); runtime.assign.mockReset();
  vi.stubGlobal('window', { location: { assign: runtime.assign } });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ redirectTo: '/app/capsules/builder?capsulePrompt=Compare%20positions' }) })));
});

describe('onboarding return actions', () => {
  it('Finish later keeps the user destination and drafted question', async () => {
    await action(render(), 'onSkip')();
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/onboarding/skip', { method: 'POST' });
    expect(runtime.assign).toHaveBeenCalledWith('/app/capsules/builder?capsulePrompt=Compare%20positions');
  });
  it('Complete sends the safe return destination and navigates to it', async () => {
    for (let step = 1; step < 4; step += 1) await action(render(), 'onNext')();
    await action(render(), 'onComplete')(true);
    const completeCall = vi.mocked(fetch).mock.calls.find(([url]) => url === '/api/onboarding/complete');
    expect(JSON.parse(completeCall?.[1]?.body as string)).toEqual({ createFirstSituation: true, redirect: '/app/capsules/builder?capsulePrompt=Compare%20positions' });
    expect(runtime.push).toHaveBeenCalledWith('/app/capsules/builder?capsulePrompt=Compare%20positions');
  });
  it('ignores an external return target on Finish later', async () => {
    runtime.query = 'redirect=https%3A%2F%2Fevil.test';
    await action(render(), 'onSkip')();
    expect(runtime.assign).toHaveBeenCalledWith('/app');
  });
});
