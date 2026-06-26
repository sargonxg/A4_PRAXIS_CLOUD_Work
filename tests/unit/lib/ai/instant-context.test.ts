import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClassifyResult } from '@/lib/domain/classifier';
import type { CapsuleOntologyBinding, CapsuleTemporality } from '@/types/context-capsule';
import type { DomainId, MergedDomainConfig } from '@/types/domain';

const domainMocks = vi.hoisted(() => ({
  classifyDomain: vi.fn(),
  resolveDomain: vi.fn(),
}));

vi.mock('@/lib/domain/classifier', () => ({
  classifyDomain: domainMocks.classifyDomain,
}));

vi.mock('@/lib/domain/resolve', () => ({
  resolveDomain: domainMocks.resolveDomain,
}));

import { buildInstantContextCapsule } from '@/lib/ai/instant-context';

describe('buildInstantContextCapsule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    domainMocks.classifyDomain.mockResolvedValue(classification('armed-conflict-security', 0.9));
    domainMocks.resolveDomain.mockImplementation(async (domainId: DomainId) => domainConfig(domainId));
  });

  it('builds an ephemeral turn capsule with injectable context', async () => {
    const result = await buildInstantContextCapsule({
      uid: 'u1',
      prompt: 'Assess current escalation risks around the ceasefire corridor.',
    });

    expect(result.ephemeral).toBe(true);
    expect(result.turnCapsule.injectableContext).toBe(result.capsuleContext);
    expect(result.domain).toBeTruthy();
    expect(result.rationale).toBeTruthy();
    expect(result.turnCapsule.retrievalPlan).toBeDefined();
  });

  it('binds high-confidence armed-conflict prompts to primitives and 30-day recency', async () => {
    domainMocks.classifyDomain.mockResolvedValueOnce(classification('armed-conflict-security', 0.9));

    const result = await buildInstantContextCapsule({
      uid: 'u1',
      prompt: 'Assess the latest armed conflict security claims.',
    });

    const capsule = result.turnCapsule.injectableContext.capsule;
    const ontologyBinding = capsule.ontologyBinding as CapsuleOntologyBinding;
    expect(ontologyBinding.domainId).toBe('armed-conflict-security');
    expect(ontologyBinding.acoPrimitives).toContain('Actor');
    expect(ontologyBinding.acoPrimitives).toContain('Claim');
    expect(capsule.retrievalPolicy.freshnessWindowDays).toBe(30);
  });

  it('falls back to generic when classifier confidence is below the floor', async () => {
    domainMocks.classifyDomain.mockResolvedValueOnce(classification('armed-conflict-security', 0.2));

    const result = await buildInstantContextCapsule({
      uid: 'u1',
      prompt: 'Give me a broad policy scan.',
    });

    const ontologyBinding = result.turnCapsule.injectableContext.capsule.ontologyBinding as CapsuleOntologyBinding;
    expect(ontologyBinding.domainId).toBe('generic');
  });

  it('renders the instant prompt block and trust metadata', async () => {
    const result = await buildInstantContextCapsule({
      uid: 'u1',
      prompt: 'What are current claims and source gaps?',
    });

    const capsule = result.capsuleContext.capsule;
    expect(result.capsuleContext.promptBlock).toContain('<praxis-context-capsule-instant>');
    expect(result.capsuleContext.promptBlock).toContain('LIVE SEARCH');
    expect(result.capsuleContext.promptBlock).toContain('sourcing_policy:');
    expect(capsule.trust.level).toBe('amber');
    expect(capsule.community.tags).toContain('instant-context');
  });

  it('sets as-of temporality and widens recency for temporal prompts', async () => {
    const baseline = await buildInstantContextCapsule({
      uid: 'u1',
      prompt: 'Assess current armed conflict security claims.',
    });
    const temporal = await buildInstantContextCapsule({
      uid: 'u1',
      prompt: 'What happened last week before the ceasefire deadline in this armed conflict?',
    });

    const temporality = temporal.capsuleContext.capsule.temporality as CapsuleTemporality;
    const baselineFreshness = baseline.capsuleContext.capsule.retrievalPolicy.freshnessWindowDays;
    const temporalFreshness = temporal.capsuleContext.capsule.retrievalPolicy.freshnessWindowDays;
    expect(new Date(temporality.asOf ?? '').toISOString()).toBe(temporality.asOf);
    expect(temporality.timelineAnchors).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'as-of' })]),
    );
    expect(temporalFreshness).toBeGreaterThan(baselineFreshness!);
    expect(temporalFreshness).toBeGreaterThanOrEqual(1095);
  });
});

function classification(domainId: DomainId, confidence: number): ClassifyResult {
  return {
    domainId,
    confidence,
    rationale: `mock ${domainId} classification`,
    alternatives: [],
  };
}

function domainConfig(id: DomainId): MergedDomainConfig {
  return {
    id,
    name: id,
    description: `Mock ${id} domain`,
    parentId: id === 'generic' ? null : 'generic',
    lensWeights: {} as MergedDomainConfig['lensWeights'],
    preferredFeeds: ['reliefweb', 'un-news'],
    frameworks: ['Glasl Escalation', 'Fisher-Ury'],
    promptOverrides: {},
    defaultAudience: null,
    colorHex: '#0F172A',
    icon: 'shield',
    version: 1,
    schemaVersion: 1,
    inheritanceTrace: {
      parent: id === 'generic' ? null : 'generic',
      inheritedFields: [],
      overriddenFields: [],
    },
  };
}
