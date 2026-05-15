import { describe, expect, it } from 'vitest';
import {
  assertAgentRunTransition,
  canTransitionAgentRun,
  makeAgentRunEvent,
  makeIdempotencyKey,
  normalizeCreateAgentRunInput,
  normalizePointer,
} from '@/lib/agent-runtime/state';

describe('agent runtime state helpers', () => {
  it('allows only explicit run status transitions', () => {
    expect(canTransitionAgentRun('queued', 'running')).toBe(true);
    expect(canTransitionAgentRun('running', 'waiting_approval')).toBe(true);
    expect(canTransitionAgentRun('waiting_approval', 'running')).toBe(true);
    expect(canTransitionAgentRun('running', 'succeeded')).toBe(true);
    expect(canTransitionAgentRun('succeeded', 'running')).toBe(false);
    expect(() => assertAgentRunTransition('failed', 'running')).toThrow('Invalid agent run transition');
  });

  it('creates normalized run events with trace and timestamps', () => {
    const event = makeAgentRunEvent({
      runId: ' run/one ',
      ownerUid: 'user-1',
      capsuleId: 'cap?one',
      eventType: 'Run Queued',
      toStatus: 'queued',
      createdAt: new Date('2026-05-15T10:00:00.000Z'),
    });

    expect(event.runId).toBe('run/one');
    expect(event.capsuleId).toBe('cap-one');
    expect(event.eventType).toBe('run_queued');
    expect(event.toStatus).toBe('queued');
    expect(event.createdAt).toBe('2026-05-15T10:00:00.000Z');
    expect(event.traceId).toBeTruthy();
  });

  it('normalizes capsule, package, and core pointers for queued runs', () => {
    const normalized = normalizeCreateAgentRunInput({
      ownerUid: 'user-1',
      capsuleId: ' cap bad ',
      contextStackId: 'stack/bad?x',
      contextPackageId: 'pack one',
      triggerType: 'manual',
      objective: '  Draft   memo  ',
      maxStep: 500,
      maxSessionMinutes: 0,
      selectedCoreIds: {
        sourceCoreIds: ['source/1', 'source/1', 'source bad'],
        situationCoreId: 'sit?1',
      },
    });

    expect(normalized.capsuleId).toBe('cap-bad');
    expect(normalized.contextStackId).toBe('stack/bad-x');
    expect(normalized.contextPackageId).toBe('pack-one');
    expect(normalized.objective).toBe('Draft memo');
    expect(normalized.maxStep).toBe(100);
    expect(normalized.maxSessionMinutes).toBe(30);
    expect(normalized.selectedCoreIds.sourceCoreIds).toEqual(['source/1', 'source-bad']);
    expect(normalized.selectedCoreIds.situationCoreId).toBe('sit-1');
  });

  it('makes stable idempotency keys for equivalent run requests', () => {
    const one = makeIdempotencyKey({
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      triggerType: 'manual',
      objective: 'Draft memo',
      contextPackageId: 'pack-1',
    });
    const two = makeIdempotencyKey({
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      triggerType: 'manual',
      objective: 'Draft   memo',
      contextPackageId: 'pack-1',
    });

    expect(one).toBe(two);
    expect(one).toHaveLength(64);
  });

  it('keeps slash pointers but removes unsafe pointer characters', () => {
    expect(normalizePointer('users/u1/capsules/cap?x', 'default')).toBe('users/u1/capsules/cap-x');
  });
});
