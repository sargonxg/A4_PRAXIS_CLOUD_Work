'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Copy,
  ChevronDown,
  FileText,
  BookOpen,
  Calendar,
  Loader2,
  Check,
  WrapText,
  Minimize2,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { useConflictStore } from '@/stores/conflict-store';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportStatus = 'draft' | 'in_review' | 'approved' | 'published';

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; badgeVariant: 'gold' | 'teal' | 'sage' | 'secondary' }
> = {
  draft: { label: 'Draft', badgeVariant: 'gold' },
  in_review: { label: 'In Review', badgeVariant: 'teal' },
  approved: { label: 'Approved', badgeVariant: 'sage' },
  published: { label: 'Published', badgeVariant: 'sage' },
};

// ---------------------------------------------------------------------------
// Mock sources for the source panel
// ---------------------------------------------------------------------------

const MOCK_SOURCES = [
  {
    id: 'src-1',
    title: 'UNMIN Monitoring Report — March 2026',
    type: 'UN Document',
    date: '2026-03-04',
  },
  {
    id: 'src-2',
    title: 'DRM-Government Ceasefire Agreement (Sept 2025)',
    type: 'Agreement',
    date: '2025-09-12',
  },
  {
    id: 'src-3',
    title: 'OCHA Humanitarian Situation Report No. 14',
    type: 'Humanitarian',
    date: '2026-02-28',
  },
  {
    id: 'src-4',
    title: 'Security Council Resolution 2890 (2025)',
    type: 'UNSC Resolution',
    date: '2025-10-15',
  },
  {
    id: 'src-5',
    title: 'UNHCR Cross-Border Displacement Analysis',
    type: 'Field Report',
    date: '2026-03-01',
  },
];

// ---------------------------------------------------------------------------
// Word count helper
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Section Editor
// ---------------------------------------------------------------------------

interface SectionEditorProps {
  sectionId: string;
  title: string;
  content: string;
  templateName: string;
  previousContent: string;
  onContentChange: (content: string) => void;
}

