import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

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
