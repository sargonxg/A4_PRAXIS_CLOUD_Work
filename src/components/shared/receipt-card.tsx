/**
 * ReceiptCard — the canonical PRAXIS pattern for a cited claim.
 *
 * Design rule §6 (docs/superpowers/specs/2026-05-14-praxis-design-rules.md):
 * a cited claim never renders as a generic chip or pill. It renders as
 * a receipt slip with a gold left border, mono claim text, and a
 * page-span stamp on the right.
 *
 *   ┌────────────────────────────────────────┐
 *   │  CLAIM · ICG report 2026-04-22 · §4    │ p.12 │
 *   └────────────────────────────────────────┘
 *
 * Use this component everywhere a source receipt would appear: memo
 * margin, Ask chat footer, workbench source list, claim-check
 * results. Never render a Material card or chip for a citation.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ReceiptCardProps {
  /** Short claim phrase. Use sentence case, no trailing period. */
  claim: string;
  /** Source attribution. e.g. "ICG report 2026-04-22 §4" */
  source: string;
  /** Optional page or span stamp. e.g. "p.12" or "§4.3" */
  span?: string;
  /** Optional click target (open the source). */
  href?: string;
  /** Optional kind. "verified" tints the border gold; "gap" tints amber. */
  kind?: 'verified' | 'gap' | 'neutral';
  /** Optional trailing action node (e.g. a "Find source" button). */
  trailing?: ReactNode;
  className?: string;
}

const KIND_CLASS: Record<NonNullable<ReceiptCardProps['kind']>, string> = {
  verified: 'border-l-[3px] border-l-[#E8B931]',
  gap: 'border-l-[3px] border-l-[#D6863A]',
  neutral: 'border-l-[3px] border-l-slate-400',
};

export function ReceiptCard({
  claim,
  source,
  span,
  href,
  kind = 'verified',
  trailing,
  className,
}: ReceiptCardProps) {
  const Wrapper = href ? 'a' : 'div';
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        'group flex items-stretch gap-3 rounded-md border border-slate-200 bg-[#0F172A] text-[#F4ECD8]',
        'shadow-sm shadow-slate-950/20 transition hover:border-slate-300',
        href ? 'cursor-pointer' : '',
        KIND_CLASS[kind],
        className,
      )}
    >
      <div className="flex-1 px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E8B931]/85">
          CLAIM
        </p>
        <p className="mt-1 text-sm leading-snug text-[#F4ECD8]">{claim}</p>
        <p className="mt-1 font-mono text-[11px] text-slate-300">{source}</p>
      </div>
      {span ? (
        <div className="flex shrink-0 items-center border-l border-slate-700/60 px-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E8B931]">
            {span}
          </p>
        </div>
      ) : null}
      {trailing ? <div className="flex shrink-0 items-center pr-3">{trailing}</div> : null}
    </Wrapper>
  );
}
