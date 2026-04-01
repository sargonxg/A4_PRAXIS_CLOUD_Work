"use client";

import { useSituationGuard } from "@/hooks/use-situation-guard";
import { useSituationStore } from "@/stores/situation-store";
import { NoSituationState } from "@/components/praxis/no-situation-state";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  File,
  Upload,
  Search,
  Eye,
  Filter,
  ChevronDown,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Users,
  Calendar,
  Activity,
  FileUp,
  Sparkles,
  RefreshCw,
  BarChart2,
  Zap,
  Shield,
  Link2,
  BookOpen,
  MessageSquare,
  CheckSquare,
  Square,
  Trash2,
  ChevronRight,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ====================================================================
   TYPES
   ==================================================================== */

type DocFileType = "pdf" | "docx" | "txt" | "md" | "csv" | string;
type DocStatus = "uploaded" | "processing" | "extracted" | "error";

interface Actor {
  id: string;
  name: string;
  actorType: string;
  description: string;
  confidence: number;
}

interface Claim {
  id: string;
  actorId: string;
  title: string;
  description: string;
  claimType: string;
  status: string;
  confidence: number;
}

interface Interest {
  id: string;
  actorId: string;
  title: string;
  description: string;
  interestType: string;
  priority: string;
  confidence: number;
}

interface Constraint {
  id: string;
  actorId: string;
  title: string;
  description: string;
  constraintType: string;
  severity: string;
  confidence: number;
}

interface Leverage {
  id: string;
  actorId: string;
  targetActorId: string;
  title: string;
  description: string;
  leverageType: string;
  confidence: number;
}

interface Commitment {
  id: string;
  actorId: string;
  title: string;
  description: string;
  commitmentType: string;
  status: string;
  confidence: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  date?: string;
  impact: string;
  confidence: number;
}

interface Narrative {
  id: string;
  actorId: string;
  title: string;
  description: string;
  narrativeType: string;
  confidence: number;
}

interface ExtractedEntities {
  actors: Actor[];
  claims: Claim[];
  interests: Interest[];
  constraints: Constraint[];
  leverage: Leverage[];
  commitments: Commitment[];
  events: Event[];
  narratives: Narrative[];
}

interface DocumentItem {
  id: string;
  title: string;
  fileType: DocFileType;
  size: number;
  status: DocStatus;
  uploadedAt: string;
  entityCount: number;
  chunkCount: number;
  entities: ExtractedEntities | null;
}

/* ====================================================================
   HELPERS
   ==================================================================== */

function formatFileType(fileType: string): string {
  return fileType.toUpperCase();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDocIcon(fileType: string) {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return <FileText className="h-4 w-4 text-crimson" />;
    case "docx":
      return <FileText className="h-4 w-4 text-teal" />;
    case "csv":
      return <FileSpreadsheet className="h-4 w-4 text-sage" />;
    default:
      return <File className="h-4 w-4 text-navy-400" />;
  }
}

