import { describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPraxisMcpServer } from '../../../cli/mcp';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';

const session = encodeURIComponent(JSON.stringify({ token: 'private-token' }) + '.' + 'a'.repeat(43));
const authentication = { session, baseUrl: 'https://praxis.example', authOrigin: 'https://praxis.example' };

describe('PRAXIS MCP SDK transport', () => {
  it('negotiates read-only tools and serves a compiled researcher view over the protocol', async () => {
    const cognition = createCognitiveCapsule('c1', '1.0.0');
    const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ cognition }), { headers: { 'content-type': 'application/json' } }));
    const server = createPraxisMcpServer({ ...authentication, fetch: request });
    const client = new Client({ name: 'praxis-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport); await client.connect(clientTransport);
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(['capsule_search', 'capsule_inspect', 'capsule_view', 'capsule_evidence', 'registry_list', 'registry_impact', 'registry_artifact', 'run_receipt']));
      expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
      expect(tools.some((tool) => /propose|publish|install|update|deprecate|accept|promot|send/.test(tool.name))).toBe(false);
      const result = await client.callTool({ name: 'capsule_view', arguments: { capsuleId: 'c1', objective: 'Read reviewed knowledge', role: 'researcher', scope: 'general', asOf: '2026-10-03T12:00:00Z' } });
      expect(result.isError).toBeFalsy();
      const content = result.content as Array<{ type: string; text: string }>;
      expect(JSON.parse(content[0].text).receipt).toMatchObject({ capsuleId: 'c1', capsuleVersion: '1.0.0', role: 'researcher' });
      expect(request.mock.calls[0][1]?.headers).toMatchObject({ Cookie: `tacitus-auth-session=${session}` });
    } finally { await client.close(); await server.close(); }
  });

  it('advertises explicit operator writes and sends model proposals without promotion', async () => {
    const request = vi.fn<typeof fetch>(async () => new Response('{"card":{"state":"proposed"}}', { headers: { 'content-type': 'application/json' } }));
    const server = createPraxisMcpServer({ ...authentication, fetch: request }, true);
    const client = new Client({ name: 'praxis-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport); await client.connect(clientTransport);
      const { tools } = await client.listTools();
      expect(tools.find((tool) => tool.name === 'capsule_propose')?.annotations?.readOnlyHint).toBe(false);
      expect(tools.some((tool) => /accept|promot|send/.test(tool.name))).toBe(false);
      const result = await client.callTool({ name: 'capsule_propose', arguments: { capsuleId: 'c1', capture: { kind: 'question', label: 'Who?', scope: ['general'], body: 'Verify identity.' } } });
      expect(result.isError).toBeFalsy();
      expect(request.mock.calls[0][0]).toBe('https://praxis.example/api/context/capsules/c1/cognition');
      expect(JSON.parse(request.mock.calls[0][1]?.body as string)).toMatchObject({ operation: 'model-proposal', capture: { kind: 'question' } });
      expect(request.mock.calls[0][1]?.method).toBe('POST');
    } finally { await client.close(); await server.close(); }
  });
});
