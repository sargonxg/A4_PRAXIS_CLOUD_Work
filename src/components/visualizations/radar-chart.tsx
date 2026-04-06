'use client';

import React, { useEffect, useState } from 'react';

interface RadarDimension {
  label: string;
  value: number;
  maxValue?: number;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
  showLabels?: boolean;
  color?: string;
}

function point(cx: number, cy: number, r: number, angle: number) {
  return {
    x: +(cx + r * Math.cos(angle)).toFixed(2),
    y: +(cy + r * Math.sin(angle)).toFixed(2),
  };
}

function polygonPoints(pts: { x: number; y: number }[]) {
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

export function RadarChart({
  dimensions,
  size = 300,
  showLabels = true,
  color = '#10B981',
}: RadarChartProps) {
  const n = Math.max(3, Math.min(dimensions.length, 10));
  const dims = dimensions.slice(0, n);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const labelR = size * 0.47;
  const levels = 5;
  const startAngle = -Math.PI / 2;
  const angleStep = (2 * Math.PI) / n;

  // Axes endpoints
  const axes = dims.map((_, i) => point(cx, cy, maxR, startAngle + i * angleStep));

  // Grid polygons
  const grids = Array.from({ length: levels }, (_, li) => {
    const r = (maxR * (li + 1)) / levels;
    const pts = dims.map((_, i) => point(cx, cy, r, startAngle + i * angleStep));
    return polygonPoints(pts);
  });

  // Data polygon (normalized)
  const dataPoints = dims.map((d, i) => {
    const max = d.maxValue ?? 100;
    const ratio = Math.max(0, Math.min(1, d.value / max));
    return point(cx, cy, maxR * ratio, startAngle + i * angleStep);
  });
  const dataPolygon = polygonPoints(dataPoints);

  const [animPoly, setAnimPoly] = useState(() => polygonPoints(dims.map(() => ({ x: cx, y: cy }))));

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimPoly(dataPolygon));
    return () => cancelAnimationFrame(id);
  }, [dataPolygon]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid lines */}
      {grids.map((pts, li) => (
        <polygon
          key={li}
          points={pts}
          fill="none"
          stroke="#1E293B"
          strokeWidth="1"
        />
      ))}

      {/* Axis spokes */}
      {axes.map((ax, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={ax.x}
          y2={ax.y}
          stroke="#334155"
          strokeWidth="1"
        />
      ))}

      {/* Data polygon fill */}
      <polygon
        points={animPoly}
        fill={`${color}33`}
        stroke={color}
        strokeWidth="2"
        style={{ transition: 'points 0.8s ease-out' }}
      />

      {/* Data point dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}

      {/* Labels */}
      {showLabels
        ? dims.map((d, i) => {
            const lp = point(cx, cy, labelR, startAngle + i * angleStep);
            const anchor =
              lp.x < cx - 4 ? 'end' : lp.x > cx + 4 ? 'start' : 'middle';
            return (
              <text
                key={i}
                x={lp.x}
                y={lp.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill="#94A3B8"
                fontSize="10"
                fontFamily="Inter, sans-serif"
              >
                {d.label}
              </text>
            );
          })
        : null}
    </svg>
  );
}
