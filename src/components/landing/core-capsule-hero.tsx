"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  Map as MapIcon,
  Network,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

/**
 * CoreCapsuleHero — glass capsule under museum lighting.
 *
 * Vertical glass pill representing the PRAXIS context capsule.
 * Six policy cores orbit at Kepler-law speeds around a still center.
 * The whole capsule tilts ±6° toward the cursor.
 * Honours prefers-reduced-motion.
 */

type CoreGlyph = {
  key: string;
  label: string;
  Icon: typeof User;
  radius: number;
  period: number;
  offset: number;
  tone: "navy" | "blue" | "gold" | "sage" | "terracotta" | "purple";
};

const CORES: readonly CoreGlyph[] = [
  { key: "user", label: "User", Icon: User, radius: 38, period: 6, offset: 0, tone: "navy" },
  { key: "graph", label: "Graph", Icon: Network, radius: 64, period: 10, offset: 72, tone: "blue" },
  { key: "source", label: "Source", Icon: FileText, radius: 88, period: 14, offset: 144, tone: "terracotta" },
  { key: "map", label: "Situation", Icon: MapIcon, radius: 110, period: 18, offset: 36, tone: "sage" },
  { key: "time", label: "Time", Icon: Clock, radius: 132, period: 22, offset: 200, tone: "purple" },
  { key: "intent", label: "Intent", Icon: Sparkles, radius: 152, period: 26, offset: 280, tone: "gold" },
] as const;

const TONE_FILL: Record<CoreGlyph["tone"], string> = {
  navy: "#1B3A5C",
  blue: "#4B92DB",
  gold: "#E8B931",
  sage: "#5B8C5A",
  terracotta: "#C75B39",
  purple: "#7B6D8D",
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function CoreCapsuleHero({
  className = "",
  caption = "PRAXIS · Capsule No. 001",
}: {
  className?: string;
  caption?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      setTilt({
        x: Math.max(-6, Math.min(6, -dy * 12)),
        y: Math.max(-6, Math.min(6, dx * 12)),
      });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto w-full max-w-[380px] ${className}`}
      style={{ perspective: "1200px" }}
      aria-label="Living capsule of policy cores"
      role="img"
    >
      <div
        className="border-brushed-gold rounded-[180px] p-px shadow-capsule-lg transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="relative aspect-[5/12] overflow-hidden rounded-[180px] bg-[var(--color-vellum)]">
          <svg
            viewBox="0 0 320 760"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
          >
            <defs>
              <radialGradient id="cap-chamber" cx="50%" cy="38%" r="70%">
                <stop offset="0%" stopColor="#FDF6E3" />
                <stop offset="55%" stopColor="#F8F1E0" />
                <stop offset="100%" stopColor="#EDE4CB" />
              </radialGradient>
              <radialGradient id="cap-navy" cx="35%" cy="22%" r="80%">
                <stop offset="0%" stopColor="rgba(75,146,219,0.18)" />
                <stop offset="60%" stopColor="rgba(27,58,92,0.08)" />
                <stop offset="100%" stopColor="rgba(10,22,40,0)" />
              </radialGradient>
              <linearGradient id="cap-spec" x1="0%" y1="0%" x2="0%" y2="65%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <radialGradient id="cap-floor" cx="50%" cy="92%" r="55%">
                <stop offset="0%" stopColor="rgba(27,58,92,0.16)" />
                <stop offset="100%" stopColor="rgba(27,58,92,0)" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="320" height="760" rx="160" ry="160" fill="url(#cap-chamber)" />
            <rect x="0" y="0" width="320" height="760" rx="160" ry="160" fill="url(#cap-navy)" />
            <ellipse cx="120" cy="160" rx="130" ry="200" fill="url(#cap-spec)" />
            <rect x="0" y="0" width="320" height="760" rx="160" ry="160" fill="url(#cap-floor)" />

            {/* Concentric orbital guides */}
            {CORES.map((c) => (
              <ellipse
                key={`guide-${c.key}`}
                cx="160"
                cy="380"
                rx={c.radius}
                ry={c.radius * 1.05}
                fill="none"
                stroke="rgba(201,169,97,0.20)"
                strokeWidth="0.6"
                strokeDasharray="2 4"
              />
            ))}

            {/* Still center — gold spark */}
            <circle cx="160" cy="380" r="5" fill="#E8B931" />
            <circle
              cx="160"
              cy="380"
              r="14"
              fill="none"
              stroke="rgba(232,185,49,0.35)"
              strokeWidth="0.8"
            />
          </svg>

          {/* Orbiting glyphs */}
          <div className="pointer-events-none absolute inset-0">
            {CORES.map((c) => (
              <CoreOrbit key={c.key} core={c} reduced={reducedMotion} />
            ))}
          </div>

          {/* Filament — slow comet on outer rim */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              boxShadow: reducedMotion
                ? "none"
                : "0 0 0 1px rgba(232,185,49,0.10) inset",
              animation: reducedMotion ? undefined : "praxis-comet 22s linear infinite",
            }}
          >
            <span
              className="absolute left-1/2 top-0 block h-2 w-2 -translate-x-1/2 rounded-full"
              style={{
                background: "#F5D978",
                boxShadow: "0 0 12px 4px rgba(245,217,120,0.45)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
          {caption}
        </span>
      </div>

      <style jsx>{`
        @keyframes praxis-comet {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function CoreOrbit({ core, reduced }: { core: CoreGlyph; reduced: boolean }) {
  const { Icon, radius, period, offset, tone, label } = core;
  const fill = TONE_FILL[tone];

  // Position the glyph on its orbital ring using nested transforms:
  // outer rotates around the center, inner counter-rotates so the glyph
  // stays upright.
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{ width: 0, height: 0 }}
      aria-label={label}
    >
      <div
        style={{
          animation: reduced ? undefined : `praxis-orbit-${core.key} ${period}s linear infinite`,
          transform: `rotate(${offset}deg)`,
          transformOrigin: "center",
        }}
      >
        <div
          className="surface-glass flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-rose-gold)]/35"
          style={{
            position: "absolute",
            left: `${radius * 0.5}px`,
            top: `-18px`,
            transform: `rotate(-${offset}deg)`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.10), 0 14px 28px -18px rgba(27,58,92,0.4)",
            animation: reduced ? undefined : `praxis-counter-${core.key} ${period}s linear infinite`,
          }}
        >
          <Icon size={15} strokeWidth={1.8} color={fill} />
        </div>
      </div>
      <style jsx>{`
        @keyframes praxis-orbit-${core.key} {
          from { transform: rotate(${offset}deg); }
          to { transform: rotate(${offset + 360}deg); }
        }
        @keyframes praxis-counter-${core.key} {
          from { transform: rotate(-${offset}deg); }
          to { transform: rotate(-${offset + 360}deg); }
        }
      `}</style>
    </div>
  );
}

export default CoreCapsuleHero;
