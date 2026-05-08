'use client';

/**
 * /app/profile — Working Profile (read-only).
 *
 * Shows EVERYTHING the AI sees about the user: identity, perspective,
 * working style, merged domain config (resolved from user.primary +
 * secondaries), embedding state, last update time, and version history
 * (last 5 versions).
 *
 * NOT the edit page. Link at top to /app/settings/profile for editing.
 */

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Eye,
  History,
  Languages,
  Loader2,
  Pencil,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useAuth } from '@/lib/auth/auth-context';
import { LENS_CATALOG } from '@/lib/constants/lens-catalog';
import { LENSES, type AnalystProfile, type Lens } from '@/types/analyst-profile';
import type { MergedDomainConfig } from '@/types/domain';
import { cn } from '@/lib/utils/cn';

interface VersionEntry {
  versionId: string;
  version: number;
  completedAt: unknown;
  snapshotAt: unknown;
  primaryDomain: string;
  lenses: string[];
  audience: string;
}

interface ResolvedPayload {
  profile: AnalystProfile;
  domain: MergedDomainConfig;
  domainVersion: number;
  versionsHistory: VersionEntry[];
}

function formatTimestamp(value: unknown): string {
  if (!value) return '—';
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    const v = value as { _seconds?: number; seconds?: number };
    const secs = v._seconds ?? v.seconds;
    if (typeof secs === 'number') return new Date(secs * 1000).toLocaleString();
  }
  return '—';
}

// ---------------------------------------------------------------------------
// Lens weights — 9-bar chart
// ---------------------------------------------------------------------------

