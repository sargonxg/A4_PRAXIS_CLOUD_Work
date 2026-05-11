import type { MethodDefinition } from '@/lib/methods/catalog';

export type V5PersonaId = 'foreign-policy-analyst' | 'domestic-policy-analyst' | 'corporate-strategic-analyst';

export interface MethodRoleAffinity {
  methodId: MethodDefinition['id'];
  runtimeId: MethodDefinition['runtimeId'];
  personas: V5PersonaId[];
  contextSignals: string[];
  reason: string;
}

export const V5_METHOD_ROLE_AFFINITY: MethodRoleAffinity[] = [
  affinity('deep-research', 'research.deep-research-agent', ['foreign-policy-analyst', 'domestic-policy-analyst', 'corporate-strategic-analyst'], ['thin sources', 'new question', 'fact refresh'], 'Research is the first expansion move when a Context needs more evidence.'),
  affinity('stakeholder-power-interest-map', 'analysis.stakeholder-power-interest', ['foreign-policy-analyst', 'domestic-policy-analyst', 'corporate-strategic-analyst'], ['actor list', 'engagement choice', 'priority setting'], 'Power-interest mapping is useful across all three MVP buyer paths.'),
  affinity('frame-narrative-analyzer', 'analysis.frame-narrative', ['foreign-policy-analyst', 'domestic-policy-analyst', 'corporate-strategic-analyst'], ['public claims', 'messenger shift', 'audience risk'], 'Narrative movement changes policy and corporate risk interpretation.'),
  affinity('position-interest-decoder', 'analysis.position-vs-interest', ['foreign-policy-analyst', 'domestic-policy-analyst'], ['negotiation', 'stakeholder demand', 'regulatory bargaining'], 'Positions versus interests support mediation and regulatory strategy.'),
  affinity('scenario-projector', 'analysis.scenario-projector', ['foreign-policy-analyst', 'corporate-strategic-analyst'], ['uncertainty', 'time horizon', 'decision trigger'], 'Scenario projection supports strategic timing and contingency planning.'),
  affinity('ach', 'analysis.ach-hypothesis', ['foreign-policy-analyst', 'domestic-policy-analyst', 'corporate-strategic-analyst'], ['uncertain judgment', 'rival explanations', 'confidence check'], 'ACH is the default uncertainty discipline before high-stakes claims.'),
  affinity('memo-drafter', 'drafting.memo-drafter', ['foreign-policy-analyst', 'domestic-policy-analyst', 'corporate-strategic-analyst'], ['draft needed', 'briefing output', 'decision memo'], 'Memo drafting turns reviewed method outputs into a work product.'),
  affinity('contradiction-finder', 'analysis.contradiction-finder', ['foreign-policy-analyst', 'domestic-policy-analyst', 'corporate-strategic-analyst'], ['conflicting claims', 'source review', 'pre-export'], 'Contradiction checks protect provenance and buyer trust.'),
  affinity('coalition-detector', 'analysis.coalition-detector', ['foreign-policy-analyst', 'domestic-policy-analyst'], ['coalition', 'blocking actor', 'swing actor'], 'Coalition detection supports policy and diplomatic pathfinding.'),
  affinity('commitment-tracker', 'analysis.commitment-tracker', ['foreign-policy-analyst', 'domestic-policy-analyst', 'corporate-strategic-analyst'], ['pledge', 'agreement', 'implementation'], 'Commitment tracking turns promises into monitorable accountability surfaces.'),
];

export function getMethodRoleAffinity(methodId: string): MethodRoleAffinity | null {
  return V5_METHOD_ROLE_AFFINITY.find((entry) => entry.methodId === methodId || entry.runtimeId === methodId) ?? null;
}

function affinity(
  methodId: MethodRoleAffinity['methodId'],
  runtimeId: MethodRoleAffinity['runtimeId'],
  personas: V5PersonaId[],
  contextSignals: string[],
  reason: string,
): MethodRoleAffinity {
  return { methodId, runtimeId, personas, contextSignals, reason };
}
