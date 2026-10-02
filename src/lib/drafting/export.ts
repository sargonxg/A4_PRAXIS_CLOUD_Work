import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';

import type { DraftingOutputTargetId } from '@/components/drafting/templates';

export type WorkProductExportFormat = 'docx' | 'pdf' | 'google-doc' | 'share-link';

export interface WorkProductSection {
  heading: string;
  body: string;
}

export interface WorkProductSourceCard {
  id: string;
  title: string;
  url?: string;
}

export interface WorkProductExportInput {
  title: string;
  format: WorkProductExportFormat;
  outputTarget: DraftingOutputTargetId;
  sections: WorkProductSection[];
  sourceCards?: WorkProductSourceCard[];
  memoId?: string;
}

export type NormalizedWorkProductExport = WorkProductExportInput & {
  filename: string;
  sourceCards: WorkProductSourceCard[];
};

export function normalizeWorkProductExportInput(input: WorkProductExportInput): NormalizedWorkProductExport {
  const title = clean(input.title) || 'PRAXIS work product';
  return {
    ...input,
    title,
    sections: input.sections.map((section) => ({
      heading: clean(section.heading) || 'Section',
      body: clean(section.body),
    })),
    sourceCards: input.sourceCards ?? [],
    filename: `${title.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'PRAXIS'}_${input.outputTarget}`,
  };
}

export async function exportWorkProductDocx(input: NormalizedWorkProductExport): Promise<Buffer> {
  const children = [
    new Paragraph({
      text: input.title,
      heading: HeadingLevel.TITLE,
    }),
    ...input.sections.flatMap((section) => [
      new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }),
      ...section.body.split(/\n{2,}/).filter(Boolean).map((paragraph) => new Paragraph({
        children: [new TextRun(paragraph)],
      })),
    ]),
    ...(input.sourceCards.length
      ? [
          new Paragraph({ text: 'Sources', heading: HeadingLevel.HEADING_1 }),
          ...input.sourceCards.map((source) => new Paragraph({
            children: [new TextRun(`${source.id}: ${source.title}${source.url ? ` (${source.url})` : ''}`)],
          })),
        ]
      : []),
  ];
  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

export function exportWorkProductPdf(input: NormalizedWorkProductExport): Buffer {
  const allText = [input.title, ...input.sections.flatMap((section) => [section.heading, section.body]), ...input.sourceCards.flatMap((source) => [source.id, source.title, source.url ?? ''])].join('\n');
  // Built-in PDF fonts use WinAnsi, not an arbitrary Unicode font. Never corrupt source text silently.
  if (/[^\u0009\u000a\u000d\u0020-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018-\u201a\u201c-\u201e\u2020-\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]/u.test(allText)) throw new WorkProductPdfTextError();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;
  function write(text: string, size: number, bold = false, keepNextLines = 0) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(text || ' ', width);
    const lineHeight = size * 1.4;
    if (keepNextLines && y + Math.min(lines.length + keepNextLines, 5) * lineHeight > bottom) { doc.addPage(); y = margin; }
    for (const line of lines) {
      if (y + lineHeight > bottom) { doc.addPage(); y = margin; }
      doc.text(line, margin, y); y += lineHeight;
    }
    y += 8;
  }
  write(input.title, 16, true, 2);
  for (const section of input.sections) {
    write(section.heading, 12, true, 2);
    write(section.body, 10);
  }
  if (input.sourceCards.length) {
    write('Sources', 12, true, 2);
    for (const source of input.sourceCards) write(`${source.id}: ${source.title}${source.url ? ` (${source.url})` : ''}`, 10);
  }
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

export class WorkProductPdfTextError extends Error {
  constructor() { super('This PDF export cannot render one or more source-language characters. Choose DOCX to preserve the original text.'); }
}

export function exportGoogleDocDisabledResponse(): { status: 'disabled'; reason: string } {
  return {
    status: 'disabled',
    reason: 'Set GOOGLE_DOCS_EXPORT_ENABLED=true and configure Drive credentials to enable Google Docs export.',
  };
}

export function buildShareableWorkProductLink(input: { memoId?: string | null }): string | null {
  return input.memoId ? `/app/write?memoId=${encodeURIComponent(input.memoId)}` : null;
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
