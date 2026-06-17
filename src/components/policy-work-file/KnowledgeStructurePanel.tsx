'use client';

import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';

export type KnowledgeStructureBucket = {
  label: string;
  items: string[];
  advisory?: boolean;
};

export function knowledgeStructureFromAskEnvelope(envelope?: AskAnswerEnvelope): KnowledgeStructureBucket[] {
  const claims = (envelope?.claimLedger ?? []).map((claim) => `${claim.status}: ${claim.text}`);
  const evidence = (envelope?.sourceCards ?? []).map((source) => source.sourceReceiptId ? `${source.title} (${source.sourceReceiptId})` : source.title);
  const gaps = [
    ...(envelope?.sourceRefreshDocket?.missingEvidenceGaps ?? []),
    ...(envelope?.documentPackCandidate?.gaps ?? []),
  ];
  const reviewCards = (envelope?.reviewCardSuggestions ?? []).map((card) => `${card.label} (review card)`);

  return [
    { label: 'Actors', items: inferredItems(envelope, /\b(actor|party|stakeholder|institution)\b/i), advisory: true },
    { label: 'Institutions/rules', items: inferredItems(envelope, /\b(rule|mandate|law|authority|institution|compliance)\b/i), advisory: true },
    { label: 'Claims', items: claims },
    { label: 'Evidence', items: evidence },
    { label: 'Risks/tradeoffs', items: inferredItems(envelope, /\b(risk|tradeoff|trade-off|constraint|caveat)\b/i), advisory: true },
    { label: 'Options', items: (envelope?.followUps ?? []).filter((item) => /\b(option|recommend|next)\b/i.test(item)), advisory: true },
    { label: 'Decisions', items: reviewCards },
    { label: 'Open questions', items: gaps },
  ];
}

export function KnowledgeStructurePanel({
  buckets,
}: {
  buckets: KnowledgeStructureBucket[];
}) {
  const visibleBuckets = buckets.map((bucket) => ({
    ...bucket,
    items: bucket.items.filter(Boolean).slice(0, 4),
  }));
  if (!visibleBuckets.some((bucket) => bucket.items.length)) return null;

  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-white p-3" data-testid="knowledge-structure-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Knowledge Structure</p>
        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">
          proposals stay review-gated
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {visibleBuckets.map((bucket) => (
          <div key={bucket.label} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {bucket.label}{bucket.advisory ? ' / proposed' : ''}
            </p>
            <ul className="mt-1 space-y-1 text-[11px] leading-4 text-slate-600">
              {bucket.items.length ? bucket.items.map((item, index) => (
                <li key={`${bucket.label}-${index}`}>{item}</li>
              )) : <li>No reviewed item yet.</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function inferredItems(envelope: AskAnswerEnvelope | undefined, pattern: RegExp): string[] {
  return [
    ...(envelope?.documentPackCandidate?.gaps ?? []),
    ...(envelope?.claimLedger ?? []).map((claim) => claim.text),
    ...(envelope?.followUps ?? []),
  ].filter((item) => pattern.test(item));
}
