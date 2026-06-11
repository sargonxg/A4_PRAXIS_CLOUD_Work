import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION,
  parseDialecticaContextExport,
} from '@/lib/context/dialectica-context-contract';

const root = process.cwd();
const routePath = join(root, 'src/app/api/context/capsules/import/dialectica/route.ts');

describe('DIALECTICA capsule import route contract', () => {
  it('exists, is authenticated, and keeps imported claims review-gated', () => {
    const source = readFileSync(routePath, 'utf8');
    expect(source).toContain('withAuth');
    expect(source).toContain('parseDialecticaContextExport');
    expect(source).toContain('createCapsule');
    expect(source).toContain('createCapsuleReviewCard');
    expect(source).toContain("target: 'claimLedger'");
    expect(source).toContain("sourceType: 'intake'");
    expect(source).toContain('proposedRowsRetainedForReview');
    expect(source).toContain('handleRouteError');
    expect(source).not.toContain('applyCapsuleReviewCard');
  });

  it('maps the published DIALECTICA contract into capsule claims and sources', () => {
    const exportPackage = parseDialecticaContextExport({
      contractVersion: DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION,
      packageId: 'pkg-001',
      exportedAt: '2026-06-01T08:00:00.000Z',
      title: 'Border ceasefire verification package',
      claims: [
        { id: 'c1', kind: 'fact', text: 'Ceasefire signed on 12 May.', sourceIds: ['s1'] },
        { id: 'c2', kind: 'conflicting_claim', text: 'Withdrawal completion is contested.', sourceIds: ['s1'] },
        { id: 'c3', kind: 'evidence_gap', text: 'No verified casualty figures after 20 May.', sourceIds: [] },
      ],
      assumptions: ['Monitors retain access to the corridor.'],
      uncertainties: ['Spoiler factions may not honour annex 2.'],
      evidenceGaps: ['Satellite confirmation of heavy-weapons pullback.'],
      sourceReceipts: [
        { id: 's1', title: 'Joint communique', url: 'https://example.org/communique', citation: 'Ministry release, 12 May 2026' },
      ],
    });

    expect(exportPackage.claims).toHaveLength(3);
    expect(exportPackage.sourceReceipts[0].id).toBe('s1');
  });
});
