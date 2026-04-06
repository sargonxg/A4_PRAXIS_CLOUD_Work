import type { Situation } from '@/types/situation';

/**
 * Builds a rich situation context string for AI system prompts (chat, assistant).
 * Used by the conversational AI routes where full context depth matters.
 */
export function buildSituationContext(situation: Situation): string {
  const actorList = situation.actors.length > 0
    ? situation.actors.map((a, i) => `  ${i + 1}. ${a}`).join('\n')
    : '  (No actors defined yet — please add key parties in Situation Settings)';

  const riskLabel = situation.riskScore >= 70 ? 'CRITICAL' :
    situation.riskScore >= 50 ? 'HIGH' :
    situation.riskScore >= 30 ? 'MODERATE' : 'LOW';

  // Handle both 0–100 and 0–10 legacy scales gracefully
  const displayRisk = situation.riskScore > 10
    ? `${situation.riskScore}/100 (${riskLabel})`
    : `${situation.riskScore}/10 (${riskLabel})`;

  const glaslLabel = situation.glaslStage
    ? `Stage ${situation.glaslStage}/9 — ${getGlaslLabel(situation.glaslStage)} (${getGlaslZone(situation.glaslStage)})`
    : 'Not assessed — estimate from description and escalation trend';

  const dataPoints = [
    situation.actorCount > 0 ? `${situation.actorCount} actor profiles` : null,
    situation.graphEntities > 0 ? `${situation.graphEntities} conflict-graph entities` : null,
    situation.documentCount > 0 ? `${situation.documentCount} documents in RAG` : null,
  ].filter(Boolean);

  return `## Active Situation: "${situation.name}"

**Type**: ${formatType(situation.type)}
**Region**: ${situation.region || 'Not specified'}
**Status**: ${situation.status}
**User Role**: ${formatRole(situation.userRole)} — tailor your analysis, tone, and recommendations to this role.

### Key Actors/Parties
${actorList}

### Risk Assessment
- **Risk Score**: ${displayRisk}
- **Escalation Stage**: ${glaslLabel}
- **Trend**: ${situation.escalationTrend}

### Knowledge Base
${dataPoints.length > 0 ? dataPoints.map((d) => `- ${d}`).join('\n') : '- No structured data yet — rely on the description below and live feeds'}

${situation.description ? `### Situation Intelligence\n${situation.description}` : ''}

### Live Data Sources (always available)
- **GDELT**: Real-time news, tone analysis, event volume
- **ReliefWeb / OCHA**: Humanitarian reports, situation updates
- **HDX HAPI**: Displacement, food security (IPC phases), funding
- **World Bank**: GDP, inflation, governance indicators
- **Wikipedia**: Canonical names, background, history

When data is missing, proactively offer: "I can research [topic] now — shall I search GDELT and ReliefWeb?"

### Conflict Grammar (ACO v2.0)
Structure all intelligence into 14 entities:
**Core 8**: Actors · Claims · Interests · Constraints · Leverage · Commitments · Events · Narratives
**Extended 6**: Institutions · Norms · Resources · Risks · Policies · Grievances

**IMPORTANT**: Reference all actors by their exact names from this situation. Frame every recommendation for a ${formatRole(situation.userRole)}.${situation.sourceUrls?.length ? `\n\n### Analyst-Provided Sources\nThe analyst provided these as primary references — cite them when relevant:\n${situation.sourceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}` : ''}${situation.contextNotes ? `\n\n### Analyst Notes\n${situation.contextNotes}` : ''}`;
}

/**
 * Builds a rich context block for tool-specific AI calls.
 * Used by all 36 API routes. Optimised for token efficiency while
 * preserving enough structure for the AI to produce grounded outputs.
 */
export function buildToolContext(situation: Situation): string {
  // Actors — numbered list is clearer than CSV for structured analysis
  const actorBlock = situation.actors.length > 0
    ? situation.actors.map((a, i) => `  ${i + 1}. ${a}`).join('\n')
    : '  None defined yet — infer from description and region';

  // Risk normalisation (handle both 0–100 and legacy 0–10 scales)
  const rawRisk = situation.riskScore;
  const normRisk = rawRisk > 10 ? rawRisk / 10 : rawRisk; // normalise to 0–10
  const riskLabel = normRisk >= 7 ? 'HIGH' : normRisk >= 4 ? 'MODERATE' : normRisk > 0 ? 'LOW' : 'UNRATED';

  const glaslInfo = situation.glaslStage
    ? `Stage ${situation.glaslStage}/9 — ${getGlaslLabel(situation.glaslStage)} [${getGlaslZone(situation.glaslStage)}]`
    : 'Not assessed — derive from situation description; default to Stage 3–4 if armed conflict active';

  const trendInfo = situation.escalationTrend === 'escalating'
    ? 'ESCALATING ⬆ — weight recommendations toward de-escalation'
    : situation.escalationTrend === 'de-escalating'
    ? 'DE-ESCALATING ⬇ — note opportunities for consolidation'
    : 'STABLE — monitor for triggers';

  const dataAvailable = [
    situation.actorCount > 0 ? `${situation.actorCount} actors profiled` : null,
    situation.graphEntities > 0 ? `${situation.graphEntities} graph entities` : null,
    situation.documentCount > 0 ? `${situation.documentCount} docs in RAG` : null,
  ].filter(Boolean).join(' · ') || 'No structured data — use description + live feeds';

  // Type-specific analytical guidance
  const typeGuidance = getTypeGuidance(situation.type);

  return `SITUATION CONTEXT
=================
Name: "${situation.name}"
Type: ${formatType(situation.type)} ${typeGuidance ? `[${typeGuidance}]` : ''}
Region: ${situation.region || 'Unspecified — infer from actors and name'}
Status: ${situation.status}
Analyst Role: ${formatRole(situation.userRole)}

KEY ACTORS (use these exact names in all outputs):
${actorBlock}

RISK PROFILE
- Risk Score: ${normRisk > 0 ? `${normRisk.toFixed(1)}/10 (${riskLabel})` : `Not yet rated — estimate from description`}
- Glasl Escalation: ${glaslInfo}
- Trend: ${trendInfo}${situation.description ? `\n\nSITUATION INTELLIGENCE\n${situation.description}` : '\n\nNo intelligence summary yet — generate from actors and region.'}

DATA AVAILABLE: ${dataAvailable}

ANALYTICAL FRAMEWORK
- Apply Glasl escalation model — stage determines appropriate intervention type
- Apply INFORM Risk Index (Hazard, Vulnerability, Coping) for multi-dimensional risk
- Reference all actors by their exact names listed above
- Tailor outputs to the role of: ${formatRole(situation.userRole)}
- Flag data gaps explicitly and recommend: GDELT / ACLED / ReliefWeb / HDX sources
- Write to UN/diplomatic professional standards${situation.sourceUrls?.length ? `\n\nPRIMARY REFERENCES (analyst-provided — cite these):\n${situation.sourceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}` : ''}${situation.contextNotes ? `\n\nANALYST CONTEXT NOTES:\n${situation.contextNotes}` : ''}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    '', 'Hardening', 'Debate & Polemic', 'Actions not Words',
    'Images & Coalitions', 'Loss of Face', 'Strategies of Threats',
    'Limited Destructive Blows', 'Fragmentation', 'Together into the Abyss',
  ];
  return labels[stage] || 'Unknown';
}

function getGlaslZone(stage: number): string {
  if (stage <= 3) return 'Win-Win still possible';
  if (stage <= 6) return 'Win-Lose orientation';
  return 'Lose-Lose — containment priority';
}

function getTypeGuidance(type: string): string {
  const guidance: Record<string, string> = {
    international: 'IHL applicable · UNSC mandate possible · sovereignty considerations',
    civil: 'IHRL primary · DDR/SSR · transitional justice · civilian protection',
    political: 'Constitutional framework · democratic legitimacy · elite bargaining',
    trade: 'WTO/bilateral treaty framework · economic coercion · supply chains',
    workplace: 'Labour law · HR/mediation · confidentiality requirements',
    community: 'Local governance · customary law · dialogue facilitation',
    legal: 'Judicial process · precedent · enforcement mechanisms',
    custom: '',
  };
  return guidance[type] || '';
}
