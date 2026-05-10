import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOntology, summarizeOntologyMapping } from '@/lib/ontology/registry';
import { isOntologyId } from '@/lib/ontology/types';
import { getWorkOntology } from '@/lib/ontology/work-ontologies';

export default async function OntologyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = getWorkOntology(id);

  if (work) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <BackLink />
          <header className="mb-8 border-b border-slate-200 pb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Work Ontology</p>
            <h1 className="mt-2 text-3xl font-semibold">{work.label}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-650">{work.description}</p>
            <p className="mt-3 text-sm font-medium">{work.primaryPersona}</p>
          </header>
          <Section title="Example Use Cases" rows={work.useCases} />
          <PrimitiveTable rows={Object.entries(work.primitiveSubtypes).map(([primitive, subtypes]) => ({ primitive, subtypes }))} />
          <Relations rows={work.mandatoryRelations} />
          <Section title="External Mappings" rows={work.externalMappings} />
        </div>
      </main>
    );
  }

  if (!isOntologyId(id)) notFound();
  const ontology = getOntology(id);
  const summary = summarizeOntologyMapping(ontology);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <BackLink />
        <header className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Domain Ontology</p>
          <h1 className="mt-2 text-3xl font-semibold">{ontology.label}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-650">{ontology.description}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-slate-500">Domains</dt><dd>{ontology.domains.join(', ')}</dd></div>
            <div><dt className="text-slate-500">Primitive coverage</dt><dd>{Math.round(summary.primitiveCoverage * 100)}%</dd></div>
            <div><dt className="text-slate-500">MVP status</dt><dd>{['conflict', 'mediation', 'humanitarian'].includes(ontology.id) ? 'active in MVP' : 'v1.5+'}</dd></div>
          </dl>
        </header>
        <PrimitiveTable rows={ontology.nodeTypes.map((node) => ({ primitive: node.primitive, subtypes: [node.label] }))} />
        <Relations rows={ontology.edgeTypes.map((edge) => ({ id: edge.id, from: edge.from.join(', '), to: edge.to.join(', '), description: edge.description }))} />
        <Section title="External Mappings" rows={['BFO', 'CCO', 'PLOVER', 'POLECAT', 'UCDP', 'FrameNet']} />
        <Section title="Usage Stats" rows={['Live Context usage is resolved at runtime; empty states remain honest until Contexts are seeded.']} />
      </div>
    </main>
  );
}

function BackLink() {
  return <Link href="/ontologies" className="mb-6 inline-block text-sm text-slate-600 hover:text-slate-950">Back to ontologies</Link>;
}

function Section({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <ul className="grid gap-2 text-sm text-slate-700">
        {rows.map((row) => <li key={row} className="border border-slate-200 bg-white px-3 py-2">{row}</li>)}
      </ul>
    </section>
  );
}

function PrimitiveTable({ rows }: { rows: Array<{ primitive: string; subtypes: string[] }> }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold">Subtypes Per Primitive</h2>
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Primitive</th><th className="p-3">Subtypes</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={`${row.primitive}-${index}`} className="border-t border-slate-200"><td className="p-3 font-medium">{row.primitive}</td><td className="p-3">{row.subtypes.join(', ')}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function Relations({ rows }: { rows: Array<{ id: string; from: string; to: string; description: string }> }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold">Mandatory Relations</h2>
      <div className="grid gap-2">
        {rows.map((row) => <div key={row.id} className="border border-slate-200 bg-white p-3 text-sm"><div className="font-medium">{row.from} to {row.to}</div><p className="mt-1 text-slate-650">{row.description}</p></div>)}
      </div>
    </section>
  );
}
