'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useState } from 'react';
import {
  UsersRound,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Target,
  Eye,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActorType = 'state' | 'non_state_armed' | 'international' | 'regional' | 'civil_society' | 'private_sector' | 'media';
type StanceType = 'supporter' | 'opponent' | 'neutral' | 'spoiler' | 'mediator';
type RelType = 'alliance' | 'rivalry' | 'diplomatic' | 'support' | 'dependency' | 'proxy';

interface PMactor {
  id: string;
  name: string;
  shortName?: string;
  type: ActorType;
  power: number;
  interest: number;
  stance: StanceType;
  color: string;
  keyLeverage: string;
  engagementStrategy: string;
}

interface PMrelationship {
  from: string;
  to: string;
  type: RelType;
  strength: number;
  description: string;
}

interface PowerMapOutput {
  actors: PMactor[];
  relationships: PMrelationship[];
  quadrantSummary: {
    keyPlayers: string[];
    keepSatisfied: string[];
    keepInformed: string[];
    monitor: string[];
  };
  coalitionDynamics: string;
  spoilerRisks: string;
  engagementPriorities: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Lookup maps
// ─────────────────────────────────────────────────────────────────────────────

const ACTOR_TYPE_LABELS: Record<ActorType, string> = {
  state: 'State',
  non_state_armed: 'Non-State Armed',
  international: 'International Org',
  regional: 'Regional Org',
  civil_society: 'Civil Society',
  private_sector: 'Private Sector',
  media: 'Media',
};

const STANCE_STYLES: Record<StanceType, string> = {
  opponent: 'bg-red-100 text-red-700',
  supporter: 'bg-emerald-100 text-emerald-700',
  neutral: 'bg-slate-100 text-slate-600',
  spoiler: 'bg-orange-100 text-orange-700',
  mediator: 'bg-blue-100 text-blue-700',
};

const REL_TYPE_STYLES: Record<RelType, string> = {
  alliance: 'bg-emerald-100 text-emerald-700',
  rivalry: 'bg-red-100 text-red-700',
  diplomatic: 'bg-blue-100 text-blue-700',
  support: 'bg-green-100 text-green-700',
  dependency: 'bg-amber-100 text-amber-700',
  proxy: 'bg-purple-100 text-purple-700',
};

// ─────────────────────────────────────────────────────────────────────────────
// Demo data (mirrors API DEMO_RESPONSE)
// ─────────────────────────────────────────────────────────────────────────────

const NORDALIA_DEMO: PowerMapOutput = {
  actors: [
    { id: 'gov', name: 'Government of Nordalia (GoN)', shortName: 'GoN', type: 'state', power: 8, interest: 9, stance: 'opponent', color: '#1A2332', keyLeverage: 'Territorial control, international legitimacy, AFN military capacity', engagementStrategy: 'Manage closely — decision-maker with high stakes. Engage at ministerial level. Frame any concessions as sovereignty-preserving.' },
    { id: 'drm', name: 'Democratic Reform Movement', shortName: 'DRM', type: 'non_state_armed', power: 6, interest: 10, stance: 'opponent', color: '#A63D40', keyLeverage: 'Territorial control of Eastern Provinces, armed capacity, civilian support base', engagementStrategy: 'Manage closely — existential stakes. Engage through backchannel and international interlocutors. Address security guarantees first.' },
    { id: 'unmn', name: 'UN Mission Nordalia', shortName: 'UNMN', type: 'international', power: 7, interest: 8, stance: 'mediator', color: '#4B92DB', keyLeverage: 'International legitimacy, monitoring capacity, UNSC reporting mandate', engagementStrategy: 'Key player — coordinate all mediation efforts. Leverage UNSC mandate for pressure on both parties.' },
    { id: 'karovia', name: 'Republic of Karovia', shortName: 'Karovia', type: 'state', power: 8, interest: 7, stance: 'supporter', color: '#5B8C5A', keyLeverage: 'DRM material support, border access, regional influence', engagementStrategy: 'Keep satisfied — regional patron with material leverage over DRM. Critical for ceasefire compliance.' },
    { id: 'cso', name: 'Civil Society Coalition', shortName: 'CSO', type: 'civil_society', power: 3, interest: 8, stance: 'supporter', color: '#C8961E', keyLeverage: 'Public legitimacy, documentation capacity, diaspora networks', engagementStrategy: 'Keep informed — high interest but limited power. Consult regularly for ground-truth.' },
    { id: 'au', name: 'African Union PSC', shortName: 'AU', type: 'regional', power: 6, interest: 6, stance: 'neutral', color: '#4B6584', keyLeverage: 'Regional framework, peer pressure on member states, financial support for mediation', engagementStrategy: 'Keep satisfied — regional legitimizer. Engage to co-sponsor mediation framework.' },
  ],
  relationships: [
    { from: 'gov', to: 'drm', type: 'rivalry', strength: 9, description: 'Armed conflict since 2025; ceasefire fragile' },
    { from: 'karovia', to: 'drm', type: 'support', strength: 7, description: 'Material support, suspected weapons transfers' },
    { from: 'unmn', to: 'gov', type: 'diplomatic', strength: 6, description: 'Mission mandate; GoN tolerates but resists monitoring' },
    { from: 'unmn', to: 'drm', type: 'diplomatic', strength: 5, description: 'Backchannel engagement; DRM seeks international recognition' },
    { from: 'au', to: 'unmn', type: 'alliance', strength: 7, description: 'Joint mediation co-sponsorship' },
    { from: 'cso', to: 'gov', type: 'rivalry', strength: 5, description: 'Human rights accountability demands' },
  ],
  quadrantSummary: {
    keyPlayers: ['gov', 'drm', 'unmn'],
    keepSatisfied: ['karovia'],
    keepInformed: ['cso'],
    monitor: ['au'],
  },
  coalitionDynamics: 'Two primary blocs are consolidating: (1) GoN-Westmark aligned bloc seeking military solution and internationally-supervised DDR; (2) DRM-Karovia bloc seeking autonomy agreement with revenue-sharing. The AU and UNMN occupy a contested middle ground. Civil society is aligned with DRM goals but not DRM methods.',
  spoilerRisks: 'Primary spoiler risk: GoN hardliners in the military establishment who benefit from resource extraction in contested territory and oppose any political settlement. Secondary risk: DRM commanders with criminal networks in eastern provinces. Neutralization: targeted financial accountability measures; UN Security Council travel ban designations.',
  engagementPriorities: [
    'Secure Karovian commitment to halt material support to DRM as precondition for formal talks',
    'Engage GoN at Foreign Minister level on security guarantee framework for DRM leadership',
    'Activate AU-UNMN joint mediation framework with dedicated shuttle diplomacy track',
    'Brief CSO leadership on mediation process to maintain public legitimacy',
    'Propose confidence-building measure: joint GoN-DRM prisoner release facilitated by ICRC',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Power/Interest Matrix (SVG)
// ─────────────────────────────────────────────────────────────────────────────

// SVG plot area coordinates
const PLOT = { x: 52, y: 24, w: 380, h: 280 };
const SVG_W = PLOT.x + PLOT.w + 32;
const SVG_H = PLOT.y + PLOT.h + 40;

function toSvgX(interest: number): number {
  return PLOT.x + ((interest - 1) / 9) * PLOT.w;
}
function toSvgY(power: number): number {
  return PLOT.y + (1 - (power - 1) / 9) * PLOT.h;
}

const midX = toSvgX(5.5);
const midY = toSvgY(5.5);

interface MatrixProps {
  actors: PMactor[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

function PowerInterestMatrix({ actors, hoveredId, onHover }: MatrixProps) {
  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-full"
        style={{ minWidth: 340 }}
      >
        {/* Quadrant fills */}
        <rect x={midX} y={PLOT.y} width={PLOT.x + PLOT.w - midX} height={midY - PLOT.y} fill="#10B981" fillOpacity={0.06} />
        <rect x={PLOT.x} y={PLOT.y} width={midX - PLOT.x} height={midY - PLOT.y} fill="#E8B931" fillOpacity={0.07} />
        <rect x={midX} y={midY} width={PLOT.x + PLOT.w - midX} height={PLOT.y + PLOT.h - midY} fill="#4B92DB" fillOpacity={0.06} />
        <rect x={PLOT.x} y={midY} width={midX - PLOT.x} height={PLOT.y + PLOT.h - midY} fill="#94a3b8" fillOpacity={0.05} />

        {/* Border */}
        <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} fill="none" stroke="#e2e8f0" strokeWidth={1} />

        {/* Midpoint lines */}
        <line x1={midX} y1={PLOT.y} x2={midX} y2={PLOT.y + PLOT.h} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
        <line x1={PLOT.x} y1={midY} x2={PLOT.x + PLOT.w} y2={midY} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />

        {/* Quadrant labels */}
        <text x={midX + (PLOT.x + PLOT.w - midX) / 2} y={PLOT.y + 14} textAnchor="middle" fill="#10B981" fontSize={9} fontWeight={600}>KEY PLAYERS</text>
        <text x={PLOT.x + (midX - PLOT.x) / 2} y={PLOT.y + 14} textAnchor="middle" fill="#B8921A" fontSize={9} fontWeight={600}>KEEP SATISFIED</text>
        <text x={midX + (PLOT.x + PLOT.w - midX) / 2} y={PLOT.y + PLOT.h - 8} textAnchor="middle" fill="#4B92DB" fontSize={9} fontWeight={600}>KEEP INFORMED</text>
        <text x={PLOT.x + (midX - PLOT.x) / 2} y={PLOT.y + PLOT.h - 8} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight={600}>MONITOR</text>

        {/* Axis labels */}
        <text x={PLOT.x + PLOT.w / 2} y={SVG_H - 4} textAnchor="middle" fill="#64748b" fontSize={10}>Interest →</text>
        <text
          x={14}
          y={PLOT.y + PLOT.h / 2}
          textAnchor="middle"
          fill="#64748b"
          fontSize={10}
          transform={`rotate(-90, 14, ${PLOT.y + PLOT.h / 2})`}
        >
          Power ↑
        </text>

        {/* Axis ticks */}
        {[1, 3, 5, 7, 9, 10].map((v) => (
          <g key={`xt-${v}`}>
            <text x={toSvgX(v)} y={PLOT.y + PLOT.h + 14} textAnchor="middle" fill="#94a3b8" fontSize={8}>{v}</text>
          </g>
        ))}
        {[1, 3, 5, 7, 9, 10].map((v) => (
          <g key={`yt-${v}`}>
            <text x={PLOT.x - 6} y={toSvgY(v) + 3} textAnchor="end" fill="#94a3b8" fontSize={8}>{v}</text>
          </g>
        ))}

        {/* Actor dots */}
        {actors.map((actor) => {
          const cx = toSvgX(actor.interest);
          const cy = toSvgY(actor.power);
          const r = 6 + (actor.power / 10) * 7;
          const isHovered = hoveredId === actor.id;
          const labelRight = cx < PLOT.x + PLOT.w * 0.75;
          const label = (actor.shortName ?? actor.name.split(' ')[0]).slice(0, 10);
          const labelX = labelRight ? cx + r + 3 : cx - r - 3;
          const labelAnchor = labelRight ? 'start' : 'end';

          return (
            <g
              key={actor.id}
              onMouseEnter={() => onHover(actor.id)}
              onMouseLeave={() => onHover(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? r + 2 : r}
                fill={actor.color}
                fillOpacity={isHovered ? 0.9 : 0.75}
                stroke={isHovered ? '#0F172A' : '#fff'}
                strokeWidth={isHovered ? 2 : 1.5}
                style={{ transition: 'all 0.15s ease' }}
              />
              <text
                x={labelX}
                y={cy + 3}
                textAnchor={labelAnchor}
                fill="#1e293b"
                fontSize={8.5}
                fontWeight={isHovered ? 700 : 500}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Actor Tooltip / Detail Card
// ─────────────────────────────────────────────────────────────────────────────

function ActorDetailCard({ actor }: { actor: PMactor }) {
  return (
    <div className="rounded-lg border border-navy-100 bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-navy-900">{actor.name}</p>
          <p className="text-[10px] text-navy-400 uppercase tracking-wide">{ACTOR_TYPE_LABELS[actor.type]}</p>
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', STANCE_STYLES[actor.stance])}>
          {actor.stance}
        </span>
      </div>
      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-navy-400">Power</span>
          <p className="font-bold text-navy-800">{actor.power}/10</p>
        </div>
        <div>
          <span className="text-navy-400">Interest</span>
          <p className="font-bold text-navy-800">{actor.interest}/10</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide">Key Leverage</p>
        <p className="text-xs text-navy-700 mt-0.5">{actor.keyLeverage}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide">Engagement Strategy</p>
        <p className="text-xs text-navy-700 mt-0.5">{actor.engagementStrategy}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Relationship List
// ─────────────────────────────────────────────────────────────────────────────

function RelationshipList({ relationships, actors }: { relationships: PMrelationship[]; actors: PMactor[] }) {
  const actorById = Object.fromEntries(actors.map((a) => [a.id, a]));
  return (
    <div className="space-y-2">
      {relationships.map((rel, i) => {
        const from = actorById[rel.from];
        const to = actorById[rel.to];
        return (
          <div key={i} className="rounded-lg border border-navy-100 bg-white p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {from && (
                <span className="flex items-center gap-1 text-xs font-medium text-navy-700">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: from.color }} />
                  {from.shortName ?? from.name.split(' ')[0]}
                </span>
              )}
              <ArrowRight className="h-3 w-3 text-navy-300 shrink-0" />
              {to && (
                <span className="flex items-center gap-1 text-xs font-medium text-navy-700">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: to.color }} />
                  {to.shortName ?? to.name.split(' ')[0]}
                </span>
              )}
              <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold', REL_TYPE_STYLES[rel.type])}>
                {rel.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-navy-400 shrink-0">Strength {rel.strength}/10</span>
              <div className="h-1.5 flex-1 rounded-full bg-navy-100">
                <div className="h-full rounded-full bg-diplomatic-blue" style={{ width: `${rel.strength * 10}%` }} />
              </div>
            </div>
            <p className="text-[11px] text-navy-500">{rel.description}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quadrant Cards
// ─────────────────────────────────────────────────────────────────────────────

const QUADRANT_META = [
  {
    key: 'keyPlayers' as const,
    label: 'Key Players',
    icon: Target,
    description: 'High power · High interest — manage closely',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50/60',
    iconColor: 'text-emerald-600',
    labelColor: 'text-emerald-700',
  },
  {
    key: 'keepSatisfied' as const,
    label: 'Keep Satisfied',
    icon: Activity,
    description: 'High power · Low interest — prevent escalation to opposition',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50/60',
    iconColor: 'text-amber-600',
    labelColor: 'text-amber-700',
  },
  {
    key: 'keepInformed' as const,
    label: 'Keep Informed',
    icon: Eye,
    description: 'Low power · High interest — prevent grievance coalition-building',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50/60',
    iconColor: 'text-blue-600',
    labelColor: 'text-blue-700',
  },
  {
    key: 'monitor' as const,
    label: 'Monitor',
    icon: AlertTriangle,
    description: 'Low power · Low interest — periodic check-in sufficient',
    borderColor: 'border-slate-300',
    bgColor: 'bg-slate-50/60',
    iconColor: 'text-slate-500',
    labelColor: 'text-slate-600',
  },
];

function QuadrantCards({ quadrantSummary, actors }: { quadrantSummary: PowerMapOutput['quadrantSummary']; actors: PMactor[] }) {
  const actorById = Object.fromEntries(actors.map((a) => [a.id, a]));
  return (
    <div className="grid grid-cols-2 gap-3">
      {QUADRANT_META.map((q) => {
        const ids = quadrantSummary[q.key];
        const Icon = q.icon;
        return (
          <div key={q.key} className={cn('rounded-xl border p-4 space-y-2', q.borderColor, q.bgColor)}>
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', q.iconColor)} />
              <span className={cn('text-xs font-semibold', q.labelColor)}>{q.label}</span>
            </div>
            <p className="text-[10px] text-navy-500">{q.description}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ids.length === 0 && <span className="text-[10px] text-navy-400 italic">None assigned</span>}
              {ids.map((id) => {
                const actor = actorById[id];
                if (!actor) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: actor.color }}
                  >
                    {actor.shortName ?? actor.name.split(' ')[0]}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible Analysis Section
// ─────────────────────────────────────────────────────────────────────────────

function AnalysisSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-navy-100 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-navy-800">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-navy-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-navy-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-navy-100 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Methodology Panel
// ─────────────────────────────────────────────────────────────────────────────

function Methodology() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-navy-100 bg-navy-50/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <Info className="h-4 w-4 text-diplomatic-blue" />
        <span className="text-xs font-semibold text-navy-600">Methodology: Barnett-Duvall Power Framework</span>
        {open ? (
          <ChevronUp className="ml-auto h-4 w-4 text-navy-400" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4 text-navy-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-navy-100 px-4 py-4 space-y-3 text-[11px] text-navy-600 leading-relaxed">
          <p>
            Power is disaggregated into four dimensions (Barnett &amp; Duvall 2005): <strong>Compulsory</strong> — direct coercive capacity; <strong>Institutional</strong> — control over rules and procedures; <strong>Structural</strong> — positional advantages in global structures; <strong>Productive</strong> — discursive authority and norm-setting.
          </p>
          <p>
            Stakeholder classification applies the Mitchell-Agle-Wood (1997) typology: power, legitimacy, and urgency scores determine salience type (dormant, discretionary, demanding, dominant, dangerous, dependent, definitive). Quadrant placement follows Mendelow (1991) Power-Interest Grid strategy.
          </p>
          <p>
            Spoiler risk assessment applies Stedman (1997) spoiler typology — limited, greedy, and total spoilers — with management strategies calibrated per type.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main UI
// ─────────────────────────────────────────────────────────────────────────────

function PowerMapContent({ output }: { output: PowerMapOutput }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredActor = hoveredId ? output.actors.find((a) => a.id === hoveredId) ?? null : null;

  return (
    <div className="space-y-6">
      {/* Matrix + Relationships */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Matrix */}
        <div className="rounded-xl border border-navy-100 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy-800">Power / Interest Matrix</h2>
            <span className="text-[10px] text-navy-400">{output.actors.length} actors · hover to inspect</span>
          </div>
          <PowerInterestMatrix actors={output.actors} hoveredId={hoveredId} onHover={setHoveredId} />
          {/* Hovered actor detail */}
          {hoveredActor && (
            <div className="border-t border-navy-100 pt-3">
              <ActorDetailCard actor={hoveredActor} />
            </div>
          )}
          {!hoveredActor && (
            <div className="rounded-lg border border-navy-100 bg-navy-50/50 px-4 py-3">
              <p className="text-[11px] text-navy-400 text-center">Hover over a circle to see actor details</p>
            </div>
          )}
        </div>

        {/* Right: Relationships */}
        <div className="space-y-4">
          <div className="rounded-xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-semibold text-navy-800 mb-3">Relationships ({output.relationships.length})</h2>
            <RelationshipList relationships={output.relationships} actors={output.actors} />
          </div>
        </div>
      </div>

      {/* Quadrant Summary */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-navy-800">Quadrant Classification</h2>
        <QuadrantCards quadrantSummary={output.quadrantSummary} actors={output.actors} />
      </div>

      {/* Analysis sections */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-navy-800">Analysis</h2>
        <AnalysisSection title="Coalition Dynamics" defaultOpen>
          <p className="text-[11px] text-navy-600 leading-relaxed">{output.coalitionDynamics}</p>
        </AnalysisSection>
        <AnalysisSection title="Spoiler Risks">
          <p className="text-[11px] text-navy-600 leading-relaxed">{output.spoilerRisks}</p>
        </AnalysisSection>
        <AnalysisSection title="Engagement Priorities" defaultOpen>
          <ol className="space-y-2">
            {output.engagementPriorities.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-[11px] text-navy-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue/10 text-[10px] font-bold text-diplomatic-blue">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ol>
        </AnalysisSection>
      </div>

      {/* Actor roster */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-navy-800">Actor Roster</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {output.actors.map((actor) => (
            <ActorDetailCard key={actor.id} actor={actor} />
          ))}
        </div>
      </div>

      <Methodology />
    </div>
  );
}

function PowerMapUI({ initialOutput, isDemo }: { initialOutput: PowerMapOutput | null; isDemo: boolean }) {
  const [output, setOutput] = useState<PowerMapOutput | null>(initialOutput);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-diplomatic-blue/8">
          <UsersRound className="h-5 w-5 text-diplomatic-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Power Map</h1>
          <p className="text-sm text-navy-500">
            Barnett-Duvall power analysis · Mitchell-Agle-Wood stakeholder salience
            {isDemo && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                DEMO — Nordalia Crisis
              </span>
            )}
          </p>
        </div>
      </div>

      <RegistryToolInfo toolId="power-map" />
      <AiPopulate
        toolId="power-map"
        toolName="Power Map"
        apiEndpoint="/api/ai/power-map"
        creditCost={3}
        hasExistingData={!!output}
        onDataGenerated={(raw) => setOutput(raw as PowerMapOutput)}
      >
        {output && <PowerMapContent output={output} />}
      </AiPopulate>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page variants
// ─────────────────────────────────────────────────────────────────────────────

function DemoPowerMapPage() {
  return <PowerMapUI initialOutput={NORDALIA_DEMO} isDemo />;
}

function RealPowerMapPage({
  persisted,
}: {
  situation: Situation;
  persisted: ReturnType<typeof usePersistedToolData>;
}) {
  const initialOutput = (persisted.data as PowerMapOutput | null) ?? null;
  return <PowerMapUI initialOutput={initialOutput} isDemo={false} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default export — guard pattern
// ─────────────────────────────────────────────────────────────────────────────

export default function PowerMapPage() {
  const guard = useSituationGuard();
  const persisted = usePersistedToolData(
    'power-map',
    guard.isDemo ? undefined : (guard.situation?.id ?? undefined)
  );
  const { hasData, loading: firestoreLoading } = useToolData('power_map');
  const [regenerating, setRegenerating] = useState(false);

  if (guard.isDemo) {
    return <DemoPowerMapPage />;
  }

  if (guard.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-diplomatic-blue" />
      </div>
    );
  }

  if (guard.showGuard) {
    return <NoSituationState />;
  }

  async function handleRegenerate() {
    if (regenerating || !guard.situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/power-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: guard.situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {firestoreLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : hasData ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>
      <RealPowerMapPage situation={guard.situation!} persisted={persisted} />
    </div>
  );
}
