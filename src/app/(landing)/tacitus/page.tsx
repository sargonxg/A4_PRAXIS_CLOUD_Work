import Link from "next/link";
import { PraxisGlyphChip } from "@/components/brand/praxis-mark";

const layers = [
  {
    name: "PRAXIS",
    summary:
      "The user-facing policy workbench. Build a capsule, ask the capsule, use tools, ship sourced outputs.",
  },
  {
    name: "KAIROS",
    summary:
      "The temporality layer. Episodes, stale assumptions, deadlines, windows, and changing context.",
  },
  {
    name: "AGON",
    summary:
      "The human-friction layer. Actors, claims, commitments, incentives, blockers, and conflict dynamics.",
  },
];

export const metadata = {
  title: "TACITUS",
  description: "The TACITUS product architecture behind PRAXIS.",
};

export default function TacitusPage() {
  return (
    <section className="relative z-10 mx-auto max-w-[1180px] px-5 pb-24 pt-12 sm:pt-20 lg:px-8">
      <div className="group inline-flex items-center gap-2.5">
        <PraxisGlyphChip size={28} />
        <span className="text-overline text-[color:var(--color-gold-700)]">
          TACITUS
        </span>
      </div>
      <h1 className="mt-4 max-w-[28ch] font-serif text-[clamp(36px,5.4vw,64px)] font-medium leading-[1.04] tracking-tight text-[color:var(--color-ink)]">
        Software for statecraft, policy, and conflict intelligence.
      </h1>
      <p className="mt-5 max-w-[58ch] text-[16px] leading-relaxed text-[color:var(--color-ink)]/72">
        TACITUS builds the deeper systems behind PRAXIS. The product stays
        simple: users build capsules, ask the capsule, run tools, and produce
        sourced outputs. The layers below sit quietly underneath.
      </p>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {layers.map((layer) => (
          <article
            key={layer.name}
            className="surface-glass relative overflow-hidden rounded-3xl border border-[color:var(--color-rose-gold)]/25 p-6 shadow-capsule transition-all duration-300 hover:-translate-y-1 hover:shadow-capsule-lg"
          >
            <div className="group inline-flex items-center gap-2">
              <PraxisGlyphChip size={22} />
              <h2 className="font-serif text-lg font-semibold tracking-wide text-[color:var(--color-diplomatic-blue)]">
                {layer.name}
              </h2>
            </div>
            <div
              className="my-4 h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,169,97,0.55), transparent)",
              }}
            />
            <p className="text-[14px] leading-relaxed text-[color:var(--color-ink)]/72">
              {layer.summary}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <Link
          href="/learn"
          prefetch={false}
          className="btn-capsule-primary inline-flex h-11 items-center justify-center rounded-full px-6 font-serif text-[15px] font-semibold tracking-tight"
        >
          Learn PRAXIS
        </Link>
        <a
          href="mailto:hello@tacitus.me"
          className="btn-capsule-secondary inline-flex h-11 items-center justify-center rounded-full px-5 font-serif text-[15px] font-semibold tracking-tight"
        >
          Contact TACITUS
        </a>
      </div>

      <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.24em] text-[color:var(--color-ink)]/45">
        TACITUS · The system of record for human friction
      </p>
    </section>
  );
}
