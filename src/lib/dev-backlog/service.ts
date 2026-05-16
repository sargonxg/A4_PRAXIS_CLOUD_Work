import { createHash } from 'node:crypto';

export type BacklogSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface BacklogEntryInput {
  [key: string]: unknown;
  kind?: string;
  severity?: BacklogSeverity;
  message?: string;
  toolId?: string;
  route?: string;
  httpStatus?: number;
}

export function normalizeMessage(message: string | undefined): string {
  return (message ?? '').toLowerCase().replace(/\b[0-9a-f]{8,}\b/g, '<id>').replace(/\b\d{5,}\b/g, '<n>').replace(/\s+/g, ' ').trim();
}

export function computeDedupeKey(input: BacklogEntryInput): string {
  return createHash('sha256').update([input.kind ?? '', normalizeMessage(input.message), input.toolId ?? '', input.route ?? '', input.httpStatus ?? ''].join('|')).digest('hex').slice(0, 24);
}

export function severityHigher(current: BacklogSeverity | undefined, next: BacklogSeverity): BacklogSeverity {
  const order: BacklogSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  if (!current) return next;
  return order.indexOf(next) < order.indexOf(current) ? next : current;
}

export function ttlDateFor(severity: BacklogSeverity, now = new Date()): Date {
  const days = severity === 'critical' || severity === 'high' ? 365 : severity === 'info' ? 30 : 90;
  return new Date(now.getTime() + days * 86_400_000);
}

export function capString(value: string | undefined, max: number): string {
  const text = value ?? '';
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export async function publishBacklogEntry(input: BacklogEntryInput): Promise<{ id: string; dedupeKey: string }> {
  const dedupeKey = computeDedupeKey(input);
  return { id: `backlog_${dedupeKey}`, dedupeKey };
}

export const __test__ = { computeDedupeKey, normalizeMessage, severityHigher, ttlDateFor, capString, clamp };
