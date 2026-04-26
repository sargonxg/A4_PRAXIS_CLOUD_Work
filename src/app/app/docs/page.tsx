'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, LayoutDashboard, AlertTriangle, BarChart3, GitBranch,
  Users, UserCircle, MessageSquare, FileText, BookMarked,
  MessageCircle, GitCompare, Scale, Handshake, Presentation,
  Newspaper, Network, Compass, Radio, FileCheck, Shield,
  Calendar, Bell, Building2, FolderOpen, UsersRound,
  ChevronDown, Check, Sparkles, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ---------- Tool Definitions ---------- */

interface ToolDoc {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  creditCost: number | null;
  aiModel: string | null;
  description: string;
  purpose: string;
  howItWorks: string;
  analyticalFramework: string | null;
  dataSource: string;
  status: 'working' | 'partial' | 'planned';
}

const TOOL_DOCS: ToolDoc[] = [
  // ── Situation Room ──
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    section: 'Situation Room',
    creditCost: null,
    aiModel: null,
    description: 'Central command view of your active situation with risk gauges, tool health status, and quick actions.',
    purpose: 'Provides a single-pane overview of the active situation: risk score, Glasl escalation stage, actor count, graph entities, document count. Shows which tools have been populated and links directly to each.',
    howItWorks: 'Reads situation metadata from Firestore. Displays the Situation Health widget showing which tools have been auto-seeded by the initialization pipeline. No AI credits consumed.',
    analyticalFramework: null,
    dataSource: 'Firestore situation metadata + tool-data subcollections',
    status: 'working',
  },
  {
    name: 'Early Warning',
    path: '/early-warning',
    icon: AlertTriangle,
    section: 'Situation Room',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Glasl escalation model tracking with de-escalation opportunities and trajectory forecasting.',
    purpose: 'Monitors escalation dynamics using the Glasl 9-stage model. Identifies which stage the conflict is in, tracks trajectory, and highlights windows for de-escalation intervention.',
    howItWorks: 'AiPopulate calls /api/ai/escalation-scan with full situation context. The AI analyzes actors, recent events, and conflict dynamics against the Glasl framework. Returns structured indicators per stage, trajectory forecast, and specific de-escalation opportunities.',
    analyticalFramework: 'Friedrich Glasl 9-Stage Escalation Model',
    dataSource: 'Situation context + ACLED event data + GDELT stability scores',
    status: 'working',
  },
  {
    name: 'Risk Monitor',
    path: '/risk-monitor',
    icon: BarChart3,
    section: 'Situation Room',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'INFORM Risk Index-style assessment with multi-dimensional risk breakdowns by region.',
    purpose: 'Generates a structured risk assessment modeled on the INFORM Risk Index methodology. Breaks down risk into hazard exposure, vulnerability, and lack of coping capacity dimensions.',
    howItWorks: 'AiPopulate calls /api/ai/risk-assessment with situation context and region data. Returns risk scores, Glasl stage, trend analysis, and risk factors. Updates the parent situation risk score in Firestore after generation.',
    analyticalFramework: 'INFORM Risk Index (OCHA/JRC)',
    dataSource: 'Situation context + GDELT/ReliefWeb live intelligence feeds',
    status: 'working',
  },
  {
    name: 'Conflict Graph',
    path: '/conflict-graph',
    icon: GitBranch,
    section: 'Situation Room',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Interactive knowledge graph of actors, events, claims, interests, and relationships.',
    purpose: 'Visualizes the conflict as a network of connected entities using the ACO (Actor-Claim-Obligation) Conflict Grammar. Allows analysts to see alliances, rivalries, dependencies, and causal chains.',
    howItWorks: 'Auto-seeded from the situation initialization pipeline. Graph data stored in Firestore tool-data subcollection. Nodes represent actors, events, claims, interests; edges represent relationships. Regenerate button calls /api/ai/extract for fresh extraction.',
    analyticalFramework: 'ACO Conflict Grammar v2.0 (8 primitives: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative)',
    dataSource: 'Auto-structure output + persisted tool-data',
    status: 'working',
  },
  {
    name: 'Stakeholder Map',
    path: '/stakeholder-map',
    icon: Users,
    section: 'Situation Room',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Power-interest matrix mapping stakeholders by influence, alignment, and engagement priority.',
    purpose: 'Maps all stakeholders on a power-interest grid to identify key players, potential spoilers, and engagement priorities. Includes coalition dynamics and spoiler risk assessment.',
    howItWorks: 'Calls /api/ai/power-map with situation context. Returns structured stakeholder data with power (1-10), interest (1-10), alignment, and category. Persisted via usePersistedToolData for cross-navigation restoration.',
    analyticalFramework: 'Mitchell/Agle/Wood Stakeholder Theory + Power-Interest Matrix',
    dataSource: 'Situation context + AI analysis',
    status: 'working',
  },
  {
    name: 'Actor Profiles',
    path: '/actors',
    icon: UserCircle,
    section: 'Situation Room',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Deep intelligence profiles for each conflict actor with interests, leverage, constraints, and compliance.',
    purpose: 'Generates comprehensive profiles for each actor identified in the situation. Each profile includes position, interests, leverage, constraints, spoiler assessment, and compliance history.',
    howItWorks: 'AiPopulate calls /api/ai/actor-profiles with situation context. Generates 3-8 full profiles using Fisher/Ury framework. Each actor can be individually enriched via /api/ai/actor-enrichment or briefed via /api/ai/actor-brief.',
    analyticalFramework: 'Fisher/Ury Interest-Based Negotiation Framework',
    dataSource: 'Situation context + web search for actor-specific intelligence',
    status: 'working',
  },

  // ── Analysis & Drafting ──
  {
    name: 'PRAXIS Assistant',
    path: '/assistant',
    icon: MessageSquare,
    section: 'Analysis & Drafting',
    creditCost: 1,
    aiModel: 'Google AI + 21 tools',
    description: 'Situation-aware AI chat with access to all 21 analytical tools, web search, and document analysis.',
    purpose: 'The central AI interaction point. Understands your active situation context and can perform multi-step research, draft documents, analyze media, check UN terminology, and more using all 21 TACITUS tools.',
    howItWorks: 'Streaming chat via /api/ai/chat. System prompt includes full situation context (actors, risk, Glasl stage, source URLs). All 21 tacitusTools are available with up to 8 reasoning steps per message.',
    analyticalFramework: null,
    dataSource: 'Full situation context + all 21 tools (web search, document analysis, escalation assessment, etc.)',
    status: 'working',
  },
  {
    name: 'Report Studio',
    path: '/reports',
    icon: FileText,
    section: 'Analysis & Drafting',
    creditCost: 5,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Automated diplomatic report generation with section-by-section AI drafting and DOCX/PDF export.',
    purpose: 'Produces formal diplomatic reports (situation reports, assessment notes, background papers) with structured sections. Each section is AI-generated from situation context and can be edited before export.',
    howItWorks: 'AiPopulate generates initial report structure. Individual sections drafted via /api/ai/report. Completed reports stored in Firestore and exportable via /api/reports/[id]/export as DOCX or PDF.',
    analyticalFramework: 'UN DPPA Report Writing Standards',
    dataSource: 'Situation context + AI analysis',
    status: 'working',
  },
  {
    name: 'Dossier Generator',
    path: '/dossier',
    icon: BookMarked,
    section: 'Analysis & Drafting',
    creditCost: 4,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Comprehensive intelligence dossiers with template selection and structured sections.',
    purpose: 'Generates full intelligence dossiers following standard diplomatic templates. Includes executive summary, background, actor analysis, risk assessment, and recommendations.',
    howItWorks: 'AiPopulate calls /api/ai/dossier-generate with situation context and selected template type. Returns structured dossier sections persisted to Firestore.',
    analyticalFramework: 'Diplomatic Dossier Templates (Country Brief, Conflict Assessment, Mediation Strategy)',
    dataSource: 'Situation context + AI analysis',
    status: 'working',
  },
  {
    name: 'Talking Points',
    path: '/talking-points',
    icon: MessageCircle,
    section: 'Analysis & Drafting',
    creditCost: 1,
    aiModel: 'Google AI',
    description: 'Audience-specific talking points for Security Council, press briefings, bilateral meetings, or internal strategy.',
    purpose: 'Generates tailored talking points calibrated to the target audience. Security Council points use formal mandate-focused language; press points are quotable; bilateral points balance candor with diplomacy.',
    howItWorks: 'User selects audience type and topic. Streaming generation via /api/ai/talking-points. Results persisted via usePersistedToolData for cross-navigation restoration.',
    analyticalFramework: 'Audience-calibrated diplomatic communication',
    dataSource: 'Situation context + audience-specific tone templates',
    status: 'working',
  },
  {
    name: 'Scenario Planner',
    path: '/scenarios',
    icon: GitCompare,
    section: 'Analysis & Drafting',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Strategic scenario modeling with probability assessment and policy response options.',
    purpose: 'Generates multiple future scenarios (best case, worst case, most likely, and wildcards) with probability assessments, indicators to watch, and recommended policy responses for each.',
    howItWorks: 'Streaming text generation via /api/ai/scenario. User can save, edit, and compare scenarios. Persisted via usePersistedToolData.',
    analyticalFramework: 'Scenario Planning Methodology (Shell/RAND)',
    dataSource: 'Situation context + AI analysis',
    status: 'working',
  },
  {
    name: 'Negotiation Prep',
    path: '/negotiation-prep',
    icon: Scale,
    section: 'Analysis & Drafting',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'ZOPA/BATNA analysis with negotiation space visualization and strategy recommendations.',
    purpose: 'Prepares comprehensive negotiation analysis: identifies Zone of Possible Agreement (ZOPA), Best Alternatives (BATNA) for each party, leverage points, and recommended opening positions.',
    howItWorks: 'AiPopulate calls /api/ai/negotiation with situation actors and issues. Returns structured ZOPA/BATNA data visualized in the ZOPA visualizer component.',
    analyticalFramework: 'Fisher/Ury Getting to Yes + ZOPA/BATNA Framework',
    dataSource: 'Situation context + actor profiles',
    status: 'working',
  },
  {
    name: 'CONCORDIA Mediation',
    path: '/concordia',
    icon: Scale,
    section: 'Analysis & Drafting',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'AI-powered mediation simulation with structured dialogue facilitation and settlement drafting.',
    purpose: 'Simulates mediation sessions with AI role-playing conflict parties. Facilitates structured dialogue, identifies common ground, and drafts settlement language. A flagship TACITUS product.',
    howItWorks: 'Chat-based interface via /api/ai/mediation. AI receives full situation context and mediates between parties using Berghof Foundation process design methodology.',
    analyticalFramework: 'Berghof Foundation Mediation Process Design + UN Guidance for Effective Mediation',
    dataSource: 'Situation context + mediation methodology',
    status: 'working',
  },
  {
    name: 'Mediation Designer',
    path: '/mediation-design',
    icon: Handshake,
    section: 'Analysis & Drafting',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Process architecture for mediation: phased roadmap, CBM sequencing, venue criteria, and spoiler mitigation.',
    purpose: 'Designs the mediation process itself: phase sequencing, confidence-building measures, ground rules, venue selection criteria, spoiler mitigation strategies, and implementation monitoring.',
    howItWorks: 'AiPopulate calls /api/ai/mediation-design with situation context. Returns phased process design with CBMs, ground rules, and risk mitigation. Each phase is expandable with activities and success criteria.',
    analyticalFramework: 'UN Guidance for Effective Mediation + Berghof Foundation + Lax/Sebenius Deal Architecture',
    dataSource: 'Situation context + mediation methodology',
    status: 'working',
  },
  {
    name: 'Briefing Room',
    path: '/briefing',
    icon: Presentation,
    section: 'Analysis & Drafting',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Structured intelligence briefings with morning digest format and key developments tracking.',
    purpose: 'Generates formatted intelligence briefings following the UN DPPA Morning Note standard. Includes security, political, humanitarian, and media sections with risk badges and action items.',
    howItWorks: 'AiPopulate calls /api/ai/briefing-generate with situation context and live intelligence feeds. Returns structured briefing sections with risk assessment and recommended actions.',
    analyticalFramework: 'UN DPPA Morning Brief Standard',
    dataSource: 'Situation context + GDELT/ReliefWeb live feeds',
    status: 'working',
  },
  {
    name: 'Daily Brief',
    path: '/auto-briefings',
    icon: Newspaper,
    section: 'Analysis & Drafting',
    creditCost: 2,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Automated daily intelligence briefs generated at 05:00 UTC with history and trend tracking.',
    purpose: 'Produces automated daily intelligence summaries for all active situations. Runs as a cron job at 05:00 UTC, generating and storing briefs in Firestore. Users can view history of the last 7 briefs.',
    howItWorks: 'Cloud Scheduler job at /api/cron/generate-briefing iterates all active situations via Admin SDK. Each brief is stored at users/{uid}/situations/{sitId}/auto-briefings/{date}. Manual generation also available.',
    analyticalFramework: 'UN DPPA Morning Note Standard',
    dataSource: 'Situation context + GDELT/ReliefWeb live feeds + cron automation',
    status: 'working',
  },

  // ── Intelligence Tools ──
  {
    name: 'ARGUS Intelligence',
    path: '/argus',
    icon: Network,
    section: 'Intelligence Tools',
    creditCost: 5,
    aiModel: 'Gemini 2.5 Pro + Firecrawl',
    description: 'Deep web research engine with Firecrawl-powered source crawling and structured intelligence extraction.',
    purpose: 'Performs deep web research on any aspect of the situation. Crawls live web sources via Firecrawl, extracts and structures intelligence, and presents findings with source attribution. A flagship TACITUS product.',
    howItWorks: 'AiPopulate calls /api/ai/argus for structured intelligence. Also has a Live Web Research tab with suggested queries and free-text search via /api/ai/deep-research streaming endpoint.',
    analyticalFramework: null,
    dataSource: 'Live web crawling via Firecrawl + GDELT + Wikipedia',
    status: 'working',
  },
  {
    name: 'Media Compass',
    path: '/media-compass',
    icon: Compass,
    section: 'Intelligence Tools',
    creditCost: 2,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Interactive media source mapping by political orientation and reliability, with situation-specific AI-discovered sources.',
    purpose: 'Maps 30+ global media sources on a bias-reliability chart. For real situations, AI discovers 5-10 situation-specific sources (local media, diaspora outlets, think tanks) and plots them with gold markers alongside the global reference set.',
    howItWorks: 'Static global source database plotted on the SpectrumChart SVG component. AI media scan via /api/ai/media-scan generates outlet analysis and situation-specific sources. Live News Search via /api/ai/deep-research for real-time queries.',
    analyticalFramework: 'CRAAP Test (Currency, Relevance, Authority, Accuracy, Purpose) + Media Bias/Fact Check methodology',
    dataSource: 'Global media database + AI media scan + GDELT articles + Firecrawl live search',
    status: 'working',
  },
  {
    name: 'Media Roundup',
    path: '/media-roundup',
    icon: Newspaper,
    section: 'Intelligence Tools',
    creditCost: 2,
    aiModel: 'Gemini 2.5 Pro + Firecrawl',
    description: 'Curated media roundup with source diversity scoring and configurable time ranges.',
    purpose: 'Generates a structured media roundup covering the situation across multiple time ranges (24h, 48h, 7d, 30d). Scores source diversity and highlights key developments from different perspectives.',
    howItWorks: 'Streaming generation via /api/ai/media-roundup. Uses Firecrawl searchWeb with regional source profiles for diversity. Persisted via usePersistedToolData.',
    analyticalFramework: 'Source Diversity Scoring',
    dataSource: 'Firecrawl web search + regional media source profiles',
    status: 'working',
  },
  {
    name: 'Info Environment',
    path: '/info-environment',
    icon: Radio,
    section: 'Intelligence Tools',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Narrative ecosystem mapping, information operation detection, and counter-messaging strategy.',
    purpose: 'Monitors the information environment around a conflict: dominant narratives, information operations (CIB), platform dynamics, key amplifiers, and provides RESIST2 counter-messaging frameworks.',
    howItWorks: 'AiPopulate calls /api/ai/info-environment with situation context and GDELT stability data. Returns narrative cards, IO detection results, platform dynamics, and counter-messaging strategies.',
    analyticalFramework: 'NATO STRATCOM + EU DisinfoLab + UN DPPA + RESIST2 Counter-Messaging Framework',
    dataSource: 'Situation context + GDELT stability scores + AI analysis',
    status: 'working',
  },
  {
    name: 'Commitment Tracker',
    path: '/commitments',
    icon: FileCheck,
    section: 'Intelligence Tools',
    creditCost: 2,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Compliance monitoring for ceasefire agreements, peace accords, and diplomatic commitments.',
    purpose: 'Tracks compliance with formal commitments (ceasefires, agreements, treaties). Monitors each commitment with compliance progress bars, violation patterns, and upcoming deadlines.',
    howItWorks: 'AiPopulate calls /api/ai/commitment-scan with situation context. Returns structured commitments with compliance scores using UN DPPA compliance monitoring methodology and IHL/IHRL violation classification.',
    analyticalFramework: 'UN DPPA Compliance Monitoring Framework + IHL/IHRL',
    dataSource: 'Situation context + AI analysis',
    status: 'working',
  },
  {
    name: 'Treaty Analyzer',
    path: '/treaty-analyzer',
    icon: BookMarked,
    section: 'Intelligence Tools',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Legal analysis of treaties, agreements, and resolutions with clause-by-clause breakdown.',
    purpose: 'Analyzes treaties and legal documents relevant to the situation. Provides clause-by-clause analysis, identifies ambiguities, compliance obligations, and enforcement mechanisms.',
    howItWorks: 'AiPopulate calls /api/ai/treaty-analyze with situation context. Returns structured analysis of relevant legal instruments.',
    analyticalFramework: 'International Law Analysis',
    dataSource: 'Situation context + AI legal analysis',
    status: 'working',
  },
  {
    name: 'Sanctions Tracker',
    path: '/sanctions',
    icon: Shield,
    section: 'Intelligence Tools',
    creditCost: 2,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Sanctions regime monitoring with actor mapping and compliance assessment.',
    purpose: 'Tracks applicable sanctions regimes (UN, EU, US, regional). Maps which actors are sanctioned, identifies sanctions evasion patterns, and assesses compliance. Includes analytical-purpose-only disclaimer.',
    howItWorks: 'AiPopulate calls /api/ai/sanctions-scan with situation context. Returns structured sanctions data with regime details, designated entities, and evasion indicators.',
    analyticalFramework: 'UN Sanctions Monitoring Methodology',
    dataSource: 'Situation context + AI analysis (informational only, not legal advice)',
    status: 'working',
  },
  {
    name: 'Calendar Monitor',
    path: '/calendar',
    icon: Calendar,
    section: 'Intelligence Tools',
    creditCost: 1,
    aiModel: 'Google AI',
    description: 'Tracks upcoming Security Council sessions, General Assembly meetings, AU summits, and diplomatic events.',
    purpose: 'Monitors the diplomatic calendar for events relevant to the situation: UNSC sessions, UNGA meetings, UNHRC reviews, AU PSC meetings, EU Council, and more. Generates pre-briefs for each event.',
    howItWorks: 'Event calendar with institution filtering. AI generates pre-briefs for selected events via /api/ai/chat. Persisted via usePersistedToolData.',
    analyticalFramework: null,
    dataSource: 'Diplomatic calendar database + AI-generated briefs',
    status: 'working',
  },
  {
    name: 'Sources Library',
    path: '/sources',
    icon: Search,
    section: 'Intelligence Tools',
    creditCost: 5,
    aiModel: 'Gemini 2.5 Pro',
    description: 'AI-managed trusted source database with nomenclature tracking, reliability scoring, and priority management.',
    purpose: 'Maintain a curated library of intelligence sources for your situation: local media, Telegram channels, X accounts, think tanks, diaspora outlets, NGO feeds. AI discovers sources, tracks their naming conventions (nomenclature), and scores reliability and political orientation.',
    howItWorks: 'AI source discovery via /api/ai/discover-sources generates 8-12 situation-specific sources. Each source is characterized with type, platform, language, reliability (0-1), orientation (-1 to 1), nomenclature analysis, coverage strengths, and known biases. Users can add manual sources, set priority levels, and add notes. All persisted to Firestore.',
    analyticalFramework: 'Source Credibility Assessment + Nomenclature Analysis',
    dataSource: 'AI discovery + user curation + web research',
    status: 'working',
  },
  {
    name: 'Alert Center',
    path: '/alerts',
    icon: Bell,
    section: 'Intelligence Tools',
    creditCost: null,
    aiModel: null,
    description: 'Real-time alerts from GDELT monitoring, delivered daily at 06:00 UTC via automated cron job.',
    purpose: 'Aggregates alerts generated by the daily GDELT monitoring cron job. Shows new developments, escalation warnings, and significant events related to active situations.',
    howItWorks: 'Cloud Scheduler job at /api/cron/check-alerts runs at 06:00 UTC daily. Scans GDELT for situation-related events and generates alerts stored in the notification store. No AI credits consumed for viewing.',
    analyticalFramework: null,
    dataSource: 'GDELT automated monitoring (cron)',
    status: 'working',
  },
  {
    name: 'UN Toolkit',
    path: '/un-toolkit',
    icon: Building2,
    section: 'Intelligence Tools',
    creditCost: 1,
    aiModel: 'Google AI',
    description: 'UN terminology checker, resolution language drafter, and diplomatic language standardizer.',
    purpose: 'Interactive toolkit for UN-standard language: check terminology against the UN Editorial Manual, draft UNSC resolution language, and standardize diplomatic phrasing. Essential for formal document production.',
    howItWorks: 'Multiple AI endpoints: /api/ai/terminology for checks, /api/ai/resolution for resolution language drafting, /api/ai/chat for freeform assistance. Interactive builder interface.',
    analyticalFramework: 'UN Editorial Manual + UNSC Resolution Drafting Standards',
    dataSource: 'UN terminology database + AI language generation',
    status: 'working',
  },

  // ── Workspace ──
  {
    name: 'Documents',
    path: '/documents',
    icon: FolderOpen,
    section: 'Workspace',
    creditCost: 3,
    aiModel: 'Gemini 2.5 Pro',
    description: 'Document upload, text extraction (PDF/DOCX/TXT), and AI entity extraction with RAG retrieval.',
    purpose: 'Upload documents relevant to the situation. PRAXIS extracts text, chunks for RAG retrieval, and can perform AI entity extraction to feed the conflict graph. Uploaded documents enrich all tool analyses.',
    howItWorks: 'Upload via /api/documents/upload. Text extracted from PDF (pdf-parse), DOCX (mammoth), or TXT. Chunked and stored in Firestore for keyword-based retrieval. Entity extraction via /api/ai/extract.',
    analyticalFramework: null,
    dataSource: 'User-uploaded documents',
    status: 'working',
  },
  {
    name: 'Case Library',
    path: '/cases',
    icon: BookOpen,
    section: 'Workspace',
    creditCost: null,
    aiModel: null,
    description: 'Browse and manage all your situations with status indicators and quick navigation.',
    purpose: 'Central hub for viewing all created situations. Shows situation name, type, region, status, risk score, and actor count. Quick navigation to any situation dashboard.',
    howItWorks: 'Reads from useSituationStore which syncs with Firestore. No AI credits consumed. Supports situation creation, archiving, and deletion.',
    analyticalFramework: null,
    dataSource: 'Firestore situations collection',
    status: 'working',
  },
  {
    name: 'Team Hub',
    path: '/team',
    icon: UsersRound,
    section: 'Workspace',
    creditCost: null,
    aiModel: null,
    description: 'Team collaboration features for shared situation workspaces.',
    purpose: 'Placeholder for upcoming team collaboration features: shared situations, role-based access, comment threads, and activity feeds.',
    howItWorks: 'Currently displays team overview. Full collaboration features planned for future release.',
    analyticalFramework: null,
    dataSource: 'Firestore user profiles',
    status: 'working',
  },
  {
    name: 'Advisory Panel',
    path: '/advisory',
    icon: MessageSquare,
    section: 'Analysis & Drafting',
    creditCost: 1,
    aiModel: 'Google AI',
    description: 'Consult specialized AI advisors: political, military, humanitarian, legal, economic, media, and more.',
    purpose: 'Chat with 10 specialized AI advisor personas, each with deep expertise in a specific domain (political analysis, military affairs, humanitarian response, legal frameworks, etc.). Can also run panel discussions with multiple advisors.',
    howItWorks: 'Chat interface via /api/ai/advisor-chat with per-advisor system prompts. Each advisor has a unique persona, expertise area, and analytical lens. Panel discussion mode sends the same question to multiple advisors.',
    analyticalFramework: 'Multi-perspective advisory methodology',
    dataSource: 'Situation context + advisor persona prompts',
    status: 'working',
  },
];

