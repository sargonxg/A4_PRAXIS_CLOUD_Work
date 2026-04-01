'use client';

import React, { useMemo } from 'react';

interface SankeyNode {
  id: string;
  label: string;
  value?: number;
  color?: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  label?: string;
}

interface SankeyFlowProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  width?: number;
  height?: number;
}

const COL_COLORS = ['#10B981', '#E8B931', '#3B82F6', '#8B5CF6', '#F97316'];
const NODE_W = 16;
const PAD = { top: 20, bottom: 20, left: 20, right: 20 };

interface LayoutNode extends SankeyNode {
  col: number;
  x: number;
  y0: number;
  y1: number;
  color: string;
}

interface LayoutLink {
  sourceNode: LayoutNode;
  targetNode: LayoutNode;
  value: number;
  label?: string;
  sy0: number;
  sy1: number;
  ty0: number;
  ty1: number;
}

function buildSankeyLayout(
  nodes: SankeyNode[],
  links: SankeyLink[],
  width: number,
  height: number
): { layoutNodes: LayoutNode[]; layoutLinks: LayoutLink[] } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Determine columns via BFS from source nodes
  const hasIncoming = new Set(links.map((l) => l.target));
  const roots = nodes.filter((n) => !hasIncoming.has(n.id));
  const colMap = new Map<string, number>();
  const queue = roots.map((r) => ({ id: r.id, col: 0 }));
  while (queue.length > 0) {
    const { id, col } = queue.shift()!;
    if (colMap.has(id)) continue;
    colMap.set(id, col);
    for (const lk of links.filter((l) => l.source === id)) {
      queue.push({ id: lk.target, col: col + 1 });
    }
  }

  // Fallback column for any unreachable nodes
  nodes.forEach((n) => {
    if (!colMap.has(n.id)) colMap.set(n.id, 0);
  });

  const maxCol = Math.max(...colMap.values(), 0);
  const colCount = maxCol + 1;
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const colSpacing = colCount > 1 ? plotW / (colCount - 1) : plotW / 2;

  // Group nodes by column
  const colGroups = new Map<number, string[]>();
  colMap.forEach((col, id) => {
    const g = colGroups.get(col) ?? [];
    g.push(id);
    colGroups.set(col, g);
  });

  // Compute node heights proportional to their total link value
  const nodeInflow = new Map<string, number>();
  const nodeOutflow = new Map<string, number>();
  links.forEach((l) => {
    nodeOutflow.set(l.source, (nodeOutflow.get(l.source) ?? 0) + l.value);
    nodeInflow.set(l.target, (nodeInflow.get(l.target) ?? 0) + l.value);
  });
  const nodeValue = (id: string) =>
    Math.max(nodeInflow.get(id) ?? 0, nodeOutflow.get(id) ?? 0, nodeMap.get(id)?.value ?? 1);

  const totalValue = nodes.reduce((s, n) => s + nodeValue(n.id), 0) || 1;

  const layoutNodes: LayoutNode[] = [];
  colGroups.forEach((ids, col) => {
    const colTotal = ids.reduce((s, id) => s + nodeValue(id), 0) || 1;
    const gap = 8;
    const availH = plotH - gap * (ids.length - 1);
    let curY = PAD.top;
    ids.forEach((id) => {
      const nd = nodeMap.get(id)!;
      const h = Math.max(12, (nodeValue(id) / colTotal) * availH);
      const x = colCount > 1 ? PAD.left + col * colSpacing : PAD.left + plotW / 2;
      layoutNodes.push({
        ...nd,
        col,
        x: +x.toFixed(1),
        y0: +curY.toFixed(1),
        y1: +(curY + h).toFixed(1),
        color: nd.color ?? COL_COLORS[col % COL_COLORS.length],
      });
      curY += h + gap;
    });
  });

  const posMap = new Map(layoutNodes.map((n) => [n.id, n]));

  // Track offsets for stacking links
  const srcOffset = new Map<string, number>();
  const tgtOffset = new Map<string, number>();
  layoutNodes.forEach((n) => {
    srcOffset.set(n.id, n.y0);
    tgtOffset.set(n.id, n.y0);
  });

  const layoutLinks: LayoutLink[] = [];
  links.forEach((lk) => {
    const src = posMap.get(lk.source);
    const tgt = posMap.get(lk.target);
    if (!src || !tgt) return;

    const srcH = src.y1 - src.y0;
    const tgtH = tgt.y1 - tgt.y0;
    const srcFlow = (lk.value / (nodeOutflow.get(lk.source) ?? lk.value)) * srcH;
    const tgtFlow = (lk.value / (nodeInflow.get(lk.target) ?? lk.value)) * tgtH;

    const so0 = srcOffset.get(lk.source) ?? src.y0;
    const to0 = tgtOffset.get(lk.target) ?? tgt.y0;

    layoutLinks.push({
      sourceNode: src,
      targetNode: tgt,
      value: lk.value,
      label: lk.label,
      sy0: +so0.toFixed(1),
      sy1: +(so0 + srcFlow).toFixed(1),
      ty0: +to0.toFixed(1),
      ty1: +(to0 + tgtFlow).toFixed(1),
    });

    srcOffset.set(lk.source, so0 + srcFlow);
    tgtOffset.set(lk.target, to0 + tgtFlow);
  });

  void totalValue;
  return { layoutNodes, layoutLinks };
}

function linkPath(l: LayoutLink): string {
  const x0 = l.sourceNode.x + NODE_W;
  const x1 = l.targetNode.x;
  const mx = +((x0 + x1) / 2).toFixed(1);
  return (
    `M ${x0} ${l.sy0}` +
    ` C ${mx} ${l.sy0} ${mx} ${l.ty0} ${x1} ${l.ty0}` +
    ` L ${x1} ${l.ty1}` +
    ` C ${mx} ${l.ty1} ${mx} ${l.sy1} ${x0} ${l.sy1}` +
    ` Z`
  );
}

export function SankeyFlow({ nodes, links, width = 560, height = 320 }: SankeyFlowProps) {
  const { layoutNodes, layoutLinks } = useMemo(
    () => buildSankeyLayout(nodes, links, width, height),
    [nodes, links, width, height]
  );

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Links */}
      {layoutLinks.map((l, i) => (
        <path
          key={i}
          d={linkPath(l)}
          fill={l.sourceNode.color}
          opacity="0.35"
          stroke={l.sourceNode.color}
          strokeWidth="0.5"
        >
          {l.label ? <title>{l.label}: {l.value}</title> : null}
        </path>
      ))}

      {/* Nodes */}
      {layoutNodes.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x}
            y={n.y0}
            width={NODE_W}
            height={Math.max(2, n.y1 - n.y0)}
            rx="2"
            fill={n.color}
          >
            <title>{n.label}{n.value !== undefined ? `: ${n.value}` : ''}</title>
          </rect>
          <text
            x={n.col === 0 ? n.x + NODE_W + 4 : n.x - 4}
            y={(n.y0 + n.y1) / 2}
            textAnchor={n.col === 0 ? 'start' : 'end'}
            dominantBaseline="middle"
            fill="#94A3B8"
            fontSize="10"
            fontFamily="Inter, sans-serif"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
