"use client";

import { cn } from "@/lib/utils/cn";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

interface AiStreamingTextProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function AiStreamingText({ content, isStreaming, className }: AiStreamingTextProps) {
  return (
    <div className={cn("relative", className)}>
      <MarkdownRenderer content={content} className="text-sm" />
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-gold-400 animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}
