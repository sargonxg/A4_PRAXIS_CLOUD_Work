'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

/**
 * Intelligence Map — event + actor dots over a basemap.
 *
 * Uses Google Maps JavaScript API when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is
 * configured (preferred for the "intelligence-agency" aesthetic with a dark
 * style + clustering + satellite toggle). Falls back to an in-process SVG
 * scatter + minimap if the key is absent so the free tier still renders
 * *something* instead of a blank rectangle.
 *
 * The component is framework-agnostic beyond React: it does not depend on
 * react-leaflet or @vis.gl/react-google-maps so the bundle stays lean.
 */

export interface IntelligenceMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  kind?: 'event' | 'actor' | 'location' | 'institution';
  date?: string;
}

export interface IntelligenceMapProps {
  markers: IntelligenceMapMarker[];
  height?: number | string;
  /** Optional default viewport if markers are empty. */
  center?: { lat: number; lng: number; zoom?: number };
  /** Called when the user clicks a marker. */
  onSelect?: (marker: IntelligenceMapMarker) => void;
}

const SEVERITY_COLORS: Record<NonNullable<IntelligenceMapMarker['severity']>, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
};

const KIND_COLORS: Record<NonNullable<IntelligenceMapMarker['kind']>, string> = {
  event: '#ef4444',
  actor: '#4E79A7',
  location: '#76B7B2',
  institution: '#9C755F',
};

function colorFor(m: IntelligenceMapMarker): string {
  if (m.severity) return SEVERITY_COLORS[m.severity];
  if (m.kind) return KIND_COLORS[m.kind];
  return '#64748b';
}

// ───────────────────────────────────────────────────────────────────────────
// Google Maps loader (singleton, dedup across component instances)
// ───────────────────────────────────────────────────────────────────────────
// Minimal inline types so we don't require @types/google.maps as a dependency.
type GMap = {
  fitBounds: (bounds: GBounds, padding?: number) => void;
};
type GBounds = { extend: (p: { lat: number; lng: number }) => void };
type GMarker = { setMap: (m: GMap | null) => void; addListener: (ev: string, cb: () => void) => void };
type GInfoWindow = { open: (opts: { anchor: GMarker; map: GMap }) => void };

interface GoogleMapsNamespace {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
  Marker: new (opts: Record<string, unknown>) => GMarker;
  InfoWindow: new (opts: { content: string }) => GInfoWindow;
  LatLngBounds: new () => GBounds;
  SymbolPath: { CIRCLE: number };
  MapTypeStyle?: unknown;
}

declare global {
  interface Window {
    google?: { maps: GoogleMapsNamespace };
    __praxisGoogleMapsLoader?: Promise<void>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__praxisGoogleMapsLoader) return window.__praxisGoogleMapsLoader;

  window.__praxisGoogleMapsLoader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps JS API'));
    document.head.appendChild(script);
  });
  return window.__praxisGoogleMapsLoader;
}

