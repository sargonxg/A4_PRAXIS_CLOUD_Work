import { randomUUID } from 'node:crypto';
import { adminDb } from '@/lib/firebase/admin';
import type { ResearchCandidate } from '@/lib/workbench/research-state';

export interface ResearchIngestRecord {
  id: string;
  caseId: string;
  ownerUid: string;
  mode: 're_genesis';
  status: 'staged_for_review';
  candidates: ResearchCandidate[];
  createdAt: string;
  reviewQueuePath: string;
}

function situationRef(uid: string, caseId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(caseId);
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function stageResearchIngest(input: {
  uid: string;
  caseId: string;
  candidates: ResearchCandidate[];
}): Promise<{ record: ResearchIngestRecord; remainingToday: number }> {
  const today = dayKey();
  const quotaRef = situationRef(input.uid, input.caseId).collection('limits').doc(`research-ingest-${today}`);

  return adminDb.runTransaction(async (tx) => {
    const quotaSnap = await tx.get(quotaRef);
    const used = typeof quotaSnap.data()?.used === 'number' ? quotaSnap.data()?.used as number : 0;
    if (used >= 3) {
      throw new Error('Research ingestion limit reached for this case today.');
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const reviewRef = situationRef(input.uid, input.caseId).collection('review-queue').doc(id);
    const ingestRef = situationRef(input.uid, input.caseId).collection('research-ingestions').doc(id);
    const record: ResearchIngestRecord = {
      id,
      caseId: input.caseId,
      ownerUid: input.uid,
      mode: 're_genesis',
      status: 'staged_for_review',
      candidates: input.candidates.slice(0, 10),
      createdAt: now,
      reviewQueuePath: reviewRef.path,
    };

    tx.set(ingestRef, record);
    tx.set(reviewRef, {
      id,
      kind: 'research-source-ingest',
      status: 'pending_review',
      createdAt: now,
      ownerUid: input.uid,
      mode: 're_genesis',
      sourceCount: record.candidates.length,
      candidates: record.candidates,
      firewall: {
        status: 'staged',
        note: 'Research results are candidate sources only; no graph writes occur until review and re-genesis approval.',
      },
    });
    tx.set(quotaRef, { used: used + 1, updatedAt: now }, { merge: true });
    return { record, remainingToday: Math.max(0, 3 - (used + 1)) };
  });
}

