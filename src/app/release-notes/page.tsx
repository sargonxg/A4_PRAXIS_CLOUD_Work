import Link from 'next/link';
import type { Metadata } from 'next';
import { CURRENT_PRAXIS_RELEASE, PRAXIS_RELEASE_NOTES } from '@/lib/product/release-notes';
import { PraxisGlyphChip } from '@/components/brand/praxis-mark';

export const metadata: Metadata = {
  title: 'Release Notes | PRAXIS by TACITUS',
  description: 'Current PRAXIS release notes and build history.',
};

export default function ReleaseNotesPage() {
  return (
    <main className="landing-light min-h-screen bg-[var(--color-cream-100)] px-5 py-10 text-[color:var(--color-ink)]">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <PraxisGlyphChip size={34} />
            <span className="font-serif text-xl font-semibold text-[color:var(--color-diplomatic-blue)]">PRAXIS</span>
          </Link>
          <Link href="/app" className="rounded-full bg-white px-4 py-2 text-sm font-semibold">Open PRAXIS</Link>
        </header>
        <section className="py-14">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--color-gold-700)]">
            {CURRENT_PRAXIS_RELEASE.releaseLabel} · Build {CURRENT_PRAXIS_RELEASE.buildNumber}
          </p>
          <h1 className="mt-4 font-serif text-5xl font-semibold tracking-normal text-[color:var(--color-diplomatic-blue)]">
            Release notes
          </h1>
          <p className="mt-5 text-lg leading-8 text-[color:var(--color-ink)]/70">
            The public record of what changed in the PRAXIS ContextCapsule cockpit, runtime, and governance layer.
          </p>
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
      </div>
    </main>
  );
}
