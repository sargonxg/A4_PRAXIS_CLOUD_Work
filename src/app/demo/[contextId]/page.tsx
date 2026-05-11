import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ArrowRight, Database, FileText, Layers3, MessageSquareText, RadioTower } from 'lucide-react';
import { ContextGraphPreview } from '@/components/graph/ContextGraphPreview';
import { getCaseModule } from '@/lib/cases/registry';

interface DemoContextPageProps {
  params: Promise<{ contextId: string }>;
}

export default async function DemoContextPage({ params }: DemoContextPageProps) {
  const { contextId } = await params;
  const caseModule = getCaseModule(contextId);

  if (!caseModule) {
    notFound();
  }

  const situationEpisodes = caseModule.episodes?.filter((episode) => episode.strand === 'situation') ?? [];
  const workEpisodes = caseModule.episodes?.filter((episode) => episode.strand === 'work') ?? [];
  const cachedResponses = caseModule.cachedResponses ?? [];
  const graphNodeCount = Object.values(caseModule.truthLayers).reduce((total, layer) => total + layer.nodeCount, 0);
  const graphEdgeCount = Object.values(caseModule.truthLayers).reduce((total, layer) => total + layer.edgeCount, 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.22),transparent_36%),linear-gradient(135deg,#18181b,#09090b_62%,#111827)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">PRAXIS cached demo</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">
              {caseModule.manifest.name}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-200 md:text-lg">
              {caseModule.manifest.summary}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={FileText} label="public sources" value={caseModule.sources.length.toString()} />
            <Metric icon={RadioTower} label="situation episodes" value={situationEpisodes.length.toString()} />
            <Metric icon={MessageSquareText} label="cached answers" value={cachedResponses.length.toString()} />
            <Metric icon={Layers3} label="graph objects" value={`${graphNodeCount}/${graphEdgeCount}`} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-8">
          <Panel title="Fast Answers">
            <div className="space-y-4">
              {cachedResponses.map((item) => (
                <article key={item.questionId} className="rounded-md border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-white">{item.question}</h2>
                    <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-200">
                      target {item.latencyTargetMs}ms
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{item.response}</p>
                  <p className="mt-4 text-xs font-medium text-amber-200">opens {item.targetPath}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Source Corpus">
            <div className="grid gap-3 md:grid-cols-2">
              {caseModule.sources.slice(0, 12).map((source) => (
                <a
                  key={source.receiptId}
                  href={source.url}
                  className="rounded-md border border-white/10 bg-white/[0.03] p-4 transition hover:border-amber-300/60 hover:bg-white/[0.06]"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{source.title}</p>
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-200">
                      {source.tier}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{source.provider}</p>
                </a>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-8">
          <Panel title="Episode Timeline">
            <ol className="space-y-3">
              {[...situationEpisodes.slice(0, 8), ...workEpisodes.slice(0, 3)].map((episode) => (
                <li key={episode.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {episode.strand} · {new Date(episode.validFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-100">{episode.title}</p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Graph Snapshot">
            <ContextGraphPreview
              title="Demo graph backbone"
              summary="The read-only demo shows how the context graph ties source receipts, actors, evidence, claims, and draftable outputs together before a user signs in."
              truthLayers={caseModule.truthLayers}
            />
          </Panel>

          <Link
            href={`/contexts/${caseModule.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
          >
            Open full workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </aside>
      </section>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.07] p-4">
      <Icon className="h-5 w-5 text-amber-300" aria-hidden="true" />
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">{label}</p>
    </div>
  );
}
