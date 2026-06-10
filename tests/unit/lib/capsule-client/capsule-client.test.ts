import { describe, expect, it, vi } from 'vitest';
import {
  CapsuleClientUnavailableError,
  CapsuleContextPackSchema,
  createCapsuleClient,
  parseCapsuleContextPack,
} from '@/lib/capsule-client';

describe('capsule client', () => {
  it('serves validated fixture manifests, graph previews, and marketplace listings', async () => {
    const client = createCapsuleClient({ mode: 'fixture' });

    const manifest = await client.getManifest('fixture-user-policy-director');
    const graphPreview = await client.getGraphPreview('fixture-user-policy-director');
    const listings = await client.listMarketplace();

    expect(manifest.type).toBe('user');
    expect(manifest.digest).toMatch(/^digest:/);
    expect(graphPreview.nodes.map((node) => node.id)).toContain(manifest.id);
    expect(listings.map((listing) => listing.capsuleId)).toContain('fixture-tool-sourceability-matrix');
  });

  it('builds capsule sets and refreshes the digest when attached capsules change', async () => {
    const client = createCapsuleClient({ mode: 'fixture' });

    const baseSet = await client.combineCapsules({
      capsuleIds: ['fixture-user-policy-director', 'fixture-situation-nordalia-corridor'],
    });
    const expandedSet = await client.combineCapsules({
      capsuleIds: [
        'fixture-user-policy-director',
        'fixture-situation-nordalia-corridor',
        'fixture-output-options-memo',
      ],
    });
    const pack = await client.getContextPack(expandedSet);

    expect(baseSet.digest).toMatch(/^digest:/);
    expect(expandedSet.digest).toMatch(/^digest:/);
    expect(expandedSet.digest).not.toBe(baseSet.digest);
    expect(pack.digest).toBe(expandedSet.digest);
    expect(pack.contributions).toHaveLength(3);
    expect(pack.runtimeContract.export.blockOnViolations).toBe(true);
  });

  it('records read receipts with capsule and context-pack digests', async () => {
    const client = createCapsuleClient({ mode: 'fixture' });
    const set = await client.combineCapsules({
      capsuleIds: ['fixture-user-policy-director'],
    });

    const receipt = await client.recordReadReceipt({
      readerId: 'test-reader',
      capsuleIds: set.capsuleIds,
      contextPackDigest: set.digest,
    });

    expect(receipt.id).toMatch(/^receipt-/);
    expect(receipt.contextPackDigest).toBe(set.digest);
    expect(receipt.capsuleIds).toEqual(set.capsuleIds);
  });

  it('rejects invalid context-pack payloads at the boundary', () => {
    expect(() => CapsuleContextPackSchema.parse({ id: 'bad-pack' })).toThrow();
    expect(() => parseCapsuleContextPack({ id: 'bad-pack' })).toThrow();
  });

  it('validates local API responses before returning them', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'bad-pack' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    const client = createCapsuleClient({
      mode: 'localApi',
      baseUrl: 'http://127.0.0.1:8787/',
      fetchImpl,
    });

    await expect(client.getContextPack({ capsuleIds: ['fixture-user-policy-director'] })).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/v1/context-packs',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('fails disabled mode with a structured unavailable error', async () => {
    const client = createCapsuleClient({ mode: 'disabled' });

    await expect(client.listMarketplace()).rejects.toBeInstanceOf(CapsuleClientUnavailableError);
    await expect(client.getManifest('fixture-user-policy-director')).rejects.toThrow('Capsule client is disabled');
  });
});
