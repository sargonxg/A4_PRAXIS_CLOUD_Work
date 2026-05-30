import { describe, expect, it } from 'vitest';

import {
  computeCapsuleContentHash,
  resolveCapsule,
  type CapsuleLoader,
} from '@/lib/capsules/resolve';
import type { ContextCapsule } from '@/types/context-capsule';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

describe('capsule/v2 resolver', () => {
  it('resolves extends before imports, then overlays the child capsule', async () => {
    const registry = new Map<string, ContextCapsule>([
      ['conflict-analysis-base', makeCapsule({
        id: 'conflict-analysis-base',
        persona: {
          domain: 'armed-conflict-security',
          frameworks: ['glasl-escalation'],
          systemFrame: 'Conflict analysis base frame.',
        },
        output: { format: 'brief', propertyOrdering: ['summary', 'risks'] },
        sourcing: { mode: 'corpus', minSourcesPerClaim: 1, allowedDomains: ['un.org'] },
        retrieval: { mode: 'skc', corpora: ['conflict-base-corpus'] },
        guardrails: { citationRequired: false, maxUngroundedClaims: 2 },
      })],
      ['citation-rigor', makeCapsule({
        id: 'citation-rigor',
        sourcing: {
          mode: 'hybrid',
          minSourcesPerClaim: 2,
          allowedDomains: ['un.org', 'reliefweb.int'],
          recencyWindowDays: 45,
        },
        guardrails: {
          citationRequired: true,
          maxUngroundedClaims: 0,
          blockedTopics: ['private personal data'],
        },
      })],
      ['sudan-corpus', makeCapsule({
        id: 'sudan-corpus',
        retrieval: {
          mode: 'hybrid',
          corpora: ['sudan-2026-corpus'],
          graphExpansionDepth: 2,
        },
      })],
      ['mediation-sudan', makeCapsule({
        id: 'mediation-sudan',
        extends: { id: 'conflict-analysis-base' },
        imports: [
          { ref: { id: 'citation-rigor' }, as: 'source-rigor', pick: ['sourcing', 'guardrails'] },
          { ref: { id: 'sudan-corpus' }, as: 'regional-corpus', pick: ['retrieval'] },
        ],
        mergeStrategy: 'deep-merge',
        persona: {
          domain: 'diplomacy-negotiation',
          frameworks: ['zartman-ripeness', 'stedman-spoilers'],
          systemFrame: 'Sudan mediation readiness frame.',
        },
        output: { format: 'report', propertyOrdering: ['judgment', 'evidence', 'options'] },
        sourcing: {
          mode: 'hybrid',
          minSourcesPerClaim: 2,
          allowedDomains: ['un.org', 'reliefweb.int'],
          recencyWindowDays: 45,
        },
        retrieval: {
          mode: 'hybrid',
          corpora: ['sudan-2026-corpus'],
          graphExpansionDepth: 2,
        },
        guardrails: {
          citationRequired: true,
          maxUngroundedClaims: 0,
          blockedTopics: ['private personal data'],
        },
        market: { tags: ['sudan', 'mediation'], category: 'diplomacy-negotiation' },
      })],
    ]);

    const loadCapsule: CapsuleLoader = async (ref) => registry.get(ref.id) ?? null;

    const resolved = await resolveCapsule({ id: 'mediation-sudan' }, { loadCapsule });

    expect(resolved.id).toBe('mediation-sudan');
    expect(resolved.schemaVersion).toBe('capsule/v2');
    expect(resolved.persona.domain).toBe('diplomacy-negotiation');
    expect(resolved.persona.systemFrame).toBe('Sudan mediation readiness frame.');
    expect(resolved.persona.frameworks).toEqual([
      'glasl-escalation',
      'zartman-ripeness',
      'stedman-spoilers',
    ]);
    expect(resolved.output.format).toBe('report');
    expect(resolved.sourcing).toMatchObject({
      mode: 'hybrid',
      minSourcesPerClaim: 2,
      allowedDomains: ['un.org', 'reliefweb.int'],
    });
    expect(resolved.retrieval).toMatchObject({
      mode: 'hybrid',
      corpora: ['conflict-base-corpus', 'sudan-2026-corpus'],
      graphExpansionDepth: 2,
    });
    expect(resolved.guardrails).toMatchObject({
      citationRequired: true,
      maxUngroundedClaims: 0,
    });
    expect(resolved.market.tags).toEqual(['sudan', 'mediation']);
    expect(resolved.resolutionTrace.map((step) => `${step.kind}:${step.id}`)).toEqual([
      'extends:conflict-analysis-base',
      'import:citation-rigor',
      'import:sudan-corpus',
      'self:mediation-sudan',
    ]);
    expect(resolved.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('computes a stable canonical content hash independent of object key order and stored hash', () => {
    const first = makeCapsule({
      id: 'hash-stable',
      contentHash: 'sha256:old',
      market: { tags: ['one', 'two'], category: 'generic' },
      guardrails: { citationRequired: true, maxUngroundedClaims: 0 },
    });

    const second = {
      ...first,
      contentHash: 'sha256:different',
      guardrails: {
        ...first.guardrails,
        maxUngroundedClaims: 0,
        citationRequired: true,
      },
      market: {
        ...first.market,
        category: 'generic',
        tags: ['one', 'two'],
      },
    };

    expect(computeCapsuleContentHash(first)).toBe(computeCapsuleContentHash(second));
  });
});

function makeCapsule(overrides: DeepPartial<ContextCapsule> = {}): ContextCapsule {
  const now = '2026-05-30T00:00:00.000Z';
  const base: ContextCapsule = {
    id: 'capsule',
    schemaVersion: 'capsule/v2',
    version: '1.0.0',
    contentHash: 'sha256:placeholder',
    status: 'draft',
    immutable: false,
    mergeStrategy: 'prototype',
    persona: {
      analystProfile: {},
      systemFrame: 'Base frame.',
      domain: 'generic',
      frameworks: [],
      fewShot: [],
    },
    output: {
      format: 'brief',
      responseJsonSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
        },
        required: ['summary'],
      },
      propertyOrdering: ['summary'],
    },
    sourcing: {
      mode: 'corpus',
      minSourcesPerClaim: 1,
      allowedDomains: [],
      blockedDomains: [],
      recencyWindowDays: 90,
      requiredSourceTypes: [],
    },
    retrieval: {
      mode: 'skc',
      corpora: [],
      graphExpansionDepth: 1,
      topK: 8,
      trustRank: 'balanced',
    },
    tools: { bound: [], recommended: [], policy: 'suggest' },
    guardrails: {
      refusalPolicy: 'Refuse unsafe or ungrounded requests.',
      blockedTopics: [],
      piiHandling: 'redact',
      citationRequired: false,
      maxUngroundedClaims: 2,
      safetySettings: [],
    },
    eval: {
      goldenSetRef: 'golden/default',
      thresholds: {
        faithfulness: 0.8,
        citationCoverage: 0.8,
        contextRecall: 0.7,
        schemaConformance: 0.95,
        redTeamPassRate: 0.95,
        safetyScore: 0.95,
      },
      metrics: ['faithfulness', 'context_recall'],
      judge: 'gemini-2.5-flash',
    },
    provenance: {
      author: { uid: 'u1' },
      createdAt: now,
    },
    market: {
      visibility: 'private',
      pricing: 'free',
      category: 'generic',
      tags: [],
      installs: 0,
      rating: 0,
    },
  };

  return {
    ...base,
    ...overrides,
    persona: { ...base.persona, ...overrides.persona },
    output: { ...base.output, ...overrides.output },
    sourcing: { ...base.sourcing, ...overrides.sourcing },
    retrieval: { ...base.retrieval, ...overrides.retrieval },
    tools: { ...base.tools, ...overrides.tools },
    guardrails: { ...base.guardrails, ...overrides.guardrails },
    eval: { ...base.eval, ...overrides.eval },
    provenance: { ...base.provenance, ...overrides.provenance },
    market: { ...base.market, ...overrides.market },
  } as ContextCapsule;
}
