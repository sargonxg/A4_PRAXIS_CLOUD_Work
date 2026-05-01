import { describe, expect, it } from 'vitest';
import { rollupConfidence } from '@/lib/tools/evidence-summary';

describe('rollupConfidence', () => {
  it('returns unknown when no usable confidence votes exist', () => {
    expect(rollupConfidence([])).toBe('unknown');
    expect(rollupConfidence(['unknown', undefined, null])).toBe('unknown');
  });

  it('returns high only when high confidence dominates without low confidence', () => {
    expect(rollupConfidence(['high', 'high', 'medium'])).toBe('high');
    expect(rollupConfidence(['high', 'medium', 'medium'])).toBe('medium');
  });

  it('returns low when low confidence is the majority', () => {
    expect(rollupConfidence(['low', 'low', 'high'])).toBe('low');
  });

  it('keeps mixed expert deliberation at medium confidence', () => {
    expect(rollupConfidence(['high', 'medium', 'low', 'medium'])).toBe('medium');
  });
});
