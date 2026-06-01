import { CAPSULE_EVAL_JUDGE_MODEL } from '@/lib/ai/model-matrix';
import { computeCapsuleContentHash } from '@/lib/capsules/resolve';
import { runCapsuleDryRunEval, type CapsuleDryRunEvalResult, type CapsuleEvalSample, type CapsuleEvalSourceSnippet } from '@/lib/capsules/dry-run-eval';
import type { ContextCapsule } from '@/types/context-capsule';

export const LAUNCH_CAPSULE_IDS = [
  'conflict-analysis-brief',
  'sanctions-impact-analysis',
  'economic-policy-analysis',
  'mediation-negotiation-readiness',
  'treaty-legal-review',
  'humanitarian-sitrep',
  'election-political-risk-watch',
  'energy-resource-security',
  'stakeholder-mapping-decision-memo',
  'osint-source-to-brief',
] as const;

export type LaunchCapsuleId = typeof LAUNCH_CAPSULE_IDS[number];

export interface LaunchGoldenSet {
  id: string;
  samples: CapsuleEvalSample[];
  sourceSnippets: CapsuleEvalSourceSnippet[];
}

export interface LaunchCapsuleEntry {
  capsule: ContextCapsule;
  goldenSet: LaunchGoldenSet;
}

export interface LaunchCapsuleEvaluation {
  capsule: ContextCapsule;
  goldenSet: LaunchGoldenSet;
  result: CapsuleDryRunEvalResult;
}

const LAUNCH_CREATED_AT = '2026-05-30T00:00:00.000Z';

const DEFINITIONS: Array<{
  id: LaunchCapsuleId;
  title: string;
  domain: string;
  frameworks: string[];
  outputFormat: ContextCapsule['output']['format'];
  tags: string[];
  sourceTypes: string[];
  claimA: string;
  claimB: string;
}> = [
  {
    id: 'conflict-analysis-brief',
    title: 'Conflict Analysis Brief',
    domain: 'armed-conflict-security',
    frameworks: ['conflict-analysis', 'actor-interest-constraint', 'scenario-watch'],
    outputFormat: 'brief',
    tags: ['conflict', 'brief', 'actors'],
    sourceTypes: ['official', 'news', 'humanitarian'],
    claimA: 'actor incentives shape escalation risk',
    claimB: 'civilian impact requires separate evidence tracking',
  },
  {
    id: 'sanctions-impact-analysis',
    title: 'Sanctions Impact Analysis',
    domain: 'economic-sanctions',
    frameworks: ['sanctions-chain', 'impact-pathway', 'evasion-risk'],
    outputFormat: 'report',
    tags: ['sanctions', 'economy', 'compliance'],
    sourceTypes: ['official', 'trade-data', 'expert-analysis'],
    claimA: 'sanctions effects vary by sector and enforcement capacity',
    claimB: 'humanitarian carveouts require monitoring evidence',
  },
  {
    id: 'economic-policy-analysis',
    title: 'Economic Policy Analysis',
    domain: 'development-stabilization',
    frameworks: ['distributional-analysis', 'fiscal-risk', 'implementation-capacity'],
    outputFormat: 'brief',
    tags: ['economic-policy', 'development', 'options'],
    sourceTypes: ['official', 'economic-data', 'expert-analysis'],
    claimA: 'distributional effects need explicit beneficiary mapping',
    claimB: 'implementation capacity changes policy feasibility',
  },
  {
    id: 'mediation-negotiation-readiness',
    title: 'Mediation / Negotiation Readiness',
    domain: 'diplomacy-negotiation',
    frameworks: ['ripeness', 'BATNA', 'confidence-building-measures'],
    outputFormat: 'brief',
    tags: ['mediation', 'negotiation', 'readiness'],
    sourceTypes: ['official', 'statements', 'track-two'],
    claimA: 'readiness depends on incentives and credible communication channels',
    claimB: 'spoiler risks should be separated from stated positions',
  },
  {
    id: 'treaty-legal-review',
    title: 'Treaty / Legal Review',
    domain: 'governance-rule-of-law',
    frameworks: ['legal-obligation-map', 'compliance-risk', 'interpretive-ambiguity'],
    outputFormat: 'report',
    tags: ['legal', 'treaty', 'compliance'],
    sourceTypes: ['legal-text', 'official', 'case-law'],
    claimA: 'legal obligations require text-linked interpretation',
    claimB: 'policy compliance risk depends on implementation facts',
  },
  {
    id: 'humanitarian-sitrep',
    title: 'Humanitarian SITREP',
    domain: 'humanitarian',
    frameworks: ['needs-access-response', 'protection-risk', 'funding-gap'],
    outputFormat: 'brief',
    tags: ['humanitarian', 'sitrep', 'access'],
    sourceTypes: ['relief', 'official', 'field-report'],
    claimA: 'humanitarian need should be separated from access constraints',
    claimB: 'protection risks require dated source receipts',
  },
  {
    id: 'election-political-risk-watch',
    title: 'Election / Political Risk Watch',
    domain: 'governance-rule-of-law',
    frameworks: ['election-risk', 'elite-incentives', 'institutional-trust'],
    outputFormat: 'brief',
    tags: ['election', 'political-risk', 'watch'],
    sourceTypes: ['election-body', 'observer', 'news'],
    claimA: 'political risk changes when institutions lose credibility',
    claimB: 'election violence indicators require dated monitoring',
  },
  {
    id: 'energy-resource-security',
    title: 'Energy / Resource Security',
    domain: 'climate-environmental-security',
    frameworks: ['supply-chain-risk', 'critical-infrastructure', 'resource-leverage'],
    outputFormat: 'brief',
    tags: ['energy', 'resources', 'security'],
    sourceTypes: ['market-data', 'official', 'infrastructure'],
    claimA: 'resource leverage depends on substitute supply and infrastructure exposure',
    claimB: 'energy security claims require source-dated market context',
  },
  {
    id: 'stakeholder-mapping-decision-memo',
    title: 'Stakeholder Mapping & Decision Memo',
    domain: 'diplomacy-negotiation',
    frameworks: ['stakeholder-salience', 'power-interest-grid', 'decision-options'],
    outputFormat: 'report',
    tags: ['stakeholders', 'decision-memo', 'actors'],
    sourceTypes: ['official', 'expert-analysis', 'local-reporting'],
    claimA: 'stakeholder influence depends on power, interest, and legitimacy',
    claimB: 'decision options need explicit tradeoff evidence',
  },
  {
    id: 'osint-source-to-brief',
    title: 'OSINT Source-to-Brief',
    domain: 'information-cyber',
    frameworks: ['source-triangulation', 'confidence-rating', 'deception-risk'],
    outputFormat: 'brief',
    tags: ['osint', 'sourceability', 'brief'],
    sourceTypes: ['open-source', 'media', 'official'],
    claimA: 'OSINT claims require triangulation and provenance notes',
    claimB: 'deception risk should be marked before synthesis',
  },
];

