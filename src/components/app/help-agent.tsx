'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, HelpCircle, Loader2, Trash2, X } from 'lucide-react';
import { describeAskFailure, parseDataStreamError } from '@/lib/ai/tasklet-stream';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import {
  buildConversationPath,
  createConversationThreadId,
  ensureConversationRecord,
} from '@/components/praxis/tasklet-workbench-conversation';
import { cn } from '@/lib/utils/cn';

type HelpMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const HELP_CAPSULE_ID = 'praxis-product-guide';
const HELP_CONTEXT_STACK = {
  capsuleId: HELP_CAPSULE_ID,
  capsuleRefs: [{ capsuleId: HELP_CAPSULE_ID, label: 'PRAXIS product guide', role: 'reference', primary: true }],
};
const DEFAULT_HELP_PROMPT = 'What is PRAXIS and how do I use capsules, the dock, and agentic workflow?';

export function HelpAgent() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-praxis-help', onOpen);
    return () => window.removeEventListener('open-praxis-help', onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const appliedCapsules = useMemo(() => [{
    id: HELP_CAPSULE_ID,
    label: 'PRAXIS product guide',
    role: 'reference',
  }], []);

  function ensureHelpThread(): string {
    if (threadId) return threadId;
    const nextThreadId = createConversationThreadId();
    setThreadId(nextThreadId);
    void ensureConversationRecord(nextThreadId, HELP_CAPSULE_ID, appliedCapsules);
    return nextThreadId;
  }

  function buildHelpPrompt(cleanPrompt: string): string {
    return [
      cleanPrompt,
      '',
      'You are PRAXIS product help. Answer only about how PRAXIS works: Ask PRAXIS, ContextCapsules, the Capsule Dock, navigation, agentic workflows, receipts, and DIALECTICA as the context-building direction.',
      'Do not inspect, summarize, infer, or claim access to the user workspace, private sources, billing, credentials, or saved capsules. If the user asks for their data, direct them to the visible app surface.',
      'Keep the answer compact and actionable.',
    ].join('\n');
  }

  async function sendHelp(overridePrompt?: string) {
    const cleanPrompt = (overridePrompt ?? prompt).trim();
    if (!cleanPrompt || streaming) return;
    setOpen(true);
    setStreaming(true);
    setPrompt('');
    const nextThreadId = ensureHelpThread();
    const userMessage: HelpMessage = { role: 'user', text: cleanPrompt };
    setMessages((current) => [...current, userMessage, { role: 'assistant', text: '' }]);

    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(nextThreadId)}/turns`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { ...userMessage, text: buildHelpPrompt(cleanPrompt) }].map((message) => ({
            role: message.role,
            content: message.text,
          })),
          capsuleId: HELP_CAPSULE_ID,
          contextPackageId: `capsule:${HELP_CAPSULE_ID}:v1`,
          appliedCapsules,
          currentToolId: 'praxis-product-help',
          currentPath: buildConversationPath(HELP_CAPSULE_ID, nextThreadId),
          activeContextStack: HELP_CONTEXT_STACK,
          turnMetadata: { productHelpOnly: true },
          aiSettings: {
            provider: 'vertex',
            analysisDepth: 'quick',
            agenticSearchPremium: false,
            researchGraphExtra: false,
          },
        }),
      });
      if (!response.ok || !response.body) {
        let detail = `${response.status} ${response.statusText}`;
        try {
          const payload = await response.clone().json() as { message?: string; error?: string };
          detail = payload.message ?? payload.error ?? detail;
        } catch {
          // Keep HTTP status detail.
        }
        throw new Error(detail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const streamError = parseDataStreamError(line);
          if (streamError) throw new Error(streamError);
          const parsed = parseDataStreamChunk(line);
          if (!parsed) continue;
          answer += parsed;
          setMessages((current) => replaceLastAssistant(current, answer));
        }
      }
      if (!answer.trim()) throw new Error('PRAXIS help returned no answer text.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      setPrompt(cleanPrompt);
      setMessages((current) => replaceLastAssistant(current, describeAskFailure(message)));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2" data-testid="praxis-help-agent">
      {open ? (
        <section
          data-testid="praxis-help-agent-panel"
          role="dialog"
          aria-modal="false"
          aria-label="PRAXIS help"
          className="flex max-h-[min(34rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[var(--shadow-modal)]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">PRAXIS help</p>
              <h2 className="mt-1 text-sm font-semibold text-slate-950">Ask about the product</h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {messages.length ? (
                <button type="button" aria-label="Clear PRAXIS help" onClick={() => setMessages([])} className="rounded-md p-1.5 text-slate-500 hover:bg-white">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
              <button type="button" aria-label="Close PRAXIS help" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-slate-500 hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-h-52 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length ? messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={cn(
                  'whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-6',
                  message.role === 'user' ? 'ml-6 bg-slate-950 text-white' : 'mr-6 border border-slate-200 bg-slate-50 text-slate-700',
                )}
              >
                {message.text || (streaming && message.role === 'assistant' ? 'Reading the product guide...' : '')}
              </article>
            )) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                Ask how PRAXIS works, how the Capsule Dock attaches context, where to find capsules, or when DIALECTICA helps build reusable context.
              </div>
            )}
          </div>
          <form
            className="border-t border-slate-200 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendHelp();
            }}
          >
            <textarea
              value={prompt}
              rows={3}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask about PRAXIS, capsules, the dock, or agents"
              className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm leading-5 text-slate-800 outline-none focus:border-emerald-600"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void sendHelp(DEFAULT_HELP_PROMPT)}
                className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Start here
              </button>
              <button
                type="submit"
                disabled={streaming || !prompt.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                Send
              </button>
            </div>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        data-testid="praxis-help-agent-button"
        aria-label="Open PRAXIS help"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-950 text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800"
        title="PRAXIS help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </div>
  );
}

function replaceLastAssistant(messages: HelpMessage[], text: string): HelpMessage[] {
  const next = [...messages];
  const last = next[next.length - 1];
  if (last?.role === 'assistant') next[next.length - 1] = { ...last, text };
  return next;
}
