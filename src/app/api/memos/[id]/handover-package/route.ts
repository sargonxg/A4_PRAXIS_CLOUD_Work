import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { resolveBillingPublicOrigin } from '@/lib/billing/public-origin';
import { getAdminDbOrThrow, getAdminStorage, getDefaultBucketName } from '@/lib/firebase/admin';
import { loadMemoById, primaryMemoBody } from '@/lib/firebase/memo-service';
import { assertDocumentOwnerWritable, DocumentOwnerUnavailableError, withDocumentOwnerWrite } from '@/lib/documents/owner-write';
import { readMemoContextSnapshot } from '@/lib/memo/context-snapshot';
import { verifyMemoHumanApproval } from '@/lib/memo/human-review-server';
import { assertHandoverPreview, buildHandoverIntegrityManifest, createHandoverPlan,
  HandoverConflictError, sha256, type HandoverPlan } from '@/lib/memo/handover-package';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type RouteContext = { params: Promise<{ id: string }> };
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };

/** Preview performs no package, Storage, or canonical-state writes. */
export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    if (user.isDemo) return json({ error: 'Save a private memo before preparing a handover.' }, 403);
    const memoId = validId((await context.params).id);
    if (!memoId) return json({ error: 'Invalid memo id' }, 400);
    const plan = await loadPlan(user.uid, memoId);
    if (!plan) return json({ error: 'Memo not found' }, 404);
    return json({ ok: true, memoId, preview: plan.preview });
  } catch (error) { return routeError(error); }
});

/** The confirmed semantic snapshot is checked again before a temporary download is created. */
export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return json({ error: 'Save a private memo before preparing a handover.' }, 403);
    const origin = request.headers.get('origin');
    const publicOrigin = resolveBillingPublicOrigin();
    if (!publicOrigin || (origin && origin !== publicOrigin)) return json({ error: 'Cross-origin handover requests are not allowed.' }, 403);
    const memoId = validId((await context.params).id);
    if (!memoId) return json({ error: 'Invalid memo id' }, 400);
    const confirmation = await readConfirmation(request);
    const plan = await loadPlan(user.uid, memoId);
    if (!plan) return json({ error: 'Memo not found' }, 404);
    if (!confirmation) return json({ error: 'Preview the included context and limitations before creating a download.',
      previewRequired: true, preview: plan.preview }, 409);
    try { assertHandoverPreview(plan, confirmation); }
    catch (error) {
      if (error instanceof HandoverConflictError) return json({ error: error.message, code: error.code,
        previewRequired: true, preview: plan.preview }, 409);
      throw error;
    }

    const createdAt = new Date().toISOString();
    const capsuleText = JSON.stringify(plan.capsuleSnapshot, null, 2);
    const files: Record<string, string | Uint8Array> = {
      'README.md': plan.readme,
      'memo.md': plan.markdown,
      'memo.docx': await buildDocx(plan.markdown),
      'memo.pdf': buildPdf(plan.markdown),
      'capsule-snapshot.json': capsuleText,
      'capsule-snapshot.pdf': buildPdf(`Experimental capsule context snapshot\n${capsuleText}`),
      'receipt-ledger.csv': receiptCsv(plan),
      'source-receipts.json': JSON.stringify(plan.sources, null, 2),
      'path-manifest.json': JSON.stringify(plan.contextManifest, null, 2),
    };
    const integrityManifest = buildHandoverIntegrityManifest(plan.preview, files, createdAt);
    const integrityText = JSON.stringify(integrityManifest, null, 2);
    const zip = new JSZip();
    for (const [path, value] of Object.entries(files)) zip.file(path, value);
    zip.file('integrity-manifest.json', integrityText);
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const bucketName = getDefaultBucketName();
    const objectPath = `users/${user.uid}/handover-packages/${memoId}-${randomUUID()}.zip`;
    const file = getAdminStorage().bucket(bucketName).file(objectPath);
    const db = getAdminDbOrThrow();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    // Generation can outlast an account-erasure sweep. Check again before the
    // cross-store write and inside the receipt transaction, with compensation.
    await assertDocumentOwnerWritable(user.uid, db);
    let signedUrl: string;
    try {
      await file.save(buffer, { resumable: false, contentType: 'application/zip', metadata: { metadata: {
        memoId, memoVersionId: plan.preview.memoVersionId, capsuleId: plan.preview.capsule.capsuleId ?? '',
        capsuleVersion: String(plan.preview.capsule.resolvedVersion ?? ''), generatedBy: user.uid, createdAt,
        previewHash: plan.preview.previewHash, packageHash: sha256(buffer),
      } } });
      // Sign before committing the receipt so failed signing leaves no receipt.
      [signedUrl] = await file.getSignedUrl({ action: 'read', expires: new Date(expiresAt).getTime() });
      const receipt = db.collection('users').doc(user.uid).collection('handover_packages').doc(memoId);
      await withDocumentOwnerWrite(user.uid, (transaction) => {
        transaction.set(receipt, {
          memoId, memoVersionId: plan.preview.memoVersionId, capsuleId: plan.preview.capsule.capsuleId,
          capsuleVersion: plan.preview.capsule.resolvedVersion, bucketUri: `gs://${bucketName}/${objectPath}`,
          objectPath, expiresAt, createdAt, previewHash: plan.preview.previewHash,
          bodyHash: plan.preview.bodyHash, packageHash: sha256(buffer), reviewMode: plan.preview.mode,
        }, { merge: true });
      }, db);
    } catch (error) {
      try { await file.delete({ ignoreNotFound: true }); }
      catch { console.warn('[memos/handover-package] Incomplete download cleanup failed.'); }
      throw error;
    }
    return json({ ok: true, memoId, signedUrl, expiresAt, bucketUri: `gs://${bucketName}/${objectPath}`,
      preview: plan.preview, review: plan.preview.review,
      access: { kind: 'temporary-bearer-download', expiresAt, grantsSourcePermissions: false,
        expiryDeletesStoredPackage: false, contentSignature: false },
      integrity: { hashAlgorithm: 'SHA-256', packageHash: sha256(buffer), manifestHash: sha256(integrityText),
        contentSignature: false, analyticalVerification: false },
      manifest: { files: plan.preview.files, pathId: plan.contextManifest.pathId, integrityManifest } });
  } catch (error) { return routeError(error); }
});

