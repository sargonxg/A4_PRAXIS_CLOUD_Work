import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek as dateFnsIsThisWeek } from 'date-fns';

/**
 * Format date in diplomatic style: "2 March 2026"
 */
export function formatDiplomaticDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMMM yyyy');
}

/**
 * Format date as short: "28 Feb"
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM');
}

/**
 * Format date as ISO short: "2026-03-02"
 */
export function formatISODate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Format relative time: "2 hours ago", "Yesterday", etc.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }

  if (isYesterday(d)) {
    return 'Yesterday';
  }

  return formatDiplomaticDate(d);
}

/**
 * Get time-of-day greeting
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format word count with commas
 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Format file size in human-readable form
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format a date range: "1–15 March 2026" or "28 February – 5 March 2026"
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  if (format(s, 'MMMM yyyy') === format(e, 'MMMM yyyy')) {
    return `${format(s, 'd')}–${format(e, 'd MMMM yyyy')}`;
  }
  return `${format(s, 'd MMMM')} – ${format(e, 'd MMMM yyyy')}`;
}

/**
 * Returns true if the date falls within the current week (Mon–Sun)
 */
export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFnsIsThisWeek(d, { weekStartsOn: 1 });
}

/**
 * Returns true if the date is today
 */
export { isToday };
