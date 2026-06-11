'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const LazyMemoDesk = dynamic(
  () => import('@/components/memo/memo-desk').then((module) => module.MemoDesk),
  { loading: () => <MemoDeskLoadingSkeleton /> },
);

function MemoDeskLoadingSkeleton() {
  return (
    <section className="grid h-[calc(100vh-3.5rem)] min-h-0 gap-3 bg-emerald-50/30 p-4" data-testid="memo-desk-loading-skeleton">
      <Skeleton className="h-12 w-full" />
      <div className="grid min-h-0 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)_22rem]">
        <Skeleton className="hidden h-full lg:block" />
        <Skeleton className="h-full min-h-96" />
        <Skeleton className="hidden h-full lg:block" />
      </div>
    </section>
  );
}
