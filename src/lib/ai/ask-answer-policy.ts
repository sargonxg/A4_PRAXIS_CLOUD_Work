import type { AskExecutionPreference } from '@/lib/ai/ask-execution-preference';

const SUPPLIED_CONTEXT_ANSWER_POLICY = [
  '[current_question_contract]',
  'The current user question controls this reply. Capsule builder output formats and schemas are saved artifact preferences, not a mandatory response shape for every turn.',
  'For recall, restatement, or extraction, return only the requested supplied values in one brief paragraph or a few bullets. Include only a concise supplied or synthetic context caveat when needed; this is not independently verified evidence.',
  'Do not add judgments, options, recommendations, follow-up questions, setup advice, or speculation unless explicitly asked. Do not treat earlier assistant interpretations as supplied facts without supporting context.',
  'If a requested value is missing or ambiguous, say so briefly. Preserve relevant factual limitations and review gaps; do not imply verification, approval, or completed work.',
  'For an explicitly requested memo, analysis, or draft, follow the requested artifact contract and normal evidence and review requirements.',
].join('\n');

/** Append after routing/method prompts so saved defaults cannot expand a recall turn. */
export function appendSuppliedContextAnswerPolicy(
  systemPrompt: string,
  preference: Pick<AskExecutionPreference, 'allowWorkspaceRetrieval'>,
): string {
  return preference.allowWorkspaceRetrieval === false
    ? `${systemPrompt}\n\n${SUPPLIED_CONTEXT_ANSWER_POLICY}`
    : systemPrompt;
}
