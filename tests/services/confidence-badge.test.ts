import { describe, it, expect } from 'vitest';
import { normalizeConfidence } from '@/components/praxis/confidence-badge';

describe('normalizeConfidence', () => {
  it('maps recognised lowercase values', () => {
    expect(normalizeConfidence('high')).toBe('high');
    expect(normalizeConfidence('medium')).toBe('medium');
    expect(normalizeConfidence('low')).toBe('low');
  });

  it('lowercases mixed-case input before matching', () => {
    expect(normalizeConfidence('HIGH')).toBe('high');
    expect(normalizeConfidence('Medium')).toBe('medium');
  });

  it('falls through to unknown for unsupported strings', () => {
    expect(normalizeConfidence('strong')).toBe('unknown');
    expect(normalizeConfidence('')).toBe('unknown');
    expect(normalizeConfidence(null as unknown as string)).toBe('unknown');
    expect(normalizeConfidence(undefined as unknown as string)).toBe('unknown');
  });
});