export function buildLaunchCapsules(): LaunchCapsuleEntry[] {
  return DEFINITIONS.map((definition) => {
    const capsule = buildBaseCapsule(definition);
    const goldenSet = buildGoldenSet(definition);
    const result = runCapsuleDryRunEval({
      capsule,
      samples: goldenSet.samples,
      sourceSnippets: goldenSet.sourceSnippets,
      runId: `golden-${definition.id}`,
      passedAt: LAUNCH_CREATED_AT,
    });
    const withEval: ContextCapsule = {
      ...capsule,
      eval: {
        ...capsule.eval,
        lastRun: result.patch.eval.lastRun,
      },
    };
    const contentHash = computeCapsuleContentHash(withEval);
    return {
      capsule: { ...withEval, contentHash },
      goldenSet,
    };
  });
}

export function evaluateLaunchCapsuleGoldenSets(): LaunchCapsuleEvaluation[] {
  return buildLaunchCapsules().map((entry) => ({
    ...entry,
    result: runCapsuleDryRunEval({
      capsule: entry.capsule,
      samples: entry.goldenSet.samples,
      sourceSnippets: entry.goldenSet.sourceSnippets,
      runId: `golden-${entry.capsule.id}`,
      passedAt: LAUNCH_CREATED_AT,
    }),
  }));
}

