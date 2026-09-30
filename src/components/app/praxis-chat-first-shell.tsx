'use client';

import Link from 'next/link';
import { PublicShell } from '@/components/app/public-shell';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Boxes,
  ChevronDown,
  FileText,
  FolderKanban,
  Library,
  MessageSquareText,
  MoreHorizontal,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { useAuth } from '@/lib/auth/auth-context';
import { attachSavedCapsuleForAsk } from '@/lib/capsules/ask-handoff';
import {
  DEFAULT_CONTEXT_STACK_ID,
  attachCapsuleRef,
  detachCapsuleRef,
  swapCapsuleRef,
} from '@/lib/context/active-context-stack';
import { getCapsuleCategoryPalette, type CapsuleCategoryId } from '@/lib/constants/aco-colors';
import { HOME_SIDEBAR_DESTINATIONS, type PrimaryNavIcon } from '@/lib/navigation/primary-nav';

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

const PUBLIC_TOP_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Learn', href: '/learn' },
  { label: 'Guide', href: '/guide' },
  { label: 'Release notes', href: '/release-notes' },
] as const;

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
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const requestedCapsuleId = searchParams.get('capsuleId')?.trim() ?? '';
  const ownerId = user?.id;
  const handoffKey = !isPublic && requestedCapsuleId ? JSON.stringify([ownerId ?? null, requestedCapsuleId]) : null;
  const initialPrompt = searchParams.get('prompt') ?? searchParams.get('capsulePrompt') ?? '';
  const { stack, saveStack, persisted, hydrated } = useActiveContextStack({ remote: !isPublic });
  const attachmentRef = useRef({ stack, saveStack });
  const [handoff, setHandoff] = useState<{ key: string | null; status: 'loading' | 'failed' }>({ key: null, status: 'loading' });
  const [handoffRetry, setHandoffRetry] = useState(0);
  const handoffReady = !handoffKey;
  const handoffFailed = handoffKey === handoff.key && handoff.status === 'failed';
  const [contextOpen, setContextOpen] = useState(false);
  const [savingContext, setSavingContext] = useState(false);
  const [contextError, setContextError] = useState('');

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

  async function activateCapsule(capsuleId: string) {
    const next = selectedCapsuleRefs.length
      ? swapCapsuleRef(stack, selectedCapsuleRefs[0].capsuleId, { capsuleId, role: 'primary', primary: true })
      : attachCapsuleRef(stack, { capsuleId, role: 'primary', primary: true });
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

  async function attachReferenceCapsule(capsuleId: string) {
    const next = attachCapsuleRef(stack, {
      capsuleId,
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
      className="praxis-app-surface praxis-focus-surface min-h-screen text-slate-950"
      data-testid="praxis-chat-first-shell"
    >
      <div data-testid={isPublic ? 'marketing-home' : 'app-launchpad'} className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {!isPublic ? <HomeTopBar isPublic={isPublic} /> : null}
        <div className="mt-5 grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
          <HomeSidebar isPublic={isPublic} pathname={pathname ?? '/'} />
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
                <p className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-emerald-500/25 bg-white px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask PRAXIS
                </p>
                <h1 className="mt-4 text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-[color:var(--color-app-text)] sm:text-5xl">
                  Policy analysis you can inspect.
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[color:var(--color-app-text-secondary)]">
                  Ask a hard question. Bring your sources and methods. Review the evidence, assumptions and options.
                </p>
              </div>
            ) : null}
            <PraxisChat
              contextReady={isPublic || (hydrated && !savingContext && handoffReady)}
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
          </section>
        </div>
        {isPublic ? <PublicIntroduction /> : null}
      </div>
    </div>
  );

  return isPublic ? <PublicShell>{body}</PublicShell> : body;
}

function PublicIntroduction() {
  return (
    <section aria-labelledby="public-workflow-title" className="mt-12 border-t border-slate-200 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">From question to reviewable work</p>
      <h2 id="public-workflow-title" className="mt-3 max-w-3xl font-serif text-3xl text-slate-950 sm:text-4xl">Bring the question. Keep the context that matters.</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">For analysts, policy teams and researchers preparing a brief, comparing options or checking a claim. Start with a question; sign in to get an answer and save your conversation. Sources and saved context are optional.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {[
          { title: 'Ask and inspect', body: 'Describe the decision and the output you need. Read the answer alongside its sources, assumptions and missing evidence.' },
          { title: 'Build reusable context', body: 'A Context Capsule saves the background you want to reuse. Start from a template, or upload TXT, PDF or Word documents and review the proposed facts before accepting them.' },
          { title: 'Keep your work together', body: 'Attach a capsule to the next question, return to a saved conversation, or open a useful answer in the editor. Check the evidence before sharing.' },
        ].map((item) => <article key={item.title} className="rounded-2xl border border-slate-200 bg-white/80 p-6"><h3 className="font-serif text-2xl text-slate-950">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p></article>)}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/guide" className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white">Follow the quick start</Link>
        <Link href="/learn" className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800">Learn about saved context</Link>
        <Link href="/pricing" className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-emerald-800">Plans and availability</Link>
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-500">PRAXIS is in beta. AI answers can be incomplete or wrong; a saved source is not a guarantee that a claim is correct.</p>
    </section>
  );
}

