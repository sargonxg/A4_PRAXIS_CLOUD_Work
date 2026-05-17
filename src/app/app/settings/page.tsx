'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, BarChart3, CreditCard, KeyRound, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { PRAXIS_USAGE_COPY } from '@/lib/billing/usage-policy';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'workspace', label: 'Workspace', icon: UsersRound },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'connectors', label: 'Connectors', icon: KeyRound },
  { id: 'system', label: 'System', icon: Activity },
] as const;

type SettingsTab = (typeof tabs)[number]['id'];
type RuntimeHealthStatus = 'ok' | 'degraded' | 'down';
type RuntimeHealthCheckStatus = RuntimeHealthStatus | 'unconfigured';
type RuntimeHealthPayload = {
  status: RuntimeHealthStatus;
  checkedAt: string;
  summary: string;
  checks: Array<{
    id: string;
    label: string;
    status: RuntimeHealthCheckStatus;
    latencyMs?: number;
  }>;
};
type AdminSystemHealthPayload = RuntimeHealthPayload & {
  admin?: {
    accessReason: string;
    checks: SystemHealthCheck[];
  };
};
type SystemHealthCheck = RuntimeHealthPayload['checks'][number] & {
  endpoint?: string;
  detail?: string;
  repairAction?: string;
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const activeTab = normalizeTab(searchParams.get('tab'));
  const { user, analystProfile, credits } = useAuth();
  const plan = user?.subscription ?? 'free';
  const nextReset = nextWeeklyResetLabel();
  const [weeklyUsage, setWeeklyUsage] = useState<{ used: number; remaining: number } | null>(null);
  const [billingStatus, setBillingStatus] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<AdminSystemHealthPayload | null>(null);
  const [systemHealthLoading, setSystemHealthLoading] = useState(false);

  useEffect(() => {
    fetch('/api/usage/weekly-free', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (payload && typeof payload.used === 'number' && typeof payload.remaining === 'number') {
          setWeeklyUsage({ used: payload.used, remaining: payload.remaining });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (activeTab !== 'system') return;
    let cancelled = false;

    async function refreshSystemHealth() {
      setSystemHealthLoading(true);
      try {
        const adminResponse = await fetch('/api/admin/system-health', {
          credentials: 'include',
          cache: 'no-store',
        });
        const adminPayload = await adminResponse.json().catch(() => null);
        if (!cancelled && adminResponse.ok && isRuntimeHealthPayload(adminPayload)) {
          setSystemHealth(adminPayload);
          return;
        }

        const publicResponse = await fetch('/api/health/runtime', { cache: 'no-store' });
        const publicPayload = await publicResponse.json().catch(() => null);
        if (!cancelled && publicResponse.ok && isRuntimeHealthPayload(publicPayload)) {
          setSystemHealth(publicPayload);
        }
      } finally {
        if (!cancelled) setSystemHealthLoading(false);
      }
    }

    void refreshSystemHealth();
    const interval = window.setInterval(() => void refreshSystemHealth(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold text-navy-950">Account and workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-500">
            Manage the one profile menu that controls PRAXIS identity, billing, usage, security, and connectors.
          </p>
        </div>
        <Link href="/app" className="rounded-md border border-navy-200 bg-white px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50">
          Back to cockpit
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Settings sections">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/app/settings?tab=${tab.id}`}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold',
              activeTab === tab.id
                ? 'border-diplomatic-blue bg-diplomatic-blue text-white'
                : 'border-navy-200 bg-white text-navy-600 hover:bg-navy-50',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </nav>

      <section className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
        {activeTab === 'profile' ? (
          <SettingsPanel
            title="Profile / User Core"
            rows={[
              ['Name', user?.name || 'Analyst'],
              ['Email', user?.email || 'Not available'],
              ['Role', labelize(analystProfile?.identity.role || user?.role || 'analyst')],
              ['Organization', analystProfile?.identity.org || user?.orgName || 'Not set'],
              ['Team', analystProfile?.identity.team || 'Not set'],
            ]}
            actionHref="/onboarding"
            actionLabel="Edit User Core"
          />
        ) : null}

        {activeTab === 'workspace' ? (
          <SettingsPanel
            title="Workspace"
            rows={[
              ['Default cockpit', 'One prompt bar, active capsules, saved conversations'],
              ['Capsule library', 'Stored ContextCapsules, categories, documents, and tool posture'],
              ['Conversation URLs', '/app/conversations/[conversationId]'],
            ]}
            actionHref="/app/capsules"
            actionLabel="Open capsules"
          />
        ) : null}

        {activeTab === 'billing' ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-navy-950">Billing and subscription</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void startCheckout('analyst')} className="rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
                  Buy Practitioner
                </button>
                <button type="button" onClick={() => void openBillingPortal()} className="rounded-md border border-navy-200 bg-white px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50">
                  Manage plan
                </button>
              </div>
            </div>
            <div className="mt-5 divide-y divide-navy-100 rounded-lg border border-navy-100">
              {[
                ['Current plan', `${plan} plan`],
                ['Monthly access', plan === 'free' ? 'Upgrade required for full app access' : 'Active'],
                ['Subscription management', 'Checkout and customer portal use Polar when configured'],
                ['Billing status', billingStatus ?? 'Ready'],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-navy-500">{label}</span>
                  <span className="min-w-0 text-sm text-navy-950">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'usage' ? (
          <SettingsPanel
            title="Usage"
            rows={[
              ['Credits', `${credits.toLocaleString()} ${PRAXIS_USAGE_COPY.shortLabel}`],
              ['Ask cost', PRAXIS_USAGE_COPY.askCost],
              ['Free allowance', '1 saved PRAXIS conversation per week on the free plan'],
              ['This week', weeklyUsage ? `${weeklyUsage.used} used, ${weeklyUsage.remaining} remaining` : 'Loading usage...'],
              ['Next free reset', nextReset],
            ]}
            actionHref="/app"
            actionLabel="Start a conversation"
          />
        ) : null}

        {activeTab === 'security' ? (
          <SettingsPanel
            title="Security"
            rows={[
              ['Session', 'Managed by Firebase Auth and signed PRAXIS session cookies'],
              ['Data visibility', 'Private workspace by default'],
              ['Approvals', 'Higher-risk agent actions remain approval-gated'],
            ]}
          />
        ) : null}

        {activeTab === 'connectors' ? (
          <SettingsPanel
            title="API keys and connectors"
            rows={[
              ['AI settings', 'Model preferences and custom instructions'],
              ['API keys', 'Provider keys are stored through settings API routes'],
              ['Connectors', 'Uploads and source repositories stay capsule-bound'],
            ]}
            actionHref="/app"
            actionLabel="Open cockpit"
          />
        ) : null}

        {activeTab === 'system' ? (
          <SystemHealthPanel
            health={systemHealth}
            loading={systemHealthLoading}
          />
        ) : null}
      </section>
    </div>
  );

  async function startCheckout(planId: 'analyst' | 'team') {
    setBillingStatus('Opening checkout...');
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && typeof payload.url === 'string') {
      window.location.href = payload.url;
      return;
    }
    setBillingStatus(payload?.error ?? 'Checkout is unavailable. Use pricing or contact TACITUS.');
  }

  async function openBillingPortal() {
    setBillingStatus('Opening billing portal...');
    const response = await fetch('/api/billing/portal', {
      method: 'POST',
      credentials: 'include',
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && typeof payload.url === 'string') {
      window.location.href = payload.url;
      return;
    }
    setBillingStatus(payload?.error ?? 'Billing portal is unavailable. Use pricing or contact TACITUS.');
  }
}

function SystemHealthPanel({
  health,
  loading,
}: {
  health: AdminSystemHealthPayload | null;
  loading: boolean;
}) {
  const checks: SystemHealthCheck[] = health?.admin?.checks ?? health?.checks ?? [];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-navy-950">System health</h2>
          <p className="mt-1 text-sm text-navy-500">
            {loading && !health ? 'Checking PRAXIS runtime...' : health?.summary ?? 'Runtime health is unavailable.'}
          </p>
        </div>
        <span className={cn(
          'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold',
          health?.status === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : health?.status === 'down' ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-amber-200 bg-amber-50 text-amber-800',
        )}>
          <span className={cn(
            'h-2 w-2 rounded-full',
            health?.status === 'ok' ? 'bg-emerald-500'
              : health?.status === 'down' ? 'bg-rose-600'
                : 'bg-amber-500',
          )} />
          {health?.summary ?? 'Checking systems'}
        </span>
      </div>

      <div className="mt-5 divide-y divide-navy-100 rounded-lg border border-navy-100">
        {checks.map((check) => (
          <div key={check.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[220px_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-navy-500">{check.label}</span>
            <span className="min-w-0 text-sm text-navy-950">
              <span className={cn(
                'mr-2 inline-flex rounded px-2 py-0.5 text-xs font-semibold',
                check.status === 'ok' ? 'bg-emerald-50 text-emerald-800'
                  : check.status === 'down' ? 'bg-rose-50 text-rose-800'
                    : check.status === 'unconfigured' ? 'bg-slate-100 text-slate-600'
                      : 'bg-amber-50 text-amber-800',
              )}>
                {check.status}
              </span>
              {typeof check.latencyMs === 'number' ? `${check.latencyMs}ms` : null}
              {check.endpoint ? (
                <span className="ml-2 font-mono text-xs text-navy-400">{check.endpoint}</span>
              ) : null}
              {check.detail ? (
                <span className="mt-2 block text-xs leading-5 text-navy-500">{check.detail}</span>
              ) : null}
              {check.repairAction ? (
                <span className="mt-1 block text-xs font-semibold text-navy-600">{check.repairAction}</span>
              ) : null}
            </span>
          </div>
        ))}
        {!checks.length ? (
          <div className="px-4 py-3 text-sm text-navy-500">No runtime health checks returned.</div>
        ) : null}
      </div>
      <p className="mt-3 text-xs leading-5 text-navy-400">
        Admin users see endpoint details and repair guidance. Other users see the same sanitized summary shown on the homepage.
      </p>
    </div>
  );
}

function SettingsPanel({
  title,
  rows,
  actionHref,
  actionLabel,
}: {
  title: string;
  rows: Array<[string, string]>;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy-950">{title}</h2>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-5 divide-y divide-navy-100 rounded-lg border border-navy-100">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-navy-500">{label}</span>
            <span className="min-w-0 text-sm text-navy-950">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeTab(value: string | null): SettingsTab {
  return tabs.some((tab) => tab.id === value) ? value as SettingsTab : 'profile';
}

function labelize(value: string): string {
  return value.replaceAll('_', ' ').replaceAll('-', ' ');
}

function nextWeeklyResetLabel(): string {
  const now = new Date();
  const next = new Date(now);
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function isRuntimeHealthPayload(value: unknown): value is AdminSystemHealthPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AdminSystemHealthPayload>;
  return (
    (candidate.status === 'ok' || candidate.status === 'degraded' || candidate.status === 'down') &&
    typeof candidate.checkedAt === 'string' &&
    typeof candidate.summary === 'string' &&
    Array.isArray(candidate.checks)
  );
}
