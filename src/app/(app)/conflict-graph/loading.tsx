import { Skeleton } from "@/components/ui/skeleton";

export default function ConflictGraphLoading() {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>

        {/* Controls bar */}
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex items-center gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Main content: Graph + Entity Panel */}
        <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Graph area with node circles */}
          <div className="relative rounded-xl border border-[var(--color-app-border)] bg-white p-6">
            <div className="flex min-h-[450px] items-center justify-center lg:min-h-[500px]">
              <svg
                viewBox="0 0 800 500"
                className="h-full w-full animate-pulse"
              >
                {/* Edge lines */}
                <line x1="400" y1="200" x2="250" y2="240" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="400" y1="200" x2="560" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="400" y1="80" x2="400" y2="200" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="250" y1="240" x2="150" y2="160" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="400" y1="200" x2="480" y2="300" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="250" y1="240" x2="200" y2="330" stroke="#E2E8F0" strokeWidth="1.5" />
                {/* Node circles */}
                <circle cx="400" cy="200" r="28" fill="#E2E8F0" />
                <circle cx="250" cy="240" r="24" fill="#E2E8F0" />
                <circle cx="400" cy="80" r="22" fill="#E2E8F0" />
                <circle cx="560" cy="180" r="20" fill="#E2E8F0" />
                <circle cx="150" cy="160" r="18" fill="#E2E8F0" />
                <circle cx="480" cy="300" r="20" fill="#E2E8F0" />
                <circle cx="200" cy="330" r="18" fill="#E2E8F0" />
                <circle cx="560" cy="80" r="16" fill="#E2E8F0" />
                <circle cx="340" cy="110" r="16" fill="#E2E8F0" />
                {/* Event nodes along bottom */}
                {[100, 200, 300, 400, 500, 600, 700].map((x) => (
                  <circle key={x} cx={x} cy="440" r="10" fill="#E2E8F0" />
                ))}
              </svg>
            </div>
          </div>

          {/* Entity panel skeleton */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 min-h-[450px] lg:min-h-[500px]">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="mb-6 h-3 w-48" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline skeleton */}
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="mt-2 flex justify-between">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