function getStatusBadge(status: DocStatus) {
  switch (status) {
    case "extracted":
      return (
        <Badge variant="sage" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Extracted
        </Badge>
      );
    case "uploaded":
      return (
        <Badge variant="gold" className="gap-1">
          <Clock className="h-3 w-3" />
          Uploaded
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="teal" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "error":
      return (
        <Badge variant="crimson" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {status}
        </Badge>
      );
  }
}

// Entity type metadata: label, badge variant, icon
const ENTITY_TYPE_META: Record<
  keyof ExtractedEntities,
  {
    label: string;
    variant: "terracotta" | "teal" | "sage" | "steel" | "gold" | "crimson" | "purple" | "tan";
    icon: React.ReactNode;
  }
> = {
  actors: { label: "Actors", variant: "terracotta", icon: <Users className="h-3 w-3" /> },
  events: { label: "Events", variant: "gold", icon: <Activity className="h-3 w-3" /> },
  claims: { label: "Claims", variant: "sage", icon: <MessageSquare className="h-3 w-3" /> },
  interests: { label: "Interests", variant: "purple", icon: <Sparkles className="h-3 w-3" /> },
  constraints: { label: "Constraints", variant: "crimson", icon: <Shield className="h-3 w-3" /> },
  leverage: { label: "Leverage", variant: "tan", icon: <Zap className="h-3 w-3" /> },
  commitments: { label: "Commitments", variant: "teal", icon: <Link2 className="h-3 w-3" /> },
  narratives: { label: "Narratives", variant: "steel", icon: <BookOpen className="h-3 w-3" /> },
};

function getEntityLabel(type: keyof ExtractedEntities, entity: ExtractedEntities[typeof type][number]): string {
  if (type === "actors") return (entity as Actor).name;
  return (entity as { title: string }).title;
}

/* ====================================================================
   DRAG AND DROP UPLOADER (inline — no shared component dependency for real upload)
   ==================================================================== */

interface UploadAreaProps {
  situationId: string;
  onUploaded: (doc: DocumentItem) => void;
  onClose: () => void;
}

type UploadStage = "idle" | "uploading" | "extracting" | "analyzing" | "saving" | "done" | "error";

function UploadArea({ situationId, onUploaded, onClose }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doneLabel, setDoneLabel] = useState("");

  const ACCEPTED = [".pdf", ".docx", ".txt", ".md"];

  const UPLOAD_STEPS: { stage: UploadStage; label: string }[] = [
    { stage: "uploading", label: "Uploading file..." },
    { stage: "extracting", label: "Extracting text..." },
    { stage: "analyzing", label: "Running AI analysis..." },
    { stage: "saving", label: "Saving to library..." },
  ];

  const activeStepIndex = UPLOAD_STEPS.findIndex((s) => s.stage === stage);
  const isProcessing = ["uploading", "extracting", "analyzing", "saving"].includes(stage);

  function validateFile(file: File): string | null {
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED.includes(ext)) {
      return `Unsupported format. Accepted: ${ACCEPTED.join(", ")}`;
    }
    if (file.size > 50 * 1024 * 1024) return "File too large (max 50 MB).";
    return null;
  }

  const upload = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setStage("uploading");
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("situationId", situationId);

        // Step 1: uploading — animate progress bar
        setProgress(10);
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        setProgress(25);

        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error ?? `Upload failed (${res.status})`);
        }

        const data = await res.json() as {
          success: boolean;
          document: {
            id: string;
            title: string;
            fileType: string;
            size: number;
            status: DocStatus;
            uploadedAt: string;
            entityCount: number;
          };
        };

        // Step 2: extracting text
        setStage("extracting");
        setProgress(50);
        await new Promise((r) => setTimeout(r, 600));

        // Step 3: AI analysis
        setStage("analyzing");
        setProgress(75);
        await new Promise((r) => setTimeout(r, 700));

        // Step 4: saving
        setStage("saving");
        setProgress(95);
        await new Promise((r) => setTimeout(r, 400));

        setProgress(100);
        setStage("done");
        setDoneLabel(`"${data.document.title}" uploaded and indexed.`);

        const newDoc: DocumentItem = {
          id: data.document.id,
          title: data.document.title,
          fileType: data.document.fileType,
          size: data.document.size,
          status: data.document.status,
          uploadedAt: data.document.uploadedAt,
          entityCount: data.document.entityCount,
          chunkCount: 0,
          entities: null,
        };

        onUploaded(newDoc);

        setTimeout(() => onClose(), 2000);
      } catch (err) {
        setStage("error");
        setErrorMsg(err instanceof Error ? err.message : "Upload failed. Please try again.");
      }
    },
    [situationId, onUploaded, onClose]
  );

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (stage !== "idle") return;
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (stage !== "idle") return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setErrorMsg(err); return; }
    upload(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setErrorMsg(err); return; }
    upload(file);
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => stage === "idle" && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-all duration-200",
          stage === "idle" ? "cursor-pointer" : "pointer-events-none",
          dragActive
            ? "border-gold-500 bg-gold-500/5"
            : "border-navy-600 bg-navy-900/40 hover:border-navy-500 hover:bg-navy-900/70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={handleChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {stage === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="rounded-full bg-navy-800 p-3 border border-navy-700">
                <Upload className="h-6 w-6 text-navy-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-200">
                  Drag &amp; drop a file here, or click to browse
                </p>
                <p className="mt-1 text-xs text-navy-500">
                  PDF, DOCX, TXT, MD — max 50 MB
                </p>
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col items-center gap-4 w-full max-w-sm"
            >
              {/* Step list */}
              <div className="w-full space-y-2">
                {UPLOAD_STEPS.map((step, idx) => {
                  const isActive = idx === activeStepIndex;
                  const isDone = idx < activeStepIndex;
                  return (
                    <div
                      key={step.stage}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                        isActive && "bg-gold-500/10 border border-gold-500/30",
                        isDone && "opacity-60",
                        !isActive && !isDone && "opacity-30"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-sage shrink-0" />
                      ) : isActive ? (
                        stage === "uploading" ? (
                          <Loader2 className="h-4 w-4 text-gold-500 animate-spin shrink-0" />
                        ) : stage === "extracting" ? (
                          <Loader2 className="h-4 w-4 text-teal animate-spin shrink-0" />
                        ) : stage === "analyzing" ? (
                          <div className="flex gap-0.5 shrink-0">
                            {[0, 1, 2].map((d) => (
                              <div
                                key={d}
                                className="h-2 w-1.5 rounded-sm bg-purple-400 animate-pulse"
                                style={{ animationDelay: `${d * 150}ms` }}
                              />
                            ))}
                          </div>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-sage animate-pulse shrink-0" />
                        )
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-navy-600 shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          isActive ? "text-navy-200 font-medium" : "text-navy-500"
                        )}
                      >
                        {step.label}
                      </span>
                      {isDone && (
                        <span className="ml-auto text-[10px] text-sage">Done</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Progress bar */}
              {stage === "uploading" && (
                <div className="w-full space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-navy-700 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gold-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-navy-500 text-right">{progress}%</p>
                </div>
              )}
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <CheckCircle2 className="h-8 w-8 text-sage" />
              <p className="text-sm font-medium text-sage">{doneLabel}</p>
              <p className="text-xs text-navy-500">
                Run AI extraction to identify conflict entities.
              </p>
            </motion.div>
          )}

          {stage === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <AlertCircle className="h-8 w-8 text-crimson" />
              <p className="text-sm font-medium text-crimson">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedFile && stage !== "idle" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-3 rounded-md border border-navy-700 bg-navy-800 px-4 py-3"
        >
          {getDocIcon(selectedFile.name.split(".").pop() ?? "")}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-200 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-navy-500">
              {formatSize(selectedFile.size)}
            </p>
          </div>
        </motion.div>
      )}

      {stage === "error" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStage("idle");
            setErrorMsg(null);
            setSelectedFile(null);
            setProgress(0);
          }}
          className="w-full"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

