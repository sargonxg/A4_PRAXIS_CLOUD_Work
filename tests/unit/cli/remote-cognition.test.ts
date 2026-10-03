import { describe, expect, it, vi } from 'vitest';
import { runCli, remoteArtifact, remoteRequest } from '../../../cli/praxis';
import { CAPSULE_MIMETYPE, packCapsule, bytesDigest } from '@/lib/cognitive-capsule/package';
import { PraxisMcpTools } from '../../../cli/mcp-tools';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';

const session = encodeURIComponent(JSON.stringify({ token: 'private-token' }) + '.' + 'a'.repeat(43));
function options() {
  const request = vi.fn<typeof fetch>(async () => new Response('{}', { headers: { 'content-type': 'application/json' } }));
  return { session, baseUrl: 'https://praxis.example', authOrigin: 'https://praxis.example', fetch: request, write: vi.fn() };
}
describe('authenticated cognition CLI and MCP boundary', () => {
  it('validates exact native bytes and digest without reserializing archives', async () => {
    const opts = options(); const bytes = await packCapsule(createCognitiveCapsule('owner/test', '1.0.0'));
    opts.fetch.mockImplementation(async () => new Response(new Uint8Array(bytes), { headers: { 'content-type': CAPSULE_MIMETYPE, 'X-Capsule-Digest': bytesDigest(bytes) } }));
    const result = await remoteArtifact('/api/context/capsule-registry/artifact?name=owner%2Ftest&version=1.0.0', opts, true);
    expect(result.bytes).toEqual(Buffer.from(bytes)); expect(result.capsule.capsuleId).toBe('owner/test');
    opts.fetch.mockImplementation(async () => new Response(new Uint8Array(bytes), { headers: { 'content-type': CAPSULE_MIMETYPE, 'X-Capsule-Digest': `sha256:${'a'.repeat(64)}` } }));
    await expect(remoteArtifact('/api/context/capsule-registry/artifact', opts, true)).rejects.toThrow(/digest/);
  });
  it('does not expose credentials from network exceptions or normalized non-API paths', async () => {
    const opts = options(); opts.fetch.mockRejectedValue(new Error('private-token raw network failure'));
    await expect(remoteRequest('/api/auth/session', 'GET', undefined, opts)).rejects.toThrow('PRAXIS network request failed.');
    await expect(remoteRequest('/api/../outside', 'GET', undefined, opts)).rejects.toThrow(/normalized/);
    expect(opts.fetch).toHaveBeenCalledTimes(1);
  });
  it('reads cognition, saved history and semantic diff through the same owner API', async () => {
    const opts = options();
    await runCli(['cognition', 'inspect', 'c1', '--cursor', 'opaque'], opts);
    await runCli(['cognition', 'history', 'c1'], opts);
    await runCli(['cognition', 'diff', 'c1', '--from', 'v1', '--to', 'v2'], opts);
    expect(opts.fetch.mock.calls.map((call) => String(call[0]))).toEqual([
      'https://praxis.example/api/context/capsules/c1/cognition?cursor=opaque',
      'https://praxis.example/api/context/capsules/c1/history',
      'https://praxis.example/api/context/capsules/c1/diff?from=v1&to=v2',
    ]);
    await expect(runCli(['cognition', 'diff', 'c1', '--from', 'v0', '--to', '1'], opts)).rejects.toThrow(/positive/);
  });
  it('blocks remote writes and human decisions before touching files or the API', async () => {
    const opts = options();
    await expect(runCli(['cognition', 'propose', 'c1', '--input', 'absent.json'], opts)).rejects.toThrow(/allow-write/);
    await expect(runCli(['cognition', 'review', 'c1', '--input', 'absent.json', '--allow-write'], opts)).rejects.toThrow(/human-review/);
    await expect(runCli(['registry', 'install', 'owner/test', '1.0.0'], opts)).rejects.toThrow(/allow-write/);
    expect(opts.fetch).not.toHaveBeenCalled();
  });
  it('publishes only an exact saved envelope and validates update digest', async () => {
    const opts = options();
    await runCli(['registry', 'publish', 'c1', '--name', 'owner/test', '--envelope-version', '2', '--allow-write'], opts);
    expect(JSON.parse((opts.fetch.mock.calls[0][1] as RequestInit).body as string)).toEqual({ operation: 'publish', name: 'owner/test', capsuleId: 'c1', envelopeVersion: 2 });
    await expect(runCli(['registry', 'update', 'owner/test', '1.0.0', '--expected-digest', 'latest', '--allow-write'], opts)).rejects.toThrow();
    expect(opts.fetch).toHaveBeenCalledTimes(1);
  });
  it('MCP cannot accept/promote and requires operator opt-in for review-only model proposals', async () => {
    const opts = options(); const safe = new PraxisMcpTools(opts);
    await expect(safe.call('capsule_propose', { capsuleId: 'c1', capture: {} })).rejects.toThrow(/operator/);
    await expect(safe.call('capsule_accept' as never, {})).rejects.toThrow(/Unknown/);
    expect(opts.fetch).not.toHaveBeenCalled();
    const writable = new PraxisMcpTools(opts, true);
    await writable.call('capsule_propose', { capsuleId: 'c1', capture: { kind: 'question', label: 'Who?', scope: ['general'], body: 'Verify identity' } });
    expect(JSON.parse((opts.fetch.mock.calls[0][1] as RequestInit).body as string)).toMatchObject({ operation: 'model-proposal', capture: { kind: 'question' } });
    await expect(writable.call('capsule_propose', { capsuleId: 'c1', capture: {}, decision: 'accept' })).rejects.toThrow();
    expect(opts.fetch).toHaveBeenCalledTimes(1);
  });
  it('MCP views validate identity and never fabricate missing evidence', async () => {
    const opts = options(); const c = createCognitiveCapsule('c1', '1.0.0');
    opts.fetch.mockImplementation(async () => new Response(JSON.stringify({ cognition: c }), { headers: { 'content-type': 'application/json' } }));
    const tools = new PraxisMcpTools(opts);
    expect(await tools.call('capsule_evidence', { capsuleId: 'c1', evidenceIds: ['missing'] })).toMatchObject({ evidence: [], missingIds: ['missing'], factualTruthVerified: false });
    expect(await tools.call('capsule_view', { capsuleId: 'c1', objective: 'Read', role: 'researcher', scope: 'general', asOf: '2026-10-03T12:00:00Z' })).toHaveProperty('receipt');
    c.capsuleId = 'other';
    await expect(tools.call('capsule_evidence', { capsuleId: 'c1', evidenceIds: ['missing'] })).rejects.toThrow(/identity/);
  });
});
