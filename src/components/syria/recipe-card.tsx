'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2, Play, ShieldCheck } from 'lucide-react';
import { runDialecticaRecipe, type RecipeId } from '@/lib/dialectica/client';
import type { SyriaCachedRecipe } from '@/lib/syria/cached-recipe-results';
import { SyriaCounterfactualControls } from '@/components/syria/counterfactual-controls';
import { ErrorState } from '@/components/praxis/error-state';
import { cn } from '@/lib/utils/cn';

export function SyriaRecipeCard({ recipe, icon: Icon }: { recipe: SyriaCachedRecipe; icon: LucideIcon }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'live' | 'cached'>('idle');
  const [answer, setAnswer] = useState(recipe.result);
  const [counterfactualSet, setCounterfactualSet] = useState<string[]>([]);

  async function runRecipe() {
    setStatus('running');
    try {
      const result = await runDialecticaRecipe(recipe.recipe, {
        situationId: 'syria-transition-2026',
        params: {
          ...recipe.params,
          ...(recipe.recipe === 'path-search' && counterfactualSet.length > 0 ? { counterfactual_set: counterfactualSet } : {}),
        } as never,
      });
      setAnswer(formatLiveResult(recipe.recipe, result) || recipe.result);
      setStatus('live');
    } catch {
      setAnswer(recipe.result);
      setStatus('cached');
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-navy-950 px-2 py-1 font-mono text-[10px] font-semibold text-gold-200">
          {recipe.code}
        </span>
        <Icon className="h-4 w-4 text-diplomatic-blue" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-navy-950">{recipe.title}</h3>
      <div className="mt-3 rounded-md bg-slate-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Question</p>
        <p className="mt-1 text-xs leading-5 text-slate-700">{recipe.question}</p>
      </div>
      <div className="mt-2 rounded-md bg-emerald-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Answer</p>
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            status === 'live' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800',
          )}>
            {status === 'live' ? 'live' : status === 'cached' ? 'cached' : `${Math.round(recipe.confidence * 100)}%`}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-emerald-950">{answer}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{recipe.provenance[0]}</span>
        </div>
        <button
          type="button"
          onClick={runRecipe}
          disabled={status === 'running'}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy-950 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60"
        >
          {status === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run
        </button>
      </div>
      {status === 'cached' ? (
        <div className="mt-3">
          <ErrorState
            headline={`${recipe.code} used cached result`}
            subtext="The live recipe endpoint was unavailable or timed out. The card is showing the last recording-safe result, visibly labeled rather than silently mixing fallback data."
            onRetry={runRecipe}
          />
        </div>
      ) : null}
      {recipe.recipe === 'path-search' ? (
        <div className="mt-3">
          <SyriaCounterfactualControls activeIds={counterfactualSet} onChange={setCounterfactualSet} compact />
        </div>
      ) : null}
    </article>
  );
}

function formatLiveResult(recipe: RecipeId, result: Record<string, unknown>): string {
  if (recipe === 'leverage-trace' && Array.isArray(result.paths) && result.paths.length > 0) {
    const first = result.paths[0] as { rationale?: string; confidence?: number };
    return `${first.rationale ?? 'Leverage path found.'} Confidence ${Math.round((first.confidence ?? 0) * 100)}%.`;
  }
  if (recipe === 'commitment-check' && Array.isArray(result.commitments) && result.commitments.length > 0) {
    const first = result.commitments[0] as { rationale?: string };
    return first.rationale ?? 'Fragile commitment found.';
  }
  if (recipe === 'interest-vs-position' && Array.isArray(result.zopa_candidates) && result.zopa_candidates.length > 0) {
    const first = result.zopa_candidates[0] as { opening?: string };
    return first.opening ?? 'Negotiation opening found.';
  }
  if (recipe === 'counter-narrative' && Array.isArray(result.narratives)) {
    return `Found ${result.narratives.length} narrative frame(s) with citation divergence.`;
  }
  if (recipe === 'path-search' && Array.isArray(result.paths) && result.paths.length > 0) {
    const first = result.paths[0] as { rationale?: string; counterfactual_penalty?: number };
    const penalty = typeof first.counterfactual_penalty === 'number' && first.counterfactual_penalty < 1
      ? ` Confidence adjusted by counterfactual x${first.counterfactual_penalty.toFixed(2)}.`
      : '';
    return `${first.rationale ?? 'Ranked intervention path found.'}${penalty}`;
  }
  return '';
}
