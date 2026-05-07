import { TACITUS_CORE_PRIMITIVES, type TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';
import { getOntology, getOntologyForDomain, summarizeOntologyMapping } from '@/lib/ontology/registry';
import type { CaseOntologyDefinition, OntologyId } from '@/lib/ontology/types';
import { isOntologyId } from '@/lib/ontology/types';
import type { CaseModule } from '@/types/case-module';

export interface OntologyPrimitiveCoverage {
  primitive: TacitusCorePrimitive;
  count: number;
  hint: string;
}

export interface OntologyValidatorStatus {
  id: string;
  label: string;
  passed: boolean;
  severity: 'info' | 'warn';
  hint: string;
}

export interface ActiveOntologyStatus {
  ontology: CaseOntologyDefinition;
  role: 'primary' | 'secondary';
  passRate: number;
  primitiveCoverage: number;
  primitives: OntologyPrimitiveCoverage[];
  validators: OntologyValidatorStatus[];
  recommendedToolIds: string[];
  sourceAffinity: string[];
}

const PRIMITIVE_TYPE_MAP: Record<string, TacitusCorePrimitive> = {
  actor: 'Actor',
  claim: 'Claim',
  source: 'Event',
  evidence: 'Event',
  verdict: 'Commitment',
  case: 'Narrative',
};

export function getActiveOntologyStatuses(caseModule: CaseModule): ActiveOntologyStatus[] {
  const activeIds = activeOntologyIds(caseModule);
  const graph = buildWorkbenchCaseGraph(caseModule);
  const primitiveCounts = Object.fromEntries(TACITUS_CORE_PRIMITIVES.map((primitive) => [primitive, 0])) as Record<TacitusCorePrimitive, number>;
  for (const node of graph.nodes) {
    const primitive = PRIMITIVE_TYPE_MAP[node.type];
    if (primitive) primitiveCounts[primitive] += 1;
  }

  return activeIds.map((id, index) => {
    const ontology = getOntology(id);
    const mapping = summarizeOntologyMapping(ontology);
    const primitives = TACITUS_CORE_PRIMITIVES.map((primitive) => ({
      primitive,
      count: primitiveCounts[primitive],
      hint: primitiveCounts[primitive] > 0
        ? `${primitiveCounts[primitive]} ${primitive} node${primitiveCounts[primitive] === 1 ? '' : 's'} visible in this case.`
        : `${ontology.label}: no ${primitive} nodes yet. Review Context or run a recommended tool before relying on this lens.`,
    }));
    const validators = ontology.validators.map((validator) => {
      const requiredHasData = mapping.coveredPrimitives.some((primitive) => primitiveCounts[primitive] > 0);
      return {
        id: validator.id,
        label: validator.label,
        passed: requiredHasData && graph.provenanceCoverage >= 0.35,
        severity: validator.severity,
        hint: requiredHasData
          ? 'Validator has matching primitives in the current graph.'
          : 'No matching graph primitive exists yet; add context or promote reviewed graph proposals.',
      };
    });
    const passRate = validators.length
      ? validators.filter((validator) => validator.passed).length / validators.length
      : mapping.primitiveCoverage;
    return {
      ontology,
      role: index === 0 ? 'primary' : 'secondary',
      passRate,
      primitiveCoverage: primitives.filter((item) => item.count > 0 && mapping.coveredPrimitives.includes(item.primitive)).length / TACITUS_CORE_PRIMITIVES.length,
      primitives,
      validators,
      recommendedToolIds: ontology.recommendedToolIds.slice(0, 4),
      sourceAffinity: sourceAffinityFor(id),
    };
  });
}

export function activeOntologyIds(caseModule: CaseModule): OntologyId[] {
  const situation = caseModule.situation;
  const ids = [
    situation.primaryOntologyId,
    situation.ontologyId,
    ...(situation.ontologyIds ?? []),
    getOntologyForDomain(caseModule.manifest.domain).id,
  ].filter(isOntologyId);
  const unique: OntologyId[] = [];
  for (const id of ids) {
    if (!unique.includes(id)) unique.push(id);
  }
  return unique.slice(0, 3);
}

function sourceAffinityFor(id: OntologyId): string[] {
  const map: Record<OntologyId, string[]> = {
    conflict: ['wire reporting', 'UCDP/ACLED-style event data', 'ICG analysis'],
    mediation: ['party statements', 'agreement texts', 'process design notes'],
    governance: ['UN documents', 'mandates', 'voting records'],
    narrative: ['local media', 'social channels', 'fact-check traces'],
    'human-rights': ['OHCHR reports', 'NGO documentation', 'legal filings'],
    economic: ['World Bank', 'IMF', 'customs/trade data'],
    humanitarian: ['OCHA', 'ReliefWeb', 'UNHCR/WHO field reports'],
    legal: ['treaties', 'court records', 'sanctions notices'],
    security: ['incident reports', 'military statements', 'maritime/aviation notices'],
  };
  return map[id];
}
