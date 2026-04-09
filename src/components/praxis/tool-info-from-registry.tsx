'use client';

import { getToolById, getRelatedTools } from '@/lib/constants/tool-registry';
import { ToolInfoPanel } from './tool-info-panel';

// Framework citation lookup — maps framework names to academic citations
const FRAMEWORK_CITATIONS: Record<string, string> = {
  'INFORM Risk Index': 'IASC/EC Joint Research Centre — composite risk index (Hazard, Vulnerability, Coping Capacity)',
  'Glasl Escalation Model': 'Friedrich Glasl (1982) — 9-stage conflict escalation model, three zones: Win-Win, Win-Lose, Lose-Lose',
  'Glasl 9-Stage Escalation Model': 'Friedrich Glasl (1982) — 9-stage conflict escalation model, three zones: Win-Win, Win-Lose, Lose-Lose',
  'Fisher-Ury Principled Negotiation': 'Fisher, Ury & Patton (1981) — Getting to Yes: interest-based negotiation (positions vs. interests)',
  'ACO Conflict Grammar v2.0': 'TACITUS Agentic Conflict Ontology — 14 entity types, 72 typed relationships, 4 confidence levels',
  'ACO Conflict Grammar': 'TACITUS Agentic Conflict Ontology — 14 entity types, 72 typed relationships, 4 confidence levels',
  'Mitchell-Agle-Wood Stakeholder Theory': 'Mitchell, Agle & Wood (1997) — Power, Legitimacy, Urgency stakeholder salience typology',
  'Barnett-Duvall Four Faces of Power': 'Barnett & Duvall (2005) — Compulsory, Institutional, Structural, Productive power taxonomy',
  'Barnett-Duvall Power Taxonomy': 'Barnett & Duvall (2005) — Compulsory, Institutional, Structural, Productive power taxonomy',
  'Lederach Peacebuilding Pyramid': 'John Paul Lederach (1997) — Track I/II/III multi-level peacebuilding framework',
  'Zartman Ripeness Theory': 'I. William Zartman (2000) — Mutually Hurting Stalemate + Way Out preconditions for negotiation',
  'Stedman Spoiler Theory': 'Stephen J. Stedman (1997) — Total, Limited, Greedy spoiler typology in peace processes',
  'Stedman Spoilers': 'Stephen J. Stedman (1997) — Total, Limited, Greedy spoiler typology in peace processes',
  'Social Network Analysis': 'Wasserman & Faust (1994) — centrality, betweenness, clustering coefficient metrics',
  'Ad Fontes Media Bias Chart': 'Ad Fontes Media — content-based reliability and political lean assessment methodology',
  'Ad Fontes Media Bias Ratings': 'Ad Fontes Media — content-based reliability and political lean assessment methodology',
  'AllSides Media Bias Ratings': 'AllSides — multi-method media bias rating using editorial review, community feedback, and blind surveys',
  'CRAAP Test': 'Meriam Library (2010) — Currency, Relevance, Authority, Accuracy, Purpose source evaluation',
  'CRAAP Test (Currency, Relevance, Authority, Accuracy, Purpose)': 'Meriam Library (2010) — Currency, Relevance, Authority, Accuracy, Purpose source evaluation',
  'CRAAP Source Evaluation': 'Meriam Library (2010) — Currency, Relevance, Authority, Accuracy, Purpose source evaluation',
  'CRAAP Evaluation': 'Meriam Library (2010) — Currency, Relevance, Authority, Accuracy, Purpose source evaluation',
  'ACLED Event Typology': 'ACLED — Armed Conflict Location & Event Data: 6 event types, 25 sub-types, geocoded',
  'ACLED Conflict Mapping Methodology': 'ACLED — disaggregated geocoded event data with precision levels 1-8',
  'GDELT Event Ontology': 'GDELT Project — Global Database of Events, Language, and Tone (CAMEO ontology)',
  'GDELT GCAM Sentiment Analysis': 'GDELT GCAM — Global Content Analysis Measures across 65+ languages',
  'Galtung Triangle': 'Johan Galtung (1969) — Direct, Structural, Cultural violence triangle',
  'IPC Food Security Phases': 'Integrated Food Security Phase Classification — 5-phase scale (Minimal to Famine)',
  'OCHA Humanitarian Standards': 'UN OCHA — humanitarian coordination standards and cluster system',
  'OCHA SitRep Standards': 'UN OCHA — Situation Report standardized format for humanitarian updates',
  'OCHA Situation Report Format': 'UN OCHA — standardized format for humanitarian situation reports',
  'OCHA Humanitarian GIS Standards': 'UN OCHA — GIS standards for humanitarian impact mapping',
  'SPHERE Protection Standards': 'Sphere Association — minimum standards in humanitarian response',
  'UN DPPA Report Standards': 'UN Department of Political and Peacebuilding Affairs — standardized report formats',
  'UN DPPA Morning Brief Format': 'UN DPPA — Daily Situation Report format (7 sections, classification markings)',
  'UN Editorial Manual': 'UN Editorial Manual (8th ed.) — British spelling, approved abbreviations, diplomatic formulations',
  'UN Editorial Manual (8th ed.)': 'UN Editorial Manual (8th ed.) — British spelling, approved abbreviations, diplomatic formulations',
  'UN SC Briefing Conventions': 'UN Security Council — standardized briefing format and procedural conventions',
  'UNSC Procedural Rules': 'UN Security Council Provisional Rules of Procedure (S/96/Rev.7)',
  'UNSC Resolution Drafting Conventions': 'UN Security Council — preambular/operative clause hierarchy and legal weight',
  'UN Canonical Name Registry': 'UN Terminology Database — standardized names for countries, organizations, and entities',
  'UN Compliance Monitoring Standards': 'UN DPPA — compliance monitoring methodology for peace agreement implementation',
  'UN DPPA Mediation Guidelines': 'UN DPPA — United Nations Guidance for Effective Mediation (A/66/811)',
  'UN DPPA Mediation Standards': 'UN DPPA — United Nations Guidance for Effective Mediation (A/66/811)',
  'UN Sanctions Monitoring Methodology': 'UN Security Council sanctions committees — Panel of Experts methodology',
  'OFAC SDN List Compliance': 'US Treasury OFAC — Specially Designated Nationals compliance requirements',
  'EU Restrictive Measures Framework': 'EU Common Foreign and Security Policy — restrictive measures legal framework',
  'Vienna Convention on the Law of Treaties': 'VCLT (1969) — Articles 31-33: treaty interpretation (textual, contextual, teleological)',
  'IHL (Geneva Conventions)': 'Geneva Conventions (1949) + Additional Protocols — International Humanitarian Law',
  'IHRL (ICCPR, ICESCR)': 'International Covenant on Civil and Political Rights / Economic, Social and Cultural Rights',
  'NATO STRATCOM Taxonomy': 'NATO Strategic Communications Centre of Excellence — information activities classification',
  'Ben Nimmo IO Detection (4D Framework)': 'Ben Nimmo (2019) — Dismiss, Distort, Distract, Dismay IO detection framework',
  'Framing Analysis (Entman)': 'Robert Entman (1993) — problem definition, causal attribution, moral judgment, treatment recommendation',
  'Agenda-Setting Theory': 'McCombs & Shaw (1972) — media agenda-setting effects on public priorities',
  'Lax-Sebenius Negotiation Analysis': 'Lax & Sebenius (2006) — 3-D Negotiation: Setup, Deal Design, Tactics',
  'Lax-Sebenius 3D Negotiation': 'Lax & Sebenius (2006) — 3-D Negotiation: Setup, Deal Design, Tactics',
  'SIPRI Risk Categories': 'Stockholm International Peace Research Institute — armed conflict categorization',
  'SIPRI Military Balance': 'SIPRI — military expenditure, arms transfers, and force posture data',
  'SIPRI Scenario Methodology': 'SIPRI — scenario planning methodology for security policy analysis',
  'SIPRI Peace Operations Criteria': 'SIPRI — peace operations database inclusion criteria and classification',
  'Fund for Peace FSI': 'Fund for Peace Fragile States Index — 12 conflict risk indicators, annual ranking',
  'Harvard PON BATNA Analysis': 'Harvard Program on Negotiation — Best Alternative to Negotiated Agreement framework',
  'Intelligence Cycle': 'Intelligence Community — Direction, Collection, Processing, Analysis, Dissemination',
  'Intelligence Analysis Standards (ICD 203)': 'Intelligence Community Directive 203 — Analytic Standards (confidence levels, sourcing)',
  'Structured Analytic Techniques (SATs)': 'Richards Heuer & Randy Pherson — ACH, Key Assumptions Check, Red Team Analysis',
  'Structured Analytic Techniques': 'Richards Heuer & Randy Pherson — ACH, Key Assumptions Check, Red Team Analysis',
  'Multi-Perspectival Analysis': 'Multi-stakeholder analytical approach using diverse expert viewpoints',
  "Devil's Advocacy Technique": 'Richards Heuer — systematic challenging of prevailing assumptions',
  'Red Team Methodology': 'US Army UFMCS — adversarial analysis to identify vulnerabilities in reasoning',
  'Most Similar Cases (MSC) Methodology': 'J.S. Mill — comparative method selecting cases with maximal similarity for inferential leverage',
  'UCDP Conflict Typology': 'Uppsala Conflict Data Program — state-based, non-state, one-sided violence classification',
  'UCDP Peace Agreement Dataset Methodology': 'UCDP — categorization of comprehensive, partial, process, and ceasefire agreements',
  'Berghof Mediation Process Framework': 'Berghof Foundation — 6-phase mediation process (pre-negotiation through consolidation)',
  'Sisk Spoiler Management Theory': 'Timothy Sisk — spoiler management strategies in peace processes',
  'Schelling Focal Points': 'Thomas Schelling (1960) — focal points and strategic coordination in conflict',
  'Putnam Two-Level Games': 'Robert Putnam (1988) — domestic-international negotiation linkage theory',
  'Fearon Rationalist War Causes': 'James Fearon (1995) — information asymmetry, commitment problems, indivisibility',
  'Diplomatic Communication Theory': 'Harold Nicolson — principles of diplomatic communication and negotiation',
  'ACO Actor Profile Standards': 'TACITUS ACO — standardized actor profile format (identity, interests, capabilities, constraints)',
  'EWARN Threshold Methodology': 'Early Warning and Response Network — modified Z-score threshold methodology',
};

