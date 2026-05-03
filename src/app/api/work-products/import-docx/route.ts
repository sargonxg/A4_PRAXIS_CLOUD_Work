import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { withAuth } from '@/lib/api/with-auth';

function stableSectionId(index: number) {
  return `imported-section-${index + 1}`;
}

function splitIntoSections(text: string) {
  const chunks = text
    .replace(/\r/g, '')
    .trim()
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (!chunks.length) return [];

  return chunks.map((chunk, index) => {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
    const possibleHeading = lines[0] ?? `Imported Section ${index + 1}`;
    const heading = possibleHeading.length <= 80
      ? possibleHeading.replace(/[:.]\s*$/, '')
      : `Imported Section ${index + 1}`;
    const body = possibleHeading.length <= 80
      ? lines.slice(1).join('\n') || possibleHeading
      : lines.join('\n');

    return {
      id: stableSectionId(index),
      heading,
      body,
    };
  });
}

export const POST = withAuth(async (req) => {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'DOCX file is required' }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'DOCX import limit is 8 MB' }, { status: 413 });
  }

  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith('.docx')) {
    return NextResponse.json({ error: 'Only .docx imports are supported on this endpoint' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
  const text = result.value.trim();

  return NextResponse.json({
    text,
    warnings: result.messages.map((message) => message.message).filter(Boolean),
    sections: splitIntoSections(text),
  });
});
