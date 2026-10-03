import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildKnowledgeCaptureInput, KnowledgeCaptureFields, KNOWLEDGE_CAPTURE_KINDS, parseCaptureConditions } from '@/components/capsules/CapsuleKnowledgeCapture';
import { CognitiveKnowledgeCaptureSchema } from '@/lib/cognitive-capsule/service';

describe('typed knowledge capture', () => {
  it.each(KNOWLEDGE_CAPTURE_KINDS)('builds a review-only %s payload accepted by the service contract', (kind) => {
    const values: Record<string, string> = { label: 'Synthetic lesson', scope: 'budget, diplomacy', body: 'An explicit expert interpretation.', conceptA: 'authorization', conceptB: 'expenditure', when: 'present:authority\nabsent:payment-record', exceptions: 'equals:status=closed', checks: 'Check evidence\nConfirm scope', nonImplications: 'Payment happened', implications: 'Review is possible', language: 'en', situation: 'A synthetic critical incident.', decision: 'Check original records.', analogyDimensions: 'decision authority', sources: 'evidence-1', ruleRefs: 'rule-1', affectedIds: 'rule-1' };
    const payload = buildKnowledgeCaptureInput(kind, (key) => values[key] ?? '');
    expect(CognitiveKnowledgeCaptureSchema.safeParse(payload).success).toBe(true);
    expect(payload).toMatchObject({ kind, scope: ['budget', 'diplomacy'], sourceRefs: ['evidence-1'] });
    expect(payload).not.toHaveProperty('reviewState'); expect(payload).not.toHaveProperty('provenance');
  });
  it('keeps applicability, stop conditions and ordered procedure instructions distinct', () => {
    expect(parseCaptureConditions('present:authorized\nabsent:payment\nequals:amount=42\nequals:ready=true')).toEqual([
      { kind: 'context', key: 'authorized', operator: 'present' }, { kind: 'context', key: 'payment', operator: 'absent' },
      { kind: 'context', key: 'amount', operator: 'equals', value: 42 }, { kind: 'context', key: 'ready', operator: 'equals', value: true },
    ]);
    const payload = buildKnowledgeCaptureInput('procedure', (key) => ({ label: 'Check a claim', scope: 'analysis', body: 'Avoid unsupported claims.', checks: 'Find the source\nCheck its date', exceptions: 'absent:source' })[key] ?? '');
    expect(payload).toMatchObject({ checks: ['Find the source', 'Check its date'], exceptions: [{ kind: 'context', key: 'source', operator: 'absent' }] });
    expect(() => parseCaptureConditions('equals:status')).toThrow(/condition/i);
    expect(() => buildKnowledgeCaptureInput('unknown', (key) => ({ label: 'Gap', scope: 'analysis', body: 'Missing evidence', checks: Array(31).fill('check').join('\n') })[key] ?? '')).toThrow(/30/);
  });
  it('shows kind-specific evidence and boundary fields on narrow, wrapping layouts', () => {
    const procedure = renderToStaticMarkup(<KnowledgeCaptureFields kind="procedure" />);
    expect(procedure).toContain('Ordered steps'); expect(procedure).toContain('Stop conditions');
    const exception = renderToStaticMarkup(<KnowledgeCaptureFields kind="exception" />);
    expect(exception).toContain('Rules this exception qualifies'); expect(exception).toContain('Required checks');
    const flag = renderToStaticMarkup(<KnowledgeCaptureFields kind="redFlag" />);
    expect(flag).toContain('What must not be inferred'); expect(flag).toContain('Evidence to request next');
    expect(renderToStaticMarkup(<KnowledgeCaptureFields kind="revisionTrigger" />)).toContain('Knowledge or graph IDs to revisit');
  });
  it('preserves false positives, escalation, transfer limits and validity in the service payload', () => {
    const values: Record<string, string> = { label: 'Scoped lesson', scope: 'analysis', body: 'Keep its boundaries explicit.', when: 'present:review', falsePositiveConditions: 'present:routine-language', escalationConditions: 'absent:authority', inputs: 'source\nquestion', outputs: 'reviewed memo', situation: 'A real decision context.', decision: 'Escalate.', analogyDimensions: 'authority', nonTransferableDimensions: 'jurisdiction\nfunding-stage', validFrom: '2026-10-01', validUntil: '2026-10-31', checks: 'Inspect sources' };
    const read = (key: string) => values[key] ?? '';
    const cue = buildKnowledgeCaptureInput('cue', read), procedure = buildKnowledgeCaptureInput('procedure', read), criticalCase = buildKnowledgeCaptureInput('case', read);
    expect(cue).toMatchObject({ falsePositiveConditions: [{ key: 'routine-language', operator: 'present' }] });
    expect(procedure).toMatchObject({ escalationConditions: [{ key: 'authority', operator: 'absent' }], inputs: ['source', 'question'], outputs: ['reviewed memo'] });
    expect(criticalCase).toMatchObject({ nonTransferableDimensions: ['jurisdiction', 'funding-stage'], validFrom: '2026-10-01', validUntil: '2026-10-31' });
    for (const payload of [cue, procedure, criticalCase]) expect(CognitiveKnowledgeCaptureSchema.safeParse(payload).success).toBe(true);
  });
});
