'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { MutationConfirmCard, type MutationPatch } from '@/components/assistant/mutation-confirm-card';
import { ResponseActions } from '@/components/assistant/response-actions';
import { AnswerContextProvenanceChips } from '@/components/ask/AnswerContextProvenanceChips';
import { inferResponseActionKinds, type ResponseActionKind } from '@/lib/assistant/response-action-kinds';
import type { SourceabilityClaimVerdict } from '@/lib/agent-runtime/sourceability-ledger';
import { DEFAULT_MODEL_PREFERENCE } from '@/lib/ai/model-preferences';
import type { AskAnswerEnvelope, SourcePreviewCard } from '@/lib/ai/ask-answer-envelope';
import {
  defaultActiveContextStack,
  type ActiveContextBlockItem,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import { PENDING_TASKLET_PROMPT_KEY } from '@/lib/product/policy-agents';
import { POLICY_MISSION_EXAMPLES } from '@/lib/product/policy-missions';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import type { Situation } from '@/types/situation';

type ChatProposal = {
  summary: string;
  patch: MutationPatch;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  question?: string;
  proposal?: ChatProposal | null;
  availableActions?: ResponseActionKind[];
  answerEnvelope?: AskAnswerEnvelope;
  sourceabilityVerdicts?: SourceabilityClaimVerdict[];
};

export interface PraxisChatProps {
  mode: 'public' | 'authenticated';
  activeContextStack?: ActiveContextStackState | null;
  activeSituation?: Situation | null;
  autoFocus?: boolean;
  autoSendNonce?: number;
  className?: string;
  compact?: boolean;
  contextBar?: ReactNode;
  contextLabel?: string;
  contextOpen?: boolean;
  currentPath?: string | null;
  currentToolId?: string;
  demoMode?: boolean;
  greeting?: string;
  initialPrompt?: string;
  onToggleContext?: () => void;
  storageKey?: string;
  threadId?: string;
  variant?: 'home' | 'floating';
}

export function PraxisChat({
  mode,
  activeContextStack,
  activeSituation,
  autoFocus = false,
  autoSendNonce = 0,
  className,
  compact = false,
  contextBar,
  contextLabel = '+ Context',
  contextOpen = false,
  currentPath,
  currentToolId,
  demoMode = false,
  greeting,
  initialPrompt = '',
  onToggleContext,
  storageKey,
  threadId,
  variant = 'home',
}: PraxisChatProps) {
  const router = useRouter();
  const [input, setInput] = useState(initialPrompt);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const stack = useMemo(() => activeContextStack ?? defaultActiveContextStack(), [activeContextStack]);
  const activeCapsuleId = stack.capsuleRefs[0]?.capsuleId ?? stack.capsuleId ?? activeSituation?.id ?? null;
  const conversationThreadId = threadId ?? `home-${activeCapsuleId ?? stack.contextPackageId ?? stack.userModelId ?? 'direct'}`;
  const localStorageKey = storageKey ?? `praxis-chat:${mode}:${conversationThreadId}`;
  const isPublic = mode === 'public';
  const showExamples = variant === 'home' && messages.length === 0;
  const promptPlaceholder = isPublic
    ? 'Ask the question. Sign in after this to keep going.'
    : 'Ask PRAXIS about a policy question, source gap, saved context, or draft.';

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(localStorageKey);
      setMessages(saved ? (JSON.parse(saved) as ChatMessage[]).slice(-50) : []);
    } catch {
      setMessages([]);
    }
  }, [localStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify(messages.slice(-50)));
    } catch {
      // Local storage can be unavailable in private browsing or full profiles.
    }
  }, [localStorageKey, messages]);

  useEffect(() => {
    if (isPublic || demoMode) return;
    let cancelled = false;
    const capsuleForHistory = activeCapsuleId ?? 'thin-capsule-fallback';
    const params = new URLSearchParams({
      capsuleId: capsuleForHistory,
      threadId: conversationThreadId,
      limit: '30',
    });
    fetch(`/api/ai/chat?${params.toString()}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((history: { turns?: Array<{ id: string; prompt: string; output: string; runtime?: { answerEnvelope?: AskAnswerEnvelope } }> } | null) => {
        if (cancelled || !history?.turns?.length) return;
        const hydrated = history.turns.flatMap<ChatMessage>((turn) => [
          { id: `${turn.id}-user`, role: 'user', content: turn.prompt },
          {
            id: `${turn.id}-assistant`,
            role: 'assistant',
            content: turn.output,
            question: turn.prompt,
            answerEnvelope: turn.runtime?.answerEnvelope,
            sourceabilityVerdicts: turn.runtime?.answerEnvelope?.sourceabilityVerdicts,
            availableActions: inferResponseActionKinds(turn.output),
          },
        ]);
        setMessages(hydrated.slice(-50));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeCapsuleId, conversationThreadId, demoMode, isPublic]);

  const sendWithText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (isStreaming || !text) return;
      setError(null);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, text);
      }

      if (isPublic) {
        const params = new URLSearchParams();
        params.set('mode', 'signup');
        params.set('redirect', '/app');
        params.set('prompt', text);
        params.set('capsulePrompt', text);
        router.push(`/login?${params.toString()}`);
        return;
      }

      const askStack = stackForAsk(stack, text);
      const assistantId = `assistant-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
      };
      const priorMessages = messagesRef.current;

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: 'assistant', content: '', question: text },
      ]);
      setInput('');
      setIsStreaming(true);

      const intentPromise = fetch('/api/assistant/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);

      const appendAssistantText = (token: string) => {
        if (!token) return;
        setMessages((prev) => prev.map((message) => (
          message.id === assistantId
            ? { ...message, content: `${message.content}${token}` }
            : message
        )));
      };

      const updateAssistant = (patch: Partial<ChatMessage>) => {
        setMessages((prev) => prev.map((message) => (
          message.id === assistantId ? { ...message, ...patch } : message
        )));
      };

      const consumeDataLine = (line: string) => {
        if (line.startsWith('0:')) {
          appendAssistantText(parseDataStreamChunk(`${line}\n`));
          return;
        }
        if (line.startsWith('2:')) {
          try {
            const payload = JSON.parse(line.slice(2)) as {
              type?: string;
              answerEnvelope?: AskAnswerEnvelope;
              sourceabilityVerdicts?: unknown;
            };
            if (payload.type === 'answerEnvelope' && payload.answerEnvelope) {
              updateAssistant({
                answerEnvelope: payload.answerEnvelope,
                sourceabilityVerdicts: payload.answerEnvelope.sourceabilityVerdicts,
              });
            } else if (payload.type === 'sourceabilityVerdicts' && Array.isArray(payload.sourceabilityVerdicts)) {
              updateAssistant({
                sourceabilityVerdicts: payload.sourceabilityVerdicts.filter(isSourceabilityClaimVerdict),
              });
            }
          } catch {
            // Ignore malformed custom stream payloads; text stream remains primary.
          }
          return;
        }
        if (line.startsWith('3:')) {
          appendAssistantText('\n\nAsk PRAXIS stream failed before completion.');
        }
      };

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...priorMessages, userMessage].map((message) => ({
              role: message.role,
              content: message.content,
            })),
            situation: !demoMode && activeSituation ? activeSituation : undefined,
            conflictContext: activeSituation?.name || undefined,
            currentToolId,
            currentPath,
            capsuleId: askStack.capsuleId ?? undefined,
            threadId: conversationThreadId,
            contextPackageId: askStack.contextPackageId ?? undefined,
            activeContextStack: askStack,
            aiSettings: {
              provider: 'vertex',
              model: DEFAULT_MODEL_PREFERENCE,
              analysisDepth: 'standard',
            },
            turnMetadata: {
              capsuleId: askStack.capsuleId,
              requestedOutputTarget: askStack.outputGoal,
              activeCapsules: askStack.capsuleRefs.map((ref) => ({
                id: ref.capsuleId,
                label: ref.label ?? ref.capsuleId,
                role: ref.role,
              })),
              conversationId: conversationThreadId,
              currentPath: currentPath ?? '/app',
              promptPreview: text.slice(0, 500),
            },
          }),
        });

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => null) as { error?: string; code?: string } | null;
          updateAssistant({
            content: payload?.error ?? `Ask PRAXIS could not start (${response.status}).`,
          });
          setError(payload?.code === 'capsule_context_required' ? 'Add context or try a direct question again.' : null);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() ?? '';
          for (const line of lines) consumeDataLine(line.trimEnd());
        }
        if (lineBuffer.trim()) consumeDataLine(lineBuffer.trimEnd());
      } catch {
        updateAssistant({ content: 'Network error. Please check the connection and try again.' });
      } finally {
        setIsStreaming(false);
      }

      const intent = await intentPromise;
      if (isProfileMutationIntent(intent)) {
        updateAssistant({
          proposal: {
            summary: intent.humanSummary,
            patch: intent.patch,
          },
        });
      }

      setMessages((prev) => prev.map((message) => (
        message.id === assistantId && message.role === 'assistant'
          ? { ...message, availableActions: inferResponseActionKinds(message.content) }
          : message
      )));
    },
    [
      activeSituation,
      conversationThreadId,
      currentPath,
      currentToolId,
      demoMode,
      isPublic,
      isStreaming,
      router,
      stack,
    ],
  );

  useEffect(() => {
    if (!autoSendNonce || isPublic || isStreaming) return;
    const text = input.trim();
    if (text) void sendWithText(text);
  }, [autoSendNonce, input, isPublic, isStreaming, sendWithText]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendWithText(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void sendWithText(input);
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    if (typeof window !== 'undefined') window.localStorage.removeItem(localStorageKey);
  };

  return (
    <section
      className={cn(
        'mx-auto flex w-full flex-col',
        compact ? 'h-full max-w-none' : 'max-w-3xl',
        className,
      )}
      data-testid="simple-home-chat"
    >
      <div className={cn('flex min-h-0 flex-1 flex-col', compact ? 'h-full' : '')}>
        {variant === 'home' ? (
          <div className="mb-6 text-center">
            <p className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-emerald-500/25 bg-white px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Ask PRAXIS
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-normal text-[color:var(--color-app-text)] sm:text-5xl">
              Turn any policy question into a sourced, citable brief.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[color:var(--color-app-text-secondary)]">
              {greeting ?? 'Ask normally. Add sources or saved context when the work needs to hold up.'}
            </p>
            <p className="mx-auto mt-2 max-w-2xl font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Every claim has a receipt <span aria-hidden className="text-emerald-600">·</span> every judgment has an author
            </p>
          </div>
        ) : null}

        <div className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          variant === 'floating' ? 'px-3 py-3' : 'rounded-[var(--radius-lg)] border border-[var(--color-app-border)] bg-white/80 p-3 shadow-[var(--shadow-card)]',
        )}>
          {messages.length === 0 ? (
            <div className={cn('grid place-items-center text-center', variant === 'floating' ? 'min-h-48 text-white' : 'min-h-40 text-slate-700')}>
              <div>
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-emerald-500/10 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className={cn('mt-3 text-sm font-semibold', variant === 'floating' ? 'text-white' : 'text-slate-950')}>
                  {isPublic ? 'Start with the question.' : 'Ready for the next serious question.'}
                </p>
                <p className={cn('mt-1 text-xs leading-5', variant === 'floating' ? 'text-slate-300' : 'text-slate-500')}>
                  {isPublic ? 'Sign in after you ask; PRAXIS carries the draft forward.' : 'Answers can show sources, gaps, and draft-ready next steps.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  activeSituation={activeSituation}
                  isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                  variant={variant}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {showExamples ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Example policy missions">
            {POLICY_MISSION_EXAMPLES.map((mission) => (
              <button
                key={mission.title}
                type="button"
                onClick={() => {
                  setInput(mission.prompt);
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, mission.prompt);
                  }
                }}
                className="rounded-[var(--radius-md)] border border-[var(--color-app-border)] bg-white px-3 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-[color:var(--color-archive-paper-strong)] hover:shadow-[0_4px_14px_rgba(16,185,129,0.12)]"
              >
                <span className="block font-semibold text-slate-950">{mission.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{mission.outcome}</span>
              </button>
            ))}
          </div>
        ) : null}

        {contextBar ? <div className="mt-3">{contextBar}</div> : null}

        <form onSubmit={submit} className={cn(
          'mt-3 rounded-[var(--radius-lg)] border bg-white p-2 shadow-[var(--shadow-card)]',
          variant === 'floating' ? 'border-slate-700 bg-slate-950 shadow-none' : 'border-[var(--color-app-border)]',
        )}>
          <input type="hidden" name="capsulePrompt" value={input} />
          <label className="sr-only" htmlFor={`praxis-chat-input-${variant}`}>Ask PRAXIS</label>
          <textarea
            ref={inputRef}
            id={`praxis-chat-input-${variant}`}
            name="capsulePrompt"
            data-testid="marketing-hero-prompt"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            rows={compact ? 2 : 4}
            className={cn(
              'w-full resize-none rounded-[var(--radius-md)] border px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-emerald-500',
              variant === 'floating'
                ? 'border-slate-700 bg-slate-900 text-white'
                : 'border-transparent bg-[color:var(--color-archive-paper-strong)] text-slate-950',
            )}
            placeholder={promptPlaceholder}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {onToggleContext ? (
                <button
                  type="button"
                  data-testid="context-toggle"
                  onClick={onToggleContext}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-xs font-semibold',
                    contextOpen
                      ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-800'
                      : 'border-[var(--color-app-border)] bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {contextLabel}
                </button>
              ) : null}
              {messages.length ? (
                <button
                  type="button"
                  onClick={clearChat}
                  className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-app-border)] bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear
                </button>
              ) : null}
              {error ? <span className="text-xs font-medium text-amber-700">{error}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Link
                  href="/login"
                  data-testid="public-sign-in-affordance"
                  className="hidden min-h-10 items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-slate-600 hover:text-slate-950 sm:inline-flex"
                >
                  Sign in
                </Link>
              ) : null}
              <button
                type="submit"
                data-testid="marketing-primary-cta"
                disabled={!input.trim() || isStreaming}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition',
                  input.trim() && !isStreaming
                    ? 'bg-emerald-700 text-white shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:bg-emerald-600'
                    : 'bg-slate-200 text-slate-500',
                )}
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                {isPublic ? 'Continue' : 'Ask PRAXIS'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

function ChatBubble({
  activeSituation,
  isStreaming,
  message,
  variant,
}: {
  activeSituation?: Situation | null;
  isStreaming: boolean;
  message: ChatMessage;
  variant: 'home' | 'floating';
}) {
  const isAssistant = message.role === 'assistant';
  return (
    <article className={cn(
      'max-w-[92%] rounded-[var(--radius-lg)] px-4 py-3 text-sm leading-6',
      isAssistant
        ? variant === 'floating'
          ? 'mr-auto bg-slate-900 text-slate-100'
          : 'mr-auto border border-slate-200 bg-white text-slate-800'
        : 'ml-auto bg-slate-950 text-white',
    )}>
      {isAssistant ? (
        <>
          <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || ' '}
            </ReactMarkdown>
            {isStreaming ? <span className="inline-block h-3 w-0.5 animate-pulse bg-emerald-500" /> : null}
          </div>
          <AnswerContextProvenanceChips envelope={message.answerEnvelope} variant={variant === 'floating' ? 'dark' : 'light'} />
          {message.sourceabilityVerdicts?.length ? <VerdictStrip verdicts={message.sourceabilityVerdicts} /> : null}
          {message.answerEnvelope?.sourceCards?.length ? <SourceCards sourceCards={message.answerEnvelope.sourceCards} /> : null}
          {message.proposal ? (
            <MutationConfirmCard summary={message.proposal.summary} patch={message.proposal.patch} />
          ) : null}
          {!isStreaming && message.content.trim() ? (
            <ResponseActions message={message} situation={activeSituation} question={message.question} />
          ) : null}
        </>
      ) : (
        <p>{message.content}</p>
      )}
    </article>
  );
}

