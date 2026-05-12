'use client';

import type { PraxisSlashCommand } from '@/components/writer/extensions/slash-menu';

export function SlashMenu({
  commands,
  query,
  onRun,
}: {
  commands: PraxisSlashCommand[];
  query: string;
  onRun: (command: PraxisSlashCommand) => void;
}) {
  const normalized = query.replace(/^\//, '').toLowerCase();
  const filtered = commands.filter((command) => command.id.includes(normalized) || command.label.includes(normalized));

  if (filtered.length === 0) return null;

  return (
    <div className="absolute left-8 top-16 z-30 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-navy-950/15">
      <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        PRAXIS commands
      </div>
      <div className="max-h-96 overflow-auto p-1">
        {filtered.map((command) => (
          <button
            key={command.id}
            type="button"
            onClick={() => onRun(command)}
            className="block w-full rounded-md px-3 py-2 text-left hover:bg-slate-50"
          >
            <span className="block text-sm font-semibold text-navy-950">{command.label}</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-600">{command.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
