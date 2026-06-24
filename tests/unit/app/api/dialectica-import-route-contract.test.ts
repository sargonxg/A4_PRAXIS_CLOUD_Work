import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION,
  parseDialecticaContextExport,
} from '@/lib/context/dialectica-context-contract';
import { DIALECTICA_CAPSULE_MIMETYPE } from '@/lib/context/dialectica-capsule-import';

const root = process.cwd();
const routePath = join(root, 'src/app/api/context/capsules/import/dialectica/route.ts');
const fixtureRoot = join(root, 'tests/fixtures/dialectica-capsule');

function fixtureText(path: string): string {
  return readFileSync(join(fixtureRoot, path), 'utf8');
}

async function fixtureZip(): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file('mimetype', fixtureText('mimetype'));
  zip.file('manifest.json', fixtureText('manifest.json'));
  zip.file('claims.jsonl', fixtureText('claims.jsonl'));
  zip.file('evidence/sources.jsonl', fixtureText('evidence/sources.jsonl'));
  zip.file('episodes.json', fixtureText('episodes.json'));
  zip.file('runtime.json', fixtureText('runtime.json'));
  zip.file('graph.jsonld', fixtureText('graph.jsonld'));
  zip.file('agent_context.md', fixtureText('agent_context.md'));
  zip.file('operations.md', fixtureText('operations.md'));
  zip.file('graph/ladybug/manifest.json', JSON.stringify({ projection: 'ladybug' }));
  return zip.generateAsync({ type: 'uint8array' });
}

describe('DIALECTICA capsule import route contract', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('exists, is authenticated, and keeps imported claims review-gated', () => {
    const source = readFileSync(routePath, 'utf8');
    expect(source).toContain('withAuth');
    expect(source).toContain('parseDialecticaContextExport');
    expect(source).toContain('upsertImportedCapsule');
    expect(source).toContain('createCapsuleReviewCard');
    expect(source).toContain("target: 'claimLedger'");
    expect(source).toContain("sourceType: 'intake'");
    expect(source).toContain('proposedRowsRetainedForReview');
    expect(source).toContain('handleRouteError');
    expect(source).not.toContain('applyCapsuleReviewCard');
  });

  it('imports a real DIALECTICA spec-3.0 capsule zip through the authenticated route', async () => {
    vi.doMock('@/lib/api/with-auth', () => ({
      withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) =>
        (request: Request) => handler(request, { uid: 'route-user', isDemo: false }),
    }));
    vi.doMock('@/lib/context/capsule-service', () => ({
      createCapsule: vi.fn(),
      createCapsuleReviewCard: vi.fn(async () => ({ reviewCardId: 'review-1', state: 'owner_review' })),
      upsertImportedCapsule: vi.fn(async (_uid: string, input: Record<string, unknown>) => ({
        capsule: {
          capsuleId: input.capsuleId,
          label: input.label,
          sourceRefs: input.sourceRefs,
          claimLedger: input.claimLedger,
          importSource: input.importSource,
          provenance_root_hash: input.provenance_root_hash,
          importNotes: input.importNotes,
          version: 1,
        },
        created: true,
        updated: false,
        versionBumped: false,
        importNotes: input.importNotes,
      })),
    }));

    const { POST } = await import('@/app/api/context/capsules/import/dialectica/route');
    const zipBytes = await fixtureZip();
    const response = await POST(new Request('http://local.test/api/context/capsules/import/dialectica', {
      method: 'POST',
      headers: { 'content-type': DIALECTICA_CAPSULE_MIMETYPE },
      body: new Blob([new Uint8Array(zipBytes)], { type: DIALECTICA_CAPSULE_MIMETYPE }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.capsule).toMatchObject({
      label: 'Synthetic Border-Region Conflict Situation',
      importSource: 'dialectica',
      provenance_root_hash: 'sha256:fixture-root-hash',
    });
    expect(payload.preview).toMatchObject({
      specVersion: '3.0',
      claimCount: 1,
      sourceCount: 1,
      signaturePresent: true,
    });
    expect(payload.preview.layersBuilt).toEqual(expect.arrayContaining(['graph/ladybug/*']));
    expect(payload.proposedRowsRetainedForReview).toBe(2);
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