function HomeTopBar({ isPublic }: { isPublic: boolean }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href={isPublic ? '/' : '/app'} className="min-w-0">
        <PraxisBrandChip compact />
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-slate-500" aria-label="Home links">
        {PUBLIC_TOP_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={`${link.href === '/pricing' ? '' : 'hidden sm:inline-flex '}rounded-[var(--radius-full)] px-3 py-1.5 hover:bg-white hover:text-slate-950`}>
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
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{isPublic ? 'Start here' : 'Workspace'}</p>
      <nav className="mt-3 flex flex-wrap gap-1 lg:grid">
        {destinations.map((item) => {
          const Icon = HOME_DESTINATION_ICONS[item.icon] ?? MessageSquareText;
          const href = isPublic ? item.publicHref : item.href;
          const active = !isPublic && (pathname === item.href || (item.id === 'ask' && pathname === '/app'));
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
          <p className="hidden px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 lg:block">Recent</p>
          <button type="button" onClick={() => setRecentsOpen((open) => !open)} aria-expanded={recentsOpen} aria-controls="home-recent-list" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-slate-600 lg:hidden">{recentsOpen ? 'Hide recent conversations' : 'Recent conversations'}</button>
          <div id="home-recent-list" className={`${recentsOpen ? 'grid' : 'hidden'} mt-2 gap-0.5 lg:grid`}>
            {recents.map((item) => (
              <Link
                key={item.conversationId}
                href={`/app/conversations/${encodeURIComponent(item.conversationId)}${item.capsuleId ? `?capsuleId=${encodeURIComponent(item.capsuleId)}` : ''}`}
                className="group rounded-[var(--radius-md)] px-3 py-1.5 transition hover:bg-white"
                title={item.title ?? item.conversationId}
              >
                <span className="block overflow-hidden break-words text-[13px] font-medium leading-snug text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] group-hover:text-slate-950">
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
      <div className="mt-5 hidden rounded-[var(--radius-md)] border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3 text-xs leading-5 text-slate-600 lg:block">
        Ask first. Save the context worth reusing.
      </div>
      <a
        href="https://tacitus.me"
        target="_blank"
        rel="noreferrer"
        className="mt-3 hidden items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-emerald-700 lg:flex"
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
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Boxes className="h-3.5 w-3.5" />
              Attach context
            </Link>
            <Link
              href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%3Flane%3Drepository"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Import
            </Link>
            <Link
              href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%2Fbuilder"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
              className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-2 text-xs leading-5 text-slate-500">
            No capsules attached yet. Ask PRAXIS can still answer directly.
          </p>
          <Link
            href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%3Flane%3Drepository"
            className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
          className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          <Library className="h-3.5 w-3.5 text-emerald-700" />
          {selectedCapsuleRefs.length ? `${selectedCapsuleRefs.length} capsule${selectedCapsuleRefs.length === 1 ? '' : 's'} attached` : 'No capsules attached'}
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Context Capsules library</p>
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
            <div className="rounded-[var(--radius-md)] border border-dashed border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-2">
              <p className="text-xs leading-5 text-slate-500">
                No capsules attached yet. Ask PRAXIS can still answer directly.
              </p>
              <Link
                href="/app/capsules?lane=repository"
                className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div
      data-testid="ask-context-bar"
      className="rounded-[var(--radius-lg)] border border-[var(--color-app-border)] bg-white/90 p-2 text-slate-950 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-2">
        <div className="max-w-sm">
          <p className="text-sm font-semibold">Give the analysis a foundation.</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">A capsule keeps sources, actors, timelines and methods together for reuse and review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%3Flane%3Drepository" className="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-emerald-800">Explore capsules</Link>
          <Link href="/login?mode=signup&redirect=%2Fapp%2Fcapsules%2Fbuilder" className="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700">Build your own</Link>
        </div>
      </div>
      <details className="p-2">
        <summary className="cursor-pointer text-xs font-semibold text-slate-600">How saved context guides the analysis</summary>
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
              className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
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
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
                >
                  Sign in to save context
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4" data-testid="capsule-dock-slots">
          {([
            ['user', 'Who is asking — perspective, mandate, and voice'],
            ['situation', 'The case — actors, claims, sources, and graph context'],
            ['tools', 'How to think — methods, frameworks, and agent permissions'],
            ['output', 'What to produce — memo, brief, or handover contract'],
          ] as const satisfies ReadonlyArray<readonly [CapsuleCategoryId, string]>).map(([category, hint]) => {
            const palette = getCapsuleCategoryPalette(category);
            return (
              <span
                key={category}
                data-testid="capsule-dock-chip"
                title={`Sign in to attach a ${palette.label} capsule. ${hint}.`}
                className="flex min-h-12 min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-dashed px-2 py-1.5 opacity-80"
                style={{ backgroundColor: palette.bg, borderColor: palette.border } as CSSProperties}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.accent }} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: palette.text }}>{palette.label}</span>
                  <span className="block text-xs font-semibold text-slate-500">Sign in to add</span>
                </span>
              </span>
            );
          })}
        </div>
      </div>
      </details>
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
