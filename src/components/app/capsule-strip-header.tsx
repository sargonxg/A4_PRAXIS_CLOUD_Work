'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { cn } from '@/lib/utils/cn';

const KIND_ORDER: CoreSpecimenKind[] = ['user', 'situation', 'path', 'source', 'graph', 'time', 'tool', 'objective', 'product', 'output', 'memory'];

const KIND_LABEL: Record<CoreSpecimenKind, string> = {
  user: 'User',
  situation: 'Situation',
  path: 'Path',
  source: 'Source',
  graph: 'Graph',
  time: 'Time',
  tool: 'Tool',
  objective: 'Objective',
  product: 'Product',
  output: 'Output',
  memory: 'Memory',
};

const KIND_DOT_FILLED: Record<CoreSpecimenKind, string> = {
  user: 'bg-[#3A5A7A]',
  situation: 'bg-[#3F7A66]',
  path: 'bg-[#8A5A00]',
  source: 'bg-[#C9A86A]',
  graph: 'bg-[#5B6B8C]',
  time: 'bg-[#A06A3C]',
  tool: 'bg-[#1B3A5C]',
  objective: 'bg-[#3F7A66]',
  product: 'bg-[#2F4858]',
  output: 'bg-slate-500',
  memory: 'bg-[#7A3F4F]',
};

function dotFilled(refs: PraxisCapsule['coreRefs'] | null, kind: CoreSpecimenKind): boolean {
  if (!refs) return false;
  switch (kind) {
    case 'user':
      return Boolean(refs.userCoreId);
    case 'situation':
      return Boolean(refs.situationCoreId);
    case 'path':
      return Boolean(refs.pathCoreId);
    case 'source':
      return refs.sourceCoreIds.length > 0 || refs.documentCoreIds.length > 0;
    case 'graph':
      return Boolean(refs.graphCoreId);
    case 'output':
      return refs.outputCoreIds.length > 0;
    case 'time':
      return Boolean(refs.timeCoreId);
    case 'tool':
      return Boolean(refs.toolCoreIds?.length);
    case 'objective':
      return Boolean(refs.objectiveCoreIds?.length);
    case 'product':
      return Boolean(refs.productCoreIds?.length);
    case 'memory':
      return Boolean(refs.memoryCoreId);
    default:
      return false;
  }
}

export function CapsuleStripHeader() {
  const [capsule, setCapsule] = useState<PraxisCapsule | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/context/capsules', { credentials: 'include' })
      .then(async (res) => (res.ok ? (await res.json()) as { capsules: PraxisCapsule[] } : { capsules: [] }))
      .then((body) => {
        if (cancelled) return;
        setCapsule(body.capsules[0] ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/app/contexts"
      className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-navy-500 hover:border-navy-300 hover:text-navy-800 md:flex"
      aria-label={capsule ? `Active capsule: ${capsule.label}` : 'No active capsule'}
      title={capsule ? `Active capsule: ${capsule.label}` : 'No active capsule — click to attach cores'}
    >
      <span className="font-mono uppercase tracking-[0.18em]">CAP</span>
      <span className="flex items-center gap-0.5">
        {KIND_ORDER.map((kind) => {
          const filled = dotFilled(capsule?.coreRefs ?? null, kind);
          return (
            <span
              key={kind}
              aria-label={`${KIND_LABEL[kind]} core ${filled ? 'present' : 'missing'}`}
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full transition',
                filled ? KIND_DOT_FILLED[kind] : 'bg-slate-200 ring-1 ring-inset ring-slate-300',
              )}
            />
          );
        })}
      </span>
    </Link>
  );
}
