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

### Knowledge Framework
When analyzing this situation, classify all information into the 14-entity Conflict Grammar:
- **Core**: Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives
- **Extended**: Institutions, Norms, Resources, Risks, Policies, Grievances

Each piece of intelligence you produce should enrich this knowledge graph. When a user asks a question, structure your answer to build upon existing knowledge and identify gaps.

**IMPORTANT**: All your responses must be grounded in this specific situation. Reference the actors by name. Consider the regional context. Frame advice for the user's role as ${formatRole(situation.userRole)}. If you lack specific data, suggest the user upload documents or use the research tools to gather more intelligence.`;
}

/**
 * Builds a concise context for tool-specific AI calls (not chat).
 */
export function buildToolContext(situation: Situation): string {
  return `Situation: "${situation.name}" (${formatType(situation.type)})
Region: ${situation.region || 'Unspecified'}
Actors: ${situation.actors.join(', ') || 'None defined'}
Risk: ${situation.riskScore}/10, Trend: ${situation.escalationTrend}
User Role: ${formatRole(situation.userRole)}
${situation.description ? `\nContext: ${situation.description}` : ''}`;
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
