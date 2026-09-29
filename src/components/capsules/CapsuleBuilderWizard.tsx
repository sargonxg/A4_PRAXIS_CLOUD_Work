'use client';

import { CalendarClock, Check, Code2, FileJson, GitBranch, Network, Rocket, Sparkles, UploadCloud } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CapsuleJsonMonacoEditor } from '@/components/capsules/CapsuleJsonMonacoEditor';
import { CapsuleLivePreview } from '@/components/capsules/CapsuleLivePreview';
import Link from 'next/link';
import { ingestArchitectDocuments, type ArchitectDocumentDraft } from '@/lib/context/architect-document-intake';
import { useAuth } from '@/lib/auth/auth-context';
import { CAPSULE_NOTES_MAX_CHARS, readConversationCapsuleHandoff, clearConversationCapsuleHandoff, prepareArchitectNotes, type ArchitectNotesReceipt } from '@/lib/context/conversation-capsule-handoff';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { CAPSULE_EVAL_JUDGE_MODEL } from '@/lib/ai/model-matrix';
import { ContextCapsuleSchema } from '@/lib/ai/schemas/context-capsule';
import { TACITUS_CORE_PRIMITIVES } from '@/lib/graph/core-primitives';
import { ONTOLOGY_IDS } from '@/lib/ontology/types';
import { PENDING_CONTEXT_CAPSULE_PROMPT_KEY } from '@/lib/product/context-capsule-pending';
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';
import type { ContextCapsule } from '@/types/context-capsule';

type BuilderStepId = 'job' | 'sources' | 'grounding' | 'output' | 'tools' | 'eval' | 'publish';

const STEPS: Array<{ id: BuilderStepId; label: string; helper: string }> = [
  { id: 'job', label: 'Job', helper: 'Plain-language purpose, domain, and frameworks.' },
  { id: 'sources', label: 'Sources', helper: 'Grounding posture, domains, recency, and minimum evidence.' },
  { id: 'grounding', label: 'Grounding', helper: 'Timeline anchors, causal links, and ontology binding.' },
  { id: 'output', label: 'Output', helper: 'Deliverable format and schema ordering.' },
  { id: 'tools', label: 'Tools', helper: 'How PRAXIS should use sourceability and research tools.' },
  { id: 'eval', label: 'Test & evaluate', helper: 'Check structure, then test actual analysis in Ask PRAXIS.' },
  { id: 'publish', label: 'Publish', helper: 'Visibility, pricing, and immutable publish.' },
];

const DOMAIN_OPTIONS = Object.keys(DOMAIN_SEEDS);

const TOOL_OPTIONS = ['sourceability', 'deep_research', 'source-scout', 'policy_memo'];

