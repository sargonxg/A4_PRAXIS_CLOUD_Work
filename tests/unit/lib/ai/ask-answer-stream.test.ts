import { describe, expect, it } from 'vitest';
import { MockLanguageModelV3, simulateReadableStream } from 'ai/test';
import { tool } from 'ai';
import { z } from 'zod';
import { createVertex } from '@ai-sdk/google-vertex';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { readAskModelIdentity, requireAnswerText, streamAskAnswer } from '@/lib/ai/ask-answer-stream';

describe('Ask answer completion', () => {
  it('reads the provider and model from the actual execution object without client settings or network calls', () => {
    const vertex = createVertex({ project: 'synthetic-unit-project', location: 'global' })('gemini-3.5-flash');
    const google = createGoogleGenerativeAI({ apiKey: 'synthetic-unit-key-never-used' })('gemini-3.5-flash');
    expect(readAskModelIdentity(vertex)).toEqual({ provider: 'google.vertex.chat', model: 'gemini-3.5-flash' });
    expect(readAskModelIdentity(google)).toEqual({ provider: 'google.generative-ai', model: 'gemini-3.5-flash' });
  });

  it('rejects unresolved model aliases rather than inventing an execution provider', () => {
    expect(() => readAskModelIdentity('vertex:model-alias')).toThrow('constructed model');
  });
  it('ends repeated tool calls with a synthesis turn that retains the retrieved evidence', async () => {
    const model: MockLanguageModelV3 = new MockLanguageModelV3({
      doStream: async (options) => ({
        stream: simulateReadableStream({ chunks: [
          { type: 'stream-start' as const, warnings: [] },
          ...(options.toolChoice?.type === 'none' ? [
            { type: 'text-start' as const, id: 'answer' },
            { type: 'text-delta' as const, id: 'answer', delta: 'The review deadline is October 1; funding is unconfirmed.' },
            { type: 'text-end' as const, id: 'answer' },
          ] : [{ type: 'tool-call' as const, toolCallId: `read-${model.doStreamCalls.length}`, toolName: 'read', input: '{}' }]),
          { type: 'finish' as const, finishReason: { unified: options.toolChoice?.type === 'none' ? 'stop' as const : 'tool-calls' as const, raw: undefined }, usage: { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 5, text: 5, reasoning: 0 } } },
        ] }),
      }),
    });
    const result = streamAskAnswer({ model, system: 'Use only the supplied evidence.', prompt: 'Summarize my capsule.', tools: {
      read: tool({ inputSchema: z.object({}), execute: async () => ({ deadline: '2026-10-01', funding: 'unconfirmed' }) }),
    } });
    let answer = '';
    for await (const text of requireAnswerText(result.textStream)) answer += text;
    expect(answer).toContain('funding is unconfirmed');
    expect(model.doStreamCalls.length).toBeLessThanOrEqual(6);
    expect(JSON.stringify(model.doStreamCalls.at(-1)?.prompt)).toContain('2026-10-01');
    expect(await result.finishReason).toBe('stop');
  });

  it('rejects an empty or whitespace-only answer instead of reporting success', async () => {
    for (const chunks of [[], ['  ', '\n']]) {
      const consume = async () => { for await (const text of requireAnswerText((async function* () { yield* chunks; })())) void text; };
      await expect(consume()).rejects.toThrow('did not produce an answer');
    }
  });

  it('preserves a provider failure after a partial answer', async () => {
    const stream = requireAnswerText((async function* () { yield 'Partial'; throw new Error('Provider disconnected'); })());
    expect((await stream.next()).value).toBe('Partial');
    await expect(stream.next()).rejects.toThrow('Provider disconnected');
  });
});
