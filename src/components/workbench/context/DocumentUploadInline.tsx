'use client';

import { useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

export function DocumentUploadInline({ caseId }: { caseId: string }) {
  const [status, setStatus] = useState('Upload PDF, DOCX, or TXT files to hand them to the document pipeline.');
  const [uploading, setUploading] = useState(false);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus(`Uploading ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('situationId', caseId);
      const response = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      setStatus(response.ok ? `${file.name} uploaded for extraction.` : `${file.name} upload failed; try again from Library.`);
    } catch {
      setStatus('Upload failed; try again from Library.');
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
