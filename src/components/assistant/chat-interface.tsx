"use client";

import { useRef, useCallback, useState } from "react";
import { useChat } from "@ai-sdk/react";
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
  Download,
  X,
  ChevronDown,
  Globe,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { MessageBubble } from "@/components/assistant/message-bubble";
import { ToolInvocation } from "@/components/assistant/tool-invocation";
import { SuggestedPrompts } from "@/components/assistant/suggested-prompts";

const CONFLICT_CONTEXTS = [
  { id: '', label: 'No conflict context' },
  { id: 'nordalia', label: 'Nordalia Crisis' },
  { id: 'drc', label: 'DRC / M23' },
  { id: 'sahel', label: 'Sahel Region' },
  { id: 'sudan', label: 'Sudan' },
  { id: 'yemen', label: 'Yemen' },
  { id: 'gaza', label: 'Israel/Palestine' },
  { id: 'ukraine', label: 'Ukraine' },
  { id: 'myanmar', label: 'Myanmar' },
];

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
  if (toolName === "draftSection" || toolName === "editForDiplomaticTone" || toolName === "draftResolutionLanguage") return "draft";
  if (
    toolName === "queryConflictGraph" ||
    toolName === "analyzeDocument" ||
    toolName === "escalationAssessment" ||
    toolName === "negotiationSpaceAnalysis" ||
    toolName === "narrativeEcosystemMap"
  ) return "graph-query";
  if (toolName === "checkUNTerminology") return "terminology-check";
  return "graph-query";
}

/* -------------------------------------------------------------------------- */
/*  Chat Interface Component                                                  */
/* -------------------------------------------------------------------------- */

