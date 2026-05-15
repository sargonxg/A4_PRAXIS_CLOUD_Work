import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

const notes = [
  {
    date: '2026-05-15',
    title: 'ContextCapsule-native app foundation',
    items: [
      'Homepage prompt path preserves capsule prompt, policy path, and output goal through login.',
      'Ask PRAXIS shows capsule AI readiness before users run work.',
      'Agent run ledger, Cloud Tasks dispatch boundary, Genkit mirror hooks, and ADK bridge contracts are in place.',
    ],
  },
  {
    date: '2026-05-15',
    title: 'Simplified app shell',
    items: [
      'Visible navigation stays Home, Ask PRAXIS, Library, Memo Studio, Canvas, and Advanced.',
      'ContextCapsule management is available from the sidebar and context repository.',
      'Sourceability is a canonical capsule-aware tool.',
    ],
  },
];

export const metadata = {
  title: 'Release Notes',
  description: 'Recent PRAXIS product and runtime checkpoints.',
};

export default function ReleaseNotesPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-2xl font-semibold text-diplomatic-blue">PRAXIS</Link>
          <Link href="/learn" className="text-sm font-semibold text-gold-700">Learn</Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Release notes</p>
        <h1 className="mt-4 font-serif text-5xl font-semibold">What changed in PRAXIS.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          Short product-facing notes. Detailed engineering history remains in the repository changelog and build ledgers.
        </p>
        <div className="mt-10 space-y-5">
          {notes.map((note) => (
            <article key={`${note.date}-${note.title}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{note.date}</p>
              <h2 className="mt-2 text-xl font-semibold">{note.title}</h2>
              <ul className="mt-4 space-y-2">
                {note.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
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

