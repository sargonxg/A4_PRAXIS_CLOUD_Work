'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCcw,
  Save,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { DangerZone } from '@/components/settings/danger-zone';
import { LivingContextRail } from '@/components/ui/instrument';
import { useAuth } from '@/lib/auth/auth-context';
import { MODEL_PREFERENCE_VALUES } from '@/lib/ai/model-preferences';
import { buildAppDiagnosticSummary, type AppDiagnosticStatus } from '@/lib/diagnostics/app-red-flags';
import { cn } from '@/lib/utils/cn';
import {
  CITATION_STYLES,
  CONFIDENCE_LABELLING,
  REPORT_LENGTHS,
  TIME_HORIZONS,
  type UserPreferences,
} from '@/types/preferences';
import { LANGUAGES } from '@/types/analyst-profile';

type SettingsTab = 'profile' | 'billing' | 'usage' | 'security' | 'connectors' | 'workspace' | 'system';

type AccountRecord = {
  uid?: string;
  email?: string;
  displayName?: string;
  role?: string;
  orgId?: string;
  orgName?: string;
  credits?: number;
  totalCreditsUsed?: number;
  subscription?: string;
  subscriptionStatus?: string;
  subscriptionPlanId?: string;
  subscriptionExpiresAt?: string | null;
  subscriptionProvider?: string;
  polarCustomerId?: string | null;
  marketingConsent?: boolean;
  isDemo?: boolean;
};

type MonthlyUsage = {
  allowance: number;
  used: number;
  creditsUsed?: number;
  remaining: number;
  conversationStarts?: number;
  monthKey?: string;
  nextResetAt?: string;
  resetAt?: string;
  unlimited?: boolean;
  persisted?: boolean;
};

type ResolvedProfile = {
  profile?: {
    identity?: { role?: string; seniority?: string; org?: string; team?: string };
    perspective?: { mandate?: string; lenses?: string[]; regions?: string[]; audience?: string; primaryDomain?: string };
    workingStyle?: { defaultLanguage?: string; analyticalStyle?: string; redLines?: string };
    meta?: { version?: number; completedAt?: string | null };
  };
  domain?: { label?: string; id?: string; version?: number };
  versionsHistory?: Array<{ versionId: string; version: number; primaryDomain: string; audience: string }>;
};

type AiSettings = {
  preferredModel: string;
  temperature: number;
  researchDepth: 'quick' | 'standard' | 'comprehensive';
  customInstructions: string;
  maxTokens: number;
};

type ProviderField = {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  secret: boolean;
};

type ProviderSpec = {
  id: string;
  label: string;
  tagline: string;
  fields: ProviderField[];
  signupUrl: string;
  docsUrl: string;
  platformFallbackEnvVars: string[];
};

type ProviderStatus = {
  provider: string;
  present: boolean;
  maskedPreview: string;
  nonSecretValues: Record<string, string>;
  validatedAt: string | null;
  validationError: string | null;
  updatedAt: string | null;
  platformFallbackAvailable: boolean;
  effective: boolean;
};

type ProviderPayload = {
  providers: Record<string, ProviderSpec>;
  statuses: Record<string, ProviderStatus>;
};

type RuntimeHealthStatus = 'ok' | 'degraded' | 'down' | 'unconfigured';

type RuntimeHealthPayload = {
  status: RuntimeHealthStatus;
  summary: string;
  checkedAt: string;
  checks: Array<{
    id: string;
    label: string;
    status: RuntimeHealthStatus;
    latencyMs?: number;
  }>;
};

type AdminRuntimeHealthPayload = RuntimeHealthPayload & {
  admin?: {
    checks?: Array<{
      id: string;
      label: string;
      status: RuntimeHealthStatus;
      latencyMs?: number;
      detail?: string;
      repairAction?: string;
    }>;
  };
};

type AgenticSearchPayload = {
  status: 'ready' | 'degraded' | 'blocked';
  summary: string;
  checkedAt: string;
  missing: string[];
  checks: Array<{
    id: string;
    label: string;
    status: 'ready' | 'degraded' | 'blocked';
    names: string[];
    detail: string;
  }>;
};

type MemoryCandidate = {
  id?: string;
  candidateId?: string;
  title?: string;
  text?: string;
  type?: string;
  confidence?: number;
  sourceId?: string;
  runId?: string;
  capsuleId?: string;
};

type MemoryHealthPayload = {
  enabled?: boolean;
  ready?: boolean;
  status?: string;
  reason?: string;
  lastRememberReceipt?: string;
  lastRecallReceipt?: string;
};

type MemoryCandidatesPayload = {
  candidates?: MemoryCandidate[];
  status?: string;
};

const DEFAULT_AI_SETTINGS: AiSettings = {
  preferredModel: MODEL_PREFERENCE_VALUES[0],
  temperature: 0.4,
  researchDepth: 'standard',
  customInstructions: '',
  maxTokens: 4096,
};

const DEFAULT_USAGE: MonthlyUsage = { allowance: 31_000, used: 0, remaining: 31_000, conversationStarts: 0 };

const PLAN_SIGNUP_HREFS = {
  analyst: '/login?mode=signup&plan=analyst',
  team: '/login?mode=signup&plan=team',
} as const;

const MEMORY_ENDPOINTS = {
  health: '/api/memory/health',
  candidates: '/api/memory/candidates',
  promote: '/api/memory/promote',
  reject: '/api/memory/reject',
} as const;

