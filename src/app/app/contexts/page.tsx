import Link from 'next/link';
import { ArrowRight, Brain, FileText, LibraryBig, Plus, Target, Wrench } from 'lucide-react';
import { listExampleCases } from '@/lib/cases/registry';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import { CONTEXT_CORES } from '@/lib/product/context-core-map';
import { CONSOLIDATED_TOOLS } from '@/lib/constants/consolidated-tools';
import { CapsuleBoard } from '@/components/cores/capsule-board';
import { DomainPicker } from '@/components/cores/domain-picker';
import { PathPicker } from '@/components/cores/PathPicker';
import { CapsuleToolbar } from '@/components/cores/CapsuleToolbar';
import { CoreLibraryWorkbench } from '@/components/cores/CoreLibraryWorkbench';
import { listCoreLibrary } from '@/lib/cores/core-library';

export const metadata = { title: 'Core Library | PRAXIS' };

export default function AppContextsPage() {
  const examples = listExampleCases().slice(0, 4);
  const liveCores = CONTEXT_CORES.filter((core) => core.currentPosture !== 'staged');
  const libraryCores = listCoreLibrary({ limit: 120 });

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 pb-16">
      <section className="rounded-2xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-navy-950/5 backdrop-blur">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Core Library</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">
              Pick the user, situation, sources, graph, tools, and draft context before AI runs.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Cores are reusable context objects. Swap the user, situation, sources, graph, tools, objectives, product template, and memory before Ask PRAXIS runs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/cores/user" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              Manage User Cores
              <Brain className="h-4 w-4" />
            </Link>
            <Link href="/app/cores/context" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-50">
              Manage Situation Cores
              <Target className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <PathPicker />

      <CapsuleBoard />

      <CapsuleToolbar />

      <CoreLibraryWorkbench cores={libraryCores} />

      <DomainPicker />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-diplomatic-blue" />
            <h2 className="text-lg font-semibold text-navy-950">User Core library</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {PUBLIC_USER_MODELS.slice(0, 4).map((model) => (
              <Link key={model.modelId} href="/app/cores/user" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-diplomatic-blue/30 hover:bg-white">
                <p className="text-sm font-semibold text-navy-950">{model.identity}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{model.role} · {model.communicationStyle}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-gold-700" />
            <h2 className="text-lg font-semibold text-navy-950">Situation Core library</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {examples.map((example) => (
              <Link key={example.id} href={`/app/workbench/${example.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-gold-300 hover:bg-white">
                <p className="text-sm font-semibold text-navy-950">{example.manifest.name}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{example.manifest.region}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{example.manifest.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LibraryBig className="h-5 w-5 text-diplomatic-blue" />
            <h2 className="text-lg font-semibold text-navy-950">Attachable core types</h2>
          </div>
          <Link href="/app/write" className="inline-flex items-center gap-2 text-sm font-semibold text-diplomatic-blue">
            Open Write with PRAXIS
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {liveCores.map((core) => (
            <article key={core.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-navy-950">{core.label}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{core.ownerScope} · {core.currentPosture}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{core.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <LibraryAction href="/app/tools" icon={Wrench} title="Tool Library" body={`${CONSOLIDATED_TOOLS.length} consolidated tool families can attach to cores and Write with PRAXIS.`} cta="Open tools" />
        <LibraryAction href="/app/situations/new" icon={Plus} title="Create a Situation Core" body="Start a new reusable context with frame, actors, sources, ontology, and review gates." cta="Create context" />
        <LibraryAction href="/app/assistant" icon={Brain} title="Ask from selected cores" body="Ask PRAXIS should always know who is asking, what situation is active, and which tools are relevant." cta="Open Ask" />
        <LibraryAction href="/app/write" icon={FileText} title="Write from selected cores" body="Use the editor for long answers, memos, talking points, handovers, and export-ready drafts." cta="Open Write" />
      </section>
    </main>
  );
}

function LibraryAction({
  href,
  icon: Icon,
  title,
  body,
  cta,
}: {
  href: string;
  icon: typeof Brain;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link href={href} className="group rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 transition hover:-translate-y-0.5 hover:border-diplomatic-blue/30 hover:bg-white">
      <Icon className="h-5 w-5 text-diplomatic-blue" />
      <h2 className="mt-3 text-lg font-semibold text-navy-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-diplomatic-blue">
        {cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
