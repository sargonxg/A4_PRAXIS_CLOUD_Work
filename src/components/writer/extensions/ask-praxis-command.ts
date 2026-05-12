import type { Editor } from '@tiptap/react';

export interface WriterCitation {
  id: string;
  index: number;
  layer: string;
  title: string;
  citation: string;
}

export interface WriterAskResult {
  text: string;
  citations: WriterCitation[];
}

export async function runWriterAsk(input: {
  situationId?: string;
  situation?: unknown;
  prompt: string;
  selectionText: string;
  mode: 'ask' | 'tighten' | 'soften' | 'steelman';
}): Promise<WriterAskResult> {
  const response = await fetch('/api/ai/writer/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === 'string' ? body.error : 'Writer AI request failed');
  }
  return response.json() as Promise<WriterAskResult>;
}

export function insertWriterAskResult(editor: Editor, result: WriterAskResult) {
  const primary = result.citations[0];
  const paragraphs = result.text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const paragraph of paragraphs.length ? paragraphs : [result.text]) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'paragraph',
        attrs: {
          provenanceCore: 'situation-core',
          provenanceTool: 'ask-praxis',
          confidence: primary ? 'cited' : 'reasoning',
        },
        content: [
          {
            type: 'text',
            text: paragraph,
            marks: primary
              ? [
                  {
                    type: 'citation',
                    attrs: {
                      citationId: primary.id,
                      sourceType: primary.layer,
                      title: primary.title,
                    },
                  },
                ]
              : [],
          },
        ],
      })
      .run();
  }
}
