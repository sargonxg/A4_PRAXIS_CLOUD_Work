"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { DialecticaFirewallDemo } from "./dialectica-firewall-demo";
import { DialecticaGraph3D } from "./dialectica-graph-3d";
import { DialecticaTrustScore } from "./dialectica-trust-score";
import { useNarrativeMotion } from "./landing-motion-context";

const BULLETS = [
  "Bi-temporal: every node carries world-time and system-time.",
  "Ontology-bound: 14 ACO entity types, 72 typed relationships.",
  "Causal: typed CAUSES, ENABLES, PREVENTS, TRIGGERS edges.",
  "Vector co-located: hybrid Cypher returns semantic + structural in one round trip.",
];

export function Dialectica() {
  const narrativeMotion = useNarrativeMotion();

  return (
    <section id="dialectica" className="relative overflow-hidden bg-cream-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent_24%,rgba(26,35,50,0.05))]" />
      <div className="relative mx-auto max-w-[1520px]">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={narrativeMotion ? { opacity: 0, y: 24 } : { opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <span className="mx-auto mb-5 block h-px w-16 bg-gradient-to-r from-transparent via-gold-600 to-transparent" aria-hidden="true" />
          <p className="text-overline text-gold-700">The moat</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-navy-950 sm:text-4xl lg:text-5xl">
            DIALECTICA — the symbolic backbone of policy AI
          </h2>
          <p className="mt-5 text-base leading-7 text-navy-600 sm:text-lg">
            PRAXIS does not let Gemini make claims the graph does not support.
            Every claim is verified by a Cypher MATCH against your situation
            graph. Grounded claims show their path. Inferred claims demand a
            source receipt. Unsupported claims never reach the user.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.45fr)] lg:items-stretch xl:grid-cols-[minmax(0,1.68fr)_minmax(360px,0.42fr)]">
          <motion.div
            initial={narrativeMotion ? { opacity: 0, x: -24 } : { opacity: 1, x: 0 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <DialecticaGraph3D narrativeMotion={narrativeMotion} />
          </motion.div>

          <div className="grid content-stretch gap-6">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.05 }}
            >
              <DialecticaFirewallDemo narrativeMotion={narrativeMotion} />
            </motion.div>
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.12 }}
            >
              <DialecticaTrustScore narrativeMotion={narrativeMotion} />
            </motion.div>
          </div>
        </div>

        <motion.div
          className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {BULLETS.map((bullet) => (
            <div key={bullet} className="rounded-lg border border-navy-100 bg-white/75 p-4">
              <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-600" aria-hidden="true" />
              <p className="text-sm leading-6 text-navy-700">{bullet}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
