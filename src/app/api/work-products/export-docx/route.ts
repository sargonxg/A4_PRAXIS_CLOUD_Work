import { NextResponse } from 'next/server';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { withAuth } from '@/lib/api/with-auth';

interface WorkProductSection {
  heading: string;
  body: string;
}

interface WorkProductExportRequest {
  productType?: string;
  title?: string;
  situationName?: string;
  classification?: string;
  sections?: WorkProductSection[];
  sources?: string[];
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function bodyParagraph(value: string) {
  return new Paragraph({
    children: [new TextRun({ text: value, font: 'Inter', size: 22 })],
    spacing: { after: 160, line: 300 },
  });
}

function heading(value: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [new TextRun({ text: value, font: 'Aptos Display', size: 28, bold: true, color: '10233F' })],
  });
}

function meta(value: string) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: value, font: 'Aptos', size: 18, color: '667085' })],
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D5DD' } },
    spacing: { before: 160, after: 180 },
  });
}

function paragraphize(body: string): Paragraph[] {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (blocks.length ? blocks : [body]).flatMap((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => line.startsWith('- ') || line.startsWith('• '))) {
      return lines.map((line) =>
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: line.replace(/^[-•]\s*/, ''), font: 'Inter', size: 22 })],
          spacing: { after: 80 },
        }),
      );
    }
    return [bodyParagraph(lines.join(' '))];
  });
}

export const POST = withAuth(async (req, user) => {
  const payload = (await req.json()) as WorkProductExportRequest;
  const title = text(payload.title, 'PRAXIS Work Product');
  const productType = text(payload.productType, 'Analytic Product');
  const situationName = text(payload.situationName, 'Situation');
  const classification = text(payload.classification, 'Working draft');
  const sections = (payload.sections ?? [])
    .filter((section) => text(section.heading) || text(section.body))
    .map((section) => ({
      heading: text(section.heading, 'Section'),
      body: text(section.body, 'No body text supplied.'),
    }));
  const sources = (payload.sources ?? []).map((source) => text(source)).filter(Boolean);

  if (!sections.length) {
    return NextResponse.json({ error: 'At least one document section is required' }, { status: 400 });
  }

  const doc = new Document({
    creator: user.name || 'PRAXIS',
    description: `${productType} generated from PRAXIS structured work-product editor`,
    title,
    styles: {
      default: {
        document: {
          run: { font: 'Inter', size: 22 },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 120 },
          children: [new TextRun({ text: 'TACITUS PRAXIS', font: 'Aptos Display', size: 22, bold: true, color: '475467' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: productType.toUpperCase(), font: 'Aptos Display', size: 26, bold: true, color: '1D4ED8' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [new TextRun({ text: title, font: 'Aptos Display', size: 34, bold: true, color: '101828' })],
        }),
        meta(`Situation: ${situationName}`),
        meta(`Classification: ${classification}`),
        meta(`Prepared by: ${user.name || user.email} | Exported: ${new Date().toISOString()}`),
        divider(),
        ...sections.flatMap((section) => [
          heading(section.heading),
          ...paragraphize(section.body),
        ]),
        divider(),
        heading('Sources and Handling Notes'),
        ...(sources.length
          ? sources.map((source) => meta(`• ${source}`))
          : [meta('No explicit sources were attached. Verify citations before distribution.')]),
        meta('Generated from the PRAXIS work-product editor. Compatible with LibreOffice Writer and Microsoft Word DOCX workflows.'),
      ],
    }],
  });

  const buffer = Buffer.from(await Packer.toBuffer(doc));
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80) || 'praxis-work-product'}.docx"`,
      'Cache-Control': 'no-store',
    },
  });
});
