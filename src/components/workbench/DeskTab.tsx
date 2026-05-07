'use client';

import { Activity, AlertTriangle, CheckCircle2, Sparkles, type LucideIcon } from 'lucide-react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { SurfaceActionList, SurfaceFactGrid, SurfaceQuestionList, SurfaceSection } from '@/components/workbench/workbench-surface-elements';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildWorkbenchSurfaceState } from '@/lib/workbench/surface-state';

export function DeskTab() {
  const { caseId, caseModule } = useWorkbenchScope();
  const surface = buildWorkbenchSurfaceState(caseModule, caseId);

  return (
    <div className="space-y-6" data-testid="workbench-desk-surface">
      <section className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gold-700" />
              <h2 className="text-lg font-semibold text-navy-950">Desk</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              The operating desk shows what changed, what needs attention, and which case-aware action should happen next.
            </p>
          </div>
          <ContextHealthChip />
        </div>
        <div className="mt-5">
          <SurfaceFactGrid facts={surface.changedFacts} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <SurfaceSection eyebrow="Next best actions" title="Recommended operating moves">
          <SurfaceActionList actions={surface.nextActions} />
        </SurfaceSection>

        <SurfaceSection eyebrow="Open questions" title="Review queue">
          <SurfaceQuestionList questions={surface.openQuestions} />
        </SurfaceSection>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <DeskSignal
          icon={surface.staleSignals.length ? AlertTriangle : CheckCircle2}
          title={surface.staleSignals.length ? 'Stale context advisory' : 'Context freshness acceptable'}
          detail={surface.staleSignals[0]?.detail ?? 'No stale source or context-health signal is currently elevated.'}
          tone={surface.staleSignals.length ? 'warn' : 'good'}
        />
        <DeskSignal
          icon={Sparkles}
          title="AI remains advisory"
          detail="Low confidence, thin receipts, and stale context surface as hints. They do not block writing, tool runs, or structured context dumps."
          tone="neutral"
        />
        <DeskSignal
          icon={Activity}
          title="Graph-backed status"
          detail={`${surface.graphNodeCount} graph nodes and ${surface.sourceCount} source references are available to downstream tools.`}
          tone="neutral"
        />
      </section>
    </div>
  );
}

function DeskSignal({
  icon: Icon,
  title,
  detail,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  tone: 'neutral' | 'good' | 'warn';
}) {
  return (
    <div className={tone === 'warn' ? 'rounded-lg border border-amber-200 bg-amber-50 p-4' : tone === 'good' ? 'rounded-lg border border-emerald-200 bg-emerald-50 p-4' : 'rounded-lg border border-slate-200 bg-white p-4'}>
      <Icon className={tone === 'warn' ? 'h-5 w-5 text-amber-700' : tone === 'good' ? 'h-5 w-5 text-emerald-700' : 'h-5 w-5 text-gold-700'} />
      <p className="mt-3 text-sm font-semibold text-navy-950">{title}</p>
      <p className="mt-1 text-sm leading-5 text-slate-700">{detail}</p>
    </div>
  );
}
