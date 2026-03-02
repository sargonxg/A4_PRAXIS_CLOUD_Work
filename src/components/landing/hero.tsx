"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// --- Animated network background ---

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

function NetworkBackground() {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const [, forceRender] = useState(0);

  const nodeColors = useMemo(
    () => ["#E8B931", "#4A90A4", "#3D5A80", "#7B6D8D", "#5B8C5A", "#C75B39"],
    []
  );

  useEffect(() => {
    const nodeCount = 24;
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.015,
        vy: (Math.random() - 0.5) * 0.015,
        radius: Math.random() * 1.5 + 1,
        color: nodeColors[i % nodeColors.length],
      });
    }
    nodesRef.current = nodes;

    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime > 50) {
        lastTime = time;
        for (const node of nodesRef.current) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0 || node.x > 100) node.vx *= -1;
          if (node.y < 0 || node.y > 100) node.vy *= -1;

          node.x = Math.max(0, Math.min(100, node.x));
          node.y = Math.max(0, Math.min(100, node.y));
        }
        forceRender((n) => n + 1);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [nodeColors]);

  const nodes = nodesRef.current;

  // Compute edges between nearby nodes
  const edges: { from: Node; to: Node; dist: number }[] = [];
  const connectionDist = 28;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < connectionDist) {
        edges.push({ from: nodes[i], to: nodes[j], dist });
      }
    }
  }

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Edges */}
      {edges.map(({ from, to, dist }, i) => (
        <line
          key={`e-${i}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={from.color}
          strokeOpacity={0.08 * (1 - dist / connectionDist)}
          strokeWidth={0.15}
        />
      ))}
      {/* Nodes */}
      {nodes.map((node) => (
        <circle
          key={`n-${node.id}`}
          cx={node.x}
          cy={node.y}
          r={node.radius * 0.3}
          fill={node.color}
          opacity={0.25}
        />
      ))}
    </svg>
  );
}

// --- Word-by-word reveal ---

const headlineWords = [
  "The",
  "Operating",
  "System",
  "for",
  "High-Stakes",
  "Disputes",
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
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

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy-950 px-6">
      {/* Network background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>

      {/* Radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, transparent 0%, #050A18 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-10 inline-flex items-center gap-2 rounded-full border border-navy-700/50 bg-navy-900/60 px-4 py-2 backdrop-blur-sm"
        >
          <Shield className="h-3.5 w-3.5 text-gold-500" />
          <span className="text-xs font-medium tracking-wide text-navy-300">
            Built by former UN political officers
          </span>
        </motion.div>

        {/* Animated headline */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 font-serif text-5xl leading-[1.1] font-normal tracking-tight text-navy-50 sm:text-6xl lg:text-7xl"
        >
          {headlineWords.map((word, i) => (
            <motion.span
              key={i}
              variants={wordVariants}
              className={cn(
                "mr-[0.3em] inline-block",
                (word === "High-Stakes" || word === "Disputes") &&
                  "text-gold-500"
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
          className="mb-12 max-w-2xl text-lg leading-relaxed text-navy-300 sm:text-xl"
        >
          Transform unstructured conflict data into actionable intelligence.
          Purpose-built for peace, security, and diplomatic professionals.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <a
            href="#cta"
            className="group inline-flex items-center justify-center rounded-md bg-gold-500 px-8 py-3.5 text-sm font-semibold text-navy-950 transition-all duration-200 hover:bg-gold-400 hover:shadow-xl hover:shadow-gold-500/20"
          >
            Request Access
            <span className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">
              &rarr;
            </span>
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-gold-500/30 px-8 py-3.5 text-sm font-semibold text-gold-500 transition-all duration-200 hover:border-gold-500/60 hover:bg-gold-500/5 hover:shadow-lg hover:shadow-gold-500/10"
          >
            Explore Platform
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <a
          href="#features"
          className="flex flex-col items-center gap-2 text-navy-500 transition-colors hover:text-navy-300"
          aria-label="Scroll down"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
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
