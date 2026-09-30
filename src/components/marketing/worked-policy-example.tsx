import Link from 'next/link';
import { WORKED_POLICY_EXAMPLE as example } from '@/lib/product/worked-policy-example';

export function WorkedPolicyExample({ compact = false }: { compact?: boolean }) {
  const evidence = (
    <div className="mt-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-950">The material</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {example.sourceNotes.map((source) => (
            <li key={source.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Note {source.id}: {source.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{source.content}</p>
            </li>
          ))}
        </ul>
      </div>
      <div role="region" aria-label="Sample evidence assessment table" tabIndex={0}
        className="overflow-x-auto rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
        <table className="w-full text-left text-sm">
          <caption className="bg-white px-4 py-3 text-left font-semibold text-slate-950">What the evidence permits</caption>
          <thead className="bg-slate-100 text-slate-800">
            <tr>
              <th scope="col" className="px-4 py-3">Claim</th>
              <th scope="col" className="px-4 py-3">Assessment</th>
              <th scope="col" className="px-4 py-3">Sample note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
            {example.assessments.map((item) => (
              <tr key={item.claim}>
                <th scope="row" className="px-4 py-3 font-medium text-slate-950">{item.claim}</th>
                <td className="px-4 py-3 leading-6">{item.assessment}</td>
                <td className="px-4 py-3">{item.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Scope and assumption</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{example.assumption}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Decision request</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{example.decision}</p>
        </div>
      </div>
      <p className="border-t border-slate-200 pt-4 text-sm leading-6 text-slate-700">{example.reuse}</p>
    </div>
  );

  return (
    <section aria-label="Synthetic worked policy example" className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 sm:p-6" data-testid="worked-policy-example">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">{example.label}</p>
      <h2 className="mt-3 font-serif text-2xl font-semibold text-slate-950">{example.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-700">{example.disclosure}</p>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-950">{example.question}</p>
      {compact ? (
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer rounded-md py-3 text-sm font-semibold text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">Inspect the sample evidence and decision</summary>
          {evidence}
        </details>
      ) : evidence}
      <p className="mt-5 text-sm leading-6 text-slate-700">{example.capsuleDefinition} Saving it does not independently verify its contents.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/login?redirect=%2Fapp" className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">Ask your own question</Link>
        <Link href="/login?redirect=%2Fapp%2Fcapsules%2Fbuilder" className="inline-flex min-h-11 items-center rounded-full border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">Build reusable context</Link>
      </div>
    </section>
  );
}
