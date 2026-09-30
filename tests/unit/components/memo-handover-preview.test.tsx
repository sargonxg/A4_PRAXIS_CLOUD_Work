import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoHandoverPreview } from '@/components/praxis/MemoHandoverPreview';
import type { HandoverPreview } from '@/lib/memo/handover-package';

const runtime = vi.hoisted(() => ({ cursor: 0, hooks: new Map<number, unknown>(), effects: [] as Array<() => void | (() => void)> }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial); return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (value: unknown) => unknown)(runtime.hooks.get(key)) : update)]; },
    useRef: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial }); return runtime.hooks.get(key); },
    useEffect: (effect: () => void | (() => void), deps: unknown[]) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) { runtime.hooks.set(key, deps); runtime.effects.push(effect); } },
  };
});
type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); if (!isValidElement<Record<string, unknown>>(node)) return []; return [node, ...elements(node.props.children as ReactNode)]; }
function text(node: ReactNode): string { if (Array.isArray(node)) return node.map(text).join(' '); if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children); return typeof node === 'string' ? node : ''; }
const download = vi.fn();
function render(overrides = {}) { runtime.cursor = 0; const keyed = MemoHandoverPreview({ memoId: 'memo-a', saved: true, onDownload: download, ...overrides }); return (keyed.type as (props: typeof keyed.props) => ReactNode)(keyed.props); }
function button(tree: ReactNode, label: string) { const node = elements(tree).find((item) => item.type === 'button' && text(item).includes(label)); expect(node).toBeDefined(); return node!; }
async function click(tree: ReactNode, label: string) { (button(tree, label).props.onClick as () => void)(); for (let i = 0; i < 5; i++) await Promise.resolve(); }
function response(body: unknown, status = 200) { return { ok: status >= 200 && status < 300, status, json: async () => body } as Response; }
const preview: HandoverPreview = { schemaVersion: 1, previewHash: `sha256:${'a'.repeat(64)}`, mode: 'draft', memoId: 'memo-a', memoVersionId: 'v1', bodyHash: `sha256:${'b'.repeat(64)}`,
  capsule: { capsuleId: 'capsule-a', requestedVersion: 2, resolvedVersion: 2, status: 'pinned', label: 'Policy context' }, files: ['memo.md', 'manifest.json'], included: ['Exact saved memo and capsule'], omitted: ['Source originals'], unresolvedDependencies: [{ id: 'source-1', kind: 'source', label: 'Original minutes', reason: 'Recipient needs source access' }], warnings: ['Source access is unresolved'], review: { status: 'draft', intendedUse: null, approvedAt: null, limitations: 'Human review is required before use.' } };
beforeEach(() => { runtime.cursor = 0; runtime.hooks.clear(); runtime.effects = []; download.mockReset(); vi.stubGlobal('fetch', vi.fn()); });

describe('memo handover preview', () => {
  it('previews with GET before creating a download using the exact inspected digest', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ ok: true, preview }));
    await click(render(), 'Preview handover package');
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/memos/memo-a/handover-package', expect.objectContaining({ method: 'GET', credentials: 'include' }));
    expect(vi.mocked(fetch).mock.calls[0][1]).not.toHaveProperty('body');
    expect(download).not.toHaveBeenCalled();
    const tree = render();
    const lists = elements(tree).filter((node) => typeof node.type === 'function').map((node) => (node.type as (props: Record<string, unknown>) => ReactNode)(node.props));
    expect(text(lists)).toContain('Human review is required before use.');
    expect(text(lists)).toContain('Recipient needs source access');
    expect(text(tree)).toContain('temporary bearer download access');
    vi.mocked(fetch).mockResolvedValueOnce(response({ ok: true, preview, signedUrl: 'https://storage.example.test/package' }));
    await click(tree, 'Create temporary download');
    expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string)).toEqual({ previewHash: preview.previewHash });
    expect(download).toHaveBeenCalledExactlyOnceWith('https://storage.example.test/package');
  });

  it('refreshes a stale preview without automatically repeating the write', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ preview })); await click(render(), 'Preview handover package');
    const refreshed = { ...preview, memoVersionId: 'v2', previewHash: `sha256:${'c'.repeat(64)}` };
    vi.mocked(fetch).mockResolvedValueOnce(response({ preview: refreshed, previewRequired: true }, 409));
    await click(render(), 'Create temporary download');
    expect(fetch).toHaveBeenCalledTimes(2); expect(download).not.toHaveBeenCalled();
    expect(text(render())).toContain('Review this refreshed preview');
    vi.mocked(fetch).mockResolvedValueOnce(response({ preview: refreshed, signedUrl: 'https://storage.example.test/v2' }));
    await click(render(), 'Create temporary download');
    expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as string)).toEqual({ previewHash: refreshed.previewHash });
  });

  it('states human review scope without independently approving capsule dependencies', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ preview: { ...preview, mode: 'human-reviewed', review: { ...preview.review, status: 'human-reviewed', intendedUse: 'internal-analysis' } } }));
    await click(render(), 'Preview handover package');
    expect(text(render())).toContain('Reviewed for internal analysis');
    expect(text(render())).toContain('Capsule and source dependencies are not independently approved');
  });

  it('blocks unsaved work and remounts the request state for another artifact', () => {
    expect(text(render({ saved: false }))).toContain('Save your current changes');
    expect(elements(render({ saved: false })).filter((node) => node.type === 'button')).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(MemoHandoverPreview({ memoId: 'memo-a', saved: true }).key).not.toBe(MemoHandoverPreview({ memoId: 'memo-b', saved: true }).key);
    expect(MemoHandoverPreview({ memoId: 'memo-a', saved: true }).key).not.toBe(MemoHandoverPreview({ memoId: 'memo-a', saved: false }).key);
  });

  it('cancels a pending preview on dismissal and cannot create a late download', async () => {
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise<Response>((done) => { resolve = done; }));
    const tree = render(); const cleanups = runtime.effects.splice(0).map((effect) => effect());
    await click(tree, 'Preview handover package');
    const signal = vi.mocked(fetch).mock.calls[0][1]!.signal as AbortSignal;
    for (const cleanup of cleanups) cleanup?.();
    expect(signal.aborted).toBe(true);
    resolve(response({ preview, signedUrl: 'https://storage.example.test/late' }));
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(download).not.toHaveBeenCalled();
  });
});
