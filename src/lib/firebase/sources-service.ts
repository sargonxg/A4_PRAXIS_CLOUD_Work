import { getAdminDbOrThrow } from './admin';
import { withDocumentOwnerWrite } from '@/lib/documents/owner-write';

export type SourceType = 'pdf' | 'docx' | 'url' | 'feed' | 'text';

export interface WorkspaceSource {
  id: string;
  name: string;
  sourceType: SourceType;
  mimeType?: string;
  originalUrl?: string;
  sha256?: string;
  sizeBytes?: number;
  uploadedAt: string;
  taggedAs: string[];
  reliability?: number;
  region?: string;
  language?: string;
  extracted: boolean;
  documentId?: string;
  sourceCoreId?: string;
  sourceReceiptId?: string;
  ingestionRunId?: string;
  receipt?: {
    sourceType: string;
    claims: string[];
    dates: string[];
    actors: string[];
    confidence: number;
    attachedCore: string;
    documentId?: string;
    chunkCount?: number;
    extractedAt: string;
  };
}

function sourcesCollection(uid: string, situationId: string) {
  return getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection('sources');
}

export async function saveSource(uid: string, situationId: string, source: Omit<WorkspaceSource, 'id'>, options: { sourceId?: string } = {}): Promise<WorkspaceSource> {
  const ref = options.sourceId ? sourcesCollection(uid, situationId).doc(options.sourceId) : sourcesCollection(uid, situationId).doc();
  const stored = { ...source, id: ref.id };
  await withDocumentOwnerWrite(uid, (transaction) => { transaction.set(ref, stored); });
  return stored;
}

export async function listSources(uid: string, situationId: string): Promise<WorkspaceSource[]> {
  const snap = await sourcesCollection(uid, situationId).orderBy('uploadedAt', 'desc').limit(100).get();
  return snap.docs.map((doc) => doc.data() as WorkspaceSource);
}
