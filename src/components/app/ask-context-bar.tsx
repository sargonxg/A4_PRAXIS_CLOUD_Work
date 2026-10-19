'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState, type CSSProperties } from 'react';
import {
  Boxes,
  ChevronDown,
  FileText,
  Gauge,
  LibraryBig,
  Loader2,
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
  attachCapsuleRef,
  detachCapsuleRef,
  type ActiveContextStackState,
  type CapsuleDockSlot,
  type CapsuleDockSlotKind,
  type CapsuleDockWarning,
} from '@/lib/context/active-context-stack';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { persistCapsuleDockStack } from '@/hooks/use-capsule-dock-actions';
import { getCapsuleCategoryPalette } from '@/lib/constants/aco-colors';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';
import { cn } from '@/lib/utils/cn';
import { CapsuleListPicker } from '@/components/cores/CapsuleListPicker';

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
  onMutationPending,
  persisted = false,
  saveStack,
  stack,
  variant = 'home',
}: {
  activeSituation?: Situation | null;
  hydrated?: boolean;
  mode: 'public' | 'authenticated';
  onOpenAdvancedContext?: () => void;
  onMutationPending?: (pending: boolean) => void;
  persisted?: boolean;
  saveStack: (patch: Partial<ActiveContextStackState>) => Promise<ActiveContextStackState>;
  stack: ActiveContextStackState;
  variant?: 'home' | 'floating';
}) {
  const { user, analystProfile, loading: authLoading } = useAuth();
  const storeSituation = useSituationStore((state) => state.activeSituation);
  const situations = useSituationStore((state) => state.situations);
  const [pickerSlot, setPickerSlot] = useState<CapsuleDockSlotKind | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const dark = variant === 'floating';
  const isPublic = mode === 'public';
  const contextReady = !isPublic && !authLoading && Boolean(user?.id) && hydrated;
  const mutationDisabled = !contextReady || saving;
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
    if (mutationDisabled) return false;
    setSaving(true);
    onMutationPending?.(true);
    setSaveError(null);
    try {
      await persistCapsuleDockStack(saveStack, next);
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Your capsule could not be attached. Please retry.');
      return false;
    } finally {
      setSaving(false);
      onMutationPending?.(false);
    }
  }

  async function attachCapsuleToSlot(kind: CapsuleDockSlotKind, capsuleId: string, capsule?: PraxisCapsule) {
    if (await persistStack(assignCapsuleToDockSlot(stack, kind, { capsuleId, label: capsule?.label, version: capsule?.version }))) setPickerSlot(null);
  }

  async function attachContext(capsuleId: string, capsule?: PraxisCapsule) {
    await persistStack(attachCapsuleRef(stack, { capsuleId, label: capsule?.label, version: capsule?.version, role: stack.capsuleRefs.length ? 'reference' : 'primary' }));
  }

  async function clearSlot(kind: CapsuleDockSlotKind) {
    await persistStack(clearCapsuleDockSlot(stack, kind));
  }

  async function detachCapsule(capsuleId: string) {
    await persistStack(detachCapsuleRef(stack, capsuleId));
  }

  async function clearContext() {
    if (mutationDisabled) return;
    const empty = defaultActiveContextStack();
    setSaving(true);
    onMutationPending?.(true);
    setSaveError(null);
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
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Context could not be cleared. Please retry.');
    } finally {
      setSaving(false);
      onMutationPending?.(false);
    }
  }

  function toggleSlotPicker(kind: CapsuleDockSlotKind) {
    if (mutationDisabled) return;
    setPickerSlot((value) => (value === kind ? null : kind));
    setBuilderOpen(false);
  }

  function toggleBuilder() {
    if (mutationDisabled) return;
    setBuilderOpen((value) => !value);
    setPickerSlot(null);
  }

  function toggleDetails() {
    setDetailsOpen((value) => !value);
  }

  return (
    <div data-testid="ask-context-bar" className={cn('praxis-context-bar', dark && 'praxis-context-bar-dark')}>
      {saveError ? <p role="alert" className="mb-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{saveError}</p> : null}
      <div data-testid="capsule-dock" aria-label="Attached context" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {isPublic ? <Link href="/login?mode=signup&redirect=%2Fapp" data-testid="public-context-sign-in-affordance" className={actionClassName(dark)}><Boxes className="h-4 w-4" />Attach context</Link> : <fieldset disabled={mutationDisabled} className="min-w-0"><CapsuleListPicker activeCapsuleId={null} triggerLabel="Attach context" onSelect={(id, capsule) => void attachContext(id, capsule)} refreshKey={refreshKey} /></fieldset>}
            <Link href={isPublic ? '/login?mode=signup&redirect=%2Fapp%2Fcapsules%2Fbuilder' : '/app/capsules/builder'} className={actionClassName(dark)}><Plus className="h-4 w-4" />New capsule</Link>
          </div>
          <button type="button" onClick={toggleDetails} aria-expanded={detailsOpen} aria-controls="ask-context-details" className={actionClassName(dark, detailsOpen)} title="Show context details: sources, saved context, readiness"><ChevronDown className={cn('h-4 w-4 transition-transform', detailsOpen && 'rotate-180')} />Context details</button>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="attached-context-chips">
          {dockModel.items.map((item) => <span key={item.capsuleId} className="praxis-context-chip" data-testid="capsule-dock-chip" title={`${item.roleLabel}: ${item.label}. ${item.versionLabel}.`}>
            <Link href={`/app/capsules?lane=inspect&starter=${encodeURIComponent(item.capsuleId)}`} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 px-3 py-2" aria-label={`Inspect ${item.label} (current saved capsule). Chat uses attached ${item.versionLabel}.`} title="Inspect the current saved capsule; it may have changed since this version was attached."><Boxes className="h-3.5 w-3.5 shrink-0" /><span className="max-w-[18rem] truncate font-semibold">{item.label}</span><span className="font-mono text-[11px]">{item.versionLabel}</span>{item.primary ? <span className="text-[11px]">Primary</span> : null}</Link>
            {!isPublic ? <button type="button" onClick={() => void detachCapsule(item.capsuleId)} disabled={mutationDisabled} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-r-lg hover:bg-white/70 disabled:opacity-50" aria-label={`Detach ${item.label}`} title={`Detach ${item.label}`}><X className="h-3.5 w-3.5" /></button> : null}
          </span>)}
          {!dockModel.items.length ? <p className="px-1 text-xs leading-5 text-[var(--color-app-text-secondary)]">{hydrated ? 'Ask directly, or attach a capsule to bring your saved sources and context.' : 'Loading your saved context…'}</p> : null}
          {saving ? <span role="status" className="inline-flex items-center gap-2 text-xs"><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving context…</span> : null}
        </div>
        {dockModel.warnings.filter((warning) => warning.severity === 'blocking').map((warning) => <CapsuleDockWarningChip key={warning.id} dark={dark} warning={warning} />)}
      </div>
      {detailsOpen ? <section id="ask-context-details" className="mt-4 space-y-3 border-t border-[var(--color-app-border)] pt-4" aria-label="Context composition details">
        <div className="flex flex-wrap items-center justify-between gap-2"><span data-testid="capsule-dock-stack" className="text-xs text-[var(--color-app-text-secondary)]" title={`${dockModel.contextPackageLabel} — Stack: ${dockModel.stackLabel} - ${dockModel.stackPolicyLabel}`}>Capsule Dock · Stack: {dockModel.stackLabel} · {dockModel.stackPolicyLabel} · {dockModel.persistenceLabel}</span><span className="text-xs text-[var(--color-app-text-secondary)]">User · Situation · Tools · Output</span></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" data-testid="capsule-dock-slots">{dockSlots.slots.map((slot) => <CapsuleDockSlotCard key={slot.kind} dark={dark} disabled={!contextReady} active={pickerSlot === slot.kind} saving={saving} slot={slot} onOpenPicker={() => toggleSlotPicker(slot.kind)} onClear={isPublic || !slot.item ? undefined : () => void clearSlot(slot.kind)} />)}</div>
        <div className="flex flex-wrap gap-2"><ContextChip dark={dark} icon={LibraryBig} label="Sources" value={`${sourceCount} attached`} detail={sourceCount ? 'Receipts can ground answer' : 'Attach sources before final use'} tone={sourceCount ? 'ready' : 'review'} /><ContextChip dark={dark} icon={Boxes} label="Capsules" value={`${capsuleCount} attached`} detail={activeCapsuleId ?? 'No context selected'} tone={capsuleCount ? 'ready' : 'review'} /><ContextChip dark={dark} icon={UserRound} label="Analyst" value={labelize(analystProfile?.identity.role ?? user?.role ?? (isPublic ? 'Guest' : 'Analyst'))} detail={user?.orgName ?? 'Workspace'} tone="ready" /><ContextChip dark={dark} icon={Gauge} label="Readiness" value={readiness.label} detail={readiness.detail} tone={readiness.tone} /></div>
        <p className="text-xs leading-5 text-[var(--color-app-text-secondary)]">The primary capsule governs; references fill gaps in order. Chat uses the attached saved versions. PRAXIS may add relevant workspace or web sources; ask it to use only attached sources when you want to limit the evidence. Inspection opens the current saved capsule, which may have changed since attachment. Context and generated claims still need your review.</p>
        {dockModel.warnings.filter((warning) => warning.severity !== 'blocking').map((warning) => <CapsuleDockWarningChip key={warning.id} dark={dark} warning={warning} />)}
        {!isPublic ? <div className="flex flex-wrap gap-2"><button type="button" onClick={toggleBuilder} disabled={mutationDisabled} className={actionClassName(dark, builderOpen)} title="Build context"><Wand2 className="h-4 w-4" />Build context</button><Link href="/app/capsules?lane=repository" className={actionClassName(dark)}><LibraryBig className="h-4 w-4" />Pick capsule</Link><ApprovalInboxButton dark={dark} /><button type="button" onClick={() => void clearContext()} disabled={mutationDisabled} className={actionClassName(dark)} title="Clear context"><RotateCcw className="h-4 w-4" />Clear context</button>{onOpenAdvancedContext ? <button type="button" onClick={onOpenAdvancedContext} className={actionClassName(dark)}>Manage full stack</button> : null}</div> : null}
      </section> : null}
      {contextReady && pickerSlot ? <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-app-border)] p-3"><span className="text-xs font-semibold">Attach {dockSlots.slots.find((slot) => slot.kind === pickerSlot)?.label ?? ''} capsule</span><CapsuleListPicker activeCapsuleId={dockSlots.slots.find((slot) => slot.kind === pickerSlot)?.item?.capsuleId ?? null} slotKind={pickerSlot} onCreate={() => setRefreshKey((key) => key + 1)} onSelect={(id, capsule) => void attachCapsuleToSlot(pickerSlot, id, capsule)} refreshKey={refreshKey} /><CapsuleImportButton variant={dark ? 'dark' : 'light'} onImported={(result) => { setRefreshKey((key) => key + 1); void attachCapsuleToSlot(pickerSlot, result.capsuleId); }} /></div> : null}
      {contextReady && builderOpen ? <InlineQuickContextBuilder className="mt-3" saveStack={saveStack} variant={dark ? 'dark' : 'light'} onCreated={() => { setRefreshKey((key) => key + 1); setBuilderOpen(false); }} /> : null}
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
  const palette = getCapsuleCategoryPalette(slot.kind);
  const filled = Boolean(slot.item);
  return (
    <div
      data-testid={`capsule-dock-slot-${slot.kind}`}
      className={cn(
        'group relative flex min-h-12 min-w-0 items-center gap-2 rounded-[var(--radius-md)] border px-2 py-1.5 transition',
        filled ? '' : dark ? 'border-dashed border-slate-700 bg-slate-950' : 'border-dashed border-slate-300 bg-white',
        active && 'ring-1',
      )}
      style={{
        backgroundColor: filled ? (dark ? `${palette.accent}22` : palette.bg) : undefined,
        borderColor: filled || active ? palette.border : undefined,
        ['--tw-ring-color' as string]: palette.accent,
      } as CSSProperties}
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
              filled ? '' : dark ? 'text-slate-500' : 'text-slate-400',
            )}
            style={filled ? { color: dark ? palette.border : palette.accent } : undefined}
          />
          {filled ? (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: dark ? palette.border : palette.accent }}
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
              <span
                className={cn('shrink-0 rounded-[var(--radius-sm)] px-1 font-mono text-[9px]', dark ? 'bg-slate-800' : '')}
                style={dark ? { color: palette.border } : { backgroundColor: palette.soft, color: palette.text }}
              >
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
          disabled={disabled || saving}
          title={`Remove ${slot.item?.label} from the ${slot.label} slot`}
          className={cn(
            'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md transition disabled:opacity-50',
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
    'inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition disabled:opacity-60',
    active
      ? dark
        ? 'border-emerald-400 bg-emerald-400/15 text-emerald-100'
        : 'border-emerald-500/45 bg-emerald-500/10 text-emerald-800'
      : dark
        ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  );
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
