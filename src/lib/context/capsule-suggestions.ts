export interface AskCapsuleSuggestionInput<TCapsule = unknown> {
  capsuleId: string;
  label: string;
  summary?: string;
  tags?: string[];
  category?: string;
  sourcePosture?: string;
  readiness?: string;
  recommendedToolIds?: string[];
  capsule?: TCapsule;
}

export interface AskCapsuleSuggestion<TCapsule = unknown> {
  capsuleId: string;
  label: string;
  category: string;
  reason: string;
  sourceReadinessSignal: string;
  whyThisCapsule: string;
  whatItChangesForAgent: string;
  score: number;
  autoApplied: false;
  capsule: TCapsule;
}

export function rankAskCapsuleSuggestions<TCapsule>(input: {
  prompt: string;
  selectedAgentId?: string | null;
  activeCapsuleIds?: string[];
  capsules: Array<AskCapsuleSuggestionInput<TCapsule>>;
  limit?: number;
}): Array<AskCapsuleSuggestion<TCapsule>> {
  const promptTokens = tokenSet(input.prompt);
  if (promptTokens.size === 0) return [];
  const active = new Set((input.activeCapsuleIds ?? []).map((id) => id.trim()).filter(Boolean));
  const selectedAgentId = input.selectedAgentId ?? '';

  return input.capsules
    .filter((capsule) => capsule.capsuleId && !active.has(capsule.capsuleId))
    .map((capsule) => {
      const fields = [
        capsule.label,
        capsule.summary,
        capsule.category,
        ...(capsule.tags ?? []),
        ...(capsule.recommendedToolIds ?? []),
      ].join(' ');
      const capsuleTokens = tokenSet(fields);
      const overlap = overlapScore(promptTokens, capsuleTokens);
      const agentBoost = agentCapsuleBoost(selectedAgentId, capsule);
      const categoryBoost = categoryPromptBoost(promptTokens, capsule.category);
      const readinessBoost = readinessScore(capsule.readiness);
      const score = overlap + agentBoost + categoryBoost + readinessBoost;
      return {
        capsule,
        score,
      };
    })
    .filter((item) => item.score > 0.18)
    .sort((a, b) => b.score - a.score || a.capsule.label.localeCompare(b.capsule.label))
    .slice(0, Math.max(1, Math.min(input.limit ?? 3, 5)))
    .map(({ capsule, score }) => {
      const category = capsule.category ?? 'reference';
      const sourceReadinessSignal = [capsule.readiness, capsule.sourcePosture].filter(Boolean).join(' / ') || 'review before use';
      return {
        capsuleId: capsule.capsuleId,
        label: capsule.label,
        category,
        reason: suggestionReason(promptTokens, capsule),
        sourceReadinessSignal,
        whyThisCapsule: `This is human-gated context: ${sourceReadinessSignal}. Review the source pack, device profile, when-to-use guidance, and review gate before relying on it.`,
        whatItChangesForAgent: agentChangeSummary(selectedAgentId, capsule),
        score: Math.round(score * 1000) / 1000,
        autoApplied: false,
        capsule: capsule.capsule as TCapsule,
      };
    });
}

function tokenSet(value: string): Set<string> {
  return new Set(value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token)));
}

function overlapScore(promptTokens: Set<string>, capsuleTokens: Set<string>): number {
  if (promptTokens.size === 0 || capsuleTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of promptTokens) {
    if (capsuleTokens.has(token)) overlap += 1;
  }
  return overlap / Math.max(3, promptTokens.size);
}

function agentCapsuleBoost<TCapsule>(selectedAgentId: string, capsule: AskCapsuleSuggestionInput<TCapsule>): number {
  const text = [
    capsule.category,
    ...(capsule.tags ?? []),
    ...(capsule.recommendedToolIds ?? []),
  ].join(' ').toLowerCase();
  if (selectedAgentId === 'sourceability-reviewer' && /sourceability|evidence|claim|audit/.test(text)) {
    return capsule.category === 'tool' ? 0.75 : 0.45;
  }
  if (selectedAgentId === 'research-memo' && /research|grounded|source|memo/.test(text)) return 0.25;
  if (selectedAgentId === 'capsule-factory' && /source-pack|builder|capsule|tool/.test(text)) return 0.25;
  if (selectedAgentId === 'output-formatter' && /output|memo|brief|handover/.test(text)) return 0.25;
  return 0;
}

function categoryPromptBoost(promptTokens: Set<string>, category?: string): number {
  if (!category) return 0;
  if (category === 'tool' && hasAny(promptTokens, ['review', 'check', 'sourceability', 'audit', 'map'])) return 0.2;
  if (category === 'output' && hasAny(promptTokens, ['memo', 'brief', 'annex', 'handover', 'draft'])) return 0.18;
  if (category === 'situation' && hasAny(promptTokens, ['access', 'policy', 'risk', 'context', 'situation'])) return 0.14;
  return 0;
}

function readinessScore(readiness?: string): number {
  const match = readiness?.match(/\b([1-5])(?:\/5)?\b/);
  return match ? Number(match[1]) / 50 : 0;
}

function suggestionReason<TCapsule>(promptTokens: Set<string>, capsule: AskCapsuleSuggestionInput<TCapsule>): string {
  const tags = (capsule.tags ?? []).filter((tag) => promptTokens.has(tag.toLowerCase()) || tag.split('-').some((part) => promptTokens.has(part))).slice(0, 3);
  if (tags.length) return `Matches ${tags.join(', ')} in the prompt.`;
  if (capsule.category) return `Adds a ${capsule.category} capsule to sharpen this turn.`;
  return 'Adds reviewed context before PRAXIS answers.';
}

function agentChangeSummary<TCapsule>(selectedAgentId: string, capsule: AskCapsuleSuggestionInput<TCapsule>): string {
  const tools = (capsule.recommendedToolIds ?? []).slice(0, 3);
  const toolText = tools.length ? ` It routes ${tools.join(', ')} into the agent plan.` : '';
  if (selectedAgentId === 'sourceability-reviewer') return `It gives the sourceability reviewer a clearer source and claim-check frame.${toolText}`;
  if (selectedAgentId === 'research-memo') return `It gives the research memo lane a stronger source posture and output target.${toolText}`;
  return `It changes the agent context before generation, while leaving the ContextChain human-approved.${toolText}`;
}

function hasAny(tokens: Set<string>, values: string[]): boolean {
  return values.some((value) => tokens.has(value));
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'into',
  'before',
  'after',
  'active',
  'capsule',
  'context',
  'praxis',
]);
