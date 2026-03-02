export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: { id: string; title: string; description: string }[];
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "situation-report",
    name: "Situation Report (SITREP)",
    description:
      "Standard situation report for tracking evolving conflict or crisis developments with structured sections for analysis and recommendations.",
    sections: [
      {
        id: "executive-summary",
        title: "Executive Summary",
        description:
          "High-level overview of the current situation and key developments.",
      },
      {
        id: "situation-overview",
        title: "Situation Overview",
        description:
          "Detailed assessment of political, security, and humanitarian conditions.",
      },
      {
        id: "key-developments",
        title: "Key Developments",
        description:
          "Chronological account of significant events since the last reporting period.",
      },
      {
        id: "stakeholder-analysis",
        title: "Stakeholder Analysis",
        description:
          "Assessment of key actors, their positions, interests, and influence.",
      },
      {
        id: "risk-assessment",
        title: "Risk Assessment",
        description:
          "Identification and evaluation of risks to peace, stability, and humanitarian operations.",
      },
      {
        id: "recommendations",
        title: "Recommendations",
        description:
          "Proposed actions and policy recommendations based on the analysis.",
      },
    ],
  },
  {
    id: "briefing-note",
    name: "Briefing Note",
    description:
      "Concise briefing document for senior leadership summarizing key issues and providing actionable recommendations.",
    sections: [
      {
        id: "purpose",
        title: "Purpose",
        description: "Statement of the briefing's objective and intended audience.",
      },
      {
        id: "background",
        title: "Background",
        description: "Essential context and historical background for the issue.",
      },
      {
        id: "current-situation",
        title: "Current Situation",
        description: "Up-to-date assessment of the present state of affairs.",
      },
      {
        id: "options-analysis",
        title: "Options Analysis",
        description:
          "Evaluation of available courses of action with pros and cons.",
      },
      {
        id: "recommendations",
        title: "Recommendations",
        description: "Recommended course of action with supporting rationale.",
      },
    ],
  },
  {
    id: "conflict-analysis",
    name: "Conflict Analysis",
    description:
      "In-depth analysis of conflict dynamics including root causes, drivers, and potential pathways to resolution.",
    sections: [
      {
        id: "conflict-profile",
        title: "Conflict Profile",
        description:
          "Overview of the conflict including geography, timeline, and key statistics.",
      },
      {
        id: "root-causes",
        title: "Root Causes",
        description:
          "Analysis of structural, political, and socio-economic root causes.",
      },
      {
        id: "conflict-dynamics",
        title: "Conflict Dynamics",
        description: "Assessment of escalation patterns, triggers, and feedback loops.",
      },
      {
        id: "actor-mapping",
        title: "Actor Mapping",
        description:
          "Detailed mapping of conflict actors, alliances, and power relations.",
      },
      {
        id: "scenarios",
        title: "Scenarios",
        description:
          "Possible future trajectories ranging from best to worst case.",
      },
      {
        id: "peacebuilding-entry",
        title: "Peacebuilding Entry Points",
        description:
          "Identified opportunities for intervention and conflict resolution.",
      },
    ],
  },
  {
    id: "early-warning",
    name: "Early Warning Alert",
    description:
      "Rapid alert document flagging emerging threats or escalation indicators requiring immediate attention.",
    sections: [
      {
        id: "alert-summary",
        title: "Alert Summary",
        description: "Concise description of the emerging threat or indicator.",
      },
      {
        id: "indicators",
        title: "Escalation Indicators",
        description:
          "Specific observable indicators that triggered this alert.",
      },
      {
        id: "context",
        title: "Context",
        description: "Background information necessary to understand the alert.",
      },
      {
        id: "immediate-actions",
        title: "Recommended Immediate Actions",
        description: "Urgent steps recommended to mitigate the identified risk.",
      },
    ],
  },
  {
    id: "mission-report",
    name: "Mission Report",
    description:
      "Post-mission report documenting findings, observations, and recommendations from field visits.",
    sections: [
      {
        id: "mission-overview",
        title: "Mission Overview",
        description:
          "Purpose, dates, locations visited, and personnel involved.",
      },
      {
        id: "findings",
        title: "Key Findings",
        description:
          "Principal observations and findings from the field mission.",
      },
      {
        id: "meetings-consultations",
        title: "Meetings & Consultations",
        description:
          "Summary of meetings held and key points from consultations.",
      },
      {
        id: "observations",
        title: "Field Observations",
        description: "Direct observations on conditions, challenges, and needs.",
      },
      {
        id: "recommendations",
        title: "Recommendations",
        description:
          "Recommendations for follow-up action based on mission findings.",
      },
    ],
  },
  {
    id: "policy-brief",
    name: "Policy Brief",
    description:
      "Targeted policy document presenting evidence-based analysis and specific policy recommendations on a focused issue.",
    sections: [
      {
        id: "issue-statement",
        title: "Issue Statement",
        description:
          "Clear articulation of the policy issue being addressed.",
      },
      {
        id: "evidence-base",
        title: "Evidence Base",
        description:
          "Data, research, and evidence supporting the analysis.",
      },
      {
        id: "policy-options",
        title: "Policy Options",
        description:
          "Range of policy options with comparative assessment.",
      },
      {
        id: "recommended-policy",
        title: "Recommended Policy",
        description:
          "Preferred policy option with implementation considerations.",
      },
      {
        id: "implementation",
        title: "Implementation Roadmap",
        description:
          "Steps, timeline, and resources required for implementation.",
      },
    ],
  },
];
