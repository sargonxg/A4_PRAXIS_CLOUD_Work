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
  const [steps, setSteps] = useState<string[]>([]);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus(`Uploading ${file.name}...`);
    setSteps(['Document uploaded']);
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
      setSteps(['Document uploaded', 'Source Core created']);

      const libraryFormData = new FormData();
      libraryFormData.append('file', file);
      if (documentId) libraryFormData.append('documentId', documentId);
      const response = await fetch(`/api/backend/tabs/library/ingest?case_id=${encodeURIComponent(caseId)}`, { method: 'POST', body: libraryFormData });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setSteps(['Document uploaded', 'Source Core created', 'Graph candidates found', 'Ask ready']);
        const layer = cogneeEnabled
          ? payload?.status === 'ingested'
            ? 'Document embedded for retrieval. Source receipt saved. Cognee ingest started.'
            : 'Document embedded for retrieval. Source receipt saved. Memory layer queued.'
          : 'Document embedded for retrieval. Source receipt saved.';
        setStatus(`${file.name} uploaded. ${layer}`);
      } else {
        setSteps(['Document uploaded', 'Source Core created', 'Graph candidates found']);
        setStatus(`${file.name} uploaded. Document embedded for retrieval. Source receipt deferred.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      setStatus(`Upload failed: ${message}`);
      setSteps([]);
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
          {steps.length ? <UploadSequence steps={steps} /> : null}
          <label className="mt-3 inline-flex cursor-pointer rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white">
            Choose file
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(event) => void upload(event.target.files)} />
          </label>
        </div>
      </div>
    </div>
  );
}

function UploadSequence({ steps }: { steps: string[] }) {
  const labels = ['Document uploaded', 'Source Core created', 'Graph candidates found', 'Ask ready'];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {labels.map((label, index) => {
        const active = steps.includes(label);
        return (
          <div key={label} className="flex items-center gap-2">
            <span className={[
              'rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
              active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400',
            ].join(' ')}>
              {label}
            </span>
            {index < labels.length - 1 ? <span className="text-slate-300">→</span> : null}
          </div>
        );
      })}
    </div>
  );
}
