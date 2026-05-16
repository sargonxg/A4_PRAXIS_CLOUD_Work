"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Output catalog — postcard-sized cards for each output capsule template.
 *
 * Standalone marketing component. Data is illustrative; when the Codex output-
 * capsule registry lands, replace OUTPUT_SAMPLES with a server-fed list pulled
 * from `src/lib/product/output-capsules.ts` (or wherever the registry settles).
 */

type OutputSample = {
  id: string;
  family: string;
  title: string;
  preview: string;
  accent: "navy" | "blue" | "gold" | "sage" | "terracotta" | "purple";
};

const OUTPUT_SAMPLES: readonly OutputSample[] = [
  {
    id: "morning-brief",
    family: "Daily",
    title: "Morning Brief",
    preview:
      "Overnight feed digest with three signals worth your attention, ranked against your mandate.",
    accent: "navy",
  },
  {
    id: "country-one-pager",
    family: "Country",
    title: "Country One-Pager",
    preview:
      "Single-page snapshot — actors, claims, risk posture, last-week events, recommended watch items.",
    accent: "blue",
  },
  {
    id: "media-roundup",
    family: "Media / Info",
    title: "Media Roundup",
    preview:
      "Foreign-policy framing across English, Arabic, French press, with narrative-divergence call-outs.",
    accent: "terracotta",
  },
  {
    id: "humanitarian-one-pager",
    family: "Humanitarian",
    title: "Humanitarian One-Pager",
    preview:
      "IPC bands, displacement deltas, access constraints, donor commitments — sourced to HDX and OCHA.",
    accent: "sage",
  },
  {
    id: "actor-dossier",
    family: "Actor",
    title: "Actor Dossier",
    preview:
      "Bio, faction map, declared interests vs. inferred interests, leverage inventory, salience score.",
    accent: "purple",
  },
  {
    id: "diplomatic-cable",
    family: "Diplomatic",
    title: "Diplomatic Cable",
    preview:
      "Démarche-ready memo with talking points, audience tone match, and a redaction-safe variant.",
    accent: "navy",
  },
  {
    id: "sanctions-tracker",
    family: "Legal / Sanctions",
    title: "Sanctions Tracker",
    preview:
      "Designations diff since last run, compliance-note draft, treaty cross-reference, IHL flags.",
    accent: "terracotta",
  },
  {
    id: "scenario-tree",
    family: "Risk",
    title: "Scenario Tree",
    preview:
      "Three branching futures with probability bands, leading indicators, and decision-trigger thresholds.",
    accent: "gold",
  },
  {
    id: "board-brief",
    family: "Executive",
    title: "Board Brief",
    preview:
      "Concatenates country one-pager + risk card + options memo into a single board-ready deck.",
    accent: "blue",
  },
  {
    id: "mediation-options",
    family: "Mediation",
    title: "Options Paper",
    preview:
      "Stakeholder map, BATNAs, sequencing, and a red-team annex challenging the preferred path.",
    accent: "sage",
  },
  {
    id: "regulatory-watch",
    family: "Policy",
    title: "Regulatory Watch",
    preview:
      "New rule-makings against your watchlist, impact tags, and a draft response-window memo.",
    accent: "purple",
  },
  {
    id: "event-timeline",
    family: "Tactical",
    title: "Event Timeline",
    preview:
      "Sigact-style chronology with actor tagging, cited to source receipts, exportable to PPTX.",
    accent: "navy",
  },
  {
    id: "narrative-monitor",
    family: "Media / Info",
    title: "Narrative Monitor",
    preview:
      "Tracked frames, momentum deltas, surfacing accounts, and a counter-narrative drafting prompt.",
    accent: "terracotta",
  },
  {
    id: "handover-pack",
    family: "Composite",
    title: "Handover Pack",
    preview:
      "Everything an incoming officer needs — capsule diff, recent outputs, open threads, red-line list.",
    accent: "gold",
  },
];

const ACCENT_TINT: Record<OutputSample["accent"], string> = {
  navy: "rgba(27,58,92,0.10)",
  blue: "rgba(75,146,219,0.12)",
  gold: "rgba(232,185,49,0.18)",
  sage: "rgba(91,140,90,0.12)",
  terracotta: "rgba(199,91,57,0.12)",
  purple: "rgba(123,109,141,0.12)",
};

const ACCENT_INK: Record<OutputSample["accent"], string> = {
  navy: "#1B3A5C",
  blue: "#1B3A5C",
  gold: "#A37A14",
  sage: "#3F6440",
  terracotta: "#8E3D24",
  purple: "#574A6A",
};

export function OutputCatalogCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);

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
        {OUTPUT_SAMPLES.map((s, i) => {
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
