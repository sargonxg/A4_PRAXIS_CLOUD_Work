import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { signalStore } from '@/lib/signal/store';
import { pointer, DeskInputSchema } from '@/lib/signal/schema';
import { approveBrief, capture, digest, draftBrief, editBrief, graph, invalidate, markSignalContextStale, metrics, propose, review, signalBriefHasWithdrawnEvidence, SignalError } from '@/lib/signal/domain';
import { attachSignalContext } from '@/lib/signal/capsules';
import { collectSignalDesk } from '@/lib/signal/collectors';
import { setSignalWatch } from '@/lib/signal/jobs';
import { proposeNarrative, proposeAssessment, reviewInterpretation } from '@/lib/signal/assessments';
import { deleteSignalDesk, revokeSignalSnapshotExports } from '@/lib/signal/deletion';
import { appendSignalFeedback } from '@/lib/signal/feedback';

export const runtime = 'nodejs';
export const maxDuration = 120;
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
export function signalResponseError(error: unknown) {
  const status = error instanceof SignalError ? error.status : error instanceof ZodError ? 422 : 503;
  return NextResponse.json({ error: error instanceof SignalError ? error.message : error instanceof ZodError ? 'Check the supplied fields and evidence bounds.' : 'SIGNAL is temporarily unavailable. Retry without changing your evidence.' }, { status, headers });
}
const version = z.number().int().positive();
const capabilities = () => ({ gdelt: process.env.SIGNAL_GDELT_ENABLED === 'true' });
const rationale = z.string().trim().min(3).max(2000);
export const GET = withAuth(async (req, user) => {
  try {
    const params = new URL(req.url).searchParams; const id = params.get('deskId');
    if (!id) return NextResponse.json({ ...await signalStore.list(user.uid, params.get('cursor') ?? undefined), capabilities: capabilities() }, { headers });
    const desk = await signalStore.get(user.uid, pointer.parse(id));
    if (params.get('export') === 'brief' || params.get('export') === 'bundle') {
      const brief = desk.briefs.find(b => b.id === params.get('briefId'));
      if (!brief || brief.status !== 'approved') throw new SignalError(404, 'Approved brief unavailable.');
      if (!brief.manifest.exportAllowed) throw new SignalError(403, 'Source entitlements restrict this export. Review permitted export rights first.');
      if (signalBriefHasWithdrawnEvidence(desk, brief)) throw new SignalError(403, 'An underlying source was withdrawn. This historical artifact is retained for review but export is suspended.');
      if (params.get('export') === 'brief') return new Response(`${brief.text}\n\nApproval: ${brief.approvedAt}; pinned digest: ${brief.digest}${brief.stale ? '\nWarning: subsequent evidence or review changed; this historical approved artifact needs reassessment.' : ''}`, { headers: { ...headers, 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': `attachment; filename="signal-${brief.id}.md"` } });
      if (!brief.manifest.snapshots) throw new SignalError(409, 'This artifact lacks a pinned export snapshot. Prepare a new draft.');
      return NextResponse.json({ profile: 'praxis-signal-approved-brief/1', desk: brief.manifest.snapshots.desk, brief,
        reviews: brief.manifest.snapshots.reviews,
        sources: brief.manifest.snapshots.sources,
        claims: brief.manifest.snapshots.claims,
        currentStatus: { stale: brief.stale ?? false, sources: brief.manifest.claims.map(c => ({ id: c.sourceRevisionId, withdrawn: desk.sources.find(s => s.id === c.sourceRevisionId)?.withdrawn ?? false })) },
      }, { headers: { ...headers, 'Content-Disposition': `attachment; filename="signal-${brief.id}.json"` } });
    }
    return NextResponse.json({ desk, capabilities: capabilities(), graph: graph(desk), metrics: metrics(desk), context: desk.contextReceipt ? { stale: desk.contextStale ?? false, text: desk.contextText, receipt: desk.contextReceipt, capsuleId: desk.capsuleId } : null }, { headers });
  } catch (error) { return signalResponseError(error); }
});
export const POST = withAuth(async (req, user) => {
  try {
    const raw = await req.text();
    if (Buffer.byteLength(raw, 'utf8') > 64000) throw new SignalError(413, 'Split this input into bounded evidence captures.');
    let body: Record<string, unknown>;
    try { body = z.record(z.string(), z.unknown()).parse(JSON.parse(raw)); } catch { throw new SignalError(400, 'Provide a valid JSON request.'); }
    const { action, deskId, expectedVersion, ...fields } = body;
    if (action === 'create') return NextResponse.json({ desk: await signalStore.create(user.uid, DeskInputSchema.parse(fields)) }, { status: 201, headers });
    const id = pointer.parse(deskId); const expected = version.parse(expectedVersion); const now = new Date().toISOString();
    if (action === 'collect') {
      const provider = z.enum(['gdelt', 'rss']).parse(fields.provider); const query = z.string().trim().max(160).optional().parse(fields.query);
      return NextResponse.json({ desk: await collectSignalDesk(user.uid, id, expected, provider, query) }, { headers });
    }
    if (action === 'watch') return NextResponse.json({ desk: await setSignalWatch(user.uid, id, expected, z.boolean().parse(fields.watched)) }, { headers });
    if (action === 'context') {
      const current = await signalStore.get(user.uid, id);
      if (current.version !== expected) throw new SignalError(409, 'Desk changed. Reload first.');
      const requested = fields.capsuleId ? pointer.parse(fields.capsuleId) : undefined;
      const result = await attachSignalContext(user.uid, { ...current, ...(requested ? { capsuleId: requested } : {}) });
      const desk = await signalStore.mutate(user.uid, id, expected, d => {
        if (d.contextStale || digest(d.contextReceipt ?? null) !== digest(result.receipt) || d.claims.length > 0) {
          d.briefs.forEach(b => { b.stale = true; }); d.claims.forEach(c => { c.stale = true; });
          d.assessments?.forEach(a => { a.stale = true; }); d.narratives?.forEach(n => { n.stale = true; });
        }
        d.contextEpoch = (d.contextEpoch ?? 0) + 1; d.contextStale = false; d.capsuleId = result.capsuleId; d.contextExportAllowed = result.exportAllowed; d.contextCapsuleIds = [...new Set([...(d.contextCapsuleIds ?? []), result.capsuleId])]; d.contextReceipt = result.receipt; d.contextText = result.text;
      }); return NextResponse.json({ desk }, { headers });
    }
    const desk = await signalStore.mutate(user.uid, id, expected, d => {
      switch (action) {
        case 'feedback': appendSignalFeedback(d, user.uid, fields, now); break;
        case 'capture': capture(d, fields, now); break;
        case 'propose': propose(d, fields, now, { kind: 'analyst', actorUid: user.uid }); break;
        case 'review': review(d, user.uid, z.object({ claimId: pointer, digest: z.string().length(64), decision: z.enum(['accepted', 'rejected', 'unresolved']), rationale }).strict().parse(fields), now); break;
        case 'draftBrief': draftBrief(d, now); break;
        case 'approveBrief': approveBrief(d, user.uid, z.object({ briefId: pointer, digest: z.string().length(64), rationale }).strict().parse(fields), now); break;
        case 'editBrief': { const edit = z.object({ briefId: pointer, text: z.string().min(1).max(24000) }).strict().parse(fields); editBrief(d, edit.briefId, edit.text, now); break; }
        case 'proposeNarrative': proposeNarrative(d, fields, now); break;
        case 'proposeAssessment': proposeAssessment(d, fields, now); break;
        case 'reviewInterpretation': reviewInterpretation(d, user.uid, z.object({ targetId: pointer, digest: z.string().length(64), decision: z.enum(['accepted', 'rejected', 'unresolved']), rationale }).strict().parse(fields), now); break;
        case 'configure': {
          const next = DeskInputSchema.parse(fields);
          const panelChanged = digest(d.sourcePack) !== digest(next.sourcePack);
          if (panelChanged) next.sourcePack.version = d.sourcePack.version + 1;
          if (digest({ scope: d.scope, question: d.question, audience: d.audience, languages: d.languages, windowDays: d.windowDays }) !== digest({ scope: next.scope, question: next.question, audience: next.audience, languages: next.languages, windowDays: next.windowDays }) || panelChanged) d.briefs.forEach(b => { b.stale = true; });
          if (panelChanged || digest({ scope: d.scope, question: d.question, audience: d.audience, languages: d.languages, windowDays: d.windowDays }) !== digest({ scope: next.scope, question: next.question, audience: next.audience, languages: next.languages, windowDays: next.windowDays })) { markSignalContextStale(d); d.assessments?.forEach(a => { a.stale = true; }); d.narratives?.forEach(n => { n.stale = true; }); }
          Object.assign(d, next); break;
        }
        case 'withdraw': {
          const sourceId = pointer.parse(fields.sourceRevisionId); const source = d.sources.find(s => s.id === sourceId);
          if (!source) throw new SignalError(404, 'Source unavailable.'); source.withdrawn = true; d.contextExportAllowed = false; invalidate(d, source.id); break;
        }
        default: throw new SignalError(400, 'Unknown SIGNAL action.');
      }
    });
    if (action === 'withdraw') await revokeSignalSnapshotExports(user.uid, desk);
    return NextResponse.json({ desk }, { headers });
  } catch (error) { return signalResponseError(error); }
});

export const DELETE = withAuth(async (req, user) => {
  try {
    const params = new URL(req.url).searchParams;
    await deleteSignalDesk(user.uid, pointer.parse(params.get('deskId')), version.parse(Number(params.get('expectedVersion'))));
    return NextResponse.json({ deleted: true }, { headers });
  } catch (error) { return signalResponseError(error); }
});
