import type { AgentToolRisk } from '@/lib/agent-runtime/types';

export type AgentApprovalThreshold = 'none' | AgentToolRisk;

const HIGH_RISK_MARKERS = [
  'browser',
  'credential',
  'email',
  'external-send',
  'filesystem',
  'graph-mutation',
  'mcp-write',
  'payment',
  'shell',
  'webhook-write',
] as const;

const MEDIUM_RISK_MARKERS = [
  'export',
  'memo',
  'notify',
  'red-team',
  'review',
  'source-scout',
] as const;

export function classifyAgentToolRisk(input: {
  toolId: string;
  declaredRisk?: AgentToolRisk | null;
  readOnly?: boolean;
}): AgentToolRisk {
  if (input.declaredRisk) return input.declaredRisk;
  const id = input.toolId.toLowerCase();
  if (HIGH_RISK_MARKERS.some((marker) => id.includes(marker))) return 'high';
  if (input.readOnly === true) return 'low';
  if (MEDIUM_RISK_MARKERS.some((marker) => id.includes(marker))) return 'medium';
  return 'low';
}

export function requiresAgentApproval(
  risk: AgentToolRisk,
  threshold: AgentApprovalThreshold = 'medium',
): boolean {
  if (threshold === 'none') return false;
  const ranks: Record<AgentToolRisk, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };
  return ranks[risk] >= ranks[threshold];
}

export function normalizeAgentApprovalThreshold(value: unknown): AgentApprovalThreshold | null {
  return value === 'none' || value === 'low' || value === 'medium' || value === 'high' ? value : null;
}
