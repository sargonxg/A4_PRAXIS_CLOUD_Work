import type { Metadata } from 'next';
import { CURRENT_PRAXIS_RELEASE, PRAXIS_RELEASE_NOTES, type PraxisReleaseNote } from '@/lib/product/release-notes';
import { LivingContextRail, PublicPageShell } from '@/components/ui/instrument';

export const metadata: Metadata = {
  title: 'Release Notes',
  description: 'Current PRAXIS release notes and build history.',
  alternates: {
    canonical: '/release-notes',
  },
  openGraph: {
    title: 'PRAXIS Release Notes',
    description: 'Current PRAXIS release notes for the public workspace, runtime, and governance layer.',
    url: '/release-notes',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'PRAXIS release notes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRAXIS Release Notes',
    description: 'Current PRAXIS release notes for the workspace and runtime.',
    images: ['/opengraph-image'],
  },
};

export default function ReleaseNotesPage() {
  const releaseRailCells = [
    { id: 'profile', label: 'Profile', value: 'All users', detail: 'Public release record', state: 'ready' as const },
    { id: 'context', label: 'Context', value: CURRENT_PRAXIS_RELEASE.releaseLabel, detail: `Build ${CURRENT_PRAXIS_RELEASE.buildNumber}`, state: 'active' as const },
    { id: 'source', label: 'Source', value: 'Release notes', detail: 'Product and runtime notes', state: 'ready' as const },
    { id: 'output', label: 'Output', value: 'Release notes', detail: 'Reviewable history', state: 'quiet' as const },
    { id: 'readiness', label: 'Readiness', value: 'Current', detail: CURRENT_PRAXIS_RELEASE.buildDate, state: 'active' as const },
  ];

  return (
    <PublicPageShell maxWidth="max-w-4xl">
        <section className="py-14">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-700">
            {CURRENT_PRAXIS_RELEASE.releaseLabel} · Build {CURRENT_PRAXIS_RELEASE.buildNumber}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-normal text-[color:var(--color-diplomatic-blue)] sm:text-5xl">
            Release notes
          </h1>
          <p className="mt-5 text-lg leading-8 text-[color:var(--color-ink)]/70">
            The public record of what changed in the PRAXIS workspace, runtime, and governance layer.
          </p>
          <LivingContextRail cells={releaseRailCells} compact className="mt-8" />
        </section>
        <section className="space-y-5">
          {PRAXIS_RELEASE_NOTES.slice(0, 3).map((note) => <ReleaseNoteCard key={note.buildNumber} note={note} />)}
          <details className="rounded-2xl border border-slate-200 bg-white/60 p-6">
            <summary className="cursor-pointer text-base font-semibold text-slate-800">Earlier releases ({PRAXIS_RELEASE_NOTES.length - 3})</summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">Historical release entries describe the product at that time. See the latest notes and Guide for the current workflow and availability.</p>
            <div className="mt-5 space-y-5">{PRAXIS_RELEASE_NOTES.slice(3).map((note) => <ReleaseNoteCard key={note.buildNumber} note={note} />)}</div>
          </details>
        </section>
    </PublicPageShell>
  );
}

function ReleaseNoteCard({ note }: { note: PraxisReleaseNote }) {
  return (
            <article className="rounded-2xl border border-[color:var(--color-rose-gold)]/25 bg-white/70 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--color-ink)]/45">{note.date} · {note.category}</p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-[color:var(--color-diplomatic-blue)]">{note.title}</h2>
                </div>
                <span className="rounded-full border border-[color:var(--color-rose-gold)]/30 px-3 py-1 font-mono text-xs text-[color:var(--color-ink)]/55">
                  {note.buildNumber}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[color:var(--color-ink)]/70">{note.summary}</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[color:var(--color-ink)]/70">
                {note.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
  );
}
