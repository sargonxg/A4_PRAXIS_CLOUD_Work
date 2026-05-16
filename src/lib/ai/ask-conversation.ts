import type { AskThreadTurnRecord } from '@/lib/firebase/ask-thread-service';

export type AskConversationMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: unknown;
};

export type AskIntent =
  | 'normal_answer'
  | 'research_memo'
  | 'sourceability_review'
  | 'red_team_review'
  | 'handover';

const DEFAULT_MAX_HISTORY_TURNS = 8;
const DEFAULT_MAX_HISTORY_CHARS = 12_000;

export function buildAskConversationMessages(
  currentMessages: AskConversationMessage[],
  persistedTurns: AskThreadTurnRecord[],
  opts: { maxTurns?: number; maxChars?: number } = {},
): AskConversationMessage[] {
  if (currentMessages.length !== 1 || persistedTurns.length === 0) return currentMessages;

  const maxTurns = opts.maxTurns ?? DEFAULT_MAX_HISTORY_TURNS;
  const maxChars = opts.maxChars ?? DEFAULT_MAX_HISTORY_CHARS;
  const currentPrompt = messageText(currentMessages[0]);
  const history: AskConversationMessage[] = [];
  let usedChars = currentPrompt.length;

  for (const turn of persistedTurns.slice(-maxTurns).reverse()) {
    if (!turn.prompt.trim() || !turn.output.trim()) continue;
    if (turn.prompt.trim() === currentPrompt.trim()) continue;
    const turnChars = turn.prompt.length + turn.output.length;
    if (usedChars + turnChars > maxChars) continue;
    usedChars += turnChars;
    history.unshift({ role: 'assistant', content: turn.output });
    history.unshift({ role: 'user', content: turn.prompt });
  }

  return [...history, ...currentMessages];
}

export function classifyAskIntent(prompt: string): AskIntent {
  const text = prompt.toLowerCase();
  if (/\b(handover|handoff|brief my successor|bring .* up to speed|onboard)\b/.test(text)) return 'handover';
  if (/\b(red[- ]?team|challenge|stress test|weakness|counterargument|critique)\b/.test(text)) return 'red_team_review';
  if (/\b(sourceability|source check|evidence gap|citation|cite|grounding|verify sources?)\b/.test(text)) return 'sourceability_review';
  if (/\b(memo|briefing|brief|research note|draft|options paper|write up)\b/.test(text)) return 'research_memo';
  return 'normal_answer';
}

export function askIntentDirective(intent: AskIntent): string {
  switch (intent) {
    case 'research_memo':
      return 'INTENT: Research memo. Structure the answer as a usable memo draft with findings, caveats, source gaps, and next actions. Do not silently save or export it.';
    case 'sourceability_review':
      return 'INTENT: Sourceability review. Prioritize evidence coverage, missing citations, weak claims, stale assumptions, and concrete source-collection next steps.';
    case 'red_team_review':
      return 'INTENT: Red-team review. Challenge assumptions, identify failure modes, test alternative explanations, and keep the critique operational.';
    case 'handover':
      return 'INTENT: Handover. Explain what a new human or agent must know, what is settled, what is uncertain, and what needs approval before action.';
    case 'normal_answer':
    default:
      return 'INTENT: Normal capsule-aware answer. Answer directly, cite available context, flag gaps, and suggest the next useful PRAXIS action.';
  }
}

function messageText(message: AskConversationMessage | undefined): string {
  if (!message) return '';
  if (typeof message.content === 'string') return message.content;
  try {
    return JSON.stringify(message.content);
  } catch {
    return String(message.content);
  }
}
