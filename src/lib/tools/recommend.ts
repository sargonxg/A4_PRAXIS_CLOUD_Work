import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import type { AttachableTool, CoreKind } from '@/lib/tools/contract';
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';
import type { DomainId } from '@/types/domain';

const STAGE_BOOSTS: Record<string, string[]> = {
  intake: ['context-builder', 'grounded-research', 'sourceability', 'ask-praxis'],
  research: ['grounded-research', 'sourceability', 'ach', 'contradiction-finder'],
  mapping: ['stakeholder-map', 'coalition-detector', 'position-vs-interest'],
  monitoring: ['commitment-tracker', 'scenario-projector', 'ask-praxis'],
  reporting: ['memo-drafter', 'sourceability', 'frame-narrative', 'ask-praxis'],
};

export function recommendTools(args: {
  attached: Record<CoreKind, boolean>;
  situationStage?: string | null;
  recentToolIds?: string[];
  domainId?: DomainId | null;
}): AttachableTool[] {
  const stage = String(args.situationStage ?? '').toLowerCase();
  const recent = new Set(args.recentToolIds ?? []);
  const stageBoosts = new Set(Object.entries(STAGE_BOOSTS).find(([key]) => stage.includes(key))?.[1] ?? []);
  const domain = args.domainId ? DOMAIN_SEEDS[args.domainId] : null;
  const domainFrameworks = new Set(domain?.frameworks ?? []);
  const domainFeeds = new Set(domain?.preferredFeeds ?? []);

  return [...PRAXIS_CANONICAL_TOOLS]
    .map((tool) => {
      const requiredScore = tool.requires.reduce((score, core) => score + (args.attached[core] ? 2 : -3), 0);
      const adjacentScore = tool.requires.some((core) => args.attached[core]) ? 1 : 0;
      const recentScore = recent.has(tool.id) ? -1 : tool.requires.some((core) => [...recent].some((id) => id.includes(core))) ? 1 : 0;
      const stageScore = stageBoosts.has(tool.id) ? 2 : 0;
      const text = `${tool.id} ${tool.name} ${tool.methodology} ${tool.readinessDetail}`.toLowerCase();
      const domainScore =
        [...domainFrameworks].some((framework) => text.includes(framework.toLowerCase())) ? 2 : 0;
      const feedScore =
        [...domainFeeds].some((feed) => text.includes(feed.toLowerCase())) ? 2 : 0;
      return { tool, score: requiredScore + adjacentScore + recentScore + stageScore + domainScore + feedScore };
    })
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, 3)
    .map((entry) => entry.tool);
}

export function attachedCoresFromSituation(input?: {
  id?: string | null;
  actors?: unknown[];
  sourceUrls?: unknown[];
  customSources?: unknown[];
  documentCount?: number | null;
  latestEventDate?: string | null;
  workflowPath?: string | null;
} | null): Record<CoreKind, boolean> {
  return {
    user: true,
    situation: Boolean(input?.id),
    path: Boolean(input?.workflowPath),
    time: Boolean(input?.latestEventDate),
    source: Boolean((input?.sourceUrls?.length ?? 0) + (input?.customSources?.length ?? 0) + (input?.documentCount ?? 0)),
    document: Boolean(input?.documentCount),
    graph: Boolean(input?.actors?.length),
    tool: true,
    objective: true,
    product: true,
    output: true,
    memory: false,
  };
}
