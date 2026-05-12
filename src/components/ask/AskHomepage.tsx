'use client';

import Link from 'next/link';
import { BookOpen, FileText, Layers3, Search, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AskBar } from '@/components/ask/AskBar';
import type { UserModelRecord } from '@/lib/user-models/types';

interface AskContextOption {
  id: string;
  name: string;
  summary: string;
  region: string;
}

export function AskHomepage({
  userModels,
  contexts,
}: {
  userModels: UserModelRecord[];
  contexts: AskContextOption[];
}) {
  const activeUser = userModels[0];
  const activeContext = contexts[0];
  const hasContext = Boolean(activeContext);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <header className="grid gap-4 border-b border-slate-200 pb-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <p className="text-[11px] font-semibold uppercase text-navy-500">Authenticated home</p>
          <h1 className="mt-1 text-2xl font-semibold text-navy-950 sm:text-3xl">Ask PRAXIS from a user model and a context.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-navy-600">
            Start with a question, preview the plan, then choose whether to run the answer path. PRAXIS keeps context, source posture, and capture decisions visible.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <PickerCard icon={UserRound} label="User Core" title={activeUser?.identity ?? 'No user core'} href="/app/cores/user" />
          <PickerCard icon={Layers3} label="Situation Core" title={activeContext?.name ?? 'No situation selected'} href="/app/cores/context" />
        </div>
      </header>

      <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AskBar activeContextName={activeContext?.name ?? 'No context selected'} hasContext={hasContext} />

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-navy-900">Recent contexts</h2>
            <div className="mt-3 space-y-2">
              {contexts.slice(0, 4).map((context) => (
                <Link key={context.id} href={`/app/workbench/${context.id}`} className="block rounded-md border border-slate-200 bg-slate-50 p-3 hover:bg-white">
                  <p className="text-sm font-semibold text-navy-900">{context.name}</p>
                  <p className="mt-1 text-xs text-navy-600">{context.region}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-navy-900">Work links</h2>
            <div className="mt-3 grid gap-2">
              <UtilityLink icon={Search} href="/app/tools" label="Suggested Tools" />
              <UtilityLink icon={Layers3} href="/app/cores/context" label="Manage Situation Cores" />
              <UtilityLink icon={UserRound} href="/app/cores/user" label="Manage User Cores" />
              <UtilityLink icon={FileText} href="/app/workbench?openChapter=memos" label="Memo Output" />
              <UtilityLink icon={BookOpen} href="/app/dashboard" label="Dashboard" />
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function PickerCard({ icon: Icon, label, title, href }: { icon: LucideIcon; label: string; title: string; href: string }) {
  return (
    <Link href={href} className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-navy-700">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase text-navy-500">{label}</span>
        <span className="mt-1 block truncate text-sm font-semibold text-navy-900">{title}</span>
      </span>
    </Link>
  );
}

function UtilityLink({ icon: Icon, href, label }: { icon: LucideIcon; href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-white">
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
