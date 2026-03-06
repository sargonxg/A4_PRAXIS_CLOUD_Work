"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tiers = [
  {
    name: "Analyst",
    description: "For individual practitioners and researchers",
    price: "$70",
    period: "/month",
    note: "billed annually",
    features: [
      "Core intelligence tools",
      "5 reports per month",
      "1 AI advisor",
      "Calendar monitoring",
      "Basic document vault (1 GB)",
      "Email support",
    ],
    cta: "Join the Waiting List",
    highlighted: false,
  },
  {
    name: "Team",
    description: "For small missions, offices, and research teams",
    price: "$290",
    period: "/month",
    note: "up to 5 seats, billed annually",
    features: [
      "Everything in Analyst",
      "Unlimited reports",
      "All 8 AI advisors",
      "Collaboration & shared vault (25 GB)",
      "5 team seats included",
      "Custom report templates",
      "Stakeholder mapper",
      "Priority support",
    ],
    cta: "Join the Waiting List",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For organizations and multi-mission deployments",
    price: "Custom",
    period: "",
    note: "contact us for a quote",
    features: [
      "Everything in Team",
      "Unlimited seats",
      "SSO / SAML authentication",
      "Custom AI advisors",
      "API access",
      "On-premises deployment option",
      "Dedicated success manager",
      "SLA guarantee",
      "Audit logging & compliance",
    ],
    cta: "Contact Us",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Pricing</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 text-center"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Built for Teams of Every Size
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            From individual analysts to organization-wide deployments.
            All plans include our core security and encryption features.
          </p>
        </motion.div>

        {/* Demo notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-600/20 bg-gold-600/5 px-5 py-2 text-xs text-gold-700">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
            PRAXIS is currently in demo mode — pricing is indicative and subject to change.
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={cn(
                "relative rounded-2xl border p-8 transition-all duration-300",
                tier.highlighted
                  ? "border-gold-600/30 bg-white shadow-lg shadow-gold-600/5 scale-[1.02] lg:scale-105"
                  : "border-cream-300/60 bg-white/70"
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-semibold text-navy-900">{tier.name}</h3>
              <p className="mt-2 text-sm text-navy-500">{tier.description}</p>

              <div className="mt-6 mb-1">
                <span className="text-3xl font-semibold text-navy-900">{tier.price}</span>
                {tier.period && (
                  <span className="ml-1 text-sm text-navy-400">{tier.period}</span>
                )}
              </div>
              <p className="mb-8 text-xs text-navy-400">{tier.note}</p>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-navy-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="mailto:hello@tacitus.me"
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200",
                  tier.highlighted
                    ? "bg-gold-600 text-white hover:bg-gold-500 hover:shadow-lg"
                    : "border border-diplomatic-blue/20 text-diplomatic-blue hover:bg-diplomatic-blue/5"
                )}
              >
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          ))}
        </div>

        {/* Mailing list CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-14 rounded-2xl border border-cream-300/60 bg-cream-50/80 p-8 text-center"
        >
          <Mail className="mx-auto mb-3 h-6 w-6 text-diplomatic-blue/50" />
          <h3 className="mb-2 font-serif text-xl text-navy-900">
            Get Notified When We&apos;re Ready for Free Trials
          </h3>
          <p className="mb-1 text-sm text-navy-500">
            Send us an email to join our mailing list and be first in line.
          </p>
          <a
            href="mailto:hello@tacitus.me?subject=PRAXIS%20Mailing%20List"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-diplomatic-blue px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-diplomatic-blue/90"
          >
            <Mail className="h-4 w-4" />
            hello@tacitus.me
          </a>
        </motion.div>
      </div>
    </section>
  );
}
