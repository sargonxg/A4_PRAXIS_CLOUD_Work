import { BrainCircuit, CheckCircle2, GitPullRequest, Route, Scale, SearchX } from 'lucide-react';
import { SYRIA_DEMO_CONFLICT_GRAPH } from '@/lib/constants/syria-demo-case';
import {
  SYRIA_COMMITMENT_MONITOR_DEMO,
  SYRIA_DISCREPANCY_WORKFLOWS,
  SYRIA_GRAPH_GROUNDING_PIPELINE,
  SYRIA_NEUROSYMBOLIC_POLICY_PAYOFFS,
  SYRIA_ONTOLOGY_REASONING_TRACKS,
} from '@/lib/constants/syria-demo-workspace';
import { SYRIA_CACHED_RECIPE_RESULTS } from '@/lib/syria/cached-recipe-results';
import { SyriaRecipeCard } from './recipe-card';

const RECIPES = [
  {
    code: 'LEVERAGE-TRACE',
    title: 'Find the real leverage path',
    icon: GitPullRequest,
    input: SYRIA_DEMO_CONFLICT_GRAPH.leverage[0]?.title ?? 'Institutional leverage',
    output: 'Who can move the SDF integration track, what it costs, and which source proves it.',
  },
  {
    code: 'COMMITMENT-CHECK',
    title: 'Turn agreements into compliance tests',
    icon: CheckCircle2,
    input: SYRIA_COMMITMENT_MONITOR_DEMO[0]?.commitment ?? 'January integration commitment',
    output: 'Parties, obligations, evidence needed, blockers, and next monitoring search.',
  },
  {
    code: 'INTEREST-vs-POSITION',
    title: 'Separate stated claims from durable interests',
    icon: Scale,
    input: SYRIA_DEMO_CONFLICT_GRAPH.interests[1]?.title ?? 'Actor interest',
    output: 'Negotiable language, red lines, and risks that do not appear in public statements.',
  },
  {
    code: 'COUNTER-NARRATIVE',
    title: 'Compare official, local, and humanitarian frames',
    icon: SearchX,
    input: SYRIA_DISCREPANCY_WORKFLOWS[1]?.question ?? 'Statement discrepancy',
    output: 'Exact wording differences and a diplomatic formulation that does not overclaim.',
  },
  {
    code: 'PATH-SEARCH',
    title: 'Search only the missing graph edges',
    icon: Route,
    input: 'Graph path: commitment -> rights -> returns -> access -> regional spillover',
    output: 'Targeted live searches that refresh gaps without reprocessing the full corpus.',
  },
];

export function SyriaChapterDialectica() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-3 md:grid-cols-2">
        {RECIPES.map((recipe) => {
          const Icon = recipe.icon;
          const cached = SYRIA_CACHED_RECIPE_RESULTS.find((item) => item.code === recipe.code);
          return cached ? <SyriaRecipeCard key={recipe.code} recipe={cached} icon={Icon} /> : null;
        })}
      </div>

      <aside className="grid gap-3">
        <div className="rounded-lg border border-navy-200 bg-navy-950 p-4 text-white">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-gold-200" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">DIALECTICA backbone</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-blue-100/80">
            LLMs read messy sources. The graph keeps durable actors, claims, dates, commitments, and contradictions. DIALECTICA
            binds them together so every answer can expose evidence, missing edges, and reasoning steps.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ontology tracks</p>
          <div className="mt-3 space-y-2">
            {SYRIA_ONTOLOGY_REASONING_TRACKS.map((track) => (
              <div key={track.track} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold text-navy-950">{track.track}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">{track.policyQuestion}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gold-200 bg-gold-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-800">Graph-grounded execution</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SYRIA_GRAPH_GROUNDING_PIPELINE.map((step) => (
              <span key={step.step} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy-800">
                {step.step}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-gold-900">
            {SYRIA_NEUROSYMBOLIC_POLICY_PAYOFFS[0]?.capability}
          </p>
        </div>
      </aside>
    </div>
  );
}
