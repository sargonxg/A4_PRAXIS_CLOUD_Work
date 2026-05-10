import type { CaseModule } from '@/types/case-module';

export function GraphPanel({ caseModule }: { caseModule: CaseModule }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-semibold">Graph</h2>
      <div className="grid gap-3 md:grid-cols-4">
        {Object.entries(caseModule.truthLayers).map(([layer, snapshot]) => (
          <div key={layer} className="border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium capitalize">{layer}</div>
            <div className="mt-2 text-2xl font-semibold">{snapshot.nodeCount}</div>
            <div className="text-xs text-slate-500">nodes</div>
          </div>
        ))}
      </div>
      <div className="min-h-80 border border-slate-200 bg-white p-4 text-sm text-slate-600">Graph canvas placeholder using existing workbench graph data contract. Candidate layer toggle arrives with graph integration.</div>
    </section>
  );
}
