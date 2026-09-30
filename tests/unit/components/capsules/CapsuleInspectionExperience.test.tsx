import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CapsuleInspectionDialog, CapsuleInspectionExperience } from '@/components/capsules/CapsuleInspectionExperience';
import { CapsuleClaimReceiptsSection } from '@/components/capsules/workbench/CapsuleClaimReceiptsSection';
import { buildCapsuleWorkbenchViewModel, type CapsuleClaimDisplay, type CapsuleWorkbenchCapsuleInput } from '@/lib/context/capsule-workbench-view-model';

const runtime = vi.hoisted(() => ({ cursor: 0, hooks: new Map<number, unknown>(), effects: [] as Array<() => void> }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial); return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key, typeof update === 'function' ? (update as (value: unknown) => unknown)(runtime.hooks.get(key)) : update)]; },
    useRef: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial }); return runtime.hooks.get(key); },
    useMemo: (compute: () => unknown) => compute(),
    useId: () => 'inspection-test',
    useEffect: (effect: () => void) => { runtime.effects.push(effect); },
  };
});
vi.mock('next/dynamic', () => ({ default: () => () => null }));
type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); if (!isValidElement<Record<string, unknown>>(node)) return []; return [node, ...elements(node.props.children as ReactNode)]; }
function text(node: ReactNode): string { if (Array.isArray(node)) return node.map(text).join(' '); if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children); return typeof node === 'string' ? node : ''; }
const capsule: CapsuleWorkbenchCapsuleInput = { capsuleId: 'capsule-a', label: 'Policy context', version: 1, scope: 'situation', purpose: 'Understand the decision', agentPermissions: { reviewRequired: true } };
const repositoryDocuments = [{ id: 'source-document', title: 'Captured minutes' }];
const initialModel = buildCapsuleWorkbenchViewModel({ capsule, repositoryDocuments });
const onUse = vi.fn();
function render() { runtime.cursor = 0; return CapsuleInspectionExperience({ capsule, model: initialModel, modelInput: { repositoryDocuments }, owned: true, authenticated: true, busy: false, onClose: vi.fn(), onUse, onSources: vi.fn(), onImprove: vi.fn(), onFork: vi.fn(), forkBusy: false, onAsk: vi.fn() }); }
beforeEach(() => { runtime.cursor = 0; runtime.hooks.clear(); runtime.effects = []; onUse.mockReset(); });
afterEach(() => vi.unstubAllGlobals());

describe('capsule inspection experience', () => {
  it('wraps Tab and Shift+Tab at dialog boundaries without focusing hidden or roving controls', () => {
    const control = (tabIndex = 0, visible = true) => ({ tabIndex, getClientRects: () => visible ? [{}] : [], closest: () => null, focus: vi.fn() });
    const first = control(); const middle = control(); const hidden = control(0, false); const roving = control(-1); const last = control();
    const dialog = { querySelectorAll: () => [first, middle, hidden, roving, last], contains: (item: unknown) => [first, middle, hidden, roving, last].includes(item as typeof first), focus: vi.fn() };
    const rendered = CapsuleInspectionDialog({ title: 'Inspection', onClose: vi.fn(), children: null });
    const onKeyDown = rendered.props.onKeyDown as (event: unknown) => void;
    const preventDefault = vi.fn();
    vi.stubGlobal('document', { activeElement: first });
    onKeyDown({ key: 'Tab', shiftKey: true, currentTarget: dialog, preventDefault });
    expect(last.focus).toHaveBeenCalledOnce(); expect(preventDefault).toHaveBeenCalledOnce();
    vi.stubGlobal('document', { activeElement: last });
    onKeyDown({ key: 'Tab', shiftKey: false, currentTarget: dialog, preventDefault });
    expect(first.focus).toHaveBeenCalledOnce(); expect(preventDefault).toHaveBeenCalledTimes(2);
    vi.stubGlobal('document', { activeElement: middle });
    onKeyDown({ key: 'Tab', shiftKey: false, currentTarget: dialog, preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(hidden.focus).not.toHaveBeenCalled(); expect(roving.focus).not.toHaveBeenCalled();
  });
  it('opens the specific graph claim in Evidence rather than dropping its identity', () => {
    const graph = elements(render()).find((node) => typeof node.props.onOpenClaim === 'function');
    expect(graph).toBeDefined(); (graph!.props.onOpenClaim as (id: string) => void)('claim-b');
    const evidence = elements(render()).find((node) => node.type === CapsuleClaimReceiptsSection);
    expect(evidence?.props.selectedClaimId).toBe('claim-b');
    expect(elements(render()).find((node) => node.props.role === 'tab' && text(node).trim() === 'Evidence')?.props['aria-selected']).toBe(true);
  });
  it('keeps original source context and refreshes technical metadata after owner review', () => {
    const advanced = elements(render()).find((node) => node.props.reviewEnabled === true);
    (advanced!.props.onReviewed as (value: CapsuleWorkbenchCapsuleInput) => void)({ ...capsule, version: 2, purpose: 'Reviewed purpose', agentPermissions: { reviewRequired: false } });
    const updated = render(); const updatedAdvanced = elements(updated).find((node) => node.props.reviewEnabled === true);
    expect((updatedAdvanced!.props.model as typeof initialModel).evidence.documentIds).toContain('source-document');
    expect(text(updated)).toContain('Reviewed purpose');
    const json = elements(updated).find((node) => node.type === 'pre');
    expect(JSON.parse(text(json))).toMatchObject({ version: 2, agentPermissions: { reviewRequired: false } });
  });
  it('separates unrecorded visibility from context scope and names Use in chat consistently', () => {
    const tree = render(); expect(text(tree).replace(/\s+/g, ' ')).toContain('Visibility: not recorded · Scope: situation');
    const use = elements(tree).find((node) => node.props['aria-label'] === 'Use in chat');
    expect(text(use)).toContain('Use in chat'); (use!.props.onClick as () => void)(); expect(onUse).toHaveBeenCalledOnce();
  });
  it('opens, focuses and highlights the exact receipt selected from the map', () => {
    const claim = { claimId: 'claim-b', text: 'Specific captured claim', support: 'partial', validFrom: null, validUntil: null, asOf: null, causalLinks: {}, sourceIds: [], confidence: null, reviewState: 'proposed', receipts: [] } as CapsuleClaimDisplay;
    const tree = (CapsuleClaimReceiptsSection as unknown as { type: (props: unknown) => ReactNode }).type({ claims: [claim], selectedClaimId: 'claim-b' });
    const collection = elements(tree).find((node) => node.props['data-testid'] === 'capsule-claim-receipts');
    const focus = vi.fn(); const scrollIntoView = vi.fn(); const selected = { dataset: { claimId: 'claim-b' }, open: false, querySelector: () => ({ focus }), scrollIntoView };
    (collection!.props.ref as { current: unknown }).current = { querySelectorAll: () => [selected] };
    for (const effect of runtime.effects) effect();
    expect(selected.open).toBe(true); expect(focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true }); expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(elements(tree).find((node) => node.props['data-claim-id'] === 'claim-b')?.props.className).toContain('border-emerald-600');
  });
});
