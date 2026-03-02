"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Search,
  BarChart3,
  BookCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const PROMPTS = [
  {
    icon: FileText,
    label: "Draft a briefing note",
    prompt: "Draft a briefing note for the Security Council on the Nordalia crisis",
    color: "text-gold-400",
    bgColor: "bg-gold-500/10",
  },
  {
    icon: Search,
    label: "Analyze a conflict",
    prompt: "Analyze the Nordalia conflict situation and identify key escalation risks",
    color: "text-teal",
    bgColor: "bg-teal/10",
  },
  {
    icon: BarChart3,
    label: "Research developments",
    prompt:
      "Research latest developments in the Nordalia conflict zone and summarize key findings",
    color: "text-sage",
    bgColor: "bg-sage/10",
  },
  {
    icon: BookCheck,
    label: "Check terminology",
    prompt:
      "Check diplomatic terminology in my draft and suggest improvements for formal UN communications",
    color: "text-purple",
    bgColor: "bg-purple/10",
  },
];

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PROMPTS.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
            onClick={() => onSelect(item.prompt)}
            className={cn(
              "group flex items-start gap-3 rounded-lg border border-navy-700/60 bg-navy-800/40 p-3.5 text-left",
              "transition-all duration-200",
              "hover:border-navy-600 hover:bg-navy-800/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500",
              "cursor-pointer"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
                item.bgColor,
                item.color
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy-200 group-hover:text-navy-50 transition-colors">
                {item.label}
              </p>
              <p className="mt-0.5 text-xs text-navy-500 line-clamp-2">
                {item.prompt}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
