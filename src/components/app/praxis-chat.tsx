'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  ExternalLink,
  FileOutput,
  Loader2,
  Plus,
  RotateCcw,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { MutationConfirmCard, type MutationPatch } from '@/components/assistant/mutation-confirm-card';
import { ResponseActions } from '@/components/assistant/response-actions';
import { AnswerContextProvenanceChips } from '@/components/ask/AnswerContextProvenanceChips';
import { CompactRunTimeline } from '@/components/runs/compact-run-timeline';
import { SourceTierBadge } from '@/components/source/SourceTierBadge';
import { EmptyState } from '@/components/ui/empty-state';
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
  const [deepResearch, setDeepResearch] = useState(false);
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
              analysisDepth: deepResearch ? 'deep' : 'standard',
            },
            turnMetadata: {
              selectedAgentId: deepResearch ? 'research-memo' : undefined,
              capsuleId: askStack.capsuleId,
              requestedOutputTarget: askStack.outputGoal,
              analysisDepth: deepResearch ? 'deep' : 'standard',
              toggles: {
                deepResearch,
              },
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
      deepResearch,
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

  const exportMessageToEditor = useCallback(async (message: ChatMessage): Promise<string | null> => {
    const pack = message.answerEnvelope?.documentPackCandidate;
    if (!pack) return null;
    const response = await fetch('/api/memos/from-ask-pack', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pack,
        situationId: activeSituation?.id ?? activeCapsuleId ?? 'ask-praxis',
        askTurnId: message.id,
        outputTarget: pack.provenance?.outputTarget && pack.provenance.outputTarget !== 'ask-response'
          ? pack.provenance.outputTarget
          : 'policy-memo',
      }),
    });
    if (!response.ok) throw new Error(`Export failed (${response.status})`);
    const payload = await response.json() as { href?: string; memoId?: string };
    return payload.href ?? (payload.memoId ? `/app/write?memoId=${encodeURIComponent(payload.memoId)}` : null);
  }, [activeCapsuleId, activeSituation?.id]);

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
              Write trusted knowledge products.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[color:var(--color-app-text-secondary)]">
              {greeting ?? 'Capsules keep the context clear.'}
            </p>
          </div>
        ) : null}

        {contextBar ? <div className="mb-3">{contextBar}</div> : null}

        <div className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          variant === 'floating' ? 'px-3 py-3' : 'rounded-[var(--radius-lg)] border border-[var(--color-app-border)] bg-white/80 p-3 shadow-[var(--shadow-card)]',
        )}>
          {messages.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              label={isPublic ? 'Ask first.' : 'Ready for the next serious question.'}
              hint={isPublic ? 'Sign in to keep the brief.' : 'Answers can show sources, gaps, and draft-ready next steps.'}
              testId="praxis-chat-empty-state"
              className={cn('border-emerald-100', variant === 'floating' ? 'min-h-48 bg-slate-900 text-white' : 'min-h-40')}
            />
          ) : (
            <div className="grid gap-3">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  activeSituation={activeSituation}
                  isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                  onExportToEditor={isPublic ? undefined : exportMessageToEditor}
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
                type="button"
                data-testid="praxis-chat-deep-research-toggle"
                aria-pressed={deepResearch}
                onClick={() => setDeepResearch((value) => !value)}
                title="Multi-step sourced research — runs as a reviewable agent run"
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition',
                  deepResearch
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-400/60',
                )}
              >
                <Sparkles className="h-4 w-4" />
                Deep research
              </button>
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
  onExportToEditor,
  variant,
}: {
  activeSituation?: Situation | null;
  isStreaming: boolean;
  message: ChatMessage;
  onExportToEditor?: (message: ChatMessage) => Promise<string | null>;
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
          <AnswerAgentActivity envelope={message.answerEnvelope} isStreaming={isStreaming} variant={variant} />
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ResponseActions message={message} situation={activeSituation} question={message.question} />
              {onExportToEditor && message.answerEnvelope?.documentPackCandidate ? (
                <ExportToEditorButton message={message} onExportToEditor={onExportToEditor} variant={variant} />
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <p>{message.content}</p>
      )}
    </article>
  );
}

/**
 * PRAXIS augmented-generation activity strip: shows the triage decision, the
 * routed policy agent, and the durable run status so the user can see what is
 * happening and which agent is doing the work.
 */
