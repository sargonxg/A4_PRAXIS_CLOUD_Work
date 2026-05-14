/**
 * SpecimenCard — the canonical PRAXIS pattern for a core.
 *
 * Design rule §7 (docs/superpowers/specs/2026-05-14-praxis-design-rules.md):
 * a core (User / Situation / Source / Graph / Time / Output) never
 * renders as a Material Design tile or generic card. It renders as a
 * museum specimen: a glass-square frame with a serial number in mono
 * and a single line of essence inside.
 *
 *   ┌──────────────────────┐
 *   │  PRX-CORE-USR-202604 │
 *   │                      │
 *   │   Senior Analyst     │
 *   │   Indo-Pacific desk  │
 *   └──────────────────────┘
 *
 * Use this everywhere a core surfaces in normal user UI: cores page,
 * capsule editor, share dialog, memo header. Never render a generic
 * card for a core.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type CoreSpecimenKind =
  | 'user'
  | 'situation'
  | 'source'
  | 'graph'
  | 'time'
  | 'output'
  | 'memory';

const KIND_SERIAL: Record<CoreSpecimenKind, string> = {
  user: 'USR',
  situation: 'SIT',
  source: 'SRC',
  graph: 'GRF',
  time: 'TIM',
  output: 'OUT',
  memory: 'MEM',
};

const KIND_TINT: Record<CoreSpecimenKind, string> = {
  user: 'border-[#3A5A7A]/40',
  situation: 'border-[#3F7A66]/40',
  source: 'border-[#C9A86A]/55',
  graph: 'border-[#5B6B8C]/45',
  time: 'border-[#A06A3C]/45',
  output: 'border-slate-300/80',
  memory: 'border-[#7A3F4F]/45',
};

const KIND_LABEL: Record<CoreSpecimenKind, string> = {
  user: 'USER CORE',
  situation: 'SITUATION CORE',
  source: 'SOURCE CORE',
  graph: 'GRAPH CORE',
  time: 'TIME CORE',
  output: 'OUTPUT CORE',
  memory: 'MEMORY CORE',
};

export interface SpecimenCardProps {
  kind: CoreSpecimenKind;
  /** Headline value inside the specimen, e.g. "Senior Analyst". */
  title: string;
  /** Optional one-line essence below the title. */
  essence?: string;
  /** Optional explicit serial; defaults to PRX-CORE-{KIND}-{yyyymm}. */
  serial?: string;
  /** Optional click target (open the editor for this core). */
  href?: string;
  /** Optional small trailing slot for status/version chip. */
  trailing?: ReactNode;
  className?: string;
}

function defaultSerial(kind: CoreSpecimenKind): string {
  const now = new Date();
  const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `PRX-CORE-${KIND_SERIAL[kind]}-${yyyymm}`;
}

export function SpecimenCard({
  kind,
  title,
  essence,
  serial,
  href,
  trailing,
  className,
}: SpecimenCardProps) {
  const Wrapper = href ? 'a' : 'div';
  const finalSerial = serial ?? defaultSerial(kind);
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        // Museum glass square: cream substrate, fine border with the
        // core's tint, generous inner padding, subtle ring like glass
        // edge highlight.
        'group relative flex aspect-[5/4] min-h-[160px] flex-col justify-between rounded-sm border-2 bg-[#FAF8F2] p-4 transition',
        'ring-1 ring-inset ring-white/80 shadow-sm hover:shadow-md',
        href ? 'cursor-pointer hover:-translate-y-[1px]' : '',
        KIND_TINT[kind],
        className,
      )}
    >
      {/* Top: serial + kind label */}
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          {finalSerial}
        </span>
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
      </div>

      {/* Middle: title + essence */}
      <div className="my-2">
        <h3 className="font-serif text-lg leading-snug text-[#0F172A]">{title}</h3>
        {essence ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{essence}</p>
        ) : null}
      </div>

      {/* Bottom: kind chip */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A5A00]">
          {KIND_LABEL[kind]}
        </span>
        {/* Glass corner mark */}
        <span aria-hidden className="font-mono text-[10px] text-slate-300">
          ◇
        </span>
      </div>
    </Wrapper>
  );
}

/**
 * SpecimenGrid — render the canonical 6/7 specimen cards in a grid.
 * Pure layout helper; the cards inside it are SpecimenCard instances.
 */
export function SpecimenGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
