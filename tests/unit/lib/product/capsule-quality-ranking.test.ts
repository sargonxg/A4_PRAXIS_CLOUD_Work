import { describe, expect, it } from 'vitest';

import {
  buildCapsuleQualityRankingReport,
  rankCapsuleStarter,
} from '@/lib/product/capsule-quality-ranking';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
} from '@/lib/product/context-capsules';

describe('capsule quality ranking', () => {
  it('builds a deterministic P1 queue for the 20 weakest starter capsules', () => {
    const report = buildCapsuleQualityRankingReport({
      generatedAt: '2026-06-11T00:00:00.000Z',
      weakestCount: 20,
    });

    expect(report.catalogVersion).toBe(CAPSULE_STARTER_CATALOG_VERSION);
    expect(report.total).toBe(CAPSULE_STARTER_DEFINITIONS.length);
    expect(report.weakest).toHaveLength(20);
    expect(report.summary.reviewProposalCount).toBeGreaterThanOrEqual(20);
    expect(report.summary.reviewProposalTargetCounts).toMatchObject({
      'claimLedgerSeeds': expect.any(Number),
      'researchDossier.sourceSpine': expect.any(Number),
    });

    for (let index = 1; index < report.ranked.length; index += 1) {
      expect(report.ranked[index].score).toBeGreaterThanOrEqual(report.ranked[index - 1].score);
    }

    for (const item of report.weakest) {
      expect(item.rank).toBeGreaterThanOrEqual(1);
      expect(item.reviewProposals.length, `${item.starterId} proposals`).toBeGreaterThanOrEqual(1);
      expect(item.reviewProposals.every((proposal) => proposal.reviewStatus === 'proposed')).toBe(true);
      expect(item.reviewProposals.every((proposal) => proposal.evidenceSourceIds.length >= 1)).toBe(true);
      expect(item.weakestSignals.length, `${item.starterId} signals`).toBeGreaterThanOrEqual(3);
      expect(item).not.toHaveProperty('averageRating');
      expect(item).not.toHaveProperty('userRating');
    }
  });

  it('ranks an individual starter from capsule-native quality signals', () => {
    const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === 'starter-tool-assumption-stress-test')!;
    const item = rankCapsuleStarter(starter, { generatedAt: '2026-06-11T00:00:00.000Z' });

    expect(item.starterId).toBe(starter.starterId);
    expect(item.metrics.map((metric) => metric.id)).toEqual([
      'audit',
      'sourceSpine',
      'claimLedger',
      'embeddedGraph',
      'tacitKnowledge',
      'agentContract',
      'freshness',
    ]);
    expect(item.score).toBeGreaterThan(0);
    expect(item.score).toBeLessThanOrEqual(100);
    expect(item.reviewProposalTargets.length).toBeGreaterThanOrEqual(1);
    expect(item.reviewProposals.every((proposal) => proposal.generatedBy.match(/capsule-quality/))).toBe(true);
  });
});
