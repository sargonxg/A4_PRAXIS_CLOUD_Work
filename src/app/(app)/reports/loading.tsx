import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Filter / search bar */}
      <div className="flex items-center gap-4 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-6 py-2.5">
        <div className="flex items-center gap-0.5">
          {["All", "Draft", "In Review", "Final"].map((label) => (
            <Skeleton key={label} className="h-7 w-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="ml-auto h-7 w-48 rounded-md" />
      </div>

      {/* Table */}
      <div className="flex-1 px-6 py-4">
        <div className="rounded-lg border border-[var(--color-app-border)] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-[var(--color-app-border)] px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="ml-auto h-7 w-7 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