async function loadPlan(uid: string, memoId: string): Promise<HandoverPlan | null> {
  // Reuse the existing loader's owner/path/identity checks, including legacy compatibility.
  const loaded = await loadMemoById(uid, memoId);
  if (!loaded || loaded.memo.ownerUid !== uid || loaded.memo.id !== memoId) return null;
  const memo = loaded.memo;
  const versionId = typeof memo.currentVersionId === 'string' ? memo.currentVersionId : '';
  const version = loaded.versions.find((item) => item.id === versionId && item.memoId === memoId);
  if (!version) throw new HandoverConflictError('saved_memo_required', 'The current saved memo version is unavailable. Save and reopen the memo before preparing a handover.');
  const recordedContext = readMemoContextSnapshot(version.contextSnapshot);
  if (!recordedContext || recordedContext.binding !== 'recorded') {
    throw new HandoverConflictError('memo_context_unrecorded', 'This saved version has no recorded context. Choose a capsule or explicitly remove it, then save before preparing a handover.');
  }
  const { capsuleId, capsuleVersion } = recordedContext;
  const capsule = capsuleId ? await loadPinnedCapsule(uid, capsuleId, capsuleVersion) : null;
  return createHandoverPlan({ ownerUid: uid, memoId, memoVersionId: versionId,
    title: String(memo.title || memoId).replace(/[\r\n\u0000-\u001f]/g, ' ').slice(0, 1000),
    body: primaryMemoBody(version.blocks), capsuleId, capsuleVersion, capsule,
    sourceReceipts: recordedContext.sourceReceipts,
    sourceReceiptIds: recordedContext.sourceReceiptIds,
    caseId: stringField(memo.caseId), pathId: stringField(memo.pathId),
    verifiedApproval: verifyMemoHumanApproval(memo.humanApproval) });
}

async function loadPinnedCapsule(uid: string, capsuleId: string, version: number | null): Promise<unknown> {
  if (!validId(capsuleId) || !version) return null;
  const ref = getAdminDbOrThrow().collection('users').doc(uid).collection('capsules').doc(capsuleId);
  // Check stored identity before normalizers can supply defaults. Unlike active
  // Ask attachments, archival lineage may still include an archived snapshot.
  const current = await ref.get();
  const currentRaw = current.exists ? current.data() : null;
  if (currentRaw?.ownerUid === uid && currentRaw.capsuleId === capsuleId && currentRaw.version === version) return currentRaw;
  const snapshot = await ref.collection('versions').doc(`v${version}`).get();
  if (!snapshot.exists) return null;
  const historical = snapshot.data();
  if (historical?.ownerUid !== uid || historical.capsuleId !== capsuleId || historical.version !== version) return null;
  return historical;
}

async function readConfirmation(request: Request): Promise<string | null> {
  if (!request.body) return null;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new HandoverConflictError('invalid_confirmation', 'Use a JSON preview confirmation.');
  }
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); throw new HandoverConflictError('invalid_confirmation', 'Preview confirmation exceeds the request limit.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!size) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HandoverConflictError('invalid_confirmation', 'Invalid JSON preview confirmation.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new HandoverConflictError('invalid_confirmation', 'Invalid preview confirmation.');
  const value = (parsed as Record<string, unknown>).previewHash;
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(value)) throw new HandoverConflictError('invalid_confirmation', 'Invalid preview hash.');
  return value;
}

function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: PRIVATE_HEADERS }); }
function routeError(error: unknown): Response {
  if (error instanceof DocumentOwnerUnavailableError) return json({ error: error.message, code: error.code,
    retryable: error.status === 503 }, error.status);
  if (error instanceof HandoverConflictError) return json({ error: error.message, code: error.code }, error.code === 'invalid_confirmation' ? 400 : 409);
  const response = handleRouteError(error, 'memos/handover-package');
  response.headers.set('Cache-Control', PRIVATE_HEADERS['Cache-Control']);
  return response;
}
function validId(value: string): string | null { return value.trim() && value.length <= 180 && !/[/?#[\]\\\u0000-\u001f]/.test(value) ? value : null; }
function stringField(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }

async function buildDocx(text: string): Promise<Buffer> {
  return Packer.toBuffer(new Document({ sections: [{ children: text.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })) }] }));
}
function buildPdf(text: string): Buffer {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  let y = 18;
  for (const line of pdf.splitTextToSize(text, 180) as string[]) {
    if (y > 280) { pdf.addPage(); y = 18; }
    pdf.text(line, 15, y); y += 4.8;
  }
  return Buffer.from(pdf.output('arraybuffer'));
}
function receiptCsv(plan: HandoverPlan): string {
  const rows = [['kind', 'id', 'title', 'publisher', 'url', 'originalPassageIncluded', 'claimSupportVerified'],
    ...plan.sources.map((source) => ['source', String(source.id), String(source.title), String(source.publisher), String(source.url ?? ''), 'false', 'false'])];
  // Quoting alone does not prevent spreadsheet formula interpretation.
  return rows.map((row) => row.map((cell) => `"${cell.replace(/^[=+@\-]/, "'$&").replace(/"/g, '""').replace(/[\r\n]/g, ' ')}"`).join(',')).join('\n');
}
