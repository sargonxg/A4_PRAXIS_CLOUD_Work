import { describe, expect, it } from 'vitest';
import { appendSuppliedContextAnswerPolicy } from '@/lib/ai/ask-answer-policy';
import { resolveAskExecutionPreference } from '@/lib/ai/ask-execution-preference';
import { buildWorkIntentPlan, formatWorkIntentPromptBlock } from '@/lib/ai/work-intent-router';

const recallPrompts = [
  'From the attached synthetic capsule purpose, what project code, review deadline and pre-launch condition were supplied? Distinguish supplied context from verified evidence. Answer briefly, without browsing or agent runs.',
  'What had to happen before public launch, and what remained undecided in our previous synthetic context? Use this capsule and the earlier exchange only; no browsing or agent runs.',
];
const savedContext = [
  '[author_working_preferences]',
  'purpose: Synthetic project QA-ONLY; deadline 2026-11-12; independent audit before public launch; funding undecided.',
  'requested_output_schema: judgment, evidence, options, open_questions, next_actions',
  'review_required: yes; source_receipts: none',
].join('\n');

describe('supplied-context current-question output contract', () => {
  it.each(recallPrompts)('puts the current recall request after saved artifact preferences and work intent: %s', (prompt) => {
    const workIntent = formatWorkIntentPromptBlock(buildWorkIntentPlan({ prompt }));
    const base = `${savedContext}\n\n${workIntent}`;
    const result = appendSuppliedContextAnswerPolicy(base, resolveAskExecutionPreference(prompt));
    expect(result.startsWith(base)).toBe(true);
    const policy = result.slice(base.length);
    expect(policy).toContain('[current_question_contract]');
    expect(policy).toContain('one brief paragraph or a few bullets');
    expect(policy).toContain('only the requested supplied values');
    expect(policy).toContain('saved artifact preferences');
    expect(policy).toContain('judgments, options, recommendations, follow-up questions, setup advice, or speculation unless explicitly asked');
    expect(policy).toContain('not independently verified evidence');
    expect(policy).toContain('missing or ambiguous');
    expect(result).toContain('funding undecided');
    expect(result).toContain('review_required: yes; source_receipts: none');
  });

  it('retains normal artifact contracts for an explicitly requested supplied-only memo or analysis', () => {
    const prompt = 'Write a policy memo analyzing the attached documents. Use only the supplied context. Do not browse or dispatch agents.';
    const result = appendSuppliedContextAnswerPolicy(savedContext, resolveAskExecutionPreference(prompt));
    expect(result).toContain('requested_output_schema: judgment, evidence, options, open_questions, next_actions');
    expect(result).toContain('For an explicitly requested memo, analysis, or draft, follow the requested artifact contract');
    expect(result).toContain('evidence and review requirements');
  });

  it('leaves normal research and artifact prompts unchanged when no supplied-context restriction applies', () => {
    const prompt = 'Research current official sources and write a policy memo.';
    expect(appendSuppliedContextAnswerPolicy(savedContext, resolveAskExecutionPreference(prompt))).toBe(savedContext);
  });
});
