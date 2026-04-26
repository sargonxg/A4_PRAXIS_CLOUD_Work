import { describe, expect, it } from 'vitest';
import { __test__ } from '@/lib/argus/corpus-context';

describe('ARGUS corpus formatting', () => {
  it('formats alerts and watch items for Ask PRAXIS injection', () => {
    const text = __test__.formatArgusData({
      overallThreatLevel: 'elevated',
      alerts: [
        {
          title: 'Ceasefire monitoring deadline',
          severity: 'high',
          signal: 'JCMC deadline expires in 48 hours',
          evidence: 'UN mission note',
          source: 'UN News',
        },
      ],
      watchItems: ['Security Council consultations', 'Humanitarian access corridor'],
    });

    expect(text).toContain('Overall threat level: elevated');
    expect(text).toContain('[high] Ceasefire monitoring deadline');
    expect(text).toContain('Security Council consultations');
  });

  it('formats saved sources with reliability when available', () => {
    const text = __test__.formatSourcesLibrary([
      { name: 'UN News', url: 'https://news.un.org', reliability: 9 },
      { title: 'ReliefWeb', domain: 'reliefweb.int' },
    ]);

    expect(text).toContain('UN News — https://news.un.org reliability 9/10');
    expect(text).toContain('ReliefWeb — reliefweb.int');
  });
});
