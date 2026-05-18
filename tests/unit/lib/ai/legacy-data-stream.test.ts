import { describe, expect, it } from 'vitest';
import { toLegacyDataStreamResponse } from '@/lib/ai/legacy-data-stream';

describe('legacy data stream adapter', () => {
  it('emits start data before answer tokens', async () => {
    const response = toLegacyDataStreamResponse((async function* stream() {
      yield 'answer';
    })(), undefined, {
      startData: [{ type: 'orchestrationStatus', label: 'Triage' }],
      onFinishData: (text) => ({ type: 'answerEnvelope', text }),
    });

    const body = await response.text();

    expect(body.split('\n').filter(Boolean)).toEqual([
      '2:{"type":"orchestrationStatus","label":"Triage"}',
      '0:"answer"',
      '2:{"type":"answerEnvelope","text":"answer"}',
      'd:{"finishReason":"stop"}',
    ]);
  });
});
