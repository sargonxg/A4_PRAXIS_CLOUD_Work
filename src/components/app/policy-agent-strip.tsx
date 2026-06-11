'use client';

import Link from 'next/link';
import { Bot, FileOutput, Landmark, Wand2 } from 'lucide-react';
import { PRAXIS_POLICY_AGENTS } from '@/lib/product/policy-agents';

const AGENT_DESTINATIONS: Record<string, { href: string; icon: typeof Bot }> = {
  'capsule-factory': { href: '/app/capsules/builder', icon: Wand2 },
  'research-memo': { href: '/app?panel=memo', icon: Bot },
  'boardroom-discussion': { href: '/app/boardroom', icon: Landmark },
  'output-formatter': { href: '/app?panel=memo', icon: FileOutput },
};

/**
 * Quiet entry row for the live agentic workflows. Complexity stays in the
 * destination surfaces; the home page only offers the door.
 */
export function PolicyAgentStrip() {
  const liveAgents = PRAXIS_POLICY_AGENTS.filter(
    (agent) => agent.readiness === 'live' && AGENT_DESTINATIONS[agent.id],
  );
  if (!liveAgents.length) return null;

  return (
    <section className="praxis-shell-card mt-4 p-4" data-testid="policy-agent-strip" aria-label="Agentic workflows">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Agentic workflows <span aria-hidden className="text-emerald-600">·</span> triage, research, deliberation, delivery
        </p>
        <Link href="/learn" className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-600">
          How agent runs stay reviewable
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {liveAgents.map((agent) => {
          const destination = AGENT_DESTINATIONS[agent.id];
          const Icon = destination.icon;
          return (
            <Link
              key={agent.id}
              href={destination.href}
              data-testid={`policy-agent-chip-${agent.id}`}
              className="group rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-[0_4px_14px_rgba(16,185,129,0.12)]"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-emerald-700" />
                <span className="truncate text-xs font-semibold text-slate-900">{agent.label}</span>
              </span>
              <span className="mt-1 block truncate text-[11px] leading-4 text-slate-500">{agent.actionLabel}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