export function ChatInterface() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedContext, setUploadedContext] = useState<{ name: string; text: string } | null>(null);
  const [conflictContext, setConflictContext] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showContextDropdown, setShowContextDropdown] = useState(false);
  // Toggle between tool-based chat and Google Search-grounded research
  const [useGroundedMode, setUseGroundedMode] = useState(false);

  const conflictLabel = CONFLICT_CONTEXTS.find((c) => c.id === conflictContext)?.label ?? '';

  // Standard tool-based chat (custom tools, no Google Search grounding)
  const toolChat = useChat({
    api: "/api/ai/chat",
    body: { conflictContext: conflictLabel || undefined },
    onFinish: () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    },
  });

  // Google Search-grounded chat (real-time web search, no custom tools)
  const groundedChat = useChat({
    api: "/api/ai/grounded-search",
    body: { conflictContext: conflictLabel || undefined },
    onFinish: () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    },
  });

  // Active chat instance based on mode toggle
  const activeChat = useGroundedMode ? groundedChat : toolChat;
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput, reload } = activeChat;

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const text = await file.text();
      const truncated = text.length > 6000 ? text.slice(0, 6000) + '\n...[truncated]' : text;
      setUploadedContext({ name: file.name, text: truncated });
    } catch {
      // ignore
    } finally {
      setIsUploading(false);
    }
  }, []);

  const exportConversation = useCallback(() => {
    if (messages.length === 0) return;
    const header = `# TACITUS Diplomatic Assistant — Conversation Export\n\n${conflictLabel ? `**Context:** ${conflictLabel}\n` : ''}**Mode:** ${useGroundedMode ? 'Live Research (Google Search)' : 'Tool-based Analysis'}\n\n---\n\n`;
    const body = messages
      .filter((m) => m.content)
      .map((m) => `### ${m.role === 'user' ? 'You' : 'TACITUS'}\n\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([header + body], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tacitus-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, conflictLabel, useGroundedMode]);

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

      // Build context prefix
      const parts: string[] = [];
      if (conflictContext) {
        parts.push(`[Conflict context: ${conflictLabel}]`);
      }
      if (uploadedContext) {
        parts.push(`[Document: ${uploadedContext.name}]\n\`\`\`\n${uploadedContext.text}\n\`\`\``);
      }

      if (parts.length > 0 && messages.length === 0) {
        // Only prepend context on first message
        const contextPrefix = parts.join('\n\n') + '\n\n';
        setInput(contextPrefix + input);
        setUploadedContext(null); // consume the document context
        setTimeout(() => {
          handleSubmit(e);
          if (inputRef.current) inputRef.current.style.height = "auto";
          scrollToBottom();
        }, 0);
      } else {
        handleSubmit(e);
        if (inputRef.current) inputRef.current.style.height = "auto";
        scrollToBottom();
      }
    },
    [input, isLoading, handleSubmit, scrollToBottom, conflictLabel, conflictContext, uploadedContext, messages.length, setInput]
  );

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      setInput(prompt);
      setTimeout(() => {
        const form = inputRef.current?.closest("form");
        if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }, 0);
    },
    [setInput]
  );

  // Clear the active conversation when toggling modes
  const handleModeToggle = useCallback(() => {
    setUseGroundedMode((prev) => !prev);
  }, []);

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
        <div className="flex items-center gap-1.5">
          {/* Live Research Mode Toggle */}
          <button
            type="button"
            onClick={handleModeToggle}
            title={useGroundedMode ? "Switch to Tool-based Analysis" : "Switch to Live Research (Google Search)"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all border",
              useGroundedMode
                ? "bg-diplomatic-blue/15 border-diplomatic-blue/30 text-diplomatic-blue hover:bg-diplomatic-blue/25"
                : "bg-navy-800 border-navy-600 text-navy-400 hover:bg-navy-700 hover:text-navy-200"
            )}
          >
            {useGroundedMode ? (
              <>
                <Globe className="h-3.5 w-3.5" />
                Live Research
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5" />
                Tool Analysis
              </>
            )}
          </button>

          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={exportConversation} className="gap-1.5 text-navy-400">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="gap-1.5 text-navy-400">
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mode Banner */}
      <AnimatePresence>
        {useGroundedMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-diplomatic-blue/20 bg-diplomatic-blue/8 px-6 py-2">
              <Globe className="h-3.5 w-3.5 shrink-0 text-diplomatic-blue" />
              <p className="text-[11px] text-diplomatic-blue">
                <strong>Live Research mode</strong> — powered by Gemini 2.5 Flash with Google Search grounding.
                Real-time web search with source citations. Custom tools unavailable in this mode (SDK limitation).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {useGroundedMode ? (
                    <Globe className="h-6 w-6 text-diplomatic-blue" />
                  ) : (
                    <span className="text-2xl font-serif font-bold text-gold-400">T</span>
                  )}
                </div>
                <h2 className="font-serif text-2xl text-navy-50 mb-2">
                  {useGroundedMode ? 'Live Research Assistant' : 'TACITUS Diplomatic Assistant'}
                </h2>
                <p className="text-sm text-navy-400 max-w-lg mx-auto leading-relaxed">
                  {useGroundedMode
                    ? 'Real-time conflict intelligence powered by Gemini 2.5 Flash with Google Search grounding. Ask about current developments, breaking news, or recent diplomatic activity — get cited, searchable answers.'
                    : 'AI-powered diplomatic intelligence with structured tool access. Query the conflict graph, draft reports, analyze media, assess escalation, and map negotiation space.'}
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
              {/* Tool invocations for assistant messages (tool mode only) */}
              {msg.role === "assistant" && !useGroundedMode && msg.toolInvocations?.map((invocation) => (
                <ToolInvocation
                  key={invocation.toolCallId}
                  invocation={{
                    id: invocation.toolCallId,
                    type: getToolDisplayType(invocation.toolName),
                    query: (() => {
                      try {
                        const args = invocation.args as Record<string, unknown>;
                        return args?.query as string || args?.text as string || args?.topic as string || invocation.toolName;
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
              {msg.content && (msg.role === 'user' || msg.role === 'assistant') && (
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
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                  useGroundedMode
                    ? "bg-diplomatic-blue/10 border-diplomatic-blue/20"
                    : "bg-gold-500/10 border-gold-500/20"
                )}>
                  {useGroundedMode
                    ? <Globe className="h-4 w-4 text-diplomatic-blue animate-pulse" />
                    : <span className="text-sm font-serif font-bold text-gold-400">T</span>
                  }
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-navy-800 border-l-2 border-gold-500/30 px-4 py-3">
                  {useGroundedMode && (
                    <span className="text-[10px] text-diplomatic-blue mr-2">Searching the web...</span>
                  )}
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
          {/* Context badges */}
          {(conflictContext || uploadedContext) && (
            <div className="mb-2 flex flex-wrap gap-2">
              {conflictContext && (
                <div className="flex items-center gap-1.5 rounded-full bg-diplomatic-blue/15 border border-diplomatic-blue/20 px-2.5 py-1 text-[11px] font-medium text-diplomatic-blue">
                  {conflictLabel}
                  <button onClick={() => setConflictContext('')} className="hover:text-white"><X className="h-3 w-3" /></button>
                </div>
              )}
              {uploadedContext && (
                <div className="flex items-center gap-1.5 rounded-full bg-gold-500/15 border border-gold-500/20 px-2.5 py-1 text-[11px] font-medium text-gold-400">
                  <Paperclip className="h-3 w-3" />
                  {uploadedContext.name}
                  <button onClick={() => setUploadedContext(null)} className="hover:text-gold-200"><X className="h-3 w-3" /></button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.md,.html"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
            <div className="flex items-end gap-2 rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 focus-within:border-gold-500/40 focus-within:ring-1 focus-within:ring-gold-500/20 transition-all">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-8 w-8 shrink-0 text-navy-400 hover:text-navy-200"
                title="Attach document"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={useGroundedMode
                  ? "Ask anything — I'll search the web for current information..."
                  : "Type your message..."}
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

          {/* Quick actions + context selector */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
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
            <div className="ml-auto relative">
              <button
                type="button"
                onClick={() => setShowContextDropdown((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-navy-400 hover:bg-navy-800 hover:text-navy-200 transition-colors"
              >
                {conflictContext ? conflictLabel : 'Set context'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showContextDropdown && (
                <div className="absolute bottom-full right-0 mb-1 z-20 min-w-[180px] rounded-lg border border-navy-600 bg-navy-800 shadow-xl">
                  {CONFLICT_CONTEXTS.map((ctx) => (
                    <button
                      key={ctx.id}
                      type="button"
                      onClick={() => { setConflictContext(ctx.id); setShowContextDropdown(false); }}
                      className={cn(
                        'block w-full px-3 py-2 text-left text-[11px] hover:bg-navy-700 transition-colors',
                        conflictContext === ctx.id ? 'text-gold-400 font-medium' : 'text-navy-300'
                      )}
                    >
                      {ctx.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
