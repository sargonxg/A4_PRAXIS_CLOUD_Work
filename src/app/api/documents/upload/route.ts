import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  saveDocument,
  chunkAndSaveDocument,
} from '@/lib/firebase/documents-service';
import {
  getAdminStorage,
  getDefaultBucketName,
  getAdminDbOrThrow,
} from '@/lib/firebase/admin';

/**
 * Canonical document ingestion endpoint.
 *
 * As of 2026-05-08 (CODEX_NIGHT_PACK/06_LIBRARY_INGEST_CONSOLIDATION.md),
 * this endpoint is the single source of truth for extracting text, chunking,
 * and indexing documents for Firestore-backed retrieval. The Library
 * substrate path (/api/backend/tabs/library/ingest) registers source_receipts
 * rows and queues Cognee writes, but does not own retrieval indexing.
 *
 * Visible Library uploads call both paths in sequence: this endpoint first,
 * then the Library substrate ingest route with the returned documentId.
 */
export const maxDuration = 300;

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md', 'html'];

interface JsonUploadBody {
  documentId?: string;
  title: string;
  html: string;
  situationId: string;
  contentType?: string;
  toolId?: string;
}

export const POST = withAuth(async (request, user) => {
  const contentTypeHeader = request.headers.get('content-type') || '';

  // ── JSON body path: artifacts generated inside the app (briefs, memos,
  //    tool outputs) are pushed to the GCS bucket so they appear in the
  //    document dashboard alongside user uploads.
  if (contentTypeHeader.includes('application/json')) {
    if (user.isDemo) {
      return NextResponse.json(
        {
          success: true,
          mode: 'demo-noop',
          message: 'Demo session — bucket sync was simulated. Artifact stays local.',
          uri: 'demo://praxis-artifacts/' + Math.random().toString(36).slice(2, 10),
        },
        { status: 200 },
      );
    }
    let body: JsonUploadBody;
    try {
      body = (await request.json()) as JsonUploadBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!body.title || !body.html || !body.situationId) {
      return NextResponse.json(
        { error: 'title, html, and situationId are required for JSON uploads' },
        { status: 400 },
      );
    }
    try {
      const bucketName = getDefaultBucketName();
      const bucket = getAdminStorage().bucket(bucketName);
      const docId = body.documentId || `doc-${Date.now().toString(36)}`;
      const objectPath = `users/${user.uid}/situations/${body.situationId}/artifacts/${docId}.html`;
      const file = bucket.file(objectPath);

      await file.save(body.html, {
        contentType: body.contentType || 'text/html; charset=utf-8',
        resumable: false,
        metadata: {
          metadata: {
            title: body.title,
            situationId: body.situationId,
            toolId: body.toolId || 'editor',
            uploadedBy: user.uid,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Mirror metadata into Firestore so the dashboard can query without a bucket scan.
      try {
        const db = getAdminDbOrThrow();
        await db
          .collection('users')
          .doc(user.uid)
          .collection('situations')
          .doc(body.situationId)
          .collection('artifacts')
          .doc(docId)
          .set(
            {
              id: docId,
              title: body.title,
              toolId: body.toolId || 'editor',
              bucketUri: `gs://${bucketName}/${objectPath}`,
              objectPath,
              size: Buffer.byteLength(body.html, 'utf8'),
              contentType: body.contentType || 'text/html; charset=utf-8',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            { merge: true },
          );
      } catch (metaErr) {
        console.warn('[documents/upload] Firestore mirror failed:', metaErr);
      }

      return NextResponse.json({
        success: true,
        mode: 'json',
        documentId: docId,
        uri: `gs://${bucketName}/${objectPath}`,
        message: 'Artifact synced to bucket and indexed for the document dashboard.',
      });
    } catch (err) {
      console.error('[documents/upload] JSON path failed:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Bucket upload failed' },
        { status: 500 },
      );
    }
  }

  // ── Multipart path (existing behaviour): user-uploaded source documents.
  if (user.isDemo) {
    return NextResponse.json({ error: 'Document upload is not available in demo mode' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const situationId = formData.get('situationId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!situationId) {
      return NextResponse.json({ error: 'situationId is required' }, { status: 400 });
    }

    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';

    if (!ALLOWED_EXTENSIONS.includes(fileType)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${fileType}. Supported: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    let text = '';
    if (fileType === 'txt' || fileType === 'md' || fileType === 'html') {
      text = await file.text();
    } else if (fileType === 'pdf') {
      try {
        const pdfMod = await import('pdf-parse');
        const pdfParse = (pdfMod as unknown as { default: (...args: unknown[]) => unknown }).default || pdfMod;
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await pdfParse(buffer) as { text: string };
        text = result.text;
      } catch {
        text = '[PDF text extraction failed — file stored but text could not be extracted automatically]';
      }
    } else if (fileType === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        text = '[DOCX text extraction failed — file stored but text could not be extracted automatically]';
      }
    }

    // Best-effort: also push the raw bytes to the GCS bucket so the document
    // dashboard can preview/download the original.
    let bucketUri: string | null = null;
    try {
      const bucketName = getDefaultBucketName();
      const bucket = getAdminStorage().bucket(bucketName);
      const objectPath = `users/${user.uid}/situations/${situationId}/uploads/${Date.now()}-${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      await bucket.file(objectPath).save(Buffer.from(arrayBuffer), {
        contentType: file.type || 'application/octet-stream',
        resumable: false,
        metadata: {
          metadata: {
            title: file.name,
            situationId,
            uploadedBy: user.uid,
            uploadedAt: new Date().toISOString(),
          },
        },
      });
      bucketUri = `gs://${bucketName}/${objectPath}`;
    } catch (uploadErr) {
      console.warn('[documents/upload] bucket write skipped:', uploadErr);
    }

    const stored = await saveDocument(user.uid, situationId, {
      title: file.name,
      fileType,
      size: file.size,
      text,
      status: text.startsWith('[') ? 'error' : 'uploaded',
      uploadedAt: new Date().toISOString(),
      entityCount: 0,
      bucketUri: bucketUri ?? undefined,
    });

    let chunkCount = 0;
    if (text.length > 0 && !text.startsWith('[')) {
      try {
        chunkCount = await chunkAndSaveDocument(user.uid, situationId, stored.id, file.name, text);
        console.log(`[documents] Chunked ${file.name}: ${chunkCount} chunks`);
      } catch (err) {
        console.error('[documents] Chunking failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      documentId: stored.id,
      document: {
        id: stored.id,
        title: stored.title,
        fileType: stored.fileType,
        size: stored.size,
        status: stored.status,
        uploadedAt: stored.uploadedAt,
        entityCount: 0,
        chunkCount,
        bucketUri,
      },
      message: chunkCount > 0
        ? 'Document uploaded, chunked, and indexed for retrieval.'
        : 'Document uploaded and saved to your situation. Text extraction did not produce retrievable chunks.',
    });
  } catch (err) {
    console.error('[documents/upload] failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
