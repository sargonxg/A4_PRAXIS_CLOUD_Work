"use client";

import { motion } from "framer-motion";
import { Mail, MessageSquare } from "lucide-react";

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
          {/* Demo badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-600/20 bg-gold-600/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-700">
              Demo Mode — Collecting Initial Feedback
            </span>
          </div>

          <h2 className="mb-6 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Help Shape the Future of Diplomatic Intelligence
          </h2>
          <p className="mb-10 text-lg text-navy-500">
            PRAXIS is in early demo mode. We&apos;re gathering feedback from
            practitioners in peace, security, and diplomacy to build the tool
            you actually need.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Primary CTA */}
          <a
            href="mailto:hello@tacitus.me?subject=PRAXIS%20Feedback"
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-gold-600 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-500 hover:shadow-xl hover:shadow-gold-600/20"
          >
            <Mail className="h-4 w-4" />
            Send Feedback — hello@tacitus.me
          </a>

          {/* Demo access */}
          <a
            href="/dashboard"
            className="group inline-flex items-center justify-center gap-2 rounded-md border border-diplomatic-blue/20 px-8 py-3.5 text-sm font-semibold text-diplomatic-blue transition-all duration-200 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
          >
            <MessageSquare className="h-4 w-4" />
            Explore the Demo
          </a>

          <p className="mt-2 text-xs text-navy-400">
            No account needed to explore. All data in the demo is illustrative.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
