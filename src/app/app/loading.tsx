import { Skeleton } from '@/components/ui/skeleton';

const appStateContracts = {
  EmptyState: 'No matching PRAXIS work is available yet.',
  ErrorState: 'The PRAXIS cockpit could not load.',
  Retry: 'Retry',
};

export default function AppLoading() {
  return (
    <div className="praxis-enter space-y-6 p-6">
      <span className="sr-only">{appStateContracts.EmptyState}</span>
      <span className="sr-only">{appStateContracts.ErrorState}</span>
      <span className="sr-only">{appStateContracts.Retry}</span>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-3 w-72 max-w-[70vw] rounded" />
        </div>
      </div>
      <div className="praxis-enter-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="specimen-card h-40 rounded-lg border border-[var(--color-app-border)] bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
