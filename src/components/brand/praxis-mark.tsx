"use client";

/**
 * PraxisMark — the ◳ brand glyph.
 *
 * A single Unicode character used as the PRAXIS visual signature. Renders
 * crisp at every size, scales with em, and aligns to text baselines so it
 * can drop into wordmarks, buttons, and nav chips without layout shift.
 *
 * Use this anywhere you'd otherwise reach for a generic sparkle / asterisk
 * / dot icon. The same glyph powers the thinking indicator below.
 */

import { cn } from "@/lib/utils/cn";

export interface PraxisMarkProps {
  size?: number | string;
  className?: string;
  /** Pulse the glyph at idle — used inside the AskBar caret + brand chip. */
  pulse?: boolean;
  title?: string;
}

export function PraxisMark({
  size = "1em",
  className,
  pulse = false,
  title,
}: PraxisMarkProps) {
  return (
    <span
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
      className={cn(
        "inline-flex items-center justify-center align-[-0.08em] font-serif leading-none",
        pulse && "animate-pulse",
        className,
      )}
      style={{ fontSize: typeof size === "number" ? `${size}px` : size }}
    >
      ◳
    </span>
  );
}

/**
 * GlyphChip — the rounded-2xl gradient tile that holds the ◳ glyph.
 * Used in the navbar, footer, section headings, and anywhere the brand
 * anchor should read as a deliberate object on the page.
 */
export function PraxisGlyphChip({
  size = 28,
  className,
  rotateOnHover = true,
}: {
  size?: number;
  className?: string;
  rotateOnHover?: boolean;
}) {
  const inner = Math.round(size * 0.6);
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl border border-[color:var(--color-rose-gold)]/40 bg-gradient-to-br from-[color:var(--color-gold-500)]/20 to-[color:var(--color-gold-500)]/5 transition-transform duration-500",
        rotateOnHover && "group-hover:rotate-[8deg]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <PraxisMark size={inner} className="text-[color:var(--color-gold-700)]" />
    </span>
  );
}

export default PraxisMark;
