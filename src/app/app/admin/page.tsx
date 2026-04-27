import Link from 'next/link';
import { Activity, Brain, Database, FileText, ShieldCheck, Users } from 'lucide-react';

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
    description: 'Review authenticated users, providers, profile status, and credits.',
    icon: Users,
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

export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-diplomatic-blue">Administrator</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy-900">PRAXIS Control Panel</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy-600">
          Admin-only operational workspace for developing PRAXIS safely: monitor health, review users,
          tune advisor knowledge, update domain configuration, and keep changes auditable.
        </p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Production shell/code execution is intentionally not exposed in-app. Use Cloud Shell or CI for code
        changes; this panel focuses on auditable diagnostics and configuration controls.
      </div>

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
