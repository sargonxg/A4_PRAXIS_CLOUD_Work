import { Worker } from 'node:worker_threads';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));
vi.mock('@/lib/ai/providers', () => ({ getEmbeddingModel: vi.fn(), hasServerAiProvider: vi.fn(() => false) }));
import { chunkText } from '@/lib/firebase/documents-service';

type Chunk = ReturnType<typeof chunkText>[number];

// Execute the actual pure function in a bounded worker: regressions must not
// hang Vitest or exhaust the shared process when the final tail repeats.
function boundedChunkText(text: string, opts?: Parameters<typeof chunkText>[1]): Promise<Chunk[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const chunkText = (${chunkText.toString()});
      try { parentPort.postMessage({ chunks: chunkText(workerData.text, workerData.opts) }); }
      catch (error) { parentPort.postMessage({ error: { name: error.name, message: error.message } }); }
    `, {
      eval: true,
      workerData: { text, opts },
      resourceLimits: { maxOldGenerationSizeMb: 16, maxYoungGenerationSizeMb: 4 },
      stdout: true,
      stderr: true,
    });
    const timeout = setTimeout(() => {
      void worker.terminate();
      reject(new Error('Document chunking did not terminate within its bounded worker deadline.'));
    }, 1_000);
    worker.once('message', (result: { chunks?: Chunk[]; error?: { name: string; message: string } }) => {
      clearTimeout(timeout);
      void worker.terminate();
      if (result.error) reject(Object.assign(new Error(result.error.message), { name: result.error.name }));
      else resolve(result.chunks!);
    });
    worker.once('error', (error) => { clearTimeout(timeout); reject(error); });
  });
}

function expectCompleteCoverage(text: string, chunks: Chunk[], maxLength: number) {
  expect(chunks.length).toBeGreaterThan(0);
  expect(chunks[0].charStart).toBe(0);
  expect(chunks.at(-1)!.charEnd).toBe(text.length);
  let reconstructed = '';
  let coveredEnd = 0;
  for (const [index, chunk] of chunks.entries()) {
    expect(chunk.charStart).toBeLessThanOrEqual(coveredEnd);
    expect(chunk.charEnd - chunk.charStart).toBeLessThanOrEqual(maxLength);
    expect(chunk.text).toBe(text.slice(chunk.charStart, chunk.charEnd).trim());
    if (index) expect(chunk.charStart).toBeGreaterThan(chunks[index - 1].charStart);
    reconstructed += text.slice(coveredEnd, chunk.charEnd);
    coveredEnd = chunk.charEnd;
  }
  expect(reconstructed).toBe(text);
}

describe('document chunking terminates and preserves source coverage', () => {
  it.each([1499, 1500, 1501, 2800, 3001])('covers a %i-character source including the final tail', async (length) => {
    const text = 'x'.repeat(length);
    const chunks = await boundedChunkText(text);
    expectCompleteCoverage(text, chunks, 1500);
    if (length <= 1500) expect(chunks).toHaveLength(1);
    else expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.length).toBeLessThanOrEqual(4);
  });

  it('keeps empty input and a single short source as one chunk', async () => {
    expect(await boundedChunkText('')).toEqual([{ text: '', charStart: 0, charEnd: 0 }]);
    expect(await boundedChunkText('Single source.')).toEqual([{ text: 'Single source.', charStart: 0, charEnd: 14 }]);
  });

  it('finishes multi-line conversation notes and retains the final unique fact', async () => {
    const notes = `${'USER — supplied context: Actor Example Council has an unverified commitment.\nASSISTANT — unverified AI suggestion: compare alternatives and review sources.\n'.repeat(30)}USER — supplied context: unique final audit code TAIL-7821.`;
    const chunks = await boundedChunkText(notes);
    expectCompleteCoverage(notes, chunks, 1500);
    expect(chunks.at(-1)!.text).toContain('TAIL-7821');
    expect(chunks.some((chunk) => notes[chunk.charEnd - 1] === '\n')).toBe(true);
    expect(chunks.length).toBeLessThan(20);
  });

  it('advances after sentence-boundary shortening even when overlap is larger than the shortened chunk', async () => {
    const text = `${'a'.repeat(800)}. ${'b'.repeat(1100)}. Final supplied fact.`;
    const chunks = await boundedChunkText(text, { maxLength: 1500, overlap: 1000 });
    expectCompleteCoverage(text, chunks, 1500);
    expect(chunks.at(-1)!.text).toContain('Final supplied fact.');
    expect(chunks.length).toBeLessThanOrEqual(text.length);
  });

  it('preserves sentence breaks and supports a smaller explicit chunk size', async () => {
    const sentence = `${'a'.repeat(800)}. ${'b'.repeat(1000)}`;
    const sentenceChunks = await boundedChunkText(sentence);
    expectCompleteCoverage(sentence, sentenceChunks, 1500);
    expect(sentenceChunks[0].charEnd).toBe(801);
    expect(sentenceChunks[1].charStart).toBe(601);

    const text = 'A supplied source spans several chunks.';
    const chunks = await boundedChunkText(text, { maxLength: 8, overlap: 2 });
    expectCompleteCoverage(text, chunks, 8);
    expect(chunks.length).toBeLessThan(10);
  });

  it.each([
    { maxLength: 0 }, { maxLength: -1 }, { maxLength: Number.NaN },
    { maxLength: Number.POSITIVE_INFINITY }, { maxLength: 1.5 }, { maxLength: Number.MAX_SAFE_INTEGER + 1 },
    { overlap: -1 }, { overlap: 1.5 }, { overlap: Number.NaN }, { overlap: Number.POSITIVE_INFINITY },
    { overlap: 1500 }, { overlap: 1501 },
  ])('rejects unsafe chunk options before processing: %j', async (opts) => {
    await expect(boundedChunkText('source '.repeat(500), opts)).rejects.toMatchObject({ name: 'RangeError' });
  });
});
