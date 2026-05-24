'use client';

import { useState } from 'react';
import { Clipboard, FileText, Loader2, PackagePlus, PencilLine, Save } from 'lucide-react';
import type { ConversationDocumentPack } from '@/lib/ai/ask-answer-envelope';
import { cn } from '@/lib/utils/cn';

interface AskArtifactPreviewProps {
  pack: ConversationDocumentPack;
  answer: string;
  capsuleId?: string | null;
  turnId: string;
  saving?: boolean;
  onSaveToMemoStudio: () => Promise<void> | void;
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
  const [outputSaving, setOutputSaving] = useState<'output' | 'attach' | null>(null);
  const artifactText = `${pack.title}\n\n${pack.answer || answer}`.trim();
  const contextCapsuleId = pack.provenance.capsuleId ?? capsuleId ?? null;

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
          templateId: 'options-memo',
          payload: {
            title: pack.title,
            summary: excerpt(pack.answer || answer, 260),
            sections: [{
              heading: 'Draft answer',
              body: pack.answer || answer,
              citationIds: pack.sourceCards.map((source) => source.id),
            }],
          },
          citations: pack.sourceCards.map((source) => ({
            id: source.id,
            title: source.title,
            uri: source.url,
            sourceReceiptId: source.sourceReceiptId,
            confidence: source.confidence,
          })),
          gaps: pack.gaps.slice(0, 12).map((gap, index) => ({
            id: `ask-gap-${index + 1}`,
            claim: gap,
            reason: 'Ask PRAXIS marked this as a document-pack gap.',
            severity: 'medium',
          })),
          provenance: {
            createdBy: 'ask-praxis',
            toolIds: ['ask-praxis'],
            agentIds: [],
            traceId: pack.provenance.threadId ?? turnId,
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
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-oxide)]">Draft document pack</p>
          <h4 className="mt-1 break-words font-serif text-base font-semibold text-slate-950">{pack.title}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {pack.sourceCards.length} source cards / {pack.gaps.length} visible gaps / {contextCapsuleId ? 'capsule linked' : 'no capsule link'}
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
      <div className="mt-3 flex flex-wrap gap-2">
        <ArtifactButton icon={Clipboard} label="Copy" onClick={() => void copyArtifact()} />
        <ArtifactButton
          icon={PencilLine}
          label="Revise in chat"
          onClick={() => onRevise(`Revise this document pack with tighter sourcing, a clearer decision frame, and explicit gaps:\n\n${artifactText}`)}
        />
        <ArtifactButton
          icon={saving ? Loader2 : Save}
          label="Save to Memo Studio"
          loading={saving}
          disabled={saving}
          onClick={() => void onSaveToMemoStudio()}
        />
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
