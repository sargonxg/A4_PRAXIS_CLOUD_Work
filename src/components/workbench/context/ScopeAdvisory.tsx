import { Sparkles } from 'lucide-react';
import type { SurfaceQuestion } from '@/lib/workbench/surface-state';

export function ScopeAdvisory({ questions }: { questions: SurfaceQuestion[] }) {
  return (
    <div className="rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/5 p-4">
      <Sparkles className="h-5 w-5 text-gold-700" />
      <p className="mt-3 text-sm font-semibold text-navy-950">AI Scope Advisory</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">
        Scope guidance is advisory and based on current case gaps. It does not mutate the case until the user saves or accepts a future review-queue item.
      </p>
      <ul className="mt-3 space-y-2">
        {questions.slice(0, 3).map((question) => (
          <li key={question.id} className="rounded-md border border-white/80 bg-white px-3 py-2 text-sm leading-5 text-navy-800">
            {question.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
