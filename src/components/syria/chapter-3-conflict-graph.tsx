'use client';

import { useMemo, useState } from 'react';
import { GitBranch, Network, RadioTower, ShieldAlert } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { SYRIA_DEMO_CONFLICT_GRAPH } from '@/lib/constants/syria-demo-case';
import { cn } from '@/lib/utils/cn';

const VIEWS = [
  { id: 'episodic', label: 'Episodic', helper: 'events and dates' },
  { id: 'semantic', label: 'Semantic', helper: 'actors and claims' },
  { id: 'stance', label: 'Stance', helper: 'positions and narratives' },
] as const;

type GraphView = (typeof VIEWS)[number]['id'];

export function SyriaChapterConflictGraph() {
  const [view, setView] = useState<GraphView>('episodic');

  const nodes = useMemo(() => {
    if (view === 'episodic') return SYRIA_DEMO_CONFLICT_GRAPH.events;
    if (view === 'stance') return [...SYRIA_DEMO_CONFLICT_GRAPH.narratives, ...SYRIA_DEMO_CONFLICT_GRAPH.claims];
    return [...SYRIA_DEMO_CONFLICT_GRAPH.actors, ...SYRIA_DEMO_CONFLICT_GRAPH.constraints];
  }, [view]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-slate-200 bg-navy-950 p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">Live ACO graph snapshot</p>
            <h3 className="mt-1 text-lg font-semibold">Northeast integration operating picture</h3>
          </div>
          <div className="flex rounded-md border border-white/10 bg-white/5 p-1">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-semibold transition',
                  view === item.id ? 'bg-gold-500 text-navy-950' : 'text-blue-100/70 hover:bg-white/10',
                )}
                aria-pressed={view === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative min-h-[310px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <svg viewBox="0 0 760 360" className="h-full min-h-[310px] w-full" role="img" aria-label="Syria graph preview">
              <defs>
                <linearGradient id="syriaGraphLine" x1="0" x2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.75" />
                </linearGradient>
              </defs>
              <line x1="175" y1="80" x2="380" y2="180" stroke="url(#syriaGraphLine)" strokeWidth="2" />
              <line x1="585" y1="92" x2="380" y2="180" stroke="url(#syriaGraphLine)" strokeWidth="2" />
              <line x1="380" y1="180" x2="200" y2="285" stroke="url(#syriaGraphLine)" strokeWidth="2" />
              <line x1="380" y1="180" x2="585" y2="282" stroke="url(#syriaGraphLine)" strokeWidth="2" />
              <line x1="380" y1="180" x2="380" y2="56" stroke="url(#syriaGraphLine)" strokeWidth="2" />

              <GraphNode x={380} y={180} label="30 Jan agreement" tone="gold" />
              <GraphNode x={175} y={80} label="Damascus" tone="blue" />
              <GraphNode x={585} y={92} label="SDF/AANES" tone="teal" />
              <GraphNode x={200} y={285} label="Humanitarian access" tone="red" />
              <GraphNode x={585} y={282} label="Regional spillover" tone="red" />
              <GraphNode x={380} y={56} label="UN good offices" tone="blue" />
            </svg>
            <div className="absolute bottom-3 left-3 right-3 rounded-md border border-white/10 bg-navy-950/80 p-3 backdrop-blur">
              <p className="text-xs font-semibold text-gold-200">{VIEWS.find((item) => item.id === view)?.label} mode</p>
              <p className="mt-1 text-xs leading-5 text-blue-100/70">
                The UI toggles the same graph by event chronology, semantic ontology, or stance/narrative relationships.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <GraphStat label="Actors" value={SYRIA_DEMO_CONFLICT_GRAPH.actors.length} icon={Network} />
            <GraphStat label="Claims" value={SYRIA_DEMO_CONFLICT_GRAPH.claims.length} icon={RadioTower} />
            <GraphStat label="Constraints" value={SYRIA_DEMO_CONFLICT_GRAPH.constraints.length} icon={ShieldAlert} />
            <GraphStat label="Completeness" value={`${SYRIA_DEMO_CONFLICT_GRAPH.dataCompleteness}%`} icon={GitBranch} />
          </div>
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Visible graph layer</p>
            <h3 className="mt-1 text-base font-semibold text-navy-950">{VIEWS.find((item) => item.id === view)?.helper}</h3>
          </div>
          <PraxisLink
            href="/conflict-graph?recording=1&case=syria"
            className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-800 transition hover:bg-slate-50"
          >
            Open
          </PraxisLink>
        </div>
        <div className="mt-4 grid gap-2">
          {nodes.slice(0, 7).map((node) => (
            <div key={node.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-navy-950">{getNodeLabel(node)}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600">{node.description}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function GraphNode({ x, y, label, tone }: { x: number; y: number; label: string; tone: 'gold' | 'blue' | 'teal' | 'red' }) {
  const fill = tone === 'gold' ? '#d4af37' : tone === 'blue' ? '#60a5fa' : tone === 'teal' ? '#2dd4bf' : '#f87171';
  return (
    <g>
      <circle cx={x} cy={y} r="34" fill={fill} fillOpacity="0.18" stroke={fill} strokeWidth="2" />
      <text x={x} y={y + 4} textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

function getNodeLabel(node: (typeof SYRIA_DEMO_CONFLICT_GRAPH.events)[number] | (typeof SYRIA_DEMO_CONFLICT_GRAPH.actors)[number] | (typeof SYRIA_DEMO_CONFLICT_GRAPH.claims)[number] | (typeof SYRIA_DEMO_CONFLICT_GRAPH.constraints)[number] | (typeof SYRIA_DEMO_CONFLICT_GRAPH.narratives)[number]) {
  if ('shortName' in node && node.shortName) return node.shortName;
  if ('title' in node) return node.title;
  return node.name;
}

function GraphStat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Network }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">{label}</span>
        <Icon className="h-4 w-4 text-gold-200" />
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
