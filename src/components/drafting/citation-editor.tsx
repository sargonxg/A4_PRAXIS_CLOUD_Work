'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

import { CitationMark } from './citation-mark';

export interface DraftingSourceCard {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
}

export function CitationEditor({
  initialContent,
  sourceCards,
  onChange,
}: {
  initialContent: string;
  sourceCards: DraftingSourceCard[];
  onChange?: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Draft the memo, then attach source cards to material claims.' }),
      CitationMark,
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChange?.(current.getHTML()),
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === initialContent) return;
    editor.commands.setContent(initialContent);
  }, [editor, initialContent]);

  return (
    <div className="grid gap-3">
      <EditorContent
        editor={editor}
        className="min-h-72 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900"
      />
      {sourceCards.length ? (
        <div className="flex flex-wrap gap-2" aria-label="Source cards">
          {sourceCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                editor?.chain().focus().setMark('citation', {
                  sourceId: card.id,
                  sourceTitle: card.title,
                  url: card.url ?? null,
                }).run();
              }}
              title={card.snippet ?? card.title}
            >
              {card.id}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
