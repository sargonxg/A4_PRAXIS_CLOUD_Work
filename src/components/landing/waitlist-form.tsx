"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

type FormState = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      setFormState("error");
      return;
    }

    setFormState("loading");
    setErrorMessage("");

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }

      setFormState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setFormState("error");
    }
  }

  return (
    <section id="waitlist" className="relative overflow-hidden px-6 py-28 lg:py-36">
      {/* Warm gradient background */}
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
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-700">
              Limited Early Access — Now Open
            </span>
          </div>

          <h2 className="mb-6 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Help Shape the Future of Diplomatic Intelligence
          </h2>
          <p className="mb-10 text-lg text-navy-500">
            PRAXIS is in early access. We&apos;re gathering feedback from
            practitioners in peace, security, and diplomacy to build the tool
            you actually need.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {formState === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-4 rounded-2xl border border-sage/20 bg-sage/5 px-8 py-10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/10">
                  <CheckCircle className="h-7 w-7 text-sage" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-navy-900">
                    You&apos;re on the list.
                  </p>
                  <p className="mt-1 text-sm text-navy-500">
                    We&apos;ll be in touch within 48 hours.
                  </p>
                </div>
                <a
                  href="/login"
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-diplomatic-blue/20 px-6 py-2.5 text-sm font-semibold text-diplomatic-blue transition-all duration-200 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                >
                  Explore the Demo Now
                </a>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Email form */}
                <form
                  onSubmit={handleSubmit}
                  className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
                  noValidate
                >
                  <label htmlFor="waitlist-email" className="sr-only">
                    Email address
                  </label>
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
                    <input
                      id="waitlist-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formState === "error") setFormState("idle");
                      }}
                      placeholder="your@organization.org"
                      required
                      className="h-12 w-full rounded-md border border-cream-300 bg-white/90 pl-10 pr-4 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/40 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gold-600 px-6 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-500 hover:shadow-lg hover:shadow-gold-600/20 active:bg-gold-700 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                  >
                    {formState === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining…
                      </>
                    ) : (
                      "Join Waitlist"
                    )}
                  </button>
                </form>

                {/* Error message */}
                <AnimatePresence>
                  {formState === "error" && errorMessage && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-crimson"
                    >
                      {errorMessage}
                    </motion.p>
                  )}
                </AnimatePresence>

                <p className="text-xs text-navy-400">
                  No spam. No account required to explore the demo.
                </p>

                {/* Secondary CTA */}
                <a
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-diplomatic-blue/20 px-8 py-3.5 text-sm font-semibold text-diplomatic-blue transition-all duration-200 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                >
                  Explore the Demo First
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
