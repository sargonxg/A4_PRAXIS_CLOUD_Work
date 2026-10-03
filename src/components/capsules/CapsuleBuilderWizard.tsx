'use client';

import { CalendarClock, Check, Code2, FileJson, GitBranch, Network, Rocket, Sparkles, UploadCloud } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';
import type { ContextCapsule } from '@/types/context-capsule';
import { builderDraftFingerprint, clearBuilderWorkingDraft, readBuilderWorkingDraft, saveBuilderWorkingDraft, saveCurrentBuilderForUse, type BuilderWorkingDraft } from '@/lib/context/capsule-builder-session';

type BuilderStepId = 'job' | 'material' | 'sources' | 'grounding' | 'output' | 'tools' | 'eval' | 'publish';

const STEPS: Array<{ id: BuilderStepId; label: string; helper: string }> = [
  { id: 'job', label: 'Purpose', helper: 'What decision or analysis should this context support?' },
  { id: 'material', label: 'Material', helper: 'Bring documents, notes or a conversation. Review generated proposals.' },
  { id: 'eval', label: 'Review and save', helper: 'Check the scope, choose an output and save privately.' },
  { id: 'sources', label: 'Source preferences', helper: 'Preferred sources and recency; not verified evidence.' },
  { id: 'grounding', label: 'Package proposals', helper: 'Timeline, causal and ontology settings for a separate package.' },
  { id: 'output', label: 'Output', helper: 'Deliverable format and schema ordering.' },
  { id: 'tools', label: 'Tools', helper: 'How PRAXIS should use sourceability and research tools.' },
  { id: 'publish', label: 'Package publication', helper: 'Separate advanced package evaluation and publication.' },
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
  const router = useRouter();
  const guard = useSituationGuard();
  const { user } = useAuth();
  const currentOwnerId = useRef(user?.id ?? null);
  currentOwnerId.current = user?.id ?? null;
  const [sourceNotes, setSourceNotes] = useState('');
  const handoffLoaded = useRef<string | null>(null);
  const notesReceipt = useRef<ArchitectNotesReceipt | null>(null);
  const architectInFlight = useRef(false);
  const saveInFlight = useRef(false);
  const saveOwnerId = useRef<string | null>(null);
  const architectOwnerId = useRef<string | null>(null);
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState<BuilderStepId>('job');
  const [advanced, setAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draftOwnerId, setDraftOwnerId] = useState<string | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [savedCapsuleId, setSavedCapsuleId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const [evalSummary, setEvalSummary] = useState<string | null>(null);
  const [job, setJob] = useState('Help analysts produce a sourced policy briefing with explicit uncertainty and next evidence gaps.');
  const [frameworks, setFrameworks] = useState('ach, stakeholder-salience');
  const [allowedDomains, setAllowedDomains] = useState('');
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

  const visibleSteps = showSettings ? STEPS : STEPS.slice(0, 3);
  const activeIndex = visibleSteps.findIndex((step) => step.id === activeStep);
  const capsuleJson = useMemo(() => JSON.stringify(capsule, null, 2), [capsule]);
  const fingerprint = builderDraftFingerprint({ capsule, purpose: job, notes: sourceNotes, documents: architectDocuments });
  const currentFingerprint = useRef(fingerprint);
  currentFingerprint.current = fingerprint;
  const hasUnsavedChanges = savedCapsuleId !== null && savedFingerprint !== fingerprint;
  const recoverySnapshot = useRef<{ ownerId: string; draft: BuilderWorkingDraft } | null>(null);
  if (user?.id && draftOwnerId === user.id) recoverySnapshot.current = { ownerId: user.id, draft: { capsule, purpose: job, notes: sourceNotes, documents: architectDocuments, situationId: intakeSituationId, savedCapsuleId, savedFingerprint } };
  if (!user?.id) recoverySnapshot.current = null;

  useEffect(() => () => {
    const snapshot = recoverySnapshot.current;
    if (snapshot) { try { saveBuilderWorkingDraft(window.sessionStorage, snapshot.ownerId, snapshot.draft); } catch { /* Canonical save remains available. */ } }
  }, []);

  useEffect(() => {
    if (!user?.id && draftOwnerId) { try { clearBuilderWorkingDraft(window.sessionStorage); } catch { /* No private draft is rendered after logout. */ } }
    const explicitStart = searchParams.get('from') === 'conversation';
    let recovered: ReturnType<typeof readBuilderWorkingDraft> = null;
    try { recovered = explicitStart || !user?.id ? null : readBuilderWorkingDraft(window.sessionStorage, user.id); } catch { /* Saving remains available if tab storage is blocked. */ }
    const restored = recovered?.capsule ?? makeDraftCapsule({ job: 'Help analysts produce a sourced policy briefing with explicit uncertainty and next evidence gaps.', frameworks: 'ach, stakeholder-salience', allowedDomains: '', blockedDomains: '', selectedTools: ['sourceability', 'deep_research'] });
    setCapsule(restored);
    setJob(recovered?.purpose ?? restored.persona.systemFrame);
    setSourceNotes(recovered?.notes ?? '');
    setArchitectDocuments(recovered?.documents ?? []);
    setIntakeSituationId(recovered?.situationId);
    setSavedCapsuleId(recovered?.savedCapsuleId ?? null);
    setArchitectCapsuleId(recovered?.savedCapsuleId ?? null);
    setSavedFingerprint(recovered?.savedFingerprint ?? null);
    setFrameworks(restored.persona.frameworks.join(', '));
    setAllowedDomains(restored.sourcing.allowedDomains.join(', '));
    setBlockedDomains(restored.sourcing.blockedDomains.join(', '));
    setSelectedTools(restored.tools.recommended);
    setSaveState(recovered?.savedCapsuleId ? 'saved' : 'idle');
    setIntakeBusy(false);
    setArchitectBusy(false);
    setAssistBusy(false);
    notesReceipt.current = null;
    setArchitectReviewCount(0);
    setIntakeWarnings([]);
    setEvalSummary(null);
    setDraftOwnerId(user?.id ?? null);
    setMessage(recovered ? 'Working draft restored in this tab. Save changes to keep them in your private library.' : '');
  // Account changes must clear the previous account before any private work is shown.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || draftOwnerId !== user.id) return;
    const timer = window.setTimeout(() => {
      let saved = false;
      try { saved = saveBuilderWorkingDraft(window.sessionStorage, user.id, { capsule, purpose: job, notes: sourceNotes, documents: architectDocuments, situationId: intakeSituationId, savedCapsuleId, savedFingerprint }); } catch { /* Optional tab recovery. */ }
      if (!saved) setIntakeWarnings((warnings) => warnings.includes('Tab recovery is unavailable. Save your draft before leaving.') ? warnings : [...warnings, 'Tab recovery is unavailable. Save your draft before leaving.']);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [capsule, job, sourceNotes, architectDocuments, intakeSituationId, savedCapsuleId, savedFingerprint, draftOwnerId, user?.id]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!user?.id || searchParams.get('from') !== 'conversation' || handoffLoaded.current === user.id) return;
    handoffLoaded.current = user.id;
    let handoff: ReturnType<typeof readConversationCapsuleHandoff> = null;
    try { handoff = readConversationCapsuleHandoff(window.sessionStorage, user.id); } catch { /* User can paste notes. */ }
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
    const operationOwnerId = user?.id ?? null;
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
    if (currentOwnerId.current !== operationOwnerId) return;
    if (!response.ok) {
      setMessage(payload.error ?? 'Assist failed.');
      return;
    }
    if (payload.patch) patchCapsule(payload.patch);
    setMessage(payload.summary ?? 'Suggestions applied.');
    } catch {
      if (currentOwnerId.current === operationOwnerId) setMessage('Suggestions could not be loaded. Your draft is unchanged; retry when connected.');
    } finally {
      if (currentOwnerId.current === operationOwnerId) setAssistBusy(false);
    }
  }

  async function runArchitect() {
    if ((architectInFlight.current && architectOwnerId.current === user?.id) || architectBusy || intakeBusy) return;
    const operationOwnerId = user?.id ?? null;
    architectOwnerId.current = operationOwnerId;
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
      if (currentOwnerId.current !== operationOwnerId) return;
      notesReceipt.current = receipt;
      situationId = receipt.situationId;
      setIntakeSituationId(situationId);
      documents = [...documents, receipt.document];
      if (user?.id) { try { clearConversationCapsuleHandoff(window.sessionStorage, user.id); } catch { /* Stored source receipt is authoritative. */ } }
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
    if (currentOwnerId.current !== operationOwnerId) return;
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
      if (currentOwnerId.current === operationOwnerId) setMessage(error instanceof Error ? error.message : 'Capsule building was interrupted. Your uploaded sources are saved; retry the build.');
    } finally {
      if (architectOwnerId.current === operationOwnerId) architectInFlight.current = false;
      if (currentOwnerId.current === operationOwnerId) setArchitectBusy(false);
    }
  }

  async function saveDraft(): Promise<string | null> {
    if ((saveInFlight.current && saveOwnerId.current === user?.id) || intakeBusy || architectBusy || saveState === 'saving' || saveState === 'publishing') return null;
    const operationOwnerId = user?.id ?? null;
    saveOwnerId.current = operationOwnerId;
    saveInFlight.current = true;
    setSaveState('saving');
    setMessage('Saving your private capsule...');
    const id = architectCapsuleId ?? savedCapsuleId ?? (capsule.id === 'new-policy-capsule' ? `capsule-${crypto.randomUUID()}` : capsule.id);
    const draft = { ...capsule, id };
    const savingFingerprint = fingerprint;
    setCapsule(draft);
    try {
    let documents = architectDocuments;
    let situationId = intakeSituationId ?? guard.situation?.id;
    if (sourceNotes.trim()) {
      if (documents.length >= 20) throw new Error('A draft supports 20 sources. Use fewer documents to include working notes.');
      const receipt = await prepareArchitectNotes(sourceNotes, { situationId, workspaceName: job, previous: notesReceipt.current });
      if (currentOwnerId.current !== operationOwnerId) return null;
      notesReceipt.current = receipt;
      situationId = receipt.situationId;
      setIntakeSituationId(situationId);
      documents = [...documents, receipt.document];
    }
    const response = await fetch('/api/context/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save-builder-draft', capsuleId: id, purpose: job,
        systemFrame: draft.persona.systemFrame, domain: draft.persona.domain,
        frameworks: draft.persona.frameworks, outputFormat: draft.output.format,
        responseJsonSchema: draft.output.responseJsonSchema, propertyOrdering: draft.output.propertyOrdering,
        sourcing: { mode: draft.sourcing.mode, minSourcesPerClaim: draft.sourcing.minSourcesPerClaim, allowedDomains: draft.sourcing.allowedDomains, blockedDomains: draft.sourcing.blockedDomains, recencyWindowDays: draft.sourcing.recencyWindowDays, requiredSourceTypes: draft.sourcing.requiredSourceTypes, citationStyle: draft.sourcing.citationStyle },
        tools: { recommended: draft.tools.recommended, policy: draft.tools.policy },
        situationId, documentIds: documents.map((document) => document.documentId),
      }),
    });
    const payload = await response.json();
    if (currentOwnerId.current !== operationOwnerId) return null;
    if (!response.ok) {
      setSaveState('error');
      const validation = Object.values(payload.details?.fieldErrors ?? {}).flat().filter((value): value is string => typeof value === 'string').slice(0, 2).join(' ');
      setMessage(validation || payload.detail || payload.error || 'Save failed.');
      return null;
    }
    const savedId = payload.capsule?.capsuleId as string;
    if (!savedId) throw new Error('Missing saved capsule id');
    setSavedCapsuleId(savedId);
    setSavedFingerprint(savingFingerprint);
    const savedSnapshot: BuilderWorkingDraft = { capsule: draft, purpose: job, notes: sourceNotes, documents: architectDocuments, situationId, savedCapsuleId: savedId, savedFingerprint: savingFingerprint };
    if (operationOwnerId) {
      recoverySnapshot.current = { ownerId: operationOwnerId, draft: savedSnapshot };
      try { saveBuilderWorkingDraft(window.sessionStorage, operationOwnerId, savedSnapshot); } catch { /* Private canonical save has already succeeded. */ }
    }
    setArchitectCapsuleId(savedId);
    setSaveState('saved');
    if (user?.id) { try { clearConversationCapsuleHandoff(window.sessionStorage, user.id); } catch { /* Canonical save succeeded. */ } }
    setMessage('Private capsule saved to your library. Use it in Ask PRAXIS; source and graph proposals still need review.');
    return savedId;
    } catch (error) {
      if (currentOwnerId.current === operationOwnerId) {
        setSaveState('error');
        setMessage(error instanceof Error ? error.message : 'Draft could not be saved. Your current edits are still here; retry saving.');
      }
      return null;
    } finally {
      if (saveOwnerId.current === operationOwnerId) saveInFlight.current = false;
    }
  }

  async function saveAndUse() {
    const operationOwnerId = user?.id ?? null;
    const id = savedCapsuleId && !hasUnsavedChanges ? savedCapsuleId : await saveCurrentBuilderForUse({ fingerprint, currentFingerprint: () => currentFingerprint.current, save: saveDraft });
    if (currentOwnerId.current !== operationOwnerId) return;
    if (id) router.push(`/app?capsuleId=${encodeURIComponent(id)}`);
    else if (currentFingerprint.current !== fingerprint) setMessage('Your draft changed while saving. Save the current changes before using this capsule.');
  }

  async function publish() {
    if (saveInFlight.current || saveState === 'saving' || saveState === 'publishing') return;
    const operationOwnerId = user?.id ?? null;
    setSaveState('publishing');
    setMessage('Evaluating the capsule package for publication...');
    try {
    const draft = capsule.id === 'new-policy-capsule' ? { ...capsule, id: `capsule-${crypto.randomUUID()}` } : capsule;
    setCapsule(draft);
    const packageResponse = await fetch('/api/capsules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draft.id, capsule: draft }),
    });
    const packagePayload = await packageResponse.json();
    if (currentOwnerId.current !== operationOwnerId) return;
    if (!packageResponse.ok) throw new Error(packagePayload.error ?? 'The capsule package could not be saved.');
    const packageId = packagePayload.capsule?.id;
    if (!packageId) throw new Error('Missing capsule package receipt.');
    const response = await fetch(`/api/capsules/${encodeURIComponent(packageId)}/publish`, { method: 'POST' });
    const payload = await response.json();
    if (currentOwnerId.current !== operationOwnerId) return;
    if (!response.ok) {
      setSaveState('error');
      setMessage(payload.detail ?? payload.error ?? 'Publish failed.');
      return;
    }
    setSaveState('published');
    setMessage('Capsule published and frozen as an immutable version.');
    } catch (error) {
      if (currentOwnerId.current === operationOwnerId) {
        setSaveState('error');
        setMessage(error instanceof Error ? error.message : 'Publication could not be confirmed. Check the package status before retrying.');
      }
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
      const parsed = ContextCapsuleSchema.parse(JSON.parse(value)) as ContextCapsule;
      setCapsule(parsed);
      setJob(parsed.persona.systemFrame.slice(0, 4000));
      setFrameworks(parsed.persona.frameworks.join(', '));
      setAllowedDomains(parsed.sourcing.allowedDomains.join(', '));
      setBlockedDomains(parsed.sourcing.blockedDomains.join(', '));
      setSelectedTools(parsed.tools.recommended);
      setEvalSummary(null);
      setMessage('');
    } catch {
      setMessage('Advanced JSON has a syntax issue. Live preview shows the exact problem.');
    }
  }

  if (!user?.id) return <p className="p-4 text-sm text-slate-600">Sign in to create a private capsule. <Link href="/login?redirect=%2Fapp%2Fcapsules%2Fbuilder" className="font-semibold underline">Sign in</Link></p>;
  if (draftOwnerId !== user.id) return <p role="status" className="p-4 text-sm text-slate-600">Loading your working draft…</p>;

  return (
    <section className="grid min-w-0 gap-5">
      <nav aria-label="Capsule builder steps" className="flex min-w-0 flex-wrap gap-2">
        {visibleSteps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id)}
            aria-current={step.id === activeStep ? 'step' : undefined}
            className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-left transition ${
              step.id === activeStep
                ? 'border-[var(--color-deep-ink)] bg-[var(--color-deep-ink)] text-white'
                : 'border-[var(--color-mineral)] bg-transparent text-[var(--color-graphite)] hover:border-[#9d9486]'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-xs">
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold">{step.label}</span>
                <span className={`sr-only ${step.id === activeStep ? 'text-[#ddd6c9]' : 'text-[var(--color-graphite)]'}`}>
                  {step.helper}
                </span>
              </span>
            </span>
          </button>
        ))}
        <button type="button" aria-expanded={showSettings} onClick={() => { setShowSettings((value) => !value); setAdvanced(false); setActiveStep('job'); }} className="min-h-11 shrink-0 px-3 text-sm font-semibold text-[var(--color-graphite)] underline">{showSettings ? 'Hide advanced settings' : 'Advanced settings'}</button>
      </nav>

      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-semibold text-[var(--color-deep-ink)]">
              Step {activeIndex + 1} of {visibleSteps.length} · {visibleSteps[activeIndex]?.label}
            </p>
            <p className="text-sm text-[var(--color-graphite)]">
              {visibleSteps[activeIndex]?.helper}
            </p>
          </div>
          {showSettings ? <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-deep-ink)] px-3 py-2 text-sm font-medium text-[var(--color-deep-ink)] hover:bg-[var(--color-deep-ink)] hover:text-white"
          >
            {advanced ? <FileJson className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            {advanced ? 'Guided wizard' : 'Advanced JSON'}
          </button> : null}
        </div>

        <fieldset disabled={saveState === 'saving' || saveState === 'publishing'} className="min-w-0 border-0 p-0">
        {advanced ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <CapsuleJsonMonacoEditor value={capsuleJson} onChange={applyJson} />
            <CapsuleLivePreview json={capsuleJson} />
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--color-mineral)] bg-[var(--color-archive-paper-strong)] p-4 sm:p-6">
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
                    className="mt-2 min-h-28 w-full rounded-lg border border-[var(--color-mineral)] bg-white p-3 text-base leading-7 focus:outline-[var(--color-praxis-emerald-700)]"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Domain
                    <select
                      value={capsule.persona.domain}
                      onChange={(event) => setDomainBinding(event.target.value)}
                      className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                    >
                      {DOMAIN_OPTIONS.map((domain) => <option key={domain} value={domain}>{humanizeId(domain)}</option>)}
                    </select>
                  </label>
                  <details>
                    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium underline underline-offset-4">Analytical frameworks</summary>
                    <label className="block text-sm font-medium">
                    Frameworks
                    <input
                      value={frameworks}
                      onChange={(event) => {
                        setFrameworks(event.target.value);
                        patchCapsule({ persona: { frameworks: csv(event.target.value), systemFrame: capsule.persona.systemFrame } });
                      }}
                      className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                    />
                    </label>
                    <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]">Methods guide the analysis; they do not verify the sources.</p>
                  </details>
                </div>
                <button type="button" onClick={() => runAssist('persona')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-deep-ink)] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Refine purpose
                </button>
                <button type="button" onClick={() => setActiveStep('material')} className="ml-0 min-h-11 sm:ml-3 rounded-md bg-[var(--color-praxis-emerald-700)] px-4 text-sm font-semibold text-white">Continue to material</button>
              </div>
            )}
            {activeStep === 'material' && (
              <div className="space-y-4">
                <section className="rounded-md border border-[var(--color-mineral)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-deep-ink)]">Your source material</p>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-graphite)]">Upload documents or paste notes to propose facts for review. Use material you have permission to upload.</p>
                      <details className="mt-2 text-xs leading-5 text-[var(--color-graphite)]"><summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold underline">How source proposals work</summary><p>Adding documents creates a private evidence workspace when needed. Explicit “Actor:”, “Party:” or “Stakeholder:” fields become candidates. Missing identities, dates and causal links stay unknown. Check source coverage before relying on the graph.</p></details>
                    </div>
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-[var(--color-deep-ink)] px-3 py-2 text-sm font-medium text-[var(--color-deep-ink)] hover:bg-[var(--color-deep-ink)] hover:text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-praxis-emerald-700)]">
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
                          const uploadOwnerId = user?.id ?? null;
                          event.target.value = '';
                          setIntakeBusy(true);
                          setIntakeWarnings([]);
                          void ingestArchitectDocuments(files, { situationId: intakeSituationId ?? guard.situation?.id, workspaceName: job })
                            .then(({ documents, warnings, situationId }) => {
                              if (currentOwnerId.current !== uploadOwnerId) return;
                              setIntakeSituationId(situationId);
                              setArchitectDocuments((current) => [...current, ...documents].slice(0, 20));
                              setIntakeWarnings(warnings);
                            }).catch(() => { if (currentOwnerId.current === uploadOwnerId) setIntakeWarnings(['Documents could not be read. Your existing sources are still here; please retry.']); })
                            .finally(() => { if (currentOwnerId.current === uploadOwnerId) setIntakeBusy(false); });
                        }}
                      />
                    </label>
                  </div>
                  <div className="mt-4 block text-sm font-medium text-[var(--color-deep-ink)]">
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
                      placeholder="Paste notes, source excerpts or a conversation."
                      className="mt-2 min-h-36 w-full rounded-lg border border-[var(--color-mineral)] bg-white p-3 text-sm leading-6 focus:outline-[var(--color-praxis-emerald-700)]"
                    />
                    <span id="capsule-source-notes-help" className="mt-2 block text-xs font-normal text-[var(--color-graphite)]">{sourceNotes.length.toLocaleString()} / 12,000 characters. You review proposals before saving them.</span>
                  </div>
                  {architectDocuments.length ? (
                    <ul className="mt-3 grid gap-2 text-xs text-[var(--color-graphite)] sm:grid-cols-2">
                      {architectDocuments.map((document) => (
                        <li key={document.documentId} className="border border-[#ebe4d8] px-2 py-1.5">
                          {document.title} · {document.text.length.toLocaleString()} characters ready
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button type="button" disabled={intakeBusy || architectBusy || (!architectDocuments.length && !sourceNotes.trim())} onClick={() => void runArchitect()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-deep-ink)] px-3 py-2 text-sm font-medium disabled:opacity-50">
                      <Sparkles className="h-4 w-4" /> {intakeBusy ? 'Reading documents…' : architectBusy ? 'Building proposals…' : 'Build evidence proposals'}
                    </button>
                    {architectReviewCount ? <span className="text-xs text-[var(--color-graphite)]">{architectReviewCount} review cards ready</span> : null}
                  </div>
                  {intakeWarnings.length > 0 && <ul role="status" className="mt-3 space-y-1 text-xs text-amber-800">{intakeWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
                  {architectCapsuleId && <Link href={`/app/capsules?starter=${encodeURIComponent(architectCapsuleId)}&lane=inspect`} className="mt-3 inline-flex min-h-11 items-center rounded-md bg-[var(--color-praxis-emerald-700)] px-3 text-sm font-semibold text-white">Inspect and review your capsule</Link>}
                  <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]">Proposals need your review. Extraction does not verify a claim.</p>
                </section>
                <button type="button" onClick={() => setActiveStep('eval')} className="min-h-11 rounded-md bg-[var(--color-praxis-emerald-700)] px-4 text-sm font-semibold text-white">Continue to review and save</button>
              </div>
            )}

            {activeStep === 'sources' && (
              <div className="space-y-4">
                <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">These preferences are saved in your private capsule and guide analysis. They do not verify sources or guarantee enforced domain filtering; the current question and approved tools take precedence.</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm font-medium">
                    Sourcing mode
                    <select
                      value={capsule.sourcing.mode}
                      onChange={(event) => patchCapsule({
                        sourcing: { mode: event.target.value as ContextCapsule['sourcing']['mode'] },
                        retrieval: { mode: event.target.value as ContextCapsule['retrieval']['mode'] },
                      })}
                      className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                    >
                      {['live-search', 'corpus', 'skc', 'hybrid'].map((mode) => <option key={mode}>{mode}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Min sources per claim
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={capsule.sourcing.minSourcesPerClaim}
                      onChange={(event) => patchCapsule({ sourcing: { minSourcesPerClaim: Number(event.target.value) } })}
                      className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
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
                      className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Preferred source domains (comma separated)
                  <input
                    value={allowedDomains}
                    onChange={(event) => {
                      setAllowedDomains(event.target.value);
                      patchCapsule({ sourcing: { allowedDomains: csv(event.target.value) } });
                    }}
                    className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Avoided source domains (comma separated)
                  <input
                    value={blockedDomains}
                    onChange={(event) => {
                      setBlockedDomains(event.target.value);
                      patchCapsule({ sourcing: { blockedDomains: csv(event.target.value) } });
                    }}
                    className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                  />
                </label>
                <button type="button" onClick={() => runAssist('sources')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-deep-ink)] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Suggest sources
                </button>
              </div>
            )}

            {activeStep === 'grounding' && (
              <div className="space-y-5">
                <p role="note" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Package-only advisory settings. Timeline, causal, ontology and graph fields below are not saved as private capsule facts by Save draft. To add factual context, use Material and review its evidence proposals. Package publication is a separate advanced workflow.</p>
                <div className="grid gap-4 lg:grid-cols-3">
                  <section className="rounded-md border border-[var(--color-mineral)] bg-white p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-deep-ink)]">
                      <CalendarClock className="h-4 w-4" />
                      Timeline anchors
                    </div>
                    <label className="block text-xs font-semibold text-[var(--color-graphite)]">
                      Anchor label
                      <input
                        value={capsule.temporality.timelineAnchors[0]?.label ?? ''}
                        onChange={(event) => patchTimelineAnchor({ label: event.target.value })}
                        className="mt-1 w-full border border-[var(--color-mineral)] bg-white p-2 text-sm text-[var(--color-deep-ink)]"
                      />
                    </label>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <label className="block text-xs font-semibold text-[var(--color-graphite)]">
                        Date
                        <input
                          type="date"
                          value={capsule.temporality.timelineAnchors[0]?.date ?? ''}
                          onChange={(event) => patchTimelineAnchor({ date: event.target.value })}
                          className="mt-1 w-full border border-[var(--color-mineral)] bg-white p-2 text-sm text-[var(--color-deep-ink)]"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[var(--color-graphite)]">
                        Kind
                        <select
                          value={capsule.temporality.timelineAnchors[0]?.kind ?? 'review'}
                          onChange={(event) => patchTimelineAnchor({ kind: event.target.value as ContextCapsule['temporality']['timelineAnchors'][number]['kind'] })}
                          className="mt-1 w-full border border-[var(--color-mineral)] bg-white p-2 text-sm text-[var(--color-deep-ink)]"
                        >
                          {['as-of', 'event', 'deadline', 'review', 'validity-start', 'validity-end'].map((kind) => <option key={kind}>{kind}</option>)}
                        </select>
                      </label>
                    </div>
                  </section>

                  <section className="rounded-md border border-[var(--color-mineral)] bg-white p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-deep-ink)]">
                      <GitBranch className="h-4 w-4" />
                      Causal link
                    </div>
                    <label className="block text-xs font-semibold text-[var(--color-graphite)]">
                      Cause
                      <input
                        value={capsule.causality.causalLinks[0]?.cause ?? ''}
                        onChange={(event) => patchCausalLink({ cause: event.target.value })}
                        className="mt-1 w-full border border-[var(--color-mineral)] bg-white p-2 text-sm text-[var(--color-deep-ink)]"
                      />
                    </label>
                    <label className="mt-3 block text-xs font-semibold text-[var(--color-graphite)]">
                      Effect
                      <input
                        value={capsule.causality.causalLinks[0]?.effect ?? ''}
                        onChange={(event) => patchCausalLink({ effect: event.target.value })}
                        className="mt-1 w-full border border-[var(--color-mineral)] bg-white p-2 text-sm text-[var(--color-deep-ink)]"
                      />
                    </label>
                    <label className="mt-3 block text-xs font-semibold text-[var(--color-graphite)]">
                      Relation
                      <select
                        value={capsule.causality.causalLinks[0]?.relation ?? 'causes'}
                        onChange={(event) => patchCausalLink({ relation: event.target.value as ContextCapsule['causality']['causalLinks'][number]['relation'] })}
                        className="mt-1 w-full border border-[var(--color-mineral)] bg-white p-2 text-sm text-[var(--color-deep-ink)]"
                      >
                        {['causes', 'enables', 'blocks', 'escalates', 'de-escalates', 'correlates'].map((relation) => <option key={relation}>{relation}</option>)}
                      </select>
                    </label>
                  </section>

                  <section className="rounded-md border border-[var(--color-mineral)] bg-white p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-deep-ink)]">
                      <Network className="h-4 w-4" />
                      Domain taxonomy
                    </div>
                    <label className="block text-xs font-semibold text-[var(--color-graphite)]">
                      Capsule domain
                      <select
                        value={capsule.ontologyBinding.domainId}
                        onChange={(event) => setDomainBinding(event.target.value)}
                        className="mt-1 w-full border border-[var(--color-mineral)] bg-white p-2 text-sm text-[var(--color-deep-ink)]"
                      >
                        {DOMAIN_OPTIONS.map((domain) => <option key={domain}>{domain}</option>)}
                      </select>
                    </label>
                    <label className="mt-3 block text-xs font-semibold text-[var(--color-graphite)]">
                      Binding rationale
                      <textarea
                        value={capsule.ontologyBinding.bindingRationale}
                        onChange={(event) => patchCapsule({ ontologyBinding: { bindingRationale: event.target.value } })}
                        className="mt-1 min-h-24 w-full border border-[var(--color-mineral)] bg-white p-2 text-sm text-[var(--color-deep-ink)]"
                      />
                    </label>
                  </section>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-md border border-[var(--color-mineral)] bg-white p-3">
                    <p className="mb-3 text-sm font-semibold text-[var(--color-deep-ink)]">Ontology bindings</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ONTOLOGY_IDS.map((ontologyId) => (
                        <label key={ontologyId} className="flex items-center gap-2 border border-[#ebe4d8] px-2 py-1.5 text-xs text-[var(--color-graphite)]">
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

                  <section className="rounded-md border border-[var(--color-mineral)] bg-white p-3">
                    <p className="mb-3 text-sm font-semibold text-[var(--color-deep-ink)]">ACO primitives</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {TACITUS_CORE_PRIMITIVES.map((primitive) => (
                        <label key={primitive} className="flex items-center gap-2 border border-[#ebe4d8] px-2 py-1.5 text-xs text-[var(--color-graphite)]">
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

                <div className="rounded-md border border-[var(--color-mineral)] bg-[#f8f3e8] p-3 text-sm text-[var(--color-graphite)]">
                  <p className="font-semibold text-[var(--color-deep-ink)]">embeddedGraph: GraphLite advisory projection</p>
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
                    className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                  >
                    {['brief', 'markdown', 'report', 'json'].map((format) => <option key={format}>{format}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => runAssist('output-schema')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-deep-ink)] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Tighten output schema
                </button>
              </div>
            )}

            {activeStep === 'tools' && (
              <div className="space-y-4">
                <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">Saved tool preferences are suggestions. Automatic policy does not grant permission to run research or publish; actual run approvals and the current question control execution.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <label key={tool} className="flex items-center gap-3 border border-[var(--color-mineral)] p-3 text-sm">
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
                    className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                  >
                    {['suggest', 'manual', 'auto'].map((policy) => <option key={policy}>{policy}</option>)}
                  </select>
                </label>
              </div>
            )}

            {activeStep === 'eval' && (
              <div className="space-y-4">
                <div className="rounded-md border border-[var(--color-mineral)] bg-white p-4 text-sm text-[var(--color-graphite)]">
                  <p className="font-semibold text-[var(--color-deep-ink)]">{job || 'Add a purpose before saving.'}</p>
                  <p className="mt-2">{architectDocuments.length} uploaded source{architectDocuments.length === 1 ? '' : 's'}{sourceNotes.trim() ? ' and working notes' : ''}. {architectReviewCount} proposal{architectReviewCount === 1 ? '' : 's'} prepared.</p>
                  <p className="mt-2">Save keeps your purpose, output, source and tool preferences, and supplied document references privately. Sources and generated proposals still need review.</p>
                </div>
                <label className="block text-sm font-medium">Preferred written product
                  <select value={capsule.output.format} onChange={(event) => patchCapsule({ output: outputFor(event.target.value as ContextCapsule['output']['format']) })} className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm">
                    <option value="brief">Decision brief</option><option value="report">Analytical report</option><option value="markdown">Working document</option><option value="json">Structured data</option>
                  </select>
                </label>
                <details className="rounded-lg border border-[var(--color-mineral)] p-3">
                  <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Example questions and structure checks</summary>
                  <label className="mt-3 block text-sm font-medium">
                  Sample questions
                  <textarea
                    value={sampleQuestions}
                    onChange={(event) => setSampleQuestions(event.target.value)}
                    className="mt-2 min-h-32 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runStructuralCheck}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-deep-ink)] px-3 py-2 text-sm font-medium"
                  >
                    <Check className="h-4 w-4" /> Check draft structure
                  </button>
                  <button type="button" onClick={() => runAssist('few-shot')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-deep-ink)] px-3 py-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4" /> Generate few-shot examples
                  </button>
                </div>
                {evalSummary ? <p className="text-sm text-[var(--color-graphite)]">{evalSummary}</p> : null}
                  <Link href="/app" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Test questions in Ask PRAXIS</Link>
                </details>
                {architectCapsuleId ? <Link href={`/app/capsules?starter=${encodeURIComponent(architectCapsuleId)}&lane=inspect`} className="inline-flex min-h-11 items-center text-sm font-semibold underline">Inspect sources and review proposals</Link> : null}
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
                      className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                    >
                      {['private', 'org', 'unlisted', 'public'].map((visibility) => <option key={visibility}>{visibility}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Pricing
                    <select
                      value={capsule.market.pricing}
                      onChange={(event) => patchCapsule({ market: { pricing: event.target.value as ContextCapsule['market']['pricing'] } })}
                      className="mt-2 w-full border border-[var(--color-mineral)] bg-white p-3 text-sm"
                    >
                      {['free', 'credits', 'subscription'].map((pricing) => <option key={pricing}>{pricing}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" disabled={saveState === 'saving' || saveState === 'publishing'} onClick={() => void publish()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--color-deep-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    <Rocket className="h-4 w-4" /> Publish capsule
                  </button>
                </div>
                <p className="text-xs text-[var(--color-graphite)]">Publishing creates a separate immutable package after its server-side evaluation gate passes. Save your private working capsule below to reuse it in Ask.</p>
              </div>
            )}
          </div>
        )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-mineral)] pt-4">
          {activeIndex > 0 && !advanced ? <button type="button" onClick={() => setActiveStep(visibleSteps[activeIndex - 1].id)} className="inline-flex min-h-11 items-center rounded-lg border border-[var(--color-mineral)] px-4 text-sm font-medium">Back</button> : null}
          <button type="button" disabled={intakeBusy || architectBusy || saveState === 'saving' || saveState === 'publishing' || !job.trim()} onClick={() => void saveDraft()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-deep-ink)] px-4 py-2 text-sm font-semibold disabled:opacity-50">
            <FileJson className="h-4 w-4" /> {saveState === 'saving' ? 'Saving...' : 'Save draft'}
          </button>
          <button type="button" disabled={intakeBusy || architectBusy || saveState === 'saving' || saveState === 'publishing' || !job.trim()} onClick={() => void saveAndUse()} className="inline-flex min-h-11 items-center rounded-md bg-[var(--color-praxis-emerald-700)] px-4 text-sm font-semibold text-white disabled:opacity-50">{savedCapsuleId && !hasUnsavedChanges ? 'Use in chat' : 'Save and use in chat'}</button>
          {savedCapsuleId ? <>
            <Link href={`/app/capsules?starter=${encodeURIComponent(savedCapsuleId)}&lane=inspect`} className="text-sm underline">View saved capsule</Link>
          </> : <p className="text-xs text-[var(--color-graphite)]">Save privately to keep your purpose, output preferences and supplied sources together.</p>}
          {hasUnsavedChanges ? <p role="status" className="text-sm font-semibold text-amber-800">Unsaved changes. Use in chat will save the current draft first.</p> : savedCapsuleId ? <p role="status" className="text-xs text-emerald-800">Private snapshot saved.</p> : null}
        </div>

        {message && (
          <p role="status" className={`border px-4 py-3 text-sm ${
            saveState === 'error' ? 'border-[#b65d45] bg-[#fff4ef] text-[#8a3d2c]' : 'border-[var(--color-mineral)] bg-[var(--color-archive-paper-strong)] text-[var(--color-graphite)]'
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

function humanizeId(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
