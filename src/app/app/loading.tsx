import { Skeleton } from '@/components/ui/skeleton';

const appStateContracts = {
  EmptyState: 'No matching PRAXIS work is available yet.',
  ErrorState: 'The PRAXIS cockpit could not load.',
  Retry: 'Retry',
};

export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <span className="sr-only">{appStateContracts.EmptyState}</span>
      <span className="sr-only">{appStateContracts.ErrorState}</span>
      <span className="sr-only">{appStateContracts.Retry}</span>
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl bg-navy-100" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded bg-navy-100" />
          <Skeleton className="h-3 w-72 rounded bg-navy-100" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded bg-navy-100" />
              <Skeleton className="h-4 w-24 rounded bg-navy-100" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full rounded bg-navy-100" />
              <Skeleton className="h-3 w-3/4 rounded bg-navy-100" />
              <Skeleton className="h-3 w-1/2 rounded bg-navy-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
