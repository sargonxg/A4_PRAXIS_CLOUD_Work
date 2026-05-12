'use client';

import { useMemo, useState } from 'react';
import {
  FileText,
  Library,
  ListChecks,
  Lock,
  Quote,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buildReasoningSpineSummary, type ReasoningSpineSummary } from '@/lib/reasoning/reasoning-spine';
import type {
  DraftAppendixOption,
  DraftExportSettings,
  DraftMemoOption,
} from '@/lib/workbench/draft-assembly-state';

type CompanionPanelId = 'outline' | 'spine' | 'evidence' | 'audit';

interface DraftCompanionProps {
  caseId: string;
  selectedMemos: DraftMemoOption[];
  selectedAppendices: DraftAppendixOption[];
  primaryMemoId: string;
  settings: DraftExportSettings;
}

const PANELS: Array<{ id: CompanionPanelId; label: string; icon: typeof ListChecks }> = [
  { id: 'outline', label: 'Outline', icon: ListChecks },
  { id: 'spine', label: 'Spine', icon: Route },
  { id: 'evidence', label: 'Evidence', icon: Quote },
  { id: 'audit', label: 'Audit', icon: ShieldCheck },
];

const ACTIONS = [
  'Improve summary',
  'Add evidence',
  'Export brief',
];

