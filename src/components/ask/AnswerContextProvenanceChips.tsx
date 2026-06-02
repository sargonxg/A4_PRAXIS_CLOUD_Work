import Link from 'next/link';
import { Boxes, FileText, LibraryBig, Lightbulb, TriangleAlert } from 'lucide-react';
import type { AskAnswerEnvelope, AskContextProvenanceChip } from '@/lib/ai/ask-answer-envelope';
import { cn } from '@/lib/utils/cn';

export function AnswerContextProvenanceChips({
  envelope,
  variant = 'light',
}: {
  envelope?: AskAnswerEnvelope;
  variant?: 'light' | 'dark';
}) {
  const chips = envelope?.contextProvenanceChips?.length
    ? envelope.contextProvenanceChips
    : fallbackChips(envelope);
  if (!chips.length) return null;
  const inspired = chips.filter((chip) => chip.tone === 'inspired');
  const grounded = chips.filter((chip) => chip.tone === 'grounded');
  const review = chips.filter((chip) => chip.tone === 'review');

  return (
    <div className="mt-3 grid gap-2" data-testid="answer-context-provenance">
      {inspired.length ? <ChipGroup label="Inspired by" chips={inspired} variant={variant} /> : null}
      {grounded.length ? <ChipGroup label="Grounded by" chips={grounded} variant={variant} grounded /> : null}
      {review.length ? <ChipGroup label="Review" chips={review} variant={variant} /> : null}
    </div>
  );
}

function ChipGroup({
  chips,
  grounded = false,
  label,
  variant,
}: {
  chips: AskContextProvenanceChip[];
  grounded?: boolean;
  label: string;
  variant: 'light' | 'dark';
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', variant === 'dark' ? 'text-slate-500' : 'text-slate-500')}>
        {label}
      </span>
      {chips.slice(0, 5).map((chip) => (
        <ProvenanceChip key={chip.id} chip={chip} grounded={grounded} variant={variant} />
      ))}
    </div>
  );
}

function ProvenanceChip({
  chip,
  grounded,
  variant,
}: {
  chip: AskContextProvenanceChip;
  grounded: boolean;
  variant: 'light' | 'dark';
}) {
  const className = cn(
    'inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-[var(--radius-full)] border px-2 py-1 text-[11px] font-semibold',
    variant === 'dark'
      ? 'border-slate-700 bg-slate-950 text-slate-200'
      : 'border-slate-200 bg-slate-50 text-slate-700',
    chip.tone === 'grounded' && (variant === 'dark'
      ? 'border-emerald-700/60 bg-emerald-950/30 text-emerald-100'
      : 'border-emerald-200 bg-emerald-50 text-emerald-900'),
    chip.tone === 'review' && (variant === 'dark'
      ? 'border-amber-700/60 bg-amber-950/30 text-amber-100'
      : 'border-amber-200 bg-amber-50 text-amber-900'),
  );
  const contents = (
    <>
      <ProvenanceIcon kind={chip.kind} />
      <span className="truncate">{chip.label}</span>
    </>
  );
  if (chip.href) {
    const external = /^https?:\/\//.test(chip.href);
    if (external) {
      return (
        <a
          href={chip.href}
          target="_blank"
          rel="noreferrer"
          title={chip.detail}
          data-testid={grounded ? 'answer-grounded-by-chip' : 'answer-inspired-by-chip'}
          className={className}
        >
          {contents}
        </a>
      );
    }
    return (
      <Link
        href={chip.href}
        title={chip.detail}
        data-testid={grounded ? 'answer-grounded-by-chip' : 'answer-inspired-by-chip'}
        className={className}
      >
        {contents}
      </Link>
    );
  }
  return (
    <span
      title={chip.detail}
      data-testid={grounded ? 'answer-grounded-by-chip' : 'answer-inspired-by-chip'}
      className={className}
    >
      {contents}
    </span>
  );
}

function fallbackChips(envelope: AskAnswerEnvelope | undefined): AskContextProvenanceChip[] {
  if (!envelope) return [];
  const chips: AskContextProvenanceChip[] = [];
  if (envelope.groundingReceipt?.capsuleId && envelope.groundingReceipt.capsuleId !== 'unknown-capsule') {
    chips.push({
      id: `capsule:${envelope.groundingReceipt.capsuleId}`,
      kind: 'capsule',
      label: 'ContextCapsule',
      detail: `v${envelope.groundingReceipt.capsuleVersion}`,
      href: `/app/capsules?capsuleId=${encodeURIComponent(envelope.groundingReceipt.capsuleId)}`,
      tone: 'inspired',
    });
  }
  const source = envelope.sourceCards?.find((card) => card.sourceReceiptHref || card.url);
  if (source) {
    chips.push({
      id: `source:${source.sourceReceiptId ?? source.id}`,
      kind: 'source',
      label: source.sourceReceiptId ? 'source receipt' : source.label,
      detail: source.title,
      href: source.sourceReceiptHref ?? source.url,
      tone: 'grounded',
    });
  }
  return chips;
}

function ProvenanceIcon({ kind }: { kind: AskContextProvenanceChip['kind'] }) {
  const className = 'h-3 w-3 shrink-0';
  if (kind === 'capsule' || kind === 'context-package') return <Boxes className={className} />;
  if (kind === 'source' || kind === 'document') return <LibraryBig className={className} />;
  if (kind === 'output') return <FileText className={className} />;
  if (kind === 'gap') return <TriangleAlert className={className} />;
  return <Lightbulb className={className} />;
}
