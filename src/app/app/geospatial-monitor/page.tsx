'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useSituationStore } from '@/stores/situation-store';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { PraxisLink } from '@/components/shared/praxis-link';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils/cn';
import {
  MapPin,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Flame,
  TrendingUp,
  Users,
  Skull,
  Activity,
  ChevronDown,
} from 'lucide-react';
import type { GeospatialEvent, GeospatialResponse } from '@/app/api/data/geospatial/route';
import type { HotspotCluster } from '@/lib/analytics/geospatial-engine';

// ─── Leaflet dynamic imports (SSR-safe) ───────────────────────────────────────

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false },
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((m) => m.CircleMarker),
  { ssr: false },
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false },
);

// ─── Constants ────────────────────────────────────────────────────────────────

type EventType =
  | 'battles'
  | 'explosions-remote-violence'
  | 'violence-against-civilians'
  | 'protests'
  | 'riots'
  | 'strategic-developments'
  | 'all';

type DateRange = 30 | 60 | 90 | 180;

interface EventTypeConfig {
  label: string;
  color: string;
  fillColor: string;
}

const EVENT_TYPE_CONFIG: Record<string, EventTypeConfig> = {
  'battles': { label: 'Battles', color: '#ef4444', fillColor: '#ef4444' },
  'explosions-remote-violence': { label: 'Explosions', color: '#f97316', fillColor: '#f97316' },
  'violence-against-civilians': { label: 'Violence vs Civilians', color: '#f59e0b', fillColor: '#f59e0b' },
  'protests': { label: 'Protests', color: '#3b82f6', fillColor: '#3b82f6' },
  'riots': { label: 'Riots', color: '#a855f7', fillColor: '#a855f7' },
  'strategic-developments': { label: 'Strategic Dev.', color: '#64748b', fillColor: '#64748b' },
};

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 30, label: 'Last 30 days' },
  { value: 60, label: 'Last 60 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 180 days' },
];

