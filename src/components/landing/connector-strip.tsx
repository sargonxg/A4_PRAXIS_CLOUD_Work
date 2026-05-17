"use client";

import { PraxisGlyphChip } from "@/components/brand/praxis-mark";

/**
 * Connector strip — the trust signal layer.
 *
 * Renders the supported source and ingest connector intentions as monochrome chips
 * with a status dot. Status semantics:
 *   - live      : production-grade, currently reachable
 *   - candidate : credentialed but gated / pending review
 *   - disabled  : stubbed in code; awaiting credentials or compliance
 *
 * Status is hardcoded for the landing surface. Inside the app shell at
 * /app/settings/connectors, fetch live status from a server function.
 */

type ConnectorStatus = "live" | "candidate" | "disabled";

type Connector = {
  id: string;
  label: string;
  category: "source" | "ingest";
  status: ConnectorStatus;
};

const CONNECTORS: readonly Connector[] = [
  { id: "grounded-search", label: "Grounded Search", category: "source", status: "live" },
  { id: "web-crawler", label: "Web crawler receipts", category: "source", status: "candidate" },
  { id: "wikipedia", label: "Wikipedia", category: "source", status: "live" },
  { id: "library-upload", label: "Library Upload", category: "ingest", status: "live" },
  { id: "source-url", label: "Source URL", category: "ingest", status: "live" },
];

const STATUS_DOT: Record<ConnectorStatus, string> = {
  live: "var(--color-gold-500)",
  candidate: "var(--color-rose-gold)",
  disabled: "rgba(10,22,40,0.30)",
};

const STATUS_LABEL: Record<ConnectorStatus, string> = {
  live: "Live",
  candidate: "Candidate",
  disabled: "Disabled",
};

export function ConnectorStrip() {
  return (
    <section
      aria-labelledby="connector-heading"
      className="relative mx-auto w-full max-w-[1280px] px-5 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="group max-w-[60ch]">
          <span className="inline-flex items-center gap-2.5">
            <PraxisGlyphChip size={24} />
            <span className="text-overline text-[color:var(--color-gold-700)]">
              Source layer
            </span>
          </span>
          <h2
            id="connector-heading"
            className="mt-2 font-serif text-[clamp(24px,3.4vw,36px)] font-medium leading-[1.1] tracking-tight text-[color:var(--color-ink)]"
          >
            Connectors PRAXIS speaks to
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-ink)]/70">
            Citations resolve to receipts. Receipts resolve to one of these.
          </p>
        </div>
        <Legend />
      </div>

      <ul
        role="list"
        className="flex flex-wrap gap-2.5"
        aria-label="Available connectors"
      >
        {CONNECTORS.map((c) => (
          <li key={c.id}>
            <span
              className="surface-glass inline-flex items-center gap-2 rounded-full border border-[color:var(--color-rose-gold)]/30 px-3 py-1.5 text-[12.5px] font-medium text-[color:var(--color-ink)]/85 shadow-capsule transition-all hover:-translate-y-0.5 hover:shadow-capsule-lg"
              title={`${c.label} — ${STATUS_LABEL[c.status]}`}
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: STATUS_DOT[c.status],
                  boxShadow:
                    c.status === "live"
                      ? "0 0 0 3px rgba(232,185,49,0.20)"
                      : "none",
                }}
              />
              {c.label}
              <span className="sr-only"> — {STATUS_LABEL[c.status]}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Legend() {
  return (
    <ul
      className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-ink)]/55"
      aria-label="Connector legend"
    >
      {(Object.keys(STATUS_DOT) as ConnectorStatus[]).map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: STATUS_DOT[s] }}
          />
          {STATUS_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}

export default ConnectorStrip;
