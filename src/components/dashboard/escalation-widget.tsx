'use client';

import { AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { WidgetShell } from './widget-shell';
import type { Situation, EscalationTrend } from '@/types/situation';

const GLASL_STAGE_NAMES = [
  'Hardening',
  'Debate & Polemics',
  'Actions Not Words',
  'Coalitions',
  'Loss of Face',
  'Threat Strategies',
  'Limited Destruction',
  'Fragmentation',
  'Together Into Abyss',
];

const GLASL_ZONES: Array<{ start: number; color: string; label: string }> = [
  { start: 1, color: '#10B981', label: 'Win–Win' },
  { start: 4, color: '#F59E0B', label: 'Lose–Lose' },
  { start: 7, color: '#EF4444', label: 'No Return' },
];

function zoneForStage(stage: number) {
  if (stage >= 7) return GLASL_ZONES[2];
  if (stage >= 4) return GLASL_ZONES[1];
  return GLASL_ZONES[0];
}

function trendIcon(trend: EscalationTrend) {
  if (trend === 'escalating') return <TrendingUp className="h-4 w-4 text-crimson" />;
  if (trend === 'de-escalating') return <TrendingDown className="h-4 w-4 text-sage" />;
  if (trend === 'volatile') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <Minus className="h-4 w-4 text-slate-500" />;
}

function trendCopy(trend: EscalationTrend): string {
  switch (trend) {
    case 'escalating': return 'Climbing the ladder';
    case 'de-escalating': return 'Stepping down';
    case 'volatile': return 'Unstable — oscillating';
    case 'stable':
    default: return 'Holding at current stage';
  }
}

interface EscalationWidgetProps {
  situation: Situation;
}

export function EscalationWidget({ situation }: EscalationWidgetProps) {
  const rawStage = situation.glaslStage;
  const hasStage = typeof rawStage === 'number' && rawStage >= 1 && rawStage <= 9;
  const stage = hasStage ? rawStage! : null;
  const zone = stage ? zoneForStage(stage) : null;
  const trend = situation.escalationTrend ?? 'stable';

  return (
    <WidgetShell
      title="Escalation stage"
      subtitle="Glasl 9-stage model"
      href="/early-warning"
      icon={<AlertTriangle className="h-4 w-4" />}
    >
      {!stage ? (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-sm text-slate-400">No scan yet</span>
          <span className="text-xs text-slate-500">Run Early-Warning to classify.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-xs font-semibold"
              style={{ background: `${zone!.color}22`, color: zone!.color }}
            >
              Stage {stage} · {zone!.label}
            </span>
          </div>
          <div className="text-sm font-medium text-slate-200">{GLASL_STAGE_NAMES[stage - 1]}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {trendIcon(trend)} <span>{trendCopy(trend)}</span>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
