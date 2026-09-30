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
  it('retains only bounded Google denial diagnostics without raw errors or secrets', async () => {
    const options = fixture();
    const receipts: Record<string, unknown>[] = [];
    const request = vi.fn(async (url: string, opts: { method: string; body?: Record<string, unknown> }) => {
      if (!url.endsWith('/releases/cloud.firestore')) return options.request(url, opts);
      return { ok: false, status: 403, headers: { authorization: 'SECRET_HEADER' }, data: {
        error: { code: 403, status: 'PERMISSION_DENIED', message: 'SECRET_MESSAGE', stack: 'SECRET_STACK', details: [
          { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'IAM_PERMISSION_DENIED', domain: 'iam.googleapis.com', metadata: {
            permission: 'firebaserules.releases.get', service: 'firebaserules.googleapis.com', consumer: 'projects/852128226674',
            accessToken: 'SECRET_TOKEN', credential: 'SECRET_CREDENTIAL', resource: 'SECRET_RESOURCE',
          } },
          { '@type': 'type.googleapis.com/google.rpc.DebugInfo', detail: 'SECRET_DEBUG' },
        ] }, rawBody: 'SECRET_BODY',
      } };
    });
    await expect(releaseFirebaseRules({ ...options, request, only: 'firestore', apply: true, onReceipt: (receipt: Record<string, unknown>) => receipts.push(receipt) })).rejects.toThrow('rules_request_failed_403');
    expect(receipts.at(-1)).toMatchObject({ status: 'failed', failure: 'rules_request_failed_403',
      lastOperation: 'GET /v1/projects/praxisbytacitus/releases/cloud.firestore', propagationVerified: false, releases: [],
      remoteError: { status: 403, code: 403, details: [{ reason: 'IAM_PERMISSION_DENIED', domain: 'iam.googleapis.com', metadata: {
        permission: 'firebaserules.releases.get', service: 'firebaserules.googleapis.com', consumer: 'projects/852128226674',
      } }] },
    });
    expect(JSON.stringify(receipts)).not.toContain('SECRET_');
    expect(request.mock.calls.some(([url, opts]) => url.endsWith('/rulesets') || opts.method === 'PATCH')).toBe(false);
  });
  it('preserves completed preflight entries when a later Rules read is denied', async () => {
    const options = fixture();
    let lastReceipt: Record<string, unknown> = {};
    const request = vi.fn(async (url: string, opts: { method: string; body?: Record<string, unknown> }) => url.includes('/releases/firebase.storage/')
      ? { ok: false, status: 403, data: { error: { code: 403, status: 'PERMISSION_DENIED' } } }
      : options.request(url, opts));
    await expect(releaseFirebaseRules({ ...options, request, apply: true, onReceipt: (receipt: Record<string, unknown>) => { lastReceipt = receipt; } })).rejects.toThrow('rules_request_failed_403');
    expect(lastReceipt.status).toBe('failed');
    expect(lastReceipt.lastOperation).toBe('GET /v1/projects/praxisbytacitus/releases/firebase.storage/praxisbytacitus.firebasestorage.app');
    expect(lastReceipt.releases).toEqual([expect.objectContaining({ file: 'firestore.rules', compiled: true, deployed: false })]);
    expect(lastReceipt.remoteError).toEqual({ status: 403, code: 403 });
    expect(request.mock.calls.some(([url, opts]) => url.endsWith('/rulesets') || opts.method === 'PATCH')).toBe(false);
  });
  it('omits oversized identifiers, credential-like values and malformed error details', async () => {
    const options = fixture();
    let lastReceipt: Record<string, unknown> = {};
    const request = vi.fn(async () => ({ ok: false, status: 403, data: { error: { code: 'SECRET_CODE', status: 'S'.repeat(200), details: [
      null, { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'R'.repeat(300), domain: 'd'.repeat(500), metadata: {
        permission: `firebaserules.${'p'.repeat(300)}.get`, service: { secret: 'SECRET_OBJECT' }, consumer: ['SECRET_ARRAY'], unknown: 'SECRET_UNKNOWN',
      } },
      { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'Bearer SECRET_TOKEN', domain: 'eyJ.SECRET_JWT.token', metadata: {
        permission: 'Bearer SECRET_PERMISSION', service: 'Bearer SECRET_SERVICE', consumer: 'projects/SECRET_CONSUMER.key',
      } },
      { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'IAM_PERMISSION_DENIED\n', domain: 'iam.googleapis.com\n', metadata: {
        permission: 'firebaserules.releases.get\n', service: 'firebaserules.googleapis.com\n', consumer: 'projects/852128226674\n',
      } },
    ] } } }));
    await expect(releaseFirebaseRules({ ...options, request, onReceipt: (receipt: Record<string, unknown>) => { lastReceipt = receipt; } })).rejects.toThrow('rules_request_failed_403');
    expect(lastReceipt.remoteError).toEqual({ status: 403 });
    expect(JSON.stringify(lastReceipt)).not.toContain('SECRET_');
  });
});
