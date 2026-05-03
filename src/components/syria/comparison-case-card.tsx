import { ArrowUpRight, GitCompareArrows, Scale } from 'lucide-react';
import type { RankedSyriaComparisonCase } from '@/lib/syria/pattern-similarity';

type ComparisonCaseCardProps = {
  comparison: RankedSyriaComparisonCase;
};

export function ComparisonCaseCard({ comparison }: ComparisonCaseCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {comparison.era} · {comparison.geography}
          </p>
          <h4 className="mt-1 text-sm font-semibold text-navy-950">{comparison.name}</h4>
        </div>
        <div className="rounded-md bg-diplomatic-blue/10 px-2 py-1 text-right">
          <p className="text-base font-semibold text-diplomatic-blue">{comparison.similarityScore}</p>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-diplomatic-blue/70">match</p>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-100" aria-label={`${comparison.similarityScore}% pattern match`}>
        <div
          className="h-2 rounded-full bg-diplomatic-blue"
          style={{ width: `${comparison.similarityScore}%` }}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-600">{comparison.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {comparison.matchedPatterns.map((pattern) => (
          <span key={pattern} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
            {pattern}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-md bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-navy-950">
            <GitCompareArrows className="h-3.5 w-3.5" />
            <p className="text-xs font-semibold">Why PRAXIS found it</p>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-600">{comparison.whyComparable}</p>
        </div>

        <div className="rounded-md bg-emerald-50 p-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <p className="text-xs font-semibold">Syria lesson</p>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-emerald-900">{comparison.lessonsForSyria[0]}</p>
        </div>

        <div className="rounded-md bg-amber-50 p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <Scale className="h-3.5 w-3.5" />
            <p className="text-xs font-semibold">Analyst caution</p>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-amber-900">{comparison.limitations}</p>
        </div>
      </div>
    </article>
  );
}
