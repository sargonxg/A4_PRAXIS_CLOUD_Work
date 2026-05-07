/**
 * Geospatial Engine - Conflict event clustering and movement analysis
 *
 * Provides DBSCAN-based hotspot clustering, geographic spread scoring,
 * and movement detection for conflict event datasets.
 *
 * No external dependencies — uses pure TypeScript arithmetic.
 */

import type { ConflictEvent } from '@/lib/data-feeds/conflict-events';

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface HotspotCluster {
  centroid: { lat: number; lng: number };
  radius_km: number;
  eventCount: number;
  fatalities: number;
  dominantEventType: string;
  actors: string[];
  trend: 'expanding' | 'stable' | 'contracting';
  admin1: string;
}

export interface MovementDetection {
  direction: 'north' | 'south' | 'east' | 'west' | 'static';
  distanceKm: number;
  daysSpan: number;
}

// ---------------------------------------------------------------------------
// Core math
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine great-circle distance between two coordinates, in kilometres.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function hasValidCoordinates(e: ConflictEvent): boolean {
  // Reject (0, 0) and missing values
  return (
    typeof e.latitude === 'number' &&
    typeof e.longitude === 'number' &&
    !(e.latitude === 0 && e.longitude === 0) &&
    !isNaN(e.latitude) &&
    !isNaN(e.longitude)
  );
}

function computeCentroid(events: ConflictEvent[]): { lat: number; lng: number } {
  const lat = events.reduce((s, e) => s + e.latitude, 0) / events.length;
  const lng = events.reduce((s, e) => s + e.longitude, 0) / events.length;
  return { lat, lng };
}

function computeRadius(events: ConflictEvent[], centroid: { lat: number; lng: number }): number {
  if (events.length <= 1) return 0;
  return Math.max(...events.map((e) => haversineDistance(centroid.lat, centroid.lng, e.latitude, e.longitude)));
}

function mostFrequent(values: string[]): string {
  if (values.length === 0) return '';
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = '';
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) { bestCount = c; best = v; }
  }
  return best;
}

function uniqueActors(events: ConflictEvent[]): string[] {
  const set = new Set<string>();
  for (const e of events) {
    if (e.actor1) set.add(e.actor1);
    if (e.actor2) set.add(e.actor2);
  }
  return Array.from(set).filter(Boolean);
}

function daysBefore(days: number): Date {
  return new Date(Date.now() - days * 86400000);
}

/**
 * Compute trend for a cluster: compares event density in the most recent
 * 7-day window vs. the 7–14-day window before that.
 *
 * - >25% more events recently → expanding
 * - >25% fewer events recently → contracting
 * - otherwise → stable
 */
function computeTrend(events: ConflictEvent[]): 'expanding' | 'stable' | 'contracting' {
  const now = Date.now();
  const week1Start = daysBefore(7).getTime();
  const week2Start = daysBefore(14).getTime();

  const recent = events.filter((e) => {
    const t = new Date(e.event_date).getTime();
    return t >= week1Start && t <= now;
  }).length;

  const prior = events.filter((e) => {
    const t = new Date(e.event_date).getTime();
    return t >= week2Start && t < week1Start;
  }).length;

  if (prior === 0 && recent === 0) return 'stable';
  if (prior === 0) return 'expanding';
  const ratio = recent / prior;
  if (ratio > 1.25) return 'expanding';
  if (ratio < 0.75) return 'contracting';
  return 'stable';
}

// ---------------------------------------------------------------------------
// DBSCAN clustering
// ---------------------------------------------------------------------------

const UNVISITED = -1;
const NOISE = 0;

/**
 * DBSCAN clustering of conflict events by geographic proximity.
 *
 * Uses an iterative (queue-based) expansion to avoid call-stack limits on
 * large datasets. Events without valid coordinates are silently skipped.
 *
 * @param events    Array of conflict events to cluster
 * @param eps_km    Neighbourhood radius in kilometres (default 50)
 * @param minPoints Minimum points to form a cluster core (default 3)
 */
