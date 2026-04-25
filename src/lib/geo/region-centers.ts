/**
 * Best-effort centroid lookup for a free-text region/country string.
 *
 * Used by Geospatial Monitor and any other tool that needs a sensible map
 * center when a Situation has no explicit `geoBoundingBox`. Lat/lng pairs are
 * approximate national/regional centroids — good enough for an initial map
 * view; refined by the actual event data once it loads.
 *
 * Returns `null` when no match found so callers can decide their own default
 * (a wider world view rather than a misleading "Sudan by default").
 */

type LatLng = readonly [number, number];

const NORMALIZED: Record<string, LatLng> = {
  // Africa — Horn / East
  'sudan': [15.5, 30.2],
  'south sudan': [7.86, 29.69],
  'ethiopia': [9.15, 40.49],
  'eritrea': [15.18, 39.78],
  'somalia': [5.15, 46.2],
  'kenya': [-0.02, 37.91],
  'uganda': [1.37, 32.29],
  // Africa — Central
  'drc': [-2.88, 23.66],
  'democratic republic of congo': [-2.88, 23.66],
  'central african republic': [6.61, 20.94],
  'car': [6.61, 20.94],
  // Africa — West / Sahel
  'mali': [17.57, -3.99],
  'burkina faso': [12.24, -1.56],
  'niger': [17.61, 8.08],
  'nigeria': [9.08, 8.68],
  'sahel': [15.5, 0.0],
  // Africa — North
  'libya': [26.34, 17.23],
  'egypt': [26.82, 30.8],
  'tunisia': [33.89, 9.54],
  'algeria': [28.03, 1.66],
  // Middle East
  'yemen': [15.55, 48.52],
  'syria': [34.8, 38.99],
  'iraq': [33.22, 43.68],
  'iran': [32.43, 53.69],
  'lebanon': [33.85, 35.86],
  'palestine': [31.95, 35.23],
  'israel': [31.05, 34.85],
  'gaza': [31.5, 34.45],
  'west bank': [32.0, 35.25],
  'jordan': [30.59, 36.24],
  // Caucasus / Eastern Europe
  'ukraine': [48.38, 31.17],
  'russia': [61.52, 105.32],
  'georgia': [42.32, 43.36],
  'armenia': [40.07, 45.04],
  'azerbaijan': [40.14, 47.58],
  'belarus': [53.71, 27.95],
  'moldova': [47.41, 28.37],
  // Balkans
  'bosnia': [43.92, 17.68],
  'kosovo': [42.6, 20.9],
  'serbia': [44.02, 21.0],
  // Asia
  'afghanistan': [33.94, 67.71],
  'pakistan': [30.38, 69.35],
  'india': [20.59, 78.96],
  'myanmar': [21.92, 95.96],
  'burma': [21.92, 95.96],
  'thailand': [15.87, 100.99],
  'philippines': [12.88, 121.77],
  'indonesia': [-0.79, 113.92],
  'china': [35.86, 104.2],
  // Latin America
  'colombia': [4.57, -74.3],
  'venezuela': [6.42, -66.59],
  'haiti': [18.97, -72.29],
  'mexico': [23.63, -102.55],
  'el salvador': [13.79, -88.9],
  'honduras': [15.2, -86.24],
  'guatemala': [15.78, -90.23],
  // Demo placeholder
  'east asia (fictional)': [35.0, 120.0],
  'nordalia': [35.0, 120.0],
};

const ALIASES: Record<string, string> = {
  'congo (drc)': 'drc',
  'congo, drc': 'drc',
  'congo': 'drc',
  'kinshasa': 'drc',
  'rdc': 'drc',
  'sahel region': 'sahel',
  'gulf of aden': 'yemen',
  'horn of africa': 'somalia',
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '');
}

export function regionCenter(region: string | null | undefined): LatLng | null {
  if (!region) return null;
  const norm = normalize(region);
  if (norm in NORMALIZED) return NORMALIZED[norm];
  if (norm in ALIASES) return NORMALIZED[ALIASES[norm]] ?? null;

  // Token-by-token: match on the first token that is a known country.
  for (const tok of norm.split(/[\s/-]+/)) {
    if (tok in NORMALIZED) return NORMALIZED[tok];
    if (tok in ALIASES) return NORMALIZED[ALIASES[tok]] ?? null;
  }

  return null;
}

/** Wide default for when nothing matches — Africa / Middle East focal area. */
export const DEFAULT_WORLD_CENTER: LatLng = [10, 30];
