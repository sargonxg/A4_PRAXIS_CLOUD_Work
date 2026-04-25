/**
 * Role-aware tool recommendations for the dashboard.
 *
 * Maps `AnalystProfile.identity.role` and the active situation's domain to a
 * ranked list of PRAXIS tool ids that the workspace should surface first.
 *
 * This is the single place that turns onboarding choices into a concrete
 * "next thing you should do" surface — fixing the audit finding that the
 * dashboard was previously role-blind. The mapping is opinionated by design:
 * it reflects how each role *actually* uses PRAXIS day-to-day, not a
 * comprehensive index of every tool the role *could* use.
 *
 * Tool ids must match the route segments under `/app/<id>` and the
 * `tool-registry.ts` ids exactly.
 */
import type { AnalystRole } from '@/types/analyst-profile';
import type { AnalystDomainId } from '@/types/analyst-profile';

export interface ToolRecommendation {
  toolId: string;
  /** Route under /app/* — used as the link target. */
  href: string;
  /** Why this tool is recommended for this role + domain. One sentence. */
  rationale: string;
}

const ROLE_TOOLS: Record<AnalystRole, string[]> = {
  un_official: [
    'briefing',         // Intelligence Briefing — primary deliverable
    'early-warning',    // Escalation monitor — UN PAO core workflow
    'risk-monitor',     // INFORM-style risk feed
    'sanctions',        // Sanctions & Compliance
    'humanitarian',     // OCHA snapshot
    'commitments',      // Commitment Tracker
  ],
  diplomat: [
    'negotiation-prep', // Negotiation Prep — primary tool for diplomats
    'talking-points',   // Talking points for meetings
    'stakeholder-map',  // Power & influence mapping
    'mediation-design', // Process architecture
    'briefing',
    'treaty-analyzer',
  ],
  think_tank: [
    'compare',          // Historical Parallels — think-tank bread & butter
    'scenarios',        // Scenario Planner
    'game-theory',      // Strategic interaction modelling
    'argus',            // Deep research
    'media-compass',    // Narrative landscape
    'dossier',          // Diplomatic Dossier
  ],
  ngo: [
    'humanitarian',     // OCHA snapshot — NGO primary
    'human-rights',     // Human Rights Monitor
    'early-warning',
    'media-compass',
    'briefing',
    'commitments',
  ],
  researcher: [
    'argus',            // Deep research — researcher primary
    'compare',          // Historical Parallels
    'media-compass',
    'conflict-graph',   // ACO graph
    'sources',          // Sources Library — credibility tracking
    'deep-search-agent',
  ],
  journalist: [
    'media-compass',    // Media & Narrative
    'media-roundup',    // Media Roundup
    'info-environment', // Info Environment
    'compare',
    'argus',
    'sources',
  ],
  private_sector: [
    'risk-monitor',     // Risk Assessment — primary for private-sector clients
    'economic-impact',  // Economic Impact
    'sanctions',
    'electoral-risk',   // Electoral Violence Risk
    'scenarios',
    'briefing',
  ],
  other: [
    'dashboard',
    'risk-monitor',
    'briefing',
    'compare',
    'argus',
    'media-compass',
  ],
};

const DOMAIN_TOOL_BOOSTS: Partial<Record<AnalystDomainId, string[]>> = {
  'armed-conflict-security': ['early-warning', 'conflict-graph', 'geospatial-monitor'],
  'diplomacy-negotiation': ['negotiation-prep', 'mediation-design', 'stakeholder-map'],
  'humanitarian': ['humanitarian', 'human-rights'],
  'human-rights': ['human-rights', 'commitments'],
  'governance-rule-of-law': ['legal-tracker', 'treaty-analyzer', 'commitments'],
  'economic-sanctions': ['sanctions', 'economic-impact'],
  'development-stabilization': ['economic-impact', 'humanitarian'],
  'climate-environmental-security': ['economic-impact', 'risk-monitor'],
  'information-cyber': ['info-environment', 'media-compass'],
  'transnational-threats': ['external-actors', 'sanctions'],
};

