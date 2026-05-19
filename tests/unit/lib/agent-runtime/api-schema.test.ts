import { describe, expect, it } from 'vitest';
import {
  AgentRunOutputSchema,
  CreateManualAgentRunRequestSchema,
  GetAgentRunParamsSchema,
  ListAgentRunsQuerySchema,
  toAgentRunOutput,
} from '@/lib/agent-runtime/schema';

describe('agent run API validation schema', () => {
  it('accepts a minimal queued manual run request', () => {
    const parsed = CreateManualAgentRunRequestSchema.safeParse({
      objective: 'Prepare a sourceability pass for the active capsule.',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.triggerType).toBe('manual');
    }
  });

  it('rejects missing objective and oversized runtime bounds', () => {
    expect(CreateManualAgentRunRequestSchema.safeParse({}).success).toBe(false);
    expect(CreateManualAgentRunRequestSchema.safeParse({
      objective: 'Run',
      maxStep: 101,
    }).success).toBe(false);
    expect(CreateManualAgentRunRequestSchema.safeParse({
      objective: 'Run',
      maxSessionMinutes: 24 * 60 + 1,
    }).success).toBe(false);
  });

  it('accepts selected capsule core pointers without requiring model/tool execution fields', () => {
    const parsed = CreateManualAgentRunRequestSchema.safeParse({
      capsuleId: 'cap-1',
      contextPackageId: 'pack-1',
      policyAgentId: 'research-memo',
      outputDestination: 'memo_studio',
      objective: 'Queue only.',
      selectedCoreIds: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['source-1'],
        toolCoreIds: ['policy-memo'],
      },
    });

    expect(parsed.success).toBe(true);
  });

  it('validates route params and list query values', () => {
    expect(GetAgentRunParamsSchema.parse({ runId: ' run-1 ' })).toEqual({ runId: 'run-1' });
    expect(ListAgentRunsQuerySchema.parse({ capsuleId: 'cap-1', limit: '10' })).toEqual({ capsuleId: 'cap-1', limit: 10 });
    expect(ListAgentRunsQuerySchema.safeParse({ limit: '10' }).success).toBe(false);
  });

  it('builds a normal UI-safe run output DTO', () => {
    const dto = toAgentRunOutput({
      id: 'run-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-15T12:00:00.000Z',
      updatedAt: '2026-05-15T12:00:00.000Z',
      objective: 'Prepare memo',
      internalEstimatedCostCents: 25,
      internalSpendCents: 10,
    } as never);

    expect(dto).toEqual({
      runId: 'run-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-15T12:00:00.000Z',
      updatedAt: '2026-05-15T12:00:00.000Z',
      objective: 'Prepare memo',
      policyAgentId: null,
      policyAgentLabel: null,
      outputDestination: null,
      outputHref: null,
      readiness: null,
      riskLevel: null,
      contextReceipt: {
        activeCapsuleOrChain: 'cap-1',
        selectedTools: [],
        outputDestination: null,
        sourcePosture: null,
      },
    });
    expect(AgentRunOutputSchema.safeParse(dto).success).toBe(true);
    expect('internalSpendCents' in dto).toBe(false);
  });

  it('exposes a sanitized context receipt for agent workspaces', () => {
    const dto = toAgentRunOutput({
      id: 'run-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-19T12:00:00.000Z',
      updatedAt: '2026-05-19T12:00:00.000Z',
      objective: 'Prepare memo',
      metadata: {
        policyAgentId: 'research-memo',
        outputDestination: 'memo_studio',
        appliedCapsules: [
          { id: 'starter-user-generic-analyst', label: 'Generic analyst', role: 'user' },
          { id: 'situation-cap', label: 'Situation core', role: 'situation' },
        ],
        selectedTools: ['sourceability-check'],
        sourcePosture: 'Grounded',
      },
    } as never);

    expect(dto.contextReceipt).toEqual({
      activeCapsuleOrChain: 'Generic analyst + Situation core',
      selectedTools: ['sourceability-check'],
      outputDestination: 'memo_studio',
      sourcePosture: 'Grounded',
    });
  });
});
