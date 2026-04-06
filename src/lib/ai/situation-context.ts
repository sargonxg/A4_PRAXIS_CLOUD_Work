import type { Situation } from '@/types/situation';

/**
 * Builds a rich situation context string for AI system prompts.
 * This ensures every AI call understands the user's active situation.
 */
export function buildSituationContext(situation: Situation): string {
  const actorList = situation.actors.length > 0
    ? situation.actors.map((a) => `  - ${a}`).join('\n')
    : '  (No actors defined yet)';

  const riskLabel = situation.riskScore >= 7 ? 'HIGH' :
    situation.riskScore >= 4 ? 'MODERATE' : 'LOW';

  const glaslLabel = situation.glaslStage
    ? `Stage ${situation.glaslStage}/9 (${getGlaslLabel(situation.glaslStage)})`
    : 'Not assessed';

  return `## Active Situation: "${situation.name}"

**Type**: ${formatType(situation.type)}
**Region**: ${situation.region || 'Not specified'}
**Status**: ${situation.status}
**User Role**: ${formatRole(situation.userRole)} — tailor your analysis, tone, and recommendations to this role.

### Key Actors/Parties
${actorList}

### Risk Assessment
- **Risk Score**: ${situation.riskScore}/10 (${riskLabel})
- **Escalation Stage**: ${glaslLabel}
- **Trend**: ${situation.escalationTrend}

### Data Available
- ${situation.actorCount} actors profiled
- ${situation.graphEntities} conflict graph entities
- ${situation.documentCount} documents uploaded

${situation.description ? `### Situation Description\n${situation.description}` : ''}

### Available Data Sources
You have access to live data from these sources — use them proactively:
- **GDELT**: Real-time news articles, tone analysis, volume trends (FREE, always available)
- **ReliefWeb**: Humanitarian reports, situation updates (FREE, always available)
- **HDX HAPI**: Food security (IPC), displacement, humanitarian funding (FREE)
- **World Bank**: GDP, inflation, military spending (FREE)
- **GDELT Stability**: Instability index and trend (FREE)
- **ACLED**: Armed conflict events, fatalities, actors (requires API key)
- **Firecrawl/Parallel**: Web scraping and deep research (requires API key)
- **Wikipedia**: Background, canonical names, context (via web search tool)

When the user asks about current events, ALWAYS search using these sources.
When a page appears empty, suggest: "I can research [topic] for you — shall I search GDELT and ReliefWeb?"

### Knowledge Framework
When analyzing this situation, classify all information into the 14-entity Conflict Grammar:
- **Core**: Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives
- **Extended**: Institutions, Norms, Resources, Risks, Policies, Grievances

Each piece of intelligence you produce should enrich this knowledge graph. When a user asks a question, structure your answer to build upon existing knowledge and identify gaps.

**IMPORTANT**: All your responses must be grounded in this specific situation. Reference the actors by name. Consider the regional context. Frame advice for the user's role as ${formatRole(situation.userRole)}. If you lack specific data, suggest the user upload documents or use the research tools to gather more intelligence.`;
}

/**
 * Builds a rich context for tool-specific AI calls (used by all 34 API routes).
 * Provides structured situation intelligence to ensure every AI tool call is
 * grounded in the user's specific conflict, not generic templates.
 */
export function buildToolContext(situation: Situation): string {
  const actorList = situation.actors.length > 0
    ? situation.actors.join(', ')
    : 'None defined yet';

  const riskLabel = situation.riskScore >= 7 ? 'HIGH' :
    situation.riskScore >= 4 ? 'MODERATE' : 'LOW';

  const glaslLabel = situation.glaslStage
    ? `Stage ${situation.glaslStage}/9 — ${getGlaslLabel(situation.glaslStage)}`
    : 'Not yet assessed';

  const dataAvailable = [
    situation.actorCount > 0 ? `${situation.actorCount} actors profiled` : null,
    situation.graphEntities > 0 ? `${situation.graphEntities} conflict graph entities` : null,
    situation.documentCount > 0 ? `${situation.documentCount} documents uploaded` : null,
  ].filter(Boolean).join(', ') || 'No structured data yet — rely on situation description and live feeds';

  return `SITUATION CONTEXT
=================
Name: "${situation.name}"
Type: ${formatType(situation.type)}
Region: ${situation.region || 'Unspecified'}
Status: ${situation.status}
Analyst Role: ${formatRole(situation.userRole)}

KEY ACTORS: ${actorList}

RISK PROFILE
- Risk Score: ${situation.riskScore}/10 (${riskLabel})
- Glasl Escalation: ${glaslLabel}
- Trend: ${situation.escalationTrend}
${situation.description ? `\nSITUATION SUMMARY\n${situation.description}` : ''}

KNOWLEDGE BASE: ${dataAvailable}

CONFLICT GRAMMAR FRAMEWORK
Classify all outputs using these 14 ACO entities:
Core (8): Actors · Claims · Interests · Constraints · Leverage · Commitments · Events · Narratives
Extended (6): Institutions · Norms · Resources · Risks · Policies · Grievances

ANALYTICAL STANDARDS
- Apply Glasl escalation model for stage-appropriate analysis
- Apply INFORM Risk Index (5 dimensions) for risk assessments
- Reference actors by their exact names from this situation
- Ground analysis in the region, conflict type, and role of: ${formatRole(situation.userRole)}
- When data is missing, flag the gap explicitly and recommend GDELT/ACLED/ReliefWeb sources
- Write for professional conflict analysis (UN/NGO/diplomatic standards)${situation.sourceUrls?.length ? `\n\nONBOARDING REFERENCE SOURCES\nThe analyst provided these URLs during situation setup — use them as primary references:\n${situation.sourceUrls.map((u) => `- ${u}`).join('\n')}` : ''}${situation.contextNotes ? `\n\nANALYST CONTEXT NOTES\n${situation.contextNotes}` : ''}`;
}

function formatType(type: string): string {
  const labels: Record<string, string> = {
    international: 'International Conflict',
    civil: 'Civil Conflict',
    political: 'Political Crisis',
    trade: 'Trade Dispute',
    workplace: 'Workplace Dispute',
    community: 'Community Dispute',
    legal: 'Legal Dispute',
    custom: 'Custom Situation',
  };
  return labels[type] || type;
}

function formatRole(role: string): string {
  const labels: Record<string, string> = {
    observer: 'Observer',
    analyst: 'Analyst',
    mediator: 'Mediator',
    party: 'Party to Conflict',
    advisor: 'Advisor',
    researcher: 'Researcher',
  };
  return labels[role] || role;
}

function getGlaslLabel(stage: number): string {
  const labels = [
    '', 'Hardening', 'Debate/Polemic', 'Actions not Words',
    'Images/Coalitions', 'Loss of Face', 'Strategies of Threats',
    'Limited Destructive Blows', 'Fragmentation of the Enemy', 'Together into the Abyss',
  ];
  return labels[stage] || 'Unknown';
}