function AnswerAgentActivity({
  envelope,
  isStreaming,
  variant,
}: {
  envelope?: AskAnswerEnvelope;
  isStreaming: boolean;
  variant: 'home' | 'floating';
}) {
  const receipt = envelope?.orchestrationReceipt;
  const [receiptOpen, setReceiptOpen] = useState(false);
  if (!receipt) {
    if (!isStreaming) return null;
    return (
      <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400" data-testid="praxis-chat-agent-activity">
        <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
        Triaging question and reading attached context
      </p>
    );
  }
  const dark = variant === 'floating';
  const queuedRun = receipt.supervisor?.queuedRun ?? null;
  const agentLabel = labelizeAgentId(receipt.supervisor?.policyAgentId ?? receipt.triage?.policyAgentId ?? null);
  const directAnswer = receipt.supervisor?.action !== 'queue_agent_run';
  return (
    <div className="mb-2" data-testid="praxis-chat-agent-activity">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          data-testid="orchestration-receipt-trigger"
          onClick={() => setReceiptOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition',
            dark ? 'border-slate-700 text-slate-300 hover:border-emerald-400/50' : 'border-emerald-500/30 bg-emerald-50/60 text-emerald-800 hover:border-emerald-500/70',
          )}
          title="Open orchestration receipt"
        >
          <Bot className="h-3 w-3" />
          {directAnswer ? 'Direct answer with receipts' : 'Agent run queued'}
        </button>
        {agentLabel ? (
          <span className={cn(
            'inline-flex items-center rounded-[var(--radius-full)] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]',
            dark ? 'border-slate-700 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600',
          )}>
            {agentLabel}
          </span>
        ) : null}
        {queuedRun?.runId ? (
          <Link
            href={`/agents/${encodeURIComponent(queuedRun.runId)}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-[var(--radius-full)] border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition',
              dark
                ? 'border-cyan-400/40 text-cyan-200 hover:border-cyan-300'
                : 'border-cyan-500/40 bg-cyan-50 text-cyan-800 hover:border-cyan-500',
            )}
            title="Open the live run workspace: timeline, tool calls, approvals"
          >
          {queuedRun.status === 'dispatch_enqueued' || queuedRun.status === 'queued' ? 'Run in progress' : `Run ${queuedRun.status.replace(/_/g, ' ')}`}
            <ExternalLink className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
      {queuedRun?.runId && queuedRun.runId !== 'unavailable' ? (
        <CompactRunTimeline runId={queuedRun.runId} />
      ) : null}
      {receiptOpen ? <OrchestrationReceiptDrawer receipt={receipt} onClose={() => setReceiptOpen(false)} /> : null}
    </div>
  );
}

function OrchestrationReceiptDrawer({
  onClose,
  receipt,
}: {
  onClose: () => void;
  receipt: NonNullable<AskAnswerEnvelope['orchestrationReceipt']>;
}) {
  const sections = [
    ['triage', receipt.triage],
    ['capsule', receipt.capsule],
    ['tools', receipt.toolRouting],
    ['grounding', receipt.grounding],
    ['model', receipt.routingDecision],
    ['language', receipt.languagePolicyReview],
    ['supervisor', receipt.supervisor],
  ] as const;
  const sectionTestIds = {
    triage: 'orchestration-receipt-triage',
    capsule: 'orchestration-receipt-capsule',
    tools: 'orchestration-receipt-tools',
    grounding: 'orchestration-receipt-grounding',
    model: 'orchestration-receipt-model',
    language: 'orchestration-receipt-language',
    supervisor: 'orchestration-receipt-supervisor',
  } as const;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" data-testid="orchestration-receipt-drawer">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close orchestration receipt backdrop"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-[min(520px,100vw)] flex-col border-l border-emerald-500/30 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">PRAXIS augmented generation</p>
            <h2 className="mt-1 text-sm font-semibold text-slate-950">Orchestration receipt</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-slate-200 text-slate-600 hover:border-emerald-500/50"
            aria-label="Close orchestration receipt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {sections.map(([label, value]) => (
            <section key={label} data-testid={sectionTestIds[label]} className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">{label}</p>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-white p-2 font-mono text-[11px] leading-5 text-slate-700">
                {JSON.stringify(value, null, 2)}
              </pre>
            </section>
          ))}
          <section data-testid="orchestration-receipt-full" className="rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-50/50 p-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">full receipt</p>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-white p-2 font-mono text-[11px] leading-5 text-slate-700">
              {JSON.stringify(receipt, null, 2)}
            </pre>
          </section>
        </div>
      </aside>
    </div>
  );
}

function ExportToEditorButton({
  message,
  onExportToEditor,
  variant,
}: {
  message: ChatMessage;
  onExportToEditor: (message: ChatMessage) => Promise<string | null>;
  variant: 'home' | 'floating';
}) {
  const [phase, setPhase] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [href, setHref] = useState<string | null>(null);
  const dark = variant === 'floating';

  async function run() {
    setPhase('saving');
    try {
      const result = await onExportToEditor(message);
      setHref(result);
      setPhase(result ? 'done' : 'error');
    } catch {
      setPhase('error');
    }
  }

  if (phase === 'done' && href) {
    return (
      <Link
        href={href}
        data-testid="praxis-chat-open-editor"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-emerald-700 px-2.5 text-xs font-semibold text-white hover:bg-emerald-600"
      >
        <FileOutput className="h-3.5 w-3.5" />
        Open in Editor
      </Link>
    );
  }

  return (
    <button
      type="button"
      data-testid="praxis-chat-export-editor"
      onClick={() => void run()}
      disabled={phase === 'saving'}
      title="Save this answer as an editable document with citations, sourceability checks, and export formatting"
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition disabled:opacity-60',
        dark
          ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-400/50'
          : 'border-emerald-500/40 bg-white text-emerald-800 hover:bg-emerald-50',
      )}
    >
      {phase === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileOutput className="h-3.5 w-3.5" />}
      {phase === 'error' ? 'Retry export' : 'Export to Editor'}
    </button>
  );
}

function labelizeAgentId(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
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
            <span className="flex shrink-0 items-center gap-1">
              <SourceTierBadge tier={source.reliabilityTier ?? null} date={source.date ?? null} stale={source.stale ?? null} size="xs" />
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </span>
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
            verdict.verdict === 'supported' ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800' : '',
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
