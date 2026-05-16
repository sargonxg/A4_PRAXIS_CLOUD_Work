import Link from 'next/link';
import { ArrowRight, BrainCircuit, GitBranch, Landmark, ShieldCheck } from 'lucide-react';

const layers = [
  ['PRAXIS', 'The user-facing policy workbench for context, analysis, writing, review, and handover.'],
  ['DIALECTICA', 'The ingestion and knowledge layer that structures documents, sources, and graph evidence through a narrow adapter.'],
  ['KAIROS', 'The temporality layer for episodes, stale assumptions, deadlines, windows, and changing context.'],
  ['AGON', 'The human-friction layer for actors, claims, commitments, incentives, blockers, and conflict dynamics.'],
] as const;

export const metadata = {
  title: 'TACITUS',
  description: 'The TACITUS product architecture behind PRAXIS.',
};

export default function TacitusPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-2xl font-semibold text-diplomatic-blue">TACITUS</Link>
          <Link href="/app/assistant" className="text-sm font-semibold text-gold-700">Open PRAXIS</Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">TACITUS</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-tight">
          Software for statecraft, policy analysis, conflict intelligence, and institutional memory.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">
          TACITUS builds the deeper systems behind PRAXIS. The public product stays simple: users build ContextCapsules, ask the active capsule, use tools, and produce sourceable outputs. The TACITUS layers stay mostly behind the scenes.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {layers.map(([name, detail]) => (
            <article key={name} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2">
                {name === 'PRAXIS' ? <Landmark className="h-5 w-5 text-gold-700" /> : name === 'DIALECTICA' ? <GitBranch className="h-5 w-5 text-gold-700" /> : name === 'KAIROS' ? <BrainCircuit className="h-5 w-5 text-gold-700" /> : <ShieldCheck className="h-5 w-5 text-gold-700" />}
                <h2 className="text-lg font-semibold">{name}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/learn" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Learn PRAXIS
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="mailto:hello@tacitus.me" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
            Contact TACITUS
          </a>
        </div>
      </section>
    </main>
  );
}

