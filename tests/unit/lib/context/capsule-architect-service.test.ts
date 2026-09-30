import { describe, expect, it } from 'vitest';

import {
  createCapsule,
  createCapsuleArchitectReviewCards,
} from '@/lib/context/capsule-service';
import { buildCapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import { DocumentOwnerUnavailableError } from '@/lib/documents/owner-write';

describe('Capsule Architect review-card service', () => {
  const guardedInput = { capsuleId: 'guarded-capsule', situationId: 'source-case',
    jobPrompt: 'Inspect supplied commitments.', documents: [{ documentId: 'source-A', text: 'Actor: Example Council.' }] };

  it.each(['deleting', 'deleted', 'missing'])('rejects %s owners before committing a capsule scaffold', async (state) => {
    const db = new FakeFirestore();
    if (state === 'missing') db.data.delete('users/u1');
    else db.data.set('users/u1', { accountDeletionStatus: state });
    await expect(createCapsuleArchitectReviewCards('u1', guardedInput, deps(db))).rejects.toBeInstanceOf(DocumentOwnerUnavailableError);
    expect(Array.from(db.data.keys()).filter((path) => path.startsWith('users/u1/'))).toEqual([]);
  });

  it('rechecks the owner after a concurrent deletion invalidates the scaffold transaction', async () => {
    const db = new FakeFirestore();
    db.beforeCommit = () => { db.beforeCommit = undefined; db.eraseOwner(); };
    await expect(createCapsuleArchitectReviewCards('u1', guardedInput, deps(db))).rejects.toBeInstanceOf(DocumentOwnerUnavailableError);
    expect(db.transactionCount).toBe(2);
    expect(Array.from(db.data.keys()).filter((path) => path.startsWith('users/u1/'))).toEqual([]);
  });

  it('does not recreate review cards when deletion starts after scaffold creation', async () => {
    const db = new FakeFirestore();
    db.beforeTransaction = (count) => { if (count === 2) db.eraseOwner(); };
    await expect(createCapsuleArchitectReviewCards('u1', guardedInput, deps(db))).rejects.toBeInstanceOf(DocumentOwnerUnavailableError);
    expect(Array.from(db.data.keys()).filter((path) => path.startsWith('users/u1/'))).toEqual([]);
  });

  it('does not recreate version snapshots when deletion starts before an existing-capsule update', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: guardedInput.capsuleId, coreRefs: { situationCoreId: 'source-case' } }, deps(db));
    db.beforeTransaction = () => db.eraseOwner();
    await expect(createCapsuleArchitectReviewCards('u1', guardedInput, deps(db))).rejects.toBeInstanceOf(DocumentOwnerUnavailableError);
    expect(Array.from(db.data.keys()).filter((path) => path.startsWith('users/u1/'))).toEqual([]);
  });

  it('does not recreate an active-context mirror after a version update races with deletion', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: guardedInput.capsuleId, coreRefs: { situationCoreId: 'source-case' } }, deps(db));
    db.data.set('users/u1/contextStacks/default', { capsuleId: guardedInput.capsuleId });
    db.beforeTransaction = (count) => { if (count === 2) db.eraseOwner(); };
    await expect(createCapsuleArchitectReviewCards('u1', guardedInput, deps(db))).rejects.toBeInstanceOf(DocumentOwnerUnavailableError);
    expect(Array.from(db.data.keys()).filter((path) => path.startsWith('users/u1/'))).toEqual([]);
  });

  it('keeps the upload workspace so a later Ask can retrieve the attached document', async () => {
    const result = await createCapsuleArchitectReviewCards('u1', {
      jobPrompt: 'Summarize the attached council fixture.',
      situationId: 'upload-workspace',
      documents: [{ documentId: 'Source_AbC1', title: 'Fixture.txt', text: 'Funding remains unconfirmed.' }],
    }, deps(new FakeFirestore()));
    expect(result.capsule.coreRefs.situationCoreId).toBe('upload-workspace');
    expect(result.capsule.activeForSituationIds).toContain('upload-workspace');
    const pack = await buildCapsuleEvidencePack({ ownerUid: 'u1', capsuleId: result.capsule.capsuleId, objective: 'Summarize funding.' }, {
      getCapsule: async () => result.capsule,
      listKnowledgeDocuments: async () => [],
      listOutputCapsules: async () => [],
      listCapsuleMemories: async () => [],
      retrieveRelevantChunks: async (uid, situationId) => {
        expect(uid).toBe('u1');
        expect(situationId).toBe('upload-workspace');
        return [{ id: 'chunk-1', documentId: 'Source_AbC1', text: 'Funding remains unconfirmed.', charStart: 0, charEnd: 28, score: 1, confidence: 1 }] as never;
      },
    });
    expect(pack.sourcedParagraphs[0]?.excerpt).toBe('Funding remains unconfirmed.');
    expect(result.capsule.latestGateState).toBe('proposed');
  });
  it('creates a document-first capsule scaffold where graph, claims, sources, ontology, and tacit knowledge stay human-gated', async () => {
    const db = new FakeFirestore();

    const result = await createCapsuleArchitectReviewCards('u1', {
      jobPrompt: 'Build a humanitarian access decision capsule for a donor memo.',
      documents: [
        {
          documentId: 'pdf-1',
          title: 'Access constraints.pdf',
          mimeType: 'application/pdf',
          originalUri: 'gs://uploads/access-constraints.pdf',
          text: 'The current deconfliction channel is required. The approval window expires on 2026-06-15. Local authorities may block clearance.',
        },
        {
          documentId: 'pdf-2',
          title: 'Mediator note.pdf',
          mimeType: 'application/pdf',
          originalUri: 'gs://uploads/mediator-note.pdf',
          text: 'Legal review must confirm the access guarantee language before the donor meeting.',
        },
      ],
      elicitation: {
        redLines: ['No access recommendation without legal review.'],
        constraints: ['Donor memo due before the coordination meeting.'],
        approvalPolitics: ['Legal and humanitarian leads both sign off.'],
        heuristics: ['Prefer dated primary-source receipts over background summaries.'],
        decisionHorizon: 'Donor memo window',
        validFrom: '2026-06-01',
        validUntil: '2026-06-15',
        causalDrivers: ['Late notification blocks route clearance.'],
      },
      normalizedAt: '2026-06-01T12:00:00.000Z',
    }, deps(db));

    expect(result.reviewRequired).toBe(true);
    expect(result.capsule.latestGateState).toBe('proposed');
    expect(result.capsule.coreRefs.documentCoreIds).toEqual(['pdf-1', 'pdf-2']);
    expect(result.cards.every((card) => card.state === 'proposed')).toBe(true);
    expect(result.cards.map((card) => card.target)).toEqual(expect.arrayContaining([
      'ontologyStack',
      'sourceGap',
      'claimLedger',
      'graphProposal',
      'advisoryMemory',
      'agentInstructions',
    ]));

    const claimCard = result.cards.find((card) => card.target === 'claimLedger');
    expect(claimCard?.proposedEnvelopePatch.claimLedger?.length).toBeGreaterThanOrEqual(3);
    expect(claimCard?.proposedEnvelopePatch.claimLedger?.every((claim) => claim.receipts?.length)).toBe(true);

    const ontologyCard = result.cards.find((card) => card.target === 'ontologyStack');
    expect(ontologyCard?.proposedEnvelopePatch.ontologyBinding).toMatchObject({
      domainId: 'humanitarian',
      ontologyIds: expect.arrayContaining(['governance']),
    });

    const graphCard = result.cards.find((card) => card.target === 'graphProposal');
    expect(graphCard?.proposedEnvelopePatch.embeddedGraph).toMatchObject({
      advisoryOnly: true,
      canonicalStore: 'Firestore ContextCapsules',
    });

    const tacitCard = result.cards.find((card) => card.target === 'advisoryMemory');
    expect(tacitCard?.proposedEnvelopePatch.humanTacitKnowledge).toMatchObject({
      redLines: ['No access recommendation without legal review.'],
      hiddenConstraints: ['Donor memo due before the coordination meeting.'],
      approvalPolitics: ['Legal and humanitarian leads both sign off.'],
      practicalHeuristics: ['Prefer dated primary-source receipts over background summaries.'],
    });

    const cardPath = `users/u1/capsules/${result.capsule.capsuleId}/reviewCards/${result.cards[0].reviewCardId}`;
    expect(db.data.get(cardPath)?.state).toBe('proposed');
    expect(db.data.get(`users/u1/capsules/${result.capsule.capsuleId}`)?.claimLedger).toBeUndefined();
  });
});

