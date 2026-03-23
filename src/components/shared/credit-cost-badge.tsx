'use client';

import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const CREDIT_COSTS: Record<string, number> = {
  'ai_chat': 1,
  'ai_terminology': 1,
  'ai_scenario': 2,
  'ai_extract': 2,
  'ai_media': 2,
  'ai_talking_points': 2,
  'ai_grounded_search': 2,
  'ai_advisor_chat': 2,
  'ai_analysis': 3,
  'ai_research': 3,
  'ai_resolution': 3,
  'ai_web_crawl': 3,
  'ai_media_scan': 3,
  'ai_actor_enrichment': 3,
  'ai_escalation_scan': 3,
  'ai_mediation': 3,
  'ai_negotiation': 3,
  'ai_argus': 3,
  'ai_claude_analyze': 4,
  'ai_dossier': 4,
  'ai_briefing_generate': 4,
  'ai_morning_digest': 2,
  'ai_risk_assessment': 4,
  'ai_treaty_analyze': 4,
  'ai_sanctions_scan': 4,
  'ai_report': 5,
  'ai_deep_research': 5,
  'ai_dossier_generate': 5,
};

interface CreditCostBadgeProps {
  operation: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CreditCostBadge({ operation, className, size = 'sm' }: CreditCostBadgeProps) {
  const cost = CREDIT_COSTS[operation] || 1;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50/50',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        'font-medium text-emerald-700',
        className
      )}
      title={`This operation costs ${cost} TACITUS Credit${cost !== 1 ? 's' : ''}`}
    >
      <Coins className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {cost}
    </span>
  );
}

export function getCreditCost(operation: string): number {
  return CREDIT_COSTS[operation] || 1;
}
