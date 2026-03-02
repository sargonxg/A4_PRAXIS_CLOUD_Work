"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
import { ToolInvocation, type ToolInvocationData } from "@/components/assistant/tool-invocation";
import { SuggestedPrompts } from "@/components/assistant/suggested-prompts";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ToolInvocationData[];
}

/* -------------------------------------------------------------------------- */
/*  Demo response data                                                        */
/* -------------------------------------------------------------------------- */

const TOOL_RESULTS: Record<string, ToolInvocationData> = {
  search: {
    id: "tool-search",
    type: "web-search",
    query: "Nordalia conflict latest developments 2026",
    status: "complete",
    results: [
      {
        title: "Nordalia Ceasefire Negotiations Collapse - Reuters",
        snippet:
          "Ceasefire talks between the Nordalian government and opposition forces broke down on February 15, following disagreements over preconditions for formal peace negotiations.",
        source: "reuters.com",
      },
      {
        title: "UNHCR Declares Level 2 Emergency for Nordalia Displacement",
        snippet:
          "The UN refugee agency has elevated its response classification as displacement figures reach 47,000 with a 340% increase in cross-border movements.",
        source: "unhcr.org",
      },
      {
        title: "Meridian Alliance Issues 30-Day Ultimatum on Humanitarian Access",
        snippet:
          "The regional bloc has signaled readiness to consider all options if humanitarian access to besieged areas is not restored within the coming month.",
        source: "meridianalliance.org",
      },
      {
        title: "WFP Emergency Airlift Authorized for Eastern Ostrava",
        snippet:
          "World Food Programme begins aerial delivery of emergency supplies as ground access remains blocked by opposition forces.",
        source: "wfp.org",
      },
      {
        title: "Special Envoy Nakamura Resumes Backchannel Contacts",
        snippet:
          "UN Special Envoy reports preliminary positive signals from government side regarding a framework for humanitarian access negotiations.",
        source: "un.org",
      },
    ],
  },
  draft: {
    id: "tool-draft",
    type: "draft",
    query: "Drafting briefing note section",
    status: "complete",
    results: [
      {
        title: "Draft Structure Generated",
        snippet:
          "Created a 5-section briefing note framework covering purpose, background, current situation, options analysis, and recommendations.",
      },
      {
        title: "Key Sources Referenced",
        snippet:
          "Drawing from UNSC Resolution 2847, OCHA Flash Updates #12-14, and the Meridian Alliance communique of 20 February 2026.",
      },
    ],
  },
  analyze: {
    id: "tool-analyze",
    type: "graph-query",
    query: "Query knowledge graph: Nordalia conflict actor relationships",
    status: "complete",
    results: [
      {
        title: "12 Actor Nodes Identified",
        snippet:
          "Mapped relationships between government, opposition, regional bodies, and international organizations with 34 directional relationships.",
      },
      {
        title: "3 Escalation Pathways Detected",
        snippet:
          "Graph analysis reveals three potential escalation pathways: military offensive, regional intervention, and humanitarian crisis spiral.",
      },
    ],
  },
  terminology: {
    id: "tool-terminology",
    type: "terminology-check",
    query: 'Checking formal diplomatic language compliance',
    status: "complete",
    results: [
      {
        title: "4 Terminology Issues Found",
        snippet:
          'Identified non-standard usage: "peace talks" should be "peace negotiations"; "fighters" should be "non-state armed groups"; "taking sides" should be "demonstrating partiality"; "war crimes" requires careful contextual framing.',
      },
      {
        title: "Style Compliance: 87%",
        snippet:
          "Document largely conforms to UN Editorial Manual standards. Minor adjustments recommended for formality and precision.",
      },
    ],
  },
};

