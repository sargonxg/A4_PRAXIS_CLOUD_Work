"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Mail, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tiers = [
  {
    name: "Analyst",
    icon: Zap,
    description: "Essential intelligence for independent researchers and students",
    price: "Free",
    period: "",
    note: "25 TACITUS Credits/month",
    features: [
      "AI Assistant with 18 conflict analysis tools",
      "25 TACITUS Credits monthly",
      "1 active case + Nordalia demo data",
      "Google Search research",
      "Gemini Flash AI model",
      "Conflict Grammar analysis (ACO v2.0)",
      "Basic export (Markdown, JSON)",
      "Community support",
    ],
    cta: "Start Free",
    href: "/login",
    highlighted: false,
  },
  {
    name: "Diplomat",
    icon: Sparkles,
    description: "Full-spectrum intelligence for professional analysts and diplomats",
    price: "$29",
    period: "/month",
    note: "$290/year (save $58)",
    features: [
      "Everything in Analyst",
      "500 TACITUS Credits monthly",
      "Up to 10 active cases",
      "Firecrawl + Google Deep Research + Parallel.ai",
      "Gemini Pro + Claude Sonnet models",
      "Dossier generator, briefing builder, mediation AI",
      "Risk monitor, treaty analyzer, negotiation prep",
      "Full export (PDF, DOCX, PPTX)",
      "Calendar integrations (UN, AU, EU, OSCE)",
      "AI customization (model, temperature, prompts)",
      "Email support (48h response)",
    ],
    cta: "Start 14-Day Trial",
    href: "/login",
    highlighted: true,
  },
  {
    name: "Ambassador",
    icon: Crown,
    description: "Mission-critical intelligence for teams and organizations",
    price: "$99",
    period: "/month",
    note: "$990/year (save $198)",
    features: [
      "Everything in Diplomat",
      "Unlimited TACITUS Credits",
      "Unlimited cases and reports",
      "Up to 25 team members",
      "ARGUS + CONCORDIA live connections",
      "Vertex AI (enterprise SLA, data residency)",
      "API access for automation",
      "Custom intelligence feeds + calendar APIs",
      "SSO/SAML authentication",
      "Custom branding + white-label",
      "Dedicated account manager",
      "Priority support (4h response)",
    ],
    cta: "Contact Sales",
    href: "mailto:hello@tacitus.me?subject=PRAXIS%20Ambassador%20Plan",
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
            Intelligence at Every Level
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            From individual researchers to organization-wide deployments.
            Start free, upgrade when your mission demands it.
          </p>
        </motion.div>

        {/* Credit explanation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-5 py-2 text-xs text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            TACITUS Credits power all AI operations — 1 credit = 1 chat, 2-5 credits = research/analysis/reports
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            return (
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

                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-100">
                  <Icon className="h-5 w-5 text-diplomatic-blue" />
                </div>

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
                  href={tier.href}
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
            );
          })}
        </div>

        {/* Research providers section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-14 rounded-2xl border border-cream-300/60 bg-white/70 p-8"
        >
          <h3 className="mb-2 text-center font-serif text-xl text-navy-900">
            Choose Your Research Intelligence
          </h3>
          <p className="mb-6 text-center text-sm text-navy-500">
            PRAXIS connects to multiple AI research providers — you choose which to activate based on your needs and budget.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Google Search', cost: '2 credits/query', desc: 'Built-in search grounding', tier: 'All plans' },
              { name: 'Firecrawl', cost: '3 credits/query', desc: 'Deep web crawling + full-page extraction', tier: 'Diplomat+' },
              { name: 'Google Deep Research', cost: '5 credits/query', desc: 'Multi-step autonomous research', tier: 'Diplomat+' },
              { name: 'Parallel.ai', cost: '4 credits/query', desc: 'Parallel AI agents for comprehensive coverage', tier: 'Diplomat+' },
            ].map((p) => (
              <div key={p.name} className="rounded-lg border border-cream-300/60 bg-cream-50/80 p-4">
                <p className="text-sm font-semibold text-navy-900">{p.name}</p>
                <p className="mt-1 text-xs text-navy-500">{p.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{p.cost}</span>
                  <span className="text-[10px] text-navy-400">{p.tier}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 rounded-2xl border border-cream-300/60 bg-cream-50/80 p-8 text-center"
        >
          <Mail className="mx-auto mb-3 h-6 w-6 text-diplomatic-blue/50" />
          <h3 className="mb-2 font-serif text-xl text-navy-900">
            Deploying for Your Organization?
          </h3>
          <p className="mb-4 text-sm text-navy-500 max-w-xl mx-auto">
            We work with UN agencies, foreign ministries, and think tanks to deploy PRAXIS at scale.
            Custom integrations, data residency, and dedicated support included.
          </p>
          <a
            href="mailto:hello@tacitus.me?subject=PRAXIS%20Enterprise%20Inquiry"
            className="inline-flex items-center gap-2 rounded-md bg-diplomatic-blue px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-diplomatic-blue/90"
          >
            <Mail className="h-4 w-4" />
            hello@tacitus.me
          </a>
        </motion.div>
      </div>
    </section>
  );
}
