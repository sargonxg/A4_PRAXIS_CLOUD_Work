import { describe, expect, it } from 'vitest';
import { CreateAgentRunRequestSchema } from '@/app/api/agents/runs/route';

describe('agent run API validation schema', () => {
  it('accepts a minimal queued manual run request', () => {
    const parsed = CreateAgentRunRequestSchema.safeParse({
      objective: 'Prepare a sourceability pass for the active capsule.',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.triggerType).toBe('manual');
    }
  });

  it('rejects missing objective and oversized runtime bounds', () => {
    expect(CreateAgentRunRequestSchema.safeParse({}).success).toBe(false);
    expect(CreateAgentRunRequestSchema.safeParse({
      objective: 'Run',
      maxStep: 101,
    }).success).toBe(false);
    expect(CreateAgentRunRequestSchema.safeParse({
      objective: 'Run',
      maxSessionMinutes: 24 * 60 + 1,
    }).success).toBe(false);
  });

  it('accepts selected capsule core pointers without requiring model/tool execution fields', () => {
    const parsed = CreateAgentRunRequestSchema.safeParse({
      capsuleId: 'cap-1',
      contextPackageId: 'pack-1',
      objective: 'Queue only.',
      selectedCoreIds: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['source-1'],
        toolCoreIds: ['policy-memo'],
      },
    });

    expect(parsed.success).toBe(true);
  });
});
