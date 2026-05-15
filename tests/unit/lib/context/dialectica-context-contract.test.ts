import { describe, expect, it } from 'vitest';
import {
  DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION,
  mapDialecticaExportToContextCoreLite,
  mapDialecticaExportToPraxisPreview,
  parseDialecticaContextExport,
  type DialecticaContextExport,
} from '@/lib/context/dialectica-context-contract';

const validExport: DialecticaContextExport = {
  contractVersion: DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION,
  packageId: 'dialectica-pack-1',
  exportedAt: '2026-05-15T00:00:00.000Z',
  title: 'DIALECTICA mediation core',
  situationCoreId: 'sit-1',
  userCoreId: 'user-1',
  capsuleId: 'cap-1',
  contextPackageId: 'pack-1',
  claims: [
    { id: 'claim-1', kind: 'fact', text: 'The monitoring cell is active.', sourceIds: ['src-1'] },
    { id: 'claim-2', kind: 'evidence_gap', text: 'Confirm the latest crossing count.', sourceIds: [] },
    { id: 'claim-3', kind: 'conflicting_claim', text: 'Parties dispute access guarantees.', sourceIds: ['src-2'] },
  ],
  assumptions: ['Assume mandate language has not changed.'],
  uncertainties: ['Humanitarian access data is incomplete.'],
  evidenceGaps: ['Need updated field report.'],
  sourceReceipts: [
    {
      id: 'src-1',
      title: 'Field report',
      url: 'https://example.org/report',
      citation: 'Example Report, 2026',
      excerpt: 'Monitoring cell remains active.',
    },
    { id: 'src-2', title: 'Negotiation note' },
  ],
};

describe('DIALECTICA PRAXIS context contract', () => {
  it('validates a DIALECTICA export', () => {
    expect(parseDialecticaContextExport(validExport).packageId).toBe('dialectica-pack-1');
  });

  it('keeps unsupported gaps as gaps and conflicting claims as conflicts', () => {
    const preview = mapDialecticaExportToPraxisPreview(validExport);

    expect(preview.factClaims.map((claim) => claim.id)).toEqual(['claim-1']);
    expect(preview.evidenceGaps).toContain('Need updated field report.');
    expect(preview.evidenceGaps).toContain('Confirm the latest crossing count.');
    expect(preview.conflictingClaims.map((claim) => claim.id)).toEqual(['claim-3']);
  });

  it('preserves source receipts when mapping into PRAXIS preview', () => {
    const preview = mapDialecticaExportToPraxisPreview(validExport);

    expect(preview.sourceRefs).toEqual(['src-1', 'src-2']);
    expect(preview.sourceReceipts[0].citation).toBe('Example Report, 2026');
    expect(preview.sourceReceipts[0].excerpt).toContain('Monitoring cell');
  });

  it('maps future exports into Context Core Lite fields without promoting conflicts to facts', () => {
    const lite = mapDialecticaExportToContextCoreLite(validExport);

    expect(lite.contextPackageId).toBe('pack-1');
    expect(lite.sourceRefs).toEqual(['src-1', 'src-2']);
    expect(lite.assumptions).toEqual(['Assume mandate language has not changed.']);
    expect(lite.gaps).toContain('Conflicting claim: Parties dispute access guarantees.');
    expect(lite.gaps).toContain('Uncertainty: Humanitarian access data is incomplete.');
  });

  it('fails malformed exports', () => {
    expect(() => parseDialecticaContextExport({
      ...validExport,
      contractVersion: 'wrong',
      exportedAt: 'not-a-date',
    })).toThrow();
  });
});
