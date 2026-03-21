'use client';

import Link from 'next/link';

const PRODUCTS = [
  {
    name: 'PRAXIS',
    tagline: 'The Bloomberg Terminal for Conflict Resolution',
    description:
      'AI-native workspace for situation analysis, report drafting, and strategic intelligence',
    accent: 'rgb(234, 179, 8)', // gold-500
    href: '/login',
    internal: true,
  },
  {
    name: 'ARGUS',
    tagline: 'Graph-Augmented RAG Intelligence',
    description:
      'Knowledge graph-powered retrieval across conflict entities, documents, and cross-case patterns',
    accent: 'rgb(52, 211, 153)', // emerald-400
    href: 'https://argus.tacitus.me',
    internal: false,
  },
  {
    name: 'CONCORDIA',
    tagline: 'AI-Native Mediation Platform',
    description:
      'Voice-enabled mediation with Gemini Live, 14 frameworks, session planning, settlement generation',
    accent: 'rgb(167, 139, 250)', // violet-400
    href: 'https://concordia.tacitus.me',
    internal: false,
  },
  {
    name: 'WIND TUNNEL',
    tagline: 'Psychographic Scenario Simulation',
    description:
      '27-tribe CiviSphere model for conflict scenario impact analysis across population segments',
    accent: 'rgb(251, 191, 36)', // amber-400
    href: 'https://windtunnel.tacitus.me',
    internal: false,
  },
  {
    name: 'CONFLICT COMPASS',
    tagline: 'Structured Conflict Assessment',
    description:
      "Guided conflict analysis using the Agentic Conflict Ontology's 8-primitive framework",
    accent: 'rgb(96, 165, 250)', // blue-400
    href: 'https://conflictcompass.tacitus.me',
    internal: false,
  },
  {
    name: 'DIALECTICA',
    tagline: 'Ontology Backend Infrastructure',
    description:
      'The neurosymbolic engine: ACO v2.0, 41 classes, 29 typed properties, knowledge graph embeddings',
    accent: 'rgb(34, 211, 238)', // cyan-400
    href: null,
    internal: false,
  },
] as const;

const STATS = [
  { value: '847+', label: 'Entities Tracked' },
  { value: '12,400+', label: 'Relationships' },
  { value: '6', label: 'Products' },
  { value: '14', label: 'Mediation Frameworks' },
  { value: '8', label: 'ACO Primitives' },
];

export function EcosystemSection() {
  return (
    <section className="bg-navy-950 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Headline */}
        <h2 className="text-center font-serif text-4xl font-bold text-white lg:text-5xl">
          One Ontology. Six Products. Total Conflict Intelligence.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-navy-300">
          PRAXIS sits at the center of the TACITUS ecosystem, powered by the
          Agentic Conflict Ontology (ACO v2.0).
        </p>

        {/* Product Grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product) => (
            <div
              key={product.name}
              className="rounded-xl border border-navy-700/50 bg-navy-900/80 p-6"
              style={{ borderTopColor: product.accent, borderTopWidth: 2 }}
            >
              <h3 className="text-base font-bold text-white">{product.name}</h3>
              <p
                className="mt-1 text-xs font-medium"
                style={{ color: product.accent }}
              >
                {product.tagline}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy-300">
                {product.description}
              </p>
              <div className="mt-4">
                {product.href ? (
                  product.internal ? (
                    <Link
                      href={product.href}
                      className="text-sm font-medium transition-colors hover:underline"
                      style={{ color: product.accent }}
                    >
                      Learn More →
                    </Link>
                  ) : (
                    <a
                      href={product.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium transition-colors hover:underline"
                      style={{ color: product.accent }}
                    >
                      Learn More →
                    </a>
                  )
                ) : (
                  <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400">
                    Core Infrastructure
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-gold-500">{stat.value}</p>
              <p className="mt-1 text-sm text-navy-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
