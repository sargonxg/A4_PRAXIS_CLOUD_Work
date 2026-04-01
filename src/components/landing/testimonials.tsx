"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "PRAXIS cut our reporting cycle from 3 days to 4 hours. The Advisory Council feature alone transformed how we brief senior leadership.",
    role: "Senior Political Affairs Officer",
    org: "UN Peacekeeping Mission",
  },
  {
    quote: "The Conflict Grammar framework finally gave our team a common analytical language. We no longer argue about definitions — we argue about solutions.",
    role: "Head of Analysis",
    org: "Regional Think Tank",
  },
  {
    quote: "I can now brief the Ambassador with AI-sourced intelligence that\u2019s actually credible. The source tracking is what sets PRAXIS apart.",
    role: "First Secretary",
    org: "Permanent Mission to the United Nations",
  },
];

export function Testimonials() {
  return (
    <section className="relative px-6 py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Practitioner Testing</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-4 text-center"
        >
          <h2 className="font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Tested With Professionals in the Field
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-4 text-center"
        >
          <p className="mx-auto max-w-2xl text-sm text-navy-600">
            PRAXIS is currently being piloted with practitioners from UN agencies, Chatham House,
            leading diplomatic think tanks, and permanent missions to international organisations.
          </p>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 text-center"
        >
          <p className="mx-auto max-w-xl text-xs text-navy-400 italic">
            Feedback is from individual practitioners testing the platform in a personal capacity.
            Names and identifying details are withheld for confidentiality. Quotes do not constitute
            an endorsement by, or on behalf of, any institution or organisation.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-xl border border-cream-300/60 bg-white/80 p-7"
            >
              <Quote className="mb-4 h-6 w-6 text-gold-600/40" />
              <p className="mb-6 text-sm leading-relaxed text-navy-700 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="border-t border-cream-300/60 pt-4">
                <p className="text-sm font-semibold text-navy-900">
                  {testimonial.role}
                </p>
                <p className="text-xs text-navy-500">
                  {testimonial.org}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
