import { describe, it, expect } from 'vitest';
import { __test__ } from '@/lib/dev-backlog/service';

const { computeDedupeKey, normalizeMessage, severityHigher, ttlDateFor, capString, clamp } = __test__;

describe('dev-backlog/normalizeMessage', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeMessage('  HELLO   World  ')).toBe('hello world');
  });

  it('strips long hex ids', () => {
    expect(normalizeMessage('error in run abc123def456 stack')).toBe('error in run <id> stack');
  });

  it('strips long numeric ids', () => {
    expect(normalizeMessage('exit code 1234567 fail')).toBe('exit code <n> fail');
  });

  it('handles empty/null safely', () => {
    expect(normalizeMessage('')).toBe('');
    expect(normalizeMessage(undefined as unknown as string)).toBe('');
  });
});

describe('dev-backlog/computeDedupeKey', () => {
  it('returns the same key for two near-identical errors with different dynamic hex ids', () => {
    // The normalizer strips long hex blocks ([0-9a-f]{8+}) and long
    // numeric blocks. Two errors that differ ONLY in those dynamic
    // segments must collapse to the same dedupe key.
    const a = computeDedupeKey({
      kind: 'error.route',
      severity: 'high',
      message: 'failed in tool_run abc123def456 status=12345',
      toolId: 'risk-monitor',
      route: '/api/ai/risk-assessment',
      httpStatus: 503,
    });
    const b = computeDedupeKey({
      kind: 'error.route',
      severity: 'critical',  // severity does NOT participate in dedupe
      message: 'failed in tool_run aabbccdd11223344 status=99999',
      toolId: 'risk-monitor',
      route: '/api/ai/risk-assessment',
      httpStatus: 503,
    });
    expect(a).toBe(b);
  });

  it('returns a different key when toolId differs', () => {
    const a = computeDedupeKey({
      kind: 'error.route',
      severity: 'high',
      message: 'something',
      toolId: 'risk-monitor',
    });
    const b = computeDedupeKey({
      kind: 'error.route',
      severity: 'high',
      message: 'something',
      toolId: 'briefing-room',
    });
    expect(a).not.toBe(b);
  });

  it('returns a different key when route differs', () => {
    const a = computeDedupeKey({ kind: 'error.route', severity: 'high', message: 'x', route: '/a' });
    const b = computeDedupeKey({ kind: 'error.route', severity: 'high', message: 'x', route: '/b' });
    expect(a).not.toBe(b);
  });

  it('produces a 24-char hex key', () => {
    const key = computeDedupeKey({ kind: 'error.route', severity: 'high', message: 'x' });
    expect(key).toMatch(/^[0-9a-f]{24}$/);
  });
});

describe('dev-backlog/severityHigher', () => {
  it('returns the higher severity (lower order index)', () => {
    expect(severityHigher('low', 'critical')).toBe('critical');
    expect(severityHigher('critical', 'low')).toBe('critical');
    expect(severityHigher('medium', 'medium')).toBe('medium');
  });

  it('returns the new severity when none stored yet', () => {
    expect(severityHigher(undefined, 'high')).toBe('high');
  });
});

describe('dev-backlog/ttlDateFor', () => {
  it('uses 365 days for critical/high', () => {
    const now = new Date('2026-04-26T00:00:00Z');
    const ttl = ttlDateFor('critical', now);
    const days = Math.round((ttl.getTime() - now.getTime()) / 86_400_000);
    expect(days).toBe(365);
    expect(Math.round((ttlDateFor('high', now).getTime() - now.getTime()) / 86_400_000)).toBe(365);
  });

  it('uses 90 days for medium/low', () => {
    const now = new Date('2026-04-26T00:00:00Z');
    expect(Math.round((ttlDateFor('medium', now).getTime() - now.getTime()) / 86_400_000)).toBe(90);
    expect(Math.round((ttlDateFor('low', now).getTime() - now.getTime()) / 86_400_000)).toBe(90);
  });

  it('uses 30 days for info', () => {
    const now = new Date('2026-04-26T00:00:00Z');
    expect(Math.round((ttlDateFor('info', now).getTime() - now.getTime()) / 86_400_000)).toBe(30);
  });
});

describe('dev-backlog/capString', () => {
  it('caps long strings with ellipsis', () => {
    const out = capString('a'.repeat(100), 10);
    expect(out.length).toBe(10);
    expect(out.endsWith('…')).toBe(true);
  });

  it('returns the input unchanged when under cap', () => {
    expect(capString('short', 10)).toBe('short');
  });

  it('handles empty/null safely', () => {
    expect(capString('', 10)).toBe('');
  });
});

describe('dev-backlog/clamp', () => {
  it('clamps to range', () => {
    expect(clamp(0, 1, 200)).toBe(1);
    expect(clamp(500, 1, 200)).toBe(200);
    expect(clamp(50, 1, 200)).toBe(50);
  });

  it('treats non-finite as the lower bound', () => {
    expect(clamp(NaN, 1, 200)).toBe(1);
    expect(clamp(Infinity, 1, 200)).toBe(1);
  });
});
