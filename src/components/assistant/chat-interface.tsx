"use client";

import { useRef, useCallback, useEffect, useState } from "react";
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
import { useSituationStore } from "@/stores/situation-store";
import { useAppStore } from "@/stores/app-store";
import type { Situation } from "@/types/situation";

// Conflict contexts are now derived from the active situation — no hardcoded list
const DEMO_CONFLICT_CONTEXTS = [
  { id: 'nordalia', label: 'Nordalia Crisis' },
  { id: 'drc', label: 'DRC / M23' },
  { id: 'sahel', label: 'Sahel Region' },
  { id: 'sudan', label: 'Sudan' },
  { id: 'yemen', label: 'Yemen' },
  { id: 'gaza', label: 'Israel/Palestine' },
  { id: 'ukraine', label: 'Ukraine' },
  { id: 'myanmar', label: 'Myanmar' },
];

const DEMO_SITUATION_CONTEXT = {
  id: 'demo-nordalia',
  name: 'Nordalia — Contested Border Arrangement',
  region: 'Eastern Marches / Belara corridor',
  description:
    'Synthetic demonstration case: the Government of Nordalia and the Democratic Reform Movement are contesting a border and ceasefire arrangement around Kessara and the Belara rare-earth corridor, with UNMN monitoring, AU facilitation, and external pressure from Karovia and Westmark.',
  actors: ['Government of Nordalia', 'Democratic Reform Movement', 'UNMN', 'AU Panel', 'Karovia', 'Westmark'],
  riskScore: 72,
  glaslStage: 5,
  escalationTrend: 'worsening',
  contextNotes:
    'Key demo signals: ceasefire violations, monitor freedom-of-movement restrictions, arms embargo erosion, field-commander spoiler incentives, humanitarian access constraints, and rival external patron narratives.',
};

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
/*  Phase-aware suggested prompts                                             */
/* -------------------------------------------------------------------------- */

function getContextualPrompts(situation: Situation | null, phase?: string): string[] {
  if (!situation) return [
    'What can PRAXIS do?',
    'How do I create my first situation?',
    'Walk me through the PRAXIS workflow',
  ];

  const name = situation.name;
  switch (phase) {
    case 'intake': return [
      `Help me map the key actors in ${name}`,
      `What are the root causes of ${name}?`,
      `Identify the main claims and competing interests`,
      `Classify this conflict using UCDP typology`,
    ];
    case 'mapping': return [
      `Build a stakeholder influence map for ${name}`,
      `What leverage does each party hold?`,
      `Map the narrative ecosystem and information environment`,
      `Who are the potential spoilers in ${name}?`,
    ];
    case 'assessment': return [
      `What is the current Glasl escalation stage for ${name}?`,
      `Run an early warning scan`,
      `Assess protection of civilians in ${name}`,
      `What are the ripeness indicators for negotiation?`,
    ];
    case 'monitoring': return [
      `What are the latest developments in ${name}?`,
      `Generate a situation update for this week`,
      `Check ceasefire compliance status`,
      `Any new event-feed or GDELT spikes?`,
    ];
    case 'reporting': return [
      `Draft a situation report for ${name}`,
      `Prepare talking points for Security Council`,
      `Generate a briefing note on recent developments`,
      `Draft an options paper for intervention`,
    ];
    default: return [
      `What are the latest developments in ${name}?`,
      `Generate a risk assessment for this situation`,
      `Who are the key actors and what are their interests?`,
      `What's the current Glasl escalation stage?`,
    ];
  }
}

/* -------------------------------------------------------------------------- */
/*  Map AI SDK tool names to ToolInvocation display types                    */
/* -------------------------------------------------------------------------- */

type ToolDisplayType =
  | "web-search" | "draft" | "graph-query" | "terminology-check"
  | "escalation" | "negotiation" | "narrative" | "humanitarian"
  | "sanctions" | "ceasefire" | "stakeholder" | "game-theory" | "protection"
  | "historical" | "timeline" | "verification" | "early-warning" | "agreement";

function getToolDisplayType(toolName: string): ToolDisplayType {
  if (toolName === "webSearch") return "web-search";
  if (toolName === "draftSection" || toolName === "editForDiplomaticTone" || toolName === "draftResolutionLanguage") return "draft";
  if (toolName === "escalationAssessment") return "escalation";
  if (toolName === "negotiationSpaceAnalysis") return "negotiation";
  if (toolName === "narrativeEcosystemMap") return "narrative";
  if (toolName === "humanitarianSnapshot") return "humanitarian";
  if (toolName === "sanctionsCheck") return "sanctions";
  if (toolName === "ceasefireMonitor") return "ceasefire";
  if (toolName === "stakeholderAnalysis") return "stakeholder";
  if (toolName === "gameTheoryAnalysis") return "game-theory";
  if (toolName === "pocAssessment") return "protection";
  if (toolName === "historicalPrecedents") return "historical";
  if (toolName === "timelineConstruction") return "timeline";
  if (toolName === "sourceVerification") return "verification";
  if (toolName === "earlyWarning") return "early-warning";
  if (toolName === "agreementAnalysis") return "agreement";
  if (
    toolName === "queryConflictGraph" ||
    toolName === "analyzeDocument"
  ) return "graph-query";
  if (toolName === "checkUNTerminology") return "terminology-check";
  return "graph-query";
}

