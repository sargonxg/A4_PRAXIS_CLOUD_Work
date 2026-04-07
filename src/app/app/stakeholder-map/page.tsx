'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { NoDataState } from '@/components/praxis/no-data-state';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Loader2,
  Grid3X3,
  BarChart3,
  Target,
  AlertTriangle,
  Network,
  Search,
  X,
  ExternalLink,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import { ForceGraph } from '@/components/visualizations/force-graph';
import { PraxisLink } from '@/components/shared/praxis-link';
import { db } from '@/lib/firebase/config';
import { onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth/auth-context';

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

// Colors for ForceGraph colorByType
const ACTOR_TYPE_COLORS: Record<string, string> = {
  'state':         '#1A2332',
  'armed-group':   '#A63D40',
  'civil-society': '#10B981',
  'international': '#8B5CF6',
};

// Map relationship type to ForceGraph edge type label
const REL_TYPE_TO_EDGE_TYPE: Record<string, string> = {
  alliance:   'alliance',
  rivalry:    'conflict',
  diplomatic: 'negotiation',
  support:    'support',
};

// ─── Edge Type Legend ──────────────────────────────────────────────────────────

function EdgeLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1.5">
        <div className="h-px w-6 bg-emerald-500" />
        <span className="text-[10px] text-navy-600 font-medium">Alliance</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-px w-6 bg-red-500" />
        <span className="text-[10px] text-navy-600 font-medium">Conflict</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-px w-6 border-b border-dashed border-amber-500" />
        <span className="text-[10px] text-navy-600 font-medium">Negotiation</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-px w-6 bg-blue-500" />
        <span className="text-[10px] text-navy-600 font-medium">Support</span>
      </div>
    </div>
  );
}

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
        <rect x={PAD_LEFT} y={MID_Y} width={PLOT_W / 2} height={PLOT_H / 2} fill="#F1F5F9" fillOpacity="0.8" />
        <rect x={MID_X} y={MID_Y} width={PLOT_W / 2} height={PLOT_H / 2} fill="#EFF6FF" fillOpacity="0.9" />
        <rect x={PAD_LEFT} y={PAD_TOP} width={PLOT_W / 2} height={PLOT_H / 2} fill="#FEFCE8" fillOpacity="0.9" />
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

// ─── Node Details Panel (shown when a ForceGraph node is clicked) ─────────────