// Data source status mapping
const DATA_SOURCE_STATUS: Record<string, 'live' | 'offline' | 'estimated'> = {
  'ACLED': 'live',
  'GDELT': 'live',
  'HDX HAPI': 'live',
  'ReliefWeb': 'live',
  'World Bank': 'live',
  'UNHCR': 'live',
  'UCDP': 'live',
  'UN News': 'live',
  'Crisis Group': 'live',
  'SIPRI': 'live',
  'Firecrawl': 'live',
  'Google Search': 'live',
  'Google Search (grounded)': 'live',
  'Vertex AI Agent Engine': 'live',
};

// How-to-use templates by tool category
const HOW_TO_USE_BY_CATEGORY: Record<string, [string, string, string]> = {
  context: [
    'Select or create a situation to provide the analytical context for this tool.',
    'Click "Generate with PRAXIS" to run the AI analysis pipeline using live data feeds and your situation context.',
    'Review the output, export as needed, and use the related tools section to continue your analysis workflow.',
  ],
  analysis: [
    'Ensure your situation has key actors, region, and description populated for best results.',
    'Click "Generate" to run the analytical framework. PRAXIS synthesizes live data feeds, your conflict graph, and AI reasoning.',
    'Use the methodology section below to understand how scores and assessments are computed. Cross-reference with related tools.',
  ],
  intelligence: [
    'Provide your research question or select entities to investigate from your situation context.',
    'PRAXIS queries live data sources, applies source evaluation frameworks, and generates structured intelligence output.',
    'Verify findings against the cited sources. Use confidence scores to weight your assessments. Save results to build institutional memory.',
  ],
  drafting: [
    'Select the output format and audience. PRAXIS will tailor language, structure, and emphasis accordingly.',
    'Review the AI-generated draft. Edit directly or regenerate specific sections as needed.',
    'Export to DOCX/PDF or copy to clipboard. All outputs follow UN editorial standards by default.',
  ],
  simulation: [
    'Configure the simulation parameters based on your situation: actors, interests, constraints, and scenarios to test.',
    'Run the simulation. PRAXIS models strategic interactions using game-theoretic and scenario analysis frameworks.',
    'Review outcomes, adjust parameters to test alternative assumptions, and use insights to inform your strategy.',
  ],
  workspace: [
    'Navigate to the tool and review the current state of your workspace.',
    'Use the available actions to manage, organize, or configure your analysis environment.',
    'Changes are saved automatically and reflected across all PRAXIS tools.',
  ],
};