const AUTHENTICATED_TEST_LANES = [
  {
    label: 'Preflight',
    command: 'npm run auth-runtime:preflight',
    detail: 'Checks Firebase test credentials, gcloud project, Firebase CLI login, and local ADC.',
  },
  {
    label: 'Local app smoke',
    command: 'npm run test:auth-runtime:local',
    detail: 'Runs typecheck, build, logged-in golden path, Tasklet app smoke, and Ask capsule runtime smoke.',
  },
  {
    label: 'Product surface',
    command: 'npm run test:auth-runtime:product',
    detail: 'Runs route, public surface, Tasklet foundation, and Ask cockpit runtime audits.',
  },
  {
    label: 'Agent runtime',
    command: 'npm run test:auth-runtime:agent',
    detail: 'Runs agent process, runtime proof, and Genkit/agent-runtime unit checks.',
  },
  {
    label: 'Live cloud posture',
    command: 'npm run test:auth-runtime:live',
    detail: 'Runs production runtime health and GCP posture audits.',
  },
] as const;

const TABS: Array<{ id: SettingsTab; label: string; icon: LucideIcon; detail: string }> = [
  { id: 'profile', label: 'Profile', icon: UserRound, detail: 'Analyst profile and account basics' },
  { id: 'billing', label: 'Billing', icon: CreditCard, detail: 'Plan, checkout, portal' },
  { id: 'usage', label: 'Usage', icon: BarChart3, detail: 'Credits and monthly allowance' },
  { id: 'security', label: 'Security', icon: ShieldCheck, detail: 'Password, sign out, data controls' },
  { id: 'connectors', label: 'Connectors', icon: KeyRound, detail: 'API keys and provider status' },
  { id: 'workspace', label: 'Workspace', icon: SlidersHorizontal, detail: 'Output defaults and preferences' },
  { id: 'system', label: 'System', icon: Wrench, detail: 'AI runtime and health' },
];

function tabFrom(value: string | null): SettingsTab {
  return TABS.some((tab) => tab.id === value) ? (value as SettingsTab) : 'profile';
}

