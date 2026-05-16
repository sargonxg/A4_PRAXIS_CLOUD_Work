'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, FileUp, GitCompareArrows, LibraryBig, PanelTopOpen, RotateCcw, ShieldCheck, Wrench } from 'lucide-react';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { cn } from '@/lib/utils/cn';
import {
  CAPSULE_ATTACHMENT_ROLES,
  CAPSULE_SLOT_DEFINITIONS,
  capsuleAttachmentCounts,
  capsuleSlotReadiness,
  type CapsuleSlotId,
} from '@/lib/product/context-capsules';

const KIND_ORDER: CoreSpecimenKind[] = ['user', 'situation', 'path', 'source', 'document', 'graph', 'time', 'tool', 'objective', 'product', 'output', 'memory'];

const KIND_LABEL: Record<CoreSpecimenKind, string> = {
  user: 'User',
  situation: 'Situation',
  path: 'Path',
  source: 'Source',
  document: 'Document',
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
  document: 'bg-[#7A6A3F]',
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
      return refs.sourceCoreIds.length > 0;
    case 'document':
      return refs.documentCoreIds.length > 0;
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
  const [open, setOpen] = useState(false);

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

  const readiness = capsuleSlotReadiness(capsule?.coreRefs);
  const counts = capsuleAttachmentCounts(capsule?.coreRefs);
  const readySlotCount = CAPSULE_SLOT_DEFINITIONS.filter((slot) => readiness[slot.id]).length;
  const outputTarget = capsule?.coreRefs.outputCoreIds.length
    ? `${capsule.coreRefs.outputCoreIds.length} output core${capsule.coreRefs.outputCoreIds.length === 1 ? '' : 's'}`
    : 'Memo target open';
  const activeLabel = capsule?.label ?? 'No active capsule';

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex max-w-[28rem] items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-navy-600 hover:border-navy-300 hover:text-navy-900"
        aria-expanded={open}
        aria-label={capsule ? `Active capsule manager: ${capsule.label}` : 'No active capsule'}
        title={capsule ? `Active capsule: ${capsule.label}` : 'No active capsule - click to attach cores'}
      >
        <span className="font-mono uppercase tracking-[0.18em]">CAP</span>
        <span className="max-w-[8rem] truncate text-left text-[11px] text-navy-900">{activeLabel}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
          {capsule?.health.score ?? 0}/100
        </span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
          {counts.attachments} att
        </span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
          {counts.connectors} conn
        </span>
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
        <PanelTopOpen className="h-3.5 w-3.5 text-slate-500" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[34rem] max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-4 text-slate-700 shadow-xl shadow-navy-950/15">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-700">Capsule Manager</p>
              <h2 className="mt-1 truncate font-serif text-xl font-semibold text-navy-950">{activeLabel}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Primary capsule / {readySlotCount} of {CAPSULE_SLOT_DEFINITIONS.length} slots ready / {outputTarget}
              </p>
            </div>
            <Link
              href="/app/contexts"
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900 hover:bg-slate-50"
            >
              Open workshop
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
            {CAPSULE_ATTACHMENT_ROLES.map((role) => (
              <div
                key={role.role}
                className={cn(
                  'rounded-md border px-2 py-2',
                  role.role === 'primary' && capsule
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                )}
                title={role.description}
              >
                <span className="block font-bold uppercase tracking-[0.12em]">{role.label}</span>
                <span className="mt-1 block truncate font-mono">
                  {role.role === 'primary' && capsule ? 'active' : role.role === 'archived' ? '0 hidden' : '0 attached'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {CAPSULE_SLOT_DEFINITIONS.map((slot) => (
              <CapsuleSlotRow key={slot.id} slotId={slot.id} label={slot.label} ready={readiness[slot.id]} />
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <ManagerAction href="/app/contexts" icon={FileUp} label="Attach file" />
            <ManagerAction href="/app/contexts" icon={LibraryBig} label="Add connector" />
            <ManagerAction href="/app/contexts" icon={RotateCcw} label="Swap core" />
            <ManagerAction href="/app/contexts" icon={GitCompareArrows} label="Reference capsule" />
            <ManagerAction href="/app/tools" icon={Wrench} label="Tools" />
            <ManagerAction href="/app/write" icon={ShieldCheck} label="Memo handoff" />
          </div>

          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] leading-4 text-amber-950">
            <div className="flex items-start gap-2">
              <Archive className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>Detach, replace, merge, and archive actions stay in the workshop so dependent outputs and runs can be reviewed first.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CapsuleSlotRow({ label, ready, slotId }: { label: string; ready: boolean; slotId: CapsuleSlotId }) {
  return (
    <Link
      href={slotHref(slotId)}
      className={cn(
        'flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-[11px] transition',
        ready
          ? 'border-slate-200 bg-white text-navy-900 hover:border-diplomatic-blue/30'
          : 'border-gold-200 bg-gold-50 text-gold-950 hover:border-gold-300',
      )}
    >
      <span className="truncate font-semibold">{label}</span>
      <span className={cn('h-2 w-2 shrink-0 rounded-full', ready ? 'bg-emerald-500' : 'bg-gold-500')} />
    </Link>
  );
}

function ManagerAction({ href, icon: Icon, label }: { href: string; icon: typeof FileUp; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-white"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function slotHref(slotId: CapsuleSlotId): string {
  switch (slotId) {
    case 'user':
      return '/app/cores/user';
    case 'graph':
      return '/app/canvas';
    case 'tool':
      return '/app/tools';
    case 'output':
      return '/app/write';
    default:
      return '/app/contexts';
  }
}
