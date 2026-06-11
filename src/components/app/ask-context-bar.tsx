'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import {
  Boxes,
  ChevronDown,
  FileText,
  Gauge,
  LibraryBig,
  Loader2,
  LogIn,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Target,
  UserRound,
  Wand2,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DEFAULT_CONTEXT_STACK_ID,
  assignCapsuleToDockSlot,
  buildCapsuleDockModel,
  buildCapsuleDockSlots,
  clearCapsuleDockSlot,
  defaultActiveContextStack,
  detachCapsuleRef,
  type ActiveContextStackState,
  type CapsuleDockSlot,
  type CapsuleDockSlotKind,
  type CapsuleDockWarning,
} from '@/lib/context/active-context-stack';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';
import { cn } from '@/lib/utils/cn';

const CapsuleListPicker = dynamic(
  () => import('@/components/cores/CapsuleListPicker').then((module) => module.CapsuleListPicker),
  { loading: () => null, ssr: false },
);

const CapsuleImportButton = dynamic(
  () => import('@/components/capsules/CapsuleImportButton').then((module) => module.CapsuleImportButton),
  { loading: () => null, ssr: false },
);

const InlineQuickContextBuilder = dynamic(
  () => import('@/components/context/inline-quick-context-builder').then((module) => module.InlineQuickContextBuilder),
  { loading: () => null, ssr: false },
);

const ApprovalInboxButton = dynamic(
  () => import('@/components/runs/approval-inbox').then((module) => module.ApprovalInboxButton),
  { loading: () => null, ssr: false },
);

const SLOT_ICONS: Record<CapsuleDockSlotKind, typeof UserRound> = {
  user: UserRound,
  situation: Target,
  tool: Wrench,
  output: FileText,
};

