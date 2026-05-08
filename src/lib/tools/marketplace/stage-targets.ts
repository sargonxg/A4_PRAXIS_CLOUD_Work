import type { MarketplaceToolCategory, MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';

export type MarketplaceHeroToolId =
  | 'situation-intelligence'
  | 'source-scout'
  | 'policy-memo'
  | 'briefing'
  | 'brainstorming-table'
  | 'scenarios'
  | 'negotiation-prep';

export type MarketplaceStageChapter = 'desk' | 'research' | 'draft' | 'boardroom';

export interface MarketplaceStageTarget {
  heroToolId: MarketplaceHeroToolId;
  heroToolName: string;
  chapter: MarketplaceStageChapter;
}

const HERO_TARGETS: Record<MarketplaceHeroToolId, MarketplaceStageTarget> = {
  'situation-intelligence': {
    heroToolId: 'situation-intelligence',
    heroToolName: 'Executive Intelligence',
    chapter: 'desk',
  },
  'source-scout': {
    heroToolId: 'source-scout',
    heroToolName: 'Source Scout',
    chapter: 'research',
  },
  'policy-memo': {
    heroToolId: 'policy-memo',
    heroToolName: 'Policy Memo',
    chapter: 'draft',
  },
  briefing: {
    heroToolId: 'briefing',
    heroToolName: 'Briefing Studio',
    chapter: 'draft',
  },
  'brainstorming-table': {
    heroToolId: 'brainstorming-table',
    heroToolName: 'Boardroom',
    chapter: 'boardroom',
  },
  scenarios: {
    heroToolId: 'scenarios',
    heroToolName: 'Scenario Builder',
    chapter: 'boardroom',
  },
  'negotiation-prep': {
    heroToolId: 'negotiation-prep',
    heroToolName: 'Negotiation Prep',
    chapter: 'boardroom',
  },
};

const CATEGORY_TARGETS: Record<MarketplaceToolCategory, MarketplaceHeroToolId> = {
  conflict: 'situation-intelligence',
  mediation: 'negotiation-prep',
  governance: 'situation-intelligence',
  narrative: 'source-scout',
  'human-rights': 'source-scout',
  economic: 'source-scout',
  humanitarian: 'situation-intelligence',
  legal: 'policy-memo',
  security: 'situation-intelligence',
  cross: 'situation-intelligence',
};

const TOOL_TARGETS: Record<string, MarketplaceHeroToolId> = {
  'conflict.escalation-timeline': 'situation-intelligence',
  'conflict.escalation-ladder': 'situation-intelligence',
  'conflict.cease-fire-monitor': 'situation-intelligence',
  'conflict.actor-alignment-shift': 'situation-intelligence',
  'mediation.position-vs-interest': 'negotiation-prep',
  'mediation.zopa-finder': 'negotiation-prep',
  'mediation.mediation-brief': 'briefing',
  'governance.mandate-traceback': 'policy-memo',
  'governance.coalition-map': 'situation-intelligence',
  'governance.veto-probability': 'situation-intelligence',
  'narrative.frame-cascade': 'source-scout',
  'narrative.counter-narrative-finder': 'source-scout',
  'narrative.fact-check-traceback': 'source-scout',
  'cross.contradiction-finder': 'situation-intelligence',
  'cross.context-health-explainer': 'situation-intelligence',
  'cross.brief-exporter': 'briefing',
  'cross.memo-create': 'policy-memo',
  'cross.memo-refresh': 'policy-memo',
  'cross.scenario-projector': 'scenarios',
  'cross.stakeholder-power-interest': 'situation-intelligence',
  'cross.causal-loop-diagram': 'situation-intelligence',
  'cross.indicators-tracker': 'source-scout',
  'cross.timeline-comparator': 'source-scout',
  'cross.assumption-mapper': 'situation-intelligence',
  'cross.outside-in-thinking': 'source-scout',
  'cross.devils-advocate': 'brainstorming-table',
  'extract.entities.gliner': 'source-scout',
  'cross.community-synthesizer': 'source-scout',
  'analyze.network': 'situation-intelligence',
  'match.sanctions': 'source-scout',
  'simulate.policy_abm': 'scenarios',
  'human-rights.violation-tracker': 'source-scout',
  'human-rights.upr-cycle-mapper': 'source-scout',
  'human-rights.treaty-body-engagement': 'policy-memo',
  'human-rights.pattern-detector': 'source-scout',
  'economic.designation-tracer': 'source-scout',
  'economic.beneficial-ownership-map': 'source-scout',
  'economic.sanctions-impact-model': 'situation-intelligence',
  'economic.evasion-pattern-detector': 'source-scout',
  'humanitarian.needs-aggregator': 'source-scout',
  'humanitarian.access-map': 'source-scout',
  'humanitarian.cluster-coordinator': 'briefing',
  'humanitarian.aa-trigger-monitor': 'source-scout',
  'legal.provision-tracer': 'policy-memo',
  'legal.precedent-finder': 'source-scout',
  'legal.reservation-effect-mapper': 'policy-memo',
  'legal.jurisdictional-analyzer': 'policy-memo',
  'security.posture-tracker': 'situation-intelligence',
  'security.capability-assessor': 'situation-intelligence',
  'security.escalation-modeler': 'scenarios',
  'security.alliance-cohesion-map': 'situation-intelligence',
};

export function getMarketplaceStageTarget(
  tool: Pick<MarketplaceToolDefinition, 'id' | 'category'>,
): MarketplaceStageTarget {
  const heroToolId = TOOL_TARGETS[tool.id] ?? CATEGORY_TARGETS[tool.category];
  return HERO_TARGETS[heroToolId];
}

export function stageTargetHref(caseId: string, target: MarketplaceStageTarget): string {
  const params = new URLSearchParams({
    stagedTool: target.heroToolId,
    openChapter: target.chapter,
  });
  return `/app/workbench/${encodeURIComponent(caseId)}?${params.toString()}#${target.chapter}`;
}
