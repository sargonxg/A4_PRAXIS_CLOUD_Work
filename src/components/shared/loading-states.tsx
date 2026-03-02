"use client";

import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  CardSkeleton — mimics a Card with header + content                */
/* ------------------------------------------------------------------ */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-navy-700 bg-navy-800 p-6 space-y-4",
        className,
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ListSkeleton — mimics a table / list of rows                      */
/* ------------------------------------------------------------------ */
export function ListSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* header row */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-navy-700">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* body rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-navy-700/50"
        >
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-16 ml-auto" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ChatSkeleton — mimics a chat/message interface                    */
/* ------------------------------------------------------------------ */
export function ChatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      {/* incoming message */}
      <div className="flex gap-3 max-w-[70%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
      {/* outgoing message */}
      <div className="flex gap-3 max-w-[70%] ml-auto flex-row-reverse">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24 ml-auto" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
      {/* incoming message */}
      <div className="flex gap-3 max-w-[70%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
      {/* input bar */}
      <div className="flex items-center gap-2 pt-4 border-t border-navy-700">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>
  );
}
