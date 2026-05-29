'use client';

import { useState } from 'react';
import { Clipboard, FileText, Loader2, PackagePlus, PencilLine, Save } from 'lucide-react';
import type { ConversationDocumentPack } from '@/lib/ai/ask-answer-envelope';
import {
  POLICY_OUTPUT_TARGETS,
  normalizePolicyOutputTarget,
  outputCapsuleTemplateIdForTarget,
  outputTargetLabel,
} from '@/lib/policy-work-file/output-targets';
import { cn } from '@/lib/utils/cn';

type DraftSaveResult = {
  href?: string | null;
  memoId?: string | null;
} | void;

interface AskArtifactPreviewProps {
  pack: ConversationDocumentPack;
  answer: string;
  capsuleId?: string | null;
  turnId: string;
  saving?: boolean;
  onSaveToMemoStudio: (pack: ConversationDocumentPack) => Promise<DraftSaveResult> | DraftSaveResult;
  onRevise: (revisionPrompt: string) => void;
}

export function AskArtifactPreview({
  pack,
  answer,
  capsuleId,
  turnId,
  saving = false,
  onSaveToMemoStudio,
  onRevise,
}: AskArtifactPreviewProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [draftHref, setDraftHref] = useState<string | null>(null);
  const [selectedOutputTarget, setSelectedOutputTarget] = useState(() => normalizePolicyOutputTarget(pack.provenance.outputTarget));
  const [outputSaving, setOutputSaving] = useState<'output' | 'attach' | null>(null);
  const selectedPack: ConversationDocumentPack = {
    ...pack,
    provenance: {
      ...pack.provenance,
      outputTarget: selectedOutputTarget,
    },
  };
  const artifactText = `${pack.title}\n\n${pack.answer || answer}`.trim();
  const contextCapsuleId = selectedPack.provenance.capsuleId ?? capsuleId ?? null;
  const targetLabel = outputTargetLabel(selectedPack.provenance.outputTarget);

  async function openAsDraft() {
    setStatus(null);
    const result = await onSaveToMemoStudio(selectedPack);
    const href = hrefFromDraftSaveResult(result);
    if (href) setDraftHref(href);
    setStatus(href ? 'Draft saved. Open it when ready.' : 'Draft saved.');
  }

  async function copyArtifact() {
    if (!navigator.clipboard?.writeText) {
      setStatus('Copy unavailable in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(artifactText);
      setStatus('Copied.');
    } catch {
      setStatus('Copy failed.');
    }
  }

  async function saveOutputCapsule(mode: 'output' | 'attach') {
    setOutputSaving(mode);
    setStatus(null);
    try {
      const response = await fetch('/api/output-capsules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contextCapsuleId,
          templateId: outputCapsuleTemplateIdForTarget(selectedPack.provenance.outputTarget),
          payload: {
            title: selectedPack.title,
            summary: excerpt(selectedPack.answer || answer, 260),
            outputTarget: selectedPack.provenance.outputTarget,
            outputTargetLabel: targetLabel,
            sections: [{
              heading: targetLabel,
              body: selectedPack.answer || answer,
              citationIds: selectedPack.sourceCards.map((source) => source.id),
            }],
          },
          citations: selectedPack.sourceCards.map((source) => ({
            id: source.id,
            title: source.title,
            uri: source.url,
            sourceReceiptId: source.sourceReceiptId,
            confidence: source.confidence,
          })),
          gaps: selectedPack.gaps.slice(0, 12).map((gap, index) => ({
            id: `ask-gap-${index + 1}`,
            claim: gap,
            reason: 'Ask PRAXIS marked this as a document-pack gap.',
            severity: 'medium',
          })),
          provenance: {
            createdBy: 'ask-praxis',
            toolIds: ['ask-praxis'],
            agentIds: [],
            traceId: selectedPack.provenance.threadId ?? turnId,
          },
        }),
      });
      if (!response.ok) throw new Error(`Output capsule save failed (${response.status})`);
      setStatus(mode === 'attach' ? 'Attached as an Output Capsule proposal.' : 'Saved as Output Capsule.');
    } catch {
      setStatus(mode === 'attach' ? 'Could not attach to capsule.' : 'Could not save Output Capsule.');
    } finally {
      setOutputSaving(null);
    }
  }

  return (
    <section
      className="mt-3 rounded-lg border border-[color:var(--color-clay)]/30 bg-[color:var(--color-archive-paper)] p-3"
      data-memo-endpoint="/api/memos/from-ask-pack"
      data-testid="ask-artifact-preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-oxide)]">Active Policy File</p>
          <h4 className="mt-1 break-words font-serif text-base font-semibold text-slate-950">{pack.title}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {targetLabel} / {selectedPack.sourceCards.length} source cards / {selectedPack.gaps.length} visible gaps / {contextCapsuleId ? 'capsule linked' : 'no capsule link'}
          </p>
        </div>
        {status ? (
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
            {status}
          </span>
        ) : null}
      </div>
      <div className="mt-3 max-h-28 overflow-hidden rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700">
        {excerpt(pack.answer || answer, 520)}
      </div>
      <label className="mt-3 block max-w-sm text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Output target
        <select
          data-testid="ask-output-target-select"
          value={selectedOutputTarget}
          onChange={(event) => setSelectedOutputTarget(normalizePolicyOutputTarget(event.target.value))}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-800"
        >
          {POLICY_OUTPUT_TARGETS.map((target) => (
            <option key={target.id} value={target.id}>
              {target.label}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <ArtifactButton icon={Clipboard} label="Copy" onClick={() => void copyArtifact()} />
        <ArtifactButton
          icon={PencilLine}
          label="Revise in chat"
          onClick={() => onRevise(`Revise this document pack with tighter sourcing, a clearer decision frame, and explicit gaps:\n\n${artifactText}`)}
        />
        <ArtifactButton
          icon={saving ? Loader2 : Save}
          label="Open as Draft"
          loading={saving}
          disabled={saving}
          onClick={() => void openAsDraft()}
        />
        {draftHref ? (
          <a
            href={draftHref}
            data-testid="open-draft-link"
            className="inline-flex min-h-8 items-center gap-2 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <FileText className="h-3.5 w-3.5" />
            Open Draft
          </a>
        ) : null}
        <ArtifactButton
          icon={outputSaving === 'output' ? Loader2 : FileText}
          label="Save as Output Capsule"
          loading={outputSaving === 'output'}
          disabled={Boolean(outputSaving)}
          onClick={() => void saveOutputCapsule('output')}
        />
        <ArtifactButton
          icon={outputSaving === 'attach' ? Loader2 : PackagePlus}
          label="Attach answer to capsule"
          loading={outputSaving === 'attach'}
          disabled={Boolean(outputSaving)}
          onClick={() => void saveOutputCapsule('attach')}
        />
      </div>
    </section>
  );
}

function ArtifactButton({
  icon: Icon,
  label,
  disabled = false,
  loading = false,
  onClick,
}: {
  icon: typeof Clipboard;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
      {label}
    </button>
  );
}

function excerpt(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, Math.max(0, max - 1)).trim()}...`;
}

function hrefFromDraftSaveResult(result: DraftSaveResult): string | null {
  if (!result || typeof result !== 'object') return null;
  if (typeof result.href === 'string' && result.href.trim()) return result.href;
  if (typeof result.memoId === 'string' && result.memoId.trim()) {
    return `/app/write?memoId=${encodeURIComponent(result.memoId)}`;
  }
  return null;
}
