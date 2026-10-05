import { createHash, randomUUID } from 'node:crypto';
import { CaptureSchema, DeskInputSchema, ProposalSchema, type SignalDesk, type SignalSource, type SignalClaim, type SignalBrief } from './schema';

export class SignalError extends Error { constructor(public status: number, message: string) { super(message); this.name = 'SignalError'; } }
export const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export const digest = (value: unknown) => hash(JSON.stringify(value));
export const newId = () => randomUUID().replaceAll('-', '');
/** Activation history is separate from immutable source content revisions. */
export function signalSourceHead(desk: SignalDesk, sourceId: string): { revisionId: string; epoch: number } | undefined {
  const saved = desk.sourceHeads?.[sourceId];
  if (saved) return saved;
  let head: { revisionId: string; epoch: number } | undefined;
  for (const occurrence of desk.captures) {
    const revision = desk.sources.find(s => s.id === occurrence.revisionId && s.sourceId === sourceId);
    if (revision && revision.id !== head?.revisionId) head = { revisionId: revision.id, epoch: (head?.epoch ?? 0) + 1 };
  }
  if (!head) {
    const revisions = desk.sources.filter(s => s.sourceId === sourceId);
    const last = revisions.at(-1);
    if (last) head = { revisionId: last.id, epoch: revisions.length };
  }
  return head;
}
export function isCurrentSignalClaim(desk: SignalDesk, claim: SignalClaim): boolean {
  const source = desk.sources.find(s => s.id === claim.sourceRevisionId);
  const head = source && signalSourceHead(desk, source.sourceId);
  return Boolean(source && !source.withdrawn && !claim.stale && head?.revisionId === source.id && (claim.activationEpoch ?? 1) === head.epoch);
}
export function createDesk(ownerUid: string, input: unknown, now = new Date().toISOString()): SignalDesk {
  return { ...DeskInputSchema.parse(input), id: newId(), ownerUid, schemaVersion: 'signal/0.2', version: 1, createdAt: now, updatedAt: now, watched: false,
    budget: { maxCollectionsPerDay: 24, maxAnalysesPerDay: 10 }, usage: { day: now.slice(0, 10), collections: 0, analyses: 0, tokens: 0 }, sources: [], captures: [], claims: [], reviews: [], briefs: [], runs: [] };
}
export function validateSpan(source: SignalSource, input: { quote: string; start: number; end: number }) {
  if (source.kind !== 'original_text' || source.withdrawn) throw new SignalError(422, 'Capture permitted original text before proposing a source reading.');
  const splitsPair = (at: number) => at > 0 && at < source.text.length && /[\uD800-\uDBFF]/.test(source.text[at - 1]) && /[\uDC00-\uDFFF]/.test(source.text[at]);
  if (hash(source.text) !== source.hash || input.start < 0 || input.end <= input.start || input.end > source.text.length || source.text.slice(input.start, input.end) !== input.quote || splitsPair(input.start) || splitsPair(input.end)) throw new SignalError(422, 'The quotation must match this exact source revision and UTF-16 span.');
}
export function capture(desk: SignalDesk, raw: unknown, now: string, discoveredAt = now): SignalSource {
  const input = CaptureSchema.parse(raw);
  if (input.publicationTime && Date.parse(input.publicationTime) > Date.parse(now) + 86400000) throw new SignalError(422, 'Publication time is in the future.');
  let normalizedUrl: string | undefined;
  if (input.url) {
    const url = new URL(input.url);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new SignalError(422, 'Use a public HTTP source URL without credentials.');
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort(); normalizedUrl = url.toString();
  }
  const sourceId = hash(normalizedUrl || `supplied:${input.title}`).slice(0, 32);
  const contentHash = hash(input.text);
  // Language/rights/clock changes are revisions too: never silently broaden an old entitlement.
  const revisionId = digest({ sourceId, contentHash, language: input.language, kind: input.kind, rights: input.rights, publicationTime: input.publicationTime, synthetic: input.synthetic }).slice(0, 40);
  const previousHead = signalSourceHead(desk, sourceId);
  const captureId = digest({ revisionId, now }).slice(0, 40);
  let source = desk.sources.find(s => s.id === revisionId);
  // Replaying an already recorded occurrence cannot rewind the current head.
  if (source && desk.captures.some(c => c.id === captureId)) return source;
  if (desk.captures.length >= 400) throw new SignalError(413, 'Capture history capacity reached. Create a new bounded desk.');
  if (!source) {
    if (desk.sources.length >= 80) throw new SignalError(413, 'This pilot desk has reached its evidence capacity. Create a new bounded desk.');
    const previous = desk.sources.find(s => s.id === previousHead?.revisionId);
    source = { ...input, ...(normalizedUrl ? { url: normalizedUrl } : {}), id: revisionId, sourceId, hash: contentHash, discoveredAt, capturedAt: now, publicationTimeReason: input.publicationTime ? null : 'Not supplied by the original source', ...(previous ? { supersedes: previous.id } : {}) };
    desk.sources.push(source);
  }
  if (previousHead?.revisionId !== revisionId) {
    if (previousHead) invalidate(desk, previousHead.revisionId);
    desk.sourceHeads ??= {};
    desk.sourceHeads[sourceId] = { revisionId, epoch: (previousHead?.epoch ?? 0) + 1 };
  }
  // Exact duplicate capture is idempotent; a later observation keeps its own occurrence.
  if (!desk.captures.some(c => c.id === captureId)) desk.captures.push({ id: captureId, revisionId, capturedAt: now });
  return source;
}
export function invalidate(desk: SignalDesk, revisionId: string) {
  desk.claims.filter(c => c.sourceRevisionId === revisionId).forEach(c => { c.stale = true; });
  desk.briefs.filter(b => b.manifest.claims.some(c => c.sourceRevisionId === revisionId)).forEach(b => { b.stale = true; });
  const changed = new Set(desk.claims.filter(c => c.sourceRevisionId === revisionId).map(c => c.id));
  desk.narratives?.filter(n => n.claimIds.some(id => changed.has(id))).forEach(n => { n.stale = true; });
  desk.assessments?.filter(a => a.claimIds.some(id => changed.has(id))).forEach(a => { a.stale = true; });
}
export function propose(desk: SignalDesk, raw: unknown, now: string, derivation?: Record<string, unknown>): SignalClaim {
  const input = ProposalSchema.parse(raw);
  const source = desk.sources.find(s => s.id === input.sourceRevisionId);
  if (!source) throw new SignalError(404, 'Source revision unavailable.');
  const head = signalSourceHead(desk, source.sourceId);
  if (head?.revisionId !== source.id) throw new SignalError(409, 'Choose the current source revision before proposing a reading.');
  validateSpan(source, input);
  const claimDigest = digest({ ...input, evidenceHash: source.hash, activationEpoch: head.epoch, contextReceipt: desk.contextReceipt ?? null });
  const existing = desk.claims.find(c => c.digest === claimDigest);
  if (existing) return existing;
  if (desk.claims.length >= 160) throw new SignalError(413, 'Proposal capacity reached.');
  const claim: SignalClaim = { ...input, id: claimDigest.slice(0, 40), digest: claimDigest, evidenceHash: source.hash, activationEpoch: head.epoch, contextDigest: desk.contextReceipt ? digest(desk.contextReceipt) : null, offsetUnit: 'utf16_code_unit', status: 'proposed', createdAt: now, ...(derivation ? { derivation } : {}) };
  desk.claims.push(claim); return claim;
}
export function review(desk: SignalDesk, uid: string, input: { claimId: string; digest: string; decision: 'accepted' | 'rejected' | 'unresolved'; rationale: string }, now: string) {
  const claim = desk.claims.find(c => c.id === input.claimId);
  if (!claim) throw new SignalError(404, 'Proposal unavailable.');
  const source = desk.sources.find(s => s.id === claim.sourceRevisionId);
  if (claim.digest !== input.digest || !isCurrentSignalClaim(desk, claim) || !source || source.hash !== claim.evidenceHash || (claim.contextDigest ?? null) !== (desk.contextReceipt ? digest(desk.contextReceipt) : null)) throw new SignalError(409, 'Evidence, context or proposal changed. Review the current source revision.');
  validateSpan(source, claim);
  if (!input.rationale.trim()) throw new SignalError(422, 'Explain the review decision.');
  if (desk.reviews.length >= 400) throw new SignalError(413, 'Review history capacity reached.');
  desk.reviews.push({ id: newId(), targetId: claim.id, digest: claim.digest, evidenceHash: claim.evidenceHash, contextDigest: desk.contextReceipt ? digest(desk.contextReceipt) : null, decision: input.decision, rationale: input.rationale.trim(), reviewerUid: uid, createdAt: now });
  if (claim.status !== input.decision) desk.briefs.filter(b => b.manifest.claimIds.includes(claim.id)).forEach(b => { b.stale = true; });
  if (input.decision !== 'accepted') {
    desk.narratives?.filter(n => n.claimIds.includes(claim.id)).forEach(n => { n.stale = true; });
    desk.assessments?.filter(a => a.claimIds.includes(claim.id)).forEach(a => { a.stale = true; });
  }
  claim.status = input.decision;
}
export function draftBrief(desk: SignalDesk, now: string): SignalBrief {
  const accepted = desk.claims.filter(c => c.status === 'accepted' && isCurrentSignalClaim(desk, c));
  if (!accepted.length) throw new SignalError(422, 'Accept at least one current source reading before drafting a brief.');
  const previous = [...desk.briefs].reverse().find(b => b.status === 'approved');
  const added = accepted.filter(c => !previous?.manifest.claimIds.includes(c.id));
  const removed = previous?.manifest.claimIds.filter(id => !accepted.some(c => c.id === id)) ?? [];
  const evidence = accepted.map(c => desk.sources.find(s => s.id === c.sourceRevisionId)!);
  const assessment = [...(desk.assessments ?? [])].reverse().find(a => a.status === 'accepted' && !a.stale && a.sourcePackVersion === desk.sourcePack.version && digest(a.contextReceipt) === digest(desk.contextReceipt ?? null) && a.claimIds.every(id => accepted.some(c => c.id === id)));
  const narratives = (desk.narratives ?? []).filter(n => n.status === 'accepted' && !n.stale && n.claimIds.every(id => accepted.some(c => c.id === id)));
  const text = [`# ${desk.name} — evidence brief`, `Prepared: ${now}`, `Question: ${desk.question}`, `Audience: ${desk.audience}`, `Scope: ${desk.scope.label} (${desk.scope.countries.join(', ') || 'cross-border thematic'})`, `Panel: ${desk.sourcePack.id} v${desk.sourcePack.version}; window: ${desk.windowDays} days; languages: ${desk.languages.join(', ')}`, evidence.some(s => s.synthetic) ? '**Contains clearly labeled synthetic material.**' : '',
    '## Reviewed assessment', assessment ? `${assessment.conclusion}\n\nWhy this interpretation changed: ${assessment.changeReason}\n\nUncertainty: ${assessment.uncertainty}` : 'No reviewed analytical conclusion has been supplied. The findings below are source readings, not a geopolitical assessment.',
    ...narratives.map(n => `### Narrative dossier: ${n.title}\n${n.frame}\nAlternative frames: ${n.alternatives.join('; ')}`),
    '## Source readings', 'These reviewed readings describe what sources report. They do not establish event truth, authenticity, coordination or intent.',
    ...accepted.map((c, i) => `${i + 1}. ${c.speaker}: ${c.proposition} [${i + 1}]\n   Modality: ${c.modality}; polarity: ${c.polarity}; conditions: ${c.conditions || 'not specified'}; time: ${c.time}; place: ${c.place}.`),
    '## What changed', previous ? `Compared with approved brief ${previous.id}: ${added.length} newly reviewed readings, ${removed.length} removed or reopened readings. ${accepted.length - added.length} retained readings. Evidence changes require interpretation; these counts do not measure geopolitical risk.` : 'First reviewed evidence brief; no previous approved assessment exists.',
    assessment && previous?.manifest.assessment ? `Previous conclusion: ${previous.manifest.assessment.conclusion}\nCurrent conclusion: ${assessment.conclusion}\nInterpretation change: ${assessment.changeReason}` : '',
    '## Alternatives and unknowns', 'Source statements may be contested. No independent verification, causal inference or population-belief estimate is implied.', `${desk.claims.filter(c => c.status === 'unresolved').length} unresolved and ${desk.claims.filter(c => c.stale).length} stale proposals remain outside accepted findings.`,
    '## Decision implications and next review', 'Analyst interpretation is required before applying these readings to a decision. Reopen this brief when its sources, context, scope or source panel change.',
    assessment ? `Alternative explanations: ${assessment.alternatives.join('; ')}\nNext review triggers: ${assessment.invalidators.join('; ')}` : '',
    '## Evidence references', ...accepted.map((c, i) => { const s = evidence[i]; return `[${i + 1}] ${s.title}${s.synthetic ? ' (SYNTHETIC)' : ''}; ${s.url || 'private supplied source'}; publication: ${s.publicationTime || 'unknown'}; captured: ${s.capturedAt}; revision: ${s.id}; sha256: ${s.hash}; UTF-16 span ${c.start}–${c.end}.${s.rights.allowExport ? `\n> ${c.quote}` : '\nExcerpt restricted: inspect original inside the authorized desk.'}`; }),
    '## Coverage limits', 'This is a bounded monitored panel, not comprehensive country coverage. Supplied text may be partial. Discovery timestamps are not publication or event times.',
  ].filter(Boolean).join('\n\n');
  const brief: SignalBrief = { id: newId(), text, digest: hash(text), status: 'draft', createdAt: now, manifest: { deskVersion: desk.version, sourcePackVersion: desk.sourcePack.version, claimIds: accepted.map(c => c.id), claims: accepted.map(c => ({ id: c.id, digest: c.digest, sourceRevisionId: c.sourceRevisionId, evidenceHash: c.evidenceHash })), ...(assessment ? { assessment: structuredClone(assessment) } : {}), narratives: structuredClone(narratives), snapshots: { desk: structuredClone({ id: desk.id, name: desk.name, question: desk.question, audience: desk.audience, scope: desk.scope, languages: desk.languages, windowDays: desk.windowDays }), claims: structuredClone(accepted), reviews: structuredClone(desk.reviews.filter(r => accepted.some(c => c.id === r.targetId) || r.targetId === assessment?.id || narratives.some(n => n.id === r.targetId))), sources: evidence.map(s => { const { text: _text, ...metadata } = s; return structuredClone(metadata); }) }, contextReceipt: structuredClone(desk.contextReceipt ?? null), previousBriefId: previous?.id ?? null, synthetic: evidence.some(s => s.synthetic), exportAllowed: evidence.every(s => s.rights.allowExport) && desk.contextExportAllowed !== false, limitations: ['Source reading is not event verification', 'Bounded panel coverage', 'Original publication and event times may be unknown'] } };
  if (desk.briefs.length >= 40) throw new SignalError(413, 'Brief history capacity reached.');
  desk.briefs.push(brief); return brief;
}
export function approveBrief(desk: SignalDesk, uid: string, input: { briefId: string; digest: string; rationale: string }, now: string) {
  const brief = desk.briefs.find(b => b.id === input.briefId);
  if (!brief) throw new SignalError(404, 'Brief unavailable.');
  if (brief.status !== 'draft' || brief.digest !== input.digest || hash(brief.text) !== input.digest || brief.stale || brief.manifest.sourcePackVersion !== desk.sourcePack.version || digest(brief.manifest.contextReceipt) !== digest(desk.contextReceipt ?? null)) throw new SignalError(409, 'Brief inputs changed. Create and review a new draft.');
  if (brief.manifest.claims.some(p => { const c = desk.claims.find(c => c.id === p.id); const s = desk.sources.find(s => s.id === p.sourceRevisionId); return !c || !isCurrentSignalClaim(desk, c) || c.status !== 'accepted' || c.digest !== p.digest || !s || s.withdrawn || s.hash !== p.evidenceHash; })) throw new SignalError(409, 'A referenced source reading changed.');
  if (brief.manifest.assessment && !desk.assessments?.some(a => a.id === brief.manifest.assessment!.id && a.digest === brief.manifest.assessment!.digest && a.status === 'accepted' && !a.stale)) throw new SignalError(409, 'Assessment changed.');
  if (brief.manifest.narratives?.some(n => !desk.narratives?.some(current => current.id === n.id && current.digest === n.digest && current.status === 'accepted' && !current.stale))) throw new SignalError(409, 'Narrative interpretation changed.');
  if (!input.rationale.trim()) throw new SignalError(422, 'Explain editorial approval.');
  brief.status = 'approved'; brief.approvedAt = now;
  desk.reviews.push({ id: newId(), targetId: brief.id, digest: brief.digest, evidenceHash: digest(brief.manifest.claims), contextDigest: desk.contextReceipt ? digest(desk.contextReceipt) : null, decision: 'approved', rationale: input.rationale, reviewerUid: uid, createdAt: now });
  brief.manifest.snapshots?.reviews.push(structuredClone(desk.reviews[desk.reviews.length - 1]));
}
export function editBrief(desk: SignalDesk, briefId: string, text: string, now: string) {
  const prior = desk.briefs.find(b => b.id === briefId);
  if (!prior) throw new SignalError(404, 'Brief unavailable.');
  if (text.length > 24000 || !text.trim()) throw new SignalError(422, 'Brief text must be nonempty and bounded.');
  if (desk.briefs.length >= 40) throw new SignalError(413, 'Brief history capacity reached.');
  const next = { ...structuredClone(prior), id: newId(), text, digest: hash(text), status: 'draft' as const, createdAt: now, approvedAt: undefined };
  next.manifest.previousBriefId = prior.id;
  if (next.manifest.snapshots) next.manifest.snapshots.reviews = next.manifest.snapshots.reviews.filter(r => r.targetId !== prior.id);
  desk.briefs.push(next);
}
export function reserve(desk: SignalDesk, kind: 'collections' | 'analyses', now: string) {
  const day = now.slice(0, 10);
  if (desk.usage.day !== day) desk.usage = { day, collections: 0, analyses: 0, tokens: 0 };
  const max = kind === 'collections' ? desk.budget.maxCollectionsPerDay : desk.budget.maxAnalysesPerDay;
  if (desk.usage[kind] >= max) throw new SignalError(429, 'Daily desk allowance reached. Work is paused until the next UTC day.');
  desk.usage[kind]++;
}
export function graph(desk: SignalDesk) {
  return { nodes: [...desk.sources.map(s => ({ id: s.id, kind: 'source', label: s.title })), ...desk.claims.map(c => ({ id: c.id, kind: 'claim', label: c.proposition })), ...(desk.narratives ?? []).map(n => ({ id: n.id, kind: 'narrative', label: n.title })), ...(desk.assessments ?? []).map(a => ({ id: a.id, kind: 'assessment', label: a.conclusion }))], edges: [...desk.claims.map(c => ({ id: `reports_${c.id}`, source: c.sourceRevisionId, target: c.id, predicate: 'reports_claim', claimId: c.id, sourceRevisionId: c.sourceRevisionId, status: c.stale ? 'stale' : c.status })), ...(desk.narratives ?? []).flatMap(n => n.claimIds.map(id => ({ id: `member_${n.id}_${id}`, source: id, target: n.id, predicate: 'member_of_narrative', claimId: id, status: n.stale ? 'stale' : n.status }))), ...(desk.assessments ?? []).flatMap(a => a.claimIds.map(id => ({ id: `depends_${a.id}_${id}`, source: id, target: a.id, predicate: 'depends_on', claimId: id, status: a.stale ? 'stale' : a.status })))] };
}
export function metrics(desk: SignalDesk) {
  const collections = desk.runs.filter(r => r.provider !== 'analysis');
  return { panelVersion: desk.sourcePack.version, windowDays: desk.windowDays, sourceFamilies: new Set(desk.sources.map(s => s.sourceId)).size, totalRevisions: desk.sources.length, acceptedClaims: desk.claims.filter(c => c.status === 'accepted' && isCurrentSignalClaim(desk, c)).length, proposedClaims: desk.claims.filter(c => c.status === 'proposed').length, staleClaims: desk.claims.filter(c => !isCurrentSignalClaim(desk, c)).length,
    collectionAttempts: collections.length, collectionFailures: collections.filter(r => r.status === 'failed').length, latestCollectionAt: [...collections].reverse().find(r => r.status === 'succeeded' || r.status === 'partial')?.endedAt ?? null,
    coverage: !desk.sourcePack.allowGdelt && !desk.sourcePack.feeds.length ? 'unconfigured' : collections.some(r => r.status === 'failed') ? 'degraded' : 'partial',
    limitations: ['Selectable scope does not imply comprehensive coverage.', 'Counts represent this source panel, not audience belief.', 'Image, audio and video analysis are disabled until separately validated.'], usage: desk.usage, budget: desk.budget, media: { image: 'disabled', audio: 'disabled', video: 'disabled' } };
}
