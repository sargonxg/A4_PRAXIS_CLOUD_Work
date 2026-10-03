'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, FileText, MessageSquareText, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { buildCapsuleWorkbenchViewModel, type CapsuleWorkbenchCapsuleInput, type CapsuleWorkbenchViewModel, type CapsuleWorkbenchViewModelInput } from '@/lib/context/capsule-workbench-view-model';
import { CapsuleClaimReceiptsSection } from '@/components/capsules/workbench/CapsuleClaimReceiptsSection';
import { CapsuleTimelineSection } from '@/components/capsules/workbench/CapsuleTimelineSection';
import { CapsuleReviewQueueSection } from '@/components/capsules/workbench/CapsuleReviewQueueSection';
import { CapsuleAdvancedDrawer } from '@/components/capsules/workbench/CapsuleAdvancedDrawer';
import { CapsuleMethodInspection } from '@/components/capsules/CapsuleMethodInspection';
import { CapsuleExpertisePanel } from '@/components/capsules/CapsuleExpertisePanel';
import { cn } from '@/lib/utils/cn';
import type { CapsuleGraphViewerProps } from '@/components/capsules/viewers/CapsuleGraphViewer';

const CapsuleGraphViewer = dynamic<CapsuleGraphViewerProps>(() => import('@/components/capsules/viewers/CapsuleGraphViewer'), {
  ssr: false,
  loading: () => <p role="status" className="min-h-64 p-6 text-sm text-[color:var(--color-graphite)]">Preparing your evidence map…</p>,
});
const CapsuleAgentView = dynamic(() => import('@/components/capsules/CapsuleAgentView'), { ssr: false });
const TABS = ['Overview', 'Evidence', 'Timeline', 'Review'] as const;
type Tab = (typeof TABS)[number];

/** Native modal supplies inertness; explicit Tab wrapping keeps browser focus inside. */
export function CapsuleInspectionDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const returnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialogRef} aria-label={title} onCancel={(event) => { event.preventDefault(); onClose(); }}
    onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const dialog = event.currentTarget;
      const tabbable = Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]'))
        .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest('[inert]'));
      const first = tabbable[0];
      const last = tabbable.at(-1);
      const active = document.activeElement;
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (active === first || active === dialog || !dialog.contains(active))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (active === last || active === dialog || !dialog.contains(active))) { event.preventDefault(); first.focus(); }
    }}
    onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}
    className="fixed inset-y-0 left-auto right-0 m-0 h-[100dvh] max-h-none w-full max-w-[72rem] overflow-hidden border-0 bg-[color:var(--color-archive-paper)] p-0 text-[color:var(--color-deep-ink)] shadow-2xl backdrop:bg-slate-950/40 sm:rounded-l-xl"
    data-testid="capsule-inspector-sheet">
    {children}
  </dialog>;
}

