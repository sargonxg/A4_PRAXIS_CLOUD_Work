"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface Primitive {
  id: string;
  label: string;
  color: string;
  description: string;
  example: string;
  connections: string[];
}

const primitives: Primitive[] = [
  {
    id: "actor",
    label: "Actor",
    color: "#E8B931",
    description:
      "Any individual, group, state, or institution involved in or affecting a dispute.",
    example:
      'e.g., "The African Union mediation team led by Former President Obasanjo"',
    connections: ["claim", "narrative", "leverage", "commitment"],
  },
  {
    id: "claim",
    label: "Claim",
    color: "#C75B39",
    description:
      "A stated demand, grievance, or position held by an actor within the conflict.",
    example:
      'e.g., "Sovereignty over the disputed Abyei region"',
    connections: ["actor", "interest", "event"],
  },
  {
    id: "interest",
    label: "Interest",
    color: "#4A90A4",
    description:
      "The underlying need, motivation, or strategic goal behind a claim.",
    example:
      'e.g., "Access to oil-rich territories and pastoral grazing routes"',
    connections: ["claim", "constraint", "leverage"],
  },
  {
    id: "constraint",
    label: "Constraint",
    color: "#7B6D8D",
    description:
      "Legal, political, resource, or structural limitations on actors and actions.",
    example:
      'e.g., "UN Security Council arms embargo under Resolution 1556"',
    connections: ["interest", "leverage", "commitment"],
  },
  {
    id: "leverage",
    label: "Leverage",
    color: "#5B8C5A",
    description:
      "Sources of power, influence, or pressure that actors can exercise.",
    example:
      'e.g., "Control of border crossings and humanitarian supply routes"',
    connections: ["actor", "interest", "constraint"],
  },
  {
    id: "commitment",
    label: "Commitment",
    color: "#D4A373",
    description:
      "Formal or informal agreements, promises, and obligations between parties.",
    example:
      'e.g., "The 2015 Agreement on the Resolution of the Conflict in South Sudan"',
    connections: ["actor", "constraint", "event"],
  },
  {
    id: "event",
    label: "Event",
    color: "#A63D40",
    description:
      "Discrete incidents, turning points, or escalation/de-escalation moments.",
    example:
      'e.g., "The July 2016 clashes between government forces and opposition in Juba"',
    connections: ["claim", "commitment", "narrative"],
  },
  {
    id: "narrative",
    label: "Narrative",
    color: "#3D5A80",
    description:
      "Dominant stories, framings, and discourses that shape how the conflict is understood.",
    example:
      'e.g., "The ethnic conflict framing vs. the political economy framing"',
    connections: ["actor", "event"],
  },
];

// Compute positions around a circle
function getNodePositions(count: number, radius: number, cx: number, cy: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}

// --- SVG Radial Graph (desktop) ---

