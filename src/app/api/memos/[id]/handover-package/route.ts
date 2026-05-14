import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow, getAdminStorage, getDefaultBucketName } from '@/lib/firebase/admin';
import { getCapsule } from '@/lib/context/capsule-service';
import { memoBlocksToMarkdown } from '@/lib/memo/export';
import { resolvePath } from '@/lib/path/resolve';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

interface LoadedMemo {
  memoId: string;
  title: string;
  situationId: string | null;
  capsuleId: string | null;
  capsuleVersion: number | null;
  blocks: Array<{ type: string; title?: string; content?: string; items?: string[]; citations?: unknown[]; metadata?: Record<string, unknown> }>;
  sourceReceipts: unknown[];
  claimChecks: unknown[];
  toolInvocations: unknown[];
  raw: Record<string, unknown>;
}

export const POST = withAuth(async (_request, user, context?: RouteContext) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Demo users cannot create signed handover packages.' }, { status: 403 });
    }
    const memoId = cleanId((await context?.params)?.id ?? '');
    if (!memoId) return NextResponse.json({ error: 'Invalid memo id' }, { status: 400 });

    const memo = await loadMemo(user.uid, memoId);
    if (!memo) return NextResponse.json({ error: 'Memo not found' }, { status: 404 });

    const [capsule, situation] = await Promise.all([
      memo.capsuleId ? getCapsule(user.uid, memo.capsuleId).catch(() => null) : Promise.resolve(null),
      memo.situationId ? getSituationRaw(user.uid, memo.situationId).catch(() => null) : Promise.resolve(null),
    ]);
    const path = await resolvePath(
      stringField(situation?.pathId) ?? null,
      stringField(situation?.domain) ?? null,
    );

    const markdown = memoBlocksToMarkdownSafe(memo);
    const zip = new JSZip();
    zip.file('memo.md', markdown);
    zip.file('memo.docx', await buildDocx(memo.title, markdown));
    zip.file('memo.pdf', buildPdf(memo.title, markdown));
    zip.file('capsule-snapshot.json', JSON.stringify(capsule ?? { capsuleId: memo.capsuleId, capsuleVersion: memo.capsuleVersion }, null, 2));
    zip.file('capsule-snapshot.pdf', buildPdf('Capsule Snapshot', JSON.stringify(capsule ?? {}, null, 2)));
    zip.file('receipt-ledger.csv', buildReceiptCsv(memo));
    zip.file('path-manifest.json', JSON.stringify({
      path,
      situation: situation ? {
        id: memo.situationId,
        name: stringField(situation.name),
        domain: stringField(situation.domain),
        pathId: stringField(situation.pathId),
      } : null,
      generatedAt: new Date().toISOString(),
    }, null, 2));

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const bucketName = getDefaultBucketName();
    const objectPath = `users/${user.uid}/handover-packages/${memoId}-${Date.now().toString(36)}.zip`;
    const file = getAdminStorage().bucket(bucketName).file(objectPath);
    await file.save(buffer, {
      resumable: false,
      contentType: 'application/zip',
      metadata: {
        metadata: {
          memoId,
          situationId: memo.situationId ?? '',
          capsuleId: memo.capsuleId ?? '',
          pathId: path?.id ?? '',
          generatedBy: user.uid,
          generatedAt: new Date().toISOString(),
        },
      },
    });
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: expiresAt });

    await getAdminDbOrThrow()
      .collection('users').doc(user.uid)
      .collection('handover_packages').doc(memoId)
      .set({
        memoId,
        situationId: memo.situationId,
        capsuleId: memo.capsuleId,
        capsuleVersion: memo.capsuleVersion,
        pathId: path?.id ?? null,
        bucketUri: `gs://${bucketName}/${objectPath}`,
        objectPath,
        expiresAt: new Date(expiresAt).toISOString(),
        createdAt: new Date().toISOString(),
      }, { merge: true });

    return NextResponse.json({
      ok: true,
      memoId,
      signedUrl,
      expiresAt: new Date(expiresAt).toISOString(),
      bucketUri: `gs://${bucketName}/${objectPath}`,
      manifest: {
        files: ['memo.md', 'memo.docx', 'memo.pdf', 'capsule-snapshot.json', 'capsule-snapshot.pdf', 'receipt-ledger.csv', 'path-manifest.json'],
        pathId: path?.id ?? null,
      },
    });
  } catch (err) {
    return handleRouteError(err, 'memos/handover-package');
  }
});

