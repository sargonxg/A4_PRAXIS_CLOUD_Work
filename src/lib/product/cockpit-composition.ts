import {
  CAPSULE_COMBINATION_RECIPES,
  CONTEXT_CAPSULE_TEMPLATES,
  POLICY_USER_ARCHETYPES,
  type ContextCapsuleTemplateId,
} from '@/lib/product/context-capsules';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';

export interface PolicyNeedTab {
  id: 'analysis' | 'monitoring' | 'review' | 'handover' | 'capsules';
  label: string;
  policyNeed: string;
  intent: string;
  toolIds: string[];
}

export const POLICY_NEED_TABS: PolicyNeedTab[] = [
  {
    id: 'analysis',
    label: 'Analysis',
    policyNeed: 'Understand what is true, uncertain, and decision-relevant.',
    intent: 'Map actors, claims, incentives, scenarios, and policy options from the active capsule.',
    toolIds: ['ask-praxis', 'stakeholder-map', 'ach', 'memo-drafter'],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    policyNeed: 'Track what changed and whether assumptions are stale.',
    intent: 'Watch sources, timelines, commitments, and signals that should update the capsule.',
    toolIds: ['grounded-research', 'commitment-tracker', 'scenario-projector', 'coalition-detector'],
  },
  {
    id: 'review',
    label: 'Review',
    policyNeed: 'Catch weak evidence before prose hardens into a memo.',
    intent: 'Check sourceability, contradictions, narrative framing, and unsupported claims.',
    toolIds: ['sourceability', 'contradiction-finder', 'frame-narrative', 'ach'],
  },
  {
    id: 'handover',
    label: 'Handover',
    policyNeed: 'Package the work so another analyst or agent can inherit it.',
    intent: 'Preserve context, receipts, open questions, decisions, and allowed next actions.',
    toolIds: ['memo-drafter', 'ask-praxis', 'sourceability', 'context-builder'],
  },
  {
    id: 'capsules',
    label: 'Capsules',
    policyNeed: 'Combine reusable context instead of re-explaining the work.',
    intent: 'Search, concatenate, lock, fork, and route capsule inputs into the next run.',
    toolIds: ['context-builder', 'grounded-research', 'stakeholder-map', 'memo-drafter'],
  },
];

export const COCKPIT_CAPSULE_LIBRARY = CONTEXT_CAPSULE_TEMPLATES.map((template, index) => ({
  ...template,
  code: `CAP-${String(index + 1).padStart(3, '0')}`,
  freshness: index % 3 === 0 ? 'fresh' : index % 3 === 1 ? 'review' : 'stale',
}));

export const COCKPIT_USER_ARCHETYPES = POLICY_USER_ARCHETYPES.map((user, index) => ({
  ...user,
  id: `user-${index + 1}`,
  suggestedToolIds: POLICY_NEED_TABS[index % POLICY_NEED_TABS.length]?.toolIds ?? ['ask-praxis'],
}));

export const COCKPIT_TOOL_SUGGESTIONS = PRAXIS_CANONICAL_TOOLS.map((tool) => ({
  id: tool.id,
  label: tool.shortLabel,
  name: tool.name,
  detail: tool.readinessDetail,
  readiness: tool.readiness,
  produces: tool.produces,
}));

export const COCKPIT_COMBINATION_RECIPES = CAPSULE_COMBINATION_RECIPES;

export function findCapsuleTemplate(id: ContextCapsuleTemplateId | string) {
  return COCKPIT_CAPSULE_LIBRARY.find((capsule) => capsule.id === id || capsule.code.toLowerCase() === id.toLowerCase()) ?? null;
}
