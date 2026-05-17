import { describe, expect, it } from 'vitest';
import {
  agentToolRequiresApproval,
  getAgentToolDefinition,
  listAgentToolDefinitions,
} from '@/lib/agent-runtime/tool-registry';

describe('agent tool registry', () => {
  it('rejects unknown tools', () => {
    expect(() => getAgentToolDefinition('missing-tool')).toThrow('Unknown agent tool');
  });

  it('exposes schema, risk, required cores, persistence target, and approval policy for every V1 tool', () => {
    for (const tool of listAgentToolDefinitions()) {
      expect(tool.id).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.outputSchema).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(tool.risk);
      expect(Array.isArray(tool.requiredCores)).toBe(true);
      expect(tool.persistenceTarget).toBeTruthy();
      expect(['auto', 'approval_required']).toContain(tool.approvalPolicy);
    }
    expect(getAgentToolDefinition('policy-memo')).toMatchObject({
      risk: 'medium',
      persistenceTarget: 'memo',
      approvalPolicy: 'auto',
    });
    expect(getAgentToolDefinition('deep-search-agent')).toMatchObject({
      risk: 'medium',
      persistenceTarget: 'source_receipt',
      approvalPolicy: 'auto',
    });
    expect(getAgentToolDefinition('document-retrieve')).toMatchObject({
      risk: 'low',
      persistenceTarget: 'run_event',
      approvalPolicy: 'auto',
    });
    expect(agentToolRequiresApproval('graph-mutation')).toBe(true);
    expect(agentToolRequiresApproval('capsule-evidence-pack')).toBe(false);
  });
});
