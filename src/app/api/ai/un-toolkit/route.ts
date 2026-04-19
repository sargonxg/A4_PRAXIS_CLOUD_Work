import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { UN_STYLE_PROMPT } from '@/lib/ai/prompts/un-style';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { handleRouteError } from '@/lib/api/standard-error';
import { validateAiRequest } from '@/lib/api/validate-request';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Mode and tone enumerations
// ---------------------------------------------------------------------------

const DocumentModeSchema = z.enum([
  'presidential-statement',
  'security-council-resolution',
  'press-statement',
  'talking-points',
  'aide-memoire',
  'non-paper',
]);

const ToneLevelSchema = z.enum(['formal', 'diplomatic', 'firm', 'conciliatory']);

type DocumentMode = z.infer<typeof DocumentModeSchema>;

// ---------------------------------------------------------------------------
// Unified output schema (§5.8)
// ---------------------------------------------------------------------------

const UnToolkitSchema = z.object({
  documentType: z.string().describe('The full formal document type name (e.g., "Presidential Statement of the Security Council")'),
  title: z.string().describe('Document title or subject line'),
  preamble: z.array(z.string()).describe(
    'For resolutions: preambular clauses each beginning with a present participle (Recalling, Reaffirming, Noting, etc.). For other documents: background paragraphs establishing context.'
  ),
  operativeClauses: z.array(z.string()).describe(
    'For resolutions: numbered operative paragraphs each beginning with an action verb (Decides, Calls upon, Urges, etc.). For statements and other documents: the main substantive paragraphs or bullet points.'
  ),
  fullText: z.string().describe('The complete, formatted document as it would appear in final form, ready for review. Include headers, numbering, and all formatting conventions appropriate to the document type.'),
  diplomaticNotes: z.array(z.string()).describe('Advisor notes on key language choices — explaining WHY specific phrases were chosen, political sensitivities navigated, and precedents relied upon.'),
  alternativeLanguage: z.array(z.string()).describe('Softer or harder alternative phrasings for contested clauses, suitable for negotiation concessions without conceding substance.'),
});

