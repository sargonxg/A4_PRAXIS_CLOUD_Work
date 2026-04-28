'use client';

/**
 * SituationStatusStrip — first-screen at-a-glance for the active situation.
 * Renders a compact horizontal strip with name, region, domain, risk score,
 * Glasl stage, escalation trend, document/entity counts, and last-update.
 *
 * Mobile: stacks to two columns at sm.
 */

import { Activity, AlertTriangle, FileText, Network, MapPin } from 'lucide-react';
import type { Situation } from '@/types/situation';

interface Props {
  situation: Situation;
}

function trendArrow(trend?: string): string {
  if (trend === 'escalating') return '↑';
  if (trend === 'de-escalating') return '↓';
  return '→';
}

function trendColor(trend?: string): string {
  if (trend === 'escalating') return 'text-red-600';
  if (trend === 'de-escalating') return 'text-emerald-600';
  return 'text-amber-600';
}

function relativeDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function SituationStatusStrip({ situation }: Props) {
  const risk = typeof situation.riskScore === 'number' ? Math.round(situation.riskScore) : null;
  const stage = typeof situation.glaslStage === 'number' ? situation.glaslStage : null;

  const cells: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClass?: string;
    sub?: string;
  }> = [
    {
      icon: <MapPin className="h-3.5 w-3.5" />,
      label: 'Region',
      value: situation.region || 'Unspecified',
      sub: situation.domain && situation.domain !== 'generic' ? situation.domain : undefined,
    },
    {
      icon: <Activity className="h-3.5 w-3.5" />,
      label: 'Risk',
      value: risk !== null ? `${risk}` : '—',
      valueClass: risk !== null && risk >= 65 ? 'text-red-600' : risk !== null && risk >= 35 ? 'text-amber-600' : 'text-emerald-600',
      sub: stage !== null ? `Glasl ${stage}` : undefined,
    },
    {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: 'Trend',
      value: situation.escalationTrend
        ? `${trendArrow(situation.escalationTrend)} ${situation.escalationTrend.replace('-', ' ')}`
        : '—',
      valueClass: trendColor(situation.escalationTrend),
    },
    {
      icon: <Network className="h-3.5 w-3.5" />,
      label: 'Graph',
      value: situation.graphEntities ? `${situation.graphEntities}` : '0',
      sub: situation.actorCount ? `${situation.actorCount} actors` : 'no actors',
    },
    {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: 'Docs',
      value: situation.documentCount ? `${situation.documentCount}` : '0',
      sub: relativeDate(situation.updatedAt),
    },
  ];

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-navy-950/5"
      aria-label="Situation status"
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {cells.map((c) => (
          <div key={c.label} className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 shrink-0 rounded-md bg-diplomatic-blue/10 p-1.5 text-diplomatic-blue">
              {c.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{c.label}</p>
              <p className={`truncate text-sm font-semibold ${c.valueClass ?? 'text-navy-900'}`}>{c.value}</p>
              {c.sub ? <p className="truncate text-[11px] text-navy-500">{c.sub}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
