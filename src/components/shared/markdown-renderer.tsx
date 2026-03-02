"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/cn";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        // Headings
        "prose-headings:text-navy-50 prose-headings:font-semibold",
        "prose-h1:text-xl prose-h1:border-b prose-h1:border-navy-700 prose-h1:pb-2",
        "prose-h2:text-lg",
        "prose-h3:text-base",
        // Body text
        "prose-p:text-navy-200 prose-p:leading-relaxed",
        // Links
        "prose-a:text-gold-400 prose-a:no-underline hover:prose-a:underline",
        // Strong / emphasis
        "prose-strong:text-navy-50",
        "prose-em:text-navy-300",
        // Lists
        "prose-li:text-navy-200",
        "prose-ul:text-navy-200",
        "prose-ol:text-navy-200",
        // Blockquotes
        "prose-blockquote:border-l-gold-600 prose-blockquote:text-navy-300 prose-blockquote:bg-navy-900/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-md",
        // Code
        "prose-code:text-gold-400 prose-code:bg-navy-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-navy-900 prose-pre:border prose-pre:border-navy-700 prose-pre:rounded-lg",
        // Tables
        "prose-table:border-navy-700",
        "prose-thead:border-navy-600",
        "prose-th:text-navy-200 prose-th:border-navy-600 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:uppercase prose-th:tracking-wider",
        "prose-td:text-navy-300 prose-td:border-navy-700 prose-td:px-3 prose-td:py-2",
        "prose-tr:border-navy-700",
        // HR
        "prose-hr:border-navy-700",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
