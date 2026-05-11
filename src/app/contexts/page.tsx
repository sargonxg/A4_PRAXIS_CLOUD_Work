import Link from 'next/link';
import { listExampleCases } from '@/lib/cases/registry';
import type { CaseModule } from '@/types/case-module';

export const metadata = { title: 'Contexts | PRAXIS' };

export default function ContextsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; sort?: string }>;
}) {
  return <ContextsList searchParams={searchParams} />;
}

async function ContextsList({ searchParams }: { searchParams?: Promise<{ q?: string; sort?: string }> }) {
  const params = await searchParams;
  const query = (params?.q ?? '').toLowerCase();
  const contexts = listExampleCases()
    .filter((context) => `${context.manifest.name} ${context.manifest.summary} ${context.manifest.tags.join(' ')}`.toLowerCase().includes(query))
    .sort((a, b) => params?.sort === 'name' ? a.manifest.name.localeCompare(b.manifest.name) : b.situation.updatedAt.localeCompare(a.situation.updatedAt));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">PRAXIS Contexts</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Context workspace</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-650">Open a Context to work through frame, sources, lenses, process, timeline, graph, drafts, and methods in one operational shell.</p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input name="q" defaultValue={params?.q ?? ''} placeholder="Search contexts" className="h-10 border border-slate-300 bg-white px-3 text-sm" />
            <select name="sort" defaultValue={params?.sort ?? 'updated'} className="h-10 border border-slate-300 bg-white px-3 text-sm">
              <option value="updated">Last modified</option>
              <option value="name">Name</option>
            </select>
            <button className="h-10 border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white">Filter</button>
          </form>
          <Link href="/app/cores/context" className="inline-flex h-10 w-fit items-center justify-center border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white">
            Open Context Core
          </Link>
        </header>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contexts.map((context) => (
            <Link key={context.id} href={`/contexts/${context.id}`} className="grid min-h-64 gap-4 border border-slate-200 bg-white p-4 hover:border-slate-500">
              <div className="flex h-24 items-start justify-between gap-3 border border-slate-200 bg-slate-100 p-3 text-xs text-slate-500">
                <span>Graph snippet · {context.truthLayers.claim.nodeCount} claims</span>
                <span className={`border px-2 py-1 font-medium ${contextHealthTone(context)}`}>{contextHealthLabel(context)}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">{context.manifest.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-650">{context.manifest.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ontologyStack(context).map((ontology) => (
                  <span key={ontology} className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">{ontology}</span>
                ))}
              </div>
              <dl className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                <div><dt>Episode</dt><dd className="font-medium">Current</dd></div>
                <div><dt>Sources</dt><dd className="font-medium">{context.sources.length}</dd></div>
                <div><dt>Updated</dt><dd className="font-medium">{context.situation.updatedAt.slice(0, 10)}</dd></div>
              </dl>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

function ontologyStack(context: CaseModule): string[] {
  const domain = context.manifest.domain || 'Conflict';
  const secondary = context.manifest.tags.includes('humanitarian') ? 'Humanitarian' : 'Mediation';
  return Array.from(new Set([domain, secondary]));
}

function contextHealthLabel(context: CaseModule): string {
  const coverage = Math.round(context.truthLayers.evidence.provenanceCoverage * 100);
  if (coverage >= 80) return 'Ready';
  if (coverage >= 50) return 'Needs review';
  return 'Thin context';
}

function contextHealthTone(context: CaseModule): string {
  const label = contextHealthLabel(context);
  if (label === 'Ready') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (label === 'Needs review') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-300 bg-white text-slate-600';
}
