"use client";

import { Plus, Sparkles } from "lucide-react";

/**
 * Compose showcase — visual proof that two capsules concatenate into a third.
 *
 * Pure presentation. The actual concatenation logic lives in
 * src/lib/context/capsule-service.ts (combineCapsules). This section sells
 * the concept; the drag-and-drop UI surfaces it inside the app shell.
 */

type MiniCapsule = {
  title: string;
  family: string;
  accent: "navy" | "blue" | "gold" | "sage" | "terracotta";
};

const ACCENT_INK: Record<MiniCapsule["accent"], string> = {
  navy: "#1B3A5C",
  blue: "#4B92DB",
  gold: "#A37A14",
  sage: "#3F6440",
  terracotta: "#8E3D24",
};
const ACCENT_BG: Record<MiniCapsule["accent"], string> = {
  navy: "rgba(27,58,92,0.10)",
  blue: "rgba(75,146,219,0.12)",
  gold: "rgba(232,185,49,0.18)",
  sage: "rgba(91,140,90,0.12)",
  terracotta: "rgba(199,91,57,0.12)",
};

const LEFT: MiniCapsule = {
  title: "Country One-Pager",
  family: "Country",
  accent: "blue",
};
const RIGHT: MiniCapsule = {
  title: "Risk Monitor Card",
  family: "Risk",
  accent: "terracotta",
};
const RESULT: MiniCapsule = {
  title: "Country Pack",
  family: "Composite · Executive",
  accent: "gold",
};

export function ComposeCapsulesShowcase() {
  return (
    <section
      aria-labelledby="compose-heading"
      className="relative mx-auto w-full max-w-[1280px] px-5 lg:px-8"
    >
      <div className="mb-10 max-w-[60ch]">
        <span className="text-overline text-[color:var(--color-gold-700)]">
          Compose
        </span>
        <h2
          id="compose-heading"
          className="mt-2 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.1] tracking-tight text-[color:var(--color-ink)]"
        >
          Concatenate capsules into a third
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--color-ink)]/70">
          Outputs are first-class objects. Drag two together to make a
          composite — citations, provenance, and version lineage carry through.
        </p>
      </div>

      <div className="relative grid grid-cols-1 items-stretch gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <ComposeCard capsule={LEFT} tiltDeg={-2} />
        <Connector glyph="plus" />
        <ComposeCard capsule={RIGHT} tiltDeg={2} />
        <Connector glyph="arrow" />
        <ComposeCard capsule={RESULT} tiltDeg={0} composite />
      </div>

      <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/50">
        2 capsules · 1 composite · full provenance preserved
      </p>
    </section>
  );
}

function ComposeCard({
  capsule,
  tiltDeg,
  composite = false,
}: {
  capsule: MiniCapsule;
  tiltDeg: number;
  composite?: boolean;
}) {
  return (
    <div className="flex items-center justify-center">
      <article
        className="surface-glass relative flex aspect-[5/6] w-full max-w-[260px] flex-col overflow-hidden rounded-3xl border border-[color:var(--color-rose-gold)]/30 p-5 shadow-capsule"
        style={{
          transform: `rotate(${tiltDeg}deg)`,
          background: `linear-gradient(180deg, ${ACCENT_BG[capsule.accent]} 0%, rgba(255,255,255,0.55) 60%)`,
        }}
      >
        {composite ? (
          <div
            aria-hidden
            className="border-brushed-gold pointer-events-none absolute inset-0 rounded-3xl p-px"
            style={{ background: "transparent" }}
          />
        ) : null}

        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: ACCENT_INK[capsule.accent] }}
        >
          {capsule.family}
        </span>

        <h3 className="mt-2 font-serif text-[22px] font-medium leading-tight tracking-tight text-[color:var(--color-ink)]">
          {capsule.title}
        </h3>

        <div
          className="my-3 h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${ACCENT_INK[capsule.accent]}66, transparent)`,
          }}
        />

        {/* Mock content rows */}
        <div className="space-y-2.5">
          {[88, 64, 76, 52].map((w, idx) => (
            <div
              key={idx}
              className="h-2 rounded-full"
              style={{
                width: `${w}%`,
                background: `${ACCENT_INK[capsule.accent]}22`,
              }}
            />
          ))}
        </div>

        {composite ? (
          <div className="mt-auto flex items-center gap-2 pt-4">
            <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT_INK[capsule.accent] }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: ACCENT_INK[capsule.accent] }}
            >
              Composite
            </span>
          </div>
        ) : (
          <div className="mt-auto flex items-center gap-2 pt-4">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: ACCENT_INK[capsule.accent] }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45">
              Capsule
            </span>
          </div>
        )}
      </article>
    </div>
  );
}

function Connector({ glyph }: { glyph: "plus" | "arrow" }) {
  return (
    <div className="hidden items-center justify-center md:flex">
      <div className="relative flex h-12 w-12 items-center justify-center">
        {/* Dotted gold line behind */}
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-px w-16 -translate-x-1/2 -translate-y-1/2"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--color-gold-500) 50%, transparent 50%)",
            backgroundSize: "8px 1px",
            backgroundRepeat: "repeat-x",
            opacity: 0.6,
          }}
        />
        <span
          className="surface-glass flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-gold-500)]/40 text-[color:var(--color-gold-700)]"
          style={{ boxShadow: "0 0 0 6px rgba(232,185,49,0.10)" }}
        >
          {glyph === "plus" ? (
            <Plus className="h-4 w-4" strokeWidth={2.2} />
          ) : (
            <span className="font-serif text-lg leading-none">→</span>
          )}
        </span>
      </div>
    </div>
  );
}

export default ComposeCapsulesShowcase;
