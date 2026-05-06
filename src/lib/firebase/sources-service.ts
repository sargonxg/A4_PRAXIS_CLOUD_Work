import { getAdminDbOrThrow } from './admin';

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
}

function sourcesCollection(uid: string, situationId: string) {
  return getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection('sources');
}

export async function saveSource(uid: string, situationId: string, source: Omit<WorkspaceSource, 'id'>): Promise<WorkspaceSource> {
  const ref = sourcesCollection(uid, situationId).doc();
  const stored = { ...source, id: ref.id };
  await ref.set(stored);
  return stored;
}

export async function listSources(uid: string, situationId: string): Promise<WorkspaceSource[]> {
  const snap = await sourcesCollection(uid, situationId).orderBy('uploadedAt', 'desc').limit(100).get();
  return snap.docs.map((doc) => doc.data() as WorkspaceSource);
}