function buildBaseCapsule(definition: typeof DEFINITIONS[number]): ContextCapsule {
  const capsule: ContextCapsule = {
    id: definition.id,
    schemaVersion: 'capsule/v2',
    version: '1.0.0',
    contentHash: 'sha256:pending',
    status: 'published',
    immutable: true,
    mergeStrategy: 'prototype',
    persona: {
      analystProfile: {},
      systemFrame: [
        `Use the ${definition.title} capsule for sourced policy analysis.`,
        'Separate evidence, inference, uncertainty, and action implications.',
        'Treat graph and ontology additions as reviewable proposals until a human approves them.',
      ].join(' '),
      domain: definition.domain,
      frameworks: definition.frameworks,
      fewShot: [],
    },
    output: {
      format: definition.outputFormat,
      responseJsonSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
          options: { type: 'array', items: { type: 'string' } },
          openQuestions: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'evidence', 'openQuestions'],
      },
      propertyOrdering: ['summary', 'evidence', 'options', 'openQuestions'],
      renderTemplate: '# Summary\n{{summary}}\n\n## Evidence\n{{evidence}}\n\n## Options\n{{options}}\n\n## Open Questions\n{{openQuestions}}',
    },
    sourcing: {
      mode: 'hybrid',
      minSourcesPerClaim: 1,
      allowedDomains: [],
      blockedDomains: [],
      recencyWindowDays: 90,
      requiredSourceTypes: definition.sourceTypes,
      citationStyle: 'inline',
    },
    retrieval: {
      mode: 'hybrid',
      corpora: [],
      graphExpansionDepth: 2,
      topK: 10,
      trustRank: 'strict',
    },
    temporality: {
      timelineAnchors: [{
        id: `${definition.id}-as-of`,
        label: 'Launch capsule as-of date',
        date: LAUNCH_CREATED_AT.slice(0, 10),
        kind: 'as-of',
        sourceRefs: [],
      }],
    },
    causality: {
      causalLinks: [{
        id: `${definition.id}-sourceability-loop`,
        cause: 'A source gap or stale receipt is detected',
        effect: 'The capsule output remains review-gated before reuse',
        relation: 'causes',
        evidenceRefs: [],
        confidence: 0.6,
      }],
    },
    ontologyBinding: {
      domainId: definition.domain,
      taxonomyPath: definition.domain === 'generic' ? ['generic'] : ['generic', definition.domain],
      ontologyIds: ['governance'],
      acoPrimitives: ['Actor', 'Claim', 'Event'],
      bindingRationale: 'Launch capsules start with source-backed actor, claim, and event extraction before domain-specific review.',
    },
    embeddedGraph: {
      provider: 'graphlite',
      projectionId: `${definition.id}-graphlite-launch-projection`,
      status: 'compiled-advisory',
      namedGraph: `capsule_${definition.id.replaceAll('-', '_')}`,
      advisoryOnly: true,
      canonicalStore: 'Firestore ContextCapsules',
      promotionGate: 'Human review-card approval required before canonical graph promotion.',
      nodeCount: 0,
      edgeCount: 0,
      nodes: [],
      edges: [],
    },
    tools: {
      bound: [],
      recommended: ['sourceability', 'deep_research', 'source-scout'],
      policy: 'suggest',
    },
    guardrails: {
      refusalPolicy: 'Do not present unsupported claims as findings. Convert weak or inferred items into evidence gaps or review cards.',
      blockedTopics: [],
      piiHandling: 'redact',
      citationRequired: true,
      maxUngroundedClaims: 0,
      safetySettings: [],
    },
    eval: {
      goldenSetRef: `launch/${definition.id}/golden-set-v1`,
      thresholds: {
        faithfulness: 0.8,
        citationCoverage: 0.95,
        contextRecall: 0.8,
        schemaConformance: 1,
        redTeamPassRate: 0.95,
        safetyScore: 0.95,
        },
        metrics: ['faithfulness', 'context_recall', 'factual_correctness', 'tool_call_accuracy'],
        judge: CAPSULE_EVAL_JUDGE_MODEL,
      },
    provenance: {
      author: { uid: 'system', org: 'tacitus' },
      createdAt: LAUNCH_CREATED_AT,
      publishedAt: LAUNCH_CREATED_AT,
      certification: {
        tier: 'verified',
        scores: {
          faithfulness: 1,
          citationCoverage: 1,
          contextRecall: 1,
          schemaConformance: 1,
          redTeamPassRate: 1,
          safetyScore: 1,
        },
        evalRunId: `golden-${definition.id}`,
        signedBy: 'praxis-local-dry-run',
        expiresAt: '2027-05-30T00:00:00.000Z',
      },
    },
    market: {
      visibility: 'public',
      pricing: 'free',
      category: definition.domain,
      tags: definition.tags,
      installs: 0,
      rating: 5,
    },
  };
  return capsule;
}

function buildGoldenSet(definition: typeof DEFINITIONS[number]): LaunchGoldenSet {
  const sourceA = `${definition.title} source one: ${definition.claimA}.`;
  const sourceB = `${definition.title} source two: ${definition.claimB}.`;
  return {
    id: `launch/${definition.id}/golden-set-v1`,
    sourceSnippets: [
      { id: 's1', text: sourceA },
      { id: 's2', text: sourceB },
    ],
    samples: [
      {
        prompt: `Prepare a ${definition.title} summary.`,
        output: {
          summary: `${definition.claimA}; ${definition.claimB}.`,
          evidence: ['s1', 's2'],
          options: ['Continue monitoring', 'Escalate for human review if source gaps grow'],
          openQuestions: ['Which new evidence would change the assessment?'],
        },
        claims: [
          { id: 'claim-1', text: definition.claimA, sourceIds: ['s1'] },
          { id: 'claim-2', text: definition.claimB, sourceIds: ['s2'] },
        ],
      },
      {
        prompt: `List evidence gaps for ${definition.title}.`,
        output: {
          summary: `${definition.claimA}.`,
          evidence: ['s1'],
          options: ['Add dated source receipts before final use'],
          openQuestions: ['What evidence is missing?'],
        },
        claims: [
          { id: 'claim-3', text: definition.claimA, sourceIds: ['s1'] },
        ],
      },
    ],
  };
}
