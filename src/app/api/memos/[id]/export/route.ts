import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { loadMemoById, primaryMemoBody } from '@/lib/firebase/memo-service';
import { memoOutputBodyHash } from '@/lib/memo/output-review';
import { isCurrentMemoHumanApproval } from '@/lib/memo/human-review';
import { verifyMemoHumanApproval } from '@/lib/memo/human-review-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (request, user, context) => {
  if (user.isDemo) return NextResponse.json({ error: 'Save and review a private memo before downloading a reviewed version.' }, { status: 403 });
  const memoId = (await context.params).id;
  if (!memoId || memoId.length > 180 || /[/\\?#\[\]]/.test(memoId)) return NextResponse.json({ error: 'Invalid memo id' }, { status: 400 });
  const params = new URL(request.url).searchParams;
  const format = params.get('format') ?? 'md';
  const requestedVersion = params.get('versionId');
  if (!['md', 'docx'].includes(format) || !requestedVersion || requestedVersion.length > 240) {
    return NextResponse.json({ error: 'Choose Markdown or Word and the saved version to download.' }, { status: 400 });
  }
  try {
    const record = await loadMemoById(user.uid, memoId);
    if (!record) return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    const versionId = String(record.memo.currentVersionId ?? '');
    const version = record.versions.find((candidate) => candidate.id === versionId);
    const body = version ? primaryMemoBody(version.blocks) : '';
    const approval = verifyMemoHumanApproval(record.memo.humanApproval);
    if (requestedVersion !== versionId || !body.trim() || !approval || approval.reviewerUid !== user.uid
      || !isCurrentMemoHumanApproval(approval, { memoId, versionId, bodyHash: await memoOutputBodyHash(body) })) {
      return NextResponse.json({ error: 'Review the current saved version before downloading a reviewed memo.' }, { status: 409 });
    }
    const scope = { 'internal-analysis': 'Internal analysis', 'external-sharing': 'External sharing', publication: 'Publication' }[approval.intendedUse];
    const title = String(record.memo.title ?? 'Policy memo');
    const reviewNote = `Human review for: ${scope}\nReviewed: ${approval.approvedAt}\nSaved version: ${versionId}\nLimitations: ${approval.limitations || 'No additional limitations recorded.'}\nThis records the owner\u2019s review for the stated use; it is not an independent verification of the claims.`;
    const markdown = `# ${title}\n\n${reviewNote}\n\n${body}\n`;
    const filename = title.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 80) || 'policy-memo';
    const headers = { 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.${format}`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
    if (format === 'md') return new NextResponse(markdown, { headers: { ...headers, 'Content-Type': 'text/markdown; charset=utf-8' } });
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })] }),
      ...`${reviewNote}\n\n${body}`.split('\n').map((text) => new Paragraph({ children: [new TextRun(text)] })),
    ] }] });
    const bytes = await Packer.toBuffer(doc);
    return new NextResponse(new Uint8Array(bytes), { headers: { ...headers,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });
  } catch (error) {
    return handleRouteError(error, 'memo/export');
  }
});
