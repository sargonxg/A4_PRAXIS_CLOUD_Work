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
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { DangerZone } from '@/components/settings/danger-zone';
import { useAuth } from '@/lib/auth/auth-context';
import { MODEL_PREFERENCE_VALUES, modelPreferenceLabel, type ModelPreferenceValue } from '@/lib/ai/model-preferences';
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
  marketingConsent?: boolean;
  isDemo?: boolean;
};

type WeeklyUsage = {
  allowance: number;
  used: number;
  remaining: number;
  weekKey?: string;
  nextResetAt?: string;
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

const DEFAULT_AI_SETTINGS: AiSettings = {
  preferredModel: MODEL_PREFERENCE_VALUES[0],
  temperature: 0.4,
  researchDepth: 'standard',
  customInstructions: '',
  maxTokens: 4096,
};

const DEFAULT_USAGE: WeeklyUsage = { allowance: 1, used: 0, remaining: 1 };

const TABS: Array<{ id: SettingsTab; label: string; icon: LucideIcon; detail: string }> = [
  { id: 'profile', label: 'Profile', icon: UserRound, detail: 'User Core and analyst posture' },
  { id: 'billing', label: 'Billing', icon: CreditCard, detail: 'Plan, checkout, portal' },
  { id: 'usage', label: 'Usage', icon: BarChart3, detail: 'Credits and weekly allowance' },
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
  const [usage, setUsage] = useState<WeeklyUsage>(DEFAULT_USAGE);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [providers, setProviders] = useState<ProviderPayload>({ providers: {}, statuses: {} });
  const [accountDraft, setAccountDraft] = useState({ displayName: '', role: '', orgName: '', orgId: '', marketingConsent: false });
  const [connectorDrafts, setConnectorDrafts] = useState<Record<string, Record<string, string>>>({});
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const activeMeta = useMemo(() => TABS.find((tab) => tab.id === activeTab) ?? TABS[0], [activeTab]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStatus(null);
      const [accountRes, profileRes, usageRes, prefsRes, aiRes, providersRes] = await Promise.all([
        fetchJson<AccountRecord>('/api/account'),
        fetchJson<ResolvedProfile>('/api/profile/resolved'),
        fetchJson<WeeklyUsage>('/api/usage/weekly-free'),
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
    const result = await fetchJson<{ url?: string; fallbackHref?: string }>('/api/billing/portal', { method: 'POST' });
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
    const result = await fetchJson<{ url?: string; fallbackHref?: string }>('/api/billing/checkout', {
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

  return (
    <div className="space-y-6" data-testid="account-settings-page">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Settings</p>
            <h1 className="mt-2 text-2xl font-semibold text-navy-950">Account and workspace settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-500">
              Manage the user profile, billing, usage, security, connectors, workspace preferences, and AI runtime from one place.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-navy-950">{account?.displayName ?? user?.name ?? 'Analyst'}</p>
            <p className="mt-1 text-xs text-navy-500">{accountEmail}</p>
            <p className="mt-2 inline-flex rounded-md border border-gold-200 bg-gold-50 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-800">
              {plan} plan
            </p>
          </div>
        </div>
        {status ? (
          <p role="status" className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            {status}
          </p>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <nav className="space-y-1" aria-label="Account settings sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition',
                    active ? 'bg-diplomatic-blue text-white' : 'text-navy-700 hover:bg-slate-50',
                  )}
                >
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'text-white' : 'text-navy-400')} />
                  <span>
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span className={cn('mt-0.5 block text-xs', active ? 'text-white/75' : 'text-navy-400')}>{tab.detail}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-950">{activeMeta.label}</h2>
              <p className="text-sm text-navy-500">{activeMeta.detail}</p>
            </div>
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-navy-400" /> : null}
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
              credits={credits}
              totalCreditsUsed={totalCreditsUsed}
              busyAction={busyAction}
              onPortal={openBillingPortal}
              onCheckout={startCheckout}
            />
          ) : null}

          {activeTab === 'usage' ? <UsageTab usage={usage} credits={credits} totalCreditsUsed={totalCreditsUsed} /> : null}

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
    </div>
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
          Review User Core
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Profile version" value={analyst?.meta?.version ?? 0} />
        <Metric label="Primary domain" value={analyst?.perspective?.primaryDomain ?? 'generic'} />
        <Metric label="Audience" value={analyst?.perspective?.audience ?? 'not set'} />
      </div>
      <InfoPanel title="User Core summary">
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
  credits,
  totalCreditsUsed,
  busyAction,
  onPortal,
  onCheckout,
}: {
  plan: string;
  credits: number;
  totalCreditsUsed: number;
  busyAction: string | null;
  onPortal: () => void;
  onCheckout: (plan: 'analyst' | 'team') => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Current plan" value={plan} />
        <Metric label="Credits remaining" value={credits} />
        <Metric label="Credits used" value={totalCreditsUsed} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={CreditCard} label={busyAction === 'billing-portal' ? 'Opening...' : 'Manage subscription'} onClick={onPortal} disabled={busyAction !== null} />
        <ActionButton icon={CheckCircle2} label={busyAction === 'checkout-analyst' ? 'Starting...' : 'Start Analyst checkout'} onClick={() => onCheckout('analyst')} disabled={busyAction !== null} />
        <ActionButton icon={CheckCircle2} label={busyAction === 'checkout-team' ? 'Starting...' : 'Start Team checkout'} onClick={() => onCheckout('team')} disabled={busyAction !== null} />
      </div>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        If Polar billing is not configured in this environment, PRAXIS sends users to the public pricing page instead of failing silently.
      </p>
    </div>
  );
}

function UsageTab({ usage, credits, totalCreditsUsed }: { usage: WeeklyUsage; credits: number; totalCreditsUsed: number }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Credits remaining" value={credits} />
        <Metric label="Total credits used" value={totalCreditsUsed} />
        <Metric label="Free conversations left" value={usage.remaining} />
      </div>
      <InfoPanel title="Weekly free conversation">
        <p>Week: {usage.weekKey ?? 'current'}</p>
        <p>Used: {usage.used} of {usage.allowance}</p>
        <p>Next reset: {usage.nextResetAt ? new Date(usage.nextResetAt).toLocaleString() : 'not available'}</p>
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
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Preferred model"
          value={aiSettings.preferredModel}
          options={MODEL_PREFERENCE_VALUES}
          format={(value) => modelPreferenceLabel(value as ModelPreferenceValue)}
          onChange={(value) => setAiSettings((settings) => ({ ...settings, preferredModel: value }))}
        />
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
    </div>
  );
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
