"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  FileText,
  Send,
  Sparkles,
  ExternalLink,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

/* -------------------------------------------------------------------------- */
/*  Mock data                                                                 */
/* -------------------------------------------------------------------------- */

const MOCK_SOURCES = [
  {
    id: "src-1",
    type: "document" as const,
    title: "UNSC Resolution 2847 - Nordalia Humanitarian Framework",
    date: "2026-01-15",
    excerpt:
      "Establishes the framework for humanitarian access in conflict-affected areas of Nordalia...",
  },
  {
    id: "src-2",
    type: "web" as const,
    title: "Nordalia Crisis: Latest Developments - Reuters",
    date: "2026-02-22",
    excerpt:
      "Ceasefire negotiations have stalled following the expiration of the 30-day deadline...",
    url: "#",
  },
  {
    id: "src-3",
    type: "document" as const,
    title: "OCHA Flash Update #14 - Nordalia Displacement",
    date: "2026-02-20",
    excerpt:
      "UNHCR reports 47,000 displaced persons with 340% increase in cross-border movements...",
  },
  {
    id: "src-4",
    type: "web" as const,
    title: "Meridian Alliance Emergency Summit Communique",
    date: "2026-02-20",
    excerpt:
      "The Alliance signals readiness to consider all options if humanitarian access not restored...",
    url: "#",
  },
  {
    id: "src-5",
    type: "document" as const,
    title: "WFP Eastern Ostrava Supply Assessment",
    date: "2026-02-18",
    excerpt:
      "Critical food supply levels with less than two weeks of reserves for 23,000 trapped civilians...",
  },
];

const AI_RESPONSES: Record<string, string> = {
  default: `Based on the current report context, the Nordalia crisis reflects a pattern consistent with protracted intra-state conflicts where humanitarian and political dimensions become deeply intertwined. The key challenge is establishing humanitarian access without undermining the broader political negotiation framework.\n\nI'd recommend emphasizing the urgency of the humanitarian situation in eastern Ostrava while carefully framing it as a confidence-building measure rather than a concession by either party.`,
  actors: `The primary actors in the Nordalia crisis operate across three tiers:\n\n1. **Direct Parties:** Government forces under President Volkov and opposition under General Kaverin\n2. **Regional:** Meridian Alliance (divided between hawks and moderates), Vestralia (humanitarian corridor provider)\n3. **International:** UN system (Special Envoy Nakamura), bilateral partners\n\nThe most critical dynamic is the internal division within both the government coalition and the Meridian Alliance, which creates both risks and opportunities for diplomatic engagement.`,
  timeline: `Key timeline of recent events:\n\n- **Sept 2025:** Disputed local elections trigger armed consolidation in eastern provinces\n- **Nov 2025:** Government security response escalates to sustained armed conflict\n- **Dec 2025:** Special Envoy Nakamura appointed\n- **Jan 2026:** Temporary ceasefire achieved (30-day period)\n- **Feb 12:** Parliament emergency session fails\n- **Feb 15:** Ceasefire expires without renewal\n- **Feb 20:** Meridian Alliance 30-day ultimatum issued\n- **Feb 22:** Backchannel contacts resume with preliminary positive signals`,
  humanitarian: `The humanitarian situation in eastern Nordalia is reaching critical thresholds across multiple indicators:\n\n- **Food security:** Less than 2 weeks of reserves for ~23,000 people in besieged areas\n- **Health:** Medical facilities at 15% capacity\n- **Displacement:** 47,000 IDPs with 340% increase in cross-border movements\n- **Protection:** Reports of forced minor recruitment by non-state groups\n- **Access:** Humanitarian convoys suspended by opposition forces\n\nThe WFP emergency airlift authorization is a positive development, but ground access remains the critical bottleneck.`,
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("actor") || lower.includes("stakeholder") || lower.includes("who"))
    return AI_RESPONSES.actors;
  if (lower.includes("timeline") || lower.includes("when") || lower.includes("chronolog"))
    return AI_RESPONSES.timeline;
  if (lower.includes("humanitarian") || lower.includes("food") || lower.includes("displace"))
    return AI_RESPONSES.humanitarian;
  return AI_RESPONSES.default;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function SourcePanel() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(() => {
    const message = inputValue.trim();
    if (!message || isThinking) return;

    const userMsg: ChatMessage = { role: "user", content: message };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsThinking(true);

    // Simulate thinking, then stream response
    const fullResponse = getAIResponse(message);
    let charIndex = 0;

    setTimeout(() => {
      setIsThinking(false);
      const interval = setInterval(() => {
        charIndex += 3;
        const chunk = fullResponse.slice(0, charIndex);
        setStreamedResponse(chunk);

        if (charIndex >= fullResponse.length) {
          clearInterval(interval);
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullResponse },
          ]);
          setStreamedResponse("");
          // Scroll to bottom
          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
        }
      }, 10);
    }, 800);
  }, [inputValue, isThinking]);

  return (
    <div className="flex h-full flex-col border-l border-navy-700 bg-navy-900/50">
      <Tabs defaultValue="sources" className="flex h-full flex-col">
        <TabsList className="mx-3 mt-3 w-auto">
          <TabsTrigger value="sources" className="flex-1 gap-1.5 text-xs">
            <BookOpen className="h-3 w-3" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        {/* Sources Tab */}
        <TabsContent value="sources" className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-2 pt-2">
            {MOCK_SOURCES.map((source) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="group rounded-md border border-navy-700/60 bg-navy-800/60 p-3 transition-colors hover:border-navy-600"
              >
                <div className="mb-1.5 flex items-start gap-2">
                  {source.type === "web" ? (
                    <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                  ) : (
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-navy-100 leading-snug line-clamp-2">
                      {source.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-navy-500">
                      {source.date}
                    </p>
                  </div>
                  {source.type === "web" && (
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-navy-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </div>
                <p className="text-[11px] text-navy-400 leading-relaxed line-clamp-2">
                  {source.excerpt}
                </p>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="flex flex-1 flex-col overflow-hidden px-3 pb-3">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pt-2">
            {chatMessages.length === 0 && !isThinking && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy-800 text-gold-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-navy-300">
                  Ask about your report
                </p>
                <p className="mt-1 text-[11px] text-navy-500 max-w-[200px]">
                  Get help with analysis, fact-checking, or content suggestions
                  for any section.
                </p>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs",
                  msg.role === "user"
                    ? "ml-4 rounded-lg bg-navy-700 p-2.5 text-navy-100"
                    : "mr-2"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="rounded-lg bg-navy-800/80 border border-navy-700/50 p-2.5">
                    <MarkdownRenderer
                      content={msg.content}
                      className="text-xs [&_p]:text-xs [&_li]:text-xs"
                    />
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            ))}

            {/* Streaming response */}
            {streamedResponse && (
              <div className="mr-2 rounded-lg bg-navy-800/80 border border-navy-700/50 p-2.5">
                <MarkdownRenderer
                  content={streamedResponse}
                  className="text-xs [&_p]:text-xs [&_li]:text-xs"
                />
              </div>
            )}

            {/* Thinking indicator */}
            <AnimatePresence>
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-navy-400"
                >
                  <Loader2 className="h-3 w-3 animate-spin text-gold-400" />
                  <span>Thinking...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about this report..."
              className="h-8 text-xs"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSend}
              disabled={!inputValue.trim() || isThinking}
              className="h-8 w-8 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
