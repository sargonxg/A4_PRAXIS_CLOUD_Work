import { WORK_ONTOLOGIES } from '@/lib/ontology/work-ontologies';

export function WorkProcessPanel() {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-semibold">Work Process</h2>
      <div className="grid gap-3 lg:grid-cols-3">
        {WORK_ONTOLOGIES.map((ontology) => (
          <article key={ontology.id} className="border border-slate-200 bg-white p-4">
            <h3 className="font-medium">{ontology.label}</h3>
            <p className="mt-2 text-sm text-slate-600">{ontology.description}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{ontology.primaryPersona}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
