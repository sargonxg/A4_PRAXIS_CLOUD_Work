'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Deterministic miniature graph constellation for capsule cards. Layout is
 * derived from the capsule id so the same capsule always renders the same
 * constellation; node count scales with the embedded graph seed. The full
 * interactive graph with ontology and semantic layers lives in Inspect.
 */
export function CapsuleMiniGraph({
  seed,
  color,
  nodeCount,
  edgeCount,
  className,
  onOpen,
}: {
  seed: string;
  color: string;
  nodeCount: number;
  edgeCount: number;
  className?: string;
  onOpen?: () => void;
}) {
  const points = useMemo(() => buildConstellation(seed, nodeCount), [seed, nodeCount]);
  const caption = nodeCount || edgeCount
    ? `${nodeCount} nodes · ${edgeCount} links`
    : 'Graph seeds on inspect';

  return (
    <span
      data-testid="capsule-mini-graph"
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } } : undefined}
      title="Open Inspect for the full graph: ontology binding, semantic layers, claims, and tacit knowledge"
      className={cn(
        'flex items-center gap-2 rounded-md border border-slate-100 bg-white/70 px-2 py-1.5',
        onOpen && 'cursor-pointer transition hover:border-slate-200 hover:bg-white',
        className,
      )}
    >
      <svg viewBox="0 0 96 28" className="h-7 w-24 shrink-0" aria-hidden focusable="false">
        {points.map((point, index) => {
          const next = points[(index + 1) % points.length];
          if (points.length < 2) return null;
          return (
            <line
              key={`edge-${index}`}
              x1={point.x}
              y1={point.y}
              x2={next.x}
              y2={next.y}
              stroke={color}
              strokeOpacity={0.28}
              strokeWidth={0.8}
            />
          );
        })}
        {points.map((point, index) => (
          <circle
            key={`node-${index}`}
            cx={point.x}
            cy={point.y}
            r={index === 0 ? 2.6 : 1.8}
            fill={color}
            fillOpacity={index === 0 ? 0.9 : 0.55}
          />
        ))}
      </svg>
      <span className="min-w-0">
        <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Graph · ontology</span>
        <span className="block truncate text-[11px] font-semibold text-slate-600">{caption}</span>
      </span>
    </span>
  );
}

function buildConstellation(seed: string, nodeCount: number): Array<{ x: number; y: number }> {
  const count = Math.max(3, Math.min(8, nodeCount || 5));
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const points: Array<{ x: number; y: number }> = [];
  let state = hash >>> 0;
  for (let index = 0; index < count; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const xJitter = (state % 1000) / 1000;
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const yJitter = (state % 1000) / 1000;
    const x = 8 + (index / (count - 1)) * 80 + (xJitter - 0.5) * 10;
    const y = 6 + yJitter * 16;
    points.push({ x: Math.max(4, Math.min(92, x)), y: Math.max(4, Math.min(24, y)) });
  }
  return points;
}
