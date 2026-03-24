/**
 * Lightweight client-side activity tracking.
 * Stores recent tool visits in localStorage; displayed on the dashboard.
 */

const ACTIVITY_KEY = 'praxis-activity';
const MAX_ACTIVITY = 30;

export interface ActivityEntry {
  tool: string;
  href: string;
  timestamp: string;
  situationId: string;
}

export function recordActivity(entry: Omit<ActivityEntry, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY);
    const entries: ActivityEntry[] = stored ? JSON.parse(stored) : [];
    // Dedupe: skip if same tool+situation visited within the last 5 minutes
    const recent = entries[0];
    if (
      recent &&
      recent.tool === entry.tool &&
      recent.situationId === entry.situationId &&
      Date.now() - new Date(recent.timestamp).getTime() < 5 * 60 * 1000
    ) {
      return;
    }
    entries.unshift({ ...entry, timestamp: new Date().toISOString() });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(entries.slice(0, MAX_ACTIVITY)));
  } catch {
    // localStorage may be unavailable (e.g., private browsing)
  }
}

export function getRecentActivity(situationId: string, limit = 6): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY);
    if (!stored) return [];
    const all: ActivityEntry[] = JSON.parse(stored);
    return all.filter((e) => e.situationId === situationId).slice(0, limit);
  } catch {
    return [];
  }
}
