import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import type { AttachableTool, CoreKind } from '@/lib/tools/contract';

const STAGE_BOOSTS: Record<string, string[]> = {
  intake: ['context-builder', 'grounded-research', 'ask-praxis'],
  research: ['grounded-research', 'ach', 'contradiction-finder'],
  mapping: ['stakeholder-map', 'coalition-detector', 'position-vs-interest'],
  monitoring: ['commitment-tracker', 'scenario-projector', 'ask-praxis'],
  reporting: ['memo-drafter', 'frame-narrative', 'ask-praxis'],
};

export function recommendTools(args: {
  attached: Record<CoreKind, boolean>;
  situationStage?: string | null;
  recentToolIds?: string[];
}): AttachableTool[] {
  const stage = String(args.situationStage ?? '').toLowerCase();
  const recent = new Set(args.recentToolIds ?? []);
  const stageBoosts = new Set(Object.entries(STAGE_BOOSTS).find(([key]) => stage.includes(key))?.[1] ?? []);

  return [...PRAXIS_CANONICAL_TOOLS]
    .map((tool) => {
      const requiredScore = tool.requires.reduce((score, core) => score + (args.attached[core] ? 2 : -3), 0);
      const adjacentScore = tool.requires.some((core) => args.attached[core]) ? 1 : 0;
      const recentScore = recent.has(tool.id) ? -1 : tool.requires.some((core) => [...recent].some((id) => id.includes(core))) ? 1 : 0;
      const stageScore = stageBoosts.has(tool.id) ? 2 : 0;
      return { tool, score: requiredScore + adjacentScore + recentScore + stageScore };
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
    time: Boolean(input?.latestEventDate),
    office: true,
    source: Boolean((input?.sourceUrls?.length ?? 0) + (input?.customSources?.length ?? 0) + (input?.documentCount ?? 0)),
    output: true,
  };
}
