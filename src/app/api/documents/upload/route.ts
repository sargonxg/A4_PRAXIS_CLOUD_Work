import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  saveDocument,
  getDocumentById,
  updateDocumentIngestionMetadata,
  DocumentWriteUnavailableError,
} from '@/lib/firebase/documents-service';
import { assertDocumentOwnerWritable, DocumentOwnerUnavailableError, withDocumentOwnerWrite } from '@/lib/documents/owner-write';
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
import { assertDocumentFileSize, assertDocumentTextSize, DocumentIngestionError, readBoundedUploadBody } from '@/lib/documents/ingestion-policy';
import { documentUploadIdentity, documentTextIdentity } from '@/lib/documents/upload-identity';
import {
  ensureDefaultKnowledgeRepository,
  getKnowledgeRepository,
  upsertKnowledgeDocument,
} from '@/lib/knowledge/library-service';

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
      body = JSON.parse(new TextDecoder().decode(await readBoundedUploadBody(request))) as JsonUploadBody;
    } catch (err) {
      if (err instanceof DocumentIngestionError) return documentLimitResponse(err);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (typeof body.title !== 'string' || typeof body.html !== 'string' || typeof body.situationId !== 'string' || !body.title || !body.html || !body.situationId) {
      return NextResponse.json(
        { error: 'title, html, and situationId are required for JSON uploads' },
        { status: 400 },
      );
    }
    try {
      assertDocumentTextSize(body.html);
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
      const docId = body.documentId || documentUploadIdentity(user.uid, body.situationId, 'html', Buffer.from(body.html, 'utf8'));
      const objectPath = `users/${user.uid}/situations/${body.situationId}/artifacts/${docId}.html`;
      const file = bucket.file(objectPath);

      await assertDocumentOwnerWritable(user.uid);
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
      await confirmOwnerAfterStorageWrite(user.uid, file);

      // Mirror metadata into Firestore so the dashboard can query without a bucket scan.
      try {
        const db = getAdminDbOrThrow();
        const ref = db
          .collection('users')
          .doc(user.uid)
          .collection('situations')
          .doc(body.situationId)
          .collection('artifacts')
          .doc(docId);
        await withDocumentOwnerWrite(user.uid, (transaction) => {
          transaction.set(ref,
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
        }, db);
      } catch (metaErr) {
        if (metaErr instanceof DocumentOwnerUnavailableError) throw metaErr;
        console.warn('[documents/upload] Firestore mirror failed:', metaErr);
      }
      await assertDocumentOwnerWritable(user.uid);
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
      if (err instanceof DocumentIngestionError) return documentLimitResponse(err);
      if (isDocumentWriteUnavailable(err)) return documentWriteUnavailableResponse(err);
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
    const boundedBody = await readBoundedUploadBody(request);
    const formData = await new Request(request.url, { method: 'POST', headers: request.headers, body: boundedBody }).formData();
    const file = formData.get('file') as File | null;
    const situationId = formData.get('situationId') as string | null;
    const requestedCapsuleId = formData.get('capsuleId') as string | null;
    const requestedCapsuleIds = normalizeFormList(formData.getAll('capsuleIds'), requestedCapsuleId);
    const requestedRepositoryId = cleanFormValue(formData.get('repositoryId'));
    const requestedCategoryId = cleanFormValue(formData.get('categoryId'));
    const requestedPolicyDomain = cleanFormValue(formData.get('policyDomain'));
    const requestedSourceNote = cleanFormValue(formData.get('sourceNote'));
    const requestedTags = normalizeFormList(formData.getAll('tags'));

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

    assertDocumentFileSize(file.size);
    await assertDocumentOwnerWritable(user.uid);
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const documentId = documentUploadIdentity(user.uid, situationId, fileType, fileBuffer);
    const requestFingerprint = documentTextIdentity(JSON.stringify([requestedCapsuleIds, requestedRepositoryId,
      requestedCategoryId, requestedPolicyDomain, requestedTags, requestedSourceNote]));
    const previousDocument = await getDocumentById(user.uid, situationId, documentId);
    if (previousDocument?.uploadCompletion?.fingerprint === requestFingerprint) {
      return NextResponse.json({ ...previousDocument.uploadCompletion.result, replayed: true });
    }
    let text = '';
    let parser: 'pdf-parse' | 'mammoth' | 'plain-text' = 'plain-text';
    let extractionMode: 'inline-text' | 'inline-structured' = 'inline-text';
    if (fileType === 'txt' || fileType === 'md' || fileType === 'html') {
      text = await file.text();
    } else if (fileType === 'pdf') {
      // PDF.js initializes native canvas bindings at import time. Keep that
      // dependency isolated so its availability cannot disable other uploads.
      const { PDFParse } = await import('pdf-parse');
      const parserInstance = new PDFParse({ data: fileBuffer });
      try {
        const result = await parserInstance.getText();
        text = result.text.trim();
      } finally {
        await parserInstance.destroy();
      }
      parser = 'pdf-parse';
      extractionMode = 'inline-structured';
    } else if (fileType === 'docx') {
      const { default: mammoth } = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value.trim();
      parser = 'mammoth';
      extractionMode = 'inline-structured';
    }
    assertDocumentTextSize(text);
    if (!text.trim()) throw new DocumentIngestionError('No readable text was found. Use an OCR-processed PDF or paste the source text, then upload again.', 422, 'DOCUMENT_TEXT_EMPTY');
    const structured = autoStructureDocument({ filename: file.name, fileType, text, parser });

    // Best-effort: also push the raw bytes to the GCS bucket so the document
    // dashboard can preview/download the original.
    let bucketUri: string | null = null;
    try {
      const bucketName = getDefaultBucketName();
      const bucket = getAdminStorage().bucket(bucketName);
      const objectPath = `users/${user.uid}/situations/${situationId}/uploads/${documentId}.${fileType}`;
      const storageFile = bucket.file(objectPath);
      await assertDocumentOwnerWritable(user.uid);
      await storageFile.save(fileBuffer, {
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
      await confirmOwnerAfterStorageWrite(user.uid, storageFile);
      bucketUri = `gs://${bucketName}/${objectPath}`;
    } catch (uploadErr) {
      if (uploadErr instanceof DocumentOwnerUnavailableError) throw uploadErr;
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
        id: `source-core:${documentId}`,
        situationId,
        documentId,
        title: structured.title,
        sourceType: structured.sourceType,
        linkedAt: new Date().toISOString(),
      },
    }, { documentId });
    if (stored.sourceCore) {
      stored.sourceCore.documentId = stored.id;
      await updateDocumentIngestionMetadata(user.uid, situationId, stored.id, { sourceCore: stored.sourceCore });
    }

    const priorUploadDocument = previousDocument?.uploadCompletion?.result.document as Record<string, unknown> | undefined;
    const storedIngestion = previousDocument?.ingestionStatus === 'checked' && previousDocument.ingestionRunId
      && typeof previousDocument.chunkCount === 'number'
      ? { id: previousDocument.ingestionRunId, status: 'checked' as const, chunkCount: previousDocument.chunkCount } : null;
    const ingestionRun = storedIngestion ?? (priorUploadDocument?.ingestionStatus === 'checked' && typeof priorUploadDocument.ingestionRunId === 'string'
      && typeof priorUploadDocument.chunkCount === 'number'
      ? { id: priorUploadDocument.ingestionRunId, status: 'checked' as const, chunkCount: priorUploadDocument.chunkCount }
      : await localKnowledgeAdapter.ingestDocument({
      uid: user.uid,
      situationId,
      documentId: stored.id,
      title: file.name,
      fileType,
      text,
      bucketUri,
    }));
    const chunkCount = ingestionRun.chunkCount;
    // Commit the completed ingestion receipt before attachment/library work.
    // A retry after a later failure can resume those effects without re-running ingestion.
    await updateDocumentIngestionMetadata(user.uid, situationId, stored.id, {
      ingestionRunId: ingestionRun.id, ingestionStatus: ingestionRun.status,
    });
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
    const sourceReceipt = await saveSource(user.uid, situationId, sourcePayload, { sourceId: `source-${documentId}` });
    await updateDocumentIngestionMetadata(user.uid, situationId, stored.id, {
        ingestionRunId: ingestionRun.id,
        ingestionStatus: ingestionRun.status,
        sourceCore: {
          ...(stored.sourceCore ?? { situationId, title: structured.title, sourceType: structured.sourceType }),
          id: sourceCoreId,
          documentId: stored.id,
          sourceReceiptId: sourceReceipt.id,
          ingestionRunId: ingestionRun.id,
          linkedAt: stored.sourceCore?.linkedAt ?? new Date().toISOString(),
        },
      });
    await assertDocumentOwnerWritable(user.uid);
    const explicitCapsules = (await Promise.all(
      requestedCapsuleIds.map((capsuleId) => getCapsule(user.uid, capsuleId).catch(() => null)),
    )).filter((capsule): capsule is NonNullable<typeof capsule> => Boolean(capsule && !capsule.archivedAt));
    const explicitCapsule = explicitCapsules[0] ?? null;
    const { capsule: fallbackCapsule } = await getOrMigrateDefaultCapsule(user.uid);
    await assertDocumentOwnerWritable(user.uid);
    const capsule = explicitCapsule && !explicitCapsule.archivedAt ? explicitCapsule : fallbackCapsule;
    const targetCapsuleIds = uniqueStrings(explicitCapsules.length
      ? explicitCapsules.map((item) => item.capsuleId)
      : [capsule.capsuleId]);
    for (const capsuleId of targetCapsuleIds) {
      await assertDocumentOwnerWritable(user.uid);
      await attachCapsuleRefs(user.uid, capsuleId, {
        sourceIds: [sourceCoreId],
        documentIds: [stored.id],
      });
    }
    const requestedRepository = requestedRepositoryId
      ? await getKnowledgeRepository(user.uid, requestedRepositoryId).catch(() => null)
      : null;
    const repository = requestedRepository ?? await ensureDefaultKnowledgeRepository(user.uid);
    await assertDocumentOwnerWritable(user.uid);
    const knowledgeDocument = await upsertKnowledgeDocument(user.uid, {
      documentId: stored.id,
      situationId,
      title: stored.title,
      fileType,
      size: file.size,
      bucketUri,
      repositoryIds: [repository?.id ?? 'default'],
      capsuleIds: targetCapsuleIds,
      categoryId: requestedCategoryId || repository?.categoryId || structured.sourceType || 'general-policy',
      policyDomain: requestedPolicyDomain || repository?.policyDomain || requestedCategoryId || 'general-policy',
      tags: uniqueStrings(['library-upload', structured.sourceType, ...requestedTags]),
      sourceType: structured.sourceType,
      sourceNote: requestedSourceNote,
      extractionStatus: stored.status,
      chunkCount,
      entityCount: structured.actors.length,
    });
    await assertDocumentOwnerWritable(user.uid);
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
        capsuleIds: targetCapsuleIds,
        repositoryId: repository?.id ?? 'default',
        knowledgeDocumentId: knowledgeDocument.id,
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
    const indexedDocument = await getDocumentById(user.uid, situationId, stored.id);
    const indexingStatus = ingestionRun.status === 'failed' ? 'failed'
      : indexedDocument?.indexing?.status === 'keyword_only' ? 'keyword_only' : 'indexed';
    const result = {
      success: true,
      retryable: indexingStatus === 'failed',
      documentId: stored.id,
      document: {
        id: stored.id,
        title: stored.title,
        fileType: stored.fileType,
        size: stored.size,
        status: indexedDocument?.status ?? stored.status,
        uploadedAt: stored.uploadedAt,
        entityCount: structured.actors.length,
        chunkCount,
        ingestionRunId: ingestionRun.id,
        ingestionStatus: ingestionRun.status,
        indexingStatus,
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
        capsuleIds: targetCapsuleIds,
        capsuleVersion: capsule.version + 1,
      },
      knowledge: {
        repositoryId: repository?.id ?? 'default',
        documentId: knowledgeDocument.id,
        summaryStatus: knowledgeDocument.summaryStatus,
        retrievalStatus: knowledgeDocument.retrievalStatus,
      },
      message: indexingStatus === 'failed'
        ? 'Document saved, but indexing failed. Retry this upload to resume.'
        : indexingStatus === 'keyword_only'
          ? 'Document saved and searchable by keywords. Semantic embeddings are unavailable.'
          : 'Document uploaded, chunked, and indexed for retrieval.',
    };
    if (indexingStatus !== 'failed') await updateDocumentIngestionMetadata(user.uid, situationId, stored.id, {
      uploadCompletion: { fingerprint: requestFingerprint, result: JSON.parse(JSON.stringify(result)) as Record<string, unknown> },
    });
    await assertDocumentOwnerWritable(user.uid);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DocumentIngestionError) return documentLimitResponse(err);
    if (isDocumentWriteUnavailable(err)) return documentWriteUnavailableResponse(err);
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

function isDocumentWriteUnavailable(error: unknown): error is DocumentOwnerUnavailableError | DocumentWriteUnavailableError {
  return error instanceof DocumentOwnerUnavailableError || error instanceof DocumentWriteUnavailableError;
}

function documentWriteUnavailableResponse(error: DocumentOwnerUnavailableError | DocumentWriteUnavailableError) {
  return NextResponse.json({ error: error.message, code: error.code, retryable: error.status === 503 }, { status: error.status });
}

/** A preflight cannot cancel GCS work already admitted when erasure starts. */
async function confirmOwnerAfterStorageWrite(uid: string, file: { delete: (options: { ignoreNotFound: boolean }) => Promise<unknown> }) {
  try { await assertDocumentOwnerWritable(uid); }
  catch (error) {
    if (error instanceof DocumentOwnerUnavailableError && error.status === 409) {
      await file.delete({ ignoreNotFound: true }).catch((cleanupError) => console.warn('[documents/upload] late storage cleanup failed:', cleanupError));
    }
    throw error;
  }
}

function documentLimitResponse(error: DocumentIngestionError) {
  return NextResponse.json({ error: error.message, code: error.code, retryable: false }, { status: error.status });
}

function orgIdOf(user: unknown): string | null {
  return (user as { orgId?: string }).orgId ?? null;
}

function cleanFormValue(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim().slice(0, 240) : '';
}

function normalizeFormList(values: FormDataEntryValue[], single?: string | null): string[] {
  const raw = [
    ...(single ? [single] : []),
    ...values.flatMap((value) => typeof value === 'string' ? value.split(',') : []),
  ];
  return uniqueStrings(raw);
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const cleaned = value.trim().slice(0, 160);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
  }
  return output;
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
