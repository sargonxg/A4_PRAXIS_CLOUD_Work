/**
 * Document processing utilities for text extraction and upload handling.
 * Integration point for the /api/ai/extract route.
 */

export async function extractText(file: File): Promise<string> {
  const mimeType = file.type;

  // Plain text files
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return file.text();
  }

  // HTML files — strip tags for basic text extraction
  if (mimeType === 'text/html') {
    const html = await file.text();
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // For PDFs and other binary formats, return a placeholder message.
  // In production, integrate with a PDF extraction library (e.g., pdf-parse, pdfjs-dist).
  if (mimeType === 'application/pdf') {
    throw new Error('PDF extraction requires a server-side PDF processing library. Please convert to plain text first.');
  }

  throw new Error(`Unsupported file type: ${mimeType}. Supported types: text/plain, text/markdown, text/html`);
}

export async function processUpload(formData: FormData): Promise<{ text: string; filename: string; size: number }> {
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    throw new Error('No file provided in form data');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  const text = await extractText(file);

  return {
    text,
    filename: file.name,
    size: file.size,
  };
}
