type UploadedNotes = { documentId: string; notes: string };

/** Keep the upload receipt when attachment fails so retry does not duplicate it. */
export async function saveCapsuleStarterNotes(input: {
  capsuleId: string;
  label: string;
  notes: string;
  uploaded?: UploadedNotes;
  onUploaded: (receipt: UploadedNotes) => void;
}): Promise<void> {
  if (!input.notes.trim()) return;
  let documentId = input.uploaded?.notes === input.notes ? input.uploaded.documentId : undefined;
  if (!documentId) {
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: `${input.label} starter notes`,
        html: `<article><h1>${escapeHtml(input.label)} starter notes</h1><pre>${escapeHtml(input.notes)}</pre></article>`,
        situationId: input.capsuleId,
        toolId: 'capsule-builder',
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.documentId !== 'string' || !payload.documentId) {
      throw new Error('Your capsule was created, but its notes could not be uploaded. Your text is still here; retry to finish saving.');
    }
    documentId = payload.documentId;
    input.onUploaded({ documentId: documentId!, notes: input.notes });
  }
  const response = await fetch(`/api/context/capsules/${encodeURIComponent(input.capsuleId)}/attach`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ documentIds: [documentId] }),
  });
  if (!response.ok) {
    throw new Error('Your notes were uploaded, but could not be attached to the capsule. Retry to finish saving.');
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}
