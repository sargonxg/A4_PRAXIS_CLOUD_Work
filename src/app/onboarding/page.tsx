'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { DEFAULT_ANALYST_PROFILE, type AnalystProfile } from '@/types/analyst-profile';
import { loadAnalystProfile, initAnalystProfileIfMissing } from '@/lib/firebase/analyst-profile-service';
import { StepIdentity } from './step-identity';
import { StepPerspective } from './step-perspective';
import { StepWorkingStyle } from './step-working-style';
import { CompletionSuccess } from './completion-success';
import { LivePreview } from './live-preview';
import { cn } from '@/lib/utils/cn';

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeMode = searchParams.get('resume') === '1';
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
    await fetch('/api/onboarding/skip', { method: 'POST' });
    router.push('/app/dashboard');
  }, [router]);

  const complete = useCallback(async (createFirstSituation: boolean) => {
    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createFirstSituation }),
    });
    if (!res.ok) return;
    // Drop the draft — canonical profile now has everything.
    void fetch('/api/onboarding/draft', { method: 'DELETE' }).catch(() => { /* non-critical */ });
    const { redirectTo } = await res.json();
    router.push(redirectTo);
  }, [router]);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <Header step={step} onSkip={skipForLater} />
        <div className="mt-6 rounded-xl border border-navy-200 bg-white p-6 shadow-sm sm:p-8">
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
            <CompletionSuccess
              profile={profile}
              onComplete={complete}
            />
          )}
        </div>
      </div>
      <aside>
        <LivePreview profile={profile} />
      </aside>
    </div>
  );
}

function Header({ step, onSkip }: { step: Step; onSkip: () => void }) {
  const steps = ['Identity', 'Perspective', 'Working Style', 'Done'];
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-navy-900">Set up your analyst profile</h2>
        <p className="mt-1 text-sm text-navy-500">Three quick screens. Calibrates every PRAXIS tool to your work.</p>
        <div className="mt-4 flex gap-2 text-[11px] font-medium uppercase tracking-wider">
          {steps.map((s, i) => (
            <span key={s} className={cn('rounded-full px-3 py-1', i + 1 <= step ? 'bg-gold-500 text-white' : 'bg-navy-100 text-navy-500')}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </div>
      {step < 4 && (
        <button
          onClick={onSkip}
          className="rounded-md text-xs text-navy-500 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-2"
        >
          Finish later
        </button>
      )}
    </div>
  );
}
