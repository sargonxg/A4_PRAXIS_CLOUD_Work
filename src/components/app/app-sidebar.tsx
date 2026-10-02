'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronsLeft, ChevronsRight, FileText, FolderKanban, LogOut, MessageSquareText, Plus, Settings, ShieldCheck, X } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { NAV_GROUPS, primaryNavForPath } from '@/lib/navigation/primary-nav';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils/cn';
import { canLeaveWorkspaceEditor } from '@/lib/navigation/unsaved-work';

type RecentConversation = { conversationId: string; capsuleId?: string; title?: string; updatedAt?: string };
const ICONS = { projects: FolderKanban, home: MessageSquareText, capsules: FolderKanban, boardroom: ShieldCheck, 'recent-work': FileText, marketplace: FolderKanban, settings: Settings };

export function AppSidebar() {
  return <Suspense fallback={<aside className="praxis-workspace-nav w-64 p-5" aria-label="PRAXIS navigation" aria-busy="true">Loading navigation…</aside>}><WorkspaceNavigation /></Suspense>;
}

function WorkspaceNavigation() {
  const path = usePathname();
  const query = useSearchParams().toString();
  const active = primaryNavForPath(`${path}${query ? `?${query}` : ''}`);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [history, setHistory] = useState<{ ownerId: string | null; conversations: RecentConversation[]; failed: boolean }>({ ownerId: null, conversations: [], failed: false });
  const primary = NAV_GROUPS.find((group) => group.id === 'workspace')?.items ?? [];
  const secondary = NAV_GROUPS.find((group) => group.id === 'advanced')?.items ?? [];
  const conversations = history.ownerId === user?.id ? history.conversations : [];
  const historyFailed = history.ownerId === user?.id && history.failed;

  useEffect(() => {
    const refresh = () => setHistoryRefresh((value) => value + 1);
    window.addEventListener('praxis-conversation-updated', refresh);
    return () => window.removeEventListener('praxis-conversation-updated', refresh);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const ownerId = user.id;
    const controller = new AbortController();
    void fetch('/api/conversations', { credentials: 'include', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]) })
      .then(async (response) => {
        if (!response.ok) throw new Error('Conversations are unavailable');
        const body = await response.json() as { conversations?: RecentConversation[] };
        if (!Array.isArray(body.conversations)) throw new Error('Invalid conversation list');
        if (!controller.signal.aborted) setHistory({ ownerId, conversations: body.conversations.filter((item) => item.conversationId).slice(0, 12), failed: false });
      }).catch(() => { if (!controller.signal.aborted) setHistory({ ownerId, conversations: [], failed: true }); });
    return () => controller.abort();
  }, [historyRefresh, path, query, user?.id]);

  function newChat() {
    if (!canLeaveWorkspaceEditor()) return;
    router.push(`/app?thread=${encodeURIComponent(`chat-${crypto.randomUUID()}`)}`);
    if (window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false);
  }

  async function signOut() {
    if (!canLeaveWorkspaceEditor()) return;
    await logout();
    router.push('/login');
  }

  const expanded = sidebarOpen;
  return (
    <aside className={cn('praxis-workspace-nav flex h-dvh shrink-0 flex-col transition-[width] duration-200', expanded ? 'w-64' : 'w-20')} aria-label="PRAXIS navigation" onClick={(event) => { if (event.target instanceof Element && event.target.closest('a[href]') && window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false); }}>
      <div className="flex min-h-20 items-center gap-2 px-4">
        <PraxisLink href="/app" className="min-w-0 flex-1"><PraxisBrandChip compact className={expanded ? '' : '[&>span:last-child]:hidden'} /></PraxisLink>
        <button type="button" onClick={toggleSidebar} className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--color-app-text-secondary)] hover:bg-white md:inline-flex" aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
          {expanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => setSidebarOpen(false)} className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>
      <div className="px-3 pb-4"><button type="button" onClick={newChat} className="praxis-nav-link w-full border border-[var(--color-app-border)] bg-white text-[var(--color-praxis-emerald-800)]" title="New chat"><Plus className="h-4 w-4 shrink-0" />{expanded ? 'New chat' : <span className="sr-only">New chat</span>}</button></div>
      <nav aria-label="Workspace" className="space-y-1 px-3">
        {primary.map((item) => { const Icon = ICONS[item.id as keyof typeof ICONS] ?? FolderKanban; return <PraxisLink key={item.id} href={item.href} aria-current={active?.id === item.id ? 'page' : undefined} className="praxis-nav-link" title={item.label}><Icon className="h-4 w-4 shrink-0" />{expanded ? item.label : <span className="sr-only">{item.label}</span>}</PraxisLink>; })}
      </nav>
      {expanded ? <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5 pt-7">
        <h2 className="px-3 text-xs font-semibold text-[var(--color-app-text-secondary)]">Conversations</h2>
        <div className="mt-3 grid gap-1" aria-label="Saved conversations">
          {conversations.map((conversation) => <PraxisLink key={conversation.conversationId} href={`/app/conversations/${encodeURIComponent(conversation.conversationId)}${conversation.capsuleId ? `?capsuleId=${encodeURIComponent(conversation.capsuleId)}` : ''}`} aria-current={path === `/app/conversations/${conversation.conversationId}` ? 'page' : undefined} className="praxis-conversation-link" title={conversation.title ?? 'Saved conversation'}><span className="line-clamp-2 break-words">{conversation.title ?? 'Untitled conversation'}</span></PraxisLink>)}
          {!conversations.length ? <p className="px-3 text-xs leading-5 text-[var(--color-app-text-secondary)]">{historyFailed ? 'Conversation history is unavailable. Your saved work is still in your workspace.' : 'Your saved conversations will appear here.'}</p> : null}
        </div>
      </div> : <div className="flex-1" />}
      <div className="border-t border-[var(--color-app-border)] p-3">
        <button type="button" onClick={() => { if (!expanded) toggleSidebar(); setMoreOpen((value) => !value); }} aria-expanded={expanded && moreOpen} aria-controls="workspace-more-destinations" className="praxis-nav-link w-full" title="More"><ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', moreOpen && 'rotate-180')} />{expanded ? 'More' : <span className="sr-only">More</span>}</button>
        {expanded && moreOpen ? <nav id="workspace-more-destinations" aria-label="More workspace tools" className="mt-1 grid gap-1">{secondary.map((item) => { const Icon = ICONS[item.id as keyof typeof ICONS] ?? FolderKanban; return <PraxisLink key={item.id} href={item.href} className="praxis-nav-link text-sm" aria-current={active?.id === item.id ? 'page' : undefined}><Icon className="h-4 w-4 shrink-0" />{item.label}</PraxisLink>; })}<PraxisLink href="/guide" className="praxis-nav-link text-sm">Quick start</PraxisLink></nav> : null}
        <button type="button" onClick={() => void signOut()} className="praxis-nav-link mt-1 w-full text-sm" title="Sign out"><LogOut className="h-4 w-4 shrink-0" />{expanded ? 'Sign out' : <span className="sr-only">Sign out</span>}</button>
        {expanded ? <p className="px-3 pt-3 text-[11px] text-[var(--color-app-text-secondary)]">Experimental workspace · TACITUS</p> : null}
      </div>
    </aside>
  );
}
