import { describe, expect, it } from 'vitest';
import {
  canonicalToolId,
  evidenceEnvelopeToCorpusItem,
  toolOutputToEvidenceEnvelope,
} from '@/lib/knowledge/evidence-envelope';

describe('evidence-envelope/canonicalToolId', () => {
  it('maps legacy underscore ids to registry-facing ids', () => {
    expect(canonicalToolId('risk_assessment')).toBe('risk-monitor');
    expect(canonicalToolId('commitment_scan')).toBe('commitments');
    expect(canonicalToolId('briefing_room')).toBe('briefing');
  });

  it('hyphenates unknown underscore ids as a safe fallback', () => {
    expect(canonicalToolId('custom_research_tool')).toBe('custom-research-tool');
  });
});

describe('evidence-envelope/toolOutputToEvidenceEnvelope', () => {
  it('normalizes versioned tool-data docs into citation-ready evidence', () => {
    const envelope = toolOutputToEvidenceEnvelope({
      uid: 'u1',
      situationId: 's1',
      toolId: 'policy-memo',
      sourceCollection: 'tool-data',
      docData: {
        data: { headline: 'Ceasefire monitoring should move to a neutral channel.' },
        generatedAt: '2026-04-28T10:00:00.000Z',
        version: 4,
        metadata: { confidence: 0.82 },
      },
      queryTerms: ['ceasefire'],
    });

    expect(envelope).toMatchObject({
      sourceType: 'tool-output',
      sourceId: 'tool-output#policy-memo',
      title: 'policy-memo v4',
      confidence: 'high',
      freshness: '2026-04-28T10:00:00.000Z',
      score: 1,
    });
    expect(envelope?.citation).toBe('users/u1/situations/s1/tool-data/policy-memo');
    expect(envelope?.excerpt).toContain('Ceasefire monitoring');
  });

  it('normalizes saveToolOutput-only tools docs and preserves profile version', () => {
    const envelope = toolOutputToEvidenceEnvelope({
      uid: 'u1',
      situationId: 's1',
      toolId: 'risk_assessment',
      sourceCollection: 'tools',
      docData: {
        output: { summary: 'Humanitarian access risk remains elevated.' },
        profileVersion: 3,
        generatedAt: { seconds: 1777384800 },
        metadata: { semaphore: 'yellow' },
      },
    });

    expect(envelope?.canonicalToolId).toBe('risk-monitor');
    expect(envelope?.title).toBe('risk-monitor profile v3');
    expect(envelope?.confidence).toBe('medium');
    expect(envelope?.freshness).toBe('2026-04-28T14:00:00.000Z');
    expect(envelope?.citation).toBe('users/u1/situations/s1/tools/risk_assessment');
  });

  it('projects envelopes into the public CorpusItem shape', () => {
    const envelope = toolOutputToEvidenceEnvelope({
      uid: 'u1',
      situationId: 's1',
      toolId: 'commitment_scan',
      sourceCollection: 'tools',
      docData: { output: { recommendations: ['Verify corridor guarantees'] } },
    });
    expect(envelope).not.toBeNull();

    const item = evidenceEnvelopeToCorpusItem(envelope!);
    expect(item).toEqual(expect.objectContaining({
      sourceType: 'tool-output',
      sourceId: 'tool-output#commitments',
      title: 'commitments',
      excerpt: 'Verify corridor guarantees',
    }));
    expect('canonicalToolId' in item).toBe(false);
  });
});
