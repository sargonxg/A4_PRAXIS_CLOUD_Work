import { describe, expect, it, vi } from 'vitest';
import { releaseFirebaseRules, rulesHash } from '../../../scripts/deploy-firebase-rules.mjs';

const sources = { 'firestore.rules': 'firestore source', 'storage.rules': 'firestore.exists(owner)' };
const expectedHashes = Object.fromEntries(Object.entries(sources).map(([file, source]) => [file, rulesHash(source)]));
function fixture(allowStorage = true) {
  const releases = new Map<string, string>();
  const request = vi.fn(async (url: string, options: { method: string; body?: Record<string, unknown> }) => {
    if (url.endsWith('/projects/praxisbytacitus')) return { ok: true, data: { projectId: 'praxisbytacitus', projectNumber: '852128226674' } };
    if (url.endsWith(':getIamPolicy')) return { ok: true, data: { bindings: allowStorage ? [{ role: 'roles/firebaserules.firestoreServiceAgent', members: ['serviceAccount:service-852128226674@gcp-sa-firebasestorage.iam.gserviceaccount.com'] }] : [] } };
    if (url.endsWith(':test')) return { ok: true, data: {} };
    if (url.endsWith('/rulesets')) return { ok: true, data: { name: `projects/praxisbytacitus/rulesets/${releases.size ? 'storage' : 'firestore'}` } };
    if (url.includes('/rulesets/')) return { ok: true, data: { source: { files: [{ name: url.endsWith('/storage') ? 'storage.rules' : 'firestore.rules', content: url.endsWith('/storage') ? sources['storage.rules'] : sources['firestore.rules'] }] } } };
    const name = url.split('/v1/')[1];
    if (options.method === 'PATCH') releases.set(name, (options.body?.release as { rulesetName: string }).rulesetName);
    return { ok: true, data: { name, rulesetName: releases.get(name) ?? 'projects/praxisbytacitus/rulesets/previous' } };
  });
  return { project: 'praxisbytacitus', bucket: 'praxisbytacitus.firebasestorage.app', sources, expectedHashes, request };
}

describe('project-scoped Firebase Rules deployment', () => {
  it('rejects changed source hashes before any network request', async () => {
    const options = fixture();
    await expect(releaseFirebaseRules({ ...options, expectedHashes: {} })).rejects.toThrow('rules_hash_rejected');
    expect(options.request).not.toHaveBeenCalled();
  });
  it('rejects a different project or bucket before any request', async () => {
    const options = fixture();
    await expect(releaseFirebaseRules({ ...options, project: 'another-project' })).rejects.toThrow('rules_target_rejected');
    await expect(releaseFirebaseRules({ ...options, bucket: 'another-bucket' })).rejects.toThrow('rules_target_rejected');
    expect(options.request).not.toHaveBeenCalled();
  });
  it('defaults to reading and compiling without release or ruleset mutation', async () => {
    const options = fixture();
    expect((await releaseFirebaseRules(options)).status).toBe('preflight_passed');
    expect(options.request.mock.calls.filter(([url, opts]) => url.endsWith('/rulesets') || opts.method === 'PATCH')).toHaveLength(0);
  });
  it('fails before deployment if cross-service Storage access is unverified', async () => {
    const options = fixture(false);
    await expect(releaseFirebaseRules({ ...options, apply: true })).rejects.toThrow('storage_cross_service_permission_unverified');
    expect(options.request.mock.calls.filter(([url, opts]) => url.endsWith('/rulesets') || opts.method === 'PATCH')).toHaveLength(0);
  });
  it('can release only Firestore while Storage remains unpublished and erasure stays disabled', async () => {
    const options = fixture(false);
    const receipt = await releaseFirebaseRules({ ...options, only: 'firestore', apply: true });
    expect(receipt.status).toBe('deployed_readback_verified');
    expect(receipt.releases).toHaveLength(1);
    expect(options.request.mock.calls.some(([url]) => url.endsWith(':getIamPolicy'))).toBe(false);
  });
  it('applies only checked sources and verifies release and source readback', async () => {
    const options = fixture();
    const receipt = await releaseFirebaseRules({ ...options, apply: true });
    expect(receipt.status).toBe('deployed_readback_verified');
    expect(receipt.propagationVerified).toBe(false);
    expect(receipt.releases.every((entry: { deployed: boolean }) => entry.deployed)).toBe(true);
    expect(options.request.mock.calls.filter(([, opts]) => opts.method === 'PATCH')).toHaveLength(2);
  });
});
