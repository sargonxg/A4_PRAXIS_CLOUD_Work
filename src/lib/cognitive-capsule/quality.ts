import type { CognitiveCapsule } from './types';
import { CognitiveGraph } from './graph';
/** Structural coverage is not factual confidence or demonstrated model performance. */
export function cognitiveQuality(capsule: CognitiveCapsule) {
  const accepted = capsule.knowledge.filter((k) => k.reviewState === 'accepted');
  const count = (kinds: string[]) => accepted.filter((k) => kinds.includes(k.kind)).length;
  const dimensions = { evidenceSpans: capsule.evidence.length, acceptedStatements: capsule.statements.filter((s) => s.reviewState === 'accepted').length,
    expertDistinctions: count(['distinction']), expertPatterns: count(['cue', 'pattern', 'heuristic', 'exception', 'redFlag']),
    languageRules: count(['languageRule']), methods: count(['procedure']), cases: count(['case']),
    unresolvedKnowledge: capsule.knowledge.filter((k) => k.reviewState === 'proposed').length,
    humanReviewed: accepted.length, validationIssues: new CognitiveGraph(capsule).validate().length };
  const level = dimensions.cases ? 6 : dimensions.methods ? 5 : dimensions.expertDistinctions || dimensions.expertPatterns || dimensions.languageRules ? 4
    : capsule.statements.length ? 3 : capsule.evidence.length ? 2 : capsule.nodes.length ? 1 : 0;
  return { dimensions, cognitiveDepth: level, evaluationPosture: 'not-model-evaluated', structuralValidationPassed: dimensions.validationIssues === 0,
    interpretation: 'Counts describe structure and review coverage; they do not establish factual truth or model improvement.' };
}
