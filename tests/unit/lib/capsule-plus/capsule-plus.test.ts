import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  CapsulePlusBundleSchema,
  CapsulePlusGraphProposalSchema,
  CapsulePlusGraphEdgeSchema,
  CapsulePlusGraphNodeSchema,
  buildCapsulePlusExportBundle,
  buildPraxisCapsuleFilename,
  materializeCapsulePlusBundle,
  parseCapsulePlusImportBundle,
} from '@/lib/capsule-plus';
import { normalizeContextCapsuleV2 } from '@/lib/context/capsule-v2';
import { normalizeContextCapsuleV3 } from '@/lib/context/capsule-v3';

const baseProvenance = {
  sourceIds: ['src-1'],
  documentIds: ['doc-1'],
  runIds: ['run-1'],
  confidence: 0.82,
  reviewState: 'proposed' as const,
};

describe('Capsule+ graph contract', () => {
  it('accepts owner-scoped graph nodes and edges with provenance', () => {
    const node = CapsulePlusGraphNodeSchema.parse({
      id: 'node-decision-1',
      capsuleId: 'cap-1',
      ownerUid: 'u1',
      type: 'Decision',
      label: 'Ministerial decision window',
      properties: { due: '2026-05-30' },
      provenance: baseProvenance,
      reviewState: 'proposed',
    });
    const edge = CapsulePlusGraphEdgeSchema.parse({
      id: 'edge-1',
      capsuleId: 'cap-1',
      ownerUid: 'u1',
      fromNodeId: 'node-decision-1',
      toNodeId: 'node-source-1',
      type: 'SUPPORTED_BY',
      provenance: baseProvenance,
      reviewState: 'proposed',
    });

    expect(node.type).toBe('Decision');
    expect(edge.type).toBe('SUPPORTED_BY');
    expect(edge.provenance.sourceIds).toEqual(['src-1']);
  });

  it('rejects graph rows without owner, capsule, or provenance', () => {
    expect(() => CapsulePlusGraphNodeSchema.parse({
      id: 'node-bad',
      type: 'Claim',
      label: 'Unsupported claim',
      reviewState: 'draft',
    })).toThrow();
    expect(() => CapsulePlusGraphEdgeSchema.parse({
      id: 'edge-bad',
      capsuleId: 'cap-1',
      ownerUid: 'u1',
      fromNodeId: 'a',
      toNodeId: 'b',
      type: 'SUPPORTS',
      reviewState: 'draft',
    })).toThrow();
  });

  it('builds portable .praxis bundles with required files', async () => {
    const bundle = CapsulePlusBundleSchema.parse({
      manifest: {
        capsuleId: 'cap-1',
        ownerUid: 'u1',
        schemaVersion: 'capsule-plus.v1',
        graphVersion: 1,
        exportedAt: '2026-05-19T12:00:00.000Z',
        runtimeLabel: 'Postgres embedded graph',
      },
      capsule: { capsuleId: 'cap-1', ownerUid: 'u1', label: 'Decision Clock Capsule+' },
      nodes: [{
        id: 'node-deadline-1',
        capsuleId: 'cap-1',
        ownerUid: 'u1',
        type: 'Deadline',
        label: 'Cabinet submission deadline',
        properties: {},
        provenance: baseProvenance,
        reviewState: 'approved',
      }],
      edges: [],
      proposals: [],
      sourceReceipts: [{ id: 'src-1', title: 'Receipt', url: 'https://example.com', capturedAt: '2026-05-19T12:00:00.000Z' }],
    });

    const zipBuffer = await buildCapsulePlusExportBundle(bundle);
    const zip = await JSZip.loadAsync(zipBuffer);

    for (const path of [
      'manifest.json',
      'capsule.json',
      'graph/nodes.jsonl',
      'graph/edges.jsonl',
      'graph/proposals.jsonl',
      'receipts/source-receipts.jsonl',
      'sql/postgres-seed.sql',
      'README.md',
    ]) {
      expect(zip.file(path), `${path} missing`).toBeTruthy();
    }
    await expect(zip.file('graph/nodes.jsonl')?.async('string')).resolves.toContain('node-deadline-1');
    await expect(zip.file('sql/postgres-seed.sql')?.async('string')).resolves.toContain('graph_nodes');
  });

  it('creates portable .praxis filenames from capsule metadata', () => {
    expect(buildPraxisCapsuleFilename({
      label: 'Governance Review',
      capsuleId: 'AB34-governance-review',
      scope: 'user',
      tags: ['domain:governance'],
      exportedAt: '2026-05-19T12:00:00.000Z',
    })).toBe('governance_AB34_2026.praxis');
  });

  it('keeps graph proposals tied to ontology stacks and review cards', () => {
    const proposal = CapsulePlusGraphProposalSchema.parse({
      proposalId: 'proposal-1',
      capsuleId: 'cap-1',
      ownerUid: 'u1',
      graphVersion: 2,
      ontologyStackId: 'ontology-stack-1',
      reviewCardId: 'review-card-1',
      nodes: [],
      edges: [],
      unsupportedClaims: ['Unsupported actor influence claim.'],
      reviewState: 'proposed',
      createdAt: '2026-05-19T12:00:00.000Z',
    });

    expect(proposal.ontologyStackId).toBe('ontology-stack-1');
    expect(proposal.reviewCardId).toBe('review-card-1');
  });

  it('materializes v3 claims and sources into a reviewable Capsule+ graph proposal', () => {
    const capsule = normalizeContextCapsuleV3(normalizeContextCapsuleV2({
      capsuleId: 'cap-graph',
      ownerUid: 'u1',
      label: 'Graph capsule',
      summary: 'Source-backed claim graph.',
      version: 3,
      coreRefs: { sourceCoreIds: ['src-1'], outputCoreIds: ['memo'] },
      claimLedger: [
        { claimId: 'claim-1', text: 'Access constraints are rising.', support: 'supported', sourceRefIds: ['src-1'] },
      ],
      sourceRefs: [
        { sourceId: 'src-1', label: 'Official update', publisher: 'UN', date: '2026-05-28T00:00:00.000Z' },
      ],
      outputContracts: [
        { outputId: 'memo', label: 'Decision memo', artifactType: 'memo', citationRequired: true, reviewRequired: true },
      ],
    }));

    const bundle = materializeCapsulePlusBundle(capsule);

    expect(bundle.manifest.schemaVersion).toBe('capsule-plus.v1');
    expect(bundle.nodes.some((node) => node.type === 'Claim')).toBe(true);
    expect(bundle.nodes.some((node) => node.type === 'Source')).toBe(true);
    expect(bundle.edges.some((edge) => edge.type === 'SUPPORTED_BY')).toBe(true);
    expect(bundle.proposals[0]?.reviewState).toBe('proposed');
  });

  it('refuses malformed import bundles', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({ capsuleId: 'cap-1' }));
    zip.file('capsule.json', JSON.stringify({ capsuleId: 'cap-1' }));
    const malformed = await zip.generateAsync({ type: 'nodebuffer' });

    await expect(parseCapsulePlusImportBundle(malformed, { ownerUid: 'u1' })).rejects.toThrow(/Invalid Capsule\+ bundle/);
  });
});