export function clusterEvents(
  events: ConflictEvent[],
  eps_km = 50,
  minPoints = 3,
): HotspotCluster[] {
  // Filter to events with valid coordinates
  const valid = events.filter(hasValidCoordinates);
  if (valid.length === 0) return [];

  const n = valid.length;
  const labels = new Array<number>(n).fill(UNVISITED);
  let clusterIndex = 0;

  // Precompute neighbour lists to avoid O(n²) repeated distance calls
  // For large n this is still O(n²) but done once
  const neighbours: number[][] = new Array(n);
  for (let i = 0; i < n; i++) {
    neighbours[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (haversineDistance(valid[i].latitude, valid[i].longitude, valid[j].latitude, valid[j].longitude) <= eps_km) {
        neighbours[i].push(j);
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (labels[i] !== UNVISITED) continue;

    if (neighbours[i].length < minPoints - 1) {
      // -1 because the point itself is not in its own neighbours list
      labels[i] = NOISE;
      continue;
    }

    clusterIndex++;
    labels[i] = clusterIndex;

    // Iterative BFS expansion
    const queue = [...neighbours[i]];
    const inQueue = new Set<number>(queue);

    while (queue.length > 0) {
      const q = queue.shift()!;

      if (labels[q] === NOISE) {
        labels[q] = clusterIndex; // border point, add to cluster
        continue;
      }
      if (labels[q] !== UNVISITED) continue;

      labels[q] = clusterIndex;

      if (neighbours[q].length >= minPoints - 1) {
        for (const nb of neighbours[q]) {
          if (!inQueue.has(nb) && labels[nb] === UNVISITED) {
            queue.push(nb);
            inQueue.add(nb);
          }
        }
      }
    }
  }

  // Collect events by cluster
  const clusterMap = new Map<number, ConflictEvent[]>();
  for (let i = 0; i < n; i++) {
    const label = labels[i];
    if (label <= 0) continue; // skip noise
    const bucket = clusterMap.get(label) ?? [];
    bucket.push(valid[i]);
    clusterMap.set(label, bucket);
  }

  // Build HotspotCluster descriptors
  const clusters: HotspotCluster[] = [];
  for (const clusterEvents of clusterMap.values()) {
    const centroid = computeCentroid(clusterEvents);
    const radius_km = computeRadius(clusterEvents, centroid);
    const fatalities = clusterEvents.reduce((s, e) => s + (e.fatalities ?? 0), 0);
    const dominantEventType = mostFrequent(clusterEvents.map((e) => e.event_type));
    const actors = uniqueActors(clusterEvents);
    const trend = computeTrend(clusterEvents);
    const admin1 = mostFrequent(clusterEvents.map((e) => e.admin1).filter((value): value is string => Boolean(value)));

    clusters.push({
      centroid,
      radius_km: Math.round(radius_km * 10) / 10,
      eventCount: clusterEvents.length,
      fatalities,
      dominantEventType,
      actors,
      trend,
      admin1,
    });
  }

  // Sort by event count descending
  clusters.sort((a, b) => b.eventCount - a.eventCount);
  return clusters;
}

// ---------------------------------------------------------------------------
// Geographic spread index
// ---------------------------------------------------------------------------

// Approximate area of a bounding box covering the entire conflict-prone world
// (roughly -60°S to 75°N, -180° to 180°) used as the normalization ceiling.
// In practice any single-country conflict spans far less — this gives a 0–100 scale.
const NORMALIZATION_AREA_DEG2 = 135 * 360; // 48600 deg²

/**
 * Geographic Spread Index — 0 to 100.
 *
 * Computes the bounding box of all valid-coordinate events and normalises
 * its area against a reference global area. A score of 100 means conflict
 * events span the widest possible geographic range; 0 means a single point.
 */
export function geographicSpreadIndex(events: ConflictEvent[]): number {
  const valid = events.filter(hasValidCoordinates);
  if (valid.length < 2) return 0;

  const lats = valid.map((e) => e.latitude);
  const lngs = valid.map((e) => e.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const area = latSpan * lngSpan;

  if (area === 0) return 0;

  const score = Math.min(100, (area / NORMALIZATION_AREA_DEG2) * 100);
  return Math.round(score * 10) / 10;
}

// ---------------------------------------------------------------------------
// Movement detection
// ---------------------------------------------------------------------------

/**
 * Detect if the conflict is moving geographically.
 *
 * Compares the centroid of events in the last 7 days vs. events in the
 * 7–14 day window before that. Returns direction based on the dominant
 * lat/lng delta, total distance, and the days span (always 7).
 */
export function detectMovement(events: ConflictEvent[]): MovementDetection {
  const valid = events.filter(hasValidCoordinates);

  const now = Date.now();
  const week1Start = daysBefore(7).getTime();
  const week2Start = daysBefore(14).getTime();

  const recent = valid.filter((e) => {
    const t = new Date(e.event_date).getTime();
    return t >= week1Start && t <= now;
  });

  const prior = valid.filter((e) => {
    const t = new Date(e.event_date).getTime();
    return t >= week2Start && t < week1Start;
  });

  if (recent.length === 0 || prior.length === 0) {
    return { direction: 'static', distanceKm: 0, daysSpan: 7 };
  }

  const recentCentroid = computeCentroid(recent);
  const priorCentroid = computeCentroid(prior);

  const distanceKm = haversineDistance(
    priorCentroid.lat,
    priorCentroid.lng,
    recentCentroid.lat,
    recentCentroid.lng,
  );

  // Threshold: less than 5 km movement is considered static
  if (distanceKm < 5) {
    return { direction: 'static', distanceKm: Math.round(distanceKm * 10) / 10, daysSpan: 7 };
  }

  const dLat = recentCentroid.lat - priorCentroid.lat;
  const dLng = recentCentroid.lng - priorCentroid.lng;

  let direction: MovementDetection['direction'];
  if (Math.abs(dLat) >= Math.abs(dLng)) {
    direction = dLat >= 0 ? 'north' : 'south';
  } else {
    direction = dLng >= 0 ? 'east' : 'west';
  }

  return {
    direction,
    distanceKm: Math.round(distanceKm * 10) / 10,
    daysSpan: 7,
  };
}
