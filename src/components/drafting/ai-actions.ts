export type DraftingActionId = 'redraft' | 'expand' | 'tighten' | 'tone' | 'fact-check';

export interface DraftingActionInput {
  action: DraftingActionId;
  text: string;
  tone?: string;
  sourceIds?: string[];
}

export interface DraftingActionResult {
  action: DraftingActionId;
  revisedText: string;
  rationale: string;
  sourceabilityReminder?: string;
}

export const DRAFTING_ACTIONS: Array<{ id: DraftingActionId; label: string }> = [
  { id: 'redraft', label: 'Redraft' },
  { id: 'expand', label: 'Expand' },
  { id: 'tighten', label: 'Tighten' },
  { id: 'tone', label: 'Adjust tone' },
  { id: 'fact-check', label: 'Fact-check' },
];

export function applyDraftingAction(input: DraftingActionInput): DraftingActionResult {
  const text = input.text.trim();
  switch (input.action) {
    case 'expand':
      return {
        action: input.action,
        revisedText: `${text}\n\nEvidence to add: specify the source, date, actor, and uncertainty for each material claim.`,
        rationale: 'Expanded with an evidence scaffold instead of inventing new facts.',
      };
    case 'tighten':
      return {
        action: input.action,
        revisedText: text.replace(/\s+/g, ' ').replace(/\b(in order to)\b/gi, 'to'),
        rationale: 'Condensed wording while preserving the claim.',
      };
    case 'tone':
      return {
        action: input.action,
        revisedText: `${tonePrefix(input.tone)}${text}`,
        rationale: `Adjusted toward ${input.tone || 'cautious policy'} tone.`,
      };
    case 'fact-check':
      return {
        action: input.action,
        revisedText: text,
        rationale: 'Fact-check requires provided source receipts; no web retrieval was performed.',
        sourceabilityReminder: 'Run sourceability with attached snippets before treating this as export-ready.',
      };
    case 'redraft':
    default:
      return {
        action: 'redraft',
        revisedText: text
          .replace(/\bclearly\b/gi, 'the available evidence suggests')
          .replace(/\bobviously\b/gi, 'likely'),
        rationale: 'Redrafted toward cautious policy language.',
      };
  }
}

function tonePrefix(tone: string | undefined): string {
  if (!tone) return '';
  const normalized = tone.trim().toLowerCase();
  if (normalized.includes('executive')) return 'For decision-makers: ';
  if (normalized.includes('legal')) return 'Subject to legal review: ';
  if (normalized.includes('brief')) return 'In brief: ';
  return '';
}
