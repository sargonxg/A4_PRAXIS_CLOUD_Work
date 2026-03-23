/**
 * GDELT Stability Dashboard API
 * Free, no key required
 */

const STABILITY_BASE = 'https://api.gdeltproject.org/api/v1/dash_stabilitytimeline/dash_stabilitytimeline';

export interface StabilityPoint {
  date: string;
  value: number;
}

export async function getStabilityTimeline(countryCode: string, options?: {
  variable?: 'instability' | 'conflict' | 'protest' | 'tone';
  numDays?: number;
}): Promise<StabilityPoint[]> {
  const variable = options?.variable || 'instability';
  const numDays = options?.numDays || 30;

  try {
    const params = new URLSearchParams({
      COUNTRY: countryCode,
      VARIABLE: variable,
      NUMDAYS: String(numDays),
      OUTPUT: 'json',
    });
    const res = await fetch(`${STABILITY_BASE}?${params}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((d: { date: string; value: number }) => ({
      date: d.date,
      value: d.value,
    }));
  } catch {
    return [];
  }
}

export async function getCurrentStability(countryCode: string): Promise<{
  score: number;
  trend: 'improving' | 'stable' | 'worsening';
  recent7d: number;
  baseline30d: number;
} | null> {
  const timeline = await getStabilityTimeline(countryCode, { numDays: 30 });
  if (timeline.length < 7) return null;

  const recent = timeline.slice(-7);
  const baseline = timeline.slice(0, -7);

  const recentAvg = recent.reduce((s, p) => s + p.value, 0) / recent.length;
  const baselineAvg = baseline.length > 0 ? baseline.reduce((s, p) => s + p.value, 0) / baseline.length : recentAvg;

  const ratio = baselineAvg > 0 ? recentAvg / baselineAvg : 1;
  const trend = ratio > 1.15 ? 'worsening' : ratio < 0.85 ? 'improving' : 'stable';

  return { score: Math.round(recentAvg * 100) / 100, trend, recent7d: Math.round(recentAvg * 100) / 100, baseline30d: Math.round(baselineAvg * 100) / 100 };
}
