"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function AnimatedStat({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      const progress = Math.min(elapsed / 1500, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, end]);

  return (
    <div ref={ref} className="text-4xl font-semibold text-diplomatic-blue tabular-nums sm:text-5xl">
      {count}{suffix}
    </div>
  );
}

const chaosTools = [
  { label: "Chrome", detail: "47 tabs", color: "#EA4335" },
  { label: "Email", detail: "3 chains", color: "#4B92DB" },
  { label: "Word", color: "#2B579A" },
  { label: "PDF", color: "#FF0000" },
  { label: "Excel", color: "#217346" },
  { label: "Slack", color: "#4A154B" },
  { label: "WhatsApp", color: "#25D366" },
  { label: "SharePoint", color: "#038387" },
  { label: "Telegram", color: "#26A5E4" },
  { label: "UN eDocs", color: "#009EDB" },
  { label: "Reuters", color: "#FF8000" },
  { label: "Twitter/X", color: "#000000" },
];

const praxisCards = [
  {
    title: "AI Brief",
    subtitle: "Sahel Security Update",
    badge: "Ready",
    badgeColor: "text-sage bg-sage/10 border-sage/20",
    preview: "3 active fronts · 12 sources · UN-formatted",
  },
  {
    title: "Risk Score",
    subtitle: "Northern Mali",
    badge: "High",
    badgeColor: "text-crimson bg-crimson/10 border-crimson/20",
    preview: "Escalation probability: 74%",
  },
  {
    title: "Active Conflicts",
    subtitle: "Monitored Situations",
    badge: "12 live",
    badgeColor: "text-diplomatic-blue bg-diplomatic-blue/10 border-diplomatic-blue/20",
    preview: "Mali · Sudan · DRC · Myanmar +8",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="relative px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">The Challenge</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 text-center font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl"
        >
          Your Team Drowns in Information but Starves for Intelligence
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center text-lg text-navy-500"
        >
          Peace and security professionals face an impossible workflow — too many
          sources, too many formats, not enough time.
        </motion.p>

        {/* Split-screen comparison */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT — Today */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-crimson/15 bg-gradient-to-br from-crimson/5 via-white/60 to-white/40 p-8"
          >
            {/* Label */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-crimson/20 bg-crimson/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson" />
              <span className="text-xs font-semibold uppercase tracking-wider text-crimson">
                Today
              </span>
            </div>

            {/* Time + message */}
            <div className="mb-6">
              <p className="font-mono text-base font-semibold text-navy-900">
                8:47 AM — Security Council briefing in 73 minutes.
              </p>
              <p className="mt-1.5 text-sm text-navy-500">
                Your intelligence is buried in 12 different tools.
              </p>
            </div>

            {/* Tool chaos grid */}
            <div className="grid grid-cols-4 gap-2.5">
              {chaosTools.map((tool, i) => (
                <motion.div
                  key={tool.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-navy-100/60 bg-white/70 px-2 py-2.5 shadow-sm"
                >
                  <div
                    className="h-5 w-5 rounded-sm"
                    style={{ backgroundColor: tool.color, opacity: 0.85 }}
                  />
                  <span className="text-center text-[9px] font-medium leading-tight text-navy-600">
                    {tool.label}
                  </span>
                  {tool.detail && (
                    <span className="text-[8px] text-crimson/70">{tool.detail}</span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Chaos indicator */}
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-crimson/15 bg-crimson/5 px-3 py-2">
              <span className="text-xs text-crimson">
                73% of time spent formatting, not analyzing
              </span>
            </div>
          </motion.div>

          {/* RIGHT — With PRAXIS */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-sage/20 bg-gradient-to-br from-sage/5 via-white/60 to-white/40 p-8"
          >
            {/* Label */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sage/25 bg-sage/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sage">
                With PRAXIS
              </span>
            </div>

            {/* Time + message */}
            <div className="mb-6">
              <p className="font-mono text-base font-semibold text-navy-900">
                8:47 AM — Your briefing is ready.
              </p>
              <p className="mt-1.5 text-sm text-navy-500">
                AI-generated. Graph-sourced. UN-formatted.{" "}
                <span className="font-medium text-navy-700">You review. You decide.</span>
              </p>
            </div>

            {/* Mini dashboard cards */}
            <div className="space-y-3">
              {praxisCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3 rounded-xl border border-navy-100/60 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-navy-800 truncate">
                        {card.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${card.badgeColor}`}
                      >
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-navy-600">{card.subtitle}</p>
                    <p className="text-[10px] text-navy-400 mt-0.5">{card.preview}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Efficiency indicator */}
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-sage/20 bg-sage/5 px-3 py-2">
              <span className="text-xs text-sage">
                Briefing ready in minutes, not hours
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bold tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <p className="font-serif text-2xl font-medium text-navy-900 sm:text-3xl">
            PRAXIS doesn&apos;t replace analysts.{" "}
            <span className="text-diplomatic-blue">It gives analysts superpowers.</span>
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {[
            { end: 73, suffix: "%", description: "of conflict analysts spend more time formatting than analyzing" },
            { end: 14, suffix: "+", description: "disconnected tools where critical intelligence gets buried" },
            { end: 6, suffix: "hrs", description: "average time to draft a diplomatic cable from scratch" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="text-center"
            >
              <AnimatedStat end={stat.end} suffix={stat.suffix} />
              <p className="mt-4 text-sm leading-relaxed text-navy-500">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transition line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 flex items-center justify-center gap-4"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream-300 to-transparent" />
          <span className="flex items-center gap-2 text-sm font-medium text-gold-700">
            There&apos;s a better way &rarr;
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream-300 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
