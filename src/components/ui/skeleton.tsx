import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "praxis-skeleton rounded-md bg-emerald-700/20",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
