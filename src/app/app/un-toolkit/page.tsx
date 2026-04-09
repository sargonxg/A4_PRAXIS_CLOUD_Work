"use client";

import { useSituationGuard } from "@/hooks/use-situation-guard";
import { useToolData } from "@/hooks/useToolData";
import { NoSituationState } from "@/components/praxis/no-situation-state";
import { RegistryToolInfo } from "@/components/praxis/tool-info-from-registry";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenCheck,
  FileSignature,
  MessageSquareQuote,
  FileOutput,
  Languages,
  Search,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ArrowRightLeft,
  Copy,
  Check,
  ChevronRight,
  Gauge,
  ChevronDown,
  Info,
  LayoutGrid,
  ClipboardList,
  FileText,
  Newspaper,
  ScrollText,
  Globe,
  CheckCircle2,
  XCircle,
  ListChecks,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

/* ====================================================================
   TERMINOLOGY DATABASE
   ==================================================================== */
const TERMINOLOGY_DB: Record<
  string,
  { suggestion: string; note: string; severity: "warning" | "suggestion" }
> = {
  "civil war": {
    suggestion: "internal armed conflict",
    note: "UN avoids 'civil war' for political reasons",
    severity: "warning",
  },
  rebels: {
    suggestion: "armed opposition / non-State armed group",
    note: "Neutral terminology preferred",
    severity: "warning",
  },
  "failed state": {
    suggestion: "state experiencing fragility",
    note: "Pejorative — avoid in UN context",
    severity: "warning",
  },
  tribe: {
    suggestion: "community / ethnic group",
    note: "Can be perceived as dismissive",
    severity: "warning",
  },
  tribal: {
    suggestion: "communal / community-based",
    note: "Can be perceived as dismissive",
    severity: "warning",
  },
  sect: {
    suggestion: "community",
    note: "Context-dependent",
    severity: "suggestion",
  },
  sectarian: {
    suggestion: "community-based / intercommunal",
    note: "Context-dependent",
    severity: "suggestion",
  },
  regime: {
    suggestion: "government / authorities",
    note: "Perceived as delegitimizing unless self-described",
    severity: "warning",
  },
  clash: {
    suggestion: "confrontation / armed engagement",
    note: "'Clash' can imply equivalence",
    severity: "suggestion",
  },
  "conflict resolution": {
    suggestion: "conflict management / peacemaking",
    note: "Many conflicts are managed, not resolved",
    severity: "suggestion",
  },
  "peace-keeping": {
    suggestion: "peacekeeping",
    note: "One word, no hyphen (UN standard)",
    severity: "suggestion",
  },
  "third world": {
    suggestion: "developing countries / Global South",
    note: "Outdated terminology",
    severity: "warning",
  },
  unmanned: {
    suggestion: "uncrewed / remotely piloted",
    note: "Gender-neutral language preferred",
    severity: "suggestion",
  },
  mankind: {
    suggestion: "humankind / humanity",
    note: "Gender-neutral language",
    severity: "suggestion",
  },
  chairman: {
    suggestion: "chairperson / chair",
    note: "Gender-neutral language",
    severity: "suggestion",
  },
  manpower: {
    suggestion: "workforce / personnel",
    note: "Gender-neutral language",
    severity: "suggestion",
  },
  "he or she": {
    suggestion: "they",
    note: "Inclusive language preferred",
    severity: "suggestion",
  },
  victims: {
    suggestion: "affected persons / survivors",
    note: "Agency-preserving language preferred",
    severity: "suggestion",
  },
  "vulnerable groups": {
    suggestion: "persons in vulnerable situations",
    note: "Emphasize situation, not identity",
    severity: "suggestion",
  },
  "illegal immigrants": {
    suggestion: "irregular migrants / undocumented persons",
    note: "People are not 'illegal'",
    severity: "warning",
  },
  "ethnic cleansing": {
    suggestion: "use with care — not a legal term",
    note: "Describe specific acts instead when possible",
    severity: "suggestion",
  },
  genocide: {
    suggestion: "use only when legally determined",
    note: "Legal term with specific threshold",
    severity: "warning",
  },
  terrorist: {
    suggestion: "describe specific acts",
    note: "Highly politicized — be precise about actions",
    severity: "warning",
  },
  "pro-government": {
    suggestion: "government-aligned / government-affiliated",
    note: "More neutral phrasing",
    severity: "suggestion",
  },
  warlord: {
    suggestion: "armed group leader / militia commander",
    note: "Can be perceived as sensationalist",
    severity: "suggestion",
  },
  invasion: {
    suggestion: "military incursion / armed intervention",
    note: "Loaded term — use precise language",
    severity: "suggestion",
  },
  "puppet state": {
    suggestion: "aligned government / client state",
    note: "Avoid pejorative framing",
    severity: "warning",
  },
  coup: {
    suggestion: "unconstitutional change of government",
    note: "Legal term — use precisely",
    severity: "suggestion",
  },
  strongman: {
    suggestion: "authoritarian leader",
    note: "More analytical, less colloquial",
    severity: "suggestion",
  },
  "child soldiers": {
    suggestion: "children associated with armed forces and groups",
    note: "UN standard terminology (Paris Principles)",
    severity: "warning",
  },
  /* --- Phase 6 additions --- */
  war: {
    suggestion: "armed conflict",
    note: "UN avoids the term 'war' for legal and political reasons; 'armed conflict' is the standard under IHL",
    severity: "warning",
  },
  rebel: {
    suggestion: "non-State armed group",
    note: "Neutral IHL-aligned terminology",
    severity: "warning",
  },
  terrorism: {
    suggestion: "check if SC-designated before using",
    note: "Highly politicized — confirm Security Council designation before applying",
    severity: "warning",
  },
  "refugee camp": {
    suggestion: "refugee settlement",
    note: "Many UNHCR and host-government guidelines prefer 'settlement' as less militarized",
    severity: "suggestion",
  },
  "illegal migrants": {
    suggestion: "persons in an irregular migration situation",
    note: "People are not illegal; their status may be irregular",
    severity: "warning",
  },
  "illegal immigrant": {
    suggestion: "person in an irregular migration situation",
    note: "People are not illegal; their status may be irregular",
    severity: "warning",
  },
  "conflict zone": {
    suggestion: "conflict-affected area",
    note: "More precise and less sensationalist than 'zone'",
    severity: "suggestion",
  },
};

/* ====================================================================
   RESOLUTION DRAFTER DATA
   ==================================================================== */
type ParagraphType = "preambular" | "operative";
type Strength = "soft" | "moderate" | "strong";

const RESOLUTION_TEMPLATES: Record<
  ParagraphType,
  Record<Strength, { openers: string[]; templates: string[] }>
