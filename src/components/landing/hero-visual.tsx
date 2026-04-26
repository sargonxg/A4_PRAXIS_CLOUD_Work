"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ProductGlimpse } from "./hero";

/**
 * Hero visual slot.
 *
 * Always renders the live `ProductGlimpse` SVG (Conflict Graph + Risk Gauge +
 * Live Updates ticker + grounded-source pills). Earlier versions tried to play
 * `/landing/hero-loop.mp4` first, but the file shipped empty in production
 * which left a black rectangle on the right column for analysts loading the
 * page. The static SVG is faster to paint, never breaks, and works under
 * `prefers-reduced-motion`.
 *
 * The wrapper adds a soft floating motion (subtle parallax) and a slow gold
 * glow behind the card so the right column feels alive without being
 * distracting.
 */
export function HeroVisual() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <div className="relative w-full">
      {/* Soft glow behind the card */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 60% 40%, rgba(232,185,49,0.25) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 30% 70%, rgba(75,146,219,0.18) 0%, transparent 60%)",
        }}
        initial={{ opacity: 0.6 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.6 }
            : { opacity: [0.55, 0.85, 0.55] }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Card with subtle floating motion */}
      <motion.div
        initial={shouldReduceMotion ? false : { y: 0 }}
        animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative"
      >
        <ProductGlimpse />
      </motion.div>

      {/* Decorative orbiting pings — three small dots that orbit the card.
          Strictly aria-hidden, motion-respecting. */}
      {!shouldReduceMotion && (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute h-2 w-2 rounded-full bg-gold-500/70 shadow-[0_0_12px_rgba(232,185,49,0.55)]"
            style={{ top: "-6px", right: "10%" }}
            animate={{ y: [0, 6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute h-1.5 w-1.5 rounded-full bg-diplomatic-blue/70 shadow-[0_0_8px_rgba(75,146,219,0.45)]"
            style={{ top: "40%", left: "-8px" }}
            animate={{ x: [0, -4, 0], opacity: [0.3, 0.95, 0.3] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute h-1.5 w-1.5 rounded-full bg-sage shadow-[0_0_8px_rgba(89,161,79,0.45)]"
            style={{ bottom: "-4px", left: "30%" }}
            animate={{ y: [0, 4, 0], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
        </>
      )}
    </div>
  );
}
