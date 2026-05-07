import type { MarketplaceToolCategory, MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';
import type { UserRole } from '@/types/context';

const CATEGORY_TERMS: Record<MarketplaceToolCategory, string[]> = {
  conflict: ['actor', 'event', 'escalation', 'constraint'],
  mediation: ['party', 'interest', 'option', 'agreement'],
  governance: ['mandate', 'coalition', 'veto', 'compliance'],
  narrative: ['frame', 'audience', 'amplifier', 'counter-narrative'],
  'human-rights': ['violation', 'victim', 'treaty', 'accountability'],
  economic: ['designation', 'ownership', 'sanctions', 'evasion'],
  humanitarian: ['needs', 'access', 'cluster', 'response'],
  legal: ['provision', 'jurisdiction', 'precedent', 'obligation'],
  security: ['posture', 'capability', 'doctrine', 'deterrence'],
  cross: ['stakeholder', 'evidence', 'assumption', 'brief'],
};

const CATEGORY_PERSONAS: Record<MarketplaceToolCategory, UserRole[]> = {
  conflict: ['diplomat', 'analyst'],
  mediation: ['mediator'],
  governance: ['policy_advisor', 'diplomat'],
  narrative: ['researcher', 'analyst'],
  'human-rights': ['human_rights_officer'],
  economic: ['sanctions_analyst'],
  humanitarian: ['humanitarian_coordinator'],
  legal: ['treaty_lawyer'],
  security: ['defense_analyst'],
  cross: ['analyst', 'policy_advisor'],
};

const TOOL_TERM_OVERRIDES: Record<string, string[]> = {
  'cross.ach': ['hypothesis', 'evidence', 'inconsistency'],
  'cross.kac': ['assumption', 'linchpin', 'support'],
  'cross.red-team': ['adversary', 'challenge', 'risk'],
  'cross.premortem': ['failure', 'trigger', 'mitigation'],
  'cross.memo-create': ['memo', 'block', 'provenance'],
  'cross.memo-refresh': ['memo', 'stale', 'revision'],
};

export interface MarketplaceSemanticProfile {
  requiredTerms: string[];
  personaRoles: UserRole[];
  canaryAssertions: string[];
  annexEligible: boolean;
  compositionTargets: string[];
}

export function buildMarketplaceSemanticProfile(tool: MarketplaceToolDefinition): MarketplaceSemanticProfile {
  const idTerms = tool.id
    .split(/[.-]/)
    .filter((part) => part.length > 2 && !['cross', 'tool'].includes(part))
    .slice(0, 4);
  const requiredTerms = Array.from(new Set([
    ...CATEGORY_TERMS[tool.category],
    ...idTerms,
    ...(TOOL_TERM_OVERRIDES[tool.id] ?? []),
  ])).slice(0, 8);

  return {
    requiredTerms,
    personaRoles: CATEGORY_PERSONAS[tool.category],
    canaryAssertions: [
      'returns advisory structured output',
      'preserves context dump',
      'labels synthesized material',
      'names composition handoff targets',
    ],
    annexEligible: tool.sideEffects.writesMemoBlocks || tool.composition.canChainInto.includes('cross.brief-exporter'),
    compositionTargets: tool.composition.canChainInto,
  };
}
