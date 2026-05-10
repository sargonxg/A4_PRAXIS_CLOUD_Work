import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCaseModule } from '@/lib/cases/registry';
import { EpisodeProvider } from '@/components/contexts/EpisodeContext';
import { buildContextEpisodes } from '@/components/contexts/context-panel-data';
import { FramePanel } from '@/components/contexts/panels/FramePanel';
import { SourcesPanel } from '@/components/contexts/panels/SourcesPanel';
import { ExtractionLensesPanel } from '@/components/contexts/panels/ExtractionLensesPanel';
import { WorkProcessPanel } from '@/components/contexts/panels/WorkProcessPanel';
import { TimelinePanel } from '@/components/contexts/panels/TimelinePanel';
import { GraphPanel } from '@/components/contexts/panels/GraphPanel';
import { DraftsPanel } from '@/components/contexts/panels/DraftsPanel';
import { MethodsUsedPanel } from '@/components/contexts/panels/MethodsUsedPanel';
import { isContextPanelId, type ContextPanelId } from '@/types/context-panels';

const panels: Array<{ id: ContextPanelId; label: string; hint: string }> = [
  { id: 'frame', label: 'Frame', hint: 'Scope and assumptions' },
  { id: 'sources', label: 'Sources', hint: 'Documents, research, feeds' },
  { id: 'lenses', label: 'Extraction Lenses', hint: 'Domain ontology stack' },
  { id: 'work', label: 'Work Process', hint: 'Work ontology' },
  { id: 'timeline', label: 'Timeline', hint: 'Situation and work episodes' },
  { id: 'graph', label: 'Graph', hint: 'Nodes and provenance' },
  { id: 'drafts', label: 'Drafts', hint: 'Outputs from context' },
  { id: 'methods', label: 'Methods Used', hint: 'Runs and evidence' },
];

export default async function ContextDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams?: Promise<{ panel?: string }>;
}) {
  const [{ caseId }, query] = await Promise.all([params, searchParams]);
  const caseModule = getCaseModule(caseId);
  if (!caseModule) notFound();
  const activePanel = isContextPanelId(query?.panel) ? query.panel : 'frame';
  const episodes = buildContextEpisodes(caseModule);

  return (
    <EpisodeProvider episodes={episodes}>
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:h-screen">
            <Link href="/contexts" className="text-sm text-slate-600 hover:text-slate-950">Back to contexts</Link>
            <h1 className="mt-4 text-xl font-semibold">{caseModule.manifest.name}</h1>
            <p className="mt-2 text-sm text-slate-600">{caseModule.manifest.region}</p>
            <nav className="mt-6 grid gap-1">
              {panels.map((panel) => (
                <Link key={panel.id} href={`/contexts/${caseId}?panel=${panel.id}`} className={`border px-3 py-2 text-sm ${activePanel === panel.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-transparent hover:border-slate-300'}`}>
                  <span className="block font-medium">{panel.label}</span>
                  <span className={`block text-xs ${activePanel === panel.id ? 'text-slate-200' : 'text-slate-500'}`}>{panel.hint}</span>
                </Link>
              ))}
            </nav>
          </aside>
          <section className="p-5 lg:p-8">
            <div className="mx-auto max-w-6xl">
              <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    <Link href="/contexts" className="hover:text-slate-950">Contexts</Link>
                    <span className="px-2">/</span>
                    <span>{caseModule.manifest.name}</span>
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{panels.find((panel) => panel.id === activePanel)?.label}</h2>
                </div>
                <label className="grid gap-1 text-sm text-slate-600 md:min-w-72">
                  <span className="font-medium">Work episode</span>
                  <select className="h-10 border border-slate-300 bg-white px-3">
                    {episodes.map((episode) => (
                      <option key={episode.id}>{episode.title}</option>
                    ))}
                  </select>
                </label>
              </header>
              {activePanel === 'frame' && <FramePanel caseModule={caseModule} />}
              {activePanel === 'sources' && <SourcesPanel caseModule={caseModule} />}
              {activePanel === 'lenses' && <ExtractionLensesPanel />}
              {activePanel === 'work' && <WorkProcessPanel />}
              {activePanel === 'timeline' && <TimelinePanel episodes={episodes} />}
              {activePanel === 'graph' && <GraphPanel caseModule={caseModule} />}
              {activePanel === 'drafts' && <DraftsPanel />}
              {activePanel === 'methods' && <MethodsUsedPanel />}
            </div>
          </section>
        </div>
      </main>
    </EpisodeProvider>
  );
}
