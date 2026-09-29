import {
  buildDocumentFirstCapsuleArchitectSignals,
  type CapsuleArchitectDocumentInput,
} from '@/lib/services/entity-extraction';
import { TACITUS_CORE_PRIMITIVES } from '@/lib/graph/core-primitives';
import { isOntologyId, type OntologyId } from '@/lib/ontology/types';
import type { CapsuleReviewEvidence, CapsuleReviewTarget } from '@/lib/context/capsule-service';
import type { CapsuleEnvelopePatch } from '@/lib/context/capsule-schema';
import type { ContextCapsule } from '@/types/context-capsule';

export interface CapsuleArchitectElicitationInput {
  redLines?: string[] | null;
  constraints?: string[] | null;
  approvalPolitics?: string[] | null;
  heuristics?: string[] | null;
  stakeholderSensitivities?: string[] | null;
  decisionHorizon?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  causalDrivers?: string[] | null;
}

export interface CapsuleArchitectBuildInput {
  capsuleId?: string | null;
  situationId?: string | null;
  jobPrompt: string;
  domainId?: string | null;
  ontologyIds?: string[] | null;
  documents?: CapsuleArchitectDocumentInput[] | null;
  elicitation?: CapsuleArchitectElicitationInput | null;
  normalizedAt?: string | null;
}

interface NormalizedCapsuleArchitectElicitation {
  redLines: string[];
  constraints: string[];
  approvalPolitics: string[];
  heuristics: string[];
  stakeholderSensitivities: string[];
  decisionHorizon: string;
  validFrom: string;
  validUntil: string;
  causalDrivers: string[];
}

export interface CapsuleArchitectReviewCardDraft {
  title: string;
  sourceType: 'agent';
  target: CapsuleReviewTarget;
  evidence: CapsuleReviewEvidence[];
  proposedEnvelopePatch: CapsuleEnvelopePatch;
}

export interface CapsuleArchitectProposal {
  proposalId: string;
  capsuleId: string;
  label: string;
  summary: string;
  domainId: string;
  ontologyBinding: ContextCapsule['ontologyBinding'];
  sourceRefs: NonNullable<CapsuleEnvelopePatch['sourceRefs']>;
  claimLedger: NonNullable<CapsuleEnvelopePatch['claimLedger']>;
  embeddedGraph: ContextCapsule['embeddedGraph'];
  humanTacitKnowledge: Record<string, unknown>;
  temporality: ContextCapsule['temporality'];
  causality: ContextCapsule['causality'];
  tacitKnowledgeQuestions: string[];
  reviewCards: CapsuleArchitectReviewCardDraft[];
  documentIds: string[];
  reviewGate: 'human_review';
}

