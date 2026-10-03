import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
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
    const session = encodeURIComponent(JSON.stringify({ token: 'test-firebase-token' }) + '.' + 'a'.repeat(43));
    await remoteRequest('/api/agents/runs?capsuleId=x', 'GET', undefined, { baseUrl: 'https://praxis.example', session, authOrigin: 'https://praxis.example', fetch: request });
    expect(request.mock.calls[0][1].redirect).toBe('error');
    await expect(remoteRequest('/api/agents/runs', 'GET', undefined, { baseUrl: 'https://other.example', session: 'secret', authOrigin: 'https://praxis.example', fetch: request })).rejects.toThrow(/origin/);
    await expect(remoteRequest('/api/agents/runs', 'GET', undefined, { baseUrl: 'http://example.com', session: 'secret', authOrigin: 'http://example.com', fetch: request })).rejects.toThrow(/HTTPS/);
    await expect(remoteRequest('//other.example/api', 'GET', undefined, { baseUrl: 'https://praxis.example', session: 'secret', authOrigin: 'https://praxis.example', fetch: request })).rejects.toThrow(/path|origin/);
  });
  it('packs/unpacks local files without overwriting existing targets and labels eval honestly', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'praxis-cli-'));
    try {
      await writeFile(join(dir, 'input.json'), JSON.stringify(createCognitiveCapsule('local/test')));
      const output: string[] = []; const options = { cwd: dir, write: (v: string) => output.push(v) };
      await expect(runCli(['capsule', 'pack', 'input.json', '--output', 'out.capsule'], options)).rejects.toThrow(/allow-write/);
      await runCli(['capsule', 'pack', 'input.json', '--output', 'out.capsule', '--allow-write'], options);
      await expect(runCli(['capsule', 'pack', 'input.json', '--output', 'out.capsule', '--allow-write'], options)).rejects.toThrow(/EEXIST/);
      await runCli(['capsule', 'eval', 'out.capsule'], options);
      expect(JSON.parse(output.at(-1)!)).toMatchObject({ kind: 'deterministic-structural', modelAblation: false });
      await runCli(['capsule', 'unpack', 'out.capsule', '--output', 'unpacked', '--allow-write'], options);
      expect(JSON.parse(await readFile(join(dir, 'unpacked/manifest.json'), 'utf8')).capsuleId).toBe('local/test');
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it('uses actual Ask PRAXIS and manual run request shapes and redacts echoed credentials', async () => {
    const session = encodeURIComponent(JSON.stringify({ token: 'secret-token' }) + '.' + 'a'.repeat(43));
    const request = vi.fn().mockImplementation(async () => new Response('{"token":"secret-token","answer":"secret-token"}', { headers: { 'content-type': 'application/json' } }));
    const output: string[] = []; const options = { session, baseUrl: 'https://praxis.example', authOrigin: 'https://praxis.example', fetch: request, write: (v: string) => output.push(v) };
    await runCli(['ask', 'What changed?', '--capsule', 'c1'], options);
    expect(request.mock.calls[0][0]).toBe('https://praxis.example/api/ai/ask-praxis');
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ messages: [{ role: 'user', content: 'What changed?' }], capsuleId: 'c1' });
    await runCli(['run', 'Research the change', '--capsule', 'c1'], options);
    expect(JSON.parse(request.mock.calls[1][1].body)).toMatchObject({ objective: 'Research the change', capsuleId: 'c1', triggerType: 'manual' });
    expect(output.join('')).not.toContain('secret-token');
    await expect(remoteRequest('/api/auth/session', 'GET', undefined, { ...options, session: '{"token":"raw-token"}' })).rejects.toThrow(/signed/);
  });
});