// Tool ID to href mapping
const TOOL_HREFS: Record<string, string> = {
  'dashboard': '/dashboard',
  'documents': '/documents',
  'sources-library': '/sources-library',
  'timeline': '/timeline',
  'humanitarian': '/humanitarian',
  'calendar': '/calendar',
  'conflict-graph': '/conflict-graph',
  'risk-monitor': '/risk-monitor',
  'early-warning': '/early-warning',
  'actor-profiles': '/actors',
  'stakeholder-map': '/stakeholder-map',
  'power-map': '/power-map',
  'info-environment': '/info-environment',
  'compare': '/compare',
  'assistant': '/assistant',
  'report-studio': '/reports',
  'dossier': '/dossier',
  'talking-points': '/talking-points',
  'briefing': '/briefing',
  'auto-briefings': '/auto-briefings',
  'un-toolkit': '/un-toolkit',
  'scenarios': '/scenarios',
  'negotiation-prep': '/negotiation-prep',
  'concordia': '/concordia',
  'mediation-design': '/mediation-design',
  'game-theory': '/game-theory',
  'deep-search-agent': '/deep-search-agent',
  'argus': '/argus',
  'media-compass': '/media-compass',
  'media-roundup': '/media-roundup',
  'geospatial-monitor': '/geospatial-monitor',
  'sanctions': '/sanctions',
  'commitments': '/commitments',
  'treaty-analyzer': '/treaty-analyzer',
  'alert-center': '/alerts',
  'deep-research': '/deep-research',
  'cases': '/cases',
  'team': '/team',
  'advisory': '/advisory',
  'settings': '/settings',
};

