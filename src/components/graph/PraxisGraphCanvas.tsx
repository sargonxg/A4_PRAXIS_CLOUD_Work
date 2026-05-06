'use client';

import { useMemo, useState } from 'react';
import { GitBranch, ShieldCheck } from 'lucide-react';
import type { WorkbenchGraph, WorkbenchGraphNode } from '@/lib/graph/workbench-case-graph';
import { cn } from '@/lib/utils/cn';

const VIEWBOX_W = 900;
const VIEWBOX_H = 520;

const NODE_COLORS: Record<WorkbenchGraphNode['type'], string> = {
  case: '#0F172A',
  actor: '#7C3AED',
  source: '#0EA5E9',
  claim: '#B45309',
  evidence: '#059669',
  verdict: '#BE123C',
};

function layoutNodes(nodes: WorkbenchGraph['nodes']) {
  const center = { x: VIEWBOX_W / 2, y: VIEWBOX_H / 2 };
  const satellite = nodes.filter((node) => node.id !== 'case');
  const radiusX = 310;
  const radiusY = 170;
  return nodes.map((node, index) => {
    if (node.id === 'case') return { ...node, x: center.x, y: center.y };
    const satelliteIndex = Math.max(0, satellite.findIndex((item) => item.id === node.id));
    const angle = (Math.PI * 2 * satelliteIndex) / Math.max(1, satellite.length) - Math.PI / 2;
    const weight = node.type === 'source' ? 1.05 : 0.9;
    return {
      ...node,
      x: center.x + Math.cos(angle) * radiusX * weight,
      y: center.y + Math.sin(angle) * radiusY * weight,
      keyIndex: index,
    };
  });
}

export function PraxisGraphCanvas({ graph, className }: { graph: WorkbenchGraph; className?: string }) {
  const [selectedId, setSelectedId] = useState('case');
  const layout = useMemo(() => layoutNodes(graph.nodes), [graph.nodes]);
  const selected = layout.find((node) => node.id === selectedId) ?? layout[0];

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <GitBranch className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">Graph Visualization</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Canonical case graph view built from the active workbench context, with provenance and confidence surfaced without blocking rough imports.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {Math.round(graph.provenanceCoverage * 100)}% provenance
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-h-[360px] rounded-md border border-slate-200 bg-slate-50 p-3">
          <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className="h-full min-h-[340px] w-full" role="img" aria-label="Canonical PRAXIS graph">
            <defs>
              <marker id="praxisArrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#64748B" />
              </marker>
            </defs>
            {graph.edges.map((edge) => {
              const source = layout.find((node) => node.id === edge.source);
              const target = layout.find((node) => node.id === edge.target);
              if (!source || !target) return null;
              const active = selectedId === edge.source || selectedId === edge.target;
              return (
                <g key={edge.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={active ? '#334155' : '#CBD5E1'}
                    strokeWidth={active ? 2 : 1}
                    markerEnd="url(#praxisArrow)"
                  />
                  {active ? (
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 - 6}
                      textAnchor="middle"
                      className="fill-slate-600 text-[10px] font-semibold"
                    >
                      {edge.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {layout.map((node) => {
              const selectedNode = selectedId === node.id;
              const radius = node.type === 'case' ? 32 : 18 + Math.round(node.confidence * 8);
              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${node.label}`}
                  className="cursor-pointer outline-none"
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setSelectedId(node.id);
                  }}
                >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={selectedNode ? radius + 5 : radius}
                      fill={NODE_COLORS[node.type]}
                      fillOpacity={selectedNode ? 0.24 : 0.16}
                      stroke={NODE_COLORS[node.type]}
                      strokeWidth={selectedNode ? 3 : 1.5}
                    />
                    <circle cx={node.x} cy={node.y} r={Math.max(5, radius * 0.34)} fill={NODE_COLORS[node.type]} />
                    <text
                      x={node.x}
                      y={node.y + radius + 16}
                      textAnchor="middle"
                      className="fill-slate-700 text-[11px] font-semibold"
                    >
                      {node.label.length > 24 ? `${node.label.slice(0, 21)}...` : node.label}
                    </text>
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{selected?.type}</p>
          <h3 className="mt-1 text-base font-semibold text-navy-950">{selected?.label}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-650">{selected?.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Confidence" value={`${Math.round((selected?.confidence ?? 0) * 100)}%`} />
            <Metric label="Receipts" value={String(selected?.provenanceCount ?? 0)} />
          </div>
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-navy-950">{value}</p>
    </div>
  );
}
