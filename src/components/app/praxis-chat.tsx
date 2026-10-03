'use client';

import Link from 'next/link';
import { JevReviewControl } from '@/components/app/jev-review-control';
import { useAuth } from '@/lib/auth/auth-context';
import { saveConversationCapsuleHandoff } from '@/lib/context/conversation-capsule-handoff';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  Boxes,
  CheckCircle2,
  ExternalLink,
  FileOutput,
  Loader2,
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
  askChatCacheKey,
  loadAskChatCache,
  persistAskChatCache,
  scopedAskChatDraft,
  scopedAskChatMessages,
  updateAskChatCache,
  type AskChatCacheState,
} from '@/lib/ai/ask-chat-cache';
import {
  defaultActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import { saveQuestionHandoff, pendingQuestionHandoff, claimQuestionHandoff, consumeQuestionHandoff, readPublicQuestionHandoff } from '@/lib/auth/question-handoff';
import { readAskDraft, saveAskDraft } from '@/lib/auth/ask-draft';
import { POLICY_MISSION_EXAMPLES } from '@/lib/product/policy-missions';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { DIRECT_ASK_HISTORY_CAPSULE_ID } from '@/lib/ai/ask-conversation';
import { describeAskFailure, parseDataStreamError } from '@/lib/ai/tasklet-stream';
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
  onboardingRecoveryPrompt?: string;
};

export interface PraxisChatProps {
  mode: 'public' | 'authenticated';
  activeContextStack?: ActiveContextStackState | null;
  activeSituation?: Situation | null;
  contextReady?: boolean;
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
  questionHandoffId?: string;
  onToggleContext?: () => void;
  storageKey?: string;
  showHomeHeading?: boolean;
  threadId?: string;
  variant?: 'home' | 'floating';
}

