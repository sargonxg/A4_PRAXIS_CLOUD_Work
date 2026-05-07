'use client';

import { ArrowRight, Lightbulb } from 'lucide-react';
import { computeCaseDensity, type CaseDensity } from '@/lib/workbench/case-density';
import { getEmptyStateActions, getEmptyStatePurpose } from '@/lib/workbench/empty-state-actions';
import type { CaseModule } from '@/types/case-module';
import type { UserRole } from '@/types/situation';
import type { WorkbenchTabId } from '@/types/workbench';

interface EmptyStateGuidanceProps {
  tabId: WorkbenchTabId;
  caseModule: CaseModule;
  userRole: UserRole;
  density?: CaseDensity;
}

export function EmptyStateGuidance({ tabId, caseModule, userRole, density }: EmptyStateGuidanceProps) {
  const resolvedDensity = density ?? computeCaseDensity(caseModule);
  if (resolvedDensity === 'populated') return null;

  const actions = getEmptyStateActions({
    tabId,
    role: userRole,
    ontologyId: caseModule.situation.primaryOntologyId ?? caseModule.situation.ontologyId,
  });

  return (
    <section
      data-testid={`empty-state-guidance-${tabId}`}
      className="rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/5 p-4"
    >
      <div className="flex items-start gap-3">
        <Lightbulb className="mt-0.5 h-5 w-5 text-gold-600" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-navy-950">
              {resolvedDensity === 'empty' ? 'Start this surface' : 'Strengthen this surface'}
            </h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">
              {resolvedDensity}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-700">{getEmptyStatePurpose(tabId)}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {actions.map((action) => (
          <div key={`${action.kind}:${action.target}:${action.label}`} className="rounded-md border border-white/70 bg-white p-3">
            <div className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-diplomatic-blue" />
              <div>
                <p className="text-xs font-semibold text-navy-950">{action.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">{action.why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
