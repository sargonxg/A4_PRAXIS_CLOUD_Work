"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { HeroQuadrantTour } from "./hero-quadrant-tour";

/**
 * Hero visual — the "portal".
 *
 * The right column is meant to feel like a live window into PRAXIS:
 *  - layered aurora behind the card (gold + diplomatic-blue)
 *  - two slow counter-rotating conic rings forming the portal frame
 *  - prismatic light arcs sweeping across the surface
 *  - orbiting telemetry pings
 *  - subtle 3D parallax tilt that follows the cursor
 *
 * Honours `prefers-reduced-motion`: rings, sweep, orbits, and tilt all
 * collapse to a static, accessible presentation.
 */
export function HeroVisual() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Mouse-driven parallax tilt (only when motion allowed)
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const tiltX = useSpring(useTransform(mvY, [-0.5, 0.5], [6, -6]), { stiffness: 110, damping: 16 });
  const tiltY = useSpring(useTransform(mvX, [-0.5, 0.5], [-6, 6]), { stiffness: 110, damping: 16 });
  const glareBg = useTransform(
    [mvX, mvY],
    ([x, y]: number[]) =>
      `radial-gradient(circle 220px at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.28), transparent 60%)`,
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (shouldReduceMotion || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    mvX.set((e.clientX - rect.left) / rect.width - 0.5);
    mvY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() {
    mvX.set(0);
    mvY.set(0);
  }

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full"
      style={{ perspective: "1400px" }}
    >
      {/* Outer aurora — sits behind everything, breathes slowly */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-12 -z-20 rounded-[40px] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 30% 30%, rgba(232,185,49,0.32) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 75% 70%, rgba(75,146,219,0.28) 0%, transparent 65%), radial-gradient(ellipse 35% 35% at 50% 50%, rgba(120,82,180,0.18) 0%, transparent 70%)",
        }}
        initial={{ opacity: 0.55 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.6 }
            : { opacity: [0.5, 0.85, 0.55, 0.78, 0.5] }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 9, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Portal ring — outer, slow clockwise sweep */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[34px]"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, rgba(232,185,49,0.55) 12%, transparent 28%, transparent 60%, rgba(75,146,219,0.5) 72%, transparent 88%, transparent 100%)",
            mask:
              "radial-gradient(circle at center, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))",
            WebkitMask:
              "radial-gradient(circle at center, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))",
            padding: "1.5px",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Portal ring — inner, slow counter-clockwise sweep */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 -z-10 rounded-[30px] opacity-70"
          style={{
            background:
              "conic-gradient(from 180deg, transparent 0%, rgba(255,255,255,0.45) 8%, transparent 22%, transparent 52%, rgba(232,185,49,0.4) 64%, transparent 78%, transparent 100%)",
            mask:
              "radial-gradient(circle at center, transparent calc(100% - 1px), #000 calc(100% - 1px))",
            WebkitMask:
              "radial-gradient(circle at center, transparent calc(100% - 1px), #000 calc(100% - 1px))",
            padding: "1px",
            mixBlendMode: "screen",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Tilting card stack */}
      <motion.div
        style={{
          rotateX: shouldReduceMotion ? 0 : tiltX,
          rotateY: shouldReduceMotion ? 0 : tiltY,
          transformStyle: "preserve-3d",
        }}
        initial={shouldReduceMotion ? false : { y: 0 }}
        animate={shouldReduceMotion ? undefined : { y: [0, -7, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative will-change-transform"
      >
        <HeroQuadrantTour />

        {/* Cursor-driven glare across the surface */}
        {!shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background: glareBg,
              mixBlendMode: "soft-light",
            }}
          />
        )}

        {/* Prismatic sweep — diagonal light arc that traverses the card */}
        {!shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
            style={{ mixBlendMode: "screen" }}
          >
            <motion.div
              className="absolute -inset-y-1/2 w-1/3"
              style={{
                background:
                  "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.0) 40%, rgba(255,235,180,0.55) 50%, rgba(255,255,255,0.0) 60%, transparent 100%)",
                filter: "blur(8px)",
              }}
              initial={{ x: "-130%", rotate: 12 }}
              animate={{ x: "260%" }}
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1.6,
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Orbiting telemetry pings around the portal */}
      {!shouldReduceMotion && (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute h-2.5 w-2.5 rounded-full bg-gold-500 shadow-[0_0_18px_rgba(232,185,49,0.8)]"
            style={{ top: "-8px", right: "12%" }}
            animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.25, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute h-1.5 w-1.5 rounded-full bg-diplomatic-blue shadow-[0_0_12px_rgba(75,146,219,0.7)]"
            style={{ top: "38%", left: "-10px" }}
            animate={{ x: [0, -6, 0], opacity: [0.35, 1, 0.35], scale: [1, 1.4, 1] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute h-1.5 w-1.5 rounded-full bg-sage shadow-[0_0_12px_rgba(89,161,79,0.65)]"
            style={{ bottom: "-6px", left: "32%" }}
            animate={{ y: [0, 5, 0], opacity: [0.35, 0.95, 0.35], scale: [1, 1.3, 1] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute h-1 w-1 rounded-full bg-crimson/70 shadow-[0_0_10px_rgba(225,87,89,0.55)]"
            style={{ top: "18%", right: "-6px" }}
            animate={{ x: [0, 5, 0], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </>
      )}
    </div>
  );
}
