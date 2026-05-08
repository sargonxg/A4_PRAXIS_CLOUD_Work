'use client';

import { useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { useFeatureFlags } from '@/lib/features/client';

function documentIdFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as { documentId?: unknown; document?: { id?: unknown } };
  if (typeof root.documentId === 'string') return root.documentId;
  if (typeof root.document?.id === 'string') return root.document.id;
  return null;
}

export function DocumentUploadInline({ caseId }: { caseId: string }) {
  const features = useFeatureFlags();
  const cogneeEnabled = features.cognee.enabled;
  const [status, setStatus] = useState('Upload PDF, DOCX, or TXT files to hand them to the document pipeline.');
  const [uploading, setUploading] = useState(false);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus(`Uploading ${file.name}...`);
    try {
      const documentFormData = new FormData();
      documentFormData.append('file', file);
      documentFormData.append('situationId', caseId);
      const documentResponse = await fetch('/api/documents/upload', { method: 'POST', body: documentFormData });
      const documentPayload = await documentResponse.json().catch(() => ({}));
      if (!documentResponse.ok) {
        throw new Error(documentPayload?.error ?? 'document upload failed');
      }
      const documentId = documentIdFromPayload(documentPayload);

      const libraryFormData = new FormData();
      libraryFormData.append('file', file);
      if (documentId) libraryFormData.append('documentId', documentId);
      const response = await fetch(`/api/backend/tabs/library/ingest?case_id=${encodeURIComponent(caseId)}`, { method: 'POST', body: libraryFormData });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const layer = cogneeEnabled
          ? payload?.status === 'ingested'
            ? 'Document embedded for retrieval. Source receipt saved. Cognee ingest started.'
            : 'Document embedded for retrieval. Source receipt saved. Memory layer queued.'
          : 'Document embedded for retrieval. Source receipt saved.';
        setStatus(`${file.name} uploaded. ${layer}`);
      } else {
        setStatus(`${file.name} uploaded. Document embedded for retrieval. Source receipt deferred.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      setStatus(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {uploading ? <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-gold-700" /> : <FileUp className="mt-0.5 h-5 w-5 text-gold-700" />}
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy-950">Document upload</p>
          <p className="mt-1 text-sm leading-5 text-slate-700">{status}</p>
          <label className="mt-3 inline-flex cursor-pointer rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white">
            Choose file
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(event) => void upload(event.target.files)} />
          </label>
        </div>
      </div>
    </div>
  );
}
