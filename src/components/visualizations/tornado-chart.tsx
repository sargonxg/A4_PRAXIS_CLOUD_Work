'use client';

import React, { useMemo } from 'react';

interface TornadoItem {
  label: string;
  low: number;
  high: number;
  baseline?: number;
}

interface TornadoChartProps {
  items: TornadoItem[];
  title?: string;
  unit?: string;
}

const BAR_H = 24;
const BAR_GAP = 8;
const LABEL_W = 120;
const AXIS_W = 1;
const PADDING = { top: 36, bottom: 32, left: LABEL_W + 8, right: 24 };

export function TornadoChart({ items, title, unit = '' }: TornadoChartProps) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low)),
    [items]
  );

  const baseline = sorted[0]?.baseline ?? 0;

  const allValues = sorted.flatMap((it) => [it.low, it.high]);
  const minVal = Math.min(baseline, ...allValues);
  const maxVal = Math.max(baseline, ...allValues);
  const range = maxVal - minVal || 1;

  const chartH = sorted.length * (BAR_H + BAR_GAP) + PADDING.top + PADDING.bottom;
  const chartW = 480;
  const plotW = chartW - PADDING.left - PADDING.right - AXIS_W;

  function toX(v: number) {
    return +((v - minVal) / range * plotW).toFixed(2);
  }

  const baseX = toX(baseline);

  return (
    <div className="w-full overflow-x-auto">
      {title ? (
        <div className="text-slate-300 text-sm font-medium mb-2 px-1">{title}</div>
      ) : null}
      <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        {/* Title row axis labels */}
        <text
          x={PADDING.left + baseX}
          y={PADDING.top - 8}
          textAnchor="middle"
          fill="#64748B"
          fontSize="10"
          fontFamily="Inter, sans-serif"
        >
          Baseline{unit ? ` (${unit})` : ''}
        </text>

        {/* Bars */}
        {sorted.map((it, i) => {
          const y = PADDING.top + i * (BAR_H + BAR_GAP);
          const lx = toX(it.low);
          const hx = toX(it.high);
          const bx = baseX;

          // Low bar: from low to baseline (going left)
          const lowW = +(bx - lx).toFixed(2);
          const lowX = PADDING.left + lx;

          // High bar: from baseline to high (going right)
          const highW = +(hx - bx).toFixed(2);
          const highX = PADDING.left + bx;

          return (
            <g key={it.label}>
              {/* Label */}
              <text
                x={PADDING.left - 8}
                y={y + BAR_H / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#94A3B8"
                fontSize="11"
                fontFamily="Inter, sans-serif"
              >
                {it.label.length > 16 ? it.label.slice(0, 15) + '…' : it.label}
              </text>

              {/* Low bar (amber/red — negative side) */}
              {lowW > 0 ? (
                <rect
                  x={lowX}
                  y={y}
                  width={lowW}
                  height={BAR_H}
                  rx="2"
                  fill="#F59E0B"
                  opacity="0.85"
                />
              ) : null}

              {/* High bar (emerald — positive side) */}
              {highW > 0 ? (
                <rect
                  x={highX}
                  y={y}
                  width={highW}
                  height={BAR_H}
                  rx="2"
                  fill="#10B981"
                  opacity="0.85"
                />
              ) : null}

              {/* Value labels */}
              <text
                x={lowX - 3}
                y={y + BAR_H / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#F59E0B"
                fontSize="9"
                fontFamily="Inter, sans-serif"
              >
                {it.low.toFixed(1)}
              </text>
              <text
                x={highX + highW + 3}
                y={y + BAR_H / 2}
                textAnchor="start"
                dominantBaseline="middle"
                fill="#10B981"
                fontSize="9"
                fontFamily="Inter, sans-serif"
              >
                {it.high.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Baseline vertical line */}
        <line
          x1={PADDING.left + baseX}
          y1={PADDING.top - 4}
          x2={PADDING.left + baseX}
          y2={chartH - PADDING.bottom + 4}
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* Bottom axis */}
        <line
          x1={PADDING.left}
          y1={chartH - PADDING.bottom}
          x2={chartW - PADDING.right}
          y2={chartH - PADDING.bottom}
          stroke="#334155"
          strokeWidth="1"
        />

        {/* Min / max axis labels */}
        <text
          x={PADDING.left}
          y={chartH - PADDING.bottom + 14}
          textAnchor="start"
          fill="#64748B"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          {minVal.toFixed(1)}
        </text>
        <text
          x={chartW - PADDING.right}
          y={chartH - PADDING.bottom + 14}
          textAnchor="end"
          fill="#64748B"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          {maxVal.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}
