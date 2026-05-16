import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import type { AttachableTool, CoreKind } from '@/lib/tools/contract';
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';
import type { DomainId } from '@/types/domain';
import {
  getPolicyTeamCategory,
  policyTeamCategoryForTags,
  type PolicyTeamCategory,
  type PolicyTeamCategoryId,
} from '@/lib/product/context-capsules';

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

export interface CapsuleRecommendationInput {
  capsule: {
    scope?: string | null;
    coreRefs?: {
      userCoreId?: string | null;
      situationCoreId?: string | null;
      pathCoreId?: string | null;
      sourceCoreIds?: string[];
      documentCoreIds?: string[];
      graphCoreId?: string | null;
      timeCoreId?: string | null;
      outputCoreIds?: string[];
      toolCoreIds?: string[];
      objectiveCoreIds?: string[];
      productCoreIds?: string[];
      memoryCoreId?: string | null;
    } | null;
    community?: { tags?: string[] } | null;
    updatedAt?: string | null;
  };
  policyTeamId?: PolicyTeamCategoryId | string | null;
  recentToolIds?: string[];
  limit?: number;
}

export interface CapsuleToolRecommendation {
  tool: AttachableTool;
  reason: string;
  missingCoreKinds: CoreKind[];
  category: PolicyTeamCategory | null;
}

export function recommendCapsuleTools(args: CapsuleRecommendationInput): CapsuleToolRecommendation[] {
  const refs = args.capsule.coreRefs ?? {};
  const tags = args.capsule.community?.tags ?? [];
  const category = getPolicyTeamCategory(args.policyTeamId) ?? policyTeamCategoryForTags(tags);
  const attached = attachedCoresFromCapsule(args.capsule);
  const existingToolIds = refs.toolCoreIds ?? [];
  const seeded = recommendTools({
    attached,
    situationStage: capsuleStage(refs, tags),
    recentToolIds: [...(args.recentToolIds ?? []), ...(refs.toolCoreIds ?? [])],
    domainId: category?.domainId ?? null,
  });
  const preferredIds = category?.toolIds ?? [];
  const preferred = preferredIds
    .map((id) => PRAXIS_CANONICAL_TOOLS.find((tool) => tool.id === id))
    .filter((tool): tool is AttachableTool => Boolean(tool));
  const merged = uniqueTools([...preferred, ...seeded, ...PRAXIS_CANONICAL_TOOLS]);
  return merged
    .filter((tool) => !existingToolIds.includes(tool.id))
    .map((tool) => ({
      tool,
      score: capsuleToolScore(tool, attached, category, existingToolIds),
    }))
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, Math.max(1, Math.min(args.limit ?? 4, 8)))
    .map(({ tool }) => ({
      tool,
      reason: recommendationReason(tool, category, attached),
      missingCoreKinds: tool.requires.filter((core) => !attached[core]),
      category,
    }));
}

export function attachedCoresFromCapsule(input: CapsuleRecommendationInput['capsule']): Record<CoreKind, boolean> {
  const refs = input.coreRefs ?? {};
  return {
    user: Boolean(refs.userCoreId || input.scope === 'user'),
    situation: Boolean(refs.situationCoreId || input.scope === 'situation'),
    path: Boolean(refs.pathCoreId),
    source: Boolean(refs.sourceCoreIds?.length),
    document: Boolean(refs.documentCoreIds?.length),
    graph: Boolean(refs.graphCoreId),
    time: Boolean(refs.timeCoreId),
    tool: Boolean(refs.toolCoreIds?.length),
    objective: Boolean(refs.objectiveCoreIds?.length),
    product: Boolean(refs.productCoreIds?.length),
    output: Boolean(refs.outputCoreIds?.length || refs.productCoreIds?.length),
    memory: Boolean(refs.memoryCoreId),
  };
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

function capsuleStage(refs: NonNullable<CapsuleRecommendationInput['capsule']['coreRefs']>, tags: string[]): string {
  if ((refs.outputCoreIds?.length ?? 0) + (refs.productCoreIds?.length ?? 0) > 0) return 'reporting';
  if (refs.timeCoreId || tags.some((tag) => /watch|monitor|crisis|ops/.test(tag))) return 'monitoring';
  if (refs.graphCoreId) return 'mapping';
  if ((refs.sourceCoreIds?.length ?? 0) + (refs.documentCoreIds?.length ?? 0) > 0) return 'research';
  return 'intake';
}

function capsuleToolScore(
  tool: AttachableTool,
  attached: Record<CoreKind, boolean>,
  category: PolicyTeamCategory | null,
  existingToolIds: string[],
): number {
  const required = tool.requires.reduce((score, core) => score + (attached[core] ? 3 : -1), 0);
  const preferred = category?.toolIds.includes(tool.id) ? 8 : 0;
  const alreadyAttached = existingToolIds.includes(tool.id) ? -6 : 0;
  const live = tool.readiness === 'live' ? 2 : tool.readiness === 'routed' ? 1 : 0;
  return required + preferred + alreadyAttached + live;
}

function recommendationReason(
  tool: AttachableTool,
  category: PolicyTeamCategory | null,
  attached: Record<CoreKind, boolean>,
): string {
  if (category?.toolIds.includes(tool.id)) return `${category.shortLabel} capsule fit`;
  const missing = tool.requires.filter((core) => !attached[core]);
  if (missing.length) return `Useful after ${missing.map((core) => `${core} core`).join(', ')}`;
  return 'Ready with current capsule';
}

function uniqueTools(tools: AttachableTool[]): AttachableTool[] {
  const seen = new Set<string>();
  const out: AttachableTool[] = [];
  for (const tool of tools) {
    if (seen.has(tool.id)) continue;
    seen.add(tool.id);
    out.push(tool);
  }
  return out;
}
