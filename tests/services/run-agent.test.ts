import { describe, it, expect } from 'vitest';
import { __test__, AgentRunnerError } from '@/lib/agents/run-agent';
import { AGENT_REGISTRY } from '@/lib/agents/registry';

const { formatPersonaBlock, formatCalibrationBlock, formatCorpusBlock, clamp } = __test__;

describe('run-agent/clamp', () => {
  it('clamps values to the requested range', () => {
    expect(clamp(50, 0, 24)).toBe(24);
    expect(clamp(-10, 0, 24)).toBe(0);
    expect(clamp(12, 0, 24)).toBe(12);
  });

  it('treats non-finite as the lower bound (NaN and Infinity both fall to lo)', () => {
    expect(clamp(NaN, 0, 24)).toBe(0);
    expect(clamp(Infinity, 0, 24)).toBe(0);
    expect(clamp(-Infinity, 0, 24)).toBe(0);
  });
});

describe('run-agent/formatPersonaBlock', () => {
  it('includes role, rolePrompt, frameworks, and handoff tools', () => {
    const block = formatPersonaBlock(AGENT_REGISTRY.mediator);
    expect(block).toMatch(/YOUR ROLE: Mediator/);
    expect(block).toMatch(/Berghof Process Design/);
    expect(block).toMatch(/negotiation-prep, mediation-design, concordia/);
  });

  it('omits handoff line when persona has no handoff tools', () => {
    const block = formatPersonaBlock(AGENT_REGISTRY['synthesis-chair']);
    expect(block).toMatch(/YOUR ROLE: Synthesis Chair/);
    expect(block).not.toMatch(/prefer these PRAXIS tools/);
  });
});

describe('run-agent/formatCalibrationBlock', () => {
  it('appends RESPOND IN directive for non-English language', () => {
    const block = formatCalibrationBlock({
      systemPromptBlock: '<analyst-profile>...</analyst-profile>',
      outputConstraints: { language: 'fr', redLineClauses: [] },
      provenance: { profileVersion: 1 },
      domain: undefined as never,
    } as never);
    expect(block).toMatch(/RESPOND IN: FR/);
  });

  it('renders red lines when present', () => {
    const block = formatCalibrationBlock({
      systemPromptBlock: '<analyst-profile/>',
      outputConstraints: { language: 'en', redLineClauses: ['no targeting advice'] },
      provenance: { profileVersion: 1 },
      domain: undefined as never,
    } as never);
    expect(block).toMatch(/RED LINES — DO NOT:/);
    expect(block).toMatch(/no targeting advice/);
  });

  it('emits neither directive for English with no red lines', () => {
    const block = formatCalibrationBlock({
      systemPromptBlock: '<analyst-profile/>',
      outputConstraints: { language: 'en', redLineClauses: [] },
      provenance: { profileVersion: 1 },
      domain: undefined as never,
    } as never);
    expect(block).not.toMatch(/RESPOND IN/);
    expect(block).not.toMatch(/RED LINES/);
  });
});

describe('run-agent/formatCorpusBlock', () => {
  it('returns an explicit "no evidence" instruction when empty', () => {
    const block = formatCorpusBlock([]);
    expect(block).toMatch(/No evidence items in scope/);
    expect(block).toMatch(/intelligence gaps/);
  });

  it('numbers each corpus item with [#n] and includes citation + confidence', () => {
    const block = formatCorpusBlock([
      {
        sourceType: 'argus',
        sourceId: 'argus#alert#1',
        title: 'Buffer-zone violation',
        excerpt: 'Two convoys denied access at Kessara.',
        citation: 'users/u/situations/s/tool-data/argus',
        confidence: 'medium',
        freshness: '2026-04-26T00:00:00Z',
        reason: 'matches query',
        score: 1,
      },
    ]);
    expect(block).toMatch(/\[#1\]/);
    expect(block).toMatch(/Buffer-zone violation/);
    expect(block).toMatch(/citation=users\/u\/situations\/s\/tool-data\/argus/);
    expect(block).toMatch(/confidence=medium/);
    expect(block).toMatch(/freshness=2026-04-26/);
  });
});

describe('AgentRunnerError', () => {
  it('preserves the error code field', () => {
    const err = new AgentRunnerError('persona X', 'unknown-persona');
    expect(err.code).toBe('unknown-persona');
    expect(err.message).toContain('persona X');
    expect(err.name).toBe('AgentRunnerError');
  });
});
