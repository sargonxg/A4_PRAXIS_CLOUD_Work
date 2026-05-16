"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gold-500 text-navy-950 hover:bg-gold-400 active:bg-gold-600 font-semibold",
        secondary:
          "bg-navy-700 text-navy-100 hover:bg-navy-600 active:bg-navy-800 border border-navy-600",
        ghost:
          "text-navy-300 hover:bg-navy-800 hover:text-navy-100 active:bg-navy-700",
        destructive:
          "bg-crimson text-navy-50 hover:bg-crimson/90 active:bg-crimson/80",
        outline:
          "border border-navy-600 text-navy-200 hover:bg-navy-800 hover:text-navy-100 active:bg-navy-700",
        link: "text-gold-400 underline-offset-4 hover:underline hover:text-gold-300",
        /* PRAXIS landing capsule variants — pill shape, museum-grade depth.
           Use these for marketing surfaces and the public AskBar. */
        capsule:
          "btn-capsule-primary rounded-full font-serif font-semibold tracking-tight",
        "capsule-secondary":
          "btn-capsule-secondary rounded-full font-serif font-semibold tracking-tight",
        "capsule-ghost":
          "btn-capsule-ghost rounded-full font-sans font-medium",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        default: "h-9 px-4 py-2",
        lg: "h-10 px-6 text-base rounded-md",
        icon: "h-9 w-9",
        /* Pill sizes for capsule variants. */
        pill: "h-11 px-6 text-[15px] rounded-full",
        "pill-lg": "h-12 px-7 text-base rounded-full",
        "pill-sm": "h-9 px-4 text-sm rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