interface RegistryToolInfoProps {
  toolId: string;
  lastGenerated?: Date | null;
  defaultOpen?: boolean;
}

/**
 * Auto-generates a ToolInfoPanel from the tool registry.
 * Drop this into any tool page with just the toolId.
 */
export function RegistryToolInfo({ toolId, lastGenerated, defaultOpen }: RegistryToolInfoProps) {
  const tool = getToolById(toolId);
  if (!tool) return null;

  const related = getRelatedTools(toolId);

  return (
    <ToolInfoPanel
      toolName={tool.name}
      description={tool.description}
      methodology={tool.methodology}
      frameworks={tool.frameworks.map((name) => ({
        name,
        citation: FRAMEWORK_CITATIONS[name] ?? 'Analytical framework applied in this tool',
      }))}
      dataSources={tool.dataSources.map((name) => ({
        name,
        status: DATA_SOURCE_STATUS[name] ?? 'estimated',
      }))}
      relatedTools={related.map((rt) => ({
        name: rt.name,
        href: TOOL_HREFS[rt.id] ?? `/${rt.id}`,
      }))}
      howToUse={HOW_TO_USE_BY_CATEGORY[tool.category] ?? HOW_TO_USE_BY_CATEGORY.context}
      lastGenerated={lastGenerated}
      defaultOpen={defaultOpen}
    />
  );
}
