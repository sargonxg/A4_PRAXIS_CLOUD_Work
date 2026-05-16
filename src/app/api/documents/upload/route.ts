import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { withAuth } from '@/lib/api/with-auth';
import {
  saveDocument,
} from '@/lib/firebase/documents-service';
import { saveSource } from '@/lib/firebase/sources-service';
import {
  getAdminStorage,
  getDefaultBucketName,
  getAdminDbOrThrow,
} from '@/lib/firebase/admin';
import { autoStructureDocument } from '@/lib/documents/auto-structure';
import { emitTelemetrySafe } from '@/lib/telemetry/emit';
import { localKnowledgeAdapter } from '@/lib/knowledge/context-engine';
import { attachCapsuleRefs, getCapsule, getOrMigrateDefaultCapsule } from '@/lib/context/capsule-service';
import { mirrorDocumentIngestionSql } from '@/lib/agent-runtime/document-postgres';

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
  const startedAt = Date.now();
  const contentTypeHeader = request.headers.get('content-type') || '';

  // ── JSON body path: artifacts generated inside the app (briefs, memos,
  //    tool outputs) are pushed to the GCS bucket so they appear in the
  //    document dashboard alongside user uploads.
  if (contentTypeHeader.includes('application/json')) {
    if (user.isDemo) {
      return NextResponse.json(
        { error: 'Document upload is not available for this session' },
        { status: 403 },
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
      await emitTelemetrySafe({
        eventName: 'document.upload-start',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: body.situationId,
        route: '/api/documents/upload',
        status: 'queued',
        details: { mode: 'json', toolId: body.toolId || 'editor' },
      });
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
      await mirrorDocumentIngestionSql({
        id: docId,
        ownerUid: user.uid,
        situationId: body.situationId,
        title: body.title,
        fileType: 'html',
        sizeBytes: Buffer.byteLength(body.html, 'utf8'),
        status: 'artifact-synced',
        bucketUri: `gs://${bucketName}/${objectPath}`,
        metadata: {
          mode: 'json',
          toolId: body.toolId || 'editor',
          objectPath,
        },
      }).catch((sqlErr) => console.warn('[documents/upload] SQL artifact mirror failed:', sqlErr));

      await emitTelemetrySafe({
        eventName: 'document.upload-complete',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: body.situationId,
        route: '/api/documents/upload',
        status: 'ok',
        latencyMs: Date.now() - startedAt,
        details: { mode: 'json', size: Buffer.byteLength(body.html, 'utf8') },
      });
      return NextResponse.json({
        success: true,
        mode: 'json',
        documentId: docId,
        uri: `gs://${bucketName}/${objectPath}`,
        message: 'Artifact synced to bucket and indexed for the document dashboard.',
      });
    } catch (err) {
      await emitTelemetrySafe({
        eventName: 'document.upload-fail',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: body.situationId,
        route: '/api/documents/upload',
        status: 'fail',
        latencyMs: Date.now() - startedAt,
        details: { mode: 'json', message: err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240) },
      });
      console.error('[documents/upload] JSON path failed:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Bucket upload failed' },
        { status: 500 },
      );
    }
  }

  // ── Multipart path (existing behaviour): user-uploaded source documents.
  if (user.isDemo) {
    return NextResponse.json({ error: 'Document upload is not available for this session' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const situationId = formData.get('situationId') as string | null;
    const requestedCapsuleId = formData.get('capsuleId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!situationId) {
      return NextResponse.json({ error: 'situationId is required' }, { status: 400 });
    }

    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    await emitTelemetrySafe({
      eventName: 'document.upload-start',
      uid: user.uid,
      orgId: orgIdOf(user),
      caseId: situationId,
      route: '/api/documents/upload',
      status: 'queued',
      details: { mode: 'multipart', fileType, size: file.size },
    });

    if (!ALLOWED_EXTENSIONS.includes(fileType)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${fileType}. Supported: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    let text = '';
    let parser: 'pdf-parse' | 'mammoth' | 'plain-text' = 'plain-text';
    let extractionMode: 'inline-text' | 'inline-structured' = 'inline-text';
    if (fileType === 'txt' || fileType === 'md' || fileType === 'html') {
      text = await file.text();
    } else if (fileType === 'pdf') {
      const parserInstance = new PDFParse({ data: fileBuffer });
      const result = await parserInstance.getText();
      text = result.text.trim();
      parser = 'pdf-parse';
      extractionMode = 'inline-structured';
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value.trim();
      parser = 'mammoth';
      extractionMode = 'inline-structured';
    }
    const structured = autoStructureDocument({ filename: file.name, fileType, text, parser });

    // Best-effort: also push the raw bytes to the GCS bucket so the document
    // dashboard can preview/download the original.
    let bucketUri: string | null = null;
    try {
      const bucketName = getDefaultBucketName();
      const bucket = getAdminStorage().bucket(bucketName);
      const objectPath = `users/${user.uid}/situations/${situationId}/uploads/${Date.now()}-${file.name}`;
      await bucket.file(objectPath).save(fileBuffer, {
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
      status: text.length > 0 ? 'extracted' : 'uploaded',
      uploadedAt: new Date().toISOString(),
      entityCount: structured.actors.length,
      bucketUri: bucketUri ?? undefined,
      structured,
      sourceCore: {
        id: `source-core:${situationId}:${file.name}`.slice(0, 160),
        situationId,
        documentId: 'pending',
        title: structured.title,
        sourceType: structured.sourceType,
        linkedAt: new Date().toISOString(),
      },
    });
    if (stored.sourceCore) {
      stored.sourceCore.documentId = stored.id;
      await getAdminDbOrThrow()
        .collection('users')
        .doc(user.uid)
        .collection('situations')
        .doc(situationId)
        .collection('documents')
        .doc(stored.id)
        .set({ sourceCore: stored.sourceCore }, { merge: true });
    }

    const ingestionRun = await localKnowledgeAdapter.ingestDocument({
      uid: user.uid,
      situationId,
      documentId: stored.id,
      title: file.name,
      fileType,
      text,
      bucketUri,
    });
    const chunkCount = ingestionRun.chunkCount;
    const sourceCoreId = stored.sourceCore?.id ?? `source-core:${situationId}:${stored.id}`;
    const receiptConfidence = computeReceiptConfidence({
      hasText: text.trim().length > 0,
      chunkCount,
      claimCount: structured.keyClaims.length,
      actorCount: structured.actors.length,
      dateCount: structured.timelineCandidates.length + (structured.date ? 1 : 0),
      ingestionFailed: ingestionRun.status === 'failed',
    });
    const sourceReceiptSummary = {
      sourceType: structured.sourceType,
      claims: structured.keyClaims.slice(0, 4),
      dates: Array.from(new Set([
        ...(structured.date ? [structured.date] : []),
        ...structured.timelineCandidates.map((candidate) => candidate.date),
      ])).slice(0, 4),
      actors: structured.actors.slice(0, 6),
      confidence: receiptConfidence,
      attachedCore: sourceCoreId,
      documentId: stored.id,
      chunkCount,
      extractedAt: new Date().toISOString(),
    };
    const sourcePayload = {
      name: structured.title || file.name,
      sourceType: sourceTypeForFile(fileType),
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      taggedAs: ['library-upload', 'document-core', structured.sourceType],
      extracted: ingestionRun.status !== 'failed',
      documentId: stored.id,
      sourceCoreId,
      ingestionRunId: ingestionRun.id,
      receipt: sourceReceiptSummary,
      ...(file.type ? { mimeType: file.type } : {}),
      ...(bucketUri ? { originalUrl: bucketUri } : {}),
    };
    const sourceReceipt = await saveSource(user.uid, situationId, sourcePayload);
    await getAdminDbOrThrow()
      .collection('users')
      .doc(user.uid)
      .collection('situations')
      .doc(situationId)
      .collection('documents')
      .doc(stored.id)
      .set({
        ingestionRunId: ingestionRun.id,
        ingestionStatus: ingestionRun.status,
        sourceCore: {
          ...(stored.sourceCore ?? {}),
          id: sourceCoreId,
          documentId: stored.id,
          sourceReceiptId: sourceReceipt.id,
          ingestionRunId: ingestionRun.id,
          linkedAt: stored.sourceCore?.linkedAt ?? new Date().toISOString(),
        },
      }, { merge: true });
    const explicitCapsule = requestedCapsuleId ? await getCapsule(user.uid, requestedCapsuleId).catch(() => null) : null;
    const { capsule: fallbackCapsule } = await getOrMigrateDefaultCapsule(user.uid);
    const capsule = explicitCapsule && !explicitCapsule.archivedAt ? explicitCapsule : fallbackCapsule;
    await attachCapsuleRefs(user.uid, capsule.capsuleId, {
      sourceIds: [sourceCoreId],
      documentIds: [stored.id],
    });
    await mirrorDocumentIngestionSql({
      id: stored.id,
      ownerUid: user.uid,
      situationId,
      title: stored.title,
      fileType,
      sizeBytes: file.size,
      status: stored.status,
      bucketUri,
      sourceCoreId,
      sourceReceiptId: sourceReceipt.id,
      ingestionRunId: ingestionRun.id,
      ingestionStatus: ingestionRun.status,
      chunkCount,
      entityCount: structured.actors.length,
      metadata: {
        mode: 'multipart',
        sourceType: structured.sourceType,
        receiptConfidence,
        capsuleId: capsule.capsuleId,
        parser,
      },
    }).catch((sqlErr) => console.warn('[documents/upload] SQL document mirror failed:', sqlErr));

    await emitTelemetrySafe({
      eventName: 'document.upload-complete',
      uid: user.uid,
      orgId: orgIdOf(user),
      caseId: situationId,
      route: '/api/documents/upload',
      status: 'ok',
      latencyMs: Date.now() - startedAt,
      details: {
        mode: 'multipart',
        fileType,
        extractionMode,
        chunkCount,
        documentId: stored.id,
        sourceCoreId,
        sourceReceiptId: sourceReceipt.id,
        ingestionRunId: ingestionRun.id,
        ingestionStatus: ingestionRun.status,
      },
    });
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
        entityCount: structured.actors.length,
        chunkCount,
        ingestionRunId: ingestionRun.id,
        ingestionStatus: ingestionRun.status,
        sourceCoreId,
        sourceReceiptId: sourceReceipt.id,
        bucketUri,
        structured,
        receipt: sourceReceiptSummary,
      },
      coreRefs: {
        sourceCoreIds: [sourceCoreId],
        documentCoreIds: [stored.id],
        capsuleId: capsule.capsuleId,
        capsuleVersion: capsule.version + 1,
      },
      message: chunkCount > 0
        ? 'Document uploaded, chunked, and indexed for retrieval.'
        : 'Document uploaded and saved to your situation. Text extraction did not produce retrievable chunks.',
    });
  } catch (err) {
    await emitTelemetrySafe({
      eventName: 'document.upload-fail',
      uid: user.uid,
      orgId: orgIdOf(user),
      route: '/api/documents/upload',
      status: 'fail',
      latencyMs: Date.now() - startedAt,
      details: { message: err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240) },
    });
    console.error('[documents/upload] failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});

function orgIdOf(user: unknown): string | null {
  return (user as { orgId?: string }).orgId ?? null;
}

function sourceTypeForFile(fileType: string): 'pdf' | 'docx' | 'text' {
  if (fileType === 'pdf') return 'pdf';
  if (fileType === 'docx') return 'docx';
  return 'text';
}

function computeReceiptConfidence(input: {
  hasText: boolean;
  chunkCount: number;
  claimCount: number;
  actorCount: number;
  dateCount: number;
  ingestionFailed: boolean;
}): number {
  if (input.ingestionFailed) return 0.35;
  let score = input.hasText ? 0.48 : 0.22;
  score += Math.min(input.chunkCount, 8) * 0.035;
  score += Math.min(input.claimCount, 4) * 0.045;
  score += Math.min(input.actorCount, 6) * 0.025;
  score += Math.min(input.dateCount, 3) * 0.025;
  return Math.max(0.25, Math.min(0.94, Number(score.toFixed(2))));
}
