import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

const BoardroomWorkspace = dynamic(
  () => import('@/components/boardroom/boardroom-workspace').then((module) => module.BoardroomWorkspace),
  { loading: () => <BoardroomLoadingSkeleton /> },
);

export default function BoardroomPage() {
  return <BoardroomWorkspace />;
}

function BoardroomLoadingSkeleton() {
  return (
    <main className="grid min-h-[calc(100vh-8rem)] gap-4" data-testid="boardroom-loading-skeleton">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </main>
  );
}