function LensWeightsChart({ weights }: { weights: Record<Lens, number> }) {
  const maxWeight = Math.max(...LENSES.map((l) => weights[l] ?? 1.0), 1.0);
  return (
    <div className="space-y-1.5">
      {LENSES.map((lens) => {
        const w = weights[lens] ?? 1.0;
        const pct = Math.min(100, (w / maxWeight) * 100);
        const def = LENS_CATALOG[lens];
        return (
          <div key={lens} className="grid grid-cols-[110px_1fr_40px] items-center gap-2">
            <span className="text-[11px] font-medium text-navy-700">{def.label}</span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: def.color }}
              />
            </div>
            <span className="text-right font-mono text-[10px] tabular-nums text-navy-500">
              {w.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section helpers
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent?: 'gold' | 'blue' | 'navy';
  children: React.ReactNode;
}) {
  const accentClass =
    accent === 'gold'
      ? 'text-gold-600 bg-gold-500/10'
      : accent === 'blue'
        ? 'text-diplomatic-blue bg-diplomatic-blue/10'
        : 'text-navy-600 bg-navy-100';
  return (
    <section className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', accentClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{label}</p>
      <p className="mt-1 text-sm text-navy-800">{value ?? '—'}</p>
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: 'gold' | 'blue' }) {
  const toneClass =
    tone === 'gold'
      ? 'bg-gold-500/10 text-gold-700 border-gold-500/30'
      : 'bg-diplomatic-blue/10 text-diplomatic-blue border-diplomatic-blue/25';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkingProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState<ResolvedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/profile/resolved')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((body: ResolvedPayload) => {
        if (!cancelled) {
          setData(body);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (user?.isDemo) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 text-sm text-navy-800">
        <p className="font-semibold text-gold-700">Demo mode</p>
        <p className="mt-2 text-navy-600">
          Demo users use a shared analyst profile. Sign in with a real account to see your working
          profile.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-navy-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your working profile…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-crimson/30 bg-crimson/5 p-6 text-sm text-navy-800">
        <p className="font-semibold text-crimson">Could not load working profile</p>
        <p className="mt-2 text-navy-600">{error ?? 'Unknown error.'}</p>
      </div>
    );
  }

  const { profile, domain, versionsHistory } = data;
  const embedding = profile.embedding;
  const embeddingReady = Array.isArray(embedding?.vector) && embedding.vector.length === 768;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Eye className="h-4 w-4 text-gold-600" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-700">
              Working profile
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-navy-900">
            What PRAXIS knows about you
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-navy-500">
            This is the exact calibration payload the AI sees before every tool run. It is
            resolved live from your profile, your primary &amp; secondary domains, and your
            embedding vector.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PraxisLink
            href="/onboarding?edit=1"
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 shadow-sm transition-colors hover:border-gold-500/40 hover:bg-gold-500/5 hover:text-gold-700"
          >
            <Pencil className="h-3 w-3" />
            Edit analyst profile
            <ArrowRight className="h-3 w-3" />
          </PraxisLink>
          <div className="flex items-center gap-2 rounded-full border border-navy-200 bg-white px-3 py-1 text-[11px]">
            <span className="text-navy-500">Profile version</span>
            <span className="font-semibold text-navy-900">v{profile.meta?.version ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Top banner — provenance strip */}
      <div className="grid gap-3 rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/5 via-white to-transparent p-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
            Last edited
          </p>
          <p className="mt-1 text-xs font-medium text-navy-800">
            {formatTimestamp(profile.meta?.lastEditedAt)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
            Completed
          </p>
          <p className="mt-1 text-xs font-medium text-navy-800">
            {profile.meta?.completedAt ? formatTimestamp(profile.meta.completedAt) : 'Not complete'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
            Embedding
          </p>
          <p
            className={cn(
              'mt-1 inline-flex items-center gap-1 text-xs font-medium',
              embeddingReady ? 'text-emerald-700' : 'text-navy-500',
            )}
          >
            {embeddingReady ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Ready
                <span className="text-navy-400">
                  · {embedding?.model ?? 'unknown model'} · {formatTimestamp(embedding?.generatedAt)}
                </span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-3 w-3 text-amber-500" />
                Pending — complete profile to trigger
              </>
            )}
          </p>
        </div>
      </div>

      {/* Identity */}
      <Section icon={UserIcon} title="Identity" accent="gold">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Role" value={profile.identity.role.replace(/_/g, ' ')} />
          <Field label="Seniority" value={profile.identity.seniority} />
          <Field label="Organisation" value={profile.identity.org || <em className="text-navy-400">not set</em>} />
          <Field label="Team" value={profile.identity.team || <em className="text-navy-400">not set</em>} />
        </div>
      </Section>

      {/* Perspective + merged domain */}
      <Section icon={Compass} title="Perspective" accent="gold">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Left: raw perspective */}
          <div className="space-y-4">
            <Field
              label="Mandate"
              value={
                profile.perspective.mandate ? (
                  <span className="whitespace-pre-line">{profile.perspective.mandate}</span>
                ) : (
                  <em className="text-navy-400">not set</em>
                )
              }
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Analytical lenses (ordered)
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.perspective.lenses.length === 0 ? (
                  <span className="text-sm text-navy-400">—</span>
                ) : (
                  profile.perspective.lenses.map((lens, i) => (
                    <Chip key={lens} tone="gold">
                      <span className="mr-1 font-mono text-[9px] text-navy-500">{i + 1}</span>
                      {LENS_CATALOG[lens]?.label ?? lens}
                    </Chip>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Regions of focus
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.perspective.regions.length === 0 ? (
                  <span className="text-sm text-navy-400">—</span>
                ) : (
                  profile.perspective.regions.map((r) => <Chip key={r}>{r}</Chip>)
                )}
              </div>
            </div>
            <Field label="Primary audience" value={profile.perspective.audience.replace(/_/g, ' ')} />
          </div>

          {/* Right: merged domain card */}
          <div className="rounded-lg border border-gold-500/25 bg-gold-500/5 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: domain.colorHex }}
                  aria-hidden
                >
                  <Sparkles className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
                    Resolved domain
                  </p>
                  <p className="text-sm font-semibold text-navy-900">{domain.name}</p>
                </div>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] text-navy-500">
                v{domain.version}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-navy-600">{domain.description}</p>

            <div className="mt-3 flex flex-wrap gap-1">
              <Chip tone="gold">primary · {profile.perspective.primaryDomain}</Chip>
              {profile.perspective.secondaryDomains.map((id) => (
                <Chip key={id}>secondary · {id}</Chip>
              ))}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
                Lens weights (merged)
              </p>
              <LensWeightsChart weights={domain.lensWeights} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gold-500/20 pt-3 text-[11px]">
              <div>
                <p className="font-semibold text-navy-700">Preferred feeds</p>
                <p className="mt-0.5 text-navy-500">
                  {domain.preferredFeeds.length > 0
                    ? domain.preferredFeeds.join(', ')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-navy-700">Frameworks</p>
                <p className="mt-0.5 text-navy-500">
                  {domain.frameworks.length > 0 ? domain.frameworks.join(', ') : '—'}
                </p>
              </div>
            </div>

            {domain.inheritanceTrace && (
              <div className="mt-3 rounded-md bg-white/60 px-3 py-2 text-[10px] text-navy-500">
                <p>
                  Inherits from{' '}
                  <span className="font-mono text-navy-700">
                    {domain.inheritanceTrace.parent ?? 'none'}
                  </span>
                </p>
                {domain.inheritanceTrace.overriddenFields.length > 0 && (
                  <p className="mt-0.5">
                    Overridden: {domain.inheritanceTrace.overriddenFields.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Working style */}
      <Section icon={Languages} title="Working style" accent="gold">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <Field label="Output language" value={profile.workingStyle.language.toUpperCase()} />
            <Field
              label="Analytical style"
              value={profile.workingStyle.analyticalStyle.replace(/_/g, ' ')}
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Preferred source categories
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.workingStyle.sourceCategories.length === 0 ? (
                  <span className="text-sm text-navy-400">—</span>
                ) : (
                  profile.workingStyle.sourceCategories.map((c) => <Chip key={c}>{c}</Chip>)
                )}
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              Red-line phrases (AI will avoid)
            </p>
            {profile.workingStyle.redLines.length === 0 ? (
              <p className="mt-1.5 text-sm text-navy-400">None configured.</p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {profile.workingStyle.redLines.map((r, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-crimson/20 bg-crimson/5 px-2.5 py-1 text-[12px] text-crimson"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      {/* Version history */}
      <Section icon={History} title="Version history" accent="navy">
        {versionsHistory.length === 0 ? (
          <p className="text-sm text-navy-400">
            No completed versions yet. Complete the onboarding (or hit Save on the editor) to create
            your first snapshot.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-navy-100">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-navy-50 text-[10px] uppercase tracking-wider text-navy-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Version</th>
                  <th className="px-3 py-2 font-semibold">Completed</th>
                  <th className="px-3 py-2 font-semibold">Primary domain</th>
                  <th className="px-3 py-2 font-semibold">Lenses</th>
                  <th className="px-3 py-2 font-semibold">Audience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {versionsHistory.map((v) => (
                  <tr key={v.versionId} className="hover:bg-navy-50/40">
                    <td className="px-3 py-2 font-mono text-navy-900">v{v.version}</td>
                    <td className="px-3 py-2 text-navy-700">{formatTimestamp(v.completedAt)}</td>
                    <td className="px-3 py-2 text-navy-700">{v.primaryDomain}</td>
                    <td className="px-3 py-2 text-navy-700">{v.lenses.join(', ') || '—'}</td>
                    <td className="px-3 py-2 text-navy-700">{v.audience.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[10px] text-navy-400">
          Showing {versionsHistory.length} most recent version{versionsHistory.length === 1 ? '' : 's'}.
          Each completion writes an immutable snapshot to{' '}
          <code className="rounded bg-navy-50 px-1 font-mono text-navy-500">
            users/{'{uid}'}/profile_versions/{'{vN}'}
          </code>
          .
        </p>
      </Section>
    </div>
  );
}
