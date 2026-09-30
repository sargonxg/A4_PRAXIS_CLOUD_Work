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
  entityTypeCounts,
  className,
  onOpen,
}: {
  seed: string;
  color: string;
  nodeCount: number;
  edgeCount: number;
  entityTypeCounts?: Record<string, number>;
  className?: string;
  onOpen?: () => void;
}) {
  const profile = useMemo(() => buildGraphProfile(seed, nodeCount, edgeCount, entityTypeCounts), [seed, nodeCount, edgeCount, entityTypeCounts]);
  const points = useMemo(() => buildConstellation(seed, profile.nodes), [seed, profile.nodes]);
  const caption = profile.nodes ? `${profile.nodes} recorded nodes · ${profile.edges} links` : 'No recorded graph yet';

  return (
    <span
      data-testid="capsule-mini-graph"
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } } : undefined}
      title="Schematic overview of recorded graph counts. Inspect the capsule for actual entities, links and evidence."
      className={cn(
        'flex w-full max-w-full items-center gap-2 rounded-md border border-slate-100 bg-white/70 px-2 py-1.5',
        onOpen && 'cursor-pointer transition hover:border-slate-200 hover:bg-white',
        className,
      )}
    >
      <svg viewBox="0 0 96 28" className="h-7 w-[clamp(4rem,28vw,6rem)] shrink-0" aria-hidden focusable="false">
        {points.map((point, index) => {
          const next = points[(index + 1) % points.length];
          if (points.length < 2 || index >= profile.edges) return null;
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
            r={point.r}
            fill={color}
            fillOpacity={point.emphasis}
          />
        ))}
      </svg>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Graph overview · schematic</span>
        <span className="block truncate text-[11px] font-semibold text-slate-600">{caption}</span>
      </span>
    </span>
  );
}

// Entity mixes echo the ACO ontology so each capsule reads like real captured
// context rather than a uniform placeholder.
const ENTITY_MIXES = [
  'actors · claims',
  'actors · events',
  'claims · sources',
  'interests · constraints',
  'events · narratives',
  'commitments · risks',
  'claims · leverage',
  'actors · grievances',
] as const;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildGraphProfile(seed: string, nodeCount: number, edgeCount: number, entityTypeCounts?: Record<string, number>): { nodes: number; edges: number; entityMix: string } {
  const hash = hashSeed(seed);
  // Missing counts stay empty. A decorative constellation is not evidence.
  const nodes = Math.max(0, Number.isFinite(nodeCount) ? Math.round(nodeCount) : 0);
  const edges = Math.max(0, Number.isFinite(edgeCount) ? Math.round(edgeCount) : 0);
  return {
    nodes,
    edges,
    entityMix: entityMixFromCounts(entityTypeCounts) ?? ENTITY_MIXES[(hash >>> 8) % ENTITY_MIXES.length],
  };
}

function entityMixFromCounts(entityTypeCounts?: Record<string, number>): string | null {
  if (!entityTypeCounts) return null;
  const labels = Object.entries(entityTypeCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([label]) => label.replace(/[_-]+/g, ' ').toLowerCase());
  return labels.length ? labels.join(' · ') : null;
}

function buildConstellation(seed: string, nodeCount: number): Array<{ x: number; y: number; r: number; emphasis: number }> {
  const count = Math.max(0, Math.min(9, nodeCount));
  const points: Array<{ x: number; y: number; r: number; emphasis: number }> = [];
  let state = hashSeed(seed);
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state % 1000) / 1000;
  };
  for (let index = 0; index < count; index += 1) {
    const xJitter = next();
    const yJitter = next();
    const sizeJitter = next();
    const x = 8 + (index / Math.max(1, count - 1)) * 80 + (xJitter - 0.5) * 14;
    const y = 5 + yJitter * 18;
    points.push({
      x: Math.max(4, Math.min(92, x)),
      y: Math.max(4, Math.min(24, y)),
      r: index === 0 ? 2.6 : 1.3 + sizeJitter * 1.2,
      emphasis: index === 0 ? 0.9 : 0.35 + sizeJitter * 0.4,
    });
  }
  return points;
}