function deps(db: FakeFirestore) {
  return {
    db: db as never,
    now: () => new Date('2026-06-01T12:00:00.000Z'),
  };
}

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>([['users/u1', { uid: 'u1' }]]);
  ids = 0;
  transactionCount = 0;
  beforeTransaction?: (count: number) => void;
  beforeCommit?: () => void;

  eraseOwner() {
    this.data.set('users/u1', { accountDeletionStatus: 'deleting' });
    for (const path of this.data.keys()) if (path.startsWith('users/u1/')) this.data.delete(path);
  }

  async runTransaction<T>(work: (transaction: { get: (ref: FakeDoc) => Promise<FakeSnapshot>;
    set: (ref: FakeDoc, value: unknown, options?: { merge?: boolean }) => void }) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt++) {
      this.transactionCount++;
      this.beforeTransaction?.(this.transactionCount);
      const reads = new Map<string, string | undefined>();
      const writes: Array<() => Promise<void>> = [];
      const result = await work({ get: async (ref) => {
        reads.set(ref.path, JSON.stringify(this.data.get(ref.path)));
        return ref.get();
      }, set: (ref, value, options) => { writes.push(() => ref.set(value, options)); } });
      this.beforeCommit?.();
      if (Array.from(reads).some(([path, snapshot]) => snapshot !== JSON.stringify(this.data.get(path)))) continue;
      for (const write of writes) await write();
      return result;
    }
    throw new Error('Transaction could not commit.');
  }

  collection(path: string) {
    return new FakeCollection(this, path);
  }

  batch() {
    const writes: Array<() => void> = [];
    return {
      set: (ref: FakeDoc, value: unknown, options?: { merge?: boolean }) => {
        writes.push(() => ref.set(value, options));
      },
      commit: async () => {
        for (const write of writes) write();
      },
    };
  }
}

class FakeCollection {
  constructor(private db: FakeFirestore, private path: string) {}

  doc(id?: string) {
    const docId = id ?? `doc-${++this.db.ids}`;
    return new FakeDoc(this.db, `${this.path}/${docId}`, docId);
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, data]) => new FakeSnapshot(path.split('/').pop() ?? 'doc', data));
    return { docs };
  }
}

class FakeDoc {
  constructor(private db: FakeFirestore, public path: string, public id: string) {}

  collection(name: string) {
    return new FakeCollection(this.db, `${this.path}/${name}`);
  }

  async set(value: unknown, options?: { merge?: boolean }) {
    const current = this.db.data.get(this.path);
    this.db.data.set(this.path, options?.merge && current ? { ...current, ...(value as Record<string, unknown>) } : value as Record<string, unknown>);
  }

  async get() {
    return new FakeSnapshot(this.id, this.db.data.get(this.path));
  }
}

class FakeSnapshot {
  constructor(public id: string, private value: Record<string, unknown> | undefined) {}

  get exists() {
    return this.value !== undefined;
  }

  data() {
    return this.value;
  }
}
