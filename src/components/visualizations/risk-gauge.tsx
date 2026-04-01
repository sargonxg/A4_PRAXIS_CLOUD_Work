'use client';

import React, { useEffect, useRef } from 'react';

type Size = 'sm' | 'md' | 'lg';

interface RiskGaugeProps {
  score: number;
  label?: string;
  size?: Size;
  showValue?: boolean;
}

const SIZE_MAP: Record<Size, { px: number; strokeWidth: number; fontSize: number; labelSize: number }> = {
  sm: { px: 120, strokeWidth: 10, fontSize: 20, labelSize: 10 },
  md: { px: 180, strokeWidth: 14, fontSize: 30, labelSize: 12 },
  lg: { px: 240, strokeWidth: 18, fontSize: 40, labelSize: 14 },
};

function getColor(score: number): string {
  if (score <= 30) return '#10B981';
  if (score <= 60) return '#F59E0B';
  if (score <= 80) return '#F97316';
  return '#EF4444';
}

export function RiskGauge({ score, label, size = 'md', showValue = true }: RiskGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const { px, strokeWidth, fontSize, labelSize } = SIZE_MAP[size];
  const pathRef = useRef<SVGPathElement>(null);

  const cx = px / 2;
  const cy = px * 0.58;
  const radius = (px - strokeWidth * 2) / 2;

  // Arc from -135deg to +135deg (270deg sweep)
  const startAngle = -135;
  const endAngle = 135;
  const sweepDeg = endAngle - startAngle; // 270

  function polarToCartesian(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function describeArc(from: number, to: number) {
    const s = polarToCartesian(from);
    const e = polarToCartesian(to);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const trackPath = describeArc(startAngle, endAngle);
  const fillAngle = startAngle + (clampedScore / 100) * sweepDeg;
  const fillPath = describeArc(startAngle, fillAngle);

  // Circumference-equivalent for stroke-dasharray animation
  const arcLength = (sweepDeg / 360) * 2 * Math.PI * radius;
  const fillLength = (clampedScore / 100) * arcLength;

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    el.style.strokeDasharray = `${arcLength}`;
    el.style.strokeDashoffset = `${arcLength}`;
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1s ease-out';
      el.style.strokeDashoffset = `${arcLength - fillLength}`;
    });
    return () => cancelAnimationFrame(raf);
  }, [arcLength, fillLength]);

  const color = getColor(clampedScore);

  return (
    <div className="flex flex-col items-center" style={{ width: px }}>
      <svg width={px} height={cy + strokeWidth} viewBox={`0 0 ${px} ${cy + strokeWidth}`}>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          ref={pathRef}
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
        {/* Score text */}
        {showValue && (
          <text
            x={cx}
            y={cy - radius * 0.18}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={fontSize}
            fontFamily="'EB Garamond', Georgia, serif"
            fontWeight="600"
          >
            {clampedScore}
          </text>
        )}
      </svg>
      {label && (
        <span
          className="mt-1 text-slate-400 tracking-wider uppercase"
          style={{ fontSize: labelSize, fontFamily: 'Inter, sans-serif' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
