'use client';

import { SOURCE_CREDIBILITY, getCredibilityLevel } from '@/lib/data/source-credibility';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CorroborationIndicatorProps {
  sourceCount: number;
  sources: string[];
  className?: string;
}

function getCorroborationLevel(count: number) {
  if (count >= 3) {
    return {
      label: `Corroborated (${count} sources)`,
      color: 'bg-emerald-500/10 border-emerald-500/20',
      textColor: 'text-emerald-500',
      Icon: CheckCircle2,
    };
  }
  if (count === 2) {
    return {
      label: 'Partial (2 sources)',
      color: 'bg-amber-500/10 border-amber-500/20',
      textColor: 'text-amber-500',
      Icon: AlertTriangle,
    };
  }
  return {
    label: 'Single source \u2014 unverified',
    color: 'bg-red-500/10 border-red-500/20',
    textColor: 'text-red-400',
    Icon: AlertCircle,
  };
}

export function CorroborationIndicator({
  sourceCount,
  sources,
  className,
}: CorroborationIndicatorProps) {
  const level = getCorroborationLevel(sourceCount);
  const { Icon } = level;

  // Resolve source profiles for the tooltip
  const resolvedSources = sources.map((s) => {
    const key = s.toUpperCase();
    const profile = SOURCE_CREDIBILITY[key] ?? SOURCE_CREDIBILITY[s];
    return {
      key: s,
      name: profile?.shortName ?? s,
      fullName: profile?.name ?? s,
      credibility: profile?.credibility,
      color: profile?.color ?? '#6b7280',
    };
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex cursor-help items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors hover:brightness-110',
            level.color,
            level.textColor,
            className,
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {level.label}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-xs border-navy-700 bg-navy-900 p-3 text-left"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-navy-200">
            Source breakdown
          </p>
          <ul className="space-y-1">
            {resolvedSources.map((src) => {
              const credLevel = src.credibility != null
                ? getCredibilityLevel(src.credibility)
                : null;

              return (
                <li
                  key={src.key}
                  className="flex items-center justify-between gap-3 text-[11px]"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: src.color }}
                    />
                    <span className="text-navy-300" title={src.fullName}>
                      {src.name}
                    </span>
                  </span>
                  {credLevel != null && (
                    <span className={cn('font-medium', credLevel.textColor)}>
                      {Math.round((src.credibility ?? 0) * 100)}%
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {sourceCount >= 3 && (
            <p className="border-t border-navy-700 pt-1.5 text-[10px] text-emerald-500/80">
              Multiple independent sources increase data confidence.
            </p>
          )}
          {sourceCount === 1 && (
            <p className="border-t border-navy-700 pt-1.5 text-[10px] text-red-400/80">
              Single-source data should be cross-referenced before use in
              reports.
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
