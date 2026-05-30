import { TaskletPraxisWorkbench } from '@/components/praxis/tasklet-praxis-workbench';

type CapsulesPageProps = {
  searchParams: Promise<{ lane?: string; panel?: string; tab?: string }>;
};

export default async function CapsulesPage({ searchParams }: CapsulesPageProps) {
  const { lane, panel, tab } = await searchParams;
  const initialFactoryLane = lane === 'repository' || lane === 'sources' ? 'sources' : undefined;
  const initialPanel = panel === 'ask' || tab === 'work' ? 'ask' : 'capsules';

  return <TaskletPraxisWorkbench mode="app" initialPanel={initialPanel} initialFactoryLane={initialFactoryLane} />;
}
