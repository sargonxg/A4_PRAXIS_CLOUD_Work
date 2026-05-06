import Link from 'next/link';
import { Activity, Brain, CheckCircle2, CreditCard, Database, FileText, KeyRound, ShieldCheck, Users } from 'lucide-react';
import { getAdminGateStatus } from '@/lib/auth/admin-gate';
import { getAdminSession } from '@/lib/auth/admin-session';

const adminTools = [
  {
    href: '/app/admin/operator-console',
    title: 'Operator Console',
    description: 'Live jobs, tool runs, incidents, and platform events.',
    icon: Activity,
  },
  {
    href: '/app/admin/diagnostics',
    title: 'Diagnostics',
    description: 'Firebase, AI provider, feed, secret, and runtime health checks.',
    icon: ShieldCheck,
  },
  {
    href: '/app/admin/users',
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
    href: '/app/admin/advisors',
    title: 'Advisor Council',
    description: 'Edit advisor personas, source categories, tools, model tier, and memory policy.',
    icon: Brain,
  },
  {
    href: '/app/admin/advisor-feed',
    title: 'Advisor Feed',
    description: 'Curate methodology notes, source guidance, warnings, and playbooks for advisor retrieval.',
    icon: FileText,
  },
  {
    href: '/app/admin/domains',
    title: 'Domain Taxonomy',
    description: 'Tune lens weights, source preferences, frameworks, and prompt overrides.',
    icon: Database,
  },
];

export default async function AdminHomePage() {
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

      <section className="grid gap-3 md:grid-cols-3">
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
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
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
            </Link>
          );
        })}
      </section>
    </div>
  );
}