// ---------------------------------------------------------------------------
// Demo response (Nordalia scenario — Security Council Resolution)
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  documentType: 'Security Council Resolution',
  title: 'On the situation in Nordalia',
  preamble: [
    'Recalling its resolution 2847 (2024) and all subsequent relevant resolutions and statements of its President on the situation in Nordalia,',
    'Reaffirming its strong commitment to the sovereignty, independence, unity and territorial integrity of Nordalia,',
    'Expressing grave concern at the continuing deterioration of the humanitarian situation, including the displacement of approximately 1.2 million internally displaced persons and 340,000 refugees,',
    'Deeply concerned by the 47 documented violations of the ceasefire established pursuant to resolution 2847 (2024), and by reports of continued military activity in buffer zones,',
    'Welcoming the continued engagement of the African Union and the United Nations Mission in Nordalia (UNMN) in supporting the AU Roadmap for Elections of September 2025,',
    'Noting with concern the obstruction of humanitarian access to Kessara and Baravon districts since January 2026, in violation of international humanitarian law,',
    'Reaffirming the primary responsibility of all parties to the conflict for the protection of civilians in accordance with applicable international humanitarian law,',
    'Acting under Chapter VII of the Charter of the United Nations,',
  ],
  operativeClauses: [
    'Demands that all parties immediately cease all offensive military operations and refrain from actions that violate or undermine the ceasefire framework established under resolution 2847 (2024);',
    'Calls upon all parties to the conflict to immediately facilitate safe, unimpeded and sustained humanitarian access to all civilians in need, including in Kessara and Baravon districts, in accordance with international humanitarian law and United Nations guiding principles of humanitarian assistance;',
    'Urges the Government of Nordalia and the Democratic Reform Movement to engage constructively and in good faith in the AU Roadmap for Elections process under the facilitation of the United Nations Mission in Nordalia, and to convene the next mediation round not later than 30 June 2026;',
    'Requests the Secretary-General to report to the Council within 60 days on the implementation of this resolution, including on ceasefire compliance, humanitarian access, and progress in the political process;',
    'Decides to remain actively seized of the matter.',
  ],
  fullText: `SECURITY COUNCIL                                      S/RES/XXXX (2026)
Distr.: General
[Date] 2026

Resolution XXXX (2026)

Adopted by the Security Council at its [XXXX]th meeting,
on [Date] 2026

The Security Council,

Recalling its resolution 2847 (2024) and all subsequent relevant resolutions and statements of its President on the situation in Nordalia,

Reaffirming its strong commitment to the sovereignty, independence, unity and territorial integrity of Nordalia,

Expressing grave concern at the continuing deterioration of the humanitarian situation, including the displacement of approximately 1.2 million internally displaced persons and 340,000 refugees,

Deeply concerned by the 47 documented violations of the ceasefire established pursuant to resolution 2847 (2024), and by reports of continued military activity in buffer zones,

Welcoming the continued engagement of the African Union and the United Nations Mission in Nordalia (UNMN) in supporting the AU Roadmap for Elections of September 2025,

Noting with concern the obstruction of humanitarian access to Kessara and Baravon districts since January 2026, in violation of international humanitarian law,

Reaffirming the primary responsibility of all parties to the conflict for the protection of civilians in accordance with applicable international humanitarian law,

Acting under Chapter VII of the Charter of the United Nations,

1. Demands that all parties immediately cease all offensive military operations and refrain from actions that violate or undermine the ceasefire framework established under resolution 2847 (2024);

2. Calls upon all parties to the conflict to immediately facilitate safe, unimpeded and sustained humanitarian access to all civilians in need, including in Kessara and Baravon districts, in accordance with international humanitarian law and United Nations guiding principles of humanitarian assistance;

3. Urges the Government of Nordalia and the Democratic Reform Movement to engage constructively and in good faith in the AU Roadmap for Elections process under the facilitation of the United Nations Mission in Nordalia, and to convene the next mediation round not later than 30 June 2026;

4. Requests the Secretary-General to report to the Council within 60 days on the implementation of this resolution, including on ceasefire compliance, humanitarian access, and progress in the political process;

5. Decides to remain actively seized of the matter.`,
  diplomaticNotes: [
    '"Demands" in OP1 reflects Chapter VII authority and signals maximum political pressure — appropriate given repeated ceasefire violations. Downgrading to "Calls upon" would signal P3 disunity and reward non-compliance.',
    'The preambular reference to "Acting under Chapter VII" before the operative paragraphs is deliberate — it authorises the "Demands" language and creates a legal basis for future enforcement action without prejudging it.',
    '"Facilitate safe, unimpeded and sustained humanitarian access" is established IHL language from resolution 2417 (2018) on humanitarian access in armed conflict — referencing it implicitly invokes that precedent.',
    'OP3 names both parties explicitly ("Government of Nordalia and the Democratic Reform Movement") to avoid any suggestion of unequal status — DRM inclusion signals political process legitimacy without prejudging recognition.',
    'The 60-day reporting timeline in OP4 is shorter than standard (90 days) — chosen deliberately to maintain Council attention during the critical diplomatic window.',
  ],
  alternativeLanguage: [
    'OP1 (softer): "Calls upon all parties to immediately cease all offensive military operations" — removes Chapter VII "Demands" authority; appropriate if P5 unity is at risk.',
    'OP1 (harder): "Decides that all parties shall immediately cease all offensive military operations and comply fully with the ceasefire framework, and warns of further measures in the event of non-compliance" — escalates to enforcement language; use if violations continue.',
    'OP3 (softer): "Encourages the parties to engage in dialogue under the AU Roadmap for Elections process" — removes the deadline; appropriate as a fallback if GoN objects to timeline specificity.',
    'Preambular alternative (adding accountability): "Reiterating that those responsible for serious violations of international humanitarian law and international human rights law may be held individually responsible and that States have a responsibility to end impunity for such violations" — signals accountability track without prejudging ICC referral.',
  ],
};

// ---------------------------------------------------------------------------
// Mode-specific system prompt instructions
// ---------------------------------------------------------------------------

