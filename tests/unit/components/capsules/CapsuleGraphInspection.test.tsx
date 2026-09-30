import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CapsuleGraphViewer, { type CapsuleGraphViewerProps } from '@/components/capsules/viewers/CapsuleGraphViewer';
import { CapsuleGraphWhyPanel } from '@/components/capsules/viewers/CapsuleGraphWhyPanel';

const hooks = vi.hoisted(() => ({ shallow: false, cursor: 0, values: new Map<number, unknown>(), effects: [] as Array<() => unknown> }));
vi.mock('react', async (original) => {
  const actual = await original<typeof import('react')>();
  return { ...actual,
    useState: (initial: unknown) => { if (!hooks.shallow) return actual.useState(initial); const key = hooks.cursor++; if (!hooks.values.has(key)) hooks.values.set(key, typeof initial === 'function' ? (initial as () => unknown)() : initial); return [hooks.values.get(key), (update: unknown) => hooks.values.set(key, typeof update === 'function' ? (update as (value: unknown) => unknown)(hooks.values.get(key)) : update)]; },
    useMemo: (compute: () => unknown, deps: unknown[]) => hooks.shallow ? compute() : actual.useMemo(compute, deps),
    useCallback: (fn: unknown, deps: unknown[]) => hooks.shallow ? fn : actual.useCallback(fn as () => void, deps),
    useRef: (initial: unknown) => { if (!hooks.shallow) return actual.useRef(initial); const key = hooks.cursor++; if (!hooks.values.has(key)) hooks.values.set(key, { current: initial }); return hooks.values.get(key); },
    useEffect: (effect: () => void, deps: unknown[]) => { if (!hooks.shallow) actual.useEffect(effect, deps); else hooks.effects.push(effect); },
  };
});
vi.mock('next/dynamic', () => ({ default: () => () => null }));
type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); if (!isValidElement<Record<string, unknown>>(node)) return []; return [node, ...elements(node.props.children as ReactNode)]; }
function text(node: ReactNode): string { if (typeof node === 'string' || typeof node === 'number') return String(node); if (Array.isArray(node)) return node.map(text).join(''); return isValidElement<Record<string, unknown>>(node) ? text(node.props.children as ReactNode) : ''; }
function tree(props: CapsuleGraphViewerProps) { hooks.shallow = true; hooks.cursor = 0; return CapsuleGraphViewer(props); }
function html(node: ReactNode) { hooks.shallow = false; return renderToStaticMarkup(node); }
function click(node: ReactNode, name: string) { const button = elements(node).find((item) => item.type === 'button' && text(item.props.children as ReactNode).includes(name)); expect(button).toBeDefined(); (button!.props.onClick as () => void)(); }
const graph: CapsuleGraphViewerProps = {
  compact: true, editable: false,
  nodes: [{ id: 'actor-1', label: 'Commission', type: 'core', reviewState: 'canonical' }, { id: 'claim-1', label: 'Budget approved', type: 'claim', reviewState: 'proposed', confidence: null, linkedClaimIds: ['claim-1'] }],
  edges: [{ id: 'edge-1', source: 'actor-1', target: 'claim-1', label: 'approved allocation', reviewState: 'proposed', confidence: 0.37, confidenceKind: 'INFERRED', sourceReceiptIds: ['source-1'] }],
  claims: [{ claimId: 'claim-1', text: 'Budget approved', support: 'partial', validFrom: null, validUntil: null, asOf: null, causalLinks: {}, sourceIds: ['source-1'], confidence: null, reviewState: 'proposed', receipts: [{ sourceId: 'source-1', publisher: 'Minutes', url: 'https://example.test/source', date: '2026-09-01', reliabilityTier: null, snippet: 'Allocation approved; spending has not been confirmed.', page: 4, charOffset: 0, embedding: null, confidence: null, stance: null }] }],
};
beforeEach(() => { hooks.shallow = false; hooks.cursor = 0; hooks.values.clear(); hooks.effects = []; });
afterEach(() => vi.unstubAllGlobals());