const TOOL_RATIONALES: Record<string, string> = {
  'briefing': 'Compose UN-DPPA-style intelligence briefings tied to the active situation.',
  'early-warning': 'Glasl-stage escalation monitor with INFORM risk index and real-time signals.',
  'risk-monitor': 'Composite risk gauge across hazard, vulnerability, and coping capacity.',
  'sanctions': 'Track designations, designations changes, and compliance posture.',
  'humanitarian': 'OCHA-standard snapshot drawing on HDX HAPI, UNHCR, and ReliefWeb.',
  'commitments': 'Monitor pledges, ceasefires, and treaty commitments by actor.',
  'negotiation-prep': 'Fisher-Ury BATNA/ZOPA prep and audience-tone calibration.',
  'talking-points': 'Audience-aware talking points with red-line enforcement.',
  'stakeholder-map': 'Mitchell-Agle-Wood salience and Barnett-Duvall power mapping.',
  'mediation-design': 'Process architecture, CBM design, Stedman spoiler analysis.',
  'treaty-analyzer': 'Treaty clause analysis and compliance tracking.',
  'compare': 'Historical parallels with prior conflicts and case-library matches.',
  'scenarios': 'Scenario simulation with probability trees and Monte Carlo runs.',
  'game-theory': 'Payoff matrices and Nash equilibria for strategic interactions.',
  'argus': 'Deep web research with Firecrawl + grounded search across sources.',
  'media-compass': 'Bias and reliability map across global media outlets.',
  'dossier': 'Diplomatic dossiers on actors with Stedman/Mitchell frames.',
  'human-rights': 'Human rights monitor with treaty-body and UPR tracking.',
  'media-roundup': 'Daily media roundup tuned to your audience and red lines.',
  'info-environment': 'Galtung cultural-violence and disinformation mapping.',
  'conflict-graph': 'ACO 14-entity knowledge graph with hidden-linkage analysis.',
  'sources': 'Credibility-weighted source library with Ad Fontes scoring.',
  'deep-search-agent': 'Multi-agent ADK research pipeline with planner + synthesizer.',
  'economic-impact': 'Sectoral impact, trade flows, and macro-fragility view.',
  'electoral-risk': 'Electoral-violence risk with calendar overlay.',
  'geospatial-monitor': 'ACLED event map with hotspot and movement detection.',
  'legal-tracker': 'Resolution and legal instrument tracker by body and theme.',
  'external-actors': 'External-actor influence and proxy monitoring.',
  'dashboard': 'Situation overview hub.',
};

const TOOL_HREFS: Record<string, string> = {
  'sources': '/sources',
};

export function recommendToolsForRole(
  role: AnalystRole | undefined,
  domain: AnalystDomainId | undefined,
  limit: number = 5,
): ToolRecommendation[] {
  const baseRole = role && role in ROLE_TOOLS ? role : 'other';
  const baseList = ROLE_TOOLS[baseRole];

  // Boost: tools matching the user's/situation's domain rise to the top of the list.
  const boosts = (domain && domain !== 'generic' ? DOMAIN_TOOL_BOOSTS[domain] : undefined) || [];

  // Stable union, boosted items first (preserving relative order from each list).
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of [...boosts, ...baseList]) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }

  return ordered.slice(0, limit).map((toolId) => ({
    toolId,
    href: TOOL_HREFS[toolId] || `/${toolId}`,
    rationale: TOOL_RATIONALES[toolId] || 'Recommended for your role and active situation.',
  }));
}

const ROLE_LABELS: Record<AnalystRole, string> = {
  un_official: 'UN / IO Official',
  diplomat: 'Diplomat',
  think_tank: 'Think Tank Analyst',
  ngo: 'NGO / Humanitarian',
  researcher: 'Researcher',
  journalist: 'Journalist',
  private_sector: 'Private Sector',
  other: 'Analyst',
};

export function roleLabel(role: AnalystRole | undefined): string {
  return role && role in ROLE_LABELS ? ROLE_LABELS[role] : 'Analyst';
}
