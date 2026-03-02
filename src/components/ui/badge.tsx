import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-navy-950",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gold-500 text-navy-950 hover:bg-gold-400",
        secondary:
          "border-transparent bg-navy-700 text-navy-200 hover:bg-navy-600",
        outline: "border-navy-600 text-navy-300",
        destructive:
          "border-transparent bg-crimson text-navy-50 hover:bg-crimson/90",
        // Conflict grammar primitive colors
        terracotta:
          "border-transparent bg-terracotta/20 text-terracotta border-terracotta/30",
        teal: "border-transparent bg-teal/20 text-teal border-teal/30",
        sage: "border-transparent bg-sage/20 text-sage border-sage/30",
        steel: "border-transparent bg-steel/20 text-steel border-steel/30",
        crimson:
          "border-transparent bg-crimson/20 text-crimson border-crimson/30",
        purple:
          "border-transparent bg-purple/20 text-purple border-purple/30",
        gold: "border-transparent bg-gold-500/20 text-gold-400 border-gold-500/30",
        tan: "border-transparent bg-tan/20 text-tan border-tan/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
