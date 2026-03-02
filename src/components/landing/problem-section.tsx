"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Layers, FileWarning, ArrowRight } from "lucide-react";

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

const problems = [
  {
    icon: Clock,
    stat: 73,
    suffix: "%",
    description: "of conflict analysts spend more time formatting than analyzing",
  },
  {
    icon: Layers,
    stat: 14,
    suffix: "+",
    description: "disconnected tools where critical intelligence gets buried",
  },
  {
    icon: FileWarning,
    stat: 6,
    suffix: "hrs",
    description: "average time to draft a diplomatic cable from scratch",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="relative px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
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

        <div className="grid gap-8 sm:grid-cols-3">
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-diplomatic-blue/5 text-diplomatic-blue">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <AnimatedStat end={problem.stat} suffix={problem.suffix} />
                <p className="mt-4 text-sm leading-relaxed text-navy-500">
                  {problem.description}
                </p>
              </motion.div>
            );
          })}
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
            There&apos;s a better way
            <ArrowRight className="h-4 w-4" />
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream-300 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
