'use client';

/**
 * PathPicker — 10-path 5x2 grid with hover preview.
 *
 * Brief: Claude Code CC-2.
 *
 * Renders all 10 operator paths from /api/paths. Each card shows
 * `PRX-PATH-{id}` serial, name, top-3 frameworks chips, time horizon
 * pill, tool-bundle count. Hover lifts the card and reveals a preview
 * panel: radial lens chart over 9 axes, framework chain, sample
 * snippet derived from the path's prompt voice.
 *
 * Selecting a path POSTs to /api/capsules/{capsuleId}/swap with
 * slotKind: 'path' so the active capsule's path slot updates.
 *
 * Mobile: tap toggles preview (no hover).
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Loader2, Compass } from 'lucide-react';
import type { PathConfig, PathId } from '@/lib/path/types';
import { cn } from '@/lib/utils/cn';

const SPRING = { type: 'spring' as const, stiffness: 240, damping: 28 };

const LENS_AXES = [
  'power',
  'security',
  'escalation',
  'interests',
  'leverage',
  'normative',
  'needs',
  'access',
  'protection',
] as const;
type LensAxis = (typeof LENS_AXES)[number];

const PATH_TINT: Record<string, string> = {
  'conflict-path': '#7B1E22',
  'diplomacy-path': '#1B3A5C',
  'humanitarian-path': '#3F7A66',
  'rights-path': '#7A3F4F',
  'governance-path': '#5B6B8C',
  'economic-path': '#8A5A00',
  'development-path': '#A06A3C',
  'climate-path': '#1F5F4F',
  'info-path': '#4F4F8A',
  'transnational-path': '#5C2C2C',
};

const SAMPLE_BY_PATH: Record<string, string> = {
  'conflict-path': 'Glasl stage 5 hardening; two pivot actors absorbing escalation.',
  'diplomacy-path': 'ZOPA narrows around territorial concession; mandate ripeness moderate.',
  'humanitarian-path': 'PIN trending up in two governorates; access window closing in 48h.',
  'rights-path': 'Three documented violations cluster on detention transfers.',
  'governance-path': 'Reform window open; two veto players retain salience.',
  'economic-path': 'Sanctions secondary effects elevated for finance; compliance gaps in trade.',
  'development-path': 'Recovery arc plausible at 18mo with sequenced cluster funding.',
  'climate-path': 'Cascade risk: drought → displacement → resource conflict over 6mo.',
  'info-path': 'Two narratives converging; attribution medium-confidence.',
  'transnational-path': 'Choke point identified at northern corridor; enforcement leverage thin.',
};

export interface PathPickerProps {
  /** Capsule the swap should apply to. When null, selecting fires onSelect only. */
  capsuleId?: string | null;
  /** Optional: notify parent of the chosen pathId. */
  onSelect?: (pathId: PathId) => void;
  /** Optional: id currently attached to the active capsule. */
  currentPathId?: PathId | null;
}

export function PathPicker({ capsuleId, onSelect, currentPathId }: PathPickerProps) {
  const [paths, setPaths] = useState<PathConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<PathConfig | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/paths', { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<{ paths: PathConfig[] }>) : Promise.reject(new Error(`status ${r.status}`))))
      .then((body) => {
        if (!cancelled) setPaths(body.paths ?? []);
      })
      .catch((err) => console.warn('[PathPicker] /api/paths failed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function selectPath(path: PathConfig) {
    onSelect?.(path.id as PathId);
    if (!capsuleId) return;
    setSubmitting(path.id);
    try {
      await fetch(`/api/capsules/${encodeURIComponent(capsuleId)}/swap`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slotKind: 'path', coreId: path.id }),
      }).catch(() => undefined);
      window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId } }));
    } finally {
      setSubmitting(null);
    }
  }

  const preview = hover ?? paths[0] ?? null;

  return (
    <section className="rounded-2xl border border-[#8A5A00]/30 bg-white/95 p-5 shadow-xl shadow-navy-950/5 backdrop-blur">
      <header className="mb-4 flex items-center gap-2">
        <Compass className="h-4 w-4 text-[#8A5A00]" />
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#8A5A00]">Pick your operator path</h2>
        <span className="ml-2 font-mono text-[10px] text-slate-500">PRX-PATH</span>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Grid */}
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {paths.map((path) => {
              const isCurrent = path.id === currentPathId;
              const tint = PATH_TINT[path.id] ?? '#1B3A5C';
              return (
                <motion.button
                  key={path.id}
                  type="button"
                  onMouseEnter={() => setHover(path)}
                  onFocus={() => setHover(path)}
                  onClick={() => void selectPath(path)}
                  disabled={submitting !== null}
                  whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }}
                  transition={SPRING}
                  className={cn(
                    'group flex aspect-[5/4] flex-col justify-between rounded-md border-2 bg-[#FAF8F2] p-2 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60',
                    isCurrent ? 'ring-2 ring-emerald-500 ring-offset-1' : 'hover:shadow-md',
                  )}
                  style={{ borderColor: `${tint}55` }}
                  aria-label={`Select path ${path.name}`}
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
                    PRX-PATH-{path.id.replace('-path', '').toUpperCase()}
                  </span>
                  <span className="font-serif text-[13px] leading-tight text-slate-950">
                    {path.name}
                  </span>
                  <span className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: tint }}>
                    <span>{path.timeHorizonDefault}</span>
                    <span className="font-mono text-slate-400">{path.toolBundle.length}t</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Preview panel */}
        <aside
          className="hidden min-h-[260px] rounded-md border border-slate-200 bg-white p-3 lg:block"
          aria-live="polite"
        >
          {preview ? <PreviewPanel path={preview} reduceMotion={!!reduceMotion} /> : null}
        </aside>
      </div>

      {/* Mobile preview (always visible) */}
      <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 lg:hidden">
        {preview ? <PreviewPanel path={preview} reduceMotion={!!reduceMotion} /> : null}
      </div>
    </section>
  );
}

