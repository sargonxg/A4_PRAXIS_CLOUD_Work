"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { HeroQuadrantTour } from "./hero-quadrant-tour";
import { BitemporalClock } from "./hero-narrative-layers/bitemporal-clock";
import { BoardroomOrbit } from "./hero-narrative-layers/boardroom-orbit";
import { CausalEdgeTrace } from "./hero-narrative-layers/causal-edge-trace";
import { ClaimToParagraph } from "./hero-narrative-layers/claim-to-paragraph";
import { CypherFlicker } from "./hero-narrative-layers/cypher-flicker";
import { ParticleResolution } from "./hero-narrative-layers/particle-resolution";
import { SourceReceipts } from "./hero-narrative-layers/source-receipts";

const COMMAND_STEPS = [
  { label: "INGEST", value: "8 feeds" },
  { label: "STRUCTURE", value: "ACO v2" },
  { label: "VERIFY", value: "Cypher" },
  { label: "BRIEF", value: "18 cites" },
];

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
export function HeroVisual({ narrativeMotion = true }: { narrativeMotion?: boolean }) {
  const shouldReduceMotion = !narrativeMotion;
  const activeNarrativeMotion = narrativeMotion;
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
      aria-hidden="true"
    >
      {!shouldReduceMotion && <HeroDepthField active />}

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
        {narrativeMotion ? <HeroQuadrantTour /> : <StaticHeroCard />}
        {!shouldReduceMotion && <CommandDeckOverlay active />}
        <ParticleResolution active={activeNarrativeMotion} />
        <SourceReceipts active={activeNarrativeMotion} />
        <CausalEdgeTrace active={activeNarrativeMotion} />
        <BoardroomOrbit active={activeNarrativeMotion} />
        <ClaimToParagraph active={activeNarrativeMotion} />
        <CypherFlicker active={activeNarrativeMotion} />
        <BitemporalClock active={activeNarrativeMotion} />

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

function HeroDepthField({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute -inset-14 -z-30 overflow-hidden rounded-[44px]">
      <svg className="h-full w-full" viewBox="0 0 700 520" aria-hidden="true">
        <defs>
          <linearGradient id="hero-depth-stroke" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#E8B931" stopOpacity="0.5" />
            <stop offset="52%" stopColor="#4B92DB" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#59A14F" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((ring) => (
          <motion.ellipse
            key={ring}
            cx="350"
            cy="260"
            rx={250 - ring * 38}
            ry={150 - ring * 24}
            fill="none"
            stroke="url(#hero-depth-stroke)"
            strokeWidth="1"
            strokeDasharray={`${12 + ring * 4} ${18 + ring * 5}`}
            opacity={0.22 - ring * 0.04}
            initial={false}
            animate={active ? { rotate: ring % 2 ? -360 : 360 } : undefined}
            transition={active ? { duration: 44 + ring * 10, repeat: Infinity, ease: "linear" } : undefined}
            style={{ transformOrigin: "350px 260px" }}
          />
        ))}
        {[
          [112, 126, 288, 206],
          [425, 108, 585, 210],
          [132, 386, 300, 304],
          [420, 360, 568, 276],
        ].map(([x1, y1, x2, y2], index) => (
          <motion.path
            key={index}
            d={`M${x1},${y1} C${(x1 + x2) / 2},${y1 - 42} ${(x1 + x2) / 2},${y2 + 42} ${x2},${y2}`}
            fill="none"
            stroke="url(#hero-depth-stroke)"
            strokeWidth="1"
            strokeOpacity="0.18"
            initial={active ? { pathLength: 0.1, opacity: 0.08 } : false}
            animate={active ? { pathLength: [0.15, 1, 0.15], opacity: [0.08, 0.3, 0.08] } : undefined}
            transition={active ? { duration: 6 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.7 } : undefined}
          />
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(232,185,49,0.1),transparent_34%),radial-gradient(circle_at_72%_68%,rgba(75,146,219,0.1),transparent_32%)]" />
    </div>
  );
}

