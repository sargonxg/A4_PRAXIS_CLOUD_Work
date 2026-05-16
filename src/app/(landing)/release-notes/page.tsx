import Link from 'next/link';
import { CalendarDays, CheckCircle2, Hash, ShieldCheck } from 'lucide-react';
import { CURRENT_PRAXIS_RELEASE, PRAXIS_RELEASE_NOTES } from '@/lib/product/release-notes';

export const metadata = {
  title: 'Release Notes',
  description: 'Recent PRAXIS product and runtime checkpoints, with centralized build numbers.',
};

export default function ReleaseNotesPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f1] bg-[linear-gradient(90deg,rgba(26,51,43,0.045)_1px,transparent_1px),linear-gradient(180deg,rgba(26,51,43,0.045)_1px,transparent_1px)] bg-[size:56px_56px] text-slate-950">
      <header className="border-b border-black/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-2xl font-semibold text-diplomatic-blue">PRAXIS</Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 sm:flex">
            <Link href="/learn">Learn</Link>
            <Link href="/tacitus">TACITUS</Link>
          </nav>
          <Link href="/login" className="text-sm font-semibold text-gold-700">Sign in</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-sage/10 px-3 py-1.5 text-sm font-semibold text-sage">
            <ShieldCheck className="h-4 w-4" />
            Central release ledger
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                What changed in PRAXIS.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                Product-facing release notes are now tied to the same centralized version and build metadata used by the app. Significant UI, runtime, and documentation changes should update this page, the changelog, and the build number together.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current build</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{CURRENT_PRAXIS_RELEASE.releaseLabel}</p>
              <p className="mt-1 font-mono text-sm text-slate-600">Build {CURRENT_PRAXIS_RELEASE.buildNumber}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{CURRENT_PRAXIS_RELEASE.buildDate}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {PRAXIS_RELEASE_NOTES.map((note) => (
            <article key={note.buildNumber} className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm shadow-slate-900/5 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {note.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      Build {note.buildNumber}
                    </span>
                    <span>{note.category}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">{note.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{note.summary}</p>
                </div>
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600">
                  v{note.version}
                </span>
              </div>
              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {note.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
