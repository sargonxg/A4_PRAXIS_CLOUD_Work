'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Boxes,
  ChevronDown,
  FileText,
  FolderKanban,
  Library,
  LogIn,
  MessageSquareText,
  MoreHorizontal,
  PlusCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { PublicShell } from '@/components/app/public-shell';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import {
  DEFAULT_CONTEXT_STACK_ID,
  attachCapsuleRef,
  detachCapsuleRef,
  swapCapsuleRef,
} from '@/lib/context/active-context-stack';

const CapsuleListPicker = dynamic(
  () => import('@/components/cores/CapsuleListPicker').then((module) => module.CapsuleListPicker),
  { ssr: false },
);

const PraxisChat = dynamic(
  () => import('@/components/app/praxis-chat').then((module) => module.PraxisChat),
  { loading: () => <PraxisChatLoadingSkeleton />, ssr: false },
);

const AskContextBar = dynamic(
  () => import('@/components/app/ask-context-bar').then((module) => module.AskContextBar),
  { loading: () => <ContextBarLoadingSkeleton />, ssr: false },
);

const UserCoreOnboardingCard = dynamic(
  () => import('@/components/app/user-core-onboarding-card').then((module) => module.UserCoreOnboardingCard),
  { loading: () => null, ssr: false },
);

const CapsuleImportButton = dynamic(
  () => import('@/components/capsules/CapsuleImportButton').then((module) => module.CapsuleImportButton),
  { ssr: false },
);

const PolicyAgentStrip = dynamic(
  () => import('@/components/app/policy-agent-strip').then((module) => module.PolicyAgentStrip),
  { ssr: false },
);

const PUBLIC_TOP_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Learn', href: '/learn' },
  { label: 'Guide', href: '/guide' },
  { label: 'Release notes', href: '/release-notes' },
] as const;

// One destination list for both modes keeps / and /app visually identical;
// public links route through signup with the destination preserved.
const HOME_DESTINATIONS = [
  { id: 'ask', label: 'Ask', href: '/app', publicHref: '/login?mode=signup&redirect=%2Fapp', icon: MessageSquareText },
  { id: 'context', label: 'Saved context', href: '/app/capsules', publicHref: '/login?mode=signup&redirect=%2Fapp%2Fcapsules', icon: FolderKanban },
  { id: 'boardroom', label: 'Boardroom', href: '/app/boardroom', publicHref: '/login?mode=signup&redirect=%2Fapp%2Fboardroom', icon: ShieldCheck },
  { id: 'drafts', label: 'Drafts', href: '/app?panel=memo', publicHref: '/login?mode=signup&redirect=%2Fapp%3Fpanel%3Dmemo', icon: FileText },
] as const;

