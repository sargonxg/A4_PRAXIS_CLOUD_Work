import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CapsuleListPicker } from '@/components/cores/CapsuleListPicker';

const runtime = vi.hoisted(() => ({ cursor: 0, hooks: new Map<number, unknown>(), pending: [] as Array<() => void>, owner: 'owner-a', loading: false, listeners: new Map<string, (event: unknown) => void>() }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => {
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, typeof initial === 'function' ? (initial as () => unknown)() : initial);
      return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (prev: unknown) => unknown)(runtime.hooks.get(key)) : update)];
    },
    useRef: (initial: unknown) => {
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial });
      return runtime.hooks.get(key);
    },
    useId: () => { const key = runtime.cursor++; return `picker-${key}`; },
    useMemo: (compute: () => unknown) => compute(),
    useEffect: (effect: () => void | (() => void), deps: unknown[]) => {
      const key = runtime.cursor++;
      const previous = runtime.hooks.get(key) as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
        previous?.cleanup?.();
        const next = { deps, cleanup: undefined as (() => void) | undefined };
        runtime.hooks.set(key, next);
        runtime.pending.push(() => { next.cleanup = effect() || undefined; });
      }
    },
  };
});
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: runtime.owner ? { id: runtime.owner } : null, loading: runtime.loading }) }));
vi.mock('@/components/capsules/CapsuleReadinessBadge', () => ({ CapsuleReadinessBadge: () => null }));
vi.mock('@/lib/context/capsule-quality', () => ({ deriveCapsuleReadinessSummary: () => ({}) }));

type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}
function find(tree: ReactNode, predicate: (node: Element) => boolean): Element {
  const node = elements(tree).find(predicate);
  expect(node).toBeDefined();
  return node!;
}
function textOf(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return typeof node === 'string' ? node : '';
}
const selected = vi.fn();
const focus = vi.fn();
function render(refreshKey = 0) {
  runtime.cursor = 0;
  const tree = CapsuleListPicker({ activeCapsuleId: 'a', onSelect: selected, refreshKey, allowQuickCreate: true });
  for (const node of elements(tree)) {
    if (typeof node.props.ref === 'function') (node.props.ref as (el: unknown) => void)({ focus });
    else if (node.props.ref && typeof node.props.ref === 'object') (node.props.ref as { current: unknown }).current = { focus, contains: () => false };
  }
  return tree;
}
function effects() { for (const effect of runtime.pending.splice(0)) effect(); }
async function settle() { await new Promise((resolve) => setImmediate(resolve)); }
function click(node: Element) { return (node.props.onClick as () => unknown)(); }
function open() { click(find(render(), (node) => node.props['aria-haspopup'] === 'listbox')); return render(); }
function key(node: Element, value: string) { (node.props.onKeyDown as (event: unknown) => void)({ key: value, preventDefault: vi.fn() }); }
const capsules = [{ capsuleId: 'a', label: 'Case A', version: 7, scope: 'situation' }, { capsuleId: 'b', label: 'Case B', version: 3, scope: 'situation' }];
const ok = (value: unknown) => ({ ok: true, json: async () => value });

beforeEach(() => {
  for (const value of runtime.hooks.values()) (value as { cleanup?: () => void })?.cleanup?.();
  runtime.hooks.clear(); runtime.pending = []; runtime.cursor = 0; runtime.owner = 'owner-a'; runtime.loading = false; runtime.listeners.clear();
  selected.mockReset(); focus.mockReset();
  vi.stubGlobal('document', { addEventListener: (name: string, cb: (event: unknown) => void) => runtime.listeners.set(name, cb), removeEventListener: (name: string) => runtime.listeners.delete(name) });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  vi.stubGlobal('fetch', vi.fn());
});

