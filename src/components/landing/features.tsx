import {
  Brain,
  Network,
  Shield,
  Globe,
  Sparkles,
  GaugeCircle,
} from 'lucide-react';

const FEATURE_BLOCKS = [
  {
    icon: Brain,
    eyebrow: 'Calibrated AI',
    title: 'Every output reflects your mandate',
    body:
      'Tools read your AnalystProfile — role, perspective, lenses, red lines, audience — and prepend a structured <analyst-profile> block to every model call. Switch from a UN mediator lens to an OSINT analyst lens without rewriting a single prompt.',
  },
  {
    icon: Network,
    eyebrow: 'Conflict ontology',
    title: '14-entity, 72-relationship graph',
    body:
      'PRAXIS reasons in the language of conflict: actors, claims, interests, constraints, leverage, commitments, events, narratives — typed, color-coded, citable. Built on Fisher/Ury, Glasl, Stedman, Galtung, and INFORM Risk.',
  },
  {
    icon: Globe,
    eyebrow: 'Open-license substrate',
    title: 'Cite-able sources, no licensing traps',
    body:
      'GDELT, UCDP GED, UNHCR, ReliefWeb, HDX, World Bank, UN News — all open license, all redistributable. Vertex Deep Research and grounded Google Search for the long tail. No ACLED EULA, no Firecrawl bill.',
  },
  {
    icon: GaugeCircle,
    eyebrow: 'Operational spine',
    title: 'You always know what is happening',
    body:
      'Background work, AI runs, and ingestions are surfaced as live, semaphore-coded activity: green for done, yellow for working, purple for AI reasoning, red for needs-attention. No more silent jobs.',
  },
  {
    icon: Shield,
    eyebrow: 'Provenance, not hallucination',
    title: 'Every claim links back to a source',
    body:
      'Tool outputs carry the model used, the prompt version, the profile version, and the citations. Reports export with footnotes. Auditable by design.',
  },
  {
    icon: Sparkles,
    eyebrow: 'Multi-agent foundation',
    title: 'Built for the team you do not have yet',
    body:
      'Deep Research Agent, Conflict Graph Agent, Briefing Agent, Sanctions Agent — each with its own session, memory, and credit budget. PRAXIS coordinates; you decide.',
  },
] as const;

export function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-white py-24 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-navy-50/60 via-transparent to-transparent"
      />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            Why PRAXIS
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-navy-900 sm:text-5xl">
            A workspace built for the way conflict actually behaves
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            PRAXIS is not a chatbot with a UN-flavoured system prompt. It is a calibrated
            operating system for the analyst, mediator, or policy advisor who has to
            translate live, contradictory, multi-actor situations into something a
            principal can act on.
          </p>
        </div>

        <ul className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-navy-100/60 ring-1 ring-navy-100 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_BLOCKS.map(({ icon: Icon, eyebrow, title, body }) => (
            <li
              key={title}
              className="group relative flex flex-col gap-3 bg-white p-7 transition-colors hover:bg-navy-50/40"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {eyebrow}
                </p>
              </div>
              <h3 className="font-serif text-xl font-semibold leading-snug text-navy-900">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600">{body}</p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-zinc-500">
          Powered by Gemini 3.1 Pro on Vertex AI · Firebase · Cloud Run · BigQuery ·
          Pub/Sub · Eventarc
        </p>
      </div>
    </section>
  );
}

export default Features;
