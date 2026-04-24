'use client';

import { Activity } from 'lucide-react';
import { RiskGauge } from '@/components/visualizations/risk-gauge';
import { WidgetShell } from './widget-shell';
import type { Situation } from '@/types/situation';

interface RiskGaugeWidgetProps {
  situation: Situation;
}

function riskLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Severe', color: 'text-crimson' };
  if (score >= 60) return { label: 'High', color: 'text-orange-400' };
  if (score >= 30) return { label: 'Elevated', color: 'text-gold-500' };
  return { label: 'Low', color: 'text-sage' };
}

export function RiskGaugeWidget({ situation }: RiskGaugeWidgetProps) {
  const score = typeof situation.riskScore === 'number' && isFinite(situation.riskScore)
    ? Math.round(situation.riskScore)
    : 0;
  const { label, color } = riskLabel(score);

  return (
    <WidgetShell
      title="Risk composite"
      subtitle="INFORM-style multi-dimensional"
      href="/risk-monitor"
      icon={<Activity className="h-4 w-4" />}
    >
      <div className="flex items-center gap-3">
        <RiskGauge score={score} size="sm" showValue />
        <div className="flex flex-col min-w-0">
          <span className={`text-lg font-semibold ${color}`}>{label}</span>
          <span className="text-xs text-slate-500">
            {situation.lastAiRefresh
              ? `Refreshed ${new Date(situation.lastAiRefresh).toLocaleDateString()}`
              : 'Not yet scored'}
          </span>
        </div>
      </div>
    </WidgetShell>
  );
}
