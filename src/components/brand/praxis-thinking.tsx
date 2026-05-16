"use client";

import { cn } from "@/lib/utils/cn";

/**
 * PraxisThinking — the ◳ glyph as a thinking indicator.
 *
 * Spins, breathes, and emits a soft gold ring. Drop into chat bubbles,
 * generation states, agent runs, anywhere PRAXIS is composing.
 *
 *   <PraxisThinking />                          // 18px, label "Thinking…"
 *   <PraxisThinking label="Composing memo" />   // custom label
 *   <PraxisThinking compact />                  // glyph only, no label
 *   <PraxisThinking size={28} />                // big variant for hero
 *
 * Honours prefers-reduced-motion (the keyframe is paused via CSS in
 * globals.css under the existing reduced-motion guard).
 */

export interface PraxisThinkingProps {
  size?: number;
  label?: string;
  compact?: boolean;
  className?: string;
}

export function PraxisThinking({
  size = 18,
  label = "Thinking…",
  compact = false,
  className,
}: PraxisThinkingProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[12px] tracking-[0.12em] text-[color:var(--color-ink)]/65",
        className,
      )}
    >
      <span
        aria-hidden
        className="praxis-thinking-glyph relative inline-flex items-center justify-center font-serif leading-none"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size}px`,
        }}
      >
        <span className="praxis-thinking-halo" />
        <span className="praxis-thinking-rune">◳</span>
      </span>
      {compact ? null : (
        <span className="uppercase">{label}</span>
      )}
    </span>
  );
}

export default PraxisThinking;
