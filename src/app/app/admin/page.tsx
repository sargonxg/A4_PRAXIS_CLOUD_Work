import { Activity, Brain, CheckCircle2, CreditCard, Database, FileText, KeyRound, Route, ShieldCheck, Users } from 'lucide-react';
import AdvisorFeedPage from '@/app/app/admin/advisor-feed/page';
import AdvisorsPage from '@/app/app/admin/advisors/page';
import DiagnosticsPage from '@/app/app/admin/diagnostics/page';
import DomainsPage from '@/app/app/admin/domains/page';
import OperatorConsolePage from '@/app/app/admin/operator-console/page';
import PathsPage from '@/app/app/admin/paths/page';
import UsersPage from '@/app/app/admin/users/page';
import { getAdminGateStatus } from '@/lib/auth/admin-gate';
import { getAdminSession } from '@/lib/auth/admin-session';
import { cn } from '@/lib/utils/cn';

const adminTools = [
  {
    id: 'operator',
    href: '/app/admin?tab=operator',
    title: 'Operator Console',
    description: 'Live jobs, tool runs, incidents, and platform events.',
    icon: Activity,
  },
  {
    id: 'diagnostics',
    href: '/app/admin?tab=diagnostics',
    title: 'Diagnostics',
    description: 'Firebase, AI provider, feed, secret, and runtime health checks.',
    icon: ShieldCheck,
  },
  {
    id: 'users',
    href: '/app/admin?tab=users',
    title: 'Users',
    description: 'Review authenticated users, Polar status, promo expiry, provider keys, and credits.',
    icon: Users,
  },
  {
    href: '/app/settings/system-health',
    title: 'Billing & Provider Health',
    description: 'Check Polar, Google Grounding, Google Search, Vertex, Google AI, Secret Manager, and runtime configuration.',
    icon: CreditCard,
  },
  {
    href: '/app/settings/api-keys',
    title: 'Provider Key Registry',
    description: 'Validate user/platform provider coverage for Google AI, Google Grounding, Google Search, Google Search, and model keys.',
    icon: KeyRound,
  },
  {
    id: 'advisors',
    href: '/app/admin?tab=advisors',
    title: 'Advisor Council',
    description: 'Edit advisor personas, source categories, tools, model tier, and memory policy.',
    icon: Brain,
  },
  {
    id: 'advisor-feed',
    href: '/app/admin?tab=advisor-feed',
    title: 'Advisor Feed',
    description: 'Curate methodology notes, source guidance, warnings, and playbooks for advisor retrieval.',
    icon: FileText,
  },
  {
    id: 'domains',
    href: '/app/admin?tab=domains',
    title: 'Domain Taxonomy',
    description: 'Tune lens weights, source preferences, frameworks, and prompt overrides.',
    icon: Database,
  },
  {
    id: 'paths',
    href: '/app/admin?tab=paths',
    title: 'Path Core',
    description: 'Tune path overlays for tools, source mix, prompt voice, time horizon, and credit multipliers.',
    icon: Route,
  },
];

type AdminTab = 'overview' | 'operator' | 'diagnostics' | 'users' | 'advisors' | 'advisor-feed' | 'domains' | 'paths';

const canonicalTabs: Array<{ id: AdminTab; label: string; href: string }> = [
  { id: 'overview', label: 'Overview', href: '/app/admin' },
  { id: 'operator', label: 'Operator', href: '/app/admin?tab=operator' },
  { id: 'diagnostics', label: 'Diagnostics', href: '/app/admin?tab=diagnostics' },
  { id: 'users', label: 'Users', href: '/app/admin?tab=users' },
  { id: 'advisors', label: 'Advisors', href: '/app/admin?tab=advisors' },
  { id: 'advisor-feed', label: 'Advisor Feed', href: '/app/admin?tab=advisor-feed' },
  { id: 'domains', label: 'Domains', href: '/app/admin?tab=domains' },
  { id: 'paths', label: 'Paths', href: '/app/admin?tab=paths' },
];

function normalizeAdminTab(tab: string | string[] | undefined): AdminTab {
  const value = Array.isArray(tab) ? tab[0] : tab;
  if (canonicalTabs.some((item) => item.id === value)) return value as AdminTab;
  return 'overview';
}

function AdminTabContent({ tab }: { tab: AdminTab }) {
  if (tab === 'operator') return <OperatorConsolePage />;
  if (tab === 'diagnostics') return <DiagnosticsPage />;
  if (tab === 'users') return <UsersPage />;
  if (tab === 'advisors') return <AdvisorsPage />;
  if (tab === 'advisor-feed') return <AdvisorFeedPage />;
  if (tab === 'domains') return <DomainsPage />;
  if (tab === 'paths') return <PathsPage />;
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {adminTools.map((tool) => {
        const Icon = tool.icon;
        return (
          <a
            key={tool.href}
            href={tool.href}
            className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm transition hover:border-diplomatic-blue/40 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-diplomatic-blue/10 p-2 text-diplomatic-blue">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-navy-900">{tool.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-navy-500">{tool.description}</p>
              </div>
            </div>
          </a>
        );
      })}
    </section>
  );
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const query = await searchParams;
  const activeTab = normalizeAdminTab(query.tab);
  const [admin, gate] = await Promise.all([
    getAdminSession(),
    Promise.resolve(getAdminGateStatus()),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-diplomatic-blue">Administrator</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy-900">PRAXIS Control Panel</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy-600">
              Admin-only operational workspace for monitoring health, reviewing users, tuning advisor
              knowledge, updating domain configuration, and keeping changes auditable.
            </p>
          </div>
          {admin ? (
            <div className="min-w-64 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Admin verified
              </div>
              <div className="mt-1 font-mono text-xs">{admin.email}</div>
              <div className="mt-1 text-xs text-emerald-800">Gate: {admin.accessReason}</div>
            </div>
          ) : null}
        </div>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Production shell/code execution is intentionally not exposed in-app. Use Cloud Shell or CI for code
        changes; this panel focuses on auditable diagnostics and configuration controls.
      </div>

      <nav className="flex flex-wrap gap-2 rounded-lg border border-navy-200 bg-white p-2 shadow-sm" aria-label="Admin sections">
        {canonicalTabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            className={cn(
              'rounded-md px-3 py-2 text-xs font-semibold transition',
              activeTab === tab.id
                ? 'bg-navy-950 text-white'
                : 'text-navy-600 hover:bg-navy-50 hover:text-navy-950',
            )}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {activeTab === 'overview' ? <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-navy-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-navy-500">Admin allowlist</div>
          <div className="mt-2 text-sm text-navy-700">
            <span className="font-mono text-xs">giulio@tacitus.me</span> is built in and remains allowed even when env vars add more admins.
          </div>
        </div>
        <div className="rounded-lg border border-navy-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-navy-500">Verified emails</div>
          <div className="mt-2 font-mono text-xs text-navy-700">
            {gate.configuredEmailAllowlist.join(', ')}
          </div>
        </div>
        <div className="rounded-lg border border-navy-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-navy-500">UID entries</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">{gate.configuredUidCount}</div>
        </div>
      </section> : null}

      <AdminTabContent tab={activeTab} />
    </div>
  );
}
