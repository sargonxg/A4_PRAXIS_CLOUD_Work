const trustSignals = [
  {
    label: "JSON-LD Provenance",
    sub: "W3C PROV in every export",
    detail: "Every exported artifact carries structured lineage so a reviewer can trace where claims came from.",
  },
  {
    label: "Symbolic Firewall",
    sub: "Cypher-verified claims",
    detail: "Graph assertions are checked against explicit query constraints before they enter the analytic record.",
  },
  {
    label: "Trust Score",
    sub: "0–100 on every paragraph",
    detail: "Paragraph-level scoring keeps uncertainty visible at the exact point where decisions are made.",
  },
  {
    label: "SOC 2 path",
    sub: "Audit-ready event spine",
    detail: "Events are structured for future control evidence, access review, and incident reconstruction.",
  },
  {
    label: "EU AI Act ready",
    sub: "Human-in-the-loop on high-risk verbs",
    detail: "High-risk actions are designed around reviewable human approval rather than unattended automation.",
  },
];

function GoldGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="mt-1 h-3 w-3 shrink-0 text-gold-600"
      fill="none"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 1.25 7.2 4.8 10.75 6 7.2 7.2 6 10.75 4.8 7.2 1.25 6 4.8 4.8 6 1.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function Trust() {
  return (
    <section id="trust" className="relative px-6 py-16 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-100 to-white"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <span className="mx-auto mb-5 block h-px w-16 bg-gradient-to-r from-transparent via-gold-600 to-transparent" aria-hidden="true" />
          <span className="text-overline text-gold-700">Trust</span>
        </div>
        <h2 className="mx-auto max-w-3xl text-center font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
          Auditability built into the work product.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-5">
          {trustSignals.map((signal) => (
            <button
              key={signal.label}
              type="button"
              className="group relative min-h-[104px] rounded-xl border border-cream-300/70 bg-white/80 p-4 text-left shadow-sm shadow-navy-900/[0.03] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-600/30 hover:shadow-md hover:shadow-gold-600/10 focus-visible:ring-2 focus-visible:ring-diplomatic-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50"
            >
              <span className="flex items-start gap-2">
                <GoldGlyph />
                <span>
                  <span className="block text-sm font-semibold leading-snug text-navy-900">
                    {signal.label}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-navy-500">
                    {signal.sub}
                  </span>
                </span>
              </span>

              <span className="pointer-events-none absolute left-3 right-3 top-[calc(100%+8px)] z-20 rounded-lg border border-diplomatic-blue/15 bg-navy-950 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-xl shadow-navy-950/15 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 lg:left-1/2 lg:right-auto lg:w-56 lg:-translate-x-1/2">
                {signal.detail}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
