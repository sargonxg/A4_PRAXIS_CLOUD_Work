'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  FileText,
  FolderKanban,
  Library,
  MessageSquareText,
  PlusCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { PublicShell } from '@/components/app/public-shell';
import { PraxisChat } from '@/components/app/praxis-chat';
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

const PUBLIC_TOP_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Learn', href: '/learn' },
  { label: 'Guide', href: '/guide' },
  { label: 'Changelog', href: '/release-notes' },
] as const;

const HOME_DESTINATIONS = [
  { id: 'ask', label: 'Ask', href: '/app', publicHref: '/login?mode=signup&redirect=%2Fapp', icon: MessageSquareText },
  { id: 'capsules', label: 'Capsules', href: '/app/capsules', publicHref: '/login?mode=signup&redirect=%2Fapp%2Fcapsules', icon: FolderKanban },
  { id: 'boardroom', label: 'Boardroom', href: '/app/boardroom', publicHref: '/login?mode=signup&redirect=%2Fapp%2Fboardroom', icon: ShieldCheck },
  { id: 'memo', label: 'Memo', href: '/app?panel=memo', publicHref: '/login?mode=signup&redirect=%2Fapp%3Fpanel%3Dmemo', icon: FileText },
] as const;

export function PraxisChatFirstShell({ mode }: { mode: 'public' | 'authenticated' }) {
  const isPublic = mode === 'public';
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') ?? searchParams.get('capsulePrompt') ?? '';
  const { stack, saveStack, persisted, hydrated } = useActiveContextStack();
  const [contextOpen, setContextOpen] = useState(false);
  const [savingContext, setSavingContext] = useState(false);
  const selectedCapsuleRefs = stack.capsuleRefs;
  const activeCapsuleId = selectedCapsuleRefs[0]?.capsuleId ?? stack.capsuleId;
  const contextLabel = useMemo(() => {
    if (!selectedCapsuleRefs.length && !activeCapsuleId) return '+ Context';
    return `${selectedCapsuleRefs.length || 1} context`;
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

function HomeSidebar({ isPublic, pathname }: { isPublic: boolean; pathname: string }) {
  return (
    <aside className="praxis-shell-panel h-fit p-3" aria-label="Primary PRAXIS destinations">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
      <nav className="mt-3 grid gap-1">
        {HOME_DESTINATIONS.map((item) => {
          const Icon = item.icon;
          const href = isPublic ? item.publicHref : item.href;
          const active = !isPublic && (pathname === item.href || (item.id === 'ask' && pathname === '/app'));
          return (
            <Link
              key={item.id}
              href={href}
              className={[
                'flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition',
                active ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-white',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-5 rounded-[var(--radius-md)] border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3 text-xs leading-5 text-slate-600">
        Ask first. Add capsule context only when sources, institutional memory, or memo handoff matter.
      </div>
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
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--color-gold-700)]">Context</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Capsules unlock after sign-in.</h2>
          </div>
          <Link href="/login?mode=signup&redirect=%2Fapp%2Fcapsules" className="praxis-button-primary min-h-10 px-4 text-sm">
            Add capsule
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
          <Library className="h-3.5 w-3.5 text-[color:var(--color-gold-700)]" />
          {selectedCapsuleRefs.length ? `${selectedCapsuleRefs.length} capsule${selectedCapsuleRefs.length === 1 ? '' : 's'} attached` : 'No capsule attached'}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <CapsuleListPicker activeCapsuleId={activeCapsuleId ?? null} onSelect={onActivateCapsule} />
          <Link href="/app/capsules/builder" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <PlusCircle className="h-3.5 w-3.5" />
            Build capsule
          </Link>
        </div>
      </div>

      <div data-testid="launchpad-capsule-stack" className="mt-3 rounded-[var(--radius-md)] border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Attached capsules</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {hydrated ? (persisted ? 'Saved to your workspace.' : 'Local context is active.') : 'Loading context...'}
              {savingContext ? ' Saving...' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Attach capsule</span>
            <CapsuleListPicker activeCapsuleId={null} onSelect={onAttachReferenceCapsule} />
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {selectedCapsuleRefs.length ? selectedCapsuleRefs.map((ref) => (
            <div key={ref.capsuleId} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-slate-100 bg-[color:var(--color-archive-paper-strong)] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900">{ref.label ?? shortenContextId(ref.capsuleId)}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{ref.role}{ref.primary ? ' / primary' : ''}</p>
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
              No attached capsules. Ask PRAXIS can still answer directly, but serious work should attach context.
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