type SaveState = 'idle' | 'saving' | 'saved' | 'publishing' | 'published' | 'error';
type CapsulePatch = DeepPartial<ContextCapsule>;
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export function CapsuleBuilderWizard() {
  const guard = useSituationGuard();
  const { user } = useAuth();
  const [sourceNotes, setSourceNotes] = useState('');
  const handoffLoaded = useRef<string | null>(null);
  const notesReceipt = useRef<ArchitectNotesReceipt | null>(null);
  const architectInFlight = useRef(false);
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState<BuilderStepId>('job');
  const [advanced, setAdvanced] = useState(false);
  const [savedCapsuleId, setSavedCapsuleId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const [evalSummary, setEvalSummary] = useState<string | null>(null);
  const [job, setJob] = useState('Help analysts produce a sourced policy briefing with explicit uncertainty and next evidence gaps.');
  const [frameworks, setFrameworks] = useState('ach, stakeholder-salience');
  const [allowedDomains, setAllowedDomains] = useState('un.org, reliefweb.int');
  const [blockedDomains, setBlockedDomains] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['sourceability', 'deep_research']);
  const [sampleQuestions, setSampleQuestions] = useState('What changed this week?\nWhich claims need corroboration?');
  const [architectDocuments, setArchitectDocuments] = useState<ArchitectDocumentDraft[]>([]);
  const [architectReviewCount, setArchitectReviewCount] = useState(0);
  const [intakeBusy, setIntakeBusy] = useState(false);
  const [architectBusy, setArchitectBusy] = useState(false);
  const [assistBusy, setAssistBusy] = useState(false);
  const [intakeWarnings, setIntakeWarnings] = useState<string[]>([]);
  const [architectCapsuleId, setArchitectCapsuleId] = useState<string | null>(null);
  const [intakeSituationId, setIntakeSituationId] = useState<string | undefined>();
  const [capsule, setCapsule] = useState<ContextCapsule>(() => makeDraftCapsule({
    job,
    frameworks,
    allowedDomains,
    blockedDomains,
    selectedTools,
  }));

  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);
  const capsuleJson = useMemo(() => JSON.stringify(capsule, null, 2), [capsule]);

  useEffect(() => {
    const prompt = searchParams.get('capsulePrompt') ?? searchParams.get('prompt');
    const storedPrompt = typeof window !== 'undefined'
      ? window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_PROMPT_KEY)
      : null;
    const plainLanguagePrompt = (prompt ?? storedPrompt ?? '').trim().slice(0, 4000);
    if (!plainLanguagePrompt) return;
    const inferredDomain = inferDomainFromPrompt(plainLanguagePrompt);

    setJob(plainLanguagePrompt);
    setSampleQuestions([
      plainLanguagePrompt,
      'Which claims need stronger source receipts before this becomes a memo?',
    ].join('\n'));
    setCapsule((current) => deepMerge(current, {
      persona: {
        systemFrame: plainLanguagePrompt,
        domain: inferredDomain,
      },
      ontologyBinding: {
        domainId: inferredDomain,
        taxonomyPath: ['generic', inferredDomain],
      },
      embeddedGraph: graphLiteProjectionForCapsule(current.id, inferredDomain, {
        timelineAnchor: current.temporality.timelineAnchors[0],
        causalLink: current.causality.causalLinks[0],
      }),
      market: {
        category: inferredDomain,
        tags: ['builder-draft', ...inferTagsFromPrompt(plainLanguagePrompt)],
      },
    }) as ContextCapsule);
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id || searchParams.get('from') !== 'conversation' || handoffLoaded.current === user.id) return;
    handoffLoaded.current = user.id;
    const handoff = readConversationCapsuleHandoff(window.sessionStorage, user.id);
    if (!handoff) {
      setMessage('The conversation handoff has expired or is unavailable for this account. Paste your notes below.');
      return;
    }
    setJob(handoff.purpose);
    setSourceNotes(handoff.notes);
    setCapsule((current) => deepMerge(current, { persona: { systemFrame: handoff.purpose } }) as ContextCapsule);
    setMessage('Conversation loaded as working notes. Check the excerpt, then build proposals for review.');
  }, [searchParams, user?.id]);

  function patchCapsule(next: CapsulePatch) {
    setEvalSummary(null);
    setCapsule((current) => deepMerge(current, next) as ContextCapsule);
  }

  function patchTimelineAnchor(patch: Partial<ContextCapsule['temporality']['timelineAnchors'][number]>) {
    const current = capsule.temporality.timelineAnchors[0] ?? defaultTimelineAnchor();
    const next = { ...current, ...patch };
    patchCapsule({
      temporality: { timelineAnchors: [next] },
      embeddedGraph: graphLiteProjectionForCapsule(capsule.id, capsule.ontologyBinding.domainId, {
        timelineAnchor: next,
        causalLink: capsule.causality.causalLinks[0],
      }),
    });
  }

  function patchCausalLink(patch: Partial<ContextCapsule['causality']['causalLinks'][number]>) {
    const current = capsule.causality.causalLinks[0] ?? defaultCausalLink();
    const next = { ...current, ...patch };
    patchCapsule({
      causality: { causalLinks: [next] },
      embeddedGraph: graphLiteProjectionForCapsule(capsule.id, capsule.ontologyBinding.domainId, {
        timelineAnchor: capsule.temporality.timelineAnchors[0],
        causalLink: next,
      }),
    });
  }

  function setDomainBinding(domainId: string) {
    patchCapsule({
      persona: { domain: domainId, systemFrame: capsule.persona.systemFrame },
      market: { category: domainId },
      ontologyBinding: {
        domainId,
        taxonomyPath: domainId === 'generic' ? ['generic'] : ['generic', domainId],
      },
      embeddedGraph: graphLiteProjectionForCapsule(capsule.id, domainId, {
        timelineAnchor: capsule.temporality.timelineAnchors[0],
        causalLink: capsule.causality.causalLinks[0],
      }),
    });
  }

  function toggleOntologyId(id: ContextCapsule['ontologyBinding']['ontologyIds'][number], checked: boolean) {
    const current = capsule.ontologyBinding.ontologyIds;
    const next = checked
      ? Array.from(new Set([...current, id]))
      : current.filter((item) => item !== id);
    patchCapsule({ ontologyBinding: { ontologyIds: next.length ? next : ['governance'] } });
  }

  function toggleAcoPrimitive(id: ContextCapsule['ontologyBinding']['acoPrimitives'][number], checked: boolean) {
    const current = capsule.ontologyBinding.acoPrimitives;
    const next = checked
      ? Array.from(new Set([...current, id]))
      : current.filter((item) => item !== id);
    patchCapsule({ ontologyBinding: { acoPrimitives: next.length ? next : ['Actor', 'Claim'] } });
  }

  async function runAssist(action: 'persona' | 'output-schema' | 'sources' | 'few-shot') {
    if (assistBusy) return;
    setAssistBusy(true);
    setMessage(`Drafting ${action} suggestions...`);
    try {
    const response = await fetch(`/api/capsules/assist/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job,
        domain: capsule.persona.domain,
        outputFormat: capsule.output.format,
        capsule,
        situationId: guard.isDemo ? undefined : guard.situation?.id,
        forceRun: true,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? 'Assist failed.');
      return;
    }
    if (payload.patch) patchCapsule(payload.patch);
    setMessage(payload.summary ?? 'Suggestions applied.');
    } catch {
      setMessage('Suggestions could not be loaded. Your draft is unchanged; retry when connected.');
    } finally {
      setAssistBusy(false);
    }
  }

  async function runArchitect() {
    if (architectInFlight.current || architectBusy || intakeBusy) return;
    if (!architectDocuments.length && !sourceNotes.trim()) {
      setMessage('Add a readable document, ideas, notes or a conversation before building proposals.');
      return;
    }
    architectInFlight.current = true;
    setArchitectBusy(true);
    const draft = capsule.id === 'new-policy-capsule' ? { ...capsule, id: `capsule-${crypto.randomUUID()}` } : capsule;
    if (draft !== capsule) setCapsule(draft);
    try {
    let documents = architectDocuments;
    let situationId = intakeSituationId ?? guard.situation?.id;
    if (sourceNotes.trim()) {
      if (documents.length >= 20) throw new Error('A build supports 20 sources. Start a new draft or use fewer documents to include notes.');
      setMessage('Saving your working notes...');
      const receipt = await prepareArchitectNotes(sourceNotes, { situationId, workspaceName: job, previous: notesReceipt.current });
      notesReceipt.current = receipt;
      situationId = receipt.situationId;
      setIntakeSituationId(situationId);
      documents = [...documents, receipt.document];
      if (user?.id) clearConversationCapsuleHandoff(window.sessionStorage, user.id);
    }
    setMessage('Drafting Capsule Architect review cards...');
    const response = await fetch('/api/capsules/assist/architect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job,
        domain: capsule.persona.domain,
        outputFormat: capsule.output.format,
        capsule: draft,
        documents,
        elicitation: {
          decisionHorizon: capsule.temporality.validUntil ?? capsule.temporality.asOf ?? capsule.temporality.timelineAnchors[0]?.date,
          validFrom: capsule.temporality.validFrom ?? capsule.temporality.timelineAnchors.find((anchor) => anchor.kind === 'validity-start')?.date,
          validUntil: capsule.temporality.validUntil ?? capsule.temporality.timelineAnchors.find((anchor) => anchor.kind === 'validity-end')?.date,
          causalDrivers: capsule.causality.causalLinks.map((link) => link.cause).filter(Boolean),
        },
        situationId: guard.isDemo ? undefined : situationId,
        forceRun: true,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? 'Capsule Architect failed.');
      return;
    }
    if (payload.patch) patchCapsule(payload.patch);
    const cardCount = Array.isArray(payload.cards) ? payload.cards.length : 0;
    setArchitectReviewCount(cardCount);
    setArchitectCapsuleId(payload.capsule?.capsuleId ?? null);
    setMessage(payload.summary ?? `Capsule Architect prepared ${cardCount} review cards.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Capsule building was interrupted. Your uploaded sources are saved; retry the build.');
    } finally {
      architectInFlight.current = false;
      setArchitectBusy(false);
    }
  }

  async function saveDraft(): Promise<string | null> {
    if (saveState === 'saving' || saveState === 'publishing') return null;
    setSaveState('saving');
    setMessage('Saving draft capsule...');
    const draft = capsule.id === 'new-policy-capsule' ? { ...capsule, id: `capsule-${crypto.randomUUID()}` } : capsule;
    setCapsule(draft);
    try {
    const response = await fetch('/api/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draft.id, capsule: draft }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setSaveState('error');
      setMessage(payload.detail ?? payload.error ?? 'Save failed.');
      return null;
    }
    const id = payload.capsule?.id as string;
    if (!id) throw new Error('Missing saved capsule id');
    setSavedCapsuleId(id);
    setSaveState('saved');
    setMessage('Draft saved.');
    return id;
    } catch {
      setSaveState('error');
      setMessage('Draft could not be saved. Your current edits are still here; retry saving.');
      return null;
    }
  }

  async function publish() {
    const id = await saveDraft();
    if (!id) return;
    setSaveState('publishing');
    setMessage('Publishing capsule...');
    try {
    const response = await fetch(`/api/capsules/${encodeURIComponent(id)}/publish`, { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) {
      setSaveState('error');
      setMessage(payload.detail ?? payload.error ?? 'Publish failed.');
      return;
    }
    setSaveState('published');
    setMessage('Capsule published and frozen as an immutable version.');
    } catch {
      setSaveState('error');
      setMessage('Publication could not be confirmed. Your draft is saved; check its status before retrying.');
    }
  }

  function runStructuralCheck() {
    const result = ContextCapsuleSchema.safeParse(capsule);
    setEvalSummary(result.success
      ? `Structure is valid. ${architectDocuments.length} readable document(s); ${architectReviewCount} review proposal(s) prepared. This is not an accuracy evaluation or publication approval.`
      : `Structure needs attention: ${result.error.issues.slice(0, 4).map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
    setMessage('Test your questions on real analysis in Ask PRAXIS, then inspect citations, competing explanations and missing evidence.');
  }

  function applyJson(value: string) {
    try {
      const parsed = JSON.parse(value) as ContextCapsule;
      setCapsule(parsed);
      setEvalSummary(null);
      setMessage('');
    } catch {
      setMessage('Advanced JSON has a syntax issue. Live preview shows the exact problem.');
    }
  }

  return (
    <section className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Capsule builder steps" className="flex min-w-0 gap-2 overflow-x-auto pb-2 lg:sticky lg:top-6 lg:block lg:self-start lg:space-y-2">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id)}
            aria-current={step.id === activeStep ? 'step' : undefined}
            className={`shrink-0 rounded-xl border px-3 py-3 text-left transition lg:w-full ${
              step.id === activeStep
                ? 'border-[#24211b] bg-[#24211b] text-white'
                : 'border-[#d8d1c5] bg-transparent text-[#4f483f] hover:border-[#9d9486]'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-xs">
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold">{step.label}</span>
                <span className={`mt-1 hidden text-xs leading-5 lg:block ${step.id === activeStep ? 'text-[#ddd6c9]' : 'text-[#786f62]'}`}>
                  {step.helper}
                </span>
              </span>
            </span>
          </button>
        ))}
      </nav>

      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d8d1c5] bg-[#fffdf8] p-4">
          <div>
            <p className="text-sm font-semibold text-[#24211b]">
              Step {activeIndex + 1} of {STEPS.length} · {STEPS[activeIndex]?.label}
            </p>
            <p className="text-sm text-[#6f675c]">
              {STEPS[activeIndex]?.helper}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium text-[#24211b] hover:bg-[#24211b] hover:text-white"
          >
            {advanced ? <FileJson className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            {advanced ? 'Guided wizard' : 'Advanced JSON'}
          </button>
        </div>

        {advanced ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <CapsuleJsonMonacoEditor value={capsuleJson} onChange={applyJson} />
            <CapsuleLivePreview json={capsuleJson} />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#d8d1c5] bg-[#fffdf8] p-4 sm:p-6">
            {activeStep === 'job' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  What should this capsule do?
                  <textarea
                    value={job}
                    maxLength={4000}
                    onChange={(event) => {
                      setJob(event.target.value);
                      patchCapsule({ persona: { systemFrame: event.target.value } });
                    }}
                    className="mt-2 min-h-28 w-full rounded-lg border border-[#cfc6b8] bg-white p-3 text-base leading-7 focus:outline-emerald-700"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Domain
                    <select
                      value={capsule.persona.domain}
                      onChange={(event) => setDomainBinding(event.target.value)}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    >
                      {DOMAIN_OPTIONS.map((domain) => <option key={domain}>{domain}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Frameworks
                    <input
                      value={frameworks}
                      onChange={(event) => {
                        setFrameworks(event.target.value);
                        patchCapsule({ persona: { frameworks: csv(event.target.value), systemFrame: capsule.persona.systemFrame } });
                      }}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    />
                  </label>
                </div>
                <button type="button" onClick={() => runAssist('persona')} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Improve persona
                </button>
                <section className="rounded-md border border-[#d8d1c5] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#24211b]">Capsule Architect</p>
                      <p className="mt-1 text-xs text-[#6f675c]">Documents, ideas and conversations</p>
                      <p className="mt-1 text-xs text-[#6f675c]">Without a selected case, adding documents creates a private evidence workspace for this capsule.</p>
                      <p className="mt-2 max-w-xl text-xs leading-5 text-[#6f675c]">Build reviewable source assertions, dated events and ontology proposals. Explicit “Actor:”, “Party:” or “Stakeholder:” fields become actor candidates. Missing identities, dates and causal links stay unknown; check coverage before relying on the graph.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium text-[#24211b] hover:bg-[#24211b] hover:text-white">
                      <UploadCloud className="h-4 w-4" />
                      Add documents
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.docx,.txt,.md,.html,.csv,.json"
                            disabled={intakeBusy || architectBusy}
                            className="sr-only"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          event.target.value = '';
                          setIntakeBusy(true);
                          setIntakeWarnings([]);
                          void ingestArchitectDocuments(files, { situationId: intakeSituationId ?? guard.situation?.id, workspaceName: job })
                            .then(({ documents, warnings, situationId }) => {
                              setIntakeSituationId(situationId);
                              setArchitectDocuments((current) => [...current, ...documents].slice(0, 20));
                              setIntakeWarnings(warnings);
                            }).catch(() => setIntakeWarnings(['Documents could not be read. Your existing sources are still here; please retry.']))
                            .finally(() => setIntakeBusy(false));
                        }}
                      />
                    </label>
                  </div>
                  <div className="mt-4 block text-sm font-medium text-[#24211b]">
                    <label htmlFor="capsule-source-notes">
                    Ideas, notes or conversation
                    </label>
                    <textarea
                      id="capsule-source-notes"
                      aria-describedby="capsule-source-notes-help"
                      value={sourceNotes}
                      maxLength={CAPSULE_NOTES_MAX_CHARS}
                      disabled={architectBusy || intakeBusy}
                      onChange={(event) => setSourceNotes(event.target.value)}
                      placeholder="Describe your idea, paste notes, or bring a conversation from Ask PRAXIS."
                      className="mt-2 min-h-36 w-full rounded-lg border border-[#cfc6b8] bg-white p-3 text-sm leading-6 focus:outline-emerald-700"
                    />
                    <span id="capsule-source-notes-help" className="mt-1 block text-xs font-normal text-[#6f675c]">{sourceNotes.length.toLocaleString()} / 12,000 characters. User statements remain supplied context; assistant suggestions are not independent evidence. Building saves a private source and creates review-only proposals. Nothing is automatically approved or published.</span>
                  </div>
                  {architectDocuments.length ? (
                    <ul className="mt-3 grid gap-2 text-xs text-[#4f483f] sm:grid-cols-2">
                      {architectDocuments.map((document) => (
                        <li key={document.documentId} className="border border-[#ebe4d8] px-2 py-1.5">
                          {document.title} · {document.text.length.toLocaleString()} characters ready
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button type="button" disabled={intakeBusy || architectBusy || (!architectDocuments.length && !sourceNotes.trim())} onClick={() => void runArchitect()} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium disabled:opacity-50">
                      <Sparkles className="h-4 w-4" /> {intakeBusy ? 'Reading documents…' : architectBusy ? 'Building proposals…' : 'Build evidence proposals'}
                    </button>
                    {architectReviewCount ? <span className="text-xs text-[#6f675c]">{architectReviewCount} review cards ready</span> : null}
                  </div>
                  {intakeWarnings.length > 0 && <ul role="status" className="mt-3 space-y-1 text-xs text-amber-800">{intakeWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
                  {architectCapsuleId && <Link href={`/app/capsules?starter=${encodeURIComponent(architectCapsuleId)}&lane=inspect`} className="mt-3 inline-flex min-h-10 items-center rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white">Inspect and review your capsule</Link>}
                  <p className="mt-2 text-xs leading-5 text-[#6f675c]">Actors, claims, events and graph links are evidence proposals. Review them before reuse; repeated extraction does not make a claim true.</p>
                </section>
              </div>
            )}

            {activeStep === 'sources' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm font-medium">
                    Sourcing mode
                    <select
                      value={capsule.sourcing.mode}
                      onChange={(event) => patchCapsule({
                        sourcing: { mode: event.target.value as ContextCapsule['sourcing']['mode'] },
                        retrieval: { mode: event.target.value as ContextCapsule['retrieval']['mode'] },
                      })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    >
                      {['live-search', 'corpus', 'skc', 'hybrid'].map((mode) => <option key={mode}>{mode}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Min sources per claim
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={capsule.sourcing.minSourcesPerClaim}
                      onChange={(event) => patchCapsule({ sourcing: { minSourcesPerClaim: Number(event.target.value) } })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Recency window days
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={capsule.sourcing.recencyWindowDays ?? 90}
                      onChange={(event) => patchCapsule({ sourcing: { recencyWindowDays: Number(event.target.value) } })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Allowed domains
                  <input
                    value={allowedDomains}
                    onChange={(event) => {
                      setAllowedDomains(event.target.value);
                      patchCapsule({ sourcing: { allowedDomains: csv(event.target.value) } });
                    }}
                    className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Blocked domains
                  <input
                    value={blockedDomains}
                    onChange={(event) => {
                      setBlockedDomains(event.target.value);
                      patchCapsule({ sourcing: { blockedDomains: csv(event.target.value) } });
                    }}
                    className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  />
                </label>
                <button type="button" onClick={() => runAssist('sources')} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Suggest sources
                </button>
              </div>
            )}

            {activeStep === 'grounding' && (
              <div className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-3">
                  <section className="rounded-md border border-[#d8d1c5] bg-white p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#24211b]">
                      <CalendarClock className="h-4 w-4" />
                      Timeline anchors
                    </div>
                    <label className="block text-xs font-semibold text-[#6f675c]">
                      Anchor label
                      <input
                        value={capsule.temporality.timelineAnchors[0]?.label ?? ''}
                        onChange={(event) => patchTimelineAnchor({ label: event.target.value })}
                        className="mt-1 w-full border border-[#cfc6b8] bg-white p-2 text-sm text-[#24211b]"
                      />
                    </label>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <label className="block text-xs font-semibold text-[#6f675c]">
                        Date
                        <input
                          type="date"
                          value={capsule.temporality.timelineAnchors[0]?.date ?? ''}
                          onChange={(event) => patchTimelineAnchor({ date: event.target.value })}
                          className="mt-1 w-full border border-[#cfc6b8] bg-white p-2 text-sm text-[#24211b]"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[#6f675c]">
                        Kind
                        <select
                          value={capsule.temporality.timelineAnchors[0]?.kind ?? 'review'}
                          onChange={(event) => patchTimelineAnchor({ kind: event.target.value as ContextCapsule['temporality']['timelineAnchors'][number]['kind'] })}
                          className="mt-1 w-full border border-[#cfc6b8] bg-white p-2 text-sm text-[#24211b]"
                        >
                          {['as-of', 'event', 'deadline', 'review', 'validity-start', 'validity-end'].map((kind) => <option key={kind}>{kind}</option>)}
                        </select>
                      </label>
                    </div>
                  </section>

                  <section className="rounded-md border border-[#d8d1c5] bg-white p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#24211b]">
                      <GitBranch className="h-4 w-4" />
                      Causal link
                    </div>
                    <label className="block text-xs font-semibold text-[#6f675c]">
                      Cause
                      <input
                        value={capsule.causality.causalLinks[0]?.cause ?? ''}
                        onChange={(event) => patchCausalLink({ cause: event.target.value })}
                        className="mt-1 w-full border border-[#cfc6b8] bg-white p-2 text-sm text-[#24211b]"
                      />
                    </label>
                    <label className="mt-3 block text-xs font-semibold text-[#6f675c]">
                      Effect
                      <input
                        value={capsule.causality.causalLinks[0]?.effect ?? ''}
                        onChange={(event) => patchCausalLink({ effect: event.target.value })}
                        className="mt-1 w-full border border-[#cfc6b8] bg-white p-2 text-sm text-[#24211b]"
                      />
                    </label>
                    <label className="mt-3 block text-xs font-semibold text-[#6f675c]">
                      Relation
                      <select
                        value={capsule.causality.causalLinks[0]?.relation ?? 'causes'}
                        onChange={(event) => patchCausalLink({ relation: event.target.value as ContextCapsule['causality']['causalLinks'][number]['relation'] })}
                        className="mt-1 w-full border border-[#cfc6b8] bg-white p-2 text-sm text-[#24211b]"
                      >
                        {['causes', 'enables', 'blocks', 'escalates', 'de-escalates', 'correlates'].map((relation) => <option key={relation}>{relation}</option>)}
                      </select>
                    </label>
                  </section>

                  <section className="rounded-md border border-[#d8d1c5] bg-white p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#24211b]">
                      <Network className="h-4 w-4" />
                      Domain taxonomy
                    </div>
                    <label className="block text-xs font-semibold text-[#6f675c]">
                      Capsule domain
                      <select
                        value={capsule.ontologyBinding.domainId}
                        onChange={(event) => setDomainBinding(event.target.value)}
                        className="mt-1 w-full border border-[#cfc6b8] bg-white p-2 text-sm text-[#24211b]"
                      >
                        {DOMAIN_OPTIONS.map((domain) => <option key={domain}>{domain}</option>)}
                      </select>
                    </label>
                    <label className="mt-3 block text-xs font-semibold text-[#6f675c]">
                      Binding rationale
                      <textarea
                        value={capsule.ontologyBinding.bindingRationale}
                        onChange={(event) => patchCapsule({ ontologyBinding: { bindingRationale: event.target.value } })}
                        className="mt-1 min-h-24 w-full border border-[#cfc6b8] bg-white p-2 text-sm text-[#24211b]"
                      />
                    </label>
                  </section>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-md border border-[#d8d1c5] bg-white p-3">
                    <p className="mb-3 text-sm font-semibold text-[#24211b]">Ontology bindings</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ONTOLOGY_IDS.map((ontologyId) => (
                        <label key={ontologyId} className="flex items-center gap-2 border border-[#ebe4d8] px-2 py-1.5 text-xs text-[#4f483f]">
                          <input
                            type="checkbox"
                            checked={capsule.ontologyBinding.ontologyIds.includes(ontologyId)}
                            onChange={(event) => toggleOntologyId(ontologyId, event.target.checked)}
                          />
                          {ontologyId}
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-md border border-[#d8d1c5] bg-white p-3">
                    <p className="mb-3 text-sm font-semibold text-[#24211b]">ACO primitives</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {TACITUS_CORE_PRIMITIVES.map((primitive) => (
                        <label key={primitive} className="flex items-center gap-2 border border-[#ebe4d8] px-2 py-1.5 text-xs text-[#4f483f]">
                          <input
                            type="checkbox"
                            checked={capsule.ontologyBinding.acoPrimitives.includes(primitive)}
                            onChange={(event) => toggleAcoPrimitive(primitive, event.target.checked)}
                          />
                          {primitive}
                        </label>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="rounded-md border border-[#d8d1c5] bg-[#f8f3e8] p-3 text-sm text-[#4f483f]">
                  <p className="font-semibold text-[#24211b]">embeddedGraph: GraphLite advisory projection</p>
                  <p className="mt-1">
                    {capsule.embeddedGraph.projectionId} writes a derived graph view only; Firestore ContextCapsules remain canonical until a human review card promotes graph changes.
                  </p>
                </div>
              </div>
            )}

            {activeStep === 'output' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Deliverable shape
                  <select
                    value={capsule.output.format}
                    onChange={(event) => patchCapsule({ output: outputFor(event.target.value as ContextCapsule['output']['format']) })}
                    className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  >
                    {['brief', 'markdown', 'report', 'json'].map((format) => <option key={format}>{format}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => runAssist('output-schema')} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Tighten output schema
                </button>
              </div>
            )}

            {activeStep === 'tools' && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <label key={tool} className="flex items-center gap-3 border border-[#d8d1c5] p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(tool)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? Array.from(new Set([...selectedTools, tool]))
                            : selectedTools.filter((item) => item !== tool);
                          setSelectedTools(next);
                          patchCapsule({ tools: { recommended: next } });
                        }}
                      />
                      {tool}
                    </label>
                  ))}
                </div>
                <label className="block text-sm font-medium">
                  Tool policy
                  <select
                    value={capsule.tools.policy}
                    onChange={(event) => patchCapsule({ tools: { policy: event.target.value as ContextCapsule['tools']['policy'] } })}
                    className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  >
                    {['suggest', 'manual', 'auto'].map((policy) => <option key={policy}>{policy}</option>)}
                  </select>
                </label>
              </div>
            )}

            {activeStep === 'eval' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Sample questions
                  <textarea
                    value={sampleQuestions}
                    onChange={(event) => setSampleQuestions(event.target.value)}
                    className="mt-2 min-h-32 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runStructuralCheck}
                    className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium"
                  >
                    <Check className="h-4 w-4" /> Check draft structure
                  </button>
                  <button type="button" onClick={() => runAssist('few-shot')} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4" /> Generate few-shot examples
                  </button>
                </div>
                {evalSummary ? <p className="text-sm text-[#6f675c]">{evalSummary}</p> : null}
                <Link href="/app" className="inline-flex min-h-10 items-center text-sm font-semibold underline">Test questions in Ask PRAXIS</Link>
              </div>
            )}

            {activeStep === 'publish' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Visibility
                    <select
                      value={capsule.market.visibility}
                      onChange={(event) => patchCapsule({ market: { visibility: event.target.value as ContextCapsule['market']['visibility'] } })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    >
                      {['private', 'org', 'unlisted', 'public'].map((visibility) => <option key={visibility}>{visibility}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Pricing
                    <select
                      value={capsule.market.pricing}
                      onChange={(event) => patchCapsule({ market: { pricing: event.target.value as ContextCapsule['market']['pricing'] } })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    >
                      {['free', 'credits', 'subscription'].map((pricing) => <option key={pricing}>{pricing}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" disabled={saveState === 'saving' || saveState === 'publishing'} onClick={() => void saveDraft()} className="inline-flex items-center gap-2 border border-[#24211b] px-4 py-2 text-sm font-semibold disabled:opacity-50">
                    <FileJson className="h-4 w-4" /> Save draft
                  </button>
                  <button type="button" disabled={saveState === 'saving' || saveState === 'publishing'} onClick={() => void publish()} className="inline-flex items-center gap-2 bg-[#24211b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    <Rocket className="h-4 w-4" /> Publish capsule
                  </button>
                </div>
                <p className="text-xs text-[#6f675c]">Save privately while reviewing. Publication has a separate server-side evaluation gate; the structure check does not unlock it.</p>
                {savedCapsuleId ? <p role="status" className="text-xs">Draft saved as {savedCapsuleId}.</p> : null}
              </div>
            )}
          </div>
        )}

        {message && (
          <p role="status" className={`border px-4 py-3 text-sm ${
            saveState === 'error' ? 'border-[#b65d45] bg-[#fff4ef] text-[#8a3d2c]' : 'border-[#d8d1c5] bg-[#fffdf8] text-[#4f483f]'
          }`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

function deepMerge(base: unknown, overlay: unknown): unknown {
  if (overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) return overlay;
  if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay;

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    merged[key] = key in merged ? deepMerge(merged[key], value) : value;
  }
  return merged;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function makeDraftCapsule(input: {
  job: string;
  frameworks: string;
  allowedDomains: string;
  blockedDomains: string;
  selectedTools: string[];
}): ContextCapsule {
  const now = new Date().toISOString();
  return {
    id: 'new-policy-capsule',
    schemaVersion: 'capsule/v2',
    version: '0.1.0',
    contentHash: 'sha256:pending',
    status: 'draft',
    immutable: false,
    mergeStrategy: 'prototype',
    persona: {
      analystProfile: {},
      systemFrame: input.job,
      domain: 'generic',
      frameworks: csv(input.frameworks),
      fewShot: [],
    },
    output: outputFor('brief'),
    sourcing: {
      mode: 'hybrid',
      minSourcesPerClaim: 1,
      allowedDomains: csv(input.allowedDomains),
      blockedDomains: csv(input.blockedDomains),
      recencyWindowDays: 90,
      requiredSourceTypes: ['official', 'expert-analysis'],
      citationStyle: 'inline',
    },
    retrieval: {
      mode: 'hybrid',
      corpora: [],
      graphExpansionDepth: 1,
      topK: 8,
      trustRank: 'balanced',
    },
    temporality: {
      timelineAnchors: [defaultTimelineAnchor()],
    },
    causality: {
      causalLinks: [defaultCausalLink()],
    },
    ontologyBinding: {
      domainId: 'generic',
      taxonomyPath: ['generic'],
      ontologyIds: ['governance'],
      acoPrimitives: ['Actor', 'Claim', 'Event'],
      bindingRationale: 'Ground capsule extraction in the selected domain taxonomy, ontology ids, and ACO primitives before reuse.',
    },
    embeddedGraph: graphLiteProjectionForCapsule('new-policy-capsule', 'generic', {
      timelineAnchor: defaultTimelineAnchor(),
      causalLink: defaultCausalLink(),
    }),
    tools: { bound: [], recommended: input.selectedTools, policy: 'suggest' },
    guardrails: {
      refusalPolicy: 'Mark unsupported claims as gaps and avoid definitive policy judgments without evidence.',
      blockedTopics: [],
      piiHandling: 'redact',
      citationRequired: true,
      maxUngroundedClaims: 1,
      safetySettings: [],
    },
    eval: {
      goldenSetRef: 'builder/manual-dry-run',
      thresholds: {
        faithfulness: 0.8,
        citationCoverage: 0.8,
        contextRecall: 0.7,
        schemaConformance: 0.95,
        redTeamPassRate: 0.95,
        safetyScore: 0.95,
      },
      metrics: ['faithfulness', 'context_recall'],
      judge: CAPSULE_EVAL_JUDGE_MODEL,
    },
    provenance: { author: { uid: 'pending' }, createdAt: now },
    market: {
      visibility: 'private',
      pricing: 'free',
      category: 'generic',
      tags: ['builder-draft'],
      installs: 0,
      rating: 0,
    },
  };
}

function defaultTimelineAnchor(): ContextCapsule['temporality']['timelineAnchors'][number] {
  return {
    id: 'anchor-initial-review',
    label: 'Initial review window',
    date: new Date().toISOString().slice(0, 10),
    kind: 'review',
    sourceRefs: [],
  };
}

function defaultCausalLink(): ContextCapsule['causality']['causalLinks'][number] {
  return {
    id: 'causal-primary-risk',
    cause: 'Source posture changes or a key assumption fails',
    effect: 'Analyst output requires review before reuse',
    relation: 'causes',
    evidenceRefs: [],
    confidence: 0.5,
  };
}

function graphLiteProjectionForCapsule(
  capsuleId: string,
  domainId: string,
  grounding?: {
    timelineAnchor?: ContextCapsule['temporality']['timelineAnchors'][number];
    causalLink?: ContextCapsule['causality']['causalLinks'][number];
  },
): ContextCapsule['embeddedGraph'] {
  const safeCapsuleId = capsuleId.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() || 'capsule';
  const safeDomainId = domainId.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() || 'generic';
  const domainSeed = DOMAIN_SEEDS[domainId as keyof typeof DOMAIN_SEEDS];
  const domainLabel = domainSeed?.name ?? humanizeId(domainId);
  const timelineAnchor = grounding?.timelineAnchor ?? defaultTimelineAnchor();
  const causalLink = grounding?.causalLink ?? defaultCausalLink();
  const nodes: NonNullable<ContextCapsule['embeddedGraph']['nodes']> = [
    {
      id: `capsule:${safeCapsuleId}`,
      label: 'Context capsule draft',
      entityType: 'Policy',
      reviewState: 'advisory',
      confidence: 0.6,
    },
    {
      id: `domain:${safeDomainId}`,
      label: domainLabel,
      entityType: 'Ontology',
      reviewState: 'advisory',
      confidence: 0.6,
    },
    {
      id: 'timeline-anchor:primary',
      label: timelineAnchor.label,
      entityType: 'Event',
      reviewState: 'advisory',
      confidence: timelineAnchor.confidence ?? 0.5,
      sourceReceiptIds: timelineAnchor.sourceRefs,
    },
    {
      id: 'causal-link:primary',
      label: `${causalLink.cause} -> ${causalLink.effect}`,
      entityType: 'Claim',
      reviewState: 'advisory',
      confidence: causalLink.confidence ?? 0.5,
      sourceReceiptIds: causalLink.evidenceRefs,
    },
  ];
  const edges: NonNullable<ContextCapsule['embeddedGraph']['edges']> = [
    {
      id: 'capsule-domain-binding',
      source: `capsule:${safeCapsuleId}`,
      target: `domain:${safeDomainId}`,
      label: 'bound to domain',
      relationshipType: 'bound_to_domain',
      reviewState: 'advisory',
      confidence: 0.6,
    },
    {
      id: 'capsule-timeline-anchor',
      source: `capsule:${safeCapsuleId}`,
      target: 'timeline-anchor:primary',
      label: 'has timeline anchor',
      relationshipType: 'has_timeline_anchor',
      reviewState: 'advisory',
      confidence: timelineAnchor.confidence ?? 0.5,
      sourceReceiptIds: timelineAnchor.sourceRefs,
    },
    {
      id: 'capsule-causal-link',
      source: 'causal-link:primary',
      target: `capsule:${safeCapsuleId}`,
      label: 'grounds capsule risk',
      relationshipType: 'grounded_by_causal_link',
      reviewState: 'advisory',
      confidence: causalLink.confidence ?? 0.5,
      sourceReceiptIds: causalLink.evidenceRefs,
    },
  ];

  return {
    provider: 'graphlite',
    projectionId: `${safeCapsuleId}-${safeDomainId}-graphlite-builder-projection`,
    status: 'compiled-advisory',
    namedGraph: `capsule_${safeCapsuleId.replaceAll('-', '_')}`,
    advisoryOnly: true,
    canonicalStore: 'Firestore ContextCapsules',
    promotionGate: 'Human review-card approval required before canonical graph promotion.',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
  };
}

function outputFor(format: ContextCapsule['output']['format']): ContextCapsule['output'] {
  const schema = {
    type: 'object',
    properties: {
      judgment: { type: 'string' },
      evidence: { type: 'array', items: { type: 'string' } },
      options: { type: 'array', items: { type: 'string' } },
      openQuestions: { type: 'array', items: { type: 'string' } },
    },
    required: ['judgment', 'evidence', 'openQuestions'],
  };
  return {
    format,
    responseJsonSchema: schema,
    propertyOrdering: ['judgment', 'evidence', 'options', 'openQuestions'],
    zodRef: format === 'json' ? 'CapsuleStructuredOutput' : undefined,
    renderTemplate: format === 'report' || format === 'markdown'
      ? '# Judgment\n{{judgment}}\n\n## Evidence\n{{evidence}}\n\n## Options\n{{options}}\n\n## Open questions\n{{openQuestions}}'
      : undefined,
  };
}

function csv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferDomainFromPrompt(prompt: string): string {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('sanction')) return 'economic-sanctions';
  if (normalized.includes('treaty') || normalized.includes('diplom')) return 'diplomacy-negotiation';
  if (normalized.includes('humanitarian')) return 'humanitarian';
  if (normalized.includes('crisis') || normalized.includes('stakeholder')) return 'governance-rule-of-law';
  return 'generic';
}

function inferTagsFromPrompt(prompt: string): string[] {
  return Array.from(new Set(
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 5)
      .slice(0, 5),
  ));
}

function humanizeId(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