describe('capsule picker recovery and keyboard use', () => {
  it('searches saved capsules without changing their recorded versions', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({ capsules }) as Response);
    render(); effects(); await settle();
    const tree = open();
    const search = find(tree, (node) => node.props.type === 'search');
    (search.props.onChange as (event: unknown) => void)({ target: { value: 'case b' } });
    const filtered = render();
    const options = elements(filtered).filter((node) => node.props.role === 'option');
    expect(options).toHaveLength(1);
    expect(textOf(options[0])).toContain('Case B');
    click(options[0]);
    expect(selected).toHaveBeenCalledExactlyOnceWith('b', capsules[1]);
  });
  it('loads an older page without dropping the original capsule or active version', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ capsules: [capsules[0]], nextCursor: 'older-page' }) as Response)
      .mockResolvedValueOnce(ok({ capsules: [capsules[1]], nextCursor: null }) as Response);
    render(); effects(); await settle();
    click(find(open(), (node) => node.type === 'button' && textOf(node).includes('Load older capsules')));
    render(); effects(); await settle();
    const tree = render();
    expect(elements(tree).filter((node) => node.props.role === 'option')).toHaveLength(2);
    expect(textOf(tree)).toContain('Case A');
    expect(textOf(tree)).toContain('Case B');
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain('cursor=older-page');
    expect(selected).not.toHaveBeenCalled();
  });
  it('distinguishes loading from an empty saved library', async () => {
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>((done) => { resolve = done; }));
    render(); effects();
    expect(textOf(open())).toContain('Loading capsules');
    resolve(ok({ capsules: [] }) as Response); await settle();
    expect(textOf(render())).toContain('No saved capsules yet');
  });
  it('offers Retry after a load failure and preserves the active selection', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(ok({ capsules }) as Response);
    render(); effects(); await settle();
    let tree = open();
    expect(textOf(tree)).toContain('could not be loaded');
    click(find(tree, (node) => node.type === 'button' && textOf(node) === 'Retry'));
    tree = render(); effects(); await settle(); tree = render();
    expect(find(tree, (node) => node.props.role === 'option' && textOf(node).includes('Case A')).props['aria-selected']).toBe(true);
    expect(selected).not.toHaveBeenCalled();
  });
  it('shows a failed creation without losing the library or selecting a phantom capsule', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ capsules }) as Response).mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    render(); effects(); await settle();
    const tree = open();
    await click(find(tree, (node) => node.type === 'button' && textOf(node).includes('New capsule')));
    expect(textOf(render())).toContain('could not be created');
    expect(textOf(render())).toContain('Case A');
    expect(selected).not.toHaveBeenCalled();
  });
  it('supports arrow navigation, keyboard selection, Escape and focus return', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({ capsules }) as Response);
    render(); effects(); await settle();
    let tree = open(); effects();
    const options = elements(tree).filter((node) => node.props.role === 'option');
    expect(options).toHaveLength(2);
    key(options[0], 'ArrowDown'); tree = render(); effects();
    const second = find(tree, (node) => node.props.role === 'option' && textOf(node).includes('Case B'));
    expect(second.props.tabIndex).toBe(0);
    key(second, 'Enter');
    expect(selected).toHaveBeenCalledExactlyOnceWith('b', capsules[1]);
    expect(find(render(), (node) => node.props['aria-haspopup'] === 'listbox').props['aria-expanded']).toBe(false);
    tree = open(); key(find(tree, (node) => node.props.role === 'option'), 'Escape');
    expect(find(render(), (node) => node.props['aria-haspopup'] === 'listbox').props['aria-expanded']).toBe(false);
    expect(focus).toHaveBeenCalled();
  });
  it('hides the previous owner inventory immediately when accounts change', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({ capsules }) as Response);
    render(); effects(); await settle(); open();
    runtime.owner = 'owner-b';
    expect(textOf(render())).not.toContain('Case A');
  });
  it('does not select a late-created capsule after the account changes', async () => {
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockResolvedValueOnce(ok({ capsules }) as Response).mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));
    render(); effects(); await settle();
    const creation = click(find(open(), (node) => node.type === 'button' && textOf(node).includes('New capsule')));
    runtime.owner = 'owner-b'; render();
    resolve(ok({ capsule: { ...capsules[0], capsuleId: 'created-a' } }) as Response);
    await creation;
    expect(selected).not.toHaveBeenCalled();
    expect(textOf(render())).not.toContain('Case A');
  });
});
