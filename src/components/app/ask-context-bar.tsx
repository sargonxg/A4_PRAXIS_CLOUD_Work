'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Boxes,
  ChevronDown,
  FileText,
  Gauge,
  LibraryBig,
  Loader2,
  LogIn,
  RotateCcw,
  Star,
  Target,
  UserRound,
  Wand2,
  Wrench,
  X,
} from 'lucide-react';
import { CapsuleListPicker } from '@/components/cores/CapsuleListPicker';
import { CapsuleImportButton } from '@/components/capsules/CapsuleImportButton';
import { InlineQuickContextBuilder } from '@/components/context/inline-quick-context-builder';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DEFAULT_CONTEXT_STACK_ID,
  attachCapsuleRef,
  buildCapsuleDockModel,
  defaultActiveContextStack,
  detachCapsuleRef,
  swapCapsuleRef,
  type CapsuleDockItem,
  type CapsuleDockWarning,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';
import { cn } from '@/lib/utils/cn';

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  const toolCount = stack.contextBlocks.thinkingDevices.length;
  const readiness = useMemo(() => buildReadiness({
    capsuleCount,
    hydrated,
    outputGoal: stack.outputGoal,
    persisted,
    selectedSituation,
    sourceCount,
  }), [capsuleCount, hydrated, persisted, selectedSituation, sourceCount, stack.outputGoal]);
  const userLabel = labelize(analystProfile?.identity.role ?? user?.role ?? (isPublic ? 'Guest' : 'Analyst'));
  const audience = analystProfile?.perspective.audience ? labelize(analystProfile.perspective.audience) : user?.orgName ?? 'Workspace';
  const activeCapsuleId = stack.capsuleRefs[0]?.capsuleId ?? stack.capsuleId ?? null;
  const dockModel = useMemo(
    () => buildCapsuleDockModel(stack, { hydrated, persisted }),
    [hydrated, persisted, stack],
  );

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

  async function attachCapsule(capsuleId: string) {
    const next = attachCapsuleRef(stack, {
      capsuleId,
      role: capsuleCount ? 'reference' : 'primary',
      primary: capsuleCount === 0,
    });
    await persistStack(next);
    setPickerOpen(false);
  }

  async function detachCapsule(capsuleId: string) {
    await persistStack(detachCapsuleRef(stack, capsuleId));
  }

  async function makePrimaryCapsule(capsuleId: string) {
    const currentPrimary = stack.capsuleRefs.find((ref) => ref.primary)?.capsuleId ?? stack.capsuleRefs[0]?.capsuleId;
    if (!currentPrimary || currentPrimary === capsuleId) return;
    const target = stack.capsuleRefs.find((ref) => ref.capsuleId === capsuleId);
    await persistStack(swapCapsuleRef(stack, currentPrimary, {
      capsuleId,
      label: target?.label,
      version: target?.version,
      role: 'primary',
      primary: true,
    }));
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
      {/* Capsule Dock — the primary, always-visible context surface */}
      <div
        data-testid="capsule-dock"
        aria-label="Capsule Dock"
        className="flex flex-col gap-1.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              title={`${dockModel.contextPackageLabel} — Stack: ${dockModel.stackLabel} - ${dockModel.stackPolicyLabel}`}
              data-testid="capsule-dock-stack"
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em]',
                dark ? 'text-slate-400' : 'text-slate-500',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', readinessDotClassName(readiness.tone))} aria-hidden />
              {dockModel.title}
              <span className="sr-only">Capsule Dock. Stack: {dockModel.stackLabel} - {dockModel.stackPolicyLabel}. {dockModel.persistenceLabel}</span>
            </span>
            {dockModel.items.length ? (
              dockModel.items.map((item) => (
                <CapsuleDockChip
                  key={`${item.role}-${item.capsuleId}`}
                  dark={dark}
                  item={item}
                  saving={saving}
                  onDetach={isPublic ? undefined : () => void detachCapsule(item.capsuleId)}
                  onMakePrimary={isPublic || item.primary ? undefined : () => void makePrimaryCapsule(item.capsuleId)}
                />
              ))
            ) : (
              <span
                data-testid="capsule-dock-chip"
                className={cn(
                  'inline-flex min-h-7 items-center rounded-[var(--radius-full)] border border-dashed px-2.5 text-xs font-semibold',
                  dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500',
                )}
              >
                No saved context — direct ask
              </span>
            )}
            {dockModel.warnings.map((warning) => <CapsuleDockWarningChip key={warning.id} dark={dark} warning={warning} />)}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {isPublic ? (
              <>
                <button
                  type="button"
                  disabled
                  title="Sign in to attach saved context"
                  className={cn(
                    'inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold opacity-60',
                    dark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600',
                  )}
                >
                  <Boxes className="h-3.5 w-3.5" />
                  Attach context
                </button>
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
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setPickerOpen((value) => !value); setBuilderOpen(false); }}
                  className={actionClassName(dark, pickerOpen)}
                  title="Attach context from your capsule library"
                >
                  <Boxes className="h-3.5 w-3.5" />
                  Attach context
                </button>
                <button
                  type="button"
                  onClick={() => { setBuilderOpen((value) => !value); setPickerOpen(false); }}
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
                  onClick={() => setDetailsOpen((value) => !value)}
                  aria-expanded={detailsOpen}
                  className={actionClassName(dark, detailsOpen)}
                  title="Show context details: user, situation, sources, tools, output, readiness"
                >
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', detailsOpen && 'rotate-180')} />
                  <span className="sr-only">Context details</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible provenance detail row: User / Situation / Sources / Tools / Output / Saved context / Readiness */}
      {detailsOpen || isPublic ? (
        <div className={cn('mt-2 flex min-w-0 gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0', isPublic && 'mt-2')}>
          <ContextChip dark={dark} icon={UserRound} label="User" value={userLabel} detail={audience} tone="ready" />
          <ContextChip dark={dark} icon={Target} label="Situation" value={selectedSituation?.name ?? stack.situationId ?? 'Direct ask'} detail={selectedSituation?.region ?? 'No situation core'} tone={selectedSituation || stack.situationId ? 'active' : 'quiet'} />
          <ContextChip dark={dark} icon={LibraryBig} label="Sources" value={`${sourceCount} attached`} detail={sourceCount ? 'Receipts can ground answer' : 'Attach sources before final use'} tone={sourceCount ? 'ready' : 'review'} />
          <ContextChip dark={dark} icon={Wrench} label="Tools" value={toolCount ? `${toolCount} active` : 'Sourceability'} detail={toolCount ? 'Context tools selected' : 'Default review posture'} tone={toolCount ? 'active' : 'quiet'} />
          <ContextChip dark={dark} icon={FileText} label="Output" value={stack.outputGoal ?? 'Set target'} detail={stack.outputGoal ? 'Answer target saved' : 'Memo, brief, or handoff'} tone={stack.outputGoal ? 'ready' : 'quiet'} />
          <ContextChip dark={dark} icon={Boxes} label="Saved context" value={`${capsuleCount} attached`} detail={activeCapsuleId ?? 'No context selected'} tone={capsuleCount ? 'ready' : 'review'} />
          <ContextChip dark={dark} icon={Gauge} label="Readiness" value={readiness.label} detail={readiness.detail} tone={readiness.tone} />
        </div>
      ) : null}

      {!isPublic && pickerOpen ? (
        <div className={cn('mt-2 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border p-2', dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50')}>
          <span className={cn('text-xs font-semibold', dark ? 'text-slate-300' : 'text-slate-600')}>Attach context</span>
          <CapsuleListPicker
            activeCapsuleId={activeCapsuleId}
            onCreate={() => setRefreshKey((key) => key + 1)}
            onSelect={(capsuleId) => void attachCapsule(capsuleId)}
            refreshKey={refreshKey}
          />
          <CapsuleImportButton
            variant={dark ? 'dark' : 'light'}
            onImported={(result) => {
              setRefreshKey((key) => key + 1);
              void attachCapsule(result.capsuleId);
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

function CapsuleDockChip({
  dark,
  item,
  onDetach,
  onMakePrimary,
  saving,
}: {
  dark: boolean;
  item: CapsuleDockItem;
  onDetach?: () => void;
  onMakePrimary?: () => void;
  saving?: boolean;
}) {
  return (
    <span
      data-testid="capsule-dock-chip"
      title={`${item.roleLabel}: ${item.label}. ${item.versionLabel}.`}
      className={cn(
        'inline-flex min-h-7 max-w-[18rem] items-center gap-1.5 rounded-[var(--radius-full)] border py-0.5 pl-2.5 text-xs transition',
        onDetach ? 'pr-1' : 'pr-2.5',
        item.primary
          ? dark
            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
            : 'border-emerald-500/40 bg-emerald-50 text-emerald-900'
          : dark
            ? 'border-slate-700 bg-slate-950 text-slate-200'
            : 'border-slate-200 bg-white text-slate-700',
      )}
    >
      {item.primary ? <Star className={cn('h-3 w-3 shrink-0', dark ? 'text-emerald-300' : 'text-emerald-600')} aria-label="Primary capsule" /> : null}
      <span className="min-w-0 truncate font-semibold">{item.label}</span>
      <span className={cn('shrink-0 rounded-[var(--radius-sm)] px-1 py-0.5 font-mono text-[10px]', dark ? 'bg-slate-800 text-slate-300' : item.primary ? 'bg-emerald-100/70 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
        {item.versionLabel}
      </span>
      {onMakePrimary ? (
        <button
          type="button"
          onClick={onMakePrimary}
          disabled={saving}
          title={`Make ${item.label} the primary capsule`}
          className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50', dark ? 'hover:bg-slate-800 hover:text-emerald-300' : 'hover:bg-emerald-100 hover:text-emerald-700')}
        >
          <Star className="h-3 w-3" />
          <span className="sr-only">Make primary</span>
        </button>
      ) : null}
      {onDetach ? (
        <button
          type="button"
          onClick={onDetach}
          disabled={saving}
          title={`Detach ${item.label}`}
          className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50', dark ? 'hover:bg-slate-800 hover:text-red-300' : 'hover:bg-red-50 hover:text-red-700')}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Detach</span>
        </button>
      ) : null}
    </span>
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
      className={cn('inline-flex min-h-7 items-center rounded-[var(--radius-md)] border px-2 text-[11px] font-semibold', tone)}
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
