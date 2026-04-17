'use client';

import { AlertTriangle } from 'lucide-react';
import { ToolPageShell } from '@/components/praxis/tool-page-shell';
import { DemoEarlyWarningPage, type RiskRegionData } from './_demo';

export default function EarlyWarningPage() {
  return (
    <ToolPageShell
      toolId="early-warning"
      toolName="Early Warning"
      toolDataKey="early_warning"
      apiEndpoint="/api/ai/risk-assessment"
      creditCost={3}
      buildExtraBody={(situation) => ({
        regions: [situation.region],
        conflictContext: `${situation.name}: ${situation.description}. Actors: ${situation.actors.join(', ')}`,
      })}
      onDataGenerated={(data, setExtra) => {
        const d = data as { regions?: RiskRegionData[] };
        if (d?.regions) setExtra(d.regions);
      }}
      renderDemo={(situation, extra) => (
        <DemoEarlyWarningPage
          situation={situation ?? undefined}
          aiRiskData={(extra as RiskRegionData[] | null) ?? undefined}
        />
      )}
      renderEmpty={(situation) => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-navy-200 mb-4" />
          <p className="text-sm font-medium text-navy-500">
            Escalation analysis pending for &ldquo;{situation.name}&rdquo;
          </p>
          <p className="mt-1 text-xs text-navy-400">
            Generate above to start tracking the Glasl escalation stage with live data.
          </p>
        </div>
      )}
    />
  );
}
