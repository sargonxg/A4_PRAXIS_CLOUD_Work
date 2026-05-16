import { streamText } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { isServerDemoMode, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import type { Situation } from '@/types/situation';

export const maxDuration = 120;

const ACTOR_BRIEF_SYSTEM_PROMPT = `You are a senior TACITUS analyst preparing a pre-meeting brief for a senior diplomatic principal or mediator. Generate a structured brief with these sections:

## ACTOR PROFILE: [Name]

### Background & Structure
[Organizational structure, leadership, base of support, external patrons]

### Stated Positions
[Their public claims and demands — what they SAY they want]

### Inferred Interests
[Underlying interests, including unstated ones — flag confidence level: HIGH/MEDIUM/LOW]

### Leverage They Hold
[Over which actors, what type (military/economic/political/informational), how sustainable]

### Leverage Others Hold Over Them
[Which actors have leverage, what type — these are your negotiating levers]

### Commitment Record
[Previous commitments, compliance pattern, reliability assessment]

### Red Lines & Constraints
[What they will not accept under any circumstances, structural constraints]

### Recommended Engagement Approach
[Given the above analysis, how should the official approach this meeting?]

---
**60-SECOND ELEVATOR BRIEF:**
[One paragraph summary for the official walking into the room]

Be specific. Ground analysis in the situation context provided. Flag where confidence is low. Use professional diplomatic language standards.`;

const DEMO_BRIEF = `## ACTOR PROFILE: Government of the selected situation

### Background & Structure
The Government of the selected situation (GoN) is led by President Amara Osei, who claimed victory in the disputed March 2024 elections. The executive commands the Armed Forces of the selected situation (AFN, approximately 45,000 active personnel), controls the capital and state revenue institutions, and maintains international recognition despite contested democratic legitimacy. A recent cabinet reshuffle replaced the moderate Defence Minister with hardliner General Mensah, signalling an internal shift toward more coercive approaches.

The GoN's external patron is **Karovia**, which provides military equipment, logistics, intelligence cooperation, and seconded military advisors under a 2019 bilateral defence treaty. Karovian military logistics flights to the selected situation City have increased 40% in the past 21 days.

### Stated Positions
- The March 2024 elections were legitimate and their outcome is non-negotiable
- The DRM must disarm completely before any political dialogue can proceed
- The September 2025 ceasefire framework is the only acceptable basis for talks
- UNMN should restrict operations to humanitarian corridors only

### Inferred Interests
- **Regime survival** — preventing a precedent of armed opposition forcing power-sharing (HIGH confidence)
- **Control of eastern rare earth revenues** — estimated at USD 800M annually (HIGH confidence)
- **Maintaining Karovian military partnership** as existential security guarantee (HIGH confidence)
- **Avoiding ICC referral** — several senior officials face potential accountability exposure (MEDIUM confidence)
- **Preventing Eastern Marches autonomy** that could trigger other regional demands (MEDIUM confidence)

### Leverage They Hold
| Target | Type | Sustainability |
|--------|------|---------------|
| DRM | Military — conventional superiority, air assets | HIGH — as long as Karovian support continues |
| UNMN | Political — host nation consent for peacekeeping | MEDIUM — withdrawal threat is a bluff given multilateral forum mandate |
| Westmark | Economic — rare earth supply disruption threat | LOW — alternative sources exist |
| Eastern population | Economic — control of customs, banking, services | HIGH — population has no alternatives |

### Leverage Others Hold Over Them
| Holder | Type | Assessment |
|--------|------|-----------|
| Karovia | Military/Political — can withdraw support | HIGH — GoN is operationally dependent; this is your strongest indirect lever |
| Westmark | Diplomatic — targeted sanctions on 23 officials | MEDIUM — asset freezes affect inner circle |
| multilateral forum | Normative — mandate enforcement, arms embargo | MEDIUM — Panel of Experts documentation creates accountability pressure |
| IMF | Economic — currency support conditional on stability | HIGH — 36.4% depreciation since March 2024 creates fiscal emergency |

### Commitment Record
- **September 2025 ceasefire**: Nominally adhered to, but 47 documented violations including artillery shelling of two buffer-zone villages. **Reliability: LOW**
- **Prisoner exchange (Jan 2026)**: Successfully completed second round. **Reliability: MODERATE**
- **UNMN freedom of movement**: Imposed additional restrictions in Kessara corridor in February 2026. **Reliability: LOW — deteriorating trend**
- **AU Roadmap for Elections**: Verbal support but no substantive progress since November 2025. **Reliability: LOW**

### Red Lines & Constraints
1. **Power-sharing arrangement** that dilutes presidential authority — non-negotiable
2. **Accountability mechanisms** with jurisdiction over pre-2024 actions — will not accept
3. **Eastern autonomy** beyond limited administrative decentralization — structural constraint
4. **Karovian military withdrawal** — GoN will resist any framework that requires this

**Structural constraints**: Internal military pressure from the Mensah faction limits Osei's negotiating room. Any concession perceived as weakness could trigger a palace coup scenario.

### Recommended Engagement Approach
1. **Open with acknowledgement** of GoN sovereignty concerns and the legitimacy of security interests — this is essential for the interlocutor to remain engaged
2. **Use the IMF/fiscal lever** early — the currency crisis gives you a concrete economic argument for settlement that bypasses the legitimacy debate
3. **Avoid direct confrontation** on election legitimacy — this triggers the "loss of face" dynamic at Glasl Stage 5
4. **Explore the Mensah factor** — the hardliner appointment may be a negotiating tactic; test whether Osei is using it as cover for talks ("I need something to show the generals")
5. **Signal the Karovian dimension** without threatening — note that a stable settlement would actually secure Karovia's economic interests in the region more sustainably than the current trajectory
6. **Use the prisoner exchange success** as proof of concept — "we've demonstrated that practical arrangements work"

---
**60-SECOND ELEVATOR BRIEF:**
The Government of the selected situation under President Osei is at an inflection point between negotiation and escalation, with the recent appointment of hardliner General Mensah as Defence Minister signalling that the military faction is ascendant. The GoN's stated position — disarmament before dialogue — is a maximalist opening; their actual interest is regime survival and control of eastern resource revenues. Your strongest levers are the fiscal crisis (36.4% currency depreciation) and indirect pressure through Karovia, whose military support the GoN cannot survive without. The GoN's commitment record is poor — 47 ceasefire violations and deteriorating UNMN cooperation — but the successful prisoner exchange shows back-channel functionality remains intact. Approach with sovereignty acknowledgement, pivot to economic pragmatism, and avoid the election legitimacy trap. The window is 60-90 days before military dynamics could overtake the political track.`;

export const POST = withCalibration('actor_profiles', 'ai_report', {
  retrievalQuery: (_req, body) => {
    const a = typeof body.actorName === 'string' ? body.actorName : '';
    const s = body.situation as { name?: string; region?: string } | undefined;
    return [a, s?.name, s?.region].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const { actorName, situationId, situationContext, meetingContext, situation } = await request.json() as {
      actorName: string;
      situationId: string;
      situationContext: string;
      meetingContext?: string;
      situation?: Situation;
    };
    const sitContext = situation ? buildToolContext(situation) : '';

    if (!actorName || !situationContext) {
      return new Response(
        JSON.stringify({ error: 'actorName and situationContext are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Sample mode ---
    if (isServerDemoMode()) {
      return formatAsStreamResponse(DEMO_BRIEF);
    }

    // Credits + profile gate already handled by withCalibration above.

    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';
    const calibrationSuffix = `\n\n${systemPromptBlock}\n\nCalibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`;

    // --- Stream the brief ---
    // Intentionally uses getProModel() directly: this is a streamText route (not generateText)
    // and callProModel only wraps generateText. Pro is preferred for long-form streaming output.
    const result = streamText({
      model: getProModel(),
      system: (sitContext ? `${sitContext}\n\n${ACTOR_BRIEF_SYSTEM_PROMPT}` : ACTOR_BRIEF_SYSTEM_PROMPT) + calibrationSuffix,
      onFinish: async ({ text }) => {
        if (situationId && ctx.uid) {
          await saveToolOutput({
            uid: ctx.uid,
            situationId,
            toolId: 'actor_profiles',
            profileVersion: provenance.profileVersion,
            output: { actorName, brief: text, meetingContext },
            metadata: { variant: 'actor-brief' },
          }).catch((err) => console.warn('[actor_brief] saveToolOutput failed:', err));
        }
      },
      messages: [
        {
          role: 'user',
          content: `Generate a comprehensive pre-meeting actor brief for the following:

ACTOR: ${actorName}
SITUATION ID: ${situationId}

SITUATION CONTEXT:
${situationContext}

${meetingContext ? `MEETING CONTEXT:\n${meetingContext}\n` : ''}
Provide a thorough, analytically rigorous brief grounded in the situation context. Be specific about names, dates, and data points. Flag confidence levels where appropriate. Structure the brief for a senior official who has 10 minutes to prepare before a meeting.`,
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Actor brief route error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to generate actor brief' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
