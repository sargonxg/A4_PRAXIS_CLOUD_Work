"use client";

import { useSituationGuard } from "@/hooks/use-situation-guard";
import { NoSituationState } from "@/components/praxis/no-situation-state";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  File,
  Upload,
  Search,
  Eye,
  Download,
  Filter,
  ChevronDown,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Users,
  MapPin,
  Calendar,
  Activity,
  FileUp,
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
import { DocumentUploader } from "@/components/shared/document-uploader";

/* ====================================================================
   TYPES
   ==================================================================== */
type DocType = "PDF" | "DOCX" | "TXT" | "CSV";
type DocStatus = "Processed" | "Queued" | "Processing" | "Error";

interface ExtractedEntity {
  label: string;
  type: "actor" | "location" | "event" | "date" | "theme";
  confidence: number;
}

interface DocUsage {
  reportTitle: string;
  date: string;
  section: string;
}

interface DocumentItem {
  id: string;
  type: DocType;
  name: string;
  date: string;
  status: DocStatus;
  size: string;
  preview: string;
  entities: ExtractedEntity[];
  usage: DocUsage[];
}

/* ====================================================================
   MOCK DATA
   ==================================================================== */
const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc_001",
    type: "PDF",
    name: "SG Report S/2026/100 — Situation in Nordalia",
    date: "2026-02-28",
    status: "Processed",
    size: "2.4 MB",
    preview:
      "I. Introduction\n\n1.\tThe present report is submitted pursuant to Security Council resolution 2718 (2025), by which the Council requested the Secretary-General to report every 90 days on the situation in Nordalia.\n\n2.\tThe reporting period covers the period from 1 December 2025 to 28 February 2026. During this period, the security situation in the northern provinces deteriorated significantly, with a marked increase in armed confrontations between government forces and the Northern Liberation Front (NLF).\n\n3.\tThe ceasefire agreement brokered on 15 January 2026 has not held. UNNPM documented 47 violations during the reporting period, the majority attributed to NLF forces operating in the Valkhora-Drakmere corridor.\n\nII. Political developments\n\n4.\tThe Special Envoy conducted three rounds of shuttle diplomacy between the parties during January and February. While both sides have expressed commitment to dialogue, substantive negotiations have not resumed.",
    entities: [
      { label: "Government of Nordalia", type: "actor", confidence: 0.96 },
      { label: "Northern Liberation Front (NLF)", type: "actor", confidence: 0.98 },
      { label: "UNNPM", type: "actor", confidence: 0.95 },
      { label: "Special Envoy", type: "actor", confidence: 0.92 },
      { label: "Valkhora", type: "location", confidence: 0.94 },
      { label: "Drakmere", type: "location", confidence: 0.93 },
      { label: "Ceasefire violation", type: "event", confidence: 0.91 },
      { label: "15 January 2026", type: "date", confidence: 0.97 },
      { label: "Armed confrontation", type: "event", confidence: 0.88 },
      { label: "Shuttle diplomacy", type: "event", confidence: 0.85 },
      { label: "Security Council resolution 2718", type: "theme", confidence: 0.94 },
      { label: "Ceasefire agreement", type: "theme", confidence: 0.96 },
    ],
    usage: [
      {
        reportTitle: "Weekly Situation Report #12",
        date: "2026-03-01",
        section: "Political Overview",
      },
      {
        reportTitle: "Nordalia Crisis Brief — March 2026",
        date: "2026-03-02",
        section: "Background",
      },
    ],
  },
  {
    id: "doc_002",
    type: "DOCX",
    name: "Ceasefire Agreement — Nordalia Parties",
    date: "2026-02-25",
    status: "Processed",
    size: "890 KB",
    preview:
      "AGREEMENT ON THE CESSATION OF HOSTILITIES\nBetween the Government of the Republic of Nordalia\nand the Northern Liberation Front\n\nPreamble\n\nThe Parties to this Agreement, desiring to end the armed conflict and create conditions conducive to a political settlement, have agreed as follows:\n\nArticle 1: Cessation of Hostilities\nAll parties shall cease all military operations effective 0001 hours on 15 January 2026.\n\nArticle 2: Cantonment and Disarmament\nWithin 60 days of the entry into force of this Agreement, NLF forces shall proceed to designated cantonment sites for verification and disarmament.\n\nArticle 3: Monitoring Mechanism\nUNNPM shall establish a Joint Ceasefire Monitoring Committee with representatives of both parties.",
    entities: [
      { label: "Government of Nordalia", type: "actor", confidence: 0.98 },
      { label: "Northern Liberation Front", type: "actor", confidence: 0.97 },
      { label: "UNNPM", type: "actor", confidence: 0.96 },
      { label: "15 January 2026", type: "date", confidence: 0.99 },
      { label: "Cessation of hostilities", type: "event", confidence: 0.95 },
      { label: "Cantonment", type: "theme", confidence: 0.90 },
      { label: "Disarmament", type: "theme", confidence: 0.93 },
      { label: "Monitoring mechanism", type: "theme", confidence: 0.88 },
    ],
    usage: [
      {
        reportTitle: "SG Report S/2026/100",
        date: "2026-02-28",
        section: "Political developments",
      },
    ],
  },
  {
    id: "doc_003",
    type: "PDF",
    name: "Field Assessment — Northern Provinces",
    date: "2026-02-20",
    status: "Queued",
    size: "5.1 MB",
    preview:
      "UNNPM FIELD ASSESSMENT\nNorthern Provinces: Valkhora, Drakmere, Korvassi\nDate: 15-19 February 2026\n\nExecutive Summary\n\nThis assessment was conducted by a multidisciplinary UNNPM team following reports of escalating violence and displacement in the northern provinces. Key findings include:\n\n- Estimated 340,000 newly displaced persons in Valkhora province alone\n- Severe constraints on humanitarian access in NLF-controlled areas\n- Reports of forced recruitment of children in Korvassi\n- Critical shortages of medical supplies in all three provinces\n- Infrastructure damage rendering key supply routes impassable",
    entities: [
      { label: "UNNPM", type: "actor", confidence: 0.95 },
      { label: "Valkhora", type: "location", confidence: 0.97 },
      { label: "Drakmere", type: "location", confidence: 0.96 },
      { label: "Korvassi", type: "location", confidence: 0.95 },
      { label: "Displacement", type: "event", confidence: 0.92 },
      { label: "Forced recruitment", type: "event", confidence: 0.88 },
      { label: "Humanitarian access", type: "theme", confidence: 0.90 },
    ],
    usage: [],
  },
  {
    id: "doc_004",
    type: "TXT",
    name: "Meeting Notes — Contact Group Session Feb 18",
    date: "2026-02-18",
    status: "Processed",
    size: "45 KB",
    preview:
      "CONTACT GROUP ON NORDALIA — SESSION NOTES\nDate: 18 February 2026\nVenue: UN Headquarters, Conference Room 4\nChair: Special Envoy M. Delacroix\n\nAttendees: Representatives of Nordalia, NLF political wing, neighboring states (Valterra, Edrossian Republic), P5 members, AU, EU.\n\nAgenda:\n1. Security situation update\n2. Status of ceasefire implementation\n3. Humanitarian access\n4. Next steps for political dialogue\n\nKey Discussions:\n- Government delegation expressed concern over NLF non-compliance with cantonment timeline\n- NLF representative cited security guarantees as precondition for disarmament\n- Humanitarian coordinator reported access denied in 6 districts\n- P3 members advocated for strengthened sanctions if violations continue",
    entities: [
      { label: "Special Envoy Delacroix", type: "actor", confidence: 0.94 },
      { label: "Government of Nordalia", type: "actor", confidence: 0.92 },
      { label: "NLF", type: "actor", confidence: 0.93 },
      { label: "Valterra", type: "actor", confidence: 0.89 },
      { label: "Edrossian Republic", type: "actor", confidence: 0.88 },
      { label: "18 February 2026", type: "date", confidence: 0.98 },
      { label: "Cantonment non-compliance", type: "event", confidence: 0.86 },
      { label: "Sanctions discussion", type: "theme", confidence: 0.84 },
    ],
    usage: [
      {
        reportTitle: "Weekly Situation Report #11",
        date: "2026-02-22",
        section: "Diplomatic Activity",
      },
      {
        reportTitle: "SG Report S/2026/100",
        date: "2026-02-28",
        section: "Political developments",
      },
    ],
  },
  {
    id: "doc_005",
    type: "PDF",
    name: "Media Monitoring Report — Feb 2026",
    date: "2026-02-15",
    status: "Processed",
    size: "1.8 MB",
    preview:
      "UNNPM STRATEGIC COMMUNICATIONS\nMedia Monitoring Report — 1-15 February 2026\n\nOverview:\nMedia coverage of the Nordalia crisis intensified during the reporting period, driven primarily by the ceasefire breakdown and escalating humanitarian concerns.\n\nKey Narratives:\n- International media: Focus on humanitarian crisis, calls for stronger UN response\n- Nordalia state media: Framing NLF as terrorists, justifying military operations\n- NLF-affiliated outlets: Government accused of targeting civilians\n- Regional media: Concern about refugee flows into Valterra\n- Social media: Significant increase in disinformation campaigns by both sides",
    entities: [
      { label: "UNNPM", type: "actor", confidence: 0.93 },
      { label: "NLF", type: "actor", confidence: 0.90 },
      { label: "Nordalia state media", type: "actor", confidence: 0.85 },
      { label: "Valterra", type: "location", confidence: 0.88 },
      { label: "Disinformation", type: "theme", confidence: 0.87 },
      { label: "Media narratives", type: "theme", confidence: 0.82 },
    ],
    usage: [
      {
        reportTitle: "Nordalia Crisis Brief — March 2026",
        date: "2026-03-02",
        section: "Information Environment",
      },
    ],
  },
  {
    id: "doc_006",
    type: "DOCX",
    name: "Political Analysis — Stakeholder Mapping",
    date: "2026-02-10",
    status: "Processed",
    size: "1.2 MB",
    preview:
      "POLITICAL ANALYSIS: STAKEHOLDER MAPPING — NORDALIA CONFLICT\n\nClassification: SENSITIVE — INTERNAL USE ONLY\n\nExecutive Summary:\nThis analysis maps the principal actors in the Nordalia conflict, their interests, capacities, and relationships. It identifies potential spoilers, mediators, and leverage points for the peace process.\n\nPrimary Actors:\n1. Government of Nordalia — President Morvak's administration\n2. Northern Liberation Front (NLF) — Military and political wings\n3. Civic Alliance for Peace (CAP) — Civil society coalition\n4. Nordalia Defense Forces (NDF) — Government military\n5. NLF Armed Wing — Commander Rashid Voss\n\nExternal Actors:\n6. Valterra — Regional power, accused of supporting NLF\n7. Edrossian Republic — Government ally, arms supplier\n8. United Nations — UNNPM, Special Envoy",
    entities: [
      { label: "President Morvak", type: "actor", confidence: 0.96 },
      { label: "Commander Rashid Voss", type: "actor", confidence: 0.94 },
      { label: "Civic Alliance for Peace", type: "actor", confidence: 0.91 },
      { label: "Nordalia Defense Forces", type: "actor", confidence: 0.93 },
      { label: "Valterra", type: "actor", confidence: 0.92 },
      { label: "Edrossian Republic", type: "actor", confidence: 0.90 },
      { label: "Stakeholder mapping", type: "theme", confidence: 0.95 },
      { label: "Spoiler analysis", type: "theme", confidence: 0.87 },
    ],
    usage: [
      {
        reportTitle: "SG Report S/2026/100",
        date: "2026-02-28",
        section: "Political developments",
      },
      {
        reportTitle: "Talking Points — SC Briefing March",
        date: "2026-03-01",
        section: "Background",
      },
    ],
  },
  {
    id: "doc_007",
    type: "CSV",
    name: "Incident Data Q4 2025 — Ceasefire Violations",
    date: "2026-02-05",
    status: "Processed",
    size: "340 KB",
    preview:
      "incident_id,date,location,type,perpetrator,casualties_civilian,casualties_military,description\nINC-2025-401,2025-10-03,Valkhora,Shelling,NLF,12,3,\"Artillery shelling of government checkpoint at eastern Valkhora crossing\"\nINC-2025-402,2025-10-05,Drakmere,Ambush,Unknown,0,7,\"Ambush on NDF convoy along Route 7\"\nINC-2025-403,2025-10-08,Korvassi,Airstrike,NDF,24,0,\"Aerial bombardment of residential area in Korvassi town center\"\nINC-2025-404,2025-10-12,Valkhora,Checkpoint,NLF,3,0,\"Extortion and assault at NLF-controlled checkpoint\"\n...\n(347 total incidents recorded)",
    entities: [
      { label: "Valkhora", type: "location", confidence: 0.97 },
      { label: "Drakmere", type: "location", confidence: 0.96 },
      { label: "Korvassi", type: "location", confidence: 0.95 },
      { label: "NLF", type: "actor", confidence: 0.94 },
      { label: "NDF", type: "actor", confidence: 0.93 },
      { label: "347 incidents", type: "event", confidence: 0.99 },
      { label: "Ceasefire violations", type: "theme", confidence: 0.97 },
    ],
    usage: [
      {
        reportTitle: "SG Report S/2026/100",
        date: "2026-02-28",
        section: "Security situation",
      },
      {
        reportTitle: "Weekly Situation Report #10",
        date: "2026-02-08",
        section: "Incident Tracking",
      },
    ],
  },
  {
    id: "doc_008",
    type: "PDF",
    name: "Human Rights Situation Brief — Korvassi Province",
    date: "2026-01-30",
    status: "Error",
    size: "3.7 MB",
    preview:
      "OHCHR FIELD OFFICE — NORDALIA\nSituation Brief: Human Rights Situation in Korvassi Province\nJanuary 2026\n\n[Note: Document partially extracted — OCR errors detected in pages 12-18]\n\nI. Summary of Key Concerns\n\nThe human rights situation in Korvassi province remains deeply alarming. During the reporting period, OHCHR documented:\n\n- 23 cases of extrajudicial killings attributed to NDF operations\n- Ongoing forced recruitment of children by NLF-affiliated militia\n- Systematic destruction of civilian property in contested areas\n- Restriction of movement affecting approximately 180,000 persons\n- Reports of sexual violence used as a weapon of conflict",
    entities: [
      { label: "OHCHR", type: "actor", confidence: 0.95 },
      { label: "NDF", type: "actor", confidence: 0.91 },
      { label: "NLF", type: "actor", confidence: 0.90 },
      { label: "Korvassi", type: "location", confidence: 0.97 },
      { label: "Extrajudicial killings", type: "event", confidence: 0.93 },
      { label: "Forced recruitment", type: "event", confidence: 0.92 },
      { label: "Sexual violence", type: "event", confidence: 0.89 },
      { label: "Human rights violations", type: "theme", confidence: 0.96 },
    ],
    usage: [
      {
        reportTitle: "SG Report S/2026/100",
        date: "2026-02-28",
        section: "Human rights and protection",
      },
    ],
  },
];

