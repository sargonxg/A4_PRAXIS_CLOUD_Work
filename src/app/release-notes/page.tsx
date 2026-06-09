import Link from 'next/link';
import type { Metadata } from 'next';
import { CURRENT_PRAXIS_RELEASE, PRAXIS_RELEASE_NOTES } from '@/lib/product/release-notes';
import { PraxisGlyphChip } from '@/components/brand/praxis-mark';
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
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <PraxisGlyphChip size={34} />
            <span className="font-serif text-xl font-semibold text-[color:var(--color-diplomatic-blue)]">PRAXIS</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-semibold text-[color:var(--color-ink)]/65">
            <Link href="/">Home</Link>
            <Link href="/pricing" className="hidden md:inline">Pricing</Link>
            <Link href="/learn" className="hidden md:inline">Learn</Link>
            <Link href="/guide" className="hidden md:inline">Guide</Link>
            <Link href="/release-notes" className="hidden md:inline">Release notes</Link>
            <Link href="/login" className="rounded-full bg-white px-4 py-2 text-[color:var(--color-ink)]">Sign in</Link>
          </nav>
        </header>
        <section className="py-14">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--color-gold-700)]">
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
          {PRAXIS_RELEASE_NOTES.map((note) => (
            <article key={note.buildNumber} className="rounded-2xl border border-[color:var(--color-rose-gold)]/25 bg-white/70 p-6 shadow-sm">
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
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-gold-500)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
    </PublicPageShell>
  );
}