async function loadMemo(uid: string, memoId: string): Promise<LoadedMemo | null> {
  const db = getAdminDbOrThrow();
  const direct = await db.collection('users').doc(uid).collection('memos').doc(memoId).get();
  if (direct.exists) return normalizeMemo(memoId, direct.data() ?? {});

  const nested = await db
    .collectionGroup('memos')
    .where('ownerUid', '==', uid)
    .where('id', '==', memoId)
    .limit(1)
    .get();
  if (nested.empty) return null;
  const data = nested.docs[0].data();
  const versions = await nested.docs[0].ref.collection('versions').orderBy('versionNumber', 'desc').limit(1).get();
  return normalizeMemo(memoId, { ...data, latestVersion: versions.docs[0]?.data() });
}

function normalizeMemo(memoId: string, data: Record<string, unknown>): LoadedMemo {
  const latestVersion = isRecord(data.latestVersion) ? data.latestVersion : {};
  const blocks = Array.isArray(data.blocks)
    ? data.blocks as LoadedMemo['blocks']
    : Array.isArray(latestVersion.blocks)
      ? latestVersion.blocks as LoadedMemo['blocks']
      : [];
  return {
    memoId: stringField(data.memoId) ?? stringField(data.id) ?? memoId,
    title: stringField(data.title) ?? stringField(data.memoTitle) ?? memoId,
    situationId: stringField(data.situationId) ?? stringField(data.caseId),
    capsuleId: stringField(data.capsuleId),
    capsuleVersion: numberField(data.capsuleVersion),
    blocks,
    sourceReceipts: Array.isArray(data.sourceReceipts) ? data.sourceReceipts : [],
    claimChecks: Array.isArray(data.claimChecks) ? data.claimChecks : [],
    toolInvocations: Array.isArray(data.toolInvocations) ? data.toolInvocations : [],
    raw: data,
  };
}

async function getSituationRaw(uid: string, situationId: string): Promise<Record<string, unknown> | null> {
  const snap = await getAdminDbOrThrow().collection('users').doc(uid).collection('situations').doc(situationId).get();
  return snap.exists ? snap.data() ?? null : null;
}

function memoBlocksToMarkdownSafe(memo: LoadedMemo): string {
  if (memo.blocks.length > 0) {
    return memoBlocksToMarkdown(memo.title, memo.blocks as Parameters<typeof memoBlocksToMarkdown>[1]);
  }
  return [`# ${memo.title}`, '', JSON.stringify(memo.raw, null, 2)].join('\n');
}

async function buildDocx(title: string, markdown: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: markdown.split('\n').map((line) => new Paragraph({
        children: [new TextRun(line || ' ')],
      })),
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

function buildPdf(title: string, text: string): Buffer {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(title.slice(0, 120), 40, 45);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const lines = pdf.splitTextToSize(text.slice(0, 30_000), 515) as string[];
  let y = 70;
  for (const line of lines) {
    if (y > 780) {
      pdf.addPage();
      y = 40;
    }
    pdf.text(line, 40, y);
    y += 12;
  }
  return Buffer.from(pdf.output('arraybuffer'));
}

function buildReceiptCsv(memo: LoadedMemo): string {
  const rows = [
    ['kind', 'index', 'id', 'summary'],
    ...memo.sourceReceipts.map((item, index) => ['source', String(index + 1), receiptId(item), receiptSummary(item)]),
    ...memo.claimChecks.map((item, index) => ['claim-check', String(index + 1), receiptId(item), receiptSummary(item)]),
    ...memo.toolInvocations.map((item, index) => ['tool', String(index + 1), receiptId(item), receiptSummary(item)]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

function receiptId(value: unknown): string {
  if (!isRecord(value)) return '';
  return stringField(value.id) ?? stringField(value.receiptId) ?? stringField(value.sourceReceiptId) ?? stringField(value.toolCallId) ?? '';
}

function receiptSummary(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return JSON.stringify(value);
  return stringField(value.summary) ?? stringField(value.title) ?? stringField(value.text) ?? JSON.stringify(value);
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\r?\n/g, ' ').slice(0, 4000)}"`;
}

function cleanId(value: string): string {
  return value.trim().replace(/[/?#[\]]/g, '_').slice(0, 180);
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberField(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
