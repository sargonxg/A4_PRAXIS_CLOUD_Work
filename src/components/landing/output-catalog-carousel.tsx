"use client";

import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OUTPUT_CAPSULE_TEMPLATES } from "@/lib/output-capsules/templates";
import type { OutputCapsuleFamily, OutputCapsuleTemplate } from "@/lib/output-capsules/types";

/**
 * Output catalog — postcard cards for every registered output-capsule template.
 *
 * Source of truth is `src/lib/output-capsules/templates.ts` (Codex registry).
 * This component is presentation-only: derive label, family, and preview from
 * the live template registry so the catalog stays in sync as templates grow.
 */

type Accent = "navy" | "blue" | "gold" | "sage" | "terracotta" | "purple";

const FAMILY_ACCENT: Record<OutputCapsuleFamily, Accent> = {
  daily: "navy",
  country: "blue",
  actor: "purple",
  conflict: "navy",
  humanitarian: "sage",
  diplomatic: "navy",
  mediation: "sage",
  "legal-sanctions": "terracotta",
  "media-info": "terracotta",
  risk: "terracotta",
  "board-exec": "blue",
  research: "purple",
  tactical: "navy",
  policy: "purple",
  composite: "gold",
};

const FAMILY_LABEL: Record<OutputCapsuleFamily, string> = {
  daily: "Daily",
  country: "Country",
  actor: "Actor",
  conflict: "Conflict",
  humanitarian: "Humanitarian",
  diplomatic: "Diplomatic",
  mediation: "Mediation",
  "legal-sanctions": "Legal / Sanctions",
  "media-info": "Media / Info",
  risk: "Risk",
  "board-exec": "Executive",
  research: "Research",
  tactical: "Tactical",
  policy: "Policy",
  composite: "Composite",
};

const ACCENT_TINT: Record<Accent, string> = {
  navy: "rgba(27,58,92,0.10)",
  blue: "rgba(75,146,219,0.12)",
  gold: "rgba(232,185,49,0.18)",
  sage: "rgba(91,140,90,0.12)",
  terracotta: "rgba(199,91,57,0.12)",
  purple: "rgba(123,109,141,0.12)",
};

const ACCENT_INK: Record<Accent, string> = {
  navy: "#1B3A5C",
  blue: "#1B3A5C",
  gold: "#A37A14",
  sage: "#3F6440",
  terracotta: "#8E3D24",
  purple: "#574A6A",
};

type CardData = {
  id: string;
  family: string;
  title: string;
  preview: string;
  accent: Accent;
  composable: number;
};

function templateToCard(t: OutputCapsuleTemplate): CardData {
  return {
    id: t.id,
    family: FAMILY_LABEL[t.family],
    title: t.label,
    preview: t.description,
    accent: FAMILY_ACCENT[t.family],
    composable: t.composableWith.length,
  };
}

export function OutputCatalogCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cards = useMemo(
    () => OUTPUT_CAPSULE_TEMPLATES.map(templateToCard),
    [],
  );

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.85, 720);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby="output-catalog-heading"
      className="relative mx-auto w-full max-w-[1280px] px-5 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-overline text-[color:var(--color-gold-700)]">
            Output catalog
          </span>
          <h2
            id="output-catalog-heading"
            className="mt-2 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.1] tracking-tight text-[color:var(--color-ink)]"
          >
            What a capsule produces
          </h2>
          <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-[color:var(--color-ink)]/70">
            Every output is a typed, citable, version-controlled capsule.
            Compose two to make a third.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-rose-gold)]/40 bg-white/70 text-[color:var(--color-ink)] backdrop-blur transition hover:bg-white hover:shadow-capsule"
            aria-label="Previous outputs"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-rose-gold)]/40 bg-white/70 text-[color:var(--color-ink)] backdrop-blur transition hover:bg-white hover:shadow-capsule"
            aria-label="Next outputs"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 pt-2 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        role="list"
      >
        {cards.map((s, i) => {
          const tiltDeg = i % 2 === 0 ? -1.5 : 1.5;
          return (
            <article
              key={s.id}
              role="listitem"
              className="surface-glass relative flex aspect-[5/7] w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-[color:var(--color-rose-gold)]/25 p-5 shadow-capsule transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-capsule-lg sm:w-[280px]"
              style={{
                transform: `rotate(${tiltDeg}deg)`,
                background: `linear-gradient(180deg, ${ACCENT_TINT[s.accent]} 0%, rgba(255,255,255,0.55) 60%)`,
              }}
            >
              {/* Paper-fold corner */}
              <span
                aria-hidden
                className="absolute right-0 top-0 h-9 w-9"
                style={{
                  background:
                    "linear-gradient(225deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 40%, transparent 60%)",
                  clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                  borderBottomLeftRadius: "10px",
                  boxShadow: "-1px 1px 2px rgba(15,23,42,0.06)",
                }}
              />

              <span
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: ACCENT_INK[s.accent] }}
              >
                {s.family}
              </span>

              <h3 className="mt-2 font-serif text-[22px] font-medium leading-tight tracking-tight text-[color:var(--color-ink)]">
                {s.title}
              </h3>

              <div
                className="my-3 h-px w-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${ACCENT_INK[s.accent]}66, transparent)`,
                }}
              />

              <p className="text-[13.5px] leading-relaxed text-[color:var(--color-ink)]/72">
                {s.preview}
              </p>

              <div className="mt-auto flex items-center gap-2 pt-4">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: ACCENT_INK[s.accent] }}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45">
                  Capsule · {s.id}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default OutputCatalogCarousel;
