export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-navy-100" />
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-navy-100" />
          <div className="h-3 w-72 rounded bg-navy-100" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-navy-100" />
              <div className="h-4 w-24 rounded bg-navy-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-navy-100" />
              <div className="h-3 w-3/4 rounded bg-navy-100" />
              <div className="h-3 w-1/2 rounded bg-navy-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
