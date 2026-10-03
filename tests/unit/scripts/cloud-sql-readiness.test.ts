import { describe, expect, it, vi } from 'vitest';
import { createCloudSqlReadinessReader } from '../../../scripts/lib/cloud-sql-readiness.mjs';

describe('deployment Cloud SQL readiness through authenticated REST', () => {
  it('uses the same build identity, caches checks and verifies actual named resources', async () => {
    const token = vi.fn(() => 'private-test-token');
    const fetcher = vi.fn<typeof fetch>(async (url, options) => {
      expect(options?.redirect).toBe('error');
      expect(options?.headers).toEqual({ Authorization: 'Bearer private-test-token' });
      return Response.json(String(url).endsWith('/databases') ? { items: [{ name: 'praxis' }, { name: 'praxis_langgraph' }] }
        : String(url).endsWith('/users') ? { items: [{ name: 'praxis_app' }] } : { name: 'praxisbytacitus-instance' });
    });
    const reader = createCloudSqlReadinessReader({ project: 'praxisbytacitus', instance: 'praxisbytacitus-instance', getAccessToken: token, fetchFn: fetcher });
    expect(await reader.hasInstance()).toBe(true);
    expect(await reader.hasDatabase('praxis')).toBe(true);
    expect(await reader.hasDatabase('praxis_langgraph')).toBe(true);
    expect(await reader.hasDatabase('absent')).toBe(false);
    expect(await reader.hasUser('praxis_app')).toBe(true);
    expect(token).toHaveBeenCalledTimes(1); expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[0][0]).toBe('https://sqladmin.googleapis.com/sql/v1beta4/projects/praxisbytacitus/instances/praxisbytacitus-instance');
  });
  it('fails closed on denied or malformed reads without exposing token state', async () => {
    const denied = createCloudSqlReadinessReader({ project: 'p', instance: 'i', getAccessToken: () => 'secret', fetchFn: async () => new Response('secret', { status: 403 }) });
    await expect(denied.hasInstance()).rejects.toThrow(/403/);
    const malformed = createCloudSqlReadinessReader({ project: 'p', instance: 'i', getAccessToken: () => 'secret', fetchFn: async () => Response.json({ items: 'secret' }) });
    await expect(malformed.hasDatabase('praxis')).rejects.toThrow(/invalid/i);
    const identity = createCloudSqlReadinessReader({ project: 'p', instance: 'i', getAccessToken: () => { throw new Error('secret'); }, fetchFn: fetch });
    await expect(identity.hasInstance()).rejects.toThrow('Unable to acquire Cloud SQL audit identity.');
  });
});
