"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

export function Cta() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden px-6 py-28 lg:py-36"
    >
      {/* Subtle warm gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream-100 via-cream-200/50 to-cream-100" />

      <div className="relative mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-600/20 bg-gold-600/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-700">
              Early Access — Now Open
            </span>
          </div>

          <h2 className="mb-6 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Start Building Smarter Diplomatic Intelligence
          </h2>
          <p className="mb-10 text-lg text-navy-500">
            Sign in for the focused ten-tool workspace, or explore the live
            demo with specialist labs instantly — no account needed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Primary CTA — single entry point */}
          <a
            href="/login"
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-gold-600 px-10 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-gold-500 hover:shadow-xl hover:shadow-gold-600/20 active:scale-[0.98]"
          >
            Access PRAXIS
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>

          <p className="text-xs text-navy-400">
            Sign in for full access · or try the demo — no account needed
          </p>

          {/* Secondary: contact */}
          <a
            href="mailto:hello@tacitus.me?subject=PRAXIS%20Inquiry"
            className="inline-flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-600 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Questions? hello@tacitus.me
          </a>
        </motion.div>
      </div>
    </section>
  );
}
