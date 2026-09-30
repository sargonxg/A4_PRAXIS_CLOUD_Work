import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CapsuleReviewQueueSection } from '@/components/capsules/workbench/CapsuleReviewQueueSection';

const runtime = vi.hoisted(() => ({ cursor: 0, hooks: new Map<number, unknown>(), pending: [] as Array<() => void> }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return { ...react, memo: (component: unknown) => component,
    useState: (initial: unknown) => {
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial);
      return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (value: unknown) => unknown)(runtime.hooks.get(key)) : update)];
    },
    useRef: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial }); return runtime.hooks.get(key); },
    useCallback: (callback: unknown, deps: unknown[]) => { const key = runtime.cursor++; const prev = runtime.hooks.get(key) as { deps: unknown[]; callback: unknown } | undefined; if (!prev || deps.some((dep, i) => dep !== prev.deps[i])) runtime.hooks.set(key, { deps, callback }); return (runtime.hooks.get(key) as { callback: unknown }).callback; },
    useEffect: (effect: () => void | (() => void), deps: unknown[]) => {
      const key = runtime.cursor++; const prev = runtime.hooks.get(key) as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (!prev || deps.some((dep, i) => dep !== prev.deps[i])) { prev?.cleanup?.(); const next = { deps, cleanup: undefined as (() => void) | undefined }; runtime.hooks.set(key, next); runtime.pending.push(() => { next.cleanup = effect() || undefined; }); }
    },
  };
});
type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); return isValidElement<Record<string, unknown>>(node) ? [node, ...elements(node.props.children as ReactNode)] : []; }
function text(node: ReactNode): string { if (typeof node === 'string' || typeof node === 'number') return String(node); if (Array.isArray(node)) return node.map(text).join(' '); return isValidElement<Record<string, unknown>>(node) ? text(node.props.children as ReactNode) : ''; }
function render(capsuleId = 'cap-a') { runtime.cursor = 0; return (CapsuleReviewQueueSection as unknown as (props: { capsuleId: string; reviewQueue: [] }) => ReactNode)({ capsuleId, reviewQueue: [] }); }
async function effects() { for (const effect of runtime.pending.splice(0)) effect(); for (let i = 0; i < 5; i++) await Promise.resolve(); }
function button(tree: ReactNode, label: string) { const node = elements(tree).find((item) => item.type === 'button' && text(item).includes(label)); expect(node).toBeDefined(); return node!; }
const page = (id: string, ids: string[], cursor: string | null) => ({ capsule: { capsuleId: id, label: 'Policy context' }, reviewCards: ids.map((cardId) => ({ reviewCardId: cardId, title: `Proposal ${cardId}`, state: 'owner_review' })), reviewCardsNextCursor: cursor, reviewCardsHasMore: Boolean(cursor) });
const response = (data: unknown) => ({ ok: true, json: async () => data }) as Response;
beforeEach(() => { runtime.hooks.clear(); runtime.pending = []; runtime.cursor = 0; vi.stubGlobal('fetch', vi.fn()); });

describe('saved proposal pagination', () => {
  it('loads a bounded first page and appends distinct proposals with the server cursor', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(page('cap-a', ['a'], 'cursor-1'))).mockResolvedValueOnce(response(page('cap-a', ['a', 'b'], null)));
    render(); await effects(); let tree = render();
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/context/capsules/cap-a?includeReviewCards=true&reviewLimit=50', expect.any(Object));
    await (button(tree, 'Load more proposals').props.onClick as () => Promise<void>)(); tree = render();
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/api/context/capsules/cap-a?includeReviewCards=true&reviewLimit=50&reviewCursor=cursor-1');
    expect(elements(tree).filter((item) => item.type === 'article' && item.props.id === 'capsule-review-a')).toHaveLength(1);
    expect(text(tree)).toContain('Proposal b');
    expect(text(tree)).not.toContain('Load more proposals');
  });
  it('keeps the loaded proposals and cursor after a failed next page, then retries', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(page('cap-a', ['a'], 'cursor-1'))).mockResolvedValueOnce({ ok: false } as Response).mockResolvedValueOnce(response(page('cap-a', ['b'], null)));
    render(); await effects(); await (button(render(), 'Load more proposals').props.onClick as () => Promise<void>)();
    expect(text(render())).toContain('Proposal a'); expect(text(render())).toContain('Could not load more');
    await (button(render(), 'Load more proposals').props.onClick as () => Promise<void>)();
    expect(text(render())).toContain('Proposal b');
    expect(vi.mocked(fetch).mock.calls[2][0]).toContain('reviewCursor=cursor-1');
  });
  it('ignores a late page for a capsule that is no longer open', async () => {
    let resolveOld!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveOld = resolve; })).mockResolvedValueOnce(response(page('cap-b', ['b'], null)));
    render('cap-a'); await effects(); render('cap-b'); await effects();
    resolveOld(response(page('cap-a', ['a'], 'cursor-1'))); await effects();
    expect(text(render('cap-b'))).toContain('Proposal b'); expect(text(render('cap-b'))).not.toContain('Proposal a');
  });
});
