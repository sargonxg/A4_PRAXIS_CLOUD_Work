'use client';

/**
 * /app/settings/profile — Analyst Profile editor.
 *
 * Reuses the same 3-screen components as the onboarding wizard
 * (Identity, Perspective, Working style) so the edit experience is
 * byte-for-byte identical to the capture experience. Users can change
 * any field any time. Each save bumps `meta.version` and writes an
 * immutable snapshot to `users/{uid}/profile_versions/v{N}`.
 *
 * Spec: docs/superpowers/specs/2026-04-19-generic-route-production-readiness-design.md §9
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Languages,
  Loader2,
  Compass,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DEFAULT_ANALYST_PROFILE,
  type AnalystProfile,
  isProfileComplete,
} from '@/types/analyst-profile';
import {
  loadAnalystProfile,
  initAnalystProfileIfMissing,
} from '@/lib/firebase/analyst-profile-service';
import { StepIdentity } from '@/app/onboarding/step-identity';
import { StepPerspective } from '@/app/onboarding/step-perspective';
import { StepWorkingStyle } from '@/app/onboarding/step-working-style';
import { LivePreview } from '@/app/onboarding/live-preview';
import { PraxisLink } from '@/components/shared/praxis-link';
import { DangerZone } from '@/components/settings/danger-zone';
import { cn } from '@/lib/utils/cn';

type Tab = 'identity' | 'perspective' | 'working-style';

const TABS: Array<{ id: Tab; label: string; icon: typeof UserIcon; description: string }> = [
  {
    id: 'identity',
    label: 'Identity',
    icon: UserIcon,
    description: 'Role, seniority, organisation',
  },
  {
    id: 'perspective',
    label: 'Perspective',
    icon: Compass,
    description: 'Domain, mandate, lenses, regions, audience',
  },
  {
    id: 'working-style',
    label: 'Working style',
    icon: Languages,
    description: 'Sources, language, red lines, analytical style',
  },
];

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AnalystProfile>(DEFAULT_ANALYST_PROFILE);
  const [tab, setTab] = useState<Tab>('perspective');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let p = await loadAnalystProfile(user.id);
      if (!p) p = await initAnalystProfileIfMissing(user.id);
      if (cancelled) return;
      setProfile(p);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const savePatch = useCallback(
    async (patch: Partial<AnalystProfile>) => {
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
        setProfile((prev) => ({ ...prev, ...patch } as AnalystProfile));
        setSavedAt(Date.now());
      } catch {
        setSaveError('Network error — please check your connection.');
      } finally {
        setSaving(false);
      }
    },
    [user?.id],
  );

  const isComplete = isProfileComplete(profile);

  if (user?.isDemo) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 text-sm text-navy-800">
        <p className="font-semibold text-gold-700">Demo mode</p>
        <p className="mt-2 text-navy-600">
          Demo users use a shared analyst profile. Sign in with a real account to edit your own.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-navy-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your profile…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Breadcrumb + header */}
      <div>
        <PraxisLink
          href="/settings"
          className="mb-2 inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3 w-3" /> Back to settings
        </PraxisLink>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">User Core profile</h1>
            <p className="mt-1 max-w-xl text-sm text-navy-500">
              PRAXIS calibrates every tool output to this profile. Change it any time — the next
              tool run picks up your edits automatically.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 rounded-full border border-navy-200 bg-white px-3 py-1 text-[11px]">
              <span className="text-navy-500">Profile version</span>
              <span className="font-semibold text-navy-900">v{profile.meta?.version ?? 0}</span>
            </div>
            {isComplete ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                Incomplete
              </span>
            )}
            <a
              href="/onboarding?resume=1"
              className="text-[11px] text-diplomatic-blue underline underline-offset-2 hover:text-diplomatic-blue/80"
            >
              Review onboarding
            </a>
          </div>
        </div>
      </div>

      {/* Save state banner */}
      {saveError && (
        <div role="alert" className="rounded-lg border border-crimson/30 bg-crimson/5 px-4 py-2 text-xs text-crimson">
          {saveError}
        </div>
      )}

      {/* Tabs + two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <nav
            className="mb-4 flex gap-1 rounded-lg border border-navy-200 bg-white p-1"
            role="tablist"
            aria-label="Profile sections"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
                    active
                      ? 'bg-diplomatic-blue text-white shadow-sm'
                      : 'text-navy-600 hover:bg-navy-50',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="rounded-xl border border-navy-200 bg-white p-6 shadow-sm">
            {tab === 'identity' && (
              <StepIdentity
                profile={profile}
                onChange={savePatch}
                onNext={() => setTab('perspective')}
                saving={saving}
              />
            )}
            {tab === 'perspective' && (
              <StepPerspective
                profile={profile}
                onChange={savePatch}
                onNext={() => setTab('working-style')}
                onBack={() => setTab('identity')}
                saving={saving}
              />
            )}
            {tab === 'working-style' && (
              <StepWorkingStyle
                profile={profile}
                onChange={savePatch}
                onBack={() => setTab('perspective')}
                onNext={() => {
                  /* no-op in edit mode; changes already save per field */
                }}
                saving={saving}
              />
            )}
          </div>

          {savedAt && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Changes saved
              <span className="text-navy-400">· {new Date(savedAt).toLocaleTimeString()}</span>
            </p>
          )}
        </div>

        {/* Live preview — same as onboarding */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <LivePreview profile={profile} />
          <div className="mt-4 rounded-lg border border-navy-200 bg-navy-50/40 p-3 text-[11px] text-navy-600">
            <p className="font-semibold text-navy-800">
              <Briefcase className="mr-1 inline h-3 w-3" /> How this is used
            </p>
            <p className="mt-1.5 leading-relaxed">
              Every AI tool run prepends a calibrated context block built from this profile
              combined with your active situation. Save here → next tool run uses the new values.
              Your previous profile versions are preserved for provenance.
            </p>
          </div>
        </aside>
      </div>

      <DangerZone />
    </div>
  );
}