const INTEL_DARK_STYLE: Array<Record<string, unknown>> = [
  { elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1220' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020617' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
];

// ───────────────────────────────────────────────────────────────────────────
// Main component
// ───────────────────────────────────────────────────────────────────────────
export function IntelligenceMap({ markers, height = 420, center, onSelect }: IntelligenceMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GMap | null>(null);
  const markerInstances = useRef<GMarker[]>([]);

  const effectiveCenter = useMemo(() => {
    if (center) return center;
    if (markers.length === 0) return { lat: 20, lng: 0, zoom: 2 };
    const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    return { lat, lng, zoom: markers.length === 1 ? 6 : 4 };
  }, [center, markers]);

  // Load Google Maps script when we have a key.
  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Initialise the map once ready.
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return;
    mapInstance.current = new window.google!.maps.Map(mapRef.current, {
      center: { lat: effectiveCenter.lat, lng: effectiveCenter.lng },
      zoom: effectiveCenter.zoom ?? 4,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: false,
      styles: INTEL_DARK_STYLE,
      backgroundColor: '#0b1220',
    });
  }, [ready, effectiveCenter]);

  // Plot / replot markers when the dataset changes.
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    for (const m of markerInstances.current) m.setMap(null);
    markerInstances.current = [];

    for (const m of markers) {
      const color = colorFor(m);
      const marker = new window.google!.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: mapInstance.current,
        title: m.title,
        icon: {
          path: window.google!.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.85,
          strokeColor: '#0b1220',
          strokeWeight: 1.5,
          scale: m.severity === 'critical' ? 9 : m.severity === 'high' ? 7 : 5,
        },
      });
      const info = new window.google!.maps.InfoWindow({
        content: `
          <div style="font-family: system-ui; color: #0f172a; max-width: 260px;">
            <div style="font-weight: 600; font-size: 13px; color: ${color};">${escapeHtml(m.title)}</div>
            ${m.date ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(m.date)}</div>` : ''}
            ${m.description ? `<div style="font-size: 12px; margin-top: 6px;">${escapeHtml(m.description.slice(0, 320))}</div>` : ''}
          </div>
        `,
      });
      marker.addListener('click', () => {
        info.open({ anchor: marker, map: mapInstance.current! });
        onSelect?.(m);
      });
      markerInstances.current.push(marker);
    }

    if (markers.length > 1) {
      const bounds = new window.google!.maps.LatLngBounds();
      for (const m of markers) bounds.extend({ lat: m.lat, lng: m.lng });
      mapInstance.current.fitBounds(bounds, 32);
    }
  }, [ready, markers, onSelect]);

  if (!apiKey) return <SvgFallback markers={markers} height={height} />;
  if (loadError) return <ErrorState height={height} message={loadError} />;

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height, width: '100%', borderRadius: 8, overflow: 'hidden', background: '#0b1220' }} />
      {!ready && (
        <div
          style={{ height }}
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/60 text-xs text-slate-400"
        >
          <MapPin className="mr-2 h-4 w-4 animate-pulse" /> Loading Google Maps…
        </div>
      )}
    </div>
  );
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// ───────────────────────────────────────────────────────────────────────────
// SVG fallback — free tier, no Maps key configured.
// Renders a world-map-agnostic scatter so events still show up spatially.
// ───────────────────────────────────────────────────────────────────────────
function SvgFallback({ markers, height }: { markers: IntelligenceMapMarker[]; height: number | string }) {
  const width = 800;
  const h = typeof height === 'number' ? height : 420;

  const projected = markers.map((m) => ({
    ...m,
    x: ((m.lng + 180) / 360) * width,
    y: ((90 - m.lat) / 180) * h,
  }));

  return (
    <div
      className="rounded-lg border border-slate-800 bg-slate-950/40"
      style={{ height: h, width: '100%', position: 'relative' }}
    >
      <div className="absolute left-3 top-3 z-10 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
        Free-tier scatter · configure <code className="rounded bg-slate-800 px-1 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for full map
      </div>
      <svg viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
        <rect width={width} height={h} fill="#0b1220" />
        {/* Simple equirectangular gridlines */}
        {[-60, -30, 0, 30, 60].map((lat) => (
          <line key={`lat${lat}`} x1={0} x2={width} y1={((90 - lat) / 180) * h} y2={((90 - lat) / 180) * h} stroke="#1e293b" strokeWidth={0.5} />
        ))}
        {[-120, -60, 0, 60, 120].map((lng) => (
          <line key={`lng${lng}`} y1={0} y2={h} x1={((lng + 180) / 360) * width} x2={((lng + 180) / 360) * width} stroke="#1e293b" strokeWidth={0.5} />
        ))}
        {projected.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={p.severity === 'critical' ? 5 : 3.5} fill={colorFor(p)} opacity={0.9} />
            <title>{p.title}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ErrorState({ height, message }: { height: number | string; message: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-red-900/40 bg-red-950/30 text-sm text-red-200"
      style={{ height, width: '100%' }}
    >
      Map failed to load: {message}
    </div>
  );
}