> = {
  preambular: {
    soft: {
      openers: ["Noting with interest", "Taking note of", "Acknowledging"],
      templates: [
        "{opener} the efforts undertaken by the parties to the conflict in Nordalia to engage in dialogue and reduce tensions along the ceasefire line,",
        "{opener} the report of the Secretary-General on the situation in Nordalia (S/2026/100) and the observations contained therein regarding the humanitarian and security landscape,",
        "{opener} the ongoing diplomatic initiatives aimed at fostering an inclusive political process that addresses the root causes of the conflict,",
      ],
    },
    moderate: {
      openers: ["Reaffirming", "Recalling", "Bearing in mind"],
      templates: [
        "{opener} its resolution 2718 (2025) and all subsequent relevant resolutions, as well as the statements of its President concerning the situation in Nordalia,",
        "{opener} the primary responsibility of the Government of Nordalia for the protection of civilians within its territory and the imperative of accountability for violations of international humanitarian law,",
        "{opener} the importance of the full and effective participation of women in all stages of the peace process, in accordance with resolution 1325 (2000),",
      ],
    },
    strong: {
      openers: [
        "Deeply concerned by",
        "Expressing alarm at",
        "Gravely disturbed by",
      ],
      templates: [
        "{opener} the deteriorating humanitarian situation in the northern provinces of Nordalia, where an estimated 2.4 million persons have been displaced and access for humanitarian actors remains severely constrained,",
        "{opener} the continued reports of serious violations and abuses of human rights and international humanitarian law, including targeted attacks against civilian infrastructure and the recruitment of children by armed groups,",
        "{opener} the persistent obstruction of humanitarian corridors and the denial of life-saving assistance to populations in besieged areas, which may constitute violations of international humanitarian law,",
      ],
    },
  },
  operative: {
    soft: {
      openers: ["Encourages", "Welcomes", "Invites"],
      templates: [
        "{opener} all parties to the conflict to continue engaging constructively in the mediation efforts led by the Special Envoy, with a view to achieving a sustainable and inclusive political settlement;",
        "{opener} the steps taken by the Government of Nordalia to facilitate humanitarian access and calls for the full and unimpeded delivery of aid to all affected populations;",
        "{opener} Member States and international organizations to provide technical assistance and capacity-building support to national institutions in Nordalia;",
      ],
    },
    moderate: {
      openers: ["Calls upon", "Urges", "Requests"],
      templates: [
        "{opener} all parties to immediately cease hostilities and implement a comprehensive and verifiable ceasefire, in line with the parameters set forth by the Contact Group;",
        "{opener} the Secretary-General to appoint a panel of experts to assess the security situation in the northern provinces and to report to the Council within sixty days;",
        "{opener} Member States to strengthen the arms embargo established pursuant to resolution 2718 (2025) and to take all necessary measures to prevent the illicit transfer of weapons to non-State armed groups operating in Nordalia;",
      ],
    },
    strong: {
      openers: ["Demands", "Decides", "Authorizes"],
      templates: [
        "{opener} that all parties to the conflict immediately cease all forms of violence against civilians, and emphasizes that those responsible for violations of international humanitarian law and international human rights law must be held accountable;",
        "{opener} to extend the mandate of UNNPM for a period of twelve months and authorizes the Mission to use all necessary means, within its area of operations, to protect civilians under imminent threat of physical violence;",
        "{opener} that the Government of Nordalia and all armed groups grant immediate, safe, and unhindered access for humanitarian personnel and supplies to all affected areas, and stresses that deliberate obstruction of humanitarian relief may constitute a violation of international humanitarian law;",
      ],
    },
  },
};

/* ====================================================================
   TALKING POINTS TEMPLATE
   ==================================================================== */
const TALKING_POINTS_TEMPLATE = {
  opening: `Thank you, Mr./Madam President. I wish to brief the Council on recent developments in Nordalia, where the situation continues to demand our urgent and sustained attention.

The past thirty days have seen a significant escalation of hostilities in the northern provinces, with a marked increase in civilian casualties and forced displacement. The fragile ceasefire brokered in January has effectively collapsed, and the humanitarian consequences are severe.`,

  keyMessages: [
    {
      point:
        "The security situation in northern Nordalia has deteriorated significantly since the last briefing, with the ceasefire effectively non-operational.",
      supporting: [
        "UNNPM documented 47 ceasefire violations in February 2026 alone, compared to 12 in January.",
        "Armed clashes between government forces and the Northern Liberation Front (NLF) have intensified around the strategic corridor between Valkhora and Drakmere.",
        "The proliferation of armed groups with shifting allegiances complicates peace efforts.",
      ],
    },
    {
      point:
        "The humanitarian crisis is deepening, with 2.4 million persons displaced and critical shortages of food, water, and medical supplies.",
      supporting: [
        "Access restrictions by all parties continue to impede humanitarian operations in at least 6 districts.",
        "WHO reports that 60% of health facilities in affected areas are non-functional.",
        "WFP warns that food insecurity has reached emergency levels (IPC Phase 4) in three northern provinces.",
      ],
    },
    {
      point:
        "Credible reports of serious human rights violations require immediate and independent investigation.",
      supporting: [
        "OHCHR has documented allegations of extrajudicial killings in Korvassi province.",
        "Continued reports of forced recruitment of children by armed groups, in violation of the Paris Principles.",
        "Sexual violence is being used as a weapon of war, particularly in areas under NLF control.",
      ],
    },
    {
      point:
        "Political dialogue remains the only viable path to a sustainable solution; all parties must return to the negotiating table.",
      supporting: [
        "The Special Envoy's mediation framework provides a credible basis for resumed talks.",
        "Regional actors have a constructive role to play in supporting the peace process.",
        "An inclusive process that ensures the participation of women, youth, and civil society is essential.",
      ],
    },
  ],

  qaSection: [
    {
      question:
        "Is the UN considering a stronger mandate for UNNPM, including the use of force to protect civilians?",
      response:
        "The Secretary-General has asked for a strategic review of UNNPM's mandate, the results of which will be presented to the Council in April. Any adjustments to the mandate will be made in close consultation with troop-contributing countries and in light of the evolving security environment.",
    },
    {
      question:
        "Why has the ceasefire failed, and who bears responsibility?",
      response:
        "The ceasefire's collapse reflects a complex dynamic involving multiple parties. Rather than assigning blame, our priority is to work with all stakeholders to re-establish conditions conducive to a cessation of hostilities. Both the government and armed opposition bear obligations under international humanitarian law.",
    },
    {
      question:
        "What is the UN doing about the reported human rights violations in Korvassi province?",
      response:
        "The High Commissioner for Human Rights has dispatched an assessment team to the region. We are calling for full and unhindered access for investigators. The Secretary-General has been clear that accountability is not optional — it is a prerequisite for sustainable peace.",
    },
  ],

  redLines: [
    "Do not characterize the conflict as a 'civil war' — use 'internal armed conflict'",
    "Do not assign blame to specific parties for the ceasefire breakdown without documented evidence",
    "Do not speculate on potential sanctions or Chapter VII measures before Council deliberations",
    "Do not comment on bilateral relations between Member States involved in the conflict",
    "Avoid the term 'rebels' — use 'armed opposition' or 'non-State armed groups'",
    "Do not discuss classified intelligence assessments or force postures",
  ],
};

/* ====================================================================
   DOCUMENT FORMATTER TEMPLATES
   ==================================================================== */
const DOC_STRUCTURES: Record<
  string,
  { title: string; sections: { heading: string; instruction: string }[] }
