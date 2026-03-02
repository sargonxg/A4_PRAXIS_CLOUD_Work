"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  FileDown,
  GripVertical,
  Circle,
  Loader2,
  FileEdit,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { SectionEditor } from "@/components/reports/section-editor";
import { SourcePanel } from "@/components/reports/source-panel";
import { ExportDialog } from "@/components/reports/export-dialog";
import { useReportStore } from "@/stores/report-store";
import type { ReportTemplate } from "@/lib/constants/templates";
import type { Report, ReportSection } from "@/stores/report-store";

/* -------------------------------------------------------------------------- */
/*  Status icon map                                                           */
/* -------------------------------------------------------------------------- */

const STATUS_ICON: Record<
  ReportSection["status"],
  { icon: React.ElementType; color: string }
> = {
  empty: { icon: Circle, color: "text-navy-600" },
  generating: { icon: Loader2, color: "text-gold-400" },
  draft: { icon: FileEdit, color: "text-teal" },
  final: { icon: CheckCircle2, color: "text-sage" },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface ReportComposerProps {
  template: ReportTemplate;
  existingReport?: Report;
  onBack?: () => void;
}

export function ReportComposer({
  template,
  existingReport,
  onBack,
}: ReportComposerProps) {
  const {
    report,
    activeSection,
    setReport,
    setActiveSection,
    updateSection,
    setSectionStatus,
  } = useReportStore();

  const [tone, setTone] = useState("formal");
  const [exportOpen, setExportOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Initialize report from template or existing
  useEffect(() => {
    if (existingReport) {
      setReport(existingReport);
      if (existingReport.sections.length > 0) {
        setActiveSection(existingReport.sections[0].id);
      }
    } else {
      const newReport: Report = {
        id: `rpt-${Date.now()}`,
        title: "",
        templateId: template.id,
        templateName: template.name,
        sections: template.sections.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          content: "",
          status: "empty" as const,
        })),
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setReport(newReport);
      setActiveSection(template.sections[0].id);
    }
  }, [template, existingReport, setReport, setActiveSection]);

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);
      // Scroll to section in editor
      const el = sectionRefs.current[sectionId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [setActiveSection]
  );

  if (!report) return null;

  const currentSection = report.sections.find((s) => s.id === activeSection);

  return (
    <>
      <div className="flex h-full flex-col bg-navy-950">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-navy-700 bg-navy-900/80 px-4 py-2.5">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Back</span>
            </Button>
          )}

          <div className="flex items-center gap-2 text-xs text-navy-400">
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            <span className="font-medium text-navy-200">
              {template.name}
            </span>
          </div>

          <div className="flex-1" />

          {/* Title input */}
          <Input
            value={report.title}
            onChange={(e) =>
              setReport({ ...report, title: e.target.value })
            }
            placeholder="Untitled Report"
            className="h-8 max-w-xs border-none bg-transparent text-sm font-medium text-navy-100 placeholder:text-navy-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-center"
          />

          <div className="flex-1" />

          {/* Tone selector */}
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="analytical">Analytical</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="diplomatic">Diplomatic</SelectItem>
            </SelectContent>
          </Select>

          {/* Export */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="text-xs">Export</span>
          </Button>

          {/* AI indicator */}
          <div className="flex items-center gap-1.5 rounded-md bg-gold-500/10 px-2.5 py-1.5 text-xs text-gold-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
            </span>
            AI Ready
          </div>
        </div>

        {/* Three-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Outline panel */}
          <div className="w-60 shrink-0 overflow-y-auto border-r border-navy-700 bg-navy-900/30">
            <div className="px-3 py-3">
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
                Sections
              </h4>
              <div className="space-y-0.5">
                {report.sections.map((section, idx) => {
                  const statusInfo = STATUS_ICON[section.status];
                  const Icon = statusInfo.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <motion.button
                      key={section.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => handleSectionClick(section.id)}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-all cursor-pointer",
                        isActive
                          ? "bg-navy-700/60 text-navy-50"
                          : "text-navy-400 hover:bg-navy-800 hover:text-navy-200"
                      )}
                    >
                      <GripVertical className="h-3 w-3 shrink-0 text-navy-600 opacity-0 group-hover:opacity-60 transition-opacity" />
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          statusInfo.color,
                          section.status === "generating" && "animate-spin"
                        )}
                      />
                      <span className="truncate text-xs font-medium">
                        {section.title}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Outline summary */}
            <div className="mx-3 mt-4 rounded-md border border-navy-700/50 bg-navy-800/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-2">
                Progress
              </p>
              <div className="space-y-1.5">
                {(["empty", "draft", "final"] as const).map((status) => {
                  const count = report.sections.filter(
                    (s) => s.status === status
                  ).length;
                  const info = STATUS_ICON[status];
                  const SIcon = info.icon;
                  return (
                    <div
                      key={status}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5 text-navy-400 capitalize">
                        <SIcon className={cn("h-3 w-3", info.color)} />
                        {status}
                      </span>
                      <span className="text-navy-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center: Editor */}
          <div className="flex-1 overflow-hidden">
            {currentSection ? (
              <div
                ref={(el) => {
                  if (currentSection) {
                    sectionRefs.current[currentSection.id] = el;
                  }
                }}
                className="h-full"
              >
                <SectionEditor
                  key={currentSection.id}
                  section={currentSection}
                  onUpdateContent={(content) =>
                    updateSection(currentSection.id, content)
                  }
                  onUpdateStatus={(status) =>
                    setSectionStatus(currentSection.id, status)
                  }
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-navy-500 text-sm">
                Select a section to begin editing
              </div>
            )}
          </div>

          {/* Right: Sources & AI panel */}
          <div className="w-80 shrink-0 overflow-hidden">
            <SourcePanel />
          </div>
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        reportTitle={report.title || "Untitled Report"}
      />
    </>
  );
}
