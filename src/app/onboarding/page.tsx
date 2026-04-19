'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<AnalystProfile>(DEFAULT_ANALYST_PROFILE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      let p = await loadAnalystProfile(user.id);
      if (!p) p = await initAnalystProfileIfMissing(user.id);
      setProfile(p);
    })();
  }, [user?.id]);

  const savePatch = useCallback(async (patch: Partial<AnalystProfile>) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await fetch('/api/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      setProfile(prev => ({ ...prev, ...patch } as AnalystProfile));
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  const skipForLater = useCallback(async () => {
    await fetch('/api/onboarding/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: { skipCount: (profile.meta?.skipCount ?? 0) + 1 } }),
    });
    router.push('/app/dashboard');
  }, [profile.meta?.skipCount, router]);

  const complete = useCallback(async (createFirstSituation: boolean) => {
    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createFirstSituation }),
    });
    if (!res.ok) return;
    const { redirectTo } = await res.json();
    router.push(redirectTo);
  }, [router]);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <Header step={step} onSkip={skipForLater} />
        <div className="mt-6 rounded-xl border border-navy-200 bg-white p-6 shadow-sm sm:p-8">
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
        <button onClick={onSkip} className="text-xs text-navy-500 hover:text-navy-800">
          Finish later
        </button>
      )}
    </div>
  );
}