> = {
  "sg-report": {
    title: "Report of the Secretary-General on the situation in [country]",
    sections: [
      {
        heading: "I. Introduction",
        instruction:
          "Mandate reference, reporting period, and scope of the report.",
      },
      {
        heading: "II. Political developments",
        instruction:
          "Key political events, dialogue processes, and institutional developments.",
      },
      {
        heading: "III. Security situation",
        instruction:
          "Overview of armed conflict dynamics, ceasefire status, and threat landscape.",
      },
      {
        heading: "IV. Human rights and protection of civilians",
        instruction:
          "Documented violations, protection concerns, and accountability measures.",
      },
      {
        heading: "V. Humanitarian situation",
        instruction:
          "Displacement figures, access constraints, and humanitarian response.",
      },
      {
        heading: "VI. Mission operations",
        instruction:
          "Activities, deployment status, and mission support matters.",
      },
      {
        heading: "VII. Observations and recommendations",
        instruction:
          "Secretary-General's assessment, recommendations to the Council.",
      },
    ],
  },
  "unsc-briefing": {
    title: "Briefing to the United Nations Security Council",
    sections: [
      {
        heading: "Opening Remarks",
        instruction:
          "Acknowledgement of the President and Council members; framing of the briefing.",
      },
      {
        heading: "Situation Overview",
        instruction:
          "Concise assessment of the current political and security landscape.",
      },
      {
        heading: "Key Developments",
        instruction:
          "Significant events since the last briefing, organized thematically.",
      },
      {
        heading: "Humanitarian and Human Rights Concerns",
        instruction:
          "Critical protection and assistance issues requiring Council attention.",
      },
      {
        heading: "Recommendations",
        instruction: "Concrete asks of the Council and the international community.",
      },
    ],
  },
  "political-analysis": {
    title: "Political Analysis: [Subject]",
    sections: [
      {
        heading: "Executive Summary",
        instruction:
          "One-paragraph overview of key findings and assessment.",
      },
      {
        heading: "Background",
        instruction:
          "Contextual information necessary for understanding the current situation.",
      },
      {
        heading: "Analysis",
        instruction:
          "Detailed analytical assessment organized by thematic or geographic axis.",
      },
      {
        heading: "Scenarios",
        instruction:
          "Most likely, best-case, and worst-case scenario projections.",
      },
      {
        heading: "Implications for the Mission/Organization",
        instruction:
          "Operational, political, and strategic implications.",
      },
      {
        heading: "Recommendations",
        instruction:
          "Proposed courses of action with prioritization.",
      },
    ],
  },
  memo: {
    title: "Internal Memorandum",
    sections: [
      {
        heading: "TO / FROM / DATE / SUBJECT",
        instruction: "Standard header block.",
      },
      {
        heading: "Purpose",
        instruction: "Brief statement of the memorandum's purpose.",
      },
      {
        heading: "Background",
        instruction: "Relevant context for the issue at hand.",
      },
      {
        heading: "Analysis/Discussion",
        instruction:
          "Detailed treatment of the subject matter.",
      },
      {
        heading: "Options",
        instruction: "Courses of action with pros and cons, if applicable.",
      },
      {
        heading: "Recommendation",
        instruction: "Recommended course of action.",
      },
    ],
  },
};

/* ====================================================================
   DIPLOMATIC EDITOR DEMO DATA
   ==================================================================== */
interface DiffSegment {
  type: "unchanged" | "added" | "removed";
  text: string;
}

interface TransformResult {
  transformed: string;
  diff: DiffSegment[];
}

function getDiplomaticTransform(
  _input: string,
  mode: string,
): TransformResult {
  switch (mode) {
    case "diplomatic":
      return {
        transformed:
          "The Government of Nordalia has expressed reservations regarding the proposed timeline for cantonment and disarmament, citing legitimate security concerns in the northern provinces. While progress has been more measured than initially anticipated, the parties continue to engage with the mediation framework, and the Special Envoy remains cautiously optimistic that a revised implementation schedule can be agreed upon in the coming weeks.",
        diff: [
          { type: "removed", text: "The Nordalia government refuses to" },
          {
            type: "added",
            text: "The Government of Nordalia has expressed reservations regarding",
          },
          { type: "unchanged", text: " the proposed timeline for " },
          { type: "removed", text: "disarming the rebels" },
          {
            type: "added",
            text: "cantonment and disarmament, citing legitimate security concerns in the northern provinces",
          },
          { type: "unchanged", text: ". " },
          {
            type: "removed",
            text: "They are stalling and the peace process is failing.",
          },
          {
            type: "added",
            text: "While progress has been more measured than initially anticipated, the parties continue to engage with the mediation framework, and the Special Envoy remains cautiously optimistic that a revised implementation schedule can be agreed upon in the coming weeks.",
          },
        ],
      };
    case "direct":
      return {
        transformed:
          "The Government of Nordalia has not met its disarmament obligations under the ceasefire agreement. Three deadlines have been missed. Unless concrete steps are taken within 30 days, the ceasefire framework is at risk of collapse.",
        diff: [
          { type: "unchanged", text: "The Government of Nordalia has " },
          {
            type: "removed",
            text: "encountered challenges in fully implementing",
          },
          { type: "added", text: "not met" },
          { type: "unchanged", text: " its disarmament obligations " },
          {
            type: "removed",
            text: "within the agreed framework. Consultations are ongoing to address remaining concerns.",
          },
          {
            type: "added",
            text: "under the ceasefire agreement. Three deadlines have been missed. Unless concrete steps are taken within 30 days, the ceasefire framework is at risk of collapse.",
          },
        ],
      };
    case "urgent":
      return {
        transformed:
          "The situation in Nordalia demands the Council's immediate attention. Absent decisive action within the coming days, the humanitarian catastrophe in the northern provinces will deepen irreversibly. Every day of inaction costs lives. The Secretary-General urges the Council to act now.",
        diff: [
          { type: "removed", text: "The situation in Nordalia continues to be of concern." },
          {
            type: "added",
            text: "The situation in Nordalia demands the Council's immediate attention.",
          },
          { type: "unchanged", text: " " },
          {
            type: "removed",
            text: "The Council may wish to consider possible measures to address the ongoing challenges.",
          },
          {
            type: "added",
            text: "Absent decisive action within the coming days, the humanitarian catastrophe in the northern provinces will deepen irreversibly. Every day of inaction costs lives. The Secretary-General urges the Council to act now.",
          },
        ],
      };
    case "neutralize":
    default:
      return {
        transformed:
          "The security situation in the northern provinces has undergone notable changes. The actions of the various parties have had differing effects on the civilian population and on the trajectory of the political process. An assessment of the situation, taking into account the perspectives of all stakeholders, is warranted.",
        diff: [
          {
            type: "removed",
            text: "Government forces brutally attacked civilian areas in the north.",
          },
          {
            type: "added",
            text: "The security situation in the northern provinces has undergone notable changes.",
          },
          { type: "unchanged", text: " " },
          {
            type: "removed",
            text: "The regime's aggression has destroyed any hope for peace.",
          },
          {
            type: "added",
            text: "The actions of the various parties have had differing effects on the civilian population and on the trajectory of the political process. An assessment of the situation, taking into account the perspectives of all stakeholders, is warranted.",
          },
        ],
      };
  }
}

/* ====================================================================
   TEMPLATE LIBRARY DATA
   ==================================================================== */

interface TemplateSection {
  heading: string;
  placeholder: string;
}

interface DraftTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  targetTab: string;
  sections: TemplateSection[];
  starterText: string;
}

