'use client';

import type { Editor } from '@tiptap/react';
import type { LucideIcon } from 'lucide-react';
import {
  Bold,
  Download,
  FileText,
  Heading1,
  Heading2,
  Italic,
  LinkIcon,
  List,
  ListChecks,
  MessageSquareText,
  Pilcrow,
  Redo2,
  Save,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function WriterToolbar({
  editor,
  saveLabel,
  onAsk,
  onExport,
}: {
  editor: Editor | null;
  saveLabel: string;
  onAsk: () => void;
  onExport: (format: 'md' | 'docx' | 'pdf') => void;
}) {
  const disabled = !editor;

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton label="Undo" disabled={disabled} onClick={() => editor?.chain().focus().undo().run()} icon={Undo2} />
        <ToolbarButton label="Redo" disabled={disabled} onClick={() => editor?.chain().focus().redo().run()} icon={Redo2} />
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton label="Paragraph" disabled={disabled} active={editor?.isActive('paragraph')} onClick={() => editor?.chain().focus().setParagraph().run()} icon={Pilcrow} />
        <ToolbarButton label="Heading 1" disabled={disabled} active={editor?.isActive('heading', { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} icon={Heading1} />
        <ToolbarButton label="Heading 2" disabled={disabled} active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2} />
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton label="Bold" disabled={disabled} active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} icon={Bold} />
        <ToolbarButton label="Italic" disabled={disabled} active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} icon={Italic} />
        <ToolbarButton label="Link" disabled={disabled} active={editor?.isActive('link')} onClick={setLink} icon={LinkIcon} />
        <ToolbarButton label="Bullet list" disabled={disabled} active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} icon={List} />
        <ToolbarButton label="Task list" disabled={disabled} active={editor?.isActive('taskList')} onClick={() => editor?.chain().focus().toggleTaskList().run()} icon={ListChecks} />
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton label="Ask PRAXIS" disabled={disabled} onClick={onAsk} icon={MessageSquareText} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
          <Save className="h-3.5 w-3.5" />
          {saveLabel}
        </span>
        <button
          type="button"
          onClick={() => onExport('md')}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-slate-50"
        >
          <FileText className="h-3.5 w-3.5" />
          Markdown
        </button>
        <button
          type="button"
          onClick={() => onExport('docx')}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          DOCX
        </button>
        <button
          type="button"
          onClick={() => onExport('pdf')}
          className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800"
        >
          <Sparkles className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border text-navy-700 transition disabled:cursor-not-allowed disabled:opacity-40',
        active ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-white hover:bg-slate-50',
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
