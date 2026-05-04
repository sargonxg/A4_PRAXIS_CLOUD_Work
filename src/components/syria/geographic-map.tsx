'use client';

/**
 * Schematic Syria map with town pins, animated reveal, and hover snapshots.
 *
 * The map is intentionally stylised rather than topographically exact — it
 * carries the geographic anchors a UN-NYC analyst needs to see (capital,
 * coastal minority belt, southern flashpoint, Kurdish northeast, eastern
 * detention-facility spine, contested north) without pulling a full GeoJSON
 * or basemap dependency.
 *
 * Coordinates are projected from real lat/lng on a 800×500 viewBox using a
 * simple linear mapping over the Syria bounding box.
 */

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Compass } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const VIEWBOX_W = 800;
const VIEWBOX_H = 500;
// Tight Syria bounding box with ~0.5° padding for neighbour bleed.
const BBOX = { latN: 37.6, latS: 32.0, lngW: 35.4, lngE: 42.6 };

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BBOX.lngW) / (BBOX.lngE - BBOX.lngW)) * VIEWBOX_W;
  const y = ((BBOX.latN - lat) / (BBOX.latN - BBOX.latS)) * VIEWBOX_H;
  return { x, y };
}

type RiskTone = 'critical' | 'high' | 'elevated' | 'moderate';

interface SyriaTown {
  id: string;
  name: string;
  lat: number;
  lng: number;
  governorate: string;
  population: string;
  riskTone: RiskTone;
  why: string;
  fileNote: string;
}

const TOWNS: SyriaTown[] = [
  { id: 't-damascus',   name: 'Damascus',     lat: 33.5138, lng: 36.2765, governorate: 'Capital',           population: '2.5M', riskTone: 'moderate',
    why: 'Transitional capital · constitutional drafting committee seat',
    fileNote: 'al-Sharaa cabinet · UN Special Envoy meetings · returnee absorption pressure' },
  { id: 't-aleppo',     name: 'Aleppo',       lat: 36.2021, lng: 37.1343, governorate: 'Aleppo',            population: '2.0M', riskTone: 'high',
    why: 'East Aleppo + rural belt under returnee + service-restoration strain',
    fileNote: 'Shelter damage · service restoration backlog · returnee absorption' },
  { id: 't-latakia',    name: 'Latakia',      lat: 35.5167, lng: 35.7833, governorate: 'Latakia',           population: '650k', riskTone: 'high',
    why: 'Coastal Alawite belt · March 2025 sectarian violence epicentre',
    fileNote: '800+ civilian deaths reported · accountability commission stalled' },
  { id: 't-tartus',     name: 'Tartus',       lat: 34.8833, lng: 35.8833, governorate: 'Tartus',            population: '160k', riskTone: 'elevated',
    why: 'Russian naval residual · minority protection file · returnee absorption',
    fileNote: 'Russian basing · Alawite minority · IIIM-flagged incidents' },
  { id: 't-homs',       name: 'Homs',         lat: 34.7333, lng: 36.7167, governorate: 'Homs',              population: '775k', riskTone: 'moderate',
    why: 'Returnee corridor between coast and interior',
    fileNote: 'HLP disputes · service capacity · transit pressure' },
  { id: 't-sweida',     name: 'Sweida',       lat: 32.7081, lng: 36.5694, governorate: 'Sweida',            population: '90k',  riskTone: 'critical',
    why: 'Druze flashpoint · July 2025 clashes · Israeli airstrike spillover',
    fileNote: 'Druze armed groups · local mediation · Israeli operations' },
  { id: 't-daraa',      name: 'Daraa',        lat: 32.6189, lng: 36.1059, governorate: 'Daraa',             population: '110k', riskTone: 'high',
    why: 'Southern transit · returnee conscription concerns',
    fileNote: 'Returnee male conscription · cross-line corridor · 1974 line proximity' },
  { id: 't-quneitra',   name: 'Quneitra',     lat: 33.1264, lng: 35.8244, governorate: 'Quneitra',          population: '12k',  riskTone: 'critical',
    why: '1974 disengagement line · UNDOF · Israeli incursions',
    fileNote: 'UNDOF mandate · Israeli operations · buffer integrity' },
  { id: 't-hasakah',    name: 'Hasakah',      lat: 36.5000, lng: 40.7333, governorate: 'Al-Hasakah',        population: '420k', riskTone: 'critical',
    why: 'AANES seat · ISIL detention corridor · integration sequencing',
    fileNote: 'al-Hol · al-Sina detention · SDF integration · Kurdish rights file' },
  { id: 't-raqqa',      name: 'Ar-Raqqa',     lat: 35.9500, lng: 39.0167, governorate: 'Ar-Raqqa',          population: '220k', riskTone: 'high',
    why: 'Former ISIL capital · displacement waves · service restoration',
    fileNote: 'IDP returns · counter-ISIL legacy · cross-line operations' },
  { id: 't-deir',       name: 'Deir-ez-Zor',  lat: 35.3333, lng: 40.1500, governorate: 'Deir-ez-Zor',       population: '210k', riskTone: 'critical',
    why: 'Localised clashes 4 incidents Mar–Apr 2026 · oil/gas leverage',
    fileNote: 'Resource leverage · localised clashes · Iranian residual networks' },
  { id: 't-idlib',      name: 'Idlib',        lat: 35.9333, lng: 36.6333, governorate: 'Idlib',             population: '165k', riskTone: 'elevated',
    why: 'Northwest IDP sites · winter recovery',
    fileNote: 'Winter storm impact · IDP camps · cross-border modality' },
  { id: 't-manbij',     name: 'Manbij',       lat: 36.5278, lng: 37.9550, governorate: 'Aleppo',            population: '100k', riskTone: 'high',
    why: 'Türkiye-SNA proximity · convoy delays at crossings',
    fileNote: 'Cross-border crossing friction · Türkiye-aligned forces' },
];

