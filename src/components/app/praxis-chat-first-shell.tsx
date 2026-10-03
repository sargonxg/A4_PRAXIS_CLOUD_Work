'use client';

import Link from 'next/link';
import { PublicShell } from '@/components/app/public-shell';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Boxes,
  FileText,
  FolderKanban,
  Library,
  MessageSquareText,
  PlusCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { useAuth } from '@/lib/auth/auth-context';
import { attachSavedCapsuleForAsk } from '@/lib/capsules/ask-handoff';
import {
  DEFAULT_CONTEXT_STACK_ID,
  attachCapsuleRef,
  detachCapsuleRef,
  promoteCapsuleRef,
  swapCapsuleRef,
} from '@/lib/context/active-context-stack';
import { HOME_SIDEBAR_DESTINATIONS, primaryNavForPath, type PrimaryNavIcon } from '@/lib/navigation/primary-nav';
import { WorkedPolicyExample } from '@/components/marketing/worked-policy-example';

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

const HOME_DESTINATION_ICONS: Partial<Record<PrimaryNavIcon, ComponentType<{ className?: string }>>> = {
  MessageSquareText,
  FolderKanban,
  ShieldCheck,
  FileText,
};

export function PraxisChatFirstShell({ mode }: { mode: 'public' | 'authenticated' }) {
  const isPublic = mode === 'public';
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const requestedCapsuleId = searchParams.get('capsuleId')?.trim() ?? '';
  const ownerId = user?.id;
  const handoffKey = !isPublic && requestedCapsuleId ? JSON.stringify([ownerId ?? null, requestedCapsuleId]) : null;
  const questionHandoffId = searchParams.get('handoff') ?? undefined;
  const requestedThread = searchParams.get('thread') ?? '';
  const threadId = /^[a-zA-Z0-9_-]{3,96}$/.test(requestedThread) ? requestedThread : undefined;
  const { stack, saveStack, persisted, hydrated } = useActiveContextStack({ remote: !isPublic });
  const attachmentRef = useRef({ stack, saveStack });
  const [handoff, setHandoff] = useState<{ key: string | null; status: 'loading' | 'failed' }>({ key: null, status: 'loading' });
  const [handoffRetry, setHandoffRetry] = useState(0);
  const handoffReady = !handoffKey;
  const handoffFailed = handoffKey === handoff.key && handoff.status === 'failed';
  const [contextOpen, setContextOpen] = useState(false);
  const [savingContext, setSavingContext] = useState(false);
  const [contextError, setContextError] = useState('');
  const contextReady = !isPublic && !authLoading && Boolean(ownerId) && hydrated && handoffReady;
  const mutationDisabled = !contextReady || savingContext;

  useEffect(() => { attachmentRef.current = { stack, saveStack }; }, [stack, saveStack]);

  const consumeCapsuleQuery = useCallback(() => {
    const params = new URLSearchParams(query);
    params.delete('capsuleId');
    const remaining = params.toString();
    router.replace(`${pathname ?? '/app'}${remaining ? `?${remaining}` : ''}`, { scroll: false });
  }, [pathname, query, router]);

  useEffect(() => {
    if (isPublic || !ownerId || !requestedCapsuleId || !handoffKey || !hydrated) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]);
    queueMicrotask(() => {
      if (!controller.signal.aborted) setHandoff({ key: handoffKey, status: 'loading' });
    });
    void attachSavedCapsuleForAsk({ capsuleId: requestedCapsuleId, ownerId, signal }, {
      getStack: () => attachmentRef.current.stack,
      saveStack: (patch) => attachmentRef.current.saveStack(patch, { signal }),
    }).then(() => {
      if (controller.signal.aborted) return;
      consumeCapsuleQuery();
    }).catch(() => {
      if (!controller.signal.aborted) setHandoff({ key: handoffKey, status: 'failed' });
    });
    return () => controller.abort();
  }, [consumeCapsuleQuery, handoffKey, handoffRetry, hydrated, isPublic, ownerId, requestedCapsuleId]);
  const selectedCapsuleRefs = stack.capsuleRefs;
  const activeCapsuleId = selectedCapsuleRefs[0]?.capsuleId ?? stack.capsuleId;
  const showUserCoreOnboarding = !isPublic && hydrated && !selectedCapsuleRefs.length && !activeCapsuleId;
  const contextLabel = useMemo(() => {
    if (!selectedCapsuleRefs.length && !activeCapsuleId) return '+ Capsule';
    return `${selectedCapsuleRefs.length || 1} capsule${(selectedCapsuleRefs.length || 1) === 1 ? '' : 's'}`;
  }, [activeCapsuleId, selectedCapsuleRefs.length]);

  async function activateCapsule(capsuleId: string, capsule?: PraxisCapsule) {
    if (mutationDisabled) return;
    const next = selectedCapsuleRefs.length
      ? swapCapsuleRef(stack, selectedCapsuleRefs[0].capsuleId, { capsuleId, label: capsule?.label, version: capsule?.version, role: 'primary', primary: true })
      : attachCapsuleRef(stack, { capsuleId, label: capsule?.label, version: capsule?.version, role: 'primary', primary: true });
    setSavingContext(true);
    setContextError('');
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } catch {
      setContextError('Your capsule could not be activated. Please retry.');
    } finally {
      setSavingContext(false);
    }
  }

  async function attachReferenceCapsule(capsuleId: string, capsule?: PraxisCapsule) {
    if (mutationDisabled) return;
    const next = attachCapsuleRef(stack, {
      capsuleId,
      label: capsule?.label,
      version: capsule?.version,
      role: selectedCapsuleRefs.length ? 'reference' : 'primary',
      primary: selectedCapsuleRefs.length === 0,
    });
    setSavingContext(true);
    setContextError('');
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } catch {
      setContextError('Your capsule could not be attached. Please retry.');
    } finally {
      setSavingContext(false);
    }
  }

  async function detachCapsule(capsuleId: string) {
    if (mutationDisabled) return;
    const next = detachCapsuleRef(stack, capsuleId);
    setSavingContext(true);
    setContextError('');
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } catch {
      setContextError('Your capsule could not be detached. Please retry.');
    } finally {
      setSavingContext(false);
    }
  }

  async function makePrimaryCapsule(capsuleId: string) {
    if (mutationDisabled) return;
    const currentPrimary = selectedCapsuleRefs[0]?.capsuleId;
    if (!currentPrimary || currentPrimary === capsuleId) return;
    const next = promoteCapsuleRef(stack, capsuleId);
    setSavingContext(true);
    setContextError('');
    try {
      await saveStack({
        stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
        capsuleId: next.capsuleId,
        capsuleRefs: next.capsuleRefs,
      });
    } catch {
      setContextError('Your primary capsule could not be changed. Please retry.');
    } finally {
      setSavingContext(false);
    }
  }

  const body = (
    <div
      className={`praxis-focus-surface text-[var(--color-deep-ink)] ${isPublic ? 'praxis-app-surface min-h-screen' : ''}`}
      data-testid="praxis-chat-first-shell"
    >
      <div data-testid={isPublic ? 'marketing-home' : 'app-launchpad'} className={`mx-auto flex w-full flex-col ${isPublic ? 'max-w-7xl px-4 py-5 sm:px-6 lg:px-8' : 'max-w-4xl'}`}>
        <div className={isPublic ? 'mt-5 grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10' : 'grid'}>
          {isPublic ? <HomeSidebar isPublic pathname={`${pathname ?? '/'}${query ? `?${query}` : ''}`} /> : null}
          <section className="min-w-0">
            {contextError ? <p role="alert" className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{contextError}</p> : null}
            {handoffKey && !handoffReady ? (
              <div role={handoffFailed ? 'alert' : 'status'} className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {handoffFailed ? (
                  <>Your saved capsule could not be attached. Your previous context is still active. <button type="button" className="font-semibold underline" onClick={() => setHandoffRetry((value) => value + 1)}>Retry</button> or <button type="button" className="font-semibold underline" onClick={consumeCapsuleQuery}>use current context</button>.</>
                ) : 'Attaching your saved capsule…'}
              </div>
            ) : null}
            {isPublic ? (
              <div className="mx-auto mb-6 max-w-3xl text-center sm:pb-2">
                <h1 className="text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-[color:var(--color-app-text)] sm:text-5xl">
                  Policy analysis you can inspect.
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[color:var(--color-app-text-secondary)]">
                  Ask a policy question. Add sources when useful. Review the answer before sharing.
                </p>
              </div>
            ) : null}
            <PraxisChat
              contextReady={isPublic || !mutationDisabled}
              mode={mode}
              showHomeHeading={!isPublic}
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
                      hydrated={hydrated && (isPublic || handoffReady)}
                      persisted={persisted}
                      variant="home"
                      onOpenAdvancedContext={() => setContextOpen(true)}
                      onMutationPending={setSavingContext}
                    />
                  )}
                  {showUserCoreOnboarding ? <details className="mt-3 text-xs text-[var(--color-app-text-secondary)]"><summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold">Add your perspective</summary><UserCoreOnboardingCard saveStack={saveStack} stack={stack} visible /></details> : null}
                </>
              )}
              contextLabel={contextLabel}
              contextOpen={contextOpen}
              currentPath={isPublic ? '/' : '/app'}
              questionHandoffId={questionHandoffId}
              threadId={threadId}
              onToggleContext={() => setContextOpen((value) => !value)}
              storageKey={isPublic ? 'praxis-public-home-draft' : 'praxis-authenticated-home-chat'}
            />
            {contextOpen ? (
              <ContextDrawer
                key={ownerId ?? 'guest'}
                activeCapsuleId={activeCapsuleId}
                mutationDisabled={mutationDisabled}
                hydrated={hydrated}
                isPublic={isPublic}
                persisted={persisted}
                savingContext={savingContext}
                selectedCapsuleRefs={selectedCapsuleRefs}
                onActivateCapsule={(capsuleId, capsule) => void activateCapsule(capsuleId, capsule)}
                onAttachReferenceCapsule={(capsuleId, capsule) => void attachReferenceCapsule(capsuleId, capsule)}
                onDetachCapsule={(capsuleId) => void detachCapsule(capsuleId)}
                onMakePrimaryCapsule={(capsuleId) => void makePrimaryCapsule(capsuleId)}
              />
            ) : null}
          </section>
        </div>
        {isPublic ? <><PublicIntroduction /><WorkedPolicyExample compact /></> : null}
      </div>
    </div>
  );

  return isPublic ? <PublicShell>{body}</PublicShell> : body;
}

