'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  FileText,
  Library,
  LinkIcon,
  Search,
  Upload,
} from 'lucide-react';

import type { Situation } from '@/types/situation';

interface V7SourceDocumentCorePanelProps {
  active: Situation | null;
}

type SourceReceipt = {
  id: string;
  label: string;
  url: string;
  category?: string;
};

const workflowSteps = [
  { label: 'Source receipt saved', detail: 'Every link or upload gets a visible receipt before analysis.' },
  { label: 'Text extracted', detail: 'Documents become searchable evidence when extraction completes.' },
  { label: 'Indexed for retrieval', detail: 'Ask PRAXIS can use indexed fragments as candidate citations.' },
];

export function V7SourceDocumentCorePanel({ active }: V7SourceDocumentCorePanelProps) {
  const activeCaseId = active?.id;
  const workbenchHref = activeCaseId ? `/app/workbench/${activeCaseId}` : '/app/workbench';
  const libraryHref = activeCaseId ? `${workbenchHref}?tab=library` : workbenchHref;
  const researchHref = activeCaseId ? `${workbenchHref}?openChapter=research` : workbenchHref;
  const sourceReceipts = getSourceReceipts(active);
  const documentCount = active?.documentCount ?? 0;
  const actorCount = active?.actors?.length ?? active?.actorCount ?? 0;
  const eventCount = active?.keyDates?.length ?? 0;
  const claimSignalCount = active?.graphEntities ?? 0;
  const coverageRows = [
    { label: 'Actors', current: actorCount, target: Math.max(actorCount, 5), gap: actorCount > 0 ? 'Named actors present' : 'Add stakeholders' },
    { label: 'Events', current: eventCount, target: Math.max(eventCount, 3), gap: eventCount > 0 ? 'Timeline started' : 'Add key dates' },
    { label: 'Claims', current: claimSignalCount, target: Math.max(claimSignalCount, 8), gap: claimSignalCount > 0 ? 'Graph signals present' : 'Extract claims' },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5" data-testid="v7-source-document-core-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-gold-700">Source + Document Cores</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-950">Evidence that Ask PRAXIS can cite.</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-700">
            Keep receipts, uploads, extraction status, and coverage gaps in one place before sending them to Ask PRAXIS or an Analyst Skill.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <LinkButton href={libraryHref} icon={Upload} label="Add source or document" primary />
          <LinkButton href={researchHref} icon={Search} label="Run Source Scout" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.58fr)_minmax(300px,0.42fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">Source receipts</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">
                  {sourceReceipts.length > 0 ? `${sourceReceipts.length} linked receipts ready for review.` : 'No receipts yet. Add the first source to ground this Situation.'}
                </p>
              </div>
              <Library className="h-5 w-5 text-gold-700" />
            </div>
            <div className="mt-4 space-y-2">
              {(sourceReceipts.length > 0 ? sourceReceipts.slice(0, 4) : fallbackReceipts).map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:border-navy-300"
                >
                  <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy-950">{source.label}</span>
                    <span className="mt-1 block truncate text-xs text-slate-700">{source.category ?? source.url}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <EvidenceMetric label="Receipts" value={sourceReceipts.length} detail="linked" />
            <EvidenceMetric label="Documents" value={documentCount} detail={documentCount > 0 ? 'uploaded' : 'ready'} />
            <EvidenceMetric label="Indexed" value={sourceReceipts.length + documentCount} detail="candidate inputs" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold-700" />
              <p className="text-sm font-semibold text-navy-950">Upload pipeline</p>
            </div>
            <div className="mt-4 space-y-3">
              {workflowSteps.map((step) => (
                <div key={step.label} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-navy-950">{step.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-700">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-gold-700" />
              <p className="text-sm font-semibold text-navy-950">Coverage gaps</p>
            </div>
            <div className="mt-4 space-y-3">
              {coverageRows.map((row) => (
                <CoverageRow key={row.label} {...row} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getSourceReceipts(active: Situation | null): SourceReceipt[] {
  if (!active) return [];

  const sourceUrls = (active.sourceUrls ?? []).map((url, index) => ({
    id: `source-${index}-${url}`,
    label: sourceLabel(url, index),
    url,
  }));
  const customSources = (active.customSources ?? []).map((source) => ({
    id: source.id,
    label: source.name || sourceLabel(source.url, 0),
    url: source.url,
    category: source.categoryId,
  }));

  return [...customSources, ...sourceUrls];
}

const fallbackReceipts: SourceReceipt[] = [
  { id: 'empty-source-1', label: 'Add a source receipt', url: '/app/sources', category: 'Start with a URL, PDF, or note.' },
  { id: 'empty-source-2', label: 'Upload a document', url: '/app/sources', category: 'Extract text before relying on it.' },
];

function sourceLabel(url: string, index: number): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return `Source ${index + 1}`;
  }
}

function EvidenceMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-2xl font-semibold text-navy-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-navy-900">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-700">{detail}</p>
    </div>
  );
}

function CoverageRow({
  label,
  current,
  target,
  gap,
}: {
  label: string;
  current: number;
  target: number;
  gap: string;
}) {
  const percent = Math.min(100, Math.round((current / Math.max(target, 1)) * 100));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-slate-700">{label}</p>
        <p className="text-xs font-semibold text-navy-950">{percent}%</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-gold-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-700">{gap}</p>
    </div>
  );
}

function LinkButton({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
        primary
          ? 'bg-navy-950 text-white hover:bg-navy-800'
          : 'border border-slate-200 bg-white text-navy-800 hover:border-navy-300 hover:bg-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {!primary && <ArrowRight className="h-4 w-4" />}
    </Link>
  );
}
