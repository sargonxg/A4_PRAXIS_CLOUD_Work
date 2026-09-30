import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ generateText: vi.fn(), getModel: vi.fn((id: string) => ({ provider: 'test.vertex', modelId: id, specificationVersion: 'v3' })) }));
vi.mock('ai', async (importOriginal) => ({ ...await importOriginal<typeof import('ai')>(), generateText: mocks.generateText }));
vi.mock('@/lib/ai/providers', async (importOriginal) => ({ ...await importOriginal<typeof import('@/lib/ai/providers')>(), getModel: mocks.getModel, hasServerAiProvider: () => true }));
import { generateAgentText } from '@/lib/agent-runtime/worker';
import type { AgentRun } from '@/lib/agent-runtime/types';

describe('agent task-model execution receipts', () => {
  beforeEach(() => vi.clearAllMocks());
  it('executes an economical bounded model and records actual constructed identity', async () => {
    mocks.generateText.mockResolvedValue({ text: 'Supplied allocation: 250 million.', response: { modelId: 'served-lite-version' }, usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 } });
    const result = await generateAgentText({}, { modelPurpose: 'pro', modelTaskKind: 'cheap_classify', system: 'Recall supplied context.', prompt: 'Recall allocation.' });
    expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({ maxOutputTokens: 1024, maxRetries: 0, model: expect.objectContaining({ modelId: 'gemini-3.1-flash-lite' }) }));
    expect(result.generationReceipt).toMatchObject({ requestedTaskKind: 'cheap_classify', selectedModel: 'gemini-3.1-flash-lite', provider: 'test.vertex', model: 'gemini-3.1-flash-lite', responseModel: 'served-lite-version', maxOutputTokens: 1024, maxRetries: 0 });
  });
  it('preserves capable requested class and actual economical fallback identity', async () => {
    mocks.generateText.mockRejectedValueOnce(new Error('Model unavailable: 404')).mockResolvedValueOnce({ text: 'Qualified synthesis.', response: { modelId: 'served-flash-version' }, usage: { outputTokens: 30 } });
    const result = await generateAgentText({}, { modelPurpose: 'deep-think', modelTaskKind: 'complex_reasoning', system: 'Reconcile evidence.', prompt: 'Compare the two measures.' });
    expect(mocks.generateText).toHaveBeenCalledTimes(2);
    expect(result.generationReceipt).toMatchObject({ requestedTaskKind: 'complex_reasoning', selectedModel: 'gemini-3.1-pro-preview', model: 'gemini-3.5-flash', attemptedModels: ['gemini-3.1-pro-preview', 'gemini-3.5-flash'], fallbackFrom: 'gemini-3.1-pro-preview', fallbackReason: 'model-access-or-quota', maxOutputTokens: 16384 });
  });
  it('never retries malformed request errors or more than three model candidates', async () => {
    mocks.generateText.mockRejectedValue(new Error('Invalid JSON schema for model request.'));
    await expect(generateAgentText({}, { modelPurpose: 'pro', modelTaskKind: 'complex_reasoning', system: 'Synthesize.', prompt: 'Case.' })).rejects.toThrow('Invalid JSON schema');
    expect(mocks.generateText).toHaveBeenCalledOnce();
    vi.clearAllMocks();
    mocks.generateText.mockRejectedValue(new Error('Quota exhausted 429'));
    await expect(generateAgentText({}, { modelPurpose: 'pro', modelTaskKind: 'complex_reasoning', system: 'Synthesize.', prompt: 'Case.' })).rejects.toThrow('Quota');
    expect(mocks.generateText).toHaveBeenCalledTimes(3);
  });
  it('does not invent provider identity for injected generators', async () => {
    const result = await generateAgentText({ generateText: async () => ({ text: 'Injected test output.' }) }, { modelPurpose: 'pro', modelTaskKind: 'complex_reasoning', system: 'Synthesize.', prompt: 'Case.' });
    expect(result.generationReceipt).toMatchObject({ provider: null, model: null, execution: 'injected-unverified' });
    expect(mocks.generateText).not.toHaveBeenCalled();
  });
  it('persists and reuses only a successful checkpoint with the same prompt and task', async () => {
    const run = { id: 'run-generation', ownerUid: 'owner', capsuleId: 'capsule', traceId: 'trace', status: 'running', metadata: {} } as AgentRun;
    const generateText = vi.fn(async () => ({ text: 'Retained draft.' }));
    const updateStatus = vi.fn(async () => run);
    const input = { modelPurpose: 'pro' as const, modelTaskKind: 'complex_reasoning' as const, system: 'Synthesize.', prompt: 'Case.', run, generationPhase: 'memo-draft' };
    await generateAgentText({ generateText, updateStatus }, input);
    const replay = await generateAgentText({ generateText, updateStatus }, input);
    expect(generateText).toHaveBeenCalledOnce();
    expect(updateStatus).toHaveBeenCalledWith(expect.objectContaining({ runId: run.id, metadata: expect.objectContaining({ generationCheckpoints: expect.any(Object) }) }));
    expect(replay.generationReceipt.checkpointReused).toBe(true);
    await generateAgentText({ generateText, updateStatus }, { ...input, prompt: 'Changed evidence.' });
    expect(generateText).toHaveBeenCalledTimes(2);
  });
  it('propagates checkpoint ownership loss and never saves an empty output', async () => {
    const run = { id: 'run-generation', ownerUid: 'owner', capsuleId: 'capsule', traceId: 'trace', status: 'running', metadata: {} } as AgentRun;
    const updateStatus = vi.fn(async () => null);
    const input = { modelPurpose: 'pro' as const, modelTaskKind: 'complex_reasoning' as const, system: 'Synthesize.', prompt: 'Case.', run, generationPhase: 'memo-draft' };
    await expect(generateAgentText({ generateText: async () => ({ text: 'Draft.' }), updateStatus }, input)).rejects.toThrow('ownership');
    expect(run.metadata.generationCheckpoints).toBeUndefined();
    updateStatus.mockClear();
    await expect(generateAgentText({ generateText: async () => ({ text: '   ' }), updateStatus }, input)).rejects.toThrow('no answer text');
    expect(updateStatus).not.toHaveBeenCalled();
  });
  it('uses the pinned SDK thinking configuration and compatible token budgets for older fallbacks', async () => {
    mocks.generateText.mockRejectedValueOnce(new Error('Model unavailable 404')).mockRejectedValueOnce(new Error('Model unavailable 404')).mockResolvedValueOnce({ text: 'Qualified synthesis.' });
    await generateAgentText({}, { modelPurpose: 'deep-think', modelTaskKind: 'complex_reasoning', system: 'Reconcile.', prompt: 'Case.', providerOptions: { google: { thinking_level: 'high' } } });
    expect(mocks.generateText.mock.calls[0][0].providerOptions).toEqual({ google: { thinkingConfig: { thinkingLevel: 'high' } } });
    expect(mocks.generateText.mock.calls[2][0].providerOptions).toEqual({ google: { thinkingConfig: { thinkingBudget: 8192 } } });
  });
  it('rebuilds an incomplete checkpoint rather than inventing a prior execution receipt', async () => {
    const run = { id: 'run-generation', ownerUid: 'owner', capsuleId: 'capsule', traceId: 'trace', status: 'running', metadata: {} } as AgentRun;
    const generateText = vi.fn(async () => ({ text: 'Retained draft.' }));
    const updateStatus = vi.fn(async () => run);
    const input = { modelPurpose: 'pro' as const, modelTaskKind: 'complex_reasoning' as const, system: 'Synthesize.', prompt: 'Case.', run, generationPhase: 'memo-draft' };
    await generateAgentText({ generateText, updateStatus }, input);
    (run.metadata.generationCheckpoints as Record<string, { receipt: unknown }>)['memo-draft'].receipt = {};
    const result = await generateAgentText({ generateText, updateStatus }, input);
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(result.generationReceipt.execution).toBe('injected-unverified');
    expect(result.generationReceipt.checkpointReused).toBe(false);
  });
});