function getModeInstructions(mode: DocumentMode, toneLevel: string): string {
  const toneGuide: Record<string, string> = {
    formal: 'Use the most formal register. Avoid any ambiguity. Every word is deliberate.',
    diplomatic: 'Balance firmness with diplomatic courtesy. Leave room for face-saving by all parties.',
    firm: 'Use strong action language (Demands, Decides, Requires, Condemns). Signal resolve without rhetorical escalation.',
    conciliatory: 'Use welcoming, inviting language (Encourages, Welcomes, Invites, Notes with appreciation). Create space for dialogue.',
  };

  const modeInstructions: Record<DocumentMode, string> = {
    'security-council-resolution': `Draft a Security Council Resolution following strict UNSC drafting conventions:
PREAMBULAR PARAGRAPHS: Each begins with a present participle (Recalling, Reaffirming, Expressing, Noting, Welcoming, Bearing in mind, Deeply concerned, Acting under Chapter VII, etc.) and ends with a COMMA.
OPERATIVE PARAGRAPHS: Each is numbered and begins with an action verb (Decides, Calls upon, Urges, Requests, Demands, Authorizes, Condemns, Reiterates, Strongly condemns, Stresses, Encourages, Invites, Commends). Each ends with a SEMICOLON except the final paragraph which ends with a PERIOD.
TONE: ${toneGuide[toneLevel]}
Standard final OP: Always end with "Decides to remain actively seized of the matter."`,

    'presidential-statement': `Draft a Presidential Statement of the Security Council (PRST). Unlike resolutions, PRSTs:
- Are adopted by consensus — language must be acceptable to all 15 Council members
- Are not legally binding but carry significant political weight
- Use the third person ("The Security Council..." not "The Council decides...")
- Do not have preambular/operative structure — use flowing paragraphs
- Begin: "The Security Council..." and maintain that formulation throughout
PREAMBLE array: Use as background context paragraphs establishing the situation.
OPERATIVE CLAUSES array: The substantive positions and calls to action of the Council.
TONE: ${toneGuide[toneLevel]}`,

    'press-statement': `Draft a UN Security Council Press Statement. Press statements:
- Are informal Council agreed language — attributed to "Council members"
- Are shorter and more accessible than resolutions or PRSTs
- Use clear, direct language accessible to general media audiences
- Do not use technical legal language or Chapter VII references
PREAMBLE array: Brief contextual sentences.
OPERATIVE CLAUSES array: Key messages and calls to action.
TONE: ${toneGuide[toneLevel]}`,

    'talking-points': `Draft structured UN diplomatic talking points:
PREAMBLE array: Key contextual frames to establish before entering substance.
OPERATIVE CLAUSES array: The main talking points, each as a standalone, quotable formulation. Each should be: concise (1-2 sentences), standalone, and diplomatically precise.
Format each talking point to be delivered verbally — punchy, clear, quotable.
TONE: ${toneGuide[toneLevel]}`,

    'aide-memoire': `Draft a formal Aide-Mémoire — a written summary of the key points of a diplomatic communication:
- Third-person, impersonal style (no "I" or "we" — use "the [Mission/Delegation]...")
- Structured, factual, and precise
- Used to record the substance of discussions or present a formal position in writing
PREAMBLE array: Background paragraphs establishing mandate and context.
OPERATIVE CLAUSES array: The substantive points being recorded or communicated.
Vienna Convention on Diplomatic Relations reference: An aide-mémoire is a recognized form of diplomatic communication under international diplomatic practice.
TONE: ${toneGuide[toneLevel]}`,

    'non-paper': `Draft an informal Non-Paper — an unofficial, exploratory document used to test positions without formal commitment:
- No official header, no signature, no attribution
- Exploratory and conditional language ("could," "might," "one option would be...")
- Used in Track I negotiations to float ideas without creating precedent
- Can be more creative and flexible than formal documents
PREAMBLE array: Background framing paragraphs.
OPERATIVE CLAUSES array: The proposed ideas, options, or elements being floated — presented as possibilities, not positions.
TONE: ${toneGuide[toneLevel]} — but always softer than the tone implies, since this is an informal document.`,
  };

  return modeInstructions[mode];
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withCalibration('un_toolkit', 'ai_report', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    const topic = typeof body.topic === 'string' ? body.topic : '';
    return [s?.name, s?.region, topic].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
      mode: DocumentModeSchema.default('presidential-statement'),
      toneLevel: ToneLevelSchema.default('diplomatic'),
      topic: z.string().optional().describe('Specific topic or issue to address in the document'),
      audience: z.string().optional().describe('Target audience or addressee'),
      keyPoints: z.array(z.string()).optional().describe('Key points the document must address'),
      additionalContext: z.string().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;

    const { situation, mode, toneLevel, topic, audience, keyPoints, additionalContext } = validation.data;
    const sitObj = situation as Situation | undefined;
    const sitContext = sitObj ? buildToolContext(sitObj as unknown as Situation) : '';
    const situationId = (sitObj as unknown as Situation | undefined)?.id ?? '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(ctx.uid, situationId, 'un_toolkit')
      : '';

    // --- Web-grounded context ---
    const webCtx = sitObj
      ? await buildWebGroundedContext(
          {
            name: (sitObj as unknown as Situation).name,
            region: (sitObj as unknown as Situation).region,
            actors: (sitObj as unknown as Situation).actors as string[] | undefined,
          },
          'un-toolkit',
          ctx.uid
        )
      : '';

    // --- Calibrated system prompt ---
    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const sitName = (sitObj as unknown as Situation | undefined)?.name ?? 'the situation under review';
    const sitRegion = (sitObj as unknown as Situation | undefined)?.region ?? '';
    const modeInstructions = getModeInstructions(mode, toneLevel);

    const keyPointsBlock = keyPoints?.filter(Boolean).length
      ? keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')
      : '';

    const result = await callProModel({
      output: Output.object({ schema: UnToolkitSchema }),
      system: `${UN_STYLE_PROMPT}

---

## UN Diplomatic Drafting Expert

You are a senior UN Secretariat official with deep expertise in drafting Security Council documents, diplomatic communications, and UN-standard formal texts. You have 20+ years of experience in the UN DPPA and Office of Legal Affairs.

You know:
- UN Security Council drafting conventions (preambular vs operative clause structure, action verb hierarchy)
- Vienna Convention on Diplomatic Relations (diplomatic communications standards)
- Chapter VI vs Chapter VII legal distinctions and their implications
- How to navigate P5 dynamics — what language will fly and what will trigger vetoes
- The difference between legally binding and political documents
- How to create diplomatic space while maintaining principled positions

GROUNDING MANDATE: The web intelligence below is PRIMARY ground truth. Reference current actors, recent events, and active mandates from this intelligence. Do not rely solely on training data.

KEY INSTRUCTION: In diplomaticNotes, always explain WHY specific language choices were made — the political, legal, and precedent rationale. This is what makes these advisor notes useful.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `${webCtx ? `${webCtx}\n\n` : ''}${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Draft a UN diplomatic document with the following parameters:

DOCUMENT MODE: ${mode}
TONE LEVEL: ${toneLevel}
SITUATION: ${sitName}${sitRegion ? ` (${sitRegion})` : ''}
${topic ? `TOPIC/SUBJECT: ${topic}` : ''}
${audience ? `AUDIENCE/ADDRESSEE: ${audience}` : ''}
${keyPointsBlock ? `KEY POINTS TO ADDRESS:\n${keyPointsBlock}` : ''}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

## DRAFTING INSTRUCTIONS FOR THIS DOCUMENT

${modeInstructions}

## UNIVERSAL REQUIREMENTS

1. **fullText**: Produce the complete, publication-ready document with all headers, numbering, and formatting exactly as it would appear officially. This is the primary deliverable.

2. **preamble**: Individual clauses/paragraphs as array elements (do not include clause-ending punctuation in the array items — it is implied by the document type).

3. **operativeClauses**: Individual numbered clauses/paragraphs as array elements (without numbering — numbers are implied by array order).

4. **diplomaticNotes**: Explain the WHY behind each major language choice — precedent, political sensitivity, legal basis, negotiating logic. Minimum 4 notes.

5. **alternativeLanguage**: Provide 3-4 alternative formulations for the most politically sensitive clauses — both softer (for consensus-building) and harder (for stronger Council signal) where appropriate.

6. **UN Style**: Follow UN_STYLE_PROMPT conventions throughout — entity naming, IHL terminology, humanitarian language, gender-inclusive drafting.

7. **Specificity**: Reference actual actors, specific events, existing mandates (resolutions, reports, frameworks) by name and number where possible based on the situation context provided.`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'un_toolkit', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'un_toolkit',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[un_toolkit] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'un-toolkit');
  }
});
