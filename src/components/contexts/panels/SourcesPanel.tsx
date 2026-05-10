import type { CaseModule } from '@/types/case-module';
import { SourceTierBadge } from '@/components/sources/TierBadge';
import { normalizeSourceTier } from '@/lib/sources/tiers';

export function SourcesPanel({ caseModule }: { caseModule: CaseModule }) {
  const sources = caseModule.sources;
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-semibold">Sources</h2>
      <div className="border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">Document upload connects in Phase 2B. Drop zone placeholder is ready.</div>
      <div className="grid gap-2">
        {sources.length ? sources.map((source) => (
          <article key={source.receiptId} className="grid gap-2 border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-medium">{source.title}</h3>
              <p className="text-sm text-slate-600">{source.provider} · {source.kind} · {source.confidence}</p>
            </div>
            <SourceTierBadge tier={normalizeSourceTier(source.tier)} />
          </article>
        )) : <div className="border border-slate-200 bg-white p-4 text-sm text-slate-600">No sources yet. Add documents or research results to build provenance.</div>}
      </div>
    </section>
  );
}
