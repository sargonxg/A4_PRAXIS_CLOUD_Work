"use client";

import { motion } from "framer-motion";

const institutions = [
  { name: "Columbia SIPA", abbr: "SIPA" },
  { name: "Sciences Po", abbr: "Sciences Po" },
  { name: "United Nations", abbr: "United Nations" },
];

export function BuiltByPractitioners() {
  return (
    <section id="built-by-practitioners" className="relative overflow-hidden px-6 py-24 lg:py-32">
      {/* Subtle warm gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-950/[0.03] via-transparent to-diplomatic-blue/[0.02]" />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-6"
        >
          <span className="text-overline text-gold-700">Provenance</span>
        </motion.div>

        {/* Large serif headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-10 font-serif text-3xl font-normal leading-tight text-navy-900 sm:text-4xl lg:text-5xl"
        >
          Built by Practitioners,{" "}
          <span className="text-diplomatic-blue">For Practitioners</span>
        </motion.h2>

        {/* Quote card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mb-12 rounded-2xl border border-diplomatic-blue/10 bg-white/70 px-8 py-8 shadow-sm backdrop-blur-sm"
        >
          {/* Large opening quote mark */}
          <span
            className="pointer-events-none absolute -top-4 left-6 select-none font-serif text-7xl leading-none text-diplomatic-blue/15"
            aria-hidden="true"
          >
            &ldquo;
          </span>

          <p className="relative z-10 text-base leading-relaxed text-navy-700 sm:text-lg">
            Created by a former UN Political Affairs Officer with 8 years on the Syria
            desk and 600+ intelligence products authored. PRAXIS isn&apos;t built by
            engineers guessing what analysts need — it&apos;s built by an analyst who
            lived the workflow.
          </p>

          {/* Closing quote */}
          <span
            className="pointer-events-none absolute -bottom-6 right-6 select-none font-serif text-7xl leading-none text-diplomatic-blue/15"
            aria-hidden="true"
          >
            &rdquo;
          </span>
        </motion.div>

        {/* Institution logos (text-only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-navy-400">
            Academic & Professional Background
          </p>
          <div className="flex flex-wrap items-center justify-center gap-0">
            {institutions.map((inst, i) => (
              <span key={inst.name} className="flex items-center">
                <span className="text-sm font-semibold uppercase tracking-widest text-navy-400/70 transition-colors duration-200 hover:text-navy-600">
                  {inst.name}
                </span>
                {i < institutions.length - 1 && (
                  <span className="mx-4 text-navy-300">|</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Credential dots */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            "8 Years UN Syria Desk",
            "600+ Intelligence Products",
            "Multilateral Negotiation",
            "Field Experience",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-diplomatic-blue/15 bg-diplomatic-blue/5 px-3.5 py-1.5 text-xs font-medium text-diplomatic-blue"
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
