'use client';

import React, { useMemo } from 'react';

type NodeType = 'root' | 'branch' | 'leaf';

interface TreeNode {
  id: string;
  label: string;
  probability: number;
  children?: string[];
  type?: NodeType;
}

interface ProbabilityTreeProps {
  nodes: TreeNode[];
  width?: number;
  height?: number;
}

interface LayoutNode {
  id: string;
  label: string;
  probability: number;
  type: NodeType;
  x: number;
  y: number;
  children: string[];
}

function getProbColor(p: number): string {
  if (p >= 0.6) return '#10B981';
  if (p >= 0.3) return '#F59E0B';
  return '#EF4444';
}

const NODE_W = 90;
const NODE_H = 36;
const H_GAP = 120;
const V_GAP = 52;

function buildLayout(nodes: TreeNode[], width: number, height: number): LayoutNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Find root
  const childIds = new Set(nodes.flatMap((n) => n.children ?? []));
  const roots = nodes.filter((n) => !childIds.has(n.id));
  if (roots.length === 0) return [];

  // BFS to assign columns
  const colMap = new Map<string, number>();
  const rowMap = new Map<string, number>();
  const queue: { id: string; col: number }[] = roots.map((r) => ({ id: r.id, col: 0 }));
  const colGroups = new Map<number, string[]>();

  while (queue.length > 0) {
    const item = queue.shift()!;
    if (colMap.has(item.id)) continue;
    colMap.set(item.id, item.col);
    const group = colGroups.get(item.col) ?? [];
    group.push(item.id);
    colGroups.set(item.col, group);
    const nd = nodeMap.get(item.id);
    for (const cid of nd?.children ?? []) {
      queue.push({ id: cid, col: item.col + 1 });
    }
  }

  const maxCol = Math.max(...colMap.values(), 0);
  const colCount = maxCol + 1;
  const colSpacing = Math.min(H_GAP, (width - NODE_W) / Math.max(colCount - 1, 1));

  // Assign rows within each column
  colGroups.forEach((ids, col) => {
    ids.forEach((id, i) => rowMap.set(id, i));
    void col;
  });

  // Centre each column vertically
  const layout: LayoutNode[] = [];
  colGroups.forEach((ids, col) => {
    const totalH = ids.length * V_GAP;
    const startY = (height - totalH) / 2 + V_GAP / 2;
    ids.forEach((id, i) => {
      const nd = nodeMap.get(id)!;
      layout.push({
        id,
        label: nd.label,
        probability: nd.probability,
        type: nd.type ?? (col === 0 ? 'root' : (nd.children?.length ? 'branch' : 'leaf')),
        x: +(40 + col * colSpacing).toFixed(1),
        y: +(startY + i * V_GAP).toFixed(1),
        children: nd.children ?? [],
      });
    });
  });

  return layout;
}

function cubicPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = +((x1 + x2) / 2).toFixed(1);
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

export function ProbabilityTree({ nodes, width = 560, height = 340 }: ProbabilityTreeProps) {
  const layout = useMemo(() => buildLayout(nodes, width, height), [nodes, width, height]);
  const posMap = new Map(layout.map((n) => [n.id, n]));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Edges */}
      {layout.map((n) =>
        n.children.map((cid) => {
          const child = posMap.get(cid);
          if (!child) return null;
          const x1 = n.x + NODE_W;
          const y1 = n.y;
          const x2 = child.x;
          const y2 = child.y;
          return (
            <path
              key={`${n.id}-${cid}`}
              d={cubicPath(x1, y1, x2, y2)}
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
            />
          );
        })
      )}

      {/* Nodes */}
      {layout.map((n) => {
        const color = getProbColor(n.probability);
        const pct = +(n.probability * 100).toFixed(0);
        const label = n.label.length > 12 ? n.label.slice(0, 11) + '…' : n.label;
        return (
          <g key={n.id} transform={`translate(${n.x - NODE_W / 2}, ${n.y - NODE_H / 2})`}>
            <rect
              width={NODE_W}
              height={NODE_H}
              rx="6"
              ry="6"
              fill="#0F172A"
              stroke={color}
              strokeWidth="1.5"
            />
            <text
              x={NODE_W / 2}
              y={NODE_H * 0.38}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#CBD5E1"
              fontSize="10"
              fontFamily="Inter, sans-serif"
            >
              {label}
            </text>
            <text
              x={NODE_W / 2}
              y={NODE_H * 0.72}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize="11"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
