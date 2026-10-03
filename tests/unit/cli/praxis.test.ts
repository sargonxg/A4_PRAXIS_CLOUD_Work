import { describe, expect, it, vi } from 'vitest';
import { remoteRequest, runCli } from '../../../cli/praxis';

describe('isolated PRAXIS CLI', () => {
  it('does not contact a server for local help and rejects unknown commands', async () => {
    const output: unknown[] = []; const request = vi.fn();
    await runCli(['help'], { write: (s) => output.push(s), fetch: request });
    expect(output.join('')).toContain('capsule'); expect(request).not.toHaveBeenCalled();
    await expect(runCli(['capsule', 'magic'])).rejects.toThrow(/command/);
  });
  it('scopes signed session authentication to the configured origin and forbids redirects', async () => {
    const request = vi.fn().mockResolvedValue(new Response('{"runs":[]}', { headers: { 'content-type': 'application/json' } }));
    await remoteRequest('/api/agents/runs?capsuleId=x', 'GET', undefined, { baseUrl: 'https://praxis.example', session: 'signed-session', authOrigin: 'https://praxis.example', fetch: request });
    expect(request.mock.calls[0][1].redirect).toBe('error');
    await expect(remoteRequest('/api/agents/runs', 'GET', undefined, { baseUrl: 'https://other.example', session: 'secret', authOrigin: 'https://praxis.example', fetch: request })).rejects.toThrow(/origin/);
    await expect(remoteRequest('/api/agents/runs', 'GET', undefined, { baseUrl: 'http://example.com', session: 'secret', authOrigin: 'http://example.com', fetch: request })).rejects.toThrow(/HTTPS/);
    await expect(remoteRequest('//other.example/api', 'GET', undefined, { baseUrl: 'https://praxis.example', session: 'secret', authOrigin: 'https://praxis.example', fetch: request })).rejects.toThrow(/path|origin/);
  });
});
