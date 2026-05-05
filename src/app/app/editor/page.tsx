'use client';

/**
 * /app/editor — standalone PRAXIS document editor.
 *
 * Word-like rich-text surface (TipTap) paired with a research side-rail:
 * source receipts, Ask PRAXIS, frameworks reference, and one-click DOCX/PDF
 * export. The editor saves locally per-document and pushes a copy to the
 * configured GCS bucket via /api/documents/upload so it appears in the
 * Document Dashboard.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpenCheck,
  Cloud,
  CloudUpload,
  Download,
  FileDown,
  FilePlus,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
} from 'lucide-react';
import { TipTapEditor } from '@/components/editor/tiptap-editor';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { isSyriaWorkspaceCase, SYRIA_DEMO_POLICY_MEMO } from '@/lib/constants/syria-demo-case';
import { resolveCaseTemplate } from '@/lib/constants/cases';
import { getDemoTemplate } from '@/lib/constants/demo-templates';
import type { CaseTemplateData, CaseDocument } from '@/lib/constants/cases/case-types';
import { cn } from '@/lib/utils/cn';
import { Library, Quote as QuoteIcon } from 'lucide-react';

interface EditorDoc {
  id: string;
  title: string;
  html: string;
  updatedAt: string;
  bucketUri?: string;
}

const STORAGE_KEY = 'praxis-editor-docs-v1';

const SYRIA_SEED_DOC: EditorDoc = {
  id: 'syria-policy-memo-seed',
  title: 'Syria Transition — Principal Policy Memo (DRAFT)',
  html: buildSyriaSeedHtml(),
  updatedAt: new Date().toISOString(),
};

function buildSyriaSeedHtml(): string {
  const memo = SYRIA_DEMO_POLICY_MEMO;
  const optionsHtml = memo.policyOptions
    .map(
      (opt, i) => `
        <h3>Option ${i + 1}: ${escapeHtml(opt.option)}</h3>
        <p><strong>Risk level:</strong> ${escapeHtml(opt.riskLevel)} · <strong>Resources:</strong> ${escapeHtml(opt.resourceImplications)}</p>
        <p><strong>Pros:</strong></p><ul>${opt.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        <p><strong>Cons:</strong></p><ul>${opt.cons.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        <p><em>Level-1 (international):</em> ${escapeHtml(opt.levelOneAnalysis)}</p>
        <p><em>Level-2 (domestic):</em> ${escapeHtml(opt.levelTwoAnalysis)}</p>
        <p><em>Win-set:</em> ${escapeHtml(opt.winSet)}</p>
      `,
    )
    .join('');

  return `
    <h1>${escapeHtml(memo.subject)}</h1>
    <p><strong>Classification:</strong> ${escapeHtml(memo.classification)}<br>
    <strong>To:</strong> ${escapeHtml(memo.to)}<br>
    <strong>From:</strong> ${escapeHtml(memo.from)}</p>
    <h2>Executive Summary</h2>
    <p>${escapeHtml(memo.executiveSummary)}</p>
    <h2>Problem Statement</h2>
    <p>${escapeHtml(memo.problemStatement)}</p>
    <h2>Context and Background</h2>
    <p>${escapeHtml(memo.contextAndBackground)}</p>
    <h2>Policy Options</h2>
    ${optionsHtml}
    <h2>Recommendation</h2>
    <p>${escapeHtml(memo.recommendation)}</p>
    <h2>Implementation Steps</h2>
    <ul>${memo.implementationSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    <h2>Monitoring Indicators</h2>
    <ul>${memo.monitoringIndicators.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    <h2>Risks</h2>
    <p>${escapeHtml(memo.risks)}</p>
    <h2>Citations</h2>
    <ul>${memo.citations.map((c) => `<li><a href="${escapeHtml(c)}" target="_blank" rel="noopener">${escapeHtml(c)}</a></li>`).join('')}</ul>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SYRIA_RESEARCH_PROMPTS = [
  'Find UN Security Council updates on the 30 January Damascus-SDF agreement.',
  'List EU Council legal instruments lifting sanctions on Syrian state institutions.',
  'Summarise OCHA and UNHCR reports on Syria returns since December 2024.',
  'Cross-check coastal accountability commitments against HRW and Amnesty reporting.',
  'Identify Türkiye–US northeast working-group readouts for the last 30 days.',
];

const PAKISTAN_RESEARCH_PROMPTS = [
  'Find IMF Pakistan EFF programme reviews and staff statements since January 2026.',
  'List ICG and Crisis24 analyses on the TTP resurgence in KP since the 2023 negotiations collapse.',
  'Summarise the State Bank of Pakistan Monetary Policy Committee statements over the last 6 months.',
  'Cross-check ECP delimitation orders against PTI petitions before the Lahore High Court.',
  'Identify Saudi PIF and PRC public statements on Reko Diq, CPEC, and FX deposit rollovers.',
];

const US_HOUSING_RESEARCH_PROMPTS = [
  'Pull HUD PRO-Housing FY26 NOFO award announcements and scoring criteria.',
  'List California HCD enforcement actions on SB 35 / SB 423 in the last 12 months.',
  'Summarise the FHFA Tenant Bill of Rights year-one compliance report.',
  'Cross-check NYC City of Yes final EIS estimates against HPD 2025 production data.',
  'Identify litigation in TX, FL, and MN testing the limits of state preemption of local housing rules.',
];

const DEFAULT_RESEARCH_PROMPTS = SYRIA_RESEARCH_PROMPTS;

function buildTemplateSeedHtml(template: CaseTemplateData): string {
  const stakeholderList = template.situationStakeholders
    .slice(0, 6)
    .map((s) => `<li><strong>${escapeHtml(s.shortName ?? s.name)}</strong> — ${escapeHtml(s.position)}</li>`)
    .join('');
  const eventsList = template.timeline
    .slice(-5)
    .reverse()
    .map((e) => `<li><strong>${escapeHtml(e.date)}</strong> · ${escapeHtml(e.title)} — ${escapeHtml(e.description)}</li>`)
    .join('');
  const sourcesList = template.sources
    .slice(0, 8)
    .map((s) => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer">${escapeHtml(s.name)}</a></li>`)
    .join('');
  return `
    <h1>${escapeHtml(template.briefingTitle)}</h1>
    <p><strong>Workspace:</strong> ${escapeHtml(template.contextLabel)}<br>
    <strong>Subtitle:</strong> ${escapeHtml(template.subtitle)}<br>
    <strong>Risk:</strong> ${template.risk.score} · ${escapeHtml(template.risk.label)}</p>
    <h2>Bottom line up front</h2>
    <p>Replace this paragraph with the assessment. PRAXIS will keep a running &lt;source-receipt&gt; for every paragraph as you draft.</p>
    <h2>Key actors and stance</h2>
    <ul>${stakeholderList}</ul>
    <h2>Recent timeline</h2>
    <ul>${eventsList}</ul>
    <h2>Outlook</h2>
    <p>Articulate the base / bull / bear scenarios with specific triggers and probabilities.</p>
    <h2>Recommendation</h2>
    <p>State the recommendation and required actions.</p>
    <h2>Sources</h2>
    <ul>${sourcesList}</ul>
  `;
}

function buildTemplateSeedDoc(template: CaseTemplateData): EditorDoc {
  return {
    id: `${template.templateId}-seed`,
    title: template.briefingTitle,
    html: buildTemplateSeedHtml(template),
    updatedAt: new Date().toISOString(),
  };
}

const FRAMEWORK_REFERENCE = [
  { id: 'glasl',     label: 'Glasl 9-stage escalation', description: 'Stages 1–3 win-win; 4–6 win-lose; 7–9 lose-lose. Used by Risk Monitor + Timeline.' },
  { id: 'fisher',    label: 'Fisher-Ury (positions vs interests)', description: 'Surface stated positions, then expose underlying interests. Used by Negotiation + Mediation.' },
  { id: 'inform',    label: 'INFORM Risk Index',  description: 'Composite (Hazard × Vulnerability × Lack of Coping)^(1/3). Used by Risk Monitor.' },
  { id: 'maw',       label: 'Mitchell-Agle-Wood salience', description: 'Power × Legitimacy × Urgency → 8 quadrants. Used by Stakeholder Map.' },
  { id: 'zartman',   label: 'Zartman ripeness', description: 'Mutually hurting stalemate + way out. Used by Mediation + Boardroom.' },
  { id: 'stedman',   label: 'Stedman spoiler typology', description: 'Limited / greedy / total spoilers + management strategies. Used by Mediation Designer.' },
  { id: 'galtung',   label: 'Galtung triangle', description: 'Direct, structural, cultural violence. Used by Conflict Graph + Reports.' },
  { id: 'lederach',  label: 'Lederach pyramid', description: 'Top, middle-range, grassroots. Used by Stakeholder Map + Track design.' },
  { id: 'putnam',    label: 'Putnam two-level game', description: 'Level-1 international × Level-2 domestic win-sets. Used by Policy Memo.' },
  { id: 'icd203',    label: 'ICD-203 analytic standards', description: 'Source quality, confidence levels, alternative analysis. Used by all AI route outputs.' },
];

export default function EditorPage() {
  const guard = useSituationGuard();
  const searchParams = useSearchParams();
  const caseParam = searchParams.get('case');
  const isSyriaCase = isSyriaWorkspaceCase(caseParam, guard.isDemo);
  const genericTemplate = resolveCaseTemplate(caseParam);
  const templateMeta = getDemoTemplate(caseParam);
  const initialDocId = searchParams.get('doc') ?? null;

  const researchPrompts = useMemo(() => {
    if (templateMeta?.id === 'pakistan-political-risk') return PAKISTAN_RESEARCH_PROMPTS;
    if (templateMeta?.id === 'us-housing') return US_HOUSING_RESEARCH_PROMPTS;
    return DEFAULT_RESEARCH_PROMPTS;
  }, [templateMeta]);

  const [docs, setDocs] = useState<EditorDoc[]>(() => {
    if (typeof window === 'undefined') return [SYRIA_SEED_DOC];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as EditorDoc[]) : [];
      if (parsed.length === 0) return [SYRIA_SEED_DOC];
      return parsed;
    } catch {
      return [SYRIA_SEED_DOC];
    }
  });

  const [activeId, setActiveId] = useState<string>(() => initialDocId ?? docs[0]?.id ?? SYRIA_SEED_DOC.id);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [bucketState, setBucketState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [bucketMessage, setBucketMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'idle' | 'docx' | 'pdf'>('idle');
  const [chatPrompt, setChatPrompt] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = useMemo(() => docs.find((d) => d.id === activeId) ?? docs[0], [docs, activeId]);

  // Seed Syria document on first visit if missing
  useEffect(() => {
    if (!isSyriaCase) return;
    setDocs((prev) =>
      prev.some((d) => d.id === SYRIA_SEED_DOC.id) ? prev : [SYRIA_SEED_DOC, ...prev],
    );
  }, [isSyriaCase]);

  // Seed generic template document on first visit if missing
  useEffect(() => {
    if (!genericTemplate) return;
    const seed = buildTemplateSeedDoc(genericTemplate);
    setDocs((prev) => {
      if (prev.some((d) => d.id === seed.id)) return prev;
      return [seed, ...prev];
    });
    setActiveId((prev) => prev || seed.id);
  }, [genericTemplate]);

  // Helper: insert a citation marker into the active document at the end.
  const insertCitation = useCallback((doc: CaseDocument) => {
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== activeId) return d;
        const cite = `<p><em>Citation:</em> <a href="${escapeHtml(doc.url ?? '#')}" target="_blank" rel="noreferrer">${escapeHtml(doc.title)}</a> · ${escapeHtml(doc.publisher)} · ${escapeHtml(doc.publishedAt)}.</p>`;
        return { ...d, html: `${d.html}\n${cite}`, updatedAt: new Date().toISOString() };
      }),
    );
    setSavingState('saving');
    setTimeout(() => setSavingState('saved'), 400);
  }, [activeId]);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch {
      // ignore quota errors silently
    }
  }, [docs]);

  const handleChange = useCallback(
    (html: string) => {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === activeId
            ? { ...d, html, updatedAt: new Date().toISOString() }
            : d,
        ),
      );
      setSavingState('saving');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setSavingState('saved'), 600);
    },
    [activeId],
  );

  const handleNewDoc = useCallback(() => {
    const id = `doc-${Date.now().toString(36)}`;
    const fresh: EditorDoc = {
      id,
      title: 'Untitled policy product',
      html: '<h1>Untitled policy product</h1><p>Start drafting…</p>',
      updatedAt: new Date().toISOString(),
    };
    setDocs((prev) => [fresh, ...prev]);
    setActiveId(id);
  }, []);

  const handleRename = useCallback(
    (next: string) => {
      setDocs((prev) =>
        prev.map((d) => (d.id === activeId ? { ...d, title: next } : d)),
      );
    },
    [activeId],
  );

  const handleSyncBucket = useCallback(async () => {
    if (!active) return;
    setBucketState('syncing');
    setBucketMessage(null);
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: active.id,
          title: active.title,
          html: active.html,
          situationId: guard.situation?.id ?? (isSyriaCase ? 'syria-transition-2026' : 'demo'),
          contentType: 'text/html',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { uri?: string; message?: string };
      setDocs((prev) =>
        prev.map((d) => (d.id === active.id ? { ...d, bucketUri: data.uri } : d)),
      );
      setBucketState('synced');
      setBucketMessage(data.message ?? 'Synced to bucket.');
    } catch (e) {
      setBucketState('error');
      setBucketMessage(e instanceof Error ? e.message : 'Bucket sync failed');
    }
  }, [active, guard.situation?.id, isSyriaCase]);

  const handleExport = useCallback(
    async (format: 'docx' | 'pdf') => {
      if (!active) return;
      setExporting(format);
      try {
        if (format === 'docx') {
          const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
          const lines = htmlToTextBlocks(active.html);
          const doc = new Document({
            sections: [
              {
                properties: {},
                children: lines.map((line) => {
                  const isH1 = line.startsWith('# ');
                  const isH2 = line.startsWith('## ');
                  const isH3 = line.startsWith('### ');
                  const text = isH3 ? line.slice(4) : isH2 ? line.slice(3) : isH1 ? line.slice(2) : line;
                  return new Paragraph({
                    heading: isH1
                      ? HeadingLevel.HEADING_1
                      : isH2
                        ? HeadingLevel.HEADING_2
                        : isH3
                          ? HeadingLevel.HEADING_3
                          : undefined,
                    children: [new TextRun(text)],
                  });
                }),
              },
            ],
          });
          const blob = await Packer.toBlob(doc);
          downloadBlob(blob, `${slugify(active.title)}.docx`);
        } else {
          const { jsPDF } = await import('jspdf');
          const pdf = new jsPDF({ unit: 'pt' });
          const lines = htmlToTextBlocks(active.html);
          const margin = 48;
          const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
          let y = margin;
          for (const line of lines) {
            const isH1 = line.startsWith('# ');
            const isH2 = line.startsWith('## ');
            const isH3 = line.startsWith('### ');
            const text = isH3 ? line.slice(4) : isH2 ? line.slice(3) : isH1 ? line.slice(2) : line;
            pdf.setFontSize(isH1 ? 18 : isH2 ? 14 : isH3 ? 12 : 11);
            pdf.setFont('helvetica', isH1 || isH2 ? 'bold' : 'normal');
            const wrapped = pdf.splitTextToSize(text, pageWidth) as string[];
            for (const w of wrapped) {
              if (y > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                y = margin;
              }
              pdf.text(w, margin, y);
              y += isH1 ? 24 : isH2 ? 18 : 16;
            }
            y += 6;
          }
          pdf.save(`${slugify(active.title)}.pdf`);
        }
      } finally {
        setExporting('idle');
      }
    },
    [active],
  );

  if (guard.needsOnboarding) return <OnboardingRequiredState />;

  return (
    <div className="grid gap-4 p-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
      {/* Sidebar — document list */}
      <aside className="space-y-3">
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Documents</p>
            <button
              type="button"
              onClick={handleNewDoc}
              className="inline-flex items-center gap-1 rounded-md bg-diplomatic-blue px-2 py-1 text-[11px] font-semibold text-white hover:bg-diplomatic-blue/90"
            >
              <FilePlus className="h-3 w-3" /> New
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {docs.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(doc.id)}
                  className={cn(
                    'w-full rounded-md border px-2.5 py-2 text-left text-[12px] transition',
                    doc.id === activeId
                      ? 'border-diplomatic-blue bg-diplomatic-blue/5 text-navy-900'
                      : 'border-slate-200 bg-white text-navy-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-diplomatic-blue" />
                    <span className="truncate">{doc.title}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-navy-400">
                    Updated {new Date(doc.updatedAt).toLocaleString()}
                    {doc.bucketUri ? ' · synced' : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Case-aware Library — shows when a generic template is active. */}
        {genericTemplate && (
          <div className="rounded-md border border-gold-200 bg-gold-50/40 p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
              <Library className="h-3 w-3" /> Library · {templateMeta?.shortName}
            </p>
            <p className="mt-1 text-[10px] text-navy-500">
              Case documents. Click to insert a citation into the active draft.
            </p>
            <ul className="mt-2 space-y-1">
              {genericTemplate.documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => insertCitation(doc)}
                    className="w-full rounded-md border border-slate-200 bg-white p-2 text-left transition hover:border-gold-300 hover:bg-gold-50/40"
                  >
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 shrink-0 text-navy-500" />
                      <span className="truncate text-[11px] font-semibold text-navy-800">{doc.title}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-navy-500">{doc.publisher} · {doc.publishedAt}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-gold-700">
                      <QuoteIcon className="h-2.5 w-2.5" /> Insert citation
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
            <BookOpenCheck className="h-3 w-3" /> Frameworks reference
          </p>
          <ul className="mt-2 space-y-2">
            {FRAMEWORK_REFERENCE.map((fw) => (
              <li key={fw.id}>
                <p className="text-[11px] font-semibold text-navy-800">{fw.label}</p>
                <p className="text-[10px] text-navy-500">{fw.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Editor */}
      <section className="min-w-0">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <input
              value={active?.title ?? ''}
              onChange={(e) => handleRename(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 font-serif text-lg font-semibold text-navy-900 focus:border-diplomatic-blue focus:outline-none"
            />
            <p className="mt-1 flex items-center gap-2 text-[11px] text-navy-500">
              <SaveBadge state={savingState} />
              <BucketBadge state={bucketState} message={bucketMessage} uri={active?.bucketUri ?? null} />
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncBucket}
              disabled={bucketState === 'syncing'}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {bucketState === 'syncing' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
              Sync to bucket
            </button>
            <button
              type="button"
              onClick={() => handleExport('docx')}
              disabled={exporting !== 'idle'}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {exporting === 'docx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              Export DOCX
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting !== 'idle'}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export PDF
            </button>
          </div>
        </header>

        <TipTapEditor
          value={active?.html ?? ''}
          onChange={handleChange}
          placeholder="Open a document or start drafting a new policy product…"
          editable
        />
      </section>

      {/* Research rail */}
      <aside className="space-y-3">
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
            <Sparkles className="h-3 w-3 text-gold-600" /> Research helper
          </p>
          <p className="mt-1 text-[11px] text-navy-500">
            Quick-fire prompts ready to drop into Ask PRAXIS or your research console.
          </p>
          <textarea
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder="Drop a research question here…"
            className="mt-2 h-20 w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-2 text-[12px] text-navy-800 focus:border-diplomatic-blue focus:outline-none"
          />
          <ul className="mt-2 space-y-1">
            {researchPrompts.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  onClick={() => setChatPrompt(prompt)}
                  className="block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left text-[11px] text-navy-700 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
            <History className="h-3 w-3" /> Document history
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-navy-600">
            {docs
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .slice(0, 6)
              .map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{d.title}</span>
                  <span className="text-navy-400">{new Date(d.updatedAt).toLocaleTimeString()}</span>
                </li>
              ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function SaveBadge({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  const map = {
    idle:   { label: 'Ready', icon: Save, tone: 'text-navy-500' },
    saving: { label: 'Saving…', icon: RefreshCw, tone: 'text-amber-600' },
    saved:  { label: 'Saved locally', icon: Save, tone: 'text-emerald-600' },
    error:  { label: 'Save failed', icon: Save, tone: 'text-rose-600' },
  } as const;
  const Icon = map[state].icon;
  return (
    <span className={cn('inline-flex items-center gap-1', map[state].tone)}>
      <Icon className={cn('h-3 w-3', state === 'saving' && 'animate-spin')} />
      {map[state].label}
    </span>
  );
}

function BucketBadge({
  state,
  message,
  uri,
}: {
  state: 'idle' | 'syncing' | 'synced' | 'error';
  message: string | null;
  uri: string | null;
}) {
  const map = {
    idle:    { label: 'Not yet pushed to bucket', tone: 'text-navy-400' },
    syncing: { label: 'Syncing to bucket…',         tone: 'text-amber-600' },
    synced:  { label: uri ? `Synced · ${uri}` : 'Synced to bucket', tone: 'text-emerald-700' },
    error:   { label: message ?? 'Bucket sync failed', tone: 'text-rose-600' },
  } as const;
  return (
    <span className={cn('inline-flex items-center gap-1', map[state].tone)}>
      <Cloud className="h-3 w-3" />
      {map[state].label}
    </span>
  );
}

function htmlToTextBlocks(html: string): string[] {
  if (typeof document === 'undefined') {
    // Server-safe fallback: strip tags
    return html
      .replace(/<\/?(h1|h2|h3|p|li|ul|ol|blockquote|hr)[^>]*>/gi, (m) => {
        if (m.toLowerCase() === '</li>') return '\n';
        if (m.toLowerCase().startsWith('<h1')) return '\n# ';
        if (m.toLowerCase().startsWith('<h2')) return '\n## ';
        if (m.toLowerCase().startsWith('<h3')) return '\n### ';
        return '\n';
      })
      .replace(/<[^>]+>/g, '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const blocks: string[] = [];
  wrapper.querySelectorAll('h1, h2, h3, p, li, blockquote').forEach((el) => {
    const text = el.textContent?.trim();
    if (!text) return;
    if (el.tagName === 'H1') blocks.push(`# ${text}`);
    else if (el.tagName === 'H2') blocks.push(`## ${text}`);
    else if (el.tagName === 'H3') blocks.push(`### ${text}`);
    else if (el.tagName === 'LI') blocks.push(`• ${text}`);
    else blocks.push(text);
  });
  return blocks.length > 0 ? blocks : [wrapper.textContent?.trim() ?? ''];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'document';
}