export function CapsuleInspectionExperience({ capsule, model: initialModel, modelInput, owned, authenticated, busy, onClose, onUse, onSources, onImprove, onFork, forkBusy, onAsk, children }: {
  capsule: CapsuleWorkbenchCapsuleInput;
  model: CapsuleWorkbenchViewModel;
  modelInput?: Omit<CapsuleWorkbenchViewModelInput, 'capsule'>;
  owned: boolean;
  authenticated: boolean;
  busy: boolean;
  onClose: () => void;
  onUse: () => void;
  onSources: () => void;
  onImprove: () => void;
  onFork: () => void;
  forkBusy: boolean;
  onAsk: (question: string) => void;
  children?: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>('Overview');
  const [question, setQuestion] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<CapsuleWorkbenchCapsuleInput | null>(null);
  const [agentPreviewOpen, setAgentPreviewOpen] = useState(false);
  const id = useId();
  const currentCapsule = useMemo(() => reviewed?.capsuleId === capsule.capsuleId && (reviewed.version ?? 0) >= initialModel.capsuleVersion
    ? { ...capsule, ...reviewed } : capsule, [reviewed, capsule, initialModel.capsuleVersion]);
  const model = useMemo(() => currentCapsule === capsule ? initialModel
    : buildCapsuleWorkbenchViewModel({ ...modelInput, capsule: currentCapsule }), [currentCapsule, capsule, initialModel, modelInput]);
  const openDecisions = model.reviewQueue.filter((card) => card.allowedActions.length).length;
  const graph = <CapsuleGraphViewer key={`${model.capsuleId}:${model.capsuleVersion}`} nodes={model.graph.nodes} edges={model.graph.edges} claims={model.claims} height={360} compact editable={false}
    onOpenClaim={(claimId) => { setSelectedClaimId(claimId); setTab('Evidence'); }} />;
  const summary = currentCapsule.purpose || currentCapsule.summary || model.summary;
  return <div className="flex h-full min-h-0 flex-col" data-testid="capsule-inspection-experience">
    <header className="shrink-0 border-b border-[color:var(--color-mineral)] bg-white px-4 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-praxis-emerald-700)]">Context Capsule · v{model.capsuleVersion}</p>
          <h2 id="capsule-inspector-title" className="mt-1 break-words font-serif text-2xl leading-8 sm:text-3xl">{model.title}</h2>
          <p className="mt-1 text-xs text-[color:var(--color-graphite)]">Visibility: {currentCapsule.access?.visibility || 'not recorded'}{currentCapsule.scope ? ` · Scope: ${currentCapsule.scope}` : ''} · {openDecisions} pending review decision{openDecisions === 1 ? '' : 's'}</p>
        </div>
        <button type="button" autoFocus onClick={onClose} aria-label="Close inspector" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-mineral)] bg-white"><X className="h-5 w-5" /></button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Use in chat" onClick={onUse} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[color:var(--color-praxis-emerald-700)] px-4 text-sm font-semibold text-white disabled:opacity-60"><MessageSquareText className="h-4 w-4" />Use in chat<ArrowRight className="h-4 w-4" /></button>
        {authenticated ? <button type="button" onClick={onSources} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[color:var(--color-mineral)] bg-white px-3 text-sm font-semibold"><FileText className="h-4 w-4" />Add sources</button> : null}
      </div>
    </header>
    <div className="shrink-0 border-b border-[color:var(--color-mineral)] bg-white px-3 sm:px-6" role="tablist" aria-label="Capsule inspection">
      {TABS.map((item, index) => <button key={item} type="button" role="tab" id={`${id}-tab-${item}`} aria-controls={`${id}-panel`} aria-selected={tab === item} tabIndex={tab === item ? 0 : -1}
        onClick={() => setTab(item)} onKeyDown={(event) => { const next = event.key === 'ArrowRight' ? (index + 1) % TABS.length : event.key === 'ArrowLeft' ? (index + TABS.length - 1) % TABS.length : event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : null; if (next !== null) { event.preventDefault(); setTab(TABS[next]); document.getElementById(`${id}-tab-${TABS[next]}`)?.focus(); } }}
        className={cn('min-h-12 border-b-2 px-2 text-sm font-semibold sm:px-4', tab === item ? 'border-[color:var(--color-praxis-emerald-700)] text-[color:var(--color-praxis-emerald-700)]' : 'border-transparent text-[color:var(--color-graphite)]')}>{item}{item === 'Review' && openDecisions ? ` (${openDecisions})` : ''}</button>)}
    </div>
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 outline-none sm:p-6">
      {tab === 'Overview' ? <div className="space-y-5">
        {owned && authenticated ? <CapsuleExpertisePanel key={model.capsuleId} capsuleId={model.capsuleId} capsuleVersion={currentCapsule.version} onReviewed={setReviewed} /> : null}
        <p className="max-w-3xl whitespace-pre-wrap text-base leading-7">{summary || 'A reusable context package. Add your purpose and sources before relying on it.'}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-[color:var(--color-mineral)] py-3 text-sm" aria-label="Recorded contents"><span><strong>{model.evidence.sourceCount}</strong> source references</span><span><strong>{model.claims.length}</strong> claims</span><span><strong>{model.graph.edges.length}</strong> mapped relationships</span></div>
        <section className="overflow-hidden rounded-lg border border-[color:var(--color-mineral)] bg-white" aria-label="Evidence map">
          <div className="border-b border-[color:var(--color-mineral)] p-4"><h3 className="font-serif text-xl">Context connections</h3><p className="mt-1 text-xs text-[color:var(--color-graphite)]">Select an item to trace its recorded evidence.</p></div>
          {graph}
        </section>
        <CapsuleMethodInspection snapshot={currentCapsule.starterSnapshot} />
        {model.evidence.gaps.length ? <section className="rounded-md border border-[color:var(--color-mineral)] bg-white p-4"><h3 className="text-sm font-semibold">What still needs attention</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{model.evidence.gaps.slice(0, 5).map((gap, index) => <li key={`${gap}-${index}`}>{gap}</li>)}</ul><button type="button" onClick={() => setTab('Review')} className="mt-2 min-h-11 text-sm font-semibold text-[color:var(--color-praxis-emerald-700)] underline">Open review</button></section> : null}
      </div> : null}
      {tab === 'Evidence' ? <div id={`${id}-evidence`} className="space-y-4"><p className="text-sm leading-6">Read each claim alongside its captured source text. A saved citation and a review decision do not independently verify the claim.</p><CapsuleClaimReceiptsSection claims={model.claims} selectedClaimId={selectedClaimId} />{!model.claims.length && model.evidence.sourceIds.length ? <p className="break-words text-sm leading-6">Source references: {model.evidence.sourceIds.join(', ')}. No claim-to-source excerpts are recorded yet.</p> : null}</div> : null}
      {tab === 'Timeline' ? <CapsuleTimelineSection timeline={model.timeline} /> : null}
      {tab === 'Review' ? <div className="space-y-4"><p className="text-sm leading-6">Review proposed changes before they become saved context. Keep uncertain claims and missing evidence visible.</p><CapsuleReviewQueueSection reviewQueue={model.reviewQueue} capsuleId={owned && authenticated ? model.capsuleId : undefined} onReviewed={setReviewed} />{!owned ? <p className="text-sm leading-6">Create a private copy to adapt a starter and save your own decisions.</p> : null}{authenticated ? <div className="flex flex-wrap gap-2"><button type="button" onClick={onImprove} className="min-h-11 rounded-md border border-[color:var(--color-mineral)] bg-white px-3 text-sm font-semibold">Suggest improvements</button><button type="button" disabled={forkBusy} onClick={onFork} className="min-h-11 rounded-md border border-[color:var(--color-mineral)] bg-white px-3 text-sm font-semibold disabled:opacity-60">{forkBusy ? 'Creating private copy…' : 'Create private copy'}</button></div> : null}</div> : null}
      <div className="mt-6"><CapsuleAdvancedDrawer model={model} compact sparse={model.evidence.sourceCount === 0} graphSection={graph} agentRuns={modelInput?.agentRuns ?? []} reviewEnabled={owned && authenticated} onReviewed={setReviewed} /></div>
      <details className="mt-3 rounded-md border border-[color:var(--color-mineral)] bg-white p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold">Technical capsule contract</summary>
        <p className="mt-2 text-sm leading-6">The recorded permissions, context boundaries and version references. Missing fields remain unrecorded.</p>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[color:var(--color-archive-paper-strong)] p-3 text-xs leading-6">{JSON.stringify({ capsuleId: currentCapsule.capsuleId, version: model.capsuleVersion, scope: currentCapsule.scope, audience: currentCapsule.audience, expiry: currentCapsule.expiry,
          sourcePosture: currentCapsule.sourcePosture, coreRefs: currentCapsule.coreRefs, agentOperatingContract: currentCapsule.agentOperatingContract, agentPermissions: currentCapsule.agentPermissions,
          governance: currentCapsule.governance, contextCaptureProfile: currentCapsule.contextCaptureProfile, memoryPosture: currentCapsule.memoryPosture, ontologyBinding: currentCapsule.ontologyBinding, outputContracts: currentCapsule.outputContracts }, null, 2)}</pre>
      </details>
      {authenticated && owned ? <details className="mt-3 rounded-md border border-[color:var(--color-mineral)] bg-white" onToggle={(event) => setAgentPreviewOpen(event.currentTarget.open)}><summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold">What travels to the agent?</summary>{agentPreviewOpen ? <div className="border-t border-[color:var(--color-mineral)] p-4"><p className="mb-3 text-sm leading-6">Inspect the selected context, omissions and risk annotations. This packet is not a factual approval.</p><CapsuleAgentView key={model.capsuleVersion} capsuleId={model.capsuleId} /></div> : null}</details> : null}
      {children}
      {authenticated ? <form className="mt-5 border-t border-[color:var(--color-mineral)] pt-4" data-testid="capsule-inspector-chat-panel" onSubmit={(event) => { event.preventDefault(); if (!question.trim() || busy) return; onAsk(question.trim()); setQuestion(''); }}>
        <label htmlFor={`${id}-question`} className="text-sm font-semibold">Ask about this capsule</label><div className="mt-2 flex gap-2"><input id={`${id}-question`} value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} placeholder="What evidence is missing?" className="min-h-11 min-w-0 flex-1 rounded-md border border-[color:var(--color-mineral)] bg-white px-3 text-sm" /><button type="submit" disabled={!question.trim() || busy} className="min-h-11 rounded-md bg-[color:var(--color-deep-ink)] px-4 text-sm font-semibold text-white disabled:opacity-50">Ask</button></div>
      </form> : null}
    </div>
  </div>;
}
