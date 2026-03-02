"use client";

import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Users,
  Shield,
  MapPin,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ReportTemplate } from "@/lib/constants/templates";

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  "situation-report": FileText,
  "briefing-note": BookOpen,
  "conflict-analysis": Shield,
  "early-warning": AlertTriangle,
  "mission-report": MapPin,
  "policy-brief": Users,
};

interface TemplateSelectorProps {
  templates: ReportTemplate[];
  onSelect: (template: ReportTemplate) => void;
}

export function TemplateSelector({
  templates,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl text-navy-50 mb-3">
          Create New Report
        </h1>
        <p className="text-navy-400 text-sm max-w-xl mx-auto">
          Select a template to begin drafting your report. Each template
          provides a structured framework with AI-assisted content generation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, i) => {
          const Icon = TEMPLATE_ICONS[template.id] || FileText;

          return (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              onClick={() => onSelect(template)}
              className={cn(
                "group relative flex flex-col items-start rounded-lg border border-navy-700 bg-navy-800/80 p-5 text-left",
                "transition-all duration-200",
                "hover:border-gold-500/40 hover:bg-navy-800 hover:shadow-lg hover:shadow-gold-500/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500",
                "cursor-pointer"
              )}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-700 text-gold-400 transition-colors group-hover:bg-gold-500/10">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mb-1.5 text-sm font-semibold text-navy-50 group-hover:text-gold-400 transition-colors">
                {template.name}
              </h3>

              <p className="mb-4 text-xs text-navy-400 leading-relaxed line-clamp-2">
                {template.description}
              </p>

              <div className="mt-auto flex items-center gap-1.5 text-xs text-navy-500">
                <FileText className="h-3 w-3" />
                <span>
                  {template.sections.length} section
                  {template.sections.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-gold-500/[0.03] via-transparent to-transparent" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
