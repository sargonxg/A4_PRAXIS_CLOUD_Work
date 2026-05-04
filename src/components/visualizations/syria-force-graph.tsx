'use client';

/**
 * D3 force-directed graph of the Syria post-Assad ACO graph.
 *
 * Renders the seeded SYRIA_DEMO_CANONICAL_GRAPH (actors, claims, interests,
 * constraints, leverage, commitments, events, narratives) as an interactive
 * force layout. Color encodes ACO entity type; node size scales with degree;
 * click selects a node and surfaces its metadata in the side panel.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SYRIA_DEMO_CANONICAL_GRAPH } from '@/lib/constants/syria-demo-case';
import { ENTITY_COLORS } from '@/lib/constants/entity-colors';
import { cn } from '@/lib/utils/cn';

interface RawNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, unknown>;
}

interface RawEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight?: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  type: string;
  label: string;
  degree: number;
  color: string;
  raw: RawNode;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  weight: number;
  label?: string;
  raw: RawEdge;
}

const FALLBACK_COLOR = '#94a3b8';

const TYPE_LABEL: Record<string, string> = {
  actor: 'Actor',
  claim: 'Claim',
  interest: 'Interest',
  constraint: 'Constraint',
  leverage: 'Leverage',
  commitment: 'Commitment',
  event: 'Event',
  narrative: 'Narrative',
};

interface SyriaForceGraphProps {
  width?: number;
  height?: number;
  className?: string;
}

export function SyriaForceGraph({ width = 720, height = 480, className }: SyriaForceGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selected, setSelected] = useState<SimNode | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(() => new Set(Object.keys(TYPE_LABEL)));

  const { nodes: rawNodes, edges: rawEdges } = SYRIA_DEMO_CANONICAL_GRAPH;

  const data = useMemo(() => {
    const degree = new Map<string, number>();
    rawEdges.forEach((e) => {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    });
    const nodes: SimNode[] = (rawNodes as RawNode[])
      .filter((n) => activeTypes.has(n.type))
      .map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        degree: degree.get(n.id) ?? 1,
        color: (ENTITY_COLORS as Record<string, string>)[n.type] ?? FALLBACK_COLOR,
        raw: n,
      }));
    const ids = new Set(nodes.map((n) => n.id));
    const links: SimLink[] = (rawEdges as RawEdge[])
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        weight: e.weight ?? 0.5,
        label: e.label,
        raw: e,
      }));
    return { nodes, links };
  }, [rawNodes, rawEdges, activeTypes]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3
      .forceSimulation<SimNode>(data.nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(data.links)
          .id((d) => d.id)
          .distance((d) => 110 - 30 * (d.weight || 0.5))
          .strength((d) => 0.4 + 0.4 * (d.weight || 0.5)),
      )
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<SimNode>().radius((d) => 8 + Math.sqrt(d.degree) * 4),
      );

    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'syria-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 16)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    const g = svg.append('g');

    const link = g
      .append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.7)
      .selectAll<SVGLineElement, SimLink>('line')
      .data(data.links)
      .join('line')
      .attr('stroke-width', (d) => 0.6 + d.weight * 1.6)
      .attr('marker-end', 'url(#syria-arrow)');

    const node = g
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.4)
      .selectAll<SVGCircleElement, SimNode>('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d) => 5 + Math.sqrt(d.degree) * 3.2)
      .attr('fill', (d) => d.color)
      .style('cursor', 'pointer')
      .on('click', (_, d) => setSelected(d))
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    node.append('title').text((d) => `${TYPE_LABEL[d.type] ?? d.type}: ${d.label}`);

    const label = g
      .append('g')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', 9)
      .attr('fill', '#1e293b')
      .attr('pointer-events', 'none')
      .selectAll<SVGTextElement, SimNode>('text')
      .data(data.nodes)
      .join('text')
      .text((d) => (d.label.length > 28 ? d.label.slice(0, 28) + '…' : d.label))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => 3 + Math.sqrt(d.degree) * 3.2 + 8);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
      label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => g.attr('transform', event.transform.toString()));
    svg.call(zoom);

    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  const counts = useMemo(() => {
    const byType = new Map<string, number>();
    (rawNodes as RawNode[]).forEach((n) => byType.set(n.type, (byType.get(n.type) ?? 0) + 1));
    return Array.from(byType.entries()).sort((a, b) => b[1] - a[1]);
  }, [rawNodes]);

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-diplomatic-blue">Live conflict graph</p>
          <h2 className="mt-1 font-serif text-lg font-semibold text-navy-900">
            Syria — Damascus-SDF agreement, humanitarian, and spillover clusters
          </h2>
          <p className="mt-1 text-[11px] text-navy-500">
            ACO v2.0 entities seeded from public UN/OCHA/UNFPA/UNHCR sources. Drag nodes; scroll to zoom; click for details.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {counts.map(([type, count]) => {
            const color = (ENTITY_COLORS as Record<string, string>)[type] ?? FALLBACK_COLOR;
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  const next = new Set(activeTypes);
                  if (next.has(type)) next.delete(type);
                  else next.add(type);
                  setActiveTypes(next);
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition',
                  active ? 'border-transparent text-white' : 'border-slate-300 text-navy-500 hover:border-navy-400',
                )}
                style={active ? { background: color } : undefined}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: active ? '#fff' : color }} />
                {TYPE_LABEL[type] ?? type}
                <span className="opacity-80">· {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-md border border-slate-200 bg-slate-50">
          <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="h-[480px] w-full" />
        </div>
        <aside className="rounded-md border border-slate-200 bg-white p-3">
          {selected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: selected.color }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
                  {TYPE_LABEL[selected.type] ?? selected.type}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-navy-900">{selected.label}</h3>
              {selected.raw.metadata?.description ? (
                <p className="text-[11px] leading-relaxed text-navy-700">{String(selected.raw.metadata.description)}</p>
              ) : null}
              {selected.raw.metadata?.source_name ? (
                <p className="text-[10px] text-navy-500">Source: {String(selected.raw.metadata.source_name)}</p>
              ) : null}
              {selected.raw.metadata?.confidence ? (
                <p className="text-[10px] text-emerald-700">Confidence: {String(selected.raw.metadata.confidence)}</p>
              ) : null}
              {selected.raw.metadata?.source_url ? (
                <a
                  href={String(selected.raw.metadata.source_url)}
                  target="_blank"
                  rel="noopener"
                  className="inline-block text-[11px] text-diplomatic-blue underline"
                >
                  Open source
                </a>
              ) : null}
              <p className="pt-2 text-[10px] text-navy-400">Degree: {selected.degree}</p>
            </div>
          ) : (
            <div className="text-[11px] text-navy-500">
              <p className="font-semibold text-navy-700">Click a node</p>
              <p className="mt-1">Each node carries a description, source, confidence label, and live source URL when public-source data exists.</p>
              <p className="mt-2 text-navy-400">Toggle entity-type chips to filter the graph.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
