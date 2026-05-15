'use client';

import { TaskletPraxisWorkbench } from '@/components/praxis/tasklet-praxis-workbench';
import { useSituationStore } from '@/stores/situation-store';

interface DashboardExampleCase {
  id: string;
  name: string;
  region: string;
  summary: string;
  risk: number;
  glaslStage: number;
  tags: string[];
}

interface AskPraxisHomeProps {
  exampleCases: DashboardExampleCase[];
  marketplaceToolCount: number;
}

export function AskPraxisHome({ exampleCases }: AskPraxisHomeProps) {
  const userCases = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const activeCase = activeSituation ?? userCases[0] ?? exampleCases[0];

  return (
    <TaskletPraxisWorkbench
      mode="app"
      activeCapsuleName={activeCase?.name ?? 'No Situation selected'}
      capsuleId={activeCase?.id ?? 'default'}
      className="min-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-slate-200 shadow-sm shadow-navy-950/5"
    />
  );
}
