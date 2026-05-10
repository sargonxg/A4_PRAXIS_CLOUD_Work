import Link from 'next/link';
import { getDomainOntologyCards, WORK_ONTOLOGIES, DEFERRED_WORK_ONTOLOGIES } from '@/lib/ontology/work-ontologies';
import { summarizeOntologyMapping } from '@/lib/ontology/registry';

export const metadata = {
  title: 'Ontologies | PRAXIS',
};

export default function OntologiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; domain?: string }>;
}) {
  return <OntologyList searchParams={searchParams} />;
}

async function OntologyList({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; domain?: string }>;
}) {
  const params = await searchParams;
  const query = (params?.q ?? '').toLowerCase();
  const domain = (params?.domain ?? '').toLowerCase();
  const domains = getDomainOntologyCards().filter((ontology) => {
    const text = `${ontology.label} ${ontology.description} ${ontology.domains.join(' ')}`.toLowerCase();
    return (!query || text.includes(query)) && (!domain || ontology.domains.includes(domain));
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Ontology Library</p>
          <h1 className="text-3xl font-semibold tracking-tight">Domain and Work Ontologies</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-650">
            PRAXIS separates the domain lens applied to a Context from the analyst work mandate. MVP domain lenses are Conflict,
            Mediation, and Humanitarian. The remaining domain lenses stay visible as deferred capability.
          </p>
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input name="q" defaultValue={params?.q ?? ''} placeholder="Search ontologies" className="h-10 border border-slate-300 bg-white px-3 text-sm" />
            <input name="domain" defaultValue={params?.domain ?? ''} placeholder="Filter by domain" className="h-10 border border-slate-300 bg-white px-3 text-sm" />
            <button className="h-10 border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white">Filter</button>
          </form>
        </header>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Domain Ontologies</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {domains.map((ontology) => {
              const summary = summarizeOntologyMapping(ontology);
              return (
                <Link key={ontology.id} href={`/ontologies/${ontology.id}`} className="border border-slate-200 bg-white p-4 hover:border-slate-500">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{ontology.label}</h3>
                    <span className="shrink-0 border border-slate-300 px-2 py-1 text-xs">{ontology.activeInMvp ? 'active in MVP' : 'v1.5+'}</span>
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-slate-650">{ontology.description}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-slate-500">Primary domain</dt><dd>{ontology.domains[0] ?? 'general'}</dd></div>
                    <div><dt className="text-slate-500">Primitive coverage</dt><dd>{Math.round(summary.primitiveCoverage * 100)}%</dd></div>
                  </dl>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Work Ontologies</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {WORK_ONTOLOGIES.map((ontology) => (
              <Link key={ontology.id} href={`/ontologies/${ontology.id}`} className="border border-slate-200 bg-white p-4 hover:border-slate-500">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{ontology.label}</h3>
                  <span className="shrink-0 border border-emerald-300 px-2 py-1 text-xs text-emerald-800">active in MVP</span>
                </div>
                <p className="text-sm leading-6 text-slate-650">{ontology.description}</p>
                <p className="mt-3 text-sm text-slate-500">{ontology.primaryPersona}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {DEFERRED_WORK_ONTOLOGIES.map((name) => <span key={name} className="border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">{name}: v1.5+</span>)}
          </div>
        </section>
      </div>
    </main>
  );
}
