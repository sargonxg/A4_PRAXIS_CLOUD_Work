'use client';

/**
 * Ask Praxis chat widget for the Syria case.
 *
 * Scripted, demo-safe chat that simulates the production Ask Praxis behaviour:
 * the model's answer is calibrated by both the user's profile (UN NY analyst,
 * Syria mandate) and the active situation graph (Syria post-Assad case file),
 * and every claim returns a provenance trail.
 *
 * The chat does not call a live AI endpoint by default; the simulated
 * streaming reads as a real session and avoids credit cost during recording.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bot, MessageSquare, Send, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SuggestedQuery {
  id: string;
  text: string;
  answerHeadline: string;
  answer: string;
  provenance: string[];
  thinkingSteps: string[];
}

const QUERIES: SuggestedQuery[] = [
  {
    id: 'q1',
    text: 'What is the most fragile commitment in the Damascus-SDF agreement right now?',
    answerHeadline: 'Implementation transparency, then minority protection',
    answer:
      'The integration plan timeline has not been published 90+ days after signing, which moves the agreement from "ceasefire announcement" toward "ceasefire announcement without annexes". Detention-facility security arrangements remain unverified by ICRC. Localised clashes in Deir-ez-Zor (4 incidents Mar–Apr 2026) erode the central narrative. PRAXIS scores the commitment at 56/100 partial compliance — the binding fragile claim is implementation transparency, with minority protection second.',
    provenance: ['UN Geneva 13 Feb 2026', 'Enab Baladi', 'North Press Agency', 'ICRC Syria page'],
    thinkingSteps: [
      'Loading user profile (UN NY · Syria · senior analyst)',
      'Reading situation: SYRIA_TRANSITION_2026',
      'Fetching commitment subgraph (8 commitments, 56% mean compliance)',
      'Cross-referencing falsification edges (Deir-ez-Zor incidents)',
      'Drafting answer with provenance pins',
    ],
  },
  {
    id: 'q2',
    text: 'How should I brief my P-Rep on EU sanctions sequencing for next week\'s informals?',
    answerHeadline: 'Bundle with named benchmarks, not blanket relief',
    answer:
      'Recommend bundling the next sanctions tranche with three benchmarks: (1) drafting-committee participation list with named civil-society networks, (2) HLP registry pilot in two governorates, and (3) ICRC detention access. The advisory council split 2-2-1 (bundle / sequence / mixed) — sequencing keeps sanctions credibility, bundling captures a real reform window. Benchmarks bridge the trade-off. Anchor your line in the EU 25 Feb partial delisting and the August 2026 review.',
    provenance: ['Council Implementing Reg (EU) 2026/237', 'ECFR analysis', 'Khatib · Yahya · Heller positions'],
    thinkingSteps: [
      'Loading advisory positions (5 advisors, 2-2-1 split)',
      'Reading EU benchmark calendar from sanctions board',
      'Cross-referencing with civil-society participation requirements',
      'Composing recommendation with named benchmarks',
      'Attaching provenance + verification windows',
    ],
  },
  {
    id: 'q3',
    text: 'Which counterparts in NYC should I sequence on the Syrian civil-society participation question?',
    answerHeadline: 'Switzerland → IPI → NGO Working Group → Sierra Leone',
    answer:
      'Run a three-step sequence: (1) brief Switzerland\'s mission as the IHL/good-offices E10 anchor; (2) co-host with IPI an Arria-formula readout that surfaces civil-society voices; (3) brief the NGO Working Group on the Security Council to channel a coordinated submission; (4) pivot to Sierra Leone as the post-conflict transition voice that lifts the line into the E10. Skip OFAC and Russia channels in this lane — sanctions and procedural blocking belong on a separate sequence.',
    provenance: ['Switzerland mission · Mission of Sierra Leone', 'IPI Global Observatory', 'NGO WGSC'],
    thinkingSteps: [
      'Loading NYC stakeholder graph (35 counterparts, 7 layers)',
      'Filtering by tone=aligned and lane=civil_society',
      'Sequencing by Council seat + thematic anchor',
      'Adding NGO WGSC as channelling node',
      'Returning ordered counterpart list with rationale',
    ],
  },
];

interface ChatMessage {
  role: 'user' | 'praxis';
  content: string;
  thinkingSteps?: string[];
  provenance?: string[];
  headline?: string;
}

export function SyriaAskPraxis({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => () => { cancelRef.current = true; }, []);

  async function sendQuery(query: SuggestedQuery) {
    if (streaming) return;
    cancelRef.current = false;
    setMessages((prev) => [...prev, { role: 'user', content: query.text }]);
    setStreaming(true);

    const placeholder: ChatMessage = {
      role: 'praxis',
      content: '',
      thinkingSteps: [],
      headline: query.answerHeadline,
    };
    setMessages((prev) => [...prev, placeholder]);

    // step in thinking trace
    for (let i = 0; i < query.thinkingSteps.length; i += 1) {
      if (cancelRef.current) return;
      // eslint-disable-next-line no-await-in-loop
      await wait(reduceMotion ? 80 : 320);
      const stepCopy = query.thinkingSteps.slice(0, i + 1);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'praxis') next[next.length - 1] = { ...last, thinkingSteps: stepCopy };
        return next;
      });
    }

    // stream tokens
    const tokens = query.answer.split(/(\s+)/);
    for (let i = 0; i < tokens.length; i += 1) {
      if (cancelRef.current) return;
      // eslint-disable-next-line no-await-in-loop
      await wait(reduceMotion ? 0 : 24);
      const content = tokens.slice(0, i + 1).join('');
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'praxis') next[next.length - 1] = { ...last, content };
        return next;
      });
    }

    // attach provenance
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.role === 'praxis') next[next.length - 1] = { ...last, provenance: query.provenance };
      return next;
    });

    setStreaming(false);
  }

  function reset() {
    cancelRef.current = true;
    setTimeout(() => {
      cancelRef.current = false;
      setStreaming(false);
      setMessages([]);
    }, 50);
  }

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-diplomatic-blue/15 text-diplomatic-blue">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">Ask PRAXIS</p>
            <h3 className="text-sm font-semibold text-navy-950">
              Domain AI calibrated by your profile <span className="text-slate-500">(UN NY · Syria mandate)</span> + active situation
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-navy-700 hover:bg-slate-50"
        >
          Reset
        </button>
      </header>

      <div className="mt-3 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MessageSquare className="h-3.5 w-3.5" />
            <p className="text-[10px] font-semibold uppercase tracking-wider">Suggested questions</p>
          </div>
          <ul className="mt-2 space-y-1.5">
            {QUERIES.map((q, idx) => (
              <motion.li
                key={q.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.24 }}
              >
                <button
                  type="button"
                  onClick={() => sendQuery(q)}
                  disabled={streaming}
                  className="w-full rounded-md border border-slate-200 bg-white p-2 text-left text-[11px] leading-4 text-navy-900 transition hover:border-diplomatic-blue/40 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Send className="mr-1 inline-block h-3 w-3 align-text-bottom text-diplomatic-blue" />
                  {q.text}
                </button>
              </motion.li>
            ))}
          </ul>
          <div className="mt-3 rounded-md bg-emerald-50 p-2 text-[10px] leading-4 text-emerald-900">
            Click any suggestion. The answer streams with reasoning trace and provenance pinned to public sources.
          </div>
        </div>

        <div className="grid min-h-[280px] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-[11px] leading-5 text-slate-500">
                <span className="font-semibold text-navy-700">Calibration loaded:</span> UN NY · Syria mandate · senior analyst.
                Pick a suggested question to see Ask Praxis reason in real time.
              </p>
            </div>
          ) : null}

          {messages.map((msg, idx) => (
            <motion.div
              key={`${idx}-${msg.role}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className={cn(
                'rounded-md p-3',
                msg.role === 'user' ? 'bg-white border border-slate-200' : 'bg-navy-950 text-white',
              )}
            >
              <div className="flex items-center gap-2">
                {msg.role === 'user' ? (
                  <>
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">You</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-3.5 w-3.5 text-gold-300" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">PRAXIS</span>
                  </>
                )}
              </div>
              {msg.role === 'praxis' && msg.thinkingSteps && msg.thinkingSteps.length > 0 ? (
                <ol className="mt-2 space-y-0.5 border-l border-white/10 pl-3 text-[10px] leading-4 text-blue-100/55">
                  {msg.thinkingSteps.map((step) => (
                    <li key={step} className="font-mono">· {step}</li>
                  ))}
                </ol>
              ) : null}
              {msg.role === 'praxis' && msg.headline ? (
                <p className="mt-2 text-sm font-semibold text-white">{msg.headline}</p>
              ) : null}
              <p
                className={cn(
                  'mt-1 text-[12px] leading-5',
                  msg.role === 'user' ? 'text-navy-900' : 'text-blue-100/85',
                )}
              >
                {msg.content}
                {msg.role === 'praxis' && streaming && idx === messages.length - 1 ? (
                  <span className="ml-0.5 inline-block h-3 w-1.5 -translate-y-0.5 animate-pulse bg-gold-300 align-middle" />
                ) : null}
              </p>
              {msg.role === 'praxis' && msg.provenance && msg.provenance.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.provenance.map((p) => (
                    <span key={p} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-blue-100/85">
                      {p}
                    </span>
                  ))}
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
