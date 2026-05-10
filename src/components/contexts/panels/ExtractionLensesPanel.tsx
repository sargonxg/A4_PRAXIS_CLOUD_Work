import { getDomainOntologyCards } from '@/lib/ontology/work-ontologies';

export function ExtractionLensesPanel() {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-semibold">Extraction Lenses</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {getDomainOntologyCards().map((ontology) => (
          <div key={ontology.id} className="border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium">{ontology.label}</h3>
              <span className="border border-slate-300 px-2 py-1 text-xs">{ontology.activeInMvp ? 'active' : 'v1.5+'}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{ontology.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
