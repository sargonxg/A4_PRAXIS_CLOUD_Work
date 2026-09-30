'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  BookOpenCheck,
  Command as CommandIcon,
  FileSearch,
  FolderKanban,
  MessageSquareText,
  Plus,
  Search,
  ServerCog,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { COMMAND_SEARCH_ACTIONS } from '@/lib/app-search/static-actions';
import { useAuth } from '@/lib/auth/auth-context';
import {
  buildFederatedSearchResults,
  fetchFederatedSearchData,
  type FederatedSearchData,
  type SearchResult,
} from '@/lib/search/federated-app-search';

type PraxisCommand = {
  id: string;
  label: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  group: 'Primary surfaces' | 'Context actions' | 'Output actions';
};

const COMMAND_ICONS: Partial<Record<string, LucideIcon>> = {
  'open-home': MessageSquareText,
  'open-capsule-factory': FolderKanban,
  'open-workspace': FileSearch,
  'attach-source': Upload,
  'find-gaps': ShieldAlert,
  'create-capsule': Plus,
  'fork-demo': BookOpenCheck,
  'improve-capsule': Sparkles,
};

// The served search API and its offline fallback share the same destinations.
export const COMMANDS: PraxisCommand[] = COMMAND_SEARCH_ACTIONS.map((action) => ({
  ...action,
  icon: COMMAND_ICONS[action.id] ?? CommandIcon,
  group: ['open-home', 'open-capsule-factory'].includes(action.id) ? 'Primary surfaces' : 'Context actions',
}));

const SEARCH_GROUPS: SearchResult['group'][] = ['Ask', 'Commands', 'Actions', 'Conversations', 'Capsules', 'Sources', 'Memos', 'Documents & Sources', 'Agent Runs', 'Diagnostics'];

export function GlobalSearch({
  onClose,
  initialQuery = '',
}: {
  onClose: () => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  const [searchSnapshot, setSearchSnapshot] = useState<{ ownerId: string | null; query: string; data: FederatedSearchData }>({ ownerId, query: initialQuery, data: {} });
  const rootRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const router = useRouter();

  const askPraxis = useCallback((prompt: string) => {
    const cleaned = prompt.replace(/^\?/, '').trim();
    if (cleaned.length > 0) {
      window.dispatchEvent(new CustomEvent('open-praxis-chat', { detail: { prompt: cleaned } }));
    } else {
      router.push('/app');
    }
    onClose();
  }, [onClose, router]);

  useEffect(() => {
    const previousFocus = previousFocusRef.current;
    return () => previousFocus?.focus();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchForSearch = (input: string, init?: RequestInit) => fetch(input, { ...init, signal: controller.signal });
    const timer = window.setTimeout(() => {
      void fetchFederatedSearchData(query, fetchForSearch)
        .then((data) => { if (!controller.signal.aborted) setSearchSnapshot({ ownerId, query, data }); })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSearchSnapshot({ ownerId, query, data: { errors: Object.fromEntries(['Conversations', 'Capsules', 'Sources', 'Diagnostics'].map((group) => [group, 'Search is temporarily unavailable. Try again.'])) as FederatedSearchData['errors'] } });
        });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [ownerId, query]);

  const results = useMemo(() => buildFederatedSearchResults({
    query,
    commands: COMMANDS,
    ...(searchSnapshot.ownerId === ownerId && searchSnapshot.query === query ? searchSnapshot.data : {}),
  }), [ownerId, searchSnapshot, query]);

  function runResult(result: SearchResult) {
    if (result.run === 'ask') {
      askPraxis(query);
      return;
    }
    if (result.href) router.push(result.href);
    onClose();
  }

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label="Search workspace" className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16" onClick={onClose} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...(rootRef.current?.querySelectorAll<HTMLElement>('input,button,[tabindex="0"]') ?? [])].filter((control) => control.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className="absolute inset-0 bg-navy-950/25 backdrop-blur-sm" />
      <Command
        data-testid="command-palette"
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-app-border)] bg-white shadow-[var(--shadow-modal)]"
        onClick={(event) => event.stopPropagation()}
        shouldFilter
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-navy-500" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            autoFocus
            aria-label="Search commands, capsules and work"
            placeholder="Search commands, capsules and work…"
            className="flex-1 bg-transparent text-sm text-navy-950 outline-none placeholder:text-navy-600"
          />
          <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-navy-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close command palette</span>
          </button>
          <kbd className="rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[10px] text-navy-500">Esc</kbd>
        </div>

        <Command.List className="max-h-[min(460px,calc(100dvh-12rem))] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-navy-500">
            No command found. Press enter after a question to ask PRAXIS.
          </Command.Empty>
          {SEARCH_GROUPS.map((group) => {
            const groupResults = results.filter((result) => result.group === group);
            if (groupResults.length === 0) return null;
            return (
              <Command.Group
                key={group}
                heading={group}
                className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2"
              >
                {groupResults.map((result) => {
                  const Icon = iconForResult(result);
                  return (
                    <Command.Item
                      key={result.id}
                      value={`${result.label} ${result.description} ${result.meta ?? ''}`}
                      onSelect={() => runResult(result)}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-navy-800 data-[selected=true]:bg-slate-100 data-[selected=true]:text-navy-950"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white">
                        <Icon className="h-4 w-4 text-diplomatic-blue" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{result.label}</span>
                        <span className="block truncate text-xs text-navy-500">{result.description}</span>
                        {result.meta ? <span className="block truncate text-[11px] text-navy-400">{result.meta}</span> : null}
                      </span>
                      {result.status ? <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-navy-500">{result.status}</span> : null}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            );
          })}
        </Command.List>

        <div className="flex items-center gap-4 border-t border-[var(--color-app-border)] px-4 py-2">
          <span className="text-[10px] text-navy-500">Up/down navigate</span>
          <span className="text-[10px] text-navy-500">Enter run</span>
          <span className="text-[10px] text-navy-500">Esc close</span>
        </div>
      </Command>
    </div>
  );
}

function iconForResult(result: SearchResult): LucideIcon {
  if (result.group === 'Ask') return Sparkles;
  if (result.group === 'Conversations' || result.group === 'Memos') return MessageSquareText;
  if (result.group === 'Capsules') return FolderKanban;
  if (result.group === 'Sources' || result.group === 'Documents & Sources') return FileSearch;
  if (result.group === 'Agent Runs') return ServerCog;
  if (result.group === 'Diagnostics') return ServerCog;
  const command = COMMANDS.find((item) => item.id === result.id);
  return command?.icon ?? CommandIcon;
}
