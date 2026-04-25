"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PRICING_TIERS } from "@/lib/constants/pricing";

export function PricingTeaser() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section id="pricing" className="relative px-6 py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cream-50/60 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Pricing</span>
        </motion.div>

        <motion.h2
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-4 text-center font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl"
        >
          Monthly Plans for Serious Policy Work
        </motion.h2>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-14 max-w-2xl text-center text-lg text-navy-500"
        >
          PRAXIS is packaged around live situations, grounded research, graph intelligence,
          and team workflows — not a confusing tool-by-tool tariff.
        </motion.p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : i * 0.08 }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all",
                tier.highlighted
                  ? "border-gold-500/50 bg-gradient-to-b from-gold-500/5 to-white ring-1 ring-gold-500/20 shadow-lg shadow-gold-500/10"
                  : "border-cream-300/70 bg-white/70 hover:border-diplomatic-blue/20 hover:shadow-sm"
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                  Most Popular
                </div>
              )}

              <h3 className="text-base font-semibold text-navy-900">{tier.name}</h3>

              <div className="mt-2 min-h-[52px]">
                {tier.price === 0 ? (
                  <span className="text-3xl font-bold text-navy-900">Free</span>
                ) : tier.price === -1 ? (
                  <span className="text-3xl font-bold text-navy-900">Custom</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-navy-900">${tier.price}</span>
                    <span className="text-sm text-navy-500">/mo</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-navy-500">
                  {tier.usage}
                </p>
              </div>

              <ul className="mt-4 flex-1 space-y-2">
                {tier.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-navy-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" strokeWidth={2.5} />
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={
                  tier.id === "enterprise"
                    ? "mailto:hello@tacitus.me"
                    : tier.id === "free"
                    ? "/login?mode=demo"
                    : `/login?plan=${tier.id}`
                }
                className={cn(
                  "mt-5 block rounded-md px-4 py-2.5 text-center text-sm font-semibold transition-all",
                  tier.highlighted
                    ? "bg-gold-600 text-white hover:bg-gold-500 hover:shadow-lg hover:shadow-gold-600/20"
                    : tier.id === "enterprise"
                    ? "bg-navy-900 text-white hover:bg-navy-800"
                    : "border border-diplomatic-blue/20 text-diplomatic-blue hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                )}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex justify-center"
        >
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-diplomatic-blue transition-colors hover:text-navy-900"
          >
            See monthly plans and access model
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
