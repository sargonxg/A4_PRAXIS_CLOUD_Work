import { describe, expect, it } from 'vitest';

import {
  createCapsuleArchitectReviewCards,
} from '@/lib/context/capsule-service';

describe('Capsule Architect review-card service', () => {
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
  data = new Map<string, Record<string, unknown>>();
  ids = 0;

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
  constructor(private db: FakeFirestore, private path: string, public id: string) {}

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
