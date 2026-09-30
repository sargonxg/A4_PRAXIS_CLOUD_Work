'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeMode = searchParams.get('resume') === '1' || searchParams.get('edit') === '1';
  const returnTarget = resolveOnboardingReturnTarget(searchParams);
  const explicitReturnTarget = safeWorkspaceReturnTarget(searchParams.get('redirect'));
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<AnalystProfile>(DEFAULT_ANALYST_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      let p = await loadAnalystProfile(user.id);
      if (!p) p = await initAnalystProfileIfMissing(user.id);
      // resume=1 (from Settings → Review onboarding) always seeds from the
      // canonical profile, skipping any stale draft.
      if (!resumeMode) {
        try {
          const draftRes = await fetch('/api/onboarding/draft');
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
      setProfile(p);
    })();
  }, [user?.id, resumeMode]);

  const savePatch = useCallback(async (patch: Partial<AnalystProfile>) => {
    if (!user?.id) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setSaveError('Could not save — please try again.');
        return;
      }
      setProfile(prev => ({ ...prev, ...patch } as AnalystProfile));
      // Mirror to draft for resume-on-refresh recovery. Best-effort, fire-and-forget.
      void fetch('/api/onboarding/draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch(() => { /* draft is non-critical */ });
    } catch {
      setSaveError('Network error — please check your connection.');
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  const skipForLater = useCallback(async () => {
    setSaveError(null);
    try {
      const res = await fetch('/api/onboarding/skip', { method: 'POST' });
      if (!res.ok) {
        setSaveError('Could not save this reminder - please try again.');
        return;
      }
      window.location.assign(returnTarget);
    } catch {
      setSaveError('Network error saving the reminder - please try again.');
    }
  }, [returnTarget]);

  const complete = useCallback(async (createFirstSituation: boolean) => {
    setSaveError(null);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createFirstSituation, redirect: explicitReturnTarget }),
      });
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
      router.push(safeWorkspaceReturnTarget(redirectTo) ?? returnTarget);
    } catch {
      setSaveError('Network error finishing onboarding — please retry.');
    }
  }, [router, explicitReturnTarget, returnTarget]);

  return (
    <div className="app-light praxis-app-surface min-h-screen px-4 py-6 text-[color:var(--color-app-text)] sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {resumeMode && (
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-xs font-medium text-navy-500 hover:text-navy-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to profile settings
        </Link>
      )}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <Header step={step} onSkip={skipForLater} resumeMode={resumeMode} />
          <div className="praxis-shell-card mt-5 p-5 sm:p-6">
            {saveError && (
              <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                {saveError}
              </div>
            )}
            {step === 1 && (
              <StepIdentity
                profile={profile}
                onChange={(patch) => savePatch(patch)}
                onNext={() => setStep(2)}
                saving={saving}
              />
            )}
            {step === 2 && (
              <StepPerspective
                profile={profile}
                onChange={(patch) => savePatch(patch)}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
                saving={saving}
              />
            )}
            {step === 3 && (
              <StepWorkingStyle
                profile={profile}
                onChange={(patch) => savePatch(patch)}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
                saving={saving}
              />
            )}
            {step === 4 && (
              <>
                <CompletionSuccess
                  profile={profile}
                  onComplete={complete}
                />
                <p className="mt-4 text-xs leading-5 text-slate-600">
                  Your analyst profile helps PRAXIS adapt to your mandate and audience.
                  Add a Context Capsule when you want to reuse reviewed background,
                  sources and methods across questions or written products.
                </p>
              </>
            )}
          </div>
        </div>
        <aside>
          <LivePreview profile={profile} />
        </aside>
      </div>
    </div>
    </div>
  );
}

function Header({ step, onSkip, resumeMode }: { step: Step; onSkip: () => void; resumeMode: boolean }) {
  const steps = ['Identity', 'Perspective', 'Working Style', 'Done'];
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
        <h2 className="praxis-text-title mt-1">
          {resumeMode ? 'Review your analyst profile' : 'Set up your analyst profile'}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-navy-500">
          First sign-in may ask for analyst calibration. Finish later opens the workspace now and keeps profile reminders visible.
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
          onClick={onSkip}
          className="rounded-[var(--radius-md)] text-xs text-navy-500 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-2"
        >
          Finish later
        </button>
      )}
    </div>
  );
}
