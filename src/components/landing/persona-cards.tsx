"use client";

import Link from "next/link";
import { PraxisGlyphChip } from "@/components/brand/praxis-mark";

/**
 * Persona cards — three audiences with example output capsules.
 *
 * Copy stays neutral and tracks the v4_01 vision doc. Each card is a tall
 * rounded-3xl surface with a duotone navy+gold motif, three sample outputs,
 * and a capsule-secondary CTA.
 */

type Persona = {
  id: "diplomat" | "humanitarian" | "policy-lead";
  title: string;
  role: string;
  blurb: string;
  outputs: string[];
  accent: "navy" | "sage" | "gold";
};

const PERSONAS: readonly Persona[] = [
  {
    id: "diplomat",
    title: "Diplomat",
    role: "Country desk · Political officer · Envoy support",
    blurb:
      "Brief faster, cite better, and hand over a desk without losing institutional memory.",
    outputs: ["Country one-pager", "Diplomatic cable", "Talking points"],
    accent: "navy",
  },
  {
    id: "humanitarian",
    title: "Humanitarian lead",
    role: "Access · Protection · Donor strategy",
    blurb:
      "Turn humanitarian data, humanitarian web reporting, and field reporting into needs-grounded, access-aware briefs.",
    outputs: ["Humanitarian one-pager", "Donor brief", "Access map"],
    accent: "sage",
  },
  {
    id: "policy-lead",
    title: "Policy lead",
    role: "Mandate owner · Research head · Strategy desk",
    blurb:
      "Compose options memos and board briefs from your team's own capsules and source posture.",
    outputs: ["Options memo", "Board brief", "Scenario tree"],
    accent: "gold",
  },
];

const ACCENT_INK: Record<Persona["accent"], string> = {
  navy: "var(--color-deep-ink)",
  sage: "var(--color-mineral)",
  gold: "var(--color-oxide)",
};

const ACCENT_TINT: Record<Persona["accent"], string> = {
  navy: "rgba(27,58,92,0.10)",
  sage: "rgba(91,140,90,0.10)",
  gold: "rgba(232,185,49,0.16)",
};

export function PersonaCards() {
  return (
    <section
      aria-labelledby="personas-heading"
      className="relative mx-auto w-full max-w-[1280px] px-5 lg:px-8"
    >
      <div className="group mb-10 max-w-[60ch]">
        <span className="inline-flex items-center gap-2.5">
          <PraxisGlyphChip size={24} />
          <span className="text-overline text-[color:var(--color-gold-700)]">
            For whom
          </span>
        </span>
        <h2
          id="personas-heading"
          className="mt-2 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.1] tracking-tight text-[color:var(--color-ink)]"
        >
          Built for three desks
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--color-ink)]/70">
          One workbench, three flows. Pick the persona closest to your work —
          your capsule already knows the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {PERSONAS.map((p) => (
          <article
            key={p.id}
            className="surface-glass relative flex flex-col overflow-hidden rounded-3xl border border-[color:var(--color-rose-gold)]/25 p-6 shadow-capsule transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-capsule-lg sm:p-7"
            style={{
              background: `linear-gradient(180deg, ${ACCENT_TINT[p.accent]} 0%, rgba(255,255,255,0.55) 60%)`,
            }}
          >
            {/* Duotone motif: stacked rounded bars (navy + gold) */}
            <div
              aria-hidden
              className="mb-6 flex h-20 w-20 items-end gap-1.5 rounded-2xl p-3"
              style={{ background: `${ACCENT_INK[p.accent]}14` }}
            >
              <span className="block h-6 w-2 rounded-full" style={{ background: ACCENT_INK[p.accent] }} />
              <span className="block h-10 w-2 rounded-full" style={{ background: ACCENT_INK[p.accent] }} />
              <span className="block h-14 w-2 rounded-full bg-[color:var(--color-gold-500)]" />
              <span className="block h-9 w-2 rounded-full" style={{ background: ACCENT_INK[p.accent] }} />
              <span className="block h-12 w-2 rounded-full bg-[color:var(--color-gold-500)]" />
            </div>

            <h3 className="font-serif text-2xl font-medium leading-tight tracking-tight text-[color:var(--color-ink)]">
              {p.title}
            </h3>
            <p
              className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: ACCENT_INK[p.accent] }}
            >
              {p.role}
            </p>

            <div
              className="my-4 h-px w-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${ACCENT_INK[p.accent]}66, transparent)`,
              }}
            />

            <p className="text-[14px] leading-relaxed text-[color:var(--color-ink)]/75">
              {p.blurb}
            </p>

            <ul className="mt-5 space-y-2">
              {p.outputs.map((out) => (
                <li key={out} className="flex items-center gap-2 text-[13.5px] text-[color:var(--color-ink)]/85">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: ACCENT_INK[p.accent] }}
                  />
                  {out}
                </li>
              ))}
            </ul>

            <Link
              href="/login?mode=signup"
              prefetch={false}
              className="btn-capsule-secondary mt-auto inline-flex h-11 items-center justify-center self-start rounded-full px-5 pt-5 font-serif text-[14px] font-semibold"
              style={{ marginTop: "1.75rem" }}
            >
              Open a capsule
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PersonaCards;