const DEMO_RESPONSES: Record<string, string> = {
  default: `Thank you for your question. Based on my analysis of the current diplomatic landscape, there are several key dynamics at play:

**Conflict Dynamics**
The Nordalia crisis exemplifies a pattern common in protracted intra-state conflicts where political, security, and humanitarian dimensions become deeply intertwined. The breakdown of the February ceasefire has created a negative feedback loop: military escalation erodes trust, which undermines diplomatic engagement, which in turn creates conditions for further military action.

**Key Risk Factors**
1. **Humanitarian deadline pressure**: The critical supply situation in eastern Ostrava creates a narrow window for action
2. **Regional contagion risk**: The Meridian Alliance ultimatum introduces external deadline dynamics
3. **Political fragmentation**: Internal divisions within both the government coalition and opposition forces complicate unified negotiation positions

**Diplomatic Assessment**
The most promising avenue for progress appears to be the backchannel communications initiated by Special Envoy Nakamura, which could establish humanitarian access as a confidence-building measure separate from the broader political settlement framework.

Would you like me to elaborate on any of these points or explore a specific dimension in more detail?`,

  search: `Based on my research into the latest developments, here is a comprehensive summary of the current situation:

## Latest Developments in the Nordalia Conflict

### Diplomatic Track
The ceasefire negotiations collapsed on February 15 when opposition forces under General Kaverin rejected preconditions set by the mediating body. However, Special Envoy Nakamura has since initiated backchannel contacts with both parties, receiving preliminary positive signals from the government side.

### Humanitarian Situation
The situation has reached critical levels:
- **47,000** civilians displaced (340% increase in cross-border movements)
- UNHCR has declared a **Level 2 emergency**
- Food supplies in eastern Ostrava are critically low (**< 2 weeks** of reserves)
- WFP emergency airlift has been authorized but ground access remains blocked

### Regional Response
The Meridian Alliance convened an emergency summit on February 20, issuing a 30-day ultimatum on humanitarian access. This introduces significant external pressure on both parties but also risks escalation if the deadline is not met.

### Security Developments
- 127 ceasefire violations documented (78% increase)
- Heavy artillery deployed near civilian population centers
- Two UNMIN observation posts damaged on February 18

Would you like me to draft a formal situation report based on these findings?`,

  draft: `I've drafted a briefing note for the Security Council based on the current situation. Here is the proposed structure and content:

---

## BRIEFING NOTE: Nordalia Crisis Update

### For the Attention of the Security Council

**Date:** 2 March 2026
**Classification:** Restricted

---

### 1. Purpose

This note provides an updated assessment of the security, humanitarian, and diplomatic dimensions of the Nordalia crisis for the Security Council's consideration ahead of the scheduled consultation on 5 March 2026.

### 2. Key Developments Since Last Briefing

The expiration of the ceasefire on 15 February has led to a significant deterioration in security conditions across the eastern provinces. The Meridian Alliance's 30-day ultimatum on humanitarian access, issued on 20 February, introduces a new timeline for diplomatic engagement.

### 3. Recommended Actions

The Secretariat recommends three priority actions:

1. **Immediate**: Issue a Presidential Statement calling for humanitarian access and protection of civilian infrastructure
2. **Short-term**: Authorize expanded UNMIN monitoring capacity under the existing mandate
3. **Medium-term**: Consider a new resolution establishing a formal humanitarian access framework with compliance mechanisms

---

Shall I refine any section or adjust the tone for a different audience?`,

  analyze: `## Conflict Analysis: Nordalia Crisis

Based on a structured analysis of the conflict dynamics, here are the key findings:

### Actor Relationship Map

| Actor | Position | Leverage | Willingness to Negotiate |
|-------|----------|----------|--------------------------|
| Government (Volkov) | Territorial integrity | Military, legitimacy | Medium (constrained by hardliners) |
| Opposition (Kaverin) | Autonomy recognition | Military gains, external support | Low (emboldened by recent gains) |
| Meridian Alliance | Regional stability | Economic leverage | High (but divided internally) |
| Special Envoy | Comprehensive peace | Diplomatic credibility | High |

### Escalation Risk Assessment

Three primary escalation pathways have been identified:

1. **Military Escalation** (Probability: 45%)
   - Triggered by: Government offensive to retake eastern territories
   - Indicators: Troop redeployments, rhetoric shift to military solution framing

2. **Regional Intervention** (Probability: 25%)
   - Triggered by: Expiration of Meridian Alliance ultimatum without progress
   - Indicators: Military posturing along Vestralian border, Alliance mobilization signals

3. **Humanitarian Crisis Spiral** (Probability: 70%)
   - Triggered by: Depletion of supplies in besieged areas
   - Indicators: WFP supply assessments, medical facility closures, civilian casualty reports

### Recommended Monitoring Focus

Priority attention should be given to the humanitarian indicators in eastern Ostrava, as this pathway has the highest probability and the shortest timeline to crisis point.`,

  terminology: `## Diplomatic Terminology Review

I've reviewed the text for compliance with standard diplomatic language conventions. Here are my findings:

### Issues Identified

| Original Term | Recommended Term | Rationale |
|---------------|-----------------|-----------|
| "peace talks" | "peace negotiations" or "peace process" | More formal; "talks" is considered informal in official UN documentation |
| "fighters" | "non-state armed groups" or "armed opposition groups" | Neutral terminology per UN Editorial Manual; avoids legitimacy implications |
| "taking sides" | "demonstrating partiality" or "compromising impartiality" | Diplomatic register requires more formal phrasing |
| "war crimes" | "alleged violations of international humanitarian law" | Requires legal determination; use qualified language pending formal investigation |

### Additional Style Recommendations

- Replace contractions (e.g., "don't" to "do not") throughout the document
- Use "Member States" (capitalized) when referring to UN members
- Replace "should" with "is recommended to" for suggested actions in formal recommendations
- Use "the Secretary-General" with article on first reference

### Overall Assessment

The document scores **87%** for compliance with UN diplomatic communication standards. The recommended changes above would bring it to full compliance. The analytical content and structural organization are strong.

Shall I apply these corrections to a specific draft?`,
};

