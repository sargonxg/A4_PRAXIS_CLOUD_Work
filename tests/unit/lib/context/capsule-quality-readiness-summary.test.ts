import { describe, expect, it } from 'vitest';
import { deriveCapsuleReadinessSummary } from '@/lib/context/capsule-quality';

const now = '2026-06-12T00:00:00.000Z';

describe('deriveCapsuleReadinessSummary', () => {
  it('marks a source-backed, operable capsule as ready', () => {
    const summary = deriveCapsuleReadinessSummary({
      capsuleId: 'ready-capsule',
      label: 'Ready policy capsule',
      purpose: 'Produce a sourced options memo.',
      audience: ['policy director'],
      decisionHorizon: '2026 review cycle',
      sourcePosture: { posture: 'source_backed', freshnessWindowDays: 90 },
      sourceRefs: [{ sourceId: 'src-1', label: 'Current source', date: '2026-06-01' }],
      claimLedger: [{
        claimId: 'claim-1',
        text: 'The rule is active.',
        support: 'supported',
        sourceRefIds: ['src-1'],
        receipts: [{ sourceId: 'src-1', snippet: 'The rule is active.' }],
        validFrom: '2026-06-01',
        causalLinks: { enables: ['memo'] },
      }],
      outputContracts: [{ outputId: 'memo', label: 'Options memo' }],
      agentPermissions: { canSuggest: true, canSource: true, canFork: true, canDraft: true },
      bestNextAction: 'Draft the sourced memo.',
      temporality: { timelineAnchors: [{ id: 't1', label: 'Current review', date: '2026-06-01' }] },
      causality: { causalLinks: [{ id: 'c1', cause: 'Rule', effect: 'Memo constraint' }] },
      ontologyBinding: { domainId: 'governance', ontologyIds: ['aco:base'], acoPrimitives: ['Claim'] },
    }, { now });

    expect(summary).toMatchObject({ tier: 'ready', topBlocker: null });
    expect(summary.score).toBeGreaterThanOrEqual(75);
  });

  it('keeps capsules with no readiness data near and scoreless', () => {
    const summary = deriveCapsuleReadinessSummary({
      capsuleId: 'thin-capsule',
      label: 'Thin capsule',
    }, { now });

    expect(summary.tier).toBe('near');
    expect(Number.isNaN(summary.score)).toBe(true);
    expect(summary.topBlocker).toBeNull();
  });

  it('marks stale unsupported capsules as blocked with a top blocker', () => {
    const summary = deriveCapsuleReadinessSummary({
      capsuleId: 'blocked-capsule',
      label: 'Blocked capsule',
      sourcePosture: { posture: 'needs_sources', freshnessWindowDays: 30 },
      sourceRefs: [{ sourceId: 'src-old', label: 'Old source', date: '2025-01-01' }],
      health: { score: 32, blockers: ['Missing source receipts'], warnings: ['Source refs are stale.'] },
      claimLedger: [{
        claimId: 'claim-unsupported',
        text: 'The deadline is resolved.',
        support: 'unsupported',
        sourceRefIds: [],
      }],
      agentPermissions: { canSuggest: false, canSource: false, canFork: false, canDraft: false },
    }, { now });

    expect(summary.tier).toBe('blocked');
    expect(summary.score).toBeLessThan(45);
    expect(summary.topBlocker).toMatch(/missing|source|support|stale/i);
  });
});
