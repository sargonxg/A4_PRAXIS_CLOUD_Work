'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Boxes,
  FileText,
  Gauge,
  LibraryBig,
  Loader2,
  LogIn,
  RotateCcw,
  Target,
  UserRound,
  Wand2,
  Wrench,
} from 'lucide-react';
import { CapsuleListPicker } from '@/components/cores/CapsuleListPicker';
import { InlineQuickContextBuilder } from '@/components/context/inline-quick-context-builder';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DEFAULT_CONTEXT_STACK_ID,
  attachCapsuleRef,
  buildCapsuleDockModel,
  defaultActiveContextStack,
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

  async function attachCapsule(capsuleId: string) {
    const next = attachCapsuleRef(stack, {
      capsuleId,
      role: capsuleCount ? 'reference' : 'primary',
      primary: capsuleCount === 0,
    });
    setSaving(true);
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
      setPickerOpen(false);
    } finally {
      setSaving(false);
    }
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
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <ContextChip dark={dark} icon={UserRound} label="User" value={userLabel} detail={audience} tone="ready" />
          <ContextChip dark={dark} icon={Target} label="Situation" value={selectedSituation?.name ?? stack.situationId ?? 'Direct ask'} detail={selectedSituation?.region ?? 'No situation core'} tone={selectedSituation || stack.situationId ? 'active' : 'quiet'} />
          <ContextChip dark={dark} icon={LibraryBig} label="Sources" value={`${sourceCount} attached`} detail={sourceCount ? 'Receipts can ground answer' : 'Attach sources before final use'} tone={sourceCount ? 'ready' : 'review'} />
          <ContextChip dark={dark} icon={Wrench} label="Tools" value={toolCount ? `${toolCount} active` : 'Sourceability'} detail={toolCount ? 'Context tools selected' : 'Default review posture'} tone={toolCount ? 'active' : 'quiet'} />
          <ContextChip dark={dark} icon={FileText} label="Output" value={stack.outputGoal ?? 'Set target'} detail={stack.outputGoal ? 'Answer target saved' : 'Memo, brief, or handoff'} tone={stack.outputGoal ? 'ready' : 'quiet'} />
          <ContextChip dark={dark} icon={Boxes} label="Saved context" value={`${capsuleCount} attached`} detail={activeCapsuleId ?? 'No context selected'} tone={capsuleCount ? 'ready' : 'review'} />
          <ContextChip dark={dark} icon={Gauge} label="Readiness" value={readiness.label} detail={readiness.detail} tone={readiness.tone} />
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
                  dark ? 'bg-white text-slate-950' : 'bg-slate-950 text-white',
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
                onClick={() => setPickerOpen((value) => !value)}
                className={actionClassName(dark, pickerOpen)}
                title="Attach context"
              >
                <Boxes className="h-3.5 w-3.5" />
                Attach context
              </button>
              <button
                type="button"
                onClick={() => setBuilderOpen((value) => !value)}
                className={actionClassName(dark, builderOpen)}
                title="Build context"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Build context
              </button>
              <Link href="/app/capsules" className={actionClassName(dark)} title="Open saved context">
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
                Clear context
              </button>
            </>
          )}
        </div>
      </div>

      <div
        data-testid="capsule-dock"
        aria-label="Capsule Dock"
        className={cn(
          'mt-2 flex flex-col gap-2 rounded-[var(--radius-md)] border px-2.5 py-2 md:flex-row md:items-center md:justify-between',
          dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50/80',
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="mr-1 min-w-0">
            <p className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', dark ? 'text-slate-500' : 'text-slate-500')}>{dockModel.title}</p>
            <p className={cn('text-xs font-semibold', dark ? 'text-slate-200' : 'text-slate-700')}>
              {dockModel.counts.total ? `${dockModel.counts.total} attached` : 'Direct Ask'} - {dockModel.persistenceLabel}
            </p>
            <p
              data-testid="capsule-dock-stack"
              title={dockModel.contextPackageLabel}
              className={cn('max-w-[18rem] truncate text-[11px]', dark ? 'text-slate-400' : 'text-slate-500')}
            >
              Stack: {dockModel.stackLabel} - {dockModel.stackPolicyLabel}
            </p>
          </div>
          {dockModel.items.length ? (
            dockModel.items.map((item) => <CapsuleDockChip key={`${item.role}-${item.capsuleId}`} dark={dark} item={item} />)
          ) : (
            <span
              data-testid="capsule-dock-chip"
              className={cn(
                'inline-flex min-h-8 items-center rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold',
                dark ? 'border-slate-700 bg-slate-950 text-slate-300' : 'border-slate-200 bg-white text-slate-700',
              )}
            >
              No saved context
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {dockModel.warnings.map((warning) => <CapsuleDockWarningChip key={warning.id} dark={dark} warning={warning} />)}
        </div>
      </div>

      {!isPublic && pickerOpen ? (
        <div className={cn('mt-2 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border p-2', dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50')}>
          <span className={cn('text-xs font-semibold', dark ? 'text-slate-300' : 'text-slate-600')}>Attach context</span>
          <CapsuleListPicker
            activeCapsuleId={activeCapsuleId}
            onCreate={() => setRefreshKey((key) => key + 1)}
            onSelect={(capsuleId) => void attachCapsule(capsuleId)}
            refreshKey={refreshKey}
          />
          {onOpenAdvancedContext ? (
            <button
              type="button"
              onClick={onOpenAdvancedContext}
              className={cn('text-xs font-semibold', dark ? 'text-[color:var(--color-gold-300)]' : 'text-[color:var(--color-gold-700)]')}
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

function CapsuleDockChip({ dark, item }: { dark: boolean; item: CapsuleDockItem }) {
  return (
    <span
      data-testid="capsule-dock-chip"
      title={`${item.roleLabel}: ${item.label}. ${item.versionLabel}.`}
      className={cn(
        'inline-flex min-h-8 max-w-[16rem] items-center gap-2 rounded-[var(--radius-md)] border px-2.5 text-xs',
        dark ? 'border-slate-700 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-700',
      )}
    >
      <span className={cn('shrink-0 font-bold uppercase tracking-[0.1em]', item.primary ? 'text-[color:var(--color-gold-700)]' : dark ? 'text-slate-400' : 'text-slate-500')}>
        {item.roleLabel}
      </span>
      <span className="min-w-0 truncate font-semibold">{item.label}</span>
      <span className={cn('shrink-0 rounded-[var(--radius-sm)] px-1.5 py-0.5 font-mono text-[10px]', dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')}>
        {item.versionLabel}
      </span>
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
        ? 'border-[color:var(--color-gold-400)] bg-[color:var(--color-gold-400)]/15 text-[color:var(--color-gold-100)]'
        : 'border-[color:var(--color-gold-500)]/45 bg-[color:var(--color-gold-500)]/10 text-[color:var(--color-gold-800)]'
      : dark
        ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  );
}

function toneClassName(tone: 'ready' | 'active' | 'review' | 'quiet', dark: boolean): string {
  if (tone === 'ready') return dark ? 'text-emerald-300' : 'text-emerald-700';
  if (tone === 'active') return dark ? 'text-[color:var(--color-gold-300)]' : 'text-[color:var(--color-gold-700)]';
  if (tone === 'review') return dark ? 'text-amber-300' : 'text-amber-700';
  return dark ? 'text-slate-500' : 'text-slate-400';
}

function labelize(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
