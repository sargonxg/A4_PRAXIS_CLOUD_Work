'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, MessagesSquare, Play, Send } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';

const ADVISORS = [
  { id: 'political', name: 'Political Affairs', mandate: 'Actor incentives, legitimacy, and negotiation space.' },
  { id: 'security', name: 'Security Ops', mandate: 'Operational feasibility, force posture, and civilian protection.' },
  { id: 'economy', name: 'Political Economy', mandate: 'Leverage, funding, sanctions pressure, and reconstruction incentives.' },
  { id: 'diplomatic', name: 'Diplomatic Craft', mandate: 'Sendable language, precedent, and face-saving sequencing.' },
  { id: 'red-team', name: 'Red Team', mandate: 'Contradictions, weak evidence, and adversarial failure modes.' },
];

export function DeliberationRoom() {
  const [question, setQuestion] = useState('What is the defensible next move this week?');
  const [running, setRunning] = useState(false);
  const turns = useMemo(() => ADVISORS.map((advisor, index) => ({
    ...advisor,
    state: running ? (index < 3 ? 'done' : 'thinking') : 'waiting',
    position: `${advisor.name} frames the question against its mandate and requests source-grounded evidence before synthesis.`,
  })), [running]);

  return (
    <div className="space-y-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
            <MessagesSquare className="h-3.5 w-3.5" /> Boardroom
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-navy-900">Deliberation room</h1>
          <p className="mt-1 max-w-3xl text-sm text-navy-500">
            Five advisors deliberate in structured turns, then hand a synthesis into Draft.
          </p>
        </div>
        <PraxisLink
          href="/draft/boardroom-synthesis"
          className="inline-flex items-center gap-1.5 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800"
        >
          Open in Draft <ArrowRight className="h-3.5 w-3.5" />
        </PraxisLink>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap gap-2">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="min-w-72 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
          />
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400"
          >
            <Play className="h-3.5 w-3.5" /> Start
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[repeat(5,minmax(0,1fr))]">
        {turns.map((advisor) => (
          <article key={advisor.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-navy-900">{advisor.name}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-navy-500">{advisor.state}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-navy-500">{advisor.mandate}</p>
            <p className="mt-3 text-sm leading-6 text-navy-700">{advisor.position}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-gold-500/30 bg-gold-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">Synthesis</p>
        <p className="mt-2 text-sm leading-6 text-navy-800">
          {running
            ? `Synthesis seeded from: "${question}". The Draft handoff creates a work product with advisor positions and unresolved evidence gaps.`
            : 'Start a session to stream advisor turns into this synthesis panel.'}
        </p>
        <button className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gold-500/40 bg-white px-3 py-1.5 text-xs font-medium text-gold-800">
          <Send className="h-3.5 w-3.5" /> Principal close
        </button>
      </section>
    </div>
  );
}
