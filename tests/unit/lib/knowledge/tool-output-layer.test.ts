import { describe, expect, it } from 'vitest';
import { __test__ } from '@/lib/knowledge/tool-output-layer';

describe('ToolOutputLayer helpers', () => {
  it('builds canonical and legacy candidates for related tool lookup', () => {
    expect(__test__.candidateToolIds('risk-monitor')).toEqual([
      'risk-monitor',
      'risk_monitor',
      'risk_assessment',
    ]);

    expect(__test__.candidateToolIds('commitment_scan')).toEqual([
      'commitment_scan',
      'commitments',
    ]);
  });

  it('normalizes both versioned tool-data and saveToolOutput tool docs', () => {
    expect(__test__.normalizeToolDoc({
      data: { headline: 'Versioned output' },
      generatedAt: '2026-04-28T12:00:00.000Z',
      version: 5,
    })).toEqual({
      data: { headline: 'Versioned output' },
      generatedAt: '2026-04-28T12:00:00.000Z',
      version: 5,
    });

    expect(__test__.normalizeToolDoc({
      output: { summary: 'Legacy output' },
      generatedAt: { seconds: 1777384800 },
    })).toEqual({
      data: { summary: 'Legacy output' },
      generatedAt: '2026-04-28T14:00:00.000Z',
      version: 1,
    });
  });
});
