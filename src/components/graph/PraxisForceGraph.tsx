'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { GitBranch, ShieldCheck } from 'lucide-react';
import { GraphEntityPanel } from '@/components/graph/GraphEntityPanel';
import type { WorkbenchGraph } from '@/lib/graph/workbench-case-graph';
import { toForceGraphData } from '@/lib/graph/force-graph-adapter';
import { cn } from '@/lib/utils/cn';

type ForceGraphComponent = ComponentType<Record<string, unknown>>;

export function PraxisForceGraph({ graph, className }: { graph: WorkbenchGraph; className?: string }) {
  const [ForceGraph2D, setForceGraph2D] = useState<ForceGraphComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const [sizeByCentrality, setSizeByCentrality] = useState(false);
  const [selectedId, setSelectedId] = useState(graph.nodes[0]?.id ?? 'case');
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960);
  const data = useMemo(() => toForceGraphData(graph), [graph]);
  const selected = graph.nodes.find((node) => node.id === selectedId) ?? graph.nodes[0] ?? null;

  useEffect(() => {
    let mounted = true;
    import('react-force-graph-2d')
      .then((module) => {
        if (mounted) setForceGraph2D(() => module.default as ForceGraphComponent);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const resize = () => setWidth(Math.max(320, Math.floor(frame.clientWidth)));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <section data-testid="praxis-force-graph" className={cn('rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <GitBranch className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">Force Graph</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Browser-only force layout for relationship exploration. It is lazy-loaded so the standard workbench route stays lean.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {Math.round(graph.provenanceCoverage * 100)}% provenance
        </div>
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={sizeByCentrality}
            onChange={(event) => setSizeByCentrality(event.target.checked)}
            className="h-3.5 w-3.5 accent-gold-600"
          />
          Size by centrality
        </label>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div ref={frameRef} className="h-[520px] overflow-hidden rounded-md border border-slate-200 bg-slate-950" role="img" aria-label="Interactive PRAXIS force graph">
          {ForceGraph2D && !failed ? (
            <ForceGraph2D
              graphData={data}
              width={width}
              height={520}
              backgroundColor="#020617"
              nodeRelSize={5}
              nodeVal={(node: { val?: number; centralityVal?: number }) => (sizeByCentrality ? node.centralityVal ?? node.val ?? 4 : node.val ?? 4)}
              nodeLabel={(node: { label?: string; description?: string }) => `${node.label ?? 'Node'}: ${node.description ?? ''}`}
              onNodeClick={(node: { id?: string }) => {
                if (node.id) setSelectedId(node.id);
              }}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkColor={() => 'rgba(203, 213, 225, 0.55)'}
              linkWidth={(link: { type?: string }) => (link.type === 'supports' ? 2 : 1)}
              nodeCanvasObject={(node: { id?: string; x?: number; y?: number; label?: string; type?: string; color?: string; val?: number; centralityVal?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.label ?? '';
                const fontSize = Math.max(9, 13 / globalScale);
                const active = node.id === selectedId;
                const radius = sizeByCentrality ? Math.max(5, Math.min(16, node.centralityVal ?? node.val ?? 6)) : node.type === 'case' ? 9 : 6;
                ctx.beginPath();
                ctx.arc(node.x ?? 0, node.y ?? 0, active ? radius + 4 : radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = active ? 'rgba(212, 175, 55, 0.34)' : node.color ?? '#d4af37';
                ctx.fill();
                ctx.lineWidth = active ? 2.4 : 1.4;
                ctx.strokeStyle = active ? '#FACC15' : 'rgba(255,255,255,0.78)';
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(node.x ?? 0, node.y ?? 0, radius * 0.62, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.color ?? '#d4af37';
                ctx.fill();
                if (globalScale > 0.75) {
                  ctx.font = `${fontSize}px Inter, sans-serif`;
                  ctx.fillStyle = '#E2E8F0';
                  ctx.textAlign = 'center';
                  ctx.fillText(label.length > 22 ? `${label.slice(0, 19)}...` : label, node.x ?? 0, (node.y ?? 0) + radius + fontSize + 3);
                }
              }}
            />
          ) : (
            <ForceFallback graph={graph} failed={failed} />
          )}
        </div>
        <GraphEntityPanel node={selected} compact />
      </div>
    </section>
  );
}

function ForceFallback({ graph, failed }: { graph: WorkbenchGraph; failed: boolean }) {
  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold text-white">{failed ? 'Force renderer unavailable' : 'Loading force renderer'}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
          {failed
            ? 'The canonical SVG view remains available and uses the same WorkbenchGraph data.'
            : `${graph.nodes.length} nodes and ${graph.edges.length} edges are being prepared.`}
        </p>
      </div>
    </div>
  );
}
