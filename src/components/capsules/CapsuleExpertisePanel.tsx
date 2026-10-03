'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { CognitiveCapsule, CognitiveNode, CognitiveStatement, Knowledge } from '@/lib/cognitive-capsule/types';
import type { CapsuleWorkbenchCapsuleInput } from '@/lib/context/capsule-workbench-view-model';
import { CapsuleExpertInterview } from '@/components/capsules/CapsuleExpertInterview';
import { buildKnowledgeCaptureInput, CAPTURE_LABELS, KNOWLEDGE_CAPTURE_KINDS, KnowledgeCaptureFields, type CaptureKind } from '@/components/capsules/CapsuleKnowledgeCapture';
import { CapsuleCognitiveGraphPanel } from '@/components/capsules/CapsuleCognitiveGraphPanel';
import { CapsuleGraphProposalDetails, CapsuleGraphProposalEditForm } from '@/components/capsules/CapsuleGraphProposalReview';
import { CapsuleCognitiveChat } from '@/components/capsules/CapsuleCognitiveChat';

type KnowledgeView = Pick<Knowledge, 'id' | 'kind' | 'label' | 'scope' | 'reviewState'> & {
  provenance: { generatedBy: { type: string; id: string; at: string }; sourceRefs: string[]; reviewedBy?: { id: string }; reviewedAt?: string; derivedFrom?: string[]; confidenceKind?: string };
  [key: string]: unknown;
};
type ReviewCard = { reviewCardId: string; title: string; state: string; cognitiveKnowledgeIds?: string[]; cognitiveNodeIds?: string[]; cognitiveStatementIds?: string[]; cognitiveSupersededIds?: string[]; cognitiveProfileChanged?: boolean; proposedEnvelopePatch: { cognition?: CognitiveCapsule } };
type Snapshot = { capsuleId: string; capsuleVersion?: number; hasSavedCognition?: boolean; cognition: CognitiveCapsule; reviewCards: ReviewCard[]; nextCursor: string | null; hasMore: boolean;
  allowDownload?: boolean;
  quality: { cognitiveDepth: number; interpretation: string; dimensions: Record<string, number> }; validation: Array<{ code: string; message: string }> };
const fieldClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950';
const buttonClass = 'min-h-10 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50';
const lines = (value: string) => value.split('\n').map((entry) => entry.trim()).filter(Boolean);
const scopeList = (value: string) => value.split(',').map((entry) => entry.trim()).filter(Boolean);
const graphChangeCount = (card: ReviewCard) => (card.cognitiveNodeIds?.length ?? 0) + (card.cognitiveStatementIds?.length ?? 0);
const reviewRecords = (card: ReviewCard) => [...(card.proposedEnvelopePatch.cognition?.nodes ?? []).filter((item) => card.cognitiveNodeIds?.includes(item.id)),
  ...(card.proposedEnvelopePatch.cognition?.statements ?? []).filter((item) => card.cognitiveStatementIds?.includes(item.id)),
  ...(card.proposedEnvelopePatch.cognition?.knowledge ?? []).filter((item) => card.cognitiveKnowledgeIds?.includes(item.id))];
type ApprovalScope = { recordIds: string[]; profile: boolean };
const completeScope = (card: ReviewCard): ApprovalScope => ({ recordIds: reviewRecords(card).filter((item) => !('migrationStatus' in item) || item.migrationStatus !== 'needs_review' || card.cognitiveSupersededIds?.includes(item.id)).map((item) => item.id), profile: Boolean(card.cognitiveProfileChanged) });
const profiles: CognitiveCapsule['profile'][] = ['situation', 'expertise', 'method', 'language', 'organization', 'role', 'casebook', 'output'];