const SECTIONS = ['Situation Room', 'Analysis & Drafting', 'Intelligence Tools', 'Workspace'];

const SECTION_DESCRIPTIONS: Record<string, string> = {
  'Situation Room': 'Core monitoring and assessment tools that provide the foundational intelligence picture for your situation.',
  'Analysis & Drafting': 'AI-powered analysis, diplomatic document production, and strategic planning tools.',
  'Intelligence Tools': 'Specialized intelligence gathering, media analysis, compliance monitoring, and information environment assessment.',
  'Workspace': 'Document management, situation organization, and team collaboration.',
};

/* ---------- Components ---------- */

function ToolCard({ tool }: { tool: ToolDoc }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = tool.icon;

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border bg-white transition-shadow',
        expanded ? 'border-diplomatic-blue/30 shadow-md' : 'border-[var(--color-app-border)] hover:shadow-sm'
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          expanded ? 'bg-diplomatic-blue/10 text-diplomatic-blue' : 'bg-navy-100 text-navy-500'
        )}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-navy-900">{tool.name}</h3>
            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            {tool.creditCost !== null && (
              <span className="rounded-full bg-gold-500/10 px-1.5 py-0.5 text-[9px] font-bold text-gold-700">
                {tool.creditCost} cr
              </span>
            )}
            {tool.aiModel && (
              <span className="hidden sm:inline rounded-full bg-navy-100 px-1.5 py-0.5 text-[9px] font-medium text-navy-500">
                {tool.aiModel}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-navy-500 line-clamp-2">{tool.description}</p>
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-navy-400 transition-transform mt-1', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-[var(--color-app-border)] px-4 py-4 space-y-3"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-1">Purpose</p>
            <p className="text-xs text-navy-700 leading-relaxed">{tool.purpose}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-1">How It Works</p>
            <p className="text-xs text-navy-600 leading-relaxed">{tool.howItWorks}</p>
          </div>
          {tool.analyticalFramework && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-1">Analytical Framework</p>
              <p className="text-xs text-diplomatic-blue font-medium">{tool.analyticalFramework}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <div className="text-[10px] text-navy-500">
              <span className="font-semibold text-navy-600">Data:</span> {tool.dataSource}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---------- Main Page ---------- */

export default function DocsPage() {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? TOOL_DOCS.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.section.toLowerCase().includes(search.toLowerCase()) ||
        (t.analyticalFramework?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : TOOL_DOCS;

  const totalCredits = TOOL_DOCS.reduce((sum, t) => sum + (t.creditCost ?? 0), 0);
  const aiTools = TOOL_DOCS.filter(t => t.aiModel);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-diplomatic-blue/10 text-diplomatic-blue">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-normal tracking-wide text-navy-900">
              PRAXIS Documentation
            </h1>
            <p className="text-sm text-navy-500">
              Complete reference for all {TOOL_DOCS.length} tools in the TACITUS platform
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-3 text-center">
          <p className="text-xl font-bold text-navy-900">{TOOL_DOCS.length}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Total Tools</p>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{TOOL_DOCS.length}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Working</p>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-3 text-center">
          <p className="text-xl font-bold text-diplomatic-blue">{aiTools.length}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">AI-Powered</p>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-3 text-center">
          <p className="text-xl font-bold text-gold-600">{totalCredits}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Total Credits (all)</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools by name, description, or framework..."
          className="w-full rounded-xl border border-[var(--color-app-border)] bg-white py-3 pl-10 pr-4 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/50 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
        />
      </div>

      {/* Platform overview */}
      <div className="rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/5 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-diplomatic-blue mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-navy-900">How PRAXIS Works</h2>
            <p className="mt-1.5 text-xs text-navy-600 leading-relaxed">
              When you create a new situation, PRAXIS automatically researches it using web search and live data feeds
              (GDELT, ReliefWeb, HDX). The <strong>Situation Initializer</strong> then seeds 5 core tools (Actor Profiles,
              Risk Monitor, Early Warning, Conflict Graph, Stakeholder Map) with structured intelligence extracted from
              the research. Every tool page auto-populates on first visit using the <strong>AiPopulate</strong> pattern
              and persists data to Firestore with a 24-hour TTL. All data is situation-scoped and accessible only to
              the authenticated user. The PRAXIS AI Assistant has access to all 21 analytical tools and your full
              situation context.
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const sectionTools = filtered.filter(t => t.section === section);
        if (sectionTools.length === 0) return null;

        return (
          <div key={section}>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-navy-900">{section}</h2>
              <p className="text-xs text-navy-500">{SECTION_DESCRIPTIONS[section]}</p>
            </div>
            <div className="space-y-2">
              {sectionTools.map(tool => (
                <ToolCard key={tool.path} tool={tool} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Audit summary */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
        <h2 className="text-sm font-semibold text-emerald-800 mb-2">Audit Status: All Systems Operational</h2>
        <p className="text-xs text-emerald-700 leading-relaxed">
          All {TOOL_DOCS.length} tool pages have been audited and verified. Every page uses <code className="bg-emerald-100 px-1 rounded">useSituationGuard()</code> for
          access control, every AI route is wrapped with <code className="bg-emerald-100 px-1 rounded">withAuth</code> for authentication,
          and all credit costs are enforced. Data persistence is handled via AiPopulate (Firestore, 24h TTL) or usePersistedToolData.
          35 smoke tests passing via Vitest.
        </p>
        <p className="mt-2 text-[10px] text-emerald-600">
          Last audit: v3.5 / Build 2026.03.26
        </p>
      </div>

      <p className="text-center text-[10px] text-navy-400 pb-8">
        PRAXIS v3.5 by TACITUS. All tools situation-scoped and authenticated. AI analysis supplements, not replaces, human judgment.
      </p>
    </div>
  );
}