const TONE_STYLE: Record<RiskTone, { fill: string; ring: string; label: string }> = {
  critical: { fill: '#ef4444', ring: 'rgba(239,68,68,0.32)',  label: 'Critical'  },
  high:     { fill: '#f97316', ring: 'rgba(249,115,22,0.32)', label: 'High'      },
  elevated: { fill: '#eab308', ring: 'rgba(234,179,8,0.32)',  label: 'Elevated'  },
  moderate: { fill: '#22c55e', ring: 'rgba(34,197,94,0.28)',  label: 'Moderate'  },
};

// Stylised Syria polygon (approximate); rendered as a soft fill underneath pins.
const SYRIA_OUTLINE_POINTS: Array<[number, number]> = [
  [42.4, 37.0], [42.0, 37.3], [41.2, 37.1], [40.0, 37.0], [38.4, 36.9],
  [37.2, 36.7], [36.6, 36.4], [36.0, 36.0], [35.7, 35.5], [35.7, 34.6],
  [36.1, 33.8], [35.9, 33.3], [36.0, 32.6], [36.6, 32.4], [38.4, 32.2],
  [40.6, 32.6], [41.2, 33.6], [42.0, 34.5], [42.4, 35.7], [42.4, 37.0],
];

function pathFromPoints(points: Array<[number, number]>): string {
  const projected = points.map(([lng, lat]) => project(lat, lng));
  const head = projected[0]!;
  return [
    `M ${head.x.toFixed(1)} ${head.y.toFixed(1)}`,
    ...projected.slice(1).map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    'Z',
  ].join(' ');
}

const NEIGHBOUR_LABELS: { name: string; lat: number; lng: number }[] = [
  { name: 'Türkiye',  lat: 37.4,  lng: 38.5 },
  { name: 'Iraq',     lat: 34.0,  lng: 41.7 },
  { name: 'Jordan',   lat: 32.2,  lng: 37.5 },
  { name: 'Lebanon',  lat: 33.7,  lng: 35.55 },
  { name: 'Israel',   lat: 32.4,  lng: 35.55 },
];

interface SyriaGeographicMapProps {
  className?: string;
  /** Auto-cycle highlight through towns every N ms; set 0 to disable. */
  autoCycleMs?: number;
}

