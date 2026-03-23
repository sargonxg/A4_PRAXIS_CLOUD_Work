'use client';

import { SOURCE_CREDIBILITY, getCredibilityLevel } from '@/lib/data/source-credibility';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Shield, ShieldAlert, ShieldCheck, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SourceBadgeProps {
  source: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md';
}

function CredibilityIcon({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  switch (level) {
    case 'High':
      return <ShieldCheck className={className} />;
    case 'Moderate':
      return <Shield className={className} />;
    default:
      return <ShieldAlert className={className} />;
  }
}

export function SourceBadge({
  source,
  showTooltip = true,
  size = 'sm',
}: SourceBadgeProps) {
  const key = source.toUpperCase();
  const profile = SOURCE_CREDIBILITY[key] ?? SOURCE_CREDIBILITY[source];

  if (!profile) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-navy-700 bg-navy-800/50 px-2 py-0.5',
          size === 'sm' ? 'text-[10px]' : 'text-xs',
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-navy-500" />
        <span className="text-navy-400">{source}</span>
      </span>
    );
  }

  const credLevel = getCredibilityLevel(profile.credibility);
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-navy-700 bg-navy-800/60 px-2 py-0.5 transition-colors',
        showTooltip && 'cursor-help hover:border-navy-600 hover:bg-navy-800/80',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
      )}
    >
      {/* Source color dot */}
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: profile.color }}
      />

      {/* Short name */}
      <span className="font-medium text-navy-200">{profile.shortName}</span>

      {/* Credibility level pill */}
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-semibold',
          credLevel.color,
          credLevel.textColor,
          size === 'sm' ? 'text-[9px]' : 'text-[10px]',
        )}
      >
        <CredibilityIcon level={credLevel.label} className={iconSize} />
        {credLevel.label}
      </span>

      {/* UN-Citable badge */}
      {profile.unCitable && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-diplomatic-blue/10 px-1 py-px text-[9px] font-medium text-sky-400">
          <FileCheck className={cn(iconSize, 'shrink-0')} />
          <span className="hidden sm:inline">UN</span>
        </span>
      )}
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-xs space-y-2 border-navy-700 bg-navy-900 p-3 text-left"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: profile.color }}
          />
          <span className="text-xs font-semibold text-navy-100">
            {profile.name}
          </span>
        </div>

        {/* Credibility score */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-navy-400">Credibility</span>
          <span className={cn('font-semibold', credLevel.textColor)}>
            {Math.round(profile.credibility * 100)}% ({credLevel.label})
          </span>
        </div>

        {/* Lag */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-navy-400">Data lag</span>
          <span className="text-navy-200">{profile.lag}</span>
        </div>

        {/* Bias */}
        <div className="text-[11px]">
          <span className="text-navy-400">Known bias: </span>
          <span className="text-navy-300">{profile.coverageBias}</span>
        </div>

        {/* Suitable for */}
        <div className="text-[11px]">
          <span className="font-medium text-emerald-500">Suitable for: </span>
          <span className="text-navy-300">
            {profile.suitableFor.join(', ')}
          </span>
        </div>

        {/* Not suitable for */}
        <div className="text-[11px]">
          <span className="font-medium text-red-400">Not suitable for: </span>
          <span className="text-navy-300">
            {profile.notSuitableFor.join(', ')}
          </span>
        </div>

        {/* UN citation status */}
        {profile.unCitable && (
          <div className="flex items-center gap-1 border-t border-navy-700 pt-1 text-[10px] text-sky-400">
            <FileCheck className="h-3 w-3" />
            Citable in UN official documents
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
