"use client";

import { useState } from "react";
import { CAPSULE_CORES, type CapsuleCoreKey } from "@/lib/constants/capsule-cores";

/**
 * Capsule-anatomy honeycomb — 12 tiles, one per core, flip on hover/tap.
 * Mobile: 3-col grid; tap toggles the back face. Honours reduced motion.
 */

export function CapsuleAnatomyHoneycomb() {
  const [activeMobile, setActiveMobile] = useState<CapsuleCoreKey | null>(null);

  return (
    <section
      aria-labelledby="anatomy-heading"
      className="relative mx-auto w-full max-w-[1280px] px-5 lg:px-8"
    >
      <div className="mb-10 max-w-[60ch]">
        <span className="text-overline text-[color:var(--color-gold-700)]">
          Anatomy
        </span>
        <h2
          id="anatomy-heading"
          className="mt-2 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.1] tracking-tight text-[color:var(--color-ink)]"
        >
          What a capsule holds
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--color-ink)]/70">
          Twelve typed slots. Every output knows who it was for, what evidence
          it stood on, and what it is allowed to say.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
        {CAPSULE_CORES.map((core) => {
          const isActive = activeMobile === core.key;
          return (
            <button
              type="button"
              key={core.key}
              onClick={() =>
                setActiveMobile((prev) => (prev === core.key ? null : core.key))
              }
              className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-[color:var(--color-rose-gold)]/25 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-gold-500)] focus-visible:ring-offset-2 hover:-translate-y-1 hover:shadow-capsule"
              style={{
                background: `linear-gradient(180deg, ${core.color}1A 0%, rgba(255,255,255,0.5) 60%)`,
              }}
              aria-expanded={isActive}
              aria-label={`${core.label} — ${core.description}`}
            >
              {/* Front face */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 transition-opacity duration-200 ${
                  isActive ? "opacity-0 sm:opacity-100 sm:group-hover:opacity-0" : "opacity-100 sm:group-hover:opacity-0"
                }`}
              >
                <span
                  className="block h-2.5 w-2.5 rounded-full"
                  style={{ background: core.color }}
                />
                <span className="font-serif text-[15px] font-medium leading-tight text-[color:var(--color-ink)] sm:text-base">
                  {core.label}
                </span>
              </div>
              {/* Back face */}
              <div
                className={`absolute inset-0 flex items-center justify-center p-3 transition-opacity duration-200 ${
                  isActive ? "opacity-100 sm:opacity-0 sm:group-hover:opacity-100" : "opacity-0 sm:group-hover:opacity-100"
                }`}
                style={{ background: `${core.color}DD` }}
              >
                <span className="text-center text-[11px] leading-snug text-white sm:text-[12px]">
                  {core.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/50">
        Tap a tile to reveal · 12 cores · 1 capsule
      </p>
    </section>
  );
}

export default CapsuleAnatomyHoneycomb;
