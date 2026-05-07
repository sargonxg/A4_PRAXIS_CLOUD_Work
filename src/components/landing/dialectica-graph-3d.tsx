"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ACO_COLORS, getACOColor } from "@/lib/constants/aco-colors";

const ENTITY_TYPES = Object.keys(ACO_COLORS);
const NODE_COUNT = 72;
const EDGE_COUNT = 132;
const TOAST = "Asserted 2026-04-30 · Valid 2025-08-12 → present";
const roundCoord = (value: number) => Number(value.toFixed(3));
const ACTIVE_PATH = [11, 24, 37, 50, 63];

function makeGraph() {
  const nodes = Array.from({ length: NODE_COUNT }, (_, index) => {
    const ring = index % 5;
    const angle = index * 2.399963 + ring * 0.38;
    const radius = 64 + ring * 28 + ((index * 17) % 19);
    const z = ((index * 37) % 90) - 45;

    return {
      id: index,
      x: roundCoord(250 + Math.cos(angle) * radius + ((index % 3) - 1) * 16),
      y: roundCoord(200 + Math.sin(angle) * radius * 0.76 + ((index % 4) - 1.5) * 10),
      z,
      type: ENTITY_TYPES[index % ENTITY_TYPES.length],
      r: 3.6 + (index % 4) * 0.8,
    };
  });

  const edges = Array.from({ length: EDGE_COUNT }, (_, index) => {
    const source = nodes[(index * 7 + 3) % NODE_COUNT];
    const hop = 5 + (index % 17);
    const target = nodes[(source.id + hop) % NODE_COUNT];

    return { id: index, source, target };
  });

  return { nodes, edges };
}

