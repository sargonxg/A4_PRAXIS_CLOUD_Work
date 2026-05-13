"use client";

/**
 * RotatingHeadline — the hero H1 says "PRAXIS <phrase>." where the phrase
 * cycles through the things PRAXIS actually does. "PRAXIS" itself never
 * changes. The first phrase ("builds inheritable policy cores.") is also
 * the canonical headline that the SEO/JSON-LD and the landing E2E tests
 * pin against, so it is always the static first paint.
 *
 * Transitions are a short cross-fade + 6px lift so the headline feels
 * alive without ever degrading legibility. Honours
 * prefers-reduced-motion (locks to the first phrase) and the same
 * /?staticHero=1 escape hatch used by Playwright smoke tests.
 */

import { useEffect, useState } from "react";

const PHRASES = [
  "builds inheritable policy cores.",
  "captures tacit knowledge as structure.",
  "grounds answers in source receipts.",
  "structures situation intelligence.",
  "packages context for hybrid teams.",
  "stress-tests scenarios with experts in the loop.",
  "drafts memos that inherit posture.",
  "lets your team ship a capsule, not a prompt.",
];

const PHRASE_MS = 3600;
const FADE_MS = 360;

export function RotatingHeadline({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const params = new URLSearchParams(window.location.search);
    if (mq.matches || params.get("staticHero") === "1") {
      return; // stay on phrase 0
    }
    const fade = window.setTimeout(() => setPhase("out"), PHRASE_MS - FADE_MS);
    const swap = window.setTimeout(() => {
      setIndex((i) => (i + 1) % PHRASES.length);
      setPhase("in");
    }, PHRASE_MS);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(swap);
    };
  }, [index]);

  return (
    <h1
      className={[
        "max-w-4xl font-serif text-5xl font-semibold leading-[1.03] text-[#111827] sm:text-6xl lg:text-7xl",
        className ?? "",
      ].join(" ")}
    >
      <span className="text-[#0F172A]">PRAXIS</span>{" "}
      <span
        className="relative inline-block"
        style={{
          minHeight: "1em",
        }}
      >
        <span
          aria-live="polite"
          className="inline-block bg-gradient-to-r from-[#0F172A] via-[#1B3A5C] to-[#8A5A00] bg-clip-text text-transparent transition-all"
          style={{
            opacity: phase === "in" ? 1 : 0,
            transform: phase === "in" ? "translateY(0)" : "translateY(-6px)",
            transitionDuration: `${FADE_MS}ms`,
          }}
        >
          {PHRASES[index]}
        </span>
      </span>
    </h1>
  );
}
