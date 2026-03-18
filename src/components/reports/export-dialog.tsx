"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, FileDown, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportTitle: string;
  reportId?: string;
}

const EXPORT_FORMATS = [
  {
    id: "pdf",
    name: "PDF Document",
    description:
      "Formatted PDF with TACITUS header, section headings, and page numbers",
    icon: FileText,
    extension: ".pdf",
    mimeType: "application/pdf",
  },
  {
    id: "docx",
    name: "Word Document",
    description:
      "Editable DOCX file compatible with Microsoft Word and Google Docs",
    icon: FileDown,
    extension: ".docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "md",
    name: "Markdown",
    description: "Plain text markdown file for version control and sharing",
    icon: FileText,
    extension: ".md",
    mimeType: "text/markdown",
  },
] as const;

export function ExportDialog({
  open,
  onOpenChange,
  reportTitle,
  reportId,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    if (!reportId) {
      setError("No report ID available for export.");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: selectedFormat }),
      });

      // If the response is JSON, it's likely an error
      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setIsExporting(false);
          return;
        }
        // Legacy JSON response (shouldn't happen with new route but handle gracefully)
        setIsExporting(false);
        setIsDone(true);
        setTimeout(() => {
          setIsDone(false);
          onOpenChange(false);
        }, 1500);
        return;
      }

      if (!res.ok) {
        setError(`Export failed with status ${res.status}`);
        setIsExporting(false);
        return;
      }

      // Binary or text response — trigger browser download
      const blob = await res.blob();
      const formatInfo = EXPORT_FORMATS.find((f) => f.id === selectedFormat);
      const safeTitle = reportTitle
        .replace(/[^a-zA-Z0-9 _-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 80);
      const filename = `${safeTitle}${formatInfo?.extension || ".txt"}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Export failed unexpectedly.";
      setError(message);
      setIsExporting(false);
    }
  }, [reportId, selectedFormat, reportTitle, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Export &ldquo;{reportTitle}&rdquo; to your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {EXPORT_FORMATS.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.id;

            return (
              <button
                key={format.id}
                onClick={() => {
                  setSelectedFormat(format.id);
                  setError(null);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-gold-500/40 bg-gold-500/5"
                    : "border-navy-700 bg-navy-800/50 hover:border-navy-600"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-gold-500/10 text-gold-400"
                      : "bg-navy-700 text-navy-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-gold-400" : "text-navy-100"
                    )}
                  >
                    {format.name}
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {format.description}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-navy-950"
                  >
                    <Check className="h-3 w-3" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || isDone}>
            {isDone ? (
              <>
                <Check className="h-4 w-4" />
                Exported
              </>
            ) : isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
