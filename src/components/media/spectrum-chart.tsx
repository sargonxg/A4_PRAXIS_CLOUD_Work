"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaSource } from "./source-card";

// ── Chart Constants ──────────────────────────────────────────────
const PADDING = { top: 40, right: 40, bottom: 50, left: 60 };
const VIEWBOX_W = 900;
const VIEWBOX_H = 600;
const PLOT_W = VIEWBOX_W - PADDING.left - PADDING.right;
const PLOT_H = VIEWBOX_H - PADDING.top - PADDING.bottom;

// Data domain
const X_MIN = -1;
const X_MAX = 1;
const Y_MIN = 0;
const Y_MAX = 1;

// Grid increments
const GRID_STEP_X = 0.25;
const GRID_STEP_Y = 0.25;

// ── Helpers ──────────────────────────────────────────────────────
function dataToPixelX(val: number): number {
  return PADDING.left + ((val - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function dataToPixelY(val: number): number {
  // Y is inverted in SVG: higher reliability = higher up = lower pixel y
  return PADDING.top + (1 - (val - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

// Quadrant labels positioned at quadrant centers
const QUADRANT_LABELS = [
  { text: "Left-Leaning / High Reliability", x: -0.5, y: 0.75 },
  { text: "Right-Leaning / High Reliability", x: 0.5, y: 0.75 },
  { text: "Left-Leaning / Low Reliability", x: -0.5, y: 0.25 },
  { text: "Right-Leaning / Low Reliability", x: 0.5, y: 0.25 },
];

// ── Types ────────────────────────────────────────────────────────
interface SpectrumChartProps {
  sources: MediaSource[];
  selectedSource: MediaSource | null;
  onSelectSource: (source: MediaSource | null) => void;
  className?: string;
}

// ── Component ────────────────────────────────────────────────────
export function SpectrumChart({
  sources,
  selectedSource,
  onSelectSource,
  className,
}: SpectrumChartProps) {
  const [hoveredSource, setHoveredSource] = useState<MediaSource | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay so framer-motion staggers look clean
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  // ── Grid Lines ─────────────────────────────────────────────────
  const xGridLines: number[] = [];
  for (let v = X_MIN; v <= X_MAX; v += GRID_STEP_X) {
    xGridLines.push(Math.round(v * 100) / 100);
  }
  const yGridLines: number[] = [];
  for (let v = Y_MIN; v <= Y_MAX; v += GRID_STEP_Y) {
    yGridLines.push(Math.round(v * 100) / 100);
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="h-full w-full"
        onMouseMove={handleMouseMove}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glow filter for selected/hovered dots */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Subtle radial gradient for background — light theme */}
          <radialGradient id="plotBg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#F8FAFC" stopOpacity="1" />
            <stop offset="100%" stopColor="#F1F5F9" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Plot background */}
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="url(#plotBg)"
          rx={4}
        />

        {/* Grid lines - vertical */}
        {xGridLines.map((val) => {
          const px = dataToPixelX(val);
          const isCenterLine = Math.abs(val) < 0.001;
          return (
            <line
              key={`gx-${val}`}
              x1={px}
              y1={PADDING.top}
              x2={px}
              y2={PADDING.top + PLOT_H}
              stroke={isCenterLine ? "#94A3B8" : "#CBD5E1"}
              strokeWidth={isCenterLine ? 1.5 : 0.5}
              strokeDasharray={isCenterLine ? undefined : "4 4"}
            />
          );
        })}

        {/* Grid lines - horizontal */}
        {yGridLines.map((val) => {
          const py = dataToPixelY(val);
          const isMidLine = Math.abs(val - 0.5) < 0.001;
          return (
            <line
              key={`gy-${val}`}
              x1={PADDING.left}
              y1={py}
              x2={PADDING.left + PLOT_W}
              y2={py}
              stroke={isMidLine ? "#94A3B8" : "#CBD5E1"}
              strokeWidth={isMidLine ? 1.5 : 0.5}
              strokeDasharray={isMidLine ? undefined : "4 4"}
            />
          );
        })}

        {/* Quadrant labels */}
        {QUADRANT_LABELS.map((q) => (
          <text
            key={q.text}
            x={dataToPixelX(q.x)}
            y={dataToPixelY(q.y)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#CBD5E1"
            fontSize={11}
            fontWeight={600}
            fontFamily="var(--font-sans), system-ui, sans-serif"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {q.text}
          </text>
        ))}

        {/* X axis labels */}
        <text
          x={PADDING.left + 10}
          y={PADDING.top + PLOT_H + 35}
          fill="#64748B"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          &larr; Left
        </text>
        <text
          x={dataToPixelX(0)}
          y={PADDING.top + PLOT_H + 35}
          textAnchor="middle"
          fill="#64748B"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          Center
        </text>
        <text
          x={PADDING.left + PLOT_W - 10}
          y={PADDING.top + PLOT_H + 35}
          textAnchor="end"
          fill="#64748B"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          Right &rarr;
        </text>

        {/* Y axis labels */}
        <text
          x={PADDING.left - 12}
          y={PADDING.top + 5}
          textAnchor="end"
          fill="#64748B"
          fontSize={10}
          fontWeight={600}
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          High
        </text>
        <text
          x={PADDING.left - 12}
          y={dataToPixelY(0.5)}
          textAnchor="end"
          dominantBaseline="middle"
          fill="#475569"
          fontSize={10}
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          0.50
        </text>
        <text
          x={PADDING.left - 12}
          y={PADDING.top + PLOT_H}
          textAnchor="end"
          fill="#64748B"
          fontSize={10}
          fontWeight={600}
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          Low
        </text>

        {/* Y axis title (rotated) */}
        <text
          x={16}
          y={PADDING.top + PLOT_H / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748B"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font-sans), system-ui, sans-serif"
          transform={`rotate(-90, 16, ${PADDING.top + PLOT_H / 2})`}
        >
          Reliability
        </text>

        {/* X axis title */}
        <text
          x={PADDING.left + PLOT_W / 2}
          y={VIEWBOX_H - 4}
          textAnchor="middle"
          fill="#64748B"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          Political Orientation
        </text>

        {/* Y axis tick marks */}
        {yGridLines.map((val) => (
          <text
            key={`yt-${val}`}
            x={PADDING.left - 12}
            y={dataToPixelY(val)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="#475569"
            fontSize={9}
            fontFamily="var(--font-mono), monospace"
          >
            {val === 0 || val === 0.5 || val === 1 ? "" : val.toFixed(2)}
          </text>
        ))}

        {/* Border for plot area */}
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth={1}
          rx={4}
        />

        {/* ── Data Points ──────────────────────────────────────── */}
        {sources.map((source, i) => {
          const cx = dataToPixelX(source.x);
          const cy = dataToPixelY(source.y);
          const isSelected = selectedSource?.name === source.name;
          const isHovered = hoveredSource?.name === source.name;
          const isActive = isSelected || isHovered;
          const radius = isActive ? 8 : 5;

          return (
            <g key={source.name}>
              {/* Animated entrance */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={source.color}
                fillOpacity={isActive ? 1 : 0.85}
                stroke={isSelected ? "#E8B931" : isHovered ? "#475569" : "transparent"}
                strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0}
                filter={isActive ? "url(#glow)" : undefined}
                style={{ cursor: "pointer" }}
                initial={isReady ? false : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.025,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                onMouseEnter={() => setHoveredSource(source)}
                onMouseLeave={() => setHoveredSource(null)}
                onClick={() =>
                  onSelectSource(isSelected ? null : source)
                }
              />
              {/* Label (always visible, positioned above dot) */}
              <motion.text
                x={cx}
                y={cy - (isActive ? 13 : 9)}
                textAnchor="middle"
                fill={isActive ? "#0F172A" : "#475569"}
                fontSize={isActive ? 10 : 8}
                fontWeight={isActive ? 600 : 400}
                fontFamily="var(--font-sans), system-ui, sans-serif"
                style={{ userSelect: "none", pointerEvents: "none" }}
                initial={isReady ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: i * 0.025 + 0.2,
                  duration: 0.3,
                }}
              >
                {source.name}
              </motion.text>
            </g>
          );
        })}
      </svg>

      {/* ── Tooltip ──────────────────────────────────────────── */}
      <AnimatePresence>
        {hoveredSource && !selectedSource && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-20 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 shadow-xl backdrop-blur-md"
            style={{
              left: tooltipPos.x + 16,
              top: tooltipPos.y - 10,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: hoveredSource.color }}
              />
              <span className="text-sm font-semibold text-navy-900">
                {hoveredSource.name}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-navy-500">
              <span>Orientation</span>
              <span className="text-navy-700">
                {hoveredSource.x > 0.1
                  ? "Right"
                  : hoveredSource.x < -0.1
                    ? "Left"
                    : "Center"}
                {" "}({hoveredSource.x > 0 ? "+" : ""}
                {hoveredSource.x.toFixed(2)})
              </span>
              <span>Reliability</span>
              <span className="text-navy-700">
                {Math.round(hoveredSource.y * 100)}%
              </span>
              <span>Type</span>
              <span className="text-navy-700 capitalize">
                {hoveredSource.type.replace("_", " ")}
              </span>
              <span>Region</span>
              <span className="text-navy-700">{hoveredSource.region}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
