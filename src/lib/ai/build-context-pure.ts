/**
 * Pure, client-safe context building functions.
 * No server-only imports — safe to use in 'use client' components.
 *
 * For server-side context with web grounding, use situation-context.ts instead.
 */
import type { Situation } from '@/types/situation';

export function buildToolContext(situation: Situation): string {
  // Actors — numbered list is clearer than CSV for structured analysis
  const actorBlock = situation.actors.length > 0
    ? situation.actors.map((a, i) => `  ${i + 1}. ${a}`).join('\n')
    : '  None defined yet — infer from description and region';

  // Risk normalisation (handle both 0–100 and legacy 0–10 scales)
  const rawRisk = situation.riskScore;
  const normRisk = rawRisk > 10 ? rawRisk / 10 : rawRisk;
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
    situation.ontology ? 'Structured Grammar (ACO) Available' : null,
  ].filter(Boolean).join(' · ') || 'No structured data — use description + live feeds';

  const mappingBlock = situation.ontology ? `
STRUCTURED MAPPING (v2.0):
- Claims: ${situation.ontology.claims?.length || 0}
- Interests: ${situation.ontology.interests?.length || 0}
- Critical Events: ${situation.ontology.events?.length || 0}
${situation.ontology.claims?.slice(0, 3).map(c => `  * [${c.actorId}] ${c.title}`).join('\n')}
${situation.ontology.interests?.slice(0, 3).map(i => `  * [${i.actorId}] ${i.description}`).join('\n')}
` : '';

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
${mappingBlock}

ANALYTICAL FRAMEWORK
- Apply Glasl escalation model — stage determines appropriate intervention type
- Apply INFORM Risk Index (Hazard, Vulnerability, Coping) for multi-dimensional risk
- Reference all actors by their exact names listed above
- Tailor outputs to the role of: ${formatRole(situation.userRole)}
- Flag data gaps explicitly and recommend: GDELT / ACLED / ReliefWeb / HDX sources
- Write to UN/diplomatic professional standards${situation.sourceUrls?.length ? `\n\nPRIMARY REFERENCES (analyst-provided — cite these):\n${situation.sourceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}` : ''}${situation.contextNotes ? `\n\nANALYST CONTEXT NOTES:\n${situation.contextNotes}` : ''}`;
}

// ---------------------------------------------------------------------------
// Helpers (pure, no server deps)
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
