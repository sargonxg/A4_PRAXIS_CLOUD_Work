'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Brain, BookOpenCheck, FileText, Loader2, MessageSquareText, Target, Wrench } from 'lucide-react';
import { CitationMark } from '@/components/writer/extensions/citation-mark';
import {
  insertWriterAskResult,
  runWriterAsk,
  type WriterCitation,
} from '@/components/writer/extensions/ask-praxis-command';
import { ProvenanceBlock } from '@/components/writer/extensions/provenance-block';
import { buildPraxisSlashCommands, type PraxisSlashCommand } from '@/components/writer/extensions/slash-menu';
import { getLocalWriterDraft, useWriterAutosave } from '@/components/writer/hooks/use-writer-autosave';
import { useWriterContext } from '@/components/writer/hooks/use-writer-context';
import { CitationSidebar } from '@/components/writer/ui/CitationSidebar';
import { ProvenanceChip } from '@/components/writer/ui/ProvenanceChip';
import { SlashMenu } from '@/components/writer/ui/SlashMenu';
import { WriterToolbar } from '@/components/writer/ui/WriterToolbar';
import { HERO_TOOLS } from '@/lib/constants/tool-registry';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { buildEvidenceReviews, summarizeEvidenceCoverage } from '@/lib/documents/evidence-review';
import { memoBlocksToMarkdown, memoBlocksToPlainText } from '@/lib/memo/export';
import type { MemoBlock, MemoTemplateId } from '@/types/memo';

type WriterMode = 'draft' | 'memo' | 'write';

interface PraxisWriterProps {
  mode?: WriterMode;
  title?: string;
  templateId?: MemoTemplateId;
}

interface LocalDraft {
  title?: string;
  json?: JSONContent;
}

const STARTER_DOCUMENT = `
  <h1>Policy note</h1>
  <p data-provenance-core="user-core" data-provenance-tool="starter" data-confidence="draft"><strong>Bottom line:</strong> Write the working judgment here. Keep confidence and source gaps visible.</p>
  <h2>Situation read</h2>
  <p data-provenance-core="situation-core">Summarize the current context, actors, decision moment, and constraints.</p>
  <h2>Evidence and gaps</h2>
  <ul>
    <li>Supported claim with source posture.</li>
    <li>Open question or missing source.</li>
  </ul>
  <h2>Options</h2>
  <ol>
    <li>Option A with risks.</li>
    <li>Option B with tradeoffs.</li>
  </ol>
  <h2>Recommendation</h2>
  <p>State the recommended next move and what PRAXIS should inspect before export.</p>
`;

function textFromNode(node: JSONContent): string {
  if (typeof node.text === 'string') return node.text;
  return (node.content ?? []).map(textFromNode).join(node.type === 'paragraph' ? ' ' : '\n').trim();
}

function blocksFromJson(json: JSONContent | null): MemoBlock[] {
  const content = json?.content ?? [];
  const blocks = content
    .map((node, index): MemoBlock | null => {
      const text = textFromNode(node).trim();
      if (!text && node.type !== 'horizontalRule') return null;
      const attrs = (node.attrs ?? {}) as Record<string, unknown>;
      const citations: MemoBlock['citations'] = [];
      const walk = (child: JSONContent) => {
        for (const mark of child.marks ?? []) {
          if (mark.type === 'citation' && mark.attrs?.citationId) {
            citations.push({
              nodeIds: [],
              sourceReceiptIds: [String(mark.attrs.citationId)],
              surface: 'inline',
            });
          }
        }
        for (const nested of child.content ?? []) walk(nested);
      };
      walk(node);

      if (node.type === 'heading') {
        return {
          id: `block-${index + 1}`,
          type: 'heading',
          content: text,
          citations,
          metadata: attrs,
        };
      }
      if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList') {
        return {
          id: `block-${index + 1}`,
          type: 'bullets',
          title: node.type === 'taskList' ? 'Checklist' : undefined,
          content: '',
          items: (node.content ?? []).map(textFromNode).filter(Boolean),
          citations,
          metadata: attrs,
        };
      }
      if (node.type === 'blockquote') {
        return { id: `block-${index + 1}`, type: 'quote', content: text, citations, metadata: attrs };
      }
      if (node.type === 'horizontalRule') {
        return { id: `block-${index + 1}`, type: 'divider', content: '', citations, metadata: attrs };
      }
      return {
        id: `block-${index + 1}`,
        type: 'paragraph',
        content: text,
        citations,
        metadata: attrs,
      };
    })
    .filter((block): block is MemoBlock => Boolean(block));

  return blocks.length > 0
    ? blocks.slice(0, 80)
    : [{ id: 'block-1', type: 'paragraph', content: 'Draft started in PraxisWriter.', citations: [], metadata: {} }];
}

