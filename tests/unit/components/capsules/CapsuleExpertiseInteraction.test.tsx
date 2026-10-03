import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { CapsuleExpertisePanel } from '@/components/capsules/CapsuleExpertisePanel';

const runtime = vi.hoisted(() => ({ hooks: new Map<number, unknown>(), cursor: 0, pending: [] as Array<() => void> }));
vi.mock('react', async (importOriginal) => ({ ...await importOriginal<typeof import('react')>(),
  useState: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial); return [runtime.hooks.get(key), (value: unknown) => runtime.hooks.set(key, typeof value === 'function' ? (value as (previous: unknown) => unknown)(runtime.hooks.get(key)) : value)]; },
  useRef: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial }); return runtime.hooks.get(key); },
  useCallback: (callback: unknown, deps: unknown[]) => { const key = runtime.cursor++; const previous = runtime.hooks.get(key) as { deps: unknown[]; callback: unknown } | undefined; if (!previous || deps.some((value, index) => value !== previous.deps[index])) runtime.hooks.set(key, { deps, callback }); return (runtime.hooks.get(key) as { callback: unknown }).callback; },
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => { const key = runtime.cursor++; const previous = runtime.hooks.get(key) as { deps: unknown[]; cleanup?: () => void } | undefined; if (!previous || deps.some((value, index) => value !== previous.deps[index])) { previous?.cleanup?.(); const next = { deps, cleanup: undefined as (() => void) | undefined }; runtime.hooks.set(key, next); runtime.pending.push(() => { next.cleanup = effect() || undefined; }); } },
}));
type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); return isValidElement<Record<string, unknown>>(node) ? [node, ...elements(node.props.children as ReactNode)] : []; }
function text(node: ReactNode): string { if (typeof node === 'string' || typeof node === 'number') return String(node); if (Array.isArray(node)) return node.map(text).join(' '); return isValidElement<Record<string, unknown>>(node) ? text(node.props.children as ReactNode) : ''; }
function render(capsuleId = 'owned', onReviewed = vi.fn()) { runtime.cursor = 0; return CapsuleExpertisePanel({ capsuleId, onReviewed }); }
async function effects() { for (const effect of runtime.pending.splice(0)) effect(); for (let count = 0; count < 20; count++) await Promise.resolve(); }
function button(tree: ReactNode, label: string) { const result = elements(tree).find((node) => node.type === 'button' && text(node).includes(label)); expect(result).toBeDefined(); return result!; }
const knowledge = { id: 'proposed', kind: 'distinction', label: 'Authorization is not expenditure', scope: ['budget'], reviewState: 'proposed', conceptA: 'authorization', conceptB: 'expenditure', explanation: 'Check payment records.', whyItMatters: 'Avoid unsupported expenditure claims.', commonMistake: 'Conflating the stages.', provenance: { generatedBy: { type: 'human', id: 'owner', at: '2026-10-03T00:00:00Z' }, sourceRefs: [] } };
const card = { reviewCardId: 'review', title: 'Budget distinction', state: 'proposed', cognitiveKnowledgeIds: ['proposed'], proposedEnvelopePatch: { cognition: { knowledge: [knowledge] } } };
const page = (capsuleId = 'owned', cards: unknown[] = [], cursor: string | null = null) => ({ capsuleId, cognition: { knowledge: [] }, reviewCards: cards, nextCursor: cursor, hasMore: Boolean(cursor), quality: { dimensions: { humanReviewed: 0, evidenceSpans: 0 }, interpretation: 'Structure does not establish truth.' }, validation: [] });
const response = (data: unknown) => ({ ok: true, json: async () => data }) as Response;
async function open(id = 'owned') { const tree = render(id); await effects(); (tree.props.onToggle as (event: unknown) => void)({ currentTarget: { open: true } }); render(id); await effects(); }