export function PraxisChatFirstShell({ mode }: { mode: 'public' | 'authenticated' }) {
  const isPublic = mode === 'public';
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') ?? searchParams.get('capsulePrompt') ?? '';
  const { stack, saveStack, persisted, hydrated } = useActiveContextStack({ remote: !isPublic });
  const [contextOpen, setContextOpen] = useState(false);
  const [savingContext, setSavingContext] = useState(false);
  const selectedCapsuleRefs = stack.capsuleRefs;
  const activeCapsuleId = selectedCapsuleRefs[0]?.capsuleId ?? stack.capsuleId;
  const showUserCoreOnboarding = !isPublic && hydrated && !selectedCapsuleRefs.length && !activeCapsuleId;
  const contextLabel = useMemo(() => {
    if (!selectedCapsuleRefs.length && !activeCapsuleId) return '+ Saved context';
    return `${selectedCapsuleRefs.length || 1} saved context`;
  }, [activeCapsuleId, selectedCapsuleRefs.length]);

  async function activateCapsule(capsuleId: string) {
    const next = selectedCapsuleRefs.length
      ? swapCapsuleRef(stack, selectedCapsuleRefs[0].capsuleId, { capsuleId, role: 'primary', primary: true })
      : attachCapsuleRef(stack, { capsuleId, role: 'primary', primary: true });
    setSavingContext(true);
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } finally {
      setSavingContext(false);
    }
  }

  async function attachReferenceCapsule(capsuleId: string) {
    const next = attachCapsuleRef(stack, {
      capsuleId,
      role: selectedCapsuleRefs.length ? 'reference' : 'primary',
      primary: selectedCapsuleRefs.length === 0,
    });
    setSavingContext(true);
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } finally {
      setSavingContext(false);
    }
  }

  async function detachCapsule(capsuleId: string) {
    const next = detachCapsuleRef(stack, capsuleId);
    setSavingContext(true);
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } finally {
      setSavingContext(false);
    }
  }

  async function makePrimaryCapsule(capsuleId: string) {
    const currentPrimary = selectedCapsuleRefs[0]?.capsuleId;
    if (!currentPrimary || currentPrimary === capsuleId) return;
    const target = selectedCapsuleRefs.find((ref) => ref.capsuleId === capsuleId);
    const next = swapCapsuleRef(stack, currentPrimary, {
      capsuleId,
      label: target?.label,
      version: target?.version,
      role: 'primary',
      primary: true,
    });
    setSavingContext(true);
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } finally {
      setSavingContext(false);
    }
  }

  const body = (
    <main
      className={isPublic ? 'min-h-[calc(100vh-5rem)] text-slate-950' : 'praxis-app-surface min-h-screen text-slate-950'}
      data-testid="praxis-chat-first-shell"
    >
      <div data-testid={isPublic ? 'marketing-home' : 'app-launchpad'} className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {!isPublic ? <HomeTopBar isPublic={false} /> : null}
        <div className={`${isPublic ? 'mt-2' : 'mt-5'} grid min-h-[calc(100vh-11rem)] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]`}>
          <HomeSidebar isPublic={isPublic} pathname={pathname ?? '/'} />
          <section className="min-w-0">
            <PraxisChat
              mode={mode}
              activeContextStack={stack}
              contextBar={(
                <>
                  {isPublic ? (
                    <PublicAskContextBar onOpenAdvancedContext={() => setContextOpen(true)} />
                  ) : (
                    <AskContextBar
                      mode={mode}
                      stack={stack}
                      saveStack={saveStack}
                      hydrated={hydrated}
                      persisted={persisted}
                      variant="home"
                      onOpenAdvancedContext={() => setContextOpen(true)}
                    />
                  )}
                  <UserCoreOnboardingCard
                    saveStack={saveStack}
                    stack={stack}
                    visible={showUserCoreOnboarding}
                  />
                </>
              )}
              contextLabel={contextLabel}
              contextOpen={contextOpen}
              currentPath={isPublic ? '/' : '/app'}
              initialPrompt={initialPrompt}
              onToggleContext={() => setContextOpen((value) => !value)}
              storageKey={isPublic ? 'praxis-public-home-draft' : 'praxis-authenticated-home-chat'}
            />
            {contextOpen ? (
              <ContextDrawer
                activeCapsuleId={activeCapsuleId}
                hydrated={hydrated}
                isPublic={isPublic}
                persisted={persisted}
                savingContext={savingContext}
                selectedCapsuleRefs={selectedCapsuleRefs}
                onActivateCapsule={(capsuleId) => void activateCapsule(capsuleId)}
                onAttachReferenceCapsule={(capsuleId) => void attachReferenceCapsule(capsuleId)}
                onDetachCapsule={(capsuleId) => void detachCapsule(capsuleId)}
                onMakePrimaryCapsule={(capsuleId) => void makePrimaryCapsule(capsuleId)}
              />
            ) : null}
            <PolicyAgentStrip isPublic={isPublic} />
          </section>
        </div>
      </div>
    </main>
  );

  if (isPublic) {
    return <PublicShell contentClassName="p-0" showFooter={false}>{body}</PublicShell>;
  }

  return body;
}

function HomeTopBar({ isPublic }: { isPublic: boolean }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href={isPublic ? '/' : '/app'} className="min-w-0">
        <PraxisBrandChip compact />
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-slate-500" aria-label="Home links">
        {PUBLIC_TOP_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-[var(--radius-full)] px-3 py-1.5 hover:bg-white hover:text-slate-950">
            {link.label}
          </Link>
        ))}
        {isPublic ? (
          <Link
            href="/login"
            data-testid="public-sign-in-affordance"
            className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-[var(--shadow-card)] hover:bg-slate-50"
          >
            Sign in
          </Link>
        ) : null}
      </nav>
    </header>
  );
}

interface RecentConversationSummary {
  conversationId: string;
  capsuleId?: string;
  title?: string;
  updatedAt?: string;
  turnCount?: number;
}

