'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { safeNum } from '@/lib/utils/safe-number';

interface DataPoint {
  date: string | Date;
  value: number;
}

interface Series {
  label: string;
  data: DataPoint[];
  color?: string;
}

interface TimeSeriesChartProps {
  series: Series[];
  title?: string;
  yLabel?: string;
  height?: number;
  showArea?: boolean;
}

const DEFAULT_COLORS = ['#10B981', '#E8B931', '#3B82F6', '#F97316', '#8B5CF6'];
const PAD = { top: 24, right: 20, bottom: 40, left: 52 };
const TICK_COUNT = 5;

function toMs(d: string | Date): number {
  return typeof d === 'string' ? new Date(d).getTime() : d.getTime();
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildPath(points: [number, number][], plotW: number, plotH: number): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M ${x} ${y}`;
  }
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cpx = +((x0 + x1) / 2).toFixed(1);
    d += ` C ${cpx} ${y0.toFixed(1)} ${cpx} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  void plotW;
  void plotH;
  return d;
}

export function TimeSeriesChart({
  series,
  title,
  yLabel,
  height = 260,
  showArea = false,
}: TimeSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [crosshairX, setCrosshairX] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  // Flatten all dates and values
  const allMs = series.flatMap((s) => s.data.map((d) => toMs(d.date)));
  const allVals = series.flatMap((s) => s.data.map((d) => d.value));
  // safeNum guards against Math.min/max on empty arrays returning ±Infinity
  const minMs = safeNum(Math.min(...allMs));
  const maxMs = safeNum(Math.max(...allMs));
  const minVal = safeNum(Math.min(...allVals));
  const maxVal = safeNum(Math.max(...allVals));
  const msRange = maxMs - minMs || 1;
  const valRange = maxVal - minVal || 1;

  function scaleX(ms: number) {
    return +(PAD.left + ((ms - minMs) / msRange) * plotW).toFixed(1);
  }
  function scaleY(v: number) {
    return +(PAD.top + (1 - (v - minVal) / valRange) * plotH).toFixed(1);
  }

  // Y-axis ticks
  const yTicks = Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
    minVal + (i / TICK_COUNT) * valRange
  );

  // X-axis ticks (up to 6); divisor guard prevents NaN when xTickCount=1
  const xTickCount = Math.min(6, allMs.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) =>
    minMs + safeNum(i / Math.max(xTickCount - 1, 1)) * msRange
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x >= PAD.left && x <= PAD.left + plotW) {
        setCrosshairX(x);
      } else {
        setCrosshairX(null);
      }
    },
    [plotW]
  );

  // Find values at crosshair
  const crosshairValues = crosshairX !== null
    ? series.map((s, si) => {
        const msAtX = minMs + ((crosshairX - PAD.left) / plotW) * msRange;
        // nearest point
        let nearest: DataPoint | null = null;
        let minDist = Infinity;
        for (const pt of s.data) {
          const dist = Math.abs(toMs(pt.date) - msAtX);
          if (dist < minDist) { minDist = dist; nearest = pt; }
        }
        return { label: s.label, value: nearest?.value, color: s.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length] };
      })
    : [];

  return (
    <div ref={containerRef} className="w-full">
      {title ? (
        <div className="text-slate-300 text-sm font-medium mb-1 px-1">{title}</div>
      ) : null}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCrosshairX(null)}
      >
        {/* Y grid lines */}
        {yTicks.map((v, i) => {
          const y = scaleY(v);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + plotW}
                y2={y}
                stroke="#1E293B"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#64748B"
                fontSize="9"
                fontFamily="Inter, sans-serif"
              >
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Y axis label */}
        {yLabel ? (
          <text
            x={12}
            y={PAD.top + plotH / 2}
            textAnchor="middle"
            fill="#64748B"
            fontSize="9"
            fontFamily="Inter, sans-serif"
            transform={`rotate(-90, 12, ${PAD.top + plotH / 2})`}
          >
            {yLabel}
          </text>
        ) : null}

        {/* X axis ticks */}
        {xTicks.map((ms, i) => (
          <text
            key={i}
            x={scaleX(ms)}
            y={PAD.top + plotH + 14}
            textAnchor="middle"
            fill="#64748B"
            fontSize="9"
            fontFamily="Inter, sans-serif"
          >
            {formatDate(ms)}
          </text>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#334155" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="#334155" strokeWidth="1" />

        {/* Series */}
        {series.map((s, si) => {
          const color = s.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length];
          const pts = s.data
            .slice()
            .sort((a, b) => toMs(a.date) - toMs(b.date))
            .map((pt): [number, number] => [scaleX(toMs(pt.date)), scaleY(pt.value)]);

          if (pts.length === 0) return null;

          const linePath = buildPath(pts, plotW, plotH);
          const areaPath = pts.length > 0
            ? linePath +
              ` L ${pts[pts.length - 1][0]} ${PAD.top + plotH}` +
              ` L ${pts[0][0]} ${PAD.top + plotH} Z`
            : '';

          return (
            <g key={si}>
              {showArea ? (
                <path d={areaPath} fill={color} opacity="0.15" />
              ) : null}
              <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            </g>
          );
        })}

        {/* Crosshair */}
        {crosshairX !== null ? (
          <line
            x1={crosshairX}
            y1={PAD.top}
            x2={crosshairX}
            y2={PAD.top + plotH}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        ) : null}

        {/* Crosshair tooltip */}
        {crosshairX !== null && crosshairValues.length > 0 ? (
          <g>
            <rect
              x={Math.min(crosshairX + 8, PAD.left + plotW - 80)}
              y={PAD.top + 4}
              width="76"
              height={crosshairValues.length * 16 + 8}
              rx="4"
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="1"
            />
            {crosshairValues.map((cv, i) => (
              <text
                key={i}
                x={Math.min(crosshairX + 14, PAD.left + plotW - 74)}
                y={PAD.top + 14 + i * 16}
                fill={cv.color}
                fontSize="9"
                fontFamily="Inter, sans-serif"
              >
                {cv.label}: {cv.value?.toFixed(1) ?? '—'}
              </text>
            ))}
          </g>
        ) : null}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-1 px-1">
        {series.map((s, si) => (
          <div key={si} className="flex items-center gap-1.5">
            <div
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                background: s.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length],
              }}
            />
            <span className="text-slate-400 text-xs">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
