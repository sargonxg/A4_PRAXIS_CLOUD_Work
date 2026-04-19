"use client";

import { motion, useReducedMotion } from "framer-motion";
import { UserCircle, Network, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserCircle,
    title: "Profile",
    description:
      "Tell PRAXIS your mandate, analytical lenses, and red lines in 3 minutes. Your preferences calibrate every tool, every output.",
    accentColor: "#4B92DB",
    accentBg: "bg-diplomatic-blue/8",
    accentText: "text-diplomatic-blue",
    accentBorder: "border-diplomatic-blue/15",
  },
  {
    step: "02",
    icon: Network,
    title: "Situation",
    description:
      "Create a situation with your sources — URLs, documents, field reports. PRAXIS builds the conflict graph and actor landscape in seconds.",
    accentColor: "#C8961E",
    accentBg: "bg-gold-600/8",
    accentText: "text-gold-700",
    accentBorder: "border-gold-600/15",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Intelligence",
    description:
      "40+ tools calibrate to your role and situation. Produce briefings, dossiers, risk scores, and game-theory analyses in your voice.",
    accentColor: "#59A14F",
    accentBg: "bg-sage/8",
    accentText: "text-sage",
    accentBorder: "border-sage/20",
  },
];

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="how-it-works"
      className="relative px-6 py-24 lg:py-32 overflow-hidden"
    >
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cream-100/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">How It Works</span>
        </motion.div>

        <motion.h2
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-4 text-center font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl"
        >
          From Sources to Intelligence in Minutes
        </motion.h2>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center text-lg text-navy-500"
        >
          Three steps. One workspace. Every output calibrated to your mandate.
        </motion.p>

        {/* Steps */}
        <div className="relative grid gap-8 sm:grid-cols-3">
          {/* Connector lines — desktop only */}
          <div
            className="pointer-events-none absolute top-[60px] left-[calc(16.66%+32px)] right-[calc(16.66%+32px)] hidden h-px sm:block"
            style={{
              background:
                "linear-gradient(to right, transparent, #1B3A5C22 20%, #1B3A5C22 80%, transparent)",
            }}
            aria-hidden="true"
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step number badge */}
                <div className="mb-5 flex h-[72px] w-[72px] flex-col items-center justify-center">
                  <div
                    className={`relative flex h-full w-full items-center justify-center rounded-2xl border ${step.accentBorder} ${step.accentBg} shadow-sm`}
                  >
                    <Icon
                      className={`h-7 w-7 ${step.accentText}`}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {/* Step number */}
                    <span
                      className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: step.accentColor }}
                    >
                      {step.step}
                    </span>
                  </div>
                </div>

                <h3
                  className={`mb-3 text-xl font-semibold tracking-tight ${step.accentText}`}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-navy-500">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
