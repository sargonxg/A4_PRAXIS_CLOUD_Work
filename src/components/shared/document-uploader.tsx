"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "extracting"
  | "done"
  | "error";

interface ExtractedEntities {
  actors: Array<{ id: string; name: string; actorType: string; description: string; confidence: number }>;
  events: Array<{ id: string; title: string; description: string; confidence: number }>;
  [key: string]: Array<{ id: string; confidence: number; [k: string]: unknown }>;
}

interface DocumentUploaderProps {
  /** Callback fired when upload and extraction completes */
  onUploadComplete?: (file: {
    name: string;
    type: string;
    size: number;
    entityCount?: number;
    entities?: ExtractedEntities;
  }) => void;
  /** Additional class names */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Accepted formats                                                   */
/* ------------------------------------------------------------------ */
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".csv"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileText className="h-5 w-5 text-crimson" />;
    case "docx":
      return <FileText className="h-5 w-5 text-teal" />;
    case "csv":
      return <FileSpreadsheet className="h-5 w-5 text-sage" />;
    default:
      return <File className="h-5 w-5 text-navy-400" />;
  }
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  idle: "",
  uploading: "Uploading...",
  processing: "Processing document...",
  extracting: "Extracting entities with AI...",
  done: "Document processed.",
  error: "Upload failed. Please try again.",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function DocumentUploader({
  onUploadComplete,
  className,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---- helpers ---- */
  const resetState = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setSelectedFile(null);
    setError(null);
  }, []);

  const validateFile = useCallback((file: File): boolean => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_MIME_TYPES.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50 MB.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const [doneLabel, setDoneLabel] = useState("Document processed.");

  const processUpload = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setStatus("uploading");
      setProgress(30);

      const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'text/html'];
      const canExtract = textTypes.includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.md');

      if (!canExtract) {
        // For PDFs/DOCX — simulate progress and complete without AI extraction
        setProgress(60);
        setStatus("processing");
        setTimeout(() => {
          setProgress(100);
          setStatus("done");
          setDoneLabel("Document uploaded. Text extraction requires server-side processing.");
          onUploadComplete?.({
            name: file.name,
            type: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
            size: file.size,
          });
        }, 1200);
        return;
      }

      try {
        setStatus("processing");
        setProgress(40);
        const text = await file.text();

        setStatus("extracting");
        setProgress(60);

        const res = await fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        setProgress(90);
        const data = await res.json();

        setProgress(100);
        setStatus("done");
        const count = data.entityCount ?? 0;
        setDoneLabel(`Document processed. ${count} conflict entities extracted.`);
        onUploadComplete?.({
          name: file.name,
          type: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
          size: file.size,
          entityCount: count,
          entities: data.entities,
        });
      } catch {
        setStatus("error");
        setError("Processing failed. Please try again.");
      }
    },
    [onUploadComplete],
  );

  /* ---- drag & drop handlers ---- */
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (status !== "idle") return;
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    },
    [status],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (status !== "idle") return;
      const file = e.dataTransfer.files?.[0];
      if (file && validateFile(file)) {
        processUpload(file);
      }
    },
    [status, validateFile, simulateUpload],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        processUpload(file);
      }
    },
    [validateFile, simulateUpload],
  );

  /* ---- render ---- */
  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => status === "idle" && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200 cursor-pointer",
          dragActive
            ? "border-gold-500 bg-gold-500/5"
            : "border-navy-600 bg-navy-900/50 hover:border-navy-500 hover:bg-navy-900/80",
          status !== "idle" && "pointer-events-none",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="rounded-full bg-navy-800 p-3 border border-navy-700">
                <Upload className="h-6 w-6 text-navy-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-200">
                  Drag & drop a file here, or click to browse
                </p>
                <p className="mt-1 text-xs text-navy-500">
                  Accepted formats: PDF, DOCX, TXT, CSV (max 50 MB)
                </p>
              </div>
            </motion.div>
          )}

          {status !== "idle" && status !== "done" && status !== "error" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3 w-full max-w-xs"
            >
              <Loader2 className="h-6 w-6 text-gold-500 animate-spin" />
              <p className="text-sm font-medium text-navy-200">
                {STATUS_LABELS[status]}
              </p>
              {/* progress bar */}
              <div className="w-full h-2 rounded-full bg-navy-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gold-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.15 }}
                />
              </div>
              <p className="text-xs text-navy-500">{progress}%</p>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <CheckCircle2 className="h-8 w-8 text-sage" />
              <p className="text-sm font-medium text-sage text-center">
                {doneLabel}
              </p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <AlertCircle className="h-8 w-8 text-crimson" />
              <p className="text-sm font-medium text-crimson">
                {STATUS_LABELS.error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected file preview */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-3 rounded-md border border-navy-700 bg-navy-800 px-4 py-3"
        >
          {getFileIcon(selectedFile.name)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-200 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-navy-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {status === "done" && (
            <Button variant="ghost" size="sm" onClick={resetState}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-crimson flex items-center gap-1.5"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </motion.p>
      )}
    </div>
  );
}
