/**
 * Audience tone presets — translates `AnalystProfile.perspective.audience`
 * into an explicit tone directive that briefing-style tools append after the
 * generic `systemPromptBlock`.
 *
 * The audience field already lives inside `<analyst-profile>` and inside
 * `<output-constraints>` (see `docs/CONTEXT_INJECTION.md`). What this module
 * adds is *explicit*, tool-side enforcement so the model cannot drift into a
 * tone that doesn't match the audience.
 *
 * Used by:
 *   - /api/ai/auto-briefing
 *   - /api/ai/dashboard-summary
 *   - /api/ai/briefing-generate
 *
 * Behind the `PRAXIS_AUDIENCE_TUNED_BRIEFING=1` flag so we can stage and
 * verify before flipping it on for everyone.
 */

import type { Audience } from '@/types/analyst-profile';

const PRESETS: Record<Audience, string> = {
  myself: [
    'AUDIENCE: SELF-NOTES.',
    '- Terse and dense. No formal preamble. Skip salutations.',
    '- Use shorthand. Bullets are fine.',
    '- Surface uncertainties explicitly so future-you can revisit.',
  ].join('\n'),
  team: [
    'AUDIENCE: PEER TEAM.',
    '- Action-oriented. Lead with the decision being supported.',
    '- Use the team\'s shared vocabulary; explain external jargon once.',
    '- Each section should end with a clear "what we do next".',
  ].join('\n'),
  senior_leadership: [
    'AUDIENCE: SENIOR LEADERSHIP (e.g., SRSG, Director, Chief of Staff).',
    '- Bottom-line-up-front. The first sentence is the headline.',
    '- No preamble, no recap of context the principal already has.',
    '- Recommend, do not narrate. State the decision the principal needs to make.',
    '- Caveat with confidence levels (HIGH / MEDIUM / LOW). Cite sources by name.',
    '- Maximum 1 page worth of content unless explicitly asked for more.',
  ].join('\n'),
  external_partners: [
    'AUDIENCE: EXTERNAL PARTNERS (other agencies, NGOs, member states).',
    '- Diplomatic register. Avoid internal jargon; spell out acronyms once.',
    '- Be precise about what is shareable vs. internal only — flag any',
    '  sensitive item with [INTERNAL] inline so the editor can lift it.',
    '- Frame in terms of mutual interest where possible.',
    '- Cite primary sources; do not rely on internal-only assessments.',
  ].join('\n'),
  public: [
    'AUDIENCE: PUBLIC (briefing-room remarks, press lines, public website).',
    '- Plain language. Avoid acronyms; if unavoidable, define on first use.',
    '- Lead with human impact, not institutional process.',
    '- No speculation. Every claim cites an attributable source.',
    '- Avoid party-political framing; stick to facts and humanitarian',
    '  consequences.',
  ].join('\n'),
};

/**
 * Returns the tone-preset directive for the given audience. Safe for
 * undefined / unknown values — falls back to the `myself` preset (the
 * lightest-touch wrapper) so a missing audience never blocks generation.
 */
export function audienceTonePreset(audience: Audience | undefined | null): string {
  const key: Audience = audience && audience in PRESETS ? audience : 'myself';
  return PRESETS[key];
}

/**
 * Feature flag: this directive is appended to briefing prompts only when
 * `PRAXIS_AUDIENCE_TUNED_BRIEFING=1` is set in the environment. Until then
 * the system prompt still contains the audience inside the
 * `<output-constraints>` block (which the model sometimes follows and
 * sometimes doesn't — that's why we add the explicit directive on top).
 */
export function audienceTuningEnabled(): boolean {
  return process.env.PRAXIS_AUDIENCE_TUNED_BRIEFING === '1';
}