export function PraxisChat({
  mode,
  activeContextStack,
  activeSituation,
  contextReady = true,
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
  questionHandoffId,
  onToggleContext,
  storageKey,
  showHomeHeading = true,
  threadId,
  variant = 'home',
}: PraxisChatProps) {
  const router = useRouter();
  const { user } = useAuth();
  const stack = useMemo(() => activeContextStack ?? defaultActiveContextStack(), [activeContextStack]);
  const activeCapsuleId = stack.capsuleRefs[0]?.capsuleId ?? stack.capsuleId ?? activeSituation?.id ?? null;
  const conversationThreadId = threadId ?? `home-${activeCapsuleId ?? stack.contextPackageId ?? stack.userModelId ?? 'direct'}`;
  const draftOwnerScope = mode === 'public' ? 'public' : `authenticated:${user?.id ?? 'pending'}:${conversationThreadId}`;
  const [draft, setDraft] = useState({ ownerScope: draftOwnerScope, text: initialPrompt });
  const input = scopedAskChatDraft(draft, draftOwnerScope);
  const currentDraft = useRef(draft);
  currentDraft.current = draft;
  const setInput = useCallback((text: string) => {
    currentDraft.current = { ownerScope: draftOwnerScope, text };
    setDraft(currentDraft.current);
    if (mode === 'authenticated' && user?.id) {
      try { saveAskDraft(window.sessionStorage, user.id, conversationThreadId, text); }
      catch { setError('Tab recovery is unavailable. Keep this page open until your question is saved.'); }
    }
  }, [conversationThreadId, draftOwnerScope, mode, user?.id]);
  const [messageCache, setMessageCache] = useState<AskChatCacheState<ChatMessage>>({ cacheKey: null, messages: [] });
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<{ id: string; owner: string } | null>(null);
  const navigatingToLogin = useRef(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const consumedAutoSendNonce = useRef(0);
  const locallyEdited = useRef(false);
  const localStorageKey = askChatCacheKey({ mode, ownerId: user?.id, capsuleId: activeCapsuleId, threadId: conversationThreadId, namespace: storageKey });
  const messages = useMemo(() => scopedAskChatMessages(messageCache, localStorageKey), [messageCache, localStorageKey]);
  const messagesRef = useRef(messages);
  const cacheReady = Boolean(localStorageKey && messageCache.cacheKey === localStorageKey);
  const setMessages = useCallback((update: ChatMessage[] | ((previous: ChatMessage[]) => ChatMessage[])) => {
    setMessageCache((previous) => updateAskChatCache(previous, localStorageKey, update));
  }, [localStorageKey]);
  const isPublic = mode === 'public';
  const showExamples = variant === 'home' && messages.length === 0;
  const promptPlaceholder = isPublic
    ? 'What would you like to understand or write?'
    : 'Ask a question, compare the evidence, or draft a brief…';

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let recovered: string | null = null;
    if (mode === 'authenticated' && user?.id) {
      try { recovered = readAskDraft(window.sessionStorage, user.id, conversationThreadId); } catch { /* Current draft remains editable. */ }
    }
    if (mode === 'public' && !user && !initialPrompt) {
      try { recovered = readPublicQuestionHandoff(window.sessionStorage); } catch { /* Keep the visible question when storage is blocked. */ }
    }
    setDraft({ ownerScope: draftOwnerScope, text: recovered ?? initialPrompt });
  }, [conversationThreadId, draftOwnerScope, initialPrompt, mode, user?.id]);

  useEffect(() => {
    setPendingQuestion(null);
    if (isPublic || !user?.id || !questionHandoffId) return;
    try {
      if (pendingQuestionHandoff(window.sessionStorage, questionHandoffId, user.id, Date.now(), currentPath ?? '/app')) setPendingQuestion({ id: questionHandoffId, owner: user.id });
      else setError('The saved question has expired or is unavailable in this tab for this account.');
    } catch { setError('Tab storage is unavailable. Your current question has not been changed.'); }
  }, [currentPath, isPublic, questionHandoffId, user?.id]);

  const restoreQuestion = () => {
    if (!pendingQuestion || pendingQuestion.owner !== user?.id || input.trim()) return;
    try {
      const record = claimQuestionHandoff(window.sessionStorage, pendingQuestion.id, user.id, Date.now(), currentPath ?? '/app');
      if (record) { setInput(record.text); setError(null); inputRef.current?.focus(); }
      else setError('The saved question is no longer available.');
    } catch { setError('Could not restore from tab storage. Your current question has not been changed.'); }
  };
  const dismissQuestion = () => {
    if (!pendingQuestion || pendingQuestion.owner !== user?.id) return;
    try {
      if (claimQuestionHandoff(window.sessionStorage, pendingQuestion.id, user.id)) consumeQuestionHandoff(window.sessionStorage, pendingQuestion.id, user.id);
      setPendingQuestion(null);
    } catch { setError('Could not dismiss the saved question. Try again when tab storage is available.'); }
  };

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
    locallyEdited.current = false;
    messagesRef.current = [];
    setError(null);
    setIsStreaming(false);
    try {
      setMessageCache(loadAskChatCache<ChatMessage>(window.localStorage, localStorageKey));
    } catch {
      setMessageCache({ cacheKey: localStorageKey, messages: [] });
    }
    return () => activeRequestRef.current?.abort();
  }, [localStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      persistAskChatCache(window.localStorage, localStorageKey, messageCache);
    } catch {
      // Some browsers block access to the storage object itself.
    }
  }, [localStorageKey, messageCache]);

  useEffect(() => {
    if (isPublic || demoMode || !localStorageKey) return;
    let cancelled = false;
    const capsuleForHistory = activeCapsuleId ?? DIRECT_ASK_HISTORY_CAPSULE_ID;
    const params = new URLSearchParams({
      capsuleId: capsuleForHistory,
      threadId: conversationThreadId,
      limit: '30',
    });
    fetch(`/api/ai/chat?${params.toString()}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((history: { turns?: Array<{ id: string; prompt: string; output: string; runtime?: { answerEnvelope?: AskAnswerEnvelope } }> } | null) => {
        if (cancelled || locallyEdited.current || !history?.turns?.length) return;
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
  }, [activeCapsuleId, conversationThreadId, demoMode, isPublic, localStorageKey, setMessages]);

  const sendWithText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (isStreaming || !contextReady || !cacheReady || !text) return;
      setError(null);

      if (isPublic) {
        if (navigatingToLogin.current) return;
        try {
          const handoff = saveQuestionHandoff(window.sessionStorage, { text, target: '/app', ...(user?.id ? { ownerUid: user.id } : {}) });
          navigatingToLogin.current = true;
          router.push(handoff.loginUrl);
        } catch {
          navigatingToLogin.current = false;
          setError('Your question is still here. Enable tab storage to carry it through sign-in, or sign in and paste it yourself.');
        }
        return;
      }

      // A late history response must never replace turns submitted in this session.
      locallyEdited.current = true;
      const askStack = stack;
      const assistantId = `assistant-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
      };
      const priorMessages = messagesRef.current;
      const requestController = new AbortController();
      activeRequestRef.current = requestController;
      const restoreFailedPrompt = () => {
        if (!requestController.signal.aborted && currentDraft.current.ownerScope === draftOwnerScope && !currentDraft.current.text.trim()) {
          setInput(text);
        }
      };

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
        signal: requestController.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);

      const appendAssistantText = (token: string) => {
        if (!token || requestController.signal.aborted) return;
        setMessages((prev) => prev.map((message) => (
          message.id === assistantId
            ? { ...message, content: `${message.content}${token}` }
            : message
        )));
      };

      const updateAssistant = (patch: Partial<ChatMessage>) => {
        if (requestController.signal.aborted) return;
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
          const streamError = parseDataStreamError(line) ?? 'Ask PRAXIS stream failed before completion.';
          restoreFailedPrompt();
          appendAssistantText(`\n\n${describeAskFailure(streamError)}`);
        }
      };

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: requestController.signal,
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
          restoreFailedPrompt();
          const payload = await response.json().catch(() => null) as { error?: string; code?: string; message?: string; redirectTo?: string } | null;
          if (response.status === 403 && (payload?.code === 'onboarding_required' || payload?.redirectTo === '/onboarding')) {
            updateAssistant({
              content: payload?.message ?? 'Complete your analyst profile to personalise PRAXIS, or continue without onboarding for this turn.',
              onboardingRecoveryPrompt: text,
            });
            setError(null);
            return;
          }
          updateAssistant({
            content: payload?.message ?? payload?.error ?? `Ask PRAXIS could not start (${response.status}).`,
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
        if (!requestController.signal.aborted) window.dispatchEvent(new CustomEvent('praxis-conversation-updated'));
      } catch {
        restoreFailedPrompt();
        updateAssistant({ content: 'Network error. Please check the connection and try again.' });
      } finally {
        if (!requestController.signal.aborted) setIsStreaming(false);
      }

      const intent = await intentPromise;
      if (requestController.signal.aborted) return;
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
      cacheReady,
      conversationThreadId,
      currentPath,
      contextReady,
      currentToolId,
      draftOwnerScope,
      demoMode,
      deepResearch,
      isPublic,
      isStreaming,
      router,
      setInput,
      setMessages,
      stack,
      user?.id,
    ],
  );

  useEffect(() => {
    if (!autoSendNonce || autoSendNonce === consumedAutoSendNonce.current || isPublic || isStreaming || !contextReady || !cacheReady) return;
    const text = input.trim();
    if (!text) return;
    // One automatic submission per request; restored failures wait for a user retry.
    consumedAutoSendNonce.current = autoSendNonce;
    void sendWithText(text);
  }, [autoSendNonce, cacheReady, contextReady, input, isPublic, isStreaming, sendWithText]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendWithText(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void sendWithText(input);
  };

  const clearChat = () => {
    locallyEdited.current = true;
    setMessages([]);
    setInput('');
    if (typeof window !== 'undefined' && localStorageKey) window.localStorage.removeItem(localStorageKey);
  };

  const continueWithoutOnboarding = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setError(null);
    try {
      const res = await fetch('/api/onboarding/skip', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        setError('Could not skip onboarding. Open onboarding or try again.');
        return;
      }
      setMessages((prev) => prev.filter((message) => !message.onboardingRecoveryPrompt));
      messagesRef.current = messagesRef.current.filter((message) => !message.onboardingRecoveryPrompt);
      await sendWithText(prompt);
    } catch {
      setError('Network error while skipping onboarding.');
    }
  }, [sendWithText, setMessages]);

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
        'mx-auto flex min-w-0 w-full flex-col',
        compact ? 'h-full max-w-none' : 'max-w-3xl',
        className,
      )}
      data-testid="simple-home-chat"
    >
      <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', compact ? 'h-full' : '')}>
        {variant === 'home' && showHomeHeading ? (
          <div className={cn('order-first mb-6 text-center', messages.length ? 'sr-only' : 'sm:pb-2')}>
            <h1 className="praxis-page-heading text-balance">
              {isPublic ? 'Policy analysis you can inspect.' : 'What are we working on?'}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[color:var(--color-app-text-secondary)]">
              {isPublic ? 'Ask a hard question. Bring your sources and methods. Review the evidence, assumptions and options.' : greeting ?? 'Start with a question. Bring your context when it helps.'}
            </p>
          </div>
        ) : null}

        <div className={cn(
          'min-h-0 min-w-0 flex-1 overflow-y-auto',
          variant === 'home' && messages.length === 0 ? 'hidden' : '',
          variant === 'floating' ? 'px-3 py-3' : 'praxis-conversation-surface px-1 py-4 sm:px-3',
        )}>
          {messages.length === 0 ? (
            <div>
              <EmptyState
                icon={ShieldCheck}
                label="Ask a question"
                hint={isPublic ? 'Sign in to save your work.' : 'Attach a capsule to reuse saved sources and background.'}
                testId="praxis-chat-empty-state"
                className={cn('border-emerald-100', variant === 'floating' ? 'min-h-48 bg-slate-900 text-white' : 'min-h-40')}
              />
              <div className="mt-3 flex justify-center">
                <Link
                  href={isPublic ? '/login?mode=signup&redirect=%2Fapp%2Fcapsules%3Flane%3Drepository' : '/app/capsules?lane=repository'}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-xs font-semibold',
                    variant === 'floating' ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-emerald-400/50' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <Boxes className="h-3.5 w-3.5" />
                  Pick capsule
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  activeSituation={activeSituation}
                  isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                  onExportToEditor={isPublic ? undefined : exportMessageToEditor}
                  onContinueWithoutOnboarding={continueWithoutOnboarding}
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
                  inputRef.current?.focus();
                }}
                className="praxis-prompt-suggestion min-h-11 rounded-lg px-3 py-3 text-left text-sm transition"
              >
                <span className="block font-semibold text-slate-950">{mission.title}</span>
              </button>
            ))}
          </div>
        ) : null}

        {pendingQuestion && pendingQuestion.owner === user?.id ? <aside className="mt-3 rounded-lg border p-3 text-sm" aria-label="Saved question recovery">
          <p>A question is saved in this tab for {user?.email ?? 'this account'}. Restore it only if it belongs in this workspace. It expires after 30 minutes.</p>
          {input.trim() ? <p>Keep or clear your current draft before restoring; recovery will not replace it.</p> : null}
          <button type="button" disabled={Boolean(input.trim()) || isStreaming} onClick={restoreQuestion} className="min-h-11 px-3 underline">Restore saved question</button>
          <button type="button" onClick={dismissQuestion} className="min-h-11 px-3 underline">Dismiss saved question</button>
        </aside> : null}
        <form method="post" onSubmit={submit} className={cn(
          'praxis-chat-composer mt-3 p-3 sm:p-4',
          isPublic || showExamples ? 'order-first mb-4' : '',
          variant === 'floating' ? 'border-slate-700 bg-slate-950 shadow-none' : 'border-[var(--color-app-border)]',
        )}>
          <label className="sr-only" htmlFor={`praxis-chat-input-${variant}`}>Ask PRAXIS</label>
          <textarea
            ref={inputRef}
            id={`praxis-chat-input-${variant}`}
            data-testid="marketing-hero-prompt"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            rows={compact ? 2 : 4}
            className={cn(
              'w-full resize-none rounded-[var(--radius-md)] border px-3 py-3 text-base leading-7 outline-none transition placeholder:text-[var(--color-app-text-secondary)]',
              variant === 'floating'
                ? 'border-slate-700 bg-slate-900 text-white'
                : 'border-transparent bg-transparent text-[var(--color-deep-ink)]',
            )}
            placeholder={promptPlaceholder}
          />
          {contextBar ? <div className="mb-3 border-t border-[var(--color-app-border)] pt-3">{contextBar}</div> : null}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!contextBar && onToggleContext ? <button type="button" data-testid="context-toggle" aria-expanded={contextOpen} onClick={onToggleContext} className="praxis-header-control px-3 text-xs">{contextLabel.replace(/^\+\s*/, '')}</button> : null}
              {!isPublic && !demoMode && (messages.length > 0 || input.trim()) ? (
                <ConversationCapsuleButton messages={messages} notes={input} threadId={conversationThreadId} capsuleId={activeCapsuleId} disabled={isStreaming || !cacheReady} onError={setError} />
              ) : null}
              {messages.length ? (
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={isStreaming}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-app-border)] bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  title="Clear this view. Saved conversations remain in the sidebar."
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear view
                </button>
              ) : null}
              {error ? <span className="text-xs font-medium text-amber-700">{error}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isPublic ? (
                <Link
                  href="/login"
                  data-testid="public-sign-in-affordance"
                  className="hidden min-h-10 items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-slate-600 hover:text-slate-950 sm:inline-flex"
                >
                  Sign in
                </Link>
              ) : null}
              <details className="relative">
                <summary className="praxis-header-control cursor-pointer px-3 text-xs font-semibold">{deepResearch ? 'Options · Research on' : 'Options'}</summary>
                <div className="absolute bottom-full right-0 z-30 mb-2 grid w-[min(18rem,calc(100vw-2rem))] gap-3 rounded-xl border border-[var(--color-app-border)] bg-white p-3 shadow-[var(--shadow-float)]">
                  {!isPublic ? <JevReviewControl /> : null}
              <button
                type="button"
                data-testid="praxis-chat-deep-research-toggle"
                aria-pressed={deepResearch}
                onClick={() => setDeepResearch((value) => !value)}
                title="Multi-step research with sources and a run history"
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
                  <p className="text-xs leading-5 text-[var(--color-app-text-secondary)]">Deep research runs a multi-step, sourced task. Review its results and receipts before use.</p>
                </div>
              </details>
              <button
                type="submit"
                data-testid="marketing-primary-cta"
                disabled={!input.trim() || isStreaming || !contextReady || !cacheReady}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition',
                  input.trim() && !isStreaming
                    ? 'bg-[var(--color-praxis-emerald-700)] text-white hover:bg-[var(--color-praxis-emerald-800)]'
                    : 'bg-slate-200 text-slate-500',
                )}
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                {isPublic ? 'Continue' : 'Ask PRAXIS'}
              </button>
            </div>
          </div>
          {isPublic ? <p className="px-2 pb-1 pt-3 text-xs leading-5 text-slate-500">Sign in to run your question and save the work. AI-generated analysis needs your review.</p> : null}
          {!isPublic ? <p className="px-1 pb-1 pt-3 text-xs leading-5 text-[var(--color-app-text-secondary)]">PRAXIS is experimental. Check sources and claims before sharing. <span className="hidden sm:inline">Shift + Enter for a new line.</span></p> : null}
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
  onContinueWithoutOnboarding,
  variant,
}: {
  activeSituation?: Situation | null;
  isStreaming: boolean;
  message: ChatMessage;
  onExportToEditor?: (message: ChatMessage) => Promise<string | null>;
  onContinueWithoutOnboarding?: (prompt: string) => Promise<void>;
  variant: 'home' | 'floating';
}) {
  const isAssistant = message.role === 'assistant';
  return (
    <article className={cn(
      'min-w-0 max-w-[92%] rounded-[var(--radius-lg)] px-4 py-3 text-sm leading-6 [overflow-wrap:anywhere]',
      isAssistant
        ? variant === 'floating'
          ? 'mr-auto bg-slate-900 text-slate-100'
          : 'mr-auto border border-slate-200 bg-white text-slate-800'
        : 'ml-auto bg-slate-950 text-white',
    )}>
      {isAssistant ? (
        <>
          <AnswerAgentActivity envelope={message.answerEnvelope} isStreaming={isStreaming} variant={variant} />
          <div className="prose prose-sm min-w-0 max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1">
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
          {message.onboardingRecoveryPrompt ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2">
              <Link
                href="/onboarding?resume=1"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete onboarding
              </Link>
              {onContinueWithoutOnboarding ? (
                <button
                  type="button"
                  onClick={() => void onContinueWithoutOnboarding(message.onboardingRecoveryPrompt ?? '')}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  Continue without onboarding
                </button>
              ) : null}
            </div>
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
            View run
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
    <div className="mt-3 grid min-w-0 grid-cols-1 gap-2" data-testid="praxis-chat-source-cards">
      {sourceCards.slice(0, 4).map((source) => (
        <a
          key={source.id}
          href={source.url ?? source.sourceReceiptHref ?? '#'}
          target={source.url || source.sourceReceiptHref ? '_blank' : undefined}
          rel={source.url || source.sourceReceiptHref ? 'noreferrer' : undefined}
          className="min-w-0 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 [overflow-wrap:anywhere] hover:bg-white"
        >
          <span className="flex min-w-0 items-center justify-between gap-2 font-semibold text-slate-900">
            <span className="min-w-0 truncate">{source.title || source.label}</span>
            <span className="flex shrink-0 items-center gap-1">
              <SourceTierBadge tier={source.reliabilityTier ?? null} date={source.date ?? null} stale={source.stale ?? null} size="xs" />
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </span>
          </span>
          <span className="mt-1 line-clamp-2 block min-w-0 leading-5 [overflow-wrap:anywhere]">{source.quotePreview}</span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            {source.sourceType.replace(/-/g, ' ')}
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

/** Auth is scoped to signed-in routes; public chat must not require its provider. */
function ConversationCapsuleButton({ messages, notes, threadId, capsuleId, disabled, onError }: {
  messages: ChatMessage[];
  notes: string;
  threadId: string;
  capsuleId: string | null;
  disabled: boolean;
  onError: (message: string) => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  if (!user?.id) return null;
  return (
    <button
      type="button"
      data-testid="chat-build-capsule"
      disabled={disabled}
      onClick={() => {
        try {
          saveConversationCapsuleHandoff(window.sessionStorage, { ownerId: user.id, messages, notes, threadId, capsuleId });
          router.push('/app/capsules/builder?from=conversation');
        } catch (failure) { onError(failure instanceof Error ? failure.message : 'Conversation could not be opened in the builder.'); }
      }}
      className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border border-emerald-700/30 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 disabled:opacity-50"
    >
      <Boxes className="h-3.5 w-3.5" /> Build capsule from conversation
    </button>
  );
}