export function CapsuleExpertisePanel({ capsuleId, capsuleVersion, initialKnowledge = [], onReviewed }: {
  capsuleId: string; capsuleVersion?: number | null; initialKnowledge?: KnowledgeView[]; onReviewed?: (capsule: CapsuleWorkbenchCapsuleInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [kind, setKind] = useState<CaptureKind>('heuristic');
  const [correction, setCorrection] = useState(false);
  const [filter, setFilter] = useState('all');
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [editing, setEditing] = useState<ReviewCard | null>(null);
  const [reason, setReason] = useState('');
  const [reviewedGroups, setReviewedGroups] = useState<Record<string, boolean>>({});
  const [approvalScopes, setApprovalScopes] = useState<Record<string, ApprovalScope>>({});
  const approvalScope = (card: ReviewCard) => approvalScopes[card.reviewCardId] ?? completeScope(card);
  function selectScope(card: ReviewCard, scope: ApprovalScope) {
    setApprovalScopes((previous) => ({ ...previous, [card.reviewCardId]: scope }));
    setReviewedGroups((previous) => ({ ...previous, [card.reviewCardId]: false }));
  }
  const [proposedProfile, setProposedProfile] = useState<CognitiveCapsule['profile']>('expertise');
  const activeId = useRef(capsuleId); activeId.current = capsuleId;
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const endpoint = `/api/context/capsules/${encodeURIComponent(capsuleId)}/cognition`;
  const load = useCallback(async (cursor?: string) => {
    const requestId = ++sequence.current;
    const signal = controller.current?.signal;
    setLoading(true); setError('');
    try {
      const response = await fetch(`${endpoint}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Expertise could not be loaded. Sign in and retry.');
      if (data.capsuleId !== capsuleId || !Array.isArray(data.cognition?.knowledge) || !Array.isArray(data.reviewCards)) throw new Error('Saved expertise is unavailable. Retry loading.');
      if (signal?.aborted || activeId.current !== capsuleId || requestId !== sequence.current) return;
      if (!cursor && profiles.includes(data.cognition.profile)) setProposedProfile(data.cognition.profile);
      setSnapshot((previous) => cursor && previous ? { ...data, reviewCards: Array.from(new Map([...previous.reviewCards, ...data.reviewCards].map((card: ReviewCard) => [card.reviewCardId, card])).values()) } : data);
    } catch (failure) {
      if (!signal?.aborted && activeId.current === capsuleId && requestId === sequence.current) setError(failure instanceof Error ? failure.message : 'Expertise could not be loaded.');
    } finally { if (!signal?.aborted && activeId.current === capsuleId && requestId === sequence.current) setLoading(false); }
  }, [endpoint, capsuleId]);
  useEffect(() => {
    const requestController = new AbortController();
    controller.current = requestController;
    setSnapshot(null); setEditing(null); setError(''); setNotice(''); setBusy(false); setReviewedGroups({}); setApprovalScopes({}); setKnowledgeSearch(''); setFilter('all');
    if (open) void load();
    return () => requestController.abort();
  }, [capsuleId, capsuleVersion, open, load]);

  async function proposeProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const baseVersion = snapshot?.capsuleVersion ?? capsuleVersion;
    if (busy || loading || !snapshot || !baseVersion || (snapshot.hasSavedCognition !== false && proposedProfile === snapshot.cognition.profile)) return;
    const signal = controller.current?.signal;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'graph-proposal', baseVersion, profile: proposedProfile, nodes: [], statements: [] }), signal });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? 'This capsule changed. Reload before proposing its profile.' : result.error ?? 'The profile proposal could not be saved.');
      if (signal?.aborted || activeId.current !== capsuleId) return;
      setNotice('Profile change proposed. The saved profile changes only after human review.'); await load();
    } catch (failure) { if (!signal?.aborted && activeId.current === capsuleId) setError(failure instanceof Error ? failure.message : 'The profile proposal could not be saved.'); }
    finally { if (!signal?.aborted && activeId.current === capsuleId) setBusy(false); }
  }

  async function capture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const read = (name: string) => String(data.get(name) ?? '').trim();
    setBusy(true); setError(''); setNotice('');
    const signal = controller.current?.signal;
    try {
      const body = buildKnowledgeCaptureInput(kind, read);
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'The expertise proposal could not be saved.');
      if (signal?.aborted || activeId.current !== capsuleId) return;
      form.reset(); setNotice('Expertise proposed for review. Review it below before reuse.'); await load();
    } catch (failure) { if (!signal?.aborted && activeId.current === capsuleId) setError(failure instanceof Error ? failure.message : 'Proposal could not be saved.'); }
    finally { if (!signal?.aborted && activeId.current === capsuleId) setBusy(false); }
  }
  async function decide(card: ReviewCard, decision: 'accept' | 'edit_accept' | 'reject' | 'need_evidence', edited?: Knowledge | CognitiveNode | CognitiveStatement) {
    if (busy || !reason.trim()) return;
    const scope = edited ? { recordIds: [edited.id], profile: false } : approvalScope(card);
    const scopeCount = scope.recordIds.length + Number(scope.profile);
    if (decision === 'accept' && (!scopeCount || (scopeCount > 1 && !reviewedGroups[card.reviewCardId]))) return;
    const expectedCapsuleVersion = snapshot?.capsuleVersion ?? capsuleVersion;
    if (!expectedCapsuleVersion) { setError('Reload the capsule version before deciding on the remaining proposal.'); return; }
    setBusy(true); setError(''); setNotice('');
    const signal = controller.current?.signal;
    try {
      const response = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewCardId: card.reviewCardId, decision, reason: reason.trim(), expectedCapsuleVersion, ...(edited ? { edited } : {}),
          ...(['accept', 'edit_accept'].includes(decision) ? { selectedRecordIds: scope.recordIds, selectProfile: scope.profile } : {}) }), signal });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? 'This capsule changed. Reload and rebuild the proposal before deciding.' : result.error ?? 'This decision could not be saved. Check the scope, conditions and required fields.');
      if (signal?.aborted || activeId.current !== capsuleId) return;
      setEditing(null); setReason(''); setApprovalScopes({}); setReviewedGroups({});
      setNotice(decision === 'need_evidence' ? 'More evidence requested. Expertise remains proposed.' : decision === 'reject' ? 'Remaining proposal rejected.' : result.card?.state === 'owner_review' ? `${scopeCount} selected changes accepted. Other changes remain proposed for review.` : 'Selected changes accepted. A new capsule version was saved.');
      if (decision === 'accept' || decision === 'edit_accept') onReviewed?.(result.capsule);
      await load();
    } catch (failure) { if (!signal?.aborted && activeId.current === capsuleId) setError(failure instanceof Error ? failure.message : 'Decision could not be saved.'); }
    finally { if (!signal?.aborted && activeId.current === capsuleId) setBusy(false); }
  }
  const knowledge = snapshot?.cognition.knowledge ?? initialKnowledge;
  const pending = (snapshot?.reviewCards ?? []).filter((card) => ['proposed', 'owner_review', 'moderation_required'].includes(card.state));
  const kinds = ['cue', 'pattern', 'heuristic', 'distinction', 'exception', 'redFlag', 'question', 'languageRule', 'procedure', 'case', 'unknown', 'revisionTrigger'];
  return <details className="rounded-lg border border-slate-200 bg-slate-50" data-testid="capsule-expertise-panel" onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-950">Expertise <span className="ml-2 text-xs font-normal text-slate-600">Distinctions, practice rules, language and cases</span></summary>
    <div className="space-y-5 border-t border-slate-200 p-4">
      <p className="text-sm text-slate-600">Record what experience has taught you, the conditions where it applies, and what it does not establish. New lessons remain proposals until you review them.</p>
      {loading ? <p role="status">Loading saved expertise…</p> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error} <button type="button" className="underline" onClick={() => void load()} disabled={loading || busy}>Reload expertise</button></p> : null}
      {notice ? <p role="status" className="text-sm text-emerald-800">{notice}</p> : null}
      {snapshot ? <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-900">{snapshot.quality.dimensions.humanReviewed} accepted items · {snapshot.quality.dimensions.evidenceSpans} evidence spans · {snapshot.validation.length} structural issues</p>
        <p className="mt-1">{snapshot.quality.interpretation}</p>
        {snapshot.validation.length ? <details className="mt-2"><summary className="cursor-pointer">Inspect structural issues</summary><ul className="mt-2 space-y-1">{snapshot.validation.slice(0, 20).map((issue, index) => <li key={index}>{issue.message ?? issue.code}</li>)}</ul></details> : null}
        {snapshot.cognition.evidence?.length ? <details className="mt-2"><summary className="cursor-pointer">Inspect evidence excerpts</summary><div className="mt-2 space-y-3">{snapshot.cognition.evidence.slice(0, 30).map((span) => <blockquote key={span.id} className="break-words border-l-2 border-slate-300 pl-3"><p>{span.quote}</p><p className="mt-1 text-slate-500">Source: {span.sourceId} · Evidence reference: {span.id}</p></blockquote>)}</div></details> : null}
        {snapshot.allowDownload ? <div className="mt-2 flex flex-wrap gap-3"><a href={`${endpoint}?format=jsonld`} download className="underline">Download semantic graph (JSON-LD)</a><a href={`${endpoint}?format=package`} download className="underline">Download native capsule</a></div> : null}
      </div> : null}
      {snapshot ? <section aria-label="Capsule profile" className="min-w-0 rounded-md border border-slate-200 bg-white p-3"><h3 className="text-sm font-semibold text-slate-950">Capsule profile</h3><p className="mt-1 text-xs text-slate-600">{snapshot.hasSavedCognition === false ? 'Current inferred profile' : 'Saved profile'}: {snapshot.cognition.profile}. Choose how this capsule should be organized; a change stays proposed until reviewed.</p><form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={(event) => void proposeProfile(event)}><label className="min-w-0 flex-1 text-xs font-semibold text-slate-700">Proposed capsule profile<select value={proposedProfile} disabled={busy || loading} className={fieldClass} onChange={(event) => setProposedProfile(event.target.value as CognitiveCapsule['profile'])}>{profiles.map((profile) => <option key={profile} value={profile}>{profile[0].toUpperCase()}{profile.slice(1)}</option>)}</select></label><button type="submit" className={buttonClass} disabled={busy || loading || !(snapshot.capsuleVersion ?? capsuleVersion) || (snapshot.hasSavedCognition !== false && proposedProfile === snapshot.cognition.profile)}>Propose profile change</button></form></section> : null}
      <div className="min-w-0">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Inspect knowledge <select className={fieldClass} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All kinds</option>{kinds.map((value) => <option key={value} value={value}>{kindLabel(value)}</option>)}</select></label><label className="min-w-0 text-xs font-semibold text-slate-700">Search expert knowledge<input type="search" className={fieldClass} value={knowledgeSearch} onChange={(event) => setKnowledgeSearch(event.target.value)} placeholder="Lesson, author, scope or evidence ID" /></label></div>
        <div className="mt-3 grid min-w-0 gap-2">{knowledge.filter((item) => (filter === 'all' || item.kind === filter) && (!knowledgeSearch.trim() || JSON.stringify(item).toLocaleLowerCase().includes(knowledgeSearch.trim().toLocaleLowerCase()))).map((item) => <KnowledgeDetails key={item.id} item={item} />)}</div>
        {!knowledge.length ? <p className="mt-3 text-sm text-slate-600">No expert knowledge has been saved yet. Start with one consequential distinction or a real case.</p> : null}
      </div>
      {snapshot ? <CapsuleCognitiveGraphPanel key={capsuleId} cognition={{ nodes: snapshot.cognition.nodes ?? [], statements: snapshot.cognition.statements ?? [], evidence: snapshot.cognition.evidence ?? [] }} /> : null}
      {snapshot ? <CapsuleCognitiveChat key={capsuleId} capsuleId={capsuleId} cognition={snapshot.cognition} onProposed={() => void load()} /> : null}
      <CapsuleExpertInterview key={capsuleId} capsuleId={capsuleId} onProposed={() => void load()} />
      <form data-testid="capsule-expertise-capture" onSubmit={(event) => void capture(event)} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-950">{correction ? 'Save lesson from correction' : 'Capture expert knowledge'}</h3><button className={buttonClass} type="button" disabled={busy} onClick={() => { setCorrection(!correction); if (!correction) setKind('distinction'); }}>Save lesson from correction</button></div>
        {correction ? <p className="text-xs text-slate-600">Choose whether this correction is a distinction, a domain rule, an example, a language rule, or another lesson.</p> : null}
        <label className="block text-xs font-semibold text-slate-700">Capture <select name="kind" value={kind} disabled={busy} onChange={(event) => setKind(event.target.value as CaptureKind)} className={fieldClass}>{KNOWLEDGE_CAPTURE_KINDS.map((value) => <option key={value} value={value}>{CAPTURE_LABELS[value]}</option>)}</select></label>
        <KnowledgeCaptureFields key={`${capsuleId}:${kind}`} kind={kind} />
        <button className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={busy || loading} type="submit">{busy ? 'Saving…' : 'Propose for review'}</button>
      </form>
      {pending.length ? <section className="space-y-3" aria-label="Expertise proposal review">
        <h3 className="text-sm font-semibold text-slate-950">Review proposed expertise</h3><Field name="review-reason" label="Reason for your next review decision" area value={reason} onChange={setReason} maxLength={600} />
        {pending.map((card) => <article key={card.reviewCardId} className="space-y-3 rounded-md border border-slate-200 bg-white p-3"><p className="text-sm font-semibold text-slate-950">{card.title}</p>
          <fieldset className="space-y-2 rounded border border-slate-200 p-3"><legend className="text-xs font-semibold text-slate-900">Choose changes to approve</legend><p className="text-xs text-slate-600">Only selected changes are accepted. Unselected changes stay proposed. Imported items requiring expert structure must be edited individually before acceptance.</p>
            <button type="button" className={buttonClass} disabled={busy} onClick={() => selectScope(card, completeScope(card))}>Select complete items</button>
            {card.cognitiveProfileChanged ? <label className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" disabled={busy} checked={approvalScope(card).profile} onChange={(event) => selectScope(card, { ...approvalScope(card), profile: event.target.checked })} />Select profile change for approval</label> : null}
            {reviewRecords(card).map((item) => <label key={item.id} className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" disabled={busy} checked={approvalScope(card).recordIds.includes(item.id)} onChange={(event) => selectScope(card, { ...approvalScope(card), recordIds: event.target.checked ? [...approvalScope(card).recordIds, item.id] : approvalScope(card).recordIds.filter((id) => id !== item.id) })} /><span>Select for approval: {'label' in item ? item.label : item.id}{'migrationStatus' in item && item.migrationStatus === 'needs_review' ? ' (requires expert structure)' : ''}</span></label>)}
          </fieldset>
          {card.cognitiveProfileChanged ? <div aria-label="Proposed profile change" className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"><p className="font-semibold">Profile change</p><p>Before: {snapshot?.cognition.profile ?? 'saved profile unavailable'}{snapshot?.hasSavedCognition === false ? ' (inferred from the earlier capsule)' : ''}</p><p>After: {card.proposedEnvelopePatch.cognition?.profile}</p><p>Acceptance records this capsule’s profile and saves a new version.</p></div> : null}
          {(card.proposedEnvelopePatch.cognition?.knowledge ?? []).filter((item) => card.cognitiveKnowledgeIds?.includes(item.id)).map((item) => <KnowledgeDetails key={item.id} item={item} />)}
          {graphChangeCount(card) > 0 || card.cognitiveSupersededIds?.length ? <CapsuleGraphProposalDetails card={card} current={snapshot?.cognition} /> : null}
          {approvalScope(card).recordIds.length + Number(approvalScope(card).profile) > 1 ? <label className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" checked={Boolean(reviewedGroups[card.reviewCardId])} disabled={busy} onChange={(event) => setReviewedGroups((previous) => ({ ...previous, [card.reviewCardId]: event.target.checked }))} />I have inspected the selected changes and their evidence.</label> : null}
          <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} disabled={busy || !reason.trim() || !(approvalScope(card).recordIds.length + Number(approvalScope(card).profile)) || (approvalScope(card).recordIds.length + Number(approvalScope(card).profile) > 1 && !reviewedGroups[card.reviewCardId])} onClick={() => void decide(card, 'accept')}>Accept selected changes</button>{(card.cognitiveKnowledgeIds?.length ?? 0) + graphChangeCount(card) > 0 ? <button type="button" className={buttonClass} disabled={busy} onClick={() => setEditing(card)}>Edit and accept</button> : null}<button type="button" className={buttonClass} disabled={busy || !reason.trim()} onClick={() => void decide(card, 'reject')}>Reject remaining proposal</button><button type="button" className={buttonClass} disabled={busy || !reason.trim()} onClick={() => void decide(card, 'need_evidence')}>Need evidence</button></div>
          <p className="text-xs text-slate-600">Reject and Need evidence apply to the remaining proposal. Editing accepts only the edited item.</p>
          {editing?.reviewCardId === card.reviewCardId && card.cognitiveKnowledgeIds?.length ? <KnowledgeEditForm key={card.reviewCardId} card={card} disabled={busy || !reason.trim()} onCancel={() => setEditing(null)} onAccept={(edited) => void decide(card, 'edit_accept', edited)} /> : null}
          {editing?.reviewCardId === card.reviewCardId && graphChangeCount(card) > 0 ? <CapsuleGraphProposalEditForm key={`graph-${card.reviewCardId}`} card={card} current={snapshot?.cognition} disabled={busy || !reason.trim()} onCancel={() => setEditing(null)} onAccept={(edited) => void decide(card, 'edit_accept', edited)} /> : null}
        </article>)}
      </section> : null}
      {snapshot?.hasMore && snapshot.nextCursor ? <button type="button" className={buttonClass} disabled={busy || loading} onClick={() => void load(snapshot.nextCursor!)}>Load more expertise proposals</button> : null}
    </div>
  </details>;
}

function kindLabel(kind: string) { return kind === 'redFlag' ? 'Red flags' : kind === 'languageRule' ? 'Language rules' : kind === 'revisionTrigger' ? 'Revision triggers' : `${kind[0].toUpperCase()}${kind.slice(1)}s`; }
function Field({ name, label, area = false, required, value, onChange, defaultValue, maxLength = 4000, placeholder }: {
  name: string; label: string; area?: boolean; required?: boolean; value?: string; onChange?: (value: string) => void; defaultValue?: string; maxLength?: number; placeholder?: string;
}) {
  const props = { name, required, maxLength, className: fieldClass, placeholder, value, defaultValue, onChange: onChange ? (event: { target: { value: string } }) => onChange(event.target.value) : undefined };
  return <label className="block text-xs font-semibold text-slate-700">{label}{area ? <textarea {...props} rows={3} /> : <input {...props} />}</label>;
}
function KnowledgeDetails({ item }: { item: KnowledgeView }) {
  const hidden = new Set(['id', 'kind', 'label', 'scope', 'reviewState', 'provenance', 'migrationStatus']);
  return <details className="min-w-0 rounded-md border border-slate-200 bg-white p-3"><summary className="cursor-pointer break-words text-sm font-medium text-slate-950">{item.label} <span className="ml-2 text-xs text-slate-500">{item.reviewState}</span></summary>
    <div className="mt-2 space-y-2 break-words text-xs text-slate-600"><p>{kindLabel(item.kind)} · Scope: {item.scope.join(', ')}</p><p>Authored by {item.provenance.generatedBy.id} ({item.provenance.generatedBy.type}) · {item.provenance.generatedBy.at}</p><p>Sources: {item.provenance.sourceRefs.length ? item.provenance.sourceRefs.join(', ') : 'No attached source reference'}</p>
      {item.provenance.confidenceKind ? <p>Origin: {item.provenance.confidenceKind}</p> : null}{item.provenance.derivedFrom?.length ? <p>Derived from: {item.provenance.derivedFrom.join(', ')}</p> : null}
      {item.provenance.reviewedBy ? <p>Reviewed by {item.provenance.reviewedBy.id} · {item.provenance.reviewedAt}</p> : null}
      {Object.entries(item).filter(([key, value]) => !hidden.has(key) && value !== undefined && !(Array.isArray(value) && !value.length)).map(([key, value]) => <p key={key}><span className="font-semibold">{key.replace(/([A-Z])/g, ' $1')}: </span>{displayValue(value)}</p>)}
    </div></details>;
}
function displayValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(displayValue).join('; ');
  if (value && typeof value === 'object') { const record = value as Record<string, unknown>; return typeof record.key === 'string' ? `${record.key}: ${record.operator}${record.value === undefined ? '' : ` ${record.value}`}` : Object.values(record).map(displayValue).join(' · '); }
  return '';
}
function KnowledgeEditForm({ card, disabled, onAccept, onCancel }: { card: ReviewCard; disabled: boolean; onAccept: (edited: Knowledge) => void; onCancel: () => void }) {
  const items = card.proposedEnvelopePatch.cognition?.knowledge.filter((value) => card.cognitiveKnowledgeIds?.includes(value.id)) ?? [];
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '');
  const item = items.find((value) => value.id === selectedId);
  if (!item) return <p className="text-xs text-red-700">Reload this proposal before editing.</p>;
  const strings = Object.entries(item).filter(([key, value]) => typeof value === 'string' && !['id', 'kind', 'reviewState', 'migrationStatus', 'reviewDecision', 'reviewNote', 'validFrom', 'validUntil'].includes(key));
  const arrayKeys = ({ cue: ['followUpChecks', 'doNotInfer'], pattern: ['recommendedChecks', 'likelyEvolution'], heuristic: ['nextChecks', 'failureModes'],
    distinction: ['decisionTests', 'examples', 'counterexamples'], exception: ['requiredChecks'], redFlag: ['doNotInfer', 'nextEvidence'], question: ['requiredEvidence'],
    languageRule: ['implications', 'nonImplications', 'avoidAlternatives', 'preferredAlternatives', 'audience'], case: ['lessons', 'nonTransferableDimensions'],
    unknown: ['requiredEvidence'], procedure: ['inputs', 'outputs'], revisionTrigger: [] } as Record<Knowledge['kind'], string[]>)[item.kind];
  return <div className="space-y-3">{items.length > 1 ? <label className="block text-xs font-semibold text-slate-700">Item to edit<select className={fieldClass} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{items.map((value) => <option key={value.id} value={value.id}>{value.label}</option>)}</select></label> : null}<form key={item.id} className="space-y-3 rounded-md bg-slate-50 p-3" onSubmit={(event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget); const read = (key: string) => String(data.get(key) ?? '').trim();
    const edited = { ...item, ...Object.fromEntries(strings.map(([key]) => [key, read(key)])), ...Object.fromEntries(arrayKeys.map((key) => [key, lines(read(key))])), scope: scopeList(read('scope')) };
    if (edited.kind === 'heuristic' && item.kind === 'heuristic' && read('when') !== item.when.map((condition) => condition.key).join('\n')) edited.when = lines(read('when')).map((key) => ({ kind: 'context', key, operator: 'present' }));
    if (edited.kind === 'case') edited.analogyDimensions = lines(read('analogyDimensions'));
    onAccept(edited as Knowledge);
  }}><p className="text-xs text-slate-600">Complete the expert structure before accepting. Your review reason and identity are saved with the decision.</p>
    {strings.map(([key, value]) => <Field key={key} name={key} label={key.replace(/([A-Z])/g, ' $1')} defaultValue={String(value)} required area={key !== 'label' && key !== 'language'} />)}
    <Field name="scope" label="Scope (comma separated)" defaultValue={item.scope.join(', ')} required />
    {arrayKeys.map((key) => <Field key={key} name={key} label={`${key.replace(/([A-Z])/g, ' $1')} (one per line)`} defaultValue={((item as unknown as Record<string, unknown>)[key] as string[]).join('\n')} area />)}
    {item.kind === 'heuristic' ? <Field name="when" label="Apply only when (condition keys, one per line)" defaultValue={item.when.map((condition) => condition.key).join('\n')} required area /> : null}
    {item.kind === 'case' ? <Field name="analogyDimensions" label="Analogy dimensions (one per line)" defaultValue={item.analogyDimensions.join('\n')} required area /> : null}
    <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={disabled} type="submit">Save edits and accept only this item</button><button className={buttonClass} type="button" disabled={disabled} onClick={onCancel}>Cancel edit</button></div>
  </form></div>;
}
