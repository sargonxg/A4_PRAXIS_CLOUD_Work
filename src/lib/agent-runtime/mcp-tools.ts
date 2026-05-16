import type { AgentToolRisk } from '@/lib/agent-runtime/types';
import { classifyAgentToolRisk } from '@/lib/agent-runtime/tool-risk';

export type McpToolDescriptor = {
  serverId: string;
  name: string;
  title?: string | null;
  description?: string | null;
  inputSchema?: unknown;
  readOnly?: boolean;
  declaredRisk?: AgentToolRisk | null;
};

export type RegisteredMcpAgentTool = {
  id: string;
  serverId: string;
  name: string;
  label: string;
  description: string | null;
  risk: AgentToolRisk;
  readOnly: boolean;
  capsuleBound: true;
  inputSchema: unknown;
};

export function registerMcpToolForAgentRuntime(tool: McpToolDescriptor): RegisteredMcpAgentTool {
  const serverId = normalizeMcpPart(tool.serverId, 'mcp-server');
  const name = normalizeMcpPart(tool.name, 'tool');
  const readOnly = tool.readOnly !== false;
  return {
    id: `mcp:${serverId}:${name}`,
    serverId,
    name,
    label: tool.title?.trim() || tool.name,
    description: tool.description?.trim() || null,
    risk: classifyAgentToolRisk({
      toolId: readOnly ? `mcp-read:${serverId}:${name}` : `mcp-write:${serverId}:${name}`,
      declaredRisk: tool.declaredRisk,
      readOnly,
    }),
    readOnly,
    capsuleBound: true,
    inputSchema: tool.inputSchema ?? null,
  };
}

function normalizeMcpPart(value: string, fallback: string): string {
  return value.trim().toLowerCase().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}
