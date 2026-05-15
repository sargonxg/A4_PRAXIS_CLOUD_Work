import Link from 'next/link';
import { CheckCircle2, MessageSquareText, PenLine, ShieldCheck, UserRound } from 'lucide-react';
import { AdvancedExplanationPanel } from '@/components/app/advanced-explanation-panel';

const userSignals = [
  { label: 'Identity', value: 'Analyst profile', status: 'ready' },
  { label: 'Voice', value: 'Policy memo style', status: 'ready' },
  { label: 'Preferences', value: 'Review before graph changes', status: 'ready' },
];

export default function UserCorePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-16">
      <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">User Core</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">
              Set the analyst posture PRAXIS should use.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Choose the knowledge cores PRAXIS should use. Keep this page for direct edits to role, audience, tone, and review preferences.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/settings/profile" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              <PenLine className="h-4 w-4" />
              Edit profile
            </Link>
            <Link href="/app/assistant" className="inline-flex items-center gap-2 rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-sm font-semibold text-gold-900 hover:bg-gold-100">
              <MessageSquareText className="h-4 w-4" />
              Open Ask
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-diplomatic-blue" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Active posture</p>
              <h2 className="text-lg font-semibold text-navy-950">Senior policy analyst</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {userSignals.map((signal) => (
              <div key={signal.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{signal.label}</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-sm font-semibold text-navy-950">{signal.value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-gold-200 bg-gold-50 p-5 shadow-sm shadow-navy-950/5">
          <ShieldCheck className="h-5 w-5 text-gold-900" />
          <h2 className="mt-3 text-lg font-semibold text-navy-950">Ready for Ask</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            The User Core is attached to the active stack and can be changed before drafting.
          </p>
          <Link href="/app/contexts" className="mt-4 inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50">
            Manage stack
          </Link>
        </aside>
      </section>

      <AdvancedExplanationPanel
        items={[
          {
            title: 'What it stores',
            body: 'Role, audience, writing style, uncertainty tolerance, and review preferences are kept as a user-owned core.',
          },
          {
            title: 'How Ask uses it',
            body: 'Ask PRAXIS includes this posture in turn capsules so answers inherit the right professional frame before tools run.',
          },
          {
            title: 'Trust posture',
            body: 'The User Core can require citation, uncertainty, and graph-review behavior without exposing route names in the UI.',
          },
          {
            title: 'Maintenance',
            body: 'Advanced settings keep persona, model, notification, and API preferences available without crowding the main workflow.',
          },
        ]}
        actionHref="/app/settings/personas"
        actionLabel="Open persona settings"
      />
    </main>
  );
}
