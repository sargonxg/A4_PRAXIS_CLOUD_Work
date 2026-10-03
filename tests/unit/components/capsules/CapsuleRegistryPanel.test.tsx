import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CapsuleRegistryPanel, RegistryDependencyImpact } from '@/components/capsules/CapsuleRegistryPanel';

const runtime = vi.hoisted(() => ({ hooks: new Map<number, unknown>(), cursor: 0, pending: [] as Array<() => void> }));
vi.mock('react', async (importOriginal) => ({ ...await importOriginal<typeof import('react')>(),
  useState: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial); return [runtime.hooks.get(key), (value: unknown) => runtime.hooks.set(key, typeof value === 'function' ? (value as (previous: unknown) => unknown)(runtime.hooks.get(key)) : value)]; },
  useRef: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial }); return runtime.hooks.get(key); },
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => { const key = runtime.cursor++; const previous = runtime.hooks.get(key) as { deps: unknown[]; cleanup?: () => void } | undefined; if (!previous || deps.some((value, index) => value !== previous.deps[index])) { previous?.cleanup?.(); const next = { deps, cleanup: undefined as (() => void) | undefined }; runtime.hooks.set(key, next); runtime.pending.push(() => { next.cleanup = effect() || undefined; }); } },
}));
type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); return isValidElement<Record<string, unknown>>(node) ? [node, ...elements(node.props.children as ReactNode)] : []; }
function text(node: ReactNode): string { if (typeof node === 'string' || typeof node === 'number') return String(node); if (Array.isArray(node)) return node.map(text).join(''); return isValidElement<Record<string, unknown>>(node) ? text(node.props.children as ReactNode) : ''; }
function render() { runtime.cursor = 0; return CapsuleRegistryPanel({ capsuleId: 'saved-1', capsuleVersion: 4 }); }
async function effects() { for (const effect of runtime.pending.splice(0)) effect(); for (let count = 0; count < 20; count++) await Promise.resolve(); }
function button(tree: ReactNode, label: string): Element { const result = elements(tree).find((node) => node.type === 'button' && text(node).includes(label)); expect(result).toBeDefined(); return result!; }
async function open() { const tree = render(); await effects(); (tree.props.onToggle as (event: unknown) => void)({ currentTarget: { open: true } }); render(); await effects(); expect(text(render())).toContain('owner/finance'); }
const installedDigest = `sha256:${'b'.repeat(64)}`;
const entry = { name: 'owner/finance', version: '2.0.0', digest: `sha256:${'a'.repeat(64)}`, profile: 'expertise', rights: { mode: 'private' }, dependencies: [], quality: { cognitiveDepth: 2 }, trust: { humanReviewedRecords: 1, proposedRecords: 2 } };
const payload = { scope: 'owner-private', entries: [entry], installations: [{ name: entry.name, version: '1.0.0', digest: installedDigest }], hasMore: false };
const response = (data: unknown) => ({ ok: true, json: async () => data }) as Response;
beforeEach(() => { runtime.hooks.clear(); runtime.pending = []; runtime.cursor = 0; });
afterEach(() => vi.unstubAllGlobals());
describe('private registry workbench actions', () => {
  it('presents named dependency consumers and review links with exact locks available separately', () => {
    const html = renderToStaticMarkup(<RegistryDependencyImpact impact={{ target: entry, directDependents: [entry], transitiveDependents: [entry], installations: [{ name: entry.name, version: entry.version, draftCapsuleId: 'installed-draft' }], capsuleConsumers: [{ capsuleId: 'consumer-1', label: 'Budget assessment', version: 4 }], complete: false, activeRunImpact: 'not-indexed' }} />);
    expect(html).toContain('Budget assessment'); expect(html).toContain('Saved capsules to review'); expect(html).toContain('Installed drafts to review');
    expect(html).toContain('scan limit'); expect(html).toContain('workflow and agent usage is not indexed'); expect(html).toContain(entry.digest);
    expect(html).toContain('starter=consumer-1'); expect(html).toContain('starter=installed-draft'); expect(html).not.toContain('<pre');
  });
  it('keeps registry loading behind a disclosure and publishes the exact saved owner snapshot', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(payload)); vi.stubGlobal('fetch', fetcher);
    render(); await effects(); expect(fetcher).not.toHaveBeenCalled();
    await open(); let tree = render();
    const label = elements(tree).find((node) => node.type === 'label' && text(node).includes('Registry name (publisher/name)'))!;
    const input = elements(label).find((node) => node.type === 'input')!;
    (input.props.onChange as (event: unknown) => void)({ target: { value: 'owner/finance' } }); tree = render();
    expect(button(tree, 'Publish saved v4').props.disabled).toBe(false);
    const form = elements(tree).find((node) => node.type === 'form')!;
    (form.props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn() }); await effects();
    expect(fetcher).toHaveBeenCalledWith('/api/context/capsule-registry', expect.objectContaining({ method: 'POST', body: JSON.stringify({ operation: 'publish', capsuleId: 'saved-1', envelopeVersion: 4, name: 'owner/finance' }) }));
    expect(text(render())).toContain('Exact snapshot published to your private registry.');
  });
  it('uses the installed artifact digest for update CAS and links the review draft', async () => {
    const fetcher = vi.fn().mockImplementation((_url: string, options?: RequestInit) => Promise.resolve(response(options?.method === 'POST' ? { installation: { draftCapsuleId: 'draft-2', reviewCardId: 'review-2' } } : payload)));
    vi.stubGlobal('fetch', fetcher); await open();
    (button(render(), 'Stage update from 1.0.0').props.onClick as () => void)(); await effects();
    expect(fetcher).toHaveBeenCalledWith('/api/context/capsule-registry', expect.objectContaining({ method: 'POST', body: JSON.stringify({ operation: 'update', name: 'owner/finance', version: '2.0.0', expectedDigest: installedDigest }) }));
    const tree = render(); const link = elements(tree).find((node) => node.props.href && text(node).includes('Open installed draft for review'))!;
    expect(link.props.href).toBe('/app/capsules?starter=draft-2&lane=inspect'); expect(button(tree, 'Deprecate with reason').props.disabled).toBe(true);
    expect(text(tree)).toContain('Installation staged for human review.');
  });
});
