"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  FileOutput,
  FileText,
  GitBranch,
  Network,
  PenLine,
  Search,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface DocumentWorkspaceDocument {
  id: string;
  title: string;
  fileType: string;
  status: string;
  entityCount: number;
  chunkCount: number;
  entities?: {
    actors?: unknown[];
    events?: unknown[];
  } | null;
}

interface DocumentWorkspaceSpineProps {
  documents: DocumentWorkspaceDocument[];
  loading?: boolean;
  mode?: "live" | "demo";
  route: (path: string) => string;
  onUpload?: () => void;
  onBuildContextPack?: () => void;
}

export function DocumentWorkspaceSpine({
  documents,
  loading = false,
  mode = "live",
  route,
  onUpload,
  onBuildContextPack,
}: DocumentWorkspaceSpineProps) {
  const metrics = buildWorkspaceMetrics(documents);
  const stages = buildStages(metrics);
  const nextActions = buildNextActions(metrics, route);

  return (
    <section className="mb-5 rounded-lg border border-[var(--color-app-border)] bg-white shadow-sm shadow-navy-950/5">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Document production spine
              </p>
              <h2 className="mt-1 text-base font-semibold text-navy-900">
                Source intake to structured briefing workspace
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-navy-600">
                Upload evidence, extract entities, build the situation context, then send the same grounded record into
                policy memos, dossiers, talking points, and DOCX/PDF exports.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Context readiness</p>
              <p className="text-lg font-semibold text-navy-900">{loading ? "..." : `${metrics.readiness}%`}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "relative overflow-hidden rounded-md border px-3 py-3",
                  stage.complete
                    ? "border-emerald-200 bg-emerald-50"
                    : stage.active
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-md p-1.5",
                      stage.complete
                        ? "bg-emerald-100 text-emerald-700"
                        : stage.active
                          ? "bg-amber-100 text-amber-700"
                          : "bg-white text-navy-500"
                    )}
                  >
                    {stage.icon}
                  </span>
                  {stage.complete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-semibold text-navy-400">{index + 1}</span>
                  )}
                </div>
                <p className="mt-2 text-xs font-semibold text-navy-900">{stage.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-navy-500">{stage.detail}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Documents" value={String(metrics.documentCount)} detail={`${metrics.fileTypes} file type${metrics.fileTypes === 1 ? "" : "s"}`} />
            <MetricTile label="Extracted" value={`${metrics.extractedCount}/${metrics.documentCount || 0}`} detail={`${metrics.totalEntities} structured entities`} />
            <MetricTile label="RAG chunks" value={String(metrics.totalChunks)} detail={metrics.totalChunks > 0 ? "Indexed for Ask PRAXIS" : "Pending chunk index"} />
            <MetricTile label="Draft ready" value={metrics.draftReady ? "Yes" : "Not yet"} detail={metrics.draftReady ? "Use production tools" : "Add sources and extract"} />
          </div>
        </div>

        <aside className="border-t border-[var(--color-app-border)] p-4 sm:p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              Production lane
            </p>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              mode === "demo" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
            )}>
              {mode === "demo" ? "Demo case" : "Live case"}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {nextActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "group w-full rounded-md border border-slate-200 px-3 py-2 text-left transition",
                  action.disabled
                    ? "cursor-not-allowed bg-slate-50 text-navy-300"
                    : "bg-white hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                )}
              >
                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-navy-900 group-hover:text-diplomatic-blue">
                  <span className="flex items-center gap-2">{action.icon}{action.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-navy-500">{action.detail}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-800">
              <FileOutput className="h-3.5 w-3.5 text-gold-600" />
              Export posture
            </p>
            <p className="mt-1 text-[11px] leading-snug text-navy-500">
              PRAXIS currently generates DOCX, PDF, JSON, and CSV artifacts. LibreOffice is best treated as the
              desktop/editor layer for exported DOCX files until a managed document-editing service is provisioned.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {onUpload ? (
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={onUpload}>
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
            ) : null}
            {onBuildContextPack ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                disabled={metrics.documentCount === 0}
                onClick={onBuildContextPack}
              >
                <Brain className="h-3.5 w-3.5" />
                Context pack
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

function MetricTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-navy-900">{value}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-navy-500">{detail}</p>
    </div>
  );
}

function buildWorkspaceMetrics(documents: DocumentWorkspaceDocument[]) {
  const documentCount = documents.length;
  const extractedCount = documents.filter((doc) => doc.status === "extracted").length;
  const totalEntities = documents.reduce((sum, doc) => sum + (Number.isFinite(doc.entityCount) ? doc.entityCount : 0), 0);
  const totalChunks = documents.reduce((sum, doc) => sum + (Number.isFinite(doc.chunkCount) ? doc.chunkCount : 0), 0);
  const fileTypes = new Set(documents.map((doc) => doc.fileType?.toLowerCase()).filter(Boolean)).size;
  const hasActorLayer = documents.some((doc) => Array.isArray(doc.entities?.actors) && doc.entities.actors.length > 0);
  const hasEventLayer = documents.some((doc) => Array.isArray(doc.entities?.events) && doc.entities.events.length > 0);

  const readiness = Math.min(100, Math.round(
    (documentCount > 0 ? 20 : 0) +
    (documentCount > 0 ? (extractedCount / documentCount) * 25 : 0) +
    Math.min(totalEntities / 50, 1) * 20 +
    Math.min(totalChunks / 20, 1) * 20 +
    (hasActorLayer ? 7.5 : 0) +
    (hasEventLayer ? 7.5 : 0)
  ));

  return {
    documentCount,
    extractedCount,
    totalEntities,
    totalChunks,
    fileTypes,
    hasActorLayer,
    hasEventLayer,
    readiness,
    draftReady: documentCount > 0 && extractedCount > 0 && totalEntities >= 10,
  };
}

type WorkspaceMetrics = ReturnType<typeof buildWorkspaceMetrics>;

function buildStages(metrics: WorkspaceMetrics) {
  return [
    {
      label: "Intake",
      detail: metrics.documentCount ? `${metrics.documentCount} source files available` : "Upload source material",
      complete: metrics.documentCount > 0,
      active: metrics.documentCount === 0,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: "Extract",
      detail: metrics.extractedCount ? `${metrics.extractedCount} documents extracted` : "Run entity extraction",
      complete: metrics.extractedCount > 0,
      active: metrics.documentCount > 0 && metrics.extractedCount === 0,
      icon: <Search className="h-4 w-4" />,
    },
    {
      label: "Structure",
      detail: metrics.totalEntities ? `${metrics.totalEntities} graph primitives` : "Actors, claims, events, constraints",
      complete: metrics.totalEntities >= 10,
      active: metrics.extractedCount > 0 && metrics.totalEntities < 10,
      icon: <Network className="h-4 w-4" />,
    },
    {
      label: "Context",
      detail: metrics.totalChunks ? `${metrics.totalChunks} retrievable chunks` : "Index for grounded answers",
      complete: metrics.totalChunks > 0,
      active: metrics.totalEntities > 0 && metrics.totalChunks === 0,
      icon: <Database className="h-4 w-4" />,
    },
    {
      label: "Draft",
      detail: metrics.draftReady ? "Memo and dossier tools are ready" : "Needs extracted evidence",
      complete: metrics.draftReady,
      active: metrics.totalEntities >= 10 && !metrics.draftReady,
      icon: <PenLine className="h-4 w-4" />,
    },
    {
      label: "Export",
      detail: "DOCX, PDF, JSON, CSV",
      complete: metrics.draftReady,
      active: false,
      icon: <FileOutput className="h-4 w-4" />,
    },
  ];
}

function buildNextActions(metrics: WorkspaceMetrics, route: (path: string) => string) {
  return [
    {
      label: "Open Conflict Graph",
      detail: "Inspect extracted actors, claims, constraints, events, and edges.",
      icon: <GitBranch className="h-3.5 w-3.5" />,
      disabled: metrics.totalEntities === 0,
      onClick: () => window.location.assign(route("/conflict-graph")),
    },
    {
      label: "Draft Policy Memo",
      detail: "Turn the context into decision options, risks, and recommended actions.",
      icon: <PenLine className="h-3.5 w-3.5" />,
      disabled: !metrics.draftReady,
      onClick: () => window.location.assign(route("/policy-memo")),
    },
    {
      label: "Export Center",
      detail: "Package structured outputs for review, sharing, and offline editing.",
      icon: <FileOutput className="h-3.5 w-3.5" />,
      disabled: metrics.documentCount === 0,
      onClick: () => window.location.assign(route("/export-center")),
    },
    {
      label: "Dashboard Readiness",
      detail: "Return to the command view and confirm the next best tools.",
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      disabled: false,
      onClick: () => window.location.assign(route("/dashboard")),
    },
  ];
}