const RISK_LEVELS = [
  { min: 0, max: 5, label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { min: 5, max: 15, label: 'Medium', color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20' },
  { min: 15, max: 40, label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { min: 40, max: Infinity, label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
];

function getRiskLevel(fatalities: number, eventCount: number) {
  const score = fatalities * 0.7 + eventCount * 0.3;
  return RISK_LEVELS.find((r) => score >= r.min && score < r.max) ?? RISK_LEVELS[0];
}

function getMarkerRadius(fatalities: number): number {
  if (fatalities === 0) return 5;
  if (fatalities < 5) return 7;
  if (fatalities < 20) return 10;
  if (fatalities < 50) return 14;
  return 18;
}

function getEventConfig(type: string): EventTypeConfig {
  const key = type.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-');
  return EVENT_TYPE_CONFIG[key] ?? EVENT_TYPE_CONFIG['strategic-developments'];
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-white/5" />
      <div className="h-4 w-96 rounded bg-white/5" />
      <div className="flex gap-3 mt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-32 rounded-lg bg-white/5" />
        ))}
      </div>
      <div className="h-[60vh] rounded-xl bg-white/5 mt-2" />
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

interface StatsBarProps {
  events: GeospatialEvent[];
  hotspots: HotspotCluster[];
}

function StatsBar({ events, hotspots }: StatsBarProps) {
  const totalFatalities = useMemo(
    () => events.reduce((s, e) => s + e.fatalities, 0),
    [events],
  );
  const activeActors = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.actors.forEach((a) => set.add(a)));
    return set.size;
  }, [events]);
  const intensityIndex = useMemo(() => {
    if (events.length === 0) return 0;
    const battleCount = events.filter((e) => e.type === 'battles').length;
    const expCount = events.filter((e) => e.type === 'explosions-remote-violence').length;
    const vacCount = events.filter((e) => e.type === 'violence-against-civilians').length;
    const weighted = battleCount * 4 + expCount * 3 + vacCount * 3;
    return Math.min(100, Math.round((weighted / Math.max(events.length, 1)) * 10));
  }, [events]);

  const stats = [
    { label: 'Total Events', value: events.length.toLocaleString(), icon: Activity, color: 'text-diplomatic-blue' },
    { label: 'Total Fatalities', value: totalFatalities.toLocaleString(), icon: Skull, color: 'text-red-400' },
    { label: 'Active Actors', value: activeActors.toLocaleString(), icon: Users, color: 'text-gold-400' },
    { label: 'Conflict Intensity', value: `${intensityIndex}/100`, icon: TrendingUp, color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
        >
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]', color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-white/40">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Hotspot panel ────────────────────────────────────────────────────────────

interface HotspotPanelProps {
  hotspots: HotspotCluster[];
}

function HotspotPanel({ hotspots }: HotspotPanelProps) {
  const TREND_COLORS = {
    expanding: 'text-red-400',
    stable: 'text-gold-400',
    contracting: 'text-emerald-400',
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40">
        <Flame className="h-3.5 w-3.5 text-gold-400" />
        Top Hotspots
      </h3>
      {hotspots.length === 0 ? (
        <p className="text-xs text-white/30">No clusters detected.</p>
      ) : (
        hotspots.slice(0, 5).map((hs, idx) => {
          const risk = getRiskLevel(hs.fatalities, hs.eventCount);
          const config = getEventConfig(hs.dominantEventType);
          const trendColor = TREND_COLORS[hs.trend];
          return (
            <div
              key={idx}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-white/60">
                    {idx + 1}
                  </span>
                  <span className="truncate text-xs font-medium text-white">
                    {hs.admin1 || `Cluster ${idx + 1}`}
                  </span>
                </div>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
                    risk.bg,
                    risk.color,
                  )}
                >
                  {risk.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <span className="text-white/40">Events</span>
                <span className="font-medium text-white">{hs.eventCount}</span>
                <span className="text-white/40">Fatalities</span>
                <span className="font-medium text-white">{hs.fatalities}</span>
                <span className="text-white/40">Type</span>
                <span className="font-medium" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-white/40">Trend</span>
                <span className={cn('font-medium capitalize', trendColor)}>{hs.trend}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Timeline slider ──────────────────────────────────────────────────────────

interface TimelineSliderProps {
  minDate: Date;
  maxDate: Date;
  value: Date;
  onChange: (date: Date) => void;
}

function TimelineSlider({ minDate, maxDate, value, onChange }: TimelineSliderProps) {
  const min = minDate.getTime();
  const max = maxDate.getTime();
  const current = value.getTime();
  const pct = max === min ? 100 : Math.round(((current - min) / (max - min)) * 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(new Date(Number(e.target.value)));
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-white/40">Timeline filter</span>
        <span className="text-xs font-medium text-white/70">
          Events up to: <span className="text-gold-400">{value.toLocaleDateString()}</span>
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={current}
          onChange={handleChange}
          className="w-full cursor-pointer accent-gold-500"
          style={{ accentColor: '#E8B931' }}
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/30">
          <span>{minDate.toLocaleDateString()}</span>
          <span className="text-white/50">{pct}%</span>
          <span>{maxDate.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Map component (client-only) ──────────────────────────────────────────────

interface ConflictMapProps {
  events: GeospatialEvent[];
  center: [number, number];
}

function ConflictMap({ events, center }: ConflictMapProps) {
  // Fix leaflet default icon path on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');
    // Import CSS only once on the client
    // The CSS import must happen in a useEffect to avoid SSR issues
    L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: '100%', width: '100%', background: '#0F172A' }}
      className="rounded-xl"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      {events.map((event) => {
        const config = getEventConfig(event.type);
        const radius = getMarkerRadius(event.fatalities);
        return (
          <CircleMarker
            key={event.id}
            center={[event.lat, event.lng]}
            radius={radius}
            pathOptions={{
              color: config.color,
              fillColor: config.fillColor,
              fillOpacity: 0.65,
              weight: 1.5,
              opacity: 0.85,
            }}
          >
            <Popup>
              <div className="min-w-[200px] space-y-1 text-xs">
                <p className="font-semibold text-sm" style={{ color: config.color }}>
                  {config.label}
                </p>
                <p><span className="font-medium">Date:</span> {event.date}</p>
                <p><span className="font-medium">Location:</span> {event.location}, {event.country}</p>
                {event.fatalities > 0 && (
                  <p><span className="font-medium">Fatalities:</span> {event.fatalities}</p>
                )}
                {event.actors.length > 0 && (
                  <p><span className="font-medium">Actors:</span> {event.actors.join(', ')}</p>
                )}
                {event.description && (
                  <p className="text-gray-400 mt-1 leading-relaxed">{event.description}</p>
                )}
                <p className="text-gray-500 mt-1 text-[10px] uppercase tracking-wide">
                  Source: {event.source}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function GeospatialMonitorPage() {
  const { isDemo, hasSituation, situation, showGuard, loading: guardLoading } = useSituationGuard();
  const { activeSituation } = useSituationStore();

  // Controls state
  const [countryFilter, setCountryFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType>('all');
  const [dateRange, setDateRange] = useState<DateRange>(90);
  const [timelineCutoff, setTimelineCutoff] = useState<Date>(new Date());

  // Data state
  const [allEvents, setAllEvents] = useState<GeospatialEvent[]>([]);
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Derive map center from situation or default to Sudan
  const mapCenter = useMemo<[number, number]>(() => {
    if (activeSituation?.geoBoundingBox) {
      const { north, south, east, west } = activeSituation.geoBoundingBox;
      return [(north + south) / 2, (east + west) / 2];
    }
    return [15.6, 32.5];
  }, [activeSituation]);

  // Compute date start from range
  const dateStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - dateRange);
    return d.toISOString().split('T')[0];
  }, [dateRange]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const country = countryFilter || activeSituation?.region || 'Sudan';
      const region = activeSituation?.region ?? '';

      const res = await fetch('/api/data/geospatial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, region, dateStart, limit: 200 }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as GeospatialResponse;

      setAllEvents(data.events);
      setHotspots(data.hotspots);
      setFetchedAt(data.fetchedAt);

      // Set timeline cutoff to newest event date
      if (data.events.length > 0) {
        const latest = data.events.reduce(
          (best, e) => (e.date > best ? e.date : best),
          data.events[0].date,
        );
        setTimelineCutoff(new Date(latest));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[geospatial-monitor] fetch error:', err);
      setError('Failed to load event data. Showing sample data.');
      // The route already returns demo data on error, but handle client-side fallback
    } finally {
      setIsLoading(false);
    }
  }, [countryFilter, activeSituation, dateStart]);

  // Initial load and situation change
  useEffect(() => {
    if (isDemo || hasSituation) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, hasSituation, activeSituation?.id, dateRange]);

  // Ensure leaflet CSS is loaded on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Inject leaflet CSS if not already present
      const id = 'leaflet-css';
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      setMapReady(true);
    }
  }, []);

  // Filter events by type and timeline cutoff
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (eventTypeFilter !== 'all' && e.type !== eventTypeFilter) return false;
      if (new Date(e.date) > timelineCutoff) return false;
      return true;
    });
  }, [allEvents, eventTypeFilter, timelineCutoff]);

  // Timeline bounds
  const timelineBounds = useMemo<{ min: Date; max: Date }>(() => {
    if (allEvents.length === 0) {
      const max = new Date();
      const min = new Date();
      min.setDate(min.getDate() - dateRange);
      return { min, max };
    }
    const dates = allEvents.map((e) => new Date(e.date).getTime());
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates)),
    };
  }, [allEvents, dateRange]);

  // Extract unique countries for filter dropdown
  const availableCountries = useMemo(() => {
    const set = new Set(allEvents.map((e) => e.country));
    return Array.from(set).sort();
  }, [allEvents]);

  if (guardLoading) return <LoadingSkeleton />;
  if (showGuard) return <NoSituationState />;

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/10">
            <MapPin className="h-5 w-5 text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Geospatial Monitor</h1>
            <p className="text-xs text-white/40">
              ACLED conflict event mapping with hotspot analysis
            </p>
          </div>
          {fetchedAt && (
            <span className="ml-auto hidden text-[10px] text-white/25 sm:block">
              Updated {new Date(fetchedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Country filter */}
          <div className="relative">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] pl-3 pr-8 text-xs text-white/80 focus:border-gold-500/40 focus:outline-none"
            >
              <option value="">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-white/30" />
          </div>

          {/* Event type filter */}
          <div className="relative">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as EventType)}
              className="h-9 appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] pl-3 pr-8 text-xs text-white/80 focus:border-gold-500/40 focus:outline-none"
            >
              <option value="all">All Event Types</option>
              {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-white/30" />
          </div>

          {/* Date range */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value) as DateRange)}
              className="h-9 appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] pl-3 pr-8 text-xs text-white/80 focus:border-gold-500/40 focus:outline-none"
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-white/30" />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            {isLoading ? 'Loading…' : 'Refresh Data'}
          </button>

          {isDemo && (
            <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-400">
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-xs text-orange-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Main content: map + sidebar ─────────────────────────────── */}
      <div className="flex gap-4">
        {/* Map */}
        <div className="min-w-0 flex-1">
          <div
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0B1628]"
            style={{ height: '60vh' }}
          >
            {isLoading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-navy-950/70">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
                  <span className="text-xs text-white/50">Loading event data…</span>
                </div>
              </div>
            )}

            {mapReady && (
              <ConflictMap events={filteredEvents} center={mapCenter} />
            )}

            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 z-[500] rounded-xl border border-white/[0.08] bg-[#0F172A]/90 px-3 py-2.5 backdrop-blur-sm">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Event Types
              </p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="text-[10px] text-white/60">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event count badge */}
            <div className="absolute right-4 top-4 z-[500] rounded-lg border border-white/[0.08] bg-[#0F172A]/80 px-2.5 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-medium text-white/70">
                {filteredEvents.length.toLocaleString()} events
              </span>
            </div>
          </div>

          {/* Timeline slider */}
          <div className="mt-3">
            <TimelineSlider
              minDate={timelineBounds.min}
              maxDate={timelineBounds.max}
              value={timelineCutoff}
              onChange={setTimelineCutoff}
            />
          </div>
        </div>

        {/* Hotspot sidebar */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          style={{ maxHeight: 'calc(60vh + 72px)' }}
        >
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : (
            <HotspotPanel hotspots={hotspots} />
          )}
        </div>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <StatsBar events={filteredEvents} hotspots={hotspots} />

      {/* ── Source attribution ───────────────────────────────────────── */}
      <p className="text-[10px] text-white/20">
        Data: ACLED (Armed Conflict Location &amp; Event Data Project) · Map tiles: CartoDB Dark Matter ·
        Clustering: DBSCAN (eps=50km) ·{' '}
        <PraxisLink href="/docs" className="underline hover:text-white/40 transition-colors">
          Methodology
        </PraxisLink>
      </p>
    </div>
  );
}