function PublicIntroduction() {
  return (
    <section aria-labelledby="public-workflow-title" className="mt-12 border-t border-slate-200 py-10">
      <h2 id="public-workflow-title" className="max-w-3xl font-serif text-3xl text-[var(--color-deep-ink)] sm:text-4xl">Keep useful context for the next question.</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-graphite)]">For policy briefs, assessments and narrative analysis. Sign in to ask and save your conversation. A Context Capsule keeps sources, assumptions and methods together for your next question.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/guide" className="inline-flex min-h-11 items-center rounded-md bg-[var(--color-praxis-emerald-700)] px-5 text-sm font-semibold text-white">Follow the quick start</Link>
        <Link href="/learn" className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800">Read about Context Capsules</Link>
        <Link href="/pricing" className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-[var(--color-praxis-emerald-700)]">Plans and availability</Link>
      </div>
      <p className="mt-5 text-sm leading-6 text-[var(--color-graphite)]">Free experimental access. Check claims against original sources; saving context does not verify them.</p>
    </section>
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
  const destinations = isPublic
    ? HOME_SIDEBAR_DESTINATIONS.filter((item) => item.id === 'ask' || item.id === 'context')
    : HOME_SIDEBAR_DESTINATIONS;
  const [recents, setRecents] = useState<RecentConversationSummary[]>([]);
  const [recentsOpen, setRecentsOpen] = useState(false);

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
    <aside className={`${isPublic ? 'hidden lg:block ' : ''}h-fit rounded-2xl border border-slate-200/70 bg-white/60 p-3 lg:sticky lg:top-6`} aria-label="Primary PRAXIS destinations">
      <p className="px-2 text-xs font-semibold text-slate-600">{isPublic ? 'Start here' : 'Workspace'}</p>
      <nav className="mt-3 flex flex-wrap gap-1 lg:grid">
        {destinations.map((item) => {
          const Icon = HOME_DESTINATION_ICONS[item.icon] ?? MessageSquareText;
          const href = isPublic ? item.publicHref : item.href;
          const active = !isPublic && primaryNavForPath(pathname, destinations)?.id === item.id;
          return (
            <Link
              key={item.id}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition',
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
        <nav className="mt-3 lg:mt-5" aria-label="Recent conversations" data-testid="home-recent-conversations">
          <p className="hidden px-2 text-xs font-semibold text-slate-600 lg:block">Recent</p>
          <button type="button" onClick={() => setRecentsOpen((open) => !open)} aria-expanded={recentsOpen} aria-controls="home-recent-list" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-slate-600 lg:hidden">{recentsOpen ? 'Hide recent conversations' : 'Recent conversations'}</button>
          <div id="home-recent-list" className={`${recentsOpen ? 'grid' : 'hidden'} mt-2 gap-0.5 lg:grid`}>
            {recents.map((item) => (
              <Link
                key={item.conversationId}
                href={`/app/conversations/${encodeURIComponent(item.conversationId)}${item.capsuleId ? `?capsuleId=${encodeURIComponent(item.capsuleId)}` : ''}`}
                className="group min-h-11 rounded-[var(--radius-md)] px-3 py-2 transition hover:bg-white"
                title={item.title ?? item.conversationId}
              >
                <span className="block overflow-hidden break-words text-[13px] font-medium leading-snug text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] group-hover:text-slate-950">
                  {item.title ?? 'PRAXIS conversation'}
                </span>
                <span className="block font-mono text-xs text-slate-600">
                  {formatRecentTimestamp(item.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
      <a
        href="https://tacitus.me"
        target="_blank"
        rel="noreferrer"
        className="mt-3 hidden min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-2 text-xs font-semibold text-slate-600 transition hover:text-emerald-700 lg:flex"
        aria-label="TACITUS reviewable context infrastructure"
      >
        About TACITUS
      </a>
    </aside>
  );
}

function ContextDrawer({
  activeCapsuleId,
  mutationDisabled,
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
  mutationDisabled: boolean;
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
  onActivateCapsule: (capsuleId: string, capsule?: PraxisCapsule) => void;
  onAttachReferenceCapsule: (capsuleId: string, capsule?: PraxisCapsule) => void;
  onDetachCapsule: (capsuleId: string) => void;
  onMakePrimaryCapsule: (capsuleId: string) => void;
}) {
  if (isPublic) {
    return (
      <section className="praxis-shell-card mt-4 p-4" data-testid="advanced-edit-context">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            data-testid="launchpad-capsule-chip"
            className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <Library className="h-3.5 w-3.5 text-emerald-700" />
            No capsules attached
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/login?mode=signup&redirect=%2Fapp"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Boxes className="h-3.5 w-3.5" />
              Attach context
            </Link>
            <Link
              href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%3Flane%3Drepository"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Import
            </Link>
            <Link
              href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%2Fbuilder"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Build context
            </Link>
          </div>
        </div>

        <div data-testid="launchpad-capsule-stack" className="mt-3 rounded-[var(--radius-md)] border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Context Capsules library</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Sign in to save and reuse capsules.</p>
            </div>
            <Link
              href="/login?mode=signup&redirect=%2Fapp"
              className="inline-flex min-h-11 items-center text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-2 text-xs leading-5 text-slate-500">
            Sign in to ask. A capsule is optional.
          </p>
          <Link
            href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%3Flane%3Drepository"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Boxes className="h-3.5 w-3.5" />
            Pick capsule
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
          disabled={mutationDisabled}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          <Library className="h-3.5 w-3.5 text-emerald-700" />
          {selectedCapsuleRefs.length ? `${selectedCapsuleRefs.length} capsule${selectedCapsuleRefs.length === 1 ? '' : 's'} attached` : 'No capsules attached'}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <fieldset disabled={mutationDisabled} className="contents">
            <CapsuleListPicker activeCapsuleId={activeCapsuleId ?? null} onSelect={onActivateCapsule} />
            <CapsuleImportButton onImported={(result) => onAttachReferenceCapsule(result.capsuleId)} />
          </fieldset>
          <Link href="/app/capsules/builder" className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <PlusCircle className="h-3.5 w-3.5" />
            Build context
          </Link>
        </div>
      </div>

      <div data-testid="launchpad-capsule-stack" className="mt-3 rounded-[var(--radius-md)] border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Context Capsules library</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {hydrated ? (persisted ? 'Saved to your workspace.' : 'Local context is active.') : 'Loading context...'}
              {savingContext ? ' Saving...' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Attach context</span>
            <fieldset disabled={mutationDisabled} className="contents">
              <CapsuleListPicker activeCapsuleId={null} onSelect={onAttachReferenceCapsule} />
            </fieldset>
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
                    disabled={mutationDisabled}
                    className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Make primary
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDetachCapsule(ref.capsuleId)}
                  disabled={mutationDisabled}
                  className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-3 w-3" />
                  Detach
                </button>
              </div>
            </div>
          )) : (
            <div className="rounded-[var(--radius-md)] border border-dashed border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-2">
              <p className="text-xs leading-5 text-slate-500">
                No capsule attached. You can ask a question now.
              </p>
              <Link
                href="/app/capsules?lane=repository"
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Boxes className="h-3.5 w-3.5" />
                Pick capsule
              </Link>
            </div>
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
  return <div data-testid="ask-context-bar" className="praxis-context-bar"><div data-testid="capsule-dock" className="flex flex-wrap items-center gap-2"><Link href="/login?mode=signup&redirect=%2Fapp" className="praxis-header-control border border-[var(--color-app-border)] text-xs"><Boxes className="h-4 w-4" />Attach context</Link><Link href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%2Fbuilder" className="praxis-header-control text-xs"><PlusCircle className="h-4 w-4" />New capsule</Link><button type="button" onClick={onOpenAdvancedContext} className="praxis-header-control text-xs">How context works</button></div></div>;
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
