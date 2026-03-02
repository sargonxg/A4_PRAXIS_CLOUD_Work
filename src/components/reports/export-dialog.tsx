"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, FileDown, Check, Loader2 } from "lucide-react";
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
}

const EXPORT_FORMATS = [
  {
    id: "pdf",
    name: "PDF Document",
    description: "Formatted PDF with headers, footers, and classification markings",
    icon: FileText,
    extension: ".pdf",
  },
  {
    id: "docx",
    name: "Word Document",
    description: "Editable DOCX file compatible with Microsoft Word and Google Docs",
    icon: FileDown,
    extension: ".docx",
  },
  {
    id: "md",
    name: "Markdown",
    description: "Plain text markdown file for version control and sharing",
    icon: FileText,
    extension: ".md",
  },
] as const;

export function ExportDialog({
  open,
  onOpenChange,
  reportTitle,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    // Simulate export
    setTimeout(() => {
      setIsExporting(false);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        onOpenChange(false);
      }, 1500);
    }, 2000);
  };

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
                onClick={() => setSelectedFormat(format.id)}
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
