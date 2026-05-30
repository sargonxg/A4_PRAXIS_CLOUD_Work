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
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const width = 500;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(input.title, margin, y);
  y += 28;

  for (const section of input.sections) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(section.heading, margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const line of doc.splitTextToSize(section.body || ' ', width)) {
      if (y > 740) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 14;
    }
    y += 12;
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
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