function CommandDeckOverlay({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute -left-4 top-8 hidden w-28 flex-col gap-1.5 lg:flex"
        initial={active ? { opacity: 0, x: -12 } : false}
        animate={active ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        {COMMAND_STEPS.map((step, index) => (
          <motion.div
            key={step.label}
            className="rounded-lg border border-white/45 bg-white/78 px-2 py-1.5 shadow-lg shadow-navy-950/10 backdrop-blur-md"
            animate={active ? { y: [0, -2, 0], opacity: [0.78, 1, 0.78] } : undefined}
            transition={active ? { duration: 3.2 + index * 0.35, repeat: Infinity, ease: "easeInOut", delay: index * 0.22 } : undefined}
          >
            <div className="font-mono text-[8px] font-bold tracking-[0.18em] text-diplomatic-blue">
              {step.label}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold leading-none text-navy-800">
              {step.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="absolute -right-5 top-5 hidden w-36 rounded-xl border border-diplomatic-blue/15 bg-navy-950/88 p-2.5 text-white shadow-2xl shadow-navy-950/20 backdrop-blur-md lg:block"
        initial={active ? { opacity: 0, y: -10, rotate: 2 } : false}
        animate={active ? { opacity: 1, y: 0, rotate: 0 } : undefined}
        transition={{ duration: 0.55, delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-gold-300">
            Live query
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        </div>
        <div className="mt-2 font-mono text-[8.5px] leading-snug text-blue-100">
          MATCH p=(claim)-[:SUPPORTED_BY*1..2]-&gt;(source)
        </div>
        <div className="mt-2 rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-semibold text-emerald-100">
          91% provenance sealed
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-x-5 -bottom-4 hidden items-center justify-between rounded-xl border border-white/40 bg-white/82 px-3 py-2 shadow-2xl shadow-navy-950/12 backdrop-blur-md sm:flex"
        initial={active ? { opacity: 0, y: 10 } : false}
        animate={active ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.55, delay: 0.7 }}
      >
        {[
          ["Evidence", "18 receipts"],
          ["Graph", "42 edges"],
          ["Risk", "78/100"],
          ["Export", "DOCX ready"],
        ].map(([label, value], index) => (
          <div key={label} className="flex min-w-0 items-center gap-2">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-gold-500"
              animate={active ? { scale: [1, 1.7, 1], opacity: [0.55, 1, 0.55] } : undefined}
              transition={active ? { duration: 2.2, repeat: Infinity, delay: index * 0.3 } : undefined}
            />
            <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-navy-400">
              {label}
            </span>
            <span className="truncate font-mono text-[9px] font-bold text-navy-800">
              {value}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function StaticHeroCard() {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-diplomatic-blue/15 bg-gradient-to-br from-white/85 via-white/75 to-cream-50/70 shadow-2xl shadow-navy-950/10 backdrop-blur-md">
      <div className="flex items-center gap-1.5 border-b border-cream-200/60 bg-gradient-to-r from-cream-50/90 via-white/80 to-cream-50/90 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-crimson/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-sage/50" />
        <span className="ml-3 font-mono text-[9px] text-navy-500">
          praxis.tacitus.me · source-grounded graph
        </span>
      </div>
      <div className="grid h-[calc(100%-42px)] grid-cols-[1.15fr_0.85fr] gap-3 p-4">
        <div className="rounded-lg border border-cream-200/70 bg-white/70 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
              ACO graph
            </span>
            <span className="rounded bg-gold-50 px-1.5 py-0.5 font-mono text-[8px] text-gold-700">
              18 citations
            </span>
          </div>
          <svg viewBox="0 0 100 74" className="h-full w-full" aria-hidden="true">
            {[
              [20, 18, 50, 32],
              [50, 32, 80, 18],
              [50, 32, 76, 54],
              [20, 54, 50, 32],
              [36, 62, 76, 54],
            ].map(([x1, y1, x2, y2], index) => (
              <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" className="text-diplomatic-blue/30" />
            ))}
            {[
              [20, 18, "Actor", "fill-diplomatic-blue"],
              [50, 32, "Claim", "fill-gold-500"],
              [80, 18, "Source", "fill-sage"],
              [20, 54, "Event", "fill-crimson"],
              [76, 54, "Brief", "fill-navy-500"],
            ].map(([cx, cy, label, fill]) => (
              <g key={label as string}>
                <circle cx={cx as number} cy={cy as number} r="7" className={fill as string} opacity="0.9" />
                <text x={cx as number} y={(cy as number) + 14} textAnchor="middle" fontSize="4" className="fill-navy-700 font-semibold">
                  {label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          {[
            ["MATCH", "claim supported by 2 sources"],
            ["VERIFY", "graph grounded · 3 hops"],
            ["EXPORT", "paragraph provenance sealed"],
          ].map(([label, copy]) => (
            <div key={label} className="rounded-md border border-cream-200/70 bg-white/75 px-3 py-2">
              <div className="font-mono text-[9px] font-bold text-gold-700">{label}</div>
              <div className="mt-1 text-[10px] font-semibold leading-snug text-navy-700">{copy}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
