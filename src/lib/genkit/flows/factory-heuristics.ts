export const TEMPORAL_RE = /\b(today|yesterday|current|currently|latest|recent|now|this week|this month|202\d)\b/i;
export const TALKING_POINTS_RE = /\b(talking points|remarks|speech|briefing lines)\b/i;
export const BRIEF_RE = /\b(brief|one-pager|summary)\b/i;
export const HANDOVER_RE = /\b(handover|handoff|transfer)\b/i;

export type CapsuleWritingDefaultFormat = 'memo' | 'brief' | 'talking_points' | 'handover';

export function needsFreshnessCheck(text: string): boolean {
  return TEMPORAL_RE.test(text);
}

export function detectWritingDefaultFormat(text: string): CapsuleWritingDefaultFormat {
  const lower = text.toLowerCase();
  if (HANDOVER_RE.test(lower)) return 'handover';
  if (TALKING_POINTS_RE.test(lower)) return 'talking_points';
  if (BRIEF_RE.test(lower)) return 'brief';
  return 'memo';
}
