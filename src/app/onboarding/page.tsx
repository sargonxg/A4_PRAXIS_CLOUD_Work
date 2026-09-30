'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { DEFAULT_ANALYST_PROFILE, type AnalystProfile } from '@/types/analyst-profile';
import { loadAnalystProfile, initAnalystProfileIfMissing } from '@/lib/firebase/analyst-profile-service';
import { StepIdentity } from './step-identity';
import { StepPerspective } from './step-perspective';
import { StepWorkingStyle } from './step-working-style';
import { CompletionSuccess } from './completion-success';
import { LivePreview } from './live-preview';
import { cn } from '@/lib/utils/cn';
import { resolveOnboardingReturnTarget, safeWorkspaceReturnTarget } from '@/lib/auth/post-login-redirect';

type Step = 1 | 2 | 3 | 4;
type ProfileScope = { ownerId: string | null };

export default function OnboardingPage() {
  // Next.js 16 requires useSearchParams() callers to live inside a <Suspense>
  // boundary so static page generation can stream search-param-dependent UI.
  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  );
}

function OnboardingWizard() {
  const searchParams = useSearchParams();
  const resumeMode = searchParams.get('resume') === '1' || searchParams.get('edit') === '1';
  const returnTarget = resolveOnboardingReturnTarget(searchParams);
  const explicitReturnTarget = safeWorkspaceReturnTarget(searchParams.get('redirect'));
  const { user, loading: authLoading } = useAuth();
  const ownerId = user?.id ?? null;
  const scopeRef = useRef<ProfileScope>({ ownerId });
  if (scopeRef.current.ownerId !== ownerId) scopeRef.current = { ownerId };
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<AnalystProfile>(DEFAULT_ANALYST_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialization, setInitialization] = useState<{ scope: ProfileScope | null; ready: boolean; error: string | null }>({ scope: null, ready: false, error: null });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [terminalPending, setTerminalPending] = useState(false);
  const terminalScope = useRef<ProfileScope | null>(null);
  const failedPatch = useRef<Partial<AnalystProfile> | null>(null);
  const saveQueue = useRef<{ scope: ProfileScope | null; promise: Promise<void>; pending: number }>({ scope: null, promise: Promise.resolve(), pending: 0 });
  const requests = useRef(new Set<AbortController>());
  const profileReady = !authLoading && Boolean(ownerId) && initialization.scope === scopeRef.current && initialization.ready;
  const stepBlocked = saving || terminalPending || Boolean(saveError);

  useEffect(() => {
    if (!ownerId) return;
    const scope = scopeRef.current;
    const activeRequests = requests.current;
    const controller = new AbortController();
    let cancelled = false;
    const current = () => !cancelled && scopeRef.current === scope && !controller.signal.aborted;
    setInitialization({ scope, ready: false, error: null });
    setStep(1); setSaving(false); setTerminalPending(false); setSaveError(null);
    saveQueue.current = { scope, promise: Promise.resolve(), pending: 0 };
    terminalScope.current = null;
    failedPatch.current = null;
    const timeout = setTimeout(() => {
      controller.abort();
      if (!cancelled && scopeRef.current === scope) setInitialization({ scope, ready: false, error: 'Could not load your analyst profile. Please retry.' });
    }, 30000);
    void (async () => {
      try {
      let p = await loadAnalystProfile(ownerId);
      if (!current()) return;
      if (!p) p = await initAnalystProfileIfMissing(ownerId);
      if (!current()) return;
      // resume=1 (from Settings → Review onboarding) always seeds from the
      // canonical profile, skipping any stale draft.
      if (!resumeMode) {
        try {
          const draftRes = await fetch('/api/onboarding/draft', { signal: controller.signal });
          if (draftRes.ok) {
            const draft = await draftRes.json();
            if (draft && typeof draft === 'object' && 'identity' in draft) {
              p = { ...p, ...(draft as Partial<AnalystProfile>) };
            }
          }
        } catch {
          // draft fetch is best-effort; fall through to profile
        }
      }
      if (current()) {
        setProfile(p);
        setInitialization({ scope, ready: true, error: null });
      }
      } catch {
        if (current()) setInitialization({ scope, ready: false, error: 'Could not load your analyst profile. Please retry.' });
      } finally { clearTimeout(timeout); }
    })();
    return () => {
      cancelled = true; controller.abort(); clearTimeout(timeout);
      for (const request of activeRequests) request.abort();
      if (scopeRef.current === scope) scopeRef.current = { ownerId: scope.ownerId };
    };
  }, [ownerId, resumeMode, loadAttempt]);

  function beginRequest() {
    const controller = new AbortController();
    requests.current.add(controller);
    const timeout = setTimeout(() => controller.abort(), 30000);
    return { signal: controller.signal, finish: () => { clearTimeout(timeout); requests.current.delete(controller); } };
  }

  async function savePatch(patch: Partial<AnalystProfile>) {
    const scope = scopeRef.current;
    if (!profileReady || scope.ownerId !== ownerId || terminalScope.current === scope) return;
    // Keep controlled inputs responsive; serialize persistence so earlier keystrokes
    // cannot overwrite the latest profile. Responses never replace local edits.
    setProfile(prev => ({ ...prev, ...patch } as AnalystProfile));
    const queue = saveQueue.current;
    queue.pending += 1;
    setSaving(true);
    setSaveError(null);
    queue.promise = queue.promise.catch(() => {}).then(async () => {
      if (scopeRef.current !== scope) return;
      const request = beginRequest();
      try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'PATCH',
        signal: request.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (scopeRef.current !== scope) return;
      if (!res.ok) {
        failedPatch.current = patch;
        setSaveError('Could not save — retry this edit before moving to another step.');
        return;
      }
      if (queue.pending === 1) { failedPatch.current = null; setSaveError(null); }
      // Keep the optional recovery draft in the same order as canonical saves.
      await fetch('/api/onboarding/draft', {
        method: 'PATCH',
        signal: request.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch(() => { /* draft is non-critical */ });
      } catch {
        if (scopeRef.current === scope) { failedPatch.current = patch; setSaveError('Network error — please check your connection and retry your edit.'); }
      } finally { request.finish(); }
    });
    try { await queue.promise; } finally {
      queue.pending -= 1;
      if (scopeRef.current === scope && saveQueue.current === queue) setSaving(queue.pending > 0);
    }
  }

  function beginTerminalAction() {
    const scope = scopeRef.current;
    if (!profileReady || scope.ownerId !== ownerId || saveQueue.current.pending || terminalScope.current === scope) return null;
    terminalScope.current = scope; setTerminalPending(true); setSaveError(null);
    return scope;
  }
  function finishTerminalAction(scope: ProfileScope) {
    if (scopeRef.current === scope) { terminalScope.current = null; setTerminalPending(false); }
  }

  async function skipForLater() {
    const scope = beginTerminalAction();
    if (!scope) return;
    const request = beginRequest();
    try {
      const res = await fetch('/api/onboarding/skip', { method: 'POST', signal: request.signal });
      if (scopeRef.current !== scope) return;
      if (!res.ok) {
        setSaveError('Could not save this reminder - please try again.');
        return;
      }
      window.location.assign(returnTarget);
    } catch {
      if (scopeRef.current === scope) setSaveError('Network error saving the reminder - please try again.');
    } finally { request.finish(); finishTerminalAction(scope); }
  }

  async function complete(createFirstSituation: boolean) {
    if (saving) return;
    const scope = beginTerminalAction();
    if (!scope) return;
    const request = beginRequest();
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        signal: request.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createFirstSituation, redirect: explicitReturnTarget }),
      });
      if (scopeRef.current !== scope) return;
      if (!res.ok) {
        if (res.status === 400) {
          setSaveError('Profile incomplete — please review steps 1-3 (mandate ≥30 chars, ≥1 region, audience set).');
          setStep(2);
        } else if (res.status === 401 || res.status === 403) {
          setSaveError('Session expired — please sign in again.');
        } else {
          setSaveError('Could not finish onboarding — please retry.');
        }
        return;
      }
      void fetch('/api/onboarding/draft', { method: 'DELETE' }).catch(() => { /* non-critical */ });
      const { redirectTo } = await res.json();
      // Route Handler cookies do not invalidate prefetched client redirects.
      // Cross this changed auth boundary with a fresh document request.
      if (scopeRef.current === scope) window.location.assign(safeWorkspaceReturnTarget(redirectTo) ?? returnTarget);
    } catch {
      if (scopeRef.current === scope) setSaveError('Network error finishing onboarding — please retry.');
    } finally { request.finish(); finishTerminalAction(scope); }
  }

  return (
    <div className="app-light praxis-app-surface min-h-screen px-4 py-6 text-[color:var(--color-app-text)] sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      {resumeMode && (
        <Link
          href="/app/settings?tab=profile"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[var(--color-graphite)] underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to profile settings
        </Link>
      )}
      <div className="grid gap-5">
        <div>
          <Header step={step} onSkip={skipForLater} resumeMode={resumeMode} busy={!profileReady || saving || terminalPending} />
          <div className="praxis-shell-card mt-5 p-5 sm:p-6">
            <h2 className="sr-only">{['About you', 'Your work', 'Writing style', 'Ready'][step - 1]}</h2>
            {!profileReady ? <div aria-live="polite">
              {initialization.scope === scopeRef.current && initialization.error ? <><p role="alert" className="text-sm text-red-700">{initialization.error}</p><button type="button" disabled={authLoading || !ownerId} onClick={() => setLoadAttempt(attempt => attempt + 1)} className="mt-3 min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Retry loading profile</button></>
                : <p role="status" className="text-sm text-slate-600">{!authLoading && !ownerId ? <>Sign in to set up your analyst profile. <Link href={`/login?redirect=${encodeURIComponent(returnTarget)}`} className="underline">Sign in</Link></> : 'Preparing your analyst profile…'}</p>}
            </div> : <fieldset disabled={terminalPending} className="min-w-0 border-0 p-0">
            {saveError && (
              <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                {saveError}
                {failedPatch.current ? <button type="button" disabled={saving || terminalPending} onClick={() => { if (failedPatch.current) void savePatch(failedPatch.current); }} className="ml-2 min-h-11 font-semibold underline disabled:opacity-50">Retry saving changes</button> : null}
              </div>
            )}
            {step === 1 && (
              <StepIdentity
                profile={profile}
                onChange={(patch) => savePatch(patch)}
                onNext={() => { if (!stepBlocked) setStep(2); }}
                saving={stepBlocked}
              />
            )}
            {step === 2 && (
              <StepPerspective
                profile={profile}
                onChange={(patch) => savePatch(patch)}
                onNext={() => { if (!stepBlocked) setStep(3); }}
                onBack={() => { if (!stepBlocked) setStep(1); }}
                saving={stepBlocked}
              />
            )}
            {step === 3 && (
              <StepWorkingStyle
                profile={profile}
                onChange={(patch) => savePatch(patch)}
                onNext={() => { if (!stepBlocked) setStep(4); }}
                onBack={() => { if (!stepBlocked) setStep(2); }}
                saving={stepBlocked}
              />
            )}
            {step === 4 && (
              <>
                <CompletionSuccess
                  profile={profile}
                  onComplete={complete}
                />
                <p className="mt-4 text-xs leading-5 text-slate-600">
                  Add a capsule later to reuse sources and reviewed background.
                </p>
              </>
            )}
            </fieldset>}
          </div>
        </div>
        {profileReady ? <details className="rounded-lg border border-[var(--color-mineral)] bg-white p-4">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Preview the context your profile adds</summary>
          <div className="mt-3"><LivePreview profile={profile} /></div>
        </details> : null}
      </div>
    </div>
    </div>
  );
}

function Header({ step, onSkip, resumeMode, busy }: { step: Step; onSkip: () => void; resumeMode: boolean; busy: boolean }) {
  const steps = ['About you', 'Your work', 'Writing style', 'Ready'];
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {resumeMode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Review mode
            </span>
          )}
        </div>
        <h1 className="praxis-page-heading mt-1 font-serif text-3xl font-semibold">
          {resumeMode ? 'Your working preferences' : 'Make PRAXIS yours'}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-navy-500">
          Tell PRAXIS who you write for and what matters. You can start chatting now and finish this later.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-wider">
          {steps.map((s, i) => (
            <span key={s} className={cn('rounded-[var(--radius-full)] px-3 py-1', i + 1 <= step ? 'bg-diplomatic-blue text-white' : 'bg-navy-100 text-navy-500')}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </div>
      {!resumeMode && step < 4 && (
        <button
          disabled={busy}
          onClick={onSkip}
          type="button" className="min-h-11 shrink-0 rounded-lg border border-[var(--color-mineral)] bg-white px-3 text-sm font-semibold text-[var(--color-deep-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-praxis-emerald-600)]"
        >
          Finish later
        </button>
      )}
    </div>
  );
}
