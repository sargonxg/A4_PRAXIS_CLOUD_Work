import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/(auth)/login/page';

const runtime = vi.hoisted(() => ({ shallow: false, loading: false, cursor: 0, hooks: new Map<number, unknown>(), effects: [] as Array<() => void>, signIn: vi.fn(), push: vi.fn() }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => {
      if (!runtime.shallow) return react.useState(initial);
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial);
      return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (prev: unknown) => unknown)(runtime.hooks.get(key)) : update)];
    },
    useRef: (initial: unknown) => {
      if (!runtime.shallow) return react.useRef(initial);
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial });
      return runtime.hooks.get(key);
    },
    useMemo: (compute: () => unknown, deps: unknown[]) => runtime.shallow ? compute() : react.useMemo(compute, deps),
    useEffect: (effect: () => void, deps: unknown[]) => { if (runtime.shallow) runtime.effects.push(effect); else react.useEffect(effect, deps); },
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: runtime.push }), useSearchParams: () => new URLSearchParams({ redirect: '/app?panel=memo' }) }));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: null, loading: runtime.loading, authError: null, clearAuthError: vi.fn(), signInWithEmail: runtime.signIn, signUpWithEmail: vi.fn(), signInWithGoogle: vi.fn(), resetPassword: vi.fn() }) }));
vi.mock('@/components/ui/instrument', () => ({ LivingContextRail: () => null }));
vi.mock('framer-motion', async () => {
  const { createElement } = await import('react');
  return { motion: new Proxy({}, { get: (_, tag: string) => ({ children, initial: _initial, animate: _animate, transition: _transition, ...props }: Record<string, unknown>) => createElement(tag, props, children as ReactNode) }) };
});

type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}
function form() {
  runtime.shallow = true;
  runtime.cursor = 0;
  runtime.effects = [];
  const child = LoginPage().props.children as ReactElement;
  return (child.type as () => ReactNode)();
}
function find(tree: ReactNode, predicate: (element: Element) => boolean) {
  const node = elements(tree).find(predicate);
  expect(node).toBeDefined();
  return node!;
}
beforeEach(() => {
  runtime.shallow = false;
  runtime.loading = false;
  runtime.hooks.clear();
  runtime.effects = [];
  runtime.signIn.mockReset().mockResolvedValue({ success: true });
  runtime.push.mockReset();
  vi.stubGlobal('window', { localStorage: { setItem: vi.fn() } });
});

describe('login readiness', () => {
  it('renders submit and identity inputs disabled before hydration', () => {
    const html = renderToStaticMarkup(<LoginPage />);
    expect(html.match(/<input[^>]+id="email"[^>]*>/)?.[0]).toMatch(/ disabled(?:=""|(?=\s|>))/);
    expect(html.match(/<input[^>]+id="password"[^>]*>/)?.[0]).toMatch(/ disabled(?:=""|(?=\s|>))/);
    expect(html.match(/<button[^>]+type="submit"[^>]*>/)?.[0]).toMatch(/ disabled(?:=""|(?=\s|>))/);
  });
  it('enables after hydration and invokes real sign-in once with the preserved destination', async () => {
    const first = form();
    expect(find(first, (node) => node.props.type === 'submit').props.disabled).toBe(true);
    for (const effect of runtime.effects) effect();
    let tree = form();
    expect(find(tree, (node) => node.props.type === 'submit').props.disabled).toBe(false);
    (find(tree, (node) => node.props.id === 'email').props.onChange as (event: unknown) => void)({ target: { value: 'analyst@example.test' } });
    (find(tree, (node) => node.props.id === 'password').props.onChange as (event: unknown) => void)({ target: { value: 'safe-test-password' } });
    tree = form();
    await (find(tree, (node) => typeof node.props.onSubmit === 'function').props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault: vi.fn() });
    expect(runtime.signIn).toHaveBeenCalledExactlyOnceWith('analyst@example.test', 'safe-test-password');
    expect(runtime.push).toHaveBeenCalledWith('/app?panel=memo');
  });
  it('keeps the controls disabled while the auth session is resolving', () => {
    runtime.loading = true;
    form();
    for (const effect of runtime.effects) effect();
    const tree = form();
    expect(find(tree, (node) => node.props.type === 'submit').props.disabled).toBe(true);
    expect(runtime.signIn).not.toHaveBeenCalled();
  });
});
