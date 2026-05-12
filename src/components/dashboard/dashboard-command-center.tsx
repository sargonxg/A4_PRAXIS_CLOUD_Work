import { PraxisWorkspaceShell } from '@/components/app/praxis-workspace-shell';

interface DashboardExampleCase {
  id: string;
  name: string;
  region: string;
  summary: string;
  risk: number;
  glaslStage: number;
  tags: string[];
}

interface DashboardCommandCenterProps {
  exampleCases: DashboardExampleCase[];
  marketplaceToolCount: number;
}

export function DashboardCommandCenter({ exampleCases, marketplaceToolCount }: DashboardCommandCenterProps) {
  return <PraxisWorkspaceShell exampleCases={exampleCases} marketplaceToolCount={marketplaceToolCount} />;
}