export function buildCapsuleArchitectProposal(input: CapsuleArchitectBuildInput): CapsuleArchitectProposal {
  const normalizedAt = cleanText(input.normalizedAt, 80) || new Date().toISOString();
  const jobPrompt = cleanText(input.jobPrompt, 4000) || 'Build a reviewable policy capsule from uploaded evidence.';
  const documents = (input.documents ?? []).slice(0, 20);
  const domainId = inferArchitectDomain(input.domainId, jobPrompt);
  const ontologyIds = normalizeOntologyIds(input.ontologyIds, jobPrompt);
  const signals = buildDocumentFirstCapsuleArchitectSignals(documents, {
    jobPrompt,
    domainId,
    normalizedAt,
  });
  const capsuleId = cleanId(input.capsuleId ?? `architect-${stablePart(`${jobPrompt}:${documents.map((doc) => doc.documentId ?? doc.title).join('|')}`)}`, 'architect-capsule');
  const label = titleFromPrompt(jobPrompt);
  const elicitation = normalizeElicitation(input.elicitation);
  const temporality = buildArchitectTemporality(signals.temporality, elicitation, normalizedAt);
  const causality = buildArchitectCausality(signals.causality, elicitation);
  const humanTacitKnowledge = buildArchitectTacitKnowledge(elicitation, jobPrompt);
  const ontologyBinding: ContextCapsule['ontologyBinding'] = {
    domainId,
    taxonomyPath: domainId === 'generic' ? ['generic'] : ['generic', domainId],
    ontologyIds,
    acoPrimitives: TACITUS_CORE_PRIMITIVES.filter((primitive) => ['Actor', 'Claim', 'Event', 'Constraint'].includes(primitive)).slice(0, 4),
    bindingRationale: `Capsule Architect proposed ${domainId} binding from prompt and ${documents.length} document(s); human review required before canonical promotion.`,
  };
  const embeddedGraph = {
    ...signals.embeddedGraph,
    projectionId: `${capsuleId}-architect-graphlite-projection`,
    namedGraph: `capsule_${capsuleId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
  };
  const tacitKnowledgeQuestions = buildTacitKnowledgeQuestions(elicitation, jobPrompt);
  const sourceRefs = signals.sourceRefs.map((source) => ({ ...source }));
  const claimLedger = signals.claimLedger.map((claim) => ({ ...claim }));
  const evidence = sourceRefs.map((source): CapsuleReviewEvidence => ({
    id: source.sourceId,
    label: source.label,
    advisory: true,
    sourceType: 'document',
    url: source.url ?? null,
  }));
  const proposalBase = {
    proposalId: `architect:${capsuleId}:${stablePart(normalizedAt)}`,
    capsuleId,
    label,
    summary: `Capsule Architect scaffold from prompt and ${documents.length} document(s).`,
    domainId,
    ontologyBinding,
    sourceRefs,
    claimLedger,
    embeddedGraph,
    humanTacitKnowledge,
    temporality,
    causality,
    tacitKnowledgeQuestions,
    documentIds: documents.map((document, index) => cleanId(document.documentId ?? document.title, `document-${index + 1}`)),
    reviewGate: 'human_review' as const,
  };

  return {
    ...proposalBase,
    reviewCards: buildArchitectReviewCards(proposalBase, evidence),
  };
}

function buildArchitectReviewCards(
  proposal: Omit<CapsuleArchitectProposal, 'reviewCards'>,
  evidence: CapsuleReviewEvidence[],
): CapsuleArchitectReviewCardDraft[] {
  const latestGateState = 'proposed' as const;
  return [
    {
      title: `Review Capsule Architect ontology binding for ${proposal.label}`,
      sourceType: 'agent',
      target: 'ontologyStack',
      evidence,
      proposedEnvelopePatch: {
        latestGateState,
        ontologyBinding: patchRecord(proposal.ontologyBinding),
        memoryPosture: {
          architectProposalId: proposal.proposalId,
          ontologyBindingReview: proposal.ontologyBinding,
          canonicalMutation: false,
        },
      },
    },
    {
      title: `Review ${proposal.sourceRefs.length} candidate source receipt(s)`,
      sourceType: 'agent',
      target: 'sourceGap',
      evidence,
      proposedEnvelopePatch: {
        latestGateState,
        sourceRefs: proposal.sourceRefs,
        sourcePosture: {
          posture: 'source_intake',
          requiredSourceTypes: ['uploaded-document', 'primary-document'],
          freshnessWindowDays: 90,
          notes: 'Capsule Architect proposed these sources from uploaded documents; apply only after human source review.',
        },
      },
    },
    {
      title: `Review ${proposal.claimLedger.length} draft receipted claim(s)`,
      sourceType: 'agent',
      target: 'claimLedger',
      evidence,
      proposedEnvelopePatch: {
        latestGateState,
        claimLedger: proposal.claimLedger,
      },
    },
    {
      title: 'Review document-first graph proposal',
      sourceType: 'agent',
      target: 'graphProposal',
      evidence,
      proposedEnvelopePatch: {
        latestGateState,
        embeddedGraph: patchRecord(proposal.embeddedGraph),
        memoryPosture: {
          architectProposalId: proposal.proposalId,
          graphMode: 'review-gated',
          graphProposals: [{
            proposalId: `${proposal.proposalId}:graph`,
            kind: 'embedded-graph',
            operation: 'create',
            payload: proposal.embeddedGraph,
            reviewState: 'proposed',
            promotedByReviewCard: false,
          }],
        },
      },
    },
    {
      title: 'Review tacit-knowledge elicitation',
      sourceType: 'agent',
      target: 'advisoryMemory',
      evidence,
      proposedEnvelopePatch: {
        latestGateState,
        humanTacitKnowledge: proposal.humanTacitKnowledge,
        memoryPosture: {
          architectProposalId: proposal.proposalId,
          tacitKnowledgeQuestions: proposal.tacitKnowledgeQuestions,
          canonicalMutation: false,
        },
      },
    },
    {
      title: 'Review decision horizon and causal drivers',
      sourceType: 'agent',
      target: 'agentInstructions',
      evidence,
      proposedEnvelopePatch: {
        latestGateState,
        temporality: patchRecord(proposal.temporality),
        causality: patchRecord(proposal.causality),
        agentPermissions: {
          canSuggest: true,
          canSource: true,
          canFork: true,
          canDraft: true,
          canPublish: false,
          humanGate: 'review-card',
        },
        memoryPosture: {
          architectProposalId: proposal.proposalId,
          decisionHorizon: proposal.temporality.validUntil ?? proposal.temporality.asOf,
          causalDrivers: proposal.causality.causalLinks.map((link) => link.cause),
        },
      },
    },
  ];
}

function normalizeElicitation(input: CapsuleArchitectElicitationInput | null | undefined): NormalizedCapsuleArchitectElicitation {
  return {
    redLines: cleanList(input?.redLines),
    constraints: cleanList(input?.constraints),
    approvalPolitics: cleanList(input?.approvalPolitics),
    heuristics: cleanList(input?.heuristics),
    stakeholderSensitivities: cleanList(input?.stakeholderSensitivities),
    decisionHorizon: cleanText(input?.decisionHorizon, 240),
    validFrom: cleanText(input?.validFrom, 80),
    validUntil: cleanText(input?.validUntil, 80),
    causalDrivers: cleanList(input?.causalDrivers),
  };
}

function buildArchitectTacitKnowledge(
  elicitation: NormalizedCapsuleArchitectElicitation,
  jobPrompt: string,
): Record<string, unknown> {
  return {
    workingAssumptions: [`Capsule scaffold starts from this user job: ${jobPrompt.slice(0, 300)}`],
    hiddenConstraints: elicitation.constraints,
    redLines: elicitation.redLines,
    institutionalHabits: [],
    approvalPolitics: elicitation.approvalPolitics,
    practicalHeuristics: elicitation.heuristics,
    stakeholderSensitivities: elicitation.stakeholderSensitivities,
    caveats: ['Capsule Architect proposals are advisory until a human applies review cards.'],
    recurringDecisions: elicitation.decisionHorizon ? [elicitation.decisionHorizon] : [],
    promptlessKnowledge: [],
  };
}

function buildArchitectTemporality(
  base: ContextCapsule['temporality'],
  elicitation: NormalizedCapsuleArchitectElicitation,
  normalizedAt: string,
): ContextCapsule['temporality'] {
  const timelineAnchors = [...base.timelineAnchors];
  if (elicitation.validFrom) {
    timelineAnchors.unshift({
      id: 'architect-valid-from',
      label: elicitation.decisionHorizon || 'Decision horizon starts',
      date: elicitation.validFrom,
      kind: 'validity-start',
      sourceRefs: [],
      confidence: 0.7,
    });
  }
  if (elicitation.validUntil) {
    timelineAnchors.push({
      id: 'architect-valid-until',
      label: elicitation.decisionHorizon || 'Decision horizon ends',
      date: elicitation.validUntil,
      kind: 'validity-end',
      sourceRefs: [],
      confidence: 0.7,
    });
  }
  return {
    timelineAnchors: dedupeAnchors(timelineAnchors),
    asOf: base.asOf ?? normalizedAt.slice(0, 10),
    validFrom: elicitation.validFrom || base.validFrom,
    validUntil: elicitation.validUntil || base.validUntil,
  };
}

function buildArchitectCausality(
  base: ContextCapsule['causality'],
  elicitation: NormalizedCapsuleArchitectElicitation,
): ContextCapsule['causality'] {
  const driverLinks = elicitation.causalDrivers.map((driver, index) => ({
    id: `architect-human-driver-${index + 1}`,
    cause: driver,
    effect: elicitation.decisionHorizon || 'Capsule decision posture changes',
    relation: 'causes' as const,
    evidenceRefs: [],
    confidence: 0.65,
    caveat: 'Human-elicited causal driver; review before canonical use.',
  }));
  return {
    causalLinks: [...driverLinks, ...base.causalLinks].slice(0, 20),
  };
}

function buildTacitKnowledgeQuestions(
  elicitation: NormalizedCapsuleArchitectElicitation,
  jobPrompt: string,
): string[] {
  return [
    elicitation.redLines.length ? '' : `What red lines must the capsule never cross for: ${jobPrompt.slice(0, 140)}?`,
    elicitation.constraints.length ? '' : 'Which operational, legal, or political constraints should be treated as hard limits?',
    elicitation.approvalPolitics.length ? '' : 'Who must approve outputs before they leave the team?',
    elicitation.heuristics.length ? '' : 'What practical heuristics do expert analysts use when evidence is incomplete?',
    elicitation.validUntil ? '' : 'What is the decision horizon or validity end date for this capsule?',
    elicitation.causalDrivers.length ? '' : 'Which primary causal drivers should the capsule track first?',
  ].filter(Boolean).slice(0, 6);
}

function inferArchitectDomain(domainId: string | null | undefined, jobPrompt: string): string {
  const cleanDomain = cleanText(domainId, 120);
  if (cleanDomain) return cleanDomain;
  const text = jobPrompt.toLowerCase();
  if (text.includes('humanitarian') || text.includes('access')) return 'humanitarian';
  if (text.includes('sanction')) return 'economic-sanctions';
  if (text.includes('treaty') || text.includes('diplom') || text.includes('mediator')) return 'diplomacy-negotiation';
  if (text.includes('legal') || text.includes('governance')) return 'governance-rule-of-law';
  return 'generic';
}

function normalizeOntologyIds(values: string[] | null | undefined, jobPrompt: string): OntologyId[] {
  const explicit = cleanList(values).filter(isOntologyId) as OntologyId[];
  if (explicit.length) return Array.from(new Set(explicit));
  const inferred: OntologyId[] = ['governance'];
  const text = jobPrompt.toLowerCase();
  if (text.includes('legal') && isOntologyId('legal')) inferred.push('legal');
  if ((text.includes('media') || text.includes('information')) && isOntologyId('narrative')) inferred.push('narrative');
  return Array.from(new Set(inferred));
}

function patchRecord(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function dedupeAnchors(anchors: ContextCapsule['temporality']['timelineAnchors']) {
  const seen = new Set<string>();
  return anchors.filter((anchor) => {
    const key = `${anchor.id}:${anchor.date}:${anchor.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 40);
}

function titleFromPrompt(prompt: string): string {
  const clean = prompt
    .replace(/\s+/g, ' ')
    .replace(/[.?!]+$/g, '')
    .trim();
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean || 'Capsule Architect draft';
}

function cleanList(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => cleanText(item, 600)).filter(Boolean))).slice(0, 20)
    : [];
}

function cleanText(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function cleanId(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value : fallback;
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
  return cleaned || fallback;
}

function stablePart(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36).padStart(6, '0');
}