function download(filename: string, type: string, body: BlobPart | Blob) {
  const blob = body instanceof Blob ? body : new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function saveLabel(state: 'idle' | 'saving' | 'saved' | 'local' | 'error', lastSavedAt: string | null) {
  if (state === 'saving') return 'Saving...';
  if (state === 'saved') {
    const suffix = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now';
    return `Saved ${suffix}`;
  }
  if (state === 'local') return 'Saved locally';
  if (state === 'error') return 'Local save error';
  return 'Draft ready';
}

export function PraxisWriter({
  mode = 'write',
  title: titleProp,
  templateId = 'policy-memo',
}: PraxisWriterProps) {
  const { activeUserCore, activeSituation, sources } = useWriterContext();
  const [docTitle, setDocTitle] = useState(titleProp ?? 'Policy note');
  const [editorJson, setEditorJson] = useState<JSONContent | null>(null);
  const [editorHtml, setEditorHtml] = useState(STARTER_DOCUMENT);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashRange, setSlashRange] = useState<{ from: number; to: number } | null>(null);
  const [citations, setCitations] = useState<WriterCitation[]>([]);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const caseId = activeSituation?.id ?? 'workspace';
  const docId = `${mode}-${templateId}`;
  const storageKey = `writer:${caseId}:${docId}`;
  const blocks = useMemo(() => blocksFromJson(editorJson), [editorJson]);
  const markdown = useMemo(() => memoBlocksToMarkdown(docTitle, blocks), [blocks, docTitle]);
  const evidenceReviews = useMemo(() => buildEvidenceReviews(
    blocks
      .filter((block) => block.type !== 'heading' && block.content.trim().length > 0)
      .map((block) => ({ id: block.id, heading: block.title ?? block.type, body: block.content })),
    sources.map((source) => `${source.title} ${source.citation} ${source.excerpt}`),
  ), [blocks, sources]);
  const evidenceSummary = useMemo(() => summarizeEvidenceCoverage(evidenceReviews), [evidenceReviews]);
  const dateCheckCount = useMemo(() => evidenceReviews.filter((review) => /\b(20\d{2}|19\d{2}|today|yesterday|current|latest)\b/i.test(review.heading)).length, [evidenceReviews]);
  const evidenceGapCount = Math.max(0, Math.min(6, blocks.filter((block) => block.type !== 'heading' && (block.citations?.length ?? 0) === 0).length - sources.length));
  const contextHealth = useMemo(() => buildContextHealthReport({
    hasUserCore: Boolean(activeUserCore),
    hasSituationCore: Boolean(activeSituation),
    sourceCount: activeSituation?.sourceUrls?.length ?? sources.length,
    documentCount: activeSituation?.documentCount ?? 0,
    actorCount: activeSituation?.actors?.length ?? activeSituation?.actorCount ?? 0,
    hasTimeline: Boolean(activeSituation?.keyDates?.length || activeSituation?.latestEventDate || activeSituation?.conflictOnsetDate),
    evidenceGapCount,
    hasDraft: blocks.length > 3,
    situationHref: activeSituation ? `/app/workbench/${activeSituation.id}` : '/app/contexts',
  }), [activeSituation, activeUserCore, blocks.length, evidenceGapCount, sources.length]);
  const autosave = useWriterAutosave({
    key: storageKey,
    title: docTitle,
    caseId,
    docId,
    templateId,
    json: editorJson,
    html: editorHtml,
    markdown,
    blocks,
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      ProvenanceBlock,
      CitationMark,
      LinkExtension.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Write with PRAXIS. Type / for Ask, citations, evidence gaps, timeline, BLUF, and handover blocks.',
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'min-h-[680px] max-w-none px-8 py-7 text-[15px] leading-7 text-navy-900 outline-none prose prose-slate prose-headings:text-navy-950 prose-a:text-diplomatic-blue prose-strong:text-navy-950',
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target instanceof Element ? event.target : null;
        const citationEl = target?.closest('[data-citation-id]');
        const citationId = citationEl?.getAttribute('data-citation-id');
        if (citationId) {
          setSelectedCitationId(citationId);
          return true;
        }
        return false;
      },
    },
    content: STARTER_DOCUMENT,
    onUpdate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON();
      const html = currentEditor.getHTML();
      setEditorJson(json);
      setEditorHtml(html);
      const from = currentEditor.state.selection.from;
      const before = currentEditor.state.doc.textBetween(Math.max(0, from - 40), from, '\n', '\n');
      const match = before.match(/\/([a-z]*)$/);
      if (match) {
        setSlashQuery(match[0]);
        setSlashRange({ from: from - match[0].length, to: from });
      } else {
        setSlashQuery(null);
        setSlashRange(null);
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    setEditorJson(editor.getJSON());
    setEditorHtml(editor.getHTML());
    let cancelled = false;
    void getLocalWriterDraft<LocalDraft>(storageKey).then((draft) => {
      if (cancelled || !draft?.json) return;
      editor.commands.setContent(draft.json);
      if (draft.title) setDocTitle(draft.title);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [editor, storageKey]);

  const selectedText = useCallback(() => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ').trim();
  }, [editor]);

  const runAsk = useCallback(async (modeToRun: 'ask' | 'tighten' | 'soften' | 'steelman' = 'ask') => {
    if (!editor || aiBusy) return;
    setAiBusy(true);
    try {
      const result = await runWriterAsk({
        situationId: activeSituation?.id,
        situation: activeSituation ?? undefined,
        selectionText: selectedText(),
        prompt:
          modeToRun === 'ask'
            ? `Draft a useful, evidence-grounded passage for "${docTitle}".`
            : `Apply ${modeToRun} to the selected passage for this PRAXIS work product.`,
        mode: modeToRun,
      });
      setCitations((prev) => {
        const known = new Set(prev.map((item) => item.id));
        return [...prev, ...result.citations.filter((item) => !known.has(item.id))];
      });
      if (result.citations[0]) setSelectedCitationId(result.citations[0].id);
      insertWriterAskResult(editor, result);
    } catch (error) {
      editor
        .chain()
        .focus()
        .insertContent(`<p data-provenance-tool="ask-praxis" data-confidence="fallback">Ask PRAXIS could not complete: ${error instanceof Error ? error.message : 'unknown error'}.</p>`)
        .run();
    } finally {
      setAiBusy(false);
    }
  }, [activeSituation, aiBusy, docTitle, editor, selectedText]);

  const insertSourceCitation = useCallback(() => {
    if (!editor) return;
    const source = sources[0];
    if (!source) return;
    const citation: WriterCitation = {
      id: source.id,
      index: citations.length + 1,
      layer: source.sourceType,
      title: source.title,
      citation: source.citation,
    };
    setCitations((prev) => prev.some((item) => item.id === citation.id) ? prev : [...prev, citation]);
    setSelectedCitationId(citation.id);
    editor
      .chain()
      .focus()
      .setCitation({ citationId: citation.id, sourceType: citation.layer, title: citation.title })
      .insertContent(source.title)
      .unsetCitation()
      .run();
  }, [citations.length, editor, sources]);

  const commands = useMemo(
    () =>
      buildPraxisSlashCommands({
        ask: () => runAsk('ask'),
        cite: insertSourceCitation,
        rewrite: (rewriteMode) => runAsk(rewriteMode),
      }),
    [insertSourceCitation, runAsk],
  );

  function runSlashCommand(command: PraxisSlashCommand) {
    if (!editor) return;
    if (slashRange) editor.commands.deleteRange(slashRange);
    setSlashQuery(null);
    setSlashRange(null);
    void command.run(editor);
  }

  async function exportDocument(format: 'md' | 'docx' | 'pdf') {
    const filenameRoot = `${caseId}-${templateId}`.replace(/[^a-z0-9._-]+/gi, '-');
    if (format === 'md') {
      download(`${filenameRoot}.md`, 'text/markdown;charset=utf-8', markdown);
      return;
    }
    if (format === 'docx') {
      const [{ Document, HeadingLevel, Packer, Paragraph }] = await Promise.all([import('docx')]);
      const doc = new Document({
        sections: [{
          properties: {},
          children: memoBlocksToPlainText(docTitle, blocks).split('\n').filter(Boolean).map((line, index) => (
            new Paragraph({
              text: line,
              heading: index === 0 ? HeadingLevel.TITLE : undefined,
            })
          )),
        }],
      });
      const blob = await Packer.toBlob(doc);
      download(`${filenameRoot}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', blob);
      return;
    }
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    let y = margin;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    for (const line of memoBlocksToPlainText(docTitle, blocks).split('\n')) {
      const wrapped = pdf.splitTextToSize(line || ' ', 500) as string[];
      for (const segment of wrapped) {
        if (y > 760) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(segment, margin, y);
        y += 15;
      }
    }
    pdf.save(`${filenameRoot}.pdf`);
  }

  return (
    <main className="mx-auto flex max-w-[1680px] flex-col gap-5 pb-16" data-testid="praxis-writer">
      <header className="grid gap-4 rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5 backdrop-blur xl:grid-cols-[minmax(0,1fr)_520px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Write with PRAXIS</p>
          <input
            value={docTitle}
            onChange={(event) => setDocTitle(event.target.value)}
            className="mt-2 w-full rounded-md border border-transparent bg-transparent px-0 text-3xl font-semibold tracking-tight text-navy-950 outline-none focus:border-slate-200 focus:bg-white focus:px-2 sm:text-4xl"
            aria-label="Document title"
          />
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            One canonical writing surface for memos, drafts, handovers, and long-form Ask PRAXIS answers. Type `/` for PRAXIS-native commands.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <AttachedPill icon={Brain} label="User Core" value={activeUserCore.identity} href="/app/cores/user" />
          <AttachedPill icon={Target} label="Situation Core" value={activeSituation?.name ?? 'No context selected'} href="/app/contexts" />
          <AttachedPill icon={BookOpenCheck} label="Source Graph" value={`${sources.length} attached sources`} href="/app/sources" />
          <AttachedPill icon={Wrench} label="Recommended Tools" value={HERO_TOOLS.slice(0, 3).map((tool) => tool.name).join(', ')} href="/app/tools" />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        <aside className="hidden min-h-[720px] rounded-lg border border-slate-200 bg-white p-4 xl:block">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-sm font-semibold text-navy-950">Memo outline</h2>
          </div>
          <div className="mt-3 space-y-2">
            {['Executive summary', 'Situation background', 'Analysis', 'Options', 'Risks', 'Recommendations', 'Sources', 'Handover notes'].map((section) => (
              <button key={section} type="button" className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-navy-800 hover:bg-white">
                {section}
              </button>
            ))}
          </div>
        </aside>

        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-xl shadow-navy-950/5">
          <WriterToolbar
            editor={editor}
            saveLabel={saveLabel(autosave.state, autosave.lastSavedAt)}
            onAsk={() => void runAsk('ask')}
            onExport={(format) => void exportDocument(format)}
          />
          {slashQuery ? <SlashMenu commands={commands} query={slashQuery} onRun={runSlashCommand} /> : null}
          {aiBusy ? (
            <div className="absolute right-4 top-16 z-20 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1.5 text-xs font-semibold text-gold-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Asking PRAXIS
            </div>
          ) : null}
          <div className="px-3 py-6 sm:px-6">
            <div className="mx-auto min-h-[860px] max-w-[820px] bg-white shadow-lg shadow-navy-950/10 ring-1 ring-slate-200">
              <div className="border-b border-slate-100 px-8 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">PRAXIS memo studio</p>
                <p className="mt-1 text-xs text-slate-600">
                  Inherits {activeUserCore.identity} + {activeSituation?.name ?? 'no Situation Core'} + {sources.length} source receipts.
                </p>
              </div>
              <EditorContent editor={editor} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-3">
            <ProvenanceChip core="user-core" tool="writer" confidence="draft" />
            <ProvenanceChip core="situation-core" tool="ask-praxis" confidence={citations.length > 0 ? 'cited' : 'open'} />
          </div>
        </div>

        <div className="min-h-[720px] overflow-hidden rounded-lg border border-slate-200 bg-white">
          <section className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Context health</p>
                <h2 className="text-sm font-semibold text-navy-950">{contextHealth.score}/100 - {contextHealth.label}</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
                {evidenceGapCount} gaps
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {contextHealth.nextActions.map((action) => (
                <Link key={action.id} href={action.href} className="block rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-navy-800 hover:bg-white">
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
          <section className="border-b border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Evidence Gap Finder</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <EvidenceStat label="Supported" value={evidenceSummary.ready} tone="ready" />
              <EvidenceStat label="Weak" value={evidenceSummary.thin} tone="weak" />
              <EvidenceStat label="Unsupported" value={evidenceSummary.missing} tone="missing" />
              <EvidenceStat label="Date check" value={dateCheckCount} tone="weak" />
            </div>
            <div className="mt-3 space-y-2">
              {evidenceReviews.filter((review) => review.coverageState !== 'ready').slice(0, 3).map((review) => (
                <div key={review.sectionId} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-navy-900">{review.heading}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{review.sectionQuestions[0]}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href="/app/contexts" className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-navy-700">
                      Find source
                    </Link>
                    <button type="button" onClick={() => void runAsk('soften')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-navy-700">
                      Rewrite cautiously
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <CitationSidebar
            citations={citations}
            sources={sources}
            selectedCitationId={selectedCitationId}
            onSelect={setSelectedCitationId}
          />
          <section className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-diplomatic-blue" />
              <h2 className="text-sm font-semibold text-navy-950">Answer actions</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {['Save as memo', 'Attach to Situation Core', 'Re-run deep', 'Open Ask PRAXIS'].map((label) => (
                <Link
                  key={label}
                  href={label === 'Open Ask PRAXIS' ? '/app/assistant' : '/app/tools'}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-navy-800 transition hover:border-diplomatic-blue/40 hover:bg-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function EvidenceStat({ label, value, tone }: { label: string; value: number; tone: 'ready' | 'weak' | 'missing' }) {
  const toneClass = tone === 'ready'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : tone === 'weak'
      ? 'border-gold-200 bg-gold-50 text-gold-800'
      : 'border-crimson/20 bg-crimson/5 text-crimson';

  return (
    <div className={`rounded-md border p-2 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function AttachedPill({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-gold-300 hover:bg-white">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="mt-1 block truncate text-sm font-semibold text-navy-950">{value}</span>
    </Link>
  );
}