export function DialecticaGraph3D({ narrativeMotion }: { narrativeMotion: boolean }) {
  const shouldReduceMotion = !narrativeMotion;
  const { nodes, edges } = useMemo(() => makeGraph(), []);
  const [activeNode, setActiveNode] = useState(11);
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      setActiveNode((current) => (current + 13) % NODE_COUNT);
      setToastKey((current) => current + 1);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div
      data-testid="dialectica-graph-3d"
      className="relative min-h-[540px] overflow-hidden rounded-3xl border border-white/10 bg-navy-950 p-4 shadow-2xl shadow-navy-950/25 lg:min-h-[660px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(76,201,240,0.18),transparent_34%),radial-gradient(circle_at_68%_62%,rgba(232,185,49,0.12),transparent_33%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gold-300/25 to-transparent" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-diplomatic-blue/22 to-transparent" />
      <div className="absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100/80">
        Situation graph
      </div>
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
        Cypher grounded
      </div>

      <motion.div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: 1100,
        }}
      >
        <motion.div
          className="relative h-[470px] w-[620px] max-w-[130vw] lg:h-[590px] lg:w-[820px]"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(25deg) rotateZ(-9deg)",
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  rotateZ: [-9, -3, -9],
                  rotateX: [25, 30, 25],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="h-full w-full overflow-visible" viewBox="0 0 500 400">
            <defs>
              <filter id="dialectica-node-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="dialectica-core" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#E8B931" stopOpacity="0.18" />
                <stop offset="70%" stopColor="#4B92DB" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#050A18" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="dialectica-active-edge" x1="0" x2="1">
                <stop offset="0%" stopColor="#E8B931" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#E8B931" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#4B92DB" stopOpacity="0.2" />
              </linearGradient>
              <filter id="dialectica-packet-glow" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <motion.ellipse
              cx="250"
              cy="200"
              rx="210"
              ry="112"
              fill="url(#dialectica-core)"
              initial={false}
              animate={shouldReduceMotion ? undefined : { opacity: [0.42, 0.78, 0.42], scale: [0.96, 1.03, 0.96] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "250px 200px" }}
            />
            {[0, 1, 2].map((ring) => (
              <motion.ellipse
                key={ring}
                cx="250"
                cy="200"
                rx={142 + ring * 42}
                ry={68 + ring * 23}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="0.7"
                strokeOpacity={0.16 - ring * 0.025}
                strokeDasharray={`${6 + ring * 3} ${10 + ring * 3}`}
                initial={false}
                animate={shouldReduceMotion ? undefined : { rotate: ring % 2 ? -360 : 360 }}
                transition={{ duration: 34 + ring * 8, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "250px 200px" }}
              />
            ))}

            {edges.map((edge) => {
              const stroke = getACOColor(edge.source.type);
              const lift = (edge.source.z + edge.target.z) / 18;
              const x1 = roundCoord(edge.source.x + lift);
              const y1 = roundCoord(edge.source.y - lift);
              const x2 = roundCoord(edge.target.x + lift);
              const y2 = roundCoord(edge.target.y - lift);

              return (
                <motion.line
                  key={edge.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeOpacity={edge.id % 5 === 0 ? 0.34 : 0.17}
                  strokeWidth={edge.id % 7 === 0 ? 1.35 : 0.82}
                  initial={false}
                  animate={shouldReduceMotion ? undefined : { opacity: [0.45, 0.9, 0.45] }}
                  transition={{ duration: 5 + (edge.id % 4), repeat: Infinity, ease: "easeInOut" }}
                />
              );
            })}

            {ACTIVE_PATH.slice(0, -1).map((sourceId, index) => {
              const source = nodes[sourceId];
              const target = nodes[ACTIVE_PATH[index + 1]];
              const lift = (source.z + target.z) / 18;
              const x1 = roundCoord(source.x + lift);
              const y1 = roundCoord(source.y - lift);
              const x2 = roundCoord(target.x + lift);
              const y2 = roundCoord(target.y - lift);

              return (
                <motion.line
                  key={`${sourceId}-${target.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#dialectica-active-edge)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={
                    shouldReduceMotion
                      ? { opacity: 0.65, pathLength: 1 }
                      : { pathLength: [0, 1, 1], opacity: [0, 1, 0.15] }
                  }
                  transition={{ duration: 3.2, repeat: shouldReduceMotion ? 0 : Infinity, ease: "easeInOut", delay: index * 0.55 }}
                />
              );
            })}

            {!shouldReduceMotion &&
              ACTIVE_PATH.slice(0, -1).map((sourceId, index) => {
                const source = nodes[sourceId];
                const target = nodes[ACTIVE_PATH[index + 1]];
                const lift = (source.z + target.z) / 18;
                const x1 = roundCoord(source.x + lift);
                const y1 = roundCoord(source.y - lift);
                const x2 = roundCoord(target.x + lift);
                const y2 = roundCoord(target.y - lift);

                return (
                  <motion.circle
                    key={`${sourceId}-${target.id}-packet`}
                    r={index === 1 ? 4.8 : 3.6}
                    fill={index === 1 ? "#E8B931" : "#7DD3FC"}
                    filter="url(#dialectica-packet-glow)"
                    initial={{ cx: x1, cy: y1, opacity: 0 }}
                    animate={{
                      cx: [x1, x2],
                      cy: [y1, y2],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.55,
                    }}
                  />
                );
              })}

            {nodes.map((node) => {
              const active = node.id === activeNode;
              const inPath = ACTIVE_PATH.includes(node.id);
              const color = getACOColor(node.type);
              const lift = node.z / 8;
              const x = roundCoord(node.x + lift);
              const y = roundCoord(node.y - lift);

              return (
                <g key={node.id} transform={`translate(${x} ${y})`}>
                  {active || inPath ? (
                    <motion.circle
                      r={node.r + (active ? 10 : 6)}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      initial={shouldReduceMotion ? false : { opacity: 0.8, scale: 0.55 }}
                      animate={
                        shouldReduceMotion
                          ? { opacity: 0.35, scale: 1 }
                          : { opacity: [0.75, 0], scale: [0.55, 1.7] }
                      }
                      transition={{ duration: 1.4, repeat: shouldReduceMotion ? 0 : Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                  <motion.circle
                    r={active ? node.r + 2.2 : inPath ? node.r + 1.25 : node.r + 0.35}
                    fill={color}
                    fillOpacity={0.9}
                    stroke={color}
                    strokeOpacity={0.95}
                    strokeWidth="1"
                    filter={active || inPath ? "url(#dialectica-node-glow)" : undefined}
                    animate={(active || inPath) && !shouldReduceMotion ? { scale: [1, 1.45, 1] } : undefined}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </g>
              );
            })}
          </svg>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={toastKey}
          className="absolute bottom-5 left-5 right-5 z-10 rounded-xl border border-white/10 bg-navy-900/92 px-4 py-3 text-xs font-medium text-blue-50 shadow-lg backdrop-blur sm:left-auto sm:right-5 sm:max-w-[520px]"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
        >
          {TOAST}
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-24 left-5 right-5 z-10 grid grid-cols-3 gap-1.5 sm:hidden">
        {[
          ["Nodes", NODE_COUNT.toString()],
          ["Edges", EDGE_COUNT.toString()],
          ["Path", `${ACTIVE_PATH.length - 1} hops`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/10 px-2 py-1.5 text-center text-blue-50 backdrop-blur">
            <span className="block text-[7px] font-semibold uppercase tracking-[0.18em] text-blue-100/50">
              {label}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] font-bold leading-none text-blue-50">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-20 left-5 z-10 hidden gap-1.5 sm:grid">
        {[
          ["world-time", "2025-08-12"],
          ["system-time", "2026-04-30"],
          ["MATCH depth", "3 hops"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] text-blue-50/85 backdrop-blur">
            <span className="font-mono uppercase tracking-[0.15em] text-blue-100/45">{label}</span>
            <span className="ml-2 font-semibold text-blue-50">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