function RadialGraph({
  hoveredId,
  onHover,
  onLeave,
}: {
  hoveredId: string | null;
  onHover: (id: string) => void;
  onLeave: () => void;
}) {
  const cx = 250;
  const cy = 250;
  const radius = 170;
  const nodeRadius = 32;

  const positions = useMemo(
    () => getNodePositions(primitives.length, radius, cx, cy),
    []
  );

  // Build unique edges
  const edges = useMemo(() => {
    const set = new Set<string>();
    const result: { from: number; to: number }[] = [];
    primitives.forEach((p, i) => {
      p.connections.forEach((connId) => {
        const j = primitives.findIndex((pp) => pp.id === connId);
        if (j >= 0) {
          const key = [Math.min(i, j), Math.max(i, j)].join("-");
          if (!set.has(key)) {
            set.add(key);
            result.push({ from: i, to: j });
          }
        }
      });
    });
    return result;
  }, []);

  const hoveredPrimitive = primitives.find((p) => p.id === hoveredId);
  const hoveredConnections = hoveredPrimitive?.connections ?? [];

  return (
    <svg
      viewBox="0 0 500 500"
      className="mx-auto h-full w-full max-w-[500px]"
      aria-label="Conflict Grammar radial visualization"
    >
      <defs>
        {primitives.map((p) => (
          <radialGradient key={`grad-${p.id}`} id={`grad-${p.id}`}>
            <stop offset="0%" stopColor={p.color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={p.color} stopOpacity="0.05" />
          </radialGradient>
        ))}
      </defs>

      {/* Edges */}
      {edges.map(({ from, to }, i) => {
        const isHighlighted =
          hoveredId !== null &&
          (primitives[from].id === hoveredId ||
            primitives[to].id === hoveredId);
        const isDimmed = hoveredId !== null && !isHighlighted;
        return (
          <line
            key={`edge-${i}`}
            x1={positions[from].x}
            y1={positions[from].y}
            x2={positions[to].x}
            y2={positions[to].y}
            stroke={
              isHighlighted
                ? primitives[from].id === hoveredId
                  ? primitives[from].color
                  : primitives[to].color
                : "#334155"
            }
            strokeWidth={isHighlighted ? 2 : 1}
            strokeOpacity={isDimmed ? 0.15 : isHighlighted ? 0.7 : 0.25}
            style={{ transition: "all 0.3s ease" }}
          />
        );
      })}

      {/* Nodes */}
      {primitives.map((p, i) => {
        const pos = positions[i];
        const isHovered = hoveredId === p.id;
        const isConnected = hoveredConnections.includes(p.id);
        const isDimmed =
          hoveredId !== null && !isHovered && !isConnected;
        const scale = isHovered ? 1.15 : 1;
        const opacity = isDimmed ? 0.3 : 1;

        return (
          <g
            key={p.id}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              transformOrigin: `${pos.x}px ${pos.y}px`,
              transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              opacity,
              cursor: "pointer",
            }}
            onMouseEnter={() => onHover(p.id)}
            onMouseLeave={onLeave}
          >
            {/* Glow ring */}
            <circle
              cx={0}
              cy={0}
              r={nodeRadius + 6}
              fill="none"
              stroke={p.color}
              strokeWidth={isHovered ? 2 : 0}
              strokeOpacity={0.4}
              style={{ transition: "all 0.3s ease" }}
            />
            {/* Outer circle */}
            <circle
              cx={0}
              cy={0}
              r={nodeRadius}
              fill={`url(#grad-${p.id})`}
              stroke={p.color}
              strokeWidth={isHovered ? 2 : 1}
              strokeOpacity={isHovered ? 0.9 : 0.5}
              style={{ transition: "all 0.3s ease" }}
            />
            {/* Inner dot */}
            <circle
              cx={0}
              cy={0}
              r={4}
              fill={p.color}
              opacity={0.8}
            />
            {/* Label */}
            <text
              y={nodeRadius + 18}
              textAnchor="middle"
              fill={isHovered ? p.color : "#94A3B8"}
              fontSize="11"
              fontWeight={isHovered ? 600 : 500}
              fontFamily="var(--font-sans), sans-serif"
              style={{ transition: "all 0.3s ease" }}
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// --- Mobile Card List ---

function MobileCardList() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {primitives.map((p) => {
        const isExpanded = expandedId === p.id;
        return (
          <motion.button
            key={p.id}
            onClick={() => setExpandedId(isExpanded ? null : p.id)}
            className="w-full text-left"
            layout
          >
            <div
              className={cn(
                "rounded-lg border bg-navy-800/60 p-4 transition-all duration-300",
                isExpanded
                  ? "border-opacity-60"
                  : "border-navy-700/40"
              )}
              style={{
                borderColor: isExpanded ? p.color : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-sm font-semibold text-navy-100">
                  {p.label}
                </span>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 text-sm leading-relaxed text-navy-300">
                      {p.description}
                    </p>
                    <p
                      className="mt-2 text-xs italic"
                      style={{ color: p.color }}
                    >
                      {p.example}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// --- Main component ---

export function ConflictGrammarViz() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleHover = useCallback((id: string) => setHoveredId(id), []);
  const handleLeave = useCallback(() => setHoveredId(null), []);

  const hoveredPrimitive = primitives.find((p) => p.id === hoveredId);

  return (
    <section
      id="conflict-grammar"
      className="relative overflow-hidden bg-navy-950 px-6 py-28 lg:py-36"
    >
      {/* Background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #E8B931 0.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center lg:mb-20"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-500">
              Proprietary Framework
            </span>
          </div>
          <h2 className="mb-4 font-serif text-3xl text-navy-50 sm:text-4xl lg:text-5xl">
            Conflict Grammar&trade;
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-400">
            Eight universal primitives for analyzing any dispute. A structured
            ontology that transforms how you decompose, track, and resolve
            complex conflicts.
          </p>
        </motion.div>

        {/* Desktop: SVG viz + hover card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="hidden md:block"
        >
          <div className="relative mx-auto max-w-4xl">
            <div className="flex items-center gap-8 lg:gap-12">
              {/* SVG Graph */}
              <div className="flex-1">
                <RadialGraph
                  hoveredId={hoveredId}
                  onHover={handleHover}
                  onLeave={handleLeave}
                />
              </div>

              {/* Hover info card */}
              <div className="w-72 shrink-0 lg:w-80">
                <AnimatePresence mode="wait">
                  {hoveredPrimitive ? (
                    <motion.div
                      key={hoveredPrimitive.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-xl border bg-navy-800/80 p-6 backdrop-blur-sm"
                      style={{
                        borderColor: `${hoveredPrimitive.color}40`,
                        boxShadow: `0 0 40px ${hoveredPrimitive.color}10`,
                      }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className="h-3.5 w-3.5 rounded-full"
                          style={{
                            backgroundColor: hoveredPrimitive.color,
                            boxShadow: `0 0 12px ${hoveredPrimitive.color}60`,
                          }}
                        />
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: hoveredPrimitive.color }}
                        >
                          {hoveredPrimitive.label}
                        </h3>
                      </div>
                      <p className="mb-4 text-sm leading-relaxed text-navy-300">
                        {hoveredPrimitive.description}
                      </p>
                      <p
                        className="text-xs italic leading-relaxed"
                        style={{ color: `${hoveredPrimitive.color}CC` }}
                      >
                        {hoveredPrimitive.example}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-navy-700/30 bg-navy-800/30 p-6"
                    >
                      <p className="text-center text-sm text-navy-500">
                        Hover over a primitive to explore its role in conflict
                        analysis
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile: Card list */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="md:hidden"
        >
          <MobileCardList />
        </motion.div>
      </div>
    </section>
  );
}
