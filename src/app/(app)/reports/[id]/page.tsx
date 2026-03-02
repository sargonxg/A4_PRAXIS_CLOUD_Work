"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { REPORT_TEMPLATES } from "@/lib/constants/templates";
import { ReportComposer } from "@/components/reports/report-composer";
import type { Report } from "@/stores/report-store";

/* -------------------------------------------------------------------------- */
/*  Mock existing reports keyed by id                                          */
/* -------------------------------------------------------------------------- */

const MOCK_REPORT_DATA: Record<string, Report> = {
  "rpt-001": {
    id: "rpt-001",
    title: "Nordalia Crisis Situation Report - February 2026",
    templateId: "situation-report",
    templateName: "Situation Report (SITREP)",
    status: "review",
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: "2026-02-28T14:30:00Z",
    sections: [
      {
        id: "executive-summary",
        title: "Executive Summary",
        description:
          "High-level overview of the current situation and key developments.",
        content:
          "The ongoing crisis in Nordalia has entered a critical phase following the breakdown of ceasefire negotiations on 15 February 2026. The escalation of hostilities along the eastern border corridor has displaced an estimated 47,000 civilians, with UNHCR reporting a 340% increase in cross-border movements into neighboring Vestralia over the past three weeks.\n\nThe diplomatic landscape remains fragile. While the Nordalian government has signaled willingness to return to the negotiating table, opposition forces under General Kaverin continue to reject preconditions set by the mediating body.",
        status: "draft",
      },
      {
        id: "situation-overview",
        title: "Situation Overview",
        description:
          "Detailed assessment of political, security, and humanitarian conditions.",
        content:
          "**Political Developments:** The Nordalian Parliament's emergency session on 12 February produced no consensus on the proposed ceasefire framework. The ruling coalition faces internal divisions, with the Progressive Democratic Front breaking ranks to demand direct negotiations with opposition forces.\n\n**Security Situation:** Armed clashes have intensified in the eastern provinces of Ostrava and Krennik, with confirmed reports of heavy artillery deployment near civilian population centers.",
        status: "draft",
      },
      {
        id: "key-developments",
        title: "Key Developments",
        description:
          "Chronological account of significant events since the last reporting period.",
        content:
          "- **12 Feb 2026:** Nordalian Parliament emergency session fails to ratify ceasefire framework\n- **15 Feb 2026:** Ceasefire deadline expires without renewal\n- **18 Feb 2026:** Two UNMIN observation posts damaged\n- **20 Feb 2026:** Meridian Alliance emergency summit issues 30-day ultimatum",
        status: "draft",
      },
      {
        id: "stakeholder-analysis",
        title: "Stakeholder Analysis",
        description:
          "Assessment of key actors, their positions, interests, and influence.",
        content:
          "**Nordalian Government (President Volkov):** Faces dual pressure from domestic hardliners demanding military solution and international community pushing for negotiated settlement.",
        status: "draft",
      },
      {
        id: "risk-assessment",
        title: "Risk Assessment",
        description:
          "Identification and evaluation of risks to peace, stability, and humanitarian operations.",
        content:
          "**Critical Risk - Humanitarian catastrophe in eastern Ostrava:** Probability HIGH. The siege of civilian areas combined with dwindling supplies creates conditions for mass casualty events within 2-3 weeks without intervention.",
        status: "draft",
      },
      {
        id: "recommendations",
        title: "Recommendations",
        description:
          "Proposed actions and policy recommendations based on the analysis.",
        content: "",
        status: "empty",
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function ReportViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Find the matching report, or create a fallback
  const existingReport = MOCK_REPORT_DATA[id];

  // Find matching template
  const template = REPORT_TEMPLATES.find(
    (t) => t.id === (existingReport?.templateId ?? "situation-report")
  ) ?? REPORT_TEMPLATES[0];

  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-4rem)]">
      <ReportComposer
        template={template}
        existingReport={existingReport}
        onBack={() => router.push("/reports")}
      />
    </div>
  );
}
