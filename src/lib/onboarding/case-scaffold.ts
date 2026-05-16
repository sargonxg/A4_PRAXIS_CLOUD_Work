import { SOURCE_CATEGORIES } from '@/lib/constants/source-categories';
import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import { normalizeOntologySelection, primaryOntologyId, suggestOntologiesForRole } from '@/lib/ontology/suggestions';
import type { OntologyId } from '@/lib/ontology/types';
import type { UserRole } from '@/types/situation';

export interface ProposedActor {
  id: string;
  name: string;
  actorType: string;
  description: string;
  importanceScore: number;
  rationale: string;
  accepted: boolean;
}

export interface ProposedClaim {
  id: string;
  actorName: string;
  text: string;
  claimType: 'demand' | 'position' | 'fact_assertion';
  rationale: string;
  accepted: boolean;
}

export interface CaseScaffoldProposal {
  suggestedCaseName: string;
  suggestedDescription: string;
  suggestedRegion: string;
  primaryOntologyId: OntologyId;
  secondaryOntologyIds: OntologyId[];
  initialActors: ProposedActor[];
  initialClaims: ProposedClaim[];
  suggestedSourceIds: string[];
  rationale: string;
  generatedBy: 'deterministic-local-scaffolder' | 'case_scaffolder';
}

const FALLBACK_ACTORS = [
  ['National government', 'State actor'],
  ['Opposition or armed group', 'Party'],
  ['Civil society monitors', 'Observer'],
  ['International mediator', 'Third party'],
];

const SOURCE_HINTS = ['gdelt', 'reliefweb', 'ucdp', 'ucdp', 'un', 'icg', 'hdx'];

export function buildCaseScaffoldProposal(input: {
  objective: string;
  userRole?: UserRole;
}): CaseScaffoldProposal {
  const objective = input.objective.trim();
  const lower = objective.toLowerCase();
  const ontologyIds = inferOntologyIds(lower, input.userRole);
  const region = inferRegion(objective);
  const caseName = inferCaseName(objective, region);
  const actors = inferActors(lower, region);

  return {
    suggestedCaseName: caseName,
    suggestedDescription: objective.length > 0
      ? objective
      : 'Track a policy, conflict, mediation, governance, or narrative situation with source-grounded analysis.',
    suggestedRegion: region,
    primaryOntologyId: primaryOntologyId(ontologyIds),
    secondaryOntologyIds: ontologyIds.slice(1, 3),
    initialActors: actors.map(([name, actorType], index) => ({
      id: `actor-${index + 1}`,
      name,
      actorType,
      description: `${name} is included as an initial ${actorType.toLowerCase()} candidate for review.`,
      importanceScore: Math.max(0.55, 0.9 - index * 0.08),
      rationale: `Included because the objective suggests ${region ? `${region} ` : ''}${ontologyIds[0]} analysis requiring this actor class.`,
      accepted: true,
    })),
    initialClaims: buildClaims(actors, lower, region),
    suggestedSourceIds: inferSources(lower),
    rationale: `Mapped the objective to ${ontologyLabel(ontologyIds[0])}; selected actors, claims, and sources are review candidates and do not bypass firewall validation.`,
    generatedBy: 'deterministic-local-scaffolder',
  };
}

function inferOntologyIds(objective: string, role?: UserRole): OntologyId[] {
  const picked: OntologyId[] = [];
  if (/(ceasefire|armed|military|conflict|violence|compliance|escalat)/i.test(objective)) picked.push('conflict');
  if (/(mediat|negotiat|zopa|party|settlement|interest)/i.test(objective)) picked.push('mediation');
  if (/(govern|council|mandate|sanction|coalition|veto|treaty)/i.test(objective)) picked.push('governance');
  if (/(disinfo|narrative|frame|media|propaganda|message)/i.test(objective)) picked.push('narrative');
  const roleDefaults = role ? suggestOntologiesForRole(role) : [];
  return normalizeOntologySelection([...picked, ...roleDefaults, 'conflict']);
}

