'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  label: string;
  type?: string;
  size?: number;
  color?: string;
  data?: Record<string, unknown>;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  type?: string;
  weight?: number;
}

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  selectedNodeId?: string;
  colorByType?: Record<string, string>;
}

const DEFAULT_NODE_COLOR = '#10B981';
const SELECTED_RING = '#E8B931';

export function ForceGraph({
  nodes,
  edges,
  width = 600,
  height = 400,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
  colorByType = {},
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getNodeColor = useCallback(
    (n: GraphNode) => {
      if (n.color) return n.color;
      if (n.type && colorByType[n.type]) return colorByType[n.type];
      return DEFAULT_NODE_COLOR;
    },
    [colorByType]
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Clear previous render
    d3.select(svg).selectAll('*').remove();

    // Arrow marker
    const defs = d3.select(svg).append('defs');
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 14)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#475569');

    const root = d3.select(svg).append('g').attr('class', 'root');

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        root.attr('transform', event.transform.toString());
      });
    d3.select(svg).call(zoom);

    // Simulation data (clone to avoid mutating props)
    type SimNode = GraphNode & d3.SimulationNodeDatum;
    type SimLink = { source: SimNode; target: SimNode; label?: string; weight?: number };

    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const nodeById = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = [];
    for (const e of edges) {
      const src = nodeById.get(e.source);
      const tgt = nodeById.get(e.target);
      if (src && tgt) {
        simLinks.push({ source: src, target: tgt, label: e.label, weight: e.weight });
      }
    }

    // Build simulation
    const sim = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimNode>().radius((d) => (d.size ?? 8) + 12));

    simRef.current = sim as unknown as d3.Simulation<d3.SimulationNodeDatum, undefined>;

    // Edges
    const linkG = root.append('g').attr('class', 'links');
    const linkEl = linkG
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', (d) => Math.max(1, (d.weight ?? 1) * 0.8))
      .attr('marker-end', 'url(#arrow)');

    // Edge labels
    const edgeLabelEl = linkG
      .selectAll('text')
      .data(simLinks.filter((l) => !!l.label))
      .enter()
      .append('text')
      .attr('fill', '#64748B')
      .attr('font-size', '8')
      .attr('font-family', 'Inter, sans-serif')
      .attr('text-anchor', 'middle')
      .text((d) => d.label ?? '');

    // Node groups
    const nodeG = root.append('g').attr('class', 'nodes');
    const nodeEl = nodeG
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer');

    // Selection ring
    nodeEl
      .append('circle')
      .attr('class', 'select-ring')
      .attr('r', (d) => (d.size ?? 8) + 6)
      .attr('fill', 'none')
      .attr('stroke', SELECTED_RING)
      .attr('stroke-width', 2)
      .attr('opacity', (d) => (d.id === selectedNodeId ? 1 : 0));

    // Node circles
    nodeEl
      .append('circle')
      .attr('r', (d) => d.size ?? 8)
      .attr('fill', (d) => getNodeColor(d))
      .attr('stroke', '#0F172A')
      .attr('stroke-width', 1.5);

    // Node labels
    nodeEl
      .append('text')
      .attr('dy', (d) => (d.size ?? 8) + 11)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94A3B8')
      .attr('font-size', '9')
      .attr('font-family', 'Inter, sans-serif')
      .text((d) => (d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label));

    // Drag
    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeEl.call(drag as unknown as (sel: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>) => void);

    // Hover / click
    const tooltip = tooltipRef.current;

    nodeEl
      .on('mouseenter', (event: MouseEvent, d) => {
        onNodeHover?.(d);
        if (tooltip) {
          const lines = [d.label, d.type ? `Type: ${d.type}` : null]
            .filter(Boolean)
            .join('\n');
          tooltip.textContent = lines;
          tooltip.style.display = 'block';
          tooltip.style.left = `${event.offsetX + 12}px`;
          tooltip.style.top = `${event.offsetY - 8}px`;
        }
      })
      .on('mousemove', (event: MouseEvent) => {
        if (tooltip) {
          tooltip.style.left = `${event.offsetX + 12}px`;
          tooltip.style.top = `${event.offsetY - 8}px`;
        }
      })
      .on('mouseleave', () => {
        onNodeHover?.(null);
        if (tooltip) tooltip.style.display = 'none';
      })
      .on('click', (_event: MouseEvent, d) => {
        onNodeClick?.(d);
      });

    // Tick
    sim.on('tick', () => {
      linkEl
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);

      edgeLabelEl
        .attr('x', (d) => (((d.source as SimNode).x ?? 0) + ((d.target as SimNode).x ?? 0)) / 2)
        .attr('y', (d) => (((d.source as SimNode).y ?? 0) + ((d.target as SimNode).y ?? 0)) / 2);

      nodeEl.attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    return () => {
      sim.stop();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, width, height, getNodeColor, selectedNodeId]);

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ background: '#0F172A', borderRadius: 8 }}
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute hidden rounded px-2 py-1 text-xs whitespace-pre"
        style={{
          background: '#1E293B',
          border: '1px solid #334155',
          color: '#CBD5E1',
          fontFamily: 'Inter, sans-serif',
          zIndex: 10,
        }}
      />
    </div>
  );
}
