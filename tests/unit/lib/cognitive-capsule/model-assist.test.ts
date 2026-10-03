import { beforeEach, describe, expect, it, vi } from 'vitest';
const provider = vi.hoisted(() => ({ generateText: vi.fn(), getModel: vi.fn(() => ({ modelId: 'matrix-model' })) }));
vi.mock('ai', () => ({ generateText: provider.generateText, Output: { object: vi.fn(v => v) } }));
vi.mock('@/lib/ai/providers', () => ({ getModel: provider.getModel }));
import { createCognitiveCapsule, EvidenceSpanSchema } from '@/lib/cognitive-capsule/schema';
import { assistCognitiveInterview, CognitiveAssistRequestSchema, validateAssistCapture } from '@/lib/cognitive-capsule/model-assist';
const request = { action: 'interview', mode: 'distinction', consent: true, messages: [{ role: 'user', content: 'Authorization is not expenditure. What do you need to know next?' }] };
const capture = { kind: 'distinction', label: 'Authorization versus expenditure', scope: ['budget'], terms: ['authorization', 'expenditure'], body: 'Authorization alone does not prove spending.' };
describe('adaptive expertise model boundary', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('passes prior expert answers and six-mode questions to the provider with a bounded call', async () => {
    provider.generateText.mockResolvedValue({ output: { reply: 'What records establish actual spending?', followUps: ['Which source would change your interpretation?'], blindSpotSuggestions: [], capture: null } });
    const result = await assistCognitiveInterview(createCognitiveCapsule('owned'), request, 'calibration');
    const options = provider.generateText.mock.calls[0][0];
    expect(options.prompt).toContain('Authorization is not expenditure');
    expect(options.prompt).toContain('conceptA');
    expect(options.maxOutputTokens).toBeLessThanOrEqual(2200);
    expect(result.modelId).toBe('matrix-model');
    expect(result.reviewRequired).toBe(true);
  });
  it('refuses absent consent, unbounded histories, invented spans, or acceptance fields', async () => {
    expect(CognitiveAssistRequestSchema.safeParse({ ...request, consent: false }).success).toBe(false);
    expect(CognitiveAssistRequestSchema.safeParse({ ...request, messages: Array(21).fill(request.messages[0]) }).success).toBe(false);
    expect(() => validateAssistCapture(createCognitiveCapsule('owned'), { ...capture, sourceRefs: ['invented'] })).toThrow(/evidence/i);
    provider.generateText.mockResolvedValue({ output: { reply: 'Saved', followUps: [], blindSpotSuggestions: [], capture: { ...capture, reviewState: 'accepted' } } });
    await expect(assistCognitiveInterview(createCognitiveCapsule('owned'), request, '')).rejects.toThrow();
  });
  it('accepts only current resolved evidence and validates semantic condition references', () => {
    const c = createCognitiveCapsule('owned'); c.evidence.push(EvidenceSpanSchema.parse({ id: 'span', sourceId: 'report', sourceVersion: '1', quote: 'Authorization.' }));
    expect(validateAssistCapture(c, { ...capture, sourceRefs: ['span'] }).sourceRefs).toEqual(['span']);
    expect(() => validateAssistCapture(c, { ...capture, when: [{ kind: 'node', key: 'missing', operator: 'present' }] })).toThrow(/reference/i);
    c.evidence[0].anchorStatus = 'unresolved';
    expect(() => validateAssistCapture(c, { ...capture, sourceRefs: ['span'] })).toThrow(/evidence/i);
  });
  it('does not turn an incomplete interview into a canonical decision', async () => {
    provider.generateText.mockResolvedValue({ output: { reply: 'Check the payment record.', followUps: [], blindSpotSuggestions: ['Could disbursement and obligation also be distinct?'], capture } });
    const c = createCognitiveCapsule('owned');
    const result = await assistCognitiveInterview(c, request, '');
    expect(result.capture?.kind).toBe('distinction'); expect(c.knowledge).toEqual([]);
    expect(result.blindSpotSuggestions[0]).toContain('Could');
  });
});