export function DraftCompanion({
  caseId,
  selectedMemos,
  selectedAppendices,
  primaryMemoId,
  settings,
}: DraftCompanionProps) {
  const [activePanel, setActivePanel] = useState<CompanionPanelId>('outline');
  const [actionNote, setActionNote] = useState('Pick an action to see the next drafting move for this package.');
  const primaryMemo = selectedMemos.find((memo) => memo.id === primaryMemoId) ?? selectedMemos[0];
  const companionState = useMemo(() => buildCompanionState(selectedMemos, selectedAppendices), [selectedMemos, selectedAppendices]);
  const reasoningSpine = useMemo(() => buildReasoningSpineSummary({
    caseId,
    selectedMemos,
    selectedAppendices,
    primaryMemoId,
    settings,
  }), [caseId, selectedMemos, selectedAppendices, primaryMemoId, settings]);

  return (
    <aside data-testid="draft-companion" className="rounded-lg border border-navy-200 bg-white shadow-sm shadow-navy-950/5">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-gold-100 p-2 text-gold-700">
            <Library className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-navy-950">Drafter Companion</h3>
            <p className="mt-1 text-sm leading-5 text-slate-700">
              One simple rail for memo structure, context spine, evidence, and export readiness.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:grid-cols-3">
          <Metric label="Memos" value={selectedMemos.length} />
          <Metric label="Citations" value={companionState.citationCount} />
          <Metric label="Appendices" value={selectedAppendices.length} />
        </div>
      </div>

      <div className="border-b border-slate-200 p-2">
        <div className="grid grid-cols-4 gap-1" role="tablist" aria-label="Drafter companion panels">
          {PANELS.map((panel) => {
            const Icon = panel.icon;
            const active = activePanel === panel.id;
            return (
              <button
                key={panel.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActivePanel(panel.id)}
                className={cn(
                  'inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold transition-colors',
                  active
                    ? 'bg-navy-950 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-navy-950',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {panel.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[290px] p-4">
        {activePanel === 'outline' ? <OutlinePanel selectedMemos={selectedMemos} primaryMemoId={primaryMemo?.id ?? ''} /> : null}
        {activePanel === 'spine' ? <ReasoningSpinePanel summary={reasoningSpine} /> : null}
        {activePanel === 'evidence' ? <EvidencePanel evidence={companionState.evidence} /> : null}
        {activePanel === 'audit' ? (
          <AuditPanel
            settings={settings}
            selectedMemos={selectedMemos}
            selectedAppendices={selectedAppendices}
            citationCount={companionState.citationCount}
          />
        ) : null}
      </div>

      <div className="border-t border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-navy-800">
          <FileText className="h-3.5 w-3.5 text-gold-600" />
          Next best actions
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setActionNote(buildActionNote(action, selectedMemos.length, companionState.citationCount))}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900 transition-colors hover:border-diplomatic-blue hover:bg-diplomatic-blue/5"
            >
              {action}
            </button>
          ))}
        </div>
        <p className="mt-3 rounded-md border border-diplomatic-blue/15 bg-white px-3 py-2 text-xs font-medium leading-5 text-navy-800">
          {actionNote}
        </p>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
      <div className="text-lg font-semibold text-navy-950">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">{label}</div>
    </div>
  );
}

function OutlinePanel({ selectedMemos, primaryMemoId }: { selectedMemos: DraftMemoOption[]; primaryMemoId: string }) {
  if (selectedMemos.length === 0) return <EmptyPanel title="Choose memos to build an outline." />;

  return (
    <div className="space-y-3">
      {selectedMemos.map((memo) => (
        <div key={memo.id} className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-navy-950">{memo.title}</p>
            {memo.id === primaryMemoId ? <span className="rounded bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-800">Lead</span> : null}
          </div>
          <ol className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
            {memo.blocks.slice(0, 4).map((block, index) => (
              <li key={block.id}>
                {index + 1}. {block.title || block.content.slice(0, 72) || block.type}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) return <EmptyPanel title="No citations are attached to the selected draft blocks yet." />;

  return (
    <div className="space-y-2">
      {evidence.slice(0, 8).map((item) => (
        <div key={`${item.memoTitle}-${item.blockTitle}-${item.index}`} className="rounded-md border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-xs font-semibold text-navy-950">{item.blockTitle}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-700">{item.memoTitle}</p>
          <p className="mt-2 text-[11px] font-medium text-slate-600">
            {item.nodeCount} graph nodes - {item.receiptCount} source receipts - {item.surface}
          </p>
        </div>
      ))}
    </div>
  );
}

function ReasoningSpinePanel({ summary }: { summary: ReasoningSpineSummary }) {
  return (
    <div className="space-y-3" data-testid="draft-reasoning-spine">
      <div className="rounded-md border border-navy-200 bg-navy-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-700">Context fingerprint</p>
          <span className={cn(
            'rounded px-2 py-0.5 text-[11px] font-semibold',
            summary.posture === 'ready'
              ? 'bg-emerald-100 text-emerald-800'
              : summary.posture === 'thin'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800',
          )}>
            {summary.posture}
          </span>
        </div>
        <p className="mt-2 font-mono text-sm font-semibold text-navy-950">{summary.contextFingerprint}</p>
        <p className="mt-2 text-xs leading-5 text-navy-800">
          Stable client-side fingerprint for the selected memos, appendices, and export settings. Rust BLAKE3 context-pack compilation remains the backend hardening step.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Inputs" value={summary.inputCount} />
        <Metric label="Est. tokens" value={summary.tokenEstimate} />
      </div>

      <div className="space-y-2">
        {summary.checkpoints.map((checkpoint) => (
          <div key={checkpoint.id} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-navy-950">{checkpoint.label}</p>
              <span className={cn(
                'rounded px-2 py-0.5 text-[11px] font-semibold',
                checkpoint.status === 'ready'
                  ? 'bg-emerald-100 text-emerald-800'
                  : checkpoint.status === 'queued'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-amber-100 text-amber-800',
              )}>
                {checkpoint.status === 'needs-input' ? 'Needs input' : checkpoint.status}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-700">{checkpoint.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditPanel({
  settings,
  selectedMemos,
  selectedAppendices,
  citationCount,
}: {
  settings: DraftExportSettings;
  selectedMemos: DraftMemoOption[];
  selectedAppendices: DraftAppendixOption[];
  citationCount: number;
}) {
  const checks = [
    { label: 'At least one memo selected', done: selectedMemos.length > 0 },
    { label: 'Evidence attached', done: citationCount > 0 },
    { label: 'Appendix inventory selected', done: selectedAppendices.length > 0 },
    { label: 'Audit manifest enabled', done: settings.embedAuditManifest },
    { label: 'Content credential manifest enabled', done: settings.embedC2pa },
  ];

  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
          <span className="text-xs font-semibold text-navy-950">{check.label}</span>
          <span className={cn(
            'rounded px-2 py-0.5 text-[11px] font-semibold',
            check.done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
          )}>
            {check.done ? 'Ready' : 'Needs input'}
          </span>
        </div>
      ))}
      <div className="mt-3 flex items-start gap-2 rounded-md border border-navy-200 bg-navy-50 p-3 text-xs leading-5 text-navy-900">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Server signing and provenance-ledger persistence remain backend work; this panel verifies the client package before export.</span>
      </div>
    </div>
  );
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-medium leading-6 text-slate-600">
      {title}
    </div>
  );
}

interface EvidenceItem {
  memoTitle: string;
  blockTitle: string;
  nodeCount: number;
  receiptCount: number;
  surface: string;
  index: number;
}

interface CompanionState {
  citationCount: number;
  graphNodeCount: number;
  sourceReceiptCount: number;
  contextBuckets: string[];
  evidence: EvidenceItem[];
}

function buildCompanionState(selectedMemos: DraftMemoOption[], selectedAppendices: DraftAppendixOption[]): CompanionState {
  const evidence: EvidenceItem[] = [];
  let graphNodeCount = 0;
  let sourceReceiptCount = 0;

  selectedMemos.forEach((memo) => {
    memo.blocks.forEach((block) => {
      block.citations.forEach((citation, index) => {
        graphNodeCount += citation.nodeIds.length;
        sourceReceiptCount += citation.sourceReceiptIds.length;
        evidence.push({
          memoTitle: memo.title,
          blockTitle: block.title || block.content.slice(0, 80) || block.type,
          nodeCount: citation.nodeIds.length,
          receiptCount: citation.sourceReceiptIds.length,
          surface: citation.surface,
          index,
        });
      });
    });
  });

  const contextBuckets = Array.from(new Set([
    ...selectedAppendices.map((appendix) => appendix.kind),
    ...selectedMemos.map((memo) => memo.templateId),
  ])).slice(0, 8);

  return {
    citationCount: evidence.length,
    graphNodeCount,
    sourceReceiptCount,
    contextBuckets: contextBuckets.length > 0 ? contextBuckets : ['draft'],
    evidence,
  };
}

function buildActionNote(action: string, memoCount: number, citationCount: number) {
  if (memoCount === 0) return 'Select at least one memo before running a drafting action.';
  if (action === 'Improve summary') return 'Start with the lead memo: sharpen BLUF, decision relevance, and confidence language.';
  if (action === 'Add evidence' && citationCount === 0) return 'The next move is to attach sources or graph receipts before expanding the draft.';
  if (action === 'Add evidence') return `Review ${memoCount} selected memo${memoCount === 1 ? '' : 's'} for unsupported claims before export.`;
  if (action === 'Export brief') return 'Confirm audience, appendices, audit manifest, and redactions; then export the package.';
  return `${action} is ready for the selected briefing package.`;
}
