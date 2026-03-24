'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { NoDataState } from '@/components/praxis/no-data-state';

import { useState, useCallback, useRef } from 'react';
import {
  Users,
  Sparkles,
  Loader2,
  Grid3X3,
  BarChart3,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface StakeholderActor {
  id: string;
  name: string;
  type: string;
  power: number;
  interest: number;
  color: string;
  relationships: number;
}

interface StakeholderRelationship {
  from: string;
  to: string;
  type: string;
  strength: number;
  description: string;
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────

const DEMO_ACTORS: StakeholderActor[] = [
  { id: 'gov',      name: 'Government of Nordalia',       type: 'state',          power: 8,  interest: 9,  color: '#1A2332', relationships: 5 },
  { id: 'drm',      name: 'DRM',                          type: 'armed-group',    power: 6,  interest: 10, color: '#A63D40', relationships: 4 },
  { id: 'unmn',     name: 'UN Mission',                   type: 'international',  power: 7,  interest: 8,  color: '#4B92DB', relationships: 6 },
  { id: 'karovia',  name: 'Karovia',                      type: 'state',          power: 8,  interest: 7,  color: '#5B8C5A', relationships: 3 },
  { id: 'cso',      name: 'Civil Society Coalition',      type: 'civil-society',  power: 3,  interest: 8,  color: '#C8961E', relationships: 3 },
  { id: 'au',       name: 'African Union',                type: 'international',  power: 6,  interest: 6,  color: '#4B6584', relationships: 4 },
  { id: 'sertania', name: 'Sertania',                     type: 'state',          power: 5,  interest: 5,  color: '#8395a7', relationships: 2 },
];

const DEMO_RELATIONSHIPS: StakeholderRelationship[] = [
  { from: 'gov',      to: 'drm',      type: 'rivalry',    strength: 9, description: 'Armed conflict since 2025' },
  { from: 'unmn',     to: 'gov',      type: 'diplomatic', strength: 6, description: 'Mission mandate holder' },
  { from: 'unmn',     to: 'drm',      type: 'diplomatic', strength: 5, description: 'Mediation engagement' },
  { from: 'karovia',  to: 'drm',      type: 'support',    strength: 7, description: 'Material support suspected' },
  { from: 'karovia',  to: 'gov',      type: 'rivalry',    strength: 5, description: 'Historical tension' },
  { from: 'au',       to: 'unmn',     type: 'alliance',   strength: 7, description: 'Joint mediation framework' },
  { from: 'cso',      to: 'drm',      type: 'support',    strength: 4, description: 'Shared political goals' },
  { from: 'cso',      to: 'gov',      type: 'rivalry',    strength: 5, description: 'Democratic accountability demands' },
];

type RelType = 'alliance' | 'rivalry' | 'diplomatic' | 'support';

const REL_COLORS: Record<RelType, string> = {
  alliance:   '#5B8C5A',
  rivalry:    '#A63D40',
  diplomatic: '#4B92DB',
  support:    '#C8961E',
};

const REL_LABELS: Record<RelType, string> = {
  alliance:   'Alliance',
  rivalry:    'Rivalry',
  diplomatic: 'Diplomatic',
  support:    'Support',
};

const TYPE_LABELS: Record<string, string> = {
  'state':         'State',
  'armed-group':   'Armed Group',
  'international': 'Int\'l Org',
  'civil-society': 'Civil Society',
};

// ─── Power-Interest Grid (SVG Mendelow Matrix) ─────────────────────────────────

function PowerInterestGrid({ actors, onSelectActor, selectedId }: {
  actors: StakeholderActor[];
  onSelectActor: (id: string | null) => void;
  selectedId: string | null;
}) {
  const SVG_W = 600;
  const SVG_H = 420;
  const PAD_LEFT = 48;
  const PAD_BOTTOM = 36;
  const PAD_TOP = 16;
  const PAD_RIGHT = 16;
  const PLOT_W = SVG_W - PAD_LEFT - PAD_RIGHT;
  const PLOT_H = SVG_H - PAD_BOTTOM - PAD_TOP;
  const MID_X = PAD_LEFT + PLOT_W / 2;
  const MID_Y = PAD_TOP + PLOT_H / 2;

  const toSvgX = (interest: number) => PAD_LEFT + (interest / 10) * PLOT_W;
  const toSvgY = (power: number)    => PAD_TOP + ((10 - power) / 10) * PLOT_H;

  const [tooltip, setTooltip] = useState<{ actor: StakeholderActor; x: number; y: number } | null>(null);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ maxHeight: 440, display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Quadrant backgrounds */}
        {/* Bottom-left: Monitor */}
        <rect x={PAD_LEFT} y={MID_Y} width={PLOT_W / 2} height={PLOT_H / 2} fill="#F1F5F9" fillOpacity="0.8" />
        {/* Bottom-right: Keep Informed */}
        <rect x={MID_X} y={MID_Y} width={PLOT_W / 2} height={PLOT_H / 2} fill="#EFF6FF" fillOpacity="0.9" />
        {/* Top-left: Keep Satisfied */}
        <rect x={PAD_LEFT} y={PAD_TOP} width={PLOT_W / 2} height={PLOT_H / 2} fill="#FEFCE8" fillOpacity="0.9" />
        {/* Top-right: Manage Closely */}
        <rect x={MID_X} y={PAD_TOP} width={PLOT_W / 2} height={PLOT_H / 2} fill="#FFF1F2" fillOpacity="0.9" />

        {/* Quadrant labels */}
        <text x={PAD_LEFT + 8} y={MID_Y + 18} fontSize="10" fill="#94A3B8" fontWeight="600" fontFamily="sans-serif">MONITOR</text>
        <text x={MID_X + 8} y={MID_Y + 18} fontSize="10" fill="#60A5FA" fontWeight="600" fontFamily="sans-serif">KEEP INFORMED</text>
        <text x={PAD_LEFT + 8} y={PAD_TOP + 18} fontSize="10" fill="#CA8A04" fontWeight="600" fontFamily="sans-serif">KEEP SATISFIED</text>
        <text x={MID_X + 8} y={PAD_TOP + 18} fontSize="10" fill="#E11D48" fontWeight="600" fontFamily="sans-serif">MANAGE CLOSELY</text>

        {/* Grid lines */}
        {[2, 4, 6, 8].map(v => (
          <g key={v}>
            <line x1={toSvgX(v)} y1={PAD_TOP} x2={toSvgX(v)} y2={PAD_TOP + PLOT_H} stroke="#E2E8F0" strokeWidth="0.5" />
            <line x1={PAD_LEFT} y1={toSvgY(v)} x2={PAD_LEFT + PLOT_W} y2={toSvgY(v)} stroke="#E2E8F0" strokeWidth="0.5" />
          </g>
        ))}

        {/* Midpoint dividers */}
        <line x1={MID_X} y1={PAD_TOP} x2={MID_X} y2={PAD_TOP + PLOT_H} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4,3" />
        <line x1={PAD_LEFT} y1={MID_Y} x2={PAD_LEFT + PLOT_W} y2={MID_Y} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4,3" />

        {/* Axis labels */}
        <text x={PAD_LEFT + PLOT_W / 2} y={SVG_H - 4} textAnchor="middle" fontSize="11" fill="#64748B" fontWeight="600" fontFamily="sans-serif">
          Level of Interest →
        </text>
        <text
          x={12}
          y={PAD_TOP + PLOT_H / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#64748B"
          fontWeight="600"
          fontFamily="sans-serif"
          transform={`rotate(-90, 12, ${PAD_TOP + PLOT_H / 2})`}
        >
          Power / Influence →
        </text>

        {/* Tick marks */}
        {[0, 2, 4, 6, 8, 10].map(v => (
          <g key={v}>
            <text x={toSvgX(v)} y={PAD_TOP + PLOT_H + 14} textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily="sans-serif">{v}</text>
            <text x={PAD_LEFT - 6} y={toSvgY(v) + 3} textAnchor="end" fontSize="9" fill="#94A3B8" fontFamily="sans-serif">{v}</text>
          </g>
        ))}

        {/* Actor bubbles */}
        {actors.map((actor) => {
          const cx = toSvgX(actor.interest);
          const cy = toSvgY(actor.power);
          const r = 16 + actor.relationships * 3;
          const isSelected = selectedId === actor.id;

          return (
            <g
              key={actor.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectActor(isSelected ? null : actor.id)}
              onMouseEnter={(e) => {
                const svg = e.currentTarget.closest('svg')!;
                const rect = svg.getBoundingClientRect();
                const svgRect = svg.viewBox.baseVal;
                const scaleX = svgRect.width / rect.width;
                const scaleY = svgRect.height / rect.height;
                setTooltip({
                  actor,
                  x: cx / scaleX,
                  y: cy / scaleY - r / scaleY - 10,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {isSelected && (
                <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={actor.color} strokeWidth="2" strokeOpacity="0.4">
                  <animate attributeName="r" values={`${r + 4};${r + 8};${r + 4}`} dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={cx} cy={cy} r={r}
                fill={actor.color}
                fillOpacity={isSelected ? 0.85 : 0.65}
                stroke={isSelected ? actor.color : 'white'}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <text
                x={cx} y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={actor.name.length > 6 ? 8 : 9}
                fontWeight="700"
                fill="white"
                fontFamily="sans-serif"
              >
                {actor.name.split(' ').slice(0, 2).join('\n').split('\n').map((word, wi) => (
                  <tspan key={wi} x={cx} dy={wi === 0 ? -4 : 10}>{word}</tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[var(--color-app-border)] bg-white p-3 shadow-lg text-xs"
          style={{ left: `${(tooltip.x / SVG_W) * 100}%`, top: `${(tooltip.y / SVG_H) * 100}%`, transform: 'translate(-50%, -100%)' }}
        >
          <p className="font-semibold text-navy-900">{tooltip.actor.name}</p>
          <p className="text-navy-500 capitalize">{TYPE_LABELS[tooltip.actor.type] ?? tooltip.actor.type}</p>
          <div className="mt-1.5 flex gap-3">
            <span className="text-navy-600">Power: <strong>{tooltip.actor.power}/10</strong></span>
            <span className="text-navy-600">Interest: <strong>{tooltip.actor.interest}/10</strong></span>
          </div>
          <p className="mt-1 text-navy-400">{tooltip.actor.relationships} relationships mapped</p>
        </div>
      )}
    </div>
  );
}

// ─── Relationship Matrix (HTML table) ─────────────────────────────────────────

function RelationshipMatrix({ actors, relationships, onSelectActor }: {
  actors: StakeholderActor[];
  relationships: StakeholderRelationship[];
  onSelectActor: (id: string | null) => void;
}) {
  const [hoveredCell, setHoveredCell] = useState<{ from: string; to: string } | null>(null);

  const getRelationship = (from: string, to: string) =>
    relationships.find(r => (r.from === from && r.to === to) || (r.from === to && r.to === from));

  const cellTooltip = hoveredCell ? getRelationship(hoveredCell.from, hoveredCell.to) : null;

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="w-28 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-2 text-left text-[9px] font-semibold uppercase tracking-wider text-navy-400">
              Actor →
            </th>
            {actors.map(a => (
              <th
                key={a.id}
                className="border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-2 text-center"
                style={{ minWidth: 80 }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="text-[9px] font-semibold text-navy-600">{a.name.split(' ').slice(0, 2).join(' ')}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {actors.map(rowActor => (
            <tr key={rowActor.id}>
              <td className="border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-2">
                <button
                  onClick={() => onSelectActor(rowActor.id)}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: rowActor.color }} />
                  <span className="text-[9px] font-semibold text-navy-700">{rowActor.name.split(' ').slice(0, 2).join(' ')}</span>
                </button>
              </td>
              {actors.map(colActor => {
                if (rowActor.id === colActor.id) {
                  return (
                    <td
                      key={colActor.id}
                      className="border border-[var(--color-app-border)] p-0"
                      style={{
                        background: `repeating-linear-gradient(
                          45deg,
                          #E2E8F0,
                          #E2E8F0 2px,
                          #F8FAFC 2px,
                          #F8FAFC 8px
                        )`,
                        width: 80,
                        height: 44,
                      }}
                    />
                  );
                }
                const rel = getRelationship(rowActor.id, colActor.id);
                if (!rel) {
                  return (
                    <td
                      key={colActor.id}
                      className="border border-[var(--color-app-border)] bg-white p-2 text-center text-navy-200"
                    >
                      <span className="text-[10px]">—</span>
                    </td>
                  );
                }
                const relType = rel.type as RelType;
                const bgColor = REL_COLORS[relType] ?? '#94A3B8';
                const opacity = 0.1 + (rel.strength / 10) * 0.5;
                const isHovered = hoveredCell?.from === rowActor.id && hoveredCell?.to === colActor.id;

                return (
                  <td
                    key={colActor.id}
                    className="relative border border-[var(--color-app-border)] p-2 text-center cursor-pointer transition-all"
                    style={{
                      backgroundColor: `${bgColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                    }}
                    onMouseEnter={() => setHoveredCell({ from: rowActor.id, to: colActor.id })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: bgColor }}
                    >
                      {rel.strength}
                    </span>
                    <br />
                    <span className="text-[8px] font-medium" style={{ color: bgColor, opacity: 0.8 }}>
                      {REL_LABELS[relType]}
                    </span>
                    {/* Hover tooltip */}
                    {isHovered && cellTooltip && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg border border-[var(--color-app-border)] bg-white p-2.5 shadow-lg text-left w-48">
                        <p className="font-semibold text-navy-900 text-[11px]">{rowActor.name.split(' ').slice(0,2).join(' ')} ↔ {colActor.name.split(' ').slice(0,2).join(' ')}</p>
                        <p className="text-[10px] font-medium mt-0.5" style={{ color: bgColor }}>{REL_LABELS[relType]} — Strength {rel.strength}/10</p>
                        <p className="text-[10px] text-navy-500 mt-1">{rel.description}</p>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {Object.entries(REL_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="h-3 w-5 rounded-sm" style={{ backgroundColor: color, opacity: 0.5 }} />
            <span className="text-[10px] text-navy-500">{REL_LABELS[type as RelType]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2 border-l border-[var(--color-app-border)] pl-3">
          <span className="text-[10px] text-navy-400">Cell number = relationship strength (1-10)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Actor Detail Panel ────────────────────────────────────────────────────────

function ActorDetailPanel({
  actors,
  relationships,
  actorId,
  onClose,
  liveInsight,
  loadingInsightId,
  onGenerateInsight,
}: {
  actors: StakeholderActor[];
  relationships: StakeholderRelationship[];
  actorId: string;
  onClose: () => void;
  liveInsight: string;
  loadingInsightId: string | null;
  onGenerateInsight: (actorId: string) => void;
}) {
  const actor = actors.find(a => a.id === actorId);
  if (!actor) return null;

  const actorRels = relationships.filter(r => r.from === actor.id || r.to === actor.id);

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-start justify-between"
        style={{ backgroundColor: `${actor.color}10`, borderBottom: `2px solid ${actor.color}25` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: actor.color }}
          >
            {actor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-900 leading-tight">{actor.name}</h3>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize mt-1"
              style={{ backgroundColor: `${actor.color}15`, color: actor.color }}>
              {TYPE_LABELS[actor.type] ?? actor.type}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-navy-400 hover:text-navy-600 p-1 rounded-md hover:bg-white/50 transition-colors">
          <span className="text-base leading-none">×</span>
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Power & Interest scores */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Power / Influence</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-navy-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${actor.power * 10}%`, backgroundColor: actor.color }} />
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: actor.color }}>{actor.power}/10</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Level of Interest</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-navy-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${actor.interest * 10}%`, backgroundColor: actor.color }} />
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: actor.color }}>{actor.interest}/10</span>
            </div>
          </div>
        </div>

        {/* Relationships */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2">
            Relationships ({actorRels.length})
          </p>
          <div className="space-y-1.5">
            {actorRels.map((rel, i) => {
              const otherId = rel.from === actor.id ? rel.to : rel.from;
              const other = actors.find(a => a.id === otherId);
              if (!other) return null;
              const relType = rel.type as RelType;
              const color = REL_COLORS[relType] ?? '#94A3B8';
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-[var(--color-app-surface-alt)] px-3 py-2">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[11px] font-medium text-navy-700 flex-1 truncate">{other.name}</span>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color }}>{REL_LABELS[relType]}</span>
                  <span className="text-[10px] text-navy-400 shrink-0 font-mono">{rel.strength}/10</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insight */}
        <div className="rounded-lg border border-gold-500/15 bg-gold-500/4 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gold-600" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">PRAXIS Insight</p>
            </div>
            <button
              onClick={() => onGenerateInsight(actor.id)}
              disabled={loadingInsightId === actor.id}
              className="flex items-center gap-1 text-[10px] text-gold-600 hover:text-gold-700 font-medium disabled:opacity-50 transition-colors"
            >
              {loadingInsightId === actor.id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Sparkles className="h-3 w-3" />
              }
              {liveInsight ? 'Refresh' : 'Generate'}
            </button>
          </div>

          {liveInsight ? (
            <div className="prose prose-sm max-w-none text-xs text-navy-700">
              <MarkdownRenderer content={liveInsight} />
              {loadingInsightId === actor.id && (
                <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />
              )}
            </div>
          ) : (
            <button
              onClick={() => onGenerateInsight(actor.id)}
              disabled={loadingInsightId === actor.id}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gold-500/20 bg-white px-3 py-2.5 text-xs font-medium text-gold-700 hover:bg-gold-500/8 transition-colors disabled:opacity-50"
            >
              {loadingInsightId === actor.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />
              }
              Generate Strategic Intelligence Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI streaming helper ───────────────────────────────────────────────────────

async function streamAI(prompt: string, onChunk: (text: string) => void): Promise<void> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  });
  if (!response.ok || !response.body) throw new Error('Stream failed');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split('\n')) {
      const parsed = parseDataStreamChunk(line);
      if (parsed) { text += parsed; onChunk(text); }
    }
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type TabType = 'grid' | 'matrix';

export default function StakeholderMapPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;

  // ─── Dynamic state: demo uses hardcoded data, real starts empty ────────────
  const [actors, setActors] = useState<StakeholderActor[]>(isDemo ? DEMO_ACTORS : []);
  const [relationships, setRelationships] = useState<StakeholderRelationship[]>(isDemo ? DEMO_RELATIONSHIPS : []);
  const [generatingMap, setGeneratingMap] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [liveInsights, setLiveInsights] = useState<Record<string, string>>({});
  const [loadingInsightId, setLoadingInsightId] = useState<string | null>(null);
  const [coalitionAnalysis, setCoalitionAnalysis] = useState('');
  const [loadingCoalition, setLoadingCoalition] = useState(false);
  const [spoilerAnalysis, setSpoilerAnalysis] = useState('');
  const [loadingSpoiler, setLoadingSpoiler] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [quadrantSummary, setQuadrantSummary] = useState<{
    keyPlayers: string[]; keepSatisfied: string[]; keepInformed: string[]; monitor: string[];
  } | null>(isDemo ? { keyPlayers: ['gov', 'drm', 'unmn'], keepSatisfied: ['karovia'], keepInformed: ['cso'], monitor: ['au'] } : null);
  const [engagementPriorities, setEngagementPriorities] = useState<string[]>([]);

  const hasData = actors.length > 0;

  // ─── Generate stakeholder map from dedicated power-map API ────────────────
  const handleGenerateMap = useCallback(async () => {
    if (generatingMap) return;
    setGeneratingMap(true);

    try {
      const response = await fetch('/api/ai/power-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      });

      if (!response.ok) throw new Error('Power map generation failed');
      const data = await response.json();

      if (Array.isArray(data.actors)) {
        // Map API actor types to legacy page types for compatibility
        const typeMap: Record<string, string> = {
          non_state_armed: 'armed-group',
          international: 'international',
          regional: 'international',
          civil_society: 'civil-society',
          private_sector: 'civil-society',
          media: 'civil-society',
          state: 'state',
        };
        setActors(data.actors.map((a: { id: string; type: string; [k: string]: unknown }) => ({
          ...a,
          type: typeMap[a.type] ?? a.type,
          relationships: (data.relationships ?? []).filter(
            (r: { from: string; to: string }) => r.from === a.id || r.to === a.id
          ).length,
        })));
      }
      if (Array.isArray(data.relationships)) setRelationships(data.relationships);
      if (data.quadrantSummary) setQuadrantSummary(data.quadrantSummary);
      if (data.coalitionDynamics) setCoalitionAnalysis(data.coalitionDynamics);
      if (data.spoilerRisks) setSpoilerAnalysis(data.spoilerRisks);
      if (Array.isArray(data.engagementPriorities)) setEngagementPriorities(data.engagementPriorities);
    } catch {
      // Silent fail — user can retry
    } finally {
      setGeneratingMap(false);
    }
  }, [generatingMap, situation]);

  const generateInsight = useCallback(async (actorId: string) => {
    if (loadingInsightId) return;
    const actor = actors.find(a => a.id === actorId);
    if (!actor) return;

    setLoadingInsightId(actorId);
    setLiveInsights(prev => ({ ...prev, [actorId]: '' }));

    const actorRels = relationships
      .filter(r => r.from === actorId || r.to === actorId)
      .map(r => {
        const otherId = r.from === actorId ? r.to : r.from;
        const other = actors.find(a => a.id === otherId);
        return `${REL_LABELS[r.type as RelType]} with ${other?.name} (strength ${r.strength}/10: ${r.description})`;
      });

    const situationContext = situation?.name ?? 'the conflict';

    const prompt = `Provide a strategic intelligence analysis for this actor in ${situationContext}:

Actor: ${actor.name}
Type: ${TYPE_LABELS[actor.type] ?? actor.type}
Power/Influence: ${actor.power}/10
Level of Interest: ${actor.interest}/10
Relationships: ${actorRels.join('; ')}

Provide:
## Strategic Assessment
Current posture, motivations, and likely next moves in the next 90 days.

## Negotiating Position
Red lines, flexibility areas, and entry points for diplomatic engagement.

## Influence Pathways
How to engage or influence this actor effectively. What do they respond to?

## Risk Factors
Potential spoiler behavior, destabilizing actions, or escalation triggers.

## Diplomatic Opportunities
Actionable leverage points for peace process facilitators.

Be concise, analytically rigorous, and diplomatically precise.`;

    try {
      await streamAI(prompt, (text) => {
        setLiveInsights(prev => ({ ...prev, [actorId]: text }));
      });
    } catch {
      setLiveInsights(prev => ({ ...prev, [actorId]: 'Analysis unavailable. Please try again.' }));
    } finally {
      setLoadingInsightId(null);
    }
  }, [loadingInsightId, actors, relationships, situation]);

  const analyzeCoalitions = useCallback(async () => {
    if (loadingCoalition) return;
    setLoadingCoalition(true);
    setCoalitionAnalysis('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const actorList = actors.map(a => `${a.name} (power: ${a.power}/10, interest: ${a.interest}/10, type: ${a.type})`).join('\n');
    const relList = relationships.map(r => {
      const from = actors.find(a => a.id === r.from)?.name;
      const to = actors.find(a => a.id === r.to)?.name;
      return `${from} ↔ ${to}: ${REL_LABELS[r.type as RelType]}, strength ${r.strength}/10 — ${r.description}`;
    }).join('\n');

    const situationContext = situation?.name ?? 'the conflict';

    const prompt = `Analyze coalition dynamics in ${situationContext} based on this stakeholder map:

ACTORS:
${actorList}

RELATIONSHIPS:
${relList}

Generate a structured coalition analysis:

## Existing Coalitions
Identify current groupings and their combined capabilities. What coalitions are operating?

## Swing Actors
Which actors could shift coalition dynamics if their allegiance changed? Analyze their motivations.

## Coalition Stability Assessment
How durable are current alliances? What could cause realignment?

## Mediator Strategy
Given this coalition landscape, what should the mediator do to maintain leverage with multiple parties simultaneously?

## Key Coalition Risks
What coalition formations would be most destabilizing for the peace process?

Be analytically precise and operationally focused.`;

    try {
      await streamAI(prompt, setCoalitionAnalysis);
    } catch {
      setCoalitionAnalysis('Analysis unavailable. Please try again.');
    } finally {
      setLoadingCoalition(false);
    }
  }, [loadingCoalition, actors, relationships, situation]);

  const analyzeSpoilers = useCallback(async () => {
    if (loadingSpoiler) return;
    setLoadingSpoiler(true);
    setSpoilerAnalysis('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const actorList = actors.map(a =>
      `- ${a.name} (power ${a.power}/10, interest ${a.interest}/10) — ${TYPE_LABELS[a.type] ?? a.type}`
    ).join('\n');

    const situationContext = situation?.name ?? 'the peace process';

    const prompt = `Using Stephen Stedman's spoiler typology, analyze potential spoilers to ${situationContext}.

Conflict actors:
${actorList}

Apply Stedman's three spoiler types:

## Total Spoilers
Which actors have maximalist goals incompatible with any settlement? What capabilities do they have to wreck the process?

## Limited Spoilers
Which actors have specific limited goals that, if unaddressed, would push them toward spoiling? What are those goals?

## Greedy Spoilers
Which actors would accept a settlement but will expand demands as their leverage grows? How to manage them?

## Spoiler Management Strategies
For each identified spoiler, recommend a management strategy (inducement, socialization, coercion) with specific tactics.

## Early Warning Indicators
What observable signs would indicate imminent spoiling behavior? What tripwires should mediators monitor?

Be precise and operationally actionable.`;

    try {
      await streamAI(prompt, setSpoilerAnalysis);
    } catch {
      setSpoilerAnalysis('Analysis unavailable. Please try again.');
    } finally {
      setLoadingSpoiler(false);
    }
  }, [loadingSpoiler, actors, situation]);

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-steel/8">
            <Users className="h-5 w-5 text-steel" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Stakeholder Power Map</h1>
            <p className="text-sm text-navy-500">
              Mendelow matrix, relationship network, coalition and spoiler analysis{situation?.name ? ` — ${situation.name}` : isDemo ? ' — Nordalia conflict' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Actors</p>
            <p className="text-sm font-semibold text-navy-800">{actors.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Relationships</p>
            <p className="text-sm font-semibold text-navy-800">{relationships.length}</p>
          </div>
        </div>
      </div>

      {/* ── No data state for real users ──────────────────────────── */}
      {!hasData ? (
        <NoDataState
          toolName="Stakeholder Map"
          situationName={situation?.name ?? ''}
          creditCost={3}
          onGenerate={handleGenerateMap}
          loading={generatingMap}
        />
      ) : (
      <>
      {/* ── Tab toggle ───────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-[var(--color-app-border)] bg-white p-1.5 w-fit">
        <button
          onClick={() => setActiveTab('grid')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all',
            activeTab === 'grid' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700'
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Power-Interest Grid
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all',
            activeTab === 'matrix' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700'
          )}
        >
          <Grid3X3 className="h-4 w-4" />
          Relationship Matrix
        </button>
      </div>

      {/* ── Main content area ────────────────────────────────────── */}
      <div className="flex gap-6">
        {/* Left: Map / Matrix */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
            {activeTab === 'grid' && (
              <>
                <div className="border-b border-[var(--color-app-border)] px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-navy-800">Mendelow Power-Interest Matrix</p>
                    <p className="text-[10px] text-navy-500 mt-0.5">
                      Bubble size = number of relationships. Click a bubble to view actor profile.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-navy-400">
                    {actors.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedActorId(selectedActorId === a.id ? null : a.id)}
                        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                        <span>{a.name.split(' ').slice(0, 1).join('')}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <PowerInterestGrid
                    actors={actors}
                    onSelectActor={setSelectedActorId}
                    selectedId={selectedActorId}
                  />
                </div>
              </>
            )}

            {activeTab === 'matrix' && (
              <>
                <div className="border-b border-[var(--color-app-border)] px-5 py-3">
                  <p className="text-xs font-semibold text-navy-800">Actor Relationship Matrix</p>
                  <p className="text-[10px] text-navy-500 mt-0.5">
                    Cell color = relationship type. Number = strength (1–10). Hover for details. Click row actor to view profile.
                  </p>
                </div>
                <div className="p-4">
                  <RelationshipMatrix actors={actors} relationships={relationships} onSelectActor={setSelectedActorId} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="w-80 shrink-0 space-y-4">
          {selectedActorId ? (
            <ActorDetailPanel
              actors={actors}
              relationships={relationships}
              actorId={selectedActorId}
              onClose={() => setSelectedActorId(null)}
              liveInsight={liveInsights[selectedActorId] ?? ''}
              loadingInsightId={loadingInsightId}
              onGenerateInsight={generateInsight}
            />
          ) : (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-app-surface-alt)]">
                <Users className="h-6 w-6 text-navy-300" />
              </div>
              <p className="text-sm font-semibold text-navy-700">Select an Actor</p>
              <p className="mt-1.5 text-xs text-navy-500 leading-relaxed">
                Click any actor bubble or row label to view their profile, relationships, and AI strategic intelligence analysis.
              </p>
            </div>
          )}

          {/* Quick stats */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-3">Relationship Network</p>
            <div className="space-y-2">
              {Object.entries(REL_COLORS).map(([type, color]) => {
                const count = relationships.filter(r => r.type === type).length;
                if (count === 0) return null;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-navy-600 flex-1">{REL_LABELS[type as RelType]}</span>
                    <span className="text-xs font-semibold text-navy-800 font-mono">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Coalition & Spoiler Analysis ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Coalition Analysis */}
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-diplomatic-blue" />
              <h3 className="text-sm font-semibold text-navy-900">Coalition Analysis</h3>
            </div>
            <button
              onClick={analyzeCoalitions}
              disabled={loadingCoalition}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                loadingCoalition
                  ? 'border-diplomatic-blue/20 bg-diplomatic-blue/5 text-diplomatic-blue opacity-70 cursor-not-allowed'
                  : 'border-diplomatic-blue/20 bg-diplomatic-blue/5 text-diplomatic-blue hover:bg-diplomatic-blue/10'
              )}
            >
              {loadingCoalition ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {coalitionAnalysis ? 'Refresh' : 'Analyze Coalition Dynamics'}
            </button>
          </div>
          {coalitionAnalysis ? (
            <div className="prose prose-sm max-w-none text-xs text-navy-700">
              <MarkdownRenderer content={coalitionAnalysis} />
              {loadingCoalition && <span className="inline-block h-3 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />}
            </div>
          ) : (
            <p className="text-sm text-navy-400 text-center py-10">
              Generate AI analysis of actor coalitions, swing actors, and alignment stability.
            </p>
          )}
        </div>

        {/* Spoiler Analysis */}
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-crimson" />
              <h3 className="text-sm font-semibold text-navy-900">Spoiler Analysis</h3>
            </div>
            <button
              onClick={analyzeSpoilers}
              disabled={loadingSpoiler}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                loadingSpoiler
                  ? 'border-crimson/20 bg-crimson/5 text-crimson opacity-70 cursor-not-allowed'
                  : 'border-crimson/20 bg-crimson/5 text-crimson hover:bg-crimson/10'
              )}
            >
              {loadingSpoiler ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
              {spoilerAnalysis ? 'Refresh' : 'Identify Potential Spoilers'}
            </button>
          </div>
          {spoilerAnalysis ? (
            <div className="prose prose-sm max-w-none text-xs text-navy-700">
              <MarkdownRenderer content={spoilerAnalysis} />
              {loadingSpoiler && <span className="inline-block h-3 w-0.5 animate-pulse bg-crimson ml-0.5" />}
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm text-navy-400">
                Stedman typology analysis: total, limited, and greedy spoilers.
              </p>
              <p className="text-xs text-navy-300">Management strategies and early warning indicators included.</p>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Priorities — populated from power-map API */}
      {engagementPriorities.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-diplomatic-blue" />
            <h3 className="text-sm font-semibold text-navy-900">Engagement Priorities</h3>
            <span className="ml-auto text-[10px] font-medium text-diplomatic-blue bg-diplomatic-blue/8 rounded-full px-2 py-0.5">
              Mitchell/Agle/Wood Framework
            </span>
          </div>
          <ol className="space-y-2">
            {engagementPriorities.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue/10 text-[10px] font-bold text-diplomatic-blue">
                  {i + 1}
                </span>
                <p className="text-xs text-navy-700 leading-relaxed">{p}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div ref={bottomRef} />
      </>
      )}
    </div>
  );
}
