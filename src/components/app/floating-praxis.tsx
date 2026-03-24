'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import { useAppStore } from '@/stores/app-store';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Floating Ask PRAXIS button + slide-over chat panel.
 * Available on every /app/* and /demo/* page.
 * Does NOT show on the full assistant page (to avoid duplication).
 */
export function FloatingPraxis() {
  const pathname = usePathname();
  const { activeSituation } = useSituationStore();
  const { demoMode } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('praxis-floating-chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Don't show on the full assistant page
  const isAssistantPage = pathname?.includes('/assistant');

  // Persist messages to localStorage
  useEffect(() => {
    try {
      // Keep only last 50 messages to avoid bloating storage
      const toSave = messages.slice(-50);
      localStorage.setItem('praxis-floating-chat', JSON.stringify(toSave));
    } catch {
      // localStorage may be full or unavailable
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Listen for header "Ask PRAXIS" button and keyboard shortcut
  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('open-praxis-chat', openHandler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('open-praxis-chat', openHandler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [isOpen]);

  const sendWithText = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            situation:
              !demoMode && activeSituation ? activeSituation : undefined,
            conflictContext: demoMode
              ? 'nordalia'
              : activeSituation?.name || undefined,
          }),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      'I encountered an error. Please try again or check that your AI API key is configured.',
                  }
                : m
            )
          );
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            const parsed = parseDataStreamChunk(line);
            if (parsed) {
              accumulated += parsed;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulated }
                    : m
                )
              );
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: 'Network error. Please check your connection.',
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, activeSituation, demoMode]
  );

  const sendMessage = useCallback(() => {
    sendWithText(input);
  }, [input, sendWithText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    localStorage.removeItem('praxis-floating-chat');
  };

  if (isAssistantPage) return null;

  const suggestedPrompts = activeSituation
    ? [
        `What are the latest developments in ${activeSituation.name}?`,
        `Generate a risk assessment for this situation`,
        `Who are the key actors and what are their interests?`,
      ]
    : [
        'What can PRAXIS do?',
        'How do I create my first situation?',
        'Tell me about the TACITUS platform',
      ];

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-diplomatic-blue text-white shadow-lg shadow-diplomatic-blue/25 transition-transform hover:scale-105 hover:shadow-xl active:scale-95"
            aria-label="Ask PRAXIS"
          >
            <Sparkles className="h-5 w-5 text-gold-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-over Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-navy-700 bg-navy-900 shadow-2xl md:bottom-6 md:right-6 md:top-auto md:w-[420px] md:rounded-2xl md:border md:h-[600px] md:max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-diplomatic-blue">
                    <Sparkles className="h-4 w-4 text-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-50">
                      Ask PRAXIS
                    </h3>
                    <p className="text-[10px] text-navy-400">
                      {activeSituation
                        ? activeSituation.name
                        : 'Conflict intelligence assistant'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-800 hover:text-navy-200"
                      title="Clear conversation"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-800 hover:text-navy-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-diplomatic-blue/15">
                      <Sparkles className="h-6 w-6 text-gold-400" />
                    </div>
                    <h4 className="mt-3 text-sm font-semibold text-navy-100">
                      How can PRAXIS help?
                    </h4>
                    <p className="mt-1 max-w-xs text-xs text-navy-400">
                      {activeSituation
                        ? `Ask anything about "${activeSituation.name}" — research, analysis, reports, risk assessment, or platform guidance.`
                        : 'Ask about conflict analysis, TACITUS tools, diplomatic reporting, or get help navigating the platform.'}
                    </p>
                    <div className="mt-4 space-y-1.5 w-full max-w-xs">
                      {suggestedPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendWithText(prompt)}
                          className="w-full rounded-lg border border-navy-700 px-3 py-2 text-left text-xs text-navy-300 hover:border-gold-600/40 hover:bg-navy-800 hover:text-navy-100 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-xl px-3.5 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'ml-8 bg-diplomatic-blue text-white'
                        : 'mr-4 bg-navy-800 text-navy-200'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="floating-praxis-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content || ' '}
                        </ReactMarkdown>
                        {isStreaming &&
                          msg.id === messages[messages.length - 1]?.id && (
                            <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />
                          )}
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-navy-700 px-3 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask PRAXIS anything..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-navy-600 bg-navy-800 px-3.5 py-2.5 text-sm text-navy-100 placeholder:text-navy-500 focus:border-gold-600/40 focus:outline-none focus:ring-2 focus:ring-gold-600/10"
                    style={{ maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height =
                        Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isStreaming}
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
                      input.trim() && !isStreaming
                        ? 'bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90'
                        : 'bg-navy-800 text-navy-500'
                    )}
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[9px] text-navy-500">
                  PRAXIS by TACITUS — Conflict intelligence for peace
                  professionals
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
