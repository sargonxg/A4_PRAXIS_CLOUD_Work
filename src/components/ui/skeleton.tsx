import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "praxis-skeleton rounded-md bg-navy-700/50",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