export function AskContextBar({
  activeSituation,
  hydrated = true,
  mode,
  onOpenAdvancedContext,
  persisted = false,
  saveStack,
  stack,
  variant = 'home',
}: {
  activeSituation?: Situation | null;
  hydrated?: boolean;
  mode: 'public' | 'authenticated';
  onOpenAdvancedContext?: () => void;
  persisted?: boolean;
  saveStack: (patch: Partial<ActiveContextStackState>) => Promise<ActiveContextStackState>;
  stack: ActiveContextStackState;
  variant?: 'home' | 'floating';
}) {
  const { user, analystProfile } = useAuth();
  const storeSituation = useSituationStore((state) => state.activeSituation);
  const situations = useSituationStore((state) => state.situations);
  const [pickerSlot, setPickerSlot] = useState<CapsuleDockSlotKind | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const dark = variant === 'floating';
  const isPublic = mode === 'public';
  const selectedSituation = activeSituation
    ?? storeSituation
    ?? situations.find((item) => item.id === stack.situationId)
    ?? null;
  const capsuleCount = stack.capsuleRefs.length || (stack.capsuleId ? 1 : 0);
  const sourceCount = stack.sourceIds.length + stack.documentIds.length;
  const readiness = useMemo(() => buildReadiness({
    capsuleCount,
    hydrated,
    outputGoal: stack.outputGoal,
    persisted,
    selectedSituation,
    sourceCount,
  }), [capsuleCount, hydrated, persisted, selectedSituation, sourceCount, stack.outputGoal]);
  const activeCapsuleId = stack.capsuleRefs[0]?.capsuleId ?? stack.capsuleId ?? null;
  const dockModel = useMemo(
    () => buildCapsuleDockModel(stack, { hydrated, persisted }),
    [hydrated, persisted, stack],
  );
  const dockSlots = useMemo(() => buildCapsuleDockSlots(stack), [stack]);

  async function persistStack(next: ActiveContextStackState) {
    setSaving(true);
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } finally {
      setSaving(false);
    }
  }

  async function attachCapsuleToSlot(kind: CapsuleDockSlotKind, capsuleId: string) {
    await persistStack(assignCapsuleToDockSlot(stack, kind, { capsuleId }));
    setPickerSlot(null);
  }

  async function clearSlot(kind: CapsuleDockSlotKind) {
    await persistStack(clearCapsuleDockSlot(stack, kind));
  }

  async function detachCapsule(capsuleId: string) {
    await persistStack(detachCapsuleRef(stack, capsuleId));
  }

  async function clearContext() {
    const empty = defaultActiveContextStack();
    setSaving(true);
    try {
      await saveStack({
        stackId: DEFAULT_CONTEXT_STACK_ID,
        capsuleId: null,
        capsuleRefs: [],
        contextPackageId: null,
        userModelId: null,
        situationId: null,
        sourceIds: [],
        documentIds: [],
        outputGoal: null,
        evidenceGaps: [],
        contextBlocks: empty.contextBlocks,
      });
    } finally {
      setSaving(false);
    }
  }

  function toggleSlotPicker(kind: CapsuleDockSlotKind) {
    setPickerSlot((value) => (value === kind ? null : kind));
    setBuilderOpen(false);
    setActionsOpen(false);
  }

  function toggleBuilder() {
    setBuilderOpen((value) => !value);
    setPickerSlot(null);
    setActionsOpen(false);
  }

  function toggleDetails() {
    setDetailsOpen((value) => !value);
    setActionsOpen(false);
  }

  return (
    <div
      data-testid="ask-context-bar"
      className={cn(
        'rounded-[var(--radius-lg)] border p-2 shadow-[var(--shadow-card)]',
        dark
          ? 'border-slate-800 bg-slate-950 text-slate-100 shadow-none'
          : 'border-[var(--color-app-border)] bg-white/90 text-slate-950',
      )}
    >
      {/* Capsule Dock — four typed slots: User / Situation / Tool / Output */}
      <div
        data-testid="capsule-dock"
        aria-label="Capsule Dock"
        className="flex flex-col gap-1.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            title={`${dockModel.contextPackageLabel} — Stack: ${dockModel.stackLabel} - ${dockModel.stackPolicyLabel}`}
            data-testid="capsule-dock-stack"
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-1 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em]',
              dark ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', readinessDotClassName(readiness.tone))} aria-hidden />
            {dockModel.title}
            <span className="sr-only">Capsule Dock. Stack: {dockModel.stackLabel} - {dockModel.stackPolicyLabel}. {dockModel.persistenceLabel}</span>
          </span>

          <div className="hidden sm:flex shrink-0 flex-wrap items-center gap-1.5">
            {isPublic ? (
              <>
                <Link
                  href="/login?mode=signup&redirect=%2Fapp"
                  data-testid="public-context-sign-in-affordance"
                  className={cn(
                    'inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold',
                    dark ? 'bg-white text-slate-950' : 'bg-emerald-700 text-white hover:bg-emerald-600',
                  )}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in to save context
                </Link>
                <button
                  type="button"
                  onClick={toggleDetails}
                  aria-expanded={detailsOpen}
                  className={actionClassName(dark, detailsOpen)}
                  title="Show context details: sources, saved context, readiness"
                >
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', detailsOpen && 'rotate-180')} />
                  <span className="sr-only">Context details</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleBuilder}
                  className={actionClassName(dark, builderOpen)}
                  title="Build context"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Build context
                </button>
                <Link href="/app/capsules" className={actionClassName(dark)} title="Open saved context in the capsule repository">
                  <LibraryBig className="h-3.5 w-3.5" />
                  Open context
                </Link>
                <ApprovalInboxButton dark={dark} />
                <button
                  type="button"
                  onClick={() => void clearContext()}
                  disabled={saving}
                  className={actionClassName(dark)}
                  title="Clear context"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  <span className="sr-only">Clear context</span>
                </button>
                <button
                  type="button"
                  onClick={toggleDetails}
                  aria-expanded={detailsOpen}
                  className={actionClassName(dark, detailsOpen)}
                  title="Show context details: sources, saved context, readiness"
                >
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', detailsOpen && 'rotate-180')} />
                  <span className="sr-only">Context details</span>
                </button>
              </>
            )}
          </div>

          <div className="relative shrink-0 sm:hidden" data-testid="capsule-dock-mobile-actions">
            <button
              type="button"
              aria-label="Capsule Dock actions"
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
              onClick={() => setActionsOpen((value) => !value)}
              className={actionClassName(dark, actionsOpen)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {actionsOpen ? (
              <div
                role="menu"
                data-testid="capsule-dock-action-menu"
                className={cn(
                  'absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-[min(18rem,calc(100vw-2rem))] gap-1 rounded-[var(--radius-md)] border p-2 shadow-[var(--shadow-float)]',
                  dark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white',
                )}
              >
                {isPublic ? (
                  <Link
                    href="/login?mode=signup&redirect=%2Fapp"
                    role="menuitem"
                    data-testid="public-context-sign-in-affordance"
                    onClick={() => setActionsOpen(false)}
                    className={cn(actionClassName(dark), 'w-full justify-start', dark ? 'bg-white text-slate-950' : 'bg-emerald-700 text-white hover:bg-emerald-600')}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in to save context
                  </Link>
                ) : (
                  <>
                    <button type="button" role="menuitem" onClick={toggleBuilder} className={cn(actionClassName(dark, builderOpen), 'w-full justify-start')}>
                      <Wand2 className="h-3.5 w-3.5" />
                      Build context
                    </button>
                    <Link href="/app/capsules" role="menuitem" onClick={() => setActionsOpen(false)} className={cn(actionClassName(dark), 'w-full justify-start')}>
                      <LibraryBig className="h-3.5 w-3.5" />
                      Open context
                    </Link>
                    <ApprovalInboxButton dark={dark} />
                    <button type="button" role="menuitem" onClick={() => { setActionsOpen(false); void clearContext(); }} disabled={saving} className={cn(actionClassName(dark), 'w-full justify-start')}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      Clear context
                    </button>
                  </>
                )}
                <button type="button" role="menuitem" onClick={toggleDetails} aria-expanded={detailsOpen} className={cn(actionClassName(dark, detailsOpen), 'w-full justify-start')}>
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', detailsOpen && 'rotate-180')} />
                  Context details
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* The four capsule slots */}
        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4" data-testid="capsule-dock-slots">
          {dockSlots.slots.map((slot) => (
            <CapsuleDockSlotCard
              key={slot.kind}
              dark={dark}
              disabled={isPublic}
              active={pickerSlot === slot.kind}
              saving={saving}
              slot={slot}
              onOpenPicker={() => toggleSlotPicker(slot.kind)}
              onClear={isPublic || !slot.item ? undefined : () => void clearSlot(slot.kind)}
            />
          ))}
        </div>

        {dockSlots.overflow.length ? (
          <div className="flex flex-wrap items-center gap-1.5" data-testid="capsule-dock-overflow">
            <span className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', dark ? 'text-slate-500' : 'text-slate-400')}>
              Also attached
            </span>
            {dockSlots.overflow.map((item) => (
              <span
                key={item.capsuleId}
                data-testid="capsule-dock-chip"
                title={`${item.roleLabel}: ${item.label}. ${item.versionLabel}.`}
                className={cn(
                  'inline-flex min-h-6 max-w-[16rem] items-center gap-1.5 rounded-[var(--radius-full)] border py-0.5 pl-2.5 pr-1 text-[11px]',
                  dark ? 'border-slate-700 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-700',
                )}
              >
                <span className="min-w-0 truncate font-semibold">{item.label}</span>
                {!isPublic ? (
                  <button
                    type="button"
                    onClick={() => void detachCapsule(item.capsuleId)}
                    disabled={saving}
                    title={`Detach ${item.label}`}
                    className={cn('inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50', dark ? 'hover:bg-slate-800 hover:text-red-300' : 'hover:bg-red-50 hover:text-red-700')}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Detach</span>
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}

        {dockModel.warnings.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {dockModel.warnings.map((warning) => <CapsuleDockWarningChip key={warning.id} dark={dark} warning={warning} />)}
          </div>
        ) : null}
      </div>

      {/* Collapsible provenance detail row: Sources / Saved context / Readiness */}
      {detailsOpen ? (
        <div className="mt-2 flex min-w-0 gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <ContextChip dark={dark} icon={LibraryBig} label="Sources" value={`${sourceCount} attached`} detail={sourceCount ? 'Receipts can ground answer' : 'Attach sources before final use'} tone={sourceCount ? 'ready' : 'review'} />
          <ContextChip dark={dark} icon={Boxes} label="Saved context" value={`${capsuleCount} attached`} detail={activeCapsuleId ?? 'No context selected'} tone={capsuleCount ? 'ready' : 'review'} />
          <ContextChip dark={dark} icon={UserRound} label="Analyst" value={labelize(analystProfile?.identity.role ?? user?.role ?? (isPublic ? 'Guest' : 'Analyst'))} detail={analystProfile?.perspective.audience ? labelize(analystProfile.perspective.audience) : user?.orgName ?? 'Workspace'} tone="ready" />
          <ContextChip dark={dark} icon={Gauge} label="Readiness" value={readiness.label} detail={readiness.detail} tone={readiness.tone} />
        </div>
      ) : null}

      {!isPublic && pickerSlot ? (
        <div className={cn('mt-2 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border p-2', dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50')}>
          <span className={cn('text-xs font-semibold', dark ? 'text-slate-300' : 'text-slate-600')}>
            Attach {dockSlots.slots.find((slot) => slot.kind === pickerSlot)?.label ?? ''} capsule
          </span>
          <CapsuleListPicker
            activeCapsuleId={dockSlots.slots.find((slot) => slot.kind === pickerSlot)?.item?.capsuleId ?? null}
            slotKind={pickerSlot}
            onCreate={() => setRefreshKey((key) => key + 1)}
            onSelect={(capsuleId) => void attachCapsuleToSlot(pickerSlot, capsuleId)}
            refreshKey={refreshKey}
          />
          <CapsuleImportButton
            variant={dark ? 'dark' : 'light'}
            onImported={(result) => {
              setRefreshKey((key) => key + 1);
              void attachCapsuleToSlot(pickerSlot, result.capsuleId);
            }}
          />
          {onOpenAdvancedContext ? (
            <button
              type="button"
              onClick={onOpenAdvancedContext}
              className={cn('text-xs font-semibold', dark ? 'text-emerald-300' : 'text-emerald-700')}
            >
              Open full stack
            </button>
          ) : null}
        </div>
      ) : null}

      {!isPublic && builderOpen ? (
        <InlineQuickContextBuilder
          className="mt-2"
          saveStack={saveStack}
          variant={dark ? 'dark' : 'light'}
          onCreated={() => {
            setRefreshKey((key) => key + 1);
            setBuilderOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function CapsuleDockSlotCard({
  active,
  dark,
  disabled,
  onClear,
  onOpenPicker,
  saving,
  slot,
}: {
  active: boolean;
  dark: boolean;
  disabled: boolean;
  onClear?: () => void;
  onOpenPicker: () => void;
  saving: boolean;
  slot: CapsuleDockSlot;
}) {
  const Icon = SLOT_ICONS[slot.kind];
  const filled = Boolean(slot.item);
  return (
    <div
      data-testid={`capsule-dock-slot-${slot.kind}`}
      className={cn(
        'group relative flex min-h-12 min-w-0 items-center gap-2 rounded-[var(--radius-md)] border px-2 py-1.5 transition',
        filled
          ? dark
            ? 'border-emerald-400/40 bg-emerald-400/10'
            : 'border-emerald-500/40 bg-emerald-50/70'
          : dark
            ? 'border-dashed border-slate-700 bg-slate-950'
            : 'border-dashed border-slate-300 bg-white',
        active && (dark ? 'ring-1 ring-emerald-400' : 'ring-1 ring-emerald-500'),
      )}
    >
      <button
        type="button"
        onClick={onOpenPicker}
        disabled={disabled || saving}
        title={filled
          ? `${slot.label} capsule: ${slot.item?.label}. ${slot.hint}. Click to swap.`
          : disabled
            ? `Sign in to attach a ${slot.label} capsule. ${slot.hint}.`
            : `Attach a ${slot.label} capsule. ${slot.hint}.`}
        data-testid="capsule-dock-chip"
        className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="relative inline-flex shrink-0">
          <Icon
            className={cn(
              'h-4 w-4',
              filled
                ? dark ? 'text-emerald-300' : 'text-emerald-700'
                : dark ? 'text-slate-500' : 'text-slate-400',
            )}
          />
          {filled ? (
            <span
              aria-hidden
              className={cn(
                'absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full',
                dark ? 'bg-emerald-300' : 'bg-emerald-500',
              )}
            />
          ) : null}
        </span>
        <span className="min-w-0">
          <span className={cn('block text-[9px] font-bold uppercase tracking-[0.14em]', dark ? 'text-slate-500' : 'text-slate-500')}>
            {slot.label}
          </span>
          {filled ? (
            <span className={cn('flex items-center gap-1 text-xs font-semibold', dark ? 'text-slate-100' : 'text-slate-900')}>
              <span className="min-w-0 truncate">{slot.item?.label}</span>
              <span className={cn('shrink-0 rounded-[var(--radius-sm)] px-1 font-mono text-[9px]', dark ? 'bg-slate-800 text-slate-300' : 'bg-emerald-100/70 text-emerald-800')}>
                {slot.item?.versionLabel}
              </span>
            </span>
          ) : (
            <span className={cn('flex items-center gap-1 text-xs font-semibold', dark ? 'text-slate-500' : 'text-slate-400')}>
              <Plus className="h-3 w-3" />
              Add
            </span>
          )}
        </span>
      </button>
      {onClear && filled ? (
        <button
          type="button"
          onClick={onClear}
          disabled={saving}
          title={`Remove ${slot.item?.label} from the ${slot.label} slot`}
          className={cn(
            'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50',
            dark ? 'hover:bg-slate-800 hover:text-red-300' : 'hover:bg-red-50 hover:text-red-700',
          )}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </button>
      ) : null}
    </div>
  );
}

function CapsuleDockWarningChip({ dark, warning }: { dark: boolean; warning: CapsuleDockWarning }) {
  const tone = warning.severity === 'blocking'
    ? dark
      ? 'border-red-400/30 bg-red-400/10 text-red-100'
      : 'border-red-200 bg-red-50 text-red-800'
    : warning.severity === 'review'
      ? dark
        ? 'border-amber-300/30 bg-amber-300/10 text-amber-100'
        : 'border-amber-200 bg-amber-50 text-amber-800'
      : dark
        ? 'border-slate-700 bg-slate-950 text-slate-300'
        : 'border-slate-200 bg-white text-slate-600';

  return (
    <span
      data-testid="capsule-dock-warning"
      title={warning.detail}
      className={cn('inline-flex min-h-6 items-center rounded-[var(--radius-md)] border px-2 text-[11px] font-semibold', tone)}
    >
      {warning.label}
    </span>
  );
}

function ContextChip({
  dark,
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  dark: boolean;
  detail: string;
  icon: typeof UserRound;
  label: string;
  tone: 'ready' | 'active' | 'review' | 'quiet';
  value: string;
}) {
  return (
    <span
      title={`${label}: ${value}. ${detail}`}
      className={cn(
        'inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-2.5 py-1.5',
        dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', toneClassName(tone, dark))} />
      <span className="min-w-0">
        <span className={cn('block text-[10px] font-bold uppercase tracking-[0.12em]', dark ? 'text-slate-500' : 'text-slate-500')}>{label}</span>
        <span className={cn('block max-w-[16ch] truncate text-xs font-semibold', dark ? 'text-slate-100' : 'text-slate-900')}>{value}</span>
      </span>
    </span>
  );
}

function buildReadiness(input: {
  capsuleCount: number;
  hydrated: boolean;
  outputGoal: string | null;
  persisted: boolean;
  selectedSituation: Situation | null;
  sourceCount: number;
}): { label: string; detail: string; tone: 'ready' | 'active' | 'review' | 'quiet' } {
  if (!input.hydrated) return { label: 'Loading', detail: 'Reading workspace context', tone: 'quiet' };
  const score = [
    input.selectedSituation ? 1 : 0,
    input.capsuleCount > 0 ? 1 : 0,
    input.sourceCount > 0 ? 1 : 0,
    input.outputGoal ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);
  if (score >= 3) return { label: input.persisted ? 'Ready' : 'Local ready', detail: 'Context can shape this answer', tone: 'ready' };
  if (score >= 1) return { label: 'Review', detail: 'Some context is active', tone: 'active' };
  return { label: 'Thin', detail: 'Ask will treat gaps explicitly', tone: 'review' };
}

function actionClassName(dark: boolean, active = false): string {
  return cn(
    'inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition disabled:opacity-60',
    active
      ? dark
        ? 'border-emerald-400 bg-emerald-400/15 text-emerald-100'
        : 'border-emerald-500/45 bg-emerald-500/10 text-emerald-800'
      : dark
        ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  );
}

function readinessDotClassName(tone: 'ready' | 'active' | 'review' | 'quiet'): string {
  if (tone === 'ready') return 'bg-emerald-500';
  if (tone === 'active') return 'bg-cyan-500';
  if (tone === 'review') return 'bg-amber-500';
  return 'bg-slate-300';
}

function toneClassName(tone: 'ready' | 'active' | 'review' | 'quiet', dark: boolean): string {
  if (tone === 'ready') return dark ? 'text-emerald-300' : 'text-emerald-700';
  if (tone === 'active') return dark ? 'text-cyan-300' : 'text-cyan-700';
  if (tone === 'review') return dark ? 'text-amber-300' : 'text-amber-700';
  return dark ? 'text-slate-500' : 'text-slate-400';
}

function labelize(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
