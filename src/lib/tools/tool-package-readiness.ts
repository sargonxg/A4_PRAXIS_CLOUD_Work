import { getToolById } from '@/lib/constants/tool-registry';
import { getToolContextReadiness } from '@/lib/tools/tool-context-blueprints';
import type { ToolPathPackageSummary } from '@/lib/tools/tool-path-taxonomy';
import type { Situation } from '@/types/situation';

export type PackageReadinessState = 'green' | 'yellow' | 'red' | 'grey';
export type PackageToolHealth = 'green' | 'yellow' | 'red';

export interface PackageToolStatusSnapshot {
  health?: PackageToolHealth | null;
  generatedAt?: string | null;
  isStale?: boolean;
  confidence?: number | null;
}

export interface ToolPackageReadiness {
  score: number;
  state: PackageReadinessState;
  assessedToolIds: string[];
  counts: {
    green: number;
    yellow: number;
    red: number;
    generated: number;
    stale: number;
    contextReady: number;
    contextTotal: number;
    aiWired: number;
    aiTotal: number;
  };
  missingToolIds: string[];
  missingContextToolIds: string[];
  unwiredToolIds: string[];
  nextAction: string;
}

export function computeToolPackageReadiness(
  pkg: ToolPathPackageSummary,
  situation: Partial<Situation> | null | undefined,
  statuses: Record<string, PackageToolStatusSnapshot | undefined> = {},
): ToolPackageReadiness {
  const assessedToolIds = unique([...pkg.primaryToolIds, ...pkg.coreToolIds])
    .map(normalizeToolId)
    .filter((toolId) => Boolean(getToolById(toolId)));

  if (!assessedToolIds.length) {
    return {
      score: 0,
      state: 'grey',
      assessedToolIds: [],
      counts: {
        green: 0,
        yellow: 0,
        red: 0,
        generated: 0,
        stale: 0,
        contextReady: 0,
        contextTotal: 0,
        aiWired: 0,
        aiTotal: 0,
      },
      missingToolIds: [],
      missingContextToolIds: [],
      unwiredToolIds: [],
      nextAction: 'No registered tools are mapped to this package yet.',
    };
  }

  const healthCounts = { green: 0, yellow: 0, red: 0 };
  let generated = 0;
  let stale = 0;
  const missingToolIds: string[] = [];

  for (const toolId of assessedToolIds) {
    const status = statuses[toolId];
    const health = status?.health ?? 'red';
    healthCounts[health] += 1;
    if (status?.generatedAt) generated += 1;
    if (status?.isStale) stale += 1;
    if (health === 'red') missingToolIds.push(toolId);
  }

  const contextReadiness = assessedToolIds.map((toolId) => getToolContextReadiness(toolId, situation));
  const missingContextToolIds = contextReadiness.filter((item) => !item.ready).map((item) => item.toolId);
  const aiTools = assessedToolIds.map((toolId) => getToolById(toolId)).filter(Boolean);
  const unwiredToolIds = aiTools
    .filter((tool) => !tool!.aiRoute)
    .map((tool) => tool!.id);

  const healthScore = assessedToolIds.reduce((sum, toolId) => {
    const health = statuses[toolId]?.health ?? 'red';
    if (health === 'green') return sum + 100;
    if (health === 'yellow') return sum + 60;
    return sum + 15;
  }, 0) / assessedToolIds.length;
  const contextScore = ((contextReadiness.length - missingContextToolIds.length) / contextReadiness.length) * 100;
  const aiScore = ((aiTools.length - unwiredToolIds.length) / aiTools.length) * 100;
  const score = Math.round((healthScore * 0.45) + (contextScore * 0.35) + (aiScore * 0.2));

  return {
    score,
    state: readinessState(score, missingContextToolIds.length, unwiredToolIds.length),
    assessedToolIds,
    counts: {
      ...healthCounts,
      generated,
      stale,
      contextReady: contextReadiness.length - missingContextToolIds.length,
      contextTotal: contextReadiness.length,
      aiWired: aiTools.length - unwiredToolIds.length,
      aiTotal: aiTools.length,
    },
    missingToolIds,
    missingContextToolIds,
    unwiredToolIds,
    nextAction: nextActionFor({ missingContextToolIds, unwiredToolIds, missingToolIds, generated, assessedToolIds }),
  };
}

function nextActionFor(input: {
  missingContextToolIds: string[];
  unwiredToolIds: string[];
  missingToolIds: string[];
  generated: number;
  assessedToolIds: string[];
}): string {
  if (input.unwiredToolIds.length) {
    return `Wire AI/data route for ${prettyToolName(input.unwiredToolIds[0])}.`;
  }
  if (input.missingContextToolIds.length) {
    return `Add required context before relying on ${prettyToolName(input.missingContextToolIds[0])}.`;
  }
  if (input.generated === 0 && input.missingToolIds.length) {
    return `Run ${prettyToolName(input.missingToolIds[0])} to create the first saved package output.`;
  }
  if (input.missingToolIds.length) {
    return `Refresh ${prettyToolName(input.missingToolIds[0])} so this package has current output.`;
  }
  return 'Package is ready for the next analyst workflow.';
}

function readinessState(score: number, missingContextCount: number, unwiredCount: number): PackageReadinessState {
  if (unwiredCount > 0 || score < 40) return 'red';
  if (missingContextCount > 0 || score < 75) return 'yellow';
  return 'green';
}

function normalizeToolId(toolId: string): string {
  if (toolId === 'reports') return 'report-studio';
  if (toolId === 'sources') return 'sources-library';
  return toolId;
}

function prettyToolName(id: string): string {
  return id
    .split('-')
    .map((word) => (word[0]?.toUpperCase() ?? '') + word.slice(1))
    .join(' ');
}

function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}
