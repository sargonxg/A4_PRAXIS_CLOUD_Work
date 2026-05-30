import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildAgentRunEventMirror,
  buildAgentRunFirestoreSnapshot,
  agentRunFirestorePath,
} from '@/lib/agent-runtime/firestore-mirror';
import type { AgentRun, AgentRunEvent } from '@/lib/agent-runtime/types';

const baseRun: AgentRun = {
  id: 'run-1',
  agentSpecId: null,
  ownerUid: 'user-1',
  capsuleId: 'cap-1',
  contextStackId: 'default',
  contextPackageId: 'pack-1',
  selectedCoreIds: {
    userCoreId: 'user-core',
    teamCoreId: null,
    situationCoreId: 'sit-core',
    pathCoreId: null,
    sourceCoreIds: ['source-1'],
    documentCoreIds: ['doc-1'],
    graphCoreId: null,
    timeCoreId: null,
    outputCoreIds: ['output-1'],
    toolCoreIds: ['grounded-search'],
    objectiveCoreIds: [],
    productCoreIds: [],
    memoryCoreId: null,
  },
  status: 'queued',
  triggerType: 'manual',
  objective: 'Draft a cited options memo',
  traceId: 'trace-1',
  parentRunId: null,
  idempotencyKey: 'idem-1',
  maxStep: 12,
  maxSessionMinutes: 30,
  internalEstimatedCostCents: null,
  internalSpendCents: 0,
  metadata: {
    policyAgentId: 'research-memo',
    policyAgentLabel: 'Research Memo Agent',
    outputTarget: 'policy_memo',
    outputTargetLabel: 'Policy memo',
    selectedTools: ['grounded-search', 'sourceability-reviewer'],
    sourceReceiptIds: ['src-1'],
    outputHref: '/app/write?memoId=memo-1',
    workflowPlan: {
      steps: [
        { id: 'plan', label: 'Plan', status: 'complete' },
        { id: 'verify', label: 'Verify', status: 'pending' },
      ],
    },
  },
  createdAt: '2026-05-30T10:00:00.000Z',
  updatedAt: '2026-05-30T10:00:00.000Z',
  queuedAt: '2026-05-30T10:00:00.000Z',
  startedAt: null,
  completedAt: null,
  expiresAt: '2026-05-30T10:30:00.000Z',
};

const runEvent: AgentRunEvent = {
  id: 'event-1',
  runId: 'run-1',
  ownerUid: 'user-1',
  capsuleId: 'cap-1',
  eventType: 'run.dispatched',
  fromStatus: null,
  toStatus: 'queued',
  message: 'Cloud Task dispatch recorded.',
  data: {
    queuePath: 'projects/p/locations/us-central1/queues/agent-runs',
    taskName: 'task-1',
    output: { memoId: 'memo-1' },
  },
  traceId: 'trace-1',
  createdAt: '2026-05-30T10:01:00.000Z',
};

describe('AgentRun Firestore mirror', () => {
  it('builds an owner-scoped run snapshot with plan, steps, output, and audit pointers', () => {
    const snapshot = buildAgentRunFirestoreSnapshot(baseRun, { latestEvent: runEvent, eventCount: 1 });

    expect(agentRunFirestorePath(baseRun.ownerUid, baseRun.id)).toBe('users/user-1/runs/run-1');
    expect(snapshot).toMatchObject({
      ownerUid: 'user-1',
      runId: 'run-1',
      capsuleId: 'cap-1',
      status: 'queued',
      plan: {
        policyAgentId: 'research-memo',
        policyAgentLabel: 'Research Memo Agent',
        outputTarget: 'policy_memo',
        selectedTools: ['grounded-search', 'sourceability-reviewer'],
      },
      outputs: {
        href: '/app/write?memoId=memo-1',
        target: 'policy_memo',
      },
      audit: {
        eventCount: 1,
        latestEventType: 'run.dispatched',
      },
    });
    expect(snapshot.steps).toHaveLength(2);
    expect(snapshot.sourceReceiptIds).toEqual(['src-1']);
  });

  it('builds event mirrors for onSnapshot timelines without exposing another owner', () => {
    expect(buildAgentRunEventMirror(runEvent)).toMatchObject({
      ownerUid: 'user-1',
      runId: 'run-1',
      eventType: 'run.dispatched',
      toStatus: 'queued',
      data: {
        queuePath: 'projects/p/locations/us-central1/queues/agent-runs',
      },
    });
  });

  it('extends Firestore rules with owner-only runs and server-only writes', () => {
    const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8');

    expect(rules).toContain('match /runs/{runId}');
    expect(rules).toContain('resource.data.ownerUid == uid');
    expect(rules).toContain('match /events/{eventId}');
    expect(rules).toContain('allow write: if false;');
  });
});
