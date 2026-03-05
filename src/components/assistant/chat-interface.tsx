"use client";

import { useRef, useCallback } from "react";
import { useChat } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Loader2,
  Search,
  FileEdit,
  BarChart3,
  BookCheck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { MessageBubble } from "@/components/assistant/message-bubble";
import { ToolInvocation } from "@/components/assistant/tool-invocation";
import { SuggestedPrompts } from "@/components/assistant/suggested-prompts";

/* -------------------------------------------------------------------------- */
/*  Quick action bar config                                                   */
/* -------------------------------------------------------------------------- */

const QUICK_ACTIONS = [
  { icon: Search, label: "Research", prefix: "Research the latest developments regarding " },
  { icon: FileEdit, label: "Draft", prefix: "Draft a formal " },
  { icon: BarChart3, label: "Analyze", prefix: "Analyze the key factors in " },
  { icon: BookCheck, label: "Terminology", prefix: "Check the diplomatic terminology in " },
];

/* -------------------------------------------------------------------------- */
/*  Map AI SDK tool names to ToolInvocation display types                    */
/* -------------------------------------------------------------------------- */

function getToolDisplayType(toolName: string): "web-search" | "draft" | "graph-query" | "terminology-check" {
  if (toolName === "webSearch") return "web-search";
  if (toolName === "draftSection" || toolName === "editForDiplomaticTone") return "draft";
  if (toolName === "queryConflictGraph" || toolName === "analyzeDocument") return "graph-query";
  if (toolName === "checkUNTerminology") return "terminology-check";
  return "graph-query";
}

/* -------------------------------------------------------------------------- */
/*  Chat Interface Component                                                  */
/* -------------------------------------------------------------------------- */

export function ChatInterface() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput, reload } = useChat({
    api: "/api/ai/chat",
    onFinish: () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    },
  });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(e);
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    },
    [handleInputChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        handleSubmit(e as unknown as React.FormEvent);
        if (inputRef.current) inputRef.current.style.height = "auto";
        scrollToBottom();
      }
    },
    [input, isLoading, handleSubmit, scrollToBottom]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      handleSubmit(e);
      if (inputRef.current) inputRef.current.style.height = "auto";
      scrollToBottom();
    },
    [input, isLoading, handleSubmit, scrollToBottom]
  );

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      setInput(prompt);
      setTimeout(() => {
        // Submit with the selected prompt
        const form = inputRef.current?.closest("form");
        if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }, 0);
    },
    [setInput]
  );

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-700 bg-navy-900/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 border border-gold-500/20">
            <span className="text-lg font-serif font-bold text-gold-400">T</span>
          </div>
          <div>
            <h1 className="font-serif text-xl text-navy-50">Diplomatic Assistant</h1>
            <p className="text-xs text-navy-400">AI-powered analysis, drafting, and research</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-1.5 text-navy-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Welcome / empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-8"
            >
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 border border-gold-500/20">
                  <span className="text-2xl font-serif font-bold text-gold-400">T</span>
                </div>
                <h2 className="font-serif text-2xl text-navy-50 mb-2">
                  TACITUS Diplomatic Assistant
                </h2>
                <p className="text-sm text-navy-400 max-w-lg mx-auto leading-relaxed">
                  I am your AI-powered diplomatic intelligence assistant. I can help you draft
                  reports, analyze conflicts, research developments, and review diplomatic
                  communications. Powered by Gemini 2.5 Flash.
                </p>
              </div>
              <SuggestedPrompts onSelect={handlePromptSelect} />
            </motion.div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm text-crimson">
              <strong>Error:</strong> {error.message || "Something went wrong. Please try again."}
              <button
                onClick={() => reload()}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Rendered messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {/* Tool invocations for assistant messages */}
              {msg.role === "assistant" && msg.toolInvocations?.map((invocation) => (
                <ToolInvocation
                  key={invocation.toolCallId}
                  invocation={{
                    id: invocation.toolCallId,
                    type: getToolDisplayType(invocation.toolName),
                    query: (() => {
                      try {
                        const args = invocation.args as Record<string, unknown>;
                        return args?.query as string || args?.text as string || invocation.toolName;
                      } catch {
                        return invocation.toolName;
                      }
                    })(),
                    status: invocation.state === "result" ? "complete" : "running",
                    results:
                      invocation.state === "result" && invocation.result
                        ? [
                            {
                              title: `${invocation.toolName} completed`,
                              snippet:
                                typeof invocation.result === "string"
                                  ? invocation.result.slice(0, 200)
                                  : JSON.stringify(invocation.result).slice(0, 200),
                            },
                          ]
                        : undefined,
                  }}
                />
              ))}
              {msg.content && (
                <MessageBubble role={msg.role} content={msg.content} />
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/20">
                  <span className="text-sm font-serif font-bold text-gold-400">T</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-navy-800 border-l-2 border-gold-500/30 px-4 py-3">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-navy-700 bg-navy-900/50 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleFormSubmit}>
            <div className="flex items-end gap-2 rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 focus-within:border-gold-500/40 focus-within:ring-1 focus-within:ring-gold-500/20 transition-all">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-navy-400 hover:text-navy-200"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-navy-100 placeholder:text-navy-500 focus:outline-none min-h-[32px] max-h-[120px] py-1.5"
              />

              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "h-8 w-8 shrink-0 rounded-lg transition-all",
                  input.trim()
                    ? "bg-gold-500 text-navy-950 hover:bg-gold-400"
                    : "bg-navy-700 text-navy-500"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {/* Quick actions */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] text-navy-500 mr-1">Quick:</span>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setInput(action.prefix);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-navy-400",
                    "transition-colors hover:bg-navy-800 hover:text-navy-200",
                    "cursor-pointer"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
