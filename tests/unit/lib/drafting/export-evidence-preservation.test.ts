import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { PDFParse } from 'pdf-parse';
import dossier from '../../../fixtures/example-advisory-dossier.json';
import { exportWorkProductDocx, exportWorkProductPdf, normalizeWorkProductExportInput } from '@/lib/drafting/export';

const input = (long = false) => normalizeWorkProductExportInput({ title: dossier.title.repeat(long ? 8 : 1), outputTarget: 'brief', format: 'pdf',
  sections: [{ heading: 'Synthetic draft — as of 2026-01-15 — review pending', body: dossier.sources.map((source) => source.text).join('\n\n').repeat(long ? 20 : 1) }],
  sourceCards: dossier.sources.map((source) => ({ id: source.id, title: source.text, url: `https://example.invalid/${source.id}` })),
});

describe('work-product export preserves supplied evidence text (controlled output, no model)', () => {
  it.each([false, true])('PDF includes source appendix and qualified funding, adoption, pilot and language anchors (long=%s)', async (long) => {
    const bytes = exportWorkProductPdf(input(long));
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    try {
      const extracted = await parser.getText();
      const text = extracted.text.replace(/\s+/g, ' ');
      for (const expected of ['Funding remains undecided.', 'not a requirement.', 'No start date has been adopted.', 'sujeito a financiamento.', 'EA-D1', 'EA-D8', 'EA-D15', 'Sources']) expect(text).toContain(expected);
      expect(extracted.total).toBeGreaterThan(long ? 2 : 0);
    } finally { await parser.destroy(); }
  });
  it('DOCX preserves original Unicode and source references in the actual Word document', async () => {
    const normalized = input();
    normalized.sections.push({ heading: 'Original source language', body: 'تمويل غير محسوم — 資金未定' });
    const archive = await JSZip.loadAsync(await exportWorkProductDocx(normalized));
    const xml = await archive.file('word/document.xml')!.async('string');
    for (const expected of ['Funding remains undecided.', 'not a requirement.', 'No start date has been adopted.', 'تمويل غير محسوم', '資金未定', 'EA-D15']) expect(xml).toContain(expected);
  });
  it('refuses unsupported PDF glyphs instead of silently corrupting a source language', () => {
    const normalized = input(); normalized.sections[0].body = 'تمويل غير محسوم';
    expect(() => exportWorkProductPdf(normalized)).toThrow(/DOCX/);
  });
});
