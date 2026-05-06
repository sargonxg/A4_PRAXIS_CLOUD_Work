import { PraxisLink } from '@/components/shared/praxis-link';
import { FileText, PenLine } from 'lucide-react';

const PRODUCTS = [
  { title: 'Boardroom synthesis', status: 'draft', type: 'memo', sources: 4 },
  { title: 'Executive briefing', status: 'final', type: 'briefing', sources: 7 },
  { title: 'Principal talking points', status: 'exported', type: 'talking_points', sources: 5 },
];

export default function LibraryWorkProductsPage() {
  return (
    <div className="space-y-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
            <FileText className="h-3.5 w-3.5" /> Library
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-navy-900">Work products</h1>
          <p className="mt-1 max-w-3xl text-sm text-navy-500">
            Drafts, briefings, dossiers, and exports with parent source links and provenance manifests.
          </p>
        </div>
        <PraxisLink href="/draft" className="inline-flex items-center gap-1.5 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800">
          <PenLine className="h-3.5 w-3.5" /> New draft
        </PraxisLink>
      </header>
      <section className="grid gap-3 md:grid-cols-3">
        {PRODUCTS.map((product) => (
          <article key={product.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">{product.type}</p>
            <h2 className="mt-1 text-sm font-semibold text-navy-900">{product.title}</h2>
            <p className="mt-2 text-xs text-navy-500">{product.sources} parent sources · {product.status}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
