export interface ArchitectDocumentDraft {
  documentId: string;
  title: string;
  mimeType: string;
  originalUri: string;
  text: string;
}

/** Use the same owner-scoped parser and stored evidence as document retrieval. */
export async function ingestArchitectDocuments(files: File[], options: {
  situationId?: string;
  workspaceName?: string;
  fetcher?: typeof fetch;
}): Promise<{ documents: ArchitectDocumentDraft[]; warnings: string[]; situationId?: string }> {
  const fetcher = options.fetcher ?? fetch;
  const documents: ArchitectDocumentDraft[] = [];
  const warnings: string[] = files.length > 12 ? ['Only the first 12 files were selected. Add the remaining files in another batch.'] : [];
  let situationId = options.situationId;
  if (!files.length) return { documents, warnings, situationId };
  if (!situationId) {
    try {
      const response = await fetcher('/api/situations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: (options.workspaceName?.trim() || 'Capsule evidence workspace').slice(0, 160), domain: 'generic', description: 'Private source workspace created from capsule builder document intake.', status: 'active' }),
      });
      if (!response.ok) throw new Error('Workspace creation failed');
      const body = await response.json();
      if (typeof body.situation?.id !== 'string' || !body.situation.id) throw new Error('Missing workspace receipt');
      situationId = body.situation.id;
    } catch {
      return { documents, warnings: [...warnings, 'Your private source workspace could not be created. No documents were uploaded. Please retry.'] };
    }
  }
  for (const file of files.slice(0, 12)) {
    try {
      if (!/\.(pdf|docx|txt|md|html|csv|json)$/i.test(file.name)) throw new Error('Use PDF, DOCX or a text document.');
      const form = new FormData();
      // CSV and JSON are text evidence; canonical ingestion supports .txt.
      const upload = /\.(csv|json)$/i.test(file.name)
        ? new File([file], `${file.name}.txt`, { type: 'text/plain' }) : file;
      form.set('file', upload);
      form.set('situationId', situationId!);
      form.set('sourceNote', `Capsule builder source: ${file.name}`);
      const response = await fetcher('/api/documents/upload', { method: 'POST', body: form });
      if (!response.ok) throw new Error(response.status === 401 ? 'Sign in again, then retry.' : `Upload failed (${response.status}). Retry this file.`);
      const payload = await response.json();
      if (typeof payload.documentId !== 'string' || !payload.documentId) throw new Error('Upload returned no document receipt.');
      const preview = await fetcher(`/api/documents/${encodeURIComponent(payload.documentId)}?situationId=${encodeURIComponent(situationId!)}&maxChars=16000`);
      if (!preview.ok) throw new Error('The saved document could not be read. Retry this file.');
      const body = await preview.json();
      const text = typeof body.document?.previewText === 'string' ? body.document.previewText : '';
      if (!text.trim()) throw new Error('No readable text was extracted. Use an OCR-processed PDF or paste a text version.');
      documents.push({
        documentId: payload.documentId,
        title: file.name,
        mimeType: file.type || 'text/plain',
        originalUri: `/api/documents/${encodeURIComponent(payload.documentId)}?situationId=${encodeURIComponent(situationId!)}`,
        text: text.slice(0, 16000),
      });
      if (body.document.truncated || text.length > 16000) warnings.push(`${file.name}: Architect uses the first 16,000 characters; the full document remains in your source library.`);
    } catch (error) {
      warnings.push(`${file.name}: ${error instanceof Error ? error.message : 'Could not read this document.'}`);
    }
  }
  return { documents, warnings, situationId };
}
