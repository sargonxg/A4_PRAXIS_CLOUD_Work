import { describe, expect, it } from 'vitest';
import { createTaskletStreamDecoder, parseDataStreamError } from '@/lib/ai/tasklet-stream';

const records = ['0:'+JSON.stringify('Sources: мир · سياسة · 東京 🌍\nNext line'),
  '2:'+JSON.stringify({ type: 'answerEnvelope', answerEnvelope: { followUps: ['Check “source”'], sourceCards: [{ title: 'مُستند' }] } }),
  '0:'+JSON.stringify('Final answer')];

describe('tasklet wire stream framing', () => {
  it('preserves text and custom envelope records at every possible byte split', () => {
    const bytes = new TextEncoder().encode(records.join('\n')+'\n');
    for (let split=0; split<=bytes.length; split++) {
      const decoder=createTaskletStreamDecoder();
      expect([...decoder.push(bytes.slice(0,split)), ...decoder.push(bytes.slice(split)), ...decoder.finish()]).toEqual(records);
    }
  });
  it('handles one-byte chunks, CRLF and a final record without a newline', () => {
    const decoder=createTaskletStreamDecoder(); const lines: string[]=[];
    for(const byte of new TextEncoder().encode(records.join('\r\n')))lines.push(...decoder.push(Uint8Array.of(byte)));
    lines.push(...decoder.finish()); expect(lines).toEqual(records);
  });
  it('retains fragmented stream errors for the existing error handler', () => {
    const bytes=new TextEncoder().encode('3:'+JSON.stringify({ error: 'Provider interrupted 🌍' }));
    for(let split=0;split<=bytes.length;split++){
      const decoder=createTaskletStreamDecoder();
      const lines=[...decoder.push(bytes.slice(0,split)),...decoder.push(bytes.slice(split)),...decoder.finish()];
      expect(lines.map(parseDataStreamError)).toEqual(['Provider interrupted 🌍']);
    }
  });
});
