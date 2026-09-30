import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AskContextBar } from '@/components/app/ask-context-bar';
import { PraxisChatFirstShell } from '@/components/app/praxis-chat-first-shell';
import { defaultActiveContextStack, sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

const runtime = vi.hoisted(() => ({
  user: { id: 'owner-a' } as { id: string } | null,
  authLoading: false,
  hydrated: false,
  query: '',
  hooks: new Map<number, unknown>(),
  cursor: 0,
  saveStack: vi.fn(),
}));

// A shallow hook state harness lets the real menu/drawer be opened without
// adding a DOM dependency or executing data-fetching effects.
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return {
    ...react,
    useState: (initial: unknown) => {
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, typeof initial === 'function' ? (initial as () => unknown)() : initial);
      return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (previous: unknown) => unknown)(runtime.hooks.get(key)) : update)];
    },
    useMemo: (compute: () => unknown) => compute(),
    useCallback: (callback: unknown) => callback,
    useRef: (initial: unknown) => {
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial });
      return runtime.hooks.get(key);
    },
    useEffect: () => undefined,
  };
});
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: runtime.user, loading: runtime.authLoading, analystProfile: null }) }));
vi.mock('@/stores/situation-store', () => ({ useSituationStore: (select: (state: unknown) => unknown) => select({ activeSituation: null, situations: [] }) }));
vi.mock('@/components/app/use-active-context-stack', () => ({ useActiveContextStack: () => ({ stack: attachedStack(), saveStack: runtime.saveStack, hydrated: runtime.hydrated, persisted: true }) }));
vi.mock('next/navigation', () => ({ usePathname: () => '/app', useSearchParams: () => new URLSearchParams(runtime.query), useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: { children?: ReactNode }) => <a {...props}>{children}</a> }));
vi.mock('@/components/app/public-shell', () => ({ PublicShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('next/dynamic', () => ({
  default: (loader: () => unknown) => {
    const name = loader.toString().match(/module\.(\w+)/)?.[1] ?? 'Dynamic';
    const Stub = (props: { contextBar?: ReactNode }) => name === 'CapsuleListPicker' || name === 'CapsuleImportButton'
      ? <button type="button" data-testid={name}>{name}</button>
      : <>{props.contextBar}</>;
    Stub.displayName = name;
    return Stub;
  },
}));

function attachedStack() {
  return sanitizeActiveContextStack({
    capsuleId: 'case-a',
    capsuleRefs: [
      { capsuleId: 'case-a', role: 'situation', label: 'Case A', primary: true, version: 7 },
      { capsuleId: 'user-a', role: 'user', label: 'User A' },
      { capsuleId: 'tool-a', role: 'tool', label: 'Tool A' },
      { capsuleId: 'output-a', role: 'output', label: 'Output A' },
      { capsuleId: 'extra-a', role: 'reference', label: 'Extra A', version: 3 },
    ],
  });
}

type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  const nested = typeof node.type === 'function' && ['CapsuleDockSlotCard', 'ContextDrawer'].includes(node.type.name)
    ? (node.type as (props: Record<string, unknown>) => ReactNode)(node.props)
    : node.props.children as ReactNode;
  return [node, ...elements(nested), ...elements(node.props.contextBar as ReactNode)];
}
function find(node: ReactNode, match: (element: Element) => boolean): Element {
  const element = elements(node).find(match);
  expect(element).toBeDefined();
  return element!;
}
function click(element: Element) { (element.props.onClick as () => void)(); }
function bar(mode: 'public' | 'authenticated' = 'authenticated', onMutationPending?: (pending: boolean) => void) {
  runtime.cursor = 0;
  return AskContextBar({ mode, hydrated: runtime.hydrated, stack: attachedStack(), saveStack: runtime.saveStack, onMutationPending });
}
function shell(mode: 'public' | 'authenticated' = 'authenticated') {
  runtime.cursor = 0;
  return PraxisChatFirstShell({ mode });
}
function named(element: Element, name: string) {
  return typeof element.type === 'function' && (element.type as { displayName?: string }).displayName === name;
}
function drawer() {
  const initial = shell();
  const chat = find(initial, (element) => named(element, 'PraxisChat'));
  (chat.props.onToggleContext as () => void)();
  return shell();
}

beforeEach(() => {
  runtime.user = { id: 'owner-a' };
  runtime.authLoading = false;
  runtime.hydrated = false;
  runtime.query = '';
  runtime.hooks.clear();
  runtime.cursor = 0;
  runtime.saveStack.mockReset().mockResolvedValue(defaultActiveContextStack());
});

describe('Ask context mutation readiness', () => {
  it('Home promotion saves every attached capsule and its pinned version', () => {
    runtime.hydrated = true;
    const contextDrawer = find(drawer(), (element) => typeof element.type === 'function' && element.type.name === 'ContextDrawer');
    (contextDrawer.props.onMakePrimaryCapsule as (id: string) => void)('extra-a');
    expect(runtime.saveStack).toHaveBeenCalledWith(expect.objectContaining({
      capsuleId: 'extra-a',
      capsuleRefs: expect.arrayContaining([
        expect.objectContaining({ capsuleId: 'case-a', primary: false, role: 'reference', version: 7 }),
        expect.objectContaining({ capsuleId: 'extra-a', primary: true, version: 3 }),
        expect.objectContaining({ capsuleId: 'tool-a', role: 'tool' }),
      ]),
    }));
    expect(runtime.saveStack.mock.calls[0][0].capsuleRefs).toHaveLength(5);
  });
  it('attaches a named canonical capsule with its pinned version without replacing existing context', () => {
    runtime.hydrated = true;
    const picker = find(bar(), (element) => named(element, 'CapsuleListPicker'));
    (picker.props.onSelect as (id: string, capsule: unknown) => void)('new-case', { capsuleId: 'new-case', label: 'Reviewed policy sources', version: 11 });
    expect(runtime.saveStack).toHaveBeenCalledWith(expect.objectContaining({
      capsuleId: 'case-a',
      capsuleRefs: expect.arrayContaining([
        expect.objectContaining({ capsuleId: 'new-case', label: 'Reviewed policy sources', version: 11, role: 'reference' }),
        expect.objectContaining({ capsuleId: 'case-a', version: 7, primary: true }),
      ]),
    }));
    expect(runtime.saveStack.mock.calls[0][0].capsuleRefs).toHaveLength(6);
  });

  it('blocks Ask while a context write is pending and re-enables it after a failed save', async () => {
    runtime.hydrated = true;
    let fail!: (reason: Error) => void;
    runtime.saveStack.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    const pending = vi.fn();
    const picker = find(bar('authenticated', pending), (element) => named(element, 'CapsuleListPicker'));
    (picker.props.onSelect as (id: string, capsule: unknown) => void)('new-case', { capsuleId: 'new-case', label: 'Reviewed sources', version: 11 });
    expect(pending).toHaveBeenCalledWith(true);
    fail(new Error('Save failed'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(pending).toHaveBeenLastCalledWith(false);
    expect(renderToStaticMarkup(bar())).toContain('Save failed');
  });

  it.each([
    { user: true, authLoading: false, hydrated: false, disabled: true },
    { user: true, authLoading: true, hydrated: true, disabled: true },
    { user: false, authLoading: false, hydrated: true, disabled: true },
    { user: true, authLoading: false, hydrated: true, disabled: false },
  ])('gates named-chip detach, typed-slot mutations, Build and Clear at every viewport: %j', (state) => {
    runtime.user = state.user ? { id: 'owner-a' } : null;
    runtime.authLoading = state.authLoading;
    runtime.hydrated = state.hydrated;
    click(find(bar(), (element) => element.props.title === 'Show context details: sources, saved context, readiness'));
    const html = renderToStaticMarkup(bar());
    const mutations = (html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [])
      .filter((button) => /Clear context|Build context|title="(?:Remove|Detach)|data-testid="capsule-dock-chip"/.test(button));
    expect(mutations).toHaveLength(15);
    for (const button of mutations) expect(button.includes('disabled=""'), button).toBe(state.disabled);
    expect(runtime.saveStack).not.toHaveBeenCalled();
  });

  it('ignores premature Clear callbacks and saves the complete cleared context after hydration', async () => {
    click(find(bar(), (element) => element.props.title === 'Show context details: sources, saved context, readiness'));
    click(find(bar(), (element) => element.props.title === 'Clear context'));
    expect(runtime.saveStack).not.toHaveBeenCalled();
    runtime.hydrated = true;
    click(find(bar(), (element) => element.props.title === 'Clear context'));
    expect(runtime.saveStack).toHaveBeenCalledOnce();
    expect(runtime.saveStack).toHaveBeenCalledWith(expect.objectContaining({ capsuleId: null, capsuleRefs: [], sourceIds: [], documentIds: [], contextPackageId: null, contextBlocks: defaultActiveContextStack().contextBlocks }));
    await Promise.resolve();
  });

  it('hides an open picker when the account context starts loading again', () => {
    runtime.hydrated = true;
    click(find(bar(), (element) => element.props.title === 'Show context details: sources, saved context, readiness'));
    click(find(bar(), (element) => element.props['data-testid'] === 'capsule-dock-chip' && element.type === 'button'));
    expect(renderToStaticMarkup(bar()).match(/data-testid="CapsuleListPicker"/g)).toHaveLength(2);
    runtime.user = { id: 'owner-b' };
    runtime.hydrated = false;
    expect(renderToStaticMarkup(bar()).match(/data-testid="CapsuleListPicker"/g)).toHaveLength(1);
  });

  it('preserves public sign-in links and disables saved-context mutations', () => {
    runtime.user = null;
    const html = renderToStaticMarkup(bar('public'));
    expect(html).toContain('Attach context');
    expect(html).toContain('/login?mode=signup&amp;redirect=%2Fapp');
    expect(html).not.toContain('Clear context');
    expect(html).not.toContain('title="Remove');
  });

  it.each([
    { user: true, authLoading: false, hydrated: false, disabled: true },
    { user: true, authLoading: true, hydrated: true, disabled: true },
    { user: false, authLoading: false, hydrated: true, disabled: true },
    { user: true, authLoading: false, hydrated: true, disabled: false },
  ])('protects advanced picker/import and attached-capsule controls: %j', (state) => {
    runtime.user = state.user ? { id: 'owner-a' } : null;
    runtime.authLoading = state.authLoading;
    runtime.hydrated = state.hydrated;
    const tree = drawer();
    const html = renderToStaticMarkup(tree);
    const controls = (html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [])
      .filter((button) => /data-testid="launchpad-capsule-chip"|Make primary|Detach/.test(button));
    expect(controls).toHaveLength(10);
    for (const button of controls) expect(button.includes('disabled=""'), button).toBe(state.disabled);
    const pickerGroups = (html.match(/<fieldset\b[^>]*>[\s\S]*?<\/fieldset>/g) ?? []).filter((group) => /CapsuleListPicker|CapsuleImportButton/.test(group));
    expect(pickerGroups).toHaveLength(2);
    for (const group of pickerGroups) expect(group.match(/^<fieldset[^>]*>/)?.[0].includes('disabled=""')).toBe(state.disabled);
  });

  it('keeps the dock and Ask blocked until the saved capsule URL handoff is consumed', () => {
    runtime.hydrated = true;
    runtime.query = 'capsuleId=saved-capsule';
    const pending = shell();
    expect(find(pending, (element) => named(element, 'AskContextBar')).props.hydrated).toBe(false);
    expect(find(pending, (element) => named(element, 'PraxisChat')).props.contextReady).toBe(false);
    expect(runtime.hydrated).toBe(true);
    runtime.query = '';
    const consumed = shell();
    expect(find(consumed, (element) => named(element, 'AskContextBar')).props.hydrated).toBe(true);
    expect(find(consumed, (element) => named(element, 'PraxisChat')).props.contextReady).toBe(true);
  });

  it('guards all advanced callbacks before hydration and re-enables saving afterward', async () => {
    const tree = drawer();
    const editor = find(tree, (element) => typeof element.type === 'function' && element.type.name === 'ContextDrawer');
    for (const action of ['onActivateCapsule', 'onAttachReferenceCapsule', 'onDetachCapsule', 'onMakePrimaryCapsule']) {
      (editor.props[action] as (capsuleId: string) => void)('extra-a');
    }
    expect(runtime.saveStack).not.toHaveBeenCalled();
    runtime.hydrated = true;
    const readyEditor = find(shell(), (element) => typeof element.type === 'function' && element.type.name === 'ContextDrawer');
    (readyEditor.props.onAttachReferenceCapsule as (capsuleId: string) => void)('new-a');
    expect(runtime.saveStack).toHaveBeenCalledOnce();
    await Promise.resolve();
  });
});
