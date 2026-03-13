"use client";

import { motion } from "framer-motion";

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
          <span className="text-overline text-gold-700">Our Team</span>
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
            PRAXIS is built by people who have spent careers at the intersection
            of multilateral diplomacy, bilateral negotiations, and field-level
            peacemaking — practitioners who have lived the workflows this platform
            is designed to support.
          </p>

          {/* Closing quote */}
          <span
            className="pointer-events-none absolute -bottom-6 right-6 select-none font-serif text-7xl leading-none text-diplomatic-blue/15"
            aria-hidden="true"
          >
            &rdquo;
          </span>
        </motion.div>

        {/* Credential dots */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            "Multilateral Diplomacy",
            "Bilateral Negotiations",
            "Peace & Security",
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
