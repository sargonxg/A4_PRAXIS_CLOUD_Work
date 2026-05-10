import { getAdminDbOrThrow } from '../src/lib/firebase/admin';

async function main() {
  const db = getAdminDbOrThrow();
  const docs = await db.collectionGroup('documents').limit(500).get();
  let copied = 0;

  for (const doc of docs.docs) {
    const situationRef = doc.ref.parent.parent;
    if (!situationRef) continue;
    const sourceRef = situationRef.collection('sources').doc(doc.id);
    const existing = await sourceRef.get();
    if (existing.exists) continue;
    const data = doc.data();
    await sourceRef.set({
      id: doc.id,
      name: data.title ?? data.name ?? doc.id,
      mimeType: data.fileType ?? data.mimeType ?? 'application/octet-stream',
      originalUrl: data.originalUrl ?? data.bucketUri,
      sha256: data.sha256 ?? null,
      sizeBytes: data.size ?? data.sizeBytes ?? 0,
      uploadedAt: data.uploadedAt ?? new Date().toISOString(),
      taggedAs: data.taggedAs ?? [],
      sourceType: data.sourceType ?? 'pdf',
      extracted: data.status === 'extracted',
      migratedFromDocumentId: doc.id,
    });
    await doc.ref.set({ migratedToSourceId: doc.id }, { merge: true });
    copied += 1;
  }

  console.log(`[phase3] documents-to-sources migration copied ${copied} documents`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