function SectionEditor({
  sectionId,
  title,
  content,
  templateName,
  previousContent,
  onContentChange,
}: SectionEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiContent, setIsAiContent] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight, 120)}px`;
  }, [content, streamingContent]);

  async function generateSection(
    instruction: 'generate' | 'rephrase' | 'shorter' | 'longer'
  ) {
    setIsGenerating(true);
    setStreamingContent('');

    let prompt = '';
    if (instruction === 'generate') {
      prompt = `Generate the "${title}" section for a ${templateName} about the Nordalia Crisis. Previous sections context: ${previousContent.slice(0, 400) || 'none'}. Write in formal UN diplomatic language. 200-300 words. Output only the section text, no headers.`;
    } else if (instruction === 'rephrase') {
      prompt = `Rephrase the following text in formal UN diplomatic language, maintaining all factual content:\n\n${content}`;
    } else if (instruction === 'shorter') {
      prompt = `Make the following text significantly shorter while preserving all key information. Use formal UN diplomatic language:\n\n${content}`;
    } else if (instruction === 'longer') {
      prompt = `Expand the following text with more analytical depth and context. Write in formal UN diplomatic language:\n\n${content}`;
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          conflictContext: 'Nordalia Crisis',
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Stream failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) {
            accumulated += parsed;
            setStreamingContent(accumulated);
          }
        }
      }

      if (accumulated) {
        onContentChange(accumulated);
        setIsAiContent(true);
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
    }
  }

  const displayContent = isGenerating && streamingContent ? streamingContent : content;
  const wordCount = countWords(displayContent);

  return (
    <div
      className={cn(
        'rounded-xl border transition-colors',
        isAiContent
          ? 'border-gold-500/20 bg-gold-500/5'
          : 'border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]'
      )}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-app-border)]">
        <div className="flex items-center gap-2.5">
          {isAiContent && (
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
          )}
          <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy-500">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          {isAiContent && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 text-[10px] text-gold-600">
              <Sparkles className="h-2.5 w-2.5" />
              AI generated
            </span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative px-4 py-3">
        {isGenerating && (
          <div className="absolute top-4 right-6 flex items-center gap-1.5 text-xs text-gold-600 px-2 py-1 rounded-md">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating…
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={displayContent}
          onChange={(e) => {
            onContentChange(e.target.value);
            setIsAiContent(false);
          }}
          disabled={isGenerating}
          placeholder={`Write the ${title} section here, or use AI to generate it…`}
          className={cn(
            'w-full resize-none bg-transparent text-sm text-navy-900 placeholder:text-navy-400',
            'focus:outline-none leading-relaxed min-h-[120px]',
            isGenerating && 'opacity-75 cursor-wait'
          )}
        />
      </div>

      {/* Action bar */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 border-t',
          isAiContent ? 'border-gold-500/10' : 'border-[var(--color-app-border)]'
        )}
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={() => generateSection('generate')}
          disabled={isGenerating}
          className="gap-1.5 text-xs h-7"
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          Generate with AI
        </Button>

        {(content.length > 0 || isAiContent) && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => generateSection('rephrase')}
              disabled={isGenerating || content.length === 0}
              className="gap-1.5 text-xs h-7 text-navy-400 hover:text-navy-900"
            >
              <WrapText className="h-3 w-3" />
              Rephrase Diplomatically
            </Button>
            <div className="flex items-center gap-1 ml-auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generateSection('shorter')}
                disabled={isGenerating || content.length === 0}
                className="gap-1 text-xs h-7 text-navy-400 hover:text-navy-900 px-2"
              >
                <Minimize2 className="h-3 w-3" />
                Shorter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generateSection('longer')}
                disabled={isGenerating || content.length === 0}
                className="gap-1 text-xs h-7 text-navy-400 hover:text-navy-900 px-2"
              >
                <Maximize2 className="h-3 w-3" />
                Longer
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ReportEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { reports, updateReport, conflicts, activeConflictId } =
    useConflictStore();

  const report = reports.find((r) => r.id === id);
  const conflict =
    conflicts.find((c) => c.id === (report?.conflictId || activeConflictId)) ||
    conflicts[0];

  // Local state
  const [title, setTitle] = useState(report?.title ?? '');
  const [status, setStatus] = useState<ReportStatus>(
    (report?.status as ReportStatus) ?? 'draft'
  );
  const [sectionContents, setSectionContents] = useState<
    Record<string, string>
  >(() => {
    const map: Record<string, string> = {};
    report?.sections.forEach((s) => {
      map[s.id] = s.content;
    });
    return map;
  });
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync if report changes from outside
  useEffect(() => {
    if (report) {
      setTitle(report.title);
      setStatus(report.status as ReportStatus);
    }
  }, [report?.id]);

  const handleSectionChange = useCallback(
    (sectionId: string, content: string) => {
      setSectionContents((prev) => ({ ...prev, [sectionId]: content }));
    },
    []
  );

  function handleSave() {
    if (!report) return;
    updateReport(id, {
      title,
      status,
      sections: report.sections.map((s) => ({
        ...s,
        content: sectionContents[s.id] ?? s.content,
      })),
    });
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2000);
  }

  async function handleGenerateAll() {
    if (!report) return;
    setIsGeneratingAll(true);
    // Generate sections sequentially
    for (const section of report.sections) {
      const previousContent = report.sections
        .slice(
          0,
          report.sections.findIndex((s) => s.id === section.id)
        )
        .map((s) => `${s.title}: ${sectionContents[s.id] || ''}`)
        .join('\n');

      const prompt = `Generate the "${section.title}" section for a ${report.title} about the Nordalia Crisis. Previous sections context: ${previousContent.slice(0, 400) || 'none'}. Write in formal UN diplomatic language. 200-300 words. Output only the section text, no headers.`;

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, conflictContext: 'Nordalia Crisis' }),
        });
        if (!response.ok || !response.body) continue;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            const parsed = parseDataStreamChunk(line);
            if (parsed) accumulated += parsed;
          }
        }
        if (accumulated) {
          setSectionContents((prev) => ({
            ...prev,
            [section.id]: accumulated,
          }));
        }
      } catch {
        // continue to next section
      }
    }
    setIsGeneratingAll(false);
  }

  function handleCopyMarkdown() {
    if (!report) return;
    const md = [
      `# ${title}`,
      `Status: ${STATUS_CONFIG[status].label}`,
      '',
      ...report.sections.map(
        (s) =>
          `## ${s.title}\n\n${sectionContents[s.id] || '_No content yet._'}`
      ),
    ].join('\n\n');
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalWords = Object.values(sectionContents).reduce(
    (sum, c) => sum + countWords(c),
    0
  );

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FileText className="h-12 w-12 text-navy-600" />
        <div className="text-center">
          <p className="text-navy-700 font-medium">Report not found</p>
          <p className="text-sm text-navy-500 mt-1">
            This report may have been deleted or doesn&apos;t exist.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push('/reports')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col h-full -mx-6 -my-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/reports')}
            className="flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Reports
          </button>
          <span className="text-navy-300">/</span>
          <span className="text-xs text-navy-600 line-clamp-1 max-w-[200px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown((v) => !v)}
              className="flex items-center gap-1.5 text-xs border border-[var(--color-app-border)] rounded-md px-2.5 py-1.5 bg-white hover:bg-[var(--color-app-surface-alt)] transition-colors"
            >
              <Badge variant={statusCfg.badgeVariant} className="text-[10px] px-1.5 py-0">
                {statusCfg.label}
              </Badge>
              <ChevronDown className="h-3 w-3 text-navy-500" />
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[var(--color-app-border)] rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                {(
                  Object.entries(STATUS_CONFIG) as [
                    ReportStatus,
                    (typeof STATUS_CONFIG)[ReportStatus],
                  ][]
                ).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setStatus(key);
                      setShowStatusDropdown(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--color-app-surface-alt)] transition-colors',
                      status === key && 'bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    <Badge
                      variant={cfg.badgeVariant}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {cfg.label}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="gap-1.5 text-xs"
          >
            {isGeneratingAll ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Generate All
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyMarkdown}
            className="gap-1.5 text-xs"
          >
            {copied ? (
              <Check className="h-3 w-3 text-sage" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? 'Copied!' : 'Copy MD'}
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            className="gap-1.5 text-xs"
          >
            {savedIndicator ? (
              <Check className="h-3 w-3" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            {savedIndicator ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Editor (65%) */}
        <div className="flex-[65] overflow-y-auto px-8 py-6">
          {/* Title */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent font-serif text-3xl text-navy-900 placeholder:text-navy-400 focus:outline-none border-b border-transparent focus:border-[var(--color-app-border)] pb-1 transition-colors"
              placeholder="Report title…"
            />
            <div className="flex items-center gap-3 mt-2 text-xs text-navy-500">
              <span>{totalWords.toLocaleString()} words</span>
              <span>·</span>
              <span>{report.sections.length} sections</span>
              <span>·</span>
              <span>
                Created{' '}
                {new Date(report.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-4">
            {report.sections.map((section, index) => {
              const prevContent = report.sections
                .slice(0, index)
                .map((s) => `${s.title}: ${sectionContents[s.id] || ''}`)
                .join('\n');
              return (
                <SectionEditor
                  key={section.id}
                  sectionId={section.id}
                  title={section.title}
                  content={sectionContents[section.id] ?? section.content}
                  templateName={title}
                  previousContent={prevContent}
                  onContentChange={(c) => handleSectionChange(section.id, c)}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT: Source panel (35%) */}
        <div className="flex-[35] border-l border-[var(--color-app-border)] overflow-y-auto bg-[var(--color-app-surface-alt)] flex flex-col">
          {/* Conflict context */}
          <div className="px-5 py-4 border-b border-[var(--color-app-border)]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-3">
              Linked Conflict
            </h2>
            <div className="flex items-start gap-3 rounded-lg bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-terracotta/10 border border-terracotta/20">
                <BookOpen className="h-4 w-4 text-terracotta" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-900">
                  {conflict?.name ?? 'Nordalia Crisis'}
                </p>
                <p className="text-xs text-navy-400 mt-0.5">
                  {conflict?.region ?? 'Nordalia (fictional)'}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="terracotta" className="text-[10px] px-1.5 py-0">
                    Active
                  </Badge>
                  <span className="text-[10px] text-navy-500">
                    Risk score: {conflict?.riskScore ?? 7.8}/10
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="px-5 py-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                Available Sources
              </h2>
              <span className="text-[10px] text-navy-500">
                {MOCK_SOURCES.length} documents
              </span>
            </div>

            {/* Search bar */}
            <div className="relative mb-3">
              <input
                type="text"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                placeholder="Search sources…"
                className="w-full bg-white border border-[var(--color-app-border)] rounded-md px-3 py-1.5 text-xs text-navy-900 placeholder:text-navy-500 focus:outline-none focus:border-gold-500/40 transition-colors"
              />
            </div>

            {/* Source cards */}
            <div className="flex flex-col gap-2">
              {MOCK_SOURCES.filter(
                (s) =>
                  sourceSearch.trim() === '' ||
                  s.title
                    .toLowerCase()
                    .includes(sourceSearch.toLowerCase()) ||
                  s.type.toLowerCase().includes(sourceSearch.toLowerCase())
              ).map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border border-[var(--color-app-border)] bg-white p-3 hover:border-navy-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-navy-500 shrink-0 mt-0.5 group-hover:text-gold-600 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-navy-700 leading-snug line-clamp-2 group-hover:text-navy-900 transition-colors">
                        {source.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-navy-500 border border-[var(--color-app-border)] rounded px-1.5 py-0.5">
                          {source.type}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-navy-600">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(source.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent events from conflict */}
          {conflict?.events && conflict.events.length > 0 && (
            <div className="px-5 py-4 border-t border-[var(--color-app-border)]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-3">
                Recent Events
              </h2>
              <div className="flex flex-col gap-2">
                {conflict.events.slice(0, 3).map((event, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-navy-600 leading-snug">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-navy-600 mt-0.5">
                        {event.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close status dropdown */}
      {showStatusDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowStatusDropdown(false)}
        />
      )}
    </div>
  );
}
