'use client';

interface ChapterSkeletonProps {
  title: string;
}

export function ChapterSkeleton({ title }: ChapterSkeletonProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-500">Loading</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-950">{title}</h2>
        </div>
        <div className="h-2 w-24 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-32 w-full animate-pulse rounded bg-slate-50" />
      </div>
    </div>
  );
}