function SourceCards({ sourceCards }: { sourceCards: SourcePreviewCard[] }) {
  return (
    <div className="mt-3 grid gap-2" data-testid="praxis-chat-source-cards">
      {sourceCards.slice(0, 4).map((source) => (
        <a
          key={source.id}
          href={source.url ?? source.sourceReceiptHref ?? '#'}
          target={source.url || source.sourceReceiptHref ? '_blank' : undefined}
          rel={source.url || source.sourceReceiptHref ? 'noreferrer' : undefined}
          className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-white"
        >
          <span className="flex items-center justify-between gap-2 font-semibold text-slate-900">
            <span className="truncate">{source.title || source.label}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </span>
          <span className="mt-1 line-clamp-2 block leading-5">{source.quotePreview}</span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            {source.sourceType} · {Math.round(source.confidence * 100)}%
          </span>
        </a>
      ))}
    </div>
  );
}

function VerdictStrip({ verdicts }: { verdicts: SourceabilityClaimVerdict[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5" data-testid="praxis-chat-sourceability-verdicts">
      {verdicts.slice(0, 6).map((verdict) => (
        <span
          key={verdict.claimId}
          className={cn(
            'rounded-[var(--radius-full)] border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
            verdict.verdict === 'supported' ? 'border-[color:var(--color-gold-500)]/35 bg-[color:var(--color-gold-500)]/10 text-[color:var(--color-gold-800)]' : '',
            verdict.verdict === 'weak' ? 'border-amber-200 bg-amber-50 text-amber-800' : '',
            verdict.verdict === 'contradicted' ? 'border-red-200 bg-red-50 text-red-800' : '',
            verdict.verdict === 'unsupported' ? 'border-slate-200 bg-slate-100 text-slate-600' : '',
          )}
          title={verdict.claim}
        >
          {verdict.verdict}
        </span>
      ))}
    </div>
  );
}

function stackForAsk(stack: ActiveContextStackState, prompt: string): ActiveContextStackState {
  if (hasContextSignal(stack)) return stack;
  const outputBlock: ActiveContextBlockItem = {
    id: 'direct-ask',
    capsuleId: null,
    label: 'Direct PRAXIS answer',
    role: 'output',
    primary: true,
    order: 0,
  };
  return {
    ...stack,
    outputGoal: 'Direct PRAXIS answer',
    evidenceGaps: [
      ...stack.evidenceGaps,
      {
        id: `home-gap-${Date.now().toString(36)}`,
        situationId: null,
        subjectId: 'home-direct-ask',
        claimId: 'home-direct-ask',
        claim: `User asked without saved context: ${prompt.slice(0, 160)}`,
        status: 'unsupported' as const,
        sourceHints: [],
        savedAt: new Date().toISOString(),
        resolvedAt: null,
      },
    ].slice(-5),
    contextBlocks: {
      ...stack.contextBlocks,
      output: [outputBlock],
    },
    updatedAt: new Date().toISOString(),
  };
}

function hasContextSignal(stack: ActiveContextStackState): boolean {
  return Boolean(
    stack.capsuleId ||
    stack.capsuleRefs.length ||
    stack.contextPackageId ||
    stack.userModelId ||
    stack.situationId ||
    stack.sourceIds.length ||
    stack.documentIds.length ||
    stack.evidenceGaps.length ||
    stack.outputGoal,
  );
}

function isSourceabilityClaimVerdict(input: unknown): input is SourceabilityClaimVerdict {
  return isRecord(input)
    && typeof input.claimId === 'string'
    && typeof input.claim === 'string'
    && (input.verdict === 'supported' || input.verdict === 'weak' || input.verdict === 'contradicted' || input.verdict === 'unsupported');
}

function isProfileMutationIntent(input: unknown): input is { humanSummary: string; patch: MutationPatch } {
  return isRecord(input)
    && input.intent === 'profile.mutation'
    && typeof input.humanSummary === 'string'
    && isRecord(input.patch);
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === 'object' && !Array.isArray(input);
}
