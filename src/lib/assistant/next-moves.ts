import type { CaseModule } from '@/types/case-module';
import type { Situation } from '@/types/situation';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { attachedCoresFromSituation, recommendTools } from '@/lib/tools/recommend';
import { rankMarketplaceToolsForCase } from '@/lib/tools/marketplace/suggestions';
import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';
import type { CoreKind } from '@/lib/tools/contract';
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';
import { isDomainId, type DomainId } from '@/types/domain';

export type NextMoveKind =
  | 'draft_memo'
  | 'check_sources'
  | 'map_situation'
  | 'build_timeline'
  | 'stress_test_option'
  | 'add_source_core'
  | 'add_situation_core';

export interface NextMove {
  id: NextMoveKind;
  label: 'Draft memo' | 'Check sources' | 'Map situation' | 'Build timeline' | 'Stress-test option' | 'Add Source Core' | 'Add Situation Core';
  detail: string;
  href: string;
  prompt: string;
  priority: number;
  domainHint: DomainId;
}

export interface NextMovesContext {
  capsule?: Pick<PraxisCapsule, 'health' | 'coreRefs'> & {
    domain?: DomainId | string | null;
    domainId?: DomainId | string | null;
    domainPosture?: Array<DomainId | string> | null;
  } | null;
  situation?: Partial<Situation> | null;
  situationStage?: string | null;
  caseModule?: CaseModule | null;
  marketplaceTools?: MarketplaceToolDefinition[];
  recentToolIds?: string[];
}

const MAX_NEXT_MOVES = 3;

export function getNextMoves(ctx: NextMovesContext): NextMove[] {
  const attached = attachedFromContext(ctx);
  const domainHint = domainFromContext(ctx);
  const domainConfig = DOMAIN_SEEDS[domainHint];
  const preferredFeed = domainConfig.preferredFeeds[0] ?? null;
  const preferredFramework = domainConfig.frameworks[0] ?? null;
  const stage = ctx.situationStage ?? ctx.situation?.analysisPhase ?? ctx.situation?.workflowPath ?? 'intake';
  const recommended = recommendTools({
    attached,
    situationStage: stage,
    recentToolIds: ctx.recentToolIds ?? [],
    domainId: domainHint,
  });
  const marketplaceRank = ctx.caseModule && ctx.marketplaceTools?.length
    ? rankMarketplaceToolsForCase(ctx.marketplaceTools, ctx.caseModule).slice(0, 5)
    : [];
  const marketplaceSignal = marketplaceRank.map((item) => `${item.tool.category}:${item.rationale}`).join(' | ');
  const toolSignal = recommended.map((tool) => tool.id).join(' ');
  const healthScore = ctx.capsule?.health.score ?? inferHealthScore(attached);
  const moves = [
    candidate(domainHint, 'add_situation_core', !attached.situation ? 100 : 0, {
      detail: 'Start by selecting or creating the Situation Core so PRAXIS knows what policy context this work belongs to.',
      href: '/app/contexts',
      prompt: 'Help me create the smallest useful Situation Core for this work.',
    }),
    candidate(domainHint, 'add_source_core', !attached.source ? 92 : healthScore < 55 ? 72 : 0, {
      detail: preferredFeed
        ? `Attach source receipts or documents before final drafting; start with ${preferredFeed} for this domain.`
        : 'Attach source receipts or documents before final drafting so claims can be checked.',
      href: '/app/contexts',
      prompt: preferredFeed
        ? `What Source Core is missing before I draft or run analysis? Prioritize ${preferredFeed} where relevant.`
        : 'What Source Core is missing before I draft or run analysis?',
    }),
    candidate(domainHint, 'check_sources', attached.source ? 78 + (preferredFeed ? 8 : 0) : 35 + (preferredFeed ? 4 : 0), {
      detail: preferredFeed
        ? `Review source coverage, freshness, and evidence gaps, with ${preferredFeed} as the first domain feed to check.`
        : 'Review source coverage, freshness, and evidence gaps before trusting the answer.',
      href: '/app/workbench?tab=library',
      prompt: preferredFeed
        ? `Check my source coverage against ${preferredFeed} first, then list the most important evidence gaps.`
        : 'Check my source coverage and list the most important evidence gaps.',
    }),
    candidate(domainHint, 'map_situation', attached.situation ? 68 + (attached.source ? 8 : 0) + (preferredFramework ? 5 : 0) : 0, {
      detail: preferredFramework
        ? `Turn actors, claims, sources, and graph posture into a compact map using ${preferredFramework} as the first frame.`
        : 'Turn actors, claims, sources, and graph posture into a compact situation map.',
      href: situationHref(ctx),
      prompt: preferredFramework
        ? `Map the situation from the active core stack through ${preferredFramework}. Keep it concise and identify weak links.`
        : 'Map the situation from the active core stack. Keep it concise and identify weak links.',
    }),
    candidate(domainHint, 'build_timeline', attached.situation ? (attached.time ? 58 : stage.includes('monitor') || toolSignal.includes('timeline') ? 76 : 48) : 0, {
      detail: 'Establish the temporal posture and sequence before making time-sensitive assessments.',
      href: situationHref(ctx),
      prompt: 'Build a short timeline and flag date-sensitive claims.',
    }),
    candidate(domainHint, 'stress_test_option', attached.situation ? (stage.includes('report') || marketplaceSignal.includes('red_team') || toolSignal.includes('red') ? 74 : 52) + (preferredFramework ? 4 : 0) : 0, {
      detail: preferredFramework
        ? `Challenge the strongest assumption through ${preferredFramework} before the memo or recommendation ships.`
        : 'Challenge the strongest assumption before the memo or recommendation ships.',
      href: '/app/assistant',
      prompt: preferredFramework
        ? `Stress-test my leading option through ${preferredFramework}. Show the strongest objection and what evidence would change it.`
        : 'Stress-test my leading option. Show the strongest objection and what evidence would change it.',
    }),
    candidate(domainHint, 'draft_memo', attached.situation && attached.source ? 82 : attached.situation ? 55 : 0, {
      detail: 'Move the current context into a memo outline with citations, open gaps, and next checks.',
      href: '/app/write',
      prompt: 'Draft a concise policy memo outline from the active capsule, with evidence gaps clearly marked.',
    }),
  ]
    .filter((move) => move.priority > 0)
    .sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label));

  return dedupeMoves(moves).slice(0, MAX_NEXT_MOVES);
}