function NodeDetailsPanel({
  actor,
  actors,
  relationships,
  liveInsight,
  loadingInsightId,
  onGenerateInsight,
  onClose,
}: {
  actor: StakeholderActor;
  actors: StakeholderActor[];
  relationships: StakeholderRelationship[];
  liveInsight: string;
  loadingInsightId: string | null;
  onGenerateInsight: (actorId: string) => void;
  onClose: () => void;
}) {
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
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize mt-1"
              style={{ backgroundColor: `${actor.color}15`, color: actor.color }}
            >
              {TYPE_LABELS[actor.type] ?? actor.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-navy-400 hover:text-navy-600 p-1 rounded-md hover:bg-white/50 transition-colors"
        >
          <X className="h-4 w-4" />
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
            {actorRels.length === 0 && (
              <p className="text-xs text-navy-400 text-center py-2">No relationships mapped.</p>
            )}
          </div>
        </div>

        {/* Quick action: Generate Actor Brief */}
        <PraxisLink
          href="/actor-profiles"
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-2.5 text-xs font-medium text-diplomatic-blue hover:bg-diplomatic-blue/10 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Generate Actor Brief
        </PraxisLink>

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

// ─── Actor Detail Panel (used in non-graph tabs) ───────────────────────────────

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

  return (
    <NodeDetailsPanel
      actor={actor}
      actors={actors}
      relationships={relationships}
      liveInsight={liveInsight}
      loadingInsightId={loadingInsightId}
      onGenerateInsight={onGenerateInsight}
      onClose={onClose}
    />
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

type TabType = 'network' | 'grid' | 'matrix';

// ─── Graph Snapshot Types ─────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  primitive_type: string;
  faction?: string;
  [key: string]: unknown;
}

interface GraphEdge {
  source: string;
  target: string;
  [key: string]: unknown;
}

interface GraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function StakeholderMapPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  const { user } = useAuth();
  const { hasData: firestoreHasData, loading: firestoreLoading } = useToolData('stakeholder_map');
  const [regenerating, setRegenerating] = useState(false);

  // ─── Graph snapshot from Firestore (Python backend writes here) ────────────
  const [graphSnapshot, setGraphSnapshot] = useState<GraphSnapshot | null>(null);

  useEffect(() => {
    const uid = user?.id;
    const sitId = situation?.id;
    if (!uid || !sitId || isDemo) return;
    const ref = doc(db, 'users', uid, 'situations', sitId, 'graph', 'snapshot');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setGraphSnapshot(snap.data() as GraphSnapshot);
      }
    });
    return unsub;
  }, [user?.id, situation?.id, isDemo]);

  // Filter only Actor primitive_type nodes
  const graphActors = useMemo(() => {
    if (!graphSnapshot?.nodes) return [];
    return graphSnapshot.nodes.filter((n) => n.primitive_type === 'Actor');
  }, [graphSnapshot]);

  // Count edges per actor id
  const actorEdgeCount = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!graphSnapshot?.edges) return counts;
    for (const e of graphSnapshot.edges) {
      counts[e.source] = (counts[e.source] ?? 0) + 1;
      counts[e.target] = (counts[e.target] ?? 0) + 1;
    }
    return counts;
  }, [graphSnapshot]);

  // ─── Persistence ──────────────────────────────────────────────────────────
  const persisted = usePersistedToolData('stakeholder-map', situation?.id);

  // ─── Dynamic state: demo uses hardcoded data, real starts empty ────────────
  const [actors, setActors] = useState<StakeholderActor[]>(isDemo ? DEMO_ACTORS : []);
  const [relationships, setRelationships] = useState<StakeholderRelationship[]>(isDemo ? DEMO_RELATIONSHIPS : []);
  const [generatingMap, setGeneratingMap] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('network');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [liveInsights, setLiveInsights] = useState<Record<string, string>>({});
  const [loadingInsightId, setLoadingInsightId] = useState<string | null>(null);
  const [coalitionAnalysis, setCoalitionAnalysis] = useState('');
  const [loadingCoalition, setLoadingCoalition] = useState(false);
  const [spoilerAnalysis, setSpoilerAnalysis] = useState('');
  const [loadingSpoiler, setLoadingSpoiler] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ─── Search/filter for ForceGraph ─────────────────────────────────────────
  const [graphSearch, setGraphSearch] = useState('');

  const [quadrantSummary, setQuadrantSummary] = useState<{
    keyPlayers: string[]; keepSatisfied: string[]; keepInformed: string[]; monitor: string[];
  } | null>(isDemo ? { keyPlayers: ['gov', 'drm', 'unmn'], keepSatisfied: ['karovia'], keepInformed: ['cso'], monitor: ['au'] } : null);
  const [engagementPriorities, setEngagementPriorities] = useState<string[]>([]);

  const hasData = actors.length > 0;

  // ─── Restore persisted data on mount ──────────────────────────────────────
  useEffect(() => {
    if (!persisted.data || isDemo) return;
    const d = persisted.data as {
      actors?: StakeholderActor[];
      relationships?: StakeholderRelationship[];
      quadrantSummary?: { keyPlayers: string[]; keepSatisfied: string[]; keepInformed: string[]; monitor: string[] };
      coalitionDynamics?: string;
      spoilerRisks?: string;
      engagementPriorities?: string[];
    };
    if (Array.isArray(d.actors) && d.actors.length > 0) setActors(d.actors);
    if (Array.isArray(d.relationships)) setRelationships(d.relationships);
    if (d.quadrantSummary) setQuadrantSummary(d.quadrantSummary);
    if (d.coalitionDynamics) setCoalitionAnalysis(d.coalitionDynamics);
    if (d.spoilerRisks) setSpoilerAnalysis(d.spoilerRisks);
    if (Array.isArray(d.engagementPriorities)) setEngagementPriorities(d.engagementPriorities);
  }, [persisted.data, isDemo]);

  // ─── Auto-generate on first visit if no data exists ──────────────────────
  useEffect(() => {
    if (isDemo || persisted.isLoading || hasData || generatingMap) return;
    handleGenerateMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, persisted.isLoading, hasData]);

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

      persisted.save(data);
    } catch {
      // Silent fail — user can retry
    } finally {
      setGeneratingMap(false);
    }
  }, [generatingMap, situation, persisted]);

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

  // ─── ForceGraph node/edge mapping ─────────────────────────────────────────

  const forceNodes = useMemo(() => {
    const q = graphSearch.toLowerCase().trim();
    return actors.map(a => ({
      id: a.id,
      label: a.name,
      type: a.type,
      size: 8 + a.relationships * 2,
      data: {
        power: a.power,
        interest: a.interest,
        relationships: a.relationships,
        dimmed: q.length > 0 && !a.name.toLowerCase().includes(q),
      } as Record<string, unknown>,
    }));
  }, [actors, graphSearch]);

  const forceEdges = useMemo(() => {
    return relationships.map(r => ({
      source: r.from,
      target: r.to,
      label: REL_LABELS[r.type as RelType] ?? r.type,
      type: REL_TYPE_TO_EDGE_TYPE[r.type] ?? r.type,
      weight: r.strength / 10,
    }));
  }, [relationships]);

  const handleForceNodeClick = useCallback((node: { id: string }) => {
    setSelectedActorId(prev => prev === node.id ? null : node.id);
  }, []);

  // Nodes visible to ForceGraph: when searching, only pass matching nodes
  const visibleForceNodes = useMemo(() => {
    const q = graphSearch.toLowerCase().trim();
    if (!q) return forceNodes;
    // Keep matching nodes + nodes connected to matching nodes (so graph context is preserved)
    const matchingIds = new Set(
      actors.filter(a => a.name.toLowerCase().includes(q)).map(a => a.id)
    );
    const connectedIds = new Set<string>();
    relationships.forEach(r => {
      if (matchingIds.has(r.from)) connectedIds.add(r.to);
      if (matchingIds.has(r.to)) connectedIds.add(r.from);
    });
    return forceNodes.filter(n => matchingIds.has(n.id) || connectedIds.has(n.id));
  }, [forceNodes, graphSearch, actors, relationships]);

  const visibleForceEdges = useMemo(() => {
    const nodeIds = new Set(visibleForceNodes.map(n => n.id));
    return forceEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [visibleForceNodes, forceEdges]);

  const selectedActor = selectedActorId ? actors.find(a => a.id === selectedActorId) ?? null : null;

  if (showGuard) return <NoSituationState />;

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
          {!isDemo && (
            firestoreLoading ? (
              <span className="inline-flex items-center gap-1 text-xs text-navy-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </span>
            ) : firestoreHasData ? (
              <button
                onClick={async () => {
                  if (regenerating || !situation) return;
                  setRegenerating(true);
                  try {
                    await fetch('/api/ai/stakeholder-map', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ situationId: situation.id }),
                    });
                  } finally { setRegenerating(false); }
                }}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
              >
                {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Regenerate
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (regenerating || !situation) return;
                  setRegenerating(true);
                  try {
                    await fetch('/api/ai/stakeholder-map', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ situationId: situation.id }),
                    });
                  } finally { setRegenerating(false); }
                }}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate with PRAXIS
              </button>
            )
          )}
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
      {/* ── Knowledge Graph Actors (from Python backend pipeline) ─── */}
      {!isDemo && graphActors.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-navy-900">Actors from Knowledge Graph</h3>
            <span className="ml-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              From Knowledge Graph
            </span>
            <span className="ml-auto text-[10px] text-navy-400">{graphActors.length} actors · {graphSnapshot?.edges?.length ?? 0} edges</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {graphActors.map((actor) => {
              const edgeCount = actorEdgeCount[actor.id] ?? 0;
              // Pick a stable faction color from a small palette
              const factionColors = ['#1A2332', '#A63D40', '#4B92DB', '#5B8C5A', '#C8961E', '#8395a7', '#8B5CF6'];
              const colorIdx = Math.abs(
                (actor.faction ?? actor.label ?? actor.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
              ) % factionColors.length;
              const factionColor = factionColors[colorIdx];

              return (
                <div
                  key={actor.id}
                  className="flex items-start gap-3 rounded-lg border border-white bg-white p-3 shadow-sm"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{ backgroundColor: factionColor }}
                  >
                    {String(actor.label ?? actor.id).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-navy-900">{actor.label ?? actor.id}</p>
                    {actor.faction && (
                      <p className="mt-0.5 truncate text-[10px] text-navy-500">{String(actor.faction)}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-navy-400">{edgeCount} connection{edgeCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab toggle ───────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-[var(--color-app-border)] bg-white p-1.5 w-fit">
        <button
          onClick={() => setActiveTab('network')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all',
            activeTab === 'network' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700'
          )}
        >
          <Network className="h-4 w-4" />
          Network Graph
        </button>
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
        {/* Left: Network / Grid / Matrix */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">

            {/* ── Network Graph Tab ─────────────────────────────── */}
            {activeTab === 'network' && (
              <>
                <div className="border-b border-[var(--color-app-border)] px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-navy-800">Stakeholder Network Graph</p>
                    <p className="text-[10px] text-navy-500 mt-0.5">
                      Force-directed map. Click a node to view actor details.
                    </p>
                  </div>
                  {/* Search filter */}
                  <div className="relative flex items-center">
                    <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-navy-400" />
                    <input
                      type="text"
                      value={graphSearch}
                      onChange={e => setGraphSearch(e.target.value)}
                      placeholder="Filter actors..."
                      className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] py-1.5 pl-8 pr-8 text-xs text-navy-800 placeholder-navy-400 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 w-44"
                    />
                    {graphSearch && (
                      <button
                        onClick={() => setGraphSearch('')}
                        className="absolute right-2 text-navy-400 hover:text-navy-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {visibleForceNodes.length === 0 ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                      <div className="text-center space-y-2">
                        <Search className="h-8 w-8 text-navy-300 mx-auto" />
                        <p className="text-sm font-semibold text-navy-600">No actors match &ldquo;{graphSearch}&rdquo;</p>
                        <button
                          onClick={() => setGraphSearch('')}
                          className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                        >
                          Clear filter
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ForceGraph
                      nodes={visibleForceNodes}
                      edges={visibleForceEdges}
                      height={400}
                      onNodeClick={handleForceNodeClick}
                      selectedNodeId={selectedActorId ?? undefined}
                      colorByType={ACTOR_TYPE_COLORS}
                    />
                  )}
                </div>
                {/* Edge type legend */}
                <div className="border-t border-[var(--color-app-border)] px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2">Edge Types</p>
                  <EdgeLegend />
                </div>
              </>
            )}

            {/* ── Power-Interest Grid Tab ───────────────────────── */}
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

            {/* ── Relationship Matrix Tab ───────────────────────── */}
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
          {selectedActor ? (
            <NodeDetailsPanel
              actor={selectedActor}
              actors={actors}
              relationships={relationships}
              liveInsight={liveInsights[selectedActor.id] ?? ''}
              loadingInsightId={loadingInsightId}
              onGenerateInsight={generateInsight}
              onClose={() => setSelectedActorId(null)}
            />
          ) : (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-app-surface-alt)]">
                <Users className="h-6 w-6 text-navy-300" />
              </div>
              <p className="text-sm font-semibold text-navy-700">Select an Actor</p>
              <p className="mt-1.5 text-xs text-navy-500 leading-relaxed">
                Click any actor node, bubble, or row label to view their profile, relationships, and AI strategic intelligence analysis.
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

          {/* Actor type legend */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-3">Actor Types</p>
            <div className="space-y-2">
              {Object.entries(ACTOR_TYPE_COLORS).map(([type, color]) => {
                const count = actors.filter(a => a.type === type).length;
                if (count === 0) return null;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-navy-600 flex-1">{TYPE_LABELS[type] ?? type}</span>
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

      {/* Quadrant summary if available */}
      {quadrantSummary && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-navy-500" />
            <h3 className="text-sm font-semibold text-navy-900">Quadrant Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Manage Closely', ids: quadrantSummary.keyPlayers, color: '#E11D48' },
              { label: 'Keep Satisfied', ids: quadrantSummary.keepSatisfied, color: '#CA8A04' },
              { label: 'Keep Informed', ids: quadrantSummary.keepInformed, color: '#60A5FA' },
              { label: 'Monitor', ids: quadrantSummary.monitor, color: '#94A3B8' },
            ].map(({ label, ids, color }) => (
              <div key={label} className="rounded-lg bg-[var(--color-app-surface-alt)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color }}>{label}</p>
                <div className="space-y-1">
                  {ids.map(id => {
                    const a = actors.find(x => x.id === id);
                    return a ? (
                      <button
                        key={id}
                        onClick={() => setSelectedActorId(id)}
                        className="block w-full text-left text-[11px] text-navy-700 hover:text-navy-900 font-medium truncate hover:underline"
                      >
                        {a.name}
                      </button>
                    ) : null;
                  })}
                  {ids.length === 0 && <p className="text-[10px] text-navy-400">None</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
      </>
      )}
    </div>
  );
}
