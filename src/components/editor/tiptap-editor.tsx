'use client';

/**
 * TipTap rich-text editor for PRAXIS policy drafting.
 *
 * Word-like surface for the analyst: headings, bold/italic, lists, blockquote,
 * code, links, task lists, undo/redo. Used by Policy Memo, Briefing Studio,
 * and the standalone /app/editor surface.
 *
 * Side-effects are deliberately minimal: parent owns content, this component
 * owns the editor state and emits onChange(html) on every transaction. Parent
 * decides when to persist (Firestore + GCS bucket via /api/documents/upload).
 */

import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  toolbarClassName?: string;
}

export function TipTapEditor({
  value,
  onChange,
  placeholder = 'Start drafting…',
  editable = true,
  className,
  toolbarClassName,
}: TipTapEditorProps) {
  const lastEmittedHtml = useRef<string>(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-diplomatic-blue underline underline-offset-2' },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value || '',
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap-prose prose prose-sm max-w-none p-5 min-h-[420px] focus:outline-none ' +
          'prose-headings:font-serif prose-headings:text-navy-900 ' +
          'prose-p:text-navy-700 prose-li:text-navy-700 prose-blockquote:text-navy-600 ' +
          'prose-a:text-diplomatic-blue prose-strong:text-navy-900',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmittedHtml.current = html;
      onChange(html);
    },
  });

  // Sync external value changes (e.g. parent loaded new doc) without losing focus.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedHtml.current) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return (
      <div className={cn('rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500', className)}>
        Loading editor…
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm', className)}>
      {editable && (
        <div
          className={cn(
            'flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5',
            toolbarClassName,
          )}
        >
          <ToolbarButton
            label="Heading 1"
            icon={Heading1}
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarButton
            label="Heading 2"
            icon={Heading2}
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            label="Heading 3"
            icon={Heading3}
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          />
          <ToolbarDivider />
          <ToolbarButton
            label="Bold"
            icon={Bold}
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="Italic"
            icon={Italic}
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label="Strikethrough"
            icon={Strikethrough}
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
          <ToolbarButton
            label="Inline code"
            icon={Code}
            active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />
          <ToolbarDivider />
          <ToolbarButton
            label="Bulleted list"
            icon={List}
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="Numbered list"
            icon={ListOrdered}
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            label="Task list"
            icon={ListChecks}
            active={editor.isActive('taskList')}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          />
          <ToolbarButton
            label="Quote"
            icon={Quote}
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            label="Horizontal rule"
            icon={Minus}
            active={false}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
          <ToolbarDivider />
          <ToolbarButton
            label="Insert link"
            icon={LinkIcon}
            active={editor.isActive('link')}
            onClick={() => {
              const previous = editor.getAttributes('link').href as string | undefined;
              const url = window.prompt('Link URL', previous ?? 'https://');
              if (url === null) return;
              if (url === '') {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }}
          />
          <ToolbarDivider />
          <ToolbarButton
            label="Undo"
            icon={Undo2}
            active={false}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          />
          <ToolbarButton
            label="Redo"
            icon={Redo2}
            active={false}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          />
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  active,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-diplomatic-blue/10 text-diplomatic-blue'
          : 'text-navy-500 hover:bg-navy-100 hover:text-navy-800',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden />;
}
