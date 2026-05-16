import { describe, expect, it } from 'vitest';
import { registerMcpToolForAgentRuntime } from '@/lib/agent-runtime/mcp-tools';

describe('MCP agent tool adapter', () => {
  it('registers read-only MCP tools as capsule-bound low-risk tools', () => {
    const tool = registerMcpToolForAgentRuntime({
      serverId: 'Praxis Server',
      name: 'praxis.list_cases',
      title: 'List cases',
      readOnly: true,
    });

    expect(tool).toMatchObject({
      id: 'mcp:praxis-server:praxis.list_cases',
      risk: 'low',
      readOnly: true,
      capsuleBound: true,
    });
  });

  it('classifies MCP write tools as high risk by default', () => {
    const tool = registerMcpToolForAgentRuntime({
      serverId: 'ops',
      name: 'update_graph',
      readOnly: false,
    });

    expect(tool.id).toBe('mcp:ops:update_graph');
    expect(tool.risk).toBe('high');
  });
});