const DRAFT_TEMPLATES: DraftTemplate[] = [
  {
    id: "options-paper",
    name: "Options Paper",
    description: "Issue analysis with multiple courses of action and recommendation",
    icon: <ClipboardList className="h-5 w-5 text-gold-500" />,
    targetTab: "formatter",
    sections: [
      { heading: "I. Issue", placeholder: "Concise statement of the policy question or problem requiring decision." },
      { heading: "II. Options", placeholder: "Option A — [Name]: Description, pros, cons.\nOption B — [Name]: Description, pros, cons.\nOption C — [Name]: Description, pros, cons." },
      { heading: "III. Analysis", placeholder: "Comparative assessment of options against agreed criteria (feasibility, cost, political acceptability, time horizon)." },
      { heading: "IV. Recommendation", placeholder: "Recommended course of action with rationale and proposed next steps." },
    ],
    starterText: "I. Issue\n[State the policy question requiring a decision.]\n\nII. Options\nOption A — [Name]: [Description. Pros: … Cons: …]\nOption B — [Name]: [Description. Pros: … Cons: …]\nOption C — Status quo: [Description. Pros: … Cons: …]\n\nIII. Analysis\n[Comparative assessment against agreed criteria.]\n\nIV. Recommendation\n[Recommended course of action with rationale.]",
  },
  {
    id: "press-points",
    name: "Points for the Press",
    description: "Press briefing note with header, key messages, and Q&A guidance",
    icon: <Newspaper className="h-5 w-5 text-teal" />,
    targetTab: "talking-points",
    sections: [
      { heading: "Header", placeholder: "Subject, Date, Spokesperson name/role." },
      { heading: "Key Messages", placeholder: "3-5 core messages the spokesperson should convey." },
      { heading: "Q&A", placeholder: "Anticipated questions and approved responses." },
    ],
    starterText: "Press Briefing — [Date]\n\nSubject: [Briefing subject]\n\nKey Messages:\n1. [First key message]\n2. [Second key message]\n3. [Third key message]\n\nAnticipated Q&A:\nQ: [Expected question]\nA: [Approved response]",
  },
  {
    id: "sg-aide-memoire",
    name: "SG Aide-Mémoire",
    description: "Meeting preparation note for the Secretary-General",
    icon: <ScrollText className="h-5 w-5 text-purple-400" />,
    targetTab: "formatter",
    sections: [
      { heading: "Meeting Objectives", placeholder: "What the SG should achieve in this meeting (1-3 objectives)." },
      { heading: "Key Points", placeholder: "3-5 substantive points the SG should raise, with supporting data." },
      { heading: "Follow-up Actions", placeholder: "Concrete next steps and responsible offices after the meeting." },
    ],
    starterText: "AIDE-MÉMOIRE\n\nMeeting with: [Name, Title, Organization]\nDate/Time: [Date]\nLocation: [Location]\n\nMeeting Objectives:\n1. [Objective]\n2. [Objective]\n\nKey Points to Raise:\n1. [Key point with supporting evidence]\n2. [Key point with supporting evidence]\n3. [Key point with supporting evidence]\n\nFollow-up Actions:\n- [Action] — Responsible office: [Office] — Deadline: [Date]",
  },
  {
    id: "sc-concept-note",
    name: "Security Council Concept Note",
    description: "Concept note for an informal Security Council session or Arria-formula meeting",
    icon: <Globe className="h-5 w-5 text-sage" />,
    targetTab: "formatter",
    sections: [
      { heading: "Background", placeholder: "Context and mandate basis for the meeting." },
      { heading: "Proposed Agenda", placeholder: "Questions for discussion; proposed briefers." },
      { heading: "Desired Outcomes", placeholder: "What the convening delegation hopes to achieve from the meeting." },
    ],
    starterText: "CONCEPT NOTE\n\nInformal Meeting of the Security Council\n[Date]\n\nBackground:\n[Context and mandate basis for the meeting.]\n\nProposed Agenda:\n1. [Agenda item / question for discussion]\n2. [Agenda item / question for discussion]\n\nProposed Briefers:\n- [Name, Title]\n\nDesired Outcomes:\n[What the convening delegation hopes to achieve.]",
  },
];

/* ====================================================================
   RESOLUTION QUALITY CHECK DATA
   ==================================================================== */

const PREAMBULAR_VERBS = [
  "Recalling", "Reaffirming", "Noting", "Acknowledging", "Bearing in mind",
  "Convinced", "Determined", "Deeply concerned", "Expressing", "Gravely",
  "Having considered", "Mindful", "Recognizing", "Reiterating", "Taking note",
  "Welcoming",
];
const OPERATIVE_VERBS = [
  "Decides", "Requests", "Urges", "Calls upon", "Demands", "Encourages",
  "Authorizes", "Invites", "Welcomes", "Stresses", "Affirms", "Condemns",
  "Deplores", "Notes", "Expresses",
];

interface QualityCheckItem {
  id: string;
  label: string;
  pass: boolean;
  detail?: string;
}

function runResolutionQualityCheck(text: string): QualityCheckItem[] {
  const upper = text.trimStart();
  const hasPreambular = PREAMBULAR_VERBS.some((v) =>
    upper.includes(v)
  );
  const hasOperative = OPERATIVE_VERBS.some((v) =>
    upper.includes(v)
  );
  const hasDate = /\b(20\d{2}|January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(text);
  const hasReaffirmation = /reaffirm/i.test(text);
  const hasResolutionRef = /resolution\s+\d+/i.test(text);
  const endsWithSemicolon = /;\s*$/.test(text.trim()) || /;\s*\n\s*$/.test(text);

  return [
    {
      id: "preambular",
      label: "Correct preambular verb form",
      pass: hasPreambular,
      detail: hasPreambular
        ? `Found: ${PREAMBULAR_VERBS.filter((v) => upper.includes(v)).slice(0, 3).join(", ")}`
        : "Expected verbs like Recalling, Reaffirming, Bearing in mind, etc.",
    },
    {
      id: "operative",
      label: "Correct operative verb form",
      pass: hasOperative,
      detail: hasOperative
        ? `Found: ${OPERATIVE_VERBS.filter((v) => upper.includes(v)).slice(0, 3).join(", ")}`
        : "Expected verbs like Decides, Requests, Urges, Calls upon, etc.",
    },
    {
      id: "date",
      label: "Date reference present",
      pass: hasDate,
      detail: hasDate ? "Date or year reference detected." : "No date reference found. Resolutions typically reference relevant dates.",
    },
    {
      id: "reaffirmation",
      label: "Reaffirmation clause present",
      pass: hasReaffirmation,
      detail: hasReaffirmation
        ? "Reaffirming clause detected."
        : "Consider adding a Reaffirming clause to anchor the resolution to prior commitments.",
    },
    {
      id: "resolution-ref",
      label: "Prior resolution reference",
      pass: hasResolutionRef,
      detail: hasResolutionRef
        ? "Reference to prior resolution detected."
        : "Consider referencing prior relevant resolutions for continuity.",
    },
    {
      id: "punctuation",
      label: "Operative paragraph ends with semicolon",
      pass: endsWithSemicolon,
      detail: endsWithSemicolon
        ? "Paragraph ends with semicolon (correct for operative paragraphs)."
        : "Operative paragraphs typically end with a semicolon; final paragraph ends with a period.",
    },
  ];
}

/* ====================================================================
   METHODOLOGY PANEL (custom collapsible — no Radix dependency)
   ==================================================================== */

function MethodologyPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-navy-800/30 transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gold-500/10 p-2 border border-gold-500/20">
            <Info className="h-4 w-4 text-gold-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy-200">UN Diplomatic Writing Conventions</p>
            <p className="text-xs text-navy-500">Editorial standards, language conventions, and hedging requirements</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-navy-500 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[var(--color-app-border)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Editorial Standards</h4>
                  <p className="text-xs text-navy-400 leading-relaxed">
                    UN editorial style follows the <span className="text-navy-300 font-medium">United Nations Editorial Manual</span>, which governs capitalization, abbreviations, punctuation, and document structure. Titles of UN bodies are capitalized (Security Council, General Assembly). Member State names follow the official UN protocol list. Numbers below ten are spelled out; above ten use numerals, except in technical contexts.
                  </p>
                  <p className="text-[11px] text-navy-600">
                    Reference: UN Editorial Manual (ST/DCS/4/Rev.1)
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-teal uppercase tracking-wider">Language Conventions</h4>
                  <p className="text-xs text-navy-400 leading-relaxed">
                    UN documents use formal, precise language and avoid colloquialisms, contractions, and politically loaded terms. The six official languages are Arabic, Chinese, English, French, Russian, and Spanish. English UN documents use British spelling conventions (e.g., "recognise," "programme"). Gender-inclusive language is required per the <span className="text-navy-300 font-medium">UNDP Style Guide</span> — use "chairperson" not "chairman," "humankind" not "mankind," and singular "they" where appropriate.
                  </p>
                  <p className="text-[11px] text-navy-600">
                    Reference: UNDP Style Guide (2020 edition)
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-sage uppercase tracking-wider">Hedging Requirements</h4>
                  <p className="text-xs text-navy-400 leading-relaxed">
                    Diplomatic language requires calibrated hedging to preserve Member State consensus. Accusations must be attributed ("reports allege," "allegedly," "according to OHCHR") rather than stated as established facts without corroboration. Causality is expressed cautiously ("may constitute," "could amount to," "warrants further investigation"). Preambular paragraphs use present participles (Recalling, Noting, Reaffirming); operative paragraphs use third-person verbs in the present tense (Decides, Requests, Urges). Strength escalates from Encourages → Calls upon → Urges → Demands → Decides.
                  </p>
                  <p className="text-[11px] text-navy-600">
                    Reference: UNSC Resolution Drafting Practice (Repertoire of the Security Council)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--color-app-border)]">
                <span className="text-[11px] text-navy-600">Key references:</span>
                <span className="text-[11px] text-navy-500 bg-navy-800/50 rounded px-2 py-0.5 border border-navy-700">UN Editorial Manual (ST/DCS/4/Rev.1)</span>
                <span className="text-[11px] text-navy-500 bg-navy-800/50 rounded px-2 py-0.5 border border-navy-700">UNDP Style Guide (2020)</span>
                <span className="text-[11px] text-navy-500 bg-navy-800/50 rounded px-2 py-0.5 border border-navy-700">Repertoire of the SC</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   TEMPLATE LIBRARY TAB
   ==================================================================== */

