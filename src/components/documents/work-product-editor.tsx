'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileText,
  FileUp,
  GitBranch,
  Library,
  Link2,
  Save,
  SearchCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  buildEvidenceReviews,
  summarizeEvidenceCoverage,
  type SectionEvidenceReview,
} from '@/lib/documents/evidence-review';
import { cn } from '@/lib/utils/cn';

export interface WorkDocumentSection {
  id: string;
  heading: string;
  body: string;
}

interface SavedWorkProduct {
  id: string;
  productType: string;
  title: string;
  situationName: string;
  updatedAt: string;
  sectionCount: number;
  wordCount: number;
  sections: WorkDocumentSection[];
  sources: string[];
}

interface WorkProductEditorProps {
  productType: string;
  title: string;
  situationName: string;
  storageKey: string;
  initialSections: WorkDocumentSection[];
  sources?: string[];
  classification?: string;
  contextCards?: Array<{ label: string; value: string; detail: string }>;
  analystPreferences?: string[];
  reviewChecklist?: string[];
  className?: string;
}

const LIBRARY_KEY = 'praxis-work-product-library-v1';

function stableId(prefix = 'section') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72) || 'praxis-work-product';
}

function countWords(sections: WorkDocumentSection[]) {
  return sections
    .map((section) => `${section.heading} ${section.body}`)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function splitImportedText(text: string): WorkDocumentSection[] {
  const normalized = text.replace(/\r/g, '').trim();
  if (!normalized) return [];

  const chunks = normalized
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length <= 1) {
    return [{ id: stableId(), heading: 'Imported Draft', body: normalized }];
  }

  return chunks.slice(0, 10).map((chunk, index) => {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
    const first = lines[0] ?? `Imported Section ${index + 1}`;
    const heading = first.length <= 80 ? first.replace(/[:.]\s*$/, '') : `Imported Section ${index + 1}`;
    const body = first.length <= 80 ? lines.slice(1).join('\n') || first : lines.join('\n');
    return { id: stableId(), heading, body };
  });
}

function normalizeSectionBody(body: string) {
  const sentences = body
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
  if (!sentences) return body;
  return sentences.charAt(0).toUpperCase() + sentences.slice(1);
}

