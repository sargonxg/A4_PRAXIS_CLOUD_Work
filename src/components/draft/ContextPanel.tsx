import { GitBranch, Layers3, Library, Timer, UserRound } from 'lucide-react';
import type { CaseModule } from '@/types/case-module';
import type { DraftShellRecord } from '@/lib/draft/api';

export function ContextPanel({ caseModule, draft }: { caseModule: CaseModule; draft: DraftShellRecord }) {
  const sources = caseModule.sources.slice(0, 5);
  const actors = caseModule.situation.actors.slice(0, 5);

  return (
    <aside className="grid gap-4 lg:sticky lg:top-4">
      <Panel icon={Library} title="Sources">
        <div className="grid gap-2">
          {sources.map((source) => (
            <div key={source.receiptId} className="border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-950">{source.title || source.name}</p>
              <p className="mt-1 text-xs text-slate-600">{source.provider} · reliability {Math.round(source.reliabilityScore * 100)}%</p>
            </div>
          ))}
          {sources.length === 0 ? <p className="text-sm text-slate-600">No sources are attached to this Context yet.</p> : null}
        </div>
      </Panel>

      <Panel icon={GitBranch} title="Graph nodes">
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <Metric label="Claims" value={caseModule.truthLayers.claim.nodeCount} />
          <Metric label="Evidence" value={caseModule.truthLayers.evidence.nodeCount} />
          <Metric label="Verdicts" value={caseModule.truthLayers.verdict.nodeCount} />
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          {actors.map((actor) => <span key={actor} className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{actor}</span>)}
        </div>
      </Panel>

      <Panel icon={Timer} title="Episodes">
        <div className="border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-950">{draft.workEpisode}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">Draft proposals are scoped to this work episode and remain review-required before save or export.</p>
        </div>
      </Panel>

      <Panel icon={UserRound} title="User model">
        <p className="text-sm leading-6 text-slate-650">
          Active model summary is available to the app shell. Section actions use the current context posture and keep analyst review visible.
        </p>
      </Panel>

      <Panel icon={Layers3} title="Actions">
        <div className="grid gap-2">
          <button type="button" disabled className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold text-slate-500">
            Auto-fill from header
          </button>
          <button type="button" disabled className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold text-slate-500">
            Tighten in section toolbar
          </button>
          <button type="button" disabled className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold text-slate-500">
            Add citations in section toolbar
          </button>
        </div>
      </Panel>
    </aside>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof Library; title: string; children: React.ReactNode }) {
  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-600" />
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