function inferRegion(objective: string) {
  const known = ['Sudan', 'Khartoum', 'West Darfur', 'the selected situation', 'Northwind', 'the selected situation', 'Sahel', 'Ukraine', 'Gaza', 'Yemen'];
  const hit = known.find((candidate) => objective.toLowerCase().includes(candidate.toLowerCase()));
  if (!hit) return '';
  if (hit === 'Khartoum' || hit === 'West Darfur') return 'Sudan';
  return hit;
}

function inferCaseName(objective: string, region: string) {
  const quarter = objective.match(/\bQ[1-4]\s+20\d{2}\b/i)?.[0];
  const focus = /ceasefire/i.test(objective) ? 'Ceasefire Compliance' : /disinfo|narrative/i.test(objective) ? 'Narrative Monitoring' : 'Situation Analysis';
  if (region) return `${region} ${focus}${quarter ? ` ${quarter.toUpperCase()}` : ''}`;
  return objective.split(/[,.]/)[0]?.slice(0, 72) || 'New PRAXIS Situation';
}

function inferActors(objective: string, region: string): string[][] {
  if (/sudan|khartoum|darfur|rsf|saf/i.test(objective)) {
    return [
      ['Government of Sudan', 'State actor'],
      ['Sudanese Armed Forces', 'Party'],
      ['Rapid Support Forces', 'Party'],
      ['Civilian monitors', 'Observer'],
      ['UN mediation and humanitarian actors', 'Third party'],
    ];
  }
  if (/user-case/i.test(objective)) {
    return [
      ['Government of the selected situation', 'State actor'],
      ['Opposition negotiating bodies', 'Party'],
      ['Regional guarantors', 'Third party'],
      ['UN Special Envoy team', 'Mediator'],
    ];
  }
  if (region) return [[`${region} government`, 'State actor'], ...FALLBACK_ACTORS.slice(1)];
  return FALLBACK_ACTORS;
}

function buildClaims(actors: string[][], objective: string, region: string): ProposedClaim[] {
  const subject = region || 'the case';
  const themes: Array<[ProposedClaim['claimType'], string]> = [
    ['fact_assertion', `Reported incidents should be tracked against the stated objective for ${subject}.`],
    ['position', 'Primary parties may contest compliance, attribution, and sequencing.'],
    ['demand', 'External stakeholders need source-backed indicators before recommending action.'],
  ];
  if (/ceasefire|compliance/i.test(objective)) {
    themes.unshift(['fact_assertion', `Ceasefire compliance in ${subject} requires incident, actor, location, and timestamp evidence.`]);
  }
  return themes.slice(0, 4).map(([claimType, text], index) => ({
    id: `claim-${index + 1}`,
    actorName: actors[index % actors.length]?.[0] ?? 'Primary actor',
    text,
    claimType,
    rationale: 'Initial claim candidate for user review before persistence.',
    accepted: true,
  }));
}

function inferSources(objective: string) {
  const hits = SOURCE_CATEGORIES
    .filter((source) => SOURCE_HINTS.some((hint) => `${source.id} ${source.label} ${source.sources.join(' ')}`.toLowerCase().includes(hint)))
    .map((source) => source.id);
  const rights = /humanitarian|relief|darfur|sudan/i.test(objective)
    ? SOURCE_CATEGORIES.filter((source) => /relief|humanitarian|hdx|un/i.test(`${source.id} ${source.label} ${source.sources.join(' ')}`.toLowerCase())).map((source) => source.id)
    : [];
  return Array.from(new Set([...hits, ...rights, ...SOURCE_CATEGORIES.filter((source) => source.alwaysOn).map((source) => source.id)])).slice(0, 10);
}

function ontologyLabel(id: OntologyId) {
  return CASE_ONTOLOGIES.find((ontology) => ontology.id === id)?.label ?? id;
}