function HomeSidebar({ isPublic, pathname }: { isPublic: boolean; pathname: string }) {
  const destinations = HOME_DESTINATIONS;
  const [recents, setRecents] = useState<RecentConversationSummary[]>([]);

  useEffect(() => {
    if (isPublic) return;
    let cancelled = false;
    fetch('/api/conversations', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((body: { conversations?: RecentConversationSummary[] }) => {
        if (cancelled) return;
        setRecents((body.conversations ?? []).filter((item) => item.conversationId).slice(0, 8));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isPublic]);

  return (
    <aside className="praxis-shell-panel h-fit p-3" aria-label="Primary PRAXIS destinations">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{isPublic ? 'Start here' : 'Workspace'}</p>
      <nav className="mt-3 grid gap-1">
        {destinations.map((item) => {
          const Icon = item.icon;
          const href = isPublic ? item.publicHref : item.href;
          const active = !isPublic && (pathname === item.href || (item.id === 'ask' && pathname === '/app'));
          return (
            <Link
              key={item.id}
              href={href}
              className={[
                'flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition',
                active ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-white hover:text-emerald-900',
              ].join(' ')}
            >
              <Icon className={['h-4 w-4', active ? 'text-emerald-300' : 'text-emerald-700'].join(' ')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {!isPublic && recents.length ? (
        <nav className="mt-5" aria-label="Recent conversations" data-testid="home-recent-conversations">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Recent</p>
          <div className="mt-2 grid gap-0.5">
            {recents.map((item) => (
              <Link
                key={item.conversationId}
                href={`/app/conversations/${encodeURIComponent(item.conversationId)}${item.capsuleId ? `?capsuleId=${encodeURIComponent(item.capsuleId)}` : ''}`}
                className="group rounded-[var(--radius-md)] px-3 py-1.5 transition hover:bg-white"
                title={item.title ?? item.conversationId}
              >
                <span className="block truncate text-[13px] font-medium text-slate-700 group-hover:text-slate-950">
                  {item.title ?? 'PRAXIS conversation'}
                </span>
                <span className="block font-mono text-[10px] text-slate-400">
                  {formatRecentTimestamp(item.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
      <div className="mt-5 rounded-[var(--radius-md)] border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3 text-xs leading-5 text-slate-600">
        Start with the question. Save context when the work needs sources, decisions, or a draft you can reuse.
      </div>
      <a
        href="https://tacitus.me"
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-emerald-700"
        aria-label="TACITUS verified context infrastructure"
      >
        TACITUS <span aria-hidden className="text-emerald-600">◳</span> verified context
      </a>
    </aside>
  );
}

function ContextDrawer({
  activeCapsuleId,
  hydrated,
  isPublic,
  persisted,
  savingContext,
  selectedCapsuleRefs,
  onActivateCapsule,
  onAttachReferenceCapsule,
  onDetachCapsule,
  onMakePrimaryCapsule,
}: {
  activeCapsuleId?: string | null;
  hydrated: boolean;
  isPublic: boolean;
  persisted: boolean;
  savingContext: boolean;
  selectedCapsuleRefs: Array<{
    capsuleId: string;
    label: string | null;
    role: string;
    primary: boolean;
    version: number | null;
  }>;
  onActivateCapsule: (capsuleId: string) => void;
  onAttachReferenceCapsule: (capsuleId: string) => void;
  onDetachCapsule: (capsuleId: string) => void;
  onMakePrimaryCapsule: (capsuleId: string) => void;
}) {
  if (isPublic) {
    return (
      <section className="praxis-shell-card mt-4 p-4" data-testid="advanced-edit-context">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Context</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Saved context unlocks after sign-in.</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Attach capsules, import DIALECTICA verified-context packages, and reuse the stack across briefs.
            </p>
          </div>
          <Link href="/login?mode=signup&redirect=%2Fapp%2Fcapsules" className="praxis-button-primary min-h-10 px-4 text-sm">
            Save context
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="praxis-shell-card mt-4 p-4" data-testid="advanced-edit-context">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          data-testid="launchpad-capsule-chip"
          onClick={() => activeCapsuleId && onActivateCapsule(activeCapsuleId)}
          className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          <Library className="h-3.5 w-3.5 text-emerald-700" />
          {selectedCapsuleRefs.length ? `${selectedCapsuleRefs.length} context item${selectedCapsuleRefs.length === 1 ? '' : 's'} attached` : 'No saved context'}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <CapsuleListPicker activeCapsuleId={activeCapsuleId ?? null} onSelect={onActivateCapsule} />
          <CapsuleImportButton onImported={(result) => onAttachReferenceCapsule(result.capsuleId)} />
          <Link href="/app/capsules/builder" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <PlusCircle className="h-3.5 w-3.5" />
            Build context
          </Link>
        </div>
      </div>

      <div data-testid="launchpad-capsule-stack" className="mt-3 rounded-[var(--radius-md)] border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Saved context</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {hydrated ? (persisted ? 'Saved to your workspace.' : 'Local context is active.') : 'Loading context...'}
              {savingContext ? ' Saving...' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Attach context</span>
            <CapsuleListPicker activeCapsuleId={null} onSelect={onAttachReferenceCapsule} />
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {selectedCapsuleRefs.length ? selectedCapsuleRefs.map((ref) => (
            <div
              key={ref.capsuleId}
              className={[
                'flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border bg-[color:var(--color-archive-paper-strong)] px-3 py-2 border-l-4',
                ref.primary ? 'border-slate-100 border-l-emerald-500' : 'border-slate-100 border-l-slate-200',
              ].join(' ')}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900">{ref.label ?? shortenContextId(ref.capsuleId)}</p>
                <p className={['mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]', ref.primary ? 'text-emerald-700' : 'text-slate-500'].join(' ')}>{ref.role}{ref.primary ? ' / primary' : ''}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {!ref.primary ? (
                  <button
                    type="button"
                    onClick={() => onMakePrimaryCapsule(ref.capsuleId)}
                    className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Make primary
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDetachCapsule(ref.capsuleId)}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-3 w-3" />
                  Detach
                </button>
              </div>
            </div>
          )) : (
            <p className="rounded-[var(--radius-md)] border border-dashed border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-2 text-xs leading-5 text-slate-500">
              No saved context yet. Ask PRAXIS can still answer directly, but serious work should attach sources or context.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function shortenContextId(value: string): string {
  return value.length > 28 ? `${value.slice(0, 16)}...${value.slice(-8)}` : value;
}

function formatRecentTimestamp(value: string | undefined): string {
  if (!value) return 'saved';
  const time = Date.parse(value);
  if (Number.isNaN(time)) return 'saved';
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(time).toLocaleDateString();
}

function PublicAskContextBar({ onOpenAdvancedContext }: { onOpenAdvancedContext: () => void }) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div
      data-testid="ask-context-bar"
      className="rounded-[var(--radius-lg)] border border-[var(--color-app-border)] bg-white/90 p-2 text-slate-950 shadow-[var(--shadow-card)]"
    >
      <div data-testid="capsule-dock" aria-label="Capsule Dock" className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            title="Capsule Dock - direct ask"
            data-testid="capsule-dock-stack"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Capsule Dock
            <span className="sr-only">Capsule Dock. Direct ask mode. Sign in to fill the four capsule slots.</span>
          </span>

          <div className="hidden sm:flex shrink-0 flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled
              title="Sign in to attach saved context"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 opacity-60"
            >
              <Boxes className="h-3.5 w-3.5" />
              Attach context
            </button>
            <Link
              href="/login?mode=signup&redirect=%2Fapp"
              data-testid="public-context-sign-in-affordance"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-emerald-700 px-2.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in to save context
            </Link>
            <button
              type="button"
              onClick={onOpenAdvancedContext}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              title="Show context details"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              <span className="sr-only">Context details</span>
            </button>
          </div>

          <div className="relative shrink-0 sm:hidden" data-testid="capsule-dock-mobile-actions">
            <button
              type="button"
              aria-label="Capsule Dock actions"
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
              onClick={() => setActionsOpen((value) => !value)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {actionsOpen ? (
              <div
                role="menu"
                data-testid="capsule-dock-action-menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-[min(18rem,calc(100vw-2rem))] gap-1 rounded-[var(--radius-md)] border border-slate-200 bg-white p-2 shadow-[var(--shadow-float)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled
                  title="Sign in to attach saved context"
                  className="inline-flex min-h-8 w-full items-center justify-start gap-1.5 rounded-[var(--radius-md)] border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 opacity-60"
                >
                  <Boxes className="h-3.5 w-3.5" />
                  Attach context
                </button>
                <Link
                  href="/login?mode=signup&redirect=%2Fapp"
                  role="menuitem"
                  data-testid="public-context-sign-in-affordance"
                  className="inline-flex min-h-8 w-full items-center justify-start gap-1.5 rounded-[var(--radius-md)] bg-emerald-700 px-2.5 text-xs font-semibold text-white hover:bg-emerald-600"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in to save context
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4" data-testid="capsule-dock-slots">
          {([
            ['User', 'Who is asking — perspective, mandate, and voice'],
            ['Situation', 'The case — actors, claims, sources, and graph context'],
            ['Tool', 'How to think — methods, frameworks, and agent permissions'],
            ['Output', 'What to produce — memo, brief, or handover contract'],
          ] as const).map(([label, hint]) => (
            <span
              key={label}
              data-testid="capsule-dock-chip"
              title={`Sign in to attach a ${label} capsule. ${hint}.`}
              className="flex min-h-12 min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-slate-300 bg-white px-2 py-1.5 opacity-70"
            >
              <span className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
                <span className="block text-xs font-semibold text-slate-400">Sign in to add</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContextBarLoadingSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-app-border)] bg-white/90 p-2 shadow-[var(--shadow-card)]" data-testid="ask-context-bar-loading-skeleton">
      <div className="min-h-10 rounded-[var(--radius-md)] bg-emerald-50/60" />
    </div>
  );
}

function PraxisChatLoadingSkeleton() {
  return (
    <section className="praxis-shell-card min-h-[28rem] p-4" data-testid="praxis-chat-loading-skeleton">
      <div className="grid h-full min-h-[24rem] grid-rows-[1fr_auto] gap-4">
        <div className="rounded-[var(--radius-lg)] border border-emerald-100 bg-emerald-50/45" />
        <div className="min-h-28 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      </div>
    </section>
  );
}
