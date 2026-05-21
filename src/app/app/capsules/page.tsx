import { TaskletPraxisWorkbench } from '@/components/praxis/tasklet-praxis-workbench';

type CapsulesPageProps = {
  searchParams: Promise<{ lane?: string }>;
};

export default async function CapsulesPage({ searchParams }: CapsulesPageProps) {
  const { lane } = await searchParams;
  const initialFactoryLane = lane === 'repository' || lane === 'sources' ? 'sources' : undefined;

  return <TaskletPraxisWorkbench mode="app" initialPanel="capsules" initialFactoryLane={initialFactoryLane} />;
}
