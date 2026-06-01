import { describe, expect, it } from 'vitest';

import { ContextCapsuleSchema } from '@/lib/ai/schemas/context-capsule';

describe('ADR 0050 capsule/v2 Zod schema', () => {
  it('parses the marketplace capsule schema with lineage, sourcing, eval, provenance, and market fields', () => {
    const parsed = ContextCapsuleSchema.parse(makeCapsule());

    expect(parsed.schemaVersion).toBe('capsule/v2');
    expect(parsed.extends).toEqual({ id: 'policy-base', version: '1.0.0' });
    expect(parsed.imports?.[0]).toEqual({
      ref: { id: 'citation-rigor', hash: 'sha256:abc' },
      as: 'source-rigor',
      pick: ['sourcing', 'guardrails'],
    });
    expect(parsed.guardrails.citationRequired).toBe(true);
    expect(parsed.eval.judge).toBe('gemini-2.5-flash');
    expect(parsed.market.visibility).toBe('public');
    expect(parsed.temporality.timelineAnchors[0]).toMatchObject({
      id: 'anchor-1',
      label: 'Ceasefire review date',
      date: '2026-06-15',
      kind: 'review',
    });
    expect(parsed.causality.causalLinks[0]).toMatchObject({
      cause: 'Access restrictions remain in place',
      effect: 'Humanitarian delivery slows',
      relation: 'causes',
    });
    expect(parsed.ontologyBinding).toMatchObject({
      domainId: 'diplomacy-negotiation',
      ontologyIds: ['conflict', 'mediation'],
      acoPrimitives: ['Actor', 'Claim', 'Event'],
    });
    expect(parsed.embeddedGraph.provider).toBe('graphlite');
    expect(parsed.embeddedGraph.advisoryOnly).toBe(true);
  });

  it('rejects legacy numeric schema versions for the ADR 0050 contract', () => {
    const result = ContextCapsuleSchema.safeParse({
      ...makeCapsule(),
      schemaVersion: 2,
    });

    expect(result.success).toBe(false);
  });
});

function makeCapsule() {
  return {
    id: 'policy-memo-builder',
    schemaVersion: 'capsule/v2',
    version: '1.0.0',
    contentHash: 'sha256:placeholder',
    status: 'published',
    immutable: true,
    forkedFrom: { id: 'starter-policy-memo', version: '1.0.0' },
    extends: { id: 'policy-base', version: '1.0.0' },
    imports: [
      { ref: { id: 'citation-rigor', hash: 'sha256:abc' }, as: 'source-rigor', pick: ['sourcing', 'guardrails'] },
    ],
    mergeStrategy: 'deep-merge',
    persona: {
      analystProfile: { role: 'Policy analyst' },
      systemFrame: 'Frame claims, evidence, options, and uncertainty.',
      domain: 'generic',
      frameworks: ['ach', 'stakeholder-salience'],
      fewShot: [
        {
          id: 'example-1',
          input: 'Assess sanctions risk.',
          output: 'A sourced options memo.',
          notes: 'Shows grounded uncertainty.',
          version: '1.0.0',
        },
      ],
    },
    output: {
      format: 'brief',
      responseJsonSchema: {
        type: 'object',
        properties: { judgment: { type: 'string' } },
        required: ['judgment'],
      },
      propertyOrdering: ['judgment'],
      zodRef: 'PolicyMemoOutput',
      renderTemplate: '# {{judgment}}',
    },
    sourcing: {
      mode: 'hybrid',
      minSourcesPerClaim: 2,
      allowedDomains: ['un.org'],
      blockedDomains: ['example-social.test'],
      recencyWindowDays: 30,
      requiredSourceTypes: ['official', 'multilateral'],
      citationStyle: 'inline',
    },
    retrieval: {
      mode: 'hybrid',
      corpora: ['policy-corpus'],
      graphExpansionDepth: 2,
      topK: 12,
      trustRank: 'strict',
    },
    tools: {
      bound: ['sourceability'],
      recommended: ['deep_research'],
      policy: 'suggest',
    },
    guardrails: {
      refusalPolicy: 'Refuse requests that ask for unsupported definitive claims.',
      blockedTopics: ['private personal data'],
      piiHandling: 'redact',
      citationRequired: true,
      maxUngroundedClaims: 0,
      safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }],
    },
    eval: {
      goldenSetRef: 'golden/policy-memo',
      thresholds: {
        faithfulness: 0.9,
        citationCoverage: 0.95,
        contextRecall: 0.8,
        schemaConformance: 0.98,
        redTeamPassRate: 0.98,
        safetyScore: 0.98,
      },
      metrics: ['faithfulness', 'response_relevancy', 'context_recall'],
      judge: 'gemini-2.5-flash',
      lastRun: {
        runId: 'eval-1',
        scores: { faithfulness: 0.93 },
        passedAt: '2026-05-30T00:00:00.000Z',
      },
    },
    provenance: {
      author: { uid: 'u1', org: 'tacitus' },
      createdAt: '2026-05-30T00:00:00.000Z',
      publishedAt: '2026-05-30T01:00:00.000Z',
      signature: { bundle: 'sigstore-bundle' },
      attestation: { predicateType: 'https://slsa.dev/provenance/v1', builder: 'praxis-capsule-builder' },
      certification: {
        tier: 'reviewed',
        scores: { faithfulness: 0.93 },
        evalRunId: 'eval-1',
        signedBy: 'praxis',
        expiresAt: '2026-08-30T00:00:00.000Z',
      },
    },
    market: {
      visibility: 'public',
      pricing: 'credits',
      credits: 10,
      category: 'generic',
      tags: ['memo', 'policy'],
      installs: 12,
      rating: 4.8,
      revenueShare: { authorUid: 'u1', pct: 70 },
    },
    temporality: {
      timelineAnchors: [{
        id: 'anchor-1',
        label: 'Ceasefire review date',
        date: '2026-06-15',
        kind: 'review',
        sourceRefs: ['src-1'],
      }],
    },
    causality: {
      causalLinks: [{
        id: 'cause-1',
        cause: 'Access restrictions remain in place',
        effect: 'Humanitarian delivery slows',
        relation: 'causes',
        evidenceRefs: ['src-1'],
        confidence: 0.68,
      }],
    },
    ontologyBinding: {
      domainId: 'diplomacy-negotiation',
      taxonomyPath: ['generic', 'diplomacy-negotiation'],
      ontologyIds: ['conflict', 'mediation'],
      acoPrimitives: ['Actor', 'Claim', 'Event'],
      bindingRationale: 'Mediation work needs actors, claims, dated events, and negotiation constraints.',
    },
    embeddedGraph: {
      provider: 'graphlite',
      projectionId: 'cap-1-graphlite-builder-projection',
      status: 'compiled-advisory',
      namedGraph: 'capsule_cap_1',
      advisoryOnly: true,
      canonicalStore: 'Firestore ContextCapsules',
      promotionGate: 'Human review-card approval required before canonical graph promotion.',
      nodes: [{ id: 'actor-un', label: 'UN mediator', entityType: 'Actor', reviewState: 'proposed' }],
      edges: [],
    },
  };
}
