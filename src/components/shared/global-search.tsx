'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  BookOpenCheck,
  FolderKanban,
  Home,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type PraxisCommand = {
  id: string;
  label: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  group: 'Primary surfaces' | 'Context actions' | 'Output actions';
  run?: (query: string) => void;
};

const COMMANDS: PraxisCommand[] = [
  { id: 'open-home', label: 'Open PRAXIS', description: 'Ask from the active capsule.', href: '/app', icon: Home, group: 'Primary surfaces' },
  { id: 'open-capsules', label: 'Open Capsules', description: 'Search, build, and update capsule context.', href: '/app', icon: FolderKanban, group: 'Primary surfaces' },
  { id: 'attach-source', label: 'Attach source', description: 'Upload or attach a source to the active capsule.', href: '/app', icon: Upload, group: 'Context actions' },
  { id: 'find-gaps', label: 'Find evidence gaps', description: 'Review evidence gaps from the active capsule.', href: '/app', icon: ShieldAlert, group: 'Context actions' },
  { id: 'create-capsule', label: 'Create capsule', description: 'Start reusable context from the manager.', href: '/app', icon: Plus, group: 'Context actions' },
  { id: 'fork-demo', label: 'Fork sample capsule', description: 'Copy a sample structure into your workspace.', href: '/app', icon: BookOpenCheck, group: 'Context actions' },
  { id: 'improve-capsule', label: 'Improve capsule', description: 'Ask PRAXIS to find missing context.', href: '/app', icon: Sparkles, group: 'Output actions' },
];

export function GlobalSearch({
  onClose,
  initialQuery = '',
}: {
  onClose: () => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
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

  const commands = useMemo<PraxisCommand[]>(() => [
    {
      id: 'ask-query',
      label: query.trim().length > 0 ? `Ask PRAXIS: ${query.replace(/^\?/, '').trim()}` : 'Ask PRAXIS with current context',
      description: 'Send the prompt to PRAXIS without exposing the tool library.',
      icon: Sparkles,
      group: 'Primary surfaces',
      run: askPraxis,
    },
    ...COMMANDS,
  ], [askPraxis, query]);

  function runCommand(command: PraxisCommand) {
    if (command.run) {
      command.run(query);
      return;
    }
    if (command.href) router.push(command.href);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-950/25 backdrop-blur-sm" />
      <Command
        data-testid="command-palette"
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-lg border border-[var(--color-app-border)] bg-white shadow-xl shadow-navy-950/12"
        onClick={(event) => event.stopPropagation()}
        shouldFilter
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-navy-500" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            autoFocus
            placeholder="Command or ask PRAXIS..."
            className="flex-1 bg-transparent text-sm text-navy-950 outline-none placeholder:text-navy-600"
          />
          <button type="button" onClick={onClose} className="rounded-md p-1 text-navy-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close command palette</span>
          </button>
          <kbd className="rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[10px] text-navy-500">Esc</kbd>
        </div>

        <Command.List className="max-h-[460px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-navy-500">
            No command found. Press enter after a question to ask PRAXIS.
          </Command.Empty>
          {(['Primary surfaces', 'Context actions', 'Output actions'] as const).map((group) => (
            <Command.Group
              key={group}
              heading={group}
              className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2"
            >
              {commands.filter((command) => command.group === group).map((command) => {
                const Icon = command.icon;
                return (
                  <Command.Item
                    key={command.id}
                    value={`${command.label} ${command.description}`}
                    onSelect={() => runCommand(command)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-navy-800 data-[selected=true]:bg-slate-100 data-[selected=true]:text-navy-950"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white">
                      <Icon className="h-4 w-4 text-diplomatic-blue" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{command.label}</span>
                      <span className="block truncate text-xs text-navy-500">{command.description}</span>
                    </span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
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
