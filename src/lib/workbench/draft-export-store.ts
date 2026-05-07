import { createHash, randomUUID } from 'node:crypto';
import { adminDb } from '@/lib/firebase/admin';
import type { DraftExportInput, DraftExportRecord } from '@/types/draft-export';

function collectionRef(uid: string, caseId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(caseId).collection('exports');
}

function checksum(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function persistDraftExport(input: {
  uid: string;
  caseId: string;
  exportInput: DraftExportInput;
}): Promise<DraftExportRecord> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const record: DraftExportRecord = {
    ...input.exportInput,
    id,
    caseId: input.caseId,
    ownerUid: input.uid,
    createdAt: now,
    artifactKind: 'draft-briefing-package',
    contentCredentials: {
      requested: input.exportInput.embedC2pa,
      signed: false,
      mode: 'c2pa-ready-manifest',
    },
    auditManifest: {
      embedded: input.exportInput.embedAuditManifest,
      generatedAt: now,
      checksum: checksum(input.exportInput.markdown),
    },
  };
  await collectionRef(input.uid, input.caseId).doc(id).set(record);
  return record;
}