function candidate(domainHint: DomainId, id: NextMoveKind, priority: number, values: Pick<NextMove, 'detail' | 'href' | 'prompt'>): NextMove {
  return {
    id,
    label: labelFor(id),
    priority,
    domainHint,
    ...values,
  };
}

function attachedFromContext(ctx: NextMovesContext): Record<CoreKind, boolean> {
  const fromSituation = attachedCoresFromSituation(ctx.situation);
  const refs = ctx.capsule?.coreRefs;
  if (!refs) return fromSituation;
  return {
    user: Boolean(refs.userCoreId) || fromSituation.user,
    situation: Boolean(refs.situationCoreId) || fromSituation.situation,
    source: refs.sourceCoreIds.length > 0 || refs.documentCoreIds.length > 0 || fromSituation.source,
    time: fromSituation.time,
    office: true,
    output: refs.outputCoreIds.length > 0 || fromSituation.output,
  };
}

function inferHealthScore(attached: Record<CoreKind, boolean>): number {
  return Math.round(Object.values(attached).filter(Boolean).length / Object.values(attached).length * 100);
}

function situationHref(ctx: NextMovesContext): string {
  const situationId = ctx.situation?.id ?? ctx.capsule?.coreRefs.situationCoreId;
  return situationId ? `/app/workbench/${encodeURIComponent(situationId)}` : '/app/contexts';
}

function domainFromContext(ctx: NextMovesContext): DomainId {
  const candidates = [
    ctx.capsule?.domainId,
    ctx.capsule?.domain,
    ...(ctx.capsule?.domainPosture ?? []),
    ctx.situation?.domain,
  ];
  const match = candidates.find(isDomainId);
  return match ?? 'generic';
}

function dedupeMoves(moves: NextMove[]): NextMove[] {
  const seen = new Set<NextMoveKind>();
  return moves.filter((move) => {
    if (seen.has(move.id)) return false;
    seen.add(move.id);
    return true;
  });
}

function labelFor(id: NextMoveKind): NextMove['label'] {
  switch (id) {
    case 'draft_memo':
      return 'Draft memo';
    case 'check_sources':
      return 'Check sources';
    case 'map_situation':
      return 'Map situation';
    case 'build_timeline':
      return 'Build timeline';
    case 'stress_test_option':
      return 'Stress-test option';
    case 'add_source_core':
      return 'Add Source Core';
    case 'add_situation_core':
      return 'Add Situation Core';
  }
}
