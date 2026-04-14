'use client';

import React, { useState } from 'react';
import { safeNum } from '@/lib/utils/safe-number';

type ColorScale = 'risk' | 'blue' | 'diverging';

interface HeatmapGridProps {
  rows: string[];
  cols: string[];
  data: number[][];
  title?: string;
  colorScale?: ColorScale;
  showValues?: boolean;
  onCellClick?: (row: number, col: number, value: number) => void;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `rgb(${r},${g},${b})`;
}

function getColor(value: number, min: number, max: number, scale: ColorScale): string {
  const t = max === min ? 0.5 : (value - min) / (max - min);

  if (scale === 'risk') {
    // emerald → amber → red
    if (t < 0.5) return lerpColor([16, 185, 129], [245, 158, 11], t * 2);
    return lerpColor([245, 158, 11], [239, 68, 68], (t - 0.5) * 2);
  }

  if (scale === 'blue') {
    return lerpColor([15, 23, 42], [59, 130, 246], t);
  }

  // diverging: red → slate → emerald
  if (t < 0.5) return lerpColor([239, 68, 68], [51, 65, 85], t * 2);
  return lerpColor([51, 65, 85], [16, 185, 129], (t - 0.5) * 2);
}

const LEGEND_STOPS = 5;

export function HeatmapGrid({
  rows,
  cols,
  data,
  title,
  colorScale = 'risk',
  showValues = true,
  onCellClick,
}: HeatmapGridProps) {
  const [hovered, setHovered] = useState<[number, number] | null>(null);

  const allValues = data.flat();
  // safeNum guards against Math.min/max on empty array returning ±Infinity
  const minVal = safeNum(Math.min(...allValues));
  const maxVal = safeNum(Math.max(...allValues));

  const LABEL_W = 90;
  const CELL = Math.max(28, Math.min(56, Math.floor((480 - LABEL_W) / Math.max(cols.length, 1))));
  const ROW_H = Math.max(28, Math.min(48, CELL));

  return (
    <div className="w-full overflow-x-auto">
      {title ? (
        <div className="text-slate-300 text-sm font-medium mb-2">{title}</div>
      ) : null}

      <div style={{ minWidth: LABEL_W + cols.length * CELL }}>
        {/* Column headers */}
        <div className="flex" style={{ paddingLeft: LABEL_W }}>
          {cols.map((c, ci) => (
            <div
              key={ci}
              className="text-slate-400 text-center truncate"
              style={{ width: CELL, fontSize: 10, paddingBottom: 4 }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-center">
            <div
              className="text-slate-400 truncate shrink-0"
              style={{ width: LABEL_W, fontSize: 11, paddingRight: 8, textAlign: 'right' }}
            >
              {row}
            </div>
            {cols.map((_, ci) => {
              const val = data[ri]?.[ci] ?? 0;
              const bg = getColor(val, minVal, maxVal, colorScale);
              const isHovered = hovered?.[0] === ri && hovered?.[1] === ci;
              return (
                <div
                  key={ci}
                  role={onCellClick ? 'button' : undefined}
                  tabIndex={onCellClick ? 0 : undefined}
                  onClick={() => onCellClick?.(ri, ci, val)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onCellClick?.(ri, ci, val);
                  }}
                  onMouseEnter={() => setHovered([ri, ci])}
                  onMouseLeave={() => setHovered(null)}
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: CELL,
                    height: ROW_H,
                    background: bg,
                    border: isHovered ? '2px solid #E8B931' : '1px solid #0F172A',
                    cursor: onCellClick ? 'pointer' : 'default',
                    fontSize: 10,
                    color: '#0F172A',
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {showValues ? val.toFixed(0) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-slate-500 text-xs">Low</span>
        <div className="flex h-3 rounded overflow-hidden" style={{ width: 120 }}>
          {Array.from({ length: LEGEND_STOPS * 4 }, (_, i) => {
            const t = i / (LEGEND_STOPS * 4 - 1);
            const v = minVal + t * (maxVal - minVal);
            return (
              <div
                key={i}
                style={{ flex: 1, background: getColor(v, minVal, maxVal, colorScale) }}
              />
            );
          })}
        </div>
        <span className="text-slate-500 text-xs">High</span>
      </div>
    </div>
  );
}
