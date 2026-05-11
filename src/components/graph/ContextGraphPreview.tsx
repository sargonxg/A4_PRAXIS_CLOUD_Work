import { GitBranch, ShieldCheck } from 'lucide-react';
import type { TruthLayerSnapshot } from '@/types/case-module';

type GraphPreviewNode = {
  id: string;
  label: string;
  type: 'case' | 'source' | 'claim' | 'evidence' | 'actor' | 'draft';
  x: number;
  y: number;
  count?: number;
};

const NODE_COLORS: Record<GraphPreviewNode['type'], string> = {
  case: '#F8FAFC',
  source: '#38BDF8',
  claim: '#FBBF24',
  evidence: '#34D399',
  actor: '#A78BFA',
  draft: '#FB7185',
};

const previewNodes: GraphPreviewNode[] = [
  { id: 'case', label: 'Context', type: 'case', x: 310, y: 168 },
  { id: 'source', label: 'Sources', type: 'source', x: 132, y: 72 },
  { id: 'claim', label: 'Claims', type: 'claim', x: 490, y: 86 },
  { id: 'evidence', label: 'Evidence', type: 'evidence', x: 466, y: 262 },
  { id: 'actor', label: 'Actors', type: 'actor', x: 142, y: 274 },
  { id: 'draft', label: 'Drafts', type: 'draft', x: 312, y: 322 },
];

const previewEdges = [
  ['source', 'case', 'feeds'],
  ['actor', 'case', 'frames'],
  ['case', 'claim', 'tests'],
  ['source', 'evidence', 'cites'],
  ['evidence', 'claim', 'supports'],
  ['claim', 'draft', 'writes'],
  ['actor', 'draft', 'targets'],
] as const;

export function ContextGraphPreview({
  title = 'Graph operating picture',
  summary = 'Sources, actors, evidence, claims, and drafts stay connected so the user can see what supports each output.',
  stats,
  truthLayers,
  className = '',
}: {
  title?: string;
  summary?: string;
  stats?: Array<{ label: string; value: string }>;
  truthLayers?: Record<string, TruthLayerSnapshot>;
  className?: string;
}) {
  const layerStats = truthLayers
    ? Object.entries(truthLayers).map(([label, layer]) => ({
        label,
        value: `${layer.nodeCount}/${layer.edgeCount}`,
      }))
    : stats;

  return (
    <section className={`overflow-hidden rounded-lg border border-white/12 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20 ${className}`}>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="relative min-h-[360px] border-b border-white/10 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(251,191,36,0.20),transparent_28%),linear-gradient(135deg,#09090b,#111827_55%,#18181b)] p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-amber-300" aria-hidden="true" />
                <h2 className="text-base font-semibold">{title}</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">{summary}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              review gated
            </span>
          </div>

          <svg viewBox="0 0 620 390" className="mt-5 h-[300px] w-full sm:h-[330px]" role="img" aria-label="PRAXIS graph preview connecting sources, actors, evidence, claims, and drafts">
            <defs>
              <filter id="contextGraphGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker id="contextGraphArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#94A3B8" />
              </marker>
            </defs>
            <path d="M92 346 C180 210 244 110 306 166 C372 226 432 154 536 42" fill="none" stroke="#334155" strokeWidth="1.2" strokeDasharray="5 8" />
            {previewEdges.map(([sourceId, targetId, label]) => {
              const source = previewNodes.find((node) => node.id === sourceId);
              const target = previewNodes.find((node) => node.id === targetId);
              if (!source || !target) return null;
              return (
                <g key={`${sourceId}-${targetId}`}>
                  <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#94A3B8" strokeOpacity="0.52" strokeWidth="1.5" markerEnd="url(#contextGraphArrow)" />
                  <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 8} textAnchor="middle" className="fill-zinc-300 text-[10px] font-semibold">
                    {label}
                  </text>
                </g>
              );
            })}
            {previewNodes.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r={node.type === 'case' ? 46 : 35} fill={NODE_COLORS[node.type]} fillOpacity={node.type === 'case' ? 0.16 : 0.22} stroke={NODE_COLORS[node.type]} strokeWidth={node.type === 'case' ? 2.5 : 1.5} filter="url(#contextGraphGlow)" />
                <circle cx={node.x} cy={node.y} r={node.type === 'case' ? 14 : 10} fill={NODE_COLORS[node.type]} />
                <text x={node.x} y={node.y + (node.type === 'case' ? 66 : 53)} textAnchor="middle" className="fill-white text-[12px] font-semibold">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="bg-white/[0.04] p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Live layers</p>
          <div className="mt-4 space-y-3">
            {(layerStats ?? []).slice(0, 4).map((item) => (
              <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.05] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{item.label}</p>
                <p className="mt-1 font-mono text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-amber-300/20 bg-amber-300/10 p-4">
            <p className="text-sm font-semibold text-amber-100">What this changes</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              The graph is not decoration: it is the routing layer for what gets researched, challenged, drafted, and reviewed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
