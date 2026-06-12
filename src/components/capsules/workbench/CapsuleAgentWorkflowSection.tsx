'use client';

import { memo } from 'react';
import { GitBranch } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { CompactList, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleAgentWorkflowSection = memo(function CapsuleAgentWorkflowSection({ agents }: { agents: CapsuleWorkbenchViewModel['agents'] }) {
  return (
    <WorkbenchSection title="Agent Workflow" icon={GitBranch}>
      <div className="grid gap-2">
        {agents.recentRuns.length ? agents.recentRuns.map((run) => (
          <div key={run.runId} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-slate-800">{run.label}</p>
              <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">{run.status.replaceAll('_', ' ')}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{run.objective}</p>
          </div>
        )) : <p className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">No agent run receipts yet.</p>}
        <CompactList items={agents.nextActions} empty="No agent action suggested." />
      </div>
    </WorkbenchSection>
  );
});