/* -------------------------------------------------------------------------- */
/*  Keyword detection helper                                                  */
/* -------------------------------------------------------------------------- */

function detectToolType(
  message: string
): ToolInvocationData["type"] | null {
  const lower = message.toLowerCase();
  if (lower.includes("search") || lower.includes("research") || lower.includes("latest") || lower.includes("find"))
    return "web-search";
  if (lower.includes("draft") || lower.includes("write") || lower.includes("briefing"))
    return "draft";
  if (lower.includes("analy") || lower.includes("assess") || lower.includes("evaluat"))
    return "graph-query";
  if (lower.includes("check") || lower.includes("terminolog") || lower.includes("review") || lower.includes("language"))
    return "terminology-check";
  return null;
}

function getResponseKey(toolType: ToolInvocationData["type"] | null): string {
  if (!toolType) return "default";
  const map: Record<ToolInvocationData["type"], string> = {
    "web-search": "search",
    draft: "draft",
    "graph-query": "analyze",
    "terminology-check": "terminology",
  };
  return map[toolType];
}

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
/*  Chat Interface Component                                                  */
/* -------------------------------------------------------------------------- */

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeToolInvocation, setActiveToolInvocation] =
    useState<ToolInvocationData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // Auto-resize textarea
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      // Auto resize
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    },
    []
  );

  const handleSend = useCallback(
    (overrideMessage?: string) => {
      const message = (overrideMessage || inputValue).trim();
      if (!message || isThinking) return;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsThinking(true);
      scrollToBottom();

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      const toolType = detectToolType(message);
      const responseKey = getResponseKey(toolType);
      const fullResponse = DEMO_RESPONSES[responseKey];

      // Phase 1: Show tool invocation (if applicable)
      if (toolType) {
        const toolKey = responseKey as keyof typeof TOOL_RESULTS;
        const toolData: ToolInvocationData = {
          ...TOOL_RESULTS[toolKey],
          id: `tool-${Date.now()}`,
          status: "running",
        };
        setActiveToolInvocation(toolData);

        // Simulate tool completing after 1.2s
        setTimeout(() => {
          setActiveToolInvocation((prev) =>
            prev ? { ...prev, status: "complete" } : null
          );

          // Phase 2: Start streaming response after tool completes
          setTimeout(() => {
            setIsThinking(false);
            streamResponse(fullResponse, toolType, toolData);
          }, 500);
        }, 1200);
      } else {
        // No tool - just think then stream
        setTimeout(() => {
          setIsThinking(false);
          streamResponse(fullResponse, null, null);
        }, 1000);
      }
    },
    [inputValue, isThinking, scrollToBottom]
  );

  const streamResponse = useCallback(
    (
      fullResponse: string,
      toolType: ToolInvocationData["type"] | null,
      toolData: ToolInvocationData | null
    ) => {
      let charIndex = 0;
      setStreamingContent("");

      const interval = setInterval(() => {
        charIndex += 4;
        const chunk = fullResponse.slice(0, charIndex);
        setStreamingContent(chunk);
        scrollToBottom();

        if (charIndex >= fullResponse.length) {
          clearInterval(interval);

          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: fullResponse,
            tools: toolData
              ? [{ ...toolData, status: "complete" }]
              : undefined,
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");
          setActiveToolInvocation(null);
          scrollToBottom();
        }
      }, 8);
    },
    [scrollToBottom]
  );

  const handleClear = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    setActiveToolInvocation(null);
    setIsThinking(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const isEmpty = messages.length === 0 && !isThinking && !streamingContent;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-700 bg-navy-900/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 border border-gold-500/20">
            <span className="text-lg font-serif font-bold text-gold-400">
              T
            </span>
          </div>
          <div>
            <h1 className="font-serif text-xl text-navy-50">
              Diplomatic Assistant
            </h1>
            <p className="text-xs text-navy-400">
              AI-powered analysis, drafting, and research
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
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
                  <span className="text-2xl font-serif font-bold text-gold-400">
                    T
                  </span>
                </div>
                <h2 className="font-serif text-2xl text-navy-50 mb-2">
                  TACITUS Diplomatic Assistant
                </h2>
                <p className="text-sm text-navy-400 max-w-lg mx-auto leading-relaxed">
                  I am your AI-powered diplomatic intelligence assistant.
                  I can help you draft reports, analyze conflicts, research
                  developments, and review diplomatic communications. I draw
                  on your organization&apos;s knowledge base and real-time
                  sources to provide informed, contextual support.
                </p>
              </div>

              <SuggestedPrompts onSelect={(prompt) => handleSend(prompt)} />
            </motion.div>
          )}

          {/* Rendered messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {/* Tool invocations for completed messages */}
              {msg.role === "assistant" &&
                msg.tools?.map((tool) => (
                  <ToolInvocation key={tool.id} invocation={tool} />
                ))}
              <MessageBubble role={msg.role} content={msg.content} />
            </div>
          ))}

          {/* Active tool invocation (live) */}
          {activeToolInvocation && (
            <ToolInvocation invocation={activeToolInvocation} />
          )}

          {/* Thinking indicator */}
          <AnimatePresence>
            {isThinking && !streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/20">
                  <span className="text-sm font-serif font-bold text-gold-400">
                    T
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-navy-800 border-l-2 border-gold-500/30 px-4 py-3">
                  <span className="flex gap-1">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Streaming content */}
          {streamingContent && (
            <MessageBubble
              role="assistant"
              content={streamingContent}
              isStreaming
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-navy-700 bg-navy-900/50 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 focus-within:border-gold-500/40 focus-within:ring-1 focus-within:ring-gold-500/20 transition-all">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-navy-400 hover:text-navy-200"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-navy-100 placeholder:text-navy-500 focus:outline-none min-h-[32px] max-h-[120px] py-1.5"
            />

            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isThinking}
              className={cn(
                "h-8 w-8 shrink-0 rounded-lg transition-all",
                inputValue.trim()
                  ? "bg-gold-500 text-navy-950 hover:bg-gold-400"
                  : "bg-navy-700 text-navy-500"
              )}
            >
              {isThinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick actions */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] text-navy-500 mr-1">Quick:</span>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => {
                    setInputValue(action.prefix);
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