/* -------------------------------------------------------------------------- */
/*  Export chat to Markdown                                                   */
/* -------------------------------------------------------------------------- */

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  parts?: Array<{ type: string; text?: string; toolName?: string }>;
};

function exportChat(messages: ChatMessage[], situationName?: string): void {
  const date = new Date().toISOString().slice(0, 10);
  const title = situationName
    ? `PRAXIS Chat — ${situationName} — ${date}`
    : `PRAXIS Chat — ${date}`;

  let md = `# ${title}\n\n`;
  md += `*Exported from PRAXIS by TACITUS*\n\n---\n\n`;

  for (const msg of messages) {
    if (msg.role === 'user') {
      md += `## User\n\n${msg.content}\n\n`;
    } else {
      md += `## PRAXIS\n\n`;
      if (msg.parts && msg.parts.length > 0) {
        for (const part of msg.parts) {
          if (part.type === 'text' && part.text) md += part.text + '\n\n';
          if (part.type === 'tool-result' && part.toolName) md += `*[Tool: ${part.toolName}]*\n\n`;
        }
      } else {
        md += (msg.content || '') + '\n\n';
      }
      md += '\n';
    }
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `praxis-chat-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------- */
/*  Chat Interface Component                                                  */
/* -------------------------------------------------------------------------- */

export function ChatInterface() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { activeSituation } = useSituationStore();
  const { demoMode } = useAppStore();
  const effectiveSituation = activeSituation ?? (demoMode ? DEMO_SITUATION_CONTEXT : null);

  const [uploadedContext, setUploadedContext] = useState<{ name: string; text: string } | null>(null);
  const [conflictContext, setConflictContext] = useState(
    effectiveSituation ? effectiveSituation.id : ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [showContextDropdown, setShowContextDropdown] = useState(false);
  const [useGroundedMode, setUseGroundedMode] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'standard' | 'deep'>('standard');

  // Build context options: real situation for authenticated users, demo list for demo mode
  const CONFLICT_CONTEXTS = demoMode
    ? [
        { id: '', label: 'No conflict context' },
        ...(effectiveSituation ? [{ id: effectiveSituation.id, label: effectiveSituation.name }] : []),
        ...DEMO_CONFLICT_CONTEXTS,
      ]
    : effectiveSituation
      ? [{ id: effectiveSituation.id, label: effectiveSituation.name }]
      : [{ id: '', label: 'No situation selected' }];

  const conflictLabel = CONFLICT_CONTEXTS.find((c) => c.id === conflictContext)?.label ?? '';

  useEffect(() => {
    if (effectiveSituation && !conflictContext) setConflictContext(effectiveSituation.id);
  }, [effectiveSituation, conflictContext]);

  // Pass full situation data to AI for context-aware responses
  const chatBody = {
    conflictContext: conflictLabel || effectiveSituation?.name || undefined,
    situation: effectiveSituation ?? undefined,
    aiSettings: { analysisDepth: analysisMode },
  };

  const toolChat = useChat({
    api: "/api/ai/chat",
    body: chatBody,
    onFinish: () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    },
  });

  // Google Search-grounded chat (real-time web search, no custom tools)
  const groundedChat = useChat({
    api: "/api/ai/grounded-search",
    body: chatBody,
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

  const handleExportChat = useCallback(() => {
    exportChat(messages as ChatMessage[], activeSituation?.name);
  }, [messages, activeSituation]);

  const isEmpty = messages.length === 0 && !isLoading;

  // Phase-aware contextual prompts for the empty state inline banner
  const contextualPrompts = getContextualPrompts(effectiveSituation as Situation | null, activeSituation?.analysisPhase);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 border border-gold-500/30">
            <span className="text-lg font-serif font-bold text-gold-600">T</span>
          </div>
          <div>
            <h1 className="font-serif text-xl text-navy-900">Diplomatic Assistant</h1>
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
                : "bg-white border-navy-200 text-navy-400 hover:bg-navy-100 hover:text-navy-700"
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
            <Button variant="ghost" size="sm" onClick={handleExportChat} className="gap-1.5 text-navy-400">
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
                <strong>Live Research mode</strong> — Google Search-grounded research for current information.
                Use Tool Analysis when you need workspace tools, graph context, or saved corpus context.
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
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 border border-gold-500/30">
                  {useGroundedMode ? (
                    <Globe className="h-6 w-6 text-diplomatic-blue" />
                  ) : (
                    <span className="text-2xl font-serif font-bold text-gold-600">T</span>
                  )}
                </div>
                <h2 className="font-serif text-2xl text-navy-900 mb-2">
                  {useGroundedMode ? 'Live Research Assistant' : 'TACITUS Diplomatic Assistant'}
                </h2>
                <p className="text-sm text-navy-400 max-w-lg mx-auto leading-relaxed">
                  {useGroundedMode
                    ? 'Search-grounded conflict intelligence for current developments, breaking news, and recent diplomatic activity. Use this when recency matters most.'
                    : 'AI-powered diplomatic intelligence with structured tool access. Query the conflict graph, draft reports, analyze media, assess escalation, and map negotiation space.'}
                </p>
              </div>

              {/* Phase-aware quick prompts (shown when situation has analysisPhase; falls back to SuggestedPrompts grid) */}
              {activeSituation?.analysisPhase && !demoMode ? (
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                      {activeSituation.analysisPhase.charAt(0).toUpperCase() + activeSituation.analysisPhase.slice(1)} phase suggestions
                    </span>
                    <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-medium text-gold-600 border border-gold-500/20">
                      {activeSituation.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {contextualPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handlePromptSelect(prompt)}
                        className="rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-left text-xs text-navy-600 transition-colors hover:border-gold-500/30 hover:bg-gold-500/5 hover:text-navy-900"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <SuggestedPrompts onSelect={handlePromptSelect} mode={useGroundedMode ? "research" : "analysis"} />
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
                    : "bg-gold-500/10 border-gold-500/30"
                )}>
                  {useGroundedMode
                    ? <Globe className="h-4 w-4 text-diplomatic-blue animate-pulse" />
                    : <span className="text-sm font-serif font-bold text-gold-600">T</span>
                  }
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-white border-l-2 border-gold-500/30 px-4 py-3">
                  {useGroundedMode && (
                    <span className="text-[10px] text-diplomatic-blue mr-2">Searching the web...</span>
                  )}
                  {analysisMode === 'deep' && !useGroundedMode && (
                    <span className="text-[10px] text-amber-500 mr-2">Detailed analysis running...</span>
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
      <div className="border-t border-[var(--color-app-border)] bg-white px-6 py-4">
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
                <div className="flex items-center gap-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 px-2.5 py-1 text-[11px] font-medium text-gold-600">
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
            <div className="flex items-end gap-2 rounded-xl border border-navy-200 bg-white px-3 py-2 focus-within:border-gold-500/40 focus-within:ring-1 focus-within:ring-gold-500/20 transition-all">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-8 w-8 shrink-0 text-navy-400 hover:text-navy-700"
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
                className="flex-1 resize-none bg-transparent text-sm text-navy-800 placeholder:text-navy-500 focus:outline-none min-h-[32px] max-h-[120px] py-1.5"
              />

              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "h-8 w-8 shrink-0 rounded-lg transition-all",
                  input.trim()
                    ? "bg-gold-500 text-navy-950 hover:bg-gold-400"
                    : "bg-navy-100 text-navy-500"
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

          {/* Quick actions + analysis mode selector + context selector */}
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
                    "transition-colors hover:bg-white hover:text-navy-700",
                    "cursor-pointer"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {action.label}
                </button>
              );
            })}

            {/* Analysis mode toggle — Standard / Deep */}
            <div className="ml-1 flex items-center rounded-md border border-navy-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setAnalysisMode('standard')}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium transition-colors",
                  analysisMode === 'standard'
                    ? "bg-navy-800 text-white"
                    : "bg-white text-navy-400 hover:bg-navy-50 hover:text-navy-700"
                )}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setAnalysisMode('deep')}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium transition-colors border-l border-navy-200",
                  analysisMode === 'deep'
                    ? "bg-navy-800 text-white"
                    : "bg-white text-navy-400 hover:bg-navy-50 hover:text-navy-700"
                )}
              >
                Detailed{" "}
                <span className={cn(
                  "text-[10px]",
                  analysisMode === 'deep' ? "text-amber-300" : "text-amber-400"
                )}>
                  broader
                </span>
              </button>
            </div>

            <div className="ml-auto relative">
              <button
                type="button"
                onClick={() => setShowContextDropdown((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-navy-400 hover:bg-white hover:text-navy-700 transition-colors"
              >
                {conflictContext ? conflictLabel : 'Set context'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showContextDropdown && (
                <div className="absolute bottom-full right-0 mb-1 z-20 min-w-[180px] rounded-lg border border-navy-200 bg-white shadow-xl">
                  {CONFLICT_CONTEXTS.map((ctx) => (
                    <button
                      key={ctx.id}
                      type="button"
                      onClick={() => { setConflictContext(ctx.id); setShowContextDropdown(false); }}
                      className={cn(
                        'block w-full px-3 py-2 text-left text-[11px] hover:bg-navy-100 transition-colors',
                        conflictContext === ctx.id ? 'text-gold-600 font-medium' : 'text-navy-600'
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
