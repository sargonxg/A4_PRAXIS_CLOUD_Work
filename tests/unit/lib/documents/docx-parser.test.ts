import { describe, expect, it } from 'vitest';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';

// Exercise the installed parser, not a mock: a global xmldom override can
// break Mammoth even while the upload route's mocked boundary tests pass.
describe('installed DOCX parser compatibility', () => {
  it('extracts real Word paragraphs, formatting and Unicode without losing evidence', async () => {
    const buffer = await Packer.toBuffer(new Document({ sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: 'Synthetic Example Council', bold: true })] }),
      new Paragraph('Review deadline: 2026-10-01. Funding remains unconfirmed.'),
      new Paragraph('Evidence note: café — Ελληνικά.'),
    ] }] }));

    const result = await mammoth.extractRawText({ buffer });

    expect(result.value).toContain('Synthetic Example Council');
    expect(result.value).toContain('Review deadline: 2026-10-01. Funding remains unconfirmed.');
    expect(result.value).toContain('Evidence note: café — Ελληνικά.');
  });

  it('rejects corrupt Word bytes instead of fabricating extracted text', async () => {
    await expect(mammoth.extractRawText({ buffer: Buffer.from('not a DOCX archive') })).rejects.toThrow();
  });
});
