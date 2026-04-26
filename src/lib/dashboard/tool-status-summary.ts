import type { ToolHealth, ToolStatusInfo } from '@/hooks/use-tool-status';

export interface ToolStatusSummaryItem {
  toolId: string;
  health: ToolHealth;
  generatedAt: string | null;
  isResearching: boolean;
  isStale: boolean;
  lastError: string | null;
}

export interface ToolStatusSummary {
  total: number;
  fresh: number;
  stale: number;
  running: number;
  failed: number;
  warning: number;
  idle: number;
  priorityItems: ToolStatusSummaryItem[];
}

type SummarizableStatus = Pick<
  ToolStatusInfo,
  'health' | 'generatedAt' | 'isFresh' | 'isStale' | 'isResearching' | 'lastError'
>;

export function summarizeToolStatuses(
  statuses: Record<string, SummarizableStatus>,
  priorityLimit = 5,
): ToolStatusSummary {
  const items = Object.entries(statuses);
  const summary: ToolStatusSummary = {
    total: items.length,
    fresh: 0,
    stale: 0,
    running: 0,
    failed: 0,
    warning: 0,
    idle: 0,
    priorityItems: [],
  };

  const priority: ToolStatusSummaryItem[] = [];

  for (const [toolId, status] of items) {
    if (status.isFresh) summary.fresh += 1;
    if (status.isStale) summary.stale += 1;
    if (status.isResearching) summary.running += 1;
    if (status.health === 'red') summary.failed += 1;
    if (status.health === 'yellow') summary.warning += 1;
    if (!status.generatedAt && !status.isResearching && status.health !== 'red') {
      summary.idle += 1;
    }

    if (status.health === 'red' || status.health === 'yellow' || status.isResearching || status.isStale) {
      priority.push({
        toolId,
        health: status.health,
        generatedAt: status.generatedAt,
        isResearching: status.isResearching,
        isStale: status.isStale,
        lastError: status.lastError,
      });
    }
  }

  summary.priorityItems = priority
    .sort((a, b) => priorityRank(a) - priorityRank(b))
    .slice(0, priorityLimit);

  return summary;
}

function priorityRank(item: ToolStatusSummaryItem): number {
  if (item.health === 'red') return 0;
  if (item.isResearching) return 1;
  if (item.isStale) return 2;
  if (item.health === 'yellow') return 3;
  return 4;
}
