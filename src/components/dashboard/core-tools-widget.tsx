'use client';

import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { WidgetShell } from './widget-shell';
import { PraxisLink } from '@/components/shared/praxis-link';
import { getToolById } from '@/lib/constants/tool-registry';
import { CORE_MVP_TOOL_IDS } from '@/lib/constants/tool-groups';
import { useAllToolStatuses } from '@/hooks/use-tool-status';
import { cn } from '@/lib/utils/cn';

interface CoreToolsWidgetProps {
  situationId: string;
}

const TOOL_HREFS: Record<string, string> = {
  'actor-profiles': '/actors',
  'sources-library': '/sources',
};

export function CoreToolsWidget({ situationId }: CoreToolsWidgetProps) {
  const statuses = useAllToolStatuses(situationId);
  const ready = CORE_MVP_TOOL_IDS.filter((toolId) => statuses[toolId]?.health === 'green').length;

  return (
    <WidgetShell
      title="Core MVP tools"
      subtitle={`${ready}/${CORE_MVP_TOOL_IDS.length} ready for this situation`}
      icon={<Sparkles className="h-4 w-4" />}
    >
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {CORE_MVP_TOOL_IDS.map((toolId) => {
          const tool = getToolById(toolId);
          const health = statuses[toolId]?.health;
          const isReady = health === 'green';
          return (
            <PraxisLink
              key={toolId}
              href={TOOL_HREFS[toolId] ?? `/${toolId}`}
              className="group flex min-w-0 items-start gap-2 rounded px-1.5 py-1.5 hover:bg-slate-100"
            >
              {isReady ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : (
                <Circle
                  className={cn(
                    'mt-0.5 h-3.5 w-3.5 shrink-0',
                    health === 'yellow' ? 'text-amber-500' : 'text-slate-300',
                  )}
                />
              )}
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-navy-900 group-hover:text-diplomatic-blue">
                  {tool?.name ?? prettyToolName(toolId)}
                </span>
                <span className="line-clamp-2 text-[11px] leading-snug text-navy-600">
                  {tool?.shortDescription ?? 'Generate a situation-specific PRAXIS output.'}
                </span>
              </span>
            </PraxisLink>
          );
        })}
      </div>
    </WidgetShell>
  );
}

function prettyToolName(id: string): string {
  return id
    .split('-')
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ');
}