export function WorkProductEditor({
  productType,
  title,
  situationName,
  storageKey,
  initialSections,
  sources = [],
  classification = 'Working draft',
  contextCards = [],
  analystPreferences = [],
  reviewChecklist = [],
  className,
}: WorkProductEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedStoredDraftRef = useRef(false);
  const initialSectionsRef = useRef(initialSections);
  const [sections, setSections] = useState<WorkDocumentSection[]>(initialSections);
  const [savedAt, setSavedAt] = useState<string>('');
  const [library, setLibrary] = useState<SavedWorkProduct[]>([]);
  const [status, setStatus] = useState('Ready');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState(storageKey);
  const [hydrated, setHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'evidence' | 'preview' | 'audit'>('edit');
  const initialSignature = useMemo(
    () => initialSections.map((section) => `${section.heading}:${section.body}`).join('|'),
    [initialSections],
  );

  useEffect(() => {
    initialSectionsRef.current = initialSections;
  }, [initialSignature, initialSections]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Pick<SavedWorkProduct, 'sections' | 'updatedAt'>;
        if (Array.isArray(parsed.sections) && parsed.sections.length) {
          setSections(parsed.sections);
          setSavedAt(parsed.updatedAt ?? '');
          loadedStoredDraftRef.current = true;
        }
      } catch {
        // Ignore corrupted local draft data and keep the generated baseline.
      }
    }

    try {
      const storedLibrary = JSON.parse(window.localStorage.getItem(LIBRARY_KEY) ?? '[]') as SavedWorkProduct[];
      setLibrary(Array.isArray(storedLibrary) ? storedLibrary : []);
    } catch {
      setLibrary([]);
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    if (loadedStoredDraftRef.current) {
      loadedStoredDraftRef.current = false;
      return;
    }
    setSections(initialSectionsRef.current);
  }, [hydrated, initialSignature]);

  const wordCount = useMemo(() => countWords(sections), [sections]);
  const evidenceReviews = useMemo(() => buildEvidenceReviews(sections, sources), [sections, sources]);
  const evidenceSummary = useMemo(() => summarizeEvidenceCoverage(evidenceReviews), [evidenceReviews]);
  const completenessScore = useMemo(() => {
    const sourceScore = sources.length ? 18 : 0;
    const sectionScore = Math.min(46, sections.length * 7);
    const depthScore = Math.min(36, Math.floor(wordCount / 22));
    const evidenceScore = Math.min(18, Math.round(evidenceSummary.score * 0.18));
    return Math.max(12, Math.min(100, sourceScore + sectionScore + depthScore + evidenceScore));
  }, [evidenceSummary.score, sections.length, sources.length, wordCount]);

  function persist(nextSections = sections, draftId = selectedDraftId) {
    const updatedAt = new Date().toISOString();
    const item: SavedWorkProduct = {
      id: draftId,
      productType,
      title,
      situationName,
      updatedAt,
      sectionCount: nextSections.length,
      wordCount: countWords(nextSections),
      sections: nextSections,
      sources,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(item));
    const nextLibrary = [item, ...library.filter((draft) => draft.id !== draftId)].slice(0, 18);
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(nextLibrary));
    setLibrary(nextLibrary);
    setSavedAt(updatedAt);
    setSelectedDraftId(draftId);
    setStatus('Saved to work product library');
  }

  function updateSection(id: string, patch: Partial<WorkDocumentSection>) {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    );
    setStatus('Unsaved edits');
  }

  function addSection() {
    setSections((current) => [
      ...current,
      { id: stableId(), heading: 'New Section', body: 'Add analysis, evidence, assumptions, and decision implications.' },
    ]);
    setStatus('Unsaved edits');
  }

  function sharpenDraft() {
    const enhanced = sections.map((section) => {
      if (section.body.includes('PRAXIS action:')) return section;
      const suffix = section.heading.toLowerCase().includes('recommendation')
        ? '\n\nPRAXIS action: convert this recommendation into owner, trigger, timeline, and evidence-refresh cadence before external distribution.'
        : '\n\nPRAXIS check: verify source basis, confidence, assumptions, and decision implication for this section.';
      return { ...section, body: `${section.body.trim()}${suffix}` };
    });
    setSections(enhanced);
    persist(enhanced);
    setStatus('Draft sharpened with review prompts');
  }

  function polishDraft() {
    const improved = sections.map((section) => ({
      ...section,
      heading: section.heading.trim().replace(/\s+/g, ' '),
      body: normalizeSectionBody(section.body),
    }));
    setSections(improved);
    persist(improved);
    setStatus('Structure polished and saved');
  }

  async function exportDocx() {
    setExporting(true);
    setStatus('Building LibreOffice-compatible DOCX');
    try {
      const res = await fetch('/api/work-products/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType,
          title,
          situationName,
          classification,
          sections,
          sources,
        }),
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeFileName(`${situationName}-${productType}`)}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      persist();
      setStatus('DOCX exported');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'DOCX export failed');
    } finally {
      setExporting(false);
    }
  }

  async function importFile(file: File) {
    setImporting(true);
    setStatus(`Importing ${file.name}`);
    try {
      if (file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
        const text = await file.text();
        const imported = splitImportedText(text);
        if (imported.length) setSections(imported);
        setStatus('Text draft imported');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/work-products/import-docx', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Import failed: ${res.status}`);
      const data = (await res.json()) as { text?: string; sections?: WorkDocumentSection[] };
      const imported = Array.isArray(data.sections) && data.sections.length
        ? data.sections.map((section) => ({ ...section, id: section.id || stableId() }))
        : splitImportedText(data.text ?? '');
      if (!imported.length) throw new Error('No readable document text found');
      setSections(imported);
      setStatus('DOCX imported into editable sections');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function loadDraft(draft: SavedWorkProduct) {
    setSections(draft.sections);
    setSavedAt(draft.updatedAt);
    setSelectedDraftId(draft.id);
    setStatus('Loaded saved work product');
  }

  return (
    <section className={cn('overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm', className)}>
      <div className="border-b border-navy-100 bg-gradient-to-r from-navy-950 via-navy-900 to-diplomatic-blue px-5 py-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
                <FileText className="h-3 w-3" />
                Work document
              </span>
              <span className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
                DOCX ready
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-white/70">
              Editable PRAXIS product library for {situationName}. It carries situation context, analyst preferences, source basis, saved drafts, DOCX import, and LibreOffice-compatible export in one screen.
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
              <p className="text-lg font-semibold">{sections.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/55">Sections</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
              <p className="text-lg font-semibold">{wordCount}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/55">Words</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
              <p className="text-lg font-semibold">{completenessScore}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/55">Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-md border border-navy-200 bg-white p-1">
              {[
                { id: 'edit', label: 'Edit', icon: FileText },
                { id: 'evidence', label: 'Evidence', icon: SearchCheck },
                { id: 'preview', label: 'Preview', icon: Eye },
                { id: 'audit', label: 'Audit', icon: SlidersHorizontal },
              ].map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id as typeof viewMode)}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition',
                      viewMode === mode.id ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-900',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => persist()} className="inline-flex h-9 items-center gap-2 rounded-md bg-diplomatic-blue px-3 text-sm font-semibold text-white hover:bg-diplomatic-blue/90">
              <Save className="h-4 w-4" />
              Save
            </button>
            <button onClick={polishDraft} className="inline-flex h-9 items-center gap-2 rounded-md border border-navy-200 bg-navy-50 px-3 text-sm font-semibold text-navy-800 hover:bg-navy-100">
              <Sparkles className="h-4 w-4 text-gold-600" />
              Improve
            </button>
            <button onClick={exportDocx} disabled={exporting} className="inline-flex h-9 items-center gap-2 rounded-md border border-navy-200 bg-white px-3 text-sm font-semibold text-navy-800 hover:bg-navy-50 disabled:opacity-50">
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export DOCX'}
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="inline-flex h-9 items-center gap-2 rounded-md border border-navy-200 bg-white px-3 text-sm font-semibold text-navy-800 hover:bg-navy-50 disabled:opacity-50">
              <Upload className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import DOCX'}
            </button>
            <button onClick={sharpenDraft} className="inline-flex h-9 items-center gap-2 rounded-md border border-gold-300 bg-gold-50 px-3 text-sm font-semibold text-gold-800 hover:bg-gold-100">
              <Wand2 className="h-4 w-4" />
              Sharpen Draft
            </button>
            <button onClick={addSection} className="inline-flex h-9 items-center gap-2 rounded-md border border-navy-200 bg-white px-3 text-sm font-semibold text-navy-800 hover:bg-navy-50">
              Add Section
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importFile(file);
              }}
            />
          </div>

          <div className="rounded-lg border border-navy-100 bg-navy-50/70 px-3 py-2 text-xs text-navy-600">
            <span className="font-semibold text-navy-800">{status}</span>
            {savedAt ? <span className="ml-2 text-navy-400">Last saved {new Date(savedAt).toLocaleString()}</span> : null}
          </div>

          {viewMode === 'edit' ? (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <div key={section.id} className="rounded-lg border border-navy-200 bg-white">
                  <div className="flex items-center gap-2 border-b border-navy-100 bg-navy-50 px-3 py-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold text-navy-500 ring-1 ring-navy-100">
                      {index + 1}
                    </span>
                    <input
                      value={section.heading}
                      onChange={(event) => updateSection(section.id, { heading: event.target.value })}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-navy-900 outline-none"
                      aria-label={`Heading for section ${index + 1}`}
                    />
                    <EvidencePill review={evidenceReviews[index]} />
                  </div>
                  <textarea
                    value={section.body}
                    onChange={(event) => updateSection(section.id, { body: event.target.value })}
                    rows={Math.max(4, Math.min(10, Math.ceil(section.body.length / 140)))}
                    className="w-full resize-y rounded-b-lg border-0 bg-white px-3 py-3 text-sm leading-6 text-navy-700 outline-none focus:ring-2 focus:ring-diplomatic-blue/15"
                    aria-label={`Body for section ${index + 1}`}
                  />
                  <div className="grid gap-2 border-t border-navy-100 bg-slate-50 px-3 py-2 md:grid-cols-[minmax(0,1fr)_auto]">
                    <p className="text-[11px] leading-4 text-navy-500">
                      {evidenceReviews[index]?.sectionQuestions[0] ?? 'Where did this paragraph come from?'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setViewMode('evidence')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-diplomatic-blue hover:text-navy-900"
                    >
                      Review evidence
                      <SearchCheck className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {viewMode === 'evidence' ? (
            <EvidenceReviewPanel reviews={evidenceReviews} />
          ) : null}

          {viewMode === 'preview' ? (
            <div className="rounded-lg border border-navy-200 bg-white p-6">
              <div className="border-b border-navy-100 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">{classification}</p>
                <h3 className="mt-2 text-2xl font-semibold text-navy-950">{title}</h3>
                <p className="mt-1 text-sm text-navy-500">{productType} · {situationName}</p>
              </div>
              <div className="mt-5 space-y-5">
                {sections.map((section) => (
                  <section key={section.id}>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-navy-900">{section.heading}</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-navy-700">{section.body}</p>
                  </section>
                ))}
              </div>
            </div>
          ) : null}

          {viewMode === 'audit' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <AuditPanel title="Review Checklist" items={reviewChecklist} fallback="Add a checklist to show product review gates." />
              <AuditPanel title="Source Basis" items={sources} fallback="No source list attached yet." />
              <AuditPanel title="Situation Context" items={contextCards.map((card) => `${card.label}: ${card.value} - ${card.detail}`)} fallback="No context cards attached yet." />
              <AuditPanel title="Analyst Calibration" items={analystPreferences} fallback="No analyst preferences attached yet." />
            </div>
          ) : null}
        </div>

        <aside className="border-t border-navy-100 bg-navy-50/50 p-4 lg:border-l lg:border-t-0">
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Evidence coverage</p>
                <p className="mt-1 text-sm font-semibold text-emerald-950">{evidenceSummary.score}% document-linked</p>
              </div>
              <SearchCheck className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              <MiniMetric label="Ready" value={String(evidenceSummary.ready)} />
              <MiniMetric label="Thin" value={String(evidenceSummary.thin)} />
              <MiniMetric label="Missing" value={String(evidenceSummary.missing)} />
            </div>
          </div>

          {contextCards.length ? (
            <div className="mb-4 rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">Situation Context</p>
              <div className="mt-2 space-y-2">
                {contextCards.map((card) => (
                  <div key={`${card.label}-${card.value}`} className="rounded-md bg-white px-3 py-2 ring-1 ring-diplomatic-blue/10">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{card.label}</p>
                      <p className="text-xs font-semibold text-navy-900">{card.value}</p>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-navy-600">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {analystPreferences.length ? (
            <div className="mb-4 rounded-lg border border-gold-200 bg-gold-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Analyst Preferences</p>
              <div className="mt-2 space-y-1.5">
                {analystPreferences.slice(0, 5).map((preference) => (
                  <div key={preference} className="rounded bg-white/80 px-2 py-1.5 text-[11px] leading-snug text-navy-700">
                    {preference}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Library className="h-4 w-4 text-diplomatic-blue" />
            Product Library
          </div>
          <div className="space-y-2">
            {library.length ? library.map((draft) => (
              <button
                key={draft.id}
                onClick={() => loadDraft(draft)}
                className={cn(
                  'w-full rounded-lg border bg-white p-3 text-left text-xs transition-colors hover:border-diplomatic-blue/30 hover:bg-diplomatic-blue/5',
                  selectedDraftId === draft.id ? 'border-diplomatic-blue/40 ring-2 ring-diplomatic-blue/10' : 'border-navy-100',
                )}
              >
                <p className="font-semibold text-navy-900">{draft.title}</p>
                <p className="mt-1 text-navy-500">{draft.productType} · {draft.wordCount} words</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-navy-300">{new Date(draft.updatedAt).toLocaleString()}</p>
              </button>
            )) : (
              <div className="rounded-lg border border-dashed border-navy-200 bg-white p-4 text-xs text-navy-500">
                Save a draft to build the local work-product library for this browser session.
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 rounded-lg border border-navy-100 bg-white p-3 text-xs text-navy-600">
            <div className="flex items-center gap-2 font-semibold text-navy-900">
              <Database className="h-4 w-4 text-emerald-600" />
              Structure
            </div>
            <p>Structured sections are saved as JSON and exported as DOCX. This keeps the document useful for AI review, graph evidence, and office editing.</p>
            <div className="flex items-center gap-2 pt-1 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              LibreOffice / Word compatible
            </div>
            <div className="flex items-center gap-2 text-navy-500">
              <FileUp className="h-4 w-4" />
              DOCX import via Mammoth
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function EvidencePill({ review }: { review?: SectionEvidenceReview }) {
  if (!review) return null;
  const classes = {
    ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    thin: 'border-amber-200 bg-amber-50 text-amber-700',
    missing: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <span className={cn('hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase md:inline-flex', classes[review.coverageState])}>
      {review.coverageState}
    </span>
  );
}

function EvidenceReviewPanel({ reviews }: { reviews: SectionEvidenceReview[] }) {
  return (
    <div className="space-y-3">
      {reviews.map((review, index) => (
        <article key={review.sectionId} className="rounded-lg border border-navy-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Section {index + 1}</p>
              <h3 className="mt-1 text-sm font-semibold text-navy-950">{review.heading}</h3>
              <p className="mt-1 text-[11px] text-navy-500">
                {review.wordCount} words · {review.sentenceCount} sentence checks · {review.coverageState} evidence
              </p>
            </div>
            <EvidencePill review={review} />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-navy-800">
                <GitBranch className="h-3.5 w-3.5 text-diplomatic-blue" />
                <p className="text-xs font-semibold">Graph and paragraph checks</p>
              </div>
              <div className="mt-2 grid gap-1.5">
                {review.sectionQuestions.map((question) => (
                  <p key={question} className="rounded bg-white px-2 py-1.5 text-[11px] leading-4 text-navy-600">
                    {question}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-navy-800">
                <Link2 className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-xs font-semibold">Suggested source basis</p>
              </div>
              <div className="mt-2 space-y-1.5">
                {review.suggestedSources.length ? review.suggestedSources.map((source) => (
                  <div key={source.id} className="rounded bg-emerald-50 px-2 py-1.5 text-[11px] leading-4 text-emerald-900">
                    <p className="font-semibold">{source.label}</p>
                    {source.url ? <p className="truncate text-emerald-700">{source.url}</p> : null}
                  </div>
                )) : (
                  <p className="rounded border border-dashed border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-4 text-amber-800">
                    Attach a source span before this paragraph becomes brief-ready.
                  </p>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/80 px-2 py-1.5">
      <p className="text-sm font-semibold text-navy-900">{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-navy-400">{label}</p>
    </div>
  );
}

function AuditPanel({ title, items, fallback }: { title: string; items: string[]; fallback: string }) {
  return (
    <div className="rounded-lg border border-navy-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item) => (
          <div key={item} className="flex gap-2 rounded-md border border-navy-100 bg-navy-50 px-3 py-2 text-xs leading-snug text-navy-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>{item}</span>
          </div>
        )) : (
          <p className="rounded-md border border-dashed border-navy-200 bg-navy-50 px-3 py-2 text-xs text-navy-500">{fallback}</p>
        )}
      </div>
    </div>
  );
}
