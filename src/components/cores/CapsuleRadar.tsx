'use client';

/**
 * CapsuleRadar — 7-axis completeness radar for the active capsule.
 *
 * Brief: Claude Code CC-3.
 *
 * Axes: User · Situation · Path · Sources · Graph · Time · Output.
 * Values 0–1 from /api/context/readiness (Codex CX-6) with local
 * computation fallback so the radar renders pre-backend.
 *
 * Filled polygon = current state. Dashed polygon = target derived
 * from the active path's contextRecipe (full ring for required cores,
 * inner ring for optional). Empty axes pulse amber unless
 * prefers-reduced-motion is set. Axis labels are listbox-style buttons
 * that emit `onAxisActivate(slotKind)` so the parent can open the
 * matching CoreSwapDrawer.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useSituationStore } from '@/stores/situation-store';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { cn } from '@/lib/utils/cn';

type RadarAxis = Extract<CoreSpecimenKind, 'user' | 'situation' | 'path' | 'source' | 'graph' | 'time' | 'output'>;

const AXIS_ORDER: RadarAxis[] = ['user', 'situation', 'path', 'source', 'graph', 'time', 'output'];

const AXIS_LABEL: Record<RadarAxis, string> = {
  user: 'User',
  situation: 'Situation',
  path: 'Path',
  source: 'Sources',
  graph: 'Graph',
  time: 'Time',
  output: 'Output',
};

interface ReadinessResponse {
  axes?: Partial<Record<RadarAxis, number>>;
  target?: Partial<Record<RadarAxis, number>>;
}

export interface CapsuleRadarProps {
  /** Compact = 80px, full = 220px. */
  size?: 'compact' | 'full';
  capsuleId?: string | null;
  onAxisActivate?: (axis: RadarAxis) => void;
  className?: string;
}

export function CapsuleRadar({ size = 'full', capsuleId, onAxisActivate, className }: CapsuleRadarProps) {
  const reduceMotion = useReducedMotion();
  const { analystProfile } = useAuth();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const [remote, setRemote] = useState<ReadinessResponse | null>(null);

  useEffect(() => {
    if (!capsuleId) return;
    let cancelled = false;
    fetch(`/api/context/readiness?capsuleId=${encodeURIComponent(capsuleId)}`, { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<ReadinessResponse>) : Promise.reject(new Error(String(r.status)))))
      .then((body) => {
        if (!cancelled) setRemote(body);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [capsuleId]);

  // Local fallback computation mirrors the context readiness surface heuristics.
  const localAxes = useMemo<Record<RadarAxis, number>>(() => {
    const sourceCount =
      (activeSituation?.sourceUrls?.length ?? 0) +
      (activeSituation?.customSources?.length ?? 0) +
      (activeSituation?.documentCount ?? 0);
    const actorCount = activeSituation?.actors?.length ?? activeSituation?.actorCount ?? 0;
    const hasTimeline = (activeSituation?.keyDates?.length ?? 0) > 0 || Boolean(activeSituation?.latestEventDate);
    const path = activeSituation?.pathId ?? activeSituation?.workflowPath ?? null;
    return {
      user: analystProfile?.meta?.completedAt ? 1 : 0,
      situation: activeSituation ? 1 : 0,
      path: path ? 1 : 0.3,
      source: Math.min(1, sourceCount / 4),
      graph: Math.min(1, (activeSituation?.graphEntities ?? 0) / 6 + actorCount / 5),
      time: hasTimeline ? 1 : 0.4,
      output: activeSituation?.lastAiRefresh ? 1 : 0.3,
    };
  }, [analystProfile, activeSituation]);

  const axes = AXIS_ORDER.map((a) => Math.max(0, Math.min(1, remote?.axes?.[a] ?? localAxes[a])));
  const targets = AXIS_ORDER.map((a) => Math.max(0, Math.min(1, remote?.target?.[a] ?? 1)));

  const px = size === 'compact' ? 96 : 220;
  const center = px / 2;
  const radius = px / 2 - (size === 'compact' ? 8 : 22);

  const currentPoints = AXIS_ORDER.map((_, i) => polar(center, radius * axes[i], i));
  const targetPoints = AXIS_ORDER.map((_, i) => polar(center, radius * targets[i], i));

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} role="img" aria-label="Capsule completeness radar">
        {/* Concentric guides */}
        {[0.33, 0.66, 1].map((r) => (
          <circle key={r} cx={center} cy={center} r={radius * r} fill="none" stroke="#E5E7EB" strokeWidth={0.6} />
        ))}
        {/* Spokes */}
        {AXIS_ORDER.map((axis, i) => {
          const [x, y] = polar(center, radius, i);
          return <line key={axis} x1={center} y1={center} x2={x} y2={y} stroke="#E5E7EB" strokeWidth={0.5} />;
        })}
        {/* Target dashed polygon */}
        <polygon
          points={pointsToString(targetPoints)}
          fill="none"
          stroke="#1B3A5C"
          strokeOpacity={0.45}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        {/* Current filled polygon */}
        <motion.polygon
          points={pointsToString(currentPoints)}
          fill="#1B3A5C"
          fillOpacity={0.18}
          stroke="#1B3A5C"
          strokeWidth={1.5}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />
        {/* Per-axis dots; pulse amber when value < 0.4 */}
        {AXIS_ORDER.map((axis, i) => {
          const [x, y] = polar(center, radius * axes[i], i);
          const empty = axes[i] < 0.4;
          return (
            <motion.circle
              key={axis}
              cx={x}
              cy={y}
              r={size === 'compact' ? 2.5 : 4}
              fill={empty ? '#F59E0B' : '#10B981'}
              animate={
                empty && !reduceMotion
                  ? { opacity: [0.4, 1, 0.4] }
                  : { opacity: 1 }
              }
              transition={{ repeat: empty ? Infinity : 0, duration: 2 }}
            />
          );
        })}
      </svg>

      {size === 'full' ? (
        <ul role="listbox" aria-label="Capsule axes" className="mt-3 grid w-full grid-cols-7 gap-1">
          {AXIS_ORDER.map((axis, i) => {
            const v = axes[i];
            const tone = v >= 0.75 ? 'text-emerald-700' : v >= 0.4 ? 'text-slate-700' : 'text-amber-700';
            return (
              <li key={axis}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => onAxisActivate?.(axis)}
                  className={cn(
                    'flex w-full flex-col items-center rounded-md px-1 py-1 text-[9px] font-bold uppercase tracking-[0.1em] transition hover:bg-slate-100',
                    tone,
                  )}
                  title={`Open ${AXIS_LABEL[axis]} core swap`}
                >
                  <span>{AXIS_LABEL[axis]}</span>
                  <span className="font-mono text-[10px] text-slate-500">{Math.round(v * 100)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function polar(center: number, r: number, i: number): [number, number] {
  const angle = (i / AXIS_ORDER.length) * Math.PI * 2 - Math.PI / 2;
  return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
}

function pointsToString(points: [number, number][]): string {
  return points.map((p) => p.join(',')).join(' ');
}
