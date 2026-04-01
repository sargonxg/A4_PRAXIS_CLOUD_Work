"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, Shield, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function IntelligenceCounter({ end }: { end: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, end]);

  return (
    <span ref={ref} className="font-semibold tabular-nums text-diplomatic-blue">
      {count}
    </span>
  );
}

// --- Word-by-word reveal ---

const headlineWords = [
  "Your",
  "Analysts",
  "Write",
  "Reports.",
  "Your",
  "AI",
  "Should",
  "Write",
  "Intelligence.",
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// --- Social proof logos (abstract/silhouette representations) ---
const institutions = [
  "United Nations",
  "OSCE",
  "African Union",
  "ICG",
  "Chatham House",
  "EU External Action",
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24">
      {/* Background mesh gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(232,185,49,0.06) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(75,146,219,0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(27,58,92,0.03) 0%, transparent 50%)",
        }}
      />

      {/* Subtle dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1B3A5C 0.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-10 inline-flex items-center gap-2 rounded-full border border-diplomatic-blue/10 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm"
        >
          <Shield className="h-3.5 w-3.5 text-gold-600" />
          <span className="text-xs font-medium tracking-wide text-navy-700">
            Built by practitioners with careers in multilateral and bilateral diplomacy
          </span>
        </motion.div>

        {/* Animated headline */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 font-serif text-5xl leading-[1.08] font-normal tracking-tight text-navy-950 sm:text-6xl lg:text-[72px]"
        >
          {headlineWords.map((word, i) => (
            <motion.span
              key={i}
              variants={wordVariants}
              className={cn(
                "mr-[0.25em] inline-block",
                word === "Intelligence." && "text-gold-600"
              )}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="mb-12 max-w-2xl text-lg leading-relaxed text-navy-500 sm:text-xl"
        >
          The intelligence platform for conflict professionals. AI-powered
          analysis grounded in ACLED, GDELT, and UN data — designed for
          diplomats, analysts, and mediators who need decisions, not summaries.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href="/demo/dashboard"
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-gold-600 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-500 hover:shadow-xl hover:shadow-gold-600/20"
          >
            <Play className="h-4 w-4" />
            Explore Demo
          </Link>
          <Link
            href="/login"
            className="group inline-flex items-center justify-center rounded-md border border-diplomatic-blue/20 px-8 py-3.5 text-sm font-semibold text-diplomatic-blue transition-all duration-200 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
          >
            Get Started Free
            <span className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">
              &rarr;
            </span>
          </Link>
        </motion.div>

        {/* Animated counter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.6 }}
          className="mt-8 flex items-center gap-3"
        >
          <div className="flex -space-x-1.5">
            {["#4B92DB", "#C8961E", "#A63D40", "#5B8C5A"].map((color, i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full border-2 border-white/80"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-sm text-navy-500">
            <IntelligenceCounter end={47} /> intelligence products generated this week
          </span>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mt-16"
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-navy-400">
            Initial feedback from professionals at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {institutions.map((name) => (
              <span
                key={name}
                className="text-xs font-semibold uppercase tracking-wider text-navy-300/60"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Demo notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.7 }}
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-gold-600/20 bg-gold-600/5 px-5 py-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
          <span className="text-xs font-medium text-gold-700">
            Early Demo — exploring how we can serve practitioners like you
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.8 }}
        className="relative z-10 mt-12 mb-8"
      >
        <a
          href="#problem"
          className="flex flex-col items-center gap-2 text-navy-400 transition-colors hover:text-navy-600"
          aria-label="Scroll down"
        >
          <span className="text-overline text-navy-400">
            Discover
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </a>
      </motion.div>
    </section>
  );
}
