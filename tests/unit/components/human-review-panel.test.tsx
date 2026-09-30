import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HumanReviewPanel } from '@/components/memo/HumanReviewPanel';

const runtime = vi.hoisted(() => ({ cursor: 0, hooks: new Map<number, unknown>(), pending: [] as Array<() => void>, hash: `sha256:${'a'.repeat(64)}` }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => {
      const key = runtime.cursor++;
      if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial);
      return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (value: unknown) => unknown)(runtime.hooks.get(key)) : update)];
    },
    useEffect: (effect: () => void, deps: unknown[]) => {
      const key = runtime.cursor++; const previous = runtime.hooks.get(key) as unknown[] | undefined;
      if (!previous || deps.some((value, i) => value !== previous[i])) { runtime.hooks.set(key, deps); runtime.pending.push(effect); }
    },
  };
});
vi.mock('@/lib/memo/output-review', () => ({ memoOutputBodyHash: vi.fn(async () => runtime.hash) }));

type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join(' ');
  if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children);
  return typeof node === 'string' ? node : '';
}
function find(tree: ReactNode, predicate: (node: Element) => boolean) { const node = elements(tree).find(predicate); expect(node).toBeDefined(); return node!; }
const approved = vi.fn();
const props = () => ({ memoId: 'memo-a', currentVersionId: 'v1', body: 'Saved body', savedBody: 'Saved body', humanApproval: null, onApproved: approved });
function render(overrides = {}) { runtime.cursor = 0; return HumanReviewPanel({ ...props(), ...overrides }); }
async function ready() { render(); for (const effect of runtime.pending.splice(0)) effect(); await Promise.resolve(); return render(); }
function change(node: Element, target: unknown) { (node.props.onChange as (event: unknown) => void)({ target }); }
function approveButton(tree: ReactNode) { return find(tree, (node) => node.type === 'button' && text(node).includes('Approve saved version')); }
beforeEach(() => { runtime.hooks.clear(); runtime.pending = []; runtime.cursor = 0; approved.mockReset(); vi.stubGlobal('fetch', vi.fn()); });

describe('saved-version human review panel', () => {
  it('requires all three acknowledgements and sends the exact saved version, digest and intended use', async () => {
    let tree = await ready();
    expect(approveButton(tree).props.disabled).toBe(true);
    change(find(tree, (node) => node.props['aria-label'] === 'Intended use'), { value: 'external-sharing' });
    change(find(tree, (node) => node.props['aria-label'] === 'Limitations and caveats'), { value: 'Public sources only; implementation remains unverified.' });
    for (const checkbox of elements(tree).filter((node) => node.props.type === 'checkbox')) change(checkbox, { checked: true });
    tree = render(); expect(approveButton(tree).props.disabled).toBe(false);
    const payload = { success: true, memo: { id: 'memo-a', currentVersionId: 'v1' }, versions: [] };
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => payload } as Response);
    await (approveButton(tree).props.onClick as () => Promise<void>)();
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/memos/memo-a/review');
    expect(JSON.parse(request!.body as string)).toEqual({ versionId: 'v1', bodyHash: runtime.hash, intendedUse: 'external-sharing', limitations: 'Public sources only; implementation remains unverified.', sourcesReviewed: true, assumptionsReviewed: true, limitationsReviewed: true });
    expect(approved).toHaveBeenCalledExactlyOnceWith(payload);
  });
  it('cannot approve an unsaved or edited body even if a prior approval exists', async () => {
    await ready();
    const approval = { version: 1, memoId: 'memo-a', versionId: 'v1', reviewerUid: 'owner', bodyHash: runtime.hash, approvedAt: '2026-09-30T12:00:00Z', intendedUse: 'internal-analysis', limitations: '', attestation: 'Human review' };
    const tree = render({ body: 'Edited body', humanApproval: approval });
    expect(text(tree)).toContain('Save your changes');
    expect(approveButton(tree).props.disabled).toBe(true);
    expect(elements(tree).filter((node) => node.type === 'button' && text(node).includes('Download reviewed')).every((node) => node.props.disabled)).toBe(true);
    expect(approveButton(render({ currentVersionId: null, savedBody: null })).props.disabled).toBe(true);
  });
  it('labels internal approval precisely and sends versionId to the server export route', async () => {
    await ready();
    const approval = { version: 1, memoId: 'memo-a', versionId: 'v1', reviewerUid: 'owner', bodyHash: runtime.hash, approvedAt: '2026-09-30T12:00:00Z', intendedUse: 'internal-analysis', limitations: '', attestation: 'Human review' };
    const tree = render({ humanApproval: approval });
    expect(text(tree)).toContain('Reviewed for internal analysis');
    expect(text(tree)).toContain('does not approve external sharing or publication');
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'Saved version changed. Reload it.' }) } as Response);
    await (find(tree, (node) => node.type === 'button' && text(node).includes('Download reviewed Markdown')).props.onClick as () => Promise<void>)();
    expect(fetch).toHaveBeenCalledWith('/api/memos/memo-a/export?format=md&versionId=v1', expect.objectContaining({ credentials: 'include' }));
    expect(text(render({ humanApproval: approval }))).toContain('Saved version changed');
  });
});
