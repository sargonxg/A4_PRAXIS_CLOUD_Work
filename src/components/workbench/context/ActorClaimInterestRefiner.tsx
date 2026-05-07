import { GitBranchPlus } from 'lucide-react';
import type { SurfaceQuestion } from '@/lib/workbench/surface-state';

export function ActorClaimInterestRefiner({
  actors,
  questions,
}: {
  actors: string[];
  questions: SurfaceQuestion[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <GitBranchPlus className="h-5 w-5 text-gold-700" />
      <p className="mt-3 text-sm font-semibold text-navy-950">Actors / Claims / Interests</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {actors.slice(0, 8).map((actor) => (
          <span key={actor} className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-800">{actor}</span>
        ))}
        {actors.length === 0 ? <span className="text-sm text-slate-700">No actors promoted yet.</span> : null}
      </div>
      <div className="mt-4 space-y-2">
        {questions.slice(0, 3).map((question) => (
          <div key={question.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-navy-950">{question.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-700">{question.detail}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm leading-5 text-slate-700">
        Proposal writes stay review-gated. This panel shows the refinement targets without silently promoting synthesized graph nodes.
      </p>
    </div>
  );
}