/* ====================================================================
   HELPERS
   ==================================================================== */
function getDocIcon(type: DocType) {
  switch (type) {
    case "PDF":
      return <FileText className="h-4 w-4 text-crimson" />;
    case "DOCX":
      return <FileText className="h-4 w-4 text-teal" />;
    case "CSV":
      return <FileSpreadsheet className="h-4 w-4 text-sage" />;
    case "TXT":
      return <File className="h-4 w-4 text-navy-400" />;
  }
}

function getStatusBadge(status: DocStatus) {
  switch (status) {
    case "Processed":
      return (
        <Badge variant="sage" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Processed
        </Badge>
      );
    case "Queued":
      return (
        <Badge variant="gold" className="gap-1">
          <Clock className="h-3 w-3" />
          Queued
        </Badge>
      );
    case "Processing":
      return (
        <Badge variant="teal" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "Error":
      return (
        <Badge variant="crimson" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
  }
}

function getEntityIcon(type: string) {
  switch (type) {
    case "actor":
      return <Users className="h-3.5 w-3.5" />;
    case "location":
      return <MapPin className="h-3.5 w-3.5" />;
    case "event":
      return <Activity className="h-3.5 w-3.5" />;
    case "date":
      return <Calendar className="h-3.5 w-3.5" />;
    case "theme":
      return <Tag className="h-3.5 w-3.5" />;
    default:
      return <Tag className="h-3.5 w-3.5" />;
  }
}

function getEntityBadgeVariant(
  type: string,
): "terracotta" | "teal" | "steel" | "gold" | "sage" {
  switch (type) {
    case "actor":
      return "terracotta";
    case "location":
      return "teal";
    case "event":
      return "steel";
    case "date":
      return "gold";
    case "theme":
      return "sage";
    default:
      return "sage";
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ====================================================================
   MAIN PAGE
   ==================================================================== */
export default function DocumentVaultPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const [documents, setDocuments] = useState<DocumentItem[]>(MOCK_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  /* ---- filtering ---- */
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || doc.type === filterType;
      const matchesStatus =
        filterStatus === "all" || doc.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, filterType, filterStatus]);

  /* ---- upload handler ---- */
  const handleUploadComplete = useCallback(
    (file: {
      name: string;
      type: string;
      size: number;
      entityCount?: number;
      entities?: {
        actors?: Array<{ name: string; confidence: number }>;
        events?: Array<{ title: string; confidence: number }>;
        [k: string]: unknown[] | undefined;
      };
    }) => {
      const extractedEntities: ExtractedEntity[] = [];
      if (file.entities) {
        (file.entities.actors || []).slice(0, 3).forEach((a: { name: string; confidence: number }) => {
          extractedEntities.push({ label: a.name, type: 'actor', confidence: a.confidence });
        });
        (file.entities.events || []).slice(0, 2).forEach((e: { title: string; confidence: number }) => {
          extractedEntities.push({ label: e.title, type: 'event', confidence: e.confidence });
        });
      }
      if (extractedEntities.length === 0) {
        extractedEntities.push({ label: file.name.replace(/\.[^.]+$/, ''), type: 'theme', confidence: 0.8 });
      }

      const newDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        type: file.type as DocType,
        name: file.name,
        date: new Date().toISOString().split("T")[0],
        status: "Processed",
        size: `${(file.size / 1024).toFixed(0)} KB`,
        preview: `[${file.name} — ${file.entityCount ?? 0} conflict entities extracted and indexed by TACITUS AI.]`,
        entities: extractedEntities,
        usage: [],
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setTimeout(() => setUploadDialogOpen(false), 1500);
    },
    [],
  );

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
              {documents.length} documents &middot;{" "}
              {documents.filter((d) => d.status === "Processed").length}{" "}
              processed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch((s) => !s)}
              className={cn(showSearch && "text-gold-400")}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Upload button */}
            <Dialog
              open={uploadDialogOpen}
              onOpenChange={setUploadDialogOpen}
            >
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
                    Upload a document to the vault. It will be automatically
                    processed and entities will be extracted.
                  </DialogDescription>
                </DialogHeader>
                <DocumentUploader onUploadComplete={handleUploadComplete} />
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* ---- SEARCH BAR ---- */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- FILTERS ---- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-6"
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
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="DOCX">DOCX</SelectItem>
              <SelectItem value="TXT">TXT</SelectItem>
              <SelectItem value="CSV">CSV</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Processed">Processed</SelectItem>
              <SelectItem value="Queued">Queued</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Error">Error</SelectItem>
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

        {/* ---- MAIN CONTENT ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Document list — 3 columns */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                {/* Table header */}
                <div className="grid grid-cols-[40px_1fr_80px_100px_60px] gap-2 px-4 py-3 border-b border-[var(--color-app-border)] text-xs font-medium text-navy-500 uppercase tracking-wider">
                  <span>Type</span>
                  <span>Name</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-[var(--color-app-border)]">
                  {filteredDocs.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <FileText className="h-10 w-10 mx-auto text-navy-600 mb-3" />
                      <p className="text-sm text-navy-400">
                        No documents match your filters.
                      </p>
                    </div>
                  ) : (
                    filteredDocs.map((doc, i) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedDoc(doc)}
                        className={cn(
                          "grid grid-cols-[40px_1fr_80px_100px_60px] gap-2 px-4 py-3 items-center cursor-pointer transition-colors",
                          selectedDoc?.id === doc.id
                            ? "bg-[var(--color-app-surface-alt)]"
                            : "hover:bg-navy-100",
                        )}
                      >
                        {/* Type icon */}
                        <div className="flex items-center justify-center">
                          {getDocIcon(doc.type)}
                        </div>

                        {/* Name */}
                        <div className="min-w-0">
                          <p className="text-sm text-navy-900 truncate font-medium">
                            {doc.name}
                          </p>
                          <p className="text-xs text-navy-500">{doc.size}</p>
                        </div>

                        {/* Date */}
                        <span className="text-xs text-navy-400">
                          {formatDate(doc.date)}
                        </span>

                        {/* Status */}
                        <div>{getStatusBadge(doc.status)}</div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(doc);
                            }}
                            className="p-1 rounded hover:bg-navy-100 text-navy-500 hover:text-navy-900 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-navy-100 text-navy-500 hover:text-navy-900 transition-colors cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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
                          {getDocIcon(selectedDoc.type)}
                          <CardTitle className="text-sm truncate">
                            {selectedDoc.name}
                          </CardTitle>
                        </div>
                        <button
                          onClick={() => setSelectedDoc(null)}
                          className="p-1 rounded hover:bg-navy-100 text-navy-500 hover:text-navy-900 shrink-0 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span>{formatDate(selectedDoc.date)}</span>
                        <span>&middot;</span>
                        <span>{selectedDoc.size}</span>
                        <span>&middot;</span>
                        {getStatusBadge(selectedDoc.status)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <Tabs defaultValue="preview" className="space-y-4">
                        <TabsList className="w-full">
                          <TabsTrigger
                            value="preview"
                            className="flex-1 text-xs"
                          >
                            Preview
                          </TabsTrigger>
                          <TabsTrigger
                            value="entities"
                            className="flex-1 text-xs"
                          >
                            Entities
                            <Badge
                              variant="secondary"
                              className="ml-1.5 text-[10px] h-4 px-1.5"
                            >
                              {selectedDoc.entities.length}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger
                            value="usage"
                            className="flex-1 text-xs"
                          >
                            Usage
                            <Badge
                              variant="secondary"
                              className="ml-1.5 text-[10px] h-4 px-1.5"
                            >
                              {selectedDoc.usage.length}
                            </Badge>
                          </TabsTrigger>
                        </TabsList>

                        {/* Preview */}
                        <TabsContent value="preview">
                          <div className="rounded-md bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] p-4 max-h-[400px] overflow-y-auto">
                            <pre className="text-xs text-navy-600 leading-relaxed whitespace-pre-wrap font-mono">
                              {selectedDoc.preview}
                            </pre>
                          </div>
                        </TabsContent>

                        {/* Entities */}
                        <TabsContent value="entities">
                          <div className="space-y-3">
                            {/* Group by type */}
                            {(
                              [
                                "actor",
                                "location",
                                "event",
                                "date",
                                "theme",
                              ] as const
                            ).map((type) => {
                              const entities =
                                selectedDoc.entities.filter(
                                  (e) => e.type === type,
                                );
                              if (entities.length === 0) return null;
                              return (
                                <div key={type}>
                                  <p className="text-xs font-medium text-navy-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    {getEntityIcon(type)}
                                    {type}s
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {entities.map((entity, i) => (
                                      <Badge
                                        key={i}
                                        variant={getEntityBadgeVariant(type)}
                                        className="text-xs"
                                      >
                                        {entity.label}
                                        <span className="ml-1 opacity-60">
                                          {Math.round(
                                            entity.confidence * 100,
                                          )}
                                          %
                                        </span>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>

                        {/* Usage */}
                        <TabsContent value="usage">
                          {selectedDoc.usage.length === 0 ? (
                            <div className="text-center py-8">
                              <FileText className="h-8 w-8 mx-auto text-navy-600 mb-2" />
                              <p className="text-xs text-navy-500">
                                This document has not been referenced in any
                                reports yet.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedDoc.usage.map((use, i) => (
                                <div
                                  key={i}
                                  className="rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3 space-y-1"
                                >
                                  <p className="text-sm font-medium text-navy-900">
                                    {use.reportTitle}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-navy-500">
                                    <span>{formatDate(use.date)}</span>
                                    <span>&middot;</span>
                                    <span>Section: {use.section}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
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
                        Click on a document in the list to view its preview,
                        extracted entities, and usage history.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