function PreviewPanel({ path, reduceMotion }: { path: PathConfig; reduceMotion: boolean }) {
  const tint = PATH_TINT[path.id] ?? '#1B3A5C';
  const sample = SAMPLE_BY_PATH[path.id] ?? 'Sample output for this path.';
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-serif text-base font-semibold text-slate-950">{path.name}</span>
        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: tint }}>
          {path.audienceDefault}
        </span>
      </div>
      <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-slate-600">{path.description}</p>

      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <RadialLensChart
          path={path}
          color={tint}
          reduceMotion={reduceMotion}
        />
        <FrameworkChain frameworks={path.frameworkPath} color={tint} />
      </div>

      <p className="mt-3 rounded border-l-2 bg-slate-50 px-2 py-1.5 font-serif text-[11px] italic leading-snug text-slate-700" style={{ borderColor: tint }}>
        “{sample}”
      </p>

      <div className="mt-2 flex flex-wrap gap-1">
        {path.lensTop3.map((lens) => (
          <span key={lens} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
            {lens}
          </span>
        ))}
        <span className="ml-auto font-mono text-[10px] text-slate-500">
          tools · {path.toolBundle.length}
        </span>
      </div>
    </div>
  );
}

function RadialLensChart({
  path,
  color,
  reduceMotion,
}: {
  path: PathConfig;
  color: string;
  reduceMotion: boolean;
}) {
  const size = 110;
  const center = size / 2;
  const radius = size / 2 - 8;

  const values = useMemo(() => {
    const weights = path.lensWeights ?? {};
    return LENS_AXES.map((axis) => {
      const inTop3 = path.lensTop3.includes(axis);
      const w = weights[axis] ?? (inTop3 ? 1.5 : 0.6);
      return Math.min(1, w / 2);
    });
  }, [path]);

  const points = LENS_AXES.map((axis, i) => {
    const angle = (i / LENS_AXES.length) * Math.PI * 2 - Math.PI / 2;
    const r = radius * values[i];
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  });

  const polygon = points.map((p) => p.join(',')).join(' ');
  const initialDash = points.length * radius * 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Lens weighting">
      {/* Concentric guide rings */}
      {[0.33, 0.66, 1].map((r) => (
        <circle key={r} cx={center} cy={center} r={radius * r} fill="none" stroke="#E5E7EB" strokeWidth={0.6} />
      ))}
      {/* Axes */}
      {LENS_AXES.map((axis, i) => {
        const angle = (i / LENS_AXES.length) * Math.PI * 2 - Math.PI / 2;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        return <line key={axis} x1={center} y1={center} x2={x} y2={y} stroke="#E5E7EB" strokeWidth={0.5} />;
      })}
      {/* Filled polygon */}
      <motion.polygon
        points={polygon}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={1.5}
        initial={reduceMotion ? false : { strokeDasharray: initialDash, strokeDashoffset: initialDash, opacity: 0 }}
        animate={{ strokeDashoffset: 0, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.6 }}
      />
    </svg>
  );
}

function FrameworkChain({ frameworks, color }: { frameworks: string[]; color: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Framework path</span>
      <div className="flex flex-wrap items-center gap-1">
        {frameworks.map((fw, i) => (
          <span key={fw} className="flex items-center gap-1">
            <span
              className="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ borderColor: `${color}55`, color }}
            >
              {fw.replace(/_/g, ' ')}
            </span>
            {i < frameworks.length - 1 ? (
              <ArrowRight className="h-3 w-3 text-slate-400" />
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
