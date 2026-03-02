"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { useAuth } from "@/lib/auth/auth-context";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-600 text-xs font-semibold text-navy-100">
      {initials}
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/20">
      <span className="text-sm font-serif font-bold text-gold-400">T</span>
    </div>
  );
}

export function MessageBubble({
  role,
  content,
  isStreaming,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const userName = user?.name ?? "User";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex gap-3",
        role === "user" ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {role === "user" ? (
        <UserAvatar name={userName} />
      ) : (
        <AssistantAvatar />
      )}

      {/* Message content */}
      <div
        className={cn(
          "max-w-[75%] rounded-xl px-4 py-3",
          role === "user"
            ? "bg-navy-700 text-navy-100"
            : "bg-navy-800 border-l-2 border-gold-500/30"
        )}
      >
        {role === "assistant" ? (
          <div className="relative">
            <MarkdownRenderer content={content} className="text-sm" />
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-gold-400 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </motion.div>
  );
}