export function SyriaGeographicMap({ className, autoCycleMs = 2400 }: SyriaGeographicMapProps) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const [autoIndex, setAutoIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || autoCycleMs <= 0 || hovered) return undefined;
    const timer = window.setInterval(() => {
      setAutoIndex((idx) => (idx + 1) % TOWNS.length);
    }, autoCycleMs);
    return () => window.clearInterval(timer);
  }, [autoCycleMs, hovered, reduceMotion]);

  const focusedId = hovered ?? TOWNS[autoIndex]?.id ?? null;
  const focused = focusedId ? TOWNS.find((t) => t.id === focusedId) : null;

  const outlinePath = pathFromPoints(SYRIA_OUTLINE_POINTS);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-navy-200 bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 text-white shadow-lg',
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300">
            <Compass className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Geographic intelligence</p>
            <p className="text-sm font-semibold">Syria — flashpoints, minority belts, and integration corridors</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider">
          {Object.entries(TONE_STYLE).map(([tone, style]) => (
            <span key={tone} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
              <span className="h-2 w-2 rounded-full" style={{ background: style.fill }} />
              {style.label}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative">
          <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className="h-[420px] w-full" role="img" aria-label="Syria map of towns and risk hotspots">
            <defs>
              <radialGradient id="syriaMapBackground" cx="50%" cy="50%" r="65%">
                <stop offset="0%"  stopColor="#1e3a5f" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="syriaCountryFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"  stopColor="#1e293b" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
              </linearGradient>
              <radialGradient id="townHaloGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stopColor="#facc15" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="url(#syriaMapBackground)" />

            {/* Lat/lng grid */}
            {[33, 34, 35, 36, 37].map((lat) => {
              const y = project(lat, 38).y;
              return <line key={`lat-${lat}`} x1={0} x2={VIEWBOX_W} y1={y} y2={y} stroke="rgba(148,163,184,0.12)" strokeDasharray="2 6" />;
            })}
            {[36, 37, 38, 39, 40, 41, 42].map((lng) => {
              const x = project(35, lng).x;
              return <line key={`lng-${lng}`} x1={x} x2={x} y1={0} y2={VIEWBOX_H} stroke="rgba(148,163,184,0.12)" strokeDasharray="2 6" />;
            })}

            {/* Country fill */}
            <path d={outlinePath} fill="url(#syriaCountryFill)" stroke="#64748b" strokeWidth="1.4" strokeOpacity="0.7" />

            {/* Neighbour labels */}
            {NEIGHBOUR_LABELS.map((n) => {
              const p = project(n.lat, n.lng);
              return (
                <text
                  key={n.name}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontStyle="italic"
                  opacity="0.7"
                >
                  {n.name}
                </text>
              );
            })}

            {/* Towns */}
            {TOWNS.map((town, idx) => {
              const p = project(town.lat, town.lng);
              const tone = TONE_STYLE[town.riskTone];
              const isFocused = focusedId === town.id;
              return (
                <g
                  key={town.id}
                  onMouseEnter={() => setHovered(town.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pulsing halo */}
                  {!reduceMotion && isFocused ? (
                    <circle cx={p.x} cy={p.y} r={28} fill="url(#townHaloGrad)">
                      <animate attributeName="r" from="14" to="34" dur="1.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                  ) : null}
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={isFocused ? 9 : 6}
                    fill={tone.fill}
                    stroke="#fff"
                    strokeWidth="1.5"
                    initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                    animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.06, type: 'spring', stiffness: 220, damping: 16 }}
                    style={{ transformOrigin: `${p.x}px ${p.y}px`, transition: 'r 0.2s ease' }}
                  />
                  <text
                    x={p.x}
                    y={p.y - 14}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize={isFocused ? 13 : 11}
                    fontWeight={isFocused ? 700 : 600}
                    style={{ pointerEvents: 'none', transition: 'font-size 0.2s ease' }}
                  >
                    {town.name}
                  </text>
                </g>
              );
            })}

            {/* Legend pin */}
            <g transform={`translate(20 ${VIEWBOX_H - 30})`}>
              <text fill="#94a3b8" fontSize="10" fontStyle="italic">PRAXIS · public-source · {TOWNS.length} anchors</text>
            </g>
          </svg>
        </div>

        <aside className="border-t border-white/10 bg-white/[0.03] p-4 lg:border-l lg:border-t-0">
          {focused ? (
            <motion.div
              key={focused.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-300" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">{focused.governorate}</p>
              </div>
              <h3 className="mt-1 text-base font-semibold text-white">{focused.name}</h3>
              <p className="mt-1 text-[11px] text-blue-100/55">Population ~{focused.population}</p>
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: TONE_STYLE[focused.riskTone].ring, color: TONE_STYLE[focused.riskTone].fill }}
              >
                {TONE_STYLE[focused.riskTone].label}
              </span>
              <p className="mt-3 text-xs leading-5 text-blue-100/85">{focused.why}</p>
              <p className="mt-2 rounded-md bg-white/5 p-2 text-[11px] leading-4 text-blue-100/75">
                <span className="font-semibold text-emerald-200">File note:</span> {focused.fileNote}
              </p>
            </motion.div>
          ) : (
            <p className="text-[11px] leading-5 text-blue-100/55">Hover or watch the cycle to see town files in the analyst frame.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