describe('capsule graph evidence inspection', () => {
  it('provides native relationship selection with the exact source and recorded metadata', () => {
    click(tree(graph), 'Relationships');
    const relationships = tree(graph);
    const relationship = elements(relationships).find((item) => item.type === 'button' && text(item.props.children as ReactNode).includes('Commission → approved allocation → Budget approved'));
    expect(relationship?.props.type).toBe('button');
    (relationship!.props.onClick as () => void)();
    const markup = html(tree(graph));
    expect(markup).toContain('Allocation approved; spending has not been confirmed.');
    expect(markup).toContain('37% confidence');
    expect(markup).toContain('INFERRED');
    expect(markup).toContain('Review: proposed');
    expect(markup).toContain('Page 4');
    expect(markup).toContain('No rationale recorded');
    expect(markup).not.toContain('extracted directly from source');
  });
  it('resolves a selected relationship against the current version after a review update', () => {
    click(tree(graph), 'Relationships'); click(tree(graph), 'Commission →');
    const updated = { ...graph, edges: graph.edges.map((edge) => ({ ...edge, confidence: 0.81, reviewState: 'reviewed', rationale: 'Checked against the original minutes.' })) };
    const markup = html(tree(updated));
    expect(markup).toContain('81% confidence');
    expect(markup).toContain('Review: reviewed');
    expect(markup).toContain('Checked against the original minutes.');
    expect(markup).not.toContain('37% confidence');
  });
  it('keeps absent confidence and evidence absent rather than certifying extraction', () => {
    const markup = renderToStaticMarkup(<CapsuleGraphWhyPanel selection={{ kind: 'node', id: 'node-1', label: 'Unassessed claim', acoType: 'Claim', reviewState: 'proposed' }} contradictions={[]} />);
    expect(markup).toContain('confidence not set');
    expect(markup).toContain('No source excerpt is recorded');
    expect(markup).toContain('No rationale recorded');
    expect(markup).not.toContain('extracted directly');
  });
  it('renders every recorded relationship independently even when the spatial view deduplicates links', () => {
    const expanded = { ...graph, edges: [...graph.edges, { ...graph.edges[0], id: 'edge-2', label: 'contested allocation', confidence: null }] };
    click(tree(expanded), 'Relationships');
    const markup = html(tree(expanded));
    expect(markup).toContain('approved allocation'); expect(markup).toContain('contested allocation');
  });
  it('expands a grouped map item selected through the complete keyboard list', () => {
    const expanded = { ...graph, nodes: Array.from({ length: 170 }, (_, index) => ({ id: `node-${index}`, label: `Recorded claim ${index}`, type: 'claim', reviewState: 'proposed' })) };
    let view = tree(expanded); click(view, 'Show more items'); view = tree(expanded); click(view, 'Show more items'); view = tree(expanded); click(view, 'Show more items');
    click(tree(expanded), 'Recorded claim 169');
    const canvas = elements(tree(expanded)).find((item) => Boolean(item.props.graphData));
    expect((canvas!.props.graphData as { nodes: Array<{ id: string }> }).nodes.some((item) => item.id === 'node-169')).toBe(true);
  });
  it('starts with spaced deterministic positions instead of waiting for a compact force simulation', () => {
    const expanded = { ...graph, nodes: [{ id: 'capsule', label: 'Policy context', type: 'capsule', reviewState: 'canonical' }, ...Array.from({ length: 22 }, (_, index) => ({ id: `item-${index}`, label: `Recorded item ${index}`, type: index < 8 ? 'core' : 'claim', reviewState: 'proposed' }))] };
    const projection = () => elements(tree(expanded)).find((item) => Boolean(item.props.graphData))!;
    const first = projection(); const initial = (first.props.graphData as { nodes: Array<{ id: string; x: number; y: number; fx: number; fy: number }> }).nodes;
    expect(new Set(initial.map((node) => `${node.x}:${node.y}`)).size).toBe(initial.length);
    expect(Math.max(...initial.map((node) => node.x)) - Math.min(...initial.map((node) => node.x))).toBeGreaterThan(400);
    expect(Math.max(...initial.map((node) => node.y)) - Math.min(...initial.map((node) => node.y))).toBeGreaterThan(200);
    expect(initial.every((node) => Number.isFinite(node.x) && node.fx === node.x && node.fy === node.y)).toBe(true);
    expect((projection().props.graphData as { nodes: typeof initial }).nodes.map(({ id, x, y }) => ({ id, x, y }))).toEqual(initial.map(({ id, x, y }) => ({ id, x, y })));
    expect(first.props.cooldownTicks).toBe(1);
  });
  it('fits once after measured geometry initializes and preserves later user navigation', () => {
    let resize!: (entries: Array<{ contentRect: { width: number } }>) => void;
    vi.stubGlobal('ResizeObserver', class { constructor(callback: typeof resize) { resize = callback; } observe() {} disconnect() {} });
    let view = tree(graph);
    const canvas = () => elements(view).find((item) => Boolean(item.props.graphData))!;
    const container = elements(view).find((item) => item.props['aria-label'] === 'Interactive projection of recorded context')!;
    const zoomToFit = vi.fn();
    (canvas().props.ref as { current: unknown }).current = { zoomToFit };
    (container.props.ref as { current: unknown }).current = {};
    (canvas().props.onEngineStop as () => void)();
    expect(zoomToFit).not.toHaveBeenCalled();
    for (const effect of hooks.effects.splice(0)) effect();
    resize([{ contentRect: { width: 840 } }]);
    expect(zoomToFit).not.toHaveBeenCalled();
    view = tree(graph);
    expect(canvas().props.width).toBe(840);
    (canvas().props.onEngineStop as () => void)();
    expect(zoomToFit).toHaveBeenCalledExactlyOnceWith(0, 52);
    click(view, 'Relationships'); view = tree(graph); (canvas().props.onEngineStop as () => void)();
    resize([{ contentRect: { width: 780 } }]); view = tree(graph); (canvas().props.onEngineStop as () => void)();
    expect(zoomToFit).toHaveBeenCalledOnce();
  });
  it('also fits when the first dimension measurement arrives after the engine has stopped', () => {
    let resize!: (entries: Array<{ contentRect: { width: number } }>) => void;
    let frame!: () => void;
    vi.stubGlobal('ResizeObserver', class { constructor(callback: typeof resize) { resize = callback; } observe() {} disconnect() {} });
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { frame = callback; return 1; });
    const view = tree(graph); const canvas = elements(view).find((item) => Boolean(item.props.graphData))!;
    const container = elements(view).find((item) => item.props['aria-label'] === 'Interactive projection of recorded context')!;
    const zoomToFit = vi.fn();
    (canvas.props.ref as { current: unknown }).current = { zoomToFit };
    (container.props.ref as { current: unknown }).current = {};
    (canvas.props.onEngineStop as () => void)();
    for (const effect of hooks.effects.splice(0)) effect();
    resize([{ contentRect: { width: 600 } }]);
    expect(zoomToFit).not.toHaveBeenCalled(); frame();
    expect(zoomToFit).toHaveBeenCalledExactlyOnceWith(0, 52);
  });
  it('keeps default map captions sparse and reveals the full selected or hovered label', () => {
    const expanded = { ...graph, nodes: [{ id: 'capsule', label: 'Policy context', type: 'capsule', reviewState: 'canonical' }, ...Array.from({ length: 20 }, (_, index) => ({ id: `claim-${index}`, label: `Captured evidence claim number ${index}`, type: 'claim', reviewState: 'proposed' }))] };
    let canvas = elements(tree(expanded)).find((item) => Boolean(item.props.graphData))!;
    const ctx = { save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), arc: vi.fn(), rect: vi.fn(), fill: vi.fn(), stroke: vi.fn(), setLineDash: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), measureText: (label: string) => ({ width: label.length * 6 }) };
    const paint = canvas.props.nodeCanvasObject as (node: unknown, context: unknown, scale: number) => void;
    const projected = (canvas.props.graphData as { nodes: Array<{ id: string; label: string }> }).nodes;
    projected.forEach((node) => paint(node, ctx, 1));
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
    (canvas.props.onNodeHover as (node: unknown) => void)(projected.find((node) => node.id === 'claim-19'));
    canvas = elements(tree(expanded)).find((item) => Boolean(item.props.graphData))!;
    ctx.fillText.mockClear();
    (canvas.props.nodeCanvasObject as typeof paint)((canvas.props.graphData as { nodes: typeof projected }).nodes.find((node) => node.id === 'claim-19'), ctx, 1);
    expect(ctx.fillText.mock.calls.map((call) => call[0]).join(' ')).toContain('Captured evidence claim number 19');
    expect((canvas.props.nodeLabel as (node: unknown) => string)(projected[1])).toBe(projected[1].label);
  });
});
