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
  initialMemoId?: string | null;
}

export function AskPraxisHome({ exampleCases, initialMemoId }: AskPraxisHomeProps) {
  const userCases = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const activeCase = activeSituation ?? userCases[0] ?? exampleCases[0];

  return (
    <TaskletPraxisWorkbench
      mode="app"
      activeCapsuleName={activeCase?.name ?? 'No Situation selected'}
      capsuleId={activeCase?.id ?? 'default'}
      initialMemoId={initialMemoId}
    />
  );
}