interface TemplateLibraryProps {
  onLoadTemplate: (tab: string, text: string) => void;
}

function TemplateLibrary({ onLoadTemplate }: TemplateLibraryProps) {
  const [loadedId, setLoadedId] = useState<string | null>(null);

  function handleLoad(template: DraftTemplate) {
    setLoadedId(template.id);
    onLoadTemplate(template.targetTab, template.starterText);
    setTimeout(() => setLoadedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="un-toolkit" />
      <div className="space-y-1">
        <p className="text-sm text-navy-400">
          Select a template to load it into the relevant drafting tool. Templates follow official UN document formats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DRAFT_TEMPLATES.map((tpl) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="h-full border-[var(--color-app-border)] hover:border-navy-500 transition-colors">
              <CardContent className="p-5 flex flex-col gap-3 h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-navy-800 p-2 border border-navy-700 shrink-0">
                      {tpl.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-200">{tpl.name}</p>
                      <p className="text-xs text-navy-500 mt-0.5">{tpl.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  {tpl.sections.map((sec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-navy-500">
                      <span className="shrink-0 mt-0.5 text-navy-700 font-mono">{i + 1}.</span>
                      <span className="font-medium text-navy-400">{sec.heading}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-app-border)]">
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    → {tpl.targetTab === "formatter" ? "Doc Formatter" : tpl.targetTab === "talking-points" ? "Talking Points" : tpl.targetTab}
                  </Badge>
                  <Button
                    size="sm"
                    variant={loadedId === tpl.id ? "outline" : "default"}
                    onClick={() => handleLoad(tpl)}
                    className="gap-1.5 text-xs h-7"
                  >
                    {loadedId === tpl.id ? (
                      <>
                        <Check className="h-3 w-3 text-sage" />
                        Loaded
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3" />
                        Load Template
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-[var(--color-app-border)]/50 bg-navy-900/30">
        <CardContent className="p-4">
          <p className="text-xs text-navy-500">
            <span className="font-medium text-navy-400">How templates work:</span> Click "Load Template" to pre-fill the corresponding drafting tool tab with the template structure. Switch to the indicated tab to edit and customize the pre-loaded content.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ====================================================================
   RESOLUTION QUALITY CHECKER (added to ResolutionDrafter)
   ==================================================================== */

function ResolutionQualityPanel({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [items, setItems] = useState<QualityCheckItem[]>([]);

  function runCheck() {
    setItems(runResolutionQualityCheck(text));
    setChecked(true);
    setOpen(true);
  }

  const passCount = items.filter((i) => i.pass).length;

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={runCheck}
        className="gap-2 text-xs"
        disabled={!text.trim()}
      >
        <ListChecks className="h-3.5 w-3.5" />
        Quality Check
      </Button>

      <AnimatePresence>
        {checked && open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-navy-300 flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5 text-gold-500" />
                  Resolution Quality Check
                </p>
                <Badge
                  variant={passCount === items.length ? "sage" : passCount >= items.length * 0.6 ? "gold" : "crimson"}
                  className="text-[10px]"
                >
                  {passCount}/{items.length} passed
                </Badge>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 text-xs">
                    {item.pass ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-sage shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-crimson shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={cn("font-medium", item.pass ? "text-navy-300" : "text-navy-400")}>
                        {item.label}
                      </span>
                      {item.detail && (
                        <p className="text-navy-500 mt-0.5">{item.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   TYPING EFFECT HOOK
   ==================================================================== */
function useTypingEffect(text: string, speed: number = 12) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setIsComplete(false);
      return;
    }
    setDisplayed("");
    setIsComplete(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, isComplete };
}

/* ====================================================================
   TAB 1: TERMINOLOGY CHECKER
   ==================================================================== */
interface TermMatch {
  term: string;
  index: number;
  suggestion: string;
  note: string;
  severity: "error" | "warning" | "suggestion";
}

function TerminologyChecker() {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState<TermMatch[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const checkTerminology = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsChecking(true);
    try {
      const res = await fetch('/api/ai/terminology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const matches: TermMatch[] = (data.issues || []).map((issue: { term: string; suggestion: string; reason: string; severity: string }, idx: number) => ({
        term: issue.term,
        index: idx,
        suggestion: issue.suggestion,
        note: issue.reason,
        severity: issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'suggestion',
      }));
      setResults(matches);
      setComplianceScore(data.complianceScore ?? null);
      setRecommendation(data.recommendation ?? null);
    } catch {
      // Fall back to local check
      const lower = inputText.toLowerCase();
      const matches: TermMatch[] = [];
      for (const [term, data] of Object.entries(TERMINOLOGY_DB)) {
        let searchFrom = 0;
        while (true) {
          const idx = lower.indexOf(term, searchFrom);
          if (idx === -1) break;
          matches.push({
            term: inputText.slice(idx, idx + term.length),
            index: idx,
            suggestion: data.suggestion,
            note: data.note,
            severity: data.severity === "warning" ? "error" : "suggestion",
          });
          searchFrom = idx + term.length;
        }
      }
      matches.sort((a, b) => a.index - b.index);
      setResults(matches);
    } finally {
      setIsChecking(false);
      setHasChecked(true);
    }
  }, [inputText]);

  const copySuggestion = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-navy-600">
          Paste your text below to check for non-standard UN terminology
        </label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={10}
          placeholder="The rebels launched an attack on the regime's stronghold, causing a clash between tribal factions. The failed state has seen its third world status deepen as child soldiers are recruited by warlords..."
          className="font-mono text-sm"
        />
      </div>

      <Button
        onClick={checkTerminology}
        disabled={inputText.trim().length === 0 || isChecking}
        className="gap-2"
      >
        {isChecking ? (
          <>
            <Sparkles className="h-4 w-4 animate-pulse" />
            Checking with AI...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Check Terminology
          </>
        )}
      </Button>

      <AnimatePresence>
        {hasChecked && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {/* Summary bar */}
            <div className="flex items-center gap-3 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
              {results.length === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-sage shrink-0" />
                  <span className="text-sm text-sage font-medium">
                    No terminology issues found — text follows UN standards.
                  </span>
                  <Badge variant="sage" className="ml-auto text-xs gap-1">
                    <Check className="h-3 w-3" />
                    Compliant
                  </Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-gold-500 shrink-0" />
                  <span className="text-sm text-navy-800">
                    Found{" "}
                    <span className="font-semibold text-gold-400">
                      {results.length}
                    </span>{" "}
                    {results.length === 1 ? "issue" : "issues"}{" "}
                    <span className="text-navy-500 text-xs">
                      ({results.filter((r) => r.severity === "error").length} errors &middot;{" "}
                      {results.filter((r) => r.severity === "warning").length} warnings &middot;{" "}
                      {results.filter((r) => r.severity === "suggestion").length} info)
                    </span>
                  </span>
                  {complianceScore !== null && (
                    <span className="ml-auto text-xs font-semibold" style={{ color: complianceScore >= 80 ? '#5B8C5A' : complianceScore >= 50 ? '#C8961E' : '#A63D40' }}>
                      {complianceScore}% compliant
                    </span>
                  )}
                </>
              )}
            </div>
            {recommendation && (
              <div className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-navy-800">
                <span className="font-medium text-teal">AI Recommendation: </span>{recommendation}
              </div>
            )}

            {/* Results */}
            <div className="space-y-3">
              {results.map((match, i) => (
                <motion.div
                  key={`${match.term}-${match.index}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-[var(--color-app-border)]/80">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start gap-3">
                        {/* Severity badge */}
                        <Badge
                          variant={
                            match.severity === "error" ? "crimson" :
                            match.severity === "warning" ? "gold" : "teal"
                          }
                          className="shrink-0 mt-0.5"
                        >
                          {match.severity === "error" ? (
                            <XCircle className="h-3 w-3 mr-1" />
                          ) : match.severity === "warning" ? (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          ) : (
                            <Lightbulb className="h-3 w-3 mr-1" />
                          )}
                          {match.severity === "error" ? "Error" : match.severity === "warning" ? "Warning" : "Info"}
                        </Badge>

                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Term and suggestion */}
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 rounded bg-crimson/20 text-crimson font-mono font-medium border border-crimson/30">
                              {match.term}
                            </span>
                            <ChevronRight className="h-4 w-4 text-navy-500" />
                            <span className="px-2 py-0.5 rounded bg-sage/20 text-sage font-mono font-medium border border-sage/30">
                              {match.suggestion}
                            </span>
                            <button
                              onClick={() =>
                                copySuggestion(i, match.suggestion)
                              }
                              className="ml-1 p-1 rounded hover:bg-navy-100 transition-colors text-navy-400 hover:text-navy-700 cursor-pointer"
                            >
                              {copiedIdx === i ? (
                                <Check className="h-3.5 w-3.5 text-sage" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Explanation */}
                          <p className="text-xs text-navy-400">{match.note}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   TAB 2: RESOLUTION DRAFTER
   ==================================================================== */
function ResolutionDrafter() {
  const { situation } = useSituationGuard();
  const sitName = situation?.name ?? 'Nordalia';
  const [paragraphType, setParagraphType] = useState<ParagraphType>("preambular");
  const [strength, setStrength] = useState<Strength>("moderate");
  const [userInput, setUserInput] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const strengthValue = { soft: 25, moderate: 55, strong: 90 };
  const strengthColor = {
    soft: "bg-teal",
    moderate: "bg-gold-500",
    strong: "bg-crimson",
  };

  const strengthMap = { soft: 'weak', moderate: 'moderate', strong: 'strong' } as const;

  const handleDraft = async () => {
    if (!userInput.trim()) return;
    setIsGenerating(true);
    setGeneratedText('');
    try {
      const response = await fetch('/api/ai/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: userInput,
          type: paragraphType,
          strength: strengthMap[strength],
          keyPoints: situation?.actors ?? [],
          situation: situation ?? undefined,
        }),
      });
      if (!response.ok) throw new Error('Draft failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split('\n')) {
          if (line.startsWith('0:')) {
            try { accumulated += JSON.parse(line.slice(2)); } catch { /* skip */ }
          }
        }
        setGeneratedText(accumulated);
      }
    } catch {
      // Fall back to template — replace hardcoded Nordalia with active situation name
      const templates = RESOLUTION_TEMPLATES[paragraphType][strength];
      const opener = templates.openers[Math.floor(Math.random() * templates.openers.length)];
      const template = templates.templates[Math.floor(Math.random() * templates.templates.length)];
      setGeneratedText(
        template.replace("{opener}", opener).replaceAll("Nordalia", sitName)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paragraph type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-600">
            Paragraph Type
          </label>
          <div className="flex gap-2">
            {(["preambular", "operative"] as ParagraphType[]).map((t) => (
              <button
                key={t}
                onClick={() => setParagraphType(t)}
                className={cn(
                  "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all border cursor-pointer",
                  paragraphType === t
                    ? "bg-gold-500/10 border-gold-500/50 text-gold-400"
                    : "bg-[var(--color-app-surface-alt)] border-[var(--color-app-border)] text-navy-400 hover:bg-navy-100 hover:text-navy-700",
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Strength */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-600">
            Diplomatic Strength
          </label>
          <Select
            value={strength}
            onValueChange={(v) => setStrength(v as Strength)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soft">Soft</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="strong">Strong</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Strength meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-navy-400">
          <span className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            Language Strength
          </span>
          <span className="capitalize">{strength}</span>
        </div>
        <div className="h-2 rounded-full bg-navy-100 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", strengthColor[strength])}
            initial={false}
            animate={{ width: `${strengthValue[strength]}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-navy-500">
          <span>Encourages / Notes</span>
          <span>Calls upon / Reaffirms</span>
          <span>Demands / Decides</span>
        </div>
      </div>

      {/* User input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-navy-600">
          What should this paragraph express?
        </label>
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          rows={3}
          placeholder={`Describe the concern about humanitarian access in ${sitName}...`}
        />
      </div>

      <Button onClick={handleDraft} className="gap-2">
        <FileSignature className="h-4 w-4" />
        Draft Paragraph
      </Button>

      {/* Result */}
      <AnimatePresence>
        {(isGenerating || generatedText) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-500" />
                  Drafted{" "}
                  {paragraphType.charAt(0).toUpperCase() +
                    paragraphType.slice(1)}{" "}
                  Paragraph
                  <Badge
                    variant={
                      strength === "soft"
                        ? "teal"
                        : strength === "moderate"
                          ? "gold"
                          : "crimson"
                    }
                    className="ml-2"
                  >
                    {strength}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] p-4">
                  <p className="text-sm text-navy-800 leading-relaxed font-serif italic">
                    {generatedText}
                    {isGenerating && (
                      <span className="inline-block w-0.5 h-4 bg-gold-500 ml-0.5 animate-pulse" />
                    )}
                  </p>
                </div>
                {!isGenerating && generatedText && (
                  <div className="pt-2">
                    <ResolutionQualityPanel text={generatedText} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   TAB 3: TALKING POINTS GENERATOR
   ==================================================================== */
interface TalkingPointsGeneratorProps {
  preloadedText?: string | null;
  onPreloadConsumed?: () => void;
}

function TalkingPointsGenerator({ preloadedText, onPreloadConsumed }: TalkingPointsGeneratorProps) {
  const [situation, setSituation] = useState("");
  const [audience, setAudience] = useState("");
  const [keyMessages, setKeyMessages] = useState("");
  const [sensitivities, setSensitivities] = useState("");

  useEffect(() => {
    if (preloadedText) {
      setSituation(preloadedText);
      onPreloadConsumed?.();
    }
  }, [preloadedText, onPreloadConsumed]);
  const [generated, setGenerated] = useState(false);
  const [revealedSections, setRevealedSections] = useState(0);

  const sectionCount = 5; // opening, key messages, supporting, QA, red lines

  useEffect(() => {
    if (!generated) return;
    if (revealedSections >= sectionCount) return;
    const timer = setTimeout(() => {
      setRevealedSections((s) => s + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [generated, revealedSections]);

  const handleGenerate = () => {
    setGenerated(true);
    setRevealedSections(0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-navy-600">
            Situation
          </label>
          <Textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            rows={3}
            placeholder="Describe the situation: escalating conflict in northern Nordalia, ceasefire violations, humanitarian crisis..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-600">
            Audience
          </label>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="security-council">Security Council</SelectItem>
              <SelectItem value="general-assembly">General Assembly</SelectItem>
              <SelectItem value="bilateral">Bilateral Meeting</SelectItem>
              <SelectItem value="press">Press Briefing</SelectItem>
              <SelectItem value="internal">Internal Briefing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-600">
            Sensitivities{" "}
            <span className="text-navy-500">(optional)</span>
          </label>
          <Textarea
            value={sensitivities}
            onChange={(e) => setSensitivities(e.target.value)}
            rows={2}
            placeholder="Any topics or phrasing to avoid..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-navy-600">
            Key Messages
          </label>
          <Textarea
            value={keyMessages}
            onChange={(e) => setKeyMessages(e.target.value)}
            rows={3}
            placeholder="Main points to convey: deteriorating security, need for humanitarian access, accountability for violations..."
          />
        </div>
      </div>

      <Button onClick={handleGenerate} className="gap-2">
        <MessageSquareQuote className="h-4 w-4" />
        Generate Talking Points
      </Button>

      <AnimatePresence>
        {generated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Opening statement */}
            {revealedSections >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gold-400">
                      Opening Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-navy-800 leading-relaxed whitespace-pre-line">
                      {TALKING_POINTS_TEMPLATE.opening}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Key Messages + Supporting */}
            {revealedSections >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gold-400">
                      Key Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {TALKING_POINTS_TEMPLATE.keyMessages.map((msg, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="shrink-0 h-5 w-5 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium text-navy-900">
                            {msg.point}
                          </p>
                        </div>
                        {revealedSections >= 3 && (
                          <motion.ul
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-7 space-y-1"
                          >
                            {msg.supporting.map((s, j) => (
                              <li
                                key={j}
                                className="text-xs text-navy-400 flex items-start gap-1.5"
                              >
                                <span className="text-navy-600 mt-0.5">
                                  --
                                </span>
                                {s}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Q&A */}
            {revealedSections >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gold-400">
                      Anticipated Questions & Suggested Responses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {TALKING_POINTS_TEMPLATE.qaSection.map((qa, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3 space-y-2"
                      >
                        <p className="text-sm font-medium text-teal">
                          Q: {qa.question}
                        </p>
                        <p className="text-sm text-navy-600 leading-relaxed">
                          A: {qa.response}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Red lines */}
            {revealedSections >= 5 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-crimson/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-crimson flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Red Lines / Avoid
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {TALKING_POINTS_TEMPLATE.redLines.map((line, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-navy-600"
                        >
                          <span className="text-crimson mt-0.5 shrink-0">
                            &times;
                          </span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   TAB 4: DOCUMENT FORMATTER
   ==================================================================== */
interface DocumentFormatterProps {
  preloadedText?: string | null;
  onPreloadConsumed?: () => void;
}

function DocumentFormatter({ preloadedText, onPreloadConsumed }: DocumentFormatterProps) {
  const [format, setFormat] = useState("sg-report");
  const [inputText, setInputText] = useState("");
  const [formattedOutput, setFormattedOutput] = useState<string | null>(null);

  useEffect(() => {
    if (preloadedText) {
      setInputText(preloadedText);
      onPreloadConsumed?.();
    }
  }, [preloadedText, onPreloadConsumed]);

  const handleFormat = () => {
    const structure = DOC_STRUCTURES[format];
    if (!structure) return;

    const paragraphs = inputText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    let output = "";
    const dateLine = "S/2026/___\n\nDistr.: General\n2 March 2026\n\nOriginal: English\n\n";

    if (format === "sg-report") {
      output += dateLine;
    }

    output += structure.title + "\n\n";

    let paragraphNum = 1;

    structure.sections.forEach((section, sIdx) => {
      output += section.heading + "\n\n";

      // Distribute input paragraphs across sections, or use instruction as placeholder
      const parasForSection = paragraphs.length > 0
        ? paragraphs.splice(0, Math.max(1, Math.ceil(paragraphs.length / (structure.sections.length - sIdx))))
        : [`[${section.instruction}]`];

      parasForSection.forEach((p) => {
        output += `${paragraphNum}.\t${p}\n\n`;
        paragraphNum++;
      });
    });

    setFormattedOutput(output);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-600">
            Output Format
          </label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sg-report">SG Report</SelectItem>
              <SelectItem value="unsc-briefing">UNSC Briefing</SelectItem>
              <SelectItem value="political-analysis">
                Political Analysis
              </SelectItem>
              <SelectItem value="memo">Internal Memorandum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Format preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-600">
            Document Structure Preview
          </label>
          <div className="rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3 space-y-1 max-h-36 overflow-y-auto">
            {DOC_STRUCTURES[format]?.sections.map((s, i) => (
              <p key={i} className="text-xs text-navy-400">
                <span className="text-navy-600 font-medium">{s.heading}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-navy-600">
          Paste your text (separate sections with blank lines)
        </label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={8}
          placeholder="Paste the text you want to format into a UN document structure..."
          className="font-mono text-sm"
        />
      </div>

      <Button onClick={handleFormat} className="gap-2">
        <FileOutput className="h-4 w-4" />
        Format Document
      </Button>

      <AnimatePresence>
        {formattedOutput && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Formatted Output</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigator.clipboard.writeText(formattedOutput)
                  }
                  className="gap-1.5 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-navy-800 leading-relaxed whitespace-pre-wrap font-mono bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] rounded-md p-4 max-h-[500px] overflow-y-auto">
                  {formattedOutput}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   TAB 5: DIPLOMATIC LANGUAGE EDITOR
   ==================================================================== */

function computeDiplomaticScore(input: string, transformed: string, diff: DiffSegment[]): number {
  if (!transformed) return 0;
  // Score based on: reduction in terminology violations, diff changes, length
  const inputViolations = Object.keys(TERMINOLOGY_DB).filter((term) =>
    input.toLowerCase().includes(term)
  ).length;
  const outputViolations = Object.keys(TERMINOLOGY_DB).filter((term) =>
    transformed.toLowerCase().includes(term)
  ).length;
  const violationReduction = Math.max(0, inputViolations - outputViolations);
  const diffChanges = diff.filter((s) => s.type !== "unchanged").length;
  // Base: 5. +1 per violation removed (max +3). +1 per diff pair (max +2).
  const base = 5;
  const violationBonus = Math.min(3, violationReduction);
  const diffBonus = Math.min(2, Math.floor(diffChanges / 2));
  return Math.min(10, base + violationBonus + diffBonus);
}

function DiplomaticEditor() {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState("diplomatic");
  const [result, setResult] = useState<TransformResult | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [diplomaticScore, setDiplomaticScore] = useState<number | null>(null);

  const modes = [
    {
      value: "diplomatic",
      label: "Make more diplomatic",
      icon: "shield",
    },
    { value: "direct", label: "Make more direct", icon: "target" },
    {
      value: "urgent",
      label: "Increase urgency",
      icon: "alert",
    },
    { value: "neutralize", label: "Neutralize", icon: "scale" },
  ];

  const handleTransform = async () => {
    if (!inputText.trim()) return;
    setIsTransforming(true);
    setResult(null);
    setDiplomaticScore(null);
    const modeInstructions: Record<string, string> = {
      diplomatic: 'Transform this text to be more diplomatically phrased. Soften direct accusations, use passive voice where appropriate, employ cautious language, and ensure it meets UN diplomatic standards.',
      direct: 'Transform this text to be more direct and clear. Remove diplomatic hedging, state facts plainly, and be specific about responsibilities and deadlines.',
      urgent: 'Transform this text to convey greater urgency. Emphasize the critical nature of the situation, use strong language, and make clear that immediate action is required.',
      neutralize: 'Transform this text to be completely neutral and balanced. Remove any loaded language, accusations, or one-sided framing. Ensure all parties are referred to equally.',
    };
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `${modeInstructions[mode] || modeInstructions.diplomatic}\n\nText to transform:\n---\n${inputText}\n---\n\nProvide ONLY the transformed text, no explanation or preamble.`,
          }],
        }),
      });
      if (!response.ok) throw new Error('Transform failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let transformed = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split('\n')) {
          if (line.startsWith('0:')) {
            try { transformed += JSON.parse(line.slice(2)); } catch { /* skip */ }
          }
        }
        setResult({ transformed, diff: [] });
      }
      setDiplomaticScore(computeDiplomaticScore(inputText, transformed, []));
    } catch {
      const fallback = getDiplomaticTransform(inputText, mode);
      setResult(fallback);
      setDiplomaticScore(computeDiplomaticScore(inputText, fallback.transformed, fallback.diff));
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-navy-600">
          Transformation Mode
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium transition-all border text-center cursor-pointer",
                mode === m.value
                  ? "bg-gold-500/10 border-gold-500/50 text-gold-400"
                  : "bg-[var(--color-app-surface-alt)] border-[var(--color-app-border)] text-navy-400 hover:bg-navy-100 hover:text-navy-700",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-navy-600">
          Input Text
        </label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={5}
          placeholder={
            mode === "diplomatic"
              ? "The Nordalia government refuses to disarm the rebels. They are stalling and the peace process is failing."
              : mode === "direct"
                ? "The Government of Nordalia has encountered challenges in fully implementing its disarmament obligations within the agreed framework. Consultations are ongoing to address remaining concerns."
                : mode === "urgent"
                  ? "The situation in Nordalia continues to be of concern. The Council may wish to consider possible measures to address the ongoing challenges."
                  : "Government forces brutally attacked civilian areas in the north. The regime's aggression has destroyed any hope for peace."
          }
        />
      </div>

      <Button
        onClick={handleTransform}
        disabled={isTransforming}
        className="gap-2"
      >
        {isTransforming ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </motion.div>
        ) : (
          <ArrowRightLeft className="h-4 w-4" />
        )}
        Transform
      </Button>

      {/* Results - side by side */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Diplomatic Score */}
            {diplomaticScore !== null && !isTransforming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3"
              >
                <Gauge className="h-4 w-4 text-gold-500 shrink-0" />
                <span className="text-sm text-navy-400">Diplomatic Score</span>
                <div className="flex items-center gap-1 ml-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 w-4 rounded-sm transition-colors",
                        i < diplomaticScore
                          ? diplomaticScore >= 8 ? "bg-sage" : diplomaticScore >= 5 ? "bg-gold-500" : "bg-crimson"
                          : "bg-navy-700"
                      )}
                    />
                  ))}
                </div>
                <span className={cn(
                  "text-sm font-bold ml-1",
                  diplomaticScore >= 8 ? "text-sage" : diplomaticScore >= 5 ? "text-gold-400" : "text-crimson"
                )}>
                  {diplomaticScore}/10
                </span>
                <span className="text-xs text-navy-500 ml-1">
                  {diplomaticScore >= 8 ? "Excellent" : diplomaticScore >= 6 ? "Good" : diplomaticScore >= 4 ? "Fair" : "Needs work"}
                </span>
              </motion.div>
            )}

            {result.diff.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Before — Original (with diff markings) */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-navy-600">
                      Before (original)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] p-4 text-sm leading-relaxed">
                      {result.diff.map((seg, i) => {
                        if (seg.type === "removed") return <span key={i} className="bg-crimson/20 text-crimson line-through decoration-crimson/60">{seg.text}</span>;
                        if (seg.type === "added") return null;
                        return <span key={i} className="text-navy-600">{seg.text}</span>;
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* After — Transformed (amber highlights on changed phrases) */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gold-400 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      After (transformed)
                      <Badge variant="gold" className="ml-2 capitalize">
                        {modes.find((m) => m.value === mode)?.label}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] p-4 text-sm leading-relaxed">
                      {result.diff.map((seg, i) => {
                        if (seg.type === "added") return (
                          <span key={i} className="bg-amber-500/20 text-amber-300 rounded px-0.5">{seg.text}</span>
                        );
                        if (seg.type === "removed") return null;
                        return <span key={i} className="text-navy-600">{seg.text}</span>;
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gold-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Transformed
                    <Badge variant="gold" className="ml-2 capitalize">
                      {modes.find((m) => m.value === mode)?.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] p-4 text-sm leading-relaxed">
                    <p className="text-navy-800 whitespace-pre-wrap">
                      {result.transformed}
                      {isTransforming && (
                        <span className="inline-block w-0.5 h-4 bg-gold-500 ml-0.5 animate-pulse" />
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   MAIN PAGE
   ==================================================================== */
const TABS = [
  {
    value: "terminology",
    label: "Terminology",
    icon: BookOpenCheck,
  },
  {
    value: "resolution",
    label: "Resolution Drafter",
    icon: FileSignature,
  },
  {
    value: "talking-points",
    label: "Talking Points",
    icon: MessageSquareQuote,
  },
  {
    value: "formatter",
    label: "Doc Formatter",
    icon: FileOutput,
  },
  {
    value: "diplomatic",
    label: "Diplomatic Editor",
    icon: Languages,
  },
  {
    value: "templates",
    label: "Templates",
    icon: LayoutGrid,
  },
];

export default function UNToolkitPage() {
  const { showGuard, situation } = useSituationGuard();
  const { hasData, loading: firestoreLoading } = useToolData('un_toolkit');
  const [regenerating, setRegenerating] = useState(false);

  // Template loading: tab value → pre-filled text
  const [activeTab, setActiveTab] = useState("terminology");
  const [preloadedFormatterText, setPreloadedFormatterText] = useState<string | null>(null);
  const [preloadedTalkingText, setPreloadedTalkingText] = useState<string | null>(null);

  function handleLoadTemplate(targetTab: string, text: string) {
    if (targetTab === "formatter") {
      setPreloadedFormatterText(text);
    } else if (targetTab === "talking-points") {
      setPreloadedTalkingText(text);
    }
    setActiveTab(targetTab);
  }

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/un-toolkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy-50 font-serif tracking-wide">
                UN Toolkit
              </h1>
              <p className="mt-1 text-sm text-navy-400">
                Drafting, terminology, and language tools for diplomatic
                professionals
              </p>
            </div>
            {situation && (
              firestoreLoading ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-navy-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </span>
              ) : hasData ? (
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="inline-flex items-center gap-1.5 rounded-md bg-navy-700 px-3 py-1.5 text-xs font-medium text-navy-200 hover:bg-navy-600 disabled:opacity-50"
                >
                  {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Regenerate
                </button>
              ) : (
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Generate with PRAXIS
                </button>
              )
            )}
          </div>
        </motion.div>

        {/* Methodology Panel — collapsible, collapsed by default */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <MethodologyPanel />
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-[var(--color-app-surface-alt)] p-1.5 rounded-xl">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 data-[state=active]:bg-navy-100 data-[state=active]:text-gold-400 px-3 py-2 text-xs sm:text-sm"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="terminology">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenCheck className="h-5 w-5 text-gold-500" />
                  Terminology Checker
                </CardTitle>
                <CardDescription>
                  Scan text for non-standard UN terminology and get
                  recommended replacements based on official guidelines.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TerminologyChecker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolution">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-gold-500" />
                  Resolution Drafter
                </CardTitle>
                <CardDescription>
                  Generate properly formatted Security Council resolution
                  paragraphs with calibrated diplomatic language.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResolutionDrafter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="talking-points">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-gold-500" />
                  Talking Points Generator
                </CardTitle>
                <CardDescription>
                  Generate structured talking points with key messages,
                  supporting arguments, Q&A, and guidance on red lines.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TalkingPointsGenerator preloadedText={preloadedTalkingText} onPreloadConsumed={() => setPreloadedTalkingText(null)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formatter">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileOutput className="h-5 w-5 text-gold-500" />
                  Document Formatter
                </CardTitle>
                <CardDescription>
                  Format text into standard UN document structures with
                  proper section headings and paragraph numbering.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentFormatter preloadedText={preloadedFormatterText} onPreloadConsumed={() => setPreloadedFormatterText(null)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diplomatic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-gold-500" />
                  Diplomatic Language Editor
                </CardTitle>
                <CardDescription>
                  Transform text to adjust diplomatic tone, urgency, and
                  neutrality with track-changes visualization and Diplomatic Score.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DiplomaticEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-gold-500" />
                  Template Library
                </CardTitle>
                <CardDescription>
                  Standard UN document templates. Click to load into the
                  relevant drafting tool.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateLibrary onLoadTemplate={handleLoadTemplate} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
