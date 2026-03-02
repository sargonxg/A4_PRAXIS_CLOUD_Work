"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileEdit,
  BarChart3,
  BookCheck,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  Globe,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface ToolInvocationData {
  id: string;
  type: "web-search" | "draft" | "graph-query" | "terminology-check";
  query: string;
  status: "running" | "complete";
  results?: ToolResult[];
}

interface ToolResult {
  title: string;
  snippet: string;
  source?: string;
}

/* -------------------------------------------------------------------------- */
/*  Tool metadata                                                             */
/* -------------------------------------------------------------------------- */

const TOOL_META: Record<
  ToolInvocationData["type"],
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  "web-search": {
    icon: Search,
    label: "Web Search",
    color: "text-teal",
    bgColor: "bg-teal/10",
  },
  draft: {
    icon: FileEdit,
    label: "Drafting Assistant",
    color: "text-gold-400",
    bgColor: "bg-gold-500/10",
  },
  "graph-query": {
    icon: BarChart3,
    label: "Knowledge Graph Query",
    color: "text-sage",
    bgColor: "bg-sage/10",
  },
  "terminology-check": {
    icon: BookCheck,
    label: "Terminology Checker",
    color: "text-purple",
    bgColor: "bg-purple/10",
  },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface ToolInvocationProps {
  invocation: ToolInvocationData;
}

export function ToolInvocation({ invocation }: ToolInvocationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = TOOL_META[invocation.type];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="ml-11"
    >
      <div className="rounded-lg border border-navy-700/60 bg-navy-800/40 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer",
            "hover:bg-navy-800/80"
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded",
              meta.bgColor,
              meta.color
            )}
          >
            {invocation.status === "running" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn("text-xs font-medium", meta.color)}>
                {meta.label}
              </span>
              {invocation.status === "complete" && (
                <Check className="h-3 w-3 text-sage" />
              )}
            </div>
            <p className="text-[11px] text-navy-400 truncate">
              {invocation.query}
            </p>
          </div>

          {invocation.results && invocation.results.length > 0 && (
            <div className="text-navy-500">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </button>

        {/* Expandable results */}
        <AnimatePresence>
          {isExpanded && invocation.results && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-navy-700/40 px-3 py-2 space-y-2">
                {invocation.results.map((result, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-navy-900/40 p-2"
                  >
                    {invocation.type === "web-search" ? (
                      <Globe className="mt-0.5 h-3 w-3 shrink-0 text-teal" />
                    ) : (
                      <FileText className="mt-0.5 h-3 w-3 shrink-0 text-navy-400" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-navy-200 line-clamp-1">
                        {result.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-navy-400 line-clamp-2">
                        {result.snippet}
                      </p>
                      {result.source && (
                        <p className="mt-0.5 text-[10px] text-navy-500">
                          {result.source}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
