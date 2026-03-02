"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Cta() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section
      id="cta"
      className="relative overflow-hidden px-6 py-28 lg:py-36"
      style={{
        background:
          "linear-gradient(to bottom, #050A18 0%, #0B1120 40%, #0B1120 100%)",
      }}
    >
      {/* Subtle radial accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: "800px",
          height: "400px",
          background:
            "radial-gradient(ellipse at center, rgba(232,185,49,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="mb-6 font-serif text-3xl text-navy-50 sm:text-4xl lg:text-5xl">
            Ready to Transform Your Conflict Analysis?
          </h2>
          <p className="mb-10 text-lg text-navy-400">
            Join select organizations gaining an analytical edge with
            AI-powered diplomatic intelligence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your institutional email"
                className={cn(
                  "flex-1 rounded-md border border-navy-700/60 bg-navy-800/60 px-4 py-3 text-sm text-navy-100 placeholder:text-navy-500",
                  "outline-none transition-all duration-200",
                  "focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20"
                )}
              />
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 transition-all duration-200 hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20"
              >
                Request Access
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 rounded-lg border border-sage/30 bg-sage/10 px-6 py-4"
            >
              <CheckCircle2 className="h-5 w-5 text-sage" />
              <span className="text-sm font-medium text-navy-200">
                Thank you! We&apos;ll be in touch shortly.
              </span>
            </motion.div>
          )}

          {/* Beta notice */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <Lock className="h-3 w-3 text-navy-600" />
            <p className="text-xs text-navy-500">
              Currently in private beta for select organizations
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
