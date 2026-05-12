import Link from 'next/link';
import { ArrowRight, BookOpenText, FolderKanban, MessageSquareText, Sparkles, UserRound, Wrench } from 'lucide-react';

export const metadata = { title: 'PRAXIS Tour | PRAXIS' };

const panels = [
  {
    title: 'Attach a User Core',
    caption: 'Role, audience, voice, and constraints shape every downstream answer.',
    icon: UserRound,
    tone: 'from-[#EAF5F7] to-white',
  },
  {
    title: 'Attach a Situation Core',
    caption: 'Actors, sources, events, and open questions become inspectable context.',
    icon: FolderKanban,
    tone: 'from-[#FFF7D6] to-white',
  },
  {
    title: 'Ask a question',
    caption: 'Ask PRAXIS answers with evidence, gaps, and clear next moves.',
    icon: MessageSquareText,
    tone: 'from-[#F1EEFF] to-white',
  },
  {
    title: 'Tools recommended',
    caption: 'PRAXIS recommends three tools that fit the attached core stack.',
    icon: Wrench,
    tone: 'from-[#FFF0EA] to-white',
  },
  {
    title: 'Memo drafted in PraxisWriter',
    caption: 'The answer becomes a cited memo block inside the editor.',
    icon: BookOpenText,
    tone: 'from-[#E9F7F3] to-white',
  },
] as const;

export default function TourPage() {
  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-10 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a5a00]">90-second tour</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-6xl">
            From context to cited memo in one PRAXIS loop.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#4B5563]">
            A quick walkthrough of the MVP arc: attach cores, ask PRAXIS, accept the right tools, and write the artifact.
          </p>
        </header>

        <section className="mt-10 grid gap-4 lg:grid-cols-5" aria-label="PRAXIS tour panels">
          {panels.map((panel, index) => {
            const Icon = panel.icon;
            return (
              <article key={panel.title} className="rounded-xl border border-[#D9E2E8] bg-white p-3 shadow-sm">
                <div className={`aspect-[4/3] rounded-lg bg-gradient-to-br ${panel.tone} p-4`}>
                  <div className="flex h-full flex-col justify-between rounded-md border border-white/70 bg-white/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#5C6975]">0{index + 1}</span>
                      <Icon className="h-5 w-5 text-[#0B3B4A]" />
                    </div>
                    <div>
                      <div className="mb-3 h-1.5 w-20 rounded-full bg-[#0B3B4A]/20" />
                      <div className="mb-2 h-1.5 w-28 rounded-full bg-[#0B3B4A]/15" />
                      <div className="h-1.5 w-16 rounded-full bg-[#E8B931]/70" />
                    </div>
                  </div>
                </div>
                <h2 className="mt-4 text-sm font-semibold text-[#111827]">{panel.title}</h2>
                <p className="mt-2 text-xs leading-5 text-[#5C6975]">{panel.caption}</p>
              </article>
            );
          })}
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md bg-[#E8B931] px-5 py-3 text-sm font-semibold text-[#111827] hover:bg-[#f2ca4b]"
          >
            Start your workspace <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/app/demo/syria-2024/write?guided=1"
            className="inline-flex items-center gap-2 rounded-md border border-[#4A90A4] bg-white px-5 py-3 text-sm font-semibold text-[#0B3B4A] hover:bg-[#EAF5F7]"
          >
            See the memo path <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