beforeEach(() => { runtime.hooks.clear(); runtime.pending = []; runtime.cursor = 0; vi.stubGlobal('fetch', vi.fn()); });
describe('expertise capture and review interactions', () => {
  it('requires explicit review of every interview item before group acceptance', async () => {
    const group = { ...card, cognitiveKnowledgeIds: ['proposed', 'second'], proposedEnvelopePatch: { cognition: { knowledge: [knowledge, { ...knowledge, id: 'second', label: 'Second interview lesson' }] } } };
    vi.mocked(fetch).mockResolvedValueOnce(response(page('owned', [group]))).mockResolvedValueOnce(response({ capsule: { capsuleId: 'owned', version: 2 }, card: { ...group, state: 'applied' } })).mockResolvedValueOnce(response(page()));
    await open(); let tree = render();
    const reason = elements(tree).find((node) => node.props.name === 'review-reason')!;
    (reason.props.onChange as (value: string) => void)('Reviewed both proposed lessons.'); tree = render();
    expect(button(tree, 'Accept all interview items').props.disabled).toBe(true);
    (button(tree, 'Accept all interview items').props.onClick as () => void)(); await effects();
    expect(fetch).toHaveBeenCalledTimes(1);
    const checkbox = elements(tree).find((node) => node.type === 'input' && node.props.type === 'checkbox')!;
    (checkbox.props.onChange as (event: unknown) => void)({ target: { checked: true } }); tree = render();
    expect(button(tree, 'Accept all interview items').props.disabled).toBe(false);
    (button(tree, 'Accept all interview items').props.onClick as () => void)(); await effects();
    expect(JSON.parse((vi.mocked(fetch).mock.calls[1][1] as RequestInit).body as string)).toMatchObject({ decision: 'accept', reviewCardId: 'review' });
  });
  it('captures a correction as a proposal without asserting acceptance', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(page())).mockResolvedValueOnce(response({ card })).mockResolvedValueOnce(response(page('owned', [card])));
    await open(); let tree = render();
    (button(tree, 'Save lesson from correction').props.onClick as () => void)(); tree = render();
    const form = elements(tree).find((node) => node.type === 'form')!;
    const values = { label: 'Authorization is not expenditure', scope: 'budget, funding', body: 'Check actual payment records.', conceptA: 'authorization', conceptB: 'expenditure', sources: '', checks: '', rationale: '' };
    const reset = vi.fn();
    vi.stubGlobal('FormData', class { get(name: string) { return values[name as keyof typeof values] ?? ''; } });
    (form.props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn(), currentTarget: { reset } }); await effects();
    const payload = JSON.parse((vi.mocked(fetch).mock.calls[1][1] as RequestInit).body as string);
    expect(payload).toMatchObject({ kind: 'distinction', terms: ['authorization', 'expenditure'], scope: ['budget', 'funding'] });
    expect(payload).not.toHaveProperty('reviewState'); expect(payload).not.toHaveProperty('provenance');
    expect(reset).toHaveBeenCalled(); expect(text(render())).toContain('Expertise proposed for review');
  });
  it('keeps need-evidence proposed and refreshes the saved review record', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(page('owned', [card]))).mockResolvedValueOnce(response({ capsule: { capsuleId: 'owned', version: 1 }, card: { ...card, state: 'owner_review' } })).mockResolvedValueOnce(response(page('owned', [{ ...card, state: 'owner_review' }])));
    await open(); let tree = render();
    const reason = elements(tree).find((node) => node.props.name === 'review-reason')!;
    (reason.props.onChange as (value: string) => void)('Check disbursement records.'); tree = render();
    (button(tree, 'Need evidence').props.onClick as () => void)(); await effects();
    expect(JSON.parse((vi.mocked(fetch).mock.calls[1][1] as RequestInit).body as string)).toEqual({ reviewCardId: 'review', decision: 'need_evidence', reason: 'Check disbursement records.' });
    expect(text(render())).toContain('Expertise remains proposed.');
  });
  it('ignores a late response after opening a different capsule', async () => {
    let resolveOld!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveOld = resolve; })).mockResolvedValueOnce(response(page('other', [{ ...card, title: 'Other capsule expertise' }])));
    await open(); render('other'); await effects();
    resolveOld(response(page('owned', [{ ...card, title: 'Old capsule expertise' }]))); await effects();
    expect(text(render('other'))).toContain('Other capsule expertise'); expect(text(render('other'))).not.toContain('Old capsule expertise');
  });
  it('loads later proposal pages without duplicates', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(page('owned', [card], 'next'))).mockResolvedValueOnce(response(page('owned', [card, { ...card, reviewCardId: 'second', title: 'Second distinction' }])));
    await open(); (button(render(), 'Load more expertise proposals').props.onClick as () => void)(); await effects();
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/api/context/capsules/owned/cognition?cursor=next');
    expect(text(render())).toContain('Second distinction');
    expect(elements(render()).filter((node) => node.type === 'article')).toHaveLength(2);
  });
});
