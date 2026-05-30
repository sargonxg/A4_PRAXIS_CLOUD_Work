'use client';

/**
 * MemoDesk — the standalone PRAXIS writing surface.
 *
 * Layout:
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  Top bar: title · status · export · share · Ask toggle     │
 *   ├──────────┬──────────────────────────────────┬──────────────┤
 *   │ Library  │     A4-feel document canvas      │ Ask PRAXIS    │
 *   │ (left,   │     (Tiptap editor)              │ (right,       │
 *   │ collap-  │                                  │ collapsible)  │
 *   │ sible)   │                                  │               │
 *   └──────────┴──────────────────────────────────┴──────────────┘
 *
 * Pure client component. Reads the active context stack so attached
 * sources surface in the Library rail and Ask PRAXIS routes through
 * the existing /api/ai/chat endpoint with the active capsule context.
 *
 * Design rule §3: serif for body, sans for UI chrome, mono for
 * receipts. The A4 chrome uses EB Garamond and generous margins so
 * the document genuinely reads like a Word page, not a textarea.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  BookOpenCheck,
  Brain,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileText,
  Heading1,
  Heading2,
  Italic,
  Library,
  List,
  ListOrdered,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Quote,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Type,
  Upload,
  Wand2,
} from 'lucide-react';
import { ReceiptCard } from '@/components/shared/receipt-card';
import { ContextCapsulePreview } from '@/components/context/context-capsule-preview';
import { SourceMentionMenu } from '@/components/memo/source-mention-menu';
import { GapFillerRail } from '@/components/memo/GapFillerRail';
import { useSituationStore } from '@/stores/situation-store';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';
import type { MemoBlock } from '@/types/memo';

interface AskTurn {
  id: string;
  role: 'user' | 'praxis';
  text: string;
  citations?: Array<{ id: string; source: string; span?: string }>;
  ts: number;
}

interface CapsuleSummary {
  capsuleId: string;
  label?: string;
  version: number;
  health?: { score?: number; missingCores?: string[]; warnings?: string[] };
  activeForSituationIds?: string[];
}

interface TrustPostureSummary {
  trustPosture?: {
    score: number;
    band: 'thin' | 'usable' | 'ready';
    contributors: Array<{
      id: string;
      signal: string;
      score: number;
      detail: string;
      clickTarget?: { href: string; label: string };
    }>;
  };
  capsule?: {
    capsuleId: string;
    version: number;
    healthScore: number;
  };
}

const SLASH_COMMANDS = [
  { id: 'grounded', label: 'Grounded paragraph', icon: ShieldCheck, hint: 'Insert a paragraph backed by attached receipts.' },
  { id: 'cite', label: 'Cite at cursor', icon: Quote, hint: 'Drop a [n] superscript pinned to the next claim.' },
  { id: 'rewrite-cautiously', label: 'Rewrite cautiously', icon: Wand2, hint: 'Soften unsupported language and surface hedges.' },
  { id: 'red-team', label: 'Red-team this paragraph', icon: Brain, hint: 'Get the strongest objection to the current paragraph.' },
  { id: 'scenario', label: 'Map a scenario', icon: FileText, hint: 'Add a counter-factual scenario block with a horizon.' },
] as const;

const DEFAULT_TITLE = 'Untitled policy memo';
const CORE_LAYERS = [
  { id: 'user-core', label: 'User', detail: 'Role, audience, tone' },
  { id: 'situation-core', label: 'Situation', detail: 'Case frame and actors' },
  { id: 'source-core', label: 'Sources', detail: 'Receipts and documents' },
  { id: 'graph-core', label: 'Graph', detail: 'Relationships and timeline' },
  { id: 'objective-core', label: 'Objective', detail: 'Task and decision need' },
  { id: 'output-core', label: 'Output', detail: 'Memo shape and audience' },
] as const;

const OBJECTIVE_CORES = [
  'Frame decision options',
  'Brief a senior principal',
  'Prepare mediation language',
  'Check claims and caveats',
  'Build handover note',
] as const;

const OUTPUT_CORES = [
  'Policy memo',
  'Talking points',
  'Decision brief',
  'Legal-risk note',
  'Humanitarian update',
  'Handover note',
] as const;

function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ch === '&' ? '&amp;'
    : ch === '<' ? '&lt;'
    : ch === '>' ? '&gt;'
    : ch === '"' ? '&quot;'
    : '&#39;');
}

const STARTER_HTML = `
  <h1>Untitled policy memo</h1>
  <p data-praxis-bottom-line><strong>Bottom line.</strong> State the working judgement here in one sentence. Keep confidence and source gaps visible.</p>
  <h2>Situation</h2>
  <p>Frame the moment. Who is acting, what they want, the constraint that matters now.</p>
  <h2>Evidence</h2>
  <ul>
    <li>Supported claim with a receipt.</li>
    <li>Open question or missing source.</li>
  </ul>
  <h2>Options</h2>
  <ol>
    <li>Option A. Risk surface and trip-wires.</li>
    <li>Option B. Trade-offs and required postures.</li>
  </ol>
  <h2>Recommendation</h2>
  <p>State the recommended next move and what PRAXIS should inspect before this memo ships.</p>
`;

const STORAGE_PREFIX = 'praxis.memo.';

interface MemoDeskProps {
  documentId?: string;
}

export function MemoDesk({ documentId = 'default' }: MemoDeskProps) {
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const { user } = useAuth();
  const sources = useMemo(() => (activeSituation?.sourceUrls ?? []).slice(0, 12), [activeSituation]);

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [askOpen, setAskOpen] = useState(true);
  const [slashAt, setSlashAt] = useState<{ x: number; y: number } | null>(null);
  const [slashQuery, setSlashQuery] = useState('');
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [askInput, setAskInput] = useState('');
  const [askPending, setAskPending] = useState(false);
  const [capsules, setCapsules] = useState<CapsuleSummary[]>([]);
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string | null>(null);
  const [selectedCoreIds, setSelectedCoreIds] = useState<string[]>(() => CORE_LAYERS.map((core) => core.id));
  const [objectiveCore, setObjectiveCore] = useState<typeof OBJECTIVE_CORES[number]>('Frame decision options');
  const [outputCore, setOutputCore] = useState<typeof OUTPUT_CORES[number]>('Policy memo');
  const [trustPosture, setTrustPosture] = useState<TrustPostureSummary | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [serverSaveState, setServerSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportOpen, setExportOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'library' | 'ask' | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const storageKey = `${STORAGE_PREFIX}${documentId}`;
  const activeCapsule = useMemo(() => {
    if (selectedCapsuleId) {
      const selected = capsules.find((capsule) => capsule.capsuleId === selectedCapsuleId);
      if (selected) return selected;
    }
    if (!activeSituation?.id) return capsules[0] ?? null;
    return capsules.find((capsule) => capsule.activeForSituationIds?.includes(activeSituation.id)) ?? capsules[0] ?? null;
  }, [activeSituation?.id, capsules, selectedCapsuleId]);
  const selectedCoreLabels = useMemo(
    () => CORE_LAYERS.filter((core) => selectedCoreIds.includes(core.id)).map((core) => core.label),
    [selectedCoreIds],
  );
  const trustScore =
    trustPosture?.trustPosture?.score ??
    trustPosture?.capsule?.healthScore ??
    activeCapsule?.health?.score ??
    null;
  const trustBand = trustPosture?.trustPosture?.band ?? (trustScore === null ? 'thin' : trustScore >= 75 ? 'ready' : trustScore >= 45 ? 'usable' : 'thin');
  const contextChecklist = useMemo(() => {
    const contributors = trustPosture?.trustPosture?.contributors ?? [];
    if (contributors.length > 0) return contributors.slice(0, 5);
    return [
      {
        id: 'situation',
        signal: 'situation context',
        score: activeSituation?.id ? 70 : 15,
        detail: activeSituation?.name ? `${activeSituation.name} is attached to this memo.` : 'Attach a Situation Core before drafting decisions.',
      },
      {
        id: 'sources',
        signal: 'source coverage',
        score: sources.length > 0 ? 65 : 10,
        detail: sources.length > 0 ? `${sources.length} source URL(s) are available for citations.` : 'Add sources so claims can carry receipts.',
      },
    ];
  }, [activeSituation?.id, activeSituation?.name, sources.length, trustPosture]);
  const usingRow = useMemo(() => {
    const hasUserCore = Boolean(user?.name ?? user?.email);
    const items = [
      hasUserCore ? 'User Core' : null,
      activeSituation?.name ?? 'No Situation Core',
      activeCapsule ? `${activeCapsule.capsuleId} v${activeCapsule.version}` : 'No capsule',
      `${sources.length} source${sources.length === 1 ? '' : 's'}`,
      objectiveCore,
      outputCore,
    ].filter(Boolean);
    return items.join('  ·  ');
  }, [activeCapsule, activeSituation?.name, objectiveCore, outputCore, sources.length, user?.email, user?.name]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Type to draft… or press / for PRAXIS commands.' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: STARTER_HTML,
    autofocus: 'end',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'memo-editor prose prose-slate max-w-none focus:outline-none',
      },
      handleKeyDown(_view, event) {
        if (event.key === '/') {
          // Defer to allow the "/" to land, then anchor the slash menu.
          window.setTimeout(() => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const rect = sel.getRangeAt(0).getBoundingClientRect();
            const containerRect = editorContainerRef.current?.getBoundingClientRect();
            const x = rect.left - (containerRect?.left ?? 0);
            const y = rect.bottom - (containerRect?.top ?? 0);
            setSlashAt({ x, y });
            setSlashQuery('');
          }, 0);
        } else if (event.key === 'Escape' && slashAt) {
          setSlashAt(null);
        }
        return false;
      },
      handleTextInput(_view, _from, _to, text) {
        if (slashAt) setSlashQuery((q) => q + text);
        return false;
      },
    },
  });

  // Load saved draft once mounted.
  useEffect(() => {
    if (typeof window === 'undefined' || !editor) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { title?: string; html?: string };
        if (parsed.title) setTitle(parsed.title);
        if (parsed.html) editor.commands.setContent(parsed.html, { emitUpdate: false });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Autosave on edit.
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ title, html: editor.getHTML(), ts: Date.now() }),
        );
        setSavedAt(new Date().toISOString());
        setServerSaveState((state) => (state === 'saved' ? 'idle' : state));
      } catch {
        /* ignore quota */
      }
    };
    editor.on('update', handler);
    return () => {
      editor.off('update', handler);
    };
  }, [editor, storageKey, title]);

  useEffect(() => {
    let alive = true;
    async function loadContext() {
      setContextLoading(true);
      try {
        const query = activeSituation?.id ? `?situationId=${encodeURIComponent(activeSituation.id)}` : '';
        const capsuleRes = await fetch(`/api/context/capsules${query}`, { credentials: 'include' });
        const capsuleBody = capsuleRes.ok
          ? ((await capsuleRes.json()) as { capsules?: CapsuleSummary[] })
          : { capsules: [] };
        if (!alive) return;
        const nextCapsules = capsuleBody.capsules ?? [];
        setCapsules(nextCapsules);

        const capsule = activeSituation?.id
          ? nextCapsules.find((item) => item.activeForSituationIds?.includes(activeSituation.id)) ?? nextCapsules[0]
          : nextCapsules[0];
        if (capsule?.capsuleId) {
          setSelectedCapsuleId((current) => current ?? capsule.capsuleId);
        }
        if (capsule || activeSituation?.id) {
          const params = new URLSearchParams();
          if (activeSituation?.id) params.set('situationId', activeSituation.id);
          if (capsule?.capsuleId) params.set('capsuleId', capsule.capsuleId);
          const trustRes = await fetch(`/api/context/trust-posture?${params.toString()}`, { credentials: 'include' });
          if (trustRes.ok && alive) {
            setTrustPosture((await trustRes.json()) as TrustPostureSummary);
          }
        }
      } catch (err) {
        console.warn('[memo-desk] context posture load failed:', err);
        if (alive) setTrustPosture(null);
      } finally {
        if (alive) setContextLoading(false);
      }
    }
    void loadContext();
    return () => {
      alive = false;
    };
  }, [activeSituation?.id]);

  const runWriterPrompt = useCallback(async ({
    prompt,
    mode = 'ask',
    insert = false,
  }: {
    prompt: string;
    mode?: 'ask' | 'tighten' | 'soften' | 'steelman';
    insert?: boolean;
  }) => {
    if (!editor) throw new Error('Editor is not ready.');
    const instruction = buildWriterInstruction({
      prompt,
      title,
      usingRow,
      selectedCoreLabels,
      objectiveCore,
      outputCore,
      activeCapsule,
      trustBand,
      trustScore,
      sources,
    });
    const userTurn: AskTurn = { id: `u-${Date.now()}`, role: 'user', text: prompt, ts: Date.now() };
    setTurns((items) => [...items, userTurn]);
    setAskPending(true);
    try {
      const selectionText = selectedEditorText(editor) || editor.getText().slice(0, 6000);
      const res = await fetch('/api/ai/writer/ask', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          situationId: activeSituation?.id,
          situation: activeSituation,
          selectionText,
          prompt: instruction,
          mode,
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as {
        text?: string;
        citations?: Array<{ id?: string; title?: string; layer?: string; excerpt?: string }>;
      };
      const text = data.text?.trim() || 'PRAXIS returned no draft text.';
      const praxisTurn: AskTurn = {
        id: `p-${Date.now()}`,
        role: 'praxis',
        text,
        citations: (data.citations ?? []).map((citation, index) => ({
          id: citation.id ?? `citation-${index + 1}`,
          source: citation.title ?? citation.layer ?? 'PRAXIS source',
          span: citation.excerpt,
        })),
        ts: Date.now(),
      };
      setTurns((items) => [...items, praxisTurn]);
      if (insert) {
        editor.chain().focus().insertContent(renderAiInsertHtml(text)).run();
      }
      return text;
    } catch (err) {
      const text = `PRAXIS writing request failed. ${err instanceof Error ? err.message : 'Unknown error.'}`;
      setTurns((items) => [...items, { id: `p-${Date.now()}`, role: 'praxis', text, ts: Date.now() }]);
      throw err;
    } finally {
      setAskPending(false);
    }
  }, [
    activeCapsule,
    activeSituation,
    editor,
    objectiveCore,
    outputCore,
    selectedCoreLabels,
    sources,
    title,
    trustBand,
    trustScore,
    usingRow,
  ]);

  const runSlashCommand = useCallback(
    (id: typeof SLASH_COMMANDS[number]['id']) => {
      if (!editor) return;
      // Strip the leading "/" + query that the user typed.
      const trimming = slashQuery.length + 1;
      editor.commands.command(({ tr, state }) => {
        const to = state.selection.from;
        const from = Math.max(0, to - trimming);
        tr.delete(from, to);
        return true;
      });
      setSlashAt(null);
      setSlashQuery('');

      if (id === 'cite') {
        editor.chain().focus().insertContent(`<sup>[${(turns.filter((t) => t.role === 'praxis').length || 0) + 1}]</sup>`).run();
        return;
      }
      if (id === 'grounded') {
        const topic = (slashQuery.trim() || 'next analytical claim').slice(0, 200);
        editor
          .chain()
          .focus()
          .insertContent(
            '<p data-praxis-pending="true"><em>Drafting grounded paragraph…</em></p>',
          )
          .run();
        void runWriterPrompt({
          prompt: `Draft one grounded paragraph for this memo on: ${topic}. Use the selected cores, cite available sources inline, and mark any unsupported claim as an assumption.`,
          mode: 'ask',
          insert: true,
        }).catch(() => {
          editor.chain().focus().insertContent('<p><em>Grounded paragraph could not be generated. Check Ask PRAXIS and attached sources.</em></p>').run();
        });
        return;
      }
      if (id === 'rewrite-cautiously') {
        void runWriterPrompt({
          prompt: 'Rewrite the current or preceding paragraph cautiously. Preserve citations, soften unsupported certainty, and identify any assumption.',
          mode: 'soften',
          insert: true,
        }).catch(() => {
          editor.chain().focus().insertContent('<p><em>… rewrite the prior paragraph with hedged claims and explicit gaps.</em></p>').run();
        });
        return;
      }
      if (id === 'red-team') {
        void runWriterPrompt({
          prompt: 'Red-team the current paragraph. Give the strongest objection, what evidence would change the judgement, and a safer revision path.',
          mode: 'steelman',
          insert: true,
        }).catch(() => {
          editor.chain().focus().insertContent('<blockquote><strong>Red team.</strong> Strongest objection: …</blockquote>').run();
        });
        return;
      }
      if (id === 'scenario') {
        void runWriterPrompt({
          prompt: 'Draft a concise scenario block with horizon, trigger, actor moves, implications, and evidence gaps.',
          mode: 'ask',
          insert: true,
        }).catch(() => {
          editor
            .chain()
            .focus()
            .insertContent('<h3>Scenario</h3><p><strong>Horizon:</strong> 2026-2028. <strong>Trigger:</strong> ... <strong>Implications:</strong> ...</p>')
            .run();
        });
        return;
      }
    },
    [editor, runWriterPrompt, slashQuery, turns],
  );

  const filteredSlash = SLASH_COMMANDS.filter((c) =>
    slashQuery.length === 0 ? true : c.label.toLowerCase().includes(slashQuery.toLowerCase()),
  );

  async function sendAsk() {
    const trimmed = askInput.trim();
    if (!trimmed || askPending) return;
    setAskInput('');
    try {
      await runWriterPrompt({ prompt: trimmed, mode: 'ask' });
    } catch {
      // runWriterPrompt already appends the visible failure turn.
    }
  }

  async function insertAskReply(turn: AskTurn) {
    if (!editor) return;
    // Persist the handoff first so the inserted paragraph carries a
    // memo-source receipt (capsule version + citation list + tool
    // invocations). The editor insertion remains the source of truth
    // for what the analyst sees; the API record is the audit trail.
    let memoId: string | null = null;
    try {
      const res = await fetch('/api/memos/from-ask', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capsuleId: activeCapsule?.capsuleId ?? 'default',
          capsuleVersion: activeCapsule?.version ?? 1,
          situationId: activeSituation?.id ?? null,
          askTurnId: turn.id,
          sourceReceipts: turn.citations ?? [],
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { memoId?: string };
        memoId = body.memoId ?? null;
      }
    } catch (err) {
      console.warn('[memo-desk] from-ask handoff failed (non-fatal):', err);
    }
    const html = memoId
      ? `<p data-memo-source-id="${escapeAttr(memoId)}">${turn.text}</p>`
      : `<p>${turn.text}</p>`;
    editor.chain().focus().insertContent(html).run();
  }

  function insertSourceCitation(url: string, index: number) {
    if (!editor) return;
    const label = hostnameOf(url);
    editor
      .chain()
      .focus()
      .insertContent(
        ` <a href="${escapeAttr(url)}" data-source-url="${escapeAttr(url)}">[${index + 1}] ${escapeAttr(label)}</a>`,
      )
      .run();
  }

  async function saveDraftToServer() {
    if (!editor) return;
    setServerSaveState('saving');
    try {
      const html = editor.getHTML();
      const blocks = memoHtmlToBlocks(html);
      const res = await fetch('/api/memos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          caseId: activeSituation?.id ?? 'memo-studio',
          templateId: 'policy-memo',
          title,
          blocks,
          graphSnapshotId: activeCapsule
            ? `${activeCapsule.capsuleId}-v${activeCapsule.version}`
            : `memo-studio-${Date.now().toString(36)}`,
          status: 'draft',
          changeNote: 'Saved from Memo Studio with active context capsule.',
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setServerSaveState('saved');
      setSavedAt(new Date().toISOString());
    } catch (err) {
      console.warn('[memo-desk] server save failed:', err);
      setServerSaveState('error');
    }
  }

  function htmlToMarkdown(html: string): string {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, '\n')
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function safeFilename(): string {
    return title.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase() || 'memo';
  }

  function exportMarkdown() {
    if (!editor) return;
    const md = htmlToMarkdown(editor.getHTML());
    downloadBlob(
      new Blob([`# ${title}\n\n${md}`], { type: 'text/markdown;charset=utf-8' }),
      `${safeFilename()}.md`,
    );
  }

  async function exportDocx() {
    if (!editor) return;
    const { Document, Packer, Paragraph, HeadingLevel } = await import('docx');
    const md = htmlToMarkdown(editor.getHTML());
    const lines = `# ${title}\n\n${md}`.split('\n');
    const children = lines.map((line) => {
      if (line.startsWith('# ')) return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 });
      if (line.startsWith('## ')) return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 });
      if (line.startsWith('### ')) return new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 });
      if (line.startsWith('> ')) return new Paragraph({ text: line.slice(2), style: 'IntenseQuote' });
      if (line.startsWith('- ')) return new Paragraph({ text: line.slice(2), bullet: { level: 0 } });
      return new Paragraph({ text: line });
    });
    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${safeFilename()}.docx`);
  }

  async function exportPdf() {
    if (!editor) return;
    const { jsPDF } = await import('jspdf');
    const md = htmlToMarkdown(editor.getHTML());
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 56;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;
    doc.setFont('Times', 'bold');
    doc.setFontSize(18);
    doc.text(title, margin, y);
    y += 28;
    doc.setFont('Times', 'normal');
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(md, pageWidth - margin * 2) as string[];
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 16;
    }
    doc.save(`${safeFilename()}.pdf`);
  }

  return (
    <div
      className="memo-desk -mx-4 -my-4 flex h-[calc(100vh-3.5rem)] min-h-0 flex-col bg-[#F6F4ED] md:-mx-6 md:-my-6"
      data-testid="memo-desk"
      aria-label="Write for Memo Studio as an editable document"
    >
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm md:px-6">
        <FileText className="h-4 w-4 shrink-0 text-[#8A5A00]" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Document title"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          placeholder="Untitled memo"
        />
        <span className="hidden text-[11px] uppercase tracking-[0.16em] text-slate-400 sm:inline">
          {savedAt ? `saved ${new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'autosave on'}
        </span>
        <button
          type="button"
          onClick={() => { void saveDraftToServer(); }}
          disabled={serverSaveState === 'saving'}
          aria-label="Save draft"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-semibold transition sm:px-3',
            serverSaveState === 'saved'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : serverSaveState === 'error'
                ? 'border-crimson/20 bg-crimson/5 text-crimson'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
          )}
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {serverSaveState === 'saving' ? 'Saving' : serverSaveState === 'saved' ? 'Saved' : serverSaveState === 'error' ? 'Retry save' : 'Save draft'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setLibraryOpen((v) => !v)}
          aria-label="Toggle library"
          className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:inline-flex"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setAskOpen((v) => !v)}
          aria-label="Toggle Ask PRAXIS"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <PanelRight className="h-4 w-4" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          {exportOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
              onMouseLeave={() => setExportOpen(false)}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => { exportMarkdown(); setExportOpen(false); }}
                className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Markdown (.md)
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { void exportDocx(); setExportOpen(false); }}
                className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Word (.docx)
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { void exportPdf(); setExportOpen(false); }}
                className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                PDF (.pdf)
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-[#FBFAF6] px-3 py-1.5 md:px-6">
        <ToolbarButton
          label="Paragraph"
          icon={Type}
          onClick={() => editor?.chain().focus().setParagraph().run()}
          active={editor?.isActive('paragraph') ?? false}
        />
        <ToolbarButton
          label="Heading 1"
          icon={Heading1}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor?.isActive('heading', { level: 1 }) ?? false}
        />
        <ToolbarButton
          label="Heading 2"
          icon={Heading2}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive('heading', { level: 2 }) ?? false}
        />
        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
        <ToolbarButton
          label="Bold"
          icon={Type}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold') ?? false}
          strong
        />
        <ToolbarButton
          label="Italic"
          icon={Italic}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic') ?? false}
        />
        <ToolbarButton
          label="Bullets"
          icon={List}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList') ?? false}
        />
        <ToolbarButton
          label="Numbered list"
          icon={ListOrdered}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList') ?? false}
        />
        <ToolbarButton
          label="Quote"
          icon={Quote}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive('blockquote') ?? false}
        />
        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
        <button
          type="button"
          onClick={() => {
            void runWriterPrompt({
              prompt: `Draft a ${outputCore.toLowerCase()} from the selected cores for this objective: ${objectiveCore}. Use the active memo structure and return text ready to insert.`,
              mode: 'ask',
              insert: true,
            }).catch(() => undefined);
          }}
          disabled={askPending || !editor}
          className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-navy-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Draft from cores
        </button>
        <button
          type="button"
          onClick={() => {
            void runWriterPrompt({
              prompt: 'Find citation opportunities and evidence gaps in the selected text. Return concise edits and source needs.',
              mode: 'ask',
            }).catch(() => undefined);
          }}
          disabled={askPending || !editor}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Check claims
        </button>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sources rail */}
        {libraryOpen && (
          <aside
            className={cn(
              'h-full w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white/60 px-3 py-4 lg:block',
              mobilePane === 'library'
                ? 'fixed inset-y-0 left-0 z-40 w-[85vw] max-w-sm shadow-2xl lg:static lg:w-64 lg:shadow-none'
                : 'hidden',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A5A00]">Sources</p>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                aria-label="Close sources"
                className="text-slate-400 hover:text-slate-600"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 space-y-1.5">
              <ContextCapsulePreview
                userLabel={user?.name ?? user?.email ?? 'Analyst'}
                situationLabel={activeSituation?.name ?? 'No Situation Core'}
                sourceCount={sources.length}
                documentCount={activeSituation?.documentCount ?? 0}
                graphState={`${activeSituation?.actors?.length ?? activeSituation?.actorCount ?? 0} actors`}
                timeHorizon={activeSituation?.latestEventDate ?? activeSituation?.conflictOnsetDate ?? 'Set in Situation Core'}
                outputGoal={title}
                healthScore={trustScore ?? undefined}
                href="/app/contexts"
                compact
              />
              <LibrarySection icon={Brain} title="User Core" subtitle={user?.name ?? user?.email ?? 'No user core'} href="/app/cores/user" />
              <LibrarySection
                icon={BookOpenCheck}
                title="Situation"
                subtitle={activeSituation?.name ?? 'No situation attached'}
                href="/app/contexts"
              />
              <LibrarySection
                icon={Library}
                title={`${sources.length} sources`}
                subtitle="Receipts attached to this capsule."
                href="/app/contexts"
              />
              <LibrarySection
                icon={Upload}
                title="Import documents"
                subtitle="Add receipts before drafting."
                href={activeSituation?.id ? `/app/contexts?situationId=${activeSituation.id}` : '/app/contexts'}
              />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Use these cores</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {CORE_LAYERS.map((core) => {
                  const active = selectedCoreIds.includes(core.id);
                  return (
                    <button
                      key={core.id}
                      type="button"
                      onClick={() => {
                        setSelectedCoreIds((current) =>
                          active
                            ? current.filter((id) => id !== core.id)
                            : [...current, core.id],
                        );
                      }}
                      aria-pressed={active}
                      className={cn(
                        'rounded-md border px-2 py-1.5 text-left transition',
                        active
                          ? 'border-[#8A5A00]/40 bg-[#FAF8F2] text-slate-900'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                      )}
                    >
                      <span className="block text-[11px] font-semibold">{core.label}</span>
                      <span className="block truncate text-[10px]">{core.detail}</span>
                    </button>
                  );
                })}
              </div>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="memo-objective-core">
                Objective Core
              </label>
              <select
                id="memo-objective-core"
                value={objectiveCore}
                onChange={(event) => setObjectiveCore(event.target.value as typeof OBJECTIVE_CORES[number])}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#8A5A00] focus:outline-none"
              >
                {OBJECTIVE_CORES.map((objective) => <option key={objective}>{objective}</option>)}
              </select>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="memo-output-core">
                Output Core
              </label>
              <select
                id="memo-output-core"
                value={outputCore}
                onChange={(event) => setOutputCore(event.target.value as typeof OUTPUT_CORES[number])}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#8A5A00] focus:outline-none"
              >
                {OUTPUT_CORES.map((output) => <option key={output}>{output}</option>)}
              </select>
            </div>
            {capsules.length > 1 ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Capsule</p>
                <div className="mt-2 space-y-1.5">
                  {capsules.slice(0, 4).map((capsule) => (
                    <button
                      key={capsule.capsuleId}
                      type="button"
                      onClick={() => setSelectedCapsuleId(capsule.capsuleId)}
                      aria-pressed={activeCapsule?.capsuleId === capsule.capsuleId}
                      className={cn(
                        'w-full rounded-md border px-2 py-1.5 text-left text-[11px] transition',
                        activeCapsule?.capsuleId === capsule.capsuleId
                          ? 'border-[#8A5A00]/40 bg-[#FAF8F2] text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      )}
                    >
                      <span className="block truncate font-semibold">{capsule.label ?? capsule.capsuleId}</span>
                      <span className="block font-mono text-[10px] text-slate-400">v{capsule.version} · score {capsule.health?.score ?? '--'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Active capsule</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                    {activeCapsule?.label ?? activeCapsule?.capsuleId ?? 'No capsule attached'}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                    trustBand === 'ready'
                      ? 'bg-emerald-50 text-emerald-700'
                      : trustBand === 'usable'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {contextLoading ? 'checking' : trustBand}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-slate-50 px-2 py-1.5">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Score</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">{trustScore ?? '--'}</dd>
                </div>
                <div className="rounded-md bg-slate-50 px-2 py-1.5">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Version</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">v{activeCapsule?.version ?? 1}</dd>
                </div>
                <div className="rounded-md bg-slate-50 px-2 py-1.5">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Sources</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">{sources.length}</dd>
                </div>
              </dl>
              <div className="mt-3 space-y-1.5">
                {contextChecklist.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold capitalize text-slate-700">{item.signal}</span>
                      <span className="font-mono text-[10px] text-slate-500">{Math.round(item.score)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Attached sources</p>
              <div className="mt-2 space-y-1.5">
                {sources.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-200 bg-white p-3 text-[11px] leading-5 text-slate-500">
                    No sources attached. Add to the Source Core to ground claims here.
                  </p>
                ) : (
                  sources.map((url, i) => (
                    <div
                      key={url}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 hover:border-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-700"
                          title={url}
                        >
                          <span className="text-[#8A5A00]">[{i + 1}]</span> {hostnameOf(url)}
                        </a>
                        <button
                          type="button"
                          onClick={() => insertSourceCitation(url, i)}
                          className="shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:border-[#8A5A00]/40 hover:text-[#8A5A00]"
                        >
                          Cite
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Suggested receipts</p>
              <div className="mt-2 space-y-2">
                <ReceiptCard
                  claim="ICG reports renewed negotiations have stalled."
                  source="ICG · 2026-04-22"
                  span="§4 · p.12"
                  kind="verified"
                />
                <ReceiptCard
                  claim="Date for the ceasefire trigger is uncertain."
                  source="No source attached"
                  kind="gap"
                />
              </div>
            </div>
          </aside>
        )}
        {!libraryOpen && (
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            aria-label="Open library"
            className="hidden h-full w-8 items-center justify-center border-r border-slate-200 bg-white/60 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Editor center */}
        <main className="flex min-w-0 flex-1 justify-center overflow-y-auto bg-[#F6F4ED] px-4 py-8 md:px-8 md:py-12">
          <div
            ref={editorContainerRef}
            className="relative w-full max-w-[820px] rounded-[3px] border border-slate-200 bg-white px-[64px] py-[72px] shadow-[0_18px_50px_-16px_rgba(7,12,22,0.35),0_2px_6px_-2px_rgba(7,12,22,0.10)]"
          >
            {/* Page corner marks (museum-style) */}
            <span aria-hidden className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-300">
              PRAXIS
            </span>
            <span aria-hidden className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-300">
              A4 · 1/1
            </span>
            <div className="mb-6 rounded-lg border border-[#E8B931]/30 bg-[#FAF8F2] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <span className="text-[#8A5A00]">Writing from context</span>
                <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{activeSituation?.name ?? 'No situation core'}</span>
                <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{activeCapsule ? `${activeCapsule.capsuleId} v${activeCapsule.version}` : 'No capsule'}</span>
              </div>
              <div className="mt-2 grid gap-2 text-[11px] leading-4 text-slate-600 sm:grid-cols-3">
                <p><strong className="text-slate-800">User.</strong> {user?.name ?? user?.email ?? 'Analyst posture not loaded.'}</p>
                <p><strong className="text-slate-800">Evidence.</strong> {sources.length ? `${sources.length} attached source${sources.length === 1 ? '' : 's'} available for citation.` : 'No source receipts attached yet.'}</p>
                <p><strong className="text-slate-800">Trust.</strong> {trustScore === null ? 'Context posture pending.' : `${trustBand} posture, score ${trustScore}.`}</p>
              </div>
            </div>
            <EditorContent editor={editor} />
            <SourceMentionMenu editor={editor} situationId={activeSituation?.id ?? null} />
            {slashAt && (
              <div
                role="menu"
                className="absolute z-40 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl"
                style={{ top: slashAt.y + 4, left: Math.min(slashAt.x, 600) }}
              >
                <div className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  PRAXIS commands
                </div>
                {filteredSlash.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No commands match {slashQuery ? `"${slashQuery}"` : ''}.</div>
                ) : (
                  filteredSlash.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => runSlashCommand(cmd.id)}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-slate-50"
                      >
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A5A00]" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-900">{cmd.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{cmd.hint}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>

        {/* Ask PRAXIS rail */}
        {askOpen && (
          <aside
            className={cn(
              'h-full w-[360px] shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white md:flex',
              mobilePane === 'ask'
                ? 'fixed inset-y-0 right-0 z-40 flex w-[90vw] max-w-sm shadow-2xl md:static md:w-[360px] md:shadow-none'
                : 'hidden',
            )}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8A5A00]" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Ask PRAXIS</span>
              </span>
              <button
                type="button"
                onClick={() => setAskOpen(false)}
                aria-label="Close Ask PRAXIS"
                className="text-slate-400 hover:text-slate-600"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="border-b border-slate-200 bg-[#FAF8F2] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A5A00]">Using</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-700">{usingRow}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: 'Draft', prompt: `Draft a ${outputCore.toLowerCase()} from the selected cores for ${objectiveCore}.`, insert: true },
                  { label: 'Cite', prompt: 'Find citation points in the current selection and suggest source-backed footnotes.', insert: false },
                  { label: 'Rewrite', prompt: 'Rewrite the selected text in a more careful policy register with caveats preserved.', insert: true },
                  { label: 'Gaps', prompt: 'List unsupported claims, assumptions, and the next sources to import before export.', insert: false },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      void runWriterPrompt({ prompt: action.prompt, mode: action.label === 'Rewrite' ? 'soften' : 'ask', insert: action.insert }).catch(() => undefined);
                    }}
                    disabled={askPending || !editor}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#8A5A00]/40 hover:text-[#8A5A00] disabled:opacity-40"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {turns.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-[12px] leading-5 text-slate-600">
                  Ask anything about the active capsule. Insert any answer directly into the memo.
                </div>
              ) : (
                turns.map((turn) => (
                  <div
                    key={turn.id}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm leading-6',
                      turn.role === 'user' ? 'bg-slate-100 text-slate-900' : 'border border-slate-200 bg-white text-slate-800 shadow-sm',
                    )}
                  >
                    {turn.role === 'praxis' && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A5A00]">PRAXIS</p>
                    )}
                    <p className="whitespace-pre-wrap">{turn.text}</p>
                    {turn.role === 'praxis' && (
                      <button
                        type="button"
                        onClick={() => { void insertAskReply(turn); }}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      >
                        <FileDown className="h-3 w-3" />
                        Insert into memo
                      </button>
                    )}
                  </div>
                ))
              )}
              {askPending && (
                <div className="rounded-md border border-slate-200 bg-white p-3 text-xs italic text-slate-500">
                  PRAXIS is thinking…
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendAsk();
              }}
              className="border-t border-slate-200 bg-white p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  rows={2}
                  placeholder="Ask PRAXIS about the active capsule…"
                  className="min-h-[44px] w-full resize-none rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#8A5A00] focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendAsk();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={askPending || askInput.trim().length === 0}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#111827] text-white disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">
                Enter to send · Shift+Enter for newline · /grounded, /cite in the editor.
              </p>
            </form>
          </aside>
        )}
        {!askOpen && (
          <button
            type="button"
            onClick={() => setAskOpen(true)}
            aria-label="Open Ask PRAXIS"
            className="hidden h-full w-9 items-center justify-center border-l border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 md:flex"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
        {/* CC-7: Gap filler rail (desktop only) */}
        <GapFillerRail
          editor={editor}
          situationId={activeSituation?.id ?? null}
          className="hidden lg:block"
        />
      </div>

      {/* Mobile floating Sources / Ask toggle (hidden at md+) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center md:hidden">
        <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-1 py-1 shadow-lg">
          <button
            type="button"
            onClick={() => setMobilePane((p) => (p === 'library' ? null : 'library'))}
            aria-pressed={mobilePane === 'library'}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
              mobilePane === 'library' ? 'bg-navy-950 text-white' : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            <Library className="h-3 w-3" />
            Sources
          </button>
          <button
            type="button"
            onClick={() => setMobilePane((p) => (p === 'ask' ? null : 'ask'))}
            aria-pressed={mobilePane === 'ask'}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
              mobilePane === 'ask' ? 'bg-navy-950 text-white' : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            <MessageSquare className="h-3 w-3" />
            Ask
          </button>
        </div>
      </div>
      {mobilePane ? (
        <button
          type="button"
          aria-label="Close panel"
          onClick={() => setMobilePane(null)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      ) : null}

      {/* Editor typography — A4 feel */}
      <style jsx global>{`
        .memo-editor {
          font-family: 'EB Garamond', Georgia, ui-serif, serif;
          font-size: 17px;
          line-height: 1.75;
          color: #0F172A;
        }
        .memo-editor h1 {
          font-family: 'EB Garamond', Georgia, ui-serif, serif;
          font-size: 30px;
          line-height: 1.18;
          margin-top: 0;
          margin-bottom: 24px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .memo-editor h2 {
          font-family: 'EB Garamond', Georgia, ui-serif, serif;
          font-size: 21px;
          line-height: 1.3;
          margin-top: 28px;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .memo-editor h3 {
          font-family: 'EB Garamond', Georgia, ui-serif, serif;
          font-size: 17px;
          line-height: 1.4;
          margin-top: 18px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .memo-editor p {
          margin-top: 0;
          margin-bottom: 14px;
        }
        .memo-editor ul, .memo-editor ol {
          margin: 12px 0 14px 22px;
        }
        .memo-editor li {
          margin: 6px 0;
        }
        .memo-editor blockquote {
          border-left: 3px solid #E8B931;
          margin: 16px 0;
          padding: 4px 16px;
          color: #334155;
          background: #FAF8F2;
        }
        .memo-editor strong { font-weight: 700; }
        .memo-editor em { font-style: italic; color: #334155; }
        .memo-editor sup { font-family: 'JetBrains Mono', ui-monospace, monospace; color: #8A5A00; font-size: 0.7em; }
        .memo-editor a { color: #1B3A5C; text-decoration: underline; text-decoration-color: rgba(232,185,49,0.6); text-underline-offset: 2px; }
      `}</style>
    </div>
  );
}

function LibrarySection({
  icon: Icon,
  title,
  subtitle,
  href,
}: {
  icon: typeof Brain;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[12px] hover:border-slate-300"
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A5A00]" />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-900">{title}</span>
        <span className="block truncate text-[11px] text-slate-500">{subtitle}</span>
      </span>
    </Link>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  active,
  strong = false,
}: {
  label: string;
  icon: typeof Brain;
  onClick: () => void;
  active: boolean;
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-slate-600 transition',
        active
          ? 'border-[#8A5A00]/40 bg-[#FAF8F2] text-[#8A5A00]'
          : 'border-transparent hover:border-slate-200 hover:bg-white hover:text-slate-900',
      )}
    >
      <Icon className={cn('h-4 w-4', strong ? 'stroke-[3]' : '')} />
    </button>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 40);
  }
}

function selectedEditorText(editor: Editor): string {
  const { from, to } = editor.state.selection;
  if (from === to) return '';
  return editor.state.doc.textBetween(from, to, '\n').trim();
}

function buildWriterInstruction(input: {
  prompt: string;
  title: string;
  usingRow: string;
  selectedCoreLabels: string[];
  objectiveCore: string;
  outputCore: string;
  activeCapsule: CapsuleSummary | null;
  trustBand: string;
  trustScore: number | null;
  sources: string[];
}): string {
  return [
    input.prompt,
    '',
    'Write as an editable Work draft, not a chat reply.',
    `Document title: ${input.title}`,
    `Using: ${input.usingRow}`,
    `Selected cores: ${input.selectedCoreLabels.join(', ') || 'none selected'}`,
    `Objective Core: ${input.objectiveCore}`,
    `Output Core: ${input.outputCore}`,
    `Capsule: ${input.activeCapsule ? `${input.activeCapsule.capsuleId} v${input.activeCapsule.version}` : 'none'}`,
    `Context trust: ${input.trustBand}${input.trustScore === null ? '' : ` (${input.trustScore}/100)`}`,
    `Available source URLs: ${input.sources.length ? input.sources.join(' | ') : 'none attached'}`,
    '',
    'Return concise memo-ready prose. Use inline [#] citations when evidence is available. Mark unsupported claims as assumptions or gaps.',
  ].join('\n');
}

function renderAiInsertHtml(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length === 0) return '<p></p>';
  return blocks.map((block) => {
    if (block.startsWith('# ')) return `<h1>${escapeAttr(block.slice(2))}</h1>`;
    if (block.startsWith('## ')) return `<h2>${escapeAttr(block.slice(3))}</h2>`;
    if (block.startsWith('### ')) return `<h3>${escapeAttr(block.slice(4))}</h3>`;
    if (block.startsWith('- ')) {
      const items = block
        .split('\n')
        .map((line) => line.replace(/^- /, '').trim())
        .filter(Boolean)
        .map((line) => `<li>${escapeAttr(line)}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${escapeAttr(block).replace(/\n/g, '<br />')}</p>`;
  }).join('');
}

function memoHtmlToBlocks(html: string): MemoBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: MemoBlock[] = Array.from(doc.body.children).flatMap((node, index): MemoBlock[] => {
    const text = normalizeText(node.textContent ?? '');
    if (!text) return [];
    const id = `${node.tagName.toLowerCase()}-${index}-${Date.now().toString(36)}`;
    const citations = sourceReceiptIdsFromNode(node);
    if (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3') {
      return [{
        id,
        type: 'heading' as const,
        content: text,
        citations,
        metadata: { level: headingLevel(node.tagName) },
      }];
    }
    if (node.tagName === 'BLOCKQUOTE') {
      return [{
        id,
        type: 'quote' as const,
        content: text,
        citations,
        metadata: {},
      }];
    }
    if (node.tagName === 'UL' || node.tagName === 'OL') {
      const items = Array.from(node.querySelectorAll('li')).map((item) => normalizeText(item.textContent ?? '')).filter(Boolean);
      return [{
        id,
        type: 'bullets' as const,
        content: '',
        items,
        citations,
        metadata: { ordered: node.tagName === 'OL' },
      }];
    }
    return [{
      id,
      type: 'paragraph' as const,
      content: text,
      citations,
      metadata: {},
    }];
  });

  return blocks.length > 0
    ? blocks
    : [{
      id: `paragraph-${Date.now().toString(36)}`,
      type: 'paragraph' as const,
      content: 'Draft memo',
      citations: [],
      metadata: {},
    }];
}

function sourceReceiptIdsFromNode(node: Element) {
  const sourceReceiptIds = Array.from(node.querySelectorAll('[data-source-url], a[href]'))
    .map((element) => element.getAttribute('data-source-url') ?? element.getAttribute('href'))
    .filter((value): value is string => Boolean(value));
  return sourceReceiptIds.length > 0
    ? [{ nodeIds: [] as string[], sourceReceiptIds: Array.from(new Set(sourceReceiptIds)), surface: 'footnote' as const }]
    : [];
}

function headingLevel(tagName: string): number {
  const level = Number(tagName.replace(/\D/g, ''));
  return Number.isFinite(level) && level > 0 ? level : 2;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
