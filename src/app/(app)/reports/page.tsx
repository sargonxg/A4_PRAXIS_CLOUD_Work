import Link from "next/link";
import {
  FileText,
  Plus,
  MoreVertical,
  Clock,
  Pencil,
  Trash2,
  Copy,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

/* -------------------------------------------------------------------------- */
/*  Mock report data                                                          */
/* -------------------------------------------------------------------------- */

interface MockReport {
  id: string;
  title: string;
  template: string;
  status: "draft" | "review" | "final";
  lastModified: string;
  author: string;
  sections: number;
  completedSections: number;
}

const MOCK_REPORTS: MockReport[] = [
  {
    id: "rpt-001",
    title: "Nordalia Crisis Situation Report - February 2026",
    template: "Situation Report (SITREP)",
    status: "review",
    lastModified: "2026-02-28T14:30:00Z",
    author: "Demo Analyst",
    sections: 6,
    completedSections: 5,
  },
  {
    id: "rpt-002",
    title: "Security Council Briefing Note - Nordalia Ceasefire",
    template: "Briefing Note",
    status: "final",
    lastModified: "2026-02-26T09:15:00Z",
    author: "Demo Analyst",
    sections: 5,
    completedSections: 5,
  },
  {
    id: "rpt-003",
    title: "Eastern Provinces Conflict Analysis",
    template: "Conflict Analysis",
    status: "draft",
    lastModified: "2026-02-25T16:45:00Z",
    author: "Demo Analyst",
    sections: 6,
    completedSections: 2,
  },
  {
    id: "rpt-004",
    title: "Ostrava Corridor Early Warning - Escalation Alert",
    template: "Early Warning Alert",
    status: "final",
    lastModified: "2026-02-24T08:00:00Z",
    author: "Demo Analyst",
    sections: 4,
    completedSections: 4,
  },
  {
    id: "rpt-005",
    title: "Western Ostrava Field Mission Report",
    template: "Mission Report",
    status: "draft",
    lastModified: "2026-02-22T11:20:00Z",
    author: "Demo Analyst",
    sections: 5,
    completedSections: 3,
  },
  {
    id: "rpt-006",
    title: "Humanitarian Access Policy Brief",
    template: "Policy Brief",
    status: "review",
    lastModified: "2026-02-20T13:50:00Z",
    author: "Demo Analyst",
    sections: 5,
    completedSections: 4,
  },
  {
    id: "rpt-007",
    title: "Meridian Alliance Response Assessment",
    template: "Briefing Note",
    status: "draft",
    lastModified: "2026-02-18T10:30:00Z",
    author: "Demo Analyst",
    sections: 5,
    completedSections: 1,
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const STATUS_VARIANTS: Record<
  MockReport["status"],
  { variant: "secondary" | "gold" | "sage"; label: string }
> = {
  draft: { variant: "secondary", label: "Draft" },
  review: { variant: "gold", label: "In Review" },
  final: { variant: "sage", label: "Final" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-700 bg-navy-900/50 px-6 py-4">
        <div>
          <h1 className="font-serif text-2xl text-navy-50">Report Studio</h1>
          <p className="mt-1 text-sm text-navy-400">
            Create, edit, and manage diplomatic reports with AI assistance
          </p>
        </div>
        <Link href="/reports/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          <div className="rounded-lg border border-navy-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-800/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Template
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Last Modified
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50">
                {MOCK_REPORTS.map((report) => {
                  const statusInfo = STATUS_VARIANTS[report.status];
                  const progress = Math.round(
                    (report.completedSections / report.sections) * 100
                  );

                  return (
                    <tr
                      key={report.id}
                      className="group transition-colors hover:bg-navy-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/reports/${report.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy-700 text-navy-300 group-hover:bg-navy-600 group-hover:text-gold-400 transition-colors">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-navy-100 group-hover:text-gold-400 transition-colors line-clamp-1">
                            {report.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-navy-400">
                          {report.template}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-700">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                progress === 100
                                  ? "bg-sage"
                                  : progress > 50
                                    ? "bg-teal"
                                    : "bg-gold-500"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-navy-500">
                            {report.completedSections}/{report.sections}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-navy-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDate(report.lastModified)},{" "}
                            {formatTime(report.lastModified)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-crimson focus:text-crimson">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