/* ====================================================================
   ENTITY PANEL — shown for a selected document
   ==================================================================== */

interface EntityPanelProps {
  doc: DocumentItem;
  situationId: string;
  onExtracted: (docId: string, entities: ExtractedEntities, entityCount: number) => void;
}

function EntityPanel({ doc, situationId, onExtracted }: EntityPanelProps) {
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  async function runExtraction() {
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}/extract-stored`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situationId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Extraction failed (${res.status})`);
      }

      const data = await res.json() as {
        success: boolean;
        entityCount: number;
        entities: ExtractedEntities;
      };

      onExtracted(doc.id, data.entities, data.entityCount);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  }

  const entities = doc.entities;
  const hasEntities = entities !== null && doc.entityCount > 0;

  if (!hasEntities) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
        <div className="rounded-full bg-navy-800 p-3 border border-navy-700">
          <Sparkles className="h-5 w-5 text-gold-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-navy-300">No entities extracted yet</p>
          <p className="text-xs text-navy-500 mt-1 max-w-[240px]">
            Run AI extraction to identify actors, events, claims, interests, and
            other conflict entities in this document.
          </p>
        </div>
        {doc.status === "uploaded" || doc.status === "extracted" ? (
          <Button
            size="sm"
            onClick={runExtraction}
            disabled={extracting}
            className="gap-2"
          >
            {extracting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Extracting…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Extract Entities
              </>
            )}
          </Button>
        ) : null}
        {extractError && (
          <p className="text-xs text-crimson flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {extractError}
          </p>
        )}
      </div>
    );
  }

  const entityTypes = Object.keys(ENTITY_TYPE_META) as (keyof ExtractedEntities)[];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-navy-500">
          {doc.entityCount} entities across {entityTypes.filter((t) => entities[t].length > 0).length} types
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={runExtraction}
          disabled={extracting}
          className="h-7 text-xs gap-1.5"
        >
          {extracting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Re-extract
        </Button>
      </div>

      {extractError && (
        <p className="text-xs text-crimson flex items-center gap-1.5 px-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {extractError}
        </p>
      )}

      {entityTypes.map((type) => {
        const items = entities[type];
        if (items.length === 0) return null;
        const meta = ENTITY_TYPE_META[type];

        return (
          <div key={type}>
            <p className="text-xs font-medium text-navy-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              {meta.icon}
              {meta.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((entity, i) => (
                <Badge key={i} variant={meta.variant} className="text-xs gap-1">
                  {getEntityLabel(type, entity)}
                  <span className="opacity-60">
                    {Math.round((entity as { confidence: number }).confidence * 100)}%
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ====================================================================
   ENTITY EXTRACTION DASHBOARD — per-document summary card
   ==================================================================== */

interface EntityDashboardProps {
  entities: ExtractedEntities;
  entityCount: number;
}

function EntityExtractionDashboard({ entities, entityCount }: EntityDashboardProps) {
  const [expanded, setExpanded] = useState(false);

  // Confidence distribution across all entities
  const allEntities = Object.values(entities).flat() as Array<{ confidence: number }>;
  const highConf = allEntities.filter((e) => e.confidence >= 0.75).length;
  const medConf = allEntities.filter((e) => e.confidence >= 0.5 && e.confidence < 0.75).length;
  const lowConf = allEntities.filter((e) => e.confidence < 0.5).length;
  const total = allEntities.length || 1;

  const highPct = Math.round((highConf / total) * 100);
  const medPct = Math.round((medConf / total) * 100);
  const lowPct = Math.round((lowConf / total) * 100);

  const primaryTypes = (["actors", "claims", "interests", "events"] as const);
  const secondaryTypes = (["constraints", "leverage", "commitments", "narratives"] as const);

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-navy-300 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-gold-500" />
          Extraction Summary
        </p>
        <Badge variant="gold" className="text-[10px]">
          {entityCount} total
        </Badge>
      </div>

      {/* Entity type counts — 4 primary */}
      <div className="grid grid-cols-4 gap-2">
        {primaryTypes.map((type) => {
          const meta = ENTITY_TYPE_META[type];
          return (
            <div key={type} className="rounded-md bg-navy-800/50 p-2 text-center border border-navy-700/50">
              <p className="text-base font-bold text-navy-200">{entities[type].length}</p>
              <p className="text-[10px] text-navy-500 mt-0.5">{meta.label}</p>
            </div>
          );
        })}
      </div>

      {/* Confidence distribution — CSS-only donut-like bar */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-navy-500 uppercase tracking-wider">Confidence Distribution</p>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          {highPct > 0 && (
            <div
              className="bg-sage transition-all duration-500"
              style={{ width: `${highPct}%` }}
              title={`High confidence: ${highConf}`}
            />
          )}
          {medPct > 0 && (
            <div
              className="bg-gold-500 transition-all duration-500"
              style={{ width: `${medPct}%` }}
              title={`Medium confidence: ${medConf}`}
            />
          )}
          {lowPct > 0 && (
            <div
              className="bg-crimson/70 transition-all duration-500"
              style={{ width: `${lowPct}%` }}
              title={`Low confidence: ${lowConf}`}
            />
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-navy-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-sage inline-block" />High ({highConf})</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-gold-500 inline-block" />Medium ({medConf})</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-crimson/70 inline-block" />Low ({lowConf})</span>
        </div>
      </div>

      {/* Top 5 per primary type */}
      <div className="space-y-2">
        {primaryTypes.map((type) => {
          const items = entities[type].slice(0, 5);
          if (items.length === 0) return null;
          const meta = ENTITY_TYPE_META[type];
          return (
            <div key={type} className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-navy-500 w-16 shrink-0 pt-0.5">{meta.label}</span>
              <div className="flex flex-wrap gap-1">
                {items.map((entity, i) => (
                  <Badge key={i} variant={meta.variant} className="text-[10px] h-4 px-1.5">
                    {getEntityLabel(type, entity)}
                  </Badge>
                ))}
                {entities[type].length > 5 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    +{entities[type].length - 5}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand / collapse secondary types */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-navy-500 hover:text-navy-300 transition-colors cursor-pointer"
      >
        {expanded ? "Hide" : "View Full Analysis"}
        <ChevronRight className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1 border-t border-[var(--color-app-border)]">
              {secondaryTypes.map((type) => {
                const items = entities[type];
                if (items.length === 0) return null;
                const meta = ENTITY_TYPE_META[type];
                return (
                  <div key={type} className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-navy-500 w-16 shrink-0 pt-0.5">{meta.label}</span>
                    <div className="flex flex-wrap gap-1">
                      {items.map((entity, i) => (
                        <Badge key={i} variant={meta.variant} className="text-[10px] h-4 px-1.5">
                          {getEntityLabel(type, entity)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   DOCUMENT TEXT PREVIEW
   ==================================================================== */

interface DocumentPreviewProps {
  doc: DocumentItem;
}

function DocumentTextPreview({ doc }: DocumentPreviewProps) {
  const [showMore, setShowMore] = useState(false);

  // Synthesize a preview from entity names (since we don't store raw text client-side)
  const entityNames: string[] = [];
  if (doc.entities) {
    const types = Object.keys(doc.entities) as (keyof ExtractedEntities)[];
    for (const type of types) {
      for (const entity of doc.entities[type]) {
        const label = getEntityLabel(type, entity);
        if (label && !entityNames.includes(label)) entityNames.push(label);
      }
    }
  }

  // Build a synthetic preview snippet
  const preview = doc.entities
    ? `This document contains analysis of ${entityNames.slice(0, 3).join(", ")}${entityNames.length > 3 ? ` and ${entityNames.length - 3} other entities` : ""}. The document was processed by TACITUS AI and indexed for conflict intelligence analysis. Extracted entities span ${Object.values(doc.entities).filter((a) => a.length > 0).length} categories across the conflict landscape.`
    : "Document text preview will be available after AI extraction is complete.";

  const truncated = preview.slice(0, 500);
  const needsMore = preview.length > 500;

  // Highlight entity names in preview
  function renderHighlighted(text: string) {
    if (entityNames.length === 0) return <span>{text}</span>;
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    while (remaining.length > 0) {
      let earliestIdx = -1;
      let matchedName = "";
      for (const name of entityNames) {
        const idx = remaining.indexOf(name);
        if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
          earliestIdx = idx;
          matchedName = name;
        }
      }
      if (earliestIdx === -1) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
      if (earliestIdx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, earliestIdx)}</span>);
      }
      parts.push(
        <mark key={key++} className="bg-amber-500/20 text-amber-300 rounded-sm px-0.5 not-italic">
          {matchedName}
        </mark>
      );
      remaining = remaining.slice(earliestIdx + matchedName.length);
    }
    return <>{parts}</>;
  }

  const displayText = showMore ? preview : truncated;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Document Preview</p>

      {/* Source metadata */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded bg-navy-800/50 border border-navy-700/50 px-2 py-1.5">
          <span className="text-navy-500">Filename</span>
          <p className="text-navy-300 font-medium truncate mt-0.5">{doc.title}</p>
        </div>
        <div className="rounded bg-navy-800/50 border border-navy-700/50 px-2 py-1.5">
          <span className="text-navy-500">Uploaded</span>
          <p className="text-navy-300 font-medium mt-0.5">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
        </div>
        <div className="rounded bg-navy-800/50 border border-navy-700/50 px-2 py-1.5">
          <span className="text-navy-500">File size</span>
          <p className="text-navy-300 font-medium mt-0.5">{formatSize(doc.size)}</p>
        </div>
        <div className="rounded bg-navy-800/50 border border-navy-700/50 px-2 py-1.5">
          <span className="text-navy-500">Format</span>
          <p className="text-navy-300 font-medium mt-0.5">{formatFileType(doc.fileType)}</p>
        </div>
      </div>

      {/* Text excerpt */}
      <div className="rounded-md border border-[var(--color-app-border)] bg-navy-900/40 p-3 text-xs text-navy-400 leading-relaxed">
        {doc.entities ? renderHighlighted(displayText) : <span className="italic text-navy-500">{displayText}</span>}
        {needsMore && !showMore && <span className="text-navy-600">...</span>}
      </div>
      {needsMore && (
        <button
          onClick={() => setShowMore((v) => !v)}
          className="text-xs text-gold-500 hover:text-gold-400 transition-colors cursor-pointer"
        >
          {showMore ? "Show less" : "...Show more"}
        </button>
      )}
    </div>
  );
}

/* ====================================================================
   INSIGHTS TAB — aggregate entity view across all documents
   ==================================================================== */

interface InsightsTabProps {
  documents: DocumentItem[];
}

function InsightsTab({ documents: docs }: InsightsTabProps) {
  const processedDocs = docs.filter((d) => d.entities !== null);

  if (processedDocs.length === 0) {
    return (
      <div className="py-12 text-center">
        <BarChart2 className="h-10 w-10 mx-auto text-navy-600 mb-3" />
        <p className="text-sm text-navy-400 font-medium">No extracted data yet</p>
        <p className="text-xs text-navy-500 mt-1 max-w-sm mx-auto">
          Run AI extraction on your documents to see an aggregated view of all
          conflict entities across your situation.
        </p>
      </div>
    );
  }

  // Aggregate entities across all processed documents
  const aggregate: ExtractedEntities = {
    actors: [],
    claims: [],
    interests: [],
    constraints: [],
    leverage: [],
    commitments: [],
    events: [],
    narratives: [],
  };

  const seenLabels: Partial<Record<keyof ExtractedEntities, Set<string>>> = {};

  for (const doc of processedDocs) {
    if (!doc.entities) continue;
    const types = Object.keys(aggregate) as (keyof ExtractedEntities)[];
    for (const type of types) {
      if (!seenLabels[type]) seenLabels[type] = new Set();
      for (const entity of doc.entities[type]) {
        // Cast through unknown to satisfy TS union narrowing on computed keys
        const typed = entity as unknown as ExtractedEntities[typeof type][number];
        const label = getEntityLabel(type, typed);
        if (!seenLabels[type]!.has(label.toLowerCase())) {
          seenLabels[type]!.add(label.toLowerCase());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (aggregate[type] as any[]).push(typed);
        }
      }
    }
  }

  const totalEntities = Object.values(aggregate).reduce((s, a) => s + a.length, 0);
  const entityTypes = Object.keys(ENTITY_TYPE_META) as (keyof ExtractedEntities)[];

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {(["actors", "events", "claims", "interests"] as const).map((type) => {
          const meta = ENTITY_TYPE_META[type];
          return (
            <div
              key={type}
              className="rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3 text-center"
            >
              <p className="text-lg font-bold text-navy-900">{aggregate[type].length}</p>
              <p className="text-xs text-navy-500 mt-0.5">{meta.label}</p>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-navy-500">
        {totalEntities} unique entities across {processedDocs.length} processed{" "}
        {processedDocs.length === 1 ? "document" : "documents"}
      </p>

      {/* Entity groups */}
      {entityTypes.map((type) => {
        const items = aggregate[type];
        if (items.length === 0) return null;
        const meta = ENTITY_TYPE_META[type];

        return (
          <div key={type}>
            <p className="text-xs font-medium text-navy-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              {meta.icon}
              {meta.label} ({items.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 20).map((entity, i) => (
                <Badge key={i} variant={meta.variant} className="text-xs">
                  {getEntityLabel(type, entity)}
                </Badge>
              ))}
              {items.length > 20 && (
                <Badge variant="secondary" className="text-xs">
                  +{items.length - 20} more
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ====================================================================
   MAIN VAULT UI
   ==================================================================== */

interface DocumentVaultUIProps {
  situationId: string;
}

function DocumentVaultUI({ situationId }: DocumentVaultUIProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState("documents");

  // Smart search scope
  const [searchScope, setSearchScope] = useState<{ names: boolean; entities: boolean; content: boolean }>({
    names: true,
    entities: true,
    content: true,
  });

  // Batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchExtracting, setBatchExtracting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  function toggleSelectDoc(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(docs: DocumentItem[]) {
    if (selectedIds.size === docs.length && docs.every((d) => selectedIds.has(d.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(docs.map((d) => d.id)));
    }
  }

  async function handleBatchExtract() {
    const ids = Array.from(selectedIds);
    setBatchExtracting(true);
    setBatchProgress({ current: 0, total: ids.length });
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      setBatchProgress({ current: i + 1, total: ids.length });
      try {
        const res = await fetch(`/api/documents/${id}/extract-stored`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situationId }),
        });
        if (res.ok) {
          const data = await res.json() as { success: boolean; entityCount: number; entities: ExtractedEntities };
          handleExtracted(id, data.entities, data.entityCount);
        }
      } catch {
        // continue with next
      }
    }
    setBatchExtracting(false);
    setBatchProgress(null);
    setSelectedIds(new Set());
  }

  function handleBatchDelete() {
    // Optimistic removal — real delete would call API
    setDocuments((prev) => prev.filter((d) => !selectedIds.has(d.id)));
    if (selectedDoc && selectedIds.has(selectedDoc.id)) setSelectedDoc(null);
    setSelectedIds(new Set());
  }

  /* ---- Load documents from Firestore on mount ---- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(
          `/api/documents?situationId=${encodeURIComponent(situationId)}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error ?? `Failed to load documents (${res.status})`);
        }
        const data = await res.json() as { documents: DocumentItem[] };
        setDocuments(data.documents);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load documents.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [situationId]);

  /* ---- Keep selectedDoc in sync after updates ---- */
  useEffect(() => {
    if (selectedDoc) {
      const updated = documents.find((d) => d.id === selectedDoc.id);
      if (updated) setSelectedDoc(updated);
    }
  }, [documents, selectedDoc]);

  /* ---- Callbacks ---- */
  const handleUploaded = useCallback((doc: DocumentItem) => {
    setDocuments((prev) => [doc, ...prev]);
  }, []);

  const handleExtracted = useCallback(
    (docId: string, entities: ExtractedEntities, entityCount: number) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, entities, entityCount, status: "extracted" as DocStatus }
            : d
        )
      );
    },
    []
  );

  /* ---- Filtering + Smart Search ---- */
  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      if (q) {
        const matchesName = searchScope.names && doc.title.toLowerCase().includes(q);
        const matchesEntities = searchScope.entities && doc.entities
          ? Object.entries(doc.entities).some(([type, items]) =>
              (items as ExtractedEntities[keyof ExtractedEntities]).some((entity) =>
                getEntityLabel(type as keyof ExtractedEntities, entity as ExtractedEntities[keyof ExtractedEntities][number]).toLowerCase().includes(q)
              )
            )
          : false;
        const matchesContent = searchScope.content && (
          doc.fileType.toLowerCase().includes(q) ||
          doc.status.includes(q)
        );
        if (!matchesName && !matchesEntities && !matchesContent) return false;
      }
      const matchesType =
        filterType === "all" || doc.fileType.toLowerCase() === filterType.toLowerCase();
      const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
      return matchesType && matchesStatus;
    });
  }, [documents, searchQuery, filterType, filterStatus, searchScope]);

  const processedCount = documents.filter((d) => d.status === "extracted").length;
  const totalEntities = documents.reduce((s, d) => s + d.entityCount, 0);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ---- HEADER ---- */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-navy-900 font-serif tracking-wide">
              Document Vault
            </h1>
            <p className="mt-1 text-sm text-navy-400">
              {loading ? (
                "Loading…"
              ) : (
                <>
                  {documents.length}{" "}
                  {documents.length === 1 ? "document" : "documents"} &middot;{" "}
                  {processedCount} extracted &middot; {totalEntities} entities
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch((s) => !s)}
              className={cn(showSearch && "text-gold-400")}
            >
              <Search className="h-4 w-4" />
            </Button>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileUp className="h-5 w-5 text-gold-500" />
                    Upload Document
                  </DialogTitle>
                  <DialogDescription>
                    Upload a document to your situation vault. TACITUS AI will
                    extract conflict entities for intelligence analysis.
                  </DialogDescription>
                </DialogHeader>
                <UploadArea
                  situationId={situationId}
                  onUploaded={handleUploaded}
                  onClose={() => setUploadDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* ---- SMART SEARCH BAR ---- */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden space-y-2"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents, entities, content…"
                  className="pl-10 pr-10"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Search scope toggles */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-navy-500 flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  Searching in:
                </span>
                {(["names", "entities", "content"] as const).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setSearchScope((prev) => ({ ...prev, [scope]: !prev[scope] }))}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer capitalize",
                      searchScope[scope]
                        ? "bg-gold-500/20 border-gold-500/40 text-gold-400"
                        : "bg-navy-800 border-navy-700 text-navy-500"
                    )}
                  >
                    {scope}
                  </button>
                ))}
                {searchQuery && (
                  <span className="text-[10px] text-navy-500 ml-1">
                    — {filteredDocs.length} result{filteredDocs.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- TAB BAR ---- */}
        <div className="flex items-center gap-1 mb-4 border-b border-[var(--color-app-border)]">
          {[
            { id: "documents", label: "Documents", count: documents.length },
            { id: "insights", label: "Insights", count: totalEntities },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === id
                  ? "border-gold-500 text-gold-500"
                  : "border-transparent text-navy-500 hover:text-navy-300"
              )}
            >
              {label}
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  activeTab === id
                    ? "bg-gold-500/20 text-gold-400"
                    : "bg-navy-700 text-navy-400"
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ---- INSIGHTS TAB ---- */}
        <AnimatePresence mode="wait">
          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-gold-500" />
                    Entity Intelligence Overview
                  </CardTitle>
                  <CardDescription>
                    Aggregated conflict entities across all extracted documents in
                    this situation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InsightsTab documents={documents} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ---- DOCUMENTS TAB ---- */}
          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {/* Filters */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap items-center gap-3 mb-4"
              >
                <div className="flex items-center gap-1.5 text-xs text-navy-500">
                  <Filter className="h-3.5 w-3.5" />
                  Filters:
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="txt">TXT</SelectItem>
                    <SelectItem value="md">MD</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="extracted">Extracted</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                {(filterType !== "all" || filterStatus !== "all" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterType("all");
                      setFilterStatus("all");
                      setSearchQuery("");
                    }}
                    className="text-xs h-8 gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </Button>
                )}
              </motion.div>

              {/* Main content: list + detail panel */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Document list — 3 columns */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardContent className="p-0">
                      {/* Table header */}
                      <div className="grid grid-cols-[28px_36px_1fr_80px_110px_56px] gap-2 px-4 py-3 border-b border-[var(--color-app-border)] text-xs font-medium text-navy-500 uppercase tracking-wider">
                        <button
                          onClick={() => toggleSelectAll(filteredDocs)}
                          className="flex items-center justify-center cursor-pointer text-navy-500 hover:text-navy-300 transition-colors"
                          aria-label="Select all"
                        >
                          {filteredDocs.length > 0 && selectedIds.size === filteredDocs.length && filteredDocs.every((d) => selectedIds.has(d.id))
                            ? <CheckSquare className="h-3.5 w-3.5 text-gold-400" />
                            : <Square className="h-3.5 w-3.5" />
                          }
                        </button>
                        <span>Type</span>
                        <span>Name</span>
                        <span>Date</span>
                        <span>Status</span>
                        <span className="text-right">Act</span>
                      </div>

                      {/* Loading state */}
                      {loading && (
                        <div className="px-4 py-12 text-center">
                          <Loader2 className="h-6 w-6 mx-auto text-gold-500 animate-spin mb-3" />
                          <p className="text-sm text-navy-400">Loading documents…</p>
                        </div>
                      )}

                      {/* Error state */}
                      {!loading && loadError && (
                        <div className="px-4 py-12 text-center">
                          <AlertCircle className="h-8 w-8 mx-auto text-crimson mb-3" />
                          <p className="text-sm text-crimson font-medium">{loadError}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 gap-2"
                            onClick={() => window.location.reload()}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry
                          </Button>
                        </div>
                      )}

                      {/* Empty state — no documents at all */}
                      {!loading && !loadError && documents.length === 0 && (
                        <div className="px-4 py-14 text-center">
                          <FileUp className="h-10 w-10 mx-auto text-navy-600 mb-3" />
                          <p className="text-sm text-navy-300 font-medium">
                            No documents uploaded yet
                          </p>
                          <p className="text-xs text-navy-500 mt-1.5 max-w-xs mx-auto">
                            Upload PDFs, Word documents, or text files to
                            extract conflict actors, events, claims, and
                            interests using TACITUS AI.
                          </p>
                          <Button
                            size="sm"
                            className="mt-4 gap-2"
                            onClick={() => setUploadDialogOpen(true)}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload your first document
                          </Button>
                        </div>
                      )}

                      {/* Empty filter results */}
                      {!loading && !loadError && documents.length > 0 && filteredDocs.length === 0 && (
                        <div className="px-4 py-10 text-center">
                          <FileText className="h-8 w-8 mx-auto text-navy-600 mb-2" />
                          <p className="text-sm text-navy-400">
                            No documents match your filters.
                          </p>
                        </div>
                      )}

                      {/* Rows */}
                      {!loading && !loadError && (
                        <div className="divide-y divide-[var(--color-app-border)]">
                          {filteredDocs.map((doc, i) => {
                            const isSelected = selectedIds.has(doc.id);
                            const q = searchQuery.trim().toLowerCase();
                            const nameMatch = q && searchScope.names && doc.title.toLowerCase().includes(q);
                            return (
                              <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() =>
                                  setSelectedDoc((prev) =>
                                    prev?.id === doc.id ? null : doc
                                  )
                                }
                                className={cn(
                                  "grid grid-cols-[28px_36px_1fr_80px_110px_56px] gap-2 px-4 py-3 items-center cursor-pointer transition-colors",
                                  selectedDoc?.id === doc.id
                                    ? "bg-[var(--color-app-surface-alt)]"
                                    : "hover:bg-navy-100/5",
                                  isSelected && "bg-gold-500/5"
                                )}
                              >
                                {/* Checkbox */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectDoc(doc.id);
                                  }}
                                  className="flex items-center justify-center text-navy-500 hover:text-gold-400 transition-colors cursor-pointer"
                                  aria-label={isSelected ? "Deselect" : "Select"}
                                >
                                  {isSelected
                                    ? <CheckSquare className="h-3.5 w-3.5 text-gold-400" />
                                    : <Square className="h-3.5 w-3.5" />
                                  }
                                </button>
                                <div className="flex items-center justify-center">
                                  {getDocIcon(doc.fileType)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm text-navy-900 truncate font-medium">
                                    {nameMatch ? (
                                      <span>
                                        {doc.title.split(new RegExp(`(${q})`, "i")).map((part, pi) =>
                                          part.toLowerCase() === q
                                            ? <mark key={pi} className="bg-amber-500/30 text-amber-300 rounded-sm">{part}</mark>
                                            : <span key={pi}>{part}</span>
                                        )}
                                      </span>
                                    ) : doc.title}
                                  </p>
                                  <p className="text-xs text-navy-500">
                                    {formatSize(doc.size)}
                                    {doc.entityCount > 0 && (
                                      <span className="ml-2 text-gold-500">
                                        {doc.entityCount} entities
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <span className="text-xs text-navy-400">
                                  {formatDate(doc.uploadedAt)}
                                </span>
                                <div>{getStatusBadge(doc.status)}</div>
                                <div className="flex items-center justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDoc((prev) =>
                                        prev?.id === doc.id ? null : doc
                                      );
                                    }}
                                    className="p-1 rounded hover:bg-navy-700/30 text-navy-500 hover:text-navy-300 transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Batch action bar — shown when 2+ selected */}
                <AnimatePresence>
                  {selectedIds.size >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 24 }}
                      className="lg:col-span-5 flex items-center justify-between gap-3 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-gold-400">
                        {selectedIds.size} documents selected
                      </p>
                      <div className="flex items-center gap-2">
                        {batchProgress && (
                          <span className="text-xs text-navy-400">
                            Processing {batchProgress.current}/{batchProgress.total}…
                          </span>
                        )}
                        <Button
                          size="sm"
                          onClick={handleBatchExtract}
                          disabled={batchExtracting}
                          className="gap-1.5 text-xs h-7"
                        >
                          {batchExtracting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Extract Selected ({selectedIds.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleBatchDelete}
                          disabled={batchExtracting}
                          className="gap-1.5 text-xs h-7 border-crimson/40 text-crimson hover:bg-crimson/10"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete Selected ({selectedIds.size})
                        </Button>
                        <button
                          onClick={() => setSelectedIds(new Set())}
                          className="text-navy-500 hover:text-navy-300 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Detail panel — 2 columns */}
                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    {selectedDoc ? (
                      <motion.div
                        key={selectedDoc.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                      >
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {getDocIcon(selectedDoc.fileType)}
                                <CardTitle className="text-sm truncate">
                                  {selectedDoc.title}
                                </CardTitle>
                              </div>
                              <button
                                onClick={() => setSelectedDoc(null)}
                                className="p-1 rounded hover:bg-navy-700/30 text-navy-500 hover:text-navy-300 shrink-0 cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="uppercase text-[10px] font-semibold text-navy-500">
                                {formatFileType(selectedDoc.fileType)}
                              </span>
                              <span className="text-navy-600">&middot;</span>
                              <span>{formatSize(selectedDoc.size)}</span>
                              <span className="text-navy-600">&middot;</span>
                              <span>{formatDate(selectedDoc.uploadedAt)}</span>
                              <span className="text-navy-600">&middot;</span>
                              {getStatusBadge(selectedDoc.status)}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <Tabs defaultValue="entities" className="space-y-4">
                              <TabsList className="w-full">
                                <TabsTrigger value="entities" className="flex-1 text-xs">
                                  Entities
                                  {selectedDoc.entityCount > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="ml-1.5 text-[10px] h-4 px-1.5"
                                    >
                                      {selectedDoc.entityCount}
                                    </Badge>
                                  )}
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="flex-1 text-xs">
                                  Preview
                                </TabsTrigger>
                                <TabsTrigger value="meta" className="flex-1 text-xs">
                                  Details
                                </TabsTrigger>
                              </TabsList>

                              {/* Entities tab */}
                              <TabsContent value="entities" className="space-y-4">
                                {selectedDoc.entities && selectedDoc.entityCount > 0 && (
                                  <EntityExtractionDashboard
                                    entities={selectedDoc.entities}
                                    entityCount={selectedDoc.entityCount}
                                  />
                                )}
                                <EntityPanel
                                  doc={selectedDoc}
                                  situationId={situationId}
                                  onExtracted={handleExtracted}
                                />
                              </TabsContent>

                              {/* Preview tab */}
                              <TabsContent value="preview">
                                <DocumentTextPreview doc={selectedDoc} />
                              </TabsContent>

                              {/* Meta / details tab */}
                              <TabsContent value="meta">
                                <div className="space-y-3 text-sm">
                                  <div className="rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] divide-y divide-[var(--color-app-border)]">
                                    {[
                                      { label: "File name", value: selectedDoc.title },
                                      { label: "Type", value: formatFileType(selectedDoc.fileType) },
                                      { label: "Size", value: formatSize(selectedDoc.size) },
                                      { label: "Uploaded", value: new Date(selectedDoc.uploadedAt).toLocaleString() },
                                      { label: "Status", value: selectedDoc.status },
                                      { label: "Entities", value: String(selectedDoc.entityCount) },
                                      {
                                        label: "RAG chunks",
                                        value: selectedDoc.chunkCount > 0 ? String(selectedDoc.chunkCount) : "Pending",
                                      },
                                    ].map(({ label, value }) => (
                                      <div key={label} className="flex items-center justify-between px-3 py-2">
                                        <span className="text-xs text-navy-500">{label}</span>
                                        <span className="text-xs text-navy-300 font-medium">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {selectedDoc.chunkCount > 0 && (
                                    <p className="text-xs text-navy-500 flex items-center gap-1.5">
                                      <CheckCircle2 className="h-3 w-3 text-sage shrink-0" />
                                      This document is chunked and indexed for AI-assisted analysis in the PRAXIS Assistant.
                                    </p>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty-detail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Card className="border-dashed">
                          <CardContent className="py-16 text-center">
                            <Eye className="h-10 w-10 mx-auto text-navy-600 mb-3" />
                            <p className="text-sm text-navy-400 font-medium">
                              Select a document
                            </p>
                            <p className="text-xs text-navy-500 mt-1">
                              Click any document to view extracted entities and
                              document details.
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ====================================================================
   DEMO MODE — retains mock data presentation for /demo/* context
   ==================================================================== */

// Demo documents use static data — demo mode never calls Firestore
const DEMO_DOCUMENT_SUMMARY = {
  count: 8,
  processed: 6,
  totalEntities: 73,
};

function DemoVaultPlaceholder() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 font-serif tracking-wide">
          Document Vault
        </h1>
        <p className="mt-1 text-sm text-navy-400">
          {DEMO_DOCUMENT_SUMMARY.count} documents &middot;{" "}
          {DEMO_DOCUMENT_SUMMARY.processed} extracted &middot;{" "}
          {DEMO_DOCUMENT_SUMMARY.totalEntities} entities
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <FileText className="h-10 w-10 mx-auto text-navy-600 mb-3" />
          <p className="text-sm text-navy-400 font-medium">
            Document Vault — Demo Mode
          </p>
          <p className="text-xs text-navy-500 mt-1 max-w-sm mx-auto">
            In demo mode the Document Vault shows pre-loaded Nordalia Crisis
            documents. Sign in to upload your own documents and run live AI
            extraction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ====================================================================
   PAGE EXPORT
   ==================================================================== */

export default function DocumentVaultPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();

  if (isDemo) return <DemoVaultPlaceholder />;
  if (showGuard || !situation) return <NoSituationState />;

  return <DocumentVaultUI situationId={situation.id} />;
}