export function AccountSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, resetPassword, refreshCredits } = useAuth();
  const activeTab = tabFrom(searchParams.get('tab'));

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [profile, setProfile] = useState<ResolvedProfile | null>(null);
  const [usage, setUsage] = useState<MonthlyUsage>(DEFAULT_USAGE);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [providers, setProviders] = useState<ProviderPayload>({ providers: {}, statuses: {} });
  const [accountDraft, setAccountDraft] = useState({ displayName: '', role: '', orgName: '', orgId: '', marketingConsent: false });
  const [connectorDrafts, setConnectorDrafts] = useState<Record<string, Record<string, string>>>({});
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [settingsSearch, setSettingsSearch] = useState('');
  const checkoutPlan = searchParams.get('checkoutPlan');
  const checkoutStatus = searchParams.get('checkout');

  const activeMeta = useMemo(() => TABS.find((tab) => tab.id === activeTab) ?? TABS[0], [activeTab]);
  const visibleTabs = useMemo(() => {
    const query = settingsSearch.trim().toLowerCase();
    if (!query) return TABS;
    return TABS.filter((tab) => `${tab.label} ${tab.detail} ${tab.id}`.toLowerCase().includes(query));
  }, [settingsSearch]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStatus(null);
      const [accountRes, profileRes, usageRes, prefsRes, aiRes, providersRes] = await Promise.all([
        fetchJson<AccountRecord>('/api/account'),
        fetchJson<ResolvedProfile>('/api/profile/resolved'),
        fetchJson<MonthlyUsage>('/api/usage/monthly-free'),
        fetchJson<UserPreferences>('/api/preferences'),
        fetchJson<{ settings: AiSettings }>('/api/settings/ai'),
        fetchJson<ProviderPayload>('/api/settings/api-keys'),
      ]);
      if (cancelled) return;

      if (accountRes.ok) {
        setAccount(accountRes.data);
        setAccountDraft({
          displayName: accountRes.data.displayName ?? user?.name ?? '',
          role: accountRes.data.role ?? user?.role ?? 'analyst',
          orgName: accountRes.data.orgName ?? user?.orgName ?? '',
          orgId: accountRes.data.orgId ?? user?.orgId ?? '',
          marketingConsent: accountRes.data.marketingConsent === true,
        });
      }
      if (profileRes.ok) setProfile(profileRes.data);
      if (usageRes.ok) setUsage(usageRes.data);
      if (prefsRes.ok) setPreferences(prefsRes.data);
      if (aiRes.ok) setAiSettings({ ...DEFAULT_AI_SETTINGS, ...aiRes.data.settings });
      if (providersRes.ok) setProviders(providersRes.data);
      if (![accountRes, profileRes, usageRes, prefsRes, aiRes, providersRes].every((item) => item.ok)) {
        setStatus('Some settings could not load. You can still use the available sections.');
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.name, user?.role, user?.orgId, user?.orgName]);

  function selectTab(tab: SettingsTab) {
    router.replace(`/app/settings?tab=${tab}`, { scroll: false });
  }

  async function saveAccount() {
    setBusyAction('account');
    const result = await fetchJson<{ account: AccountRecord }>('/api/account', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(accountDraft),
    });
    if (result.ok) {
      setAccount(result.data.account);
      setStatus('Account saved.');
      await refreshCredits();
    } else {
      setStatus(result.error);
    }
    setBusyAction(null);
  }

  async function savePreferences() {
    setBusyAction('preferences');
    const result = await fetchJson<UserPreferences>('/api/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (result.ok) {
      setPreferences(result.data);
      setStatus('Workspace preferences saved.');
    } else {
      setStatus(result.error);
    }
    setBusyAction(null);
  }

  async function saveAiSettings() {
    setBusyAction('ai');
    const result = await fetchJson<{ settings: AiSettings }>('/api/settings/ai', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(aiSettings),
    });
    if (result.ok) {
      setAiSettings({ ...aiSettings, ...(result.data.settings ?? {}) });
      setStatus('AI settings saved.');
    } else {
      setStatus(result.error);
    }
    setBusyAction(null);
  }

  async function openBillingPortal() {
    setBusyAction('billing-portal');
    const result = await fetchJson<{ url?: string; fallbackHref?: string; mode?: string }>('/api/billing/portal', { method: 'POST' });
    setBusyAction(null);
    if (result.ok && result.data.url) {
      window.location.href = result.data.url;
      return;
    }
    if (result.ok && result.data.fallbackHref) router.push(result.data.fallbackHref);
    else setStatus(result.ok ? 'Billing portal is not available.' : result.error);
  }

  async function startCheckout(plan: 'analyst' | 'team') {
    setBusyAction(`checkout-${plan}`);
    const result = await fetchJson<{ url?: string; fallbackHref?: string; mode?: string }>('/api/billing/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    setBusyAction(null);
    if (result.ok && result.data.url) {
      window.location.href = result.data.url;
      return;
    }
    if (result.data?.fallbackHref) router.push(result.data.fallbackHref);
    else setStatus(result.ok ? 'Billing is not configured.' : result.error);
  }

  useEffect(() => {
    if ((checkoutPlan === 'analyst' || checkoutPlan === 'team') && !busyAction && !loading) {
      void startCheckout(checkoutPlan);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutPlan, loading]);

  async function saveConnector(provider: ProviderSpec) {
    setBusyAction(`connector-${provider.id}`);
    const payload = connectorDrafts[provider.id] ?? {};
    const result = await fetchJson<{ status: ProviderStatus }>(`/api/settings/api-keys/${provider.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (result.ok) {
      setProviders((current) => ({
        ...current,
        statuses: { ...current.statuses, [provider.id]: result.data.status },
      }));
      setConnectorDrafts((current) => ({ ...current, [provider.id]: {} }));
      setStatus(`${provider.label} credentials saved.`);
    } else {
      setStatus(result.error);
    }
    setBusyAction(null);
  }

  async function deleteConnector(provider: ProviderSpec) {
    setBusyAction(`connector-delete-${provider.id}`);
    const result = await fetchJson<{ ok: boolean }>(`/api/settings/api-keys/${provider.id}`, { method: 'DELETE' });
    if (result.ok) {
      const refreshed = await fetchJson<ProviderPayload>('/api/settings/api-keys');
      if (refreshed.ok) setProviders(refreshed.data);
      setStatus(`${provider.label} credentials removed.`);
    } else {
      setStatus(result.error);
    }
    setBusyAction(null);
  }

  async function sendPasswordReset() {
    if (!user?.email) return;
    setBusyAction('password');
    const result = await resetPassword(user.email);
    setStatus(result.success ? `Password reset email sent to ${user.email}.` : result.error ?? 'Password reset failed.');
    setBusyAction(null);
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'delete account') return;
    setBusyAction('account-delete');
    const result = await fetchJson<{ success?: boolean; message?: string }>('/api/account', { method: 'DELETE' });
    setBusyAction(null);
    if (result.ok) {
      setStatus(result.data.message ?? 'Account deleted.');
      await logout();
      router.push('/');
    } else {
      setStatus(result.error);
    }
  }

  const accountEmail = account?.email ?? user?.email ?? '';
  const plan = account?.subscription ?? user?.subscription ?? 'free';
  const credits = typeof account?.credits === 'number' ? account.credits : user?.credits ?? 0;
  const totalCreditsUsed = typeof account?.totalCreditsUsed === 'number' ? account.totalCreditsUsed : 0;
  const settingsRailCells = [
    {
      id: 'profile',
      label: 'Profile',
      value: account?.displayName ?? user?.name ?? 'Analyst',
      detail: accountDraft.role || 'Role pending',
      state: 'ready' as const,
    },
    {
      id: 'context',
      label: 'Workspace',
      value: accountDraft.orgName || user?.orgName || 'Private workspace',
      detail: profile?.domain?.label ?? 'Context preferences',
      state: profile ? 'active' as const : 'review' as const,
    },
    {
      id: 'source',
      label: 'Connectors',
      value: `${Object.values(providers.statuses).filter((provider) => provider.effective).length} effective`,
      detail: 'Keys stay in Settings',
      state: Object.values(providers.statuses).some((provider) => provider.effective) ? 'ready' as const : 'quiet' as const,
    },
    {
      id: 'output',
      label: 'Output',
      value: preferences.defaultReportLength ?? 'Standard',
      detail: preferences.citationStyle ?? 'Citations configurable',
      state: 'quiet' as const,
    },
    {
      id: 'readiness',
      label: 'Readiness',
      value: activeMeta.label,
      detail: loading ? 'Loading settings' : 'Settings available',
      state: loading ? 'review' as const : 'active' as const,
    },
  ];

  return (
    <section className="od-praxis-surface praxis-checker-constellation min-h-screen px-4 py-6 text-[#1f1f1f] md:px-8 lg:px-10" data-testid="account-settings-page">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ca4a25]">Settings</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Account and workspace settings</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage profile, billing, usage, security, connectors, workspace preferences, and runtime diagnostics.
            </p>
          </div>
          <div className="od-praxis-control rounded-md px-3 py-2 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{account?.displayName ?? user?.name ?? 'Analyst'}</p>
            <p className="mt-0.5 text-xs text-slate-500">{accountEmail}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="od-praxis-control flex w-full min-w-0 items-center gap-2 rounded-md px-3 py-2 lg:max-w-md" data-testid="settings-search-bar">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={settingsSearch}
              onChange={(event) => setSettingsSearch(event.target.value)}
              placeholder="Search settings"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-md border border-black/10 bg-white/75 px-2 py-1 font-semibold text-slate-700">{plan} plan</span>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
          </div>
        </div>

        <LivingContextRail
          cells={settingsRailCells}
          actionHref="/app"
          actionLabel="Back to cockpit"
          compact
          className="mt-4"
        />

        {status ? (
          <p role="status" className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            {status}
          </p>
        ) : null}

        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Account settings sections" data-testid="settings-section-tabs">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition',
                    active ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-sky-700' : 'text-slate-400')} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

        <main className="od-praxis-card mt-5 min-w-0 rounded-lg p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{activeMeta.label}</h2>
              <p className="text-sm text-slate-500">{activeMeta.detail}</p>
            </div>
          </div>

          {activeTab === 'profile' ? (
            <ProfileTab
              accountDraft={accountDraft}
              setAccountDraft={setAccountDraft}
              profile={profile}
              busy={busyAction === 'account'}
              onSave={saveAccount}
            />
          ) : null}

          {activeTab === 'billing' ? (
            <BillingTab
              plan={plan}
              subscriptionStatus={account?.subscriptionStatus}
              subscriptionPlanId={account?.subscriptionPlanId}
              subscriptionProvider={account?.subscriptionProvider}
              subscriptionExpiresAt={account?.subscriptionExpiresAt}
              checkoutStatus={checkoutStatus}
              credits={credits}
              totalCreditsUsed={totalCreditsUsed}
              busyAction={busyAction}
              onPortal={openBillingPortal}
              onCheckout={startCheckout}
            />
          ) : null}

          {activeTab === 'usage' ? <UsageTab usage={usage} /> : null}

          {activeTab === 'security' ? (
            <SecurityTab
              email={accountEmail}
              deleteConfirm={deleteConfirm}
              setDeleteConfirm={setDeleteConfirm}
              busyAction={busyAction}
              onResetPassword={sendPasswordReset}
              onLogout={logout}
              onDeleteAccount={deleteAccount}
            />
          ) : null}

          {activeTab === 'connectors' ? (
            <ConnectorsTab
              providers={providers}
              drafts={connectorDrafts}
              setDrafts={setConnectorDrafts}
              busyAction={busyAction}
              onSave={saveConnector}
              onDelete={deleteConnector}
            />
          ) : null}

          {activeTab === 'workspace' ? (
            <WorkspaceTab preferences={preferences} setPreferences={setPreferences} busy={busyAction === 'preferences'} onSave={savePreferences} />
          ) : null}

          {activeTab === 'system' ? (
            <SystemTab aiSettings={aiSettings} setAiSettings={setAiSettings} busy={busyAction === 'ai'} onSave={saveAiSettings} />
          ) : null}
        </main>
      </div>
    </section>
  );
}

function ProfileTab({
  accountDraft,
  setAccountDraft,
  profile,
  busy,
  onSave,
}: {
  accountDraft: { displayName: string; role: string; orgName: string; orgId: string; marketingConsent: boolean };
  setAccountDraft: Dispatch<SetStateAction<{ displayName: string; role: string; orgName: string; orgId: string; marketingConsent: boolean }>>;
  profile: ResolvedProfile | null;
  busy: boolean;
  onSave: () => void;
}) {
  const analyst = profile?.profile;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Display name" value={accountDraft.displayName} onChange={(value) => setAccountDraft((draft) => ({ ...draft, displayName: value }))} />
        <TextField label="Role" value={accountDraft.role} onChange={(value) => setAccountDraft((draft) => ({ ...draft, role: value }))} />
        <TextField label="Organization" value={accountDraft.orgName} onChange={(value) => setAccountDraft((draft) => ({ ...draft, orgName: value }))} />
        <TextField label="Organization ID" value={accountDraft.orgId} onChange={(value) => setAccountDraft((draft) => ({ ...draft, orgId: value }))} />
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-navy-700">
        <input
          type="checkbox"
          checked={accountDraft.marketingConsent}
          onChange={(event) => setAccountDraft((draft) => ({ ...draft, marketingConsent: event.target.checked }))}
        />
        Receive product updates and launch notes.
      </label>
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={Save} label={busy ? 'Saving...' : 'Save account'} onClick={onSave} disabled={busy} />
        <Link href="/onboarding?resume=1" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-50">
          Review profile
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Profile version" value={analyst?.meta?.version ?? 0} />
        <Metric label="Primary domain" value={analyst?.perspective?.primaryDomain ?? 'generic'} />
        <Metric label="Audience" value={analyst?.perspective?.audience ?? 'not set'} />
      </div>
      <InfoPanel title="Analyst profile">
        <p>Role: {analyst?.identity?.role ?? 'not set'}</p>
        <p>Team: {analyst?.identity?.team || 'not set'}</p>
        <p>Lenses: {analyst?.perspective?.lenses?.join(', ') || 'not set'}</p>
        <p>Regions: {analyst?.perspective?.regions?.join(', ') || 'not set'}</p>
      </InfoPanel>
    </div>
  );
}

function BillingTab({
  plan,
  subscriptionStatus,
  subscriptionPlanId,
  subscriptionProvider,
  subscriptionExpiresAt,
  checkoutStatus,
  credits,
  totalCreditsUsed,
  busyAction,
  onPortal,
  onCheckout,
}: {
  plan: string;
  subscriptionStatus?: string;
  subscriptionPlanId?: string;
  subscriptionProvider?: string;
  subscriptionExpiresAt?: string | null;
  checkoutStatus?: string | null;
  credits: number;
  totalCreditsUsed: number;
  busyAction: string | null;
  onPortal: () => void;
  onCheckout: (plan: 'analyst' | 'team') => void;
}) {
  return (
    <div className="space-y-5">
      {checkoutStatus === 'success' ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Checkout completed. The Polar webhook will update this plan as soon as the subscription event arrives.
        </p>
      ) : null}
      {checkoutStatus === 'cancelled' ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Checkout was cancelled. Your current plan is unchanged.
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Current plan" value={plan} />
        <Metric label="Subscription status" value={subscriptionStatus ?? 'not active'} />
        <Metric label="Billing provider" value={subscriptionProvider ?? 'none'} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Plan id" value={subscriptionPlanId ?? plan} />
        <Metric label="Period end" value={subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toLocaleDateString() : 'not set'} />
        <Metric label="Credits remaining" value={credits} />
        <Metric label="Credits used" value={totalCreditsUsed} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={CreditCard} label={busyAction === 'billing-portal' ? 'Opening...' : 'Manage billing'} onClick={onPortal} disabled={busyAction !== null} />
        <ActionButton icon={CheckCircle2} label={busyAction === 'checkout-analyst' ? 'Starting...' : 'Start Analyst checkout'} onClick={() => onCheckout('analyst')} disabled={busyAction !== null} />
        <ActionButton icon={CheckCircle2} label={busyAction === 'checkout-team' ? 'Starting...' : 'Start Team checkout'} onClick={() => onCheckout('team')} disabled={busyAction !== null} />
      </div>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        If Polar billing is in sandbox test mode, hosted checkout and the customer portal are test transactions. If billing is unconfigured, PRAXIS sends users to the public pricing page instead of failing silently.
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={PLAN_SIGNUP_HREFS.analyst} className="font-semibold text-diplomatic-blue hover:underline">Practitioner signup</Link>
        <Link href={PLAN_SIGNUP_HREFS.team} className="font-semibold text-diplomatic-blue hover:underline">Team signup</Link>
      </div>
    </div>
  );
}

function UsageTab({ usage }: { usage: MonthlyUsage }) {
  const used = usage.creditsUsed ?? usage.used;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Monthly PRAXIS credits left" value={usage.unlimited ? 'unlimited' : usage.remaining} />
        <Metric label="Monthly PRAXIS credits used" value={used} />
        <Metric label="Monthly PRAXIS allowance" value={usage.unlimited ? 'unlimited' : usage.allowance} />
      </div>
      <InfoPanel title="Monthly free allowance">
        <p>Month: {usage.monthKey ?? 'current'}</p>
        <p>Used: {used} of {usage.allowance} PRAXIS credits</p>
        <p>Conversation starts: {usage.conversationStarts ?? 0}</p>
        <p>Next reset: {usage.nextResetAt || usage.resetAt ? new Date(usage.nextResetAt ?? usage.resetAt ?? '').toLocaleString() : 'not available'}</p>
      </InfoPanel>
    </div>
  );
}

function SecurityTab({
  email,
  deleteConfirm,
  setDeleteConfirm,
  busyAction,
  onResetPassword,
  onLogout,
  onDeleteAccount,
}: {
  email: string;
  deleteConfirm: string;
  setDeleteConfirm: (value: string) => void;
  busyAction: string | null;
  onResetPassword: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {
  return (
    <div className="space-y-5">
      <InfoPanel title="Authentication">
        <p>Email: {email || 'not available'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton icon={RefreshCcw} label={busyAction === 'password' ? 'Sending...' : 'Send password reset'} onClick={onResetPassword} disabled={!email || busyAction !== null} />
          <ActionButton icon={LogOut} label="Sign out" onClick={onLogout} variant="secondary" />
        </div>
      </InfoPanel>
      <DangerZone />
      <section className="space-y-3 rounded-xl border border-red-300 bg-red-50/50 p-5">
        <h3 className="text-sm font-semibold text-red-900">Delete full account</h3>
        <p className="text-xs leading-5 text-red-700">
          This removes the Firebase account, the root user record, situations, and credit transaction history. Type delete account to continue.
        </p>
        <input
          value={deleteConfirm}
          onChange={(event) => setDeleteConfirm(event.target.value)}
          className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm"
          aria-label="Type delete account to confirm full account deletion"
          placeholder="delete account"
        />
        <button
          type="button"
          disabled={deleteConfirm !== 'delete account' || busyAction === 'account-delete'}
          onClick={onDeleteAccount}
          className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {busyAction === 'account-delete' ? 'Deleting...' : 'Delete full account'}
        </button>
      </section>
    </div>
  );
}

function ConnectorsTab({
  providers,
  drafts,
  setDrafts,
  busyAction,
  onSave,
  onDelete,
}: {
  providers: ProviderPayload;
  drafts: Record<string, Record<string, string>>;
  setDrafts: Dispatch<SetStateAction<Record<string, Record<string, string>>>>;
  busyAction: string | null;
  onSave: (provider: ProviderSpec) => void;
  onDelete: (provider: ProviderSpec) => void;
}) {
  const specs = Object.values(providers.providers);
  return (
    <div className="space-y-4">
      {specs.length === 0 ? <InfoPanel title="No connector registry loaded">Connector settings are unavailable right now.</InfoPanel> : null}
      {specs.map((provider) => {
        const status = providers.statuses[provider.id];
        const draft = drafts[provider.id] ?? {};
        return (
          <section key={provider.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-navy-950">{provider.label}</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-navy-500">{provider.tagline}</p>
                <p className="mt-2 text-xs text-navy-400">
                  Status: {status?.effective ? 'effective' : 'not configured'}
                  {status?.maskedPreview ? ` - ${status.maskedPreview}` : ''}
                  {status?.platformFallbackAvailable ? ' - platform fallback available' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={provider.docsUrl} target="_blank" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-slate-50">
                  Docs
                </Link>
                <Link href={provider.signupUrl} target="_blank" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-slate-50">
                  Get key
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {provider.fields.map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  type={field.secret ? 'password' : 'text'}
                  value={draft[field.name] ?? status?.nonSecretValues?.[field.name] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(value) => setDrafts((current) => ({
                    ...current,
                    [provider.id]: { ...(current[provider.id] ?? {}), [field.name]: value },
                  }))}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton icon={Save} label={busyAction === `connector-${provider.id}` ? 'Saving...' : 'Save credentials'} onClick={() => onSave(provider)} disabled={busyAction !== null} />
              <button
                type="button"
                disabled={!status?.present || busyAction !== null}
                onClick={() => onDelete(provider)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Remove user key
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function WorkspaceTab({
  preferences,
  setPreferences,
  busy,
  onSave,
}: {
  preferences: Partial<UserPreferences>;
  setPreferences: Dispatch<SetStateAction<Partial<UserPreferences>>>;
  busy: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Citation style" value={preferences.citationStyle ?? 'un-footnote'} options={CITATION_STYLES} onChange={(value) => setPreferences((prefs) => ({ ...prefs, citationStyle: value as UserPreferences['citationStyle'] }))} />
        <SelectField label="Report length" value={preferences.defaultReportLength ?? 'standard'} options={REPORT_LENGTHS} onChange={(value) => setPreferences((prefs) => ({ ...prefs, defaultReportLength: value as UserPreferences['defaultReportLength'] }))} />
        <SelectField label="Default language" value={preferences.defaultLanguage ?? 'en'} options={LANGUAGES} onChange={(value) => setPreferences((prefs) => ({ ...prefs, defaultLanguage: value as UserPreferences['defaultLanguage'] }))} />
        <SelectField label="Confidence labels" value={preferences.confidenceLabelling ?? 'icd-203'} options={CONFIDENCE_LABELLING} onChange={(value) => setPreferences((prefs) => ({ ...prefs, confidenceLabelling: value as UserPreferences['confidenceLabelling'] }))} />
        <SelectField label="Default horizon" value={preferences.defaultTimeHorizon ?? '90d'} options={TIME_HORIZONS} onChange={(value) => setPreferences((prefs) => ({ ...prefs, defaultTimeHorizon: value as UserPreferences['defaultTimeHorizon'] }))} />
      </div>
      <ActionButton icon={Save} label={busy ? 'Saving...' : 'Save workspace preferences'} onClick={onSave} disabled={busy} />
    </div>
  );
}

function SystemTab({
  aiSettings,
  setAiSettings,
  busy,
  onSave,
}: {
  aiSettings: AiSettings;
  setAiSettings: Dispatch<SetStateAction<AiSettings>>;
  busy: boolean;
  onSave: () => void;
}) {
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealthPayload | null>(null);
  const [agenticSearchHealth, setAgenticSearchHealth] = useState<AgenticSearchPayload | null>(null);
  const [coreHealth, setCoreHealth] = useState<Record<string, unknown> | null>(null);
  const [adminHealth, setAdminHealth] = useState<AdminRuntimeHealthPayload | null>(null);
  const [memoryHealth, setMemoryHealth] = useState<MemoryHealthPayload | null>(null);
  const [memoryCandidates, setMemoryCandidates] = useState<MemoryCandidate[]>([]);
  const [memoryAction, setMemoryAction] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [refreshingHealth, setRefreshingHealth] = useState(false);

  async function refreshHealth() {
    setRefreshingHealth(true);
    setHealthError(null);
    const [runtimeRes, agenticSearchRes, coreRes, adminRes, memoryHealthRes, memoryCandidatesRes] = await Promise.all([
      fetchJson<RuntimeHealthPayload>('/api/health/runtime'),
      fetchJson<AgenticSearchPayload>('/api/health/agentic-search'),
      fetchJson<Record<string, unknown>>('/api/health'),
      fetchJson<AdminRuntimeHealthPayload>('/api/admin/system-health'),
      fetchJson<MemoryHealthPayload>(MEMORY_ENDPOINTS.health),
      fetchJson<MemoryCandidatesPayload>(MEMORY_ENDPOINTS.candidates),
    ]);
    if (runtimeRes.ok) setRuntimeHealth(runtimeRes.data);
    if (agenticSearchRes.ok) setAgenticSearchHealth(agenticSearchRes.data);
    if (coreRes.ok) setCoreHealth(coreRes.data);
    if (adminRes.ok) setAdminHealth(adminRes.data);
    if (memoryHealthRes.ok) setMemoryHealth(memoryHealthRes.data);
    if (memoryCandidatesRes.ok) setMemoryCandidates(memoryCandidatesRes.data.candidates ?? []);
    if (!runtimeRes.ok) setHealthError(runtimeRes.error);
    else if (!coreRes.ok) setHealthError(coreRes.error);
    setRefreshingHealth(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshHealth();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visibleChecks = adminHealth?.admin?.checks ?? runtimeHealth?.checks ?? [];
  const coreChecks = typeof coreHealth?.checks === 'object' && coreHealth?.checks !== null
    ? Object.entries(coreHealth.checks as Record<string, unknown>)
    : [];
  const diagnosticSummary = buildAppDiagnosticSummary({
    runtimeHealth,
    agenticSearchHealth,
    appSearchAudit: { status: 'ok', detail: 'Command IDs, diagnostic targets, and app routes are checked by npm run audit:app-search.' },
    capsuleAudit: { status: 'ok', detail: 'Capsule strict filters, review gates, and starter contracts are checked by local audits.' },
    graphFreshness: { status: 'degraded', detail: 'Graphify freshness is verified locally by npm run audit:app-search because HEAD is not exposed to the browser.' },
    authCanary: { missingEnvVars: ['TEST_FIREBASE_EMAIL', 'TEST_FIREBASE_PASSWORD'] },
  });

  async function decideMemoryCandidate(candidate: MemoryCandidate, decision: 'promote' | 'reject') {
    const candidateId = candidate.candidateId ?? candidate.id;
    if (!candidateId) return;
    setMemoryAction(`${decision}-${candidateId}`);
    const result = await fetchJson<{ ok?: boolean }>(decision === 'promote' ? MEMORY_ENDPOINTS.promote : MEMORY_ENDPOINTS.reject, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, capsuleId: candidate.capsuleId, sourceId: candidate.sourceId, runId: candidate.runId }),
    });
    if (result.ok) {
      setMemoryCandidates((current) => current.filter((item) => (item.candidateId ?? item.id) !== candidateId));
    } else {
      setHealthError(result.error);
    }
    setMemoryAction(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoPanel title="TACITUS routing policy">
          <p>Ask PRAXIS ignores saved model preferences and routes each turn by capsule health, task intent, source posture, risk, and output target.</p>
          <p>Saved legacy model values are still accepted by the API for compatibility, but TACITUS selects the model tier at runtime.</p>
        </InfoPanel>
        <SelectField
          label="Research depth"
          value={aiSettings.researchDepth}
          options={['quick', 'standard', 'comprehensive'] as const}
          onChange={(value) => setAiSettings((settings) => ({ ...settings, researchDepth: value as AiSettings['researchDepth'] }))}
        />
        <TextField label="Temperature" type="number" value={String(aiSettings.temperature)} onChange={(value) => setAiSettings((settings) => ({ ...settings, temperature: Number(value) }))} />
        <TextField label="Max tokens" type="number" value={String(aiSettings.maxTokens)} onChange={(value) => setAiSettings((settings) => ({ ...settings, maxTokens: Number(value) }))} />
      </div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-500">Custom instructions</span>
        <textarea
          value={aiSettings.customInstructions}
          onChange={(event) => setAiSettings((settings) => ({ ...settings, customInstructions: event.target.value }))}
          className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-diplomatic-blue"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={Save} label={busy ? 'Saving...' : 'Save AI settings'} onClick={onSave} disabled={busy} />
        <Link href="/api/health" target="_blank" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-50">
          Open health JSON
        </Link>
      </div>
      <section data-testid="system-doctor-panel" className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-400">Developer checks</p>
            <h3 className="mt-1 text-base font-semibold text-navy-950">PRAXIS runtime doctor</h3>
            <p className="mt-1 text-sm leading-6 text-navy-500">
              {runtimeHealth ? `${runtimeHealth.summary} at ${new Date(runtimeHealth.checkedAt).toLocaleString()}` : 'Runtime status is loading.'}
            </p>
          </div>
          <ActionButton icon={RefreshCcw} label={refreshingHealth ? 'Refreshing...' : 'Refresh checks'} onClick={refreshHealth} disabled={refreshingHealth} variant="secondary" />
        </div>

        {healthError ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{healthError}</p> : null}

        <div className="rounded-lg border border-slate-200 bg-white p-3" data-testid="system-red-flags-summary">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy-950">Diagnostic red flags</p>
              <p className="mt-1 text-xs leading-5 text-navy-500">
                Read-only grouped repair guidance from live endpoints, local audits, static route checks, and skipped canary gates.
              </p>
            </div>
            <StatusPill status={Object.values(diagnosticSummary.groups).flat().some((item) => item.status === 'blocked') ? 'down' : 'degraded'} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Object.entries(diagnosticSummary.groups).map(([group, flags]) => (
              <section key={group} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy-500">{group}</p>
                <div className="mt-2 space-y-2">
                  {flags.map((flag) => (
                    <div key={flag.id} className="rounded-md bg-white p-2 text-xs leading-5 text-navy-600">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-navy-950">{flag.label}</span>
                        <DiagnosticStatusPill status={flag.status} />
                      </div>
                      <p className="mt-1">{flag.detail}</p>
                      <p className="mt-1 text-amber-700">{flag.repairAction}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-navy-400">{flag.source}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">Research runtime</p>
                <p className="mt-1 text-xs text-navy-500">
                  {agenticSearchHealth
                    ? `${agenticSearchHealth.summary} at ${new Date(agenticSearchHealth.checkedAt).toLocaleString()}`
                    : 'Agentic-search status is loading.'}
                </p>
              </div>
              <StatusPill status={agenticSearchHealth?.status === 'ready' ? 'ok' : agenticSearchHealth?.status === 'blocked' ? 'down' : 'degraded'} />
            </div>
            {agenticSearchHealth?.missing.length ? (
              <p className="mt-2 text-xs leading-5 text-amber-700">
                Missing: {agenticSearchHealth.missing.slice(0, 3).join('; ')}
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-navy-500">Run ledger, queue, worker, grounding, and ADK posture are visible.</p>
            )}
          </div>
          {visibleChecks.map((check) => (
            <div key={check.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-navy-950">{check.label}</p>
                  <p className="mt-1 text-xs text-navy-500">{check.id}{typeof check.latencyMs === 'number' ? ` · ${check.latencyMs} ms` : ''}</p>
                </div>
                <StatusPill status={check.status} />
              </div>
              {repairActionFor(check) ? (
                <p className="mt-2 text-xs leading-5 text-amber-700">{repairActionFor(check)}</p>
              ) : null}
            </div>
          ))}
        </div>

        {coreChecks.length > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-navy-950">Core health</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {coreChecks.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-navy-600">{key}</span>
                  <span className="text-navy-500">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <InfoPanel title="Doctor commands">
            <p className="font-mono text-xs">npm run doctor:praxis -- --mode=full --base-url=https://praxis.tacitus.me</p>
            <p className="mt-2 font-mono text-xs">npm run doctor:praxis:canary -- --base-url=https://praxis.tacitus.me</p>
          </InfoPanel>
          <InfoPanel title="Diagnostic endpoints">
            <div className="flex flex-wrap gap-2">
              <Link href="/api/health/runtime" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-white">
                <ServerCog className="h-4 w-4" />
                Runtime JSON
              </Link>
              <Link href="/api/health/agentic-search" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-white">
                <Search className="h-4 w-4" />
                Research JSON
              </Link>
              <Link href="/api/admin/system-health" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-white">
                <TerminalSquare className="h-4 w-4" />
                Admin JSON
              </Link>
            </div>
          </InfoPanel>
        </div>
      </section>
      <section data-testid="advanced-memory-review-panel" className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-400">Advanced memory</p>
            <h3 className="mt-1 text-base font-semibold text-navy-950">Cognee memory review</h3>
            <p className="mt-1 text-sm leading-6 text-navy-500">
              {memoryHealth?.status ?? (memoryHealth?.enabled ? 'configured' : 'memory_layer_disabled')}
              {memoryHealth?.reason ? ` - ${memoryHealth.reason}` : ''}
            </p>
          </div>
          <StatusPill status={memoryHealth?.ready ? 'ok' : memoryHealth?.enabled ? 'degraded' : 'unconfigured'} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Last recall" value={memoryHealth?.lastRecallReceipt ?? 'none'} />
          <Metric label="Last remember" value={memoryHealth?.lastRememberReceipt ?? 'none'} />
          <Metric label="Candidates" value={memoryCandidates.length} />
        </div>

        <div className="space-y-2">
          {memoryCandidates.slice(0, 5).map((candidate) => {
            const candidateId = candidate.candidateId ?? candidate.id ?? 'candidate';
            return (
              <article key={candidateId} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy-950">{candidate.title ?? candidate.type ?? candidateId}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-navy-500">{candidate.text ?? 'Review candidate provenance before promotion.'}</p>
                    <p className="mt-1 text-[11px] text-navy-400">
                      {[candidate.capsuleId, candidate.sourceId, candidate.runId].filter(Boolean).join(' / ') || 'capsule/source/run provenance pending'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <ActionButton icon={CheckCircle2} label="Promote" onClick={() => decideMemoryCandidate(candidate, 'promote')} disabled={memoryAction !== null} variant="secondary" />
                    <ActionButton icon={RefreshCcw} label="Reject" onClick={() => decideMemoryCandidate(candidate, 'reject')} disabled={memoryAction !== null} variant="secondary" />
                  </div>
                </div>
              </article>
            );
          })}
          {memoryCandidates.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-navy-500">
              No Cognee candidates are waiting for review. Candidate promotion remains gated through the memory review endpoints.
            </p>
          ) : null}
        </div>
      </section>
      <section data-testid="authenticated-runtime-test-lane" className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-400">Authenticated testing</p>
            <h3 className="mt-1 text-base font-semibold text-navy-950">Runtime and app test lane</h3>
            <p className="mt-1 text-sm leading-6 text-navy-500">
              Agents can run these checks from the repo terminal after the disposable Firebase test user and ADC are available in the shell.
            </p>
          </div>
          <Link
            href="/api/health/runtime"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-slate-50"
          >
            <ServerCog className="h-4 w-4" />
            Runtime JSON
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Test account" value="required" />
          <Metric label="Base URL" value="localhost or live" />
          <Metric label="ADC" value="required" />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold text-navy-950">PowerShell setup</p>
          <div className="mt-3 space-y-2 rounded-lg bg-navy-950 p-3 font-mono text-xs leading-5 text-white">
            <p>$env:TEST_FIREBASE_EMAIL=&quot;&lt;test-user@example.com&gt;&quot;</p>
            <p>$env:TEST_FIREBASE_PASSWORD=&quot;&lt;test-password&gt;&quot;</p>
            <p>$env:PLAYWRIGHT_BASE_URL=&quot;http://localhost:3000&quot;</p>
            <p>gcloud auth application-default login --project=praxisbytacitus</p>
          </div>
        </div>

        <div className="grid gap-3">
          {AUTHENTICATED_TEST_LANES.map((lane) => (
            <div key={lane.command} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-950">{lane.label}</p>
                  <p className="mt-1 text-xs leading-5 text-navy-500">{lane.detail}</p>
                </div>
                <p className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-navy-700">{lane.command}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <InfoPanel title="Full lane">
            <p className="font-mono text-xs">npm run test:auth-runtime</p>
            <p className="mt-2 font-mono text-xs">npm run test:auth-runtime -- --continue-on-failure</p>
          </InfoPanel>
          <InfoPanel title="Runbook">
            <p className="font-mono text-xs">docs/testing/AUTHENTICATED_RUNTIME_TEST_LANE.md</p>
          </InfoPanel>
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: RuntimeHealthStatus }) {
  const className = status === 'ok'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'degraded' || status === 'unconfigured'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-red-200 bg-red-50 text-red-700';
  return (
    <span className={cn('rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em]', className)}>
      {status}
    </span>
  );
}

function DiagnosticStatusPill({ status }: { status: AppDiagnosticStatus }) {
  const mapped: RuntimeHealthStatus = status === 'healthy'
    ? 'ok'
    : status === 'blocked'
      ? 'down'
      : 'degraded';
  return <StatusPill status={mapped} />;
}

function repairActionFor(check: unknown): string | null {
  if (!check || typeof check !== 'object' || !('repairAction' in check)) return null;
  const value = check.repairAction;
  return typeof value === 'string' ? value : null;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-diplomatic-blue"
      />
    </label>
  );
}

function SelectField<T extends readonly string[]>({
  label,
  value,
  options,
  onChange,
  format,
}: {
  label: string;
  value: string;
  options: T;
  onChange: (value: T[number]) => void;
  format?: (value: T[number]) => string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T[number])}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-diplomatic-blue"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {format ? format(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-400">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-navy-950">{value}</p>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-navy-600">
      <h3 className="mb-2 text-sm font-semibold text-navy-950">{title}</h3>
      {children}
    </section>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary'
          ? 'bg-diplomatic-blue text-white hover:bg-navy-900'
          : 'border border-slate-200 text-navy-700 hover:bg-slate-50',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string; data?: Partial<T> }> {
  try {
    const response = await fetch(url, { credentials: 'include', ...init });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : `${response.status} ${response.statusText}`;
      return { ok: false, error: message, data };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
