import { describe, expect, it } from 'vitest';
import { listCreatedWork } from '@/lib/created-work/service';

describe('Created Work read model', () => {
  it('normalizes existing output capsules, memo drafts, handovers, tool artifacts, and Ask packs without writing storage', async () => {
    const db = new FakeFirestore();
    db.set('users/u1/conversations/conv-1', {
      conversationId: 'conv-1',
      capsuleId: 'cap-1',
      title: 'Negotiation memo conversation',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
    db.set('users/u1/conversations/conv-1/turns/turn-1', {
      prompt: 'Draft an options memo.',
      output: 'Memo body',
      capsuleId: 'cap-1',
      runtime: {
        answerEnvelope: {
          documentPackCandidate: {
            title: 'Options memo pack',
            provenance: {
              capsuleId: 'cap-1',
              capsuleVersion: 3,
              conversationId: 'conv-1',
              runId: 'run-1',
              sourceReceiptIds: ['receipt-1'],
              generatedAt: '2026-05-24T10:01:00.000Z',
            },
          },
        },
      },
      createdAt: '2026-05-24T10:01:00.000Z',
    });
    db.set('users/u1/situations/cap-1', { name: 'Capsule situation' });
    db.set('users/u1/situations/cap-1/memos/memo-1', {
      id: 'memo-1',
      title: 'Options memo draft',
      status: 'draft',
      capsuleId: 'cap-1',
      conversationId: 'conv-1',
      runId: 'run-1',
      outputCapsuleId: 'out-1',
      sourceReceiptIds: ['receipt-2'],
      createdAt: '2026-05-24T10:02:00.000Z',
      updatedAt: '2026-05-24T10:03:00.000Z',
    });
    db.set('users/u1/situations/cap-1/artifacts/artifact-1', {
      title: 'Source note artifact',
      toolId: 'ask-praxis',
      capsuleId: 'cap-1',
      conversationId: 'conv-1',
      runId: 'run-1',
      updatedAt: '2026-05-24T10:04:00.000Z',
    });
    db.set('users/u1/handover_packages/handover-1', {
      memoId: 'memo-1',
      capsuleId: 'cap-1',
      runId: 'run-1',
      signedUrl: 'https://example.test/handover.zip',
      createdAt: '2026-05-24T10:05:00.000Z',
    });

    const result = await listCreatedWork('u1', { capsuleId: 'cap-1', limit: 10 }, {
      db: db as never,
      listOutputCapsules: async () => [{
        id: 'out-1',
        ownerUid: 'u1',
        contextCapsuleId: 'cap-1',
        situationId: 'cap-1',
        templateId: 'options-memo',
        family: 'policy',
        status: 'review',
        schemaId: 'options-memo-v1',
        schemaVersion: 1,
        renderer: 'memo-blocks',
        exporters: ['md'],
        payload: { title: 'Output capsule memo', summary: 'Reviewable output.' },
        citations: [{ id: 'citation-1', title: 'Receipt', sourceReceiptId: 'receipt-3' }],
        gaps: [],
        inputCapsules: [],
        provenance: { createdBy: 'ask-praxis', toolIds: ['ask-praxis'], agentIds: ['research-memo'], traceId: 'trace-1' },
        quality: { citationCoverage: 1, unsupportedClaimCount: 0, gapCount: 0, sourceabilityStatus: 'clean', humanApproved: false, blockers: [] },
        version: 1,
        parentVersionId: null,
        createdAt: '2026-05-24T10:06:00.000Z',
        updatedAt: '2026-05-24T10:06:00.000Z',
      }],
      listRecentAgentRuns: async () => [{
        id: 'run-1',
        agentSpecId: null,
        ownerUid: 'u1',
        capsuleId: 'cap-1',
        contextStackId: 'default',
        contextPackageId: 'capsule:cap-1:v3',
        selectedCoreIds: {
          userCoreId: null,
          teamCoreId: null,
          situationCoreId: null,
          pathCoreId: null,
          sourceCoreIds: [],
          documentCoreIds: [],
          graphCoreId: null,
          timeCoreId: null,
          outputCoreIds: [],
          toolCoreIds: [],
          objectiveCoreIds: [],
          productCoreIds: [],
          memoryCoreId: null,
        },
        status: 'succeeded',
        triggerType: 'manual',
        objective: 'Draft an options memo.',
        traceId: 'trace-1',
        parentRunId: null,
        idempotencyKey: 'run-key',
        maxStep: 8,
        maxSessionMinutes: 30,
        internalEstimatedCostCents: null,
        internalSpendCents: null,
        metadata: {
          policyAgentId: 'research-memo',
          outputDestination: 'memo_studio',
          artifactIds: ['artifact-1', 'out-1'],
          sourceReceiptIds: ['receipt-4'],
        },
        createdAt: '2026-05-24T10:00:30.000Z',
        updatedAt: '2026-05-24T10:07:00.000Z',
        queuedAt: '2026-05-24T10:00:30.000Z',
        startedAt: '2026-05-24T10:00:31.000Z',
        completedAt: '2026-05-24T10:07:00.000Z',
        expiresAt: null,
      }],
    });

    expect(result.persisted).toBe(true);
    expect(result.items.map((item) => item.kind)).toEqual([
      'agent_run',
      'output_capsule',
      'handover_package',
      'tool_run_artifact',
      'memo_draft',
      'ask_document_pack',
    ]);
    expect(result.items.find((item) => item.kind === 'output_capsule')).toMatchObject({
      id: 'out-1',
      title: 'Output capsule memo',
      capsuleId: 'cap-1',
      runId: 'trace-1',
      receiptIds: ['receipt-3'],
      primaryAction: { label: 'Open output', href: '/app?panel=output-capsule&outputCapsuleId=out-1' },
    });
    expect(result.items.find((item) => item.kind === 'memo_draft')).toMatchObject({
      id: 'memo-1',
      primaryAction: { label: 'Open memo', href: '/app/write?memoId=memo-1' },
      outputCapsuleId: 'out-1',
    });
    expect(result.items.find((item) => item.kind === 'handover_package')?.primaryAction.href).toBe('https://example.test/handover.zip');
    expect(result.items.find((item) => item.kind === 'ask_document_pack')).toMatchObject({
      title: 'Options memo pack',
      conversationId: 'conv-1',
      runId: 'run-1',
      receiptIds: ['receipt-1'],
    });
  });

  it('returns demo Created Work for unauthenticated/sample mode without touching Firestore', async () => {
    const result = await listCreatedWork('demo-user-001', { demo: true });

    expect(result.persisted).toBe(false);
    expect(result.items.length).toBeGreaterThanOrEqual(3);
    expect(result.items.map((item) => item.kind)).toContain('ask_document_pack');
    expect(result.items.map((item) => item.kind)).toContain('output_capsule');
    expect(result.items.every((item) => item.mode === 'demo')).toBe(true);
  });

  it('filters Created Work recents to records owned by the signed-in user', async () => {
    const db = new FakeFirestore();
    db.set('users/u1/conversations/conv-owned', {
      ownerUid: 'u1',
      conversationId: 'conv-owned',
      capsuleId: 'cap-1',
      title: 'Owned conversation',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
    db.set('users/u1/conversations/conv-owned/turns/turn-owned', {
      ownerUid: 'u1',
      prompt: 'Owned prompt.',
      capsuleId: 'cap-1',
      runtime: {
        answerEnvelope: {
          documentPackCandidate: {
            title: 'Owned document pack',
            provenance: {
              capsuleId: 'cap-1',
              conversationId: 'conv-owned',
              generatedAt: '2026-05-24T10:01:00.000Z',
            },
          },
        },
      },
      createdAt: '2026-05-24T10:01:00.000Z',
    });
    db.set('users/u1/conversations/conv-poisoned', {
      ownerUid: 'u2',
      conversationId: 'conv-poisoned',
      capsuleId: 'cap-1',
      title: 'Poisoned conversation',
      updatedAt: '2026-05-24T10:02:00.000Z',
    });
    db.set('users/u1/conversations/conv-poisoned/turns/turn-poisoned', {
      ownerUid: 'u2',
      prompt: 'Other user prompt.',
      capsuleId: 'cap-1',
      runtime: {
        answerEnvelope: {
          documentPackCandidate: {
            title: 'Other user document pack',
            provenance: {
              capsuleId: 'cap-1',
              conversationId: 'conv-poisoned',
              generatedAt: '2026-05-24T10:03:00.000Z',
            },
          },
        },
      },
      createdAt: '2026-05-24T10:03:00.000Z',
    });

    const result = await listCreatedWork('u1', { capsuleId: 'cap-1', limit: 10 }, {
      db: db as never,
      listOutputCapsules: async () => [],
      listRecentAgentRuns: async () => [],
    });

    expect(result.items.map((item) => item.title)).toEqual(['Owned document pack']);
    expect(result.items.some((item) => item.conversationId === 'conv-poisoned')).toBe(false);
  });
});

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();

  set(path: string, value: Record<string, unknown>) {
    this.data.set(path, value);
  }

  collection(path: string) {
    return new FakeCollection(this, path);
  }
}

class FakeCollection {
  private maxDocs: number | null = null;

  constructor(private db: FakeFirestore, private path: string) {}

  doc(id: string) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  orderBy() {
    return this;
  }

  limit(count: number) {
    this.maxDocs = count;
    return this;
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]) => new FakeSnapshot(true, value, path.split('/').pop() ?? 'unknown'));
    return { docs: this.maxDocs ? docs.slice(0, this.maxDocs) : docs };
  }
}

class FakeDoc {
  constructor(private db: FakeFirestore, private path: string, public id: string) {}

  collection(name: string) {
    return new FakeCollection(this.db, `${this.path}/${name}`);
  }

  async get() {
    const value = this.db.data.get(this.path);
    return new FakeSnapshot(Boolean(value), value ?? {}, this.id);
  }
}

class FakeSnapshot {
  constructor(public exists: boolean, private value: Record<string, unknown>, public id: string) {}

  data() {
    return this.value;
  }
}
