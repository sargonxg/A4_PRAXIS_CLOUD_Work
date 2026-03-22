import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-8 w-[130px] rounded-md" />
          <Skeleton className="h-8 w-[140px] rounded-md" />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Document list */}
          <div className="lg:col-span-3">
            <div className="rounded-lg border border-[var(--color-app-border)] bg-white overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_80px_100px_60px] gap-2 px-4 py-3 border-b border-[var(--color-app-border)]">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-10 ml-auto" />
              </div>

              {/* File rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[40px_1fr_80px_100px_60px] gap-2 px-4 py-3 items-center border-b border-[var(--color-app-border)]"
                >
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-full max-w-[280px]" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel placeholder */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-dashed border-[var(--color-app-border)] bg-white p-8">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
